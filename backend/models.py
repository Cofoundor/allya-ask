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
    """deep link straight to this slide in the deck itself"""
    deck_url: str = ""
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


class Panel(BaseModel):
    """A box on the page, with the line it introduces itself by."""
    id: str
    title: str
    blurb: str


class Intro(BaseModel):
    """The choice offered on arrival: read the deck, or start asking."""
    title: str
    body: str
    deck_cta: str
    deck_note: str
    ask_cta: str
    ask_note: str


class Link(BaseModel):
    """A document the room hands out. An empty url means it is not ready to
    share yet, and the client leaves it out rather than shipping a dead link."""
    id: str
    label: str
    url: str
    note: str | None = None


class Room(BaseModel):
    company: str
    stage: str
    tagline: str
    greeting: str
    brain_title: str
    brain_subtitle: str
    composer_placeholder: str
    """the topbar's live line, the way the product shows agents running"""
    status_line: str
    chips: list[Stat]
    metrics: list[Stat]
    openers: list[Opener]
    links: list[Link]
    panels: list[Panel]
    intro: Intro
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
