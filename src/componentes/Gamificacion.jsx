import React, { useState, useEffect, useRef } from "react";
import "./Gamificacion.css";
import { useNavigate } from "react-router-dom";
import imgExperto        from "../img/Experto.png";
import imgExploradorDB   from "../img/ExploradorDB.png";
import imgPerfeccionista from "../img/Perfeccionista.png";
import imgPrimerCurso    from "../img/PrimerCurso.png";
import imgTresCursos     from "../img/TresCursos.png";

const INSIGNIAS_INFO = {
  primer_curso:   { nombre: "Primer Curso",   imagen: imgPrimerCurso    },
  tres_cursos:    { nombre: "Tres Cursos",     imagen: imgTresCursos     },
  perfeccionista: { nombre: "Perfeccionista",  imagen: imgPerfeccionista },
  explorador_bd:  { nombre: "Explorador BD",   imagen: imgExploradorDB   },
  experto:        { nombre: "Experto",         imagen: imgExperto        },
};

const TODAS_INSIGNIAS = ["primer_curso", "tres_cursos", "perfeccionista", "explorador_bd", "experto"];

// ── Gráfica de arco SVG ───────────────────────────────────────────────────────
function ArcProgress({ porcentaje, nivel }) {
  const r = 54;
  const cx = 70, cy = 70;
  const startAngle = -210;
  const endAngle   = 30;
  const totalAngle = endAngle - startAngle;
  const fillAngle  = startAngle + (totalAngle * porcentaje) / 100;

  const toRad = (deg) => (deg * Math.PI) / 180;
  const px = (angle) => cx + r * Math.cos(toRad(angle));
  const py = (angle) => cy + r * Math.sin(toRad(angle));

  const trackD = `M ${px(startAngle)} ${py(startAngle)} A ${r} ${r} 0 1 1 ${px(endAngle)} ${py(endAngle)}`;
  const fillD  = porcentaje > 0
    ? `M ${px(startAngle)} ${py(startAngle)} A ${r} ${r} 0 ${fillAngle - startAngle > 180 ? 1 : 0} 1 ${px(fillAngle)} ${py(fillAngle)}`
    : null;

  return (
    <svg viewBox="0 0 140 110" className="gami-arc-svg">
      <defs>
        <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#ff6600" />
          <stop offset="100%" stopColor="#ffb347" />
        </linearGradient>
      </defs>
      <path d={trackD} fill="none" stroke="#ffe0cc" strokeWidth="10" strokeLinecap="round" />
      {fillD && (
        <path d={fillD} fill="none" stroke="url(#arcGrad)" strokeWidth="10" strokeLinecap="round"
          className="gami-arc-fill" />
      )}
      <text x={cx} y={cy - 6} textAnchor="middle" className="gami-arc-nivel">{nivel}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" className="gami-arc-pct">{Math.round(porcentaje)}%</text>
    </svg>
  );
}

// ── Modal de cursos ───────────────────────────────────────────────────────────
function ModalCursos({ tipo, cursos, onCerrar }) {
  const navigate    = useNavigate();
  const overlayRef  = useRef(null);
  const esCompletado = tipo === "completados";

  const handleOverlay = (e) => {
    if (e.target === overlayRef.current) onCerrar();
  };

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onCerrar(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCerrar]);

  return (
    <div className="gami-modal-overlay" ref={overlayRef} onClick={handleOverlay}>
      <div className="gami-modal">
        <div className="gami-modal-header">
          <div className="gami-modal-titulo-wrap">
            <h3 className="gami-modal-titulo">
              {esCompletado ? "Cursos Completados" : "Cursos en Progreso"}
            </h3>
          </div>
          <button className="gami-modal-cerrar" onClick={onCerrar}>✕</button>
        </div>

        <div className="gami-modal-lista">
          {cursos.length === 0 ? (
            <p className="gami-modal-vacio">
              {esCompletado
                ? "Aún no has completado ningún curso."
                : "No tienes cursos en progreso."}
            </p>
          ) : (
            cursos.map((curso) => {
              const pct = Math.round((curso.progreso || 0) * 100);
              return (
                <div key={curso.id} className="gami-modal-curso">
                  <div className="gami-modal-curso-info">
                    <span className="gami-modal-curso-cat">{curso.categoria || "General"}</span>
                    <h4 className="gami-modal-curso-titulo">{curso.titulo}</h4>
                    {!esCompletado && (
                      <div className="gami-modal-barra-wrap">
                        <div className="gami-modal-barra">
                          <div className="gami-modal-barra-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="gami-modal-pct">{pct}%</span>
                      </div>
                    )}
                    {esCompletado && curso.calificacion > 0 && (
                      <span className="gami-modal-cal">Calificación: {curso.calificacion}%</span>
                    )}
                  </div>
                  <button
                    className="gami-modal-btn-ir"
                    onClick={() => { navigate(`/cursos/${curso.id}`); onCerrar(); }}
                  >
                    Ir →
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
const Gamificacion = () => {
  const [datos,    setDatos]    = useState(null);
  const [cursos,   setCursos]   = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error,    setError]    = useState(null);
  const [modal,    setModal]    = useState(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/me/gamificacion", { credentials: "include" }).then((r) => {
        if (!r.ok) throw new Error("Sin sesión");
        return r.json();
      }),
      fetch("/api/me/mis-cursos", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([gami, misCursos]) => {
        setDatos(gami);
        setCursos(Array.isArray(misCursos) ? misCursos : []);
        setCargando(false);
      })
      .catch((err) => {
        setError(err.message);
        setCargando(false);
      });
  }, []);


  const navigate = useNavigate();
  if (cargando) return (

    <div className="gamificacion-container"
      onClick={() => navigate('/progreso')}
      style={{ cursor: "pointer" }}>
      <div className="gami-loading">
        <div className="gami-spinner" />
        <p>Cargando progreso...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="gamificacion-container">
      <p className="gami-sin-sesion">Accede desde Moodle para ver tu progreso.</p>
    </div>
  );

  const {
    puntos, nombre_nivel, puntos_siguiente_nivel,
    insignias, cursos_completados,
  } = datos;

  const porcentaje = puntos_siguiente_nivel
    ? Math.min((puntos / puntos_siguiente_nivel) * 100, 100)
    : 100;

  const insigniasSet    = new Set(insignias);
  const proximaInsignia = TODAS_INSIGNIAS.find((k) => !insigniasSet.has(k));
  const proximaInfo     = proximaInsignia ? INSIGNIAS_INFO[proximaInsignia] : null;

  const cursosCompletados = cursos.filter((c) => (c.progreso || 0) >= 1.0);
  const cursosEnProgreso  = cursos.filter((c) => (c.progreso || 0) > 0 && (c.progreso || 0) < 1.0);

  return (
    <>
      {modal && (
        <ModalCursos
          tipo={modal}
          cursos={modal === "completados" ? cursosCompletados : cursosEnProgreso}
          onCerrar={() => setModal(null)}
        />
      )}

      <div className="gamificacion-container"
        onClick={() => navigate('/progreso')}
        style={{ cursor: "pointer" }}>
        <h2 className="gamificacion-titulo">Mi Progreso</h2>

        {/* Gráfica de arco */}
        <div className="gami-arco-wrap">
          <ArcProgress porcentaje={porcentaje} nivel={nombre_nivel} />
          <div className="gami-puntos-label">
            <span className="gami-puntos-num">{puntos.toLocaleString()}</span>
            <span className="gami-puntos-de">
              {puntos_siguiente_nivel
                ? `/ ${puntos_siguiente_nivel.toLocaleString()} pts`
                : "Nivel máximo"}
            </span>
          </div>
        </div>

        {/* Stats clickeables */}
        <div className="gami-stats">
          <button
            className="gami-stat-btn gami-stat-completados"
            onClick={(e) => {e.stopPropagation(); setModal("completados")}}
          >
            <span className="gami-stat-num">{cursos_completados}</span>
            <span className="gami-stat-label">Completados</span>
            <span className="gami-stat-arrow">›</span>
          </button>
          <div className="gami-stat-divider" />
          <button
            className="gami-stat-btn gami-stat-progreso"
            onClick={(e) => {e.stopPropagation(); setModal("en_progreso")}}
          >
            <span className="gami-stat-num">{cursosEnProgreso.length}</span>
            <span className="gami-stat-label">En progreso</span>
            <span className="gami-stat-arrow">›</span>
          </button>
        </div>

        {/* Próxima insignia */}
        {proximaInfo && (
          <div className="gami-proxima">
            <span className="gami-proxima-label">Próxima insignia</span>
            <div className="gami-proxima-inner">
              <div className="gami-proxima-img-wrap">
                <img src={proximaInfo.imagen} alt={proximaInfo.nombre} className="gami-proxima-img" />
              </div>
              <span className="gami-proxima-nombre">{proximaInfo.nombre}</span>
            </div>
          </div>
        )}

        {/* Insignias obtenidas + bloqueadas */}
        <div className="insignas-container">
          <h3>Insignias</h3>
          <div className="insignas-lista">
            {TODAS_INSIGNIAS.map((key) => {
              const info     = INSIGNIAS_INFO[key];
              const obtenida = insigniasSet.has(key);
              return (
                <div key={key} className={`insignas-item ${obtenida ? "" : "insignas-bloqueada"}`}>
                  <div className="insignas-img-wrap">
                    <img src={info.imagen} alt={info.nombre} className="insignas-img" />
                  </div>
                  <span className="insignas-nombre">{info.nombre}</span>
                  {!obtenida && <span className="insignas-lock-label">Bloqueada</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default Gamificacion;
