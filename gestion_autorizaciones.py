
from functools import wraps

from flask import (
    render_template,
    request,
    jsonify,
    session,
)

from mysql.connector import Error
import secrets


def registrar_gestion_autorizaciones(app, conectar_db):

    def requiere_administrador(funcion):

        @wraps(funcion)
        def protegida(*args, **kwargs):

            id_usuario = session.get("id_usuario")

            if not id_usuario:
                return jsonify({
                    "mensaje": "Debes iniciar sesión."
                }), 401

            conexion = None
            cursor = None

            try:
                conexion = conectar_db()
                cursor = conexion.cursor()

                cursor.execute("""
                    SELECT rol, estado_cuenta
                    FROM usuarios
                    WHERE id_usuario = %s
                """, (id_usuario,))

                usuario = cursor.fetchone()

                if (
                    not usuario
                    or usuario[0] != "administrador"
                    or usuario[1] != "activa"
                ):
                    return jsonify({
                        "mensaje": "No tienes permisos de administrador."
                    }), 403

            except Error:
                app.logger.exception(
                    "Error verificando permisos administrativos."
                )
                return jsonify({
                    "mensaje": "No fue posible verificar tus permisos."
                }), 500

            finally:
                if cursor:
                    cursor.close()
                if conexion:
                    conexion.close()

            return funcion(*args, **kwargs)

        return protegida

    def validar_csrf():
        token_sesion = session.get("csrf_admin")
        token_recibido = request.headers.get("X-CSRF-Token")

        return bool(
            token_sesion
            and token_recibido
            and secrets.compare_digest(
                token_sesion,
                token_recibido
            )
        )

    @app.route("/admin/autorizaciones", methods=["GET"])
    @requiere_administrador
    def panel_autorizaciones():

        if not session.get("csrf_admin"):
            session["csrf_admin"] = secrets.token_urlsafe(32)

        return render_template(
            "admin_autorizaciones.html",
            csrf_admin=session["csrf_admin"]
        )

    @app.route("/api/admin/autorizaciones", methods=["GET"])
    @requiere_administrador
    def listar_autorizaciones():

        conexion = None
        cursor = None

        try:
            conexion = conectar_db()
            cursor = conexion.cursor(dictionary=True)

            cursor.execute("""
                SELECT
                    a.id_autorizacion,
                    a.id_usuario,
                    u.nombre AS nombre_usuario,
                    u.correo AS correo_usuario,
                    u.fecha_nacimiento,
                    a.nombre_representante,
                    a.correo_representante,
                    a.parentesco,
                    a.estado,
                    a.version_autorizacion,
                    a.fecha_solicitud,
                    a.fecha_aceptacion,
                    a.firma_electronica,
                    a.aceptacion_explicita,
                    a.declaracion_representacion,
                    a.metodo_verificacion,
                    a.evidencia_verificacion,
                    a.observaciones_verificacion
                FROM autorizaciones_representante a
                INNER JOIN usuarios u
                    ON u.id_usuario = a.id_usuario
                WHERE a.estado IN (
                    'pendiente',
                    'pendiente_revision'
                )
                ORDER BY a.fecha_solicitud ASC
            """)

            resultados = cursor.fetchall()

            for fila in resultados:
                for campo, valor in fila.items():
                    if hasattr(valor, "isoformat"):
                        fila[campo] = valor.isoformat()

            return jsonify({
                "autorizaciones": resultados
            })

        except Error:
            app.logger.exception(
                "Error consultando autorizaciones."
            )
            return jsonify({
                "mensaje": "No fue posible cargar las solicitudes."
            }), 500

        finally:
            if cursor:
                cursor.close()
            if conexion:
                conexion.close()

    @app.route(
        "/api/admin/autorizaciones/<int:id_autorizacion>/verificar",
        methods=["POST"]
    )
    @requiere_administrador
    def verificar_autorizacion(id_autorizacion):

        if not validar_csrf():
            return jsonify({
                "mensaje": "La solicitud de seguridad no es válida. Recarga el panel."
            }), 403

        datos = request.get_json(silent=True) or {}

        decision = str(datos.get("decision", "")).strip().lower()
        metodo = str(datos.get("metodo_verificacion", "")).strip()
        evidencia = str(datos.get("evidencia_verificacion", "")).strip()
        observaciones = str(
            datos.get("observaciones_verificacion", "")
        ).strip()

        if decision not in ("aprobada", "rechazada"):
            return jsonify({
                "mensaje": "La decisión no es válida."
            }), 400

        if not metodo or metodo == "pendiente":
            return jsonify({
                "mensaje": "Debes indicar el método de verificación."
            }), 400

        if len(evidencia) < 15:
            return jsonify({
                "mensaje": (
                    "Describe la evidencia de verificación "
                    "con al menos 15 caracteres."
                )
            }), 400

        if len(metodo) > 50:
            return jsonify({
                "mensaje": "El método de verificación es demasiado largo."
            }), 400

        id_administrador = session["id_usuario"]

        conexion = None
        cursor = None

        try:
            conexion = conectar_db()
            cursor = conexion.cursor()

            cursor.execute("""
                SELECT
                    id_usuario,
                    estado,
                    aceptacion_explicita,
                    declaracion_representacion,
                    firma_electronica
                FROM autorizaciones_representante
                WHERE id_autorizacion = %s
                FOR UPDATE
            """, (id_autorizacion,))

            autorizacion = cursor.fetchone()

            if not autorizacion:
                conexion.rollback()
                return jsonify({
                    "mensaje": "La autorización no existe."
                }), 404

            (
                id_usuario,
                estado_actual,
                aceptacion,
                declaracion,
                firma
            ) = autorizacion

            if estado_actual not in (
                "pendiente",
                "pendiente_revision"
            ):
                conexion.rollback()
                return jsonify({
                    "mensaje": "Esta solicitud ya fue procesada."
                }), 409

            if decision == "aprobada":
                if not aceptacion or not declaracion or not firma:
                    conexion.rollback()
                    return jsonify({
                        "mensaje": (
                            "La solicitud no contiene todos los "
                            "datos de aceptación del representante."
                        )
                    }), 400

                cursor.execute("""
                    UPDATE autorizaciones_representante
                    SET
                        estado = 'aprobada',
                        metodo_verificacion = %s,
                        fecha_verificacion = NOW(),
                        evidencia_verificacion = %s,
                        observaciones_verificacion = %s,
                        id_administrador_verifica = %s
                    WHERE id_autorizacion = %s
                """, (
                    metodo,
                    evidencia,
                    observaciones or None,
                    id_administrador,
                    id_autorizacion
                ))

                cursor.execute("""
                    UPDATE usuarios
                    SET estado_cuenta = 'activa'
                    WHERE id_usuario = %s
                      AND estado_cuenta = 'pendiente_autorizacion'
                """, (id_usuario,))

                if cursor.rowcount != 1:
                    conexion.rollback()
                    return jsonify({
                        "mensaje": (
                            "La cuenta no está pendiente de autorización. "
                            "No se realizaron cambios."
                        )
                    }), 409

            else:
                cursor.execute("""
                    UPDATE autorizaciones_representante
                    SET
                        estado = 'rechazada',
                        metodo_verificacion = %s,
                        fecha_verificacion = NOW(),
                        evidencia_verificacion = %s,
                        observaciones_verificacion = %s,
                        id_administrador_verifica = %s
                    WHERE id_autorizacion = %s
                """, (
                    metodo,
                    evidencia,
                    observaciones or None,
                    id_administrador,
                    id_autorizacion
                ))

                cursor.execute("""
                    UPDATE usuarios
                    SET estado_cuenta = 'rechazada'
                    WHERE id_usuario = %s
                      AND estado_cuenta = 'pendiente_autorizacion'
                """, (id_usuario,))

                if cursor.rowcount != 1:
                    conexion.rollback()
                    return jsonify({
                        "mensaje": (
                            "La cuenta no está pendiente de autorización. "
                            "No se realizaron cambios."
                        )
                    }), 409

            conexion.commit()

            return jsonify({
                "mensaje": (
                    "Autorización aprobada y cuenta activada."
                    if decision == "aprobada"
                    else "Autorización rechazada. La cuenta permanece bloqueada."
                )
            })

        except Error:
            if conexion:
                conexion.rollback()

            app.logger.exception(
                "Error procesando autorización administrativa."
            )

            return jsonify({
                "mensaje": "Ocurrió un error al procesar la autorización."
            }), 500

        finally:
            if cursor:
                cursor.close()
            if conexion:
                conexion.close()

    return panel_autorizaciones
