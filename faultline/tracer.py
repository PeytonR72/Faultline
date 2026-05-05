import functools
import inspect
import time
import traceback
from typing import Any, Callable

from faultline import db

from faultline import analyzer
from faultline import reporter

db.init_db()


def wrap_node(node_name: str, node_fn: Callable) -> Callable:
    if inspect.iscoroutinefunction(node_fn):
        @functools.wraps(node_fn)
        async def async_wrapper(state: Any) -> Any:
            start_time = time.time()
            try:
                output = await node_fn(state)
                end_time = time.time()
                trace_id = db.insert_trace(
                    node_name=node_name,
                    input_state=state,
                    output_state=output,
                    start_time=start_time,
                    end_time=end_time,
                    latency_ms=(end_time - start_time) * 1000,
                    success=True,
                )
                reporter.report_trace(db.get_trace(trace_id))
                return output
            except Exception as exc:
                end_time = time.time()
                trace_id = db.insert_trace(
                    node_name=node_name,
                    input_state=state,
                    output_state=None,
                    start_time=start_time,
                    end_time=end_time,
                    latency_ms=(end_time - start_time) * 1000,
                    success=False,
                    error_type=type(exc).__name__,
                    error_message=str(exc),
                    error_traceback=traceback.format_exc(),
                )
                _trace = db.get_trace(trace_id)
                _report = analyzer.analyze_failure(_trace)
                reporter.report_failure(_report, _trace)
                raise

        return async_wrapper

    else:
        @functools.wraps(node_fn)
        def sync_wrapper(state: Any) -> Any:
            start_time = time.time()
            try:
                output = node_fn(state)
                end_time = time.time()
                trace_id = db.insert_trace(
                    node_name=node_name,
                    input_state=state,
                    output_state=output,
                    start_time=start_time,
                    end_time=end_time,
                    latency_ms=(end_time - start_time) * 1000,
                    success=True,
                )
                reporter.report_trace(db.get_trace(trace_id))
                return output
            except Exception as exc:
                end_time = time.time()
                trace_id = db.insert_trace(
                    node_name=node_name,
                    input_state=state,
                    output_state=None,
                    start_time=start_time,
                    end_time=end_time,
                    latency_ms=(end_time - start_time) * 1000,
                    success=False,
                    error_type=type(exc).__name__,
                    error_message=str(exc),
                    error_traceback=traceback.format_exc(),
                )
                _trace = db.get_trace(trace_id)
                _report = analyzer.analyze_failure(_trace)
                reporter.report_failure(_report, _trace)
                raise

        return sync_wrapper
