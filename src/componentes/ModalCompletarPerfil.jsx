import React, { useState } from "react";
import "./ModalCompletarPerfil.css";

export default function ModalCompletarPerfil({ usuario, onCompletado }) {
  const [edad, setEdad] = useState("");
  const [carrera, setCarrera] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!edad || !carrera.trim()) {
      setError("Por favor completa todos los campos.");
      return;
    }
    if (parseInt(edad) < 10 || parseInt(edad) > 100) {
      setError("Ingresa una edad válida.");
      return;
    }
    setCargando(true);
    fetch("/api/me/completar", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ edad: parseInt(edad), carrera: carrera.trim() }),
    })
      .then((res) => res.json())
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
            <input
              id="carrera"
              type="text"
              value={carrera}
              onChange={(e) => setCarrera(e.target.value)}
              placeholder="Ej: Ingeniería de Sistemas"
            />
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
