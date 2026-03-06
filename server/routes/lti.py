import os
from flask import Blueprint, jsonify, send_file
from pylti1p3.contrib.flask import (
    FlaskMessageLaunch,
    FlaskOIDCLogin,
    FlaskRequest,
    FlaskCacheDataStorage,
)
from pylti1p3.tool_config import ToolConfJsonFile

lti_bp = Blueprint("lti", __name__)

# Rutas base
_SERVER_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_DIST_DIR   = os.path.join(_SERVER_DIR, "..", "dist")
TOOL_CONF_PATH = os.path.join(_SERVER_DIR, "lti_config.json")


def _get_tool_conf():
    return ToolConfJsonFile(TOOL_CONF_PATH)


def _get_launch_data_storage():
    # Importacion diferida para evitar circular imports con app.py
    from app import cache
    return FlaskCacheDataStorage(cache)


# ============================================================
# OIDC Login — Moodle inicia aqui el flujo LTI 1.3
# Registrar esta URL en Moodle como "Initiate login URI"
# ============================================================
@lti_bp.route("/oidc_login", methods=["GET", "POST"])
def oidc_login():
    tool_conf   = _get_tool_conf()
    flask_req   = FlaskRequest()

    target_link_uri = flask_req.get_param("target_link_uri")
    if not target_link_uri:
        return jsonify({"error": "Falta target_link_uri"}), 400

    oidc = FlaskOIDCLogin(
        flask_req,
        tool_conf,
        launch_data_storage=_get_launch_data_storage(),
    )
    return oidc.enable_check_cookies().redirect(target_link_uri)


# ============================================================
# Launch — Moodle redirige aqui tras autenticar al usuario
# Registrar esta URL en Moodle como "Redirection URI"
# ============================================================
@lti_bp.route("/launch", methods=["POST"])
def launch():
    tool_conf   = _get_tool_conf()
    flask_req   = FlaskRequest()

    message_launch = FlaskMessageLaunch(
        flask_req,
        tool_conf,
        launch_data_storage=_get_launch_data_storage(),
    )

    launch_data = message_launch.get_launch_data()

    # Datos del usuario disponibles desde Moodle:
    # launch_data.get("sub")              -> ID unico del usuario en Moodle
    # launch_data.get("name")             -> Nombre completo
    # launch_data.get("email")            -> Email
    # launch_data.get("given_name")       -> Nombre
    # launch_data.get("family_name")      -> Apellido
    print(f"LTI Launch exitoso: {launch_data.get('name')} ({launch_data.get('sub')})")

    return send_file(os.path.join(_DIST_DIR, "index.html"))


# ============================================================
# JWKS — Expone la clave publica del tool para que Moodle la valide
# Registrar esta URL en Moodle como "Public keyset URL"
# ============================================================
@lti_bp.route("/jwks", methods=["GET"])
def jwks():
    tool_conf = _get_tool_conf()
    return jsonify(tool_conf.get_jwks())
