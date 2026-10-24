
import os
from datetime import date, datetime
from functools import wraps

from flask import (
    Flask, render_template, request,
    jsonify, session, redirect, url_for
)
from werkzeug.security import (
    generate_password_hash,
    check_password_hash
)
from mysql.connector import IntegrityError, Error
from conexion import conectar_db

app = Flask(__name__)

# Clave necesaria para proteger las sesiones.
# Se configura mediante una variable de entorno.
app.secret_key = os.environ.get("SECRET_KEY")

if not app.secret_key:
    raise RuntimeError(
        "Configura SECRET_KEY antes de iniciar Flask."
    )

app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax"
)


# Proteger las pantallas privadas
def login_requerido(funcion):
    @wraps(funcion)
    def decorador(*args, **kwargs):
        if "id_usuario" not in session:
            return redirect(url_for("inicio"))

        return funcion(*args, **kwargs)

    return decorador


# Pantalla de inicio de sesión
@app.route("/")
def inicio():
    if "id_usuario" in session:
        return redirect(url_for("pantalla_inicio"))

    return render_template("login.html")


# Pantalla de registro
@app.route("/registro")
def registro():
    return render_template("registro.html")


# Registrar usuarios
@app.route("/api/registro", methods=["POST"])
def guardar_registro():
    datos = request.get_json(silent=True)

    if not isinstance(datos, dict):
        return jsonify({
            "mensaje": "Los datos enviados no son válidos."
        }), 400

    nombre = str(datos.get("nombre") or "").strip()
    correo = str(datos.get("correo") or "").strip().lower()
    contrasena = datos.get("contrasena")
    confirmar = datos.get("confirmar_contrasena")
    fecha_texto = datos.get("fecha_nacimiento") or None

    if not isinstance(contrasena, str) or not isinstance(confirmar, str):
        return jsonify({
            "mensaje": "Ingresa una contraseña válida."
        }), 400

    if not nombre or not correo or not contrasena:
        return jsonify({
            "mensaje": "Completa los campos obligatorios."
        }), 400

    if len(nombre) > 100 or len(correo) > 150 or "@" not in correo:
        return jsonify({
            "mensaje": "Revisa tu nombre y correo."
        }), 400

    if len(contrasena) < 8 or len(contrasena) > 128:
        return jsonify({
            "mensaje": "La contraseña debe tener entre 8 y 128 caracteres."
        }), 400

    if contrasena != confirmar:
        return jsonify({
            "mensaje": "Las contraseñas no coinciden."
        }), 400

    fecha_nacimiento = None

    if fecha_texto:
        try:
            fecha_nacimiento = datetime.strptime(
                fecha_texto, "%Y-%m-%d"
            ).date()

            if fecha_nacimiento > date.today():
                return jsonify({
                    "mensaje": "La fecha no puede ser futura."
                }), 400

        except (ValueError, TypeError):
            return jsonify({
                "mensaje": "Fecha de nacimiento inválida."
            }), 400

    contrasena_segura = generate_password_hash(contrasena)

    conexion = None
    cursor = None

    try:
        conexion = conectar_db()
        cursor = conexion.cursor()

        consulta = """
            INSERT INTO usuarios
            (nombre, correo, contrasena, fecha_nacimiento)
            VALUES (%s, %s, %s, %s)
        """

        cursor.execute(
            consulta,
            (nombre, correo, contrasena_segura, fecha_nacimiento)
        )

        conexion.commit()

        return jsonify({
            "mensaje": "¡Tu cuenta fue creada correctamente!"
        }), 201

    except IntegrityError as error:
        if error.errno == 1062:
            return jsonify({
                "mensaje": "Este correo ya está registrado."
            }), 409

        app.logger.exception("Error de integridad en registro")
        return jsonify({
            "mensaje": "No se pudo completar el registro."
        }), 500

    except Error:
        app.logger.exception("Error de base de datos")
        return jsonify({
            "mensaje": "No pudimos guardar tu registro. Intenta nuevamente."
        }), 500

    finally:
        if cursor is not None:
            cursor.close()

        if conexion is not None:
            conexion.close()


# Iniciar sesión
@app.route("/api/login", methods=["POST"])
def iniciar_sesion():
    datos = request.get_json(silent=True)

    if not isinstance(datos, dict):
        return jsonify({
            "mensaje": "Datos inválidos."
        }), 400

    correo = str(datos.get("correo") or "").strip().lower()
    contrasena = datos.get("contrasena")

    if not correo or not isinstance(contrasena, str) or not contrasena:
        return jsonify({
            "mensaje": "Ingresa tu correo y contraseña."
        }), 400

    conexion = None
    cursor = None

    try:
        conexion = conectar_db()
        cursor = conexion.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT id_usuario, nombre, correo, contrasena, rol
            FROM usuarios
            WHERE correo = %s
            """,
            (correo,)
        )

        usuario = cursor.fetchone()

        if not usuario or not check_password_hash(
            usuario["contrasena"], contrasena
        ):
            return jsonify({
                "mensaje": "Correo o contraseña incorrectos."
            }), 401

        session.clear()
        session["id_usuario"] = usuario["id_usuario"]
        session["nombre"] = usuario["nombre"]
        session["rol"] = usuario["rol"]

        return jsonify({
            "mensaje": "¡Bienvenido a CONTIGO!",
            "url": url_for("pantalla_inicio")
        }), 200

    except Error:
        app.logger.exception("Error al iniciar sesión")
        return jsonify({
            "mensaje": "No pudimos iniciar sesión. Intenta nuevamente."
        }), 500

    finally:
        if cursor is not None:
            cursor.close()

        if conexion is not None:
            conexion.close()


# Pantalla principal protegida
@app.route("/inicio")
@login_requerido
def pantalla_inicio():
    return render_template(
        "inicio.html",
        nombre=session["nombre"]
    )


# Cerrar sesión
@app.route("/cerrar-sesion", methods=["POST"])
@login_requerido
def cerrar_sesion():
    session.clear()

    return jsonify({
        "mensaje": "Sesión cerrada correctamente.",
        "url": url_for("inicio")
    }), 200


if __name__ == "__main__":
    app.run(debug=True)
