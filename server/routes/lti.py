from moodle_sync import sincronizar_cursos_estudiante
import os
import datetime
from flask import Blueprint, jsonify, redirect, session
from pylti1p3.contrib.flask import (
    FlaskMessageLaunch,
    FlaskOIDCLogin,
    FlaskRequest,
    FlaskCacheDataStorage,
)
from cachelib import SimpleCache as _SimpleCache

_cache = _SimpleCache()
from pylti1p3.tool_config import ToolConfDict
from db import execute_query, execute_command
from utils import serialize
import queries as q

lti_bp = Blueprint("lti", __name__)

_SERVER_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _get_tool_conf():
    moodle_url  = os.getenv("MOODLE_URL", "").rstrip("/")
    client_id   = os.getenv("MOODLE_CLIENT_ID", "")
    deployments = [d.strip() for d in os.getenv("MOODLE_DEPLOYMENT_IDS", "1").split(",")]
    conf = {
        moodle_url: [
            {
                "default": True,
                "client_id": client_id,
                "auth_login_url": f"{moodle_url}/mod/lti/auth.php",
                "auth_token_url": f"{moodle_url}/mod/lti/token.php",
                "key_set_url":    f"{moodle_url}/mod/lti/certs.php",
                "key_set": None,
                "private_key_file": os.path.join(_SERVER_DIR, "private.key"),
                "public_key_file":  os.path.join(_SERVER_DIR, "public.key"),
                "deployment_ids": deployments,
            }
        ]
    }
    return ToolConfDict(conf)


def _get_launch_data_storage():
    return FlaskCacheDataStorage(_cache)


# ============================================================
# OIDC Login — Moodle inicia aqui el flujo LTI 1.3
# ============================================================
@lti_bp.route("/oidc_login", methods=["GET", "POST"])
@lti_bp.route("/login", methods=["GET", "POST"])
def oidc_login():
    tool_conf  = _get_tool_conf()
    flask_req  = FlaskRequest()

    target_link_uri = flask_req.get_param("target_link_uri")
    if not target_link_uri:
        return jsonify({"error": "Falta target_link_uri"}), 400

    oidc = FlaskOIDCLogin(
        flask_req,
        tool_conf,
        launch_data_storage=_get_launch_data_storage(),
    )
    return oidc.redirect(target_link_uri)


# ============================================================
# Launch — Moodle redirige aqui tras autenticar al usuario
# ============================================================
@lti_bp.route("/launch", methods=["POST"])
def launch():
    tool_conf  = _get_tool_conf()
    flask_req  = FlaskRequest()

    message_launch = FlaskMessageLaunch(
        flask_req,
        tool_conf,
        launch_data_storage=_get_launch_data_storage(),
    )
    message_launch.set_jwt_verify_options({
        "verify_exp": True,
        "verify_iat": False,
        "verify_aud": False,
        "leeway": datetime.timedelta(seconds=600),
    })

    launch_data = message_launch.get_launch_data()
    
    moodle_id = str(launch_data.get("sub", ""))
    nombre    = launch_data.get("name") or launch_data.get("given_name", "Sin nombre")
    email     = launch_data.get("email", "")

    roles_lti = launch_data.get("https://purl.imsglobal.org/spec/lti/claim/roles", [])
    if any("Administrator" in r for r in roles_lti):
        rol = "Administrador"
    elif any("Instructor" in r for r in roles_lti):
        rol = "Instructor"
    else:
        rol = "Estudiante"

    df = execute_query(q.GET_ESTUDIANTE_BY_MOODLE_ID, (moodle_id,))

    if df.is_empty():
        result = execute_command(
            q.INSERT_ESTUDIANTE,
            (nombre, email, moodle_id, None, None, 0, 1, rol),
        )
        session["estudiante_id"] = result["last_insert_id"]
        print(f"LTI: nuevo estudiante registrado -> {nombre} ({moodle_id}) [{rol}]")
    else:
        estudiante = serialize(df)[0]
        session["estudiante_id"] = estudiante["id"]
        execute_command(q.UPDATE_ESTUDIANTE_ROL, (rol, estudiante["id"]))
        print(f"LTI: estudiante existente -> {nombre} ({moodle_id}) [{rol}]")

    estudiante_id = session.get("estudiante_id")
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    # Sincronizar cursos desde Moodle
    sincronizar_cursos_estudiante(session["estudiante_id"], moodle_id)

    estudiante_id = session.get("estudiante_id")
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    return redirect(f"{frontend_url}/?sid={estudiante_id}")


# ============================================================
# JWKS — Expone la clave publica del tool para que Moodle la valide
# ============================================================
@lti_bp.route("/jwks", methods=["GET"])
def jwks():
    tool_conf = _get_tool_conf()
    return jsonify(tool_conf.get_jwks())