"""Dummy backend for the Allya investor room.

Defines the API contract only. Every handler reads in-memory content from
data.py; swap those reads for real ones and the frontend does not change.

    pip install -r requirements.txt
    uvicorn main:app --reload --port 8010
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

import data
from models import (
    Answer,
    AnswerRequest,
    BrainEdge,
    BrainGraph,
    BrainNode,
    Pointer,
    Room,
    Slide,
    SlideSummary,
)

app = FastAPI(title="Allya investor room", version="0.1.0")

# the frontend runs on another port in development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# --------------------------------------------------------------- matching
#
# Production replaces this with the model. The contract does not change: the
# frontend posts a question and gets an Answer back.

STOP = {
    "the", "and", "for", "you", "your", "what", "how", "why", "who", "does", "did", "are",
    "was", "were", "this", "that", "with", "from", "have", "has", "about", "into", "they",
    "them", "can", "will", "would", "could", "should", "there", "their", "been", "being",
    "much", "many", "any", "all", "not", "but", "out", "get", "got", "one", "two", "its",
    "our", "ours", "his", "her", "him", "she", "yet", "per", "off", "over", "under",
}


def _stem(w: str) -> str:
    """Crude singularisation, so "competitors" reaches an entry written
    "competitor". Only has to survive the plurals investors actually type."""
    if len(w) > 4 and w.endswith("ies"):
        return w[:-3] + "y"
    if len(w) > 4 and w.endswith("ses"):
        return w[:-2]
    if len(w) > 3 and w.endswith("s") and not w.endswith("ss"):
        return w[:-1]
    return w


def _tokens(text: str) -> list[str]:
    cleaned = "".join(c if c.isalnum() else " " for c in text.lower())
    return [_stem(w) for w in cleaned.split() if len(w) > 2 and w not in STOP]


_INDEX = [
    {
        "answer": a,
        "strong": set(_tokens(f"{a['question']} {a['id'].replace('_', ' ')} {a.get('aliases', '')}")),
        "weak": set(_tokens(a["text"])),
    }
    for a in data.ANSWERS
]

_BY_ID = {a["id"]: a for a in data.ANSWERS}

# department nodes carry no answer of their own — point them at the leaf that
# best stands in for the cluster
_NODE_FALLBACK = {
    "product": "p_what",
    "market": "m_tam",
    "traction": "t_live",
    "model": "mo_price",
    "moat": "x_moat",
    "team": "tm_who",
    "ask": "a_raise",
}


def _match(question: str) -> dict | None:
    """Best answer for a typed question, or None when nothing is close.

    Refuses below a floor rather than serving a confident near-miss: an
    investor spotting a bluff costs more than one told to ask the founder.
    """
    words = _tokens(question)
    if not words:
        return None

    best, best_score = None, 0.0
    for entry in _INDEX:
        score = sum(2 if w in entry["strong"] else 0.6 if w in entry["weak"] else 0 for w in words)
        norm = score / (2 * len(words))
        if norm > best_score:
            best, best_score = entry["answer"], norm

    return best if best_score >= 0.3 else None


# ------------------------------------------------------------- endpoints


@app.get("/api/investor/room", response_model=Room)
def get_room() -> Room:
    """Everything page-level: identity, copy, topbar chips, the ask metrics
    and the opening questions."""
    return Room(**data.ROOM)


def _deck_url(slide_id: str) -> str:
    """The deck deep-links by 1-indexed hash, and slide ids are already that."""
    return f"{data.DECK_URL}#{int(slide_id)}"


@app.get("/api/investor/slides", response_model=list[SlideSummary])
def list_slides(
    featured: bool | None = Query(None, description="only the slides worth leading with"),
) -> list[SlideSummary]:
    slides = data.SLIDES
    if featured is not None:
        slides = [s for s in slides if s.get("featured", False) is featured]
    return [SlideSummary(**s, deck_url=_deck_url(s["id"])) for s in slides]


@app.get("/api/investor/slides/{slide_id}", response_model=Slide)
def get_slide(slide_id: str) -> Slide:
    for s in data.SLIDES:
        if s["id"] == slide_id:
            return Slide(**s, deck_url=_deck_url(s["id"]))
    raise HTTPException(status_code=404, detail=f"No slide {slide_id}")


@app.get("/api/investor/brain", response_model=BrainGraph)
def get_brain() -> BrainGraph:
    def question_for(node_id: str) -> str | None:
        hit = _BY_ID.get(node_id) or _BY_ID.get(_NODE_FALLBACK.get(node_id, ""))
        return hit["question"] if hit else None

    return BrainGraph(
        nodes=[BrainNode(**n, question=question_for(n["id"])) for n in data.BRAIN_NODES],
        edges=[BrainEdge(source=a, target=b) for a, b in data.BRAIN_EDGES],
    )


@app.get("/api/investor/pointers", response_model=list[Pointer])
def list_pointers() -> list[Pointer]:
    return [Pointer(**p) for p in data.POINTERS]


@app.post("/api/investor/answers", response_model=Answer, status_code=200)
def create_answer(req: AnswerRequest) -> Answer:
    """Answer a question — by node id when one was touched in the brain,
    otherwise by matching the text. An unmatched question is a valid result,
    not an error, so it comes back 200 with matched=False."""
    question = req.question.strip()
    if not question and not req.node_id:
        raise HTTPException(status_code=422, detail="question or node_id required")

    hit = None
    if req.node_id:
        hit = _BY_ID.get(req.node_id) or _BY_ID.get(_NODE_FALLBACK.get(req.node_id, ""))
    if hit is None:
        hit = _match(question)

    if hit is None:
        return Answer(
            id="no-match",
            question=question,
            matched=False,
            text=data.ROOM["no_answer_text"],
        )

    return Answer(
        id=hit["id"],
        question=question or hit["question"],
        matched=True,
        text=hit["text"],
        slide_id=hit.get("slide_id"),
        node_id=req.node_id,
    )
