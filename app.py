
from flask import Flask, render_template, request, jsonify
from werkzeug.security import generate_password_hash
from mysql.connector import IntegrityError, Error
from datetime import date, datetime
from conexion import conectar_db

app = Flask(__name__)


@app.route("/")
def inicio():
    return render_template("login.html")


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

    if not isinstance(contrasena, str) or not isinstance(confirmar, str):
        return jsonify({"mensaje": "Ingresa una contraseña válida."}), 400

    if not nombre or not correo or not contrasena:
        return jsonify({"mensaje": "Completa los campos obligatorios."}), 400

    if len(nombre) > 100 or len(correo) > 150 or "@" not in correo:
        return jsonify({"mensaje": "Revisa tu nombre y correo."}), 400

    if len(contrasena) < 8 or len(contrasena) > 128:
        return jsonify({"mensaje": "La contraseña debe tener entre 8 y 128 caracteres."}), 400

    if contrasena != confirmar:
        return jsonify({"mensaje": "Las contraseñas no coinciden."}), 400

    fecha_nacimiento = None

    if fecha_texto:
        try:
            fecha_nacimiento = datetime.strptime(
                fecha_texto, "%Y-%m-%d"
            ).date()

            if fecha_nacimiento > date.today():
                return jsonify({"mensaje": "La fecha no puede ser futura."}), 400

        except (ValueError, TypeError):
            return jsonify({"mensaje": "Fecha de nacimiento inválida."}), 400

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
        return jsonify({"mensaje": "No se pudo completar el registro."}), 500

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


if __name__ == "__main__":
    app.run(debug=True)
