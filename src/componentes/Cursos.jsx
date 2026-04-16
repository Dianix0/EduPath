import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Cursos.css";

export default function Cursos() {
  const navigate = useNavigate();
  const [recs, setRecs] = useState(null);

  useEffect(() => {
    fetch("/api/me/recomendaciones")
      .then((res) => (res.ok ? res.json() : null))
      .then(setRecs)
      .catch(() => {});
  }, []);

  if (!recs) return null;

  const cursos = recs.hibrido?.length ? recs.hibrido : recs.populares;
  const esHibrido = !!recs.hibrido?.length;

  if (!cursos?.length) return null;

  return (
    <section className="cursos-section">
      <div className="rec-seccion-header">
        <h2 className="cursos-main-titulo">Recomendaciones</h2>
        <p className="rec-seccion-subtitulo">
          {esHibrido
            ? "Selección basada en tus intereses y comunidad"
            : "Los cursos más tomados por la comunidad"}
        </p>
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
    </section>
  );
}
