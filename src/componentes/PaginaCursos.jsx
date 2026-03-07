import React, { useState, useEffect } from "react";
import "./PaginaCursos.css";

export default function PaginaCursos() {
  const [courses, setCourses] = useState([]);
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
          {cursosFiltrados.map((curso) => (
            <div key={curso.id} className="pagcursos-card">
              <h3>{curso.titulo}</h3>
              <p className="pagcursos-desc">{curso.descripcion || "Sin descripción."}</p>
              <span className="pagcursos-duracion">Duración: {curso.duracion}</span>
            </div>
          ))}
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
