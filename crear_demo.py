import os
from pathlib import Path
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash
from conexion import conectar_db

# Cargar variables desde .env sin depender de librerías externas
env_path = Path(__file__).resolve().parent / ".env"
if env_path.exists():
    for linea in env_path.read_text(encoding="utf-8").splitlines():
        linea = linea.strip()
        if linea and not linea.startswith("#") and "=" in linea:
            clave, valor = linea.split("=", 1)
            os.environ.setdefault(clave.strip(), valor.strip().strip('"').strip("'"))

CORREO_DEMO = "jurado.sena@contigo.app"
CLAVE_DEMO = "ContigoDemo2026*"


def poblar_cuenta_demo():
    conn = conectar_db()
    cursor = conn.cursor(dictionary=True)

    try:
        # 1. Verificar si ya existe el usuario demo
        cursor.execute("SELECT id_usuario FROM usuarios WHERE correo = %s", (CORREO_DEMO,))
        existente = cursor.fetchone()

        if existente:
            id_usuario = existente["id_usuario"]
            # Limpiar datos previos del usuario demo para dejarlo fresco
            cursor.execute("DELETE FROM actividades_realizadas WHERE id_usuario = %s", (id_usuario,))
            cursor.execute("DELETE FROM registros_emocionales WHERE id_usuario = %s", (id_usuario,))
            cursor.execute("DELETE FROM diario WHERE id_usuario = %s", (id_usuario,))
            cursor.execute("DELETE FROM contactos_confianza WHERE id_usuario = %s", (id_usuario,))
            cursor.execute("DELETE FROM constelaciones_descubiertas WHERE id_usuario = %s", (id_usuario,))
            cursor.execute("DELETE FROM cielo_bienestar WHERE id_usuario = %s", (id_usuario,))
            cursor.execute("DELETE FROM notificaciones WHERE id_usuario = %s", (id_usuario,))
        else:
            hash_clave = generate_password_hash(CLAVE_DEMO)
            cursor.execute(
                """
                INSERT INTO usuarios (
                    nombre, correo, contrasena, fecha_nacimiento,
                    rol, pais_residencia, tratamiento_ian, personalizacion_ian
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    "Camila Jurado (Demo)",
                    CORREO_DEMO,
                    hash_clave,
                    "2004-05-15",
                    "usuario",
                    "Colombia",
                    "femenino",
                    1,
                ),
            )
            id_usuario = cursor.lastrowid

        ahora = datetime.now()

        # 2. Consultar IDs reales de emociones disponibles en la tabla
        cursor.execute("SELECT id_emocion, nombre FROM emociones ORDER BY id_emocion ASC LIMIT 5")
        emociones = cursor.fetchall()

        if emociones:
            notas_emociones = [
                (8, "Me sentí un poco abrumada antes de exponer, pero respirar profundo me ayudó."),
                (6, "Día tranquilo, logré organizar mis pendientes sin tanto estrés."),
                (7, "Extrañaba hablar con alguien cercano; escribir en mi diario me dio calma."),
                (5, "Cansancio acumulado de la semana, descansé temprano."),
                (4, "Hoy me siento más serena y con claridad para continuar."),
            ]
            for idx, (intensidad, nota) in enumerate(notas_emociones):
                emocion = emociones[idx % len(emociones)]
                fecha_reg = ahora - timedelta(days=(4 - idx), hours=2)
                cursor.execute(
                    """
                    INSERT INTO registros_emocionales (id_usuario, id_emocion, intensidad, fecha_hora, nota)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (id_usuario, emocion["id_emocion"], intensidad, fecha_reg, nota),
                )

        # 3. Insertar actividades realizadas para sumar estrellas y progreso real
        cursor.execute("SELECT id_actividad, nombre FROM actividades ORDER BY id_actividad ASC LIMIT 4")
        actividades = cursor.fetchall()

        if actividades:
            resultados_act = [
                "Completé la respiración guiada y bajé mi nivel de tensión.",
                "Me tomé una pausa consciente de 5 minutos lejos de las pantallas.",
                "Escribí tres cosas por las que me siento agradecida hoy.",
                "Realicé estiramientos suaves para liberar el cansancio del día.",
            ]
            for idx, act in enumerate(actividades):
                fecha_act = ahora - timedelta(days=(3 - idx), hours=1)
                clave_ev = f"demo_act_{id_usuario}_{idx + 1}"
                cursor.execute(
                    """
                    INSERT INTO actividades_realizadas (id_usuario, id_actividad, fecha_hora, resultado, clave_evento)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (id_usuario, act["id_actividad"], fecha_act, resultados_act[idx % len(resultados_act)], clave_ev),
                )

        # 4. Entradas en Mi Diario
        entradas_diario = [
            (
                "Aprender a pausar cuando todo va rápido",
                "Hoy entendí que no tengo que resolver todo en un solo día. Tomarme cinco minutos para respirar y escribir cómo me siento me ayuda a bajar el ritmo y ver las cosas con más calma.",
                ahora - timedelta(days=3),
            ),
            (
                "Pequeños logros de esta semana",
                "Logré terminar mi proyecto a tiempo y pedir ayuda cuando la necesité. Me alegra tener este espacio seguro para ordenar mis ideas sin sentirme juzgada.",
                ahora - timedelta(days=1, hours=5),
            ),
            (
                "Lo que me da tranquilidad",
                "Escuchar música suave, hablar con mi familia y recordar que pedir apoyo también es una forma de valentía.",
                ahora - timedelta(hours=3),
            ),
        ]
        for titulo, contenido, fecha_d in entradas_diario:
            cursor.execute(
                """
                INSERT INTO diario (id_usuario, titulo, contenido, fecha_hora)
                VALUES (%s, %s, %s, %s)
                """,
                (id_usuario, titulo, contenido, fecha_d),
            )

        # 5. Contactos de confianza en Red de Apoyo
        contactos = [
            ("Laura Gómez (Mamá)", "3001234567", "Madre", "laura.apoyo@ejemplo.com"),
            ("Mateo Restrepo", "3109876543", "Mejor amigo", "mateo.apoyo@ejemplo.com"),
        ]
        for nombre_c, tel_c, rel_c, correo_c in contactos:
            cursor.execute(
                """
                INSERT INTO contactos_confianza (id_usuario, nombre, telefono, relacion, correo)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (id_usuario, nombre_c, tel_c, rel_c, correo_c),
            )

        # 6. Cielo de Bienestar y Constelaciones Descubiertas
        cursor.execute(
            """
            INSERT INTO cielo_bienestar (id_usuario, estrellas, constelaciones, ultima_actualizacion, figura_activa)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (id_usuario, 14, 2, ahora, "corazon"),
        )

        for fig in ("corazon", "estrella"):
            cursor.execute(
                """
                INSERT INTO constelaciones_descubiertas (id_usuario, codigo_figura, fecha_hora)
                VALUES (%s, %s, %s)
                """,
                (id_usuario, fig, ahora - timedelta(days=1)),
            )

        # 7. Notificaciones iniciales
        cursor.execute(
            """
            INSERT INTO notificaciones (id_usuario, tipo, titulo, mensaje, enlace, clave_evento, leida, fecha_creacion)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                id_usuario,
                "bienestar",
                "✨ ¡Nueva constelación iluminada!",
                "Has encendido 14 estrellas en tu Cielo de Bienestar. Sigue cuidando de ti.",
                "/actividades",
                "demo_constelacion_1",
                0,
                ahora - timedelta(hours=1),
            ),
        )

        conn.commit()
        print("✅ Cuenta Demo actualizada con actividades realizadas y estrellas:")
        print(f"   Correo: {CORREO_DEMO}")
        print(f"   Clave:  {CLAVE_DEMO}")

    except Exception as e:
        conn.rollback()
        print("❌ Error al crear la cuenta demo:", e)
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    poblar_cuenta_demo()