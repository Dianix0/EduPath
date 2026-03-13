import os
import requests
from db import execute_query, execute_command
import queries as q

MOODLE_URL   = os.getenv("MOODLE_URL", "").rstrip("/")
MOODLE_TOKEN = os.getenv("MOODLE_WS_TOKEN", "")

def _ws(function, **params):
    """Llama a una función del Web Service de Moodle."""
    url = f"{MOODLE_URL}/webservice/rest/server.php"
    payload = {
        "wstoken": MOODLE_TOKEN,
        "wsfunction": function,
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


def sincronizar_cursos_estudiante(estudiante_id, moodle_user_id):
    """
    Consulta los cursos inscritos del estudiante en Moodle
    y sincroniza sus interacciones en la BD de EduPath.
    """
    cursos_moodle = _ws("core_enrol_get_users_courses", userid=moodle_user_id)
    if not cursos_moodle:
        print(f"Sync: no se obtuvieron cursos para moodle_user_id={moodle_user_id}")
        return

    sincronizados = 0
    for curso_m in cursos_moodle:
        moodle_course_id = curso_m.get("id")
        last_access      = curso_m.get("lastaccess")    # timestamp unix o null
        completed        = curso_m.get("completed", False)
        progress         = curso_m.get("progress")      # float 0-100 o null

        # Buscar el curso en BD de EduPath por idnumber (que coincide con id de Moodle)
        df_curso = execute_query(q.GET_CURSO_BY_MOODLE_ID, (str(moodle_course_id),))
        if df_curso.is_empty():
            continue  # Curso de Moodle no existe en EduPath, saltar

        curso_id = df_curso.row(0, named=True)["id"]

        # Calcular progreso normalizado (0.0 a 1.0)
        if completed:
            progreso_norm = 1.0
        elif progress is not None:
            progreso_norm = round(progress / 100, 4)
        else:
            progreso_norm = 0.0

        # Fecha última actividad
        import datetime
        if last_access:
            fecha = datetime.datetime.fromtimestamp(last_access).strftime("%Y-%m-%d %H:%M:%S")
        else:
            fecha = None

        # Verificar si ya existe la interacción
        df_inter = execute_query(q.GET_INTERACCION_BY_IDS, (estudiante_id, curso_id))

        if df_inter.is_empty():
            if progreso_norm > 0 or fecha:
                execute_command(q.INSERT_INTERACCION, (
                    estudiante_id, curso_id, 0, progreso_norm, 0, fecha
                ))
                sincronizados += 1
        else:
            interaccion = df_inter.row(0, named=True)
            # Solo actualizar si Moodle tiene datos más recientes
            if progreso_norm > (interaccion.get("progreso") or 0):
                execute_command(q.UPDATE_INTERACCION, (
                    interaccion.get("calificacion") or 0,
                    progreso_norm,
                    interaccion.get("tiempo_visualizacion") or 0,
                    fecha,
                    estudiante_id,
                    curso_id,
                ))
                sincronizados += 1

    # Recalcular puntos y nivel del estudiante
        df_est = execute_query(q.GET_ESTUDIANTE_BY_ID, (estudiante_id,))
        if not df_est.is_empty():
            from utils import serialize
            estudiante = serialize(df_est)[0]
            puntos = estudiante["puntos"] or 0
            
            # Recalcular nivel según puntos actuales
            NIVELES = [
                (0,   1, "Principiante"),
                (100, 2, "Explorador"),
                (250, 3, "Aprendiz"),
                (500, 4, "Avanzado"),
                (800, 5, "Experto"),
            ]
            nivel_actual = 1
            for umbral, nivel, _ in NIVELES:
                if puntos >= umbral:
                    nivel_actual = nivel
            
            execute_command(q.UPDATE_PUNTOS_NIVEL, (puntos, nivel_actual, estudiante_id))
    print(f"Sync Moodle: {sincronizados} interacciones actualizadas para estudiante {estudiante_id}")