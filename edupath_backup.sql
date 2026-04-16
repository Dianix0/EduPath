-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 09-04-2026 a las 01:26:51
-- Versión del servidor: 10.4.28-MariaDB
-- Versión de PHP: 8.0.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `edupath`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `accesstokens`
--

CREATE TABLE `accesstokens` (
  `id` int(11) NOT NULL,
  `platformUrl` text DEFAULT NULL,
  `clientId` text DEFAULT NULL,
  `scopes` text DEFAULT NULL,
  `iv` text DEFAULT NULL,
  `data` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `actividad`
--

CREATE TABLE `actividad` (
  `id` int(11) NOT NULL,
  `curso_id` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `tipo` enum('video','diapositiva','evaluacion') NOT NULL,
  `orden` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `actividaddiapositiva`
--

CREATE TABLE `actividaddiapositiva` (
  `actividad_id` int(11) NOT NULL,
  `nombre_archivo` varchar(255) NOT NULL,
  `nombre_original` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `actividadevaluacion`
--

CREATE TABLE `actividadevaluacion` (
  `actividad_id` int(11) NOT NULL,
  `tiempo_limite_min` int(11) DEFAULT NULL,
  `intentos_max` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `actividadvideo`
--

CREATE TABLE `actividadvideo` (
  `actividad_id` int(11) NOT NULL,
  `url` varchar(512) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `carrera`
--

CREATE TABLE `carrera` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `carrera`
--

INSERT INTO `carrera` (`id`, `nombre`) VALUES
(1, 'Ingeniería de Sistemas');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `contexttokens`
--

CREATE TABLE `contexttokens` (
  `id` int(11) NOT NULL,
  `contextId` text DEFAULT NULL,
  `path` text DEFAULT NULL,
  `user` text DEFAULT NULL,
  `roles` text DEFAULT NULL,
  `targetLinkUri` text DEFAULT NULL,
  `context` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`context`)),
  `resource` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`resource`)),
  `custom` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`custom`)),
  `endpoint` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`endpoint`)),
  `namesRoles` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`namesRoles`)),
  `lis` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`lis`)),
  `launchPresentation` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`launchPresentation`)),
  `messageType` text DEFAULT NULL,
  `version` text DEFAULT NULL,
  `deepLinkingSettings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`deepLinkingSettings`)),
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `curso`
--

CREATE TABLE `curso` (
  `id` int(11) NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `categoria` varchar(50) DEFAULT NULL,
  `duracion` float DEFAULT NULL,
  `moodle_id` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `curso`
--

INSERT INTO `curso` (`id`, `titulo`, `descripcion`, `categoria`, `duracion`, `moodle_id`) VALUES
(1, 'Álgebra Relacional: Fundamentos y Operaciones Básicas', 'Este microcurso introduce los fundamentos del álgebra relacional, base teórica del lenguaje SQL. El estudiante aprenderá a identificar los principales operadores (selección, proyección, unión, intersección, diferencia y producto cartesiano) y a aplicarlos para manipular conjuntos de datos de manera formal. A través de ejemplos visuales, retos interactivos y ejercicios gamificados, se busca que el estudiante comprenda cómo estas operaciones se traducen en consultas SQL reales.', 'Bases de Datos 1', 120, '2'),
(2, 'Álgebra Relacional Avanzada: Composición y Consultas Complejas', 'Este microcurso profundiza en la composición de operaciones relacionales y su aplicación práctica en el diseño de consultas complejas. Se abordan temas como la composición de operadores, renombramientos, operaciones anidadas y equivalencias entre expresiones. A través de actividades gamificadas, el estudiante resolverá retos que implican transformar expresiones de álgebra relacional en consultas SQL y optimizar su estructura.', 'Bases de Datos 1', 140, '3'),
(3, 'Normalización de Bases de Datos: Teoría y Aplicación', 'Este microcurso tiene como objetivo reforzar los conocimientos sobre el proceso de normalización de bases de datos, desde la Primera hasta la Tercera Forma Normal. El estudiante aprenderá a identificar dependencias funcionales, eliminar redundancias y diseñar esquemas más eficientes. A través de ejercicios interactivos y prácticas con retroalimentación inmediata, se consolidan las competencias necesarias para aplicar correctamente la normalización en entornos reales.', 'Bases de Datos 1', 130, '4'),
(4, 'SQL Práctico: Consultas Básicas y Filtrado de Datos', 'En este microcurso el estudiante reforzará su dominio de las consultas SQL básicas. Se abordarán temas como la creación de consultas SELECT, el uso de condiciones WHERE, operadores lógicos, ordenamiento con ORDER BY y combinaciones simples mediante JOIN. Cada módulo incluye demostraciones guiadas y actividades gamificadas para practicar en un entorno seguro y dinámico.', 'Bases de Datos 1', 120, '5'),
(5, 'SQL Intermedio: Funciones, Subconsultas y Operaciones Avanzadas', 'Este microcurso complementa los fundamentos de SQL introduciendo al estudiante en el uso de funciones de agregación, agrupamientos (GROUP BY, HAVING), subconsultas y operaciones de unión (UNION, INTERSECT). A través de ejemplos guiados y desafíos interactivos, se promueve la comprensión de cómo optimizar y estructurar consultas complejas en bases de datos relacionales.', 'Bases de Datos 1', 160, '6'),
(6, 'Introducción a Python: Fundamentos de Programación', 'Aprende los conceptos básicos de Python, incluyendo variables, estructuras de control y funciones. Ideal para principiantes en programación.', 'Programación', 90, '7'),
(7, 'JavaScript para Principiantes: Web Dinámica', 'Curso enfocado en aprender JavaScript para crear páginas web interactivas y dinámicas.', 'Programación', 100, '8'),
(8, 'Desarrollo Web con React', 'Aprende a construir aplicaciones web modernas usando React y componentes reutilizables.', 'Programación', 120, '9'),
(9, 'Diseño de Interfaces con Figma', 'Curso práctico de diseño de interfaces y prototipos usando Figma.', 'Diseño', 80, '10'),
(10, 'Pintura al Óleo: Técnicas Básicas y Avanzadas', 'Aprende a usar óleo para crear obras artísticas, desde lo básico hasta técnicas avanzadas de mezcla y perspectiva.', 'Arte', 150, '11'),
(11, 'Fotografía Digital: Composición y Luz', 'Curso sobre cómo capturar imágenes impactantes con técnicas de iluminación y composición.', 'Fotografía', 120, '12'),
(12, 'Música para Principiantes: Teoría y Práctica', 'Aprende fundamentos de teoría musical y práctica con instrumentos básicos.', 'Música', 90, '13'),
(13, 'Canto Moderno: Técnicas Vocales', 'Curso de técnicas de canto moderno para mejorar rango, respiración y entonación.', 'Música', 100, '14'),
(14, 'Inteligencia Artificial: Introducción y Aplicaciones', 'Aprende los conceptos básicos de IA y cómo se aplican en la vida real y en negocios.', 'Tecnología', 130, '15'),
(15, 'Machine Learning con Python', 'Curso práctico para aprender Machine Learning usando Python y librerías como scikit-learn.', 'Tecnología', 150, '16'),
(16, 'Cocina Internacional: Recetas Básicas', 'Aprende a preparar platos típicos de diferentes culturas de manera sencilla y práctica.', 'Gastronomía', 90, '17'),
(17, 'Repostería: Técnicas de Pastelería', 'Curso sobre técnicas de repostería, desde galletas hasta pasteles elaborados.', 'Gastronomía', 120, '18'),
(18, 'Yoga para Principiantes: Cuerpo y Mente', 'Aprende posturas básicas de yoga y técnicas de respiración para bienestar físico y mental.', 'Salud', 80, '19'),
(19, 'Meditación y Mindfulness', 'Curso para desarrollar la atención plena y reducir el estrés a través de prácticas guiadas.', 'Salud', 70, '20'),
(20, 'Marketing Digital: Estrategias Básicas', 'Introducción al marketing digital, redes sociales, SEO y campañas publicitarias.', 'Negocios', 100, '21'),
(21, 'Finanzas Personales: Gestión de Dinero', 'Curso para aprender a administrar finanzas personales, presupuesto y ahorro.', 'Negocios', 90, '22'),
(22, 'Emprendimiento: Crear tu Primer Negocio', 'Aprende los pasos básicos para iniciar un negocio propio y estrategias de crecimiento.', 'Negocios', 120, '23'),
(23, 'Robótica para Principiantes', 'Curso introductorio de robótica, programación de microcontroladores y sensores básicos.', 'Tecnología', 130, '24'),
(24, 'Astronomía Básica: Observando el Cielo', 'Curso para aprender sobre constelaciones, planetas y eventos astronómicos.', 'Ciencia', 80, '25'),
(25, 'Historia del Arte: De la Prehistoria al Modernismo', 'Recorrido por la historia del arte, sus movimientos, estilos y artistas más representativos.', 'Arte', 110, '26');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cursoetiqueta`
--

CREATE TABLE `cursoetiqueta` (
  `curso_id` int(11) NOT NULL,
  `etiqueta` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `cursoetiqueta`
--

INSERT INTO `cursoetiqueta` (`curso_id`, `etiqueta`) VALUES
(1, 'Álgebra Relacional'),
(1, 'Bases de Datos'),
(1, 'SQL'),
(2, 'Álgebra Relacional Avanzada'),
(2, 'Consultas Complejas'),
(2, 'SQL'),
(3, 'Bases de Datos'),
(3, 'Modelado'),
(3, 'Normalización'),
(4, 'Consultas'),
(4, 'Filtrado'),
(4, 'SQL Básico'),
(5, 'Funciones'),
(5, 'SQL Intermedio'),
(5, 'Subconsultas'),
(6, 'Principiantes'),
(6, 'Programación'),
(6, 'Python'),
(7, 'Front-end'),
(7, 'JavaScript'),
(7, 'Web'),
(8, 'Aplicaciones Web'),
(8, 'Front-end'),
(8, 'React'),
(9, 'Diseño UI'),
(9, 'Figma'),
(9, 'Prototipos'),
(10, 'Arte'),
(10, 'Óleo'),
(10, 'Pintura'),
(11, 'Composición'),
(11, 'Fotografía'),
(11, 'Iluminación'),
(12, 'Instrumentos'),
(12, 'Música'),
(12, 'Teoría Musical'),
(13, 'Canto'),
(13, 'Música'),
(13, 'Técnicas Vocales'),
(14, 'IA'),
(14, 'Inteligencia Artificial'),
(14, 'Tecnología'),
(15, 'IA'),
(15, 'Machine Learning'),
(15, 'Python'),
(16, 'Cocina'),
(16, 'Gastronomía'),
(16, 'Recetas Internacionales'),
(17, 'Gastronomía'),
(17, 'Pastelería'),
(17, 'Repostería'),
(18, 'Bienestar'),
(18, 'Salud'),
(18, 'Yoga'),
(19, 'Meditación'),
(19, 'Mindfulness'),
(19, 'Relajación'),
(20, 'Marketing Digital'),
(20, 'Negocios'),
(20, 'Redes Sociales'),
(21, 'Ahorro'),
(21, 'Finanzas'),
(21, 'Gestión de Dinero'),
(22, 'Emprendimiento'),
(22, 'Negocios'),
(22, 'Startups'),
(23, 'Microcontroladores'),
(23, 'Robótica'),
(23, 'Tecnología'),
(24, 'Astronomía'),
(24, 'Ciencia'),
(24, 'Observación'),
(25, 'Arte'),
(25, 'Historia del Arte'),
(25, 'Movimientos Artísticos');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estudiante`
--

CREATE TABLE `estudiante` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `edad` int(11) DEFAULT NULL,
  `carrera` int(11) DEFAULT NULL,
  `puntos` int(11) DEFAULT 0,
  `nivel` int(11) DEFAULT 1,
  `moodle_id` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `rol` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estudiante`
--

INSERT INTO `estudiante` (`id`, `nombre`, `edad`, `carrera`, `puntos`, `nivel`, `moodle_id`, `email`, `rol`) VALUES
(21, 'Administrador Usuario', 22, 1, 60, 1, '2', 'dsantamariat04@gmail.com', 'Administrador'),
(22, 'Ana Garcia', 22, 1, 110, 2, '4', 'ana@test.com', 'Estudiante'),
(23, 'Carlos Lopez', 10, 1, 130, 2, '5', 'carlos@test.com', 'Estudiante');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estudianteinsignia`
--

CREATE TABLE `estudianteinsignia` (
  `estudiante_id` int(11) NOT NULL,
  `insignia` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estudianteinsignia`
--

INSERT INTO `estudianteinsignia` (`estudiante_id`, `insignia`) VALUES
(22, 'primer_curso'),
(23, 'perfeccionista'),
(23, 'primer_curso');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estudianteinteres`
--

CREATE TABLE `estudianteinteres` (
  `estudiante_id` int(11) NOT NULL,
  `interes` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estudianteinteres`
--

INSERT INTO `estudianteinteres` (`estudiante_id`, `interes`) VALUES
(21, 'Álgebra Relacional Avanzada'),
(21, 'Aplicaciones Web'),
(21, 'Bases de Datos'),
(22, 'Astronomía'),
(22, 'Pastelería'),
(23, 'Álgebra Relacional Avanzada'),
(23, 'Arte'),
(23, 'Bases de Datos'),
(23, 'Ciencia'),
(23, 'Fotografía'),
(23, 'Front-end'),
(23, 'Música'),
(23, 'Normalización'),
(23, 'Pastelería'),
(23, 'Programación'),
(23, 'Prototipos'),
(23, 'Yoga');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `flask_sessions`
--

CREATE TABLE `flask_sessions` (
  `id` int(11) NOT NULL,
  `session_id` varchar(255) DEFAULT NULL,
  `data` blob DEFAULT NULL,
  `expiry` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `flask_sessions`
--

INSERT INTO `flask_sessions` (`id`, `session_id`, `data`, `expiry`) VALUES
(1, 'session:erkfnFZA5lHChDCTa_C4og2ku71_Jo-xD6zy5CsD9io', 0x81ad657374756469616e74655f696415, '2026-04-07 22:54:53'),
(2, 'session:ok3ayeeP49e9W2ErpTrGrohnY1j9nEpP_MZ9dkOLBRA', 0x81ad657374756469616e74655f696415, '2026-04-07 23:01:37'),
(3, 'session:I2fiaEwyLOjoJUxkfmTIZXcjV93011dnvc00yVnsNsw', 0x81ad657374756469616e74655f696415, '2026-04-07 23:01:37'),
(4, 'session:idtdUFBYNEOLpr7QtRs4QshAjXoYkYshEQGuIaMB23E', 0x81ad657374756469616e74655f696415, '2026-04-07 23:02:36'),
(5, 'session:tnxMxhqku8Jn1_S0ng-bIJRZ5kgaPp5577j4VRKVPdA', 0x81ad657374756469616e74655f696415, '2026-04-07 23:02:37'),
(6, 'session:w_VgHE7Ur4T-WG5je2R4frSW2RmEf-3A3jOwpS2qq1Q', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696415, '2026-04-07 23:36:31'),
(7, 'session:TnqBuTditSedt1-eEG6J91iIDj5W1qD5qvn-e1unhZE', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696417, '2026-05-08 21:57:10'),
(8, 'session:uSbj9sZuXRNwwjm7ekAwK_uww4dQKQO0HrbmJWqPaog', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696415, '2026-04-07 23:37:32'),
(9, 'session:MqlQ3Y2AKhy_F1XAUgLehE12V302woITtDWR2otisoM', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696415, '2026-04-09 20:57:52'),
(10, 'session:RUyxPCbclXtqUMnwbanw9ekEn57FCTPw950bPqCYK30', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696415, '2026-04-09 20:57:56'),
(11, 'session:T-gK84o3NFm-SM4SLVE2wbVZQCxIKhUDy_WXl9sRsls', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696415, '2026-04-11 05:07:50'),
(12, 'session:ExocfpvjOzsz0WjsvXiJxmNa4MryFN5xeVSeG0B8_P0', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696415, '2026-04-11 21:20:41'),
(13, 'session:sbKQxLGuB8B94uRXlqrSMGB1Q7_9-66BXSYCVWo-Dy0', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696415, '2026-04-11 21:20:49'),
(14, 'session:ZTQKkUsMyX6SBRIQw2pfkbhOMpFi5oNaVyNiWYmLJoE', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696415, '2026-04-11 22:35:47'),
(15, 'session:JDHYjK1trqQdMca-84Jkp4nYVANx-PHg5EQa4fjVTsI', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696415, '2026-04-11 22:37:55'),
(16, 'session:EcQJcLVmnxqXFcs9UrUKit0zDtkOW0AY0jpDGy253Nk', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696415, '2026-04-12 21:15:54'),
(17, 'session:Vi6rMXA6ap0If1y7PbTe8J9hJ4BdINwcuclXUnuImJg', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696415, '2026-04-12 21:23:30'),
(18, 'session:W5dG-oAQlMwUccueYfrKBIPtRxGOuegp1azmAgN9zzk', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696415, '2026-04-13 02:02:07'),
(19, 'session:FiSApWM6XHgoMR329meTci5JEWPh7KmiZLh2gBuQn1o', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696415, '2026-04-13 02:02:09'),
(20, 'session:ZdX6rxaiagehdhmuBO85fPlyZ9elpsOd8qGot_GDN6o', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696415, '2026-04-13 15:46:27'),
(21, 'session:9K4vBrEtbEi3PZoqsEk6cf1M9R4LiZBlYFlXlE6Sr8U', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696415, '2026-04-17 00:40:19'),
(22, 'session:k-ISIaEpMllxaChElzIv0obt7Ydxn_sxYckcEuY9DyY', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696415, '2026-04-17 00:40:37'),
(23, 'session:5op4R4IQ1Awg4UV5KsFqDiy_EugcDXS3baBy4BlBBnc', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696415, '2026-04-17 18:00:01'),
(24, 'session:Fjx7D6abmtvjO5BToHAsE2VT7mk97LdRfBgDgvh7kuk', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-04-17 22:10:42'),
(25, 'session:jjqEUd21zFM9oOeO3FhH9Su8RB6wuude7Rq-RfJCl7A', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-04-17 22:13:02'),
(26, 'session:aDehQBbQJERe200vfZcoW4AIT9mWdoaKTGzIbatlG_E', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696415, '2026-04-17 22:16:47'),
(27, 'session:wWOhb_TqSRe5Zb72e5tSA5cEpNzHenlgSfPVazGukS0', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-04-18 02:10:02'),
(28, 'session:ITfPyMiNvOaHGuI1OeGJE0nXCRHW-1cMHYJwfCbJHuY', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-04-18 02:41:10'),
(29, 'session:vRMHL5cgX560XWCO6fmBRttcI0OOw35tyXe3_lqCQ5I', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-04-18 02:49:43'),
(30, 'session:_hqJeb5rN0pjsf9uqAM2ldIIpxcRNe1FpzUH5HDQ0vU', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-04-18 02:51:41'),
(31, 'session:rxP5BES75S0H9TAc9pqKZMJ496p9gHZCNe1V_HLrB0w', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-04-18 02:54:16'),
(32, 'session:3CgMiWF9lqa7F36IuWQeB-nqbqqrbM7Bc5g52j8-uJ0', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-04-18 02:58:57'),
(33, 'session:9UEtfhvbCFYVl42FAqXjmMDK1wI2aKWwK6qD_7uEvEw', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696417, '2026-04-18 03:08:06'),
(34, 'session:rCDwqXptO9nQ18T-xZCpm2JOvYh6nckPxdUwXvoB3wM', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696415, '2026-04-18 14:35:50'),
(35, 'session:DkcGGHOfw3idOB9Sr82giMJijiYn7Rtrak_EtaHrc88', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696417, '2026-04-18 14:36:14'),
(36, 'session:x3dQWmYE2SfvmADbzQUJum86KeML9HsPxdY90Rj0ikY', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696417, '2026-04-18 14:43:19'),
(37, 'session:GMPZ9RGyHkhR0m-QPS1wfpZ0JNB1C5W2g4K8QURkOx8', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696417, '2026-04-18 14:50:21'),
(38, 'session:_eAnckP3QfMhol1deX4rEa3I55E72BeCCpOl6H4RT7U', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696417, '2026-04-18 15:09:03'),
(39, 'session:lpLHZONZJ1AL5c16ygPMgJjUZQdN2JYpzK9AFLLz_VY', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696417, '2026-04-18 15:50:28'),
(40, 'session:Tl6kZ6VwvyzweKmYbcZxgRqyAgWpwxOGiaM50CqM0kQ', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-04-18 21:26:13'),
(41, 'session:BRbKrtS-1pAauCK5zwJb3sn3IIfy6zpWcnHbIowxCng', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-04-19 15:45:26'),
(42, 'session:gWo-TFC0fKp4y1YYUNi6cAjY0kFHaUCGcKiOs8R_U-E', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-04-19 21:12:18'),
(43, 'session:7GHaS4VbhpR8qUJTE184qxFChP-1rG9zfikHpuU99sg', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-04-19 21:12:50'),
(44, 'session:ZUGnG4_Ej7h9XZLyfEF6HJSSeVQWnyWkAbj2bMmrvOg', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-04-19 21:13:24'),
(45, 'session:YSTmWsBkEnvrphMpKBlidEAfaYiTE04yHstFCK2dztY', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-04-19 21:21:24'),
(46, 'session:lEsSbO9ctjTTsre_5ypw13OqygJMIRpFFIV9sl9icgA', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696417, '2026-04-19 21:41:18'),
(47, 'session:KpYtbR0kMIWnokrl40oREnsLb9hayWWMyZ0r2TRhO2w', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-04-19 22:03:41'),
(48, 'session:aF7R-MWw213wyAaGaAYcieVIcjbj96xRz0MHSJqYbK8', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696417, '2026-04-19 22:29:51'),
(49, 'session:aL0Gon5dJ1FVSzqJD-miwQ8M2EsV2OrigQ0IKPsgGT4', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696417, '2026-04-20 02:38:28'),
(50, 'session:6R_QgkTjyR_fy-jLrqsoBfjRgFNxpwDewU4b6KOOtpI', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696417, '2026-04-19 22:29:59'),
(51, 'session:KvC6TsPAHySFoDEGQgPn244Zif3iQg01Dct4dSbN57w', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696417, '2026-04-19 22:30:55'),
(52, 'session:D---EVdxr2Qrf4K2g1RAsCed5Ve61sCCzznlnFsGsaU', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696417, '2026-04-20 02:26:52'),
(53, 'session:lBSxoZJueGXLLpYYh725jUtMGcvaZknFFbSc0BigfeY', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696417, '2026-04-20 02:29:32'),
(54, 'session:xROHk-DfkEJ-crs9YoOzK6_Lxsc42Vj1qzV-fka12z4', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696417, '2026-04-20 02:38:24'),
(55, 'session:aW3vWPXgxJ7iRaCWtAO3aQgTy7MNvyapAqIRAYqb9ZY', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696417, '2026-04-20 02:51:38'),
(56, 'session:PMen15G4Y4DI5NxJ4Lo-4bKo9nQfsU3gc8GehveaAw0', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-04-20 02:53:36'),
(57, 'session:QpbxrUM8v202EHsj7vHf4PwUIB4SufDqC6XJTwcp3AY', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696415, '2026-04-20 02:54:45'),
(58, 'session:r34x1ST9TpX5iFq2taTDfhmJrHKHQwktTzwkuawHLe4', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696415, '2026-04-22 18:27:50'),
(59, 'session:PQgEZM98yNk2BL--o5kYegAncrVb6LXb3maq8hwx1VA', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696415, '2026-04-24 14:14:39'),
(60, 'session:s7K-m-PfBV4o9hCU58CMEs9bq7ERb9Q0wugtXiMdlA4', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696415, '2026-04-24 20:08:17'),
(61, 'session:l5DfwwYFIUxhFvEKZgMHqkgbylIKAQ_6RzIPFCNOSsM', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696415, '2026-04-25 19:54:06'),
(62, 'session:7859RLZwyx10PzkcNMK-_ZAbaKw__ognTv9WlVchiIY', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696415, '2026-04-25 19:56:52'),
(63, 'session:_6xSBoW347YVtWD-OrZ6V5mPZHG6jJvWwzULTQYXkTc', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-04-26 01:54:58'),
(64, 'session:-n_pOnjWEMbcgg5oXrMeNmSx1aEjuCHEcLv2QcLxB8o', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-04-26 01:55:27'),
(65, 'session:WOXCNTu5Mue4UTLx88w4oFPv4lpvofkX-QvX4p-azv0', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-04-26 01:55:44'),
(66, 'session:-8BcwNoFMJ3lRx1i7kCDXnHXLpUeiUIldfo6xc3NqtM', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-04-26 01:55:47'),
(67, 'session:KqD9-vqr6T_Eww0k246a7UWRHMkvVrGa5mnBB_2LqM4', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-04-26 01:56:16'),
(68, 'session:JHm9AZGWZ01XLGq1wbaIG-cB4pvSeORsYRJPl2WTmes', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696417, '2026-04-26 01:57:18'),
(69, 'session:W7irwmKQLHPyjVo7M3Umdtyn5kbGdaa-Oub4iu8ioH0', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696417, '2026-04-26 01:57:52'),
(70, 'session:W7nU09_VGWVGXBuVJ9EGz8U607Xk90aTouXayGkxUAw', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-04-26 01:59:22'),
(71, 'session:Db-QeAvR_V28CTlAvQtlKJ9YLGS4OPgA_mFoYD3sd0k', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-04-26 01:58:40'),
(72, 'session:STFwCXy7ASqeHFL0QoTdX5sw5OTVs3qpyqItU2heJRE', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-04-26 02:13:09'),
(73, 'session:jz1cq7RF4jr9wdFTGxKPMxQhBLnXeDrpBWJ9iDY8Zis', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-04-26 02:14:10'),
(74, 'session:PjaC_vX6G2Y2n7OFqUjVwlY7rOBW_B8zs__lMiBsSDI', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-04-26 02:14:24'),
(75, 'session:OjSDJ5vO81E8T3adxZyqwlBxV9jkkW6M3QEcIjO5oig', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-04-26 02:16:24'),
(76, 'session:CLW-ZbVsEEqVR-MNqw_ifuJpXcu96msWWuYl51lmovc', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-04-26 02:17:19'),
(77, 'session:vFkPbIQcr1yeaM9WEDn7_qXPOmF8MKYYEp3-xljnvw8', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-04-26 02:46:51'),
(78, 'session:7kjC-wqPO4OfrH1erPt4krLwxyrPJRPW7eIMcMIGQU0', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696415, '2026-04-26 02:51:01'),
(79, 'session:kCIkWlDYhaiQqIruoaBLJ43Aw10ay-ctzHS7ebcAfYI', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-04-26 02:52:01'),
(80, 'session:4RIF1zUuq8OKi8nb534ZjKKaXPSkkHZr-aD_sTUfhZc', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-04-26 02:52:45'),
(81, 'session:gcthHlZlpmkXfWWl1XlyluPvJN5p3IsniIhHwcyFCmI', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-04-26 02:57:29'),
(82, 'session:nDr8S0cOKwN5SdZpQZ799d1L9hYBydau3Elfcr6wypE', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696415, '2026-05-02 20:49:48'),
(83, 'session:wcF4RRDgpPORgIaPneWUHTn4H1igHAr3PBwfs60u-XQ', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-05-02 20:52:32'),
(84, 'session:q2f9Lteux4JenaY4P6gACHUk7AlxkPmuE_DciBZ0vfw', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-05-02 20:56:58'),
(85, 'session:w4z1E5TMUYDrSghtQLmnpH5srBN9UI8iWNHnvGD0RY4', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-05-02 21:03:47'),
(86, 'session:gZi1Li3l9kA9MCzaxR7FRL7ra55zOUXrrhaBavleCfE', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696417, '2026-05-02 21:07:42'),
(87, 'session:etazvYA7cg8pe9dXLX8anzLndkJr-n4TrCQSMvMHFKo', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696415, '2026-05-02 21:08:19'),
(88, 'session:_3V9-fy76TRWBgKo8j20XyuiHdUU2-IAlGGh4m9JcQA', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-05-02 21:09:27'),
(89, 'session:7oUAvclE_STSqOekFDEDmXoxRKKb-wsVcI0jGNaLrS4', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696415, '2026-05-03 18:51:17'),
(90, 'session:WD1CK90R2MQwmuUyPPaX21YfFsoAAzcwo5Oez25jwuU', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-05-03 18:54:10'),
(91, 'session:WixlBk6p5I6h8zR9C2bBBZ_2C975aS8AWmmPR2OKHMA', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696417, '2026-05-03 18:54:58'),
(92, 'session:9CXsz2LTR4wvrBmADHWRqlKDDt_iuxPBPrn1Vwsg25U', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696417, '2026-05-03 23:31:27'),
(93, 'session:JesZPgMOIsOtIFgbKil4GuwH8habQpaR8V5oA81mnvk', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-05-03 23:56:25'),
(94, 'session:qhA6jbxJTKinIk8zL1iImQo2ysU3tSh56Jrv6kIXe_8', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696415, '2026-05-04 00:07:21'),
(95, 'session:AYDhZea_JVOeHOwEu_juwE_yJ2HEkmgwel0hcxUjyqk', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696416, '2026-05-04 00:24:32'),
(96, 'session:MqX-GZIUTqj2vjiGshITm0MRxw7-rJPLjn-bZ5_05I4', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696415, '2026-05-08 21:55:17'),
(97, 'session:JG4q_XB7uZR6KAEXOlzDrSn8MtvvLYOq0r-sh9AVs3o', 0x82aa5f7065726d616e656e74c3ad657374756469616e74655f696417, '2026-05-08 21:56:52');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `idtokens`
--

CREATE TABLE `idtokens` (
  `id` int(11) NOT NULL,
  `iss` text DEFAULT NULL,
  `platformId` text DEFAULT NULL,
  `clientId` text DEFAULT NULL,
  `deploymentId` text DEFAULT NULL,
  `user` text DEFAULT NULL,
  `userInfo` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`userInfo`)),
  `platformInfo` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`platformInfo`)),
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `intentoevaluacion`
--

CREATE TABLE `intentoevaluacion` (
  `id` int(11) NOT NULL,
  `estudiante_id` int(11) NOT NULL,
  `actividad_id` int(11) NOT NULL,
  `puntos_obtenidos` decimal(4,1) DEFAULT NULL,
  `total_preguntas` int(11) DEFAULT NULL,
  `intento` int(11) DEFAULT 1,
  `fecha` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `interaccioncurso`
--

CREATE TABLE `interaccioncurso` (
  `estudiante_id` int(11) NOT NULL,
  `curso_id` int(11) NOT NULL,
  `calificacion` float DEFAULT NULL,
  `progreso` float DEFAULT NULL,
  `tiempo_visualizacion` float DEFAULT NULL,
  `fecha_ultima_actividad` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `interaccioncurso`
--

INSERT INTO `interaccioncurso` (`estudiante_id`, `curso_id`, `calificacion`, `progreso`, `tiempo_visualizacion`, `fecha_ultima_actividad`) VALUES
(21, 1, 0, 0, 0, '2025-10-28'),
(21, 3, 0, 0, 0, '2026-02-28'),
(21, 4, 0, 0, 0, '2026-02-28'),
(21, 5, 0, 0, 0, '2026-02-28'),
(21, 6, 0, 0, 0, '2025-10-31'),
(21, 7, 0, 0, 0, '2025-10-31'),
(21, 8, 0, 0, 0, '2026-04-02'),
(22, 8, 0, 1, 0, '2026-04-02'),
(23, 7, 0, 0, 0, '2026-04-02'),
(23, 8, 0, 1, 0, '2026-04-02');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `nonces`
--

CREATE TABLE `nonces` (
  `nonce` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `opcionpregunta`
--

CREATE TABLE `opcionpregunta` (
  `id` int(11) NOT NULL,
  `pregunta_id` int(11) NOT NULL,
  `texto` varchar(512) NOT NULL,
  `es_correcta` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `platforms`
--

CREATE TABLE `platforms` (
  `id` int(11) NOT NULL,
  `platformName` text DEFAULT NULL,
  `platformUrl` text DEFAULT NULL,
  `clientId` text DEFAULT NULL,
  `authEndpoint` text DEFAULT NULL,
  `accesstokenEndpoint` text DEFAULT NULL,
  `kid` text DEFAULT NULL,
  `authConfig` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`authConfig`)),
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `platforms`
--

INSERT INTO `platforms` (`id`, `platformName`, `platformUrl`, `clientId`, `authEndpoint`, `accesstokenEndpoint`, `kid`, `authConfig`, `createdAt`, `updatedAt`) VALUES
(4, 'Moodle Local', 'http://192.168.1.97/moodle', 'Rwa8xCi31BeSFHK', 'http://192.168.1.97/moodle/mod/lti/auth.php', 'http://192.168.1.97/moodle/mod/lti/token.php', '74b3857aa3bf23713fa715725bb2dbbb', '{\"method\":\"JWK_SET\",\"key\":\"http://192.168.1.97/moodle/mod/lti/certs.php\"}', '2026-03-06 23:58:14', '2026-03-06 23:58:14');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `platformstatuses`
--

CREATE TABLE `platformstatuses` (
  `id` varchar(255) NOT NULL,
  `active` tinyint(1) DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pregunta`
--

CREATE TABLE `pregunta` (
  `id` int(11) NOT NULL,
  `evaluacion_id` int(11) NOT NULL,
  `enunciado` text NOT NULL,
  `tipo` enum('opcion_multiple','texto') NOT NULL,
  `orden` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `privatekeys`
--

CREATE TABLE `privatekeys` (
  `kid` varchar(255) NOT NULL,
  `platformUrl` text DEFAULT NULL,
  `clientId` text DEFAULT NULL,
  `iv` text DEFAULT NULL,
  `data` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `privatekeys`
--

INSERT INTO `privatekeys` (`kid`, `platformUrl`, `clientId`, `iv`, `data`, `createdAt`, `updatedAt`) VALUES
('74b3857aa3bf23713fa715725bb2dbbb', 'http://192.168.1.97/moodle', 'Rwa8xCi31BeSFHK', '6ce938e4d6fabf58bae0c2eedb2b08b5', 'd1e59a258e783fe3e69a82d8b2e085c5e507cac295fb86b13473ca1c9d715fef095b057a0d4afd0760f3bf8e47ae01729f7b839412c2296750c0f3801ef47cf684954d21f3cf013df94b1887e4f9138329a217abaeb6c11df23e9556225faabaecdf5ee13b7d85cfe0d6acfa3bed18e563b2569156ad9c188ff42358ea61436bf3e31f4e1e239bec788baf7b10c731021198fc664f0a181f864679b9876fd94b9771e1cd11e6dee4769a01abdf5a38299c5b031c675c64c9a5245423cecabfc5e662e49fe4622cec15540fa11a850a193b58ff478f8e8110f8825b063e31bc661130aa6e06b43180069b16b869a1b30c0c03761698ca2651df0579e763180f95f53655647f90b7900e9356e660313fd27df1a23b4adfd1d6a3dcc55c17bbe25bb4cce8203a9239964cc7ccf8ab55bb32da22aec2cae0f104f8065daeae619d9163861c3c45ee3922b6024762ca90e1a339b320179ce585f84b9643d02fbd18bb3422a94b3088d8a994d6662bd540b2b73891e0ebc56746ee9110a6d6dbbd2ad5b96be223496d9e917fe67b6a7b21a724f410ec7788d1a095cb261db9a5163f6a4dd342c0670e89a4c66bc8254616f0648f96150e6b2508139fbbcb5a813e5b4fa2d567f2220bfc940263f0a505288c2012af177aeb01b4438b4c3e5ec974a2a2e1f71d9fcd04ee615d7c6486a9a90fc48134bbd507d19c56082e970e85373df921d88f759d1119b061c60c35cc62bffe5370b1cbbc08e4424e6d3c882b5297a912668c62b26297bd8d44bec4fe665896ac17e94ed95969449177b56f579a1b5846cd14f787914097a4324ab26ee77bd1ac1372050a19fd58a12c8ef88f7e60970758f3cac16385dd31303e4d6522e0e765cd2f4fa3b19b6ed756c56d6344163fb24cc264ee97c7ed48aa25d75b50d023beb0d8e41fd21061a8509ef604e21845d9e9ac3f046caccc598f740f234f2d626ff95239684e25bb7cfadcf232f016ef3b8ab3be1debee907123425e793eab96a3b2d451260763ea903bde7c90104493ffd07bc13b1ccbf8dd6f2ecc82827ac8000b9211f57a1e72cecc2fca05e2643a97d69bfc4f77fffe9eca56278f4b53b27e041bad2291ce782171ead1a2d46c1bf25aafedaf8fc57ead5fd0ff218206c4364dc809a8766ed08d271e2fdc968cb9c755e0aaee14928417154db58a7849ca8c4484e7f39667be3dea0447dccf78b79739e48057824c02b8ebf73ebf2ef117bb8b80e29d719aee43f38369c48aaf914016809595db7f872c8fdff16ec33e7137a1af2ad1c2f0cfa7025949ffcc88d373713a3f0e021cc62534af7f79c275329454ead8d78903faba208d89f97da4bb62b4dab500eae31e603c959c56ef76f06e261184ddc6d69ca64c954d4aacf0d0da85a58111845076d484f5ad9a29cfb1a508204f8fa7b88ee0e9d6108b9484999797d29ef33fd0a9a920bc21e99968e19860a157ec3dca9bab372698a8acbff6dc0fbe34365a329db76860d4ee59cac3f1b7002f30694afd40a0d72eaa2f436adc9b343dd5d97cc2e33ac4f521f2f9c4ae3bb17e9fa6e4248167b80c95464fb8908411a8b332db0c69464e92ddbda3300b1a15617d8346a333da7ab289c37b677376ecf8f64ae105c93a1f72a27866a63047f7a7fc9bc15dd01d8980eab7208e20bcb7611bc523b548059fbc45a39c2125fddfd145c225ea5efa729f1b255d7b1efa6d6a7b574256cd4c2d574b1756df13fa7dd301d2b9a74eb8e6f5d036b06a8c15d04002f95fbd4dc60ef2d63d159ddf2f23d89038cae5354102570a6dbbb626c830db70dc4311608989de22c0a155346bd8d58db0f2bd931985d92b334d14744b065d1eb7b6011208c87421f15959775270c15067621c1414fe27e7606adce5b281c62838d0e612dbc28d4959f05ed8da6e47ba8324e0ab57599388bb71d3b07aab0f00529509b0ee7fbf91bad5f1511e0c5828c0286d27e862a335c573491b125f16061f2acaeb0f98dd32b491aa19590cb2623dec86f20ee0196acad80bf03b842e59b99d9abbfd7627a8146dc88f9e5a28292242091c540a0f16b3309c005979c9fbf045a317a137e847c86274d9c449dd352e1195ca7dfd4a3ae551390864efaefc4729f0766032c9f5c5d6ea6abfb9024d510883fa6b365ba1f80389de2e2cdd0ff67a8f97d8c2038b30811451619b26c2d9fb805a81ed7fad7488a547aa19491af406bdf40b51be50e70584b5ea64b75ed42e2583c5750fedc95c932538808539358963dd12a5cf6d769fa8552f07adc86f06ca303c52c17dc93d482a3c5686d438138542cf1edc6508e3239838263c496c5f0a76429c0157d5109d89e585ddd527d9f4415762d209a0b93c9a338dcbd116b23a6c5c374a595498336734b0cffef206a14bad1178ff44336e01db2ddf6808f94eda5efe1f290b5d96ded95ea1989698f90757382d9c3ff1d91e648bdb2c46edcbf9d326f31b04b4d25b204f8da2ccc140190e26f8f121ff03ed478474261688eaa689757b1f29a0348cc438352b57908744e868522daf81e9acfd3b938cf6f8bf15cb7ee309446d2cac975b9399d42f575325f098306e49f4b180e5090eebc5c523bcedd697275927aa9ac3f945866a3c9a4594801975950b013588e0df7c5bd099213561d7a8caabc005ee775c1b745bb869a83dd5b535a1c6953f4f071ce744c390d8fe10c3821972584559b698d861fe0b718c99ce8fc9d8d8b204b6c507acfb6d71c5bff826f27dc46e3cc1b7a03c3233c34d4a4c669acd6f1f02b3ad206dbcb292d7fc3efdb70b98c123bd3ddc2a99c1b6c5c36cf013d2f20ac8499444006e80fec12c4229e2c21f90d30b4b77428f93019f1a599537d65937e9d05f4793a6ebc185886aeb7138fc48cd33712080a41fc009d26fd78cc50358702320353b10103a1c0da5cca66dc95a57fbcd84d6c3ef78d4071ee768f0aa869895a2c066650d22c4607ba01e75897777531f2df615c59e7e62a8e1cf89e23ad4ac5dbd744a9201258c73082fab5f5e4cfa82f4e3ddea6d500ddd40fd64b4b57954425909c7c031522ab9625af53d5948bf665ff4a0b5f333995cf9b3e14db782caf0d9555cec780ba1b50addfa57251de009328a38d2e865037eb884d31f50b15c614eaf7e733c7146d06fbc4d60bb46445ad8f077115d9628772b2373e0c5c4abc0463297d05decb1e102d295e64248b218c922dd61966142cbcd21128fcac32629d0da92ea771425a1127db6d2db66d1593ac8051bd38768645d87cc4375c1f79446efd56dca7807f6af128770f76ad658b382d02d2f11727c52081a3ffb3ce04d8348e5accf6013c123d72a1c9229dffac7914f0642983cb26f1453f4ffb1d550405d27aa1e054081b13d528945a6e1c3a94c4392fe9d2d8acdde1ca91b1f3331826ed118d93a0ce52824d3288a8c723c3a689eb5c09759ae2d3d1cbdfd5619f2c6a48d26f8ad0852ea585f972a85467af7705b6111ef347d9f4230d3d22c3923eb30a68b4c1d5e0c1d0698ff982bf90e163af9f18a66a1eac040fd5bcf39cf8af5a1842542084af47ccae900745c5354099225e8ac4a1c091017c478894b2e1b24949d50a264302ccfa3f1ee0d55362494db7cd87c2d030de19244d751f15785130e2077f487893ec9935ae7942c400db40c81e961fee860e7d7f6e864a0acd5a255fc809b26af7d4fd6b3efb0644a19a922f3d88fc5338a3a092723cc60c1e39d245434bb6cc29718de210e7d8934dfb839649784f3f178bb0695a857673447637236a7290d682b78696462486db6eb32b2afac786956423fa1811e2e8d92aaa72bf3708f1b4518c0606c94473c5553d24c9050e355902a8ffb790a57558ed1f8075c5f4300e28779a0550fba4171111130f645586839d3dbec1e399481934ca69814decf3b9ed8357e4f29f9689be28d7ff5da591935ad523b75d6c804b052f063695918c6ca425858a3e20275eea14720d5eac32efd98add221cb39bb98f6a718ee78ce33249ed5d13ab2270b4efc286bc0a26b1d4f54f216f65f45db45a9c0ce0d3ccc76f60206a6b10f940eddb96343cd2942ab91b3abb935af37ac05b5fc95aeae8c670cd5a0d5ecb2a94bb19c76890fea7d022f5129b749a0cf1fea37818a9aae70627978cf162d3417239dad654b0f3594ea8aba11c981e669d98ecf83c6111db3a9836c43865dc9ae642111e126728a4df4893f361920811958517af0a413fa65cc487d644c7785c0eae9fccaeb67012b3c30677fdc97c058d66551785d9d96d041f8c7e5df5a3e1592eff23e1614202217b8d3bba5d94642d8142622d8d55df5ee15bb91c9fdfafcf0115e7b9ea8c22b3e731f1a52c821d1d784431e7ac42ab907692d60f78355f4280a9267f6cffc67925a63a2d0dbab22261bbfed04918ff5d4ac92efeef956864ef62c85752f14141795a08d95234dabfc837006c61c73c914f3874dbd9d03c3e5ec92d6707a3c4bf56ff0daddc142feae3e21611b2c4ec049483d5ae2d0f2713f1c796584c803879ebfe1e395c5ad255990fa7aaec8d71e7118c78f14e8e4a35a780a558f6a22ba5e25a2eb1e789363f0a10f418ddee0897642a2386c5246b2dcbbbdd807b33de4b76f3fe772e20357fdac5002d54260dde7092c083f0d1ef05f820527693c5298de94310a26f75ad614a7fda0e8890c7a8a1c6c4ee3a9f1528ed917f0f868f611a9624937a2155070fcfcd71643b35f97c0a4cd7734', '2026-03-06 23:58:14', '2026-03-06 23:58:14');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `progresoactividad`
--

CREATE TABLE `progresoactividad` (
  `estudiante_id` int(11) NOT NULL,
  `actividad_id` int(11) NOT NULL,
  `completado` tinyint(1) DEFAULT 0,
  `fecha_completado` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `publickeys`
--

CREATE TABLE `publickeys` (
  `kid` varchar(255) NOT NULL,
  `platformUrl` text DEFAULT NULL,
  `clientId` text DEFAULT NULL,
  `iv` text DEFAULT NULL,
  `data` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `publickeys`
--

INSERT INTO `publickeys` (`kid`, `platformUrl`, `clientId`, `iv`, `data`, `createdAt`, `updatedAt`) VALUES
('74b3857aa3bf23713fa715725bb2dbbb', 'http://192.168.1.97/moodle', 'Rwa8xCi31BeSFHK', 'ff6827b7a441308ac2fb73b49b8622b5', '6b2d3ed243f96b2a021bf57ee122b840c6aa23a545586addf6c818b5682d3e61e0b76569edbc1cdcaffa43f0aa0dab1879747544095f7d0de9a9453e604b8b0bcd8302d0912d75e5590be08c7d6441f2ee2f60417c14205ced068f7c13176cbf256df6f467cda144a340a43f1757e12617048f892e573738856e88196e44362790ac7fbe6a7e292db7d1f5452e894996afa7397eb0fbf5bb88b87bcd385849b590a4ae6e1271623561ba48d9b66cb68b2f791279e5aaee5e934c6b9e81b2154cf9f8d4ed0ea1c0cf5acb2fe304292196eea39564158af74b9862b53c61bb9981c3443c058768069f4754e9bd5f89b0620b4db9e8319b6d4b8dcb36ce53602e2e04d344ff6b627dd7e730fe329894d36937aa0449e9088a033cb6024b6a20d2e8143edc7c9919bbf51c7ed3cd6d42653626eca9a9b2f5bd950ebd41de5e7f36471799fe19ee5f1699e29a317990c631b4cde73675f4c2f8c151484f6847c37183e001fcac543bf92b1f339d54ce4c022cdb184979bbad87dcea314b19e19cf9bf54127794a322cac4e390509f39a579192eaa55b955c906d6330cb08aeeef75901595706acbe29af5555bc5c0437facb6ec4d074cbd2b202bc192efd0f6076878f3f88e48a92ae6f9a596e284c9417e7a9fa0198a8a134f968702fe68bdcdf00ac5a6e4ba826b03b065c1cc42ec1e78acbdefdb84adf395421e7db327d4078a5a5224ad81eba5be5cf281ec237a0d0569368a7d7470f0ea93dc9d9e714b085a4ed599353ea219b2a552df83c3e6e503892625d07a6d24d608221d0790c1ade1e14749cab1e8a5f4d4180242bbc771de4e7de0e53a7826b69a9e939215c647f722fa7fc04db24a5811884899f6e7d97ff0a4373e372a1a42063865d67a68e353be4614e6d7e7d4622d577b873e5d8d6370c6e29145be2f6c8d94759ef49ef74b38573018b239699354eef4d5255bbf7875d9c23d9f24afe38db9ba61f89595701ab3757415d20e8eb70f05fd0df73f093f7ea9dd49ecf7be3a3b39465511023c971fac2d35149ae317d6faaa6a43b920502df9393b5e2fb08f4a589bf8847f10f4ab61b6b69dbc558019555a7aec218548e8c8708bf3c6decece37ddf7b416b700e903255c95e54f8de557706e495d73b08bec79ca304cb489dc2bb41e6e86ff3dcbd9b42a285eb34cddee5e16a6aec66d7569bb9a50af532c0fcd5b26d1f3ac3937a6f605d311b8694b25574f3bc368e5', '2026-03-06 23:58:14', '2026-03-06 23:58:14');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `respuestapregunta`
--

CREATE TABLE `respuestapregunta` (
  `id` int(11) NOT NULL,
  `intento_id` int(11) NOT NULL,
  `pregunta_id` int(11) NOT NULL,
  `opcion_id` int(11) DEFAULT NULL,
  `texto_respuesta` text DEFAULT NULL,
  `es_correcta` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sequelizemeta`
--

CREATE TABLE `sequelizemeta` (
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `states`
--

CREATE TABLE `states` (
  `state` varchar(255) NOT NULL,
  `query` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`query`)),
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `accesstokens`
--
ALTER TABLE `accesstokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `accesstokens_platform_url_client_id_scopes` (`platformUrl`(50),`clientId`(50),`scopes`(50)),
  ADD KEY `accesstokens_created_at` (`createdAt`);

--
-- Indices de la tabla `actividad`
--
ALTER TABLE `actividad`
  ADD PRIMARY KEY (`id`),
  ADD KEY `curso_id` (`curso_id`);

--
-- Indices de la tabla `actividaddiapositiva`
--
ALTER TABLE `actividaddiapositiva`
  ADD PRIMARY KEY (`actividad_id`);

--
-- Indices de la tabla `actividadevaluacion`
--
ALTER TABLE `actividadevaluacion`
  ADD PRIMARY KEY (`actividad_id`);

--
-- Indices de la tabla `actividadvideo`
--
ALTER TABLE `actividadvideo`
  ADD PRIMARY KEY (`actividad_id`);

--
-- Indices de la tabla `carrera`
--
ALTER TABLE `carrera`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `contexttokens`
--
ALTER TABLE `contexttokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `contexttokens_context_id_user` (`contextId`(50),`user`(50)),
  ADD KEY `contexttokens_created_at` (`createdAt`);

--
-- Indices de la tabla `curso`
--
ALTER TABLE `curso`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `cursoetiqueta`
--
ALTER TABLE `cursoetiqueta`
  ADD PRIMARY KEY (`curso_id`,`etiqueta`);

--
-- Indices de la tabla `estudiante`
--
ALTER TABLE `estudiante`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `moodle_id` (`moodle_id`);

--
-- Indices de la tabla `estudianteinsignia`
--
ALTER TABLE `estudianteinsignia`
  ADD PRIMARY KEY (`estudiante_id`,`insignia`);

--
-- Indices de la tabla `estudianteinteres`
--
ALTER TABLE `estudianteinteres`
  ADD PRIMARY KEY (`estudiante_id`,`interes`);

--
-- Indices de la tabla `flask_sessions`
--
ALTER TABLE `flask_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `session_id` (`session_id`);

--
-- Indices de la tabla `idtokens`
--
ALTER TABLE `idtokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idtokens_iss_client_id_deployment_id_user` (`iss`(50),`clientId`(50),`deploymentId`(50),`user`(50)),
  ADD KEY `idtokens_created_at` (`createdAt`);

--
-- Indices de la tabla `intentoevaluacion`
--
ALTER TABLE `intentoevaluacion`
  ADD PRIMARY KEY (`id`),
  ADD KEY `estudiante_id` (`estudiante_id`),
  ADD KEY `actividad_id` (`actividad_id`);

--
-- Indices de la tabla `interaccioncurso`
--
ALTER TABLE `interaccioncurso`
  ADD PRIMARY KEY (`estudiante_id`,`curso_id`),
  ADD KEY `curso_id` (`curso_id`);

--
-- Indices de la tabla `nonces`
--
ALTER TABLE `nonces`
  ADD PRIMARY KEY (`nonce`),
  ADD UNIQUE KEY `nonces_nonce` (`nonce`(50)),
  ADD KEY `nonces_created_at` (`createdAt`);

--
-- Indices de la tabla `opcionpregunta`
--
ALTER TABLE `opcionpregunta`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pregunta_id` (`pregunta_id`);

--
-- Indices de la tabla `platforms`
--
ALTER TABLE `platforms`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `platforms_platform_url_client_id` (`platformUrl`(50),`clientId`(50)),
  ADD UNIQUE KEY `platforms_kid` (`kid`(50)),
  ADD KEY `platforms_platform_url` (`platformUrl`(50));

--
-- Indices de la tabla `platformstatuses`
--
ALTER TABLE `platformstatuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `platform_statuses_id` (`id`);

--
-- Indices de la tabla `pregunta`
--
ALTER TABLE `pregunta`
  ADD PRIMARY KEY (`id`),
  ADD KEY `evaluacion_id` (`evaluacion_id`);

--
-- Indices de la tabla `privatekeys`
--
ALTER TABLE `privatekeys`
  ADD PRIMARY KEY (`kid`),
  ADD UNIQUE KEY `privatekeys_kid` (`kid`(50));

--
-- Indices de la tabla `progresoactividad`
--
ALTER TABLE `progresoactividad`
  ADD PRIMARY KEY (`estudiante_id`,`actividad_id`),
  ADD KEY `actividad_id` (`actividad_id`);

--
-- Indices de la tabla `publickeys`
--
ALTER TABLE `publickeys`
  ADD PRIMARY KEY (`kid`),
  ADD UNIQUE KEY `publickeys_kid` (`kid`(50));

--
-- Indices de la tabla `respuestapregunta`
--
ALTER TABLE `respuestapregunta`
  ADD PRIMARY KEY (`id`),
  ADD KEY `intento_id` (`intento_id`),
  ADD KEY `pregunta_id` (`pregunta_id`),
  ADD KEY `opcion_id` (`opcion_id`);

--
-- Indices de la tabla `sequelizemeta`
--
ALTER TABLE `sequelizemeta`
  ADD PRIMARY KEY (`name`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indices de la tabla `states`
--
ALTER TABLE `states`
  ADD PRIMARY KEY (`state`),
  ADD UNIQUE KEY `states_state` (`state`(50)),
  ADD KEY `states_created_at` (`createdAt`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `accesstokens`
--
ALTER TABLE `accesstokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `actividad`
--
ALTER TABLE `actividad`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `carrera`
--
ALTER TABLE `carrera`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `contexttokens`
--
ALTER TABLE `contexttokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `curso`
--
ALTER TABLE `curso`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT de la tabla `estudiante`
--
ALTER TABLE `estudiante`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT de la tabla `flask_sessions`
--
ALTER TABLE `flask_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=98;

--
-- AUTO_INCREMENT de la tabla `idtokens`
--
ALTER TABLE `idtokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `intentoevaluacion`
--
ALTER TABLE `intentoevaluacion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `opcionpregunta`
--
ALTER TABLE `opcionpregunta`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `platforms`
--
ALTER TABLE `platforms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `pregunta`
--
ALTER TABLE `pregunta`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `respuestapregunta`
--
ALTER TABLE `respuestapregunta`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `actividad`
--
ALTER TABLE `actividad`
  ADD CONSTRAINT `actividad_ibfk_1` FOREIGN KEY (`curso_id`) REFERENCES `curso` (`id`);

--
-- Filtros para la tabla `actividaddiapositiva`
--
ALTER TABLE `actividaddiapositiva`
  ADD CONSTRAINT `actividaddiapositiva_ibfk_1` FOREIGN KEY (`actividad_id`) REFERENCES `actividad` (`id`);

--
-- Filtros para la tabla `actividadevaluacion`
--
ALTER TABLE `actividadevaluacion`
  ADD CONSTRAINT `actividadevaluacion_ibfk_1` FOREIGN KEY (`actividad_id`) REFERENCES `actividad` (`id`);

--
-- Filtros para la tabla `actividadvideo`
--
ALTER TABLE `actividadvideo`
  ADD CONSTRAINT `actividadvideo_ibfk_1` FOREIGN KEY (`actividad_id`) REFERENCES `actividad` (`id`);

--
-- Filtros para la tabla `cursoetiqueta`
--
ALTER TABLE `cursoetiqueta`
  ADD CONSTRAINT `cursoetiqueta_ibfk_1` FOREIGN KEY (`curso_id`) REFERENCES `curso` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `estudianteinsignia`
--
ALTER TABLE `estudianteinsignia`
  ADD CONSTRAINT `estudianteinsignia_ibfk_1` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiante` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `estudianteinteres`
--
ALTER TABLE `estudianteinteres`
  ADD CONSTRAINT `estudianteinteres_ibfk_1` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiante` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `intentoevaluacion`
--
ALTER TABLE `intentoevaluacion`
  ADD CONSTRAINT `intentoevaluacion_ibfk_1` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiante` (`id`),
  ADD CONSTRAINT `intentoevaluacion_ibfk_2` FOREIGN KEY (`actividad_id`) REFERENCES `actividadevaluacion` (`actividad_id`);

--
-- Filtros para la tabla `interaccioncurso`
--
ALTER TABLE `interaccioncurso`
  ADD CONSTRAINT `interaccioncurso_ibfk_1` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiante` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `interaccioncurso_ibfk_2` FOREIGN KEY (`curso_id`) REFERENCES `curso` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `opcionpregunta`
--
ALTER TABLE `opcionpregunta`
  ADD CONSTRAINT `opcionpregunta_ibfk_1` FOREIGN KEY (`pregunta_id`) REFERENCES `pregunta` (`id`);

--
-- Filtros para la tabla `pregunta`
--
ALTER TABLE `pregunta`
  ADD CONSTRAINT `pregunta_ibfk_1` FOREIGN KEY (`evaluacion_id`) REFERENCES `actividadevaluacion` (`actividad_id`);

--
-- Filtros para la tabla `progresoactividad`
--
ALTER TABLE `progresoactividad`
  ADD CONSTRAINT `progresoactividad_ibfk_1` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiante` (`id`),
  ADD CONSTRAINT `progresoactividad_ibfk_2` FOREIGN KEY (`actividad_id`) REFERENCES `actividad` (`id`);

--
-- Filtros para la tabla `respuestapregunta`
--
ALTER TABLE `respuestapregunta`
  ADD CONSTRAINT `respuestapregunta_ibfk_1` FOREIGN KEY (`intento_id`) REFERENCES `intentoevaluacion` (`id`),
  ADD CONSTRAINT `respuestapregunta_ibfk_2` FOREIGN KEY (`pregunta_id`) REFERENCES `pregunta` (`id`),
  ADD CONSTRAINT `respuestapregunta_ibfk_3` FOREIGN KEY (`opcion_id`) REFERENCES `opcionpregunta` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
