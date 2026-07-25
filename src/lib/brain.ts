/* ============================================================
   The company brain — Allya's model of ZeroTo10, made touchable.

   A labeled graph: the company at the hub, the things you can ask about
   fanned out around it. It holds a clean shape, drifts gently, fires
   "thoughts" along its edges, and reacts to touch — hover excites a node
   and ripples to neighbours, drag moves it 1:1, tap sends a thought.

   Lifted from the Allya product UI and trimmed to the one layout this
   surface needs ('web', fully revealed — nothing grows here). The engine
   owns its own pixels and pointer bindings, which is why it survives the
   gate → chat transition without remounting or losing momentum.

   Performance: the loop runs at 30fps while something is happening and
   ~15fps for the idle drift; gradients are only allocated where they're
   actually visible; layout is probed twice a second, not per frame.
   ============================================================ */

import { clamp, prefersReducedMotion } from './spring';

export const GROUPS: Record<string, string> = {
  core: '#91d45f',
  product: '#91d45f',
  market: '#6f9fd8',
  traction: '#5fbfa8',
  model: '#d9a441',
  team: '#a78bda',
};

const TAU = Math.PI * 2;

export interface NodeSpec {
  id: string;
  label: string;
  tier: 0 | 1 | 2;
  group: string;
  parent?: string;
}

interface BrainNode extends NodeSpec {
  x: number;
  y: number;
  hx: number;
  hy: number;
  vx: number;
  vy: number;
  /** excitement 0..1.4 — hover, tap, an arriving thought */
  ex: number;
  phase: number;
  angle?: number;
}

export interface BrainOptions {
  nodes: NodeSpec[];
  cross?: [string, string][];
  thoughtEvery?: number;
  /** a node tapped by the visitor — the surface turns it into a question */
  onTap?: (node: NodeSpec) => void;
}

export interface BrainHandle {
  start(): void;
  stop(): void;
  destroy(): void;
  /** a thought travels hub → leaf; no id picks one at random */
  fireThought(id?: string): void;
  /** every leaf lights in sequence — used when an answer lands */
  bloom(): void;
  setThoughts(on: boolean): void;
  /** dev: force N settled frames + a draw (preview tabs throttle rAF) */
  tickOnce(frames?: number, dt?: number): void;
}

function hexA(hex: string, a: number) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${clamp(a, 0, 1)})`;
}

function lighten(hex: string) {
  const h = hex.replace('#', '');
  const mix = (c: number) => Math.round(c + (255 - c) * 0.4);
  const part = (i: number) =>
    mix(parseInt(h.slice(i, i + 2), 16))
      .toString(16)
      .padStart(2, '0');
  return `#${part(0)}${part(2)}${part(4)}`;
}

export function createBrain(canvas: HTMLCanvasElement, box: HTMLElement, opts: BrainOptions): BrainHandle {
  const ctx = canvas.getContext('2d')!;
  const R: Record<number, number> = { 0: 7, 1: 4.8, 2: 3.1 };
  const thoughtEvery = opts.thoughtEvery ?? 5;

  let W = 0;
  let H = 0;
  let dpr = 1;
  let S = 1;

  const nodes: BrainNode[] = [];
  const nodeById: Record<string, BrainNode> = {};
  /** [a, b, isCross] — cross strands draw a shade behind the structural ones */
  const edges: [string, string, boolean][] = [];
  /** id → neighbour ids, so hover doesn't rescan every edge */
  const adj: Record<string, string[]> = {};
  /** just the sideways links, so a thought can jump between clusters */
  const crossAdj: Record<string, string[]> = {};

  let pulses: { a: BrainNode; b: BrainNode; delay: number; t: number; dur: number; hit?: boolean }[] = [];
  let ripples: { x: number; y: number; col: string; t: number; r0: number }[] = [];
  const timeouts = new Set<ReturnType<typeof setTimeout>>();
  let thoughtClock = 0;
  let thoughtsOn = true;
  const tSeed = Math.random() * 1000;

  const nodeR = (n: BrainNode) => R[n.tier] * S * (1 + n.ex * 0.5);

  /** setTimeout that a destroy() can take back — otherwise a bloom in flight
      keeps poking a dead canvas. */
  function later(ms: number, fn: () => void) {
    const id = setTimeout(() => {
      timeouts.delete(id);
      fn();
    }, ms);
    timeouts.add(id);
  }

  function link(a: string, b: string, cross = false) {
    edges.push([a, b, cross]);
    (adj[a] ||= []).push(b);
    (adj[b] ||= []).push(a);
    if (cross) {
      (crossAdj[a] ||= []).push(b);
      (crossAdj[b] ||= []).push(a);
    }
  }

  function addNode(spec: NodeSpec) {
    const parent = spec.parent ? nodeById[spec.parent] : null;
    const n: BrainNode = {
      ...spec,
      x: parent ? parent.x : W / 2,
      y: parent ? parent.y : H / 2,
      hx: W / 2,
      hy: H / 2,
      vx: 0,
      vy: 0,
      ex: 0,
      phase: Math.random() * TAU,
    };
    nodes.push(n);
    nodeById[n.id] = n;
    if (spec.parent && nodeById[spec.parent]) link(spec.parent, n.id);
    return n;
  }

  /* ---- home positions: departments on an ellipse, leaves fanned outward
     from the CENTRE with a staggered radius, which reads as depth and keeps
     the clusters apart ---- */
  function layout() {
    const cx = W / 2;
    const cy = H / 2;
    const hub = nodes.find((n) => n.tier === 0);
    if (hub) {
      hub.hx = cx;
      hub.hy = cy;
    }
    const depts = nodes.filter((n) => n.tier === 1);
    const rx1 = W * 0.22;
    const ry1 = H * 0.3;
    const rx2 = W * 0.4;
    const ry2 = H * 0.4;

    depts.forEach((d, i) => {
      const a = -Math.PI / 2 + (i / Math.max(1, depts.length)) * TAU;
      d.hx = cx + Math.cos(a) * rx1;
      d.hy = cy + Math.sin(a) * ry1;
      d.angle = a;
    });
    depts.forEach((d) => {
      const leaves = nodes.filter((n) => n.parent === d.id);
      leaves.forEach((l, j) => {
        const a = (d.angle ?? 0) + (j - (leaves.length - 1) / 2) * 0.3;
        const depth = 1 + (j % 2) * 0.2;
        l.hx = cx + Math.cos(a) * rx2 * depth;
        l.hy = cy + Math.sin(a) * ry2 * depth;
      });
    });

    nodes.forEach((n) => {
      if (n.x === 0 && n.y === 0) {
        n.x = n.hx;
        n.y = n.hy;
      }
    });
  }

  function resize() {
    const w = box.clientWidth;
    const h = box.clientHeight;
    if (!w || !h) return false;
    // capped at 1.25 — 2x quadruples the pixel work for no visible gain here
    dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    W = w;
    H = h;
    S = clamp(Math.min(W, H) / 300, 0.82, 1.5);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layout();
    return true;
  }

  /* ---- thoughts ---- */
  function excite(n: BrainNode, amt: number) {
    n.ex = clamp(n.ex + amt, 0, 1.4);
    if (amt >= 0.5) ripples.push({ x: n.x, y: n.y, col: GROUPS[n.group] || '#91d45f', t: 0, r0: nodeR(n) });
  }

  function fireEdge(a: BrainNode, b: BrainNode, delay = 0) {
    pulses.push({ a, b, delay, t: 0, dur: 0.5 + Math.random() * 0.25 });
  }

  function pathToHub(n: BrainNode) {
    const path: BrainNode[] = [];
    let cur: BrainNode | null = n;
    while (cur) {
      path.push(cur);
      cur = cur.parent ? nodeById[cur.parent] ?? null : null;
    }
    return path.reverse();
  }

  function fireThought(id?: string) {
    let t = id ? nodeById[id] : undefined;
    if (!t) {
      const leaves = nodes.filter((n) => n.tier === 2);
      const pool = leaves.length ? leaves : nodes;
      t = pool[(Math.random() * pool.length) | 0];
    }
    if (!t) return;
    const path = pathToHub(t);
    for (let i = 0; i < path.length - 1; i++) fireEdge(path[i], path[i + 1], i * 0.16);
    if (path[0]) excite(path[0], 0.5);

    // and often it carries on sideways, into whatever the answer touches —
    // the reason the cross strands are there at all
    const sideways = crossAdj[t.id];
    if (sideways?.length && Math.random() < 0.6) {
      const other = nodeById[sideways[(Math.random() * sideways.length) | 0]];
      if (other) fireEdge(t, other, (path.length - 1) * 0.16);
    }
  }

  function bloom() {
    nodes.filter((n) => n.tier === 2).forEach((n, i) => later(i * 90, () => fireThought(n.id)));
  }

  /* ---- interaction ---- */
  let hoverNode: BrainNode | null = null;
  let dragNode: BrainNode | null = null;
  let grabDX = 0;
  let grabDY = 0;
  let pHist: { t: number; x: number; y: number }[] = [];

  function nodeAt(px: number, py: number) {
    let best: BrainNode | null = null;
    let bestD = 1e9;
    for (const n of nodes) {
      const d = Math.hypot(px - n.x, py - n.y);
      const hit = nodeR(n) + 13;
      if (d < hit && d < bestD) {
        best = n;
        bestD = d;
      }
    }
    return best;
  }

  const localPt = (e: PointerEvent): [number, number] => {
    const r = canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };

  const onPointerMove = (e: PointerEvent) => {
    const [px, py] = localPt(e);
    if (dragNode) {
      dragNode.x = px - grabDX;
      dragNode.y = py - grabDY;
      dragNode.vx = 0;
      dragNode.vy = 0;
      pHist.push({ t: performance.now(), x: px, y: py });
      if (pHist.length > 5) pHist.shift();
      return;
    }
    const n = nodeAt(px, py);
    if (n !== hoverNode) {
      hoverNode = n;
      if (n) {
        excite(n, 0.7);
        (adj[n.id] || []).forEach((id) => fireEdge(n, nodeById[id], 0));
      }
    }
    canvas.style.cursor = n ? 'pointer' : 'grab';
  };

  const onPointerDown = (e: PointerEvent) => {
    const [px, py] = localPt(e);
    const n = nodeAt(px, py);
    if (n) {
      dragNode = n;
      grabDX = px - n.x;
      grabDY = py - n.y;
      pHist = [{ t: performance.now(), x: px, y: py }];
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // a stale or synthetic pointer id — the drag still works, it just
        // stops tracking if the pointer leaves the canvas
      }
      excite(n, 0.5);
    } else {
      fireThought(); // tap on empty space — Allya puts a thought
    }
  };

  const endDrag = () => {
    if (!dragNode) return;
    // hand release velocity back to the node, then it springs home
    if (pHist.length > 1) {
      const a = pHist[0];
      const b = pHist[pHist.length - 1];
      const dt = (b.t - a.t) / 1000;
      if (dt > 0) {
        dragNode.vx = ((b.x - a.x) / dt) * 0.02;
        dragNode.vy = ((b.y - a.y) / dt) * 0.02;
      }
    }
    const moved =
      pHist.length > 1 &&
      Math.hypot(pHist[pHist.length - 1].x - pHist[0].x, pHist[pHist.length - 1].y - pHist[0].y);
    if (!moved || moved < 4) {
      // it was a tap, not a drag — light it up and hand it to the surface
      fireThought(dragNode.id);
      opts.onTap?.(dragNode);
    }
    dragNode = null;
  };

  const onPointerLeave = () => {
    hoverNode = null;
  };

  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('pointerleave', onPointerLeave);

  /* ---- simulation ---- */
  const K_HOME = 34;
  const K_EDGE = 10;
  const DAMP = 5.2;

  function step(dt: number) {
    // gentle drift of the home targets keeps it alive
    const time = performance.now() / 1000 + tSeed;
    for (const n of nodes) {
      if (n === dragNode) continue;
      const amp = n.tier === 0 ? 1.5 : 4;
      const tx = n.hx + Math.sin(time * 0.5 + n.phase) * amp;
      const ty = n.hy + Math.cos(time * 0.42 + n.phase) * amp;
      n.vx += (tx - n.x) * K_HOME * dt;
      n.vy += (ty - n.y) * K_HOME * dt;
    }
    // edge springs — the web reacts when a node is pulled
    for (const [aid, bid] of edges) {
      const a = nodeById[aid];
      const b = nodeById[bid];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 0.001;
      const rest = Math.hypot(b.hx - a.hx, b.hy - a.hy);
      const f = (d - rest) * K_EDGE;
      const ux = dx / d;
      const uy = dy / d;
      if (a !== dragNode) {
        a.vx += ux * f * dt;
        a.vy += uy * f * dt;
      }
      if (b !== dragNode) {
        b.vx -= ux * f * dt;
        b.vy -= uy * f * dt;
      }
    }
    const fr = Math.exp(-DAMP * dt);
    for (const n of nodes) {
      if (n === dragNode) continue;
      n.vx *= fr;
      n.vy *= fr;
      n.x += n.vx * dt;
      n.y += n.vy * dt;
    }
    for (const n of nodes) n.ex = Math.max(0, n.ex - dt * 1.1);
  }

  /* ---- draw ---- */
  function draw() {
    ctx.clearRect(0, 0, W, H);
    const time = performance.now() / 1000;

    // edges: gradient strands only while lit — a resting edge sits at ~5%
    // alpha, which a flat stroke renders identically for a fraction of the cost
    for (const [aid, bid, cross] of edges) {
      const a = nodeById[aid];
      const b = nodeById[bid];
      const lit = Math.max(a.ex, b.ex);
      // it has to read as a web at rest, not as scattered dots — structural
      // strands carry the shape, cross strands sit a shade behind them
      const rest = cross ? 0.1 : 0.19;
      if (lit > 0.03) {
        const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        g.addColorStop(0, hexA(GROUPS[a.group] || '#91d45f', rest + a.ex * 0.3 + lit * 0.08));
        g.addColorStop(1, hexA(GROUPS[b.group] || '#91d45f', rest + b.ex * 0.3 + lit * 0.08));
        ctx.strokeStyle = g;
      } else {
        ctx.strokeStyle = hexA(GROUPS[a.group] || '#91d45f', rest);
      }
      ctx.lineWidth = ((cross ? 0.6 : 0.85) + lit * 1.2) * S;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    // ripples: a ring blooms where you touched
    for (const rp of ripples) {
      const rr = rp.r0 + rp.t * 42 * S;
      ctx.strokeStyle = hexA(rp.col, (1 - rp.t) * 0.4);
      ctx.lineWidth = 1.4 * S;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rr, 0, TAU);
      ctx.stroke();
    }

    // pulses: a bright thought with a comet trail
    for (const s of pulses) {
      if (s.delay > 0) continue;
      const t = clamp(s.t, 0, 1);
      const x = s.a.x + (s.b.x - s.a.x) * t;
      const y = s.a.y + (s.b.y - s.a.y) * t;
      const tt = Math.max(0, t - 0.16);
      const px = s.a.x + (s.b.x - s.a.x) * tt;
      const py = s.a.y + (s.b.y - s.a.y) * tt;
      const fade = Math.sin(t * Math.PI);
      const tg = ctx.createLinearGradient(px, py, x, y);
      tg.addColorStop(0, hexA('#b4e88a', 0));
      tg.addColorStop(1, hexA('#b4e88a', 0.6 * fade));
      ctx.strokeStyle = tg;
      ctx.lineWidth = 2 * S;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(x, y);
      ctx.stroke();
      const hg = ctx.createRadialGradient(x, y, 0, x, y, 7 * S);
      hg.addColorStop(0, hexA('#eafbdc', 0.95 * fade));
      hg.addColorStop(1, hexA('#91d45f', 0));
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.arc(x, y, 7 * S, 0, TAU);
      ctx.fill();
    }

    // nodes: soft halo + luminous core; labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (const n of nodes) {
      const col = GROUPS[n.group] || '#91d45f';
      const hub = n.tier === 0;
      const r = nodeR(n) * (hub ? 1 + 0.05 * Math.sin(time * 1.6) : 1);
      const glow = (hub ? 1 : 0) + n.ex;

      // halo — resting halos are ~5% alpha, not worth a gradient each frame
      if (hub || glow > 0.03) {
        const haloR = r + (hub ? 26 : 11) * S + n.ex * 12 * S;
        const hg = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, haloR);
        hg.addColorStop(0, hexA(col, 0.05 + glow * 0.16));
        hg.addColorStop(1, hexA(col, 0));
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.arc(n.x, n.y, haloR, 0, TAU);
        ctx.fill();
      }

      // core — lighter centre for a lit look; flat fill for resting leaves
      const base = hub ? 0.98 : n.tier === 1 ? 0.73 : 0.48;
      if (n.tier === 2 && n.ex < 0.02) {
        ctx.fillStyle = hexA(col, base);
      } else {
        const cg = ctx.createRadialGradient(n.x - r * 0.3, n.y - r * 0.3, 0, n.x, n.y, r);
        cg.addColorStop(0, hexA(lighten(col), clamp(base + n.ex * 0.5, 0, 1)));
        cg.addColorStop(1, hexA(col, clamp(base + n.ex * 0.4, 0, 1)));
        ctx.fillStyle = cg;
      }
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, TAU);
      ctx.fill();
      if (hub) {
        ctx.lineWidth = 1.5 * S;
        ctx.strokeStyle = hexA('#eafbdc', 0.6);
        ctx.stroke();
      }

      // label
      const lAlpha = clamp((hub ? 0.9 : n.tier === 1 ? 0.58 : 0.34) + n.ex * 0.7, 0, 1);
      const size = (hub ? 12.7 : n.tier === 1 ? 11.2 : 10) * clamp(S, 0.9, 1.22);
      ctx.font = `${hub ? 600 : 500} ${size}px "Inter Tight", system-ui, sans-serif`;
      ctx.fillStyle = hexA(n.tier === 2 ? '#c7ccd4' : '#f3f4f6', lAlpha);
      ctx.fillText(n.label, n.x, n.y + r + 3 * S);
    }
  }

  /* ---- loop ---- */
  let raf = 0;
  let last = 0;
  let boxHidden = false;
  let probeAt = 0;
  let destroyed = false;

  function advance(dt: number) {
    // substep so the springs stay stable at the lower frame rate
    const sub = dt > 0.04 ? 2 : 1;
    for (let i = 0; i < sub; i++) step(dt / sub);
    thoughtClock += dt;
    if (thoughtsOn && thoughtClock > thoughtEvery && nodes.length > 1) {
      thoughtClock = 0;
      fireThought();
    }
    for (const s of pulses) {
      if (s.delay > 0) {
        s.delay -= dt;
      } else {
        s.t += dt / s.dur;
        if (s.t >= 0.5 && !s.hit) {
          s.hit = true;
          excite(s.b, 0.6);
        }
      }
    }
    pulses = pulses.filter((s) => s.t < 1);
    for (const rp of ripples) rp.t += dt / 0.7;
    ripples = ripples.filter((rp) => rp.t < 1);
  }

  function frame(now: number) {
    if (!raf) return;
    raf = requestAnimationFrame(frame);

    // layout probes force reflow — twice a second is plenty
    if (now >= probeAt) {
      probeAt = now + 500;
      boxHidden = !box.offsetParent;
      if (!boxHidden && (W !== box.clientWidth || H !== box.clientHeight)) resize();
    }
    if (boxHidden) {
      last = now;
      return;
    }

    // 30fps while something is happening, ~15fps for the idle drift
    const active = dragNode || hoverNode || pulses.length || ripples.length || nodes.some((n) => n.ex > 0.02);
    if (now - last < (active ? 33 : 66)) return;

    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.08) dt = 0.08;
    if (!prefersReducedMotion()) advance(dt);
    draw();
  }

  function start() {
    if (raf || destroyed) return;
    if (!resize()) {
      requestAnimationFrame(start);
      return;
    }
    if (prefersReducedMotion()) {
      draw(); // static graph, no loop
      return;
    }
    last = performance.now();
    probeAt = 0;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
  }

  const onResize = () => {
    if (resize() && prefersReducedMotion()) draw();
  };
  const onVisibility = () => (document.hidden ? stop() : start());
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibility);

  // seed the graph
  opts.nodes.forEach((spec) => addNode(spec));
  (opts.cross || []).forEach(([a, b]) => {
    if (nodeById[a] && nodeById[b]) link(a, b, true);
  });

  return {
    start,
    stop,
    fireThought,
    bloom,
    setThoughts(on: boolean) {
      thoughtsOn = on;
    },
    tickOnce(frames = 1, dt = 1 / 60) {
      if (!resize()) return;
      for (let i = 0; i < frames; i++) advance(dt);
      draw();
    },
    destroy() {
      destroyed = true;
      stop();
      timeouts.forEach(clearTimeout);
      timeouts.clear();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', endDrag);
      canvas.removeEventListener('pointercancel', endDrag);
      canvas.removeEventListener('pointerleave', onPointerLeave);
    },
  };
}
