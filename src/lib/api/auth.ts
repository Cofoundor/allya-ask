/* ============================================================
   The sign-in contract.

   Unchanged from the service already behind ask.zeroto10.xyz, so this page
   is a drop-in replacement for its login:

     POST /api/create-new-user-account-investor   { email_id } -> { task_id }
     GET  /api/create-new-user-account-investor/status/{task_id}
     POST /api/authentication                     form-encoded, sets a cookie

   Every call is credentialed — the session lives in a first-party cookie,
   which is why /api is served from this origin (see next.config.ts).

   The investor room's own data comes from a different service; see
   src/lib/api/investor.ts.
   ============================================================ */

export type TaskState = 'COMPLETED' | 'FAILURE' | 'INPROGRESS';

export interface TaskStatus {
  status: TaskState | string;
  content?: string;
  reason?: string;
}

const json = { 'Content-Type': 'application/json' };

/** Start account creation. Returns the task id to poll. */
export async function createAccount(email: string): Promise<string> {
  const res = await fetch('/api/create-new-user-account-investor', {
    method: 'POST',
    headers: json,
    credentials: 'include',
    body: JSON.stringify({ email_id: email }),
  });
  if (!res.ok) throw new Error(`Account creation failed with status ${res.status}`);
  const { task_id } = (await res.json()) as { task_id: string };
  return task_id;
}

export async function taskStatus(taskId: string): Promise<TaskStatus> {
  const res = await fetch(`/api/create-new-user-account-investor/status/${taskId}`, {
    method: 'GET',
    credentials: 'include',
  });
  if (res.ok) return (await res.json()) as TaskStatus;
  if (res.status === 404) throw new Error('Task not found. Please try again.');
  if (res.status === 500) {
    const body = await res.json().catch(() => ({}) as { detail?: string });
    throw new Error(body.detail || 'Account creation failed. Please try again.');
  }
  throw new Error(`Status check failed with status ${res.status}`);
}

/* The preview's session is issued against a fixed pair the backend derives
   from the email — not a secret, and not something the visitor types. */
export async function authenticate(email: string): Promise<void> {
  const form = new FormData();
  form.append('username', `investor-${email}`);
  form.append('password', 'password');
  const res = await fetch('/api/authentication', {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  if (!res.ok) throw new Error(`Authentication failed with status ${res.status}`);
}
