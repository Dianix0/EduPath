from flask import Blueprint, jsonify, request
from db import execute_query, execute_command
from utils import serialize
import queries as q

interaccion_bp = Blueprint("interaccion", __name__, url_prefix="/api/interacciones")


# ============================================================
# CRUD InteraccionCurso
# ============================================================

@interaccion_bp.get("/")
def get_all():
    df = execute_query(q.GET_ALL_INTERACCIONES)
    return jsonify(serialize(df))


@interaccion_bp.get("/<int:estudiante_id>/<int:curso_id>")
def get_one(estudiante_id, curso_id):
    df = execute_query(q.GET_INTERACCION_BY_IDS, (estudiante_id, curso_id))
    if df.is_empty():
        return jsonify({"error": "Interaccion no encontrada"}), 404
    return jsonify(serialize(df)[0])


@interaccion_bp.get("/estudiante/<int:estudiante_id>")
def get_by_estudiante(estudiante_id):
    df = execute_query(q.GET_INTERACCIONES_BY_ESTUDIANTE, (estudiante_id,))
    return jsonify(serialize(df))


@interaccion_bp.get("/curso/<int:curso_id>")
def get_by_curso(curso_id):
    df = execute_query(q.GET_INTERACCIONES_BY_CURSO, (curso_id,))
    return jsonify(serialize(df))


@interaccion_bp.post("/")
def create():
    data = request.get_json()
    execute_command(
        q.INSERT_INTERACCION,
        (
            data["estudiante_id"],
            data["curso_id"],
            data.get("calificacion"),
            data.get("progreso"),
            data.get("tiempo_visualizacion"),
            data.get("fecha_ultima_actividad"),
        ),
    )
    return jsonify({"message": "Interaccion creada"}), 201


@interaccion_bp.put("/<int:estudiante_id>/<int:curso_id>")
def update(estudiante_id, curso_id):
    data = request.get_json()
    result = execute_command(
        q.UPDATE_INTERACCION,
        (
            data.get("calificacion"),
            data.get("progreso"),
            data.get("tiempo_visualizacion"),
            data.get("fecha_ultima_actividad"),
            estudiante_id,
            curso_id,
        ),
    )
    if result["affected_rows"] == 0:
        return jsonify({"error": "Interaccion no encontrada"}), 404
    return jsonify({"message": "Interaccion actualizada"})


@interaccion_bp.delete("/<int:estudiante_id>/<int:curso_id>")
def delete(estudiante_id, curso_id):
    result = execute_command(q.DELETE_INTERACCION, (estudiante_id, curso_id))
    if result["affected_rows"] == 0:
        return jsonify({"error": "Interaccion no encontrada"}), 404
    return jsonify({"message": "Interaccion eliminada"})
