"""
moodle_service.py
Servicio Flask que actúa como proxy entre Edupath y la API REST de Moodle.
Expone endpoints limpios que el frontend React puede consumir directamente.
"""

import os
import requests
from flask import Flask, jsonify, request
from flask_cors import CORS
from functools import wraps
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Permite llamadas desde el frontend React/Vite

# ─── CONFIGURACIÓN ────────────────────────────────────────────────────────────
# Puedes mover estos valores a variables de entorno o a un archivo .env

MOODLE_URL   = os.getenv("MOODLE_URL",   "http://192.168.1.122/moodle")
MOODLE_TOKEN = os.getenv("MOODLE_TOKEN", "TU_TOKEN_AQUI")

# Token interno para proteger los endpoints de Edupath (opcional pero recomendado)
EDUPATH_API_KEY = os.getenv("EDUPATH_API_KEY", "edupath_internal_key_2026")


# ─── HELPERS ──────────────────────────────────────────────────────────────────

def moodle_call(function: str, params: dict = None) -> dict | list:
    """Realiza una llamada a la API REST de Moodle y devuelve el resultado."""
    payload = {
        "wstoken":             MOODLE_TOKEN,
        "wsfunction":          function,
        "moodlewsrestformat":  "json",
        **(params or {})
    }
    try:
        response = requests.post(
            f"{MOODLE_URL}/webservice/rest/server.php",
            data=payload,
            timeout=15
        )
        response.raise_for_status()
        data = response.json()

        # Moodle devuelve un dict con "exception" si hay error
        if isinstance(data, dict) and "exception" in data:
            raise Exception(f"Moodle error: {data.get('message', data)}")

        return data
    except requests.exceptions.RequestException as e:
        raise Exception(f"Error de conexión con Moodle: {str(e)}")


def require_api_key(f):
    """Decorador opcional: protege los endpoints con una API key interna."""
    @wraps(f)
    def decorated(*args, **kwargs):
        key = request.headers.get("X-Edupath-Key")
        if key != EDUPATH_API_KEY:
            return jsonify({"error": "No autorizado"}), 401
        return f(*args, **kwargs)
    return decorated


def paginate_moodle(function: str, extra_params: dict = None, page_size: int = 200) -> list:
    """Obtiene TODOS los registros de Moodle paginando automáticamente."""
    all_records = []
    offset = 0
    while True:
        params = {"limit": page_size, "offset": offset, **(extra_params or {})}
        batch = moodle_call(function, params)
        if not batch:
            break
        all_records.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size
    return all_records


# ─── ENDPOINTS ────────────────────────────────────────────────────────────────

@app.route("/api/moodle/health", methods=["GET"])
def health():
    """Verifica la conexión con Moodle."""
    try:
        info = moodle_call("core_webservice_get_site_info")
        return jsonify({
            "status":   "ok",
            "moodle":   info.get("sitename"),
            "version":  info.get("release"),
            "url":      MOODLE_URL
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 503


@app.route("/api/moodle/cursos", methods=["GET"])
def get_cursos():
    """
    Devuelve todos los cursos de Moodle.
    Query params opcionales:
      - since: timestamp Unix (solo cursos modificados después de esta fecha)
    """
    try:
        since = request.args.get("since", 0, type=int)
        cursos = paginate_moodle("local_edupath_get_courses", {"since": since})
        return jsonify({"total": len(cursos), "cursos": cursos})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/moodle/usuarios", methods=["GET"])
def get_usuarios():
    """
    Devuelve todos los usuarios registrados en Moodle.
    Query params opcionales:
      - since: timestamp Unix
    """
    try:
        since = request.args.get("since", 0, type=int)
        usuarios = paginate_moodle("local_edupath_get_users", {"since": since})
        return jsonify({"total": len(usuarios), "usuarios": usuarios})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/moodle/matriculas", methods=["GET"])
def get_matriculas():
    """
    Devuelve matrículas.
    Query params opcionales:
      - courseid: filtrar por curso
      - userid:   filtrar por usuario
      - since:    timestamp
    """
    try:
        params = {}
        if request.args.get("courseid"): params["courseid"] = int(request.args["courseid"])
        if request.args.get("userid"):   params["userid"]   = int(request.args["userid"])
        if request.args.get("since"):    params["since"]    = int(request.args["since"])

        matriculas = paginate_moodle("local_edupath_get_enrollments", params, page_size=500)
        return jsonify({"total": len(matriculas), "matriculas": matriculas})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/moodle/progreso", methods=["GET"])
def get_progreso():
    """
    Devuelve el progreso de usuarios en cursos.
    Query params opcionales:
      - courseid: filtrar por curso
      - userid:   filtrar por usuario
    """
    try:
        params = {}
        if request.args.get("courseid"): params["courseid"] = int(request.args["courseid"])
        if request.args.get("userid"):   params["userid"]   = int(request.args["userid"])
        # print(f"DEBUG progreso params: {params}")

        progreso = paginate_moodle("local_edupath_get_progress", params, page_size=500)
        return jsonify({"total": len(progreso), "progreso": progreso})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/moodle/calificaciones", methods=["GET"])
def get_calificaciones():
    """
    Devuelve calificaciones.
    Query params opcionales:
      - courseid, userid, since
    """
    try:
        params = {}
        if request.args.get("courseid"): params["courseid"] = int(request.args["courseid"])
        if request.args.get("userid"):   params["userid"]   = int(request.args["userid"])
        if request.args.get("since"):    params["since"]    = int(request.args["since"])

        calificaciones = paginate_moodle("local_edupath_get_grades", params, page_size=500)
        return jsonify({"total": len(calificaciones), "calificaciones": calificaciones})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/moodle/actividad", methods=["GET"])
def get_actividad():
    """
    Devuelve logs de actividad.
    Query params opcionales:
      - courseid, userid, since, eventname
    """
    try:
        params = {}
        if request.args.get("courseid"):  params["courseid"]  = int(request.args["courseid"])
        if request.args.get("userid"):    params["userid"]    = int(request.args["userid"])
        if request.args.get("since"):     params["since"]     = int(request.args["since"])
        if request.args.get("eventname"): params["eventname"] = request.args["eventname"]

        actividad = paginate_moodle("local_edupath_get_activity", params, page_size=1000)
        return jsonify({"total": len(actividad), "actividad": actividad})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/moodle/dashboard", methods=["GET"])
def get_dashboard():
    """
    Endpoint combinado: devuelve un resumen ejecutivo con métricas clave.
    Ideal para el dashboard principal de Edupath.
    """
    try:
        usuarios     = paginate_moodle("local_edupath_get_users")
        cursos       = paginate_moodle("local_edupath_get_courses")
        matriculas   = paginate_moodle("local_edupath_get_enrollments", page_size=500)
        progreso     = paginate_moodle("local_edupath_get_progress", page_size=500)

        # Calcular métricas
        total_usuarios   = len(usuarios)
        total_cursos     = len(cursos)
        total_matriculas = len(matriculas)

        completados = [p for p in progreso if p.get("completed")]
        en_progreso = [p for p in progreso if not p.get("completed") and p.get("percent", 0) > 0]

        promedio_progreso = (
            sum(p.get("percent", 0) for p in progreso) / len(progreso)
            if progreso else 0
        )

        # Progreso por curso
        progreso_por_curso = {}
        for p in progreso:
            cid = p["course_id"]
            if cid not in progreso_por_curso:
                progreso_por_curso[cid] = {
                    "course_id":    cid,
                    "coursename":   p.get("courseshortname", ""),
                    "total":        0,
                    "completados":  0,
                    "promedio":     0,
                    "suma":         0,
                }
            progreso_por_curso[cid]["total"] += 1
            progreso_por_curso[cid]["suma"]  += p.get("percent", 0)
            if p.get("completed"):
                progreso_por_curso[cid]["completados"] += 1

        for c in progreso_por_curso.values():
            c["promedio"] = round(c["suma"] / c["total"], 1) if c["total"] > 0 else 0
            del c["suma"]

        return jsonify({
            "resumen": {
                "total_usuarios":      total_usuarios,
                "total_cursos":        total_cursos,
                "total_matriculas":    total_matriculas,
                "cursos_completados":  len(completados),
                "cursos_en_progreso":  len(en_progreso),
                "promedio_progreso":   round(promedio_progreso, 1),
            },
            "progreso_por_curso": list(progreso_por_curso.values()),
            "usuarios_recientes": usuarios[:10],
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── WEBHOOK RECEIVER ─────────────────────────────────────────────────────────

@app.route("/webhooks/moodle", methods=["POST"])
def webhook_moodle():
    """
    Recibe eventos en tiempo real desde el plugin local_edupath.
    Verifica la firma HMAC-SHA256 antes de procesar.
    """
    import hmac, hashlib

    WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "edupath_secret_2026").encode()

    # Verificar firma
    signature = request.headers.get("X-Edupath-Signature", "")
    body      = request.get_data()
    expected  = "sha256=" + hmac.new(WEBHOOK_SECRET, body, hashlib.sha256).hexdigest()

    if not hmac.compare_digest(expected, signature):
        return jsonify({"error": "Firma inválida"}), 401

    event = request.get_json()
    event_name = event.get("event")

    # Aquí puedes manejar cada evento según tu lógica de negocio
    handlers = {
        "course_completed":               handle_course_completed,
        "user_graded":                    handle_user_graded,
        "user_enrolment_created":         handle_enrollment,
        "course_module_completion_updated": handle_module_completed,
        "user_loggedin":                  handle_login,
    }

    handler = handlers.get(event_name)
    if handler:
        handler(event)

    return jsonify({"status": "ok", "event": event_name}), 200


def handle_course_completed(event):
    """Lógica cuando un usuario completa un curso."""
    print(f"[EVENTO] Curso completado - usuario {event['userid']} en curso {event['courseid']}")
    # Aquí: actualizar tu BD de Edupath, enviar certificado, notificar, etc.


def handle_user_graded(event):
    """Lógica cuando se registra una calificación."""
    print(f"[EVENTO] Calificación registrada - usuario {event['userid']}")


def handle_enrollment(event):
    """Lógica cuando un usuario se matricula."""
    print(f"[EVENTO] Nueva matrícula - usuario {event['userid']} en curso {event['courseid']}")


def handle_module_completed(event):
    """Lógica cuando un usuario completa una actividad."""
    print(f"[EVENTO] Actividad completada - usuario {event['userid']}")


def handle_login(event):
    """Lógica cuando un usuario inicia sesión."""
    print(f"[EVENTO] Login - usuario {event['userid']} a las {datetime.fromtimestamp(event['timecreated'])}")


# ─── INICIO ───────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print(f"🚀 Edupath-Moodle Service iniciando...")
    print(f"   Moodle URL: {MOODLE_URL}")
    print(f"   Endpoints disponibles:")
    print(f"     GET  /api/moodle/health")
    print(f"     GET  /api/moodle/dashboard")
    print(f"     GET  /api/moodle/cursos")
    print(f"     GET  /api/moodle/usuarios")
    print(f"     GET  /api/moodle/matriculas")
    print(f"     GET  /api/moodle/progreso")
    print(f"     GET  /api/moodle/calificaciones")
    print(f"     GET  /api/moodle/actividad")
    print(f"     POST /webhooks/moodle")
    app.run(host="0.0.0.0", port=5050, debug=True)
