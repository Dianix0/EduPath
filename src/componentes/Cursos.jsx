import React, { useRef, useState, useEffect } from "react";
import "./Cursos.css";

export default function Cursos() {
  const trackRef = useRef(null);
  const catRef = useRef(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courses, setCourses] = useState([]);
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    fetch("/api/cursos/")
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.map((c) => ({
          id: c.id,
          title: c.titulo,
          category: c.categoria,
          description: c.descripcion,
          duration: c.duracion ? `${c.duracion} minutos` : null,
        }));
        setCourses(mapped);
        const unicas = [...new Set(mapped.map((c) => c.category).filter(Boolean))];
        setCategorias(unicas);
      });
  }, []);

  const handleScroll = (dir = 1) => {
    if (!trackRef.current) return;
    const cardWidth = trackRef.current.querySelector("article")?.offsetWidth ?? 300;
    const gap = 16;
    const distance = (cardWidth + gap) * 2;
    trackRef.current.scrollBy({ left: dir * distance, behavior: "smooth" });
  };

  const scrollCategorias = (dir = 1) => {
    if (!catRef.current) return;
    const catWidth = catRef.current.querySelector(".categoria-card")?.offsetWidth ?? 150;
    const gap = 16;
    const distance = (catWidth + gap) * 2;
    catRef.current.scrollBy({ left: dir * distance, behavior: "smooth" });
  };

  return (
    <section className="cursos-section">
      <div className="cursos-header">
        <h2>Recomendaciones</h2>
        <div className="cursos-buttons">
          <button aria-label="Anterior" onClick={() => handleScroll(-1)}>‹</button>
          <button aria-label="Siguiente" onClick={() => handleScroll(1)}>›</button>
        </div>
      </div>

      <div ref={trackRef} className="cursos-track">
        {courses.map((course) => (
          <article key={course.id} className="curso-card">
            <div className="curso-content">
              <h3>{course.title}</h3>
              <p className="curso-categoria">{course.category}</p>
              <button className="btn-view" onClick={() => setSelectedCourse(course)}>
                Ver
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* === MODAL === */}
      {selectedCourse && (
        <div className="modal-overlay" onClick={() => setSelectedCourse(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()} // evita cerrar el modal al hacer clic dentro
          >
            <button className="modal-close" onClick={() => setSelectedCourse(null)}>
              ×
            </button>

            <h3>{selectedCourse.title}</h3>
            <p className="modal-categoria">{selectedCourse.category}</p>
            <p className="modal-desc">{selectedCourse.description}</p>

            <div className="modal-meta">
              <p><strong>Duración:</strong> {selectedCourse.duration}</p>
              <p><strong>Módulos:</strong> {selectedCourse.modules}</p>
            </div>
          </div>
        </div>
      )}
      <div className="categorias-section">
        <h2>Categorías</h2>
        <div className="categorias-container">
          <button className="cat-btn prev" onClick={() => scrollCategorias(-1)}>‹</button>

          <div ref={catRef} className="categorias-track">
            {categorias.map((cat) => (
              <button key={cat} className="categoria-card">
                {cat}
              </button>
            ))}
          </div>

          <button className="cat-btn next" onClick={() => scrollCategorias(1)}>›</button>
        </div>
      </div>
    </section>
  );

  
}
