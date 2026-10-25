import os
import mysql.connector


def conectar_db():
    conexion = mysql.connector.connect(
        host="127.0.0.1",
        port=3306,
        user="contigo_app",
        password=os.environ["DB_PASSWORD"],
        database="contigo_db",
        use_pure=True
    )

    return conexion