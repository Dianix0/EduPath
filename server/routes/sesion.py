from flask import Blueprint, jsonify, request, session
from db import execute_query, execute_command
from utils import serialize
import queries as q

sesion_bp = Blueprint("sesion", __name__, url_prefix="/api")


@sesion_bp.get("/carreras")
def get_carreras():
    df = execute_query(q.GET_ALL_CARRERAS)
    return jsonify(serialize(df))


@sesion_bp.get("/me")
def get_me():
    estudiante_id = session.get("estudiante_id")
    if not estudiante_id:
        return jsonify({"error": "No hay sesion activa"}), 401

    df = execute_query(q.GET_ESTUDIANTE_BY_ID, (estudiante_id,))
    if df.is_empty():
        return jsonify({"error": "Estudiante no encontrado"}), 404

    return jsonify(serialize(df)[0])


@sesion_bp.put("/me/completar")
def completar_perfil():
    estudiante_id = session.get("estudiante_id")
    if not estudiante_id:
        return jsonify({"error": "No hay sesion activa"}), 401

    data = request.get_json()
    execute_command(
        q.UPDATE_ESTUDIANTE_COMPLETAR,
        (data.get("edad"), data.get("carrera"), estudiante_id),
    )
    df = execute_query(q.GET_ESTUDIANTE_BY_ID, (estudiante_id,))
    return jsonify(serialize(df)[0])


@sesion_bp.put("/me/configuracion")
def actualizar_configuracion():
    estudiante_id = session.get("estudiante_id")
    if not estudiante_id:
        return jsonify({"error": "No hay sesion activa"}), 401

    data = request.get_json()
    execute_command(
        q.UPDATE_ESTUDIANTE_CONFIGURACION,
        (data.get("email"), data.get("edad"), data.get("carrera"), estudiante_id),
    )
    df = execute_query(q.GET_ESTUDIANTE_BY_ID, (estudiante_id,))
    return jsonify(serialize(df)[0])


@sesion_bp.get("/me/intereses")
def get_mis_intereses():
    estudiante_id = session.get("estudiante_id")
    if not estudiante_id:
        return jsonify({"error": "No hay sesion activa"}), 401

    df = execute_query(q.GET_INTERESES_BY_ESTUDIANTE, (estudiante_id,))
    return jsonify(serialize(df))


@sesion_bp.post("/me/intereses")
def add_mi_interes():
    estudiante_id = session.get("estudiante_id")
    if not estudiante_id:
        return jsonify({"error": "No hay sesion activa"}), 401

    data = request.get_json()
    execute_command(q.INSERT_INTERES, (estudiante_id, data["interes"]))
    return jsonify({"message": "Interes agregado"}), 201


@sesion_bp.get("/me/interacciones")
def get_mis_interacciones():
    estudiante_id = session.get("estudiante_id")
    if not estudiante_id:
        return jsonify({"error": "No hay sesion activa"}), 401
    df = execute_query(q.GET_INTERACCIONES_BY_ESTUDIANTE, (estudiante_id,))
    return jsonify(serialize(df))


@sesion_bp.get("/me/mis-cursos")
def get_mis_cursos():
    estudiante_id = session.get("estudiante_id")
    if not estudiante_id:
        return jsonify({"error": "No hay sesion activa"}), 401
    df = execute_query(q.GET_CURSOS_EN_PROGRESO, (estudiante_id,))
    return jsonify(serialize(df))


@sesion_bp.delete("/me/intereses/<string:interes>")
def remove_mi_interes(interes):
    estudiante_id = session.get("estudiante_id")
    if not estudiante_id:
        return jsonify({"error": "No hay sesion activa"}), 401

    result = execute_command(q.DELETE_INTERES, (estudiante_id, interes))
    if result["affected_rows"] == 0:
        return jsonify({"error": "Interes no encontrado"}), 404
    return jsonify({"message": "Interes eliminado"})

@sesion_bp.post("/me/set-session")
def set_session():
    data = request.get_json()
    estudiante_id = data.get("estudiante_id")
    if not estudiante_id:
        return jsonify({"error": "Falta estudiante_id"}), 400
    df = execute_query(q.GET_ESTUDIANTE_BY_ID, (estudiante_id,))
    if df.is_empty():
        return jsonify({"error": "Estudiante no encontrado"}), 404
    session["estudiante_id"] = estudiante_id
    return jsonify(serialize(df)[0])

@sesion_bp.get("/me/gamificacion")
def get_mi_gamificacion():
    estudiante_id = session.get("estudiante_id")
    if not estudiante_id:
        return jsonify({"error": "No hay sesion activa"}), 401
    df = execute_query(q.GET_ESTUDIANTE_BY_ID, (estudiante_id,))
    if df.is_empty():
        return jsonify({"error": "Estudiante no encontrado"}), 404
    estudiante = serialize(df)[0]
    puntos = estudiante["puntos"]

    # Calcular nivel
    NIVELES = [
        (0,   1, "Principiante"),
        (100, 2, "Explorador"),
        (250, 3, "Aprendiz"),
        (500, 4, "Avanzado"),
        (800, 5, "Experto"),
    ]
    nivel_actual = NIVELES[0]
    for umbral, nivel, nombre in NIVELES:
        if puntos >= umbral:
            nivel_actual = (umbral, nivel, nombre)
    idx = nivel_actual[1] - 1
    puntos_siguiente = NIVELES[idx + 1][0] if idx + 1 < len(NIVELES) else None

    # Insignias
    df_insignias = execute_query(q.GET_INSIGNIAS_BY_ESTUDIANTE, (estudiante_id,))
    insignias = [r["insignia"] for r in serialize(df_insignias)]

    # Cursos
    df_interacciones = execute_query(q.GET_INTERACCIONES_BY_ESTUDIANTE, (estudiante_id,))
    interacciones = serialize(df_interacciones)
    cursos_completados = len([i for i in interacciones if i["progreso"] >= 1.0])
    cursos_en_progreso = len([i for i in interacciones if i["progreso"] < 1.0])

    return jsonify({
        "puntos": puntos,
        "nivel": nivel_actual[1],
        "nombre_nivel": nivel_actual[2],
        "puntos_siguiente_nivel": puntos_siguiente,
        "insignias": insignias,
        "cursos_completados": cursos_completados,
        "cursos_en_progreso": cursos_en_progreso,
        "config": {
            "niveles": [
                {"nivel": n, "nombre": nombre, "min": umbral}
                for umbral, n, nombre in [
                    (0,   1, "Principiante"),
                    (100, 2, "Explorador"),
                    (250, 3, "Aprendiz"),
                    (500, 4, "Avanzado"),
                    (800, 5, "Experto"),
                ]
            ],
            "insignias_info": {
                "primer_curso":   {"nombre": "Primer Curso",    "desc": "Completaste tu primer curso"},
                "tres_cursos":    {"nombre": "Tres Cursos",     "desc": "Completaste 3 cursos"},
                "perfeccionista": {"nombre": "Perfeccionista",  "desc": "Calificación excelente (≥4.8)"},
                "explorador_bd":  {"nombre": "Explorador BD",   "desc": "Completaste 2 cursos de Bases de Datos"},
                "experto":        {"nombre": "Experto",         "desc": "Alcanzaste el nivel máximo"},
            }
        }
    })