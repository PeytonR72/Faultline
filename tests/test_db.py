from faultline import db


def test_insert_and_get_trace_roundtrip(fresh_db):
    trace_id = db.insert_trace(
        node_name="classify",
        input_state={"text": "hello"},
        output_state={"label": "positive"},
        start_time=1.0,
        end_time=1.05,
        latency_ms=50.0,
        success=True,
    )
    trace = db.get_trace(trace_id)
    assert trace["node_name"] == "classify"
    assert trace["success"] == 1
    assert trace["latency_ms"] == 50.0
    assert trace["error_type"] is None


def test_insert_failure_report_links_to_trace(fresh_db):
    trace_id = db.insert_trace(
        node_name="broken",
        input_state={},
        output_state=None,
        start_time=0.0,
        end_time=0.001,
        latency_ms=1.0,
        success=False,
        error_type="ValueError",
        error_message="boom",
        error_traceback="...",
    )
    db.insert_failure_report(
        trace_id=trace_id,
        report_json={
            "summary": "x",
            "likely_cause": "y",
            "suggested_fix": "z",
            "severity": "low",
        },
        error_summary="x",
        likely_cause="y",
        suggested_fix="z",
    )
    report = db.get_failure_report_for_trace(trace_id)
    assert report["error_summary"] == "x"
    assert report["likely_cause"] == "y"
    assert report["suggested_fix"] == "z"


def test_get_recent_traces_returns_in_descending_id_order(fresh_db):
    for name in ["alpha", "beta", "gamma"]:
        db.insert_trace(
            node_name=name,
            input_state={},
            output_state={},
            start_time=0.0,
            end_time=0.001,
            latency_ms=1.0,
            success=True,
        )
    rows = db.get_recent_traces(limit=10)
    assert [r["node_name"] for r in rows] == ["gamma", "beta", "alpha"]


def test_get_traces_for_node_filters_by_name(fresh_db):
    for name in ["alpha", "beta", "alpha"]:
        db.insert_trace(
            node_name=name,
            input_state={},
            output_state={},
            start_time=0.0,
            end_time=0.001,
            latency_ms=1.0,
            success=True,
        )
    alphas = db.get_traces_for_node("alpha")
    assert len(alphas) == 2
    assert all(r["node_name"] == "alpha" for r in alphas)
