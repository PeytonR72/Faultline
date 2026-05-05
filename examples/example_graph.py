"""
End-to-end Faultline demo.

Run from the project root:
    python examples/example_graph.py
"""
import sys
from pathlib import Path

# Make `faultline` importable when the script is run directly.
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv()

from typing import TypedDict

from langgraph.graph import StateGraph, END
from rich.console import Console

from faultline import wrap_node

console = Console()


# ── State schema ─────────────────────────────────────────────────────────────

class GraphState(TypedDict):
    text: str
    tokens: list[str]
    label: str
    summary: str


# ── Node implementations ──────────────────────────────────────────────────────

def preprocess(state: GraphState) -> dict:
    text = state["text"].strip().lower()
    return {"text": text, "tokens": text.split()}


def classify(state: GraphState) -> dict:
    tokens = state.get("tokens", [])
    positive = {"good", "great", "excellent", "love", "happy", "amazing"}
    negative = {"bad", "terrible", "hate", "awful", "sad", "broken"}
    pos = sum(1 for t in tokens if t in positive)
    neg = sum(1 for t in tokens if t in negative)
    label = "positive" if pos > neg else "negative" if neg > pos else "neutral"
    return {"label": label}


def summarize(state: GraphState) -> dict:
    n = len(state.get("tokens", []))
    label = state.get("label", "unknown")
    return {"summary": f"{n} tokens | sentiment: {label}"}


def broken_node(state: GraphState) -> dict:
    # Intentional failure: simulates a node that expects a key absent from state.
    raise ValueError(
        f"classify_v2 requires a 'language' key in state, "
        f"but received keys: {sorted(state.keys())}"
    )


# ── Graph builders ────────────────────────────────────────────────────────────

def _base_graph() -> StateGraph:
    g = StateGraph(GraphState)
    g.add_node("preprocess", wrap_node("preprocess", preprocess))
    g.add_node("summarize",  wrap_node("summarize",  summarize))
    g.add_edge("summarize", END)
    return g


def build_working_graph():
    g = _base_graph()
    g.add_node("classify", wrap_node("classify", classify))
    g.set_entry_point("preprocess")
    g.add_edge("preprocess", "classify")
    g.add_edge("classify",   "summarize")
    return g.compile()


def build_failing_graph():
    g = _base_graph()
    g.add_node("classify", wrap_node("classify", broken_node))
    g.set_entry_point("preprocess")
    g.add_edge("preprocess", "classify")
    g.add_edge("classify",   "summarize")
    return g.compile()


working_graph = build_working_graph()
failing_graph = build_failing_graph()


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    sample = {"text": "This is a great product, I absolutely love it!"}

    console.rule("[bold green]Working Graph[/bold green]")
    result = working_graph.invoke(sample)
    console.print(f"\n[dim]Final state: {result}[/dim]\n")

    console.rule("[bold red]Failing Graph[/bold red]")
    try:
        failing_graph.invoke(sample)
    except Exception as exc:
        console.print(
            f"\n[dim]Exception propagated as expected: "
            f"{type(exc).__name__}: {exc}[/dim]"
        )
