import React, { useState, useEffect } from "react";
import "./ModalCompletarPerfil.css";

export default function ModalCompletarPerfil({ usuario, onCompletado }) {
  const [edad, setEdad] = useState("");
  const [carrera, setCarrera] = useState("");
  const [carreras, setCarreras] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [interesesSeleccionados, setInteresesSeleccionados] = useState(new Set());
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/carreras").then((r) => r.json()),
      fetch("/api/cursos/etiquetas-por-categoria").then((r) => r.json()),
    ]).then(([listaCarreras, listaCats]) => {
      setCarreras(Array.isArray(listaCarreras) ? listaCarreras : []);
      setCategorias(Array.isArray(listaCats) ? listaCats : []);
    });
  }, []);

const MAX = 6;

const toggleInteres = (tag) => {
  setInteresesSeleccionados((prev) => {
    const s = new Set(prev);

    if (!s.has(tag) && s.size >= MAX) {
      return s; // bloquea si ya hay 6
    }

    s.has(tag) ? s.delete(tag) : s.add(tag);
    return s;
  });
};

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!edad || !carrera) {
      setError("Por favor completa todos los campos.");
      return;
    }
    if (parseInt(edad) < 10 || parseInt(edad) > 100) {
      setError("Ingresa una edad válida.");
      return;
    }
    if (interesesSeleccionados.size === 0) {
      setError("Selecciona al menos un interés.");
      return;
    }
    setCargando(true);
    fetch("/api/me/completar", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ edad: parseInt(edad), carrera: parseInt(carrera) }),
    })
      .then((res) => res.json())
      .then((data) =>
        Promise.all(
          [...interesesSeleccionados].map((tag) =>
            fetch("/api/me/intereses", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ interes: tag }),
            })
          )
        ).then(() => data)
      )
      .then((data) => {
        setCargando(false);
        onCompletado(data);
      })
      .catch(() => {
        setCargando(false);
        setError("Error al guardar. Intenta de nuevo.");
      });
  };

  return (
    <div className="mcp-overlay">
      <div className="mcp-modal">
        <h2>Bienvenido, {usuario.nombre}</h2>
        <p className="mcp-subtitulo">
          Completa tu perfil para comenzar en EduPath.
        </p>

        <form onSubmit={handleSubmit} className="mcp-form">
          <div className="mcp-field">
            <label htmlFor="edad">Edad</label>
            <input
              id="edad"
              type="number"
              min="10"
              max="100"
              value={edad}
              onChange={(e) => setEdad(e.target.value)}
              placeholder="Ej: 21"
            />
          </div>

          <div className="mcp-field">
            <label htmlFor="carrera">Carrera</label>
            <select
              id="carrera"
              value={carrera}
              onChange={(e) => setCarrera(e.target.value)}
            >
              <option value="">Selecciona tu carrera</option>
              {carreras.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div className="mcp-field">
            <label>
              Intereses{" "}
              <span className="mcp-label-hint">
                (selecciona al menos uno)
              </span>
            </label>
            {categorias.length === 0 ? (
              <p className="mcp-hint">Cargando etiquetas...</p>
            ) : (
              <div className="mcp-intereses-scroll">
                {categorias.map((cat) => (
                  <div key={cat.categoria} className="mcp-curso-grupo">
                    <p className="mcp-curso-titulo">{cat.categoria}</p>
                    <div className="mcp-chips">
                      {cat.etiquetas.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          className={`mcp-chip ${interesesSeleccionados.has(tag) ? "activo" : ""}`}
                          onClick={() => toggleInteres(tag)}
                        >
                          {tag}
                          <span className="mcp-chip-icono">
                            {interesesSeleccionados.has(tag) ? "✓" : "+"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="mcp-error">{error}</p>}

          <button type="submit" className="mcp-btn" disabled={cargando}>
            {cargando ? "Guardando..." : "Comenzar"}
          </button>
        </form>
      </div>
    </div>
  );
}
