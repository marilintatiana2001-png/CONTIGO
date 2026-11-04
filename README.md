
# CONTIGO 💜🦊

## Proyecto formativo SENA

CONTIGO es una aplicación web orientada al bienestar emocional
de jóvenes entre 14 y 27 años.

Permite registrar emociones, realizar actividades de autocuidado,
escribir en un diario emocional y visualizar avances mediante
un cielo de bienestar.

También incorpora a IAN, un compañero emocional basado en
inteligencia artificial.

## Tecnologías utilizadas

- Frontend principal: HTML, CSS y JavaScript.
- Frontend del taller: React con Vite.
- Backend: Python y Flask.
- Base de datos: MySQL/MariaDB.
- Servidor local de base de datos: XAMPP.
- IA de IAN: GroqCloud.
- Control de versiones: Git y GitHub.

## Estructura del proyecto

CONTIGO/
- app.py: servidor Flask y rutas de la API.
- conexion.py: conexión con MariaDB.
- templates/: pantallas HTML de CONTIGO.
- static/: estilos, imágenes y JavaScript.
- frontend-react/: interfaz React para el taller.
- requirements.txt: dependencias de Python.

## Requisitos

Tener instalados:

- Python.
- Node.js y npm.
- XAMPP con MariaDB.
- Git.

La base de datos `contigo_db` debe existir y contar
con las tablas necesarias del proyecto.

## 1. Ejecutar la base de datos

1. Abrir XAMPP.
2. Encender MySQL.
3. Verificar que exista la base de datos `contigo_db`.
4. Verificar que el usuario de base de datos utilizado
   por CONTIGO tenga los permisos correspondientes.

No se incluyen contraseñas reales en este repositorio.

## 2. Ejecutar el backend Flask

Abrir una terminal en la carpeta principal CONTIGO.

Activar el entorno virtual de Python:

    .\.venv\Scripts\Activate.ps1

Si el entorno virtual todavía no existe, crearlo:

    python -m venv .venv

Después activarlo e instalar las dependencias:

    pip install -r requirements.txt

Configurar las variables de entorno:

- SECRET_KEY: clave de seguridad de Flask.
- DB_PASSWORD: contraseña del usuario de MariaDB.
- GROQ_API_KEY: clave de GroqCloud para utilizar IAN.

Estas variables se configuran de manera privada
en la terminal desde la que se ejecuta Flask.

Iniciar el servidor:

    python -m flask --app app run --port 5001 --no-reload

Abrir en el navegador:

    http://127.0.0.1:5001

## 3. Ejecutar el frontend React

Abrir una segunda terminal en la carpeta CONTIGO.

Entrar al proyecto React:

    cd frontend-react

Instalar dependencias si es necesario:

    npm install

Iniciar React:

    npm run dev

Abrir en el navegador:

    http://127.0.0.1:5173

El backend Flask debe continuar encendido
en el puerto 5001.

## 4. Conexión entre React y Flask

El archivo `vite.config.js` configura el proxy de Vite.

Las peticiones realizadas desde React a `/api`
son redirigidas al servidor Flask.

Se utiliza la sesión del usuario y un token CSRF
para proteger las operaciones de escritura.

## 5. Entidad utilizada en el taller

Entidad real: diario.

Tabla de MariaDB: diario.

Campos principales:

- id_entrada
- id_usuario
- titulo
- contenido
- fecha_hora

## 6. Endpoints utilizados

GET /api/diario

Consulta los escritos del usuario autenticado.

POST /api/diario

Guarda un escrito nuevo en MariaDB.

GET /api/csrf

Obtiene el token de seguridad de la sesión.

Las rutas requieren una sesión válida de CONTIGO.

## 7. Evidencias del taller

Se realizan pruebas para demostrar:

- Registros existentes en MariaDB.
- Funcionamiento del método GET.
- Funcionamiento del método POST.
- Peticiones observadas en Network.
- Formulario desarrollado en React.
- Nuevo registro visible desde React.
- Persistencia del mismo registro en MariaDB.
- Historial de commits en Git.
- Repositorio GitHub actualizado.

## 8. Seguridad

No se deben publicar contraseñas,
claves de API ni datos personales sensibles.

Las carpetas `.venv` y `node_modules`
se excluyen mediante Git.

IAN ofrece apoyo emocional mediante IA,
pero no sustituye la atención profesional
en salud mental.

## 9. Proyecto académico

Desarrollado como parte del Técnico en
Programación de Software del SENA.
