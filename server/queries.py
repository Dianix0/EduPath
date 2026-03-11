# ============================================================
# CARRERA
# ============================================================

GET_ALL_CARRERAS = "SELECT * FROM Carrera ORDER BY nombre"

GET_CARRERA_BY_ID = "SELECT * FROM Carrera WHERE id = %s"

INSERT_CARRERA = "INSERT INTO Carrera (nombre) VALUES (%s)"

DELETE_CARRERA = "DELETE FROM Carrera WHERE id = %s"


# ============================================================
# ESTUDIANTE
# ============================================================

GET_ALL_ESTUDIANTES = "SELECT * FROM Estudiante"

GET_ESTUDIANTE_BY_ID = "SELECT * FROM Estudiante WHERE id = %s"

GET_ESTUDIANTE_BY_MOODLE_ID = "SELECT * FROM Estudiante WHERE moodle_id = %s"

INSERT_ESTUDIANTE = """
    INSERT INTO Estudiante (nombre, email, moodle_id, edad, carrera, puntos, nivel, rol)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
"""

UPDATE_ESTUDIANTE_ROL = "UPDATE Estudiante SET rol = %s WHERE id = %s"

UPDATE_ESTUDIANTE = """
    UPDATE Estudiante
    SET nombre = %s, email = %s, edad = %s, carrera = %s, puntos = %s, nivel = %s
    WHERE id = %s
"""

DELETE_ESTUDIANTE = "DELETE FROM Estudiante WHERE id = %s"

UPDATE_ESTUDIANTE_COMPLETAR = """
    UPDATE Estudiante SET edad = %s, carrera = %s WHERE id = %s
"""

UPDATE_ESTUDIANTE_CONFIGURACION = """
    UPDATE Estudiante SET email = %s, edad = %s, carrera = %s WHERE id = %s
"""

# ---- Intereses ----

GET_INTERESES_BY_ESTUDIANTE = (
    "SELECT * FROM EstudianteInteres WHERE estudiante_id = %s"
)

INSERT_INTERES = (
    "INSERT INTO EstudianteInteres (estudiante_id, interes) VALUES (%s, %s)"
)

DELETE_INTERES = (
    "DELETE FROM EstudianteInteres WHERE estudiante_id = %s AND interes = %s"
)

# ---- Insignias ----

GET_INSIGNIAS_BY_ESTUDIANTE = (
    "SELECT * FROM EstudianteInsignia WHERE estudiante_id = %s"
)

INSERT_INSIGNIA = (
    "INSERT INTO EstudianteInsignia (estudiante_id, insignia) VALUES (%s, %s)"
)

DELETE_INSIGNIA = (
    "DELETE FROM EstudianteInsignia WHERE estudiante_id = %s AND insignia = %s"
)


# ============================================================
# CURSO
# ============================================================

GET_ALL_CURSOS = "SELECT * FROM Curso"

GET_CURSO_BY_ID = "SELECT * FROM Curso WHERE id = %s"

GET_CURSO_BY_MOODLE_ID = "SELECT * FROM Curso WHERE moodle_id = %s"

INSERT_CURSO = """
    INSERT INTO Curso (titulo, descripcion, categoria, duracion)
    VALUES (%s, %s, %s, %s)
"""

UPDATE_CURSO = """
    UPDATE Curso
    SET titulo = %s, descripcion = %s, categoria = %s, duracion = %s
    WHERE id = %s
"""

DELETE_CURSO = "DELETE FROM Curso WHERE id = %s"

# ---- Etiquetas ----

GET_ALL_ETIQUETAS = "SELECT DISTINCT etiqueta FROM CursoEtiqueta ORDER BY etiqueta"

GET_CURSOS_CON_ETIQUETAS = """
    SELECT c.id, c.titulo, ce.etiqueta
    FROM Curso c
    JOIN CursoEtiqueta ce ON c.id = ce.curso_id
    ORDER BY c.titulo, ce.etiqueta
"""

GET_ETIQUETAS_BY_CURSO = (
    "SELECT * FROM CursoEtiqueta WHERE curso_id = %s"
)

INSERT_ETIQUETA = (
    "INSERT INTO CursoEtiqueta (curso_id, etiqueta) VALUES (%s, %s)"
)

DELETE_ETIQUETA = (
    "DELETE FROM CursoEtiqueta WHERE curso_id = %s AND etiqueta = %s"
)


# ============================================================
# INTERACCION CURSO
# ============================================================

GET_ALL_INTERACCIONES = "SELECT * FROM InteraccionCurso"

GET_INTERACCION_BY_IDS = """
    SELECT * FROM InteraccionCurso
    WHERE estudiante_id = %s AND curso_id = %s
"""

GET_INTERACCIONES_BY_ESTUDIANTE = (
    "SELECT * FROM InteraccionCurso WHERE estudiante_id = %s"
)

GET_INTERACCIONES_CON_PROGRESO = (
    "SELECT * FROM InteraccionCurso WHERE estudiante_id = %s AND progreso > 0"
)

GET_INTERACCIONES_BY_CURSO = (
    "SELECT * FROM InteraccionCurso WHERE curso_id = %s"
)

GET_INTERACCIONES_CON_TITULO = """
    SELECT ic.estudiante_id, ic.curso_id, ic.calificacion, ic.progreso,
           ic.tiempo_visualizacion, ic.fecha_ultima_actividad,
           c.titulo AS curso_titulo
    FROM InteraccionCurso ic
    JOIN Curso c ON ic.curso_id = c.id
    WHERE ic.estudiante_id = %s
"""

INSERT_INTERACCION = """
    INSERT INTO InteraccionCurso
        (estudiante_id, curso_id, calificacion, progreso, tiempo_visualizacion, fecha_ultima_actividad)
    VALUES (%s, %s, %s, %s, %s, %s)
"""

UPDATE_INTERACCION = """
    UPDATE InteraccionCurso
    SET calificacion = %s,
        progreso = %s,
        tiempo_visualizacion = %s,
        fecha_ultima_actividad = %s
    WHERE estudiante_id = %s AND curso_id = %s
"""

DELETE_INTERACCION = """
    DELETE FROM InteraccionCurso
    WHERE estudiante_id = %s AND curso_id = %s
"""

# ============================================================
# GAMIFICACIÓN
# ============================================================
UPDATE_PUNTOS_NIVEL = """
    UPDATE Estudiante
    SET puntos = %s, nivel = %s
    WHERE id = %s
"""

GET_CURSOS_COMPLETADOS = """
    SELECT COUNT(*) as total
    FROM InteraccionCurso
    WHERE estudiante_id = %s AND progreso >= 1.0
"""

GET_CURSOS_COMPLETADOS_BD = """
    SELECT COUNT(*) as total
    FROM InteraccionCurso ic
    JOIN Curso c ON ic.curso_id = c.id
    WHERE ic.estudiante_id = %s
    AND ic.progreso >= 1.0
    AND c.categoria = 'Bases de Datos 1'
"""

GET_INTERACCIONES_ESTUDIANTE_DETALLE = """
    SELECT ic.*, c.categoria
    FROM InteraccionCurso ic
    JOIN Curso c ON ic.curso_id = c.id
    WHERE ic.estudiante_id = %s
"""

# ============================================================
# ACTIVIDAD
# ============================================================

GET_ACTIVIDADES_BY_CURSO = (
    "SELECT * FROM Actividad WHERE curso_id = %s ORDER BY orden, id"
)

GET_ACTIVIDAD_BY_ID = "SELECT * FROM Actividad WHERE id = %s"

INSERT_ACTIVIDAD = """
    INSERT INTO Actividad (curso_id, titulo, descripcion, tipo, orden)
    VALUES (%s, %s, %s, %s, %s)
"""

UPDATE_ACTIVIDAD = """
    UPDATE Actividad SET titulo = %s, descripcion = %s, orden = %s WHERE id = %s
"""

DELETE_ACTIVIDAD = "DELETE FROM Actividad WHERE id = %s"

# ---- Video ----

GET_VIDEO_BY_ACTIVIDAD = "SELECT * FROM ActividadVideo WHERE actividad_id = %s"

INSERT_VIDEO = "INSERT INTO ActividadVideo (actividad_id, url) VALUES (%s, %s)"

UPSERT_VIDEO = """
    INSERT INTO ActividadVideo (actividad_id, url) VALUES (%s, %s)
    ON DUPLICATE KEY UPDATE url = %s
"""

# ---- Diapositiva ----

GET_DIAPOSITIVA_BY_ACTIVIDAD = (
    "SELECT * FROM ActividadDiapositiva WHERE actividad_id = %s"
)

INSERT_DIAPOSITIVA = """
    INSERT INTO ActividadDiapositiva (actividad_id, nombre_archivo, nombre_original)
    VALUES (%s, %s, %s)
"""

# ---- Evaluacion ----

GET_EVALUACION_BY_ACTIVIDAD = (
    "SELECT * FROM ActividadEvaluacion WHERE actividad_id = %s"
)

INSERT_EVALUACION = """
    INSERT INTO ActividadEvaluacion (actividad_id, tiempo_limite_min, intentos_max)
    VALUES (%s, %s, %s)
"""

UPDATE_EVALUACION = """
    UPDATE ActividadEvaluacion
    SET tiempo_limite_min = %s, intentos_max = %s
    WHERE actividad_id = %s
"""

# ---- Preguntas ----

GET_PREGUNTAS_BY_EVALUACION = (
    "SELECT * FROM Pregunta WHERE evaluacion_id = %s ORDER BY orden, id"
)

INSERT_PREGUNTA = """
    INSERT INTO Pregunta (evaluacion_id, enunciado, tipo, orden)
    VALUES (%s, %s, %s, %s)
"""

UPDATE_PREGUNTA = "UPDATE Pregunta SET enunciado = %s, orden = %s WHERE id = %s"

# ---- Opciones ----

GET_OPCIONES_BY_PREGUNTA = "SELECT * FROM OpcionPregunta WHERE pregunta_id = %s"

INSERT_OPCION = """
    INSERT INTO OpcionPregunta (pregunta_id, texto, es_correcta) VALUES (%s, %s, %s)
"""

# ---- Progreso ----

UPSERT_PROGRESO = """
    INSERT INTO ProgresoActividad (estudiante_id, actividad_id, completado, fecha_completado)
    VALUES (%s, %s, %s, NOW())
    ON DUPLICATE KEY UPDATE completado = VALUES(completado), fecha_completado = NOW()
"""

GET_PROGRESO_BY_CURSO = """
    SELECT pa.* FROM ProgresoActividad pa
    JOIN Actividad a ON pa.actividad_id = a.id
    WHERE pa.estudiante_id = %s AND a.curso_id = %s
"""

# ---- Intentos ----

GET_INTENTOS_BY_ESTUDIANTE_ACTIVIDAD = """
    SELECT * FROM IntentoEvaluacion
    WHERE estudiante_id = %s AND actividad_id = %s
    ORDER BY intento
"""

INSERT_INTENTO = """
    INSERT INTO IntentoEvaluacion
        (estudiante_id, actividad_id, puntos_obtenidos, total_preguntas, intento)
    VALUES (%s, %s, %s, %s, %s)
"""

INSERT_RESPUESTA = """
    INSERT INTO RespuestaPregunta
        (intento_id, pregunta_id, opcion_id, texto_respuesta, es_correcta)
    VALUES (%s, %s, %s, %s, %s)
"""

# ============================================================
# INTERACCION CURSO - progreso / tiempo / calificacion
# ============================================================

COUNT_ACTIVIDADES_BY_CURSO = (
    "SELECT COUNT(*) AS total FROM Actividad WHERE curso_id = %s"
)

COUNT_COMPLETADAS_BY_CURSO = """
    SELECT COUNT(*) AS completadas
    FROM ProgresoActividad pa
    JOIN Actividad a ON pa.actividad_id = a.id
    WHERE pa.estudiante_id = %s AND a.curso_id = %s AND pa.completado = 1
"""

GET_EVALUACIONES_IDS_BY_CURSO = """
    SELECT ae.actividad_id
    FROM ActividadEvaluacion ae
    JOIN Actividad a ON ae.actividad_id = a.id
    WHERE a.curso_id = %s
"""

GET_MEJOR_INTENTO = """
    SELECT MAX(puntos_obtenidos) AS mejor
    FROM IntentoEvaluacion
    WHERE estudiante_id = %s AND actividad_id = %s
"""

UPSERT_INTERACCION_INICIO = """
    INSERT INTO InteraccionCurso
        (estudiante_id, curso_id, calificacion, progreso, tiempo_visualizacion, fecha_ultima_actividad)
    VALUES (%s, %s, 0, 0, 0, NOW())
    ON DUPLICATE KEY UPDATE fecha_ultima_actividad = fecha_ultima_actividad
"""

UPDATE_INTERACCION_PROGRESO_CAL = """
    UPDATE InteraccionCurso
    SET progreso = %s, calificacion = %s, fecha_ultima_actividad = NOW()
    WHERE estudiante_id = %s AND curso_id = %s
"""

ADD_INTERACCION_TIEMPO = """
    UPDATE InteraccionCurso
    SET tiempo_visualizacion = tiempo_visualizacion + %s, fecha_ultima_actividad = NOW()
    WHERE estudiante_id = %s AND curso_id = %s
"""

GET_INTERACCION_BY_ESTUDIANTE_CURSO = """
    SELECT * FROM InteraccionCurso
    WHERE estudiante_id = %s AND curso_id = %s
"""

# ============================================================
# RECOMENDACIONES
# ============================================================

GET_ALL_CURSOS_CON_ETIQUETAS_FULL = """
    SELECT c.id, c.titulo, c.descripcion, c.categoria, c.duracion,
           GROUP_CONCAT(ce.etiqueta SEPARATOR '|||') AS etiquetas
    FROM Curso c
    LEFT JOIN CursoEtiqueta ce ON ce.curso_id = c.id
    GROUP BY c.id, c.titulo, c.descripcion, c.categoria, c.duracion
"""

GET_ALL_USERS_FOR_COLLAB = """
    SELECT e.id, e.carrera, e.edad,
           GROUP_CONCAT(DISTINCT ei.interes SEPARATOR '|||') AS intereses,
           GROUP_CONCAT(DISTINCT CASE WHEN ic.progreso > 0 THEN ic.curso_id END SEPARATOR ',') AS cursos_tomados
    FROM Estudiante e
    LEFT JOIN EstudianteInteres ei ON ei.estudiante_id = e.id
    LEFT JOIN InteraccionCurso ic ON ic.estudiante_id = e.id
    WHERE e.id != %s AND (e.rol IS NULL OR e.rol != 'Administrador')
    GROUP BY e.id, e.carrera, e.edad
"""

GET_CURSOS_EN_PROGRESO = """
    SELECT c.id, c.titulo, c.descripcion, c.categoria, c.duracion,
           ic.progreso, ic.calificacion, ic.fecha_ultima_actividad
    FROM InteraccionCurso ic
    JOIN Curso c ON ic.curso_id = c.id
    WHERE ic.estudiante_id = %s AND ic.progreso > 0
    ORDER BY ic.fecha_ultima_actividad DESC
"""

GET_CURSOS_POPULARES = """
    SELECT c.id, c.titulo, c.descripcion, c.categoria, c.duracion,
           COUNT(ic.estudiante_id) AS num_estudiantes
    FROM Curso c
    LEFT JOIN InteraccionCurso ic ON ic.curso_id = c.id
    GROUP BY c.id, c.titulo, c.descripcion, c.categoria, c.duracion
    ORDER BY num_estudiantes DESC
    LIMIT 6
"""