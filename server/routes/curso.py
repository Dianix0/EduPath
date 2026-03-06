from flask import Blueprint, jsonify, request
from db import execute_query, execute_command
from utils import serialize
import queries as q

curso_bp = Blueprint("curso", __name__, url_prefix="/api/cursos")


# ============================================================
# CRUD Curso
# ============================================================

@curso_bp.get("/")
def get_all():
    df = execute_query(q.GET_ALL_CURSOS)
    return jsonify(serialize(df))


@curso_bp.get("/<int:id>")
def get_one(id):
    df = execute_query(q.GET_CURSO_BY_ID, (id,))
    if df.is_empty():
        return jsonify({"error": "Curso no encontrado"}), 404
    return jsonify(serialize(df)[0])


@curso_bp.post("/")
def create():
    data = request.get_json()
    result = execute_command(
        q.INSERT_CURSO,
        (
            data["titulo"],
            data.get("descripcion"),
            data.get("categoria"),
            data.get("duracion"),
        ),
    )
    return jsonify({"id": result["last_insert_id"], "message": "Curso creado"}), 201


@curso_bp.put("/<int:id>")
def update(id):
    data = request.get_json()
    result = execute_command(
        q.UPDATE_CURSO,
        (
            data["titulo"],
            data.get("descripcion"),
            data.get("categoria"),
            data.get("duracion"),
            id,
        ),
    )
    if result["affected_rows"] == 0:
        return jsonify({"error": "Curso no encontrado"}), 404
    return jsonify({"message": "Curso actualizado"})


@curso_bp.delete("/<int:id>")
def delete(id):
    result = execute_command(q.DELETE_CURSO, (id,))
    if result["affected_rows"] == 0:
        return jsonify({"error": "Curso no encontrado"}), 404
    return jsonify({"message": "Curso eliminado"})


# ============================================================
# Etiquetas
# ============================================================

@curso_bp.get("/<int:id>/etiquetas")
def get_etiquetas(id):
    df = execute_query(q.GET_ETIQUETAS_BY_CURSO, (id,))
    return jsonify(serialize(df))


@curso_bp.post("/<int:id>/etiquetas")
def add_etiqueta(id):
    data = request.get_json()
    execute_command(q.INSERT_ETIQUETA, (id, data["etiqueta"]))
    return jsonify({"message": "Etiqueta agregada"}), 201


@curso_bp.delete("/<int:id>/etiquetas/<string:etiqueta>")
def remove_etiqueta(id, etiqueta):
    result = execute_command(q.DELETE_ETIQUETA, (id, etiqueta))
    if result["affected_rows"] == 0:
        return jsonify({"error": "Etiqueta no encontrada"}), 404
    return jsonify({"message": "Etiqueta eliminada"})
