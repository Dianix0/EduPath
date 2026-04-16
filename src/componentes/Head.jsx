import React from "react";
import { Link } from "react-router-dom";
import "./Head.css";

function Head() {
  return (
    <header>
      <h1>EduPath</h1>
      <nav>
        <ul>
          <li><Link to="/#inicio">Inicio</Link></li>
          <li><Link to="/progreso">Progreso</Link></li>
          <li><Link to="/cursos">Cursos</Link></li>
          {/* <li><Link to="/recomendaciones">Recomendaciones</Link></li> */}
          <li><Link to="/cuenta">Cuenta</Link></li>
        </ul>
      </nav>
    </header>
  );
}

export default Head;
