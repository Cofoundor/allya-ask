# Ask Allya

The public preview at **ask.zeroto10.xyz** — leave an email, then ask Allya
anything about ZeroTo10.

This is a redesign of that page in the visual language of the Allya product
UI: the zeroto10.xyz palette, Allya's serif voice, and the company brain
running live behind the conversation. The API contract is unchanged, so it
drops straight in front of the existing backend.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · no UI dependencies. The
graph is hand-written canvas; the springs are ~90 lines of numerical
integration. Nothing else is pulled in.

## Run it

```bash
npm install && npm run dev
```

http://localhost:4323. Without a backend the gate will report a failure when
you submit — that is the real error path, not a crash. To develop against a
live API, point the dev proxy at it:

```bash
echo ALLYA_API_ORIGIN=https://ask.zeroto10.xyz > .env.local
```

`npm run build` · `npm run lint` · `npm run typecheck`.

## The API

Unchanged from the service already behind ask.zeroto10.xyz. Every call is
credentialed — the session is a first-party cookie, which is why `/api` is
served from this origin (proxied in dev, same-origin in production).

| Call | Shape |
|---|---|
| `POST /api/create-new-user-account-investor` | `{ email_id }` → `{ task_id }` |
| `GET /api/create-new-user-account-investor/status/{task_id}` | `{ status: COMPLETED \| INPROGRESS \| FAILURE, content?, reason? }`, polled every 2s |
| `POST /api/authentication` | form-encoded `investor-<email>`, sets the session cookie |
| `GET /api/chatbot/investor/history` | `[{ chatbot_prompt, chatbot_response }]` |
| `POST /api/chatbot/investor` | `{ chatbot_prompt }` → `{ chatbot_response }` |

Empty history is not an empty screen: the service is asked to open the
conversation itself, which is how the greeting arrives.

## How it is put together

```
src/app/page.tsx        the state machine: gate → creating → chat
src/app/globals.css     every token and component, one file
src/lib/brain.ts        the canvas engine (graph, physics, thoughts, pointers)
src/lib/graph.ts        the nodes, and the question each one asks
src/lib/api.ts          the API client above
src/lib/markdown.tsx    light markdown → React nodes
src/lib/spring.ts       interruptible springs, shared with the product UI
```

### The brain is mounted once

`BrainCanvas` sits above both screens and is never keyed or re-created. It is
the loudest thing on the gate, then fades to a backdrop when the conversation
starts — same graph, same momentum, no remount. The engine owns its pixels and
its pointer bindings; React only owns the box around them.

It reacts to the conversation: a question fires a thought along the edges, an
answer blooms every leaf in sequence. Tapping a node writes its question into
the composer — the reading column is capped at 760px so the leaves stay
reachable in the gutters on a wide screen.

### Allya speaks in serif

Fraunces, only inside her bubbles. Your own messages are Inter Tight on a
light fill — you are the operator, she is the voice. Both fonts are loaded as
variable cuts because the design uses fractional weights (420, 460) that a
static cut cannot hit.

### No HTML strings

The model answers in light markdown. `src/lib/markdown.tsx` turns it into
real React elements — `<p>`, `<ul>`, `<strong>`, `<code>`, links with
`rel="noopener noreferrer"`. There is no `innerHTML` anywhere in the app.

### Motion

Springs live in JS and are interruptible (press feedback, the graph). One-shot
entrances — bubbles, chips, the toast — are CSS animations, which are cheaper
per frame. Everything is disabled under `prefers-reduced-motion`, including the
canvas loop, which falls back to a single static draw.

## Failure is visible

A dropped request is retried once, silently. If it fails again the turn
becomes a red bubble with **Try again** next to it, holding on to the question
so it is never swallowed. Account creation surfaces the backend's own progress
messages while it polls.
