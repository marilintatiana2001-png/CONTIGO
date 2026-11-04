
import { useEffect, useState } from "react";

function App() {
  const [escritos, setEscritos] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [csrfToken, setCsrfToken] = useState("");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  // Consultar información del backend Flask
  async function consultarAPI(ruta, opciones = {}) {
    const respuesta = await fetch(ruta, {
      credentials: "include",
      ...opciones,
    });

    const datos = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      throw new Error(
        datos.mensaje || `Error HTTP ${respuesta.status}`
      );
    }

    return datos;
  }

  // GET: obtener los escritos de MariaDB
  async function cargarEscritos() {
    const datos = await consultarAPI("/api/diario");
    setEscritos(datos);
  }

  // Cargar los registros al abrir React
  useEffect(() => {
    async function iniciar() {
      try {
        setCargando(true);
        setError("");

        const [seguridad, registros] = await Promise.all([
          consultarAPI("/api/csrf"),
          consultarAPI("/api/diario"),
        ]);

        setCsrfToken(seguridad.csrf_token);
        setEscritos(registros);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    }

    iniciar();
  }, []);

  // POST: guardar un nuevo escrito
  async function guardarEscrito(evento) {
    evento.preventDefault();

    if (!titulo.trim() || !contenido.trim()) {
      setError("Debes completar el título y el contenido.");
      return;
    }

    try {
      setGuardando(true);
      setError("");
      setExito("");

      await consultarAPI("/api/diario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          titulo: titulo.trim(),
          contenido: contenido.trim(),
        }),
      });

      setTitulo("");
      setContenido("");

      // Actualizar la lista con datos reales de MariaDB
      await cargarEscritos();

      setExito("¡Escrito guardado correctamente en CONTIGO!");
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          display: block;
          min-width: 320px;
          background: linear-gradient(
            135deg,
            #f5edff,
            #fff8fb,
            #edf9f5
          );
          font-family: Arial, sans-serif;
          color: #453477;
        }

        #root {
          width: 100%;
          min-height: 100vh;
          padding: 28px 16px;
        }

        .contenedor {
          max-width: 900px;
          margin: 0 auto;
        }

        .encabezado {
          text-align: center;
          margin-bottom: 28px;
        }

        .encabezado h1 {
          color: #5931a1;
          margin-bottom: 8px;
        }

        .subtitulo {
          color: #81769b;
          font-size: 14px;
        }

        .tarjeta {
          background: white;
          border-radius: 22px;
          padding: 26px;
          margin-bottom: 24px;
          box-shadow: 0 8px 25px #67518c15;
        }

        h2 {
          color: #6740a5;
          font-size: 21px;
        }

        label {
          display: block;
          text-align: left;
          font-weight: bold;
          margin: 18px 0 8px;
        }

        input,
        textarea {
          display: block;
          width: 100%;
          padding: 13px;
          border: 1px solid #dac9fa;
          border-radius: 12px;
          font: inherit;
          color: #453477;
          background: #fff;
        }

        textarea {
          min-height: 125px;
          resize: vertical;
        }

        input:focus,
        textarea:focus {
          outline: 2px solid #a986ed;
        }

        .boton {
          margin-top: 20px;
          padding: 13px 28px;
          background: linear-gradient(
            90deg,
            #a77aed,
            #f27eb3
          );
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 15px;
          font-weight: bold;
          cursor: pointer;
        }

        .boton:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .mensaje {
          padding: 14px;
          border-radius: 12px;
          margin-bottom: 15px;
        }

        .error {
          color: #9c2440;
          background: #ffedf0;
        }

        .exito {
          color: #286b50;
          background: #e8f8f0;
        }

        .registro {
          background: #f7f2ff;
          border: 1px solid #e8dafa;
          border-radius: 16px;
          padding: 18px;
          margin-top: 14px;
          text-align: left;
        }

        .registro h3 {
          color: #6740a5;
          margin: 0 0 10px;
        }

        .registro p {
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          line-height: 1.6;
        }

        .fecha {
          color: #9389a5;
          font-size: 12px;
          margin-top: 12px;
        }

        .contador {
          color: #8f82a4;
          font-size: 14px;
        }
      `}</style>

      <main className="contenedor">
        <header className="encabezado">
          <h1>🦊 CONTIGO 💜</h1>
          <h2>Mi Diario Emocional</h2>
          <p className="subtitulo">
            Taller SENA · React + Flask + MariaDB
          </p>
        </header>

        {error && (
          <div className="mensaje error">
            {error}
          </div>
        )}

        {exito && (
          <div className="mensaje exito">
            {exito}
          </div>
        )}

        <section className="tarjeta">
          <h2>🌷 Nuevo escrito</h2>
          <p>
            Registra un escrito de prueba en CONTIGO.
          </p>

          <form onSubmit={guardarEscrito}>
            <label htmlFor="titulo">
              Título
            </label>

            <input
              id="titulo"
              type="text"
              maxLength={150}
              placeholder="Ejemplo: Prueba desde React"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
            />

            <label htmlFor="contenido">
              Contenido
            </label>

            <textarea
              id="contenido"
              placeholder="Escribe aquí tu prueba..."
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              required
            />

            <button
              className="boton"
              type="submit"
              disabled={guardando || cargando || !csrfToken}
            >
              {guardando
                ? "Guardando..."
                : "💜 Guardar en MariaDB"}
            </button>
          </form>
        </section>

        <section className="tarjeta">
          <h2>📖 Escritos registrados</h2>

          {cargando ? (
            <p>Consultando información...</p>
          ) : (
            <>
              <p className="contador">
                Total de escritos: {escritos.length}
              </p>

              {escritos.length === 0 ? (
                <p>No hay registros todavía.</p>
              ) : (
                escritos.map((escrito) => (
                  <article
                    className="registro"
                    key={escrito.id_entrada}
                  >
                    <h3>{escrito.titulo}</h3>

                    <p>{escrito.contenido}</p>

                    <div className="fecha">
                      Registro #{escrito.id_entrada}
                      {" · "}
                      {escrito.fecha_hora}
                    </div>
                  </article>
                ))
              )}
            </>
          )}
        </section>
      </main>
    </>
  );
}

export default App;
