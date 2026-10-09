import functools
import inspect
import time
import traceback
from typing import Any, Callable

from faultline import analyzer, db, reporter


def _record_success(node_name: str, state: Any, output: Any, start: float) -> None:
    end = time.time()
    trace_id = db.insert_trace(
        node_name=node_name,
        input_state=state,
        output_state=output,
        start_time=start,
        end_time=end,
        latency_ms=(end - start) * 1000,
        success=True,
    )
    reporter.report_trace(db.get_trace(trace_id))


def _record_failure(node_name: str, state: Any, exc: Exception, start: float) -> None:
    end = time.time()
    trace_id = db.insert_trace(
        node_name=node_name,
        input_state=state,
        output_state=None,
        start_time=start,
        end_time=end,
        latency_ms=(end - start) * 1000,
        success=False,
        error_type=type(exc).__name__,
        error_message=str(exc),
        error_traceback=traceback.format_exc(),
    )
    trace = db.get_trace(trace_id)
    # Analysis is best-effort: its failure must never replace the node's error.
    try:
        report = analyzer.analyze_failure(trace)
    except Exception as analysis_exc:
        reporter.report_analysis_unavailable(trace, analysis_exc)
        return
    reporter.report_failure(report, trace)


def wrap_node(node_name: str, node_fn: Callable) -> Callable:
    db.init_db()

    if inspect.iscoroutinefunction(node_fn):
        @functools.wraps(node_fn)
        async def async_wrapper(state: Any) -> Any:
            start = time.time()
            try:
                output = await node_fn(state)
            except Exception as exc:
                _record_failure(node_name, state, exc, start)
                raise
            _record_success(node_name, state, output, start)
            return output

        return async_wrapper

    @functools.wraps(node_fn)
    def sync_wrapper(state: Any) -> Any:
        start = time.time()
        try:
            output = node_fn(state)
        except Exception as exc:
            _record_failure(node_name, state, exc, start)
            raise
        _record_success(node_name, state, output, start)
        return output

    return sync_wrapper
