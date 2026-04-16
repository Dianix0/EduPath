import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
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

  const eliminarTodos = async () => {
    if (!window.confirm(`¿Eliminar TODOS los ${cursos.length} cursos? Esta acción no se puede deshacer.`)) return;
    for (const c of cursos) {
      await fetch(`/api/cursos/${c.id}`, { method: "DELETE", credentials: "include" });
    }
    cargarCursos();
  };

  const importarExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const wb = XLSX.read(ev.target.result, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const filas = XLSX.utils.sheet_to_json(ws, { defval: "" });

      let importados = 0;
      for (const fila of filas) {
        const titulo = (fila["Nombre"] || "").trim();
        if (!titulo) continue;

        const descripcion = (fila["Descripción del Microcurso"] || "").trim();
        const categoria = (fila["Categoría Específica"] || fila["Categoría Especifica"] || "").trim();

        // Extraer duración: busca "Duración: ~XX min" y saca solo el número
        const detalles = fila["Detalles del Microcurso"] || "";
        const matchDur = String(detalles).match(/Duraci[oó]n[:\s~]*(\d+)/i);
        const duracion = matchDur ? parseInt(matchDur[1]) : null;

        // Etiquetas separadas por coma
        const etiquetasRaw = (fila["Etiquetas"] || "").toString();
        const etiquetas = etiquetasRaw.split(",").map((t) => t.trim()).filter(Boolean);

        // Crear curso
        const res = await fetch("/api/cursos/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ titulo, descripcion, categoria, duracion }),
        });
        const data = await res.json();

        // Agregar etiquetas
        for (const etiqueta of etiquetas) {
          await fetch(`/api/cursos/${data.id}/etiquetas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ etiqueta }),
          });
        }
        importados++;
      }
      alert(`Se importaron ${importados} cursos correctamente.`);
      cargarCursos();
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ""; // reset input
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
          <button className="at-btn-delete" onClick={eliminarTodos} disabled={cursos.length === 0}>
            Eliminar todos
          </button>
          <label className="at-btn-secondary" style={{ cursor: "pointer" }}>
            Importar Excel
            <input type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={importarExcel} />
          </label>
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
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch("/api/admin/usuarios/resumen", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setUsuarios(Array.isArray(data) ? data : []);
        setCargando(false);
      })
      .catch((err) => {
        console.error("Error:", err);
        setCargando(false);
      });
  }, []);

  const eliminar = (id, nombre) => {
    if (!window.confirm(`¿Eliminar al usuario "${nombre}"? Esta acción no se puede deshacer.`)) return;
    fetch(`/api/admin/usuarios/${id}`, { method: "DELETE", credentials: "include" })
      .then((r) => r.json())
      .then(() => setUsuarios((prev) => prev.filter((u) => u.id !== id)))
      .catch((err) => console.error("Error al eliminar:", err));
  };

  const filtrados = usuarios.filter((u) => {
    const q = busqueda.toLowerCase();
    return (
      u.nombre?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.rol?.toLowerCase().includes(q)
    );
  });

  if (cargando) return <p className="at-muted">Cargando...</p>;

  return (
    <div>
      <div className="at-section-header" style={{ marginBottom: "0.75rem" }}>
        <span className="at-muted">{filtrados.length} de {usuarios.length} usuario(s)</span>
      </div>
      <input
        className="at-search"
        type="text"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por nombre, email o rol..."
      />
      <div className="at-table-wrap">
        <table className="at-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Último acceso</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((u) => {
              const activo = u.puntos > 0;
              return (
                <tr key={u.id}>
                  <td style={{ fontWeight: activo ? 600 : 400, color: activo ? "#2d2d2d" : "#9ca3af" }}>
                    {u.nombre}
                  </td>
                  <td style={{ color: activo ? "#2d2d2d" : "#9ca3af" }}>
                    {u.email || "—"}
                  </td>
                  <td>
                    {u.rol
                      ? <span className={`at-rol-badge at-rol-${u.rol.toLowerCase()}`}>{u.rol}</span>
                      : <span style={{ color: "#9ca3af" }}>—</span>
                    }
                  </td>
                  <td style={{ color: activo ? "#2d2d2d" : "#9ca3af", fontSize: "13px" }}>
                    {u.ultimo_acceso || "Sin actividad"}
                  </td>
                  <td>
                    <span style={{
                      display: "inline-block",
                      padding: "2px 10px",
                      borderRadius: "99px",
                      fontSize: "12px",
                      fontWeight: 600,
                      background: activo ? "#dcfce7" : "#f3f4f6",
                      color: activo ? "#16a34a" : "#9ca3af",
                    }}>
                      {activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <button className="at-btn-delete" onClick={() => eliminar(u.id, u.nombre)}>Eliminar</button>
                  </td>
                </tr>
              );
            })}
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

export function GamificacionAdmin() {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch("/api/admin/gamificacion", { credentials: "include" })
      .then(r => r.json())
      .then(data => { setDatos(Array.isArray(data) ? data : []); setCargando(false); });
  }, []);

  const NIVELES = { 1: "Principiante", 2: "Explorador", 3: "Aprendiz", 4: "Avanzado", 5: "Experto" };
  const NARANJA = "#ff7b00";
  const NARANJA_PALE = "#fff4eb";
  const BORDER = "#ffe2c2";

  // Resumen
  const totalUsuarios   = datos.length;
  const porNivel        = datos.reduce((acc, u) => { acc[u.nivel] = (acc[u.nivel] || 0) + 1; return acc; }, {});
  const totalInsignias  = datos.reduce((s, u) => s + (u.total_insignias || 0), 0);
  const promedioInsg    = totalUsuarios > 0 ? (totalInsignias / totalUsuarios).toFixed(1) : 0;
  const conActividad    = datos.filter(u => u.puntos > 0).length;

  if (cargando) return <p className="at-muted">Cargando...</p>;

  return (
    <div>
      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Usuarios activos', value: `${conActividad} / ${totalUsuarios}` },
          { label: 'Insignias otorgadas', value: totalInsignias },
          { label: 'Insignias por usuario', value: promedioInsg },
        ].map(s => (
          <div key={s.label} style={{
            background: NARANJA_PALE, borderRadius: '10px', padding: '14px 18px',
            border: `1px solid ${BORDER}`,
          }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: NARANJA }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Distribución por nivel */}
      <div style={{ background: '#fff4eb', borderRadius: '10px', padding: '16px 18px', border: '1px solid #ffe2c2', marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
          Distribución por nivel
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[1,2,3,4,5].map(n => (
            <div key={n} style={{
              padding: '6px 14px', borderRadius: '99px', fontSize: '12px', fontWeight: 600,
              background: porNivel[n] ? NARANJA : '#f3f4f6',
              color: porNivel[n] ? 'white' : '#9ca3af',
            }}>
              {NIVELES[n]}: {porNivel[n] || 0}
            </div>
          ))}
        </div>
      </div>

      {/* Tabla detallada */}
      <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #ffe2c2', overflow: 'hidden' }}>
        <table className="at-table" style={{ width: '100%' }}>
          <thead>
            <tr style={{ background: '#fff4eb', borderBottom: '2px solid #ffe2c2' }}>
              {['Usuario', 'Rol', 'Nivel', 'Puntos', 'Insignias'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: NARANJA, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {datos.map((u, i) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f9fafb', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                <td style={{ padding: '10px 14px', fontSize: '13px', fontWeight: 600, color: '#2d2d2d' }}>
                  {u.nombre}
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <span className={`at-rol-badge at-rol-${(u.rol || "").toLowerCase()}`}>
                    {u.rol || "—"}
                  </span>
                </td>
                <td style={{ padding: '10px 14px', fontSize: '13px', color: u.puntos > 0 ? NARANJA : '#9ca3af', fontWeight: 600 }}>
                  {NIVELES[u.nivel] || 'Principiante'}
                </td>
                <td style={{ padding: '10px 14px', fontSize: '13px', fontWeight: 700, color: u.puntos > 0 ? '#2d2d2d' : '#9ca3af' }}>
                  {u.puntos || 0} pts
                </td>
                <td style={{ padding: '10px 14px', fontSize: '13px', color: '#6b7280' }}>
                  {u.total_insignias || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// BASE DE DATOS VIEWER
// ============================================================
function BaseDatosAdmin() {
  const [tablas, setTablas] = useState([]);
  const [tablaActiva, setTablaActiva] = useState(null);
  const [datos, setDatos] = useState(null);
  const [page, setPage] = useState(1);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    fetch("/api/admin/db/tablas", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setTablas(Array.isArray(d) ? d : []); });
  }, []);

  const cargarTabla = (tabla, p = 1) => {
    setTablaActiva(tabla);
    setPage(p);
    setCargando(true);
    fetch(`/api/admin/db/tablas/${tabla}?page=${p}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setDatos(d); setCargando(false); })
      .catch(() => setCargando(false));
  };

  const totalPaginas = datos ? Math.ceil(datos.total / datos.per_page) : 0;
  const columnas = datos?.filas?.length > 0 ? Object.keys(datos.filas[0]) : [];

  return (
    <div style={{ display: "flex", gap: "1.5rem", minHeight: "400px" }}>
      {/* Sidebar de tablas */}
      <div style={{ width: "180px", flexShrink: 0, borderRight: "1px solid #e5e7eb", paddingRight: "1rem" }}>
        <p style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "0.5rem", fontWeight: 600, textTransform: "uppercase" }}>Tablas</p>
        {tablas.map((t) => (
          <button
            key={t}
            onClick={() => cargarTabla(t, 1)}
            style={{
              display: "block", width: "100%", textAlign: "left",
              padding: "6px 10px", borderRadius: "6px", border: "none",
              cursor: "pointer", fontSize: "13px", marginBottom: "2px",
              background: tablaActiva === t ? "#fff7ed" : "transparent",
              color: tablaActiva === t ? "#f97316" : "#374151",
              fontWeight: tablaActiva === t ? 600 : 400,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {!tablaActiva && <p className="at-muted">Selecciona una tabla para ver sus datos.</p>}
        {cargando && <p className="at-muted">Cargando...</p>}
        {!cargando && datos && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "13px", color: "#6b7280" }}>
                {datos.total} registros · página {page} de {totalPaginas || 1}
              </span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="at-btn-secondary" disabled={page <= 1} onClick={() => cargarTabla(tablaActiva, page - 1)}>← Anterior</button>
                <button className="at-btn-secondary" disabled={page >= totalPaginas} onClick={() => cargarTabla(tablaActiva, page + 1)}>Siguiente →</button>
              </div>
            </div>
            {datos.filas.length === 0 ? (
              <p className="at-muted">La tabla está vacía.</p>
            ) : (
              <div className="at-table-wrap">
                <table className="at-table">
                  <thead>
                    <tr>{columnas.map((c) => <th key={c}>{c}</th>)}</tr>
                  </thead>
                  <tbody>
                    {datos.filas.map((fila, i) => (
                      <tr key={i}>
                        {columnas.map((c) => (
                          <td key={c} style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {fila[c] === null ? <span style={{ color: "#d1d5db" }}>NULL</span> : String(fila[c])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// METRICAS
// ============================================================
function MetricasAdmin() {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch("/api/admin/metricas", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setDatos(d); setCargando(false); })
      .catch(() => setCargando(false));
  }, []);

  if (cargando) return <p className="at-muted">Cargando métricas...</p>;
  if (!datos) return <p className="at-muted">Error al cargar métricas.</p>;

  const { resumen, completacion_por_curso, abandonados, retencion, cursos_por_usuario, match_interes } = datos;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

      {/* Tarjetas resumen */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
        {[
          { label: "Usuarios", value: resumen.total_usuarios ?? 0 },
          { label: "Cursos", value: resumen.total_cursos ?? 0 },
          { label: "Interacciones activas", value: resumen.interacciones_activas ?? 0 },
          { label: "Completaciones", value: resumen.completaciones ?? 0 },
          { label: "Tasa de completación", value: `${resumen.tasa_completacion ?? 0}%` },
          { label: "Activos (7d)", value: retencion.activos_7d ?? 0 },
          { label: "Activos (30d)", value: retencion.activos_30d ?? 0 },
        ].map((t) => (
          <div key={t.label} style={{ background: "#f9fafb", borderRadius: "12px", padding: "1rem", textAlign: "center", border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#f97316" }}>{t.value}</div>
            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>{t.label}</div>
          </div>
        ))}
      </div>

      {/* Completación por curso */}
      <div>
        <h3 style={{ marginBottom: "0.75rem", fontSize: "15px", fontWeight: 600 }}>Progreso por curso</h3>
        {completacion_por_curso.length === 0 ? <p className="at-muted">Sin datos aún.</p> : (
          <div className="at-table-wrap">
            <table className="at-table">
              <thead><tr><th>Curso</th><th>Usuarios</th><th>Completados</th><th>En progreso</th><th>Progreso prom.</th><th>Tiempo prom. (min)</th></tr></thead>
              <tbody>
                {completacion_por_curso.map((c, i) => (
                  <tr key={i}>
                    <td>{c.titulo}</td>
                    <td>{c.total_usuarios}</td>
                    <td style={{ color: "#16a34a", fontWeight: 600 }}>{c.completados}</td>
                    <td style={{ color: "#d97706", fontWeight: 600 }}>{c.en_progreso}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ flex: 1, background: "#e5e7eb", borderRadius: "99px", height: "6px" }}>
                          <div style={{ width: `${c.progreso_promedio}%`, background: "#f97316", borderRadius: "99px", height: "6px" }} />
                        </div>
                        <span style={{ fontSize: "12px", minWidth: "36px" }}>{c.progreso_promedio}%</span>
                      </div>
                    </td>
                    <td>{c.tiempo_promedio_min ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cursos abandonados */}
      <div>
        <h3 style={{ marginBottom: "0.75rem", fontSize: "15px", fontWeight: 600 }}>Cursos abandonados (sin actividad +14 días)</h3>
        {abandonados.length === 0 ? <p className="at-muted">Sin cursos abandonados.</p> : (
          <div className="at-table-wrap">
            <table className="at-table">
              <thead><tr><th>Curso</th><th>Usuarios que abandonaron</th></tr></thead>
              <tbody>
                {abandonados.map((a, i) => (
                  <tr key={i}>
                    <td>{a.titulo}</td>
                    <td style={{ color: "#dc2626", fontWeight: 600 }}>{a.usuarios_abandonaron}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cursos por usuario */}
      <div>
        <h3 style={{ marginBottom: "0.75rem", fontSize: "15px", fontWeight: 600 }}>Actividad por usuario</h3>
        {cursos_por_usuario.length === 0 ? <p className="at-muted">Sin datos aún.</p> : (
          <div className="at-table-wrap">
            <table className="at-table">
              <thead><tr><th>Usuario</th><th>Cursos iniciados</th><th>Cursos completados</th></tr></thead>
              <tbody>
                {cursos_por_usuario.map((u, i) => (
                  <tr key={i}>
                    <td>{u.nombre}</td>
                    <td>{u.cursos_iniciados}</td>
                    <td style={{ color: "#16a34a", fontWeight: 600 }}>{u.cursos_completados}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Match interés-acción */}
      <div>
        <h3 style={{ marginBottom: "0.75rem", fontSize: "15px", fontWeight: 600 }}>Match interés → acción</h3>
        {match_interes.length === 0 ? <p className="at-muted">Sin intereses declarados aún.</p> : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {match_interes.map((m, i) => (
              <div key={i} style={{
                padding: "6px 14px", borderRadius: "99px", fontSize: "13px",
                background: m.cursos_tomados_con_etiqueta > 0 ? "#dcfce7" : "#f3f4f6",
                color: m.cursos_tomados_con_etiqueta > 0 ? "#16a34a" : "#9ca3af",
                border: `1px solid ${m.cursos_tomados_con_etiqueta > 0 ? "#bbf7d0" : "#e5e7eb"}`,
              }}>
                {m.interes} <strong>({m.cursos_tomados_con_etiqueta})</strong>
              </div>
            ))}
          </div>
        )}
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
        <button className={subTab === "cursos" ? "activo" : ""} onClick={() => setSubTab("cursos")}>
          Cursos
        </button>
        {/* Usuarios (comentado originalmente) — reemplazado por pestaña Usuarios nueva */}
        {/* <button className={subTab === "usuarios_old" ? "activo" : ""} onClick={() => setSubTab("usuarios_old")}>
          Usuarios (original)
        </button> */}
        <button className={subTab === "carreras" ? "activo" : ""} onClick={() => setSubTab("carreras")}>
          Carreras
        </button>
        {/* Gamificación renombrada a Usuarios */}
        <button className={subTab === "usuarios" ? "activo" : ""} onClick={() => setSubTab("usuarios")}>
          Usuarios
        </button>
        <button className={subTab === "metricas" ? "activo" : ""} onClick={() => setSubTab("metricas")}>
          Métricas
        </button>
        <button className={subTab === "basedatos" ? "activo" : ""} onClick={() => setSubTab("basedatos")}>
          Base de datos
        </button>
      </div>
      <div className="at-content">
        {subTab === "cursos" && <CursosAdmin />}
        {subTab === "carreras" && <CarrerasAdmin />}
        {subTab === "usuarios" && <UsuariosAdmin />}
        {subTab === "metricas" && <MetricasAdmin />}
        {subTab === "basedatos" && <BaseDatosAdmin />}
        {/* GamificacionAdmin queda disponible para Progreso > Usuarios */}
        {/* {subTab === "gamificacion" && <GamificacionAdmin />} */}
      </div>
    </div>
  );
}
