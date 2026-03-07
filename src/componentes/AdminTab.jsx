import React, { useState, useEffect } from "react";
import "./AdminTab.css";

// ============================================================
// SECCION CURSOS
// ============================================================
function CursosAdmin() {
  const [cursos, setCursos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState(null); // null | "nuevo" | id
  const [form, setForm] = useState({ titulo: "", descripcion: "", categoria: "", duracion: "" });
  const [etiquetasEdit, setEtiquetasEdit] = useState([]);
  const [todasEtiquetas, setTodasEtiquetas] = useState([]);
  const [etiquetaSeleccionada, setEtiquetaSeleccionada] = useState("");
  const [modoNueva, setModoNueva] = useState(false);
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState("");

  useEffect(() => {
    cargarCursos();
    fetch("/api/cursos/etiquetas").then((r) => r.json()).then(setTodasEtiquetas);
  }, []);

  const cargarCursos = () =>
    fetch("/api/cursos/").then((r) => r.json()).then(setCursos);

  const abrirNuevo = () => {
    setForm({ titulo: "", descripcion: "", categoria: "", duracion: "" });
    setEtiquetasEdit([]);
    setEditando("nuevo");
  };

  const abrirEditar = (curso) => {
    setForm({
      titulo: curso.titulo || "",
      descripcion: curso.descripcion || "",
      categoria: curso.categoria || "",
      duracion: curso.duracion || "",
    });
    setEditando(curso.id);
    fetch(`/api/cursos/${curso.id}/etiquetas`)
      .then((r) => r.json())
      .then((data) => setEtiquetasEdit(data.map((e) => e.etiqueta)));
  };

  const cancelar = () => {
    setEditando(null);
    setEtiquetasEdit([]);
    setEtiquetaSeleccionada("");
    setModoNueva(false);
    setNuevaEtiqueta("");
  };

  const guardar = () => {
    if (!form.titulo.trim()) return;
    const body = { ...form, duracion: parseInt(form.duracion) || null };

    if (editando === "nuevo") {
      fetch("/api/cursos/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
        .then((r) => r.json())
        .then((data) =>
          Promise.all(
            etiquetasEdit.map((e) =>
              fetch(`/api/cursos/${data.id}/etiquetas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ etiqueta: e }),
              })
            )
          )
        )
        .then(() => { cancelar(); cargarCursos(); });
    } else {
      fetch(`/api/cursos/${editando}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(() => { cancelar(); cargarCursos(); });
    }
  };

  const eliminar = (id) => {
    if (!window.confirm("¿Eliminar este curso? Esta acción no se puede deshacer.")) return;
    fetch(`/api/cursos/${id}`, { method: "DELETE" }).then(cargarCursos);
  };

  const agregarEtiqueta = () => {
    const tag = (modoNueva ? nuevaEtiqueta : etiquetaSeleccionada).trim();
    if (!tag || etiquetasEdit.includes(tag)) return;
    if (editando !== "nuevo") {
      fetch(`/api/cursos/${editando}/etiquetas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etiqueta: tag }),
      });
    }
    setEtiquetasEdit((prev) => [...prev, tag]);
    setEtiquetaSeleccionada("");
    setModoNueva(false);
    setNuevaEtiqueta("");
    if (modoNueva) setTodasEtiquetas((prev) => prev.includes(tag) ? prev : [...prev, tag]);
  };

  const quitarEtiqueta = (tag) => {
    if (editando !== "nuevo") {
      fetch(`/api/cursos/${editando}/etiquetas/${encodeURIComponent(tag)}`, {
        method: "DELETE",
      });
    }
    setEtiquetasEdit((prev) => prev.filter((e) => e !== tag));
  };

  if (editando !== null) {
    return (
      <div className="at-form-wrap">
        <h4>{editando === "nuevo" ? "Nuevo curso" : "Editar curso"}</h4>
        <div className="at-form">
          <div className="at-field">
            <label>Título *</label>
            <input
              value={form.titulo}
              onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
              placeholder="Título del curso"
            />
          </div>
          <div className="at-field">
            <label>Descripción</label>
            <textarea
              rows={3}
              value={form.descripcion}
              onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
              placeholder="Descripción del curso"
            />
          </div>
          <div className="at-form-row">
            <div className="at-field">
              <label>Categoría</label>
              <input
                value={form.categoria}
                onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value }))}
                placeholder="Ej: Programación"
              />
            </div>
            <div className="at-field">
              <label>Duración (min)</label>
              <input
                type="number"
                value={form.duracion}
                onChange={(e) => setForm((p) => ({ ...p, duracion: e.target.value }))}
                placeholder="Ej: 120"
              />
            </div>
          </div>
          <div className="at-field">
            <label>Etiquetas</label>
            <div className="at-tags-list">
              {etiquetasEdit.map((tag) => (
                <span key={tag} className="at-tag">
                  {tag}
                  <button onClick={() => quitarEtiqueta(tag)}>×</button>
                </span>
              ))}
            </div>
            <div className="at-tag-input">
              {modoNueva ? (
                <>
                  <input
                    value={nuevaEtiqueta}
                    onChange={(e) => setNuevaEtiqueta(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && agregarEtiqueta()}
                    placeholder="Nombre de la nueva etiqueta"
                    autoFocus
                  />
                  <button className="at-btn-secondary" onClick={() => { setModoNueva(false); setNuevaEtiqueta(""); }}>
                    Cancelar
                  </button>
                </>
              ) : (
                <select
                  value={etiquetaSeleccionada}
                  onChange={(e) => {
                    if (e.target.value === "__nueva__") {
                      setModoNueva(true);
                      setEtiquetaSeleccionada("");
                    } else {
                      setEtiquetaSeleccionada(e.target.value);
                    }
                  }}
                >
                  <option value="">Selecciona una etiqueta...</option>
                  {todasEtiquetas
                    .filter((t) => !etiquetasEdit.includes(t))
                    .map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  <option value="__nueva__">➕ Crear nueva etiqueta...</option>
                </select>
              )}
              {!modoNueva && (
                <button className="at-btn-secondary" onClick={agregarEtiqueta} disabled={!etiquetaSeleccionada}>
                  Agregar
                </button>
              )}
              {modoNueva && (
                <button className="at-btn-secondary" onClick={agregarEtiqueta}>
                  Agregar
                </button>
              )}
            </div>
          </div>
          <div className="at-form-actions">
            <button className="at-btn-primary" onClick={guardar}>
              Guardar
            </button>
            <button className="at-btn-secondary" onClick={cancelar}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const cursosFiltrados = cursos.filter((c) => {
    const q = busqueda.toLowerCase();
    return (
      c.titulo?.toLowerCase().includes(q) ||
      c.categoria?.toLowerCase().includes(q) ||
      c.descripcion?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="at-section-header">
        <span>{cursosFiltrados.length} de {cursos.length} curso(s)</span>
        <button className="at-btn-primary" onClick={abrirNuevo}>
          + Nuevo curso
        </button>
      </div>
      <input
        className="at-search"
        type="text"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por título, categoría o descripción..."
      />
      <div className="at-cursos-list">
        {cursosFiltrados.map((curso) => (
          <div key={curso.id} className="at-curso-card">
            <div className="at-curso-info">
              <strong>{curso.titulo}</strong>
              <div className="at-curso-meta">
                {curso.categoria && <span className="at-badge">{curso.categoria}</span>}
                {curso.duracion && <span className="at-muted">{curso.duracion} min</span>}
              </div>
              {curso.descripcion && (
                <p className="at-curso-desc">{curso.descripcion}</p>
              )}
            </div>
            <div className="at-curso-actions">
              <button className="at-btn-edit" onClick={() => abrirEditar(curso)}>
                Editar
              </button>
              <button className="at-btn-delete" onClick={() => eliminar(curso.id)}>
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// SECCION USUARIOS
// ============================================================
function UsuariosAdmin() {
  const [usuarios, setUsuarios] = useState([]);
  const [carreras, setCarreras] = useState({});
  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);

  useEffect(() => {
    fetch("/api/admin/usuarios").then((r) => r.json()).then(setUsuarios);
    fetch("/api/carreras").then((r) => r.json()).then((lista) => {
      const mapa = {};
      lista.forEach((c) => { mapa[c.id] = c.nombre; });
      setCarreras(mapa);
    });
  }, []);

  const verDetalle = (id) => {
    if (seleccionado?.id === id) { setSeleccionado(null); return; }
    fetch(`/api/admin/usuarios/${id}/detalle`)
      .then((r) => r.json())
      .then(setSeleccionado);
  };

  const eliminarUsuario = (id, nombre) => {
    if (!window.confirm(`¿Eliminar al usuario "${nombre}"? Esta acción no se puede deshacer.`)) return;
    fetch(`/api/admin/usuarios/${id}`, { method: "DELETE" }).then(() => {
      if (seleccionado?.id === id) setSeleccionado(null);
      fetch("/api/admin/usuarios").then((r) => r.json()).then(setUsuarios);
    });
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const q = busqueda.toLowerCase();
    const nombreCarrera = (carreras[u.carrera] || "").toLowerCase();
    return (
      u.nombre?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      nombreCarrera.includes(q) ||
      u.rol?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="at-section-header" style={{ marginBottom: "0.75rem" }}>
        <span className="at-muted">{usuariosFiltrados.length} de {usuarios.length} usuario(s)</span>
      </div>
      <input
        className="at-search"
        type="text"
        value={busqueda}
        onChange={(e) => { setBusqueda(e.target.value); setSeleccionado(null); }}
        placeholder="Buscar por nombre, email, carrera o rol..."
      />
      <div className="at-table-wrap">
        <table className="at-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Carrera</th>
              <th>Rol</th>
              <th>Nivel</th>
              <th>Puntos</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map((u) => (
              <React.Fragment key={u.id}>
                <tr className={seleccionado?.id === u.id ? "at-row-active" : ""}>
                  <td>{u.nombre}</td>
                  <td>{u.email || "—"}</td>
                  <td>{carreras[u.carrera] || "—"}</td>
                  <td>
                    <span className={`at-rol-badge at-rol-${(u.rol || "").toLowerCase()}`}>
                      {u.rol || "—"}
                    </span>
                  </td>
                  <td>{u.nivel}</td>
                  <td>{u.puntos}</td>
                  <td style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                    <button
                      className="at-btn-ver"
                      onClick={() => verDetalle(u.id)}
                      title="Ver detalle"
                    >
                      {seleccionado?.id === u.id ? "▲" : "▼"}
                    </button>
                    <button
                      className="at-btn-delete"
                      onClick={() => eliminarUsuario(u.id, u.nombre)}
                      title="Eliminar usuario"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>

                {seleccionado?.id === u.id && (
                  <tr className="at-detalle-row">
                    <td colSpan={7}>
                      <div className="at-detalle">
                        <div className="at-detalle-intereses">
                          <strong>Intereses:</strong>{" "}
                          {seleccionado.intereses.length === 0 ? (
                            <span className="at-muted">Sin intereses registrados</span>
                          ) : (
                            seleccionado.intereses.map((i) => (
                              <span key={i.interes} className="at-tag-readonly">
                                {i.interes}
                              </span>
                            ))
                          )}
                        </div>

                        <div className="at-detalle-interacciones">
                          <strong>Interacciones con cursos:</strong>
                          {seleccionado.interacciones.length === 0 ? (
                            <span className="at-muted"> Sin interacciones</span>
                          ) : (
                            <table className="at-inner-table">
                              <thead>
                                <tr>
                                  <th>Curso</th>
                                  <th>Progreso</th>
                                  <th>Calificación</th>
                                  <th>Última actividad</th>
                                </tr>
                              </thead>
                              <tbody>
                                {seleccionado.interacciones.map((i) => (
                                  <tr key={i.curso_id}>
                                    <td>{i.curso_titulo}</td>
                                    <td>
                                      {i.progreso != null ? (
                                        <div className="at-progreso-wrap">
                                          <div
                                            className="at-progreso-bar"
                                            style={{ width: `${i.progreso}%` }}
                                          />
                                          <span>{i.progreso}%</span>
                                        </div>
                                      ) : "—"}
                                    </td>
                                    <td>{i.calificacion ?? "—"}</td>
                                    <td>{i.fecha_ultima_actividad || "—"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// SECCION CARRERAS
// ============================================================
function CarrerasAdmin() {
  const [carreras, setCarreras] = useState([]);
  const [nuevaNombre, setNuevaNombre] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { cargarCarreras(); }, []);

  const cargarCarreras = () =>
    fetch("/api/admin/carreras").then((r) => r.json()).then(setCarreras);

  const agregar = () => {
    const nombre = nuevaNombre.trim();
    if (!nombre) return;
    setError("");
    fetch("/api/admin/carreras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setNuevaNombre("");
        cargarCarreras();
      });
  };

  const eliminar = (id, nombre) => {
    if (!window.confirm(`¿Eliminar la carrera "${nombre}"?`)) return;
    fetch(`/api/admin/carreras/${id}`, { method: "DELETE" }).then(cargarCarreras);
  };

  return (
    <div>
      <div className="at-section-header">
        <span>{carreras.length} carrera(s) registrada(s)</span>
      </div>
      <div className="at-form-wrap" style={{ marginBottom: "1.5rem" }}>
        <div className="at-tag-input">
          <input
            value={nuevaNombre}
            onChange={(e) => setNuevaNombre(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && agregar()}
            placeholder="Nombre de la nueva carrera"
          />
          <button className="at-btn-primary" onClick={agregar}>
            Agregar
          </button>
        </div>
        {error && <p style={{ color: "#e53e3e", fontSize: "0.85rem", marginTop: "0.5rem" }}>{error}</p>}
      </div>
      <div className="at-cursos-list">
        {carreras.map((c) => (
          <div key={c.id} className="at-curso-card">
            <div className="at-curso-info">
              <strong>{c.nombre}</strong>
            </div>
            <div className="at-curso-actions">
              <button className="at-btn-delete" onClick={() => eliminar(c.id, c.nombre)}>
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// ADMIN TAB PRINCIPAL
// ============================================================
export default function AdminTab() {
  const [subTab, setSubTab] = useState("cursos");

  return (
    <div className="at-container">
      <div className="at-subtabs">
        <button
          className={subTab === "cursos" ? "activo" : ""}
          onClick={() => setSubTab("cursos")}
        >
          Cursos
        </button>
        <button
          className={subTab === "usuarios" ? "activo" : ""}
          onClick={() => setSubTab("usuarios")}
        >
          Usuarios
        </button>
        <button
          className={subTab === "carreras" ? "activo" : ""}
          onClick={() => setSubTab("carreras")}
        >
          Carreras
        </button>
      </div>
      <div className="at-content">
        {subTab === "cursos" && <CursosAdmin />}
        {subTab === "usuarios" && <UsuariosAdmin />}
        {subTab === "carreras" && <CarrerasAdmin />}
      </div>
    </div>
  );
}
