import os
import hmac
import hashlib
import requests
from flask import Blueprint, jsonify, request

MOODLE_URL   = os.getenv("MOODLE_URL", "").rstrip("/")
MOODLE_TOKEN = os.getenv("MOODLE_WS_TOKEN", "")

moodle_bp = Blueprint("moodle", __name__)


# ── helpers ───────────────────────────────────────────────────────────────────

def _ws(function: str, params: dict = None) -> dict | list:
    payload = {
        "wstoken":            MOODLE_TOKEN,
        "wsfunction":         function,
        "moodlewsrestformat": "json",
        **(params or {}),
    }
    r = requests.post(
        f"{MOODLE_URL}/webservice/rest/server.php",
        data=payload,
        timeout=15,
    )
    r.raise_for_status()
    data = r.json()
    if isinstance(data, dict) and "exception" in data:
        raise Exception(data.get("message", "Error Moodle WS"))
    return data


def _paginate(function: str, extra: dict = None, page_size: int = 200) -> list:
    records, offset = [], 0
    while True:
        batch = _ws(function, {"limit": page_size, "offset": offset, **(extra or {})})
        if not batch:
            break
        records.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size
    return records


# ── endpoints ─────────────────────────────────────────────────────────────────

@moodle_bp.get("/api/moodle/health")
def health():
    try:
        info = _ws("core_webservice_get_site_info")
        return jsonify({"status": "ok", "moodle": info.get("sitename"),
                        "version": info.get("release"), "url": MOODLE_URL})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 503


@moodle_bp.get("/api/moodle/cursos")
def get_cursos():
    try:
        since = request.args.get("since", 0, type=int)
        cursos = _paginate("local_edupath_get_courses", {"since": since})
        return jsonify({"total": len(cursos), "cursos": cursos})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@moodle_bp.get("/api/moodle/usuarios")
def get_usuarios():
    try:
        since = request.args.get("since", 0, type=int)
        usuarios = _paginate("local_edupath_get_users", {"since": since})
        return jsonify({"total": len(usuarios), "usuarios": usuarios})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@moodle_bp.get("/api/moodle/matriculas")
def get_matriculas():
    try:
        params = {}
        if request.args.get("courseid"): params["courseid"] = int(request.args["courseid"])
        if request.args.get("userid"):   params["userid"]   = int(request.args["userid"])
        if request.args.get("since"):    params["since"]    = int(request.args["since"])
        matriculas = _paginate("local_edupath_get_enrollments", params, page_size=500)
        return jsonify({"total": len(matriculas), "matriculas": matriculas})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@moodle_bp.get("/api/moodle/progreso")
def get_progreso():
    try:
        params = {}
        if request.args.get("courseid"): params["courseid"] = int(request.args["courseid"])
        if request.args.get("userid"):   params["userid"]   = int(request.args["userid"])
        progreso = _paginate("local_edupath_get_progress", params, page_size=500)
        return jsonify({"total": len(progreso), "progreso": progreso})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@moodle_bp.get("/api/moodle/calificaciones")
def get_calificaciones():
    try:
        params = {}
        if request.args.get("courseid"): params["courseid"] = int(request.args["courseid"])
        if request.args.get("userid"):   params["userid"]   = int(request.args["userid"])
        if request.args.get("since"):    params["since"]    = int(request.args["since"])
        calificaciones = _paginate("local_edupath_get_grades", params, page_size=500)
        return jsonify({"total": len(calificaciones), "calificaciones": calificaciones})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@moodle_bp.get("/api/moodle/actividad")
def get_actividad():
    try:
        params = {}
        if request.args.get("courseid"):  params["courseid"]  = int(request.args["courseid"])
        if request.args.get("userid"):    params["userid"]    = int(request.args["userid"])
        if request.args.get("since"):     params["since"]     = int(request.args["since"])
        if request.args.get("eventname"): params["eventname"] = request.args["eventname"]
        actividad = _paginate("local_edupath_get_activity", params, page_size=1000)
        return jsonify({"total": len(actividad), "actividad": actividad})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@moodle_bp.get("/api/moodle/dashboard")
def get_dashboard():
    try:
        usuarios   = _paginate("local_edupath_get_users")
        cursos     = _paginate("local_edupath_get_courses")
        matriculas = _paginate("local_edupath_get_enrollments", page_size=500)
        progreso   = _paginate("local_edupath_get_progress",    page_size=500)

        completados = [p for p in progreso if p.get("completed")]
        en_progreso = [p for p in progreso if not p.get("completed") and p.get("percent", 0) > 0]
        promedio    = sum(p.get("percent", 0) for p in progreso) / len(progreso) if progreso else 0

        por_curso = {}
        for p in progreso:
            cid = p["course_id"]
            if cid not in por_curso:
                por_curso[cid] = {"course_id": cid, "coursename": p.get("courseshortname", ""),
                                  "total": 0, "completados": 0, "suma": 0}
            por_curso[cid]["total"] += 1
            por_curso[cid]["suma"]  += p.get("percent", 0)
            if p.get("completed"):
                por_curso[cid]["completados"] += 1

        for c in por_curso.values():
            c["promedio"] = round(c["suma"] / c["total"], 1) if c["total"] else 0
            del c["suma"]

        return jsonify({
            "resumen": {
                "total_usuarios":     len(usuarios),
                "total_cursos":       len(cursos),
                "total_matriculas":   len(matriculas),
                "cursos_completados": len(completados),
                "cursos_en_progreso": len(en_progreso),
                "promedio_progreso":  round(promedio, 1),
            },
            "progreso_por_curso":  list(por_curso.values()),
            "usuarios_recientes":  usuarios[:10],
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── webhook ───────────────────────────────────────────────────────────────────

@moodle_bp.post("/webhooks/moodle")
def webhook_moodle():
    secret   = os.getenv("WEBHOOK_SECRET", "").encode()
    body     = request.get_data()
    sig      = request.headers.get("X-Edupath-Signature", "")
    expected = "sha256=" + hmac.new(secret, body, hashlib.sha256).hexdigest()

    if not hmac.compare_digest(expected, sig):
        return jsonify({"error": "Firma invalida"}), 401

    event      = request.get_json()
    event_name = event.get("event")

    handlers = {
        "course_completed":                 _on_course_completed,
        "user_graded":                      _on_user_graded,
        "user_enrolment_created":           _on_enrollment,
        "course_module_completion_updated": _on_module_completed,
        "user_loggedin":                    _on_login,
    }
    handler = handlers.get(event_name)
    if handler:
        handler(event)

    return jsonify({"status": "ok", "event": event_name}), 200


def _on_course_completed(e):
    print(f"[webhook] curso completado — usuario {e['userid']} curso {e['courseid']}")

def _on_user_graded(e):
    print(f"[webhook] calificacion — usuario {e['userid']}")

def _on_enrollment(e):
    print(f"[webhook] matricula — usuario {e['userid']} curso {e['courseid']}")

def _on_module_completed(e):
    print(f"[webhook] actividad completada — usuario {e['userid']}")

def _on_login(e):
    print(f"[webhook] login — usuario {e['userid']}")
