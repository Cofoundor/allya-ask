'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrainCanvas } from '@/components/BrainCanvas';
import { Gate } from '@/components/Gate';
import { authenticate, createAccount, taskStatus } from '@/lib/api/auth';
import type { BrainHandle } from '@/lib/brain';
import { CROSS, NODES } from '@/lib/graph';
import { useTimers } from '@/lib/hooks';

/* The sign-in gate. On success it hands over to the investor room — this
   page is the door, /investors is the room behind it. */
export default function LoginPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const brain = useRef<BrainHandle | null>(null);
  const { after } = useTimers();

  const onBrainReady = useCallback((handle: BrainHandle) => {
    brain.current = handle;
  }, []);

  function enter() {
    brain.current?.bloom();
    router.push('/investors');
  }

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
      enter();
    } catch (err) {
      console.error('Authentication failed:', err);
      setError(message(err, 'Authentication failed. Please try again.'));
      setStatus('');
      setBusy(false);
    }
  }

  return (
    <main className="shell is-gate">
      <BrainCanvas className="ambient" options={{ nodes: NODES, cross: CROSS }} onReady={onBrainReady} />
      <Gate onSubmit={startSession} busy={busy} status={status} error={error} />
    </main>
  );
}

function message(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}
