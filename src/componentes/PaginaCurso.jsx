import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./PaginaCurso.css";

function toEmbedUrl(url) {
  if (!url) return "";
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return url;
}

function useTiempoTracker(cursoId) {
  const timerRef = useRef(null);
  const tiempoRef = useRef(0);

  useEffect(() => {
    tiempoRef.current = 0;
    timerRef.current = setInterval(() => { tiempoRef.current += 1; }, 1000);
    return () => {
      clearInterval(timerRef.current);
      if (tiempoRef.current > 0) {
        navigator.sendBeacon(
          `/api/cursos/${cursoId}/tiempo`,
          new Blob([JSON.stringify({ segundos: tiempoRef.current })], { type: "application/json" })
        );
      }
    };
  }, [cursoId]);
}

function VisorVideo({ actividad, cursoId, completado, onCompletar }) {
  useTiempoTracker(cursoId);
  const [marcando, setMarcando] = useState(false);
  const embedUrl = toEmbedUrl(actividad.url);

  const handleCompletar = async () => {
    setMarcando(true);
    await fetch(`/api/actividades/${actividad.id}/completar`, { method: "POST" });
    onCompletar(actividad.id);
    setMarcando(false);
  };

  return (
    <div className="pc-visor">
      {embedUrl ? (
        <div className="pc-video-wrapper">
          <iframe
            src={embedUrl}
            title={actividad.titulo}
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      ) : (
        <p className="pc-no-content">No hay URL de video disponible.</p>
      )}
      {!completado ? (
        <button className="pc-btn-completar" onClick={handleCompletar} disabled={marcando}>
          {marcando ? "Marcando..." : "Marcar como completado"}
        </button>
      ) : (
        <p className="pc-completado-label">✓ Completado</p>
      )}
    </div>
  );
}

function VisorDiapositiva({ actividad, cursoId, completado, onCompletar }) {
  useTiempoTracker(cursoId);
  const [marcando, setMarcando] = useState(false);
  const isPdf = actividad.nombre_archivo?.endsWith(".pdf");

  const handleCompletar = async () => {
    setMarcando(true);
    await fetch(`/api/actividades/${actividad.id}/completar`, { method: "POST" });
    onCompletar(actividad.id);
    setMarcando(false);
  };

  return (
    <div className="pc-visor">
      {actividad.url ? (
        isPdf ? (
          <iframe className="pc-pdf-frame" src={actividad.url} title={actividad.titulo} />
        ) : (
          <div className="pc-diap-download">
            <p>Archivo: <strong>{actividad.nombre_original}</strong></p>
            <a href={actividad.url} download className="pc-btn-download">Descargar</a>
          </div>
        )
      ) : (
        <p className="pc-no-content">No hay archivo disponible.</p>
      )}
      {!completado ? (
        <button className="pc-btn-completar" onClick={handleCompletar} disabled={marcando}>
          {marcando ? "Marcando..." : "Marcar como completado"}
        </button>
      ) : (
        <p className="pc-completado-label">✓ Completado</p>
      )}
    </div>
  );
}

function VisorEvaluacion({ actividad, cursoId, completado, onCompletar }) {
  useTiempoTracker(cursoId);
  const [preguntas, setPreguntas] = useState([]);
  const [intentos, setIntentos] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/actividades/${actividad.id}/preguntas`).then((r) => r.json()).then(setPreguntas);
    fetch(`/api/actividades/${actividad.id}/mis-intentos`).then((r) => r.json()).then(setIntentos);
  }, [actividad.id]);

  const intentosMax = actividad.intentos_max ?? 1;
  const sinIntentos = intentos.length >= intentosMax;

  const handleRespuesta = (pregId, campo, valor) => {
    setRespuestas((prev) => ({
      ...prev,
      [pregId]: { ...prev[pregId], pregunta_id: pregId, [campo]: valor },
    }));
  };

  const handleEnviar = async () => {
    setEnviando(true);
    setError("");
    const res = await fetch(`/api/actividades/${actividad.id}/intentos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ respuestas: Object.values(respuestas) }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Error al enviar");
      setEnviando(false);
      return;
    }
    setResultado(data);
    setIntentos((prev) => [...prev, data]);
    onCompletar(actividad.id);
    setEnviando(false);
  };

  return (
    <div className="pc-visor">
      {intentos.length > 0 && (
        <div className="pc-intentos">
          <h4>Mis intentos</h4>
          {intentos.map((it, i) => (
            <div key={i} className="pc-intento-row">
              Intento {it.intento ?? i + 1}: <strong>{it.puntos_obtenidos} / 10</strong>
            </div>
          ))}
        </div>
      )}

      {resultado && (
        <div className="pc-resultado">
          <p>Puntaje: <strong>{resultado.puntos_obtenidos} / 10</strong></p>
          {resultado.total_opcion_multiple > 0 && (
            <p>Respuestas correctas: {resultado.correctas} / {resultado.total_opcion_multiple}</p>
          )}
        </div>
      )}

      {!sinIntentos && !resultado && (
        <div className="pc-eval-form">
          {preguntas.map((preg, i) => (
            <div key={preg.id} className="pc-pregunta">
              <p className="pc-pregunta-enunciado">{i + 1}. {preg.enunciado}</p>
              {preg.tipo === "opcion_multiple" ? (
                <div className="pc-opciones">
                  {preg.opciones.map((op) => (
                    <label key={op.id} className="pc-opcion">
                      <input
                        type="radio"
                        name={`preg-${preg.id}`}
                        value={op.id}
                        onChange={() => handleRespuesta(preg.id, "opcion_id", op.id)}
                      />
                      {op.texto}
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  className="pc-texto-resp"
                  placeholder="Tu respuesta..."
                  onChange={(e) => handleRespuesta(preg.id, "texto_respuesta", e.target.value)}
                />
              )}
            </div>
          ))}
          {error && <p className="pc-error">{error}</p>}
          <button className="pc-btn-completar" onClick={handleEnviar} disabled={enviando}>
            {enviando ? "Enviando..." : "Enviar evaluación"}
          </button>
        </div>
      )}

      {sinIntentos && !resultado && (
        <p className="pc-sin-intentos">
          Has alcanzado el límite de intentos ({intentosMax}).
        </p>
      )}

      {completado && !resultado && <p className="pc-completado-label">✓ Completado</p>}
    </div>
  );
}

export default function PaginaCurso() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [curso, setCurso] = useState(null);
  const [actividades, setActividades] = useState([]);
  const [progreso, setProgreso] = useState([]);
  const [interaccion, setInteraccion] = useState(null);
  const [actividadActiva, setActividadActiva] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/cursos/${id}`).then((r) => r.json()),
      fetch(`/api/cursos/${id}/actividades`).then((r) => r.json()),
      fetch(`/api/cursos/${id}/mi-progreso`).then((r) => r.json()),
      fetch(`/api/cursos/${id}/iniciar`, { method: "POST" }).then((r) => r.json()),
    ]).then(([c, acts, prog, interac]) => {
      setCurso(c);
      setActividades(acts);
      setProgreso(prog);
      if (!interac.error) setInteraccion(interac);
      setLoading(false);
    });
  }, [id]);

  const refrescarInteraccion = () => {
    fetch(`/api/cursos/${id}/mi-interaccion`)
      .then((r) => r.json())
      .then((d) => { if (!d.error) setInteraccion(d); });
  };

  const isCompletada = (actId) =>
    progreso.some((p) => p.actividad_id === actId && p.completado);

  const handleCompletar = (actId) => {
    setProgreso((prev) => {
      const existe = prev.find((p) => p.actividad_id === actId);
      if (existe) return prev.map((p) => p.actividad_id === actId ? { ...p, completado: true } : p);
      return [...prev, { actividad_id: actId, completado: true }];
    });
    refrescarInteraccion();
  };

  const totalActividades = actividades.length;
  const totalCompletadas = actividades.filter((a) => isCompletada(a.id)).length;
  const porcentaje = totalActividades > 0 ? Math.round((totalCompletadas / totalActividades) * 100) : 0;

  if (loading) return <div className="pc-loading">Cargando curso...</div>;
  if (!curso || curso.error) return <div className="pc-loading">Curso no encontrado.</div>;

  return (
    <div className="pc-layout">
      <aside className="pc-sidebar">
        <button className="pc-btn-back" onClick={() => navigate("/cursos")}>
          ← Volver a cursos
        </button>
        <h2 className="pc-curso-titulo">{curso.titulo}</h2>

        <div className="pc-progreso-wrap">
          <div className="pc-progreso-bar">
            <div className="pc-progreso-fill" style={{ width: `${porcentaje}%` }} />
          </div>
          <span className="pc-progreso-label">{porcentaje}% completado</span>
        </div>

        {interaccion?.calificacion > 0 && (
          <p className="pc-calificacion">
            Calificación: <strong>{Number(interaccion.calificacion).toFixed(1)} / 10</strong>
          </p>
        )}

        <nav className="pc-nav">
          {actividades.length === 0 && (
            <p className="pc-nav-empty">Este curso no tiene actividades aún.</p>
          )}
          {actividades.map((act) => (
            <button
              key={act.id}
              className={`pc-nav-item ${actividadActiva?.id === act.id ? "activa" : ""} ${isCompletada(act.id) ? "completada" : ""}`}
              onClick={() => setActividadActiva(act)}
            >
              <span className={`pc-tipo-dot pc-tipo-dot-${act.tipo}`} />
              <span className="pc-nav-titulo">{act.titulo}</span>
              {isCompletada(act.id) && <span className="pc-check">✓</span>}
            </button>
          ))}
        </nav>
      </aside>

      <main className="pc-main">
        {actividadActiva ? (
          <div>
            <div className="pc-act-header">
              <h2 className="pc-act-titulo">{actividadActiva.titulo}</h2>
              <span className={`pc-tipo-badge pc-tipo-badge-${actividadActiva.tipo}`}>
                {actividadActiva.tipo}
              </span>
            </div>

            <div className="pc-act-body">
              <div className="pc-act-content">
                {actividadActiva.tipo === "video" && (
                  <VisorVideo
                    key={actividadActiva.id}
                    actividad={actividadActiva}
                    cursoId={id}
                    completado={isCompletada(actividadActiva.id)}
                    onCompletar={handleCompletar}
                  />
                )}
                {actividadActiva.tipo === "diapositiva" && (
                  <VisorDiapositiva
                    key={actividadActiva.id}
                    actividad={actividadActiva}
                    cursoId={id}
                    completado={isCompletada(actividadActiva.id)}
                    onCompletar={handleCompletar}
                  />
                )}
                {actividadActiva.tipo === "evaluacion" && (
                  <VisorEvaluacion
                    key={actividadActiva.id}
                    actividad={actividadActiva}
                    cursoId={id}
                    completado={isCompletada(actividadActiva.id)}
                    onCompletar={handleCompletar}
                  />
                )}
              </div>

              {actividadActiva.descripcion && (
                <aside className="pc-act-desc-panel">
                  <h4 className="pc-act-desc-titulo">Descripción</h4>
                  <p className="pc-act-desc">{actividadActiva.descripcion}</p>
                </aside>
              )}
            </div>
          </div>
        ) : (
          <div className="pc-empty-state">
            <h2 className="pc-empty-titulo">{curso.titulo}</h2>
            {curso.descripcion && <p className="pc-empty-desc">{curso.descripcion}</p>}
            <p className="pc-empty-hint">Selecciona una actividad del panel izquierdo para comenzar.</p>
          </div>
        )}
      </main>
    </div>
  );
}
