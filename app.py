
import os
import re
from datetime import date, datetime
from functools import wraps

from flask import (
    Flask,
    render_template,
    request,
    jsonify,
    redirect,
    url_for,
    session
)

from werkzeug.security import (
    generate_password_hash,
    check_password_hash
)

from mysql.connector import Error, IntegrityError
from conexion import conectar_db


# ==========================================
# CONFIGURACIÓN DE CONTIGO
# ==========================================

app = Flask(__name__)

SECRET_KEY = os.environ.get("SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError(
        "Configura SECRET_KEY antes de iniciar CONTIGO."
    )

app.config["SECRET_KEY"] = SECRET_KEY

app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"


# ==========================================
# FUNCIONES AUXILIARES
# ==========================================

def requiere_sesion(funcion):
    @wraps(funcion)
    def protegida(*args, **kwargs):
        if "id_usuario" not in session:
            if request.path.startswith("/api/"):
                return jsonify({
                    "mensaje": "Debes iniciar sesión."
                }), 401

            return redirect(url_for("inicio"))

        return funcion(*args, **kwargs)

    return protegida


def cerrar_conexion(cursor, conexion):
    if cursor is not None:
        cursor.close()

    if conexion is not None:
        conexion.close()


def validar_escrito(datos):
    if not isinstance(datos, dict):
        return None, None, "Datos inválidos."

    titulo = datos.get("titulo")
    contenido = datos.get("contenido")

    if not isinstance(titulo, str):
        return None, None, "El título no es válido."

    if not isinstance(contenido, str):
        return None, None, "El contenido no es válido."

    titulo = titulo.strip()
    contenido = contenido.strip()

    if not titulo or not contenido:
        return None, None, (
            "Debes escribir un título y un contenido."
        )

    if len(titulo) > 150:
        return None, None, (
            "El título no puede superar 150 caracteres."
        )

    return titulo, contenido, None


# ==========================================
# PANTALLA DE INICIO DE SESIÓN
# ==========================================

@app.route("/")
def inicio():
    if "id_usuario" in session:
        return redirect(url_for("pantalla_inicio"))

    return render_template("login.html")


# ==========================================
# PANTALLA DE REGISTRO
# ==========================================

@app.route("/registro")
def registro():
    return render_template("registro.html")


# ==========================================
# API: REGISTRAR USUARIO
# ==========================================

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

    if not nombre or not correo:
        return jsonify({
            "mensaje": "Completa los campos obligatorios."
        }), 400

    if len(nombre) > 100 or len(correo) > 150:
        return jsonify({
            "mensaje": "Revisa tu nombre y correo."
        }), 400

    if not re.fullmatch(
        r"[^@\s]+@[^@\s]+\.[^@\s]+",
        correo
    ):
        return jsonify({
            "mensaje": "Ingresa un correo válido."
        }), 400

    if not isinstance(contrasena, str):
        return jsonify({
            "mensaje": "Ingresa una contraseña válida."
        }), 400

    if not isinstance(confirmar, str):
        return jsonify({
            "mensaje": "Confirma tu contraseña."
        }), 400

    if len(contrasena) < 8 or len(contrasena) > 128:
        return jsonify({
            "mensaje": (
                "La contraseña debe tener entre "
                "8 y 128 caracteres."
            )
        }), 400

    if contrasena != confirmar:
        return jsonify({
            "mensaje": "Las contraseñas no coinciden."
        }), 400

    fecha_nacimiento = None

    if fecha_texto:
        try:
            fecha_nacimiento = datetime.strptime(
                fecha_texto,
                "%Y-%m-%d"
            ).date()

            if fecha_nacimiento > date.today():
                return jsonify({
                    "mensaje": "La fecha no puede ser futura."
                }), 400

        except (ValueError, TypeError):
            return jsonify({
                "mensaje": "Fecha de nacimiento inválida."
            }), 400

    contrasena_segura = generate_password_hash(
        contrasena
    )

    conexion = None
    cursor = None

    try:
        conexion = conectar_db()
        cursor = conexion.cursor()

        cursor.execute("""
            INSERT INTO usuarios
            (
                nombre,
                correo,
                contrasena,
                fecha_nacimiento
            )
            VALUES (%s, %s, %s, %s)
        """, (
            nombre,
            correo,
            contrasena_segura,
            fecha_nacimiento
        ))

        conexion.commit()

        return jsonify({
            "mensaje": "¡Tu cuenta fue creada correctamente!"
        }), 201

    except IntegrityError as error:
        if error.errno == 1062:
            return jsonify({
                "mensaje": "Este correo ya está registrado."
            }), 409

        app.logger.exception("Error de integridad")
        return jsonify({
            "mensaje": "No se pudo completar el registro."
        }), 500

    except Error:
        app.logger.exception("Error al registrar usuario")
        return jsonify({
            "mensaje": "No pudimos guardar tu registro."
        }), 500

    finally:
        cerrar_conexion(cursor, conexion)


# ==========================================
# API: INICIAR SESIÓN
# ==========================================

@app.route("/api/login", methods=["POST"])
def iniciar_sesion():

    datos = request.get_json(silent=True)

    if not isinstance(datos, dict):
        return jsonify({
            "mensaje": "Datos inválidos."
        }), 400

    correo = str(datos.get("correo") or "").strip().lower()
    contrasena = datos.get("contrasena")

    if not correo or not isinstance(contrasena, str):
        return jsonify({
            "mensaje": "Ingresa tu correo y contraseña."
        }), 400

    conexion = None
    cursor = None

    try:
        conexion = conectar_db()
        cursor = conexion.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                id_usuario,
                nombre,
                correo,
                contrasena
            FROM usuarios
            WHERE correo = %s
        """, (correo,))

        usuario = cursor.fetchone()

        if not usuario:
            return jsonify({
                "mensaje": "Correo o contraseña incorrectos."
            }), 401

        if not check_password_hash(
            usuario["contrasena"],
            contrasena
        ):
            return jsonify({
                "mensaje": "Correo o contraseña incorrectos."
            }), 401

        # Guardar la sesión del usuario
        session.clear()

        session["id_usuario"] = usuario["id_usuario"]
        session["nombre"] = usuario["nombre"]

        return jsonify({
            "mensaje": "¡Bienvenido a CONTIGO!",
            "redirigir": url_for("pantalla_inicio")
        }), 200

    except Error:
        app.logger.exception("Error al iniciar sesión")
        return jsonify({
            "mensaje": "No pudimos iniciar sesión."
        }), 500

    finally:
        cerrar_conexion(cursor, conexion)


# ==========================================
# CERRAR SESIÓN
# ==========================================

@app.route("/logout")
@requiere_sesion
def cerrar_sesion():
    session.clear()
    return redirect(url_for("inicio"))


# ==========================================
# PANTALLA PRINCIPAL DE CONTIGO
# ==========================================

@app.route("/inicio")
@requiere_sesion
def pantalla_inicio():

    nombre = session.get("nombre", "Usuario")

    return render_template(
        "inicio.html",
        nombre=nombre
    )


# ==========================================
# MI DIARIO: CONSULTAR ESCRITOS
# ==========================================

@app.route("/diario")
@requiere_sesion
def diario():

    id_usuario = session["id_usuario"]
    nombre = session.get("nombre", "Usuario")

    conexion = None
    cursor = None

    try:
        conexion = conectar_db()
        cursor = conexion.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                id_entrada,
                titulo,
                contenido,
                fecha_hora
            FROM diario
            WHERE id_usuario = %s
            ORDER BY fecha_hora DESC, id_entrada DESC
        """, (id_usuario,))

        escritos = cursor.fetchall()

        return render_template(
            "diario.html",
            nombre=nombre,
            escritos=escritos
        )

    except Error:
        app.logger.exception("Error al consultar diario")

        return (
            "No pudimos cargar tu diario. "
            "Intenta nuevamente.",
            500
        )

    finally:
        cerrar_conexion(cursor, conexion)


# ==========================================
# PANTALLA: NUEVO ESCRITO
# ==========================================

@app.route("/diario/nuevo")
@requiere_sesion
def nuevo_escrito():

    nombre = session.get("nombre", "Usuario")

    return render_template(
        "nuevo_escrito.html",
        nombre=nombre
    )


# ==========================================
# API: GUARDAR NUEVO ESCRITO
# ==========================================

@app.route("/api/diario", methods=["POST"])
@requiere_sesion
def guardar_escrito():

    datos = request.get_json(silent=True)

    titulo, contenido, error = validar_escrito(datos)

    if error:
        return jsonify({
            "mensaje": error
        }), 400

    id_usuario = session["id_usuario"]

    conexion = None
    cursor = None

    try:
        conexion = conectar_db()
        cursor = conexion.cursor()

        cursor.execute("""
            INSERT INTO diario
            (
                id_usuario,
                titulo,
                contenido
            )
            VALUES (%s, %s, %s)
        """, (
            id_usuario,
            titulo,
            contenido
        ))

        conexion.commit()

        return jsonify({
            "mensaje": "¡Tu escrito se guardó correctamente!"
        }), 201

    except Error:
        app.logger.exception("Error al guardar escrito")
        return jsonify({
            "mensaje": "No pudimos guardar tu escrito."
        }), 500

    finally:
        cerrar_conexion(cursor, conexion)


# ==========================================
# API: CONSULTAR UN ESCRITO COMPLETO
# ==========================================

@app.route("/api/diario/<int:id_entrada>", methods=["GET"])
@requiere_sesion
def consultar_escrito(id_entrada):

    id_usuario = session["id_usuario"]

    conexion = None
    cursor = None

    try:
        conexion = conectar_db()
        cursor = conexion.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                id_entrada,
                titulo,
                contenido
            FROM diario
            WHERE id_entrada = %s
              AND id_usuario = %s
        """, (
            id_entrada,
            id_usuario
        ))

        escrito = cursor.fetchone()

        if not escrito:
            return jsonify({
                "mensaje": "No se encontró el escrito."
            }), 404

        return jsonify(escrito), 200

    except Error:
        app.logger.exception("Error al consultar escrito")
        return jsonify({
            "mensaje": "No pudimos consultar el escrito."
        }), 500

    finally:
        cerrar_conexion(cursor, conexion)


# ==========================================
# API: EDITAR ESCRITO
# ==========================================

@app.route("/api/diario/<int:id_entrada>", methods=["PUT"])
@requiere_sesion
def editar_escrito(id_entrada):

    datos = request.get_json(silent=True)

    titulo, contenido, error = validar_escrito(datos)

    if error:
        return jsonify({
            "mensaje": error
        }), 400

    id_usuario = session["id_usuario"]

    conexion = None
    cursor = None

    try:
        conexion = conectar_db()
        cursor = conexion.cursor()

        # Comprobar que el escrito pertenece al usuario
        cursor.execute("""
            SELECT id_entrada
            FROM diario
            WHERE id_entrada = %s
              AND id_usuario = %s
        """, (
            id_entrada,
            id_usuario
        ))

        if not cursor.fetchone():
            return jsonify({
                "mensaje": "No se encontró el escrito."
            }), 404

        cursor.execute("""
            UPDATE diario
            SET
                titulo = %s,
                contenido = %s
            WHERE id_entrada = %s
              AND id_usuario = %s
        """, (
            titulo,
            contenido,
            id_entrada,
            id_usuario
        ))

        conexion.commit()

        return jsonify({
            "mensaje": "¡Escrito actualizado correctamente!"
        }), 200

    except Error:
        app.logger.exception("Error al editar escrito")
        return jsonify({
            "mensaje": "No pudimos actualizar el escrito."
        }), 500

    finally:
        cerrar_conexion(cursor, conexion)


# ==========================================
# API: ELIMINAR ESCRITO
# ==========================================

@app.route("/api/diario/<int:id_entrada>", methods=["DELETE"])
@requiere_sesion
def eliminar_escrito(id_entrada):

    id_usuario = session["id_usuario"]

    conexion = None
    cursor = None

    try:
        conexion = conectar_db()
        cursor = conexion.cursor()

        cursor.execute("""
            DELETE FROM diario
            WHERE id_entrada = %s
              AND id_usuario = %s
        """, (
            id_entrada,
            id_usuario
        ))

        if cursor.rowcount == 0:
            return jsonify({
                "mensaje": "No se encontró el escrito."
            }), 404

        conexion.commit()

        return jsonify({
            "mensaje": "Escrito eliminado correctamente."
        }), 200

    except Error:
        app.logger.exception("Error al eliminar escrito")
        return jsonify({
            "mensaje": "No pudimos eliminar el escrito."
        }), 500

    finally:
        cerrar_conexion(cursor, conexion)


# ==========================================
# MENÚS PENDIENTES DE IMPLEMENTAR
# ==========================================

@app.route("/ian")
@requiere_sesion
def ian():
    return (
        "Compañero emocional IAN: "
        "pantalla pendiente de implementar."
    )


@app.route("/constelacion")
@requiere_sesion
def constelacion():
    return (
        "Constelación de Bienestar: "
        "pantalla pendiente de implementar."
    )


@app.route("/red-apoyo")
@requiere_sesion
def red_apoyo():
    return (
        "Red de Apoyo: "
        "pantalla pendiente de implementar."
    )


@app.route("/perfil")
@requiere_sesion
def perfil():
    return (
        "Perfil: pantalla pendiente de implementar."
    )


@app.route("/notificaciones")
@requiere_sesion
def notificaciones():
    return (
        "Notificaciones: "
        "pantalla pendiente de implementar."
    )


@app.route("/configuracion")
@requiere_sesion
def configuracion():
    return (
        "Configuración: "
        "pantalla pendiente de implementar."
    )


# ==========================================
# EJECUTAR CONTIGO
# ==========================================

if __name__ == "__main__":
    app.run(debug=True)
