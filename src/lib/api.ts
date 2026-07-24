/* ============================================================
   The chat API.

   Same contract as the service already behind ask.zeroto10.xyz, so this
   client is a drop-in replacement:

     POST /api/create-new-user-account-investor   { email_id } -> { task_id }
     GET  /api/create-new-user-account-investor/status/{task_id}
     POST /api/authentication                     form-encoded, sets a cookie
     GET  /api/chatbot/investor/history           -> [{ chatbot_prompt, chatbot_response }]
     POST /api/chatbot/investor                   { chatbot_prompt } -> { chatbot_response }

   Every call is credentialed — the session lives in a first-party cookie,
   which is why /api is served from this origin (see next.config.ts).
   ============================================================ */

export interface HistoryEntry {
  chatbot_prompt?: string;
  chatbot_response?: string;
}

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

/** History right after login can race the session; give it a couple of tries. */
export async function fetchHistory(attempts = 3): Promise<HistoryEntry[]> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch('/api/chatbot/investor/history', {
        method: 'GET',
        credentials: 'include',
      });
      if (res.ok) return (await res.json()) as HistoryEntry[];
      lastError = new Error(`History request failed with status ${res.status}`);
    } catch (err) {
      lastError = err;
    }
    if (i < attempts - 1) await wait(800);
  }
  throw lastError instanceof Error ? lastError : new Error('History request failed');
}

export async function ask(prompt: string): Promise<string> {
  const res = await fetch('/api/chatbot/investor', {
    method: 'POST',
    headers: json,
    credentials: 'include',
    body: JSON.stringify({ chatbot_prompt: prompt }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch chatbot response`);
  const { chatbot_response } = (await res.json()) as { chatbot_response?: string };
  return chatbot_response || "Sorry, I didn't get that.";
}

export function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
