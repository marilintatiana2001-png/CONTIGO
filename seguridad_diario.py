import os
import re
import secrets
import smtplib
import ssl
import time

from datetime import datetime, timedelta, timezone
from email.message import EmailMessage

from flask import (
    jsonify,
    redirect,
    render_template,
    request,
    session,
    url_for
)

from mysql.connector import Error, IntegrityError

from werkzeug.security import (
    check_password_hash,
    generate_password_hash
)


def registrar_seguridad_diario(
    app,
    conectar_db,
    validar_csrf,
    requiere_sesion
):

    # ==========================================
    # FUNCIONES AUXILIARES
    # ==========================================

    def ahora():
        return datetime.now(
            timezone.utc
        ).replace(tzinfo=None)

    def db():
        return conectar_db()

    def leer_seguridad(usuario_id):

        conexion = db()
        cursor = conexion.cursor(
            dictionary=True
        )

        try:
            cursor.execute(
                """
                SELECT *
                FROM seguridad_diario
                WHERE id_usuario = %s
                """,
                (usuario_id,)
            )

            return cursor.fetchone()

        finally:
            cursor.close()
            conexion.close()

    def validar_pin(valor):

        return (
            isinstance(valor, str)
            and re.fullmatch(
                r"[0-9]{6}",
                valor
            ) is not None
        )

    def csrf_valido():

        if not validar_csrf():
            return jsonify({
                "mensaje": "Solicitud no autorizada."
            }), 403

        return None

    def cerrar_acceso():

        session.pop(
            "diario_abierto_hasta",
            None
        )

    def abrir_acceso():

        session["diario_abierto_hasta"] = (
            time.time() + 300
        )

    # ==========================================
    # PROTEGER TODAS LAS RUTAS DEL DIARIO
    # ==========================================

    # ==========================================
    # PIN OPCIONAL PARA MI DIARIO
    # ==========================================

    @app.before_request
    def proteger_diario_por_pin():

        if "id_usuario" not in session:
            return None

        ruta = request.path

        protegida = (
            ruta in (
                "/diario",
                "/diario/nuevo",
                "/api/diario"
            )
            or (
                ruta.startswith("/api/diario/")
                and not ruta.startswith("/api/diario-pin/")
            )
        )

        if protegida:

            # Comprobar si el usuario activó un PIN
            try:
                candado = leer_seguridad(
                    session["id_usuario"]
                )

            except Error:
                app.logger.exception(
                    "No se pudo verificar la seguridad del diario"
                )

                if ruta.startswith("/api/"):
                    return jsonify({
                        "mensaje": "No pudimos verificar la seguridad del diario."
                    }), 503

                return "No pudimos verificar la seguridad del diario.", 503

            # Si NO tiene PIN, permitir acceso directo
            if candado is None:
                cerrar_acceso()
                return None

            # Si tiene PIN, comprobar desbloqueo
            if float(
                session.get("diario_abierto_hasta", 0)
            ) > time.time():

                abrir_acceso()
                return None

            cerrar_acceso()

            # Bloquear API cuando el PIN está activado
            if ruta.startswith("/api/"):

                return jsonify({
                    "mensaje": "Desbloquea Mi Diario antes de continuar.",
                    "redirigir": url_for("pantalla_pin_diario")
                }), 423

            # Mostrar pantalla para introducir el PIN
            return redirect(
                url_for("pantalla_pin_diario")
            )

        # Al salir del diario se cierra el desbloqueo
        otras_pantallas = (
            "/",
            "/inicio",
            "/perfil",
            "/configuracion",
            "/red-apoyo",
            "/ian",
            "/constelacion",
            "/actividades"
        )

        if (
            request.method == "GET"
            and (
                ruta in otras_pantallas
                or ruta.startswith("/actividad/")
            )
        ):
            cerrar_acceso()

        return None


    # Evitar que se guarden páginas privadas
    # en la caché del navegador.

    @app.after_request
    def evitar_cache_diario(respuesta):

        ruta = request.path

        if (
            ruta.startswith("/diario")
            or ruta.startswith("/api/diario")
        ):

            respuesta.headers[
                "Cache-Control"
            ] = "no-store, private"

            respuesta.headers[
                "Pragma"
            ] = "no-cache"

            respuesta.headers[
                "Expires"
            ] = "0"

        return respuesta

    # ==========================================
    # PANTALLA DE ACCESO CON PIN
    # ==========================================

    @app.route(
        "/diario/acceso",
        methods=["GET"]
    )
    @requiere_sesion
    def pantalla_pin_diario():

        try:

            fila = leer_seguridad(
                session["id_usuario"]
            )

        except Error:

            app.logger.exception(
                "No se pudo consultar el candado"
            )

            return (
                "No pudimos abrir la "
                "pantalla de seguridad.",
                500
            )

        return render_template(
            "diario_acceso.html",
            configurar=fila is None,
            pista=(
                fila.get("pista")
                if fila else ""
            ) or ""
        )


    # ====================================================
    # CONFIGURAR PIN OPCIONAL DE MI DIARIO
    # ====================================================

    @app.route("/diario/seguridad", methods=["GET"])
    @requiere_sesion
    def configurar_seguridad_diario():

        try:
            fila = leer_seguridad(
                session["id_usuario"]
            )

        except Error:
            app.logger.exception(
                "Error consultando seguridad del diario"
            )

            return (
                "No pudimos cargar la configuración.",
                503
            )

        return render_template(
            "diario_seguridad.html",
            tiene_pin=fila is not None
        )

    # ====================================================
    # DESACTIVAR PIN DE MI DIARIO
    # ====================================================

    @app.route(
        "/api/diario-pin/desactivar",
        methods=["POST"]
    )
    @requiere_sesion
    def desactivar_pin_diario():

        error = csrf_valido()

        if error:
            return error

        datos = request.get_json(silent=True)

        if not isinstance(datos, dict):
            return jsonify({
                "mensaje": "Datos inválidos."
            }), 400

        pin = datos.get("pin")
        contrasena = datos.get("contrasena")

        if (
            not validar_pin(pin)
            or not isinstance(contrasena, str)
            or not contrasena
        ):
            return jsonify({
                "mensaje": (
                    "Ingresa el PIN actual y "
                    "la contraseña de CONTIGO."
                )
            }), 400

        conexion = None
        cursor = None

        try:
            conexion = db()
            cursor = conexion.cursor(dictionary=True)

            usuario_id = session["id_usuario"]

            cursor.execute("""
                SELECT pin_hash, intentos, bloqueado_hasta
                FROM seguridad_diario
                WHERE id_usuario = %s
                FOR UPDATE
            """, (usuario_id,))

            candado = cursor.fetchone()

            if candado is None:
                return jsonify({
                    "mensaje": "Tu diario no tiene un PIN activo."
                }), 409

            if (
                candado["bloqueado_hasta"]
                and candado["bloqueado_hasta"] > ahora()
            ):
                return jsonify({
                    "mensaje": (
                        "El PIN está bloqueado temporalmente. "
                        "Espera 5 minutos."
                    )
                }), 429

            cursor.execute("""
                SELECT contrasena
                FROM usuarios
                WHERE id_usuario = %s
            """, (usuario_id,))

            usuario = cursor.fetchone()

            pin_correcto = check_password_hash(
                candado["pin_hash"],
                pin
            )

            contrasena_correcta = bool(
                usuario and check_password_hash(
                    usuario["contrasena"],
                    contrasena
                )
            )

            if not (
                pin_correcto
                and contrasena_correcta
            ):

                intentos = int(
                    candado["intentos"] or 0
                ) + 1

                bloqueo = (
                    ahora() + timedelta(minutes=5)
                    if intentos >= 5
                    else None
                )

                cursor.execute("""
                    UPDATE seguridad_diario
                    SET intentos = %s,
                        bloqueado_hasta = %s
                    WHERE id_usuario = %s
                """, (
                    0 if bloqueo else intentos,
                    bloqueo,
                    usuario_id
                ))

                conexion.commit()

                return jsonify({
                    "mensaje": (
                        "PIN o contraseña incorrectos. "
                        + (
                            "Espera 5 minutos."
                            if bloqueo
                            else "Intenta nuevamente."
                        )
                    )
                }), 429 if bloqueo else 403

            # Eliminar solamente la protección.
            # NO se eliminan los escritos del diario.

            cursor.execute("""
                DELETE FROM seguridad_diario
                WHERE id_usuario = %s
            """, (usuario_id,))

            conexion.commit()

            cerrar_acceso()

            return jsonify({
                "mensaje": (
                    "PIN desactivado correctamente. "
                    "Tus escritos se conservaron."
                ),
                "redirigir": url_for("diario")
            }), 200

        except Error:

            if conexion is not None:
                conexion.rollback()

            app.logger.exception(
                "Error al desactivar el PIN"
            )

            return jsonify({
                "mensaje": (
                    "No pudimos desactivar el PIN."
                )
            }), 503

        finally:

            if cursor is not None:
                cursor.close()

            if conexion is not None:
                conexion.close()


    # ==========================================
    # PANTALLA PARA RECUPERAR PIN
    # ==========================================

    @app.route(
        "/diario/recuperar",
        methods=["GET"]
    )
    @requiere_sesion
    def pantalla_recuperar_pin():

        return render_template(
            "diario_recuperar.html"
        )

    # ==========================================
    # CREAR PIN POR PRIMERA VEZ
    # ==========================================

    @app.route(
        "/api/diario-pin/crear",
        methods=["POST"]
    )
    @requiere_sesion
    def crear_pin_diario():

        error = csrf_valido()

        if error:
            return error

        datos = (
            request.get_json(silent=True)
            or {}
        )

        pin = datos.get("pin")
        confirmar = datos.get("confirmar")
        pista = datos.get("pista", "")

        if (
            not validar_pin(pin)
            or pin != confirmar
        ):

            return jsonify({
                "mensaje": (
                    "El PIN debe tener 6 números "
                    "iguales en ambos campos."
                )
            }), 400

        if (
            not isinstance(pista, str)
            or len(pista.strip()) > 120
        ):

            return jsonify({
                "mensaje": (
                    "La pista puede tener "
                    "máximo 120 caracteres."
                )
            }), 400

        conexion = None
        cursor = None

        try:

            conexion = db()
            cursor = conexion.cursor()

            cursor.execute(
                """
                INSERT INTO seguridad_diario
                    (id_usuario, pin_hash, pista)
                VALUES
                    (%s, %s, %s)
                """,
                (
                    session["id_usuario"],
                    generate_password_hash(pin),
                    pista.strip() or None
                )
            )

            conexion.commit()

            abrir_acceso()

            return jsonify({
                "mensaje": (
                    "¡Tu Diario está protegido!"
                ),
                "redirigir": url_for("diario")
            }), 201

        except IntegrityError:

            if conexion:
                conexion.rollback()

            return jsonify({
                "mensaje": (
                    "Tu Diario ya tiene "
                    "un PIN configurado."
                )
            }), 409

        except Error:

            if conexion:
                conexion.rollback()

            app.logger.exception(
                "No se pudo crear PIN"
            )

            return jsonify({
                "mensaje": (
                    "No pudimos guardar el PIN."
                )
            }), 500

        finally:

            if cursor:
                cursor.close()

            if conexion:
                conexion.close()

    # ==========================================
    # DESBLOQUEAR DIARIO
    # ==========================================

    @app.route(
        "/api/diario-pin/desbloquear",
        methods=["POST"]
    )
    @requiere_sesion
    def desbloquear_diario():

        error = csrf_valido()

        if error:
            return error

        datos = (
            request.get_json(silent=True)
            or {}
        )

        pin = datos.get("pin")

        if not validar_pin(pin):

            return jsonify({
                "mensaje": (
                    "Escribe los 6 números de tu PIN."
                )
            }), 400

        conexion = None
        cursor = None

        try:

            conexion = db()

            cursor = conexion.cursor(
                dictionary=True
            )

            cursor.execute(
                """
                SELECT
                    pin_hash,
                    intentos,
                    bloqueado_hasta
                FROM seguridad_diario
                WHERE id_usuario = %s
                FOR UPDATE
                """,
                (session["id_usuario"],)
            )

            fila = cursor.fetchone()

            if not fila:

                return jsonify({
                    "mensaje": (
                        "Primero debes crear tu PIN."
                    )
                }), 409

            if (
                fila["bloqueado_hasta"]
                and fila["bloqueado_hasta"] > ahora()
            ):

                return jsonify({
                    "mensaje": (
                        "Demasiados intentos. "
                        "Espera 5 minutos o "
                        "recupera tu PIN."
                    )
                }), 429

            if not check_password_hash(
                fila["pin_hash"],
                pin
            ):

                intentos = (
                    int(fila["intentos"] or 0) + 1
                )

                bloquear = (
                    ahora() + timedelta(minutes=5)
                    if intentos >= 5
                    else None
                )

                cursor.execute(
                    """
                    UPDATE seguridad_diario
                    SET
                        intentos = %s,
                        bloqueado_hasta = %s
                    WHERE id_usuario = %s
                    """,
                    (
                        0 if bloquear else intentos,
                        bloquear,
                        session["id_usuario"]
                    )
                )

                conexion.commit()

                return jsonify({
                    "mensaje": (
                        "PIN incorrecto. "
                        + (
                            "Espera 5 minutos."
                            if bloquear
                            else "Inténtalo de nuevo."
                        )
                    )
                }), (
                    429 if bloquear else 401
                )

            cursor.execute(
                """
                UPDATE seguridad_diario
                SET
                    intentos = 0,
                    bloqueado_hasta = NULL
                WHERE id_usuario = %s
                """,
                (session["id_usuario"],)
            )

            conexion.commit()

            abrir_acceso()

            return jsonify({
                "mensaje": (
                    "Diario desbloqueado."
                ),
                "redirigir": url_for("diario")
            }), 200

        except Error:

            if conexion:
                conexion.rollback()

            app.logger.exception(
                "Error al comprobar PIN"
            )

            return jsonify({
                "mensaje": (
                    "No pudimos comprobar tu PIN."
                )
            }), 500

        finally:

            if cursor:
                cursor.close()

            if conexion:
                conexion.close()

    # ==========================================
    # ENVÍO DE CORREO SMTP
    # ==========================================

    def enviar_correo(correo, codigo):

        usuario = os.environ.get(
            "CONTIGO_SMTP_USER",
            ""
        ).strip()

        clave = os.environ.get(
            "CONTIGO_SMTP_PASSWORD",
            ""
        )

        if not usuario or not clave:

            raise RuntimeError(
                "Falta configurar el correo SMTP."
            )

        host = os.environ.get(
            "CONTIGO_SMTP_HOST",
            "smtp.gmail.com"
        )

        puerto = int(
            os.environ.get(
                "CONTIGO_SMTP_PORT",
                "587"
            )
        )

        mensaje = EmailMessage()

        mensaje["From"] = usuario
        mensaje["To"] = correo

        mensaje["Subject"] = (
            "CONTIGO: código para "
            "recuperar Mi Diario"
        )

        mensaje.set_content(
            "Hola,\n\n"
            "El código para recuperar "
            "el PIN de Mi Diario es: "
            + codigo
            + "\n\nCaduca en 10 minutos. "
            "Si no lo solicitaste, "
            "ignora este correo.\n\n"
            "CONTIGO 💜"
        )

        with smtplib.SMTP(
            host,
            puerto,
            timeout=15
        ) as smtp:

            smtp.ehlo()

            smtp.starttls(
                context=ssl.create_default_context()
            )

            smtp.ehlo()

            smtp.login(
                usuario,
                clave
            )

            smtp.send_message(mensaje)

    # ==========================================
    # RECUPERACIÓN: ENVIAR CÓDIGO
    # ==========================================

    @app.route(
        "/api/diario-pin/recuperar/enviar",
        methods=["POST"]
    )
    @requiere_sesion
    def solicitar_codigo_pin():

        error = csrf_valido()

        if error:
            return error

        datos = (
            request.get_json(silent=True)
            or {}
        )

        correo = str(
            datos.get("correo") or ""
        ).strip().lower()

        if not re.fullmatch(
            r"[^@\s]+@[^@\s]+\.[^@\s]+",
            correo
        ):

            return jsonify({
                "mensaje": "Escribe un correo válido."
            }), 400

        if (
            not os.environ.get(
                "CONTIGO_SMTP_USER"
            )
            or not os.environ.get(
                "CONTIGO_SMTP_PASSWORD"
            )
        ):

            return jsonify({
                "mensaje": (
                    "La recuperación por correo "
                    "aún no está configurada "
                    "en el servidor."
                )
            }), 503

        conexion = None
        cursor = None

        try:

            conexion = db()

            cursor = conexion.cursor(
                dictionary=True
            )

            cursor.execute(
                """
                SELECT correo
                FROM usuarios
                WHERE id_usuario = %s
                """,
                (session["id_usuario"],)
            )

            usuario = cursor.fetchone()

            cursor.execute(
                """
                SELECT ultimo_envio
                FROM seguridad_diario
                WHERE id_usuario = %s
                """,
                (session["id_usuario"],)
            )

            candado = cursor.fetchone()

            if not usuario or not candado:

                return jsonify({
                    "mensaje": (
                        "No encontramos "
                        "un PIN configurado."
                    )
                }), 404

            if correo != str(
                usuario["correo"] or ""
            ).strip().lower():

                return jsonify({
                    "mensaje": (
                        "Si coincide con el correo "
                        "registrado, enviaremos un "
                        "código de verificación."
                    )
                }), 200

            if (
                candado["ultimo_envio"]
                and (
                    ahora()
                    - candado["ultimo_envio"]
                ).total_seconds() < 90
            ):

                return jsonify({
                    "mensaje": (
                        "Espera 90 segundos antes "
                        "de solicitar otro código."
                    )
                }), 429

            codigo = (
                f"{secrets.randbelow(1000000):06d}"
            )

            enviar_correo(
                usuario["correo"],
                codigo
            )

            cursor.execute(
                """
                UPDATE seguridad_diario
                SET
                    codigo_hash = %s,
                    codigo_expira = %s,
                    codigo_intentos = 0,
                    ultimo_envio = %s,
                    autorizado_hasta = NULL
                WHERE id_usuario = %s
                """,
                (
                    generate_password_hash(codigo),
                    ahora() + timedelta(minutes=10),
                    ahora(),
                    session["id_usuario"]
                )
            )

            conexion.commit()

            return jsonify({
                "mensaje": (
                    "Enviamos un código al correo "
                    "registrado. Revisa también spam."
                )
            }), 200

        except (
            smtplib.SMTPException,
            TimeoutError,
            OSError,
            RuntimeError
        ):

            app.logger.exception(
                "No se pudo enviar código del diario"
            )

            return jsonify({
                "mensaje": (
                    "No pudimos enviar el correo. "
                    "Revisa la configuración SMTP."
                )
            }), 503

        except Error:

            if conexion:
                conexion.rollback()

            app.logger.exception(
                "Error al crear código de recuperación"
            )

            return jsonify({
                "mensaje": (
                    "No pudimos preparar la recuperación."
                )
            }), 500

        finally:

            if cursor:
                cursor.close()

            if conexion:
                conexion.close()

    # ==========================================
    # RECUPERACIÓN: VERIFICAR CÓDIGO
    # ==========================================

    @app.route(
        "/api/diario-pin/recuperar/verificar",
        methods=["POST"]
    )
    @requiere_sesion
    def verificar_codigo_pin():

        error = csrf_valido()

        if error:
            return error

        datos = (
            request.get_json(silent=True)
            or {}
        )

        codigo = datos.get("codigo")

        if not validar_pin(codigo):

            return jsonify({
                "mensaje": (
                    "Ingresa el código de 6 dígitos."
                )
            }), 400

        conexion = None
        cursor = None

        try:

            conexion = db()

            cursor = conexion.cursor(
                dictionary=True
            )

            cursor.execute(
                """
                SELECT
                    codigo_hash,
                    codigo_expira,
                    codigo_intentos
                FROM seguridad_diario
                WHERE id_usuario = %s
                FOR UPDATE
                """,
                (session["id_usuario"],)
            )

            fila = cursor.fetchone()

            if (
                not fila
                or not fila["codigo_hash"]
                or not fila["codigo_expira"]
                or fila["codigo_expira"] < ahora()
            ):

                return jsonify({
                    "mensaje": (
                        "El código ha vencido. "
                        "Solicita otro."
                    )
                }), 400

            if int(
                fila["codigo_intentos"] or 0
            ) >= 5:

                return jsonify({
                    "mensaje": (
                        "Demasiados intentos. "
                        "Solicita otro código."
                    )
                }), 429

            if not check_password_hash(
                fila["codigo_hash"],
                codigo
            ):

                intentos = (
                    int(
                        fila["codigo_intentos"] or 0
                    ) + 1
                )

                cursor.execute(
                    """
                    UPDATE seguridad_diario
                    SET codigo_intentos = %s
                    WHERE id_usuario = %s
                    """,
                    (
                        intentos,
                        session["id_usuario"]
                    )
                )

                conexion.commit()

                return jsonify({
                    "mensaje": "Código incorrecto."
                }), 401

            cursor.execute(
                """
                UPDATE seguridad_diario
                SET
                    codigo_hash = NULL,
                    codigo_expira = NULL,
                    autorizado_hasta = %s,
                    recuperacion_fallos = 0
                WHERE id_usuario = %s
                """,
                (
                    ahora() + timedelta(minutes=5),
                    session["id_usuario"]
                )
            )

            conexion.commit()

            return jsonify({
                "mensaje": (
                    "Código verificado. "
                    "Ahora crea tu nuevo PIN."
                )
            }), 200

        except Error:

            if conexion:
                conexion.rollback()

            app.logger.exception(
                "Error al verificar código"
            )

            return jsonify({
                "mensaje": (
                    "No pudimos verificar el código."
                )
            }), 500

        finally:

            if cursor:
                cursor.close()

            if conexion:
                conexion.close()

    # ==========================================
    # RECUPERACIÓN: ESTABLECER NUEVO PIN
    # ==========================================

    @app.route(
        "/api/diario-pin/recuperar/cambiar",
        methods=["POST"]
    )
    @requiere_sesion
    def cambiar_pin_recuperado():

        error = csrf_valido()

        if error:
            return error

        datos = (
            request.get_json(silent=True)
            or {}
        )

        pin = datos.get("pin")
        confirmar = datos.get("confirmar")
        pista = datos.get("pista", "")
        contrasena = datos.get("contrasena")

        if (
            not isinstance(contrasena, str)
            or not contrasena
        ):

            return jsonify({
                "mensaje": (
                    "Escribe la contraseña "
                    "de tu cuenta CONTIGO."
                )
            }), 400

        if (
            not validar_pin(pin)
            or pin != confirmar
        ):

            return jsonify({
                "mensaje": (
                    "El nuevo PIN debe tener "
                    "6 dígitos y coincidir "
                    "con su confirmación."
                )
            }), 400

        if (
            not isinstance(pista, str)
            or len(pista.strip()) > 120
        ):

            return jsonify({
                "mensaje": (
                    "La pista debe tener "
                    "máximo 120 caracteres."
                )
            }), 400

        conexion = None
        cursor = None

        try:

            conexion = db()

            cursor = conexion.cursor(
                dictionary=True
            )

            cursor.execute(
                """
                SELECT
                    autorizado_hasta,
                    recuperacion_fallos
                FROM seguridad_diario
                WHERE id_usuario = %s
                FOR UPDATE
                """,
                (session["id_usuario"],)
            )

            fila = cursor.fetchone()

            if (
                not fila
                or not fila["autorizado_hasta"]
                or fila["autorizado_hasta"] < ahora()
            ):

                return jsonify({
                    "mensaje": (
                        "Debes verificar primero "
                        "el código enviado al correo."
                    )
                }), 403

            cursor.execute(
                """
                SELECT contrasena
                FROM usuarios
                WHERE id_usuario = %s
                """,
                (session["id_usuario"],)
            )

            usuario = cursor.fetchone()

            if (
                not usuario
                or not check_password_hash(
                    usuario["contrasena"],
                    contrasena
                )
            ):

                fallos = (
                    int(
                        fila["recuperacion_fallos"] or 0
                    ) + 1
                )

                cursor.execute(
                    """
                    UPDATE seguridad_diario
                    SET
                        recuperacion_fallos = %s,
                        autorizado_hasta = %s
                    WHERE id_usuario = %s
                    """,
                    (
                        fallos,
                        (
                            None
                            if fallos >= 5
                            else fila["autorizado_hasta"]
                        ),
                        session["id_usuario"]
                    )
                )

                conexion.commit()

                return jsonify({
                    "mensaje": (
                        "Contraseña incorrecta. "
                        + (
                            "Solicita otro código."
                            if fallos >= 5
                            else "Intenta nuevamente."
                        )
                    )
                }), 403

            cursor.execute(
                """
                UPDATE seguridad_diario
                SET
                    pin_hash = %s,
                    pista = %s,
                    intentos = 0,
                    bloqueado_hasta = NULL,
                    codigo_hash = NULL,
                    codigo_expira = NULL,
                    codigo_intentos = 0,
                    autorizado_hasta = NULL,
                    recuperacion_fallos = 0
                WHERE id_usuario = %s
                """,
                (
                    generate_password_hash(pin),
                    pista.strip() or None,
                    session["id_usuario"]
                )
            )

            conexion.commit()

            abrir_acceso()

            return jsonify({
                "mensaje": (
                    "PIN actualizado correctamente."
                ),
                "redirigir": url_for("diario")
            }), 200

        except Error:

            if conexion:
                conexion.rollback()

            app.logger.exception(
                "Error al cambiar PIN"
            )

            return jsonify({
                "mensaje": (
                    "No pudimos cambiar el PIN."
                )
            }), 500

        finally:

            if cursor:
                cursor.close()

            if conexion:
                conexion.close()
