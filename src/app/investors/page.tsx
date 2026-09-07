'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrainCanvas } from '@/components/BrainCanvas';
import { PressButton } from '@/components/Pressable';
import { ArrowIcon } from '@/components/icons';
import { RichText } from '@/lib/markdown';
import type { BrainHandle, BrainOptions, NodeSpec } from '@/lib/brain';
import { useReducedMotion } from '@/lib/hooks';
import {
  ApiError,
  getBrain,
  getRoom,
  getSlide,
  listPointers,
  listSlides,
  postAnswer,
  type BrainGraph,
  type Panel,
  type Pointer,
  type Room,
  type Slide,
  type SlideSummary,
} from '@/lib/api/investor';
import './investors.css';

interface Turn {
  key: string;
  question: string;
  text: string;
  matched: boolean;
  slideId?: string | null;
}

let seq = 0;
const nextKey = () => `t${++seq}`;

export default function InvestorRoom() {
  /* ---------------- page data, all of it from the API ---------------- */
  const [room, setRoom] = useState<Room | null>(null);
  const [featured, setFeatured] = useState<SlideSummary[]>([]);
  const [rest, setRest] = useState<SlideSummary[]>([]);
  const [brain, setBrain] = useState<BrainGraph | null>(null);
  const [pointers, setPointers] = useState<Pointer[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const ac = new AbortController();
    const { signal } = ac;
    Promise.all([
      getRoom(signal),
      listSlides({ featured: true, signal }),
      listSlides({ featured: false, signal }),
      getBrain(signal),
      listPointers(signal),
    ])
      .then(([r, f, o, b, p]) => {
        setRoom(r);
        setFeatured(f);
        setRest(o);
        setBrain(b);
        setPointers(p);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        if (signal.aborted) return;
        setLoadError(
          err instanceof ApiError && err.status === 0
            ? `${err.message}. Start it with: uvicorn main:app --reload --port 8010`
            : 'Could not load the room.',
        );
      });
    return () => ac.abort();
  }, [attempt]);

  /* ---------------- one open slide, fetched on demand ---------------- */
  const [openId, setOpenId] = useState<string | null>(null);
  const [slides, setSlides] = useState<Record<string, Slide>>({});
  const [slideError, setSlideError] = useState<string | null>(null);
  const paneWork = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!openId || slides[openId]) return;
    const ac = new AbortController();
    getSlide(openId, ac.signal)
      .then((s) => setSlides((prev) => ({ ...prev, [s.id]: s })))
      .catch((err: unknown) => {
        if (ac.signal.aborted) return;
        setSlideError(
          err instanceof ApiError && err.status === 404 ? 'That slide is gone.' : 'Could not load that slide.',
        );
      });
    return () => ac.abort();
  }, [openId, slides]);

  const [showWork, setShowWork] = useState(false);

  const openSlide = useCallback((id: string | null) => {
    setSlideError(null);
    setOpenId(id);
    if (!id) return;
    requestAnimationFrame(() => {
      paneWork.current
        ?.querySelector<HTMLElement>(`[data-slide="${id}"]`)
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }, []);

  /* ---------------- the conversation ---------------- */
  const [turns, setTurns] = useState<Turn[]>([]);
  const [asking, setAsking] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const [draft, setDraft] = useState('');
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [introDone, setIntroDone] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      return sessionStorage.getItem('allya-room-intro') === 'done';
    } catch {
      return false;
    }
  });
  const brainRef = useRef<BrainHandle | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const onBrainReady = useCallback((h: BrainHandle) => {
    brainRef.current = h;
  }, []);

  const ask = useCallback(
    async (question: string, nodeId?: string) => {
      if (asking) return;
      setAsking(true);
      setEngaged(true);
      setSuggestOpen(false);
      setShowWork(false);
      // one targeted thought, not a full bloom — a bloom is ~30 timers and
      // ~70 pulses per answer, which is what made this feel heavy
      brainRef.current?.fireThought(nodeId);
      try {
        const a = await postAnswer({ question, node_id: nodeId });
        setTurns((prev) => [
          ...prev,
          { key: nextKey(), question: a.question, text: a.text, matched: a.matched, slideId: a.slide_id },
        ]);
        if (a.slide_id) openSlide(a.slide_id);
      } catch {
        setTurns((prev) => [
          ...prev,
          {
            key: nextKey(),
            question,
            text: 'That question could not reach the room just now. Try it again in a moment.',
            matched: false,
          },
        ]);
      } finally {
        setAsking(false);
      }
    },
    [asking, openSlide],
  );

  // follow the conversation down as it grows
  useEffect(() => {
    if (!engaged) return;
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [turns.length, asking, engaged]);

  const dismissIntro = useCallback(() => {
    setIntroDone(true);
    try {
      sessionStorage.setItem('allya-room-intro', 'done');
    } catch {
      // private window, or site data blocked — the choice just isn't remembered
    }
  }, []);

  // ⌘K / Ctrl+K puts the caret in the composer, as it does in the product
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        input.current?.focus();
      }
      if (e.key === 'Escape') dismissIntro();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dismissIntro]);


  const onNodeTap = useCallback(
    (node: NodeSpec) => {
      const q = brain?.nodes.find((n) => n.id === node.id)?.question;
      void ask(q || node.label, node.id);
    },
    [ask, brain],
  );

  /* the engine reads this once, at mount — it must not be rebuilt after */
  const brainOptions = useMemo<BrainOptions | null>(() => {
    if (!brain) return null;
    return {
      nodes: brain.nodes.map<NodeSpec>((n) => ({
        id: n.id,
        label: n.label,
        tier: (n.tier === 0 ? 0 : n.tier === 1 ? 1 : 2) as NodeSpec['tier'],
        group: n.group,
        parent: n.parent ?? undefined,
      })),
      cross: brain.edges.map((e) => [e.source, e.target] as [string, string]),
      leafSpread: brain.leaf_spread,
      thoughtEvery: 5,
    };
  }, [brain]);

  const questionList = useMemo(() => (brain?.nodes ?? []).filter((n) => n.tier === 2 && n.question), [brain]);

  /* ---------------- states before the room exists ---------------- */
  if (loadError) {
    return (
      <div className="room-center">
        <div className="room-panel">
          <div className="group-label">The room is offline</div>
          <p>{loadError}</p>
          <PressButton type="button" className="cta" onClick={() => setAttempt((n) => n + 1)}>
            Try again
          </PressButton>
        </div>
      </div>
    );
  }

  if (!room || !brainOptions) {
    return (
      <div className="room-center">
        <div className="room-panel">
          <span className="spinner" />
          <p>Waking the brain…</p>
        </div>
      </div>
    );
  }

  const total = featured.length + rest.length;
  const panelOf = (id: string): Panel | undefined => room.panels.find((p) => p.id === id);
  const deckLink = room.links.find((l) => l.id === 'deck' && l.url);

  return (
    <div className="app">
      {!introDone ? (
        <div className="intro-scrim" role="dialog" aria-modal="true" aria-labelledby="intro-title">
          <div className="intro-card">
            <div className="intro-mark">
              <span className="lamp" /> {room.company}
            </div>
            <h2 id="intro-title">{room.intro.title}</h2>
            <p className="intro-body">{room.intro.body}</p>

            <div className="intro-choices">
              {deckLink ? (
                <a
                  className="intro-choice"
                  href={deckLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    dismissIntro();
                    setShowWork(true);
                  }}
                >
                  <b>{room.intro.deck_cta}</b>
                  <span>{room.intro.deck_note}</span>
                </a>
              ) : null}

              <button
                type="button"
                className="intro-choice is-ask"
                autoFocus
                onClick={() => {
                  dismissIntro();
                  input.current?.focus();
                }}
              >
                <b>{room.intro.ask_cta}</b>
                <span>{room.intro.ask_note}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ---------------- topbar ---------------- */}
      <header className="topbar">
        <div className="brand">
          <span className="lamp" /> {room.company} <span className="date">· {room.stage}</span>
        </div>

        {/* the second way to the deck — the first is each slide's own link */}
        {deckLink ? (
          <a className="deck-btn" href={deckLink.url} target="_blank" rel="noopener noreferrer">
            The deck <span className="deck-btn-n">{total}</span> ↗
          </a>
        ) : null}

        <nav className="tabs" aria-label="Panes">
          <button type="button" className={`tab${showWork ? '' : ' active'}`} onClick={() => setShowWork(false)}>
            Ask
          </button>
          <button type="button" className={`tab${showWork ? ' active' : ''}`} onClick={() => setShowWork(true)}>
            Deck <span className="badge">·{total}</span>
          </button>
        </nav>

        <div className="spacer" />
        <div className="status-line">
          <span className="pulse" />
          {room.status_line}
        </div>
        {/* the other documents — the deck has its own button on the left, and a
            blank url is left out rather than shipped as a link that 404s */}
        {room.links
          .filter((l) => l.url && l.id !== 'deck')
          .map((l) => (
            <a
              key={l.id}
              className="kbd"
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              title={l.note ?? l.label}
            >
              {l.label} ↗
            </a>
          ))}

        <button type="button" className="kbd" onClick={() => input.current?.focus()} title="Focus the composer">
          ⌘K
        </button>
      </header>

      <main className={`workspace${showWork ? ' show-work' : ''}`}>
        {/* ================= the conversation ================= */}
        <section className={`pane-chat${engaged ? ' engaged' : ''}`} aria-label="Ask Allya">
          <Island room={room} pointers={pointers} onPointer={openSlide} />

          <div className="canvas">
            <div className="canvas-inner">
              <p className="canvas-greet">{room.greeting}</p>

              <div className="c-sec brain-box">
                <div className="brain-head">
                  <span className="brain-title">
                    <span className="brain-live" /> {room.brain_title}
                  </span>
                  <span className="brain-side">
                    <span className="brain-sub">{room.brain_subtitle}</span>
                  </span>
                </div>
                <BrainCanvas
                  className="brain-canvas"
                  options={brainOptions}
                  onReady={onBrainReady}
                  onTap={onNodeTap}
                />
              </div>

              <div className="c-row">
                <section className="c-sec learnt">
                  <div className="group-label">
                    {panelOf('pointers')?.title} <span className="count">{pointers.length}</span>
                  </div>
                  <p className="c-blurb">{panelOf('pointers')?.blurb}</p>
                  {pointers.length === 0 ? (
                    <p className="kf-empty">Nothing pinned yet.</p>
                  ) : (
                    <div className="kf-feed">
                      {pointers.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="kf-row"
                          onClick={() => {
                            openSlide(p.slide_id);
                            setShowWork(true);
                          }}
                        >
                          <span className="kf-text">{p.text}</span>
                          <span className="kf-slide">{p.slide_id}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </section>

                <section className="c-sec">
                  <div className="group-label">{panelOf('ask')?.title}</div>
                  <p className="c-blurb">{panelOf('ask')?.blurb}</p>
                  {room.metrics.map((m) => (
                    <div key={m.label} className="day-row">
                      <span className="dr-time">{m.value}</span>
                      <span className="dr-what">{m.label}</span>
                    </div>
                  ))}
                </section>
              </div>

              <p className="canvas-hint">Touch the brain, or use the bar below when you want to ask</p>
            </div>
          </div>

          <div className="thread-scroll" ref={scroller}>
            <div className="day-mark">
              Ask us anything
              <button type="button" onClick={() => setEngaged(false)}>
                ← back to the brain
              </button>
            </div>

            {turns.map((t) => (
              <div key={t.key}>
                <div className="msg from-you">
                  <div className="msg-block">
                    <div className="bubble you">{t.question}</div>
                  </div>
                </div>
                <div className="msg change">
                  <div className="msg-block">
                    <div className="speaker">Allya</div>
                    <div className="bubble allya">
                      <RichText text={t.text} />
                    </div>
                    {t.slideId ? (
                      <div className="msg-tools">
                        <button
                          type="button"
                          className="tool"
                          onClick={() => {
                            openSlide(t.slideId!);
                            setShowWork(true);
                          }}
                        >
                          Slide {t.slideId} →
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}

            {asking ? (
              <div className="msg change">
                <div className="msg-block">
                  <div className="speaker">Allya</div>
                  <div className="bubble allya typing" aria-label="Allya is answering">
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
              </div>
            ) : null}

            {turns.length === 0 && !asking ? (
              <details className="all-q" open>
                <summary>Every question the brain holds</summary>
                <div className="q-list">
                  {questionList.map((n) => (
                    <button key={n.id} type="button" onClick={() => void ask(n.question!, n.id)}>
                      {n.question}
                    </button>
                  ))}
                </div>
              </details>
            ) : null}
          </div>

          {/* ---------------- composer ---------------- */}
          <div className="composer">
            {suggestOpen && !draft ? (
              <div className="suggest">
                <div className="suggest-label">What investors open with</div>
                {room.openers.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    className="suggest-item"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => void ask(o.text)}
                  >
                    {o.text}
                  </button>
                ))}
              </div>
            ) : null}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const text = draft.trim();
                if (!text || asking) return;
                setDraft('');
                void ask(text);
              }}
            >
              <div className="field">
                <input
                  ref={input}
                  type="text"
                  value={draft}
                  disabled={asking}
                  placeholder={room.composer_placeholder}
                  aria-label="Your question"
                  onChange={(e) => setDraft(e.target.value)}
                  onFocus={() => setSuggestOpen(true)}
                  onBlur={() => setSuggestOpen(false)}
                />
                <PressButton className="send" type="submit" disabled={asking || !draft.trim()} aria-label="Ask">
                  <ArrowIcon />
                </PressButton>
              </div>
            </form>
          </div>
        </section>

        {/* ================= the deck ================= */}
        <aside className="pane-work" ref={paneWork} aria-label="The pitch deck">
          <div className="work-head">
            <h2>{panelOf('deck')?.title}</h2>
            <span className="split-note">
              <b>{featured.length}</b> key · <b>{total}</b> slides
            </span>
          </div>
          <p className="c-blurb work-blurb">{panelOf('deck')?.blurb}</p>

          {slideError ? <p className="kf-empty">{slideError}</p> : null}

          <div className="group-label">
            {panelOf('key')?.title} <span className="count">{featured.length}</span>
          </div>
          <p className="c-blurb">{panelOf('key')?.blurb}</p>
          {featured.map((s) => (
            <div key={s.id} data-slide={s.id}>
              <button
                type="button"
                className={`slide-card${openId === s.id ? ' is-open' : ''}`}
                aria-expanded={openId === s.id}
                onClick={() => openSlide(openId === s.id ? null : s.id)}
              >
                <div className="who">
                  <span className="n">{s.id}</span>
                  <span className="name">
                    {s.label}
                    {/* several slides use the label as their kicker — don't say it twice */}
                    {s.kicker && s.kicker !== s.label ? <span className="role"> · {s.kicker}</span> : null}
                  </span>
                </div>
                <p className="say">{s.headline}</p>
                {s.feature_note ? <p className="note">{s.feature_note}</p> : null}
                {s.stats.length ? (
                  <div className="slide-stats">
                    {s.stats.map((st) => (
                      <div key={st.label} className="slide-stat">
                        <b>{st.value}</b>
                        <span>{st.label}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </button>
              {openId === s.id ? (
                <SlideBody full={slides[s.id]} hideHeadline deckUrl={s.deck_url} label={s.label} />
              ) : null}
            </div>
          ))}

          <div className="group-label">
            {panelOf('rest')?.title} <span className="count">{rest.length}</span>
          </div>
          <p className="c-blurb">{panelOf('rest')?.blurb}</p>
          {rest.map((s) => (
            <div key={s.id} data-slide={s.id}>
              <button
                type="button"
                className={`work-row${openId === s.id ? ' is-open' : ''}`}
                aria-expanded={openId === s.id}
                onClick={() => openSlide(openId === s.id ? null : s.id)}
              >
                <span className="pill">{s.id}</span>
                <span className="w-copy">
                  <span className="t">{s.label}</span>
                  <span className="s">{s.kicker}</span>
                </span>
              </button>
              {openId === s.id ? <SlideBody full={slides[s.id]} deckUrl={s.deck_url} label={s.label} /> : null}
            </div>
          ))}
        </aside>
      </main>
    </div>
  );
}

/* ============================================================
   The opened slide's contents. Summaries arrive with the list; the body
   is fetched on open and cached, so this renders a spinner once per slide.
   ============================================================ */
function SlideBody({
  full,
  hideHeadline,
  deckUrl,
  label,
}: {
  full?: Slide;
  hideHeadline?: boolean;
  deckUrl: string;
  label: string;
}) {
  if (!full) {
    return (
      <div className="slide-body slide-loading">
        <span className="spinner" />
      </div>
    );
  }
  return (
    <div className="slide-body">
      {!hideHeadline ? <div className="slide-kicker">{full.kicker}</div> : null}
      <ul className="slide-lines">
        {full.lines.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
      {full.say ? <p className="slide-say">{full.say}</p> : null}
      {/* the deck deep-links by slide, so this lands on the real thing */}
      <a className="slide-open" href={deckUrl} target="_blank" rel="noopener noreferrer">
        Open “{label}” in the deck ↗
      </a>
    </div>
  );
}

/* ============================================================
   The dynamic island — the product's split pill. Left half steps through
   the numbers; right half runs the deck past continuously. Expanding is a
   transition on the same element, not a popup.

   Both tickers are CSS transforms, so they run on the compositor and cost
   no per-frame JavaScript.
   ============================================================ */
function Island({
  room,
  pointers,
  onPointer,
}: {
  room: Room;
  pointers: Pointer[];
  onPointer: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const kpis = room.metrics;

  // step one KPI at a time, wrapping through a trailing clone
  useEffect(() => {
    if (reduced || kpis.length < 2) return;
    // the extra step lands on the trailing clone; the one after snaps home
    const iv = setInterval(() => setIdx((n) => (n + 1) % (kpis.length + 1)), 3200);
    return () => clearInterval(iv);
  }, [reduced, kpis.length]);

  // drive the step with a transform. Coming off the clone back to 0 is the
  // one move that must not animate, or the strip slides backwards.
  const prev = useRef(0);
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const w = el.clientWidth;
    const snap = idx === 0 && prev.current === kpis.length;
    el.style.transition = snap ? 'none' : 'transform 500ms var(--spring)';
    el.style.transform = `translateX(-${idx * w}px)`;
    prev.current = idx;
  }, [idx, kpis.length]);

  // the running strip: measure one copy, then let CSS loop it
  useEffect(() => {
    const el = list.current;
    if (!el) return;
    const w = el.scrollWidth / 2;
    if (!w) return;
    el.style.setProperty('--loop', `-${w}px`);
    el.style.animation = reduced ? 'none' : `todo-scroll ${w / 34}s linear infinite`;
  }, [pointers, reduced]);

  const strip = pointers.length ? pointers : [{ id: 'x', text: 'The deck is loading', slide_id: '01' }];

  return (
    <div className="island-wrap">
      <div className={`island${open ? ' is-open' : ''}`} aria-expanded={open}>
        <div className="isl-row">
          <div className="isl-cell isl-kpi" onClick={() => setOpen((v) => !v)} role="presentation">
            <span className="isl-dot" />
            <div className="kpi-track">
              <div className="kpi-rail" ref={track}>
                {[...kpis, kpis[0]].filter(Boolean).map((k, i) => (
                  <div key={i} className="kpi-item" style={{ transform: `translateX(${i * 100}%)` }}>
                    <span>
                      <b>{k.value}</b> {k.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button type="button" className="isl-cell isl-todo" onClick={() => setOpen((v) => !v)} aria-label="Expand">
            <span className="todo-tag">deck</span>
            <div className="todo-track">
              <div className="todo-list" ref={list}>
                {[...strip, ...strip].map((p, i) => (
                  <div key={i} className="todo-item">
                    <span className={`td-dot${i % 3 === 0 ? ' needs' : ''}`} />
                    {p.text}
                  </div>
                ))}
              </div>
            </div>
          </button>
        </div>

        <div className="island-detail">
          <div className="idet-pane idet-left">
            <div className="idet-group">The ask</div>
            {kpis.map((k) => (
              <div key={k.label} className="idet-kpi">
                <b>{k.value}</b>
                {k.label}
              </div>
            ))}
          </div>
          <div className="idet-pane">
            <div className="idet-group">From the deck</div>
            {pointers.map((p) => (
              <button key={p.id} type="button" className="idet-row" onClick={() => onPointer(p.slide_id)}>
                <span className="td-dot needs" />
                <span className="idet-copy">
                  <span className="idet-t">{p.text}</span>
                </span>
                <span className="pill">{p.slide_id}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
