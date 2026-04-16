import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./PaginaCursos.css";

export default function PaginaCursos() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [interacciones, setInteracciones] = useState({});
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);

  useEffect(() => {
    fetch("/api/cursos/")
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.map((c) => ({
          id: c.id,
          titulo: c.titulo,
          descripcion: c.descripcion,
          categoria: c.categoria,
          duracion: c.duracion ? `${c.duracion} minutos` : "Sin duración",
        }));
        setCourses(mapped);
      });

    fetch("/api/me/interacciones")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          const map = {};
          data.forEach((ic) => { map[ic.curso_id] = ic; });
          setInteracciones(map);
        }
      });
  }, []);

  const categorias = [...new Set(courses.map((c) => c.categoria).filter(Boolean))];
  const cursosFiltrados = courses.filter((c) => c.categoria === categoriaSeleccionada);

  if (categoriaSeleccionada) {
    return (
      <div className="pagcursos-container">
        <button className="pagcursos-back" onClick={() => setCategoriaSeleccionada(null)}>
          ← Volver a categorías
        </button>
        <h2 className="pagcursos-titulo">{categoriaSeleccionada}</h2>
        <p className="pagcursos-subtitulo">{cursosFiltrados.length} curso(s) disponible(s)</p>

        <div className="pagcursos-grid">
          {cursosFiltrados.map((curso) => {
            const ic = interacciones[curso.id];
            const progreso = ic ? Math.round(ic.progreso ?? 0) : 0;
            return (
              <div key={curso.id} className="pagcursos-card">
                <h3>{curso.titulo}</h3>
                <p className="pagcursos-desc">{curso.descripcion || "Sin descripción."}</p>
                <span className="pagcursos-duracion">Duración: {curso.duracion}</span>
                <div className="pagcursos-card-footer">
                  <button
                    className="pagcursos-btn-entrar"
                    onClick={() => navigate(`/cursos/${curso.id}`)}
                  >
                    {progreso > 0 ? "Continuar" : "Entrar"}
                  </button>
                  {progreso > 0 && (
                    <div className="pagcursos-progreso-wrap">
                      <div className="pagcursos-progreso-bar">
                        <div
                          className="pagcursos-progreso-fill"
                          style={{ width: `${progreso}%` }}
                        />
                      </div>
                      <span className="pagcursos-progreso-label">{progreso}%</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="pagcursos-container">
      <h2 className="pagcursos-titulo">Categorías</h2>
      <p className="pagcursos-subtitulo">Selecciona una categoría para ver sus cursos</p>

      {categorias.length === 0 ? (
        <p className="pagcursos-empty">Cargando categorías...</p>
      ) : (
        <div className="pagcursos-cats">
          {categorias.map((cat) => (
            <button
              key={cat}
              className="pagcursos-cat-card"
              onClick={() => setCategoriaSeleccionada(cat)}
            >
              <span className="pagcursos-cat-nombre">{cat}</span>
              <span className="pagcursos-cat-count">
                {courses.filter((c) => c.categoria === cat).length} curso(s)
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
