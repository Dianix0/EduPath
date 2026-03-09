import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PaginaRecomendaciones.css";
import "./Cursos.css";

function SeccionRecomendacion({ titulo, subtitulo, cursos }) {
  const navigate = useNavigate();
  if (!cursos || cursos.length === 0) return null;

  return (
    <div className="rec-seccion">
      <div className="rec-seccion-header">
        <h3 className="rec-seccion-titulo">{titulo}</h3>
        {subtitulo && <p className="rec-seccion-subtitulo">{subtitulo}</p>}
      </div>
      <div className="rec-track">
        {cursos.map((curso) => (
          <article key={curso.id} className="rec-card">
            <div className="rec-card-top">
              {curso.categoria && (
                <span className="rec-card-cat">{curso.categoria}</span>
              )}
              <h4 className="rec-card-titulo">{curso.titulo}</h4>
              {curso.descripcion && (
                <p className="rec-card-desc">{curso.descripcion}</p>
              )}
            </div>
            <div className="rec-card-footer">
              {curso.duracion && (
                <span className="rec-card-duracion">{curso.duracion} min</span>
              )}
              <button
                className="rec-card-btn"
                onClick={() => navigate(`/cursos/${curso.id}`)}
              >
                Entrar
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default function PaginaRecomendaciones() {
  const [recs, setRecs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me/recomendaciones")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { setRecs(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="pagerec-container">
      <h1 className="pagerec-titulo">Recomendaciones</h1>

      {loading && <p className="pagerec-estado">Cargando...</p>}

      {!loading && !recs && (
        <p className="pagerec-estado">
          Inicia sesión para ver tus recomendaciones.
        </p>
      )}

      {!loading && recs && (
        <div className="pagerec-secciones">
          <SeccionRecomendacion
            titulo="Según tus gustos"
            subtitulo="Cursos similares a los que ya has tomado"
            cursos={recs.segun_gustos}
          />
          <SeccionRecomendacion
            titulo="Según tu perfil"
            subtitulo="Lo que eligen estudiantes con un perfil similar al tuyo"
            cursos={recs.segun_perfil}
          />
          <SeccionRecomendacion
            titulo="Para ti"
            subtitulo="Selección basada en tus intereses y comunidad"
            cursos={recs.hibrido}
          />
          <SeccionRecomendacion
            titulo="Cursos populares"
            subtitulo="Los más tomados por la comunidad"
            cursos={recs.populares}
          />
          {!recs.segun_gustos?.length &&
            !recs.segun_perfil?.length &&
            !recs.hibrido?.length &&
            !recs.populares?.length && (
              <p className="pagerec-estado">
                Aún no hay recomendaciones disponibles. Completa tu perfil e
                interactúa con algunos cursos.
              </p>
            )}
        </div>
      )}
    </div>
  );
}
