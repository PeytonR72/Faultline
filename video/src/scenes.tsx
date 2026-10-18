import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {FaultLogo, Pill, SceneTitle, Window, progress} from './components';
import {C, MONO, SANS, clamp, ease, enter, gradientText, typed} from './theme';

const center: React.CSSProperties = {justifyContent: 'center', alignItems: 'center'};

// ═════════════════════════════════════════════════════════════════════════════
// 1 · HOOK — open on the pain, in motion, inside the first second
// ═════════════════════════════════════════════════════════════════════════════

const TRACE_LINES = [
  'Traceback (most recent call last):',
  '  File "langgraph/pregel/__init__.py", line 1573, in invoke',
  '    for chunk in self.stream(',
  '  File "langgraph/pregel/__init__.py", line 1276, in stream',
  '    for _ in runner.tick(',
  '  File "langgraph/pregel/runner.py", line 58, in tick',
  '    run_with_retry(t, retry_policy)',
  '  File "langgraph/pregel/retry.py", line 29, in run_with_retry',
  '    task.proc.invoke(task.input, config)',
  '  File "langgraph/utils/runnable.py", line 410, in invoke',
  '    input = context.run(step.invoke, input, config, **kwargs)',
  '  File "langgraph/utils/runnable.py", line 184, in invoke',
  '    ret = context.run(self.func, input, **kwargs)',
  '  File "agents/pipeline.py", line 88, in classify_v2',
  '    lang = state["language"]',
  "KeyError: 'language'",
  'During handling of the above exception, another exception occurred:',
  "ValueError: classify_v2 requires a 'language' key in state",
];

const Glitch: React.FC<{text: string; start: number; size: number; color?: string}> = ({
  text,
  start,
  size,
  color = C.text,
}) => {
  const frame = useCurrentFrame();
  const local = frame - start;
  const active = local >= 0 && local < 16;
  const jx = active ? (random(`gx${frame}`) - 0.5) * 22 : 0;
  const jy = active ? (random(`gy${frame}`) - 0.5) * 8 : 0;
  const split = active ? 6 + random(`s${frame}`) * 8 : 0;
  const slice = active && random(`c${frame}`) > 0.5 ? random(`h${frame}`) * 80 : -1;
  return (
    <div
      style={{
        ...enter(frame, start, 10, 0),
        filter: 'none',
        fontFamily: SANS,
        fontWeight: 800,
        fontSize: size,
        letterSpacing: -size * 0.04,
        color,
        transform: `translate(${jx}px, ${jy}px)`,
        textShadow: `${split}px 0 rgba(255,77,94,0.85), ${-split}px 0 rgba(92,200,255,0.85)`,
        clipPath: slice >= 0 ? `inset(${slice}% 0 ${Math.max(0, 80 - slice)}% 0)` : undefined,
      }}
    >
      {text}
    </div>
  );
};

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const scroll = frame * 9;
  const lines = Array.from({length: 60}, (_, i) => TRACE_LINES[i % TRACE_LINES.length]);
  const flash = interpolate(frame, [0, 6], [0.5, 0], clamp);
  const lift = interpolate(frame, [52, 70], [0, -70], {...clamp, easing: ease});
  return (
    <AbsoluteFill style={center}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          opacity: 0.22,
          maskImage: 'linear-gradient(transparent, black 25%, black 75%, transparent)',
          WebkitMaskImage: 'linear-gradient(transparent, black 25%, black 75%, transparent)',
        }}
      >
        <div
          style={{
            padding: '0 120px',
            transform: `rotate(-4deg) scale(1.15) translateY(${-200 - (scroll % 1300)}px)`,
            fontFamily: MONO,
            fontSize: 26,
            lineHeight: 1.6,
            whiteSpace: 'pre',
          }}
        >
          {[...lines, ...lines].map((l, i) => (
            <div key={i} style={{color: /Error/.test(l) ? C.red : C.dim}}>
              {l}
            </div>
          ))}
        </div>
      </div>
      <AbsoluteFill style={{background: C.red, opacity: flash}} />
      <div style={{textAlign: 'center', transform: `translateY(${lift}px)`}}>
        <Glitch text="Your agent just crashed." start={2} size={112} />
        <div style={{...enter(frame, 58, 20), fontFamily: SANS, fontSize: 54, fontWeight: 600, color: C.dim, marginTop: 34}}>
          The stack trace tells you <span style={{color: C.text, fontFamily: MONO}}>where</span>.
        </div>
        <div style={{marginTop: 26}}>
          <Glitch text="Not why." start={96} size={84} color={C.red} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// 2 · REVEAL — the name, split by its own fault line
// ═════════════════════════════════════════════════════════════════════════════

export const Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const glow = interpolate(frame, [18, 30, 90], [0, 1, 0.4], clamp);
  return (
    <AbsoluteFill style={{...center, flexDirection: 'column'}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(600px 300px at 50% 46%, rgba(255,77,94,${0.25 * glow}), transparent 70%)`,
        }}
      />
      <FaultLogo size={230} crackAt={18} />
      <div style={{...enter(frame, 42, 24), fontFamily: SANS, fontWeight: 700, fontSize: 76, letterSpacing: -2, color: C.text, marginTop: 30}}>
        tells you <span style={gradientText(C.red, C.orange)}>why.</span>
      </div>
      <div style={{...enter(frame, 70, 24), fontFamily: SANS, fontSize: 32, color: C.dim, marginTop: 26}}>
        Execution tracing + AI root-cause analysis for LangGraph agents
      </div>
    </AbsoluteFill>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// 3 · INSTRUMENT — one wrapper, shown as a live diff
// ═════════════════════════════════════════════════════════════════════════════

type Seg = [string, string, boolean?]; // text, color, inserted?
const K = '#c792ea';
const S = '#c3e88d';
const F = '#82aaff';
const P = C.text;
const D = C.dim;

const addNode = (name: string, pad: string): Seg[] => [
  ['graph', P],
  ['.', D],
  ['add_node', F],
  ['(', D],
  [`"${name}"`, S],
  [`,${pad} `, D],
  ['wrap_node', F, true],
  ['(', D, true],
  [`"${name}"`, S, true],
  [', ', D, true],
  [name, P],
  [')', D, true],
  [')', D],
];

const CODE: {segs: Seg[]; inserted?: boolean}[] = [
  {segs: [['from', K], [' langgraph.graph ', P], ['import', K], [' StateGraph, END', P]]},
  {segs: [['from', K], [' faultline ', P], ['import', K], [' wrap_node', F]], inserted: true},
  {segs: []},
  {segs: [['graph', P], [' = ', D], ['StateGraph', F], ['(GraphState)', D]]},
  {segs: addNode('preprocess', '')},
  {segs: addNode('classify', '  ')},
  {segs: addNode('summarize', ' ')},
  {segs: []},
  {segs: [['graph', P], ['.', D], ['compile', F], ['().', D], ['invoke', F], ['(', D], ['{"text": "I love this product"}', S], [')', D]]},
];

export const Instrument: React.FC = () => {
  const frame = useCurrentFrame();
  const importIn = progress(frame, 70, 88);
  return (
    <AbsoluteFill>
      <SceneTitle label="01 · Instrument" title="One wrapper. Zero rewrites." sub="Wrap any LangGraph node. It behaves exactly the same." />
      <div style={{position: 'absolute', top: 330, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <Window title="graph.py" width={1320} style={enter(frame, 14, 26, 60)}>
          <div style={{padding: '26px 0', fontFamily: MONO, fontSize: 27, lineHeight: '46px'}}>
            {CODE.map((line, li) => {
              const lineIn = enter(frame, 22 + li * 4, 16, 12);
              const isIns = line.inserted;
              // Each add_node line receives its wrap_node insert in turn.
              const insStart = 96 + (li - 4) * 18;
              let insertBudget = typed(frame, insStart, 60, 999);
              const hasIns = line.segs.some((s) => s[2]);
              const hl = isIns ? importIn : hasIns ? progress(frame, insStart, insStart + 10) : 0;
              return (
                <div
                  key={li}
                  style={{
                    ...lineIn,
                    display: 'flex',
                    height: isIns ? 46 * importIn : 46,
                    overflow: 'hidden',
                    background: hl ? `rgba(61,220,151,${0.11 * hl})` : undefined,
                    boxShadow: hl ? `inset 4px 0 0 rgba(61,220,151,${hl})` : undefined,
                  }}
                >
                  <span style={{width: 70, textAlign: 'right', paddingRight: 24, color: hl ? C.green : C.faint}}>
                    {hl > 0.5 ? '+' : li + 1}
                  </span>
                  <span style={{whiteSpace: 'pre'}}>
                    {line.segs.map(([t, col, ins], si) => {
                      if (!ins) return <span key={si} style={{color: col}}>{t}</span>;
                      const shown = t.slice(0, Math.max(0, insertBudget));
                      insertBudget -= t.length;
                      return (
                        <span key={si} style={{color: col, background: 'rgba(61,220,151,0.16)', borderRadius: 4}}>
                          {shown}
                        </span>
                      );
                    })}
                    {hasIns && frame >= insStart && frame < insStart + 22 && (
                      <span style={{color: C.green, opacity: frame % 10 < 6 ? 1 : 0}}>▍</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </Window>
      </div>
      <div style={{position: 'absolute', top: 870, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 22}}>
        {['sync + async nodes', 'input state never mutated', 'original exception re-raised'].map((t, i) => (
          <div key={t} style={enter(frame, 168 + i * 9, 20, 20)}>
            <Pill color={C.green} style={{fontSize: 23, padding: '10px 22px'}}>✓ {t}</Pill>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// 4 · TRACE — a live graph run, persisted row by row, then the failure
// ═════════════════════════════════════════════════════════════════════════════

const NODES = ['preprocess', 'classify', 'summarize'];
const NODE_X = [500, 960, 1420];
const NODE_Y = 445;
const NODE_W = 300;
const NODE_H = 112;

// Frame (scene-local) at which each node finishes, per run.
const RUN1_DONE = [62, 104, 146];
const RUN2_START = 188;
const RUN2_DONE = [222, 262];
const FAIL_AT = RUN2_DONE[1];

type Row = {at: number; id: number; node: string; ms: string; ok: boolean; ts: string};
const ROWS: Row[] = [
  {at: RUN1_DONE[0], id: 1, node: 'preprocess', ms: '0.21', ok: true, ts: '15:47:09.412'},
  {at: RUN1_DONE[1], id: 2, node: 'classify', ms: '0.38', ok: true, ts: '15:47:09.418'},
  {at: RUN1_DONE[2], id: 3, node: 'summarize', ms: '0.12', ok: true, ts: '15:47:09.421'},
  {at: RUN2_DONE[0], id: 4, node: 'preprocess', ms: '0.19', ok: true, ts: '15:47:12.087'},
  {at: RUN2_DONE[1], id: 5, node: 'classify', ms: '0.44', ok: false, ts: '15:47:12.093'},
];

const nodeStatus = (frame: number, i: number): 'idle' | 'run' | 'ok' | 'fail' => {
  if (frame < RUN2_START - 14) {
    const done = RUN1_DONE[i];
    if (frame >= done) return 'ok';
    if (frame >= done - 22) return 'run';
    return 'idle';
  }
  if (frame < RUN2_START) return 'idle';
  if (i === 2) return 'idle';
  const done = RUN2_DONE[i];
  if (frame >= done) return i === 1 ? 'fail' : 'ok';
  if (frame >= done - 20) return 'run';
  return 'idle';
};

// Position of the travelling packet along the node chain.
const packetX = (frame: number): number | null => {
  const legs: [number, number, number, number][] = [
    [RUN1_DONE[0] - 22, RUN1_DONE[0], NODE_X[0] - 260, NODE_X[0]],
    [RUN1_DONE[0], RUN1_DONE[1], NODE_X[0], NODE_X[1]],
    [RUN1_DONE[1], RUN1_DONE[2], NODE_X[1], NODE_X[2]],
    [RUN2_START, RUN2_DONE[0], NODE_X[0] - 260, NODE_X[0]],
    [RUN2_DONE[0], RUN2_DONE[1], NODE_X[0], NODE_X[1]],
  ];
  for (const [a, b, x0, x1] of legs) {
    if (frame >= a && frame < b) return interpolate(frame, [a, b], [x0, x1], {easing: ease});
  }
  return null;
};

const statusColor = {idle: C.faint, run: C.cyan, ok: C.green, fail: C.red};

const GraphNode: React.FC<{i: number}> = ({i}) => {
  const frame = useCurrentFrame();
  const st = nodeStatus(frame, i);
  const col = statusColor[st];
  const shake = st === 'fail' && frame < FAIL_AT + 14 ? Math.sin(frame * 3.1) * 10 : 0;
  const pop = st === 'fail' ? 1 + 0.08 * Math.max(0, 1 - (frame - FAIL_AT) / 8) : 1;
  const crack = progress(frame, FAIL_AT, FAIL_AT + 12);
  const inRun2 = frame >= RUN2_START - 14;
  const latency =
    st === 'ok'
      ? ROWS.filter((r) => r.node === NODES[i] && frame >= r.at && (inRun2 ? r.id > 3 : r.id <= 3)).pop()
      : undefined;
  return (
    <div
      style={{
        position: 'absolute',
        left: NODE_X[i] - NODE_W / 2 + shake,
        top: NODE_Y - NODE_H / 2,
        width: NODE_W,
        height: NODE_H,
        ...enter(frame, 10 + i * 6, 22, 30),
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `scale(${pop})`,
          borderRadius: 20,
          background: st === 'fail' ? 'rgba(255,77,94,0.12)' : C.panel2,
          border: `2px solid ${col}`,
          boxShadow: st === 'idle' ? 'none' : `0 0 40px ${col}66, inset 0 0 30px ${col}22`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 6,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{fontFamily: MONO, fontSize: 30, fontWeight: 700, color: C.text}}>{NODES[i]}</div>
        <div style={{fontFamily: MONO, fontSize: 18, color: col, letterSpacing: 2}}>
          {st === 'idle' ? 'WAITING' : st === 'run' ? 'RUNNING…' : st === 'ok' ? '✓ OK' : '✕ ValueError'}
        </div>
        {st === 'fail' && (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
            <polyline
              points="-2,30 18,48 30,36 46,62 60,44 74,70 88,52 102,66"
              fill="none"
              stroke={C.red}
              strokeWidth={3}
              vectorEffect="non-scaling-stroke"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - crack}
              style={{filter: `drop-shadow(0 0 6px ${C.red})`}}
            />
          </svg>
        )}
      </div>
      {latency && (
        <div style={{position: 'absolute', top: NODE_H + 18, left: 0, right: 0, textAlign: 'center', ...enter(frame, latency.at, 12, 10)}}>
          <span style={{fontFamily: MONO, fontSize: 20, color: C.dim}}>{latency.ms} ms</span>
        </div>
      )}
    </div>
  );
};

export const Trace: React.FC = () => {
  const frame = useCurrentFrame();
  const px = packetX(frame);
  const run2 = frame >= RUN2_START - 14;
  const visible = ROWS.filter((r) => frame >= r.at);
  const failFlash = interpolate(frame, [FAIL_AT, FAIL_AT + 20], [0.22, 0], clamp);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: C.red, opacity: frame >= FAIL_AT ? failFlash : 0}} />
      <SceneTitle label="02 · Trace" title="Every node run, captured." sub="Latency, input/output state and errors, persisted to SQLite." accent={C.cyan} top={70} />
      <div style={{position: 'absolute', left: 120, top: NODE_Y - 18, ...enter(frame, 20, 20, 0)}}>
        <Pill color={run2 ? C.orange : C.cyan}>{run2 ? 'run #2' : 'run #1'}</Pill>
      </div>
      <svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
        {[0, 1].map((i) => {
          const x1 = NODE_X[i] + NODE_W / 2;
          const x2 = NODE_X[i + 1] - NODE_W / 2;
          return (
            <line
              key={i}
              x1={x1}
              y1={NODE_Y}
              x2={x1 + (x2 - x1) * progress(frame, 16 + i * 6, 40 + i * 6)}
              y2={NODE_Y}
              stroke="rgba(255,255,255,0.22)"
              strokeWidth={3}
              strokeDasharray="10 10"
              strokeDashoffset={-frame * 1.5}
            />
          );
        })}
      </svg>
      {NODES.map((_, i) => (
        <GraphNode key={i} i={i} />
      ))}
      {px !== null && (
        <div
          style={{
            position: 'absolute',
            left: px - 11,
            top: NODE_Y - 11,
            width: 22,
            height: 22,
            borderRadius: 11,
            background: run2 ? C.orange : C.cyan,
            boxShadow: `0 0 24px 8px ${run2 ? C.orange : C.cyan}`,
          }}
        />
      )}
      {frame >= FAIL_AT + 6 && (
        <div style={{position: 'absolute', top: NODE_Y + 104, left: 0, right: 0, textAlign: 'center', ...enter(frame, FAIL_AT + 6, 14, 14)}}>
          <span style={{fontFamily: MONO, fontSize: 22, color: C.red, background: 'rgba(255,77,94,0.12)', border: `1px solid ${C.red}66`, padding: '8px 18px', borderRadius: 10}}>
            ValueError: classify_v2 requires a 'language' key in state
          </span>
        </div>
      )}
      <div style={{position: 'absolute', top: 650, left: 260, width: 1400, ...enter(frame, 30, 24, 30)}}>
        <div style={{fontFamily: MONO, fontSize: 19, color: C.dim, marginBottom: 10, display: 'flex', justifyContent: 'space-between'}}>
          <span>sqlite&gt; SELECT * FROM traces ORDER BY id;</span>
          <span style={{color: C.faint}}>faultline.db</span>
        </div>
        <div style={{borderRadius: 14, border: `1px solid ${C.border}`, background: 'rgba(14,16,22,0.9)', overflow: 'hidden'}}>
          <TraceRow header cells={['id', 'node_name', 'latency_ms', 'success', 'created_at']} />
          {visible.map((r) => (
            <div key={r.id} style={enter(frame, r.at, 14, -14)}>
              <TraceRow
                fail={!r.ok}
                cells={[String(r.id), r.node, r.ms, r.ok ? '1' : '0  ← ValueError', `2026-10-18 ${r.ts}`]}
              />
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const TraceRow: React.FC<{cells: string[]; header?: boolean; fail?: boolean}> = ({cells, header, fail}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '90px 260px 200px 380px 1fr',
      padding: '0 28px',
      height: header ? 48 : 52,
      alignItems: 'center',
      fontFamily: MONO,
      fontSize: header ? 18 : 22,
      color: header ? C.dim : fail ? C.red : C.text,
      background: header ? 'rgba(255,255,255,0.04)' : fail ? 'rgba(255,77,94,0.10)' : undefined,
      borderTop: header ? undefined : `1px solid ${C.border}`,
      letterSpacing: header ? 1.5 : 0,
      textTransform: header ? 'uppercase' : undefined,
    }}
  >
    {cells.map((c, i) => (
      <span key={i} style={{color: !header && !fail && i === 3 ? C.green : undefined}}>
        {c}
      </span>
    ))}
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
// 5 · DIAGNOSE — trace → Claude → structured report, rendered as Rich output
// ═════════════════════════════════════════════════════════════════════════════

const REPORT: [string, string][] = [
  ['Summary', "classify raised ValueError: the required 'language' key is missing from graph state."],
  ['Likely cause', "No upstream node writes 'language'; preprocess only returns 'text' and 'tokens'."],
  ['Suggested fix', "Add a detect_language node before classify, or read it with state.get('language', 'en')."],
];
const REPORT_START = 112;
const REPORT_CPS = 70;
const rowStart = (i: number) =>
  REPORT_START + REPORT.slice(0, i).reduce((n, [, v]) => n + Math.ceil((v.length / REPORT_CPS) * 30) + 6, 0);
const REPORT_END = rowStart(REPORT.length);

const Chip: React.FC<{label: string; detail: string; color: string; on: number; spin?: boolean}> = ({label, detail, color, on, spin}) => {
  const frame = useCurrentFrame();
  const lit = progress(frame, on, on + 12);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 26px',
        borderRadius: 16,
        background: C.panel2,
        border: `2px solid ${lit > 0 ? color : C.border}`,
        boxShadow: `0 0 ${40 * lit}px ${color}55`,
        opacity: 0.45 + 0.55 * lit,
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          border: `3px solid ${color}`,
          borderTopColor: spin ? 'transparent' : color,
          background: spin ? 'transparent' : lit > 0.5 ? color : 'transparent',
          transform: `rotate(${spin ? frame * 18 : 0}deg)`,
        }}
      />
      <div>
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 24, color: C.text}}>{label}</div>
        <div style={{fontFamily: MONO, fontSize: 16, color: C.dim}}>{detail}</div>
      </div>
    </div>
  );
};

const Arrow: React.FC<{on: number}> = ({on}) => {
  const frame = useCurrentFrame();
  const p = progress(frame, on, on + 14);
  return (
    <svg width="110" height="24" style={{overflow: 'visible'}}>
      <line x1="6" y1="12" x2={6 + 90 * p} y2="12" stroke={C.dim} strokeWidth={3} strokeDasharray="8 8" strokeDashoffset={-frame * 1.5} />
      <polygon points="96,4 108,12 96,20" fill={C.dim} opacity={p} />
    </svg>
  );
};

export const Diagnose: React.FC = () => {
  const frame = useCurrentFrame();
  const thinking = frame >= 40 && frame < REPORT_START;
  return (
    <AbsoluteFill>
      <SceneTitle label="03 · Diagnose" title={<>Claude explains <span style={gradientText(C.violet, C.cyan)}>why</span> it broke.</>} accent={C.violet} top={64} />
      <div style={{position: 'absolute', top: 232, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22, ...enter(frame, 10, 22, 20)}}>
        <Chip label="Failed trace #5" detail="state · error · traceback" color={C.red} on={14} />
        <Arrow on={26} />
        <Chip label="Claude API" detail={thinking ? 'analyzing…' : 'prompt-cached analyst'} color={C.violet} on={40} spin={thinking} />
        <Arrow on={REPORT_START - 6} />
        <Chip label="failure_reports" detail="structured JSON · FK → trace" color={C.green} on={REPORT_END + 4} />
      </div>
      <div style={{position: 'absolute', top: 372, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <Window title="python examples/example_graph.py" width={1560} glow="rgba(167,139,250,0.20)" style={enter(frame, 20, 26, 50)}>
          <div style={{padding: '24px 34px 30px', fontFamily: MONO, fontSize: 24, lineHeight: '38px', color: C.text}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 18, color: C.red, fontWeight: 700}}>
              <div style={{flex: 1, height: 2, background: `${C.red}88`}} />
              Failing Graph
              <div style={{flex: 1, height: 2, background: `${C.red}88`}} />
            </div>
            <div style={{...enter(frame, 34, 10, 0), filter: 'none'}}>
              <span style={{color: C.green, fontWeight: 700}}>+</span> <b>preprocess</b>
              <span style={{color: C.dim}}>  0.2 ms  2026-10-18 15:47:12</span>
            </div>
            <div
              style={{
                position: 'relative',
                marginTop: 24,
                border: `2px solid ${C.red}`,
                borderRadius: 6,
                padding: '26px 30px 18px',
                opacity: frame >= REPORT_START - 8 ? 1 : 0.0,
                boxShadow: frame >= REPORT_START - 8 ? `0 0 36px ${C.red}33` : undefined,
                clipPath: `inset(-30px ${100 - 100 * progress(frame, REPORT_START - 8, REPORT_START + 6)}% 0 0)`,
              }}
            >
              <div style={{position: 'absolute', top: -20, left: 18, background: '#10121a', padding: '0 10px', display: 'flex', gap: 14, alignItems: 'center'}}>
                <b> classify </b>
                <span style={{background: C.red, color: '#160307', fontWeight: 700, padding: '0 10px', borderRadius: 3}}>HIGH</span>
              </div>
              {REPORT.map(([k, v], i) => {
                const s = rowStart(i);
                const n = typed(frame, s, REPORT_CPS, v.length);
                return (
                  <div key={k} style={{display: 'grid', gridTemplateColumns: '250px 1fr', marginBottom: 14, opacity: frame >= s - 2 ? 1 : 0}}>
                    <span style={{color: C.dim, fontWeight: 700}}>{k}</span>
                    <span>
                      {v.slice(0, n)}
                      {n < v.length && <span style={{color: C.violet}}>▍</span>}
                    </span>
                  </div>
                );
              })}
              {[['Latency', '0.4 ms'], ['Timestamp', '2026-10-18 15:47:12']].map(([k, v], i) => (
                <div key={k} style={{display: 'grid', gridTemplateColumns: '250px 1fr', ...enter(frame, REPORT_END + i * 4, 10, 0), filter: 'none'}}>
                  <span style={{color: C.dim, fontWeight: 700}}>{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
            <div style={{marginTop: 18, color: C.dim, ...enter(frame, REPORT_END + 22, 14, 0), filter: 'none'}}>
              ↳ original <span style={{color: C.red}}>ValueError</span> re-raised · your graph's error semantics stay intact
            </div>
          </div>
        </Window>
      </div>
    </AbsoluteFill>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// 6 · ENGINEERING — proof points a reviewer can verify in the repo
// ═════════════════════════════════════════════════════════════════════════════

const STATS: {value: number; suffix?: string; text?: string; label: string; detail: string; color: string}[] = [
  {value: 21, label: 'tests, fully offline', detail: 'Claude client stubbed: CI costs $0', color: C.green},
  {value: 0, label: 'behavior change', detail: 'wrappers are transparent to LangGraph', color: C.cyan},
  {value: 0, text: 'async', label: 'nodes too', detail: 'coroutines detected via inspect', color: C.violet},
  {value: 0, text: 'never', label: 'masks your error', detail: 'original exception always re-raised', color: C.orange},
];

export const Engineering: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <SceneTitle label="04 · Engineered" title="Built like production code." accent={C.green} top={84} />
      <div
        style={{
          position: 'absolute',
          top: 300,
          left: 220,
          right: 220,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 34,
        }}
      >
        {STATS.map((s, i) => {
          const start = 18 + i * 10;
          const n = Math.round(interpolate(frame, [start, start + 36], [0, s.value], {...clamp, easing: ease}));
          return (
            <div
              key={s.label}
              style={{
                ...enter(frame, start, 24, 40),
                padding: '34px 44px',
                borderRadius: 24,
                background: 'linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
                border: `1px solid ${C.border}`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 60px ${s.color}14`,
                height: 270,
                boxSizing: 'border-box',
              }}
            >
              <div style={{display: 'flex', alignItems: 'baseline', gap: 18}}>
                <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 112, letterSpacing: -3, lineHeight: 1.05, whiteSpace: 'nowrap', ...gradientText(C.text, s.color)}}>
                  {s.text ?? `${n}${s.suffix ?? ''}`}
                </span>
                <span style={{fontFamily: SANS, fontWeight: 700, fontSize: 32, color: C.text}}>{s.label}</span>
              </div>
              <div style={{fontFamily: MONO, fontSize: 22, color: C.dim, marginTop: 18}}>{s.detail}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// 7 · STACK — the tools and the four modules that make up the system
// ═════════════════════════════════════════════════════════════════════════════

const TECH: [string, string][] = [
  ['Python 3.11', C.yellow],
  ['LangGraph', C.cyan],
  ['Claude API', C.violet],
  ['SQLite', C.green],
  ['Rich', C.orange],
  ['pytest', C.red],
];
const MODULES: [string, string][] = [
  ['tracer.py', 'non-invasive node wrappers'],
  ['db.py', 'the only module that speaks SQL'],
  ['analyzer.py', 'prompt template + resilient JSON parsing'],
  ['reporter.py', 'severity-coded Rich panels'],
];

export const Stack: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <SceneTitle label="05 · Architecture" title="Small surface. Clean seams." accent={C.yellow} top={150} />
      <div style={{position: 'absolute', top: 380, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 20}}>
        {TECH.map(([t, col], i) => (
          <div key={t} style={enter(frame, 12 + i * 4, 18, 30)}>
            <Pill color={col} style={{fontSize: 28, padding: '12px 28px'}}>{t}</Pill>
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', top: 530, left: 330, right: 330, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22}}>
        {MODULES.map(([f, d], i) => (
          <div
            key={f}
            style={{
              ...enter(frame, 40 + i * 7, 20, 24),
              padding: '26px 32px',
              borderRadius: 18,
              background: C.panel,
              border: `1px solid ${C.border}`,
            }}
          >
            <div style={{fontFamily: MONO, fontSize: 28, fontWeight: 700, color: C.text}}>
              <span style={{color: C.faint}}>faultline/</span>
              {f}
            </div>
            <div style={{fontFamily: SANS, fontSize: 24, color: C.dim, marginTop: 8}}>{d}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// 8 · OUTRO — brand, promise, one clear call to action
// ═════════════════════════════════════════════════════════════════════════════

export const Outro: React.FC<{durationInFrames: number}> = ({durationInFrames}) => {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [durationInFrames - 24, durationInFrames], [0, 1], clamp);
  return (
    <AbsoluteFill style={{...center, flexDirection: 'column'}}>
      <FaultLogo size={190} crackAt={14} />
      <div style={{...enter(frame, 34, 24), fontFamily: SANS, fontWeight: 700, fontSize: 60, letterSpacing: -1.5, color: C.text, marginTop: 34}}>
        Know <span style={gradientText(C.red, C.orange)}>why</span> your agents fail.
      </div>
      <div style={{...enter(frame, 56, 24), marginTop: 48}}>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 34,
            color: C.text,
            padding: '18px 36px',
            borderRadius: 16,
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${C.border}`,
            boxShadow: `0 0 50px rgba(255,77,94,0.18)`,
          }}
        >
          <span style={{color: C.dim}}>github.com/</span>PeytonR72/Faultline
        </div>
      </div>
      <div style={{...enter(frame, 76, 24), fontFamily: MONO, fontSize: 22, color: C.dim, marginTop: 28}}>
        Python 3.11+ · LangGraph · Claude · MIT licensed
      </div>
      <AbsoluteFill style={{background: '#000', opacity: out}} />
    </AbsoluteFill>
  );
};
