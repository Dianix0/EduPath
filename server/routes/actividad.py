import os
import uuid
from flask import Blueprint, jsonify, request, session
from werkzeug.utils import secure_filename
from db import execute_query, execute_command
from utils import serialize
import queries as q

actividad_bp = Blueprint("actividad", __name__)

UPLOADS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "uploads", "diapositivas")
)
ALLOWED_EXTENSIONS = {"pdf", "ppt", "pptx"}


def _allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def _get_sesion():
    eid = session.get("estudiante_id")
    if not eid:
        return None, (jsonify({"error": "No hay sesion activa"}), 401)
    return eid, None


def _check_admin():
    eid, err = _get_sesion()
    if err:
        return None, err
    df = execute_query(q.GET_ESTUDIANTE_BY_ID, (eid,))
    if df.is_empty():
        return None, (jsonify({"error": "Usuario no encontrado"}), 404)
    est = serialize(df)[0]
    if est.get("rol") != "Administrador":
        return None, (jsonify({"error": "Acceso denegado"}), 403)
    return est, None


def _actualizar_interaccion(eid, curso_id):
    """Recalcula progreso y calificacion en InteraccionCurso despues de cada completado."""
    df_total = execute_query(q.COUNT_ACTIVIDADES_BY_CURSO, (curso_id,))
    total = serialize(df_total)[0].get("total", 0) if not df_total.is_empty() else 0

    df_comp = execute_query(q.COUNT_COMPLETADAS_BY_CURSO, (eid, curso_id))
    completadas = serialize(df_comp)[0].get("completadas", 0) if not df_comp.is_empty() else 0

    progreso = round(completadas / total * 100, 1) if total > 0 else 0

    # Calificacion = promedio de mejores intentos de evaluaciones completadas
    df_evals = execute_query(q.GET_EVALUACIONES_IDS_BY_CURSO, (curso_id,))
    evals = serialize(df_evals)
    mejores = []
    for ev in evals:
        df_m = execute_query(q.GET_MEJOR_INTENTO, (eid, ev["actividad_id"]))
        if not df_m.is_empty():
            mejor = serialize(df_m)[0].get("mejor")
            if mejor is not None:
                mejores.append(float(mejor))

    calificacion = round(sum(mejores) / len(mejores), 1) if mejores else 0

    execute_command(q.UPDATE_INTERACCION_PROGRESO_CAL, (progreso, calificacion, eid, curso_id))


def _build_actividad(act):
    """Agrega datos especificos segun tipo a un dict de actividad."""
    tipo = act["tipo"]
    if tipo == "video":
        df = execute_query(q.GET_VIDEO_BY_ACTIVIDAD, (act["id"],))
        if not df.is_empty():
            act.update(serialize(df)[0])
    elif tipo == "diapositiva":
        df = execute_query(q.GET_DIAPOSITIVA_BY_ACTIVIDAD, (act["id"],))
        if not df.is_empty():
            d = serialize(df)[0]
            act["nombre_archivo"] = d["nombre_archivo"]
            act["nombre_original"] = d["nombre_original"]
            act["url"] = f"/uploads/diapositivas/{d['nombre_archivo']}"
    elif tipo == "evaluacion":
        df = execute_query(q.GET_EVALUACION_BY_ACTIVIDAD, (act["id"],))
        if not df.is_empty():
            act.update(serialize(df)[0])
    return act


# ============================================================
# Actividades de un curso
# ============================================================

@actividad_bp.get("/api/cursos/<int:curso_id>/actividades")
def get_actividades(curso_id):
    df = execute_query(q.GET_ACTIVIDADES_BY_CURSO, (curso_id,))
    return jsonify([_build_actividad(a) for a in serialize(df)])


@actividad_bp.post("/api/cursos/<int:curso_id>/actividades")
def create_actividad(curso_id):
    _, err = _check_admin()
    if err:
        return err
    data = request.get_json()
    titulo = (data.get("titulo") or "").strip()
    tipo = data.get("tipo")
    if not titulo or tipo not in ("video", "diapositiva", "evaluacion"):
        return jsonify({"error": "titulo y tipo son requeridos"}), 400

    result = execute_command(q.INSERT_ACTIVIDAD, (
        curso_id, titulo, data.get("descripcion"), tipo, data.get("orden", 0)
    ))
    act_id = result["last_insert_id"]

    if tipo == "video":
        url = (data.get("url") or "").strip()
        if url:
            execute_command(q.INSERT_VIDEO, (act_id, url))
    elif tipo == "evaluacion":
        execute_command(q.INSERT_EVALUACION, (
            act_id, data.get("tiempo_limite_min"), data.get("intentos_max", 1)
        ))
    # diapositiva se sube por endpoint separado

    # Recalcular progreso para todos los estudiantes del curso
    df_ics = execute_query(q.GET_INTERACCIONES_BY_CURSO, (curso_id,))
    for row in serialize(df_ics):
        _actualizar_interaccion(row["estudiante_id"], curso_id)

    return jsonify({"id": act_id, "message": "Actividad creada"}), 201


@actividad_bp.put("/api/actividades/<int:id>")
def update_actividad(id):
    _, err = _check_admin()
    if err:
        return err
    data = request.get_json()
    titulo = (data.get("titulo") or "").strip()
    if not titulo:
        return jsonify({"error": "titulo es requerido"}), 400

    result = execute_command(q.UPDATE_ACTIVIDAD, (
        titulo, data.get("descripcion"), data.get("orden", 0), id
    ))
    if result["affected_rows"] == 0:
        return jsonify({"error": "Actividad no encontrada"}), 404

    df = execute_query(q.GET_ACTIVIDAD_BY_ID, (id,))
    if not df.is_empty():
        tipo = serialize(df)[0]["tipo"]
        if tipo == "video" and data.get("url"):
            execute_command(q.UPSERT_VIDEO, (id, data["url"], data["url"]))
        elif tipo == "evaluacion":
            execute_command(q.UPDATE_EVALUACION, (
                data.get("tiempo_limite_min"), data.get("intentos_max", 1), id
            ))

    return jsonify({"message": "Actividad actualizada"})


@actividad_bp.delete("/api/actividades/<int:id>")
def delete_actividad(id):
    _, err = _check_admin()
    if err:
        return err

    df = execute_query(q.GET_ACTIVIDAD_BY_ID, (id,))
    if df.is_empty():
        return jsonify({"error": "Actividad no encontrada"}), 404
    act_data = serialize(df)[0]
    tipo = act_data["tipo"]
    curso_id = act_data["curso_id"]

    # Guardar estudiantes afectados antes de borrar
    df_ics = execute_query(q.GET_INTERACCIONES_BY_CURSO, (curso_id,))
    estudiantes_afectados = [row["estudiante_id"] for row in serialize(df_ics)]

    execute_command("DELETE FROM ProgresoActividad WHERE actividad_id = %s", (id,))

    if tipo == "video":
        execute_command("DELETE FROM ActividadVideo WHERE actividad_id = %s", (id,))
    elif tipo == "diapositiva":
        df_d = execute_query(q.GET_DIAPOSITIVA_BY_ACTIVIDAD, (id,))
        if not df_d.is_empty():
            nombre = serialize(df_d)[0].get("nombre_archivo")
            if nombre:
                path = os.path.join(UPLOADS_DIR, nombre)
                if os.path.exists(path):
                    os.remove(path)
        execute_command("DELETE FROM ActividadDiapositiva WHERE actividad_id = %s", (id,))
    elif tipo == "evaluacion":
        intentos = serialize(execute_query(
            "SELECT id FROM IntentoEvaluacion WHERE actividad_id = %s", (id,)
        ))
        for intento in intentos:
            execute_command("DELETE FROM RespuestaPregunta WHERE intento_id = %s", (intento["id"],))
        execute_command("DELETE FROM IntentoEvaluacion WHERE actividad_id = %s", (id,))
        preguntas = serialize(execute_query(
            "SELECT id FROM Pregunta WHERE evaluacion_id = %s", (id,)
        ))
        for preg in preguntas:
            execute_command("DELETE FROM OpcionPregunta WHERE pregunta_id = %s", (preg["id"],))
        execute_command("DELETE FROM Pregunta WHERE evaluacion_id = %s", (id,))
        execute_command("DELETE FROM ActividadEvaluacion WHERE actividad_id = %s", (id,))

    execute_command(q.DELETE_ACTIVIDAD, (id,))

    # Recalcular progreso y calificacion para todos los estudiantes del curso
    for eid in estudiantes_afectados:
        _actualizar_interaccion(eid, curso_id)

    return jsonify({"message": "Actividad eliminada"})


# ============================================================
# Upload diapositiva
# ============================================================

@actividad_bp.post("/api/actividades/<int:id>/diapositiva/upload")
def upload_diapositiva(id):
    _, err = _check_admin()
    if err:
        return err

    if "archivo" not in request.files:
        return jsonify({"error": "No se envio archivo"}), 400
    archivo = request.files["archivo"]
    if not archivo.filename or not _allowed_file(archivo.filename):
        return jsonify({"error": "Formato no permitido. Use PDF, PPT o PPTX"}), 400

    ext = archivo.filename.rsplit(".", 1)[1].lower()
    nombre_unico = f"{uuid.uuid4().hex}.{ext}"
    nombre_original = secure_filename(archivo.filename)

    # Borrar archivo anterior si existe
    df_d = execute_query(q.GET_DIAPOSITIVA_BY_ACTIVIDAD, (id,))
    if not df_d.is_empty():
        viejo = serialize(df_d)[0].get("nombre_archivo")
        if viejo:
            viejo_path = os.path.join(UPLOADS_DIR, viejo)
            if os.path.exists(viejo_path):
                os.remove(viejo_path)
        execute_command("DELETE FROM ActividadDiapositiva WHERE actividad_id = %s", (id,))

    archivo.save(os.path.join(UPLOADS_DIR, nombre_unico))
    execute_command(q.INSERT_DIAPOSITIVA, (id, nombre_unico, nombre_original))

    return jsonify({
        "nombre_archivo": nombre_unico,
        "nombre_original": nombre_original,
        "url": f"/uploads/diapositivas/{nombre_unico}",
    }), 201


# ============================================================
# Preguntas de evaluacion (admin)
# ============================================================

@actividad_bp.get("/api/actividades/<int:id>/preguntas")
def get_preguntas(id):
    df = execute_query(q.GET_PREGUNTAS_BY_EVALUACION, (id,))
    preguntas = serialize(df)
    for preg in preguntas:
        if preg["tipo"] == "opcion_multiple":
            df_op = execute_query(q.GET_OPCIONES_BY_PREGUNTA, (preg["id"],))
            preg["opciones"] = serialize(df_op)
        else:
            preg["opciones"] = []
    return jsonify(preguntas)


@actividad_bp.post("/api/actividades/<int:id>/preguntas")
def add_pregunta(id):
    _, err = _check_admin()
    if err:
        return err
    data = request.get_json()
    enunciado = (data.get("enunciado") or "").strip()
    tipo = data.get("tipo")
    if not enunciado or tipo not in ("opcion_multiple", "texto"):
        return jsonify({"error": "enunciado y tipo son requeridos"}), 400

    result = execute_command(q.INSERT_PREGUNTA, (id, enunciado, tipo, data.get("orden", 0)))
    preg_id = result["last_insert_id"]

    for opcion in data.get("opciones", []):
        execute_command(q.INSERT_OPCION, (preg_id, opcion["texto"], opcion.get("es_correcta", False)))

    return jsonify({"id": preg_id, "message": "Pregunta agregada"}), 201


@actividad_bp.put("/api/preguntas/<int:id>")
def update_pregunta(id):
    _, err = _check_admin()
    if err:
        return err
    data = request.get_json()
    enunciado = (data.get("enunciado") or "").strip()
    if not enunciado:
        return jsonify({"error": "enunciado es requerido"}), 400
    result = execute_command(q.UPDATE_PREGUNTA, (enunciado, data.get("orden", 0), id))
    if result["affected_rows"] == 0:
        return jsonify({"error": "Pregunta no encontrada"}), 404
    return jsonify({"message": "Pregunta actualizada"})


@actividad_bp.delete("/api/preguntas/<int:id>")
def delete_pregunta(id):
    _, err = _check_admin()
    if err:
        return err
    execute_command("DELETE FROM RespuestaPregunta WHERE pregunta_id = %s", (id,))
    execute_command("DELETE FROM OpcionPregunta WHERE pregunta_id = %s", (id,))
    result = execute_command("DELETE FROM Pregunta WHERE id = %s", (id,))
    if result["affected_rows"] == 0:
        return jsonify({"error": "Pregunta no encontrada"}), 404
    return jsonify({"message": "Pregunta eliminada"})


@actividad_bp.post("/api/preguntas/<int:id>/opciones")
def add_opcion(id):
    _, err = _check_admin()
    if err:
        return err
    data = request.get_json()
    texto = (data.get("texto") or "").strip()
    if not texto:
        return jsonify({"error": "texto es requerido"}), 400
    result = execute_command(q.INSERT_OPCION, (id, texto, data.get("es_correcta", False)))
    return jsonify({"id": result["last_insert_id"], "message": "Opcion agregada"}), 201


@actividad_bp.delete("/api/opciones/<int:id>")
def delete_opcion(id):
    _, err = _check_admin()
    if err:
        return err
    execute_command("DELETE FROM RespuestaPregunta WHERE opcion_id = %s", (id,))
    result = execute_command("DELETE FROM OpcionPregunta WHERE id = %s", (id,))
    if result["affected_rows"] == 0:
        return jsonify({"error": "Opcion no encontrada"}), 404
    return jsonify({"message": "Opcion eliminada"})


# ============================================================
# Progreso del estudiante (videos y diapositivas)
# ============================================================

@actividad_bp.post("/api/actividades/<int:id>/completar")
def completar_actividad(id):
    eid, err = _get_sesion()
    if err:
        return err
    execute_command(q.UPSERT_PROGRESO, (eid, id, True))
    df = execute_query(q.GET_ACTIVIDAD_BY_ID, (id,))
    if not df.is_empty():
        curso_id = serialize(df)[0].get("curso_id")
        if curso_id:
            _actualizar_interaccion(eid, curso_id)
    return jsonify({"message": "Actividad marcada como completada"})


@actividad_bp.get("/api/cursos/<int:curso_id>/mi-progreso")
def get_mi_progreso(curso_id):
    eid, err = _get_sesion()
    if err:
        return err
    df = execute_query(q.GET_PROGRESO_BY_CURSO, (eid, curso_id))
    return jsonify(serialize(df))


# ============================================================
# Intentos de evaluacion (estudiante)
# ============================================================

@actividad_bp.post("/api/actividades/<int:id>/intentos")
def enviar_intento(id):
    eid, err = _get_sesion()
    if err:
        return err

    data = request.get_json()
    respuestas = data.get("respuestas", [])  # [{pregunta_id, opcion_id?, texto_respuesta?}]

    # Verificar intentos disponibles
    df_eval = execute_query(q.GET_EVALUACION_BY_ACTIVIDAD, (id,))
    if df_eval.is_empty():
        return jsonify({"error": "Evaluacion no encontrada"}), 404
    eval_data = serialize(df_eval)[0]
    intentos_max = eval_data.get("intentos_max", 1)

    df_intentos = execute_query(q.GET_INTENTOS_BY_ESTUDIANTE_ACTIVIDAD, (eid, id))
    n_intentos = len(serialize(df_intentos))
    if n_intentos >= intentos_max:
        return jsonify({"error": "Se alcanzo el limite de intentos"}), 400

    # Obtener preguntas y calcular puntaje
    df_preguntas = execute_query(q.GET_PREGUNTAS_BY_EVALUACION, (id,))
    preguntas = serialize(df_preguntas)

    total_om = sum(1 for p in preguntas if p["tipo"] == "opcion_multiple")
    correctas = 0
    resp_map = {r["pregunta_id"]: r for r in respuestas}
    resp_correctas = {}

    for preg in preguntas:
        resp = resp_map.get(preg["id"])
        es_correcta = None
        if resp and preg["tipo"] == "opcion_multiple" and resp.get("opcion_id"):
            df_op = execute_query(
                "SELECT es_correcta FROM OpcionPregunta WHERE id = %s",
                (resp["opcion_id"],)
            )
            if not df_op.is_empty():
                es_correcta = bool(serialize(df_op)[0].get("es_correcta"))
                if es_correcta:
                    correctas += 1
        resp_correctas[preg["id"]] = es_correcta

    puntos = round(correctas / total_om * 10, 1) if total_om > 0 else 10.0

    # Guardar intento
    result = execute_command(q.INSERT_INTENTO, (eid, id, puntos, len(preguntas), n_intentos + 1))
    intento_id = result["last_insert_id"]

    # Guardar respuestas individuales
    for preg in preguntas:
        resp = resp_map.get(preg["id"])
        if not resp:
            continue
        execute_command(q.INSERT_RESPUESTA, (
            intento_id,
            preg["id"],
            resp.get("opcion_id"),
            resp.get("texto_respuesta"),
            resp_correctas.get(preg["id"]),
        ))

    # Marcar actividad como completada
    execute_command(q.UPSERT_PROGRESO, (eid, id, True))

    # Actualizar interaccion del curso
    df_act = execute_query(q.GET_ACTIVIDAD_BY_ID, (id,))
    if not df_act.is_empty():
        curso_id = serialize(df_act)[0].get("curso_id")
        if curso_id:
            _actualizar_interaccion(eid, curso_id)

    return jsonify({
        "intento": n_intentos + 1,
        "puntos_obtenidos": puntos,
        "total_preguntas": len(preguntas),
        "correctas": correctas,
        "total_opcion_multiple": total_om,
    }), 201


@actividad_bp.get("/api/actividades/<int:id>/mis-intentos")
def get_mis_intentos(id):
    eid, err = _get_sesion()
    if err:
        return err
    df = execute_query(q.GET_INTENTOS_BY_ESTUDIANTE_ACTIVIDAD, (eid, id))
    return jsonify(serialize(df))


# ============================================================
# Interaccion de curso (iniciar, tiempo, detalle)
# ============================================================

@actividad_bp.post("/api/cursos/<int:curso_id>/iniciar")
def iniciar_curso(curso_id):
    eid, err = _get_sesion()
    if err:
        return err
    execute_command(q.UPSERT_INTERACCION_INICIO, (eid, curso_id))
    df = execute_query(q.GET_INTERACCION_BY_ESTUDIANTE_CURSO, (eid, curso_id))
    return jsonify(serialize(df)[0] if not df.is_empty() else {})


@actividad_bp.post("/api/cursos/<int:curso_id>/tiempo")
def agregar_tiempo(curso_id):
    eid, err = _get_sesion()
    if err:
        return err
    data = request.get_json() or {}
    segundos = int(data.get("segundos", 0))
    if segundos > 0:
        execute_command(q.ADD_INTERACCION_TIEMPO, (segundos, eid, curso_id))
    return jsonify({"message": "Tiempo actualizado"})


@actividad_bp.get("/api/cursos/<int:curso_id>/mi-interaccion")
def get_mi_interaccion(curso_id):
    eid, err = _get_sesion()
    if err:
        return err
    df = execute_query(q.GET_INTERACCION_BY_ESTUDIANTE_CURSO, (eid, curso_id))
    if df.is_empty():
        return jsonify({"error": "Sin interaccion"}), 404
    return jsonify(serialize(df)[0])
