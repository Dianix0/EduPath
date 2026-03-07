import React, { useState, useEffect } from "react";
import "./Gamificacion.css";
import insigniaPrincipiante from "../img/Insg-principiante.png";
import insigniaExplorador from "../img/Insg-explorador.png";

const INSIGNIAS_INFO = {
  primer_curso:   { nombre: "Primer Curso",    imagen: insigniaPrincipiante },
  tres_cursos:    { nombre: "Tres Cursos",     imagen: insigniaExplorador },
  perfeccionista: { nombre: "Perfeccionista",  imagen: insigniaPrincipiante },
  explorador_bd:  { nombre: "Explorador BD",   imagen: insigniaExplorador },
  experto:        { nombre: "Experto",         imagen: insigniaExplorador },
};

const Gamificacion = () => {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/me/gamificacion", { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error("Sin sesión");
        return res.json();
      })
      .then((data) => {
        setDatos(data);
        setCargando(false);
      })
      .catch((err) => {
        setError(err.message);
        setCargando(false);
      });
  }, []);

  if (cargando) return <div className="gamificacion-container"><p>Cargando progreso...</p></div>;
  if (error)    return <div className="gamificacion-container"><p>Accede desde Moodle para ver tu progreso.</p></div>;

  const { puntos, nombre_nivel, puntos_siguiente_nivel, insignias, cursos_completados, cursos_en_progreso } = datos;
  const porcentaje = puntos_siguiente_nivel
    ? Math.min((puntos / puntos_siguiente_nivel) * 100, 100)
    : 100;

  return (
    <div className="gamificacion-container">
      <h2 className="gamificacion-titulo">Progreso de Usuario</h2>

      <div className="nivel-info">
        <span className="nivel-label">Nivel:</span>
        <span className="nivel-valor">{nombre_nivel}</span>
      </div>

      <div className="puntos-info">
        <span className="puntos-label">Puntos:</span>
        <span className="puntos-valor">
          {puntos} {puntos_siguiente_nivel ? `/ ${puntos_siguiente_nivel}` : "(Nivel máximo)"}
        </span>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${porcentaje}%` }} />
      </div>

      <div className="cursos-stats">
        <span>✅ Completados: <strong>{cursos_completados}</strong></span>
        <span>📖 En progreso: <strong>{cursos_en_progreso}</strong></span>
      </div>

      <div className="insignas-container">
        <h3>Insignias obtenidas:</h3>
        <div className="insignas-lista">
          {insignias.length === 0 && (
            <span className="sin-insignas">Aún no tienes insignias. ¡Completa cursos para ganarlas!</span>
          )}
          {insignias.map((key, index) => {
            const info = INSIGNIAS_INFO[key] || { nombre: key, imagen: insigniaPrincipiante };
            return (
              <div key={index} className="insignas-item">
                <img src={info.imagen} alt={info.nombre} className="insignas-img" />
                <span className="insignas-nombre">{info.nombre}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Gamificacion;