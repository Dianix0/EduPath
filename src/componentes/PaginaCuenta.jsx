import React, { useState, useEffect } from "react";
import "./PaginaCuenta.css";
import AdminTab from "./AdminTab";

function ConfiguracionTab({ usuario, onActualizado }) {
  const [email, setEmail] = useState(usuario.email || "");
  const [edad, setEdad] = useState(usuario.edad || "");
  const [carrera, setCarrera] = useState(usuario.carrera || "");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");
    setCargando(true);
    fetch("/api/me/configuracion", { credentials: 'include' }, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        edad: parseInt(edad) || null,
        carrera: carrera.trim(),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setCargando(false);
        if (data.error) { setError(data.error); return; }
        setMensaje("Datos actualizados correctamente.");
        onActualizado(data);
      })
      .catch(() => {
        setCargando(false);
        setError("Error al guardar. Intenta de nuevo.");
      });
  };

  return (
    <div className="cuenta-panel">
      <h3>Configuración de cuenta</h3>
      <form className="cuenta-form" onSubmit={handleSubmit}>
        <div className="cuenta-field">
          <label>Nombre</label>
          <input value={usuario.nombre} disabled className="disabled" />
        </div>
        <div className="cuenta-field">
          <label>Rol</label>
          <input value={usuario.rol || "Sin rol asignado"} disabled className="disabled" />
        </div>
        <div className="cuenta-field">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
          />
        </div>
        <div className="cuenta-field">
          <label>Edad</label>
          <input
            type="number"
            min="10"
            max="100"
            value={edad}
            onChange={(e) => setEdad(e.target.value)}
            placeholder="Ej: 21"
          />
        </div>
        <div className="cuenta-field">
          <label>Carrera</label>
          <input
            type="text"
            value={carrera}
            onChange={(e) => setCarrera(e.target.value)}
            placeholder="Ej: Ingeniería de Sistemas"
          />
        </div>
        {mensaje && <p className="cuenta-ok">{mensaje}</p>}
        {error && <p className="cuenta-error">{error}</p>}
        <button type="submit" className="cuenta-btn" disabled={cargando}>
          {cargando ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}

function InteresesTab() {
  const [etiquetas, setEtiquetas] = useState([]);
  const [misIntereses, setMisIntereses] = useState(new Set());
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/cursos/etiquetas", { credentials: 'include' }).then((r) => r.json()),
      fetch("/api/me/intereses", { credentials: 'include' }).then((r) => r.json()),
    ]).then(([tags, intereses]) => {
      setEtiquetas(Array.isArray(tags) ? tags : []);
      setMisIntereses(new Set(
        Array.isArray(intereses) ? intereses.map((i) => i.interes) : []
      ));
      setCargando(false);
    });
  }, []);

  const toggleInteres = (etiqueta) => {
    if (misIntereses.has(etiqueta)) {
      fetch(`/api/me/intereses/${encodeURIComponent(etiqueta)}`, {
        method: "DELETE",
        credentials: 'include',
      }).then(() => {
        setMisIntereses((prev) => {
          const s = new Set(prev);
          s.delete(etiqueta);
          return s;
        });
      });
    } else {
      fetch("/api/me/intereses", {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interes: etiqueta }),
      }).then(() => {
        setMisIntereses((prev) => new Set([...prev, etiqueta]));
      });
    }
  };

  if (cargando) return <div className="cuenta-panel"><p className="cuenta-loading">Cargando...</p></div>;

  return (
    <div className="cuenta-panel">
      <h3>Mis intereses</h3>
      <p className="intereses-subtitulo">
        Selecciona los temas que te interesan para recibir mejores recomendaciones.
      </p>
      {etiquetas.length === 0 ? (
        <p className="cuenta-loading">No hay etiquetas disponibles aún.</p>
      ) : (
        <div className="intereses-grid">
          {etiquetas.map((tag) => (
            <button
              key={tag}
              className={`interes-chip ${misIntereses.has(tag) ? "activo" : ""}`}
              onClick={() => toggleInteres(tag)}
            >
              {tag}
              <span className="chip-icono">{misIntereses.has(tag) ? "✓" : "+"}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PaginaCuenta() {
  const [tab, setTab] = useState("configuracion");
  const [usuario, setUsuario] = useState(null);
  const [sinSesion, setSinSesion] = useState(false);

  useEffect(() => {
    fetch("/api/me", { credentials: 'include' })
      .then((res) => {
        if (!res.ok) { setSinSesion(true); return null; }
        return res.json();
      })
      .then((data) => { if (data) setUsuario(data); });
  }, []);

  if (sinSesion) {
    return (
      <div className="cuenta-container">
        <p className="cuenta-no-sesion">
          Debes acceder a través de Moodle para ver tu cuenta.
        </p>
      </div>
    );
  }

  if (!usuario) {
    return <div className="cuenta-container"><p className="cuenta-loading">Cargando...</p></div>;
  }

  return (
    <div className="cuenta-container">
      <aside className="cuenta-sidebar">
        <div className="cuenta-avatar">{usuario.nombre.charAt(0).toUpperCase()}</div>
        <h2 className="cuenta-nombre-sidebar">{usuario.nombre}</h2>
        <p className="cuenta-email-sidebar">{usuario.email || "Sin email"}</p>
        <nav className="cuenta-nav">
          <button
            className={tab === "configuracion" ? "activo" : ""}
            onClick={() => setTab("configuracion")}
          >
            Configuración
          </button>
          <button
            className={tab === "intereses" ? "activo" : ""}
            onClick={() => setTab("intereses")}
          >
            Intereses
          </button>
          {usuario.rol === "Administrador" && (
            <button
              className={tab === "herramienta" ? "activo" : ""}
              onClick={() => setTab("herramienta")}
            >
              Herramienta
            </button>
          )}
        </nav>
      </aside>

      <main className="cuenta-contenido">
        {tab === "configuracion" && (
          <ConfiguracionTab usuario={usuario} onActualizado={setUsuario} />
        )}
        {tab === "intereses" && <InteresesTab />}
        {tab === "herramienta" && (
          <div className="cuenta-panel">
            <h3>Configuración de la herramienta</h3>
            <AdminTab />
          </div>
        )}
      </main>
    </div>
  );
}
