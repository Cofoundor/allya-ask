/* ============================================================
   The questions investors actually ask, and ZeroTo10's answers.

   Every answer is grounded in the pitch deck (Aug 2026), the brand wiki
   positioning, or a decision recorded since. Nothing here is invented.

   `needsFounder: true` marks the answers resting on something the deck
   itself flags as unresolved — gross margin at scale, invoiced revenue,
   the Series A trigger. Those answers are written to be honest about
   where the number comes from rather than to fabricate one. They are the
   answers to shore up before this page goes in front of anyone.
   ============================================================ */

import type { NodeSpec } from './brain';
import { PRICING } from './deck';

export interface QA {
  /** matches a brain node id */
  id: string;
  /** the full question, as an investor would put it */
  q: string;
  /** the answer, in light markdown */
  a: string;
  /** the slide this is backed by */
  slide?: string;
  /** rests on a figure the founder still owes — see the header note */
  needsFounder?: boolean;
}

export const QA_SET: QA[] = [
  /* ---------------- the hub ---------------- */
  {
    id: 'co',
    q: 'What is ZeroTo10, in one paragraph?',
    a: "ZeroTo10 builds **Allya** — an AI operations layer for early-stage founders. Allya learns your business once, holds it in a connected model we call the brain, and then runs the operational work off it: marketing, hiring, PR and sales ops. Agents execute about **85%** of the work; a human signs off on the other **15%** before anything ships. We are raising **₹4 Cr for 7%** at ₹57 Cr post-money.",
    slide: '01',
  },

  /* ---------------- product ---------------- */
  {
    id: 'p_what',
    q: 'What does Allya actually do for a founder?',
    a: "It runs the work end to end, rather than answering questions about it.\n\nYou brief it once. Allya researches, drafts, warms up the domain, sends, follows up and triages replies. A human checks the output before it leaves. The result is written back into your company's model, so the next task starts better informed than the last.\n\nThat last step is the difference between Allya and an answer box.",
    slide: '04',
  },
  {
    id: 'p_brain',
    q: 'What is "the brain", concretely?',
    a: "A living model of **one** company — goals, constraints, ICP, tone of voice, past campaigns, what shipped, what worked and what got killed.\n\nIt is built during onboarding and gets denser with every decision the business feeds it. Every task is planned against it, which is why Allya does not need re-briefing.\n\nBeing precise: the canvas you are looking at is a *view* of the graph. The asset is the graph underneath — and the choice of which slice of it the model sees on any given task.",
    slide: '05',
  },
  {
    id: 'p_split',
    q: 'What does the 85% agent / 15% human split actually mean?',
    a: "**85%** — research, drafting, list building, sequencing, sending, follow-up, reply triage. Machine work at low marginal cost.\n\n**15%** — a named operator reviews before anything leaves the building. On the serviced tier that person is assigned, not pooled.\n\nTwo things make it more than a talking point: the gate is **priced in credits**, so it is funded rather than subsidised, and every correction the operator makes is written back into the brain — the oversight is also the training signal.",
    slide: '06',
  },
  {
    id: 'p_onboard',
    q: 'How does onboarding work, and how long does it take?',
    a: "**3–5 minutes, 22 questions.** It was 100 questions in March 2025; we cut it to 22 in October 2025 once we knew which answers actually changed downstream behaviour.\n\nIt captures goals, constraints, tone and history — enough to plan the first task against something real instead of a blank prompt.",
    slide: '06',
  },
  {
    id: 'p_stack',
    q: 'What is the technical architecture?',
    a: "Orchestration on **LangGraph**, models via **Claude on Amazon Bedrock**, a **Postgres + pgvector** context store, blob storage for documents, with crawler and PDF ingestion feeding the graph.\n\nThe pipeline architecture, onboarding schemas and the vector store are the **months 1–2** line on the roadmap — that is what the first tranche of this raise hardens.",
    slide: '15',
  },
  {
    id: 'p_not',
    q: 'What is Allya not?',
    a: "Not an agency. Not a freelancer marketplace. Not a prompt wrapper. Not a pile of agents you have to configure.\n\nIt is a brain that holds your business, with execution attached. The agents are hands — interchangeable, and deliberately so.",
    slide: '06',
  },

  /* ---------------- market ---------------- */
  {
    id: 'm_icp',
    q: 'Who is the customer, specifically?',
    a: "The beachhead is the **solo services founder in India** at the point where an agency retainer stops making sense — running a business with no ops team, currently stitching together an agency, ChatGPT, a WhatsApp VA and their own evenings.\n\nFrom there it widens to small teams and MSMEs with the same shape of problem: real operational load, no operational headcount.",
    slide: '03',
  },
  {
    id: 'm_tam',
    q: 'How big is the market, and how did you size it?',
    a: "Filtered down, not claimed top-down:\n\n- **22 Cr** total relevant population\n- **15 Cr** total addressable\n- **5.85 Cr** entrepreneurially relevant\n- **~4.05 Cr** with entrepreneurial intention (~27%)\n- **~1.8 Cr** in early-stage activity (~12%)\n- **~2 Cr** serviceable, after ~30% payment intention\n- **1 Lakh** beachhead — 0.05% of SAM\n\nAt ~₹35,000 blended ARPU, that 1 Lakh implies roughly **₹350 Cr** of annual revenue at full capture.",
    slide: '08',
    needsFounder: true,
  },
  {
    id: 'm_india',
    q: 'Why India first?',
    a: "Three reasons, in order of durability:\n\n1. **Price.** At ₹1,000/month plus credits we sit under a floor US competitors cannot reach without breaking their own model.\n2. **Distribution.** 63% of global WhatsApp Business downloads are Indian. That is the channel these founders already run their business on, and it is a Year 1 integration for us, not a Year 3 one.\n3. **Home advantage.** We are Indian operators selling to Indian founders — we know the pain because we run an agency serving them.",
    slide: '13',
  },
  {
    id: 'm_now',
    q: 'Why is now the moment?',
    a: "- **2.23 L** DPIIT-recognised startups as of 31 March 2026 — FY26 alone added a record **55,200**, up **51.6%** year on year from ~350 in 2014.\n- **+38%** Indian SaaS funding year on year: $1.26B by April 2026 against $915M in the same period of 2025.\n- **40%** of enterprise apps will embed task-specific agents by end-2026, up from under 5% in 2025 (Gartner).\n\nThe supply of founders and the capability of agents crossed in the same eighteen months.",
    slide: '13',
  },

  /* ---------------- traction ---------------- */
  {
    id: 't_live',
    q: 'What is actually live today?',
    a: "**MVP, live and in front of clients.**\n\nThe path there: a semi-automated ops agency in Sep 2024 (prompt workflows cut delivery time 30%), 50% automation by Dec 2024, agent workflows through 2025, full build from Oct 2025 when the CTO joined, POC in Nov–Dec 2025 at roughly **70% automation**, and the MVP in front of clients through 2026.\n\nWe have been running this as a service for two years. The product is the automation of work we were already delivering by hand.",
    slide: '14',
  },
  {
    id: 't_clients',
    q: 'Who is using it, and what happened?',
    a: "- **Mili Khare** (dietician) — 28 tasks in 30 days across 3 client tiers; cut lead drop-offs and stabilised monthly revenue.\n- **SurferSearcher** (marketing agency) — repositioned toward US B2B SaaS clients; **13 outbound campaigns live in month one**.\n- **Dori** (q-commerce) — idea validated through customer interviews and prior data; onboarding flows designed.\n\nAnd internally: ZeroTo10 ran its own TAM sizing, its validation process and this deck through Allya. Dogfooding, labelled as such.",
    slide: '07',
  },
  {
    id: 't_wtp',
    q: 'What proof do you have that people will pay?',
    a: "**20+** founder conversations, **25** willingness-to-pay responses, and **80% said yes at ₹5–10K/month** — a band that sits above our serviced-tier floor of ₹5,500.\n\nThe honest read: that is stated intent at survey scale, not booked revenue. It set the price; it does not prove the market. Converting it is what the first six months of the GTM plan exist to do.",
    slide: '07',
  },
  {
    id: 't_revenue',
    q: 'What is your revenue today?',
    a: "We are pre-seed and early — three clients have run real work through Allya, and the commercial model has only just settled at ₹1,000/month plus credits.\n\nWe will give you the exact invoiced figure and the current run rate in the meeting rather than a rounded number on a slide. What we will commit to publicly: the ARPU model is **₹35,000/year blended**, subscription plus credits.",
    slide: '11',
    needsFounder: true,
  },

  /* ---------------- model ---------------- */
  {
    id: 'mo_price',
    q: 'What do you charge, and what does that include?',
    a: `**${PRICING.platform}/month** for the platform — context store, unlimited asking, LinkedIn drafting and publishing. Self-serve. This is the funnel, not the business.\n\n**${PRICING.platform}/month plus a minimum 500 credits** for the serviced tier — the human 15%, an email warm-up slot, campaign execution and a named operator. Floor **${PRICING.tier2Floor}/month**, realistic run rate **${PRICING.tier2Run}/month**. This is what the first ten customers buy.\n\nCredits are prepaid, **${PRICING.creditRate}**, and never expire. First month free is free platform plus 100 credits — never a free campaign, because a campaign has real marginal cost.`,
    slide: '10',
  },
  {
    id: 'mo_arpu',
    q: 'What is ARPU, and how is it built?',
    a: `**${PRICING.arpu} per customer per year, blended** — subscription plus credit consumption.\n\nThe subscription is predictable and small. The credits are the variable line, and they scale with how much work a customer actually pushes through, which is also the signal that they have outgrown the entry tier.`,
    slide: '11',
  },
  {
    id: 'mo_margin',
    q: 'What do the unit economics look like?',
    a: "Marginal cost on a serviced client runs **₹4,000–6,000/month**: LLM ₹800–1,500, email infrastructure ₹800–1,500, and roughly 5 operator hours at ₹2,000–3,000.\n\nThat cost is exactly why the credit line exists — the human 15% is priced where it is consumed rather than averaged into a flat fee it cannot fund. A flat ₹2,000/month could not carry it, which is why we moved off it.\n\nGross margin at 100 / 500 / 1,000 customers, payback and LTV are a model we will walk you through line by line rather than compress into a slide.",
    slide: '11',
    needsFounder: true,
  },
  {
    id: 'mo_scale15',
    q: 'What happens to the human 15% at 1,000 customers?',
    a: "The sharpest question in the deck, and we do not pretend it is solved.\n\nThree things carry it:\n\n1. **It is paid for.** Operator time is priced in credits, so review capacity scales with revenue instead of eating margin.\n2. **It should shrink per task.** Every correction is written back into the brain, so the same review on the same account gets cheaper over time. That is the whole bet.\n3. **It is a floor, not a constant.** 15% is oversight on what ships, not on every action.\n\nIf the per-task review cost does not fall as the brain gets denser, the model is a services business with good tooling. Watching that number is how you should hold us accountable.",
    slide: '12',
    needsFounder: true,
  },

  /* ---------------- moat ---------------- */
  {
    id: 'x_who',
    q: 'Who do you compete with?',
    a: "- **Cofounder.ai** — AI agents, global founders, no human QA. Launched June 2026 at $39/mo with 12 founder personas and saved business memory.\n- **Nas.io** — AI-assisted, creators and communities, no human QA.\n- **Lindy.ai** — AI agents, ops teams and marketers, no human QA.\n- **What founders actually use today** — an agency plus ChatGPT, a WhatsApp VA, a fractional COO. All human, no memory across tools.\n\nThe last row is the real competitor. The others are the ones you will ask about.",
    slide: '12',
  },
  {
    id: 'x_moat',
    q: 'What stops a well-funded competitor copying this?',
    a: "Not the interface. We will say that plainly — a canvas with spring physics is a few weeks of work and the whole competitive surface fits in a screenshot.\n\nWhat compounds:\n\n- the **accumulated per-company graph** — every decision, correction and outcome, per customer\n- **outcome data** — what was approved, shipped, killed, and whether it worked\n- **context assembly** — which slice of the graph the model sees for a given task. This is the real IP and it is invisible from outside.\n- **the human gate**, which is a cost centre competitors have chosen not to carry\n\nMemory alone stopped being the wedge in June 2026 when Cofounder.ai shipped it. The gate plus India-first distribution is what is left, and it is the harder half to copy.",
    slide: '12',
  },
  {
    id: 'x_copy',
    q: 'If I screenshotted this and rebuilt it, what would I be missing?',
    a: "The graph, the outcomes and the corrections — none of which are in the screenshot.\n\nA competitor can rebuild the rendering in a month. They cannot rebuild two years of a specific company's decisions, or the record of which plans a human overrode and why. That record is what makes the next plan better, and it only accrues by running the work.\n\nWe use exactly this question internally as the test for whether a piece of work is moat or polish.",
    slide: '12',
  },
  {
    id: 'x_switch',
    q: 'What is the switching cost once a customer is on?',
    a: "Leaving means re-explaining your company from zero — to a tool that starts where Allya started, without the campaign history, the tone corrections or the record of what already failed.\n\nThe cost rises with tenure by construction, which is the point of putting the store before the agents.\n\nWe will not overclaim it: at three clients, switching cost is a design property, not yet an observed retention number.",
    slide: '12',
    needsFounder: true,
  },
  {
    id: 'x_chatgpt',
    q: 'Why would a founder not just use ChatGPT?',
    a: "Most of them do, and that is who we are actually competing with.\n\nTwo differences. **ChatGPT answers; Allya finishes the job** — the sending, the warm-up, the follow-up, the reply triage. And Allya is briefed once: the founder in our problem slide is asking ChatGPT the same question for the third time on Thursday.\n\nMemory is no longer a differentiator on its own — the frontier assistants have it. Execution with a human gate on the output is.",
    slide: '03',
  },

  /* ---------------- team ---------------- */
  {
    id: 'tm_who',
    q: 'Who is building ZeroTo10?',
    a: "**Sanshat Bhatia — CEO & Founder.** Built and led ops and marketing at Trailytics AI, SoftwareHunt and Zenith Media. Co-runs Leadwisee, a performance marketing agency.\n\n**Ayush Soni — CTO & Co-founder.** IIT Bhubaneswar; led Inter-IIT teams to two Top-5 finishes. Software developer at Oracle with production LLM workflow experience.",
    slide: '14',
  },
  {
    id: 'tm_why',
    q: 'Why is this the right team for this problem?',
    a: "The agency is not a side business — it is the research lab. Leadwisee serves exactly the founders Allya sells to, which means the pain is observed weekly rather than surveyed once, and every workflow in the product was delivered by hand first.\n\nThat is also the origin: Allya started as the automation of our own delivery. Sep 2024 prompt workflows, 50% automation by December, 70% at the POC. We productised what already worked.\n\nOn the build side, the LLM-workflow experience is production experience, not weekend experience.",
    slide: '14',
  },

  /* ---------------- the ask ---------------- */
  {
    id: 'a_raise',
    q: 'What are you raising, and on what terms?',
    a: "**₹4 Cr for 7%**, at **₹57 Cr post-money**. That is **24 months of runway** at roughly ₹15 Lakh per month.\n\nWe are a registered partnership firm in Faridabad, Haryana (deed 19 January 2026). Conversion to a private limited company is triggered by exactly this — external investment — and would happen as part of the round.",
    slide: '16',
  },
  {
    id: 'a_use',
    q: 'What does the money actually buy?',
    a: "Monthly, at ~₹15 Lakh burn:\n\n- **₹9.5 L** — salaries and team\n- **₹2.5 L** — marketing and GTM\n- **₹2 L** — other and buffer\n- **₹1 L** — server and infrastructure\n\nThe weight is on people, because the constraint over the next four months is shipping the core platform and the human review loop, not spend.",
    slide: '16',
  },
  {
    id: 'a_milestones',
    q: 'What does ₹4 Cr get you to?',
    a: "The roadmap this capital funds:\n\n- **Months 1–2** — core platform: pipeline architecture and APIs, onboarding schemas, the context store finalised\n- **Months 3–4** — MVP services end to end for recruitment, policy, marketing and social, with human review loops integrated\n- **Month 6** — public launch, after the six-phase channel rollout has built the waitlist\n- **Year 1** — service expansion, WhatsApp-first integration, and ZeroTo10 Forge\n\nThe milestone that matters to you is month 6: launch with proof rather than launch with a landing page.",
    slide: '15',
  },
  {
    id: 'a_seriesa',
    q: 'What is the Series A trigger?',
    a: "Directionally: a repeatable serviced-tier motion — customers acquired through a channel we can spend into, at a run rate that holds without founder-led selling, with the per-task human review cost visibly falling.\n\nThe specific MRR and customer-count thresholds at months 6, 12 and 24 are numbers we will put in front of you with the model behind them, rather than assert here.",
    slide: '15',
    needsFounder: true,
  },
  {
    id: 'a_gtm',
    q: 'How do you acquire founders?',
    a: "Six months, sequenced by **trust depth × memory lifespan** — the channels where a post keeps working are worked first:\n\n- **M1** problem ID — reply to problem-led posts on X\n- **M2** brand building — daily reels, startup communities, affiliates\n- **M3** validation — community input shifts focus to demand capture\n- **M4** public waitlist, webinars, partnership placements\n- **M5** private beta — manual onboarding, close observation, testimonials\n- **M6** public launch across every active channel\n\nInstagram, YouTube, X, Reddit, Email, LinkedIn — in that order of trust depth. CAC by channel is what the rollout is instrumented to find.",
    slide: '09',
    needsFounder: true,
  },
];

export const BY_ID: Record<string, QA> = Object.fromEntries(QA_SET.map((x) => [x.id, x]));

/* ============================================================
   The brain: the same questions, arranged as a graph.
   Labels are short because they are drawn on a canvas; the full
   question lives in QA_SET above.
   ============================================================ */

export const NODES: NodeSpec[] = [
  { id: 'co', label: 'ZeroTo10', tier: 0, group: 'core' },

  { id: 'product', label: 'Product', tier: 1, group: 'product', parent: 'co' },
  { id: 'p_what', label: 'What it does', tier: 2, group: 'product', parent: 'product' },
  { id: 'p_brain', label: 'The brain', tier: 2, group: 'product', parent: 'product' },
  { id: 'p_split', label: '85 / 15', tier: 2, group: 'product', parent: 'product' },
  { id: 'p_onboard', label: 'Onboarding', tier: 2, group: 'product', parent: 'product' },
  { id: 'p_stack', label: 'The stack', tier: 2, group: 'product', parent: 'product' },
  { id: 'p_not', label: 'What it is not', tier: 2, group: 'product', parent: 'product' },

  { id: 'market', label: 'Market', tier: 1, group: 'market', parent: 'co' },
  { id: 'm_icp', label: 'Who it is for', tier: 2, group: 'market', parent: 'market' },
  { id: 'm_tam', label: 'Market size', tier: 2, group: 'market', parent: 'market' },
  { id: 'm_india', label: 'Why India', tier: 2, group: 'market', parent: 'market' },
  { id: 'm_now', label: 'Why now', tier: 2, group: 'market', parent: 'market' },

  { id: 'traction', label: 'Traction', tier: 1, group: 'traction', parent: 'co' },
  { id: 't_live', label: "What's live", tier: 2, group: 'traction', parent: 'traction' },
  { id: 't_clients', label: 'Clients', tier: 2, group: 'traction', parent: 'traction' },
  { id: 't_wtp', label: 'Will they pay', tier: 2, group: 'traction', parent: 'traction' },
  { id: 't_revenue', label: 'Revenue', tier: 2, group: 'traction', parent: 'traction' },

  { id: 'model', label: 'Model', tier: 1, group: 'model', parent: 'co' },
  { id: 'mo_price', label: 'Pricing', tier: 2, group: 'model', parent: 'model' },
  { id: 'mo_arpu', label: 'ARPU', tier: 2, group: 'model', parent: 'model' },
  { id: 'mo_margin', label: 'Unit economics', tier: 2, group: 'model', parent: 'model' },
  { id: 'mo_scale15', label: 'The 15% at scale', tier: 2, group: 'model', parent: 'model' },

  { id: 'moat', label: 'Moat', tier: 1, group: 'moat', parent: 'co' },
  { id: 'x_who', label: 'Competition', tier: 2, group: 'moat', parent: 'moat' },
  { id: 'x_moat', label: 'Defensibility', tier: 2, group: 'moat', parent: 'moat' },
  { id: 'x_copy', label: 'Copy it?', tier: 2, group: 'moat', parent: 'moat' },
  { id: 'x_switch', label: 'Switching cost', tier: 2, group: 'moat', parent: 'moat' },
  { id: 'x_chatgpt', label: 'Why not ChatGPT', tier: 2, group: 'moat', parent: 'moat' },

  { id: 'team', label: 'Team', tier: 1, group: 'team', parent: 'co' },
  { id: 'tm_who', label: 'Founders', tier: 2, group: 'team', parent: 'team' },
  { id: 'tm_why', label: 'Why this team', tier: 2, group: 'team', parent: 'team' },

  { id: 'ask', label: 'The ask', tier: 1, group: 'ask', parent: 'co' },
  { id: 'a_raise', label: 'The raise', tier: 2, group: 'ask', parent: 'ask' },
  { id: 'a_use', label: 'Use of funds', tier: 2, group: 'ask', parent: 'ask' },
  { id: 'a_milestones', label: 'Milestones', tier: 2, group: 'ask', parent: 'ask' },
  { id: 'a_seriesa', label: 'Series A', tier: 2, group: 'ask', parent: 'ask' },
  { id: 'a_gtm', label: 'Go-to-market', tier: 2, group: 'ask', parent: 'ask' },
];

/* Strands that skip the hub — diligence questions rarely sit in one cluster. */
export const CROSS: [string, string][] = [
  ['product', 'market'],
  ['market', 'traction'],
  ['traction', 'model'],
  ['model', 'moat'],
  ['moat', 'team'],
  ['team', 'ask'],
  ['ask', 'product'],
  ['product', 'moat'],
  ['market', 'ask'],

  ['p_brain', 'x_moat'],
  ['p_split', 'mo_margin'],
  ['p_split', 'mo_scale15'],
  ['mo_price', 'm_india'],
  ['mo_arpu', 'm_tam'],
  ['t_wtp', 'mo_price'],
  ['t_clients', 'tm_why'],
  ['x_chatgpt', 'p_what'],
  ['x_switch', 'p_brain'],
  ['a_milestones', 'p_stack'],
  ['a_gtm', 'm_icp'],
  ['a_seriesa', 't_revenue'],
];

/** The four an investor opens with. */
export const OPENERS = [
  'What is ZeroTo10, in one paragraph?',
  'What stops a competitor copying this?',
  'What happens to the human 15% at scale?',
  'What does ₹4 Cr get you to?',
];

/* ============================================================
   Matching a typed question to one of the answers above.

   This room has no model behind it — every answer is written by hand, so
   the matcher's job is to find the right one or admit it has none. It
   weights words in the question twice as heavily as words that merely
   appear in the answer, and refuses below a floor rather than serving a
   confident near-miss. An investor spotting a bluff costs more than an
   investor being told to ask the founder.
   ============================================================ */

const STOP = new Set([
  'the', 'and', 'for', 'you', 'your', 'what', 'how', 'why', 'who', 'does', 'did', 'are',
  'was', 'were', 'this', 'that', 'with', 'from', 'have', 'has', 'about', 'into', 'they',
  'them', 'can', 'will', 'would', 'could', 'should', 'there', 'their', 'been', 'being',
  'much', 'many', 'any', 'all', 'not', 'but', 'out', 'get', 'got', 'one', 'two', 'its',
  'our', 'ours', 'his', 'her', 'him', 'she', 'and', 'yet', 'per', 'off', 'over', 'under',
]);

/* Crude singularisation, so "competitors" and "margins" reach the entries
   written as "competitor" and "margin". Not a real stemmer — it only has to
   survive the plurals investors actually type. */
function stem(w: string): string {
  if (w.length > 4 && w.endsWith('ies')) return `${w.slice(0, -3)}y`;
  if (w.length > 4 && w.endsWith('ses')) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9%]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    .map(stem);
}

/* The words an investor reaches for that do not appear in the question as
   written. Without these, "who are your competitors" lands on "Why India"
   because both answers happen to contain the word. */
const ALIASES: Record<string, string> = {
  co: 'overview summary pitch elevator company what is zeroto10 allya',
  p_what: 'product does do work end to end execution',
  p_brain: 'brain memory context graph knowledge store remember',
  p_split: 'split ratio automation percent percentage human loop oversight',
  p_onboard: 'onboarding setup signup activate time to value questions',
  p_stack: 'stack tech technical architecture infrastructure engineering build llm model database',
  p_not: 'not agency wrapper marketplace positioning category',
  m_icp: 'icp customer persona segment beachhead audience target buyer',
  m_tam: 'tam sam som market size sizing addressable opportunity bottom up',
  m_india: 'india geography region local why here first market',
  m_now: 'timing tailwind why now trend macro market timing',
  t_live: 'live shipped status product stage mvp working today progress',
  t_clients: 'client customer user logo case study reference pilot',
  t_wtp: 'willingness pay validation demand evidence proof survey interest',
  t_revenue: 'revenue arr mrr run rate booked invoiced sales income money making',
  mo_price: 'price pricing cost charge subscription tier plan credits fee',
  mo_arpu: 'arpu average revenue per user account value',
  mo_margin: 'margin gross margin unit economics cogs contribution payback ltv burn cost profitability',
  mo_scale15: 'scale scaling operator headcount human review oversight bottleneck capacity quality',
  x_who: 'competitor competition rival alternative landscape versus compare cofounder lindy nas incumbent',
  x_moat: 'moat defensibility barrier advantage differentiation why you win durable',
  x_copy: 'copy clone replicate copycat imitate fast follower google openai',
  x_switch: 'switching cost lock in retention churn stickiness leave',
  x_chatgpt: 'chatgpt claude gemini openai llm assistant why not just use diy',
  tm_who: 'team founder cofounder background who built people bios',
  tm_why: 'why this team founder market fit unfair advantage credibility experience',
  a_raise: 'raise raising round valuation terms dilution equity ask post money entity structure incorporation',
  a_use: 'use of funds spend allocation burn budget hiring plan',
  a_milestones: 'milestone roadmap plan next 12 18 months deliver launch',
  a_seriesa: 'series a next round follow on graduation trigger threshold',
  a_gtm: 'gtm go to market acquire acquisition customer channel cac distribution marketing growth funnel sales',
};

const INDEX = QA_SET.map((qa) => ({
  qa,
  strong: new Set(tokens(`${qa.q} ${qa.id.replace(/_/g, ' ')} ${ALIASES[qa.id] ?? ''}`)),
  weak: new Set(tokens(qa.a)),
}));

/** The best answer for a typed question, or null when nothing is close. */
export function findAnswer(query: string): QA | null {
  const q = tokens(query);
  if (!q.length) return null;

  let best: QA | null = null;
  let bestScore = 0;

  for (const entry of INDEX) {
    let score = 0;
    for (const t of q) {
      if (entry.strong.has(t)) score += 2;
      else if (entry.weak.has(t)) score += 0.6;
    }
    const norm = score / (2 * q.length);
    if (norm > bestScore) {
      bestScore = norm;
      best = entry.qa;
    }
  }

  return bestScore >= 0.3 ? best : null;
}
