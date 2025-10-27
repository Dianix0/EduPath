import React from "react";
import "./Info.css"; 

function Info() {
  const features = [
    {
      title: "Aprendizaje personalizado",
      description:
        "Un sistema híbrido de recomendación que adapta tus cursos según tus intereses y progreso.",
    },
    {
      title: "Experiencia fluida",
      description:
        "Interfaz moderna, rápida y accesible.",
    },
    {
      title: "Contenido de calidad",
      description:
        "Cursos actualizados, con mentores expertos y enfoque práctico.",
    },
  ];

  return (
    <section className="features">
      <h3>¿Que es EduPath?</h3>
      <p className="intro">
        Un sistema inteligente te guía hacia el siguiente paso en tu aprendizaje.
      </p>
      <div className="feature-grid">
        {features.map((feature, index) => (
          <div key={index} className="feature">
            <h4>{feature.title}</h4>
            <p className="description">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Info;
