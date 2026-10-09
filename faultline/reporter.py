from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text

_console = Console()

_SEVERITY_STYLES = {
    "low":      "bold green",
    "medium":   "bold yellow",
    "high":     "bold red",
    "critical": "bold red on white",
}


def report_failure(report: dict, trace: dict) -> None:
    severity = report.get("severity", "unknown").lower()
    badge_style = _SEVERITY_STYLES.get(severity, "bold white")
    node_name = trace.get("node_name", "unknown")

    title = Text()
    title.append(f" {node_name} ", style="bold")
    title.append("  ")
    title.append(f" {severity.upper()} ", style=badge_style)

    grid = Table.grid(padding=(0, 2))
    grid.add_column(style="bold dim", no_wrap=True)
    grid.add_column()
    grid.add_row("Summary",       report.get("summary", ""))
    grid.add_row("Likely cause",  report.get("likely_cause", ""))
    grid.add_row("Suggested fix", report.get("suggested_fix", ""))
    grid.add_row("Latency",       f"{trace.get('latency_ms', 0.0):.1f} ms")
    grid.add_row("Timestamp",     str(trace.get("created_at", "")))

    _console.print(Panel(grid, title=title, title_align="left", border_style="red"))


def report_trace(trace: dict) -> None:
    node_name = trace.get("node_name", "unknown")
    latency_ms = trace.get("latency_ms", 0.0)
    created_at = trace.get("created_at", "")

    _console.print(
        f"[bold green]+[/] [bold]{node_name}[/]"
        f"  [dim]{latency_ms:.1f} ms[/]"
        f"  [dim]{created_at}[/]"
    )


def report_analysis_unavailable(trace: dict, exc: Exception) -> None:
    node_name = trace.get("node_name", "unknown")
    _console.print(
        Panel(
            f"{trace.get('error_type')}: {trace.get('error_message')}\n\n"
            f"[dim]AI analysis unavailable ({type(exc).__name__}: {exc}). "
            "The trace was still recorded.[/]",
            title=Text(f" {node_name} ", style="bold"),
            title_align="left",
            border_style="yellow",
        )
    )
