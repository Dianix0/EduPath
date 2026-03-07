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
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState("");

  useEffect(() => { cargarCursos(); }, []);

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
    const tag = nuevaEtiqueta.trim();
    if (!tag || etiquetasEdit.includes(tag)) return;
    if (editando !== "nuevo") {
      fetch(`/api/cursos/${editando}/etiquetas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etiqueta: tag }),
      });
    }
    setEtiquetasEdit((prev) => [...prev, tag]);
    setNuevaEtiqueta("");
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
              <input
                value={nuevaEtiqueta}
                onChange={(e) => setNuevaEtiqueta(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && agregarEtiqueta()}
                placeholder="Nueva etiqueta (Enter para agregar)"
              />
              <button className="at-btn-secondary" onClick={agregarEtiqueta}>
                Agregar
              </button>
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
  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);

  useEffect(() => {
    fetch("/api/admin/usuarios").then((r) => r.json()).then(setUsuarios);
  }, []);

  const verDetalle = (id) => {
    if (seleccionado?.id === id) { setSeleccionado(null); return; }
    fetch(`/api/admin/usuarios/${id}/detalle`)
      .then((r) => r.json())
      .then(setSeleccionado);
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const q = busqueda.toLowerCase();
    return (
      u.nombre?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.carrera?.toLowerCase().includes(q) ||
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
                  <td>{u.carrera || "—"}</td>
                  <td>
                    <span className={`at-rol-badge at-rol-${(u.rol || "").toLowerCase()}`}>
                      {u.rol || "—"}
                    </span>
                  </td>
                  <td>{u.nivel}</td>
                  <td>{u.puntos}</td>
                  <td>
                    <button
                      className="at-btn-ver"
                      onClick={() => verDetalle(u.id)}
                      title="Ver detalle"
                    >
                      {seleccionado?.id === u.id ? "▲" : "▼"}
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
      </div>
      <div className="at-content">
        {subTab === "cursos" && <CursosAdmin />}
        {subTab === "usuarios" && <UsuariosAdmin />}
      </div>
    </div>
  );
}
