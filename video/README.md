# Faultline demo video

Source for [`assets/faultline-demo.mp4`](../assets/faultline-demo.mp4): a 60-second, 1080p30 motion-graphics demo. It is built with [Remotion](https://www.remotion.dev) (React → frames) and finished with ffmpeg (web encode, poster frame). It ships silent; `SOUNDTRACK=1 npm run render` mixes in an optional procedural score.

```bash
cd video
npm install
npm run studio   # live preview in the browser
npm run render   # writes ../assets/faultline-demo.mp4 and the poster frame
```

Set `REMOTION_BROWSER=/path/to/chrome-headless-shell` to reuse an existing browser instead of letting Remotion download one.

## Structure

| File | Role |
| --- | --- |
| `src/Root.tsx` | Composition, scene lengths, transitions, font loading |
| `src/scenes.tsx` | The eight scenes: hook, reveal, instrument, trace, diagnose, engineered, architecture, outro |
| `src/components.tsx` | Background, titles, window chrome, the cracked `Faultline` logo |
| `src/theme.ts` | Palette, fonts and animation helpers |
| `scripts/soundtrack.sh` | Optional score synthesised with ffmpeg; hits are synced to scene cuts |
| `scripts/build.sh` | Render → (optional score) → H.264 faststart encode → poster |

If you change scene lengths in `Root.tsx`, update the `SWOOSH_AT` / `IMPACT_AT` times in `soundtrack.sh` to match.

## Story beats

| Time | Beat |
| --- | --- |
| 0–5 s | Hook: "Your agent just crashed. The stack trace tells you where. Not why." |
| 5–9 s | Reveal: the logo cracks along its own fault line |
| 9–16 s | One wrapper: a live diff adds `wrap_node` to an existing graph |
| 16–27 s | Trace: a graph runs, rows land in SQLite, `classify` breaks on run #2 |
| 27–38 s | Diagnose: trace → Claude → `failure_reports`; the Rich panel types out |
| 38–51 s | Engineering proof points and architecture |
| 51–60 s | Outro with the repo URL |

Fonts: Inter and JetBrains Mono (SIL Open Font License), bundled in `public/fonts`.
