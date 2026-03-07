import os
from flask import Flask, send_from_directory
from dotenv import load_dotenv
from routes.estudiante import estudiante_bp
from routes.curso import curso_bp
from routes.interaccion import interaccion_bp
from routes.lti import lti_bp
from routes.sesion import sesion_bp

load_dotenv()

DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dist"))

app = Flask(__name__, static_folder=DIST_DIR, static_url_path="")
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev_secret_change_in_prod")

@app.route("/")
def index():
    return send_from_directory(DIST_DIR, "index.html")

@app.route("/<path:path>")
def spa_fallback(path):
    if path.startswith("api/"):
        return {"error": "Not found"}, 404
    return send_from_directory(DIST_DIR, "index.html")


app.register_blueprint(estudiante_bp)
app.register_blueprint(curso_bp)
app.register_blueprint(interaccion_bp)
app.register_blueprint(lti_bp)
app.register_blueprint(sesion_bp)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 3000))
    app.run(debug=True, port=port)
