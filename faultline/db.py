import json
import os
import sqlite3
from typing import Any, Optional

_DB_PATH = os.environ.get("FAULTLINE_DB_PATH", "faultline.db")


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _connect() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS traces (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                node_name       TEXT    NOT NULL,
                input_state     TEXT,
                output_state    TEXT,
                start_time      REAL    NOT NULL,
                end_time        REAL    NOT NULL,
                latency_ms      REAL    NOT NULL,
                success         INTEGER NOT NULL DEFAULT 1,
                error_type      TEXT,
                error_message   TEXT,
                error_traceback TEXT,
                created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS failure_reports (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                trace_id      INTEGER NOT NULL REFERENCES traces(id),
                report_json   TEXT    NOT NULL,
                error_summary TEXT,
                likely_cause  TEXT,
                suggested_fix TEXT,
                created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
            );
        """)


def insert_trace(
    node_name: str,
    input_state: Any,
    output_state: Any,
    start_time: float,
    end_time: float,
    latency_ms: float,
    success: bool,
    error_type: Optional[str] = None,
    error_message: Optional[str] = None,
    error_traceback: Optional[str] = None,
) -> int:
    with _connect() as conn:
        cursor = conn.execute(
            """
            INSERT INTO traces (
                node_name, input_state, output_state,
                start_time, end_time, latency_ms, success,
                error_type, error_message, error_traceback
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                node_name,
                json.dumps(input_state, default=str),
                json.dumps(output_state, default=str) if output_state is not None else None,
                start_time,
                end_time,
                latency_ms,
                int(success),
                error_type,
                error_message,
                error_traceback,
            ),
        )
        return cursor.lastrowid


def insert_failure_report(
    trace_id: int,
    report_json: dict,
    error_summary: Optional[str] = None,
    likely_cause: Optional[str] = None,
    suggested_fix: Optional[str] = None,
) -> int:
    with _connect() as conn:
        cursor = conn.execute(
            """
            INSERT INTO failure_reports (
                trace_id, report_json, error_summary, likely_cause, suggested_fix
            ) VALUES (?, ?, ?, ?, ?)
            """,
            (
                trace_id,
                json.dumps(report_json, default=str),
                error_summary,
                likely_cause,
                suggested_fix,
            ),
        )
        return cursor.lastrowid


def get_trace(trace_id: int) -> Optional[dict]:
    with _connect() as conn:
        row = conn.execute(
            "SELECT * FROM traces WHERE id = ?", (trace_id,)
        ).fetchone()
        return dict(row) if row else None


def get_failure_report_for_trace(trace_id: int) -> Optional[dict]:
    with _connect() as conn:
        row = conn.execute(
            "SELECT * FROM failure_reports WHERE trace_id = ?", (trace_id,)
        ).fetchone()
        return dict(row) if row else None


def get_recent_traces(limit: int = 50) -> list[dict]:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM traces ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
        return [dict(r) for r in rows]


def get_traces_for_node(node_name: str) -> list[dict]:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM traces WHERE node_name = ? ORDER BY id DESC",
            (node_name,),
        ).fetchall()
        return [dict(r) for r in rows]
