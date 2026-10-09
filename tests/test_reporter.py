from faultline import reporter


def test_reporter_renders_without_error(capsys):
    trace = {"node_name": "n", "latency_ms": 1.5, "created_at": "now",
             "error_type": "ValueError", "error_message": "bad"}
    reporter.report_trace(trace)
    reporter.report_failure({"summary": "s", "likely_cause": "c",
                             "suggested_fix": "f", "severity": "critical"}, trace)
    reporter.report_analysis_unavailable(trace, RuntimeError("down"))
    out = capsys.readouterr().out
    assert "CRITICAL" in out and "AI analysis unavailable" in out
