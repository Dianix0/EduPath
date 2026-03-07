from flask import Blueprint, jsonify
from db import execute_query, execute_command
from utils import serialize
import queries as q

gamificacion_bp = Blueprint("gamificacion", __name__, url_prefix="/api/gamificacion")

# ============================================================
# Constantes de reglas de negocio (fáciles de ajustar)
# ============================================================
PUNTOS_PRIMERA_INTERACCION = 10
PUNTOS_MITAD_PROGRESO = 25
PUNTOS_CURSO_COMPLETO = 75
PUNTOS_BONUS_CALIFICACION = 20
CALIFICACION_BONUS = 4.5

NIVELES = [
    (0,   1, "Principiante"),
    (100, 2, "Explorador"),
    (250, 3, "Aprendiz"),
    (500, 4, "Avanzado"),
    (800, 5, "Experto"),
]

INSIGNIAS = {
    "primer_curso":    "Completaste tu primer curso 🥇",
    "tres_cursos":     "Completaste 3 cursos 🔥",
    "perfeccionista":  "Obtuviste una calificación >= 4.8 🎯",
    "explorador_bd":   "Completaste 2 cursos de Bases de Datos 1 📚",
    "experto":         "Alcanzaste el nivel 5 🏆",
}

# ============================================================
# Utilidades internas
# ============================================================
def _calcular_nivel(puntos: int) -> dict:
    nivel_actual = NIVELES[0]
    for umbral, nivel, nombre in NIVELES:
        if puntos >= umbral:
            nivel_actual = (umbral, nivel, nombre)
    
    # Calcular progreso al siguiente nivel
    idx = nivel_actual[1] - 1
    if idx + 1 < len(NIVELES):
        siguiente = NIVELES[idx + 1]
        puntos_siguiente = siguiente[0]
        puntos_actuales_en_nivel = puntos - nivel_actual[0]
        puntos_necesarios = puntos_siguiente - nivel_actual[0]
        progreso_nivel = round(puntos_actuales_en_nivel / puntos_necesarios, 2)
    else:
        puntos_siguiente = None
        progreso_nivel = 1.0

    return {
        "nivel": nivel_actual[1],
        "nombre_nivel": nivel_actual[2],
        "puntos_siguiente_nivel": puntos_siguiente,
        "progreso_nivel": progreso_nivel,
    }


def _calcular_puntos_interaccion(progreso: float, calificacion: float, es_nueva: bool) -> int:
    puntos = 0
    if es_nueva:
        puntos += PUNTOS_PRIMERA_INTERACCION
    if progreso >= 0.5:
        puntos += PUNTOS_MITAD_PROGRESO
    if progreso >= 1.0:
        puntos += PUNTOS_CURSO_COMPLETO
    if calificacion and calificacion >= CALIFICACION_BONUS:
        puntos += PUNTOS_BONUS_CALIFICACION
    return puntos


def _verificar_insignias(estudiante_id: int, calificacion: float, nivel: int) -> list:
    insignias_ganadas = []

    # Insignias actuales
    df_actuales = execute_query(q.GET_INSIGNIAS_BY_ESTUDIANTE, (estudiante_id,))
    actuales = set(r["insignia"] for r in serialize(df_actuales))

    # Cursos completados totales
    df_completados = execute_query(q.GET_CURSOS_COMPLETADOS, (estudiante_id,))
    total_completados = serialize(df_completados)[0]["total"]

    # Cursos BD completados
    df_bd = execute_query(q.GET_CURSOS_COMPLETADOS_BD, (estudiante_id,))
    total_bd = serialize(df_bd)[0]["total"]

    # Evaluar cada insignia
    condiciones = {
        "primer_curso":   total_completados >= 1,
        "tres_cursos":    total_completados >= 3,
        "perfeccionista": calificacion is not None and calificacion >= 4.8,
        "explorador_bd":  total_bd >= 2,
        "experto":        nivel >= 5,
    }

    for insignia, condicion in condiciones.items():
        if condicion and insignia not in actuales:
            execute_command(q.INSERT_INSIGNIA, (estudiante_id, insignia))
            insignias_ganadas.append({
                "insignia": insignia,
                "descripcion": INSIGNIAS[insignia]
            })

    return insignias_ganadas


# ============================================================
# Endpoints
# ============================================================

@gamificacion_bp.post("/registrar-interaccion")
def registrar_interaccion():
    """
    Endpoint principal — llamar cada vez que un estudiante
    interactúa con un curso (al actualizar progreso o calificación).
    Recibe: { estudiante_id, curso_id, progreso, calificacion, es_nueva }
    """
    from flask import request
    data = request.get_json()

    estudiante_id = data["estudiante_id"]
    calificacion  = data.get("calificacion", 0)
    progreso      = data.get("progreso", 0)
    es_nueva      = data.get("es_nueva", False)

    # Obtener puntos actuales
    df_est = execute_query(q.GET_ESTUDIANTE_BY_ID, (estudiante_id,))
    if df_est.is_empty():
        return jsonify({"error": "Estudiante no encontrado"}), 404
    
    estudiante = serialize(df_est)[0]
    puntos_actuales = estudiante["puntos"]

    # Calcular nuevos puntos
    puntos_ganados = _calcular_puntos_interaccion(progreso, calificacion, es_nueva)
    nuevos_puntos = puntos_actuales + puntos_ganados

    # Calcular nivel
    info_nivel = _calcular_nivel(nuevos_puntos)
    nuevo_nivel = info_nivel["nivel"]

    # Actualizar estudiante
    execute_command(q.UPDATE_PUNTOS_NIVEL, (nuevos_puntos, nuevo_nivel, estudiante_id))

    # Verificar insignias
    insignias_ganadas = _verificar_insignias(estudiante_id, calificacion, nuevo_nivel)

    return jsonify({
        "puntos_ganados":   puntos_ganados,
        "puntos_totales":   nuevos_puntos,
        "nivel":            info_nivel,
        "insignias_ganadas": insignias_ganadas,
    })


@gamificacion_bp.get("/perfil/<int:estudiante_id>")
def perfil_gamificacion(estudiante_id):
    """
    Devuelve el perfil completo de gamificación de un estudiante.
    """
    df_est = execute_query(q.GET_ESTUDIANTE_BY_ID, (estudiante_id,))
    if df_est.is_empty():
        return jsonify({"error": "Estudiante no encontrado"}), 404

    estudiante = serialize(df_est)[0]
    puntos = estudiante["puntos"]
    info_nivel = _calcular_nivel(puntos)

    df_insignias = execute_query(q.GET_INSIGNIAS_BY_ESTUDIANTE, (estudiante_id,))
    insignias = [
        {
            "insignia": r["insignia"],
            "descripcion": INSIGNIAS.get(r["insignia"], "")
        }
        for r in serialize(df_insignias)
    ]

    df_interacciones = execute_query(q.GET_INTERACCIONES_BY_ESTUDIANTE, (estudiante_id,))
    cursos_en_progreso = [
        r for r in serialize(df_interacciones)
        if r["progreso"] < 1.0
    ]
    cursos_completados = [
        r for r in serialize(df_interacciones)
        if r["progreso"] >= 1.0
    ]

    return jsonify({
        "estudiante_id":      estudiante_id,
        "nombre":             estudiante["nombre"],
        "puntos":             puntos,
        "nivel":              info_nivel,
        "insignias":          insignias,
        "cursos_completados": len(cursos_completados),
        "cursos_en_progreso": len(cursos_en_progreso),
    })