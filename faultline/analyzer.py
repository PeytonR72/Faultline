import json
import os
import re

import anthropic
from dotenv import load_dotenv

from faultline import db

load_dotenv()

_DEFAULT_MODEL = "claude-sonnet-5-5"

# PROMPT TEMPLATE — keep stable so cache_control can warm across calls
_SYSTEM_PROMPT = """\
You are a LangGraph node failure analyst. Analyze the provided execution trace \
and respond with ONLY a valid JSON object — no markdown fences, no explanation, \
no text outside the JSON.

The JSON must contain exactly these keys:
- "summary": one sentence describing what went wrong
- "likely_cause": the most probable root cause
- "suggested_fix": a concrete, actionable fix
- "severity": exactly one of "low", "medium", "high", "critical"\
"""


def _parse_report(raw: str) -> dict:
    """Parse Claude's reply as a JSON object, tolerating code fences or stray prose."""
    text = raw.strip()
    candidates = [text]
    fenced = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL)
    if fenced:
        candidates.append(fenced.group(1).strip())
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end > start:
        candidates.append(text[start : end + 1])
    for candidate in candidates:
        try:
            parsed = json.loads(candidate)
        except json.JSONDecodeError:
            continue
        if isinstance(parsed, dict):
            return parsed
    raise ValueError("no JSON object found")


def analyze_failure(trace: dict) -> dict:
    client = anthropic.Anthropic()

    user_message = (
        f"Node name: {trace['node_name']}\n\n"
        f"Input state:\n{trace.get('input_state', 'N/A')}\n\n"
        f"Error type: {trace.get('error_type', 'Unknown')}\n"
        f"Error message: {trace.get('error_message', 'Unknown')}\n\n"
        f"Traceback:\n{trace.get('error_traceback', 'N/A')}"
    )

    message = client.messages.create(
        model=os.environ.get("FAULTLINE_MODEL", _DEFAULT_MODEL),
        max_tokens=1024,
        system=[
            {
                "type": "text",
                "text": _SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[{"role": "user", "content": user_message}],
    )

    raw = next((b.text for b in message.content if b.type == "text"), "")

    try:
        report = _parse_report(raw)
    except ValueError:
        report = {
            "summary": "Claude response could not be parsed as JSON",
            "likely_cause": "Claude did not return valid JSON",
            "suggested_fix": "Inspect the raw_response field and retry",
            "severity": "low",
            "raw_response": raw,
        }

    db.insert_failure_report(
        trace_id=trace["id"],
        report_json=report,
        error_summary=report.get("summary"),
        likely_cause=report.get("likely_cause"),
        suggested_fix=report.get("suggested_fix"),
    )

    return report
