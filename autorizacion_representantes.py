import hashlib
import secrets

from flask import request, jsonify, current_app
from mysql.connector import Error


VERSION_AUTORIZACION = "2.0"


def registrar_autorizacion_representantes(app, conectar_db):

    def cerrar(cursor, conexion):
        if cursor is not None:
            cursor.close()

        if conexion is not None:
            conexion.close()

    def crear_solicitud_autorizacion(
        id_usuario,
        nombre_menor=None,
        nombre_representante=None,
        correo_representante=None,
        parentesco=None
    ):
        """
        Crea una solicitud pendiente para que el representante
        complete la autorización presencial en el mismo dispositivo.
        """

        token = secrets.token_urlsafe(32)

        token_hash = hashlib.sha256(
            token.encode("utf-8")
        ).hexdigest()

        conexion = None
        cursor = None

        try:
            conexion = conectar_db()
            cursor = conexion.cursor()

            cursor.execute("""
                INSERT INTO autorizaciones_representante (
                    id_usuario,
                    nombre_representante,
                    correo_representante,
                    parentesco,
                    estado,
                    version_autorizacion,
                    token_hash,
                    metodo_verificacion
                )
                VALUES (
                    %s, NULL, NULL, NULL,
                    'pendiente', %s, %s, 'pendiente'
                )
            """, (
                id_usuario,
                VERSION_AUTORIZACION,
                token_hash
            ))

            conexion.commit()

            return token

        except Exception:
            if conexion is not None:
                conexion.rollback()

            raise

        finally:
            cerrar(cursor, conexion)

    @app.route(
        "/api/autorizacion-representante/aceptar",
        methods=["POST"]
    )
    def aceptar_autorizacion_representante():

        datos = request.get_json(silent=True) or {}

        token = str(
            datos.get("token") or ""
        ).strip()

        nombre = str(
            datos.get("nombre_representante") or ""
        ).strip()

        parentesco = str(
            datos.get("parentesco") or ""
        ).strip()

        firma = str(
            datos.get("firma_electronica") or ""
        ).strip()

        aceptacion = datos.get("aceptacion_explicita")
        declaracion = datos.get("declaracion_representacion")

        # Validar token de sesión presencial
        if not 30 <= len(token) <= 100:
            return jsonify({
                "mensaje": "La solicitud de autorización no es válida."
            }), 400

        # Validar nombre del representante
        if not nombre or len(nombre) > 100:
            return jsonify({
                "mensaje": (
                    "Ingresa el nombre completo del representante legal."
                )
            }), 400

        # Validar parentesco
        if not parentesco or len(parentesco) > 40:
            return jsonify({
                "mensaje": "Selecciona o indica el parentesco."
            }), 400

        # Validar firma electrónica
        if not firma or len(firma) > 150:
            return jsonify({
                "mensaje": "Ingresa la firma electrónica del representante."
            }), 400

        if firma.casefold() != nombre.casefold():
            return jsonify({
                "mensaje": (
                    "La firma debe coincidir exactamente con el nombre "
                    "completo del representante."
                )
            }), 400

        # Validar casillas de aceptación y declaración
        if aceptacion is not True or declaracion is not True:
            return jsonify({
                "mensaje": (
                    "Debes aceptar la autorización y declarar "
                    "que eres el representante legal del menor."
                )
            }), 400

        # Generar hash del token
        token_hash = hashlib.sha256(
            token.encode("utf-8")
        ).hexdigest()

        conexion = None
        cursor = None

        try:
            conexion = conectar_db()
            cursor = conexion.cursor(dictionary=True)

            # Buscar solicitud pendiente en TiDB
            cursor.execute("""
                SELECT
                    id_autorizacion,
                    id_usuario,
                    estado
                FROM autorizaciones_representante
                WHERE token_hash = %s
                LIMIT 1
            """, (token_hash,))

            solicitud = cursor.fetchone()

            if not solicitud:
                return jsonify({
                    "mensaje": (
                        "La solicitud no existe o ya fue respondida."
                    )
                }), 404

            if solicitud["estado"] != "pendiente":
                return jsonify({
                    "mensaje": "Esta solicitud ya fue respondida."
                }), 409

            # Registrar aprobación presencial del representante
            cursor.execute("""
                UPDATE autorizaciones_representante
                SET
                    nombre_representante = %s,
                    parentesco = %s,
                    firma_electronica = %s,
                    aceptacion_explicita = 1,
                    declaracion_representacion = 1,
                    fecha_aceptacion = NOW(),
                    fecha_respuesta = NOW(),
                    estado = 'aprobada',
                    metodo_verificacion = 'presencial_dispositivo',
                    token_hash = NULL
                WHERE id_autorizacion = %s
                  AND estado = 'pendiente'
            """, (
                nombre,
                parentesco,
                firma,
                solicitud["id_autorizacion"]
            ))

            if cursor.rowcount != 1:
                conexion.rollback()

                return jsonify({
                    "mensaje": "La solicitud ya fue respondida."
                }), 409

            # Activar inmediatamente la cuenta del menor en usuarios
            cursor.execute("""
                UPDATE usuarios
                SET
                    nombre_representante = %s,
                    estado_cuenta = 'activa'
                WHERE id_usuario = %s
                  AND estado_cuenta = 'pendiente_autorizacion'
            """, (
                nombre,
                solicitud["id_usuario"]
            ))

            if cursor.rowcount != 1:
                conexion.rollback()

                return jsonify({
                    "mensaje": (
                        "No se pudo activar la cuenta del menor."
                    )
                }), 409

            # Confirmar ambos cambios en una sola transacción en TiDB
            conexion.commit()

            return jsonify({
                "mensaje": (
                    "¡Autorización presencial completada! "
                    "La cuenta de CONTIGO ya está activa y pueden iniciar sesión."
                ),
                "estado": "activa",
                "cuenta_creada": True
            }), 200

        except Error:
            if conexion is not None:
                conexion.rollback()

            current_app.logger.exception(
                "Error al registrar la autorización presencial del representante."
            )

            return jsonify({
                "mensaje": (
                    "No fue posible guardar la autorización."
                )
            }), 500

        finally:
            cerrar(cursor, conexion)

    return crear_solicitud_autorizacion