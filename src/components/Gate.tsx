'use client';

import { useState, type FormEvent } from 'react';
import { PressButton } from './Pressable';
import { ArrowIcon } from './icons';

interface Props {
  onSubmit: (email: string) => void;
  busy: boolean;
  /** progress while the account is being created */
  status: string;
  error: string;
}

export function Gate({ onSubmit, busy, status, error }: Props) {
  const [email, setEmail] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (value) onSubmit(value);
  }

  return (
    <div className="gate">
      <div className="gate-inner rise-in">
        <div className="mark">
          <span className="lamp" />
          Allya
          <span className="pill">preview</span>
        </div>

        <h1 className="gate-title">
          Ask anything about <em>ZeroTo10</em>.
        </h1>
        <p className="gate-lede">
          Allya knows the business — the product, the market, the numbers, the plan. Leave your email and ask her
          yourself.
        </p>

        <form className="gate-form" onSubmit={submit}>
          <div className="field">
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              disabled={busy}
              placeholder="you@example.com"
              aria-label="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <PressButton className="send" type="submit" disabled={busy} aria-label="Start">
              <ArrowIcon />
            </PressButton>
          </div>
        </form>

        <div className="gate-note" role="status" aria-live="polite">
          {error ? (
            <span className="is-error">{error}</span>
          ) : status ? (
            <>
              <span className="spinner" />
              {status}
            </>
          ) : null}
        </div>

        <p className="gate-foot">85% agents, 15% real experts. We show the seam.</p>
      </div>
    </div>
  );
}
