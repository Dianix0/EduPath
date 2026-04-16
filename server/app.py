import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_session import Session
from dotenv import load_dotenv
from routes.estudiante import estudiante_bp
from routes.curso import curso_bp
from routes.interaccion import interaccion_bp
from routes.lti import lti_bp
from routes.gamificacion import gamificacion_bp
from routes.sesion import sesion_bp
from routes.admin import admin_bp
from routes.actividad import actividad_bp
from routes.recomendaciones import rec_bp
from routes.moodle import moodle_bp

load_dotenv()

DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dist"))
UPLOADS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "uploads"))

app = Flask(__name__, static_folder=DIST_DIR, static_url_path="")
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev_secret_change_in_prod")

# Sesión del lado del servidor con filesystem
app.config.update(
    SESSION_TYPE="filesystem",
    SESSION_FILE_DIR="/tmp/flask_sessions",
    SESSION_PERMANENT=True,
    SESSION_USE_SIGNER=True,
    SESSION_COOKIE_SECURE=False,
    SESSION_COOKIE_HTTPONLY=False,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_DOMAIN=None,
    SESSION_COOKIE_NAME="edupath_session",
)

Session(app)

CORS(app,
     origins=["http://localhost:5173"],
     supports_credentials=True
)

@app.route("/")
def index():
    return send_from_directory(DIST_DIR, "index.html")

@app.route("/uploads/<path:filename>")
def serve_upload(filename):
    return send_from_directory(UPLOADS_DIR, filename)

@app.route("/<path:path>")
def spa_fallback(path):
    if path.startswith("api/") or path.startswith("uploads/"):
        return {"error": "Not found"}, 404
    return send_from_directory(DIST_DIR, "index.html")

app.register_blueprint(estudiante_bp)
app.register_blueprint(curso_bp)
app.register_blueprint(interaccion_bp)
app.register_blueprint(lti_bp)
app.register_blueprint(gamificacion_bp)
app.register_blueprint(sesion_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(actividad_bp)
app.register_blueprint(rec_bp)
app.register_blueprint(moodle_bp)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 3000))
    app.run(debug=True, host="0.0.0.0", port=port)