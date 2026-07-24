'use client';

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { PressButton } from './Pressable';
import { ArrowIcon } from './icons';

interface Props {
  onSend: (text: string) => void;
  disabled: boolean;
  /** a tapped brain node drops its question in — the parent re-keys this
      component so the value is replaced by a fresh mount, not by an effect */
  initial?: string;
}

const MAX_HEIGHT_PX = 148;

export function Composer({ onSend, disabled, initial = '' }: Props) {
  const [value, setValue] = useState(initial);
  const area = useRef<HTMLTextAreaElement>(null);

  // grow with the question, up to a few lines, then scroll
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [value]);

  // take the caret on mount (a seeded question) and whenever Allya finishes
  useEffect(() => {
    if (!disabled) area.current?.focus();
  }, [disabled]);

  function submit(e?: FormEvent) {
    e?.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue('');
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <form className="composer" onSubmit={submit}>
      <div className="composer-inner">
        <div className="field">
          <textarea
            ref={area}
            rows={1}
            value={value}
            disabled={disabled}
            placeholder="Ask Allya about ZeroTo10…"
            aria-label="Your question"
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <PressButton className="send" type="submit" disabled={disabled || !value.trim()} aria-label="Send question">
            <ArrowIcon />
          </PressButton>
        </div>
        <p className="composer-hint">
          Enter to send · Shift + Enter for a new line
          <span className="tap-hint"> · tap a node in the brain to ask about it</span>
        </p>
      </div>
    </form>
  );
}
