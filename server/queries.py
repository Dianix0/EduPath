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
