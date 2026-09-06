"""Request/response schemas for the investor room.

These are the contract. The dummy implementations behind them can be replaced
with real ones without the frontend noticing.
"""

from pydantic import BaseModel


class Stat(BaseModel):
    value: str
    label: str


class SlideSummary(BaseModel):
    id: str
    label: str
    kicker: str
    headline: str
    featured: bool
    feature_note: str | None = None
    """headline numbers — a card shows these without fetching the whole slide"""
    stats: list[Stat] = []


class Slide(SlideSummary):
    lines: list[str]
    say: str | None = None


class BrainNode(BaseModel):
    id: str
    label: str
    tier: int
    group: str
    parent: str | None = None
    """the question this node asks — lets the client offer a keyboard-reachable
    list of everything the canvas can be clicked for"""
    question: str | None = None


class BrainEdge(BaseModel):
    source: str
    target: str


class BrainGraph(BaseModel):
    nodes: list[BrainNode]
    """cross strands only — parent links are implied by node.parent"""
    edges: list[BrainEdge]
    """how far leaves fan from the centre, 0..0.5"""
    leaf_spread: float = 0.33


class Pointer(BaseModel):
    id: str
    text: str
    slide_id: str


class Opener(BaseModel):
    id: str
    text: str


class Room(BaseModel):
    company: str
    stage: str
    tagline: str
    greeting: str
    brain_title: str
    brain_subtitle: str
    composer_placeholder: str
    chips: list[Stat]
    metrics: list[Stat]
    openers: list[Opener]
    """shown when a question matches nothing — copy belongs to the backend"""
    no_answer_text: str


class AnswerRequest(BaseModel):
    question: str
    node_id: str | None = None


class Answer(BaseModel):
    id: str
    question: str
    matched: bool
    text: str
    slide_id: str | None = None
    node_id: str | None = None
