import os
import re
import urllib.request
import urllib.parse
import json as _json

from flask import Blueprint, jsonify, request, session
from db import execute_query, execute_command
from utils import serialize
import queries as q

MOODLE_URL = os.getenv("MOODLE_URL", "").rstrip("/")
MOODLE_TOKEN = os.getenv("MOODLE_WS_TOKEN", "")


def _moodle_ws(wsfunction, **params):
    qs = urllib.parse.urlencode({
        "wstoken": MOODLE_TOKEN,
        "wsfunction": wsfunction,
        "moodlewsrestformat": "json",
        **params,
    })
    url = f"{MOODLE_URL}/webservice/rest/server.php?{qs}"
    with urllib.request.urlopen(url, timeout=10) as resp:
        data = _json.loads(resp.read().decode())
    if isinstance(data, dict) and data.get("exception"):
        raise Exception(data.get("message", "Error Moodle WS"))
    return data


def _strip_html(text):
    return re.sub(r"<[^>]+>", " ", text or "").strip()

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
    execute_command("DELETE rp FROM RespuestaPregunta rp JOIN IntentoEvaluacion ie ON rp.intento_id = ie.id WHERE ie.estudiante_id = %s", (id,))
    execute_command("DELETE FROM IntentoEvaluacion WHERE estudiante_id = %s", (id,))
    execute_command("DELETE FROM ProgresoActividad WHERE estudiante_id = %s", (id,))
    execute_command("DELETE FROM InteraccionCurso WHERE estudiante_id = %s", (id,))
    execute_command("DELETE FROM EstudianteInteres WHERE estudiante_id = %s", (id,))
    execute_command("DELETE FROM EstudianteInsignia WHERE estudiante_id = %s", (id,))
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

@admin_bp.get("/usuarios/resumen")
def get_usuarios_resumen():
    _, err = _check_admin()
    if err:
        return err

    df = execute_query("""
        SELECT 
            e.id,
            e.nombre,
            e.email,
            e.rol,
            e.puntos,
            MAX(ic.fecha_ultima_actividad) as ultimo_acceso
        FROM Estudiante e
        LEFT JOIN InteraccionCurso ic ON ic.estudiante_id = e.id
        GROUP BY e.id
        ORDER BY e.nombre ASC
    """)
    return jsonify(serialize(df))

@admin_bp.get("/moodle/cursos")
def get_moodle_cursos():
    _, err = _check_admin()
    if err:
        return err
    if not MOODLE_TOKEN:
        return jsonify({"error": "MOODLE_WS_TOKEN no configurado en .env"}), 503
    try:
        cursos_moodle = _moodle_ws("core_course_get_courses")
        resultado = []
        for c in cursos_moodle:
            if c.get("id") == 1:  # curso raiz del sitio
                continue
            resultado.append({
                "moodle_id": c["id"],
                "titulo": c.get("fullname", ""),
                "descripcion": _strip_html(c.get("summary", "")),
                "categoria": c.get("categoryname", ""),
            })
        return jsonify(resultado)
    except Exception as e:
        return jsonify({"error": str(e)}), 502


@admin_bp.post("/moodle/importar")
def importar_moodle_cursos():
    _, err = _check_admin()
    if err:
        return err
    data = request.get_json()
    cursos = data.get("cursos", [])
    if not cursos:
        return jsonify({"error": "No se enviaron cursos"}), 400
    importados = 0
    for c in cursos:
        titulo = (c.get("titulo") or "").strip()
        if not titulo:
            continue
        execute_command(
            "INSERT INTO Curso (titulo, descripcion, categoria, duracion) VALUES (%s, %s, %s, %s)",
            (titulo, c.get("descripcion") or None, c.get("categoria") or None, None),
        )
        importados += 1
    return jsonify({"importados": importados}), 201


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

@admin_bp.get("/metricas")
def get_metricas():
    _, err = _check_admin()
    if err:
        return err

    # Tasa de completacion por curso
    completacion = serialize(execute_query("""
        SELECT c.titulo,
               COUNT(*) AS total_usuarios,
               SUM(CASE WHEN ic.progreso = 100 THEN 1 ELSE 0 END) AS completados,
               SUM(CASE WHEN ic.progreso > 0 AND ic.progreso < 100 THEN 1 ELSE 0 END) AS en_progreso,
               ROUND(AVG(ic.progreso), 1) AS progreso_promedio,
               ROUND(AVG(ic.tiempo_visualizacion), 0) AS tiempo_promedio_min
        FROM InteraccionCurso ic
        JOIN Curso c ON c.id = ic.curso_id
        GROUP BY ic.curso_id, c.titulo
        ORDER BY completados DESC
    """))

    # Cursos abandonados (progreso > 0 < 100, sin actividad en 14 dias)
    abandonados = serialize(execute_query("""
        SELECT c.titulo, COUNT(*) AS usuarios_abandonaron
        FROM InteraccionCurso ic
        JOIN Curso c ON c.id = ic.curso_id
        WHERE ic.progreso > 0 AND ic.progreso < 100
          AND (ic.fecha_ultima_actividad IS NULL
               OR ic.fecha_ultima_actividad < DATE_SUB(NOW(), INTERVAL 14 DAY))
        GROUP BY ic.curso_id, c.titulo
        ORDER BY usuarios_abandonaron DESC
    """))

    # Retencion: usuarios activos en ultimos 7 / 30 dias
    retencion = serialize(execute_query("""
        SELECT
            COUNT(DISTINCT CASE WHEN fecha_ultima_actividad >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                                THEN estudiante_id END) AS activos_7d,
            COUNT(DISTINCT CASE WHEN fecha_ultima_actividad >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                                THEN estudiante_id END) AS activos_30d,
            COUNT(DISTINCT estudiante_id) AS total_con_actividad
        FROM InteraccionCurso
    """))

    # Cursos por usuario (promedio y distribucion)
    cursos_por_usuario = serialize(execute_query("""
        SELECT e.nombre, COUNT(DISTINCT ic.curso_id) AS cursos_iniciados,
               SUM(CASE WHEN ic.progreso = 100 THEN 1 ELSE 0 END) AS cursos_completados
        FROM Estudiante e
        LEFT JOIN InteraccionCurso ic ON ic.estudiante_id = e.id AND ic.progreso > 0
        GROUP BY e.id, e.nombre
        ORDER BY cursos_iniciados DESC
    """))

    # Match interes-accion: intereses declarados vs categorias tomadas
    match_interes = serialize(execute_query("""
        SELECT ei.interes,
               COUNT(DISTINCT ic.curso_id) AS cursos_tomados_con_etiqueta
        FROM EstudianteInteres ei
        LEFT JOIN CursoEtiqueta ce ON ce.etiqueta = ei.interes
        LEFT JOIN InteraccionCurso ic ON ic.curso_id = ce.curso_id
                                      AND ic.estudiante_id = ei.estudiante_id
                                      AND ic.progreso > 0
        GROUP BY ei.interes
        ORDER BY cursos_tomados_con_etiqueta DESC
    """))

    # Resumen global
    resumen = serialize(execute_query("""
        SELECT
            (SELECT COUNT(*) FROM Estudiante) AS total_usuarios,
            (SELECT COUNT(*) FROM Curso) AS total_cursos,
            (SELECT COUNT(*) FROM InteraccionCurso WHERE progreso > 0) AS interacciones_activas,
            (SELECT COUNT(*) FROM InteraccionCurso WHERE progreso = 100) AS completaciones,
            ROUND((SELECT COUNT(*) FROM InteraccionCurso WHERE progreso = 100) * 100.0 /
                  NULLIF((SELECT COUNT(*) FROM InteraccionCurso WHERE progreso > 0), 0), 1) AS tasa_completacion
    """))

    return jsonify({
        "resumen": resumen[0] if resumen else {},
        "completacion_por_curso": completacion,
        "abandonados": abandonados,
        "retencion": retencion[0] if retencion else {},
        "cursos_por_usuario": cursos_por_usuario,
        "match_interes": match_interes,
    })


@admin_bp.get("/db/tablas")
def get_tablas():
    _, err = _check_admin()
    if err:
        return err
    df = execute_query("SHOW TABLES")
    tablas = [list(row.values())[0] for row in serialize(df)]
    return jsonify(tablas)


@admin_bp.get("/db/tablas/<tabla>")
def get_tabla_datos(tabla):
    _, err = _check_admin()
    if err:
        return err
    # Validar que la tabla existe para evitar SQL injection
    df_tablas = execute_query("SHOW TABLES")
    tablas_validas = [list(row.values())[0] for row in serialize(df_tablas)]
    if tabla not in tablas_validas:
        return jsonify({"error": "Tabla no encontrada"}), 404
    page = int(request.args.get("page", 1))
    per_page = 10
    offset = (page - 1) * per_page
    total_df = execute_query(f"SELECT COUNT(*) as total FROM `{tabla}`")
    total = serialize(total_df)[0]["total"]
    df = execute_query(f"SELECT * FROM `{tabla}` LIMIT %s OFFSET %s", (per_page, offset))
    return jsonify({"total": total, "page": page, "per_page": per_page, "filas": serialize(df)})


@admin_bp.get("/gamificacion")
def get_gamificacion_global():
    _, err = _check_admin()
    if err:
        return err

    df = execute_query("""
        SELECT e.id, e.nombre, e.email, e.puntos, e.nivel, e.rol,
               COUNT(i.insignia) as total_insignias,
               GROUP_CONCAT(i.insignia SEPARATOR ',') as insignias
        FROM Estudiante e
        LEFT JOIN EstudianteInsignia i ON i.estudiante_id = e.id
        GROUP BY e.id
        ORDER BY e.puntos DESC
    """)
    return jsonify(serialize(df))