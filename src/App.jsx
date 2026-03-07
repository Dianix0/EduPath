import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Head from "./componentes/Head";
import Info from "./componentes/Info";
import Foot from "./componentes/Foot";
import Cursos from './componentes/Cursos';
import Contacto from './componentes/Contacto';
import Gamificacion from './componentes/Gamificacion';
import PaginaCursos from './componentes/PaginaCursos';
import PaginaCuenta from './componentes/PaginaCuenta';
import ModalCompletarPerfil from './componentes/ModalCompletarPerfil';
import './index.css';
import insignia1 from "./img/Insg-principiante.png";
import insignia2 from "./img/Insg-explorador.png";

const insigniasFijas = [
  { nombre: "Principiante", imagen: insignia1 },
  { nombre: "Explorador", imagen: insignia2 },
];

function PaginaPrincipal({ usuario }) {
  return (
    <>
      <section id="inicio">
        <Head/>
      </section>
      <Info/>
      <section id="Progreso">
        <Gamificacion
          nivel={usuario?.nivel ?? 1}
          puntos={usuario?.puntos ?? 0}
          puntosSiguienteNivel={200}
          insignias={insigniasFijas}
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

function PaginaCursosPage() {
  return (
    <>
      <Head/>
      <PaginaCursos/>
      <Foot/>
    </>
  );
}

function PaginaContacto() {
  return (
    <>
      <Head/>
      <Contacto/>
      <Foot/>
    </>
  );
}

function PaginaCuentaPage() {
  return (
    <>
      <Head/>
      <PaginaCuenta/>
      <Foot/>
    </>
  );
}

function App() {
  const [usuario, setUsuario] = useState(null);
  const [perfilPendiente, setPerfilPendiente] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setUsuario(data);
        if (!data.edad || !data.carrera) {
          setPerfilPendiente(true);
        }
      });
  }, []);

  const handlePerfilCompletado = (datosActualizados) => {
    setUsuario(datosActualizados);
    setPerfilPendiente(false);
  };

  return (
    <>
      {perfilPendiente && usuario && (
        <ModalCompletarPerfil
          usuario={usuario}
          onCompletado={handlePerfilCompletado}
        />
      )}
      <Routes>
        <Route path="/" element={<PaginaPrincipal usuario={usuario} />} />
        <Route path="/launch" element={<Navigate to="/" replace />} />
        <Route path="/contacto" element={<PaginaContacto />} />
        <Route path="/cursos" element={<PaginaCursosPage />} />
        <Route path="/cuenta" element={<PaginaCuentaPage />} />
      </Routes>
    </>
  );
}

export default App
