'use client';

import { useCallback, useRef, useState } from 'react';
import { BrainCanvas } from '@/components/BrainCanvas';
import { PressButton } from '@/components/Pressable';
import { ArrowIcon } from '@/components/icons';
import { RichText } from '@/lib/markdown';
import type { BrainHandle, NodeSpec } from '@/lib/brain';
import { POINTERS, SLIDES } from '@/lib/deck';
import { BY_ID, CROSS, NODES, OPENERS, findAnswer } from '@/lib/investor-qa';
import './investors.css';

interface Turn {
  id: string;
  q: string;
  a: string;
  slide?: string;
}

let seq = 0;
const nextId = () => `t${++seq}`;

export default function InvestorRoom() {
  const [slide, setSlide] = useState(0);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const brain = useRef<BrainHandle | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  const onBrainReady = useCallback((h: BrainHandle) => {
    brain.current = h;
  }, []);

  /* an answer lands: append it, light the graph, and scroll it into view */
  const answer = useCallback((q: string, a: string, nodeId?: string, slideRef?: string) => {
    setTurns((prev) => [...prev, { id: nextId(), q, a, slide: slideRef }]);
    brain.current?.fireThought(nodeId);
    brain.current?.bloom();
    // a timeout, not rAF — a throttled tab must never strand the scroll
    setTimeout(() => {
      const el = scroller.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }, 30);
  }, []);

  const askById = useCallback(
    (id: string) => {
      const qa = BY_ID[id];
      if (!qa) return;
      answer(qa.q, qa.a, id, qa.slide);
    },
    [answer],
  );

  const askText = useCallback(
    (text: string) => {
      const hit = findAnswer(text);
      if (hit) {
        answer(text, hit.a, hit.id, hit.slide);
        return;
      }
      answer(
        text,
        "That one is not in the brain yet — this room answers the questions the deck can back with a number or a source, and makes no attempt to bluff the rest.\n\nPut it to Sanshat directly and it will be answered properly: **sanshat@zeroto10teams.xyz**\n\nIn the meantime, the sharpest things in here are the moat, the human 15% at scale, and the use of funds.",
      );
    },
    [answer],
  );

  const onNodeTap = useCallback(
    (node: NodeSpec) => {
      askById(node.id);
      const qa = BY_ID[node.id];
      if (qa?.slide) {
        const i = SLIDES.findIndex((s) => s.n === qa.slide);
        if (i >= 0) setSlide(i);
      }
    },
    [askById],
  );

  function jumpToSlide(n: string) {
    const i = SLIDES.findIndex((s) => s.n === n);
    if (i < 0) return;
    setSlide(i);
    const row = railRef.current?.querySelector<HTMLElement>(`[data-slide="${n}"]`);
    row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  const current = SLIDES[slide];

  return (
    <div className="iv">
      {/* ---------------- topbar ---------------- */}
      <header className="iv-top">
        <div className="iv-brand">
          <span className="lamp" />
          ZeroTo10
          <span className="pill">Pre-seed</span>
        </div>
        <div className="iv-top-mid">Ask us anything — before you ask us.</div>
        <div className="iv-top-right">
          <span className="iv-ask-chip">
            <b>₹4 Cr</b> for 7%
          </span>
          <span className="iv-ask-chip iv-quiet">MVP live</span>
        </div>
      </header>

      <div className="iv-body">
        {/* ---------------- left rail: the deck ---------------- */}
        <aside className="iv-rail" aria-label="The pitch deck">
          <div className="iv-rail-head">
            <span className="group-label">The deck</span>
            <span className="iv-rail-count">{SLIDES.length} slides</span>
          </div>

          <div className="iv-rail-list" ref={railRef}>
            {SLIDES.map((s, i) => {
              const open = i === slide;
              return (
                <div key={s.n} className={`iv-slide${open ? ' is-open' : ''}`} data-slide={s.n}>
                  <button
                    type="button"
                    className="iv-slide-btn"
                    aria-expanded={open}
                    onClick={() => setSlide(open ? -1 : i)}
                  >
                    <span className="iv-slide-n">{s.n}</span>
                    <span className="iv-slide-label">{s.label}</span>
                  </button>

                  {open ? (
                    <div className="iv-slide-body">
                      <div className="iv-kicker">{s.kicker}</div>
                      <h3 className="iv-headline">{s.headline}</h3>

                      {s.stats?.length ? (
                        <div className="iv-stats">
                          {s.stats.map((st) => (
                            <div key={st.k} className="iv-stat">
                              <b>{st.v}</b>
                              <span>{st.k}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      <ul className="iv-lines">
                        {s.lines.map((l, j) => (
                          <li key={j}>{l}</li>
                        ))}
                      </ul>

                      {s.say ? <p className="iv-say">{s.say}</p> : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ---------------- main: the brain ---------------- */}
        <main className="iv-main">
          <p className="iv-greet">
            Here&apos;s what I know about <em>ZeroTo10</em> — touch anything and I&apos;ll answer it.
          </p>

          <div className="iv-brain">
            <div className="iv-brain-head">
              <span className="iv-brain-title">
                <span className="brain-live" /> The brain
              </span>
              <span className="iv-brain-sub">every question an investor asks — touch it</span>
            </div>
            <BrainCanvas
              className="iv-brain-canvas"
              options={{ nodes: NODES, cross: CROSS, thoughtEvery: 4, leafSpread: 0.33 }}
              onReady={onBrainReady}
              onTap={onNodeTap}
            />
          </div>

          <div className="iv-scroll" ref={scroller}>
            {/* what the product page calls "What I know" */}
            <div className="iv-row">
              <section className="iv-card">
                <div className="group-label">From the deck</div>
                <div className="iv-pointers">
                  {POINTERS.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      className="iv-pointer"
                      onClick={() => jumpToSlide(p.slide)}
                      title={`Open slide ${p.slide}`}
                    >
                      <span className="iv-pointer-text">{p.text}</span>
                      <span className="iv-pointer-slide">{p.slide}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="iv-card iv-card-narrow">
                <div className="group-label">The ask</div>
                <div className="iv-asks">
                  {[
                    ['₹4 Cr', 'capital raise'],
                    ['7%', 'equity offered'],
                    ['₹57 Cr', 'post-money'],
                    ['24 mo', 'runway at ~₹15 L/mo'],
                    ['85 / 15', 'agents / human gate'],
                    ['₹35K', 'blended ARPU / yr'],
                  ].map(([v, k]) => (
                    <div key={k} className="iv-askrow">
                      <b>{v}</b>
                      <span>{k}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* the conversation */}
            <div className="iv-thread">
              {turns.length === 0 ? (
                <div className="iv-empty">
                  <div className="group-label">Start here</div>
                  <div className="chips">
                    {OPENERS.map((o) => (
                      <PressButton
                        key={o}
                        type="button"
                        className="chip"
                        pressScale={0.94}
                        onClick={() => askText(o)}
                      >
                        {o}
                      </PressButton>
                    ))}
                  </div>
                </div>
              ) : null}

              {turns.map((t) => (
                <div key={t.id} className="iv-turn">
                  <div className="msg from-you">
                    <div className="msg-block">
                      <div className="bubble you">{t.q}</div>
                    </div>
                  </div>
                  <div className="msg change">
                    <div className="msg-block">
                      <div className="speaker">Allya</div>
                      <div className="bubble allya">
                        <RichText text={t.a} />
                      </div>
                      {t.slide ? (
                        <div className="msg-tools">
                          <button type="button" className="tool" onClick={() => jumpToSlide(t.slide!)}>
                            Slide {t.slide} →
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ---------------- composer ---------------- */}
          <form
            className="iv-composer"
            onSubmit={(e) => {
              e.preventDefault();
              const text = draft.trim();
              if (!text) return;
              askText(text);
              setDraft('');
            }}
          >
            <div className="field">
              <input
                type="text"
                value={draft}
                placeholder="Ask anything — pricing, the moat, the 15%, the raise…"
                aria-label="Your question"
                onChange={(e) => setDraft(e.target.value)}
              />
              <PressButton className="send" type="submit" disabled={!draft.trim()} aria-label="Ask">
                <ArrowIcon />
              </PressButton>
            </div>
            <p className="iv-hint">
              {current ? (
                <>
                  Showing slide <b>{current.n}</b> · {current.label}
                </>
              ) : (
                <>Pick a slide on the left, or touch a node in the brain</>
              )}
            </p>
          </form>
        </main>
      </div>
    </div>
  );
}
