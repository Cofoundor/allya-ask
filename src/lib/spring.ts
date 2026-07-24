/* ============================================================
   Motion primitives — Apple's "Designing Fluid Interfaces"
   - animate from the presentation (live) value, always interruptible
   - carry velocity through re-targets (no reversal "brick wall")

   Shared with the Allya product UI; kept byte-identical so a fix in one
   place can be carried to the other without a diff to reason about.
   ============================================================ */

export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

/** Read once per call — `window` is absent during SSR. */
export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

type SpringFrame = (x: number, v: number, settled: boolean) => void;

interface SpringOptions {
  response?: number;
  damping?: number;
  /** Distance/velocity below which the spring snaps to target and stops. */
  epsilon?: number;
  onframe?: SpringFrame;
}

/* Two knobs (response + damping ratio), numerically integrated so it can be
   re-targeted mid-flight from the current value and velocity — the property
   that makes interruption clean. */
export class Spring {
  x: number;
  v = 0;
  target: number;
  response: number;
  damping: number;
  epsilon: number;
  onframe?: SpringFrame;
  running = false;
  private raf = 0;
  private last = 0;

  constructor(value: number, { response = 0.4, damping = 1.0, epsilon = 0.001, onframe }: SpringOptions = {}) {
    this.x = value;
    this.target = value;
    this.response = response;
    this.damping = damping;
    this.epsilon = epsilon;
    this.onframe = onframe;
  }

  to(target: number, velocity?: number) {
    this.target = target;
    if (velocity != null) this.v = velocity;
    if (prefersReducedMotion()) {
      this.x = target;
      this.v = 0;
      this.onframe?.(this.x, this.v, true);
      return this;
    }
    this.start();
    return this;
  }

  private start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const step = (now: number) => {
      if (!this.running) return;
      let dt = (now - this.last) / 1000;
      this.last = now;
      if (dt > 1 / 30) dt = 1 / 30;
      const w = (2 * Math.PI) / this.response;
      const k = w * w;
      const c = 2 * this.damping * w;
      const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
      const h = dt / steps;
      for (let i = 0; i < steps; i++) {
        const a = -k * (this.x - this.target) - c * this.v;
        this.v += a * h;
        this.x += this.v * h;
      }
      const settled = Math.abs(this.x - this.target) < this.epsilon && Math.abs(this.v) < this.epsilon;
      if (settled) {
        this.x = this.target;
        this.v = 0;
        this.running = false;
      }
      this.onframe?.(this.x, this.v, settled);
      if (this.running) this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    return this;
  }
}
