import os
from flask import Flask
from flask_caching import Cache
from dotenv import load_dotenv
from routes.estudiante import estudiante_bp
from routes.curso import curso_bp
from routes.interaccion import interaccion_bp
from routes.lti import lti_bp

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev_secret_change_in_prod")

cache = Cache(app, config={"CACHE_TYPE": "SimpleCache"})

app.register_blueprint(estudiante_bp)
app.register_blueprint(curso_bp)
app.register_blueprint(interaccion_bp)
app.register_blueprint(lti_bp)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 3000))
    app.run(debug=True, port=port)
