// src/components/moodle/VistaDocente.jsx
// Vista de Moodle para roles DOCENTE y ADMIN en Edupath
// Rediseñado con la estética EduPath: naranja #ff7b00, bordes #ffe2c2, minimalista moderno

import { useState, useMemo } from 'react';
import { useDashboard, useProgreso, useCursos, useUsuarios } from '../../hooks/useMoodle';
import { GamificacionAdmin } from '../AdminTab';

const fmt = (ts) => ts ? new Date(ts * 1000).toLocaleDateString('es-CO', {
  day: '2-digit', month: 'short', year: 'numeric'
}) : '—';

const pctColor = (pct) => {
  if (pct >= 80) return '#22c55e';
  if (pct >= 40) return '#f59e0b';
  return '#ef4444';
};

// ── Sub-componentes ───────────────────────────────────────────────────────────

function MetricCard({ label, value, sub }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '20px 22px',
      border: '1.5px solid #ffe2c2',
    }}>
      <div style={{ fontSize: '28px', fontWeight: 800, color: '#ff7b00', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: '#2d2d2d', marginTop: '8px' }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: '12px', color: '#aaa', marginTop: '3px' }}>{sub}</div>
      )}
    </div>
  );
}

function ProgressBar({ percent }) {
  const color = pctColor(percent);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ flex: 1, height: '6px', background: '#f0f0f0', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{
          width: `${Math.min(percent, 100)}%`, height: '100%',
          background: color, borderRadius: '99px',
          transition: 'width 0.6s ease',
        }} />
      </div>
      <span style={{ fontSize: '12px', fontWeight: 700, color, minWidth: '36px', textAlign: 'right' }}>
        {percent.toFixed(0)}%
      </span>
    </div>
  );
}

function EstadoBadge({ completed, percent }) {
  if (completed) return (
    <span style={{ padding: '2px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, background: '#e6ffed', color: '#276749' }}>
      Completado
    </span>
  );
  if (percent > 0) return (
    <span style={{ padding: '2px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, background: '#fff5ec', color: '#ff7b00' }}>
      En progreso
    </span>
  );
  return (
    <span style={{ padding: '2px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, background: '#f3f4f6', color: '#9ca3af' }}>
      Sin iniciar
    </span>
  );
}

function TablaEstudiantes({ progreso, cursoFiltro }) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('percent');
  const [sortDir, setSortDir] = useState('desc');

  const filtered = useMemo(() => {
    let rows = cursoFiltro ? progreso.filter(p => p.course_id === parseInt(cursoFiltro)) : progreso;
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        r.username?.toLowerCase().includes(q) ||
        r.courseshortname?.toLowerCase().includes(q)
      );
    }
    return [...rows].sort((a, b) => {
      const av = a[sortField] ?? 0, bv = b[sortField] ?? 0;
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
  }, [progreso, cursoFiltro, search, sortField, sortDir]);

  const toggleSort = (f) => {
    if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(f); setSortDir('desc'); }
  };

  const thStyle = (field) => ({
    padding: '10px 14px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 700,
    color: '#ff7b00',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    background: sortField === field ? '#fffaf5' : '#fff5ec',
  });

  const SortIcon = ({ field }) => (
    <span style={{ opacity: sortField === field ? 1 : 0.3, marginLeft: '4px', fontSize: '10px' }}>
      {sortField === field ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
    </span>
  );

  return (
    <div className="at-table-wrap">
      {/* Buscador */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #fff0e0', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por usuario o curso..."
          className="at-search"
          style={{ margin: 0 }}
        />
        <span style={{ fontSize: '12px', color: '#aaa', whiteSpace: 'nowrap' }}>
          {filtered.length} registros
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="at-table">
          <thead>
            <tr>
              <th style={thStyle('username')} onClick={() => toggleSort('username')}>
                Usuario <SortIcon field="username" />
              </th>
              <th style={thStyle('courseshortname')} onClick={() => toggleSort('courseshortname')}>
                Curso <SortIcon field="courseshortname" />
              </th>
              <th style={thStyle('percent')} onClick={() => toggleSort('percent')}>
                Progreso <SortIcon field="percent" />
              </th>
              <th style={thStyle('completed')} onClick={() => toggleSort('completed')}>
                Estado <SortIcon field="completed" />
              </th>
              <th style={{ ...thStyle('modules_done'), cursor: 'default' }}>
                Actividades
              </th>
              <th style={thStyle('timestarted')} onClick={() => toggleSort('timestarted')}>
                Inicio <SortIcon field="timestarted" />
              </th>
              <th style={thStyle('timecompleted')} onClick={() => toggleSort('timecompleted')}>
                Finalización <SortIcon field="timecompleted" />
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '14px' }}>
                  {search ? 'Sin resultados para tu búsqueda' : 'No hay datos de progreso disponibles'}
                </td>
              </tr>
            ) : filtered.map((row, i) => (
              <tr key={row.id} style={{ background: i % 2 === 0 ? 'white' : '#fffaf5' }}>
                <td>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#2d2d2d' }}>
                    {row.username}
                  </span>
                </td>
                <td>
                  <span className="at-badge">{row.courseshortname}</span>
                </td>
                <td style={{ minWidth: '160px' }}>
                  <ProgressBar percent={row.percent || 0} />
                </td>
                <td>
                  <EstadoBadge completed={row.completed} percent={row.percent} />
                </td>
                <td style={{ textAlign: 'center', fontSize: '13px', color: '#444' }}>
                  {row.modules_done}
                  <span style={{ color: '#aaa' }}>/{row.modules_total}</span>
                </td>
                <td style={{ fontSize: '12px', color: '#888' }}>{fmt(row.timestarted)}</td>
                <td style={{ fontSize: '12px', color: '#888' }}>
                  {row.timecompleted ? fmt(row.timecompleted) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Componente Principal ──────────────────────────────────────────────────────
export default function VistaDocente({ rol = 'docente' }) {
  const [tab, setTab] = useState('dashboard');
  const [cursoFiltro, setCursoFiltro] = useState('');

  const { data: dashboard, loading: lDash } = useDashboard();
  const { data: progreso,  loading: lProg  } = useProgreso();
  const { data: cursos,    loading: lCurso } = useCursos();
  const { data: usuarios,  loading: lUser  } = useUsuarios();

  const loading = lDash || lProg || lCurso || lUser;

  const resumen          = dashboard?.resumen          || {};
  const progresoPorCurso = dashboard?.progreso_por_curso || [];

  const recienCompletados = useMemo(() =>
    [...progreso].filter(p => p.completed && p.timecompleted > 0)
      .sort((a, b) => b.timecompleted - a.timecompleted)
      .slice(0, 8),
    [progreso]
  );

  const sinActividad = useMemo(() =>
    progreso.filter(p => !p.completed && p.percent === 0).slice(0, 8),
    [progreso]
  );

  const tabs = [
    { id: 'dashboard', label: 'Dashboard'  },
    { id: 'progreso',  label: 'Progreso'   },
    { id: 'cursos',    label: 'Cursos'     },
    ...(rol === 'admin' ? [{ id: 'usuarios', label: 'Usuarios' }] : []),
  ];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%',
        border: '3px solid #ffe2c2', borderTopColor: '#ff7b00',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#f5f5f5', minHeight: '100vh', padding: '28px 32px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#2d2d2d' }}>
          {rol === 'admin' ? 'Panel Administrador' : 'Panel Docente'}
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#aaa' }}>
          Sincronizado desde Moodle · {cursos.length} cursos · {usuarios.length} usuarios
        </p>
      </div>

      {/* Tabs — misma estética que at-subtabs */}
      <div className="at-subtabs" style={{ marginBottom: '24px' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            className={tab === t.id ? 'activo' : ''}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB: Dashboard */}
      {tab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Métricas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            <MetricCard label="Usuarios"        value={resumen.total_usuarios}                    sub="registrados" />
            <MetricCard label="Cursos"           value={resumen.total_cursos}                      sub="activos" />
            <MetricCard label="Matrículas"       value={resumen.total_matriculas}                  sub="totales" />
            <MetricCard label="Completados"      value={resumen.cursos_completados}                sub="finalizaciones" />
            <MetricCard label="En progreso"      value={resumen.cursos_en_progreso}                sub="cursos iniciados" />
            <MetricCard label="Promedio global"  value={`${resumen.promedio_progreso || 0}%`}      sub="progreso promedio" />
          </div>

          {/* Completados y en riesgo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px 22px', border: '1.5px solid #ffe2c2' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: 700, color: '#2d2d2d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Completados recientemente
              </h3>
              {recienCompletados.length === 0 ? (
                <p style={{ color: '#aaa', fontSize: '13px', margin: 0 }}>Sin completados aún</p>
              ) : recienCompletados.map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #fff0e0' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#2d2d2d' }}>{r.username}</span>
                    <span className="at-badge" style={{ marginLeft: '8px' }}>{r.courseshortname}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#aaa' }}>{fmt(r.timecompleted)}</span>
                </div>
              ))}
            </div>

            <div style={{ background: 'white', borderRadius: '16px', padding: '20px 22px', border: '1.5px solid #ffe2c2' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: 700, color: '#2d2d2d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Sin actividad
              </h3>
              {sinActividad.length === 0 ? (
                <p style={{ color: '#aaa', fontSize: '13px', margin: 0 }}>Todos han iniciado sus cursos</p>
              ) : sinActividad.map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #fff0e0' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#2d2d2d' }}>{r.username}</span>
                    <span className="at-badge" style={{ marginLeft: '8px' }}>{r.courseshortname}</span>
                  </div>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: '#ffd5d5', color: '#e53e3e', fontWeight: 600 }}>
                    Sin iniciar
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Avance por curso */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px 22px', border: '1.5px solid #ffe2c2' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '13px', fontWeight: 700, color: '#2d2d2d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Avance por curso
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {progresoPorCurso.length === 0 ? (
                <p style={{ color: '#aaa', fontSize: '13px', margin: 0 }}>No hay datos de progreso aún</p>
              ) : progresoPorCurso.sort((a, b) => b.promedio - a.promedio).map(c => (
                <div key={c.course_id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#2d2d2d' }}>{c.coursename}</span>
                    <span style={{ fontSize: '12px', color: '#aaa' }}>
                      {c.completados} de {c.total} completados
                    </span>
                  </div>
                  <ProgressBar percent={c.promedio} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: Progreso */}
      {tab === 'progreso' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#2d2d2d' }}>
              Progreso de estudiantes
            </h2>
            <select
              value={cursoFiltro}
              onChange={e => setCursoFiltro(e.target.value)}
              style={{
                padding: '0.55rem 0.9rem',
                borderRadius: '8px',
                border: '1.5px solid #ffe2c2',
                fontSize: '13px',
                color: '#2d2d2d',
                background: 'white',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="">Todos los cursos</option>
              {cursos.map(c => <option key={c.id} value={c.id}>{c.fullname}</option>)}
            </select>
          </div>
          <TablaEstudiantes progreso={progreso} cursoFiltro={cursoFiltro} />
        </div>
      )}

      {/* TAB: Cursos */}
      {tab === 'cursos' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#2d2d2d' }}>
              Cursos
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {cursos.map(c => {
              const cp = progresoPorCurso.find(p => p.course_id === c.id);
              return (
                <div key={c.id} style={{ background: 'white', borderRadius: '16px', padding: '20px 22px', border: '1.5px solid #ffe2c2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ flex: 1 }}>
                      {c.categoryname && (
                        <span className="at-badge" style={{ marginBottom: '6px', display: 'inline-block' }}>
                          {c.categoryname}
                        </span>
                      )}
                      <h3 style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 700, color: '#2d2d2d', lineHeight: 1.3 }}>
                        {c.fullname}
                      </h3>
                    </div>
                    <span style={{
                      flexShrink: 0, fontSize: '11px', padding: '2px 8px', borderRadius: '99px', fontWeight: 600, marginLeft: '8px',
                      background: c.visible ? '#e6ffed' : '#f3f4f6',
                      color: c.visible ? '#276749' : '#9ca3af',
                    }}>
                      {c.visible ? 'Visible' : 'Oculto'}
                    </span>
                  </div>
                  {cp ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#aaa', marginBottom: '8px' }}>
                        <span>{cp.total} matriculados</span>
                        <span>{cp.completados} completados</span>
                      </div>
                      <ProgressBar percent={cp.promedio} />
                    </>
                  ) : (
                    <p style={{ margin: 0, fontSize: '12px', color: '#aaa' }}>Sin estudiantes matriculados</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: Usuarios (solo admin) — Gamificación EduPath */}
      {tab === 'usuarios' && rol === 'admin' && (
        <GamificacionAdmin />
      )}

      {/* TAB: Usuarios Moodle (comentado, no eliminar)
      {tab === 'usuarios' && rol === 'admin' && (
        <div className="at-table-wrap">
          <table className="at-table">
            <thead>
              <tr>
                {['Usuario', 'Nombre', 'Email', 'País', 'Último acceso', 'Estado'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u, i) => (
                <tr key={u.id} style={{ background: i % 2 ? '#fffaf5' : 'white' }}>
                  <td style={{ fontWeight: 600 }}>{u.username}</td>
                  <td>{u.firstname} {u.lastname}</td>
                  <td>{u.email}</td>
                  <td>{u.country || '—'}</td>
                  <td>{u.lastaccess > 0 ? fmt(u.lastaccess) : 'Nunca'}</td>
                  <td>
                    <span style={{
                      fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '99px',
                      background: u.suspended ? '#ffd5d5' : '#e6ffed',
                      color: u.suspended ? '#e53e3e' : '#276749',
                    }}>
                      {u.suspended ? 'Suspendido' : 'Activo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      */}
    </div>
  );
}
