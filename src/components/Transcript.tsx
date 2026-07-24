'use client';

import { useEffect, useRef, useState } from 'react';
import { RichText } from '@/lib/markdown';
import { useReducedMotion } from '@/lib/hooks';
import { PressButton } from './Pressable';
import { CopyIcon, RetryIcon, TickIcon } from './icons';

export interface Msg {
  id: string;
  from: 'allya' | 'you';
  text: string;
  /** a failed turn — offers the question back rather than swallowing it */
  errorFor?: string;
}

interface Props {
  messages: Msg[];
  thinking: boolean;
  /** shown until the first question — the openers */
  chips: string[] | null;
  onChip: (text: string) => void;
  onRetry: (prompt: string) => void;
  onCopied: () => void;
}

export function Transcript({ messages, thinking, chips, onChip, onRetry, onCopied }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    // only follow along if you were already at the bottom — reading back
    // through an earlier answer should not be yanked away
    if (el.scrollHeight - el.scrollTop - el.clientHeight >= 120) return;
    // a timeout, not rAF — a throttled tab must never strand the flow
    const id = setTimeout(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: reduced ? 'auto' : 'smooth' });
    }, 0);
    return () => clearTimeout(id);
  }, [messages, thinking, chips, reduced]);

  return (
    <div className="transcript" ref={scroller}>
      <div className="transcript-inner">
        {messages.map((m, i) => {
          const changed = i > 0 && messages[i - 1].from !== m.from;
          return (
            <div key={m.id} className={`msg${m.from === 'you' ? ' from-you' : ''}${changed ? ' change' : ''}`}>
              <div className="msg-block">
                {m.from === 'allya' && !m.errorFor ? <div className="speaker">Allya</div> : null}
                <div className={`bubble ${m.from}${m.errorFor ? ' is-error' : ''}`}>
                  {m.from === 'allya' ? <RichText text={m.text} /> : m.text}
                </div>
                {m.errorFor ? (
                  <div className="msg-tools">
                    <PressButton type="button" className="tool" onClick={() => onRetry(m.errorFor!)}>
                      <RetryIcon />
                      Try again
                    </PressButton>
                  </div>
                ) : m.from === 'allya' ? (
                  <CopyRow text={m.text} onCopied={onCopied} />
                ) : null}
              </div>
            </div>
          );
        })}

        {thinking ? (
          <div className="msg change">
            <div className="msg-block">
              <div className="speaker">Allya</div>
              <div className="bubble allya typing" aria-label="Allya is thinking">
                <i />
                <i />
                <i />
              </div>
            </div>
          </div>
        ) : null}

        {chips?.length ? (
          <div className="chips">
            {chips.map((c) => (
              <PressButton key={c} type="button" className="chip" pressScale={0.94} onClick={() => onChip(c)}>
                {c}
              </PressButton>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CopyRow({ text, onCopied }: { text: string; onCopied: () => void }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => setDone(false), 1600);
    return () => clearTimeout(id);
  }, [done]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      onCopied();
    } catch {
      // clipboard blocked (insecure origin, denied permission) — say nothing,
      // the answer is right there to select
    }
  }

  return (
    <div className="msg-tools">
      <PressButton type="button" className="tool" onClick={copy} aria-label="Copy answer">
        {done ? <TickIcon /> : <CopyIcon />}
        {done ? 'Copied' : 'Copy'}
      </PressButton>
    </div>
  );
}
