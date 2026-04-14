import os
import datetime
import requests
from db import execute_query, execute_command
from utils import serialize
import queries as q

MOODLE_URL   = os.getenv("MOODLE_URL", "").rstrip("/")
MOODLE_TOKEN = os.getenv("MOODLE_WS_TOKEN", "")

# ── Reglas de gamificación (deben coincidir con gamificacion.py) ──────────────
PUNTOS_PRIMERA_INTERACCION = 10
PUNTOS_MITAD_PROGRESO      = 25
PUNTOS_CURSO_COMPLETO      = 75
PUNTOS_BONUS_CALIFICACION  = 20
CALIFICACION_BONUS         = 4.8

NIVELES = [
    (0,   1, "Principiante"),
    (100, 2, "Explorador"),
    (250, 3, "Aprendiz"),
    (500, 4, "Avanzado"),
    (800, 5, "Experto"),
]


def _ws(function, **params):
    """Llama a una función del Web Service de Moodle."""
    url = f"{MOODLE_URL}/webservice/rest/server.php"
    payload = {
        "wstoken":            MOODLE_TOKEN,
        "wsfunction":         function,
        "moodlewsrestformat": "json",
        **params
    }
    try:
        r = requests.post(url, data=payload, timeout=10)
        data = r.json()
        if isinstance(data, dict) and "exception" in data:
            print(f"Moodle WS error [{function}]: {data.get('message')}")
            return None
        return data
    except Exception as e:
        print(f"Moodle WS exception [{function}]: {e}")
        return None


def _calcular_nivel(puntos: int) -> int:
    """Devuelve el número de nivel según los puntos."""
    nivel = 1
    for umbral, n, _ in NIVELES:
        if puntos >= umbral:
            nivel = n
    return nivel


def _calcular_puntos_nuevos(
    progreso_anterior: float,
    progreso_nuevo: float,
    calificacion: float,
    es_nueva: bool
) -> int:
    """
    Calcula los puntos a sumar comparando el progreso anterior con el nuevo.
    Evita sumar puntos duplicados si el estudiante ya había alcanzado ese hito.
    """
    puntos = 0

    # Primera vez que interactúa con el curso
    if es_nueva:
        puntos += PUNTOS_PRIMERA_INTERACCION

    # Llegó al 50% (y antes no había llegado)
    if progreso_nuevo >= 0.5 and progreso_anterior < 0.5:
        puntos += PUNTOS_MITAD_PROGRESO

    # Completó el curso (y antes no estaba completado)
    if progreso_nuevo >= 1.0 and progreso_anterior < 1.0:
        puntos += PUNTOS_CURSO_COMPLETO

    # Bonus por calificación alta (solo al completar)
    if progreso_nuevo >= 1.0 and calificacion and calificacion >= CALIFICACION_BONUS:
        puntos += PUNTOS_BONUS_CALIFICACION

    return puntos


def _verificar_insignias(estudiante_id: int, calificacion: float, nivel: int):
    """Verifica y otorga insignias que el estudiante haya desbloqueado."""
    df_actuales = execute_query(q.GET_INSIGNIAS_BY_ESTUDIANTE, (estudiante_id,))
    actuales    = set(r["insignia"] for r in serialize(df_actuales))

    df_completados    = execute_query(q.GET_CURSOS_COMPLETADOS, (estudiante_id,))
    total_completados = serialize(df_completados)[0]["total"]

    df_bd    = execute_query(q.GET_CURSOS_COMPLETADOS_BD, (estudiante_id,))
    total_bd = serialize(df_bd)[0]["total"]

    condiciones = {
        "primer_curso":   total_completados >= 1,
        "tres_cursos":    total_completados >= 3,
        "perfeccionista": calificacion is not None and calificacion >= 4.75,
        "explorador_bd":  total_bd >= 2,
        "experto":        nivel >= 5,
    }

    for insignia, condicion in condiciones.items():
        if condicion and insignia not in actuales:
            execute_command(q.INSERT_INSIGNIA, (estudiante_id, insignia))
            print(f"  Insignia desbloqueada: {insignia} para estudiante {estudiante_id}")


def _obtener_calificacion_curso(moodle_user_id, moodle_course_id):
    """Obtiene la calificación final del curso (sobre la escala configurada en Moodle)."""
    grades = _ws("local_edupath_get_grades",
                 courseid=moodle_course_id,
                 userid=moodle_user_id)
    if not grades:
        return 0.0
    for g in grades:
        if g.get("item_type") == "course" and g.get("final_grade", -1) >= 0:
            print(f"  DEBUG calificacion curso: {g.get('final_grade')} para user={moodle_user_id} course={moodle_course_id}")
            return g["final_grade"]  # nota cruda, no porcentaje
    return 0.0

def sincronizar_cursos_estudiante(estudiante_id, moodle_user_id):
    """
    Consulta los cursos inscritos del estudiante en Moodle,
    sincroniza sus interacciones en la BD de EduPath
    y actualiza puntos de gamificación según el progreso nuevo.
    """
    cursos_moodle = _ws("core_enrol_get_users_courses", userid=moodle_user_id)
    if not cursos_moodle:
        print(f"Sync: no se obtuvieron cursos para moodle_user_id={moodle_user_id}")
        return

    # Obtener datos actuales del estudiante
    df_est = execute_query(q.GET_ESTUDIANTE_BY_ID, (estudiante_id,))
    if df_est.is_empty():
        return
    estudiante     = serialize(df_est)[0]
    puntos_totales = estudiante["puntos"] or 0
    ultima_calificacion = 0

    sincronizados = 0

    for curso_m in cursos_moodle:
        moodle_course_id = curso_m.get("id")
        last_access      = curso_m.get("lastaccess")
        completed        = curso_m.get("completed", False)
        progress         = curso_m.get("progress")

        # Buscar el curso en BD de EduPath por moodle_id
        df_curso = execute_query(q.GET_CURSO_BY_MOODLE_ID, (int(moodle_course_id),))
        if df_curso.is_empty():
            continue

        curso_id = df_curso.row(0, named=True)["id"]

        # Calcular progreso normalizado (0.0 a 1.0)
        if completed:
            progreso_norm = 1.0
        elif progress is not None:
            progreso_norm = round(progress / 100, 4)
        else:
            progreso_norm = 0.0

        # Fecha última actividad
        if last_access:
            fecha = datetime.datetime.fromtimestamp(last_access).strftime("%Y-%m-%d %H:%M:%S")
        else:
            fecha = None

        # Verificar si ya existe la interacción
        df_inter = execute_query(q.GET_INTERACCION_BY_IDS, (estudiante_id, curso_id))
        es_nueva = df_inter.is_empty()

        if es_nueva:
            # Nueva interacción — solo registrar si hay actividad
            if progreso_norm > 0 or fecha:
                pct_calificacion = _obtener_calificacion_curso(moodle_user_id, moodle_course_id)
                execute_command(q.INSERT_INTERACCION, (
                    estudiante_id, curso_id, pct_calificacion, progreso_norm, 0, fecha
                ))
                progreso_anterior = 0.0

                puntos_nuevos   = _calcular_puntos_nuevos(progreso_anterior, progreso_norm, pct_calificacion, True)
                puntos_totales += puntos_nuevos
                if puntos_nuevos > 0:
                    print(f"  +{puntos_nuevos} pts (nueva interacción curso {curso_id})")
                sincronizados += 1

        else:
            interaccion       = df_inter.row(0, named=True)
            progreso_anterior = interaccion.get("progreso") or 0.0
            calificacion      = interaccion.get("calificacion") or 0.0
            # Obtener calificación SIEMPRE, no solo cuando hay cambios
            pct_calificacion  = _obtener_calificacion_curso(moodle_user_id, moodle_course_id)

            # Actualizar ultima_calificacion SIEMPRE
            if pct_calificacion > 0:
                ultima_calificacion = max(ultima_calificacion, pct_calificacion)

            sin_puntos = (puntos_totales == 0 and progreso_anterior >= 1.0)

            if progreso_norm > progreso_anterior or sin_puntos:
                if progreso_norm > progreso_anterior:
                    execute_command(q.UPDATE_INTERACCION, (
                        calificacion,
                        progreso_norm,
                        interaccion.get("tiempo_visualizacion") or 0,
                        fecha,
                        estudiante_id,
                        curso_id,
                    ))

                prog_anterior_efectivo = 0.0 if sin_puntos else progreso_anterior
                puntos_nuevos   = _calcular_puntos_nuevos(
                    prog_anterior_efectivo, progreso_norm, pct_calificacion, sin_puntos
                )
                puntos_totales += puntos_nuevos
                if puntos_nuevos > 0:
                    print(f"  +{puntos_nuevos} pts (progreso {prog_anterior_efectivo:.0%} → {progreso_norm:.0%} en curso {curso_id})")
                sincronizados += 1

            
    # Recalcular nivel con los puntos finales
    nivel_nuevo = _calcular_nivel(puntos_totales)
    execute_command(q.UPDATE_PUNTOS_NIVEL, (puntos_totales, nivel_nuevo, estudiante_id))

    # Verificar insignias desbloqueadas
    print(f"  DEBUG verificar insignias con calificacion={ultima_calificacion} nivel={nivel_nuevo}")
    _verificar_insignias(estudiante_id, ultima_calificacion, nivel_nuevo)

    print(f"Sync Moodle: {sincronizados} interacciones actualizadas para estudiante {estudiante_id} | Puntos: {puntos_totales} | Nivel: {nivel_nuevo}")
