
import os
import mysql.connector
from pathlib import Path


# ============================================================
# CONEXIÓN A LA BASE DE DATOS CONTIGO
# Permite utilizar MariaDB local o TiDB Cloud
# ============================================================

def conectar_db():

    host = os.environ.get("DB_HOST", "127.0.0.1")

    configuracion = {
        "host": host,
        "port": int(os.environ.get("DB_PORT", "3306")),
        "user": os.environ.get("DB_USER", "contigo_app"),
        "password": os.environ.get("DB_PASSWORD", ""),
        "database": os.environ.get("DB_NAME", "contigo_db"),
        "use_pure": True
    }

    # Activar SSL cuando se utilice TiDB Cloud
    if host not in ("127.0.0.1", "localhost"):

        ruta_certificado = Path(__file__).resolve().parent / "certificados" / "ca.pem"

        configuracion.update({
            "ssl_ca": str(ruta_certificado),
            "ssl_verify_cert": True,
            "ssl_verify_identity": True
        })

    conexion = mysql.connector.connect(**configuracion)

    return conexion
