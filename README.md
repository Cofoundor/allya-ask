# Ask Allya

> ## 🧪 EXPERIMENT — not deployed
>
> A redesign of the ask.zeroto10.xyz preview. **The live site still runs the old app** — nothing
> here is deployed. It preserves the existing sign-in contract exactly, so it can drop in front of
> the current backend when someone decides to ship it.
>
> Shares its design system with [`../product-next`](../product-next) — `spring.ts` is byte-identical
> in both, so fixes move between them. See [`../README.md`](../README.md).

Two pages, in order:

| Route | What it is |
|---|---|
| `/` | **The login.** Email gate → account creation → sign-in. On success it hands over to the room. |
| `/investors` | **The investor room.** The product's workspace, with the deck in it. |

`/investors` is the page slide 16 of the deck promises — *"here's a dedicated chatbot you can grill
before you grill us."*

It deliberately **wears the product's workspace**. The shell, the dynamic island, the canvas, the
brain box and the right-hand panel are ported from `product/styles.css` — the app live at
allyafn.netlify.app — so an investor who sees the product and then sees this reads them as one
tool. Same 46px topbar, same 1240px centred split, same `clamp(260px, 46vh, 480px)` brain. The
only difference is what is in the panels: where the product shows work, this shows the deck.

The chat behaves the same way too: the canvas is what you see until you ask something, then the
thread replaces it, and **← back to the brain** returns.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · no UI dependencies, plus a dummy FastAPI backend.
The graph is hand-written canvas; the springs are ~90 lines of numerical integration.

## Run it

Two processes. The room will not load without the backend.

```bash
cd backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8010
```

```bash
npm install && npm run dev
```

http://localhost:4323 → sign in → the room. Or go straight to http://localhost:4323/investors.

The sign-in calls the real service, so without a proxy it reports a failure — that is the real
error path, not a crash. To develop against the live API:

```bash
echo ALLYA_API_ORIGIN=https://ask.zeroto10.xyz > .env.local
```

`npm run build` · `npm run lint` · `npm run typecheck`.

## The two backends

**Sign-in** is the contract already behind ask.zeroto10.xyz, unchanged. Same-origin in production,
proxied in dev via `ALLYA_API_ORIGIN`, so the session cookie stays first-party.

| Call | Shape |
|---|---|
| `POST /api/create-new-user-account-investor` | `{ email_id }` → `{ task_id }` |
| `GET /api/create-new-user-account-investor/status/{task_id}` | `{ status: COMPLETED \| INPROGRESS \| FAILURE, content?, reason? }`, polled every 2s |
| `POST /api/authentication` | form-encoded `investor-<email>`, sets the session cookie |

**The room's content** comes from `backend/` — a dummy FastAPI service whose only job is to define
the contract. Base URL is `NEXT_PUBLIC_INVESTOR_API_URL` (default `http://localhost:8010`).

| Call | Returns |
|---|---|
| `GET /api/investor/room` | identity, copy, topbar chips, the ask metrics, opening questions, the no-answer text |
| `GET /api/investor/slides?featured=true\|false` | slide summaries — id, label, kicker, headline, `featured`, headline stats |
| `GET /api/investor/slides/{id}` | one slide in full: its lines and the speaker line. `404` if unknown |
| `GET /api/investor/brain` | the graph — nodes (each carrying the question it asks), cross edges, leaf spread |
| `GET /api/investor/pointers` | the "From the deck" list, each pinned to a slide |
| `POST /api/investor/answers` | `{ question, node_id? }` → an answer. Unmatched is `200` with `matched: false`, not an error |

**The frontend holds none of this.** Swap `backend/data.py` for a CMS read, or `_match()` for the
model, and the API surface does not move. `src/lib/api/investor.ts` is the only place the frontend
talks to it.

### What the dummy backend deliberately is not

No auth, no database, no ORM, no caching, no background jobs, no CRUD it does not need. In-memory
content, six endpoints, every one of them consumed by the page.

## Two things to know about the content

- **`needs_founder: True`** in `backend/data.py` marks answers resting on a figure the deck itself
  flags as unresolved — invoiced revenue, gross margin at scale, the Series A trigger, CAC, the
  bottom-up market model. Those answers are written to be straight about where the number comes
  from instead of inventing one. They are the ones to shore up first.
- **`PRICING`** is the single source for the commercial model. The deck still prints ₹2,000/mo;
  pricing was re-settled on 2 Sep 2026 at ₹1,000/mo plus credits, and this page uses the current
  number. **The deck and this page disagree until one of them is updated.**

## How it is put together

```
backend/main.py            six endpoints + the question matcher
backend/data.py            the slides, the graph, the answers, the copy
backend/models.py          the request/response schemas — the contract
src/app/page.tsx           the login
src/app/investors/         the room
src/lib/api/auth.ts        the sign-in contract
src/lib/api/investor.ts    the room's content — the only place it talks to backend/
src/lib/brain.ts           the canvas engine (graph, physics, thoughts, pointers)
src/lib/markdown.tsx       light markdown → React nodes
src/lib/spring.ts          interruptible springs, shared with the product UI
```

### The brain

`BrainCanvas` is mounted once and never keyed. The engine owns its pixels and its pointer
bindings; React only owns the box around them. Touching a node posts its `node_id` and opens the
slide that backs the answer.

Answering fires **one targeted thought**, not a full bloom — a bloom is ~30 timers and ~70 pulses
per answer, which is what made this feel heavy. The loop already runs at 30fps while something is
happening and ~15fps for the idle drift, so at rest it costs almost nothing.

A canvas is not reachable by keyboard, so every question it holds is also listed under
**"Or pick from every question in the brain"** — same questions, same handler.

### The deck panel

Where the product puts work, this puts the deck. **Key slides** get the lime-lit card the product
gives "Needs you" — headline, why it matters and its numbers, visible without opening it. The rest
are the product's dense work rows. Slides arrive as summaries; bodies are fetched on open and
cached, and only one is open at a time.

### The island

The product's split pill, with the same two motions: the left half steps through the numbers one
at a time, the right half runs the deck past continuously. Both are CSS transforms, so they cost
no per-frame JavaScript. Tapping either half expands the same element into the full list.

Note the clipping subtlety, which is a real bug in the product's own version: the element that
moves must not be the one that owns `overflow: hidden`, or the clipping window travels with the
content and the item that lands in view is clipped away. Here a static `.kpi-track` clips and an
inner `.kpi-rail` slides.

### Allya speaks in serif

Fraunces, only inside her bubbles. Your own messages are Inter Tight on a light fill — you are the
operator, she is the voice. Both fonts are variable cuts because the design uses fractional weights
(420, 460) a static cut cannot hit.

### No HTML strings

Answers arrive as light markdown and become real React elements — `<p>`, `<ul>`, `<strong>`,
`<code>`, links with `rel="noopener noreferrer"`. There is no `innerHTML` anywhere.

### Motion

Springs live in JS and are interruptible (press feedback, the graph). One-shot entrances are CSS
animations, which are cheaper per frame. Everything is disabled under `prefers-reduced-motion`,
including the canvas loop, which falls back to a single static draw.

### States

Loading, offline and empty are all handled. The offline panel names the port and the command to
start the backend, and its **Try again** re-runs the load without a page refresh. A question that
matches nothing comes back as a real answer that says so and points at the founder's email — it
never bluffs.
