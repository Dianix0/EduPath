// src/components/MoodleProgreso.jsx
// Dashboard de progreso de usuarios — Edupath × Moodle

import { useState, useMemo } from 'react';
import { useDashboard, useProgreso, useCursos } from '../hooks/useMoodle';

// ─── Utilidades ───────────────────────────────────────────────────────────────
const fmt = (ts) => ts ? new Date(ts * 1000).toLocaleDateString('es-CO', {
  day: '2-digit', month: 'short', year: 'numeric'
}) : '—';

const pctColor = (pct) => {
  if (pct >= 80) return '#22c55e';
  if (pct >= 40) return '#f59e0b';
  return '#ef4444';
};

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = '#6366f1' }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04)',
      borderTop: `4px solid ${color}`,
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    }}>
      <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <span style={{ fontSize: '36px', fontWeight: 800, color: '#111827', lineHeight: 1.1 }}>
        {value}
      </span>
      {sub && <span style={{ fontSize: '13px', color: '#9ca3af' }}>{sub}</span>}
    </div>
  );
}

function ProgressBar({ percent }) {
  const color = pctColor(percent);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        flex: 1, height: '8px', background: '#f3f4f6',
        borderRadius: '99px', overflow: 'hidden'
      }}>
        <div style={{
          width: `${percent}%`, height: '100%',
          background: color, borderRadius: '99px',
          transition: 'width 0.6s ease',
        }} />
      </div>
      <span style={{ fontSize: '13px', fontWeight: 700, color, minWidth: '40px', textAlign: 'right' }}>
        {percent.toFixed(0)}%
      </span>
    </div>
  );
}

function Badge({ text, color, bg }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 10px', borderRadius: '99px',
      fontSize: '12px', fontWeight: 600,
      color, background: bg,
    }}>
      {text}
    </span>
  );
}

function ProgresoTable({ filas, cursoSeleccionado }) {
  const [sortField, setSortField] = useState('percent');
  const [sortDir,   setSortDir]   = useState('desc');
  const [search,    setSearch]    = useState('');

  const filtered = useMemo(() => {
    let rows = cursoSeleccionado
      ? filas.filter(f => f.course_id === parseInt(cursoSeleccionado))
      : filas;

    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(f =>
        f.username?.toLowerCase().includes(q) ||
        f.courseshortname?.toLowerCase().includes(q)
      );
    }

    return [...rows].sort((a, b) => {
      const av = a[sortField] ?? 0;
      const bv = b[sortField] ?? 0;
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
  }, [filas, cursoSeleccionado, search, sortField, sortDir]);

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }) => (
    <span style={{ opacity: sortField === field ? 1 : 0.3, marginLeft: '4px', fontSize: '11px' }}>
      {sortField === field ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
    </span>
  );

  const thStyle = (field) => ({
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: 700,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    cursor: 'pointer',
    userSelect: 'none',
    background: sortField === field ? '#f9fafb' : 'transparent',
    whiteSpace: 'nowrap',
  });

  return (
    <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      {/* Buscador */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '18px' }}>🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por usuario o curso..."
          style={{
            border: 'none', outline: 'none', fontSize: '14px',
            color: '#374151', background: 'transparent', flex: 1,
          }}
        />
        <span style={{ fontSize: '13px', color: '#9ca3af' }}>
          {filtered.length} registros
        </span>
      </div>

      {/* Tabla */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
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
              <th style={thStyle('modules_done')}>
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
                <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                  {search ? 'No hay resultados para tu búsqueda' : 'No hay datos de progreso disponibles aún'}
                </td>
              </tr>
            ) : (
              filtered.map((row, i) => (
                <tr key={row.id} style={{
                  borderBottom: '1px solid #f9fafb',
                  background: i % 2 === 0 ? 'white' : '#fafafa',
                  transition: 'background 0.15s',
                }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: `hsl(${(row.user_id * 47) % 360}, 65%, 88%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: 700,
                        color: `hsl(${(row.user_id * 47) % 360}, 65%, 35%)`,
                        flexShrink: 0,
                      }}>
                        {row.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>
                        {row.username}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      fontSize: '13px', color: '#6366f1', fontWeight: 600,
                      background: '#eef2ff', padding: '3px 8px', borderRadius: '6px',
                    }}>
                      {row.courseshortname}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', minWidth: '180px' }}>
                    <ProgressBar percent={row.percent || 0} />
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {row.completed
                      ? <Badge text="✓ Completado" color="#15803d" bg="#dcfce7" />
                      : row.percent > 0
                        ? <Badge text="▶ En progreso" color="#92400e" bg="#fef3c7" />
                        : <Badge text="○ Sin iniciar" color="#6b7280" bg="#f3f4f6" />
                    }
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#374151' }}>
                      {row.modules_done}
                      <span style={{ color: '#9ca3af' }}>/{row.modules_total}</span>
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6b7280' }}>
                    {fmt(row.timestarted)}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6b7280' }}>
                    {row.timecompleted ? fmt(row.timecompleted) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function MoodleProgreso() {
  const { data: dashboard, loading: loadingDash, error: errorDash } = useDashboard();
  const { data: progreso,  loading: loadingProg, error: errorProg  } = useProgreso();
  const { data: cursos,    loading: loadingCursos                   } = useCursos();
  const [cursoFiltro, setCursoFiltro] = useState('');

  const loading = loadingDash || loadingProg || loadingCursos;
  const error   = errorDash || errorProg;

  if (loading) return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '60vh', gap: '16px',
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%',
        border: '4px solid #e5e7eb', borderTopColor: '#6366f1',
        animation: 'spin 0.8s linear infinite',
      }} />
      <span style={{ color: '#6b7280', fontSize: '15px' }}>Cargando datos de Moodle...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{
      margin: '32px', padding: '24px', borderRadius: '12px',
      background: '#fef2f2', border: '1px solid #fecaca',
      color: '#b91c1c', fontSize: '14px',
    }}>
      <strong>Error al conectar con Moodle:</strong> {error}
      <br /><br />
      <span style={{ color: '#6b7280' }}>
        Verifica que el servicio Flask esté corriendo en <code>localhost:5050</code> y que el token de Moodle sea válido.
      </span>
    </div>
  );

  const resumen = dashboard?.resumen || {};
  const progresoPorCurso = dashboard?.progreso_por_curso || [];

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      background: '#f8fafc', minHeight: '100vh', padding: '32px',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px',
          }}>📊</div>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#111827' }}>
              Progreso de Usuarios
            </h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
              Sincronizado desde Moodle LMS
            </p>
          </div>
        </div>
      </div>

      {/* Tarjetas de métricas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        <StatCard label="Usuarios"        value={resumen.total_usuarios}    color="#6366f1" sub="registrados en Moodle" />
        <StatCard label="Cursos"          value={resumen.total_cursos}      color="#8b5cf6" sub="en el catálogo" />
        <StatCard label="Matrículas"      value={resumen.total_matriculas}  color="#06b6d4" sub="activas e históricas" />
        <StatCard label="Completados"     value={resumen.cursos_completados} color="#22c55e" sub="cursos finalizados" />
        <StatCard label="En Progreso"     value={resumen.cursos_en_progreso} color="#f59e0b" sub="cursos iniciados" />
        <StatCard
          label="Promedio Global"
          value={`${resumen.promedio_progreso || 0}%`}
          color="#ef4444"
          sub="progreso promedio"
        />
      </div>

      {/* Progreso por curso */}
      {progresoPorCurso.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#374151', marginBottom: '16px' }}>
            Avance por Curso
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '12px',
          }}>
            {progresoPorCurso.map(c => (
              <div key={c.course_id} style={{
                background: 'white', borderRadius: '12px', padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                cursor: 'pointer',
                border: cursoFiltro == c.course_id ? '2px solid #6366f1' : '2px solid transparent',
                transition: 'border-color 0.2s',
              }}
                onClick={() => setCursoFiltro(cursoFiltro == c.course_id ? '' : c.course_id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>
                    {c.coursename}
                  </span>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                    {c.completados}/{c.total}
                  </span>
                </div>
                <ProgressBar percent={c.promedio} />
              </div>
            ))}
          </div>
          {cursoFiltro && (
            <button
              onClick={() => setCursoFiltro('')}
              style={{
                marginTop: '12px', padding: '6px 14px', borderRadius: '8px',
                border: '1px solid #e5e7eb', background: 'white',
                fontSize: '13px', color: '#6b7280', cursor: 'pointer',
              }}
            >
              ✕ Quitar filtro de curso
            </button>
          )}
        </div>
      )}

      {/* Tabla de progreso */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#374151', margin: 0 }}>
            Detalle por Usuario
          </h2>
          <select
            value={cursoFiltro}
            onChange={e => setCursoFiltro(e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: '8px',
              border: '1px solid #e5e7eb', fontSize: '13px',
              color: '#374151', background: 'white', cursor: 'pointer',
            }}
          >
            <option value="">Todos los cursos</option>
            {cursos.map(c => (
              <option key={c.id} value={c.id}>{c.fullname}</option>
            ))}
          </select>
        </div>
        <ProgresoTable filas={progreso} cursoSeleccionado={cursoFiltro} />
      </div>
    </div>
  );
}
