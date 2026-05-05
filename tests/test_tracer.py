import asyncio

import pytest

from faultline import db, tracer


def _silence_reporter(monkeypatch):
    monkeypatch.setattr("faultline.reporter.report_trace", lambda _trace: None)
    monkeypatch.setattr("faultline.reporter.report_failure", lambda _r, _t: None)


def _stub_analyzer(monkeypatch):
    monkeypatch.setattr(
        "faultline.analyzer.analyze_failure",
        lambda trace: {
            "summary": "stub",
            "likely_cause": "stub",
            "suggested_fix": "stub",
            "severity": "low",
        },
    )


def test_sync_node_success_returns_output_and_records_trace(fresh_db, monkeypatch):
    _silence_reporter(monkeypatch)

    def my_node(state):
        return {"doubled": state["x"] * 2}

    wrapped = tracer.wrap_node("my_node", my_node)
    result = wrapped({"x": 5})

    assert result == {"doubled": 10}
    rows = db.get_traces_for_node("my_node")
    assert len(rows) == 1
    assert rows[0]["success"] == 1
    assert rows[0]["error_type"] is None


def test_sync_node_failure_records_error_and_reraises(fresh_db, monkeypatch):
    _silence_reporter(monkeypatch)
    _stub_analyzer(monkeypatch)

    def broken(_state):
        raise RuntimeError("nope")

    wrapped = tracer.wrap_node("broken", broken)

    with pytest.raises(RuntimeError, match="nope"):
        wrapped({"x": 1})

    rows = db.get_traces_for_node("broken")
    assert len(rows) == 1
    assert rows[0]["success"] == 0
    assert rows[0]["error_type"] == "RuntimeError"
    assert "nope" in rows[0]["error_message"]


def test_async_node_success(fresh_db, monkeypatch):
    _silence_reporter(monkeypatch)

    async def my_async(_state):
        return {"async_ran": True}

    wrapped = tracer.wrap_node("my_async", my_async)
    result = asyncio.run(wrapped({"x": 1}))

    assert result == {"async_ran": True}
    rows = db.get_traces_for_node("my_async")
    assert len(rows) == 1
    assert rows[0]["success"] == 1


def test_wrapper_does_not_mutate_input_state(fresh_db, monkeypatch):
    _silence_reporter(monkeypatch)

    def my_node(_state):
        return {"new_key": 1}

    state = {"x": 5, "y": 10}
    state_snapshot = dict(state)

    wrapped = tracer.wrap_node("my_node", my_node)
    wrapped(state)

    assert state == state_snapshot


def test_wrapper_preserves_original_exception_type(fresh_db, monkeypatch):
    _silence_reporter(monkeypatch)
    _stub_analyzer(monkeypatch)

    class MyCustomError(Exception):
        pass

    def broken(_state):
        raise MyCustomError("custom")

    wrapped = tracer.wrap_node("broken", broken)

    with pytest.raises(MyCustomError):
        wrapped({})
