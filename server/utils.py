from datetime import date, datetime
import polars as pl


def serialize(df: pl.DataFrame) -> list[dict]:
    """
    Convierte un Polars DataFrame a una lista de dicts JSON-serializable.
    Convierte objetos date/datetime a string ISO 8601.
    """
    records = df.to_dicts()
    for record in records:
        for key, value in record.items():
            if isinstance(value, (date, datetime)):
                record[key] = value.isoformat()
    return records
