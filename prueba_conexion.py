from conexion import conectar_db

print("Iniciando prueba de conexión...", flush=True)

try:
    conexion = conectar_db()

    if conexion.is_connected():
        print("CONEXIÓN EXITOSA CON MARIADB", flush=True)

    conexion.close()

except Exception as error:
    print("ERROR DE CONEXIÓN:", error, flush=True)