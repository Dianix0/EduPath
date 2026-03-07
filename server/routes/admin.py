from flask import Blueprint, jsonify, request, session
from db import execute_query, execute_command
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
# Carreras
# ============================================================

@admin_bp.get("/carreras")
def get_carreras():
    _, err = _check_admin()
    if err:
        return err
    df = execute_query(q.GET_ALL_CARRERAS)
    return jsonify(serialize(df))


@admin_bp.post("/carreras")
def create_carrera():
    _, err = _check_admin()
    if err:
        return err
    data = request.get_json()
    nombre = (data.get("nombre") or "").strip()
    if not nombre:
        return jsonify({"error": "El nombre es requerido"}), 400
    result = execute_command(q.INSERT_CARRERA, (nombre,))
    return jsonify({"id": result["last_insert_id"], "nombre": nombre}), 201


@admin_bp.delete("/carreras/<int:id>")
def delete_carrera(id):
    _, err = _check_admin()
    if err:
        return err
    result = execute_command(q.DELETE_CARRERA, (id,))
    if result["affected_rows"] == 0:
        return jsonify({"error": "Carrera no encontrada"}), 404
    return jsonify({"message": "Carrera eliminada"})


# ============================================================
# Usuarios
# ============================================================

@admin_bp.delete("/usuarios/<int:id>")
def delete_usuario(id):
    _, err = _check_admin()
    if err:
        return err
    execute_command("DELETE FROM EstudianteInteres WHERE estudiante_id = %s", (id,))
    execute_command("DELETE FROM EstudianteInsignia WHERE estudiante_id = %s", (id,))
    execute_command("DELETE FROM InteraccionCurso WHERE estudiante_id = %s", (id,))
    result = execute_command(q.DELETE_ESTUDIANTE, (id,))
    if result["affected_rows"] == 0:
        return jsonify({"error": "Usuario no encontrado"}), 404
    return jsonify({"message": "Usuario eliminado"})


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
