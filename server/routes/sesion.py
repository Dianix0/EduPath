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


@sesion_bp.delete("/me/intereses/<string:interes>")
def remove_mi_interes(interes):
    estudiante_id = session.get("estudiante_id")
    if not estudiante_id:
        return jsonify({"error": "No hay sesion activa"}), 401

    result = execute_command(q.DELETE_INTERES, (estudiante_id, interes))
    if result["affected_rows"] == 0:
        return jsonify({"error": "Interes no encontrado"}), 404
    return jsonify({"message": "Interes eliminado"})
