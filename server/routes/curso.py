from flask import Blueprint, jsonify, request
from db import execute_query, execute_command
from utils import serialize
import queries as q

curso_bp = Blueprint("curso", __name__, url_prefix="/api/cursos")


# ============================================================
# CRUD Curso
# ============================================================

@curso_bp.get("/")
def get_all():
    df = execute_query(q.GET_ALL_CURSOS)
    return jsonify(serialize(df))


@curso_bp.get("/<int:id>")
def get_one(id):
    df = execute_query(q.GET_CURSO_BY_ID, (id,))
    if df.is_empty():
        return jsonify({"error": "Curso no encontrado"}), 404
    return jsonify(serialize(df)[0])


@curso_bp.post("/")
def create():
    data = request.get_json()
    result = execute_command(
        q.INSERT_CURSO,
        (
            data["titulo"],
            data.get("descripcion"),
            data.get("categoria"),
            data.get("duracion"),
        ),
    )
    return jsonify({"id": result["last_insert_id"], "message": "Curso creado"}), 201


@curso_bp.put("/<int:id>")
def update(id):
    data = request.get_json()
    result = execute_command(
        q.UPDATE_CURSO,
        (
            data["titulo"],
            data.get("descripcion"),
            data.get("categoria"),
            data.get("duracion"),
            id,
        ),
    )
    if result["affected_rows"] == 0:
        return jsonify({"error": "Curso no encontrado"}), 404
    return jsonify({"message": "Curso actualizado"})


@curso_bp.delete("/<int:id>")
def delete(id):
    execute_command("DELETE rp FROM RespuestaPregunta rp JOIN IntentoEvaluacion ie ON rp.intento_id = ie.id JOIN Actividad a ON ie.actividad_id = a.id WHERE a.curso_id = %s", (id,))
    execute_command("DELETE ie FROM IntentoEvaluacion ie JOIN Actividad a ON ie.actividad_id = a.id WHERE a.curso_id = %s", (id,))
    execute_command("DELETE pa FROM ProgresoActividad pa JOIN Actividad a ON pa.actividad_id = a.id WHERE a.curso_id = %s", (id,))
    execute_command("DELETE op FROM OpcionPregunta op JOIN Pregunta p ON op.pregunta_id = p.id JOIN ActividadEvaluacion ae ON p.evaluacion_id = ae.actividad_id JOIN Actividad a ON ae.actividad_id = a.id WHERE a.curso_id = %s", (id,))
    execute_command("DELETE p FROM Pregunta p JOIN ActividadEvaluacion ae ON p.evaluacion_id = ae.actividad_id JOIN Actividad a ON ae.actividad_id = a.id WHERE a.curso_id = %s", (id,))
    execute_command("DELETE ae FROM ActividadEvaluacion ae JOIN Actividad a ON ae.actividad_id = a.id WHERE a.curso_id = %s", (id,))
    execute_command("DELETE av FROM ActividadVideo av JOIN Actividad a ON av.actividad_id = a.id WHERE a.curso_id = %s", (id,))
    execute_command("DELETE ad FROM ActividadDiapositiva ad JOIN Actividad a ON ad.actividad_id = a.id WHERE a.curso_id = %s", (id,))
    execute_command("DELETE FROM Actividad WHERE curso_id = %s", (id,))
    execute_command("DELETE FROM InteraccionCurso WHERE curso_id = %s", (id,))
    execute_command("DELETE FROM CursoEtiqueta WHERE curso_id = %s", (id,))
    result = execute_command(q.DELETE_CURSO, (id,))
    if result["affected_rows"] == 0:
        return jsonify({"error": "Curso no encontrado"}), 404
    return jsonify({"message": "Curso eliminado"})


# ============================================================
# Etiquetas
# ============================================================

@curso_bp.get("/etiquetas")
def get_all_etiquetas():
    df = execute_query(q.GET_ALL_ETIQUETAS)
    etiquetas = df["etiqueta"].to_list() if not df.is_empty() else []
    return jsonify(etiquetas)


@curso_bp.get("/con-etiquetas")
def get_cursos_con_etiquetas():
    df = execute_query(q.GET_CURSOS_CON_ETIQUETAS)
    if df.is_empty():
        return jsonify([])
    cursos = {}
    for row in serialize(df):
        cid = row["id"]
        if cid not in cursos:
            cursos[cid] = {"id": cid, "titulo": row["titulo"], "etiquetas": []}
        cursos[cid]["etiquetas"].append(row["etiqueta"])
    return jsonify(list(cursos.values()))


@curso_bp.get("/etiquetas-por-categoria")
def get_etiquetas_por_categoria():
    df = execute_query("""
        SELECT c.categoria, ce.etiqueta
        FROM CursoEtiqueta ce
        JOIN Curso c ON c.id = ce.curso_id
        WHERE c.categoria IS NOT NULL AND c.categoria != ''
        ORDER BY c.categoria, ce.etiqueta
    """)
    if df.is_empty():
        return jsonify([])
    categorias = {}
    for row in serialize(df):
        cat = row["categoria"]
        tag = row["etiqueta"]
        if cat not in categorias:
            categorias[cat] = set()
        categorias[cat].add(tag)
    return jsonify([
        {"categoria": cat, "etiquetas": sorted(list(tags))}
        for cat, tags in sorted(categorias.items())
    ])


@curso_bp.get("/<int:id>/etiquetas")
def get_etiquetas(id):
    df = execute_query(q.GET_ETIQUETAS_BY_CURSO, (id,))
    return jsonify(serialize(df))


@curso_bp.post("/<int:id>/etiquetas")
def add_etiqueta(id):
    data = request.get_json()
    execute_command(q.INSERT_ETIQUETA, (id, data["etiqueta"]))
    return jsonify({"message": "Etiqueta agregada"}), 201


@curso_bp.delete("/<int:id>/etiquetas/<string:etiqueta>")
def remove_etiqueta(id, etiqueta):
    result = execute_command(q.DELETE_ETIQUETA, (id, etiqueta))
    if result["affected_rows"] == 0:
        return jsonify({"error": "Etiqueta no encontrada"}), 404
    return jsonify({"message": "Etiqueta eliminada"})
