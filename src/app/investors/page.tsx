'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrainCanvas } from '@/components/BrainCanvas';
import { PressButton } from '@/components/Pressable';
import { ArrowIcon } from '@/components/icons';
import { RichText } from '@/lib/markdown';
import type { BrainHandle, BrainOptions, NodeSpec } from '@/lib/brain';
import {
  ApiError,
  getBrain,
  getRoom,
  getSlide,
  listPointers,
  listSlides,
  postAnswer,
  type BrainGraph,
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
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openId || slides[openId]) return;
    const ac = new AbortController();
    getSlide(openId, ac.signal)
      .then((s) => setSlides((prev) => ({ ...prev, [s.id]: s })))
      .catch((err: unknown) => {
        if (ac.signal.aborted) return;
        setSlideError(err instanceof ApiError && err.status === 404 ? 'That slide is gone.' : 'Could not load that slide.');
      });
    return () => ac.abort();
  }, [openId, slides]);

  const openSlide = useCallback((id: string | null) => {
    setSlideError(null);
    setOpenId(id);
    if (!id) return;
    // let the row render before scrolling to it
    requestAnimationFrame(() => {
      railRef.current?.querySelector<HTMLElement>(`[data-slide="${id}"]`)?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    });
  }, []);

  /* ---------------- the conversation ---------------- */
  const [turns, setTurns] = useState<Turn[]>([]);
  const [asking, setAsking] = useState(false);
  const [draft, setDraft] = useState('');
  const brainRef = useRef<BrainHandle | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const onBrainReady = useCallback((h: BrainHandle) => {
    brainRef.current = h;
  }, []);

  const ask = useCallback(
    async (question: string, nodeId?: string) => {
      if (asking) return;
      setAsking(true);
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
    if (!turns.length) return;
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [turns.length, asking]);

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

  /* every question the canvas can be clicked for, for people not using a mouse */
  const questionList = useMemo(
    () => (brain?.nodes ?? []).filter((n) => n.tier === 2 && n.question),
    [brain],
  );

  /* ---------------- states before the room exists ---------------- */
  if (loadError) {
    return (
      <div className="iv iv-center">
        <div className="iv-panel">
          <div className="group-label">The room is offline</div>
          <p className="iv-panel-text">{loadError}</p>
          <PressButton type="button" className="cta" onClick={() => setAttempt((n) => n + 1)}>
            Try again
          </PressButton>
        </div>
      </div>
    );
  }

  if (!room || !brainOptions) {
    return (
      <div className="iv iv-center">
        <div className="iv-panel">
          <span className="spinner" />
          <p className="iv-panel-text">Waking the brain…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="iv">
      <header className="iv-top">
        <div className="iv-brand">
          <span className="lamp" />
          {room.company}
          <span className="pill">{room.stage}</span>
        </div>
        <div className="iv-top-mid">{room.tagline}</div>
        <div className="iv-top-right">
          {room.chips.map((c) => (
            <span key={c.value} className={`iv-ask-chip${c.label ? '' : ' iv-quiet'}`}>
              <b>{c.value}</b>
              {c.label ? ` ${c.label}` : null}
            </span>
          ))}
        </div>
      </header>

      <div className="iv-body">
        {/* ---------------- the brain ---------------- */}
        <main className="iv-main">
          <p className="iv-greet">{room.greeting}</p>

          <div className="iv-brain">
            <div className="iv-brain-head">
              <span className="iv-brain-title">
                <span className="brain-live" /> {room.brain_title}
              </span>
              <span className="iv-brain-sub">{room.brain_subtitle}</span>
            </div>
            <BrainCanvas
              className="iv-brain-canvas"
              options={brainOptions}
              onReady={onBrainReady}
              onTap={onNodeTap}
            />
          </div>

          <div className="iv-scroll" ref={scroller}>
            <div className="iv-row">
              <section className="iv-card">
                <div className="group-label">From the deck</div>
                {pointers.length === 0 ? (
                  <p className="iv-muted">Nothing pinned yet.</p>
                ) : (
                  <div className="iv-pointers">
                    {pointers.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="iv-pointer"
                        onClick={() => openSlide(p.slide_id)}
                      >
                        <span className="iv-pointer-text">{p.text}</span>
                        <span className="iv-pointer-slide">{p.slide_id}</span>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <section className="iv-card">
                <div className="group-label">The ask</div>
                <div className="iv-asks">
                  {room.metrics.map((m) => (
                    <div key={m.label} className="iv-askrow">
                      <b>{m.value}</b>
                      <span>{m.label}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="iv-thread">
              {turns.length === 0 && !asking ? (
                <div className="iv-empty">
                  <div className="group-label">Start here</div>
                  <div className="chips">
                    {room.openers.map((o) => (
                      <PressButton
                        key={o.id}
                        type="button"
                        className="chip"
                        pressScale={0.94}
                        onClick={() => void ask(o.text)}
                      >
                        {o.text}
                      </PressButton>
                    ))}
                  </div>

                  <details className="iv-all-q">
                    <summary>Or pick from every question in the brain</summary>
                    <div className="iv-q-list">
                      {questionList.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          className="iv-q"
                          onClick={() => void ask(n.question!, n.id)}
                        >
                          {n.question}
                        </button>
                      ))}
                    </div>
                  </details>
                </div>
              ) : null}

              {turns.map((t) => (
                <div key={t.key} className="iv-turn">
                  <div className="msg from-you">
                    <div className="msg-block">
                      <div className="bubble you">{t.question}</div>
                    </div>
                  </div>
                  <div className="msg change">
                    <div className="msg-block">
                      <div className="speaker">Allya</div>
                      <div className={`bubble allya${t.matched ? '' : ' iv-unmatched'}`}>
                        <RichText text={t.text} />
                      </div>
                      {t.slideId ? (
                        <div className="msg-tools">
                          <button type="button" className="tool" onClick={() => openSlide(t.slideId!)}>
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
            </div>
          </div>

          <form
            className="iv-composer"
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
                type="text"
                value={draft}
                disabled={asking}
                placeholder={room.composer_placeholder}
                aria-label="Your question"
                onChange={(e) => setDraft(e.target.value)}
              />
              <PressButton className="send" type="submit" disabled={asking || !draft.trim()} aria-label="Ask">
                <ArrowIcon />
              </PressButton>
            </div>
          </form>
        </main>

        {/* ---------------- the deck, on the right ---------------- */}
        <aside className="iv-rail" aria-label="The pitch deck">
          <div className="iv-rail-head">
            <span className="group-label">The deck</span>
            <span className="iv-rail-count">{featured.length + rest.length} slides</span>
          </div>

          <div className="iv-rail-list" ref={railRef}>
            {slideError ? <p className="iv-muted iv-rail-error">{slideError}</p> : null}

            <div className="iv-rail-group">
              <div className="group-label iv-group-key">Key slides</div>
              {featured.map((s) => (
                <SlideCard
                  key={s.id}
                  summary={s}
                  full={slides[s.id]}
                  open={openId === s.id}
                  showcase
                  onToggle={() => openSlide(openId === s.id ? null : s.id)}
                />
              ))}
            </div>

            <div className="iv-rail-group">
              <div className="group-label">Everything else</div>
              {rest.map((s) => (
                <SlideCard
                  key={s.id}
                  summary={s}
                  full={slides[s.id]}
                  open={openId === s.id}
                  onToggle={() => openSlide(openId === s.id ? null : s.id)}
                />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ============================================================
   One slide in the rail. Featured slides lead with their headline and
   numbers even while collapsed — that is the showcase. The rest are a
   plain index. Full contents arrive on demand.
   ============================================================ */
function SlideCard({
  summary,
  full,
  open,
  showcase,
  onToggle,
}: {
  summary: SlideSummary;
  full?: Slide;
  open: boolean;
  showcase?: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`iv-slide${open ? ' is-open' : ''}${showcase ? ' is-showcase' : ''}`}
      data-slide={summary.id}
    >
      <button type="button" className="iv-slide-btn" aria-expanded={open} onClick={onToggle}>
        <span className="iv-slide-n">{summary.id}</span>
        <span className="iv-slide-label">{summary.label}</span>
      </button>

      {showcase ? (
        <div className="iv-showcase" onClick={onToggle} role="presentation">
          <h3 className="iv-headline">{summary.headline}</h3>
          {summary.feature_note ? <p className="iv-feature-note">{summary.feature_note}</p> : null}
          {summary.stats.length ? (
            <div className="iv-stats">
              {summary.stats.map((st) => (
                <div key={st.label} className="iv-stat">
                  <b>{st.value}</b>
                  <span>{st.label}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {open ? (
        full ? (
          <div className="iv-slide-body">
            <div className="iv-kicker">{full.kicker}</div>
            {!showcase ? <h3 className="iv-headline">{full.headline}</h3> : null}

            {!showcase && full.stats.length ? (
              <div className="iv-stats">
                {full.stats.map((st) => (
                  <div key={st.label} className="iv-stat">
                    <b>{st.value}</b>
                    <span>{st.label}</span>
                  </div>
                ))}
              </div>
            ) : null}

            <ul className="iv-lines">
              {full.lines.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>

            {full.say ? <p className="iv-say">{full.say}</p> : null}
          </div>
        ) : (
          <div className="iv-slide-body iv-slide-loading">
            <span className="spinner" />
          </div>
        )
      ) : null}
    </div>
  );
}
