import os
import mysql.connector
from pathlib import Path

try:
    conexion = mysql.connector.connect(
        host=os.environ["DB_HOST"],
        port=int(os.environ["DB_PORT"]),
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
        database=os.environ["DB_NAME"],
        connection_timeout=10,
        ssl_ca=str((Path("certificados") / "ca.pem").resolve()),
        ssl_verify_cert=True,
        ssl_verify_identity=True
    )

    print("CONEXION A TIDB: OK")

    cursor = conexion.cursor()

    cursor.execute("SHOW TABLES LIKE '%autorizacion%'")
    print("TABLAS DE AUTORIZACION:", cursor.fetchall())

    cursor.execute("SHOW COLUMNS FROM usuarios")
    print("COLUMNAS DE USUARIOS:")
    for columna in cursor.fetchall():
        print("-", columna[0])

    cursor.close()
    conexion.close()

except Exception as error:
    print("ERROR DE CONSULTA:", error)
