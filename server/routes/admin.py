from flask import Blueprint, jsonify, session
from db import execute_query
from utils import serialize
import queries as q

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def _check_admin():
    """Verifica que haya sesion activa y que el usuario sea Administrador.
    Retorna (estudiante_dict, None) si ok, o (None, response_error) si no."""
    estudiante_id = session.get("estudiante_id")
    if not estudiante_id:
        return None, (jsonify({"error": "No hay sesion activa"}), 401)
    df = execute_query(q.GET_ESTUDIANTE_BY_ID, (estudiante_id,))
    if df.is_empty():
        return None, (jsonify({"error": "Usuario no encontrado"}), 404)
    est = serialize(df)[0]
    if est.get("rol") != "Administrador":
        return None, (jsonify({"error": "Acceso denegado"}), 403)
    return est, None


# ============================================================
# Usuarios
# ============================================================

@admin_bp.get("/usuarios")
def get_usuarios():
    _, err = _check_admin()
    if err:
        return err
    df = execute_query(q.GET_ALL_ESTUDIANTES)
    return jsonify(serialize(df))


@admin_bp.get("/usuarios/<int:id>/detalle")
def get_usuario_detalle(id):
    _, err = _check_admin()
    if err:
        return err

    df = execute_query(q.GET_ESTUDIANTE_BY_ID, (id,))
    if df.is_empty():
        return jsonify({"error": "Estudiante no encontrado"}), 404

    estudiante = serialize(df)[0]
    estudiante["intereses"] = serialize(execute_query(q.GET_INTERESES_BY_ESTUDIANTE, (id,)))
    estudiante["interacciones"] = serialize(execute_query(q.GET_INTERACCIONES_CON_TITULO, (id,)))

    return jsonify(estudiante)
