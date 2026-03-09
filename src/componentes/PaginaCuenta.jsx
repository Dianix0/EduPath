import React, { useState, useEffect } from "react";
import "./PaginaCuenta.css";
import AdminTab from "./AdminTab";

function ConfiguracionTab({ usuario, onActualizado }) {
  const [email, setEmail] = useState(usuario.email || "");
  const [edad, setEdad] = useState(usuario.edad || "");
  const [carrera, setCarrera] = useState(usuario.carrera || "");
  const [carreras, setCarreras] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    fetch("/api/carreras").then((r) => r.json()).then(setCarreras);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmando(true);
  };

  const confirmarGuardar = () => {
    setConfirmando(false);
    setMensaje("");
    setError("");
    setCargando(true);
    fetch("/api/me/configuracion", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        edad: parseInt(edad) || null,
        carrera: parseInt(carrera) || null,
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
          <select value={carrera} onChange={(e) => setCarrera(e.target.value)}>
            <option value="">Selecciona tu carrera</option>
            {carreras.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
        {mensaje && <p className="cuenta-ok">{mensaje}</p>}
        {error && <p className="cuenta-error">{error}</p>}
        {confirmando ? (
          <div className="cuenta-confirm">
            <p className="cuenta-confirm-msg">
              ¿Seguro que quiere guardar los cambios? Esto podría afectar a sus recomendaciones.
            </p>
            <div className="cuenta-confirm-actions">
              <button type="button" className="cuenta-btn" onClick={confirmarGuardar}>
                Confirmar
              </button>
              <button type="button" className="cuenta-btn-cancel" onClick={() => setConfirmando(false)}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button type="submit" className="cuenta-btn" disabled={cargando}>
            {cargando ? "Guardando..." : "Guardar cambios"}
          </button>
        )}
      </form>
    </div>
  );
}

function InteresesTab() {
  const [cursosConEtiquetas, setCursosConEtiquetas] = useState([]);
  const [misIntereses, setMisIntereses] = useState(new Set());
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/cursos/con-etiquetas").then((r) => r.json()),
      fetch("/api/me/intereses").then((r) => r.json()),
    ]).then(([cursos, intereses]) => {
      setCursosConEtiquetas(Array.isArray(cursos) ? cursos : []);
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
      <input
        className="intereses-search"
        type="text"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar curso o etiqueta..."
      />
      {cursosConEtiquetas.length === 0 ? (
        <p className="cuenta-loading">No hay etiquetas disponibles aún.</p>
      ) : (
        <div className="intereses-cursos">
          {cursosConEtiquetas
            .map((curso) => {
              const q = busqueda.toLowerCase();
              const etiquetasFiltradas = q
                ? curso.etiquetas.filter((t) => t.toLowerCase().includes(q))
                : curso.etiquetas;
              const cursoCoincide = curso.titulo.toLowerCase().includes(q);
              const etiquetasMostradas = cursoCoincide ? curso.etiquetas : etiquetasFiltradas;
              if (etiquetasMostradas.length === 0) return null;
              return (
                <div key={curso.id} className="intereses-curso-grupo">
                  <h4 className="intereses-curso-titulo">{curso.titulo}</h4>
                  <div className="intereses-grid">
                    {etiquetasMostradas.map((tag) => (
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
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

function MisCursosTab() {
  const [cursos, setCursos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch("/api/me/mis-cursos")
      .then((r) => r.json())
      .then((data) => {
        setCursos(Array.isArray(data) ? data : []);
        setCargando(false);
      })
      .catch(() => setCargando(false));
  }, []);

  if (cargando) return <div className="cuenta-panel"><p className="cuenta-loading">Cargando...</p></div>;

  return (
    <div className="cuenta-panel">
      <h3>Mis cursos</h3>
      {cursos.length === 0 ? (
        <p className="cuenta-loading">Aún no has iniciado ningún curso.</p>
      ) : (
        <div className="miscursos-grid">
          {cursos.map((c) => (
            <div key={c.id} className="miscurso-card">
              <div className="miscurso-categoria">{c.categoria || "General"}</div>
              <h4 className="miscurso-titulo">{c.titulo}</h4>
              <p className="miscurso-desc">{c.descripcion}</p>
              <div className="miscurso-barra-wrap">
                <div className="miscurso-barra">
                  <div
                    className="miscurso-barra-fill"
                    style={{ width: `${c.progreso || 0}%` }}
                  />
                </div>
                <span className="miscurso-progreso">{c.progreso || 0}%</span>
              </div>
              {c.calificacion > 0 && (
                <p className="miscurso-cal">Calificación: {c.calificacion}%</p>
              )}
            </div>
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
    fetch("/api/me")
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
          <button
            className={tab === "miscursos" ? "activo" : ""}
            onClick={() => setTab("miscursos")}
          >
            Mis cursos
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
        {tab === "miscursos" && <MisCursosTab />}
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
