import React from "react";
import "./Gamificacion.css";

const Gamificacion = ({ nivel, puntos, puntosSiguienteNivel, insignias }) => {
  const porcentajeProgreso = Math.min((puntos / puntosSiguienteNivel) * 100, 100);

  return (
    <div className="gamificacion-container">
      <h2 className="gamificacion-titulo">Progreso de Usuario</h2>

      <div className="nivel-info">
        <span className="nivel-label">Nivel:</span>
        <span className="nivel-valor">{nivel}</span>
      </div>

      <div className="puntos-info">
        <span className="puntos-label">Puntos:</span>
        <span className="puntos-valor">{puntos} / {puntosSiguienteNivel}</span>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${porcentajeProgreso}%` }}></div>
      </div>

      <div className="insignas-container">
        <h3>Insignas obtenidas:</h3>
        <div className="insignas-lista">
          {insignias.length === 0 && <span className="sin-insignas">No hay insignas aún</span>}
          {insignias.map((insignia, index) => (
            <div key={index} className="insignas-item">
              <img src={insignia.imagen} alt={insignia.nombre} className="insignas-img" />
              <span className="insignas-nombre">{insignia.nombre}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Gamificacion;
