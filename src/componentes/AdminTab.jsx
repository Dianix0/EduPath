import React, { useState, useEffect } from "react";
import "./AdminTab.css";

// ============================================================
// EDITOR DE PREGUNTAS (evaluacion)
// ============================================================
function PreguntasEditor({ actividadId }) {
  const [preguntas, setPreguntas] = useState([]);
  const [agregando, setAgregando] = useState(false);
  const [form, setForm] = useState({
    enunciado: "",
    tipo: "opcion_multiple",
    opciones: [{ texto: "", es_correcta: false }, { texto: "", es_correcta: false }],
  });

  const cargar = () =>
    fetch(`/api/actividades/${actividadId}/preguntas`).then((r) => r.json()).then(setPreguntas);

  useEffect(() => { cargar(); }, [actividadId]);

  const addOpcion = () =>
    setForm((p) => ({ ...p, opciones: [...p.opciones, { texto: "", es_correcta: false }] }));

  const removeOpcion = (i) =>
    setForm((p) => ({ ...p, opciones: p.opciones.filter((_, idx) => idx !== i) }));

  const setOpcion = (i, campo, val) =>
    setForm((p) => ({
      ...p,
      opciones: p.opciones.map((o, idx) => (idx === i ? { ...o, [campo]: val } : o)),
    }));

  const guardarPregunta = () => {
    if (!form.enunciado.trim()) return;
    const body = {
      enunciado: form.enunciado,
      tipo: form.tipo,
      orden: preguntas.length,
      opciones:
        form.tipo === "opcion_multiple"
          ? form.opciones.filter((o) => o.texto.trim())
          : [],
    };
    fetch(`/api/actividades/${actividadId}/preguntas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(() => {
      setForm({
        enunciado: "",
        tipo: "opcion_multiple",
        opciones: [{ texto: "", es_correcta: false }, { texto: "", es_correcta: false }],
      });
      setAgregando(false);
      cargar();
    });
  };

  const eliminarPregunta = (id) => {
    if (!window.confirm("¿Eliminar esta pregunta?")) return;
    fetch(`/api/preguntas/${id}`, { method: "DELETE" }).then(cargar);
  };

  return (
    <div className="at-preguntas">
      <div className="at-preguntas-header">
        <span className="at-muted">{preguntas.length} pregunta(s)</span>
        {!agregando && (
          <button className="at-btn-secondary" onClick={() => setAgregando(true)}>
            + Agregar pregunta
          </button>
        )}
      </div>

      {agregando && (
        <div className="at-pregunta-form">
          <div className="at-field">
            <label>Enunciado *</label>
            <textarea
              rows={2}
              value={form.enunciado}
              onChange={(e) => setForm((p) => ({ ...p, enunciado: e.target.value }))}
              placeholder="Escribe la pregunta..."
            />
          </div>
          <div className="at-field">
            <label>Tipo</label>
            <select
              value={form.tipo}
              onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}
            >
              <option value="opcion_multiple">Opción múltiple</option>
              <option value="texto">Texto libre</option>
            </select>
          </div>
          {form.tipo === "opcion_multiple" && (
            <div className="at-field">
              <label>Opciones (marca la correcta)</label>
              {form.opciones.map((op, i) => (
                <div key={i} className="at-opcion-row">
                  <input
                    type="checkbox"
                    checked={op.es_correcta}
                    onChange={(e) => setOpcion(i, "es_correcta", e.target.checked)}
                    title="Marcar como correcta"
                  />
                  <input
                    value={op.texto}
                    onChange={(e) => setOpcion(i, "texto", e.target.value)}
                    placeholder={`Opción ${i + 1}`}
                  />
                  {form.opciones.length > 2 && (
                    <button className="at-btn-remove" onClick={() => removeOpcion(i)}>×</button>
                  )}
                </div>
              ))}
              <button className="at-btn-secondary" onClick={addOpcion} style={{ marginTop: "0.4rem", alignSelf: "flex-start" }}>
                + Opción
              </button>
            </div>
          )}
          <div className="at-form-actions">
            <button className="at-btn-primary" onClick={guardarPregunta}>Guardar pregunta</button>
            <button className="at-btn-secondary" onClick={() => setAgregando(false)}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="at-preguntas-list">
        {preguntas.length === 0 && !agregando && (
          <p className="at-muted" style={{ padding: "0.75rem 0" }}>Sin preguntas aún.</p>
        )}
        {preguntas.map((p, idx) => (
          <div key={p.id} className="at-pregunta-item">
            <div className="at-pregunta-info">
              <span className="at-pregunta-num">{idx + 1}</span>
              <div className="at-pregunta-body">
                <p className="at-pregunta-enunciado">{p.enunciado}</p>
                <span className={`at-tipo-badge ${p.tipo === "opcion_multiple" ? "at-tipo-om" : "at-tipo-txt"}`}>
                  {p.tipo === "opcion_multiple" ? "Opción múltiple" : "Texto libre"}
                </span>
                {p.opciones?.length > 0 && (
                  <ul className="at-opciones-list">
                    {p.opciones.map((o) => (
                      <li key={o.id} className={o.es_correcta ? "at-opcion-correcta" : ""}>
                        {o.es_correcta ? "✓ " : "○ "}{o.texto}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <button className="at-btn-delete" onClick={() => eliminarPregunta(p.id)}>
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// PANEL DE ACTIVIDADES DE UN CURSO
// ============================================================
function ActividadesPanel({ curso, onVolver }) {
  const [actividades, setActividades] = useState([]);
  const [editando, setEditando] = useState(null); // null | "nuevo" | id
  const [expandida, setExpandida] = useState(null); // id de evaluacion con preguntas abiertas
  const [form, setForm] = useState({
    titulo: "", descripcion: "", tipo: "video", orden: 0,
    url: "", tiempo_limite_min: "", intentos_max: 1,
  });
  const [archivo, setArchivo] = useState(null);
  const [subiendo, setSubiendo] = useState(false);

  const cargar = () =>
    fetch(`/api/cursos/${curso.id}/actividades`).then((r) => r.json()).then(setActividades);

  useEffect(() => { cargar(); }, [curso.id]);

  const abrirNueva = () => {
    setForm({ titulo: "", descripcion: "", tipo: "video", orden: actividades.length, url: "", tiempo_limite_min: "", intentos_max: 1 });
    setArchivo(null);
    setEditando("nuevo");
  };

  const abrirEditar = (act) => {
    setForm({
      titulo: act.titulo || "",
      descripcion: act.descripcion || "",
      tipo: act.tipo,
      orden: act.orden ?? 0,
      url: act.url || "",
      tiempo_limite_min: act.tiempo_limite_min ?? "",
      intentos_max: act.intentos_max ?? 1,
    });
    setArchivo(null);
    setEditando(act.id);
  };

  const cancelar = () => { setEditando(null); setArchivo(null); };

  const guardar = async () => {
    if (!form.titulo.trim()) return;
    setSubiendo(true);
    const body = {
      titulo: form.titulo,
      descripcion: form.descripcion || null,
      tipo: form.tipo,
      orden: parseInt(form.orden) || 0,
      url: form.url || null,
      tiempo_limite_min: form.tiempo_limite_min ? parseInt(form.tiempo_limite_min) : null,
      intentos_max: parseInt(form.intentos_max) || 1,
    };

    let actId;
    if (editando === "nuevo") {
      const res = await fetch(`/api/cursos/${curso.id}/actividades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      actId = data.id;
    } else {
      await fetch(`/api/actividades/${editando}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      actId = editando;
    }

    if (form.tipo === "diapositiva" && archivo) {
      const fd = new FormData();
      fd.append("archivo", archivo);
      await fetch(`/api/actividades/${actId}/diapositiva/upload`, { method: "POST", body: fd });
    }

    setSubiendo(false);
    cancelar();
    await cargar();

    if (editando === "nuevo" && form.tipo === "evaluacion") {
      setExpandida(actId);
    }
  };

  const eliminar = (id) => {
    if (!window.confirm("¿Eliminar esta actividad? Esta acción no se puede deshacer.")) return;
    fetch(`/api/actividades/${id}`, { method: "DELETE" }).then(cargar);
  };

  const TIPO_LABEL = { video: "Video", diapositiva: "Diapositiva", evaluacion: "Evaluación" };
  const TIPO_CLASS = { video: "at-tipo-video", diapositiva: "at-tipo-diap", evaluacion: "at-tipo-eval" };

  return (
    <div>
      {/* HEADER */}
      <div className="at-panel-header">
        <button className="at-btn-back" onClick={onVolver}>← Volver</button>
        <div className="at-panel-titulo-wrap">
          <h4 className="at-panel-titulo">{curso.titulo}</h4>
          <span className="at-muted">Actividades del curso</span>
        </div>
        {editando === null && (
          <button className="at-btn-primary" onClick={abrirNueva}>+ Nueva actividad</button>
        )}
      </div>

      {/* FORMULARIO */}
      {editando !== null && (
        <div className="at-actividad-form">
          <h5>{editando === "nuevo" ? "Nueva actividad" : "Editar actividad"}</h5>
          <div className="at-form">
            <div className="at-form-row">
              <div className="at-field">
                <label>Título *</label>
                <input
                  value={form.titulo}
                  onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
                  placeholder="Título de la actividad"
                />
              </div>
              <div className="at-field">
                <label>Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}
                  disabled={editando !== "nuevo"}
                >
                  <option value="video">Video</option>
                  <option value="diapositiva">Diapositiva</option>
                  <option value="evaluacion">Evaluación</option>
                </select>
              </div>
            </div>
            <div className="at-field">
              <label>Descripción</label>
              <textarea
                rows={2}
                value={form.descripcion}
                onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
                placeholder="Descripción opcional"
              />
            </div>

            {form.tipo === "video" && (
              <div className="at-field">
                <label>URL del video (YouTube / Vimeo)</label>
                <input
                  value={form.url}
                  onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
            )}

            {form.tipo === "diapositiva" && (
              <div className="at-field">
                <label>Archivo (PDF, PPT, PPTX)</label>
                <input
                  type="file"
                  accept=".pdf,.ppt,.pptx"
                  onChange={(e) => setArchivo(e.target.files[0])}
                  className="at-file-input"
                />
              </div>
            )}

            {form.tipo === "evaluacion" && (
              <div className="at-form-row">
                <div className="at-field">
                  <label>Límite de tiempo (min, opcional)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.tiempo_limite_min}
                    onChange={(e) => setForm((p) => ({ ...p, tiempo_limite_min: e.target.value }))}
                    placeholder="Sin límite"
                  />
                </div>
                <div className="at-field">
                  <label>Intentos máximos</label>
                  <input
                    type="number"
                    min="1"
                    value={form.intentos_max}
                    onChange={(e) => setForm((p) => ({ ...p, intentos_max: e.target.value }))}
                  />
                </div>
              </div>
            )}

            <div className="at-field" style={{ maxWidth: "120px" }}>
              <label>Orden</label>
              <input
                type="number"
                min="0"
                value={form.orden}
                onChange={(e) => setForm((p) => ({ ...p, orden: e.target.value }))}
              />
            </div>

            <div className="at-form-actions">
              <button className="at-btn-primary" onClick={guardar} disabled={subiendo}>
                {subiendo ? "Guardando..." : editando === "nuevo" && form.tipo === "evaluacion" ? "Guardar y agregar preguntas" : "Guardar"}
              </button>
              <button className="at-btn-secondary" onClick={cancelar} disabled={subiendo}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* LISTA DE ACTIVIDADES */}
      <div className="at-actividades-list">
        {actividades.length === 0 && editando === null && (
          <p className="at-muted" style={{ textAlign: "center", padding: "2rem 0" }}>
            Sin actividades. Agrega la primera con el botón de arriba.
          </p>
        )}
        {actividades.map((act, idx) => (
          <div key={act.id} className="at-actividad-card">
            <div className="at-actividad-header">
              <div className="at-actividad-info">
                <span className="at-actividad-orden">{idx + 1}</span>
                <div>
                  <div className="at-actividad-titulo-row">
                    <strong>{act.titulo}</strong>
                    <span className={`at-tipo-badge ${TIPO_CLASS[act.tipo]}`}>
                      {TIPO_LABEL[act.tipo]}
                    </span>
                  </div>
                  {act.descripcion && <p className="at-curso-desc">{act.descripcion}</p>}
                  {act.tipo === "video" && act.url && (
                    <p className="at-actividad-meta">🔗 {act.url}</p>
                  )}
                  {act.tipo === "diapositiva" && act.nombre_original && (
                    <p className="at-actividad-meta">📄 {act.nombre_original}</p>
                  )}
                  {act.tipo === "evaluacion" && (
                    <p className="at-actividad-meta">
                      {act.tiempo_limite_min ? `${act.tiempo_limite_min} min` : "Sin límite de tiempo"} · {act.intentos_max} intento(s)
                    </p>
                  )}
                </div>
              </div>
              <div className="at-curso-actions">
                {act.tipo === "evaluacion" && (
                  <button
                    className="at-btn-ver"
                    onClick={() => setExpandida(expandida === act.id ? null : act.id)}
                  >
                    {expandida === act.id ? "▲ Preguntas" : "▼ Preguntas"}
                  </button>
                )}
                <button className="at-btn-edit" onClick={() => abrirEditar(act)}>Editar</button>
                <button className="at-btn-delete" onClick={() => eliminar(act.id)}>Eliminar</button>
              </div>
            </div>

            {act.tipo === "evaluacion" && expandida === act.id && (
              <PreguntasEditor actividadId={act.id} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// SECCION CURSOS
// ============================================================
function ModalImportarMoodle({ onCerrar, onImportado }) {
  const [cargando, setCargando] = useState(true);
  const [cursosMoodle, setCursosMoodle] = useState([]);
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [error, setError] = useState("");
  const [importando, setImportando] = useState(false);
  const [exito, setExito] = useState(null);

  useEffect(() => {
    fetch("/api/admin/moodle/cursos")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); }
        else { setCursosMoodle(data); }
        setCargando(false);
      })
      .catch(() => { setError("No se pudo conectar con Moodle."); setCargando(false); });
  }, []);

  const toggleTodos = () => {
    if (seleccionados.size === cursosMoodle.length) setSeleccionados(new Set());
    else setSeleccionados(new Set(cursosMoodle.map((_, i) => i)));
  };

  const toggle = (i) =>
    setSeleccionados((prev) => {
      const s = new Set(prev);
      s.has(i) ? s.delete(i) : s.add(i);
      return s;
    });

  const importar = () => {
    const cursos = [...seleccionados].map((i) => cursosMoodle[i]);
    if (!cursos.length) return;
    setImportando(true);
    fetch("/api/admin/moodle/importar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cursos }),
    })
      .then((r) => r.json())
      .then((data) => {
        setExito(data.importados);
        setImportando(false);
        onImportado();
      });
  };

  return (
    <div className="at-modal-overlay" onClick={onCerrar}>
      <div className="at-modal" onClick={(e) => e.stopPropagation()}>
        <div className="at-modal-header">
          <h3>Importar cursos desde Moodle</h3>
          <button className="at-modal-close" onClick={onCerrar}>✕</button>
        </div>

        {cargando && <p className="at-modal-info">Conectando con Moodle...</p>}
        {error && <p className="at-modal-error">{error}</p>}

        {!cargando && !error && (
          <>
            {exito !== null ? (
              <p className="at-modal-exito">{exito} curso(s) importado(s) correctamente.</p>
            ) : (
              <>
                <div className="at-modal-toolbar">
                  <span className="at-muted">{cursosMoodle.length} cursos disponibles en Moodle</span>
                  <button className="at-btn-secondary" onClick={toggleTodos}>
                    {seleccionados.size === cursosMoodle.length ? "Deseleccionar todos" : "Seleccionar todos"}
                  </button>
                </div>
                <div className="at-moodle-lista">
                  {cursosMoodle.map((c, i) => (
                    <label key={c.moodle_id} className="at-moodle-item">
                      <input
                        type="checkbox"
                        checked={seleccionados.has(i)}
                        onChange={() => toggle(i)}
                      />
                      <div className="at-moodle-info">
                        <strong>{c.titulo}</strong>
                        {c.categoria && <span className="at-badge">{c.categoria}</span>}
                        {c.descripcion && <p className="at-moodle-desc">{c.descripcion}</p>}
                      </div>
                    </label>
                  ))}
                </div>
                <div className="at-modal-footer">
                  <span className="at-muted">{seleccionados.size} seleccionado(s)</span>
                  <button
                    className="at-btn-primary"
                    onClick={importar}
                    disabled={importando || seleccionados.size === 0}
                  >
                    {importando ? "Importando..." : "Importar seleccionados"}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

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
  const [modoNuevaCategoria, setModoNuevaCategoria] = useState(false);
  const [cursoActividades, setCursoActividades] = useState(null);
  const [moodleModal, setMoodleModal] = useState(false);

  useEffect(() => {
    cargarCursos();
    fetch("/api/cursos/etiquetas").then((r) => r.json()).then(setTodasEtiquetas);
  }, []);

  const cargarCursos = () =>
    fetch("/api/cursos/").then((r) => r.json()).then(setCursos);

  const abrirNuevo = () => {
    setForm({ titulo: "", descripcion: "", categoria: "", duracion: "" });
    setEtiquetasEdit([]);
    setModoNuevaCategoria(false);
    setEditando("nuevo");
  };

  const abrirEditar = (curso) => {
    setForm({
      titulo: curso.titulo || "",
      descripcion: curso.descripcion || "",
      categoria: curso.categoria || "",
      duracion: curso.duracion || "",
    });
    setModoNuevaCategoria(false);
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
    setModoNuevaCategoria(false);
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
      fetch(`/api/cursos/${editando}/etiquetas/${encodeURIComponent(tag)}`, { method: "DELETE" });
    }
    setEtiquetasEdit((prev) => prev.filter((e) => e !== tag));
  };

  // Vista actividades
  if (cursoActividades) {
    return <ActividadesPanel curso={cursoActividades} onVolver={() => setCursoActividades(null)} />;
  }

  // Vista formulario
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
              {modoNuevaCategoria ? (
                <div className="at-tag-input">
                  <input
                    value={form.categoria}
                    onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value }))}
                    placeholder="Nombre de la nueva categoría"
                    autoFocus
                  />
                  <button
                    className="at-btn-secondary"
                    onClick={() => { setModoNuevaCategoria(false); setForm((p) => ({ ...p, categoria: "" })); }}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <select
                  value={form.categoria}
                  onChange={(e) => {
                    if (e.target.value === "__nueva__") {
                      setModoNuevaCategoria(true);
                      setForm((p) => ({ ...p, categoria: "" }));
                    } else {
                      setForm((p) => ({ ...p, categoria: e.target.value }));
                    }
                  }}
                >
                  <option value="">-- Sin categoría --</option>
                  {[...new Set(cursos.map((c) => c.categoria).filter(Boolean))].sort().map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__nueva__">+ Nueva categoría...</option>
                </select>
              )}
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
            <button className="at-btn-primary" onClick={guardar}>Guardar</button>
            <button className="at-btn-secondary" onClick={cancelar}>Cancelar</button>
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
      {moodleModal && (
        <ModalImportarMoodle
          onCerrar={() => setMoodleModal(false)}
          onImportado={() => { cargarCursos(); setMoodleModal(false); }}
        />
      )}
      <div className="at-section-header">
        <span>{cursosFiltrados.length} de {cursos.length} curso(s)</span>
        <div className="at-section-header-actions">
          <button className="at-btn-secondary" onClick={() => setMoodleModal(true)}>
            Importar desde Moodle
          </button>
          <button className="at-btn-primary" onClick={abrirNuevo}>+ Nuevo curso</button>
        </div>
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
              {curso.descripcion && <p className="at-curso-desc">{curso.descripcion}</p>}
            </div>
            <div className="at-curso-actions">
              <button className="at-btn-actividades" onClick={() => setCursoActividades(curso)}>
                Actividades
              </button>
              <button className="at-btn-edit" onClick={() => abrirEditar(curso)}>Editar</button>
              <button className="at-btn-delete" onClick={() => eliminar(curso.id)}>Eliminar</button>
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
                              <span key={i.interes} className="at-tag-readonly">{i.interes}</span>
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
                                          <div className="at-progreso-bar" style={{ width: `${i.progreso}%` }} />
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
          <button className="at-btn-primary" onClick={agregar}>Agregar</button>
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
