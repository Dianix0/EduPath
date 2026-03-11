from flask import Blueprint, jsonify, session
from db import execute_query
from utils import serialize
import queries as q

rec_bp = Blueprint("recomendaciones", __name__, url_prefix="/api/me")

LIMIT = 6


def _parse_cursos(rows):
    result = []
    for row in rows:
        etiquetas_raw = row.get("etiquetas") or ""
        etiquetas = set(e for e in etiquetas_raw.split("|||") if e) if etiquetas_raw else set()
        categoria = (row.get("categoria") or "").strip()
        if categoria:
            etiquetas.add(categoria)
        result.append({
            "id": row["id"],
            "titulo": row["titulo"],
            "descripcion": row.get("descripcion"),
            "categoria": row.get("categoria"),
            "duracion": row.get("duracion"),
            "etiquetas": etiquetas,
        })
    return result


def _slim(c):
    return {
        "id": c["id"],
        "titulo": c["titulo"],
        "descripcion": c["descripcion"],
        "categoria": c["categoria"],
        "duracion": c["duracion"],
    }


@rec_bp.get("/recomendaciones")
def get_recomendaciones():
    estudiante_id = session.get("estudiante_id")
    if not estudiante_id:
        return jsonify({"error": "No hay sesion activa"}), 401

    # --- User profile ---
    df_user = execute_query(q.GET_ESTUDIANTE_BY_ID, (estudiante_id,))
    if df_user.is_empty():
        return jsonify({"error": "Usuario no encontrado"}), 404
    usuario = serialize(df_user)[0]

    # --- User interests ---
    df_intereses = execute_query(q.GET_INTERESES_BY_ESTUDIANTE, (estudiante_id,))
    intereses_user = set(row["interes"] for row in serialize(df_intereses))

    # --- Courses user has already taken (progreso > 0) ---
    df_tomados = execute_query(q.GET_INTERACCIONES_CON_PROGRESO, (estudiante_id,))
    ids_tomados = set(row["curso_id"] for row in serialize(df_tomados))

    # --- All courses with their tags ---
    todos_cursos = _parse_cursos(serialize(execute_query(q.GET_ALL_CURSOS_CON_ETIQUETAS_FULL)))
    candidatos = [c for c in todos_cursos if c["id"] not in ids_tomados]

    # --- Taste profile: union of tags from courses already taken ---
    taste_profile = set()
    for c in todos_cursos:
        if c["id"] in ids_tomados:
            taste_profile |= c["etiquetas"]

    # --- All other students for collaborative filtering ---
    user_carrera = usuario.get("carrera")
    user_edad = usuario.get("edad")

    df_collab = execute_query(q.GET_ALL_USERS_FOR_COLLAB, (estudiante_id,))
    users_map = {}
    for row in serialize(df_collab):
        uid = row["id"]
        intereses_raw = row.get("intereses") or ""
        cursos_raw = row.get("cursos_tomados") or ""
        users_map[uid] = {
            "carrera": row.get("carrera"),
            "edad": row.get("edad"),
            "intereses": set(i for i in intereses_raw.split("|||") if i) if intereses_raw else set(),
            "cursos_tomados": set(int(x) for x in cursos_raw.split(",") if x) if cursos_raw else set(),
        }

    def _similitud(u2):
        # Interests — Jaccard (60%)
        union_i = intereses_user | u2["intereses"]
        jaccard = len(intereses_user & u2["intereses"]) / len(union_i) if union_i else 0.0
        # Career match (25%)
        career = 1.0 if u2["carrera"] and u2["carrera"] == user_carrera else 0.0
        # Age similarity (15%) — penalty grows linearly over 20 years
        if user_edad and u2.get("edad"):
            age_sim = max(0.0, 1.0 - abs(int(user_edad) - int(u2["edad"])) / 20.0)
        else:
            age_sim = 0.5
        return 0.60 * jaccard + 0.25 * career + 0.15 * age_sim

    sim_cache = {uid: _similitud(u2) for uid, u2 in users_map.items()}

    # --- Score functions ---
    def _content_gustos(c):
        """Similarity between course and courses the user already took."""
        if not taste_profile or not c["etiquetas"]:
            return 0.0
        union = taste_profile | c["etiquetas"]
        return len(taste_profile & c["etiquetas"]) / len(union)

    def _content_intereses(c):
        """How well the course matches the user's declared interests."""
        if not intereses_user or not c["etiquetas"]:
            return 0.0
        return len(intereses_user & c["etiquetas"]) / max(len(c["etiquetas"]), 1)

    def _collab(c):
        """Average similarity of users who have taken this course."""
        sims = [sim_cache[uid] for uid, u2 in users_map.items() if c["id"] in u2["cursos_tomados"]]
        return sum(sims) / len(sims) if sims else 0.0

    # Pre-compute all scores once
    scores = {
        c["id"]: {
            "gustos": _content_gustos(c),
            "intereses": _content_intereses(c),
            "collab": _collab(c),
        }
        for c in candidatos
    }

    def _hibrido(c):
        s = scores[c["id"]]
        return 0.4 * s["intereses"] + 0.6 * s["collab"]

    # --- Según gustos (content on taken courses) ---
    segun_gustos = []
    if ids_tomados and taste_profile:
        ranked = sorted(candidatos, key=lambda c: -scores[c["id"]]["gustos"])
        segun_gustos = [_slim(c) for c in ranked if scores[c["id"]]["gustos"] > 0][:LIMIT]

    # --- Según perfil (collaborative) ---
    ranked_collab = sorted(candidatos, key=lambda c: -scores[c["id"]]["collab"])
    segun_perfil = [_slim(c) for c in ranked_collab if scores[c["id"]]["collab"] > 0][:LIMIT]

    # --- Híbrido ---
    ranked_hibrido = sorted(candidatos, key=lambda c: -_hibrido(c))
    hibrido = [_slim(c) for c in ranked_hibrido if _hibrido(c) > 0][:LIMIT]

    # Fallback: if no interests → hibrido becomes collab-only
    if not hibrido and segun_perfil:
        hibrido = segun_perfil[:LIMIT]

    # --- Populares (only when user has taken zero courses) ---
    populares = []
    if not ids_tomados:
        df_pop = execute_query(q.GET_CURSOS_POPULARES)
        for row in serialize(df_pop):
            populares.append({
                "id": row["id"],
                "titulo": row["titulo"],
                "descripcion": row.get("descripcion"),
                "categoria": row.get("categoria"),
                "duracion": row.get("duracion"),
            })

    return jsonify({
        "segun_gustos": segun_gustos,
        "segun_perfil": segun_perfil,
        "hibrido": hibrido,
        "populares": populares,
    })
