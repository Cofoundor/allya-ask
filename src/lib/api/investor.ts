/* ============================================================
   The investor room's API client.

   Mirrors backend/models.py exactly. Every piece of content on the page
   comes through here — the frontend owns none of it, so the dummy backend
   can be swapped for a real one without this file or the page changing.

   Base URL is configurable: NEXT_PUBLIC_INVESTOR_API_URL.
   ============================================================ */

const BASE = (process.env.NEXT_PUBLIC_INVESTOR_API_URL ?? 'http://localhost:8010').replace(/\/$/, '');

export interface Stat {
  value: string;
  label: string;
}

export interface SlideSummary {
  id: string;
  label: string;
  kicker: string;
  headline: string;
  featured: boolean;
  feature_note?: string | null;
  /** headline numbers — a card shows these without fetching the whole slide */
  stats: Stat[];
}

export interface Slide extends SlideSummary {
  lines: string[];
  say?: string | null;
}

export interface BrainNodeDto {
  id: string;
  label: string;
  tier: number;
  group: string;
  parent?: string | null;
  /** the question this node asks, so the canvas has a keyboard equivalent */
  question?: string | null;
}

export interface BrainEdgeDto {
  source: string;
  target: string;
}

export interface BrainGraph {
  nodes: BrainNodeDto[];
  edges: BrainEdgeDto[];
  leaf_spread: number;
}

export interface Pointer {
  id: string;
  text: string;
  slide_id: string;
}

export interface Opener {
  id: string;
  text: string;
}

export interface Room {
  company: string;
  stage: string;
  tagline: string;
  greeting: string;
  brain_title: string;
  brain_subtitle: string;
  composer_placeholder: string;
  /** the topbar's live line, the way the product shows agents running */
  status_line: string;
  chips: Stat[];
  metrics: Stat[];
  openers: Opener[];
  no_answer_text: string;
}

export interface Answer {
  id: string;
  question: string;
  matched: boolean;
  text: string;
  slide_id?: string | null;
  node_id?: string | null;
}

/** A failed call carries the status so the UI can tell "offline" from "404". */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      // Content-Type only when there is a body: setting it on a GET makes the
      // request non-simple and costs a CORS preflight round trip per call
      headers: init?.body ? { 'Content-Type': 'application/json', ...init?.headers } : init?.headers,
    });
  } catch {
    // network-level: the backend isn't running, or CORS refused it
    throw new ApiError(`Could not reach the investor API at ${BASE}`, 0);
  }
  if (!res.ok) throw new ApiError(`${init?.method ?? 'GET'} ${path} failed`, res.status);
  return (await res.json()) as T;
}

export const getRoom = (signal?: AbortSignal) => request<Room>('/api/investor/room', { signal });

export const getBrain = (signal?: AbortSignal) => request<BrainGraph>('/api/investor/brain', { signal });

export const listPointers = (signal?: AbortSignal) => request<Pointer[]>('/api/investor/pointers', { signal });

export function listSlides(opts: { featured?: boolean; signal?: AbortSignal } = {}) {
  const q = opts.featured === undefined ? '' : `?featured=${opts.featured}`;
  return request<SlideSummary[]>(`/api/investor/slides${q}`, { signal: opts.signal });
}

export const getSlide = (id: string, signal?: AbortSignal) =>
  request<Slide>(`/api/investor/slides/${encodeURIComponent(id)}`, { signal });

export const postAnswer = (body: { question: string; node_id?: string }) =>
  request<Answer>('/api/investor/answers', { method: 'POST', body: JSON.stringify(body) });
