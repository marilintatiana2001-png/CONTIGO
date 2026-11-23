
"""
CONTIGO - Recuperación de contraseña.

Flask + MariaDB + Gmail SMTP.

No requiere iniciar sesión.
No modifica las funciones de Mi Diario.
"""

import os
import re
import secrets
import hashlib
import smtplib
import ssl

from datetime import (
    datetime,
    timedelta,
    timezone
)

from email.message import EmailMessage

from flask import (
    jsonify,
    render_template,
    request,
    session,
    url_for
)

from mysql.connector import Error

from werkzeug.security import (
    generate_password_hash,
    check_password_hash
)


def registrar_recuperacion_contrasena(
    app,
    conectar_db,
    validar_csrf_contigo
):

    # ==========================================
    # FUNCIONES AUXILIARES
    # ==========================================

    def ahora():
        return datetime.now(
            timezone.utc
        ).replace(tzinfo=None)

    def cerrar(cursor, conexion):

        if cursor is not None:
            cursor.close()

        if conexion is not None:
            conexion.close()

    def revisar_csrf():

        if not validar_csrf_contigo():

            return jsonify({
                "mensaje": (
                    "La sesión expiró. "
                    "Actualiza la página."
                )
            }), 403

        return None

    def correo_valido(valor):

        return (
            isinstance(valor, str)
            and len(valor.strip()) <= 150
            and re.fullmatch(
                r"[^@\s]+@[^@\s]+\.[^@\s]+",
                valor.strip()
            ) is not None
        )

    def smtp_configurado():

        return bool(
            os.environ.get(
                "CONTIGO_SMTP_USER"
            )
            and os.environ.get(
                "CONTIGO_SMTP_PASSWORD"
            )
        )

    # ==========================================
    # ENVIAR MENSAJE POR GMAIL
    # ==========================================

    def enviar_correo(destinatario, codigo):

        remitente = os.environ[
            "CONTIGO_SMTP_USER"
        ].strip()

        clave = os.environ[
            "CONTIGO_SMTP_PASSWORD"
        ].replace(" ", "")

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

        mensaje["From"] = remitente
        mensaje["To"] = destinatario

        mensaje["Subject"] = (
            "CONTIGO - Recuperación de contraseña"
        )

        mensaje.set_content(
            "Hola:\n\n"
            "Tu código para restablecer "
            "la contraseña de CONTIGO es: "
            + codigo
            + "\n\nCaduca en 10 minutos. "
            "Si no lo solicitaste, ignora "
            "este mensaje. No compartas "
            "este código.\n\n"
            "CONTIGO 💜"
        )

        with smtplib.SMTP(
            host,
            puerto,
            timeout=20
        ) as smtp:

            smtp.ehlo()

            smtp.starttls(
                context=ssl.create_default_context()
            )

            smtp.ehlo()

            smtp.login(
                remitente,
                clave
            )

            smtp.send_message(mensaje)

    # ==========================================
    # PANTALLA DE RECUPERACIÓN
    # ==========================================

    @app.get("/recuperar-contrasena")
    def pantalla_recuperar_contrasena():

        return render_template(
            "recuperar_contrasena.html"
        )

    # ==========================================
    # CSRF PARA USUARIOS SIN SESIÓN
    # ==========================================

    @app.get(
        "/api/recuperar-contrasena/csrf"
    )
    def csrf_recuperacion():

        if "csrf_contigo" not in session:

            session["csrf_contigo"] = (
                secrets.token_urlsafe(32)
            )

        return jsonify({
            "csrf_token":
                session["csrf_contigo"]
        })

    # ==========================================
    # EVITAR CACHÉ DE RECUPERACIÓN
    # ==========================================

    @app.after_request
    def no_cache_recuperacion(respuesta):

        if request.path.startswith((
            "/recuperar-contrasena",
            "/api/recuperar-contrasena/"
        )):

            respuesta.headers[
                "Cache-Control"
            ] = "no-store, private"

            respuesta.headers[
                "Pragma"
            ] = "no-cache"

        return respuesta

    # ==========================================
    # PASO 1: SOLICITAR CÓDIGO
    # ==========================================

    @app.post(
        "/api/recuperar-contrasena/enviar"
    )
    def enviar_codigo():

        error = revisar_csrf()

        if error:
            return error

        datos = (
            request.get_json(silent=True)
            or {}
        )

        valor = (
            datos.get("correo")
            if isinstance(datos, dict)
            else None
        )

        if not correo_valido(valor):

            return jsonify({
                "mensaje": "Escribe un correo válido."
            }), 400

        if not smtp_configurado():

            return jsonify({
                "mensaje": (
                    "Falta configurar el correo "
                    "remitente de CONTIGO."
                )
            }), 503

        correo = valor.strip().lower()

        session["rc_correo"] = correo
        session.pop("rc_token", None)

        mensaje_generico = {
            "mensaje": (
                "Si este correo está registrado, "
                "recibirás un código. "
                "Revisa también spam."
            )
        }

        conexion = None
        cursor = None

        codigo = None
        hash_codigo = None
        destinatario = None

        try:

            conexion = conectar_db()

            cursor = conexion.cursor(
                dictionary=True
            )

            cursor.execute(
                """
                SELECT id_usuario, correo
                FROM usuarios
                WHERE correo = %s
                """,
                (correo,)
            )

            usuario = cursor.fetchone()

            cursor.execute(
                """
                SELECT *
                FROM recuperacion_contrasenas
                WHERE correo = %s
                FOR UPDATE
                """,
                (correo,)
            )

            previo = cursor.fetchone()

            momento = ahora()

            # Esperar al menos 90 segundos
            # entre solicitudes a un correo.

            if (
                previo
                and previo["ultimo_envio"]
                and momento - previo["ultimo_envio"]
                    < timedelta(seconds=90)
            ):

                return jsonify(
                    mensaje_generico
                )

            # Limitar los envíos por hora.

            if (
                previo
                and previo["ventana_inicio"]
                and momento - previo["ventana_inicio"]
                    < timedelta(hours=1)
            ):

                ventana = previo["ventana_inicio"]

                enviados = int(
                    previo["envios_ventana"] or 0
                )

            else:

                ventana = momento
                enviados = 0

            if enviados >= 5:

                return jsonify(
                    mensaje_generico
                )

            id_usuario = (
                usuario["id_usuario"]
                if usuario
                else None
            )

            if usuario:

                codigo = (
                    f"{secrets.randbelow(1000000):06d}"
                )

                hash_codigo = (
                    generate_password_hash(codigo)
                )

                destinatario = usuario["correo"]

            vencimiento = (
                momento + timedelta(minutes=10)
                if codigo
                else None
            )

            if previo:

                cursor.execute(
                    """
                    UPDATE recuperacion_contrasenas
                    SET
                        id_usuario = %s,
                        codigo_hash = %s,
                        codigo_expira = %s,
                        intentos = 0,
                        token_hash = NULL,
                        token_expira = NULL,
                        ultimo_envio = %s,
                        ventana_inicio = %s,
                        envios_ventana = %s
                    WHERE correo = %s
                    """,
                    (
                        id_usuario,
                        hash_codigo,
                        vencimiento,
                        momento,
                        ventana,
                        enviados + 1,
                        correo
                    )
                )

            else:

                cursor.execute(
                    """
                    INSERT INTO
                        recuperacion_contrasenas
                    (
                        correo,
                        id_usuario,
                        codigo_hash,
                        codigo_expira,
                        ultimo_envio,
                        ventana_inicio,
                        envios_ventana
                    )
                    VALUES (
                        %s, %s, %s, %s,
                        %s, %s, %s
                    )
                    """,
                    (
                        correo,
                        id_usuario,
                        hash_codigo,
                        vencimiento,
                        momento,
                        ventana,
                        1
                    )
                )

            conexion.commit()

        except Error:

            if conexion:
                conexion.rollback()

            app.logger.exception(
                "Error preparando recuperación "
                "de contraseña"
            )

            return jsonify({
                "mensaje": (
                    "No pudimos procesar "
                    "la solicitud."
                )
            }), 500

        finally:
            cerrar(cursor, conexion)

        # El correo solo se envía
        # cuando existe una cuenta.

        if destinatario:

            try:

                enviar_correo(
                    destinatario,
                    codigo
                )

            except (
                smtplib.SMTPException,
                TimeoutError,
                OSError,
                RuntimeError,
                ValueError
            ):

                app.logger.exception(
                    "Error enviando correo "
                    "de recuperación"
                )

                # Invalidar el código
                # cuando falla el envío.

                conexion2 = None
                cursor2 = None

                try:

                    conexion2 = conectar_db()
                    cursor2 = conexion2.cursor()

                    cursor2.execute(
                        """
                        UPDATE recuperacion_contrasenas
                        SET
                            codigo_hash = NULL,
                            codigo_expira = NULL
                        WHERE correo = %s
                          AND codigo_hash = %s
                        """,
                        (
                            correo,
                            hash_codigo
                        )
                    )

                    conexion2.commit()

                except Error:

                    app.logger.exception(
                        "Error invalidando "
                        "código fallido"
                    )

                finally:

                    cerrar(
                        cursor2,
                        conexion2
                    )

                return jsonify({
                    "mensaje": (
                        "No pudimos enviar el código. "
                        "Revisa SMTP e inténtalo "
                        "de nuevo más tarde."
                    )
                }), 503

        return jsonify(
            mensaje_generico
        )

    # ==========================================
    # PASO 2: VERIFICAR CÓDIGO
    # ==========================================

    @app.post(
        "/api/recuperar-contrasena/verificar"
    )
    def verificar_codigo():

        error = revisar_csrf()

        if error:
            return error

        datos = (
            request.get_json(silent=True)
            or {}
        )

        codigo = (
            datos.get("codigo")
            if isinstance(datos, dict)
            else None
        )

        correo = session.get(
            "rc_correo"
        )

        if (
            not correo
            or not isinstance(codigo, str)
            or not re.fullmatch(
                r"[0-9]{6}",
                codigo
            )
        ):

            return jsonify({
                "mensaje": (
                    "Escribe el código "
                    "de seis dígitos."
                )
            }), 400

        conexion = None
        cursor = None

        try:

            conexion = conectar_db()

            cursor = conexion.cursor(
                dictionary=True
            )

            cursor.execute(
                """
                SELECT *
                FROM recuperacion_contrasenas
                WHERE correo = %s
                FOR UPDATE
                """,
                (correo,)
            )

            fila = cursor.fetchone()

            if (
                not fila
                or not fila["codigo_hash"]
                or not fila["codigo_expira"]
                or fila["codigo_expira"] <= ahora()
            ):

                return jsonify({
                    "mensaje": (
                        "El código no es válido "
                        "o ha vencido. "
                        "Solicita uno nuevo."
                    )
                }), 400

            if int(
                fila["intentos"] or 0
            ) >= 5:

                return jsonify({
                    "mensaje": (
                        "Se agotaron los intentos. "
                        "Solicita otro código."
                    )
                }), 429

            if not check_password_hash(
                fila["codigo_hash"],
                codigo
            ):

                intentos = (
                    int(fila["intentos"] or 0) + 1
                )

                cursor.execute(
                    """
                    UPDATE recuperacion_contrasenas
                    SET
                        intentos = %s,
                        codigo_hash = %s,
                        codigo_expira = %s
                    WHERE correo = %s
                    """,
                    (
                        intentos,
                        (
                            fila["codigo_hash"]
                            if intentos < 5
                            else None
                        ),
                        (
                            fila["codigo_expira"]
                            if intentos < 5
                            else None
                        ),
                        correo
                    )
                )

                conexion.commit()

                return jsonify({
                    "mensaje": (
                        "Código incorrecto. "
                        "Solicita otro si agotaste "
                        "los intentos."
                    )
                }), 401

            # Crear autorización temporal
            # de un solo uso.

            token = secrets.token_urlsafe(32)

            token_hash = hashlib.sha256(
                token.encode()
            ).hexdigest()

            cursor.execute(
                """
                UPDATE recuperacion_contrasenas
                SET
                    codigo_hash = NULL,
                    codigo_expira = NULL,
                    intentos = 0,
                    token_hash = %s,
                    token_expira = %s
                WHERE correo = %s
                """,
                (
                    token_hash,
                    ahora() + timedelta(minutes=5),
                    correo
                )
            )

            conexion.commit()

            session["rc_token"] = token

            return jsonify({
                "mensaje": (
                    "Código verificado. "
                    "Ahora establece tu "
                    "contraseña nueva."
                )
            })

        except Error:

            if conexion:
                conexion.rollback()

            app.logger.exception(
                "Error verificando "
                "código de recuperación"
            )

            return jsonify({
                "mensaje": (
                    "No pudimos verificar "
                    "el código."
                )
            }), 500

        finally:
            cerrar(cursor, conexion)

    # ==========================================
    # PASO 3: CAMBIAR CONTRASEÑA
    # ==========================================

    @app.post(
        "/api/recuperar-contrasena/cambiar"
    )
    def cambiar_contrasena():

        error = revisar_csrf()

        if error:
            return error

        datos = (
            request.get_json(silent=True)
            or {}
        )

        contrasena = (
            datos.get("contrasena")
            if isinstance(datos, dict)
            else None
        )

        confirmar = (
            datos.get("confirmar")
            if isinstance(datos, dict)
            else None
        )

        if (
            not isinstance(contrasena, str)
            or not 8 <= len(contrasena) <= 128
            or contrasena != confirmar
        ):

            return jsonify({
                "mensaje": (
                    "Usa una contraseña "
                    "de 8 a 128 caracteres "
                    "y confírmala correctamente."
                )
            }), 400

        correo = session.get(
            "rc_correo"
        )

        token = session.get(
            "rc_token"
        )

        if (
            not correo
            or not isinstance(token, str)
        ):

            return jsonify({
                "mensaje": (
                    "Primero verifica "
                    "el código del correo."
                )
            }), 403

        conexion = None
        cursor = None

        try:

            conexion = conectar_db()

            cursor = conexion.cursor(
                dictionary=True
            )

            cursor.execute(
                """
                SELECT
                    id_usuario,
                    token_hash,
                    token_expira
                FROM recuperacion_contrasenas
                WHERE correo = %s
                FOR UPDATE
                """,
                (correo,)
            )

            fila = cursor.fetchone()

            recibido = hashlib.sha256(
                token.encode()
            ).hexdigest()

            if (
                not fila
                or not fila["id_usuario"]
                or not fila["token_hash"]
                or not fila["token_expira"]
                or fila["token_expira"] <= ahora()
                or not secrets.compare_digest(
                    fila["token_hash"],
                    recibido
                )
            ):

                return jsonify({
                    "mensaje": (
                        "La verificación ha vencido. "
                        "Solicita un código nuevo."
                    )
                }), 403

            # Actualizar contraseña de usuario.

            cursor.execute(
                """
                UPDATE usuarios
                SET contrasena = %s
                WHERE id_usuario = %s
                  AND correo = %s
                """,
                (
                    generate_password_hash(
                        contrasena
                    ),
                    fila["id_usuario"],
                    correo
                )
            )

            if cursor.rowcount != 1:

                conexion.rollback()

                return jsonify({
                    "mensaje": (
                        "No pudimos actualizar "
                        "la cuenta."
                    )
                }), 409

            # Invalidar el permiso temporal.

            cursor.execute(
                """
                UPDATE recuperacion_contrasenas
                SET
                    codigo_hash = NULL,
                    codigo_expira = NULL,
                    intentos = 0,
                    token_hash = NULL,
                    token_expira = NULL
                WHERE correo = %s
                """,
                (correo,)
            )

            conexion.commit()

            # El usuario deberá iniciar sesión
            # con su nueva contraseña.

            session.clear()

            return jsonify({
                "mensaje": (
                    "Contraseña actualizada. "
                    "Inicia sesión con la nueva."
                ),
                "redirigir": url_for("inicio")
            })

        except Error:

            if conexion:
                conexion.rollback()

            app.logger.exception(
                "Error cambiando contraseña"
            )

            return jsonify({
                "mensaje": (
                    "No pudimos guardar "
                    "la contraseña."
                )
            }), 500

        finally:
            cerrar(cursor, conexion)
