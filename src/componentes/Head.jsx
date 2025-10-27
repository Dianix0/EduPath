import React from "react";
import "./Head.css";

function Head() {
  return (
    <header>
      <h1>EduPath</h1>
      <nav>
        <ul>
          <li><a href="inicio">Inicio</a></li>
          <li><a href="Progreso">Progreso</a></li>
          <li><a href="cursos">Cursos</a></li>
          <li><a href="contacto">Contacto</a></li>
        </ul>
      </nav>
    </header>
  );
}

export default Head;
