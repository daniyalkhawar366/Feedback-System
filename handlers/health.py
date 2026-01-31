from db.db import check_db_connection

def check_health() -> dict:
    return {"status":"ok"}

def check_db_health() -> dict:
    check_db_connection()
    return {"status":"db is live"}