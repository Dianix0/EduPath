// src/components/moodle/MoodlePanel.jsx
// Componente principal — detecta el rol y muestra la vista correcta
// Úsalo en cualquier página de Edupath así:
//
//   import MoodlePanel from './components/moodle/MoodlePanel';
//   <MoodlePanel rol={usuario.rol} userId={usuario.moodleId} userName={usuario.nombre} />

import VistaEstudiante from './VistaEstudiante';
import VistaDocente    from './VistaDocente';

/**
 * Props:
 * - rol:      'estudiante' | 'docente' | 'admin'
 * - userId:   ID del usuario en Moodle (necesario para la vista estudiante)
 * - userName: Nombre para mostrar en el saludo
 */
export default function MoodlePanel({ rol, userId, userName }) {
  if (!rol) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
        No se ha definido un rol para este usuario.
      </div>
    );
  }

  // Vista para estudiantes
  if (rol === 'estudiante') {
    return <VistaEstudiante key={userId} userId={userId} userName={userName} />;
  }

  // Vista para docentes y admins
  if (rol === 'docente' || rol === 'admin') {
    return <VistaDocente rol={rol} />;
  }

  return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
      Rol no reconocido: "{rol}"
    </div>
  );
}
