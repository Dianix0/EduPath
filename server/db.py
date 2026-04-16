import os
import mysql.connector
import polars as pl
from dotenv import load_dotenv

load_dotenv()


def _get_connection():
    return mysql.connector.connect(
        host=os.getenv("MYSQL_HOST"),
        user=os.getenv("MYSQL_USER"),
        password=os.getenv("MYSQL_PASSWORD"),
        database=os.getenv("MYSQL_DATABASE"),
        port=int(os.getenv("MYSQL_PORT", 3306)),
    )


def execute_query(query: str, params: tuple = None) -> pl.DataFrame:
    """
    Ejecuta una consulta SELECT y retorna los resultados como Polars DataFrame.
    """
    conn = _get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query, params or ())
        rows = cursor.fetchall()
        return pl.DataFrame(rows) if rows else pl.DataFrame()
    finally:
        cursor.close()
        conn.close()


def execute_command(query: str, params: tuple = None) -> dict:
    """
    Ejecuta un INSERT, UPDATE o DELETE.
    Retorna un dict con affected_rows y last_insert_id.
    """
    conn = _get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(query, params or ())
        conn.commit()
        return {
            "affected_rows": cursor.rowcount,
            "last_insert_id": cursor.lastrowid,
        }
    finally:
        cursor.close()
        conn.close()
