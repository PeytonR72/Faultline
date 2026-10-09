from types import SimpleNamespace

import pytest

from faultline import analyzer, db

GOOD = '{"summary": "s", "likely_cause": "c", "suggested_fix": "f", "severity": "high"}'


@pytest.mark.parametrize(
    "raw",
    [GOOD, f"```json\n{GOOD}\n```", f"Here you go:\n{GOOD}\nHope that helps."],
)
def test_parse_report_tolerates_wrappers(raw):
    assert analyzer._parse_report(raw)["severity"] == "high"


@pytest.mark.parametrize("raw", ["", "not json", "[1, 2]"])
def test_parse_report_rejects_non_objects(raw):
    with pytest.raises(ValueError):
        analyzer._parse_report(raw)


def _fake_client(text, captured):
    class Messages:
        def create(self, **kwargs):
            captured.update(kwargs)
            return SimpleNamespace(content=[SimpleNamespace(type="text", text=text)])

    return lambda: SimpleNamespace(messages=Messages())


def _failed_trace():
    tid = db.insert_trace("n", {"x": 1}, None, 0.0, 1.0, 1000.0, False,
                          "ValueError", "bad", "tb")
    return db.get_trace(tid)


def test_analyze_failure_persists_report(fresh_db, monkeypatch):
    captured = {}
    monkeypatch.setattr("anthropic.Anthropic", _fake_client(f"```json\n{GOOD}\n```", captured))
    trace = _failed_trace()

    report = analyzer.analyze_failure(trace)

    assert report["summary"] == "s"
    assert captured["model"] == "claude-sonnet-5-5"
    stored = db.get_failure_report_for_trace(trace["id"])
    assert stored["likely_cause"] == "c"


def test_analyze_failure_falls_back_on_garbage(fresh_db, monkeypatch):
    monkeypatch.setattr("anthropic.Anthropic", _fake_client("nonsense", {}))
    report = analyzer.analyze_failure(_failed_trace())
    assert report["raw_response"] == "nonsense"


def test_model_env_override(fresh_db, monkeypatch):
    captured = {}
    monkeypatch.setenv("FAULTLINE_MODEL", "custom-model")
    monkeypatch.setattr("anthropic.Anthropic", _fake_client(GOOD, captured))
    analyzer.analyze_failure(_failed_trace())
    assert captured["model"] == "custom-model"
