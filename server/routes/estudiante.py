from flask import Blueprint, jsonify, request
from db import execute_query, execute_command
from utils import serialize
import queries as q

estudiante_bp = Blueprint("estudiante", __name__, url_prefix="/api/estudiantes")


# ============================================================
# CRUD Estudiante
# ============================================================

@estudiante_bp.get("/")
def get_all():
    df = execute_query(q.GET_ALL_ESTUDIANTES)
    return jsonify(serialize(df))


@estudiante_bp.get("/<int:id>")
def get_one(id):
    df = execute_query(q.GET_ESTUDIANTE_BY_ID, (id,))
    if df.is_empty():
        return jsonify({"error": "Estudiante no encontrado"}), 404
    return jsonify(serialize(df)[0])


@estudiante_bp.post("/")
def create():
    data = request.get_json()
    result = execute_command(
        q.INSERT_ESTUDIANTE,
        (
            data["nombre"],
            data.get("email"),
            data.get("moodle_id"),
            data.get("edad"),
            data.get("carrera"),
            data.get("puntos", 0),
            data.get("nivel", 1),
        ),
    )
    return jsonify({"id": result["last_insert_id"], "message": "Estudiante creado"}), 201


@estudiante_bp.put("/<int:id>")
def update(id):
    data = request.get_json()
    result = execute_command(
        q.UPDATE_ESTUDIANTE,
        (
            data["nombre"],
            data.get("email"),
            data.get("edad"),
            data.get("carrera"),
            data.get("puntos", 0),
            data.get("nivel", 1),
            id,
        ),
    )
    if result["affected_rows"] == 0:
        return jsonify({"error": "Estudiante no encontrado"}), 404
    return jsonify({"message": "Estudiante actualizado"})


@estudiante_bp.delete("/<int:id>")
def delete(id):
    result = execute_command(q.DELETE_ESTUDIANTE, (id,))
    if result["affected_rows"] == 0:
        return jsonify({"error": "Estudiante no encontrado"}), 404
    return jsonify({"message": "Estudiante eliminado"})


# ============================================================
# Intereses
# ============================================================

@estudiante_bp.get("/<int:id>/intereses")
def get_intereses(id):
    df = execute_query(q.GET_INTERESES_BY_ESTUDIANTE, (id,))
    return jsonify(serialize(df))


@estudiante_bp.post("/<int:id>/intereses")
def add_interes(id):
    data = request.get_json()
    execute_command(q.INSERT_INTERES, (id, data["interes"]))
    return jsonify({"message": "Interes agregado"}), 201


@estudiante_bp.delete("/<int:id>/intereses/<string:interes>")
def remove_interes(id, interes):
    result = execute_command(q.DELETE_INTERES, (id, interes))
    if result["affected_rows"] == 0:
        return jsonify({"error": "Interes no encontrado"}), 404
    return jsonify({"message": "Interes eliminado"})


# ============================================================
# Insignias
# ============================================================

@estudiante_bp.get("/<int:id>/insignias")
def get_insignias(id):
    df = execute_query(q.GET_INSIGNIAS_BY_ESTUDIANTE, (id,))
    return jsonify(serialize(df))


@estudiante_bp.post("/<int:id>/insignias")
def add_insignia(id):
    data = request.get_json()
    execute_command(q.INSERT_INSIGNIA, (id, data["insignia"]))
    return jsonify({"message": "Insignia agregada"}), 201


@estudiante_bp.delete("/<int:id>/insignias/<string:insignia>")
def remove_insignia(id, insignia):
    result = execute_command(q.DELETE_INSIGNIA, (id, insignia))
    if result["affected_rows"] == 0:
        return jsonify({"error": "Insignia no encontrada"}), 404
    return jsonify({"message": "Insignia eliminada"})
