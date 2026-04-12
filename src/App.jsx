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
import PaginaCurso from './componentes/PaginaCurso';
import PaginaRecomendaciones from './componentes/PaginaRecomendaciones';
import Recomendaciones from './componentes/Recomendaciones';
import ModalCompletarPerfil from './componentes/ModalCompletarPerfil';
import MoodlePanel from './componentes/moodle/MoodlePanel';
import './index.css';

function PaginaPrincipal({ usuario }) {
  return (
    <>
      <section id="inicio">
        <Head/>
      </section>
      <Info/>
      <section id="Progreso">
        <Gamificacion/>
      </section>
      {/*<section id="cursos">
        <Cursos/>
      </section>*/}
       {/* Recomendaciones — se muestran solo si hay sesión activa */}
      <section id="recomendaciones">
        <Recomendaciones/>
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

function PaginaProgreso({ usuario }) {
  if (!usuario) return (
    <>
      <Head/>
      <div style={{ textAlign: 'center', padding: '80px', color: '#6b7280', minHeight:'calc(100vh - 140px)' }}>
        Debes acceder desde Moodle para ver tu progreso.
      </div>
      <Foot/>
    </>
  );
  const rolMoodle =
    usuario?.rol === "Administrador" ? "admin" :
    usuario?.rol === "Docente"       ? "docente" :
    "estudiante";

  return (
    <>
      <Head/>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 24px', minHeight:'calc(100vh - 140px)'  }}>
        <MoodlePanel
          rol={rolMoodle}
          userId={usuario?.moodle_id}
          userName={usuario?.nombre}
        />
      </div>
      <Foot/>
    </>
  );
}

function App() {
  const [usuario, setUsuario] = useState(null);
  const [perfilPendiente, setPerfilPendiente] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sid = params.get('sid')
    
    if (sid) {
        // Establecer sesión en Flask
        fetch("/api/me/set-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
            body: JSON.stringify({ estudiante_id: parseInt(sid) })
        })
        .then(res => res.json())
        .then(data => {
            if (!data.error) {
                setUsuario(data)
                if ((!data.edad || !data.carrera) && data.rol !== "Administrador") {
                    setPerfilPendiente(true)
                }
            }
        })
        window.history.replaceState({}, '', '/')
        return
    }

    fetch("/api/me", { credentials: 'include' })
        .then((res) => {
            if (!res.ok) return null
            return res.json()
        })
        .then((data) => {
            if (!data) return
            setUsuario(data)
            if ((!data.edad || !data.carrera) && data.rol !== "Administrador") {
                setPerfilPendiente(true)
            }
        })
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
        <Route path="/progreso" element={<PaginaProgreso usuario={usuario} />} />
        <Route path="/cursos" element={<PaginaCursosPage />} />
        <Route path="/cursos/:id" element={<PaginaCurso />} />
        {/* DESACTIVADO: Recomendaciones ahora se muestran en la página principal
        <Route path="/recomendaciones" element={<><Head/><PaginaRecomendaciones/><Foot/></>} />
        */}
        <Route path="/cuenta" element={<PaginaCuentaPage />} />
      </Routes>
    </>
  );
}

export default App
