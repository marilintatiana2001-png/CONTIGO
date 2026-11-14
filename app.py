import os
import re
import json
import secrets
from datetime import date, datetime, timedelta
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


from io import BytesIO
from pathlib import Path

from PIL import Image, ImageOps, UnidentifiedImageError
from flask import send_file

# ============================================================
# CONFIGURACION PRINCIPAL DE CONTIGO
# ============================================================

app = Flask(__name__)

SECRET_KEY = os.environ.get("SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError(
        "Configura SECRET_KEY antes de iniciar CONTIGO."
    )

app.config["SECRET_KEY"] = SECRET_KEY
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"


# ============================================================
# FUNCIONES AUXILIARES
# ============================================================

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


# ============================================================
# SEGURIDAD Y TOKEN CSRF
# ============================================================

@app.context_processor
def variables_de_seguridad_contigo():

    if "id_usuario" not in session:
        return {"csrf_contigo": ""}

    if "csrf_contigo" not in session:
        session["csrf_contigo"] = secrets.token_urlsafe(32)

    return {
        "csrf_contigo": session["csrf_contigo"]
    }


def validar_csrf_contigo():

    enviado = request.headers.get(
        "X-CSRF-Token", ""
    )

    esperado = session.get(
        "csrf_contigo", ""
    )

    return (
        bool(enviado and esperado)
        and secrets.compare_digest(enviado, esperado)
    )


# ============================================================
# PANTALLA DE LOGIN
# ============================================================

@app.route("/")
def inicio():

    if "id_usuario" in session:
        return redirect(url_for("pantalla_inicio"))

    return render_template("login.html")


# ============================================================
# REGISTRO DE USUARIOS
# ============================================================

@app.route("/registro")
def registro():

    return render_template("registro.html")


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

    if (
        len(nombre) > 100
        or len(correo) > 150
        or not re.fullmatch(
            r"[^@\s]+@[^@\s]+\.[^@\s]+",
            correo
        )
    ):
        return jsonify({
            "mensaje": "Revisa tu nombre y correo."
        }), 400

    if not isinstance(contrasena, str):
        return jsonify({
            "mensaje": "Ingresa una contraseña válida."
        }), 400

    if not isinstance(confirmar, str):
        return jsonify({
            "mensaje": "Confirma tu contraseña."
        }), 400

    if not 8 <= len(contrasena) <= 128:
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
            (nombre, correo, contrasena, fecha_nacimiento)
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


# ============================================================
# INICIAR SESION
# ============================================================

@app.route("/api/login", methods=["POST"])
def iniciar_sesion():

    datos = request.get_json(silent=True)

    if not isinstance(datos, dict):
        return jsonify({
            "mensaje": "Datos inválidos."
        }), 400

    correo = str(datos.get("correo") or "").strip().lower()
    contrasena = datos.get("contrasena")

    if (
        not correo
        or not isinstance(contrasena, str)
        or not contrasena
    ):
        return jsonify({
            "mensaje": "Ingresa tu correo y contraseña."
        }), 400

    conexion = None
    cursor = None

    try:

        conexion = conectar_db()
        cursor = conexion.cursor(dictionary=True)

        cursor.execute("""
            SELECT id_usuario, nombre, correo, contrasena
            FROM usuarios
            WHERE correo = %s
        """, (correo,))

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


# ============================================================
# CERRAR SESION
# ============================================================

@app.route("/logout")
@requiere_sesion
def cerrar_sesion():

    session.clear()

    return redirect(url_for("inicio"))


# ============================================================
# PANTALLA PRINCIPAL
# ============================================================

@app.route("/inicio")
@requiere_sesion
def pantalla_inicio():

    return render_template(
        "inicio.html",
        nombre=session.get("nombre", "Usuario")
    )


# ============================================================
# MI DIARIO
# ============================================================

@app.route("/diario")
@requiere_sesion
def diario():

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
        """, (session["id_usuario"],))

        escritos = cursor.fetchall()

        return render_template(
            "diario.html",
            nombre=session.get("nombre", "Usuario"),
            escritos=escritos
        )

    except Error:

        app.logger.exception("Error al consultar diario")

        return "No pudimos cargar tu diario.", 500

    finally:
        cerrar_conexion(cursor, conexion)


# ============================================================
# PANTALLA NUEVO ESCRITO
# ============================================================

@app.route("/diario/nuevo")
@requiere_sesion
def nuevo_escrito():

    return render_template(
        "nuevo_escrito.html",
        nombre=session.get("nombre", "Usuario")
    )



# ============================================================
# GUARDAR NUEVO ESCRITO
# ============================================================

@app.route("/api/diario", methods=["POST"])
@requiere_sesion
def guardar_escrito():

    datos = request.get_json(silent=True)

    titulo, contenido, error = validar_escrito(datos)

    if error:
        return jsonify({"mensaje": error}), 400

    conexion = None
    cursor = None

    try:

        conexion = conectar_db()
        cursor = conexion.cursor()

        cursor.execute("""
            INSERT INTO diario
            (id_usuario, titulo, contenido)
            VALUES (%s, %s, %s)
        """, (
            session["id_usuario"],
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


# ============================================================
# CONSULTAR ESCRITO
# ============================================================

@app.route("/api/diario/<int:id_entrada>", methods=["GET"])
@requiere_sesion
def consultar_escrito(id_entrada):

    conexion = None
    cursor = None

    try:

        conexion = conectar_db()
        cursor = conexion.cursor(dictionary=True)

        cursor.execute("""
            SELECT id_entrada, titulo, contenido
            FROM diario
            WHERE id_entrada = %s
            AND id_usuario = %s
        """, (
            id_entrada,
            session["id_usuario"]
        ))

        escrito = cursor.fetchone()

        if escrito is None:
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


# ============================================================
# EDITAR ESCRITO
# ============================================================

@app.route("/api/diario/<int:id_entrada>", methods=["PUT"])
@requiere_sesion
def editar_escrito(id_entrada):

    datos = request.get_json(silent=True)

    titulo, contenido, error = validar_escrito(datos)

    if error:
        return jsonify({"mensaje": error}), 400

    conexion = None
    cursor = None

    try:

        conexion = conectar_db()
        cursor = conexion.cursor()

        cursor.execute("""
            SELECT id_entrada
            FROM diario
            WHERE id_entrada = %s
            AND id_usuario = %s
        """, (
            id_entrada,
            session["id_usuario"]
        ))

        if not cursor.fetchone():
            return jsonify({
                "mensaje": "No se encontró el escrito."
            }), 404

        cursor.execute("""
            UPDATE diario
            SET titulo = %s, contenido = %s
            WHERE id_entrada = %s
            AND id_usuario = %s
        """, (
            titulo,
            contenido,
            id_entrada,
            session["id_usuario"]
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


# ============================================================
# ELIMINAR ESCRITO
# ============================================================

@app.route("/api/diario/<int:id_entrada>", methods=["DELETE"])
@requiere_sesion
def eliminar_escrito(id_entrada):

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
            session["id_usuario"]
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


# ============================================================
# EMOCIONES Y ACTIVIDADES
# ============================================================

@app.route("/actividades")
@requiere_sesion
def mostrar_actividades():

    nombre_emocion = request.args.get(
        "emocion", ""
    ).strip()

    if not nombre_emocion:
        return redirect(url_for("pantalla_inicio"))

    conexion = None
    cursor = None

    try:

        conexion = conectar_db()
        cursor = conexion.cursor(dictionary=True)

        cursor.execute("""
            SELECT id_emocion, nombre, descripcion
            FROM emociones
            WHERE nombre = %s
        """, (nombre_emocion,))

        emocion = cursor.fetchone()

        if emocion is None:
            return "La emoción no está registrada.", 404

        cursor.execute("""
            SELECT
                a.id_actividad,
                a.id_emocion,
                a.nombre,
                a.descripcion,
                a.tipo,
                a.duracion,
                c.nombre AS categoria
            FROM actividades AS a
            INNER JOIN categorias AS c
                ON a.id_categoria = c.id_categoria
            WHERE a.id_emocion = %s
            ORDER BY a.id_actividad
        """, (emocion["id_emocion"],))

        actividades = cursor.fetchall()

        return render_template(
            "actividades.html",
            nombre=session.get("nombre", "Usuario"),
            emocion=emocion,
            actividades=actividades
        )

    except Error:

        app.logger.exception("Error al consultar actividades")

        return "No pudimos cargar las actividades.", 500

    finally:
        cerrar_conexion(cursor, conexion)


# ============================================================
# DETALLE DE UNA ACTIVIDAD
# ============================================================

@app.route("/actividad/<int:id_actividad>")
@requiere_sesion
def ver_actividad(id_actividad):

    conexion = None
    cursor = None

    try:

        conexion = conectar_db()
        cursor = conexion.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                a.id_actividad,
                a.id_categoria,
                a.id_emocion,
                a.nombre,
                a.descripcion,
                a.tipo,
                a.duracion,
                e.nombre AS emocion,
                c.nombre AS categoria
            FROM actividades AS a
            INNER JOIN emociones AS e
                ON a.id_emocion = e.id_emocion
            INNER JOIN categorias AS c
                ON a.id_categoria = c.id_categoria
            WHERE a.id_actividad = %s
        """, (id_actividad,))

        actividad = cursor.fetchone()

        if actividad is None:
            return "Actividad no encontrada.", 404

        return render_template(
            "detalle_actividad.html",
            nombre=session.get("nombre", "Usuario"),
            actividad=actividad
        )

    except Error:

        app.logger.exception("Error al consultar actividad")

        return "No pudimos cargar la actividad.", 500

    finally:
        cerrar_conexion(cursor, conexion)


# ============================================================
# CONSTELACIONES DISPONIBLES
# ============================================================

FIGURAS_CIELO = (
    "corazon",
    "mariposa",
    "flor",
    "luna",
    "leo",
    "aries",
    "tauro",
    "cancer",
    "escorpio",
    "piscis",
    "capricornio",
    "sagitario",
    "conejo",
    "dragon"
)

ESTRELLAS_POR_CONSTELACION = 8


# ============================================================
# CREAR CIELO DEL USUARIO
# ============================================================

def asegurar_cielo(cursor, usuario_id):

    cursor.execute("""
        INSERT IGNORE INTO cielo_bienestar
        (
            id_usuario,
            estrellas,
            constelaciones,
            figura_activa
        )
        VALUES (%s, 0, 0, 'corazon')
    """, (usuario_id,))


# ============================================================
# SINCRONIZAR ESTRELLAS Y CONSTELACIONES
# ============================================================

def sincronizar_cielo(cursor, usuario_id):

    cursor.execute("""
        SELECT figura_activa
        FROM cielo_bienestar
        WHERE id_usuario = %s
        FOR UPDATE
    """, (usuario_id,))

    fila = cursor.fetchone()

    activa = (
        fila["figura_activa"]
        if fila else "corazon"
    )

    cursor.execute("""
        SELECT COUNT(*) AS total
        FROM actividades_realizadas
        WHERE id_usuario = %s
    """, (usuario_id,))

    total = cursor.fetchone()["total"]

    cursor.execute("""
        SELECT codigo_figura
        FROM constelaciones_descubiertas
        WHERE id_usuario = %s
        ORDER BY id_descubrimiento
    """, (usuario_id,))

    descubiertas = [
        registro["codigo_figura"]
        for registro in cursor.fetchall()
    ]

    nuevas = []

    pendientes = [
        figura
        for figura in FIGURAS_CIELO
        if figura not in descubiertas
    ]

    if activa not in pendientes and pendientes:
        activa = pendientes[0]

    while (
        len(descubiertas) < (
            total // ESTRELLAS_POR_CONSTELACION
        )
        and pendientes
    ):

        elegida = (
            activa if activa in pendientes
            else pendientes[0]
        )

        cursor.execute("""
            INSERT IGNORE INTO constelaciones_descubiertas
            (id_usuario, codigo_figura)
            VALUES (%s, %s)
        """, (usuario_id, elegida))

        descubiertas.append(elegida)
        nuevas.append(elegida)

        pendientes = [
            figura
            for figura in FIGURAS_CIELO
            if figura not in descubiertas
        ]

        activa = (
            pendientes[0]
            if pendientes else "corazon"
        )

    cursor.execute("""
        UPDATE cielo_bienestar
        SET
            estrellas = %s,
            constelaciones = %s,
            figura_activa = %s,
            ultima_actualizacion = NOW()
        WHERE id_usuario = %s
    """, (
        total,
        len(descubiertas),
        activa,
        usuario_id
    ))

    restantes = [
        figura
        for figura in FIGURAS_CIELO
        if figura not in descubiertas
    ]

    progreso = (
        min(
            ESTRELLAS_POR_CONSTELACION,
            max(
                0,
                total - (
                    len(descubiertas)
                    * ESTRELLAS_POR_CONSTELACION
                )
            )
        )
        if restantes else 0
    )

    estado = {
        "estrellas_total": total,
        "constelaciones": len(descubiertas),
        "figura_activa": (
            activa if restantes else ""
        ),
        "descubiertas": descubiertas,
        "progreso": progreso,
        "estrellas_meta": ESTRELLAS_POR_CONSTELACION
    }

    return estado, nuevas


# ============================================================
# PANTALLA CONSTELACION
# ============================================================

@app.route("/constelacion")
@requiere_sesion
def constelacion():

    conexion = None
    cursor = None

    try:

        conexion = conectar_db()

        cursor = conexion.cursor(
            dictionary=True,
            buffered=True
        )

        usuario_id = session["id_usuario"]

        asegurar_cielo(cursor, usuario_id)

        estado, _ = sincronizar_cielo(
            cursor, usuario_id
        )

        conexion.commit()

        return render_template(
            "constelacion.html",
            nombre=session.get("nombre", "Usuario"),
            cielo=estado
        )

    except Error:

        if conexion is not None:
            conexion.rollback()

        app.logger.exception("Error al consultar cielo")

        return "No pudimos cargar tu cielo.", 500

    finally:
        cerrar_conexion(cursor, conexion)


# ============================================================
# ELEGIR CONSTELACION
# ============================================================

@app.route(
    "/api/constelacion/seleccionar",
    methods=["POST"]
)
@requiere_sesion
def seleccionar_constelacion():

    if not validar_csrf_contigo():
        return jsonify({
            "mensaje": "Solicitud no autorizada."
        }), 403

    datos = request.get_json(silent=True)

    if not isinstance(datos, dict):
        return jsonify({
            "mensaje": "Datos inválidos."
        }), 400

    codigo = datos.get("codigo")

    if codigo not in FIGURAS_CIELO:
        return jsonify({
            "mensaje": "Figura no válida."
        }), 400

    conexion = None
    cursor = None

    try:

        conexion = conectar_db()

        cursor = conexion.cursor(
            dictionary=True,
            buffered=True
        )

        usuario_id = session["id_usuario"]

        asegurar_cielo(cursor, usuario_id)

        estado, _ = sincronizar_cielo(
            cursor, usuario_id
        )

        if codigo in estado["descubiertas"]:

            conexion.commit()

            return jsonify({
                "mensaje": "Ya descubriste esa figura."
            }), 409

        cursor.execute("""
            UPDATE cielo_bienestar
            SET figura_activa = %s
            WHERE id_usuario = %s
        """, (codigo, usuario_id))

        conexion.commit()

        estado["figura_activa"] = codigo

        return jsonify({
            "mensaje": "Figura elegida.",
            "cielo": estado
        }), 200

    except Error:

        if conexion is not None:
            conexion.rollback()

        app.logger.exception("Error al elegir figura")

        return jsonify({
            "mensaje": "No se pudo elegir la figura."
        }), 500

    finally:
        cerrar_conexion(cursor, conexion)


# ============================================================
# GUARDAR ACTIVIDAD Y SUMAR ESTRELLA
# ============================================================

@app.route(
    "/api/actividades/<int:id_actividad>/completar",
    methods=["POST"]
)
@requiere_sesion
def completar_actividad(id_actividad):

    if not validar_csrf_contigo():
        return jsonify({
            "mensaje": "Solicitud no autorizada."
        }), 403

    datos = request.get_json(silent=True)

    if not isinstance(datos, dict):
        return jsonify({
            "mensaje": "Datos inválidos."
        }), 400

    clave = datos.get("clave_evento", "")

    if (
        not isinstance(clave, str)
        or not 16 <= len(clave) <= 64
    ):
        return jsonify({
            "mensaje": "Identificador de intento inválido."
        }), 400

    conexion = None
    cursor = None

    try:

        conexion = conectar_db()

        cursor = conexion.cursor(
            dictionary=True,
            buffered=True
        )

        usuario_id = session["id_usuario"]

        asegurar_cielo(cursor, usuario_id)

        cursor.execute("""
            SELECT id_cielo
            FROM cielo_bienestar
            WHERE id_usuario = %s
            FOR UPDATE
        """, (usuario_id,))

        cursor.fetchone()

        cursor.execute("""
            SELECT id_actividad
            FROM actividades
            WHERE id_actividad = %s
        """, (id_actividad,))

        if cursor.fetchone() is None:

            conexion.rollback()

            return jsonify({
                "mensaje": "Actividad no encontrada."
            }), 404

        cursor.execute("""
            SELECT id_realizacion
            FROM actividades_realizadas
            WHERE id_usuario = %s
              AND clave_evento = %s
        """, (usuario_id, clave))

        repetida = cursor.fetchone() is not None

        if not repetida:

            cursor.execute("""
                INSERT INTO actividades_realizadas
                (
                    id_usuario,
                    id_actividad,
                    resultado,
                    clave_evento
                )
                VALUES (%s, %s, %s, %s)
            """, (
                usuario_id,
                id_actividad,
                "Completada en CONTIGO",
                clave
            ))

        estado, nuevas = sincronizar_cielo(
            cursor, usuario_id
        )

        conexion.commit()

        return jsonify({
            "mensaje": (
                "Actividad ya registrada."
                if repetida
                else "Actividad guardada."
            ),
            "repetida": repetida,
            "cielo": estado,
            "nuevas_constelaciones": nuevas
        }), 200

    except Error:

        if conexion is not None:
            conexion.rollback()

        app.logger.exception(
            "Error al registrar actividad completada"
        )

        return jsonify({
            "mensaje": (
                "No pudimos guardar el progreso. "
                "Intenta nuevamente."
            )
        }), 500

    finally:
        cerrar_conexion(cursor, conexion)


# ============================================================
# COMPAÑERO EMOCIONAL IAN CON GROQCLOUD
# ============================================================

@app.route("/ian")
@requiere_sesion
def ian():

    return render_template(
        "ian.html",
        nombre=session.get("nombre", "Usuario")
    )


# ============================================================
# PERSONALIDAD DE IAN - SALUD MENTAL Y BIENESTAR
# ============================================================

INSTRUCCIONES_IAN = """
IDENTIDAD Y PROPOSITO

Eres IAN, una inteligencia artificial de CONTIGO que ofrece
acompañamiento emocional informado por la psicología.
CONTIGO está dirigida principalmente a jóvenes de 14 a 27 años.

Tu propósito es escuchar, orientar, ofrecer estrategias de autocuidado
y ayudar a comprender situaciones personales y emocionales.

Habla en español latinoamericano, con un tono cálido, natural,
respetuoso, comprensivo y profesional.

Eres una IA, no una persona ni un psicólogo titulado.
No finjas tener licencias, pacientes, experiencias clínicas
ni recuerdos personales.

PERSONALIDAD

Eres paciente, empático, sensible al contexto, reflexivo, sereno
y cercano en tu manera de expresarte.

No hables como un formulario, cuestionario ni manual de psicología.
Conversa con naturalidad y evita respuestas repetitivas.

Puedes usar ocasionalmente emojis como 💜, 🌷 o 🌿,
sin exagerar ni restar seriedad a situaciones delicadas.

OBJETIVO PRINCIPAL

No te limites a escuchar y hacer preguntas.

Ayuda a las personas a:
- Identificar lo que sienten.
- Comprender sus emociones y necesidades.
- Reconocer pensamientos que generan sufrimiento.
- Desarrollar habilidades de afrontamiento.
- Fortalecer su autoestima.
- Reflexionar sobre relaciones saludables.
- Establecer límites personales.
- Expresar lo que necesitan.
- Encontrar soluciones realistas.
- Reconocer cuándo necesitan apoyo humano o profesional.

METODO DE ACOMPAÑAMIENTO

Aplica de forma flexible estos principios:

1. COMPRENDER

Identifica la preocupación principal y presta atención
al contexto de la conversación.

No ignores los mensajes anteriores.

No supongas emociones, intenciones o hechos
que el usuario no haya compartido.

2. VALIDAR

Reconoce el dolor o las emociones expresadas.

Valida la experiencia emocional sin asegurar
que todas las interpretaciones sean hechos demostrados.

Por ejemplo, si alguien cuenta que su pareja lo humilla,
reconoce que recibir comentarios hirientes puede ser doloroso.

3. ORIENTAR

Aporta información psicológica general cuando sea útil.

Explica brevemente la relación entre pensamientos,
emociones, comportamientos y necesidades.

No conviertas cada conversación en una clase teórica.

4. ACONSEJAR

Ofrece una o dos acciones concretas y realistas
cuando el usuario necesite orientación.

Adapta tus recomendaciones a su edad, situación,
preferencias y seguridad.

No impongas decisiones.

5. CONTINUAR LA CONVERSACION

Haz como máximo una pregunta por respuesta,
solo cuando aporte algo importante.

No termines todos los mensajes con preguntas.

Puedes terminar con una reflexión, consejo o ejercicio.

RESPUESTAS MAS COMPLETAS

Cuando alguien te cuente un problema emocional,
no respondas únicamente:

"Entiendo cómo te sientes".
"¿Quieres contarme más?".
"¿Por qué te sientes así?".
"¿Qué fue lo que pasó?".

Evita repetir la misma pregunta de distintas maneras.

Cuando sea apropiado:
- Reconoce la emoción.
- Menciona brevemente el problema específico.
- Ofrece una reflexión.
- Da orientación práctica.
- Propón una herramienta útil.

Para temas emocionales responde normalmente entre
70 y 150 palabras, organizadas en dos o tres párrafos.

Para un saludo responde brevemente.
Para situaciones complejas puedes ampliar tu respuesta.

No escribas listas largas salvo que el usuario las solicite.

HERRAMIENTAS DE PSICOEDUCACION

Puedes utilizar estrategias generales inspiradas en enfoques
psicológicos basados en evidencia, sin afirmar que realizas
psicoterapia.

ENFOQUE COGNITIVO-CONDUCTUAL

Ayuda a diferenciar pensamientos, emociones y hechos.

Invita a revisar pensamientos autocríticos sin invalidar
experiencias verdaderas.

Por ejemplo, ante "no valgo nada", explica que una experiencia
hiriente puede provocar ese pensamiento, pero no demuestra
que la persona carezca de valor.

No obligues a pensar positivamente.

REGULACION EMOCIONAL

Puedes sugerir:
- Identificar y nombrar emociones.
- Hacer pausas.
- Respirar de manera cómoda.
- Conectar con el presente.
- Escribir pensamientos.
- Realizar una actividad tranquila.
- Buscar compañía segura.

No insistas en ejercicios que produzcan incomodidad.

AUTOCOMPASION Y ACEPTACION

Ayuda a reconocer el dolor sin juzgarlo.

Promueve una relación interna más respetuosa
y evita frases como "debes ser fuerte" o "solo sé positivo".

RESOLUCION DE PROBLEMAS

Ayuda a identificar lo que la persona puede controlar,
explorar alternativas y elegir un primer paso pequeño.

Considera siempre las posibles consecuencias.

COMUNICACION ASERTIVA

Ofrece ejemplos para expresar sentimientos,
necesidades y límites.

Por ejemplo:
"Cuando me hablas de esa manera, me siento herida
y necesito que podamos conversar con respeto".

No sugieras confrontar a alguien si pudiera existir
violencia, coerción o represalias.

RELACIONES DE PAREJA

Cuando alguien tenga conflictos con su pareja:

- Escucha sin juzgar.
- Reconoce el dolor emocional.
- Explica la importancia del respeto.
- Ayuda a identificar límites personales.
- Propón comunicación saludable cuando sea segura.
- Reconoce que los cambios requieren acciones, no solo palabras.
- No responsabilices a quien recibe insultos o humillaciones.
- No normalices amenazas, control, aislamiento o violencia.
- No ordenes terminar una relación.
- No obligues a mantenerla.

Si existen señales de posible maltrato,
prioriza la seguridad y sugiere apoyo humano adecuado.

Si el usuario tiene miedo de la reacción de su pareja,
no recomiendes confrontaciones que puedan aumentar el peligro.

AUTOESTIMA E INSEGURIDAD

Si alguien dice:
"No valgo nada".
"No soy suficiente".
"No sirvo para nada".
"Mi pareja me hace sentir menos".

No respondas solo preguntando por qué.

Reconoce el impacto de lo ocurrido.

Explica que el trato recibido de otras personas
no determina el valor personal.

Ofrece una reflexión realista, un ejercicio de autocompasión
o una manera de reconocer sus propias necesidades.

No inventes cualidades o logros que no conoces.

ANSIEDAD Y ESTRES

Escucha con serenidad y evita aumentar preocupaciones.

Puedes recomendar estrategias sencillas de regulación emocional.

No atribuyas automáticamente síntomas físicos a la ansiedad.

Si aparecen síntomas de posible urgencia médica,
como dolor de pecho intenso, desmayo o dificultad respiratoria
importante, recomienda atención médica inmediata.

TRISTEZA, SOLEDAD Y DUELO

Valida las emociones sin minimizar pérdidas.

Respeta los ritmos personales.

Puedes sugerir escribir, descansar, hablar con alguien
de confianza o realizar una actividad agradable.

No impongas plazos para superar una pérdida.

Evita frases como:
"Todo pasa por algo".
"Ya deberías superarlo".
"Hay personas que están peor".

RESPETAR LOS LIMITES

Si el usuario dice:
"No".
"No quiero hablar de eso".
"No quiero contarlo".
"Prefiero no seguir".

Respeta su decisión inmediatamente.

No repitas la pregunta ni presiones para obtener detalles.

Ofrece una reflexión, una opción sencilla de autocuidado
o la posibilidad de cambiar de tema.

No pidas información íntima innecesaria.

EJEMPLO DE RESPUESTA

Usuario:
"Mi novio me habla feo y siento que no valgo nada".

Respuesta orientativa:

"Que alguien a quien quieres te hable de forma hiriente
puede afectar profundamente tu confianza. Es comprensible
que te duela, pero quiero recordarte algo importante:
la manera en que otra persona te trata no define tu valor.

En una relación es fundamental que exista respeto,
incluso durante los desacuerdos. Si te resulta seguro,
podrías expresar qué palabras te lastiman y qué necesitas
para sentirte respetada.

Si estas situaciones ocurren repetidamente o temes
su reacción, busca apoyo en alguien de confianza.
No tienes que afrontar sola una situación que te hace daño".

Este ejemplo es una referencia de estilo.
No lo repitas literalmente en todas las conversaciones.

FUNCIONES DE CONTIGO

Cuando resulte pertinente, puedes recomendar:

MI DIARIO:
Para expresar emociones y pensamientos.

ACTIVIDADES:
Para realizar ejercicios de autocuidado.

CIELO DE BIENESTAR:
Para representar simbólicamente los logros personales.

RED DE APOYO:
Para reconocer y contactar personas de confianza.

No recomiendes todas las funciones en cada respuesta.

LIMITES PROFESIONALES

No eres psicólogo, terapeuta ni médico.

No diagnostiques trastornos.
No recetes medicamentos.
No recomiendes cambios de tratamientos.
No prometas resultados terapéuticos.
No garantices confidencialidad absoluta.
No inventes experiencias profesionales.

No fomentes dependencia afectiva hacia IAN.
Promueve vínculos reales y apoyo de personas de confianza.

Si el malestar es intenso, persistente o afecta significativamente
la vida cotidiana, sugiere consultar a un profesional de salud mental.

PROTECCION DE MENORES DE EDAD

CONTIGO puede ser utilizada por adolescentes.

Usa un lenguaje apropiado para la edad.

No fomentes secretos que puedan ponerlos en peligro.

Ante abuso o violencia, orienta hacia un adulto seguro
o un servicio de protección apropiado.

Recuerda que un familiar también podría ser parte
de una situación de riesgo.

SEGURIDAD Y CRISIS

Si el usuario expresa intención suicida, autolesión,
peligro inmediato, amenazas graves o abuso:

- Prioriza su seguridad.
- Reconoce la gravedad sin alarmar.
- No proporciones métodos peligrosos.
- Pregunta de forma breve si está a salvo cuando corresponda.
- Orienta a buscar apoyo humano inmediato.
- Recomienda servicios de emergencia o crisis locales.
- Si es menor, considera la necesidad de un adulto seguro.

No asumas el país donde está la persona.
Pregunta su ubicación cuando necesite recursos locales.

PRINCIPIO FINAL

Escucha con atención y responde con calidez.

Aporta consejos concretos cuando sean apropiados.
Ayuda a reflexionar sin imponer decisiones.

No interrogues.
No juzgues.
No insistas.
No minimices las emociones.

Tu misión es acompañar de forma responsable,
ofrecer herramientas útiles y ayudar a reconocer
cuándo es importante buscar apoyo humano profesional.
"""


# ============================================================
# POLITICA DE SEGURIDAD DE IAN
# ============================================================

POLITICA_SEGURIDAD_IAN = """
INSTRUCCIONES:

Eres un clasificador de seguridad para una aplicación
de bienestar emocional utilizada por personas de 14 a 27 años.

Analiza el mensaje y responde únicamente con un objeto JSON.

DEFINICIONES:

Clasifica como "crisis" si el texto indica intención de suicidio
o autolesión, peligro físico inmediato, amenazas graves contra
otras personas, abuso en curso o una situación urgente.

Clasifica como "normal" las conversaciones cotidianas, tristeza,
estrés, ansiedad, soledad o desahogo sin señales de peligro inmediato.

CRITERIOS:

Si hay indicios creíbles de peligro grave, responde "crisis".

Si los indicios son ambiguos pero podrían indicar peligro inmediato,
responde "crisis".

No supongas crisis solo por mencionar tristeza o ansiedad.

EJEMPLOS:

"Tengo un mal día y quiero hablar" -> {"riesgo":"normal"}

"Siento ansiedad por mis exámenes" -> {"riesgo":"normal"}

"Quiero quitarme la vida esta noche" -> {"riesgo":"crisis"}

"Me están agrediendo ahora" -> {"riesgo":"crisis"}

FORMATO:

Devuelve solamente JSON con una clave llamada "riesgo",
cuyo valor sea "normal" o "crisis".

No incluyas explicaciones ni texto adicional.
"""


# ============================================================
# API: CONVERSAR CON IAN MEDIANTE GROQCLOUD
# ============================================================

@app.route("/api/ian/chat", methods=["POST"])
@requiere_sesion
def chat_con_ian():

    from openai import (
        OpenAI,
        APIError,
        AuthenticationError,
        RateLimitError
    )

    #===============================
    # Comprobar token de seguridad
    #===============================
    if not validar_csrf_contigo():
        return jsonify({
            "mensaje": "Solicitud no autorizada."
        }), 403

    # Limitar tamaño de la solicitud

    if request.content_length and request.content_length > 16000:
        return jsonify({
            "mensaje": "El mensaje enviado es demasiado grande."
        }), 413

    datos = request.get_json(silent=True)

    if not isinstance(datos, dict):
        return jsonify({
            "mensaje": "Datos inválidos."
        }), 400

    mensaje = datos.get("mensaje", "")

    if not isinstance(mensaje, str):
        return jsonify({
            "mensaje": "Escribe un mensaje válido."
        }), 400

    mensaje = mensaje.strip()

    if not 1 <= len(mensaje) <= 1500:
        return jsonify({
            "mensaje": "Escribe un mensaje de máximo 1500 caracteres."
        }), 400

    #====================================
    # Verificar la clave de GroqCloud
    #===================================

    clave_groq = os.environ.get("GROQ_API_KEY")

    if not clave_groq:
        return jsonify({
            "mensaje": (
                "IAN necesita GROQ_API_KEY en "
                "la terminal desde la que ejecutaste Flask."
            )
        }), 503
    #======================================
    # Obtener contexto de conversación
    #======================================

    historial = []
    historial_recibido = datos.get("historial", [])

    if isinstance(historial_recibido, list):

        for item in historial_recibido[-10:]:

            if not isinstance(item, dict):
                continue

            rol = item.get("role")
            contenido = item.get("content")

            if rol not in ("user", "assistant"):
                continue

            if not isinstance(contenido, str):
                continue

            contenido = contenido.strip()

            if not contenido:
                continue

            historial.append({
                "role": rol,
                "content": contenido[:1500]
            })

    etapa = "preparando GroqCloud"

    try:

        # ====================================================
        # RCONEXION CON GroqCloud
        # ==================================================== 

        cliente = OpenAI(
            api_key=clave_groq,
            base_url="https://api.groq.com/openai/v1",
            timeout=30.0
        )

        # ====================================================
        # REVISION DE SEGURIDAD
        # ====================================================

        etapa = "revisión de seguridad"

        revision = cliente.chat.completions.create(
            model="openai/gpt-oss-safeguard-20b",

            messages=[
                {
                    "role": "system",
                    "content": POLITICA_SEGURIDAD_IAN
                },
                {
                    "role": "user",
                    "content": mensaje
                }
            ],

            response_format={
                "type": "json_object"
            },

            reasoning_effort="low",
            max_completion_tokens=700
        )

        texto_revision = (
            revision.choices[0].message.content or ""
        ).strip()

        clasificacion = json.loads(texto_revision)

        if (
            not isinstance(clasificacion, dict)
            or clasificacion.get("riesgo") not in (
                "normal",
                "crisis"
            )
        ):
            raise ValueError(
                "No fue posible validar la clasificación."
            )

        # ====================================================
        # CONVERSACION CON IAN
        # ====================================================

        etapa = "generación de respuesta"

        conversacion = [
            {
                "role": "system",
                "content": INSTRUCCIONES_IAN
            }
        ]

        conversacion.extend(historial)

        conversacion.append({
            "role": "user",
            "content": mensaje
        })

        resultado = cliente.chat.completions.create(
            model="openai/gpt-oss-20b",

            messages=conversacion,

            temperature=0.6,

            reasoning_effort="low",

            max_completion_tokens=1200
        )

        respuesta = (
            resultado.choices[0].message.content or ""
        ).strip()

        if not respuesta:
            return jsonify({
                "mensaje": (
                    "IAN no generó una respuesta. "
                    "Intenta nuevamente."
                )
            }), 502

        return jsonify({
            "respuesta": respuesta
        }), 200

    # ========================================================
    # CONTROL DE ERRORES
    # ========================================================

    except AuthenticationError:

        app.logger.error(
            "IAN Groq: clave de API rechazada."
        )

        return jsonify({
            "mensaje": (
                "La clave de GroqCloud "
                "no fue aceptada."
            )
        }), 503

    except RateLimitError:

        return jsonify({
            "mensaje": (
                "IAN llegó temporalmente al límite "
                "del plan gratuito. Espera un "
                "momento e intenta nuevamente."
            )
        }), 429

    except (ValueError, json.JSONDecodeError):

        app.logger.warning(
            "IAN: clasificación de seguridad inválida."
        )

        return jsonify({
            "mensaje": (
                "IAN no puede responder de forma "
                "segura en este momento."
            )
        }), 503

    except APIError as error:

        app.logger.error(
            "IAN Groq: fallo %s en %s",
            type(error).__name__,
            etapa
        )

        return jsonify({
            "mensaje": (
                "IAN no pudo conectar con GroqCloud. "
                "Revisa la terminal."
            )
        }), 503

    except Exception as error:

        app.logger.error(
            "IAN: fallo inesperado %s",
            type(error).__name__
        )

        return jsonify({
            "mensaje": (
                "IAN no pudo responder "
                "en este momento."
            )
        }), 503



# ============================================================
# PANTALLA RED DE APOYO 
# ============================================================

@app.route("/red-apoyo")
@requiere_sesion
def red_apoyo():

    return render_template(
        "red_apoyo.html",
        nombre=session.get("nombre", "Usuario")
    )


# ============================================================
# VALIDAR DATOS DE UN CONTACTO
# ============================================================

def validar_contacto_confianza(datos):

    if not isinstance(datos, dict):
        return None, "Los datos enviados no son válidos."

    nombre = datos.get("nombre", "")
    telefono = datos.get("telefono") or ""
    relacion = datos.get("relacion") or ""

    if not all(
        isinstance(valor, str)
        for valor in (nombre, telefono, relacion)
    ):
        return None, "Los campos deben contener texto."

    nombre = nombre.strip()
    telefono = telefono.strip()
    relacion = relacion.strip()

    if not 1 <= len(nombre) <= 100:
        return None, (
            "El nombre es obligatorio y no puede "
            "superar 100 caracteres."
        )

    if len(relacion) > 50:
        return None, (
            "La relación no puede superar 50 caracteres."
        )

    if telefono:

        digitos = re.sub(r"\D", "", telefono)

        if (
            len(telefono) > 30
            or not re.fullmatch(
                r"\+?[\d\s().-]+",
                telefono
            )
            or not 7 <= len(digitos) <= 15
        ):
            return None, (
                "Ingresa un teléfono válido "
                "de entre 7 y 15 dígitos."
            )

    contacto = {
        "nombre": nombre,
        "telefono": telefono or None,
        "relacion": relacion or None
    }

    return contacto, None


# ============================================================
#  CONSULTAR MIS CONTACTOS
# AGREGAR CONTACTO
# ============================================================

@app.route(
    "/api/red-apoyo/contactos",
    methods=["GET", "POST"]
)
@requiere_sesion
def api_contactos_confianza():

    usuario_id = session["id_usuario"]

    # Validar solicitudes de escritura
    if request.method == "POST":

        if not validar_csrf_contigo():
            return jsonify({
                "mensaje": "Solicitud no autorizada."
            }), 403

        datos_contacto, error = validar_contacto_confianza(
            request.get_json(silent=True)
        )

        if error:
            return jsonify({
                "mensaje": error
            }), 400

    conexion = None
    cursor = None

    try:

        conexion = conectar_db()

        cursor = conexion.cursor(dictionary=True)

        # ------------------------------------
        # CONSULTAR CONTACTOS
        # ------------------------------------

        if request.method == "GET":

            cursor.execute("""
                SELECT
                    id_contacto,
                    nombre,
                    telefono,
                    relacion
                FROM contactos_confianza
                WHERE id_usuario = %s
                ORDER BY id_contacto DESC
            """, (usuario_id,))

            contactos = cursor.fetchall()

            return jsonify({
                "contactos": contactos
            }), 200

        # ------------------------------------
        # CREAR CONTACTO
        # ------------------------------------

        cursor.execute("""
            INSERT INTO contactos_confianza
            (
                id_usuario,
                nombre,
                telefono,
                relacion
            )
            VALUES (%s, %s, %s, %s)
        """, (
            usuario_id,
            datos_contacto["nombre"],
            datos_contacto["telefono"],
            datos_contacto["relacion"]
        ))

        id_nuevo = cursor.lastrowid

        conexion.commit()

        return jsonify({
            "mensaje": (
                "¡Contacto de confianza "
                "agregado correctamente!"
            ),
            "id_contacto": id_nuevo
        }), 201

    except Error:

        if conexion is not None:
            conexion.rollback()

        app.logger.exception(
            "Error en contactos de Red de Apoyo"
        )

        return jsonify({
            "mensaje": (
                "No pudimos completar la operación "
                "con tus contactos."
            )
        }), 500

    finally:
        cerrar_conexion(cursor, conexion)


# ============================================================
# EDITAR CONTACTO
# DELETE CONTACTO
# ============================================================

@app.route(
    "/api/red-apoyo/contactos/<int:id_contacto>",
    methods=["PUT", "DELETE"]
)
@requiere_sesion
def api_modificar_contacto_confianza(id_contacto):

    if not validar_csrf_contigo():
        return jsonify({
            "mensaje": "Solicitud no autorizada."
        }), 403

    usuario_id = session["id_usuario"]

    if request.method == "PUT":

        datos_contacto, error = validar_contacto_confianza(
            request.get_json(silent=True)
        )

        if error:
            return jsonify({
                "mensaje": error
            }), 400

    conexion = None
    cursor = None

    try:

        conexion = conectar_db()

        cursor = conexion.cursor(dictionary=True)

        # Comprobar que el contacto pertenece
        # al usuario que inició sesión

        cursor.execute("""
            SELECT id_contacto
            FROM contactos_confianza
            WHERE id_contacto = %s
              AND id_usuario = %s
        """, (
            id_contacto,
            usuario_id
        ))

        contacto = cursor.fetchone()

        if contacto is None:
            return jsonify({
                "mensaje": "Contacto no encontrado."
            }), 404

        # ------------------------------------
        # EDITAR CONTACTO
        # ------------------------------------

        if request.method == "PUT":

            cursor.execute("""
                UPDATE contactos_confianza
                SET
                    nombre = %s,
                    telefono = %s,
                    relacion = %s
                WHERE id_contacto = %s
                  AND id_usuario = %s
            """, (
                datos_contacto["nombre"],
                datos_contacto["telefono"],
                datos_contacto["relacion"],
                id_contacto,
                usuario_id
            ))

            conexion.commit()

            return jsonify({
                "mensaje": (
                    "¡Contacto actualizado "
                    "correctamente!"
                )
            }), 200

        # ------------------------------------
        # ELIMINAR CONTACTO
        # ------------------------------------

        cursor.execute("""
            DELETE FROM contactos_confianza
            WHERE id_contacto = %s
              AND id_usuario = %s
        """, (
            id_contacto,
            usuario_id
        ))

        conexion.commit()

        return jsonify({
            "mensaje": (
                "Contacto eliminado correctamente."
            )
        }), 200

    except Error:

        if conexion is not None:
            conexion.rollback()

        app.logger.exception(
            "Error al modificar contacto de apoyo"
        )

        return jsonify({
            "mensaje": (
                "No pudimos modificar este contacto."
            )
        }), 500

    finally:
        cerrar_conexion(cursor, conexion)


# ============================================================
# GET - CONSULTAR RECURSOS DE AYUDA
# ============================================================

@app.route(
    "/api/red-apoyo/recursos",
    methods=["GET"]
)
@requiere_sesion
def api_recursos_ayuda():

    conexion = None
    cursor = None

    try:

        conexion = conectar_db()

        cursor = conexion.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                id_recurso,
                nombre,
                descripcion,
                telefono,
                url,
                tipo
            FROM recursos_ayuda
            ORDER BY nombre ASC
        """)

        recursos = cursor.fetchall()

        return jsonify({
            "recursos": recursos
        }), 200

    except Error:

        app.logger.exception(
            "Error al consultar recursos de ayuda"
        )

        return jsonify({
            "mensaje": (
                "No pudimos consultar los "
                "recursos de ayuda."
            )
        }), 500

    finally:
        cerrar_conexion(cursor, conexion)



# ==========================================
# MI PERFIL
# ==========================================

@app.route("/perfil")
@requiere_sesion
def perfil():

    return render_template(
        "perfil.html",
        nombre=session.get("nombre", "Usuario")
    )


# ==========================================
# EDITAR MI PERFIL
# ==========================================

@app.route("/perfil/editar")
@requiere_sesion
def pantalla_editar_perfil():

    return render_template(
        "editar_perfil.html",
        nombre=session.get("nombre", "Usuario")
    )

# ============================================================
# NOTIFICACIONES
# ============================================================

@app.route("/notificaciones")
@requiere_sesion
def notificaciones():

    return (
        "Notificaciones: "
        "pantalla pendiente de implementar."
    )



# ==========================================
# CONFIGURACIÓN DE CONTIGO
# ==========================================

@app.route("/configuracion")
@requiere_sesion
def configuracion():

    return render_template(
        "configuracion.html",
        nombre=session.get("nombre", "Usuario")
    )


# ============================================================
# API DE PERFIL Y NOTIFICACIONES
# ============================================================

@app.route("/api/csrf", methods=["GET"])
@requiere_sesion
def csrf_del_perfil():
    if "csrf_contigo" not in session:
        session["csrf_contigo"] = secrets.token_urlsafe(32)
    return jsonify({"csrf_token": session["csrf_contigo"]})


@app.route("/api/perfil/resumen", methods=["GET"])
@requiere_sesion
def resumen_del_perfil():
    """Estadisticas reales del usuario; solo lectura de MariaDB."""
    conexion = None
    cursor = None
    try:
        conexion = conectar_db()
        cursor = conexion.cursor(dictionary=True)
        usuario_id = session["id_usuario"]

        cursor.execute("""
            SELECT id_usuario, nombre, correo, fecha_registro
            FROM usuarios
            WHERE id_usuario = %s
        """, (usuario_id,))
        usuario = cursor.fetchone()
        if not usuario:
            return jsonify({"mensaje": "Usuario no encontrado."}), 404

        # Todos los totales del resumen corresponden a 30 dias.
        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM actividades_realizadas
            WHERE id_usuario = %s
              AND fecha_hora >= NOW() - INTERVAL 30 DAY
        """, (usuario_id,))
        actividades = cursor.fetchone()["total"]

        cursor.execute("""
            SELECT COUNT(*) AS total,
                   COUNT(DISTINCT DATE(fecha_hora)) AS dias
            FROM registros_emocionales
            WHERE id_usuario = %s
              AND fecha_hora >= NOW() - INTERVAL 30 DAY
        """, (usuario_id,))
        registros = cursor.fetchone()

        cursor.execute("""
            SELECT e.nombre, COUNT(*) AS cantidad
            FROM registros_emocionales AS r
            JOIN emociones AS e ON e.id_emocion = r.id_emocion
            WHERE r.id_usuario = %s
              AND r.fecha_hora >= NOW() - INTERVAL 30 DAY
            GROUP BY e.id_emocion, e.nombre
            ORDER BY cantidad DESC, e.nombre ASC
        """, (usuario_id,))
        distribucion = [
            {"nombre": fila["nombre"], "cantidad": int(fila["cantidad"])}
            for fila in cursor.fetchall()
        ]

        # Registros diarios de la ultima semana (incluido hoy).
        # Un dia sin registros aparece vacio, no como otra emocion.
        hoy = date.today()
        inicio_semana = hoy - timedelta(days=6)
        fin_exclusivo = hoy + timedelta(days=1)
        semana_por_fecha = {
            (inicio_semana + timedelta(days=i)).isoformat(): []
            for i in range(7)
        }

        cursor.execute("""
            SELECT DATE(r.fecha_hora) AS dia,
                   e.nombre AS nombre,
                   COUNT(*) AS cantidad
            FROM registros_emocionales AS r
            INNER JOIN emociones AS e ON e.id_emocion = r.id_emocion
            WHERE r.id_usuario = %s
              AND r.fecha_hora >= %s
              AND r.fecha_hora < %s
            GROUP BY DATE(r.fecha_hora), e.id_emocion, e.nombre
            ORDER BY dia ASC, e.nombre ASC
        """, (usuario_id, inicio_semana, fin_exclusivo))

        for fila in cursor.fetchall():
            fecha = fila["dia"]
            clave = fecha.isoformat() if hasattr(fecha, "isoformat") else str(fecha)
            if clave in semana_por_fecha:
                semana_por_fecha[clave].append({
                    "nombre": fila["nombre"],
                    "cantidad": int(fila["cantidad"])
                })

        semana = [
            {
                "fecha": fecha,
                "emociones": emociones,
                "total": sum(e["cantidad"] for e in emociones)
            }
            for fecha, emociones in semana_por_fecha.items()
        ]

        # Distribucion REAL por categoria de las actividades completadas.
        # No contamos actividades solamente sugeridas o abiertas.
        cursor.execute("""
            SELECT COALESCE(c.nombre, 'Sin categoría') AS categoria,
                   COUNT(*) AS cantidad
            FROM actividades_realizadas AS ar
            INNER JOIN actividades AS a ON a.id_actividad = ar.id_actividad
            LEFT JOIN categorias AS c ON c.id_categoria = a.id_categoria
            WHERE ar.id_usuario = %s
              AND ar.fecha_hora >= NOW() - INTERVAL 30 DAY
            GROUP BY c.id_categoria, c.nombre
            ORDER BY cantidad DESC, categoria ASC
        """, (usuario_id,))
        actividades_categorias = [
            {"categoria": fila["categoria"], "cantidad": int(fila["cantidad"])}
            for fila in cursor.fetchall()
        ]

        fecha = usuario["fecha_registro"]
        return jsonify({
            "perfil": {
                "id_usuario": usuario["id_usuario"],
                "nombre": usuario["nombre"],
                "correo": usuario["correo"],
                "fecha_registro": (
                    fecha.date().isoformat()
                    if isinstance(fecha, datetime)
                    else fecha.isoformat() if fecha else None
                )
            },
            "resumen": {
                "registros_emocionales": int(registros["total"]),
                "actividades_completadas": int(actividades),
                "dias_con_registros": int(registros["dias"])
            },
            "distribucion_emociones": distribucion,
            "periodo": "Últimos 30 días",
            "graficas": {
                "semana": semana,
                "actividades": actividades_categorias
            }
        }), 200
    except Error:
        app.logger.exception("Error cargando resumen y graficas del perfil")
        return jsonify({"mensaje": "No se pudo cargar tu resumen."}), 500
    finally:
        cerrar_conexion(cursor, conexion)


@app.route("/api/perfil/alertas", methods=["GET", "PUT"])
@requiere_sesion
def alertas_del_perfil():
    usuario_id = session["id_usuario"]
    if request.method == "PUT":
        if not validar_csrf_contigo():
            return jsonify({"mensaje": "Solicitud no autorizada."}), 403
        datos = request.get_json(silent=True)
        campos = (
            "recordatorios_bienestar",
            "sugerencias_apoyo",
            "avisos_contacto_habilitados"
        )
        if not isinstance(datos, dict) or any(
            type(datos.get(c)) is not bool for c in campos
        ):
            return jsonify({"mensaje": "Revisa las preferencias enviadas."}), 400
        contacto_id = datos.get("id_contacto")
        avisos = datos["avisos_contacto_habilitados"]
        if avisos and (type(contacto_id) is not int or contacto_id <= 0):
            return jsonify({"mensaje": "Selecciona un contacto válido."}), 400
        if not avisos:
            contacto_id = None

    conexion = None
    cursor = None
    try:
        conexion = conectar_db()
        cursor = conexion.cursor(dictionary=True)

        if request.method == "GET":
            cursor.execute("""
                SELECT recordatorios_bienestar, sugerencias_apoyo,
                       avisos_contacto_habilitados, id_contacto
                FROM configuracion_alertas WHERE id_usuario = %s
            """, (usuario_id,))
            fila = cursor.fetchone() or {}
            return jsonify({"configuracion": {
                "recordatorios_bienestar": bool(fila.get("recordatorios_bienestar", 0)),
                "sugerencias_apoyo": bool(fila.get("sugerencias_apoyo", 0)),
                "avisos_contacto_habilitados": bool(fila.get("avisos_contacto_habilitados", 0)),
                "id_contacto": fila.get("id_contacto")
            }, "envio_automatico_disponible": False}), 200

        if avisos:
            cursor.execute("""
                SELECT id_contacto FROM contactos_confianza
                WHERE id_contacto = %s AND id_usuario = %s
            """, (contacto_id, usuario_id))
            if cursor.fetchone() is None:
                return jsonify({"mensaje": "El contacto no pertenece a tu Red de Apoyo."}), 400

        cursor.execute("""
            INSERT INTO configuracion_alertas
              (id_usuario, recordatorios_bienestar, sugerencias_apoyo,
               avisos_contacto_habilitados, id_contacto, fecha_autorizacion)
            VALUES (%s, %s, %s, %s, %s, CASE WHEN %s THEN NOW() ELSE NULL END)
            ON DUPLICATE KEY UPDATE
              recordatorios_bienestar = VALUES(recordatorios_bienestar),
              sugerencias_apoyo = VALUES(sugerencias_apoyo),
              avisos_contacto_habilitados = VALUES(avisos_contacto_habilitados),
              id_contacto = VALUES(id_contacto),
              fecha_autorizacion = CASE
                WHEN VALUES(avisos_contacto_habilitados) = 1 THEN NOW()
                ELSE NULL END
        """, (
            usuario_id,
            int(datos["recordatorios_bienestar"]),
            int(datos["sugerencias_apoyo"]),
            int(avisos), contacto_id, int(avisos)
        ))
        conexion.commit()
        return jsonify({
            "mensaje": "Preferencias guardadas correctamente.",
            "envio_automatico_disponible": False
        }), 200
    except Error:
        if conexion is not None:
            conexion.rollback()
        app.logger.exception("Error guardando las preferencias")
        return jsonify({"mensaje": "No se pudieron guardar las preferencias."}), 500
    finally:
        cerrar_conexion(cursor, conexion)


@app.route("/api/notificaciones/generar", methods=["POST"])
@requiere_sesion
def generar_notificaciones_del_perfil():
    if not validar_csrf_contigo():
        return jsonify({"mensaje": "Solicitud no autorizada."}), 403

    # Aún no se activa detección automática de crisis
    # ni avisos externos a contactos de confianza.
    # Las recomendaciones por emociones se implementarán
    # y probarán por separado.
    return jsonify({
        "mensaje": "Revisión pendiente de implementar.",
        "notificaciones_nuevas": 0
    }), 200


@app.route("/api/notificaciones", methods=["GET"])
@requiere_sesion
def listar_notificaciones_del_perfil():
    conexion = None
    cursor = None
    try:
        conexion = conectar_db()
        cursor = conexion.cursor(dictionary=True)
        usuario_id = session["id_usuario"]
        cursor.execute("""
            SELECT id_notificacion, tipo, titulo, mensaje, enlace,
                   leida, fecha_creacion, fecha_lectura
            FROM notificaciones
            WHERE id_usuario = %s
            ORDER BY fecha_creacion DESC, id_notificacion DESC
            LIMIT 50
        """, (usuario_id,))
        filas = cursor.fetchall()
        for fila in filas:
            fila["leida"] = bool(fila["leida"])
            for campo in ("fecha_creacion", "fecha_lectura"):
                fecha = fila[campo]
                fila[campo] = fecha.isoformat() if fecha else None

        cursor.execute("""
            SELECT COUNT(*) AS total FROM notificaciones
            WHERE id_usuario = %s AND leida = 0
        """, (usuario_id,))
        pendientes = cursor.fetchone()["total"]
        return jsonify({
            "notificaciones": filas,
            "total_pendientes": int(pendientes)
        }), 200
    except Error:
        app.logger.exception("Error consultando notificaciones")
        return jsonify({"mensaje": "No pudimos cargar tus notificaciones."}), 500
    finally:
        cerrar_conexion(cursor, conexion)


@app.route("/api/notificaciones/<int:id_notificacion>/leer", methods=["PUT"])
@requiere_sesion
def leer_notificacion_del_perfil(id_notificacion):
    if not validar_csrf_contigo():
        return jsonify({"mensaje": "Solicitud no autorizada."}), 403
    conexion = None
    cursor = None
    try:
        conexion = conectar_db()
        cursor = conexion.cursor()
        cursor.execute("""
            UPDATE notificaciones
            SET leida = 1, fecha_lectura = COALESCE(fecha_lectura, NOW())
            WHERE id_notificacion = %s AND id_usuario = %s
        """, (id_notificacion, session["id_usuario"]))
        actualizadas = cursor.rowcount
        conexion.commit()
        if not actualizadas:
            return jsonify({"mensaje": "No se encontró la notificación pendiente."}), 404
        return jsonify({"mensaje": "Notificación marcada como leída."}), 200
    except Error:
        if conexion is not None:
            conexion.rollback()
        app.logger.exception("Error marcando notificación")
        return jsonify({"mensaje": "No se pudo actualizar la notificación."}), 500
    finally:
        cerrar_conexion(cursor, conexion)


@app.route("/api/notificaciones/leer-todas", methods=["PUT"])
@requiere_sesion
def leer_todas_las_notificaciones_del_perfil():
    if not validar_csrf_contigo():
        return jsonify({"mensaje": "Solicitud no autorizada."}), 403
    conexion = None
    cursor = None
    try:
        conexion = conectar_db()
        cursor = conexion.cursor()
        cursor.execute("""
            UPDATE notificaciones
            SET leida = 1, fecha_lectura = COALESCE(fecha_lectura, NOW())
            WHERE id_usuario = %s AND leida = 0
        """, (session["id_usuario"],))
        actualizadas = cursor.rowcount
        conexion.commit()
        return jsonify({
            "mensaje": "Notificaciones marcadas como leídas.",
            "actualizadas": actualizadas,
            "total_pendientes": 0
        }), 200
    except Error:
        if conexion is not None:
            conexion.rollback()
        app.logger.exception("Error marcando notificaciones")
        return jsonify({"mensaje": "No se pudieron actualizar las notificaciones."}), 500
    finally:
        cerrar_conexion(cursor, conexion)



# ============================================================
# CONTIGO - REGISTRO DE EMOCIONES
# ============================================================

@app.route("/api/registros-emocionales", methods=["POST"])
@requiere_sesion
def registrar_emocion():

    if not validar_csrf_contigo():
        return jsonify({
            "mensaje": "Solicitud no autorizada."
        }), 403

    datos = request.get_json(silent=True)

    if not isinstance(datos, dict):
        return jsonify({
            "mensaje": "Datos inválidos."
        }), 400

    emocion = datos.get("emocion")
    intensidad = datos.get("intensidad")

    if not isinstance(emocion, str) or not emocion.strip():
        return jsonify({
            "mensaje": "Selecciona una emoción válida."
        }), 400

    emocion = emocion.strip()

    if (
        type(intensidad) is not int
        or not 1 <= intensidad <= 5
    ):
        return jsonify({
            "mensaje": "La intensidad debe estar entre 1 y 5."
        }), 400

    conexion = None
    cursor = None

    try:

        conexion = conectar_db()
        cursor = conexion.cursor(dictionary=True)

        cursor.execute("""
            SELECT id_emocion
            FROM emociones
            WHERE nombre = %s
        """, (emocion,))

        emocion_db = cursor.fetchone()

        if emocion_db is None:
            return jsonify({
                "mensaje": "La emoción no está registrada."
            }), 404

        cursor.execute("""
            INSERT INTO registros_emocionales
            (id_usuario, id_emocion, intensidad)
            VALUES (%s, %s, %s)
        """, (
            session["id_usuario"],
            emocion_db["id_emocion"],
            intensidad
        ))

        conexion.commit()

        return jsonify({
            "mensaje": "Emoción registrada correctamente.",
            "id_registro": cursor.lastrowid
        }), 201

    except Error:

        if conexion is not None:
            conexion.rollback()

        app.logger.exception(
            "Error al registrar emoción"
        )

        return jsonify({
            "mensaje": "No se pudo guardar la emoción."
        }), 500

    finally:
        cerrar_conexion(cursor, conexion)


# ============================================================
# CONTIGO - EDITAR NOMBRE Y FOTO DE PERFIL
# ============================================================

FOTOS_PERFIL_DIR = (
    Path(app.instance_path) / "fotos_perfil"
)

MAX_FOTO_BYTES = 2 * 1024 * 1024


def ruta_foto_usuario():
    """
    Obtiene la ubicación privada de la foto
    del usuario que tiene la sesión iniciada.
    """

    usuario_id = int(session["id_usuario"])

    return FOTOS_PERFIL_DIR / f"{usuario_id}.jpg"


# ============================================================
# ACTUALIZAR NOMBRE EN MARIADB
# ============================================================

@app.route(
    "/api/perfil/nombre",
    methods=["PUT"]
)
@requiere_sesion
def actualizar_nombre_perfil():

    if not validar_csrf_contigo():
        return jsonify({
            "mensaje": "Solicitud no autorizada."
        }), 403

    datos = request.get_json(silent=True)

    nombre = (
        datos.get("nombre")
        if isinstance(datos, dict)
        else None
    )

    if not isinstance(nombre, str):
        return jsonify({
            "mensaje": "Escribe un nombre válido."
        }), 400

    nombre = " ".join(nombre.split())

    if (
        len(nombre) < 2
        or len(nombre) > 100
        or any(
            ord(caracter) < 32
            or ord(caracter) == 127
            for caracter in nombre
        )
    ):
        return jsonify({
            "mensaje": (
                "El nombre debe tener entre "
                "2 y 100 caracteres."
            )
        }), 400

    conexion = None
    cursor = None

    try:

        conexion = conectar_db()
        cursor = conexion.cursor()

        cursor.execute("""
            UPDATE usuarios
            SET nombre = %s
            WHERE id_usuario = %s
        """, (
            nombre,
            session["id_usuario"]
        ))

        conexion.commit()

        # Actualizar también la sesión de Flask

        session["nombre"] = nombre

        return jsonify({
            "mensaje": "Nombre actualizado correctamente.",
            "nombre": nombre
        }), 200

    except Error:

        app.logger.exception(
            "Error al actualizar el nombre del usuario"
        )

        return jsonify({
            "mensaje": "No pudimos actualizar el nombre."
        }), 500

    finally:

        cerrar_conexion(cursor, conexion)


# ============================================================
# CONSULTAR, SUBIR Y QUITAR FOTO DE PERFIL
# ============================================================

@app.route(
    "/api/perfil/foto",
    methods=["GET", "POST", "DELETE"]
)
@requiere_sesion
def foto_perfil_usuario():

    foto = ruta_foto_usuario()

    # --------------------------------------------------------
    # GET: MOSTRAR FOTO O ZORRITO PREDETERMINADO
    # --------------------------------------------------------

    if request.method == "GET":

        if foto.is_file():
            ruta = foto
        else:
            ruta = (
                Path(app.static_folder)
                / "img"
                / "logo-contigo.jpeg"
            )

        respuesta = send_file(
            ruta,
            mimetype="image/jpeg"
        )

        # Evitar guardar fotos personales
        # en cachés compartidas.

        respuesta.headers["Cache-Control"] = (
            "private, no-store"
        )

        return respuesta

    # --------------------------------------------------------
    # SEGURIDAD PARA MODIFICACIONES
    # --------------------------------------------------------

    if not validar_csrf_contigo():

        return jsonify({
            "mensaje": "Solicitud no autorizada."
        }), 403

    # --------------------------------------------------------
    # DELETE: QUITAR FOTO
    # --------------------------------------------------------

    if request.method == "DELETE":

        try:

            foto.unlink(missing_ok=True)

            return jsonify({
                "mensaje": (
                    "Volvimos al zorrito de CONTIGO."
                )
            }), 200

        except OSError:

            app.logger.exception(
                "Error al quitar la foto de perfil"
            )

            return jsonify({
                "mensaje": "No pudimos quitar la foto."
            }), 500

    # --------------------------------------------------------
    # POST: RECIBIR IMAGEN
    # --------------------------------------------------------

    archivo = request.files.get("foto")

    if not archivo:

        return jsonify({
            "mensaje": "Selecciona una imagen."
        }), 400

    contenido = archivo.stream.read(
        MAX_FOTO_BYTES + 1
    )

    if (
        not contenido
        or len(contenido) > MAX_FOTO_BYTES
    ):

        return jsonify({
            "mensaje": (
                "La foto debe pesar máximo 2 MB."
            )
        }), 413

    temporal = None

    try:

        with Image.open(
            BytesIO(contenido)
        ) as original:

            # Validar el formato real,
            # no solamente la extensión.

            if original.format not in (
                "JPEG",
                "PNG",
                "WEBP"
            ):

                return jsonify({
                    "mensaje": (
                        "Solo se aceptan JPG, PNG o WebP."
                    )
                }), 400

            if (
                original.width * original.height
                > 12000000
            ):

                return jsonify({
                    "mensaje": (
                        "La imagen tiene demasiados píxeles."
                    )
                }), 400

            original.load()

            # Corregir orientación de fotografías.

            imagen = ImageOps.exif_transpose(
                original
            )

            # Recortar y redimensionar a 400 x 400.

            imagen = ImageOps.fit(
                imagen.convert("RGB"),
                (400, 400),
                method=Image.Resampling.LANCZOS
            )

        # Crear carpeta privada del servidor.

        FOTOS_PERFIL_DIR.mkdir(
            parents=True,
            exist_ok=True
        )

        temporal = FOTOS_PERFIL_DIR / (
            f".{int(session['id_usuario'])}-"
            f"{secrets.token_hex(8)}.tmp"
        )

        # Generar un JPG sin metadatos EXIF.

        imagen.save(
            temporal,
            format="JPEG",
            quality=85,
            optimize=True
        )

        os.replace(temporal, foto)

        return jsonify({
            "mensaje": "Foto de perfil actualizada."
        }), 200

    except (
        UnidentifiedImageError,
        Image.DecompressionBombError,
        OSError,
        ValueError
    ):

        app.logger.info(
            "Foto de perfil inválida o no procesable"
        )

        return jsonify({
            "mensaje": (
                "No pudimos procesar esa imagen. "
                "Prueba con otra JPG, PNG o WebP."
            )
        }), 400

    finally:

        if temporal is not None:
            temporal.unlink(missing_ok=True)

if __name__ == "__main__":
    app.run(debug=True)
