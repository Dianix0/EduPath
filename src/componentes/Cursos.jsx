import React, { useRef, useState } from "react";
import "./Cursos.css";

const courses = [
  {
    id: 1,
    title: "Álgebra Relacional: Fundamentos y Operaciones Básicas",
    category: "Bases de Datos 1",
    description:
      "Este microcurso introduce los fundamentos del álgebra relacional, base teórica del lenguaje SQL. El estudiante aprenderá a identificar los principales operadores (selección, proyección, unión, intersección, diferencia y producto cartesiano) y a aplicarlos para manipular conjuntos de datos de manera formal. A través de ejemplos visuales, retos interactivos y ejercicios gamificados, se busca que el estudiante comprenda cómo estas operaciones se traducen en consultas SQL reales.",
    duration: "120 minutos",
    modules: 4,
  },
  {
    id: 2,
    title: "Álgebra Relacional Avanzada: Composición y Consultas Complejas",
    category: "Bases de Datos 1",
    description:
      "Este microcurso profundiza en la composición de operaciones relacionales y su aplicación práctica en el diseño de consultas complejas. Se abordan temas como la composición de operadores, renombramientos, operaciones anidadas y equivalencias entre expresiones. A través de actividades gamificadas, el estudiante resolverá retos que implican transformar expresiones de álgebra relacional en consultas SQL y optimizar su estructura.",
    duration: "140 minutos",
    modules: 5,
  },
  {
    id: 3,
    title: "Normalización de Bases de Datos: Teoría y Aplicación",
    category: "Bases de Datos 1",
    description:
      "Este microcurso tiene como objetivo reforzar los conocimientos sobre el proceso de normalización de bases de datos, desde la Primera hasta la Tercera Forma Normal. El estudiante aprenderá a identificar dependencias funcionales, eliminar redundancias y diseñar esquemas más eficientes. A través de ejercicios interactivos y prácticas con retroalimentación inmediata, se consolidan las competencias necesarias para aplicar correctamente la normalización en entornos reales.",
    duration: "130 minutos",
    modules: 4,
  },
  {
    id: 4,
    title: "SQL Práctico: Consultas Básicas y Filtrado de Datos",
    category: "Bases de Datos 1",
    description:
      "En este microcurso el estudiante reforzará su dominio de las consultas SQL básicas. Se abordarán temas como la creación de consultas SELECT, el uso de condiciones WHERE, operadores lógicos, ordenamiento con ORDER BY y combinaciones simples mediante JOIN. Cada módulo incluye demostraciones guiadas y actividades gamificadas para practicar en un entorno seguro y dinámico.",
    duration: "120 minutos",
    modules: 3,
  },
  {
    id: 5,
    title: "SQL Intermedio: Funciones, Subconsultas y Operaciones Avanzadas",
    category: "Bases de Datos 1",
    description:
      "Este microcurso complementa los fundamentos de SQL introduciendo al estudiante en el uso de funciones de agregación, agrupamientos (GROUP BY, HAVING), subconsultas y operaciones de unión (UNION, INTERSECT). A través de ejemplos guiados y desafíos interactivos, se promueve la comprensión de cómo optimizar y estructurar consultas complejas en bases de datos relacionales.",
    duration: "160 minutos",
    modules: 5,
  },
];

const categorias = [
  {id: "BD1", name: "Bases de Datos 1"},
  {id: "BD2", name:"Bases de Datos 2"},
  {id: "BDo", name:"Otros"},
  {id: "BD1-AR", name:"Algebra Relacional"},
  {id: "BD1-SQL", name:"SQL"},
  {id: "BD1-D", name:"Diagramas"},
  {id: "BD1-N", name:"Normalización"},
];

export default function Cursos() {
  const trackRef = useRef(null);
  const catRef = useRef(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

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
              <button key={cat.id} className="categoria-card">
                {cat.name}
              </button>
            ))}
          </div>

          <button className="cat-btn next" onClick={() => scrollCategorias(1)}>›</button>
        </div>
      </div>
    </section>
  );

  
}
