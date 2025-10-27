import React from "react";
import Head from "./componentes/Head";
import Info from "./componentes/Info";
import Foot from "./componentes/Foot";
import Cursos from './componentes/Cursos';
import Contacto from './componentes/Contacto';
import Gamificacion from './componentes/Gamificacion';
import './index.css';
import insignia1 from "./img/Insg-principiante.png";
import insignia2 from "./img/Insg-explorador.png";

const usuario = {
  nivel: 3,
  puntos: 120,
  puntosSiguienteNivel: 200,
  insignias: [
    { nombre: "Principiante", imagen: insignia1 },
    { nombre: "Explorador", imagen: insignia2 },
  ]
};

function App() {
  return (
    <>
      <section id="inicio">
        <Head/>
      </section>
      <Info/>
      <section id="Progreso">
      <Gamificacion 
        nivel={usuario.nivel}
        puntos={usuario.puntos}
        puntosSiguienteNivel={usuario.puntosSiguienteNivel}
        insignias={usuario.insignias}
      />
    </section>
      <section id="cursos">
        <Cursos/>
      </section>
      <section id="contacto">
        <Contacto/>
      </section>
      <Foot/>
    </>
  );
}

export default App
