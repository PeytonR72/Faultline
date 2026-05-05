"""
Render the Faultline demo to an SVG suitable for embedding in the README.

Run from the project root:
    python examples/render_demo.py

This invokes the same working + failing graphs as example_graph.py, but
captures all Rich console output to assets/demo.svg instead of the terminal.
Requires ANTHROPIC_API_KEY because the failing graph triggers a real Claude
analysis call.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv()

from rich.console import Console

# Single recording console that everyone — faultline.reporter and the demo
# script alike — will write through, so the SVG captures everything.
recording = Console(record=True, width=110)

import faultline.reporter as reporter
reporter._console = recording

import example_graph as demo
demo.console = recording


if __name__ == "__main__":
    sample = {"text": "This is a great product, I absolutely love it!"}

    recording.rule("[bold green]Working Graph[/bold green]")
    result = demo.working_graph.invoke(sample)
    recording.print(f"\n[dim]Final state: {result}[/dim]\n")

    recording.rule("[bold red]Failing Graph[/bold red]")
    try:
        demo.failing_graph.invoke(sample)
    except Exception as exc:
        recording.print(
            f"\n[dim]Exception propagated as expected: "
            f"{type(exc).__name__}: {exc}[/dim]"
        )

    out_path = Path(__file__).parent.parent / "assets" / "demo.svg"
    out_path.parent.mkdir(exist_ok=True)
    recording.save_svg(str(out_path), title="Faultline demo")
    recording.print(f"\n[bold green]Saved[/] [dim]{out_path}[/]")
