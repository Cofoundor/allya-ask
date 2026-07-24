'use client';

import { useCallback, useRef, useState } from 'react';
import { BrainCanvas } from '@/components/BrainCanvas';
import { Composer } from '@/components/Composer';
import { Gate } from '@/components/Gate';
import { Toast } from '@/components/Toast';
import { Transcript, type Msg } from '@/components/Transcript';
import { ask, authenticate, createAccount, fetchHistory, taskStatus } from '@/lib/api';
import type { BrainHandle, NodeSpec } from '@/lib/brain';
import { CROSS, NODES, OPENERS, QUESTIONS } from '@/lib/graph';
import { useTimers } from '@/lib/hooks';

const GREETING = 'Hey there — ask me anything about ZeroTo10.';
const OFFLINE = "I'm having trouble connecting right now. Please try again in a moment.";

let seq = 0;
const nextId = () => `m${++seq}`;

export default function Page() {
  const [phase, setPhase] = useState<'gate' | 'chat'>('gate');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const [messages, setMessages] = useState<Msg[]>([]);
  const [thinking, setThinking] = useState(false);
  const [asked, setAsked] = useState(false);
  const [seed, setSeed] = useState<{ text: string; nonce: number } | null>(null);
  const [copied, setCopied] = useState(0);

  const brain = useRef<BrainHandle | null>(null);
  const { after } = useTimers();

  const onBrainReady = useCallback((handle: BrainHandle) => {
    brain.current = handle;
  }, []);

  /* ---- the gate: create an account, then sign in ---- */

  function startSession(email: string) {
    if (busy) return;
    setBusy(true);
    setError('');
    setStatus('Creating your account…');

    (async () => {
      try {
        const taskId = await createAccount(email);
        after(1000, () => poll(taskId, email));
      } catch (err) {
        console.error('Account creation failed:', err);
        setError(message(err, 'Account creation failed. Please try again.'));
        setStatus('');
        setBusy(false);
      }
    })();
  }

  function poll(taskId: string, email: string) {
    (async () => {
      try {
        const result = await taskStatus(taskId);
        if (result.status === 'COMPLETED') {
          setStatus('Signing you in…');
          await signIn(email);
        } else if (result.status === 'FAILURE') {
          throw new Error(result.reason || 'Account creation failed. Please try again.');
        } else if (result.status === 'INPROGRESS') {
          setStatus(result.content || 'Creating your account…');
          after(2000, () => poll(taskId, email));
        } else {
          throw new Error('Unknown task status. Please try again.');
        }
      } catch (err) {
        console.error('Polling failed:', err);
        setError(message(err, 'Account creation failed. Please try again.'));
        setStatus('');
        setBusy(false);
      }
    })();
  }

  async function signIn(email: string) {
    try {
      await authenticate(email);
      setStatus('');
      setPhase('chat');
      brain.current?.bloom();
      await loadHistory();
    } catch (err) {
      console.error('Authentication failed:', err);
      setError(message(err, 'Authentication failed. Please try again.'));
      setStatus('');
    } finally {
      setBusy(false);
    }
  }

  /* ---- the conversation ---- */

  async function loadHistory() {
    setThinking(true);
    try {
      const entries = await fetchHistory();
      if (Array.isArray(entries) && entries.length) {
        // each entry pairs the reply that preceded the question with the
        // question itself, which is the order the service stores them in
        const restored: Msg[] = [];
        for (const e of entries) {
          if (e.chatbot_response?.trim()) restored.push({ id: nextId(), from: 'allya', text: e.chatbot_response });
          if (e.chatbot_prompt?.trim()) restored.push({ id: nextId(), from: 'you', text: e.chatbot_prompt });
        }
        setMessages(restored);
        setAsked(restored.some((m) => m.from === 'you'));
      } else {
        // no history: the service opens the conversation itself
        const opening = await ask('').catch(() => GREETING);
        setMessages([{ id: nextId(), from: 'allya', text: opening }]);
      }
    } catch (err) {
      console.error('Could not load history:', err);
      setMessages([{ id: nextId(), from: 'allya', text: GREETING }]);
    } finally {
      setThinking(false);
    }
  }

  const send = useCallback(
    async (text: string, replay = false) => {
      if (!replay) setMessages((prev) => [...prev, { id: nextId(), from: 'you', text }]);
      setAsked(true);
      setThinking(true);
      brain.current?.fireThought(); // a question goes into the graph

      try {
        let answer: string;
        try {
          answer = await ask(text);
        } catch (err) {
          // one silent retry — a dropped connection is not worth a red bubble
          if (!isNetworkError(err)) throw err;
          answer = await ask(text);
        }
        setMessages((prev) => [...prev, { id: nextId(), from: 'allya', text: answer }]);
        brain.current?.bloom(); // and the whole brain lights up with the answer
      } catch (err) {
        console.error('Chat request failed:', err);
        setMessages((prev) => [...prev, { id: nextId(), from: 'allya', text: OFFLINE, errorFor: text }]);
      } finally {
        setThinking(false);
      }
    },
    [],
  );

  const retry = useCallback(
    (prompt: string) => {
      setMessages((prev) => prev.filter((m) => !m.errorFor));
      void send(prompt, true);
    },
    [send],
  );

  const onNodeTap = useCallback((node: NodeSpec) => {
    const question = QUESTIONS[node.id];
    if (question) setSeed({ text: question, nonce: Date.now() });
  }, []);

  return (
    <main className={`shell is-${phase}`}>
      {/* mounted once, above both screens — it keeps thinking through the
          transition instead of restarting behind the conversation */}
      <BrainCanvas
        className="ambient"
        options={{ nodes: NODES, cross: CROSS }}
        onReady={onBrainReady}
        onTap={onNodeTap}
      />

      {phase === 'gate' ? (
        <Gate onSubmit={startSession} busy={busy} status={status} error={error} />
      ) : (
        <div className="chat">
          <header className="topbar">
            <div className="mark">
              <span className="lamp" />
              Allya
              <span className="pill">preview</span>
            </div>
            <div className="topbar-note">ZeroTo10</div>
          </header>

          <Transcript
            messages={messages}
            thinking={thinking}
            chips={asked ? null : OPENERS}
            onChip={(text) => void send(text)}
            onRetry={retry}
            onCopied={() => setCopied(Date.now())}
          />

          {/* a zero-height rail just above the composer — the toast hangs off
              it, so it stays clear however tall the question grows */}
          <div className="toast-rail">
            <Toast message="Copied to clipboard" nonce={copied} />
          </div>

          {/* keyed on the tap, so a seeded question replaces the box by
              remounting rather than by an effect writing into state */}
          <Composer
            key={seed?.nonce ?? 'composer'}
            initial={seed?.text}
            onSend={(text) => void send(text)}
            disabled={thinking}
          />
        </div>
      )}
    </main>
  );
}

function message(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

function isNetworkError(err: unknown) {
  return err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'));
}
