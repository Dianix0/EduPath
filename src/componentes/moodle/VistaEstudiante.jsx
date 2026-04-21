// src/componentes/moodle/VistaEstudiante.jsx
import { useState, useEffect, useMemo, useRef } from 'react';
import { useProgreso, useCursos, useCalificaciones } from '../../hooks/useMoodle';

// Imágenes de insignias
import imgExperto        from '../../img/Experto.png';
import imgExploradorDB   from '../../img/ExploradorDB.png';
import imgPerfeccionista from '../../img/Perfeccionista.png';
import imgPrimerCurso    from '../../img/PrimerCurso.png';
import imgTresCursos     from '../../img/TresCursos.png';

const IMAGENES_INSIGNIAS = {
  primer_curso:   imgPrimerCurso,
  tres_cursos:    imgTresCursos,
  perfeccionista: imgPerfeccionista,
  explorador_bd:  imgExploradorDB,
  experto:        imgExperto,
};

// Orden fijo de insignias
const ORDEN_INSIGNIAS = ['primer_curso', 'tres_cursos', 'perfeccionista', 'explorador_bd', 'experto'];

// ── Colores ───────────────────────────────────────────────────────────────────
const NARANJA      = '#ff7b00';
const NARANJA_PALE = '#fff4eb';
const NARANJA_DARK = '#e46d00';
const GRIS_TEXTO   = '#2d2d2d';
const GRIS_MID     = '#6b7280';
const GRIS_LIGHT   = '#f9f9fb';
const BORDER       = '#ffe2c2';

const fmt = (ts) => ts ? new Date(ts * 1000).toLocaleDateString('es-CO', {
  day: '2-digit', month: 'short', year: 'numeric'
}) : '—';

const notaColor = (pct) => {
  if (pct >= 70) return { color: '#15803d', bg: '#dcfce7' };
  if (pct >= 50) return { color: '#92400e', bg: '#fef3c7' };
  return { color: '#991b1b', bg: '#fee2e2' };
};

// ── Modal de insignia con animación ──────────────────────────────────────────
function ModalInsignia({ insignia, info, imagen, obtenida, onCerrar }) {
  const overlayRef = useRef(null);
  const [particulas, setParticulas] = useState([]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCerrar(); };
    window.addEventListener('keydown', handler);

    // Generar partículas solo si la insignia está obtenida
    if (obtenida) {
      const colores = ['#ff7b00', '#ffb347', '#ff4500', '#ffd700', '#ff6347', '#fff4eb'];
      const nuevas = Array.from({ length: 32 }, (_, i) => ({
        id: i,
        x: 45 + Math.random() * 10,   // origen cerca del centro
        y: 45 + Math.random() * 10,
        dx: (Math.random() - 0.5) * 260,
        dy: (Math.random() - 0.8) * 260,
        color: colores[Math.floor(Math.random() * colores.length)],
        size: 5 + Math.random() * 7,
        rot: Math.random() * 360,
        shape: Math.random() > 0.5 ? 'circle' : 'rect',
        delay: Math.random() * 0.3,
        dur: 0.7 + Math.random() * 0.5,
      }));
      setParticulas(nuevas);
    }

    return () => window.removeEventListener('keydown', handler);
  }, [onCerrar, obtenida]);

  const handleOverlay = (e) => {
    if (e.target === overlayRef.current) onCerrar();
  };

  return (
    <>
      <style>{`
        @keyframes fadeInModal {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUpModal {
          from { transform: translateY(24px) scale(0.95); opacity: 0; }
          to   { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes escalarInsignia {
          0%   { transform: scale(0.5); opacity: 0; }
          70%  { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes volar {
          0%   { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) rotate(var(--rot)); opacity: 0; }
        }
      `}</style>

      <div ref={overlayRef} onClick={handleOverlay} style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '16px',
        animation: 'fadeInModal 0.2s ease',
      }}>
        <div style={{
          background: 'white', borderRadius: '24px',
          padding: '40px 32px', maxWidth: '360px', width: '100%',
          textAlign: 'center',
          boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
          animation: 'slideUpModal 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          position: 'relative', overflow: 'hidden',
        }}>

          {/* Fondo decorativo sutil */}
          {obtenida && (
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'radial-gradient(circle at 50% 35%, rgba(255,123,0,0.07) 0%, transparent 65%)',
            }} />
          )}

          {/* Botón cerrar */}
          <button onClick={onCerrar} style={{
            position: 'absolute', top: '16px', right: '16px',
            width: '32px', height: '32px', borderRadius: '50%',
            border: 'none', background: '#f3f4f6',
            cursor: 'pointer', fontSize: '14px', color: '#6b7280',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>

          {/* Contenedor imagen + partículas */}
          <div style={{
            position: 'relative', display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: '20px',
            width: '160px', height: '160px',
          }}>
            {/* Partículas de confeti */}
            {particulas.map(p => (
              <div key={p.id} style={{
                position: 'absolute',
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.shape === 'circle' ? `${p.size}px` : `${p.size * 0.6}px`,
                height: p.shape === 'circle' ? `${p.size}px` : `${p.size * 1.4}px`,
                borderRadius: p.shape === 'circle' ? '50%' : '2px',
                background: p.color,
                '--dx': `${p.dx}px`,
                '--dy': `${p.dy}px`,
                '--rot': `${p.rot}deg`,
                animation: `volar ${p.dur}s ease-out ${p.delay}s forwards`,
                pointerEvents: 'none',
                zIndex: 10,
              }} />
            ))}

            {/* Imagen de la insignia */}
            <div style={{
              width: '140px', height: '140px', borderRadius: '50%',
              background: obtenida ? '#fff4eb' : '#f3f4f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `3px solid ${obtenida ? '#ffe2c2' : '#e5e7eb'}`,
              animation: 'escalarInsignia 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
              position: 'relative', zIndex: 1,
            }}>
              <img
                src={imagen}
                alt={info.nombre}
                style={{
                  width: '100px', height: '100px', objectFit: 'contain',
                  filter: obtenida ? 'none' : 'grayscale(100%) opacity(0.4)',
                  mixBlendMode: 'multiply',
                }}
              />
            </div>
          </div>

          {/* Nombre */}
          <h3 style={{
            margin: '0 0 8px', fontSize: '20px', fontWeight: 800,
            color: obtenida ? '#2d2d2d' : '#6b7280',
            fontFamily: 'Poppins, sans-serif',
          }}>
            {info.nombre}
          </h3>

          {/* Estado */}
          <span style={{
            display: 'inline-block', marginBottom: '16px',
            fontSize: '12px', fontWeight: 700, padding: '4px 14px',
            borderRadius: '99px',
            background: obtenida ? '#ff7b00' : '#e5e7eb',
            color: obtenida ? 'white' : '#9ca3af',
          }}>
            {obtenida ? 'Obtenida' : 'Pendiente'}
          </span>

          {/* Descripción */}
          <p style={{
            margin: 0, fontSize: '14px', color: '#6b7280',
            lineHeight: 1.6, fontFamily: 'Poppins, sans-serif',
          }}>
            {info.desc}
          </p>
        </div>
      </div>
    </>
  );
}


// ── Sub-componentes base ──────────────────────────────────────────────────────
function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '2px', marginBottom: '24px', borderBottom: `2px solid ${BORDER}` }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          padding: '10px 20px', border: 'none', background: 'transparent',
          cursor: 'pointer', fontSize: '14px', fontWeight: 600,
          fontFamily: 'Poppins, sans-serif',
          color: active === t.id ? NARANJA : GRIS_MID,
          borderBottom: active === t.id ? `2px solid ${NARANJA}` : '2px solid transparent',
          marginBottom: '-2px', transition: 'color 0.2s',
        }}>
          {t.label}
          {t.count != null && (
            <span style={{
              marginLeft: '6px', fontSize: '11px', fontWeight: 700,
              padding: '1px 7px', borderRadius: '99px',
              background: active === t.id ? NARANJA_PALE : '#f3f4f6',
              color: active === t.id ? NARANJA : '#9ca3af',
            }}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

function StatCard({ label, value, sub }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'white', borderRadius: '10px', padding: '12px 16px',
        border: `1px solid ${hover && sub ? NARANJA : BORDER}`,
        flex: 1, minWidth: '150px', position: 'relative',
        transition: 'border-color 0.2s',
        cursor: sub ? 'help' : 'default',
      }}
    >
      <div style={{ fontSize: '22px', fontWeight: 700, color: GRIS_TEXTO, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '12px', fontWeight: 600, color: GRIS_MID, marginTop: '4px' }}>{label}</div>

      {/* Tooltip */}
      {sub && hover && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: '50%',
          transform: 'translateX(-50%)',
          background: '#2d2d2d', color: 'white',
          fontSize: '11px', lineHeight: 1.5,
          padding: '8px 12px', borderRadius: '8px',
          width: '220px', textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 10, pointerEvents: 'none',
        }}>
          {sub}
          {/* Flechita */}
          <div style={{
            position: 'absolute', bottom: '100%', left: '50%',
            transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderBottom: '6px solid #2d2d2d',
            borderTop: 'none',
          }} />
        </div>
      )}
    </div>
  );
}

function BarraProgreso({ pct, height = 6 }) {
  return (
    <div style={{ background: '#f3f4f6', borderRadius: '99px', height, overflow: 'hidden' }}>
      <div style={{
        width: `${Math.min(pct, 100)}%`, height: '100%',
        background: NARANJA, borderRadius: '99px',
        transition: 'width 0.6s ease',
      }} />
    </div>
  );
}

// ── TAB: Mis Cursos ───────────────────────────────────────────────────────────
function TabCursos({ misCursos, progresoMap }) {
  if (misCursos.length === 0) return (
    <div style={{ textAlign: 'center', padding: '48px', color: GRIS_MID, fontSize: '14px' }}>
      No estás matriculado en ningún curso aún.
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {misCursos.map(c => {
        const prog = progresoMap[c.id];
        const pct  = prog?.percent || 0;
        const done = prog?.completed || false;
        return (
          <div key={c.id} style={{
            background: 'white', borderRadius: '12px', padding: '18px 20px',
            border: `1px solid ${done ? '#bbf7d0' : BORDER}`,
            display: 'flex', alignItems: 'center', gap: '20px',
            transition: 'box-shadow 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,123,0,0.1)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
          >
            <div style={{
              flexShrink: 0, width: '52px', height: '52px', borderRadius: '50%',
              border: `3px solid ${done ? '#22c55e' : NARANJA}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: 800,
              color: done ? '#22c55e' : NARANJA,
              background: done ? '#f0fdf4' : NARANJA_PALE,
            }}>
              {done ? '✓' : `${Math.round(pct)}%`}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: GRIS_TEXTO, lineHeight: 1.3 }}>
                  {c.fullname}
                </h3>
                {done && (
                  <span style={{
                    flexShrink: 0, marginLeft: '12px', fontSize: '11px', fontWeight: 700,
                    padding: '2px 10px', borderRadius: '99px',
                    background: '#dcfce7', color: '#15803d',
                  }}>Completado</span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: GRIS_MID, marginBottom: '8px' }}>
                {c.categoryname}
                {prog && ` · ${prog.modules_done} de ${prog.modules_total} actividades`}
                {prog?.timestarted > 0 && ` · Iniciado ${fmt(prog.timestarted)}`}
              </div>
              {!done && <BarraProgreso pct={pct} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── TAB: Calificaciones ───────────────────────────────────────────────────────
function TabCalificaciones({ califs, cursosMap }) {
  const conNota = califs.filter(c => c.final_grade >= 0);

  if (conNota.length === 0) return (
    <div style={{ textAlign: 'center', padding: '48px', color: GRIS_MID, fontSize: '14px' }}>
      No hay calificaciones registradas aún.
    </div>
  );

  const tipoLabel = (tipo, modulo) => {
    if (modulo) return modulo;
    if (tipo === 'course') return 'curso';
    return tipo;
  };

  return (
    <div style={{ background: 'white', borderRadius: '12px', border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Poppins, sans-serif' }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${BORDER}`, background: NARANJA_PALE }}>
            {['Actividad', 'Curso', 'Tipo', 'Nota obtenida', 'Fecha'].map(h => (
              <th key={h} style={{
                padding: '12px 16px', textAlign: 'left',
                fontSize: '11px', fontWeight: 700, color: NARANJA,
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {conNota.map((cal, i) => {
            //const pct         = cal.percent > 0 ? cal.percent : null;
            const nota = cal.final_grade;
            let max = cal.grade_max;

            // 🔥 FIX ESCALA MOODLE
            if (max === 100 && nota <= 5) {
              max = 5;
            }

            const pct = max > 0 ? (nota / max) * 100 : null;
            const colors      = pct ? notaColor(pct) : { color: GRIS_MID, bg: '#f3f4f6' };
            const nombreCurso = cursosMap[cal.course_id]?.fullname || cal.courseshortname;
            return (
              <tr key={cal.id} style={{
                borderBottom: '1px solid #f9fafb',
                background: i % 2 === 0 ? 'white' : GRIS_LIGHT,
              }}>
                <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: GRIS_TEXTO }}>
                  {cal.item_name || 'Total del curso'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    fontSize: '12px', fontWeight: 500, color: NARANJA_DARK,
                    background: NARANJA_PALE, padding: '2px 8px', borderRadius: '6px',
                  }}>
                    {nombreCurso}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: GRIS_MID, textTransform: 'capitalize' }}>
                  {tipoLabel(cal.item_type, cal.item_module)}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                    <span style={{
                      fontWeight: 700, fontSize: '14px',
                      color: pct ? (pct >= 60 ? '#15803d' : '#991b1b') : GRIS_TEXTO,
                    }}>
                      {nota.toFixed(1)} / {max} ({Math.round(pct)}%)
                    </span>
                    <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                      escala {max}
                    </span>
                    {pct !== null && (
                      <span style={{
                        fontSize: '11px', fontWeight: 700, padding: '1px 8px',
                        borderRadius: '99px', color: colors.color, background: colors.bg,
                      }}>
                        {Math.round(pct)}%
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: GRIS_MID }}>
                  {fmt(cal.timemodified)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── TAB: Logros ───────────────────────────────────────────────────────────────
function TabLogros({ gami }) {
  const [insigniaSeleccionada, setInsigniaSeleccionada] = useState(null);
  console.log("GAMIFICACION FRONT:", gami);

  if (!gami) return (
    <div style={{ textAlign: 'center', padding: '48px', color: GRIS_MID, fontSize: '14px' }}>
      Cargando datos de gamificación...
    </div>
  );

  const {
    puntos = 0,
    nivel = 1,
    nombre_nivel = '',
    puntos_siguiente_nivel,
    insignias = [],
    config = {},
  } = gami;

  const niveles       = config.niveles       || [];
  const insigniasInfo = config.insignias_info || {};
  const insigniasSet  = new Set(insignias);

  const nivelInfo   = niveles.find(n => n.nivel === nivel) || { min: 0 };
  const nivelSig    = niveles.find(n => n.nivel === nivel + 1);
  const ptsEnNivel  = nivelSig ? puntos - nivelInfo.min : 0;
  const ptsTotNivel = nivelSig ? nivelSig.min - nivelInfo.min : 1;
  const pctNivel    = nivelSig ? Math.round((ptsEnNivel / ptsTotNivel) * 100) : 100;

  // Insignias en orden fijo
  const insigniasOrdenadas = ORDEN_INSIGNIAS
    .filter(key => insigniasInfo[key])
    .map(key => ({ key, info: insigniasInfo[key], obtenida: insigniasSet.has(key) }));

  return (
    <>
      {/* Modal insignia */}
      {insigniaSeleccionada && (
        <ModalInsignia
          insignia={insigniaSeleccionada.key}
          info={insigniaSeleccionada.info}
          imagen={IMAGENES_INSIGNIAS[insigniaSeleccionada.key]}
          obtenida={insigniaSeleccionada.obtenida}
          onCerrar={() => setInsigniaSeleccionada(null)}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Descripción de cómo ganar puntos */}
        <div style={{
          background: NARANJA_PALE, borderRadius: '12px',
          padding: '14px 18px', marginBottom: '4px',
          border: `1px solid ${BORDER}`,
          fontSize: '13px', color: GRIS_MID, lineHeight: 1.6,
        }}>
          <span style={{ fontWeight: 700, color: NARANJA }}>¿Cómo ganar puntos? </span>
          Inicia un curso <span style={{ fontWeight: 600, color: GRIS_TEXTO }}>+10 pts</span>,
          llega al 50% <span style={{ fontWeight: 600, color: GRIS_TEXTO }}>+25 pts</span>,
          complétalo <span style={{ fontWeight: 600, color: GRIS_TEXTO }}>+75 pts</span>
          {' '}y obtén una calificación excelente para un bonus de{' '}
          <span style={{ fontWeight: 600, color: GRIS_TEXTO }}>+20 pts</span> adicionales.
        </div>
        {/* Puntos y nivel */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: `1px solid ${BORDER}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: GRIS_MID, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                Nivel actual
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: GRIS_TEXTO }}>
                {nivel} — {nombre_nivel}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: NARANJA }}>{puntos} pts</div>
              {nivelSig ? (
                <div style={{ fontSize: '12px', color: GRIS_MID, marginTop: '2px' }}>
                  Faltan {puntos_siguiente_nivel - puntos} pts para {nivelSig.nombre}
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#15803d', fontWeight: 600, marginTop: '2px' }}>
                  Nivel máximo alcanzado
                </div>
              )}
            </div>
          </div>
          {nivelSig && <BarraProgreso pct={pctNivel} height={8} />}
        </div>

        {/* Línea de tiempo de niveles */}
        {niveles.length > 0 && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: GRIS_MID, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '24px' }}>
              Recorrido de niveles
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '18px', left: '18px', right: '18px', height: '2px', background: BORDER, zIndex: 0 }} />
              <div style={{
                position: 'absolute', top: '18px', left: '18px',
                width: `${((nivel - 1) / (niveles.length - 1)) * 100}%`,
                height: '2px', background: NARANJA, zIndex: 1, transition: 'width 0.8s ease',
              }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                {niveles.map(n => {
                  const alcanzado = puntos >= n.min;
                  const esActual  = n.nivel === nivel;
                  return (
                    <div key={n.nivel} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        border: `3px solid ${alcanzado ? NARANJA : BORDER}`,
                        background: esActual ? NARANJA : alcanzado ? NARANJA_PALE : 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: 800,
                        color: esActual ? 'white' : alcanzado ? NARANJA : '#9ca3af',
                        boxShadow: esActual ? `0 0 0 4px ${NARANJA_PALE}` : 'none',
                        transition: 'all 0.3s',
                      }}>
                        {n.nivel}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: esActual ? 700 : 500, color: esActual ? NARANJA : alcanzado ? GRIS_TEXTO : '#9ca3af', textAlign: 'center', lineHeight: 1.2 }}>
                        {n.nombre}
                      </div>
                      <div style={{ fontSize: '10px', color: '#9ca3af' }}>{n.min} pts</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Insignias en lista — clickeables */}
        {insigniasOrdenadas.length > 0 && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: GRIS_MID, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>
              Insignias
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {insigniasOrdenadas.map(({ key, info, obtenida }) => {
                const imagen = IMAGENES_INSIGNIAS[key];
                return (
                  <button
                    key={key}
                    onClick={() => setInsigniaSeleccionada({ key, info, obtenida })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '16px',
                      padding: '12px 16px', borderRadius: '10px', border: 'none',
                      background: obtenida ? NARANJA_PALE : GRIS_LIGHT,
                      cursor: 'pointer', textAlign: 'left', width: '100%',
                      transition: 'box-shadow 0.2s, transform 0.15s',
                      outline: `1px solid ${obtenida ? BORDER : '#e5e7eb'}`,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.boxShadow = obtenida ? '0 4px 12px rgba(255,123,0,0.15)' : 'none';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    {/* Imagen */}
                    <div style={{
                      width: '80px', height: '80px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '12px',
                      background: obtenida ? NARANJA_PALE : '#f0f0f0',
                    }}>
                      <img
                        src={imagen}
                        alt={info.nombre}
                        style={{
                          width: '150px', height: '150px', objectFit: 'contain',
                          filter: obtenida ? 'none' : 'grayscale(100%) opacity(0.35)',
                          mixBlendMode: 'multiply',
                        }}
                      />
                    </div>

                    {/* Nombre */}
                    <span style={{
                      fontSize: '14px', fontWeight: 700,
                      color: obtenida ? GRIS_TEXTO : GRIS_MID,
                      fontFamily: 'Poppins, sans-serif', flex: 1,
                    }}>
                      {info.nombre}
                    </span>

                    {/* Estado */}
                    <span style={{
                      flexShrink: 0, fontSize: '11px', fontWeight: 700,
                      padding: '3px 10px', borderRadius: '99px',
                      background: obtenida ? NARANJA : '#e5e7eb',
                      color: obtenida ? 'white' : '#9ca3af',
                    }}>
                      {obtenida ? 'Obtenida' : 'Pendiente'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Componente Principal ──────────────────────────────────────────────────────
export default function VistaEstudiante({ userId }) {
  const [tab,  setTab]  = useState('cursos');
  const [gami, setGami] = useState(null);

  const { data: progreso, loading: lProg  } = useProgreso({ userid: userId });
  console.log("PROGRESO FRONT:", progreso);
  const { data: cursos,   loading: lCurso  } = useCursos();
  const { data: califs=[],   loading: lCalif  } = useCalificaciones({ userid: userId });
  const calificacionesFix = califs.map(c => ({
    ...c,
    final_grade: c.final_grade < 0 ? 0 : c.final_grade
  }));
  console.log("CALIFICACIONES FRONT:", calificacionesFix);

  useEffect(() => {
    fetch(`/api/me/gamificacion?userid=${userId}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data && !data.error) setGami(data); });
  }, []);

  const loading = lProg || lCurso || lCalif;

  const progresoMap = useMemo(() => {
    const map = {};
    progreso.forEach(p => { map[p.course_id] = p; });
    return map;
  }, [progreso]);

  const cursosMap = useMemo(() => {
    const map = {};
    cursos.forEach(c => { map[c.id] = c; });
    return map;
  }, [cursos]);

  const misCursoIds = new Set(progreso.map(p => p.course_id));
  const misCursos   = cursos.filter(c => misCursoIds.has(c.moodle_id));
  console.log("PROGRESO:", progreso);
  console.log("CURSOS:", cursos);
  const completados = progreso.filter(p => p.completed).length;
  const avance      = progreso.length
    ? Math.round(progreso.reduce((s, p) => s + p.percent, 0) / progreso.length)
    : 0;

  const tabs = [
    { id: 'cursos',         label: 'Mis Cursos',     count: misCursos.length },
    { id: 'calificaciones', label: 'Calificaciones', count: calificacionesFix.filter(c => c.final_grade >= 0).length },
    { id: 'logros',         label: 'Logros',         count: null },
  ];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%',
        border: `4px solid ${BORDER}`, borderTopColor: NARANJA,
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', padding: '4px 0', width: '100%' }}>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', }}>
        <StatCard label="Cursos iniciados" value={misCursos.length} />
        <StatCard label="Completados"      value={completados} />
        <StatCard
          label="Avance promedio"
          value={progreso.length ? `${avance}%` : '—'}
          sub="Porcentaje de completación promedio entre todos los cursos matriculados"
        />
     </div>

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'cursos'         && <TabCursos misCursos={misCursos} progresoMap={progresoMap} />}
      {tab === 'calificaciones' && <TabCalificaciones califs={calificacionesFix} cursosMap={cursosMap} />}
      {tab === 'logros'         && <TabLogros gami={gami} />}
    </div>
  );
}
