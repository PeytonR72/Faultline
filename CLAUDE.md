# Faultline

LangGraph execution tracer with AI-powered failure analysis. Wraps LangGraph graph nodes to capture execution traces, stores them in SQLite, and uses Claude to generate structured failure reports when nodes error or behave unexpectedly.

---

## Stack

- **Python 3.11+**
- **LangGraph** for graph construction and execution
- **LangChain Anthropic** for Claude integration on the LangGraph side
- **Anthropic SDK** for direct Claude API calls in failure analysis
- **SQLite** (via Python's built-in `sqlite3`) for trace and report persistence
- **Rich** for human-readable console output
- **python-dotenv** for environment variable loading

---

## Architecture

### Tracer Implementation
The tracer is implemented as **node-level wrappers** directly on the graph -- not as a LangChain callback handler. Each node in the graph is wrapped with a decorator/wrapper function that:
1. Captures node name, input state, output state, start time, end time, and latency
2. Catches any exceptions and records error type, message, and traceback
3. Writes the trace record to SQLite on every node execution (success or failure)

### Failure Analysis
When a node fails, Faultline sends the trace context to Claude via the Anthropic SDK for failure analysis. The analysis result is:
- Written to SQLite as a structured JSON report linked to the trace record
- Printed to the console using Rich with clear formatting (error summary, likely cause, suggested fix)

### Storage
All data goes to a local SQLite file (`faultline.db` in the project root). Two primary tables:
- `traces` -- one row per node execution (success or failure)
- `failure_reports` -- one row per Claude-generated failure analysis, foreign-keyed to a trace

---

## Project Structure

```
faultline/
├── faultline/
│   ├── __init__.py
│   ├── tracer.py        # Node wrapper logic
│   ├── db.py            # SQLite setup and queries
│   ├── analyzer.py      # Claude API calls for failure analysis
│   └── reporter.py      # Rich console output formatting
├── examples/
│   └── example_graph.py # Demo LangGraph graph using Faultline
├── tests/
├── .env
├── .claudeignore
├── requirements.txt
└── CLAUDE.md
```

---

## Environment Variables

```
ANTHROPIC_API_KEY=your_key_here
FAULTLINE_DB_PATH=faultline.db   # optional override
```

---

## Conventions

- All database access goes through `db.py` -- no raw SQL in other modules
- Node wrappers should be non-invasive: the wrapped node must behave identically to the unwrapped version from LangGraph's perspective
- Failure analysis prompts live in `analyzer.py` and should be clearly labeled as prompt templates
- Use `Rich` for all console output -- no bare `print()` calls except in tests
- Keep the tracer side-effect free on success: it records data but never mutates node input/output state
- Target LangGraph 0.2.x API -- note any breaking changes if upgrading

---

## Out of Scope (for now)

- Web dashboard or UI
- Remote trace storage
- Streaming trace output
- Multi-graph session tracking
