
import os
import mysql.connector

def conectar_db():
    conexion = mysql.connector.connect(
        host="localhost",
        user="contigo_app",
        password=os.environ["DB_PASSWORD"],
        database="contigo_db",
        use_pure=True
    )

    return conexion

