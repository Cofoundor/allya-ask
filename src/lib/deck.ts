/* ============================================================
   The pitch deck, as data — the sixteen slides in the left rail.

   Reproduced from `Zeroto10 Pitch Deck (shareable).html` (Aug 2026).
   The deck's internal reviewer notes ("ASK — ...", "Needs Sanshat") are
   deliberately NOT carried over: they are gaps flagged for the founder,
   not content for an investor.

   One deliberate departure: the deck still prints ₹2,000/mo on the
   business-model slide. Pricing was re-settled on 2 Sep 2026 at ₹1,000/mo
   plus pay-as-you-go credits, so this file and the answers both use the
   current number. PRICING below is the single place to change it.
   ============================================================ */

/** The current commercial model. Change it here and the whole page follows. */
export const PRICING = {
  platform: '₹1,000',
  creditRate: '1 credit = ₹10',
  tier2Floor: '₹5,500',
  tier2Run: '₹9,000–12,000',
  arpu: '₹35,000',
};

export interface Stat {
  v: string;
  k: string;
}

export interface Slide {
  n: string;
  label: string;
  kicker: string;
  headline: string;
  /** the body as short lines — this is a rail, not a slide renderer */
  lines: string[];
  stats?: Stat[];
  /** the one sentence the founder says out loud on this slide */
  say?: string;
}

export const SLIDES: Slide[] = [
  {
    n: '01',
    label: 'Cover',
    kicker: 'A brain for your business',
    headline: 'Allya',
    lines: [
      'The operating brain that remembers your business — then puts agents to work on top of it.',
      'Pre-Seed · ₹4 Cr',
    ],
    say: 'The brain fills the slide. The name sits inside it.',
  },
  {
    n: '02',
    label: 'Key numbers',
    kicker: 'In a nutshell',
    headline: 'Allya is the brain your business runs on.',
    lines: [
      'Two things compound, and neither is a feature: the brain gets denser with every decision a business feeds it, and a human signs off before anything ships.',
      'Competitors ship agents. Nobody ships both.',
    ],
    stats: [
      { v: 'MVP live', k: 'Product' },
      { v: '₹35K', k: 'ARPU / year' },
      { v: '₹4 Cr / 7%', k: 'Raise' },
      { v: '25', k: 'WTP responses' },
      { v: 'Bottom-up', k: 'Market sizing' },
      { v: 'Phased', k: 'GTM rollout' },
    ],
    say: 'One-line pitch, then the six numbers.',
  },
  {
    n: '03',
    label: 'The problem',
    kicker: 'The problem',
    headline: "Founders don't fail for lack of ideas. They fail in execution.",
    lines: [
      "A solo services founder's real week, once the agency retainer stops making sense:",
      'MON — Interviewing marketing freelancers, again',
      "TUE — Chasing an agency for last week's report",
      'WED — Onboarding an HR contractor from scratch',
      'THU — Asking ChatGPT the same question a third time',
      'FRI — Still no campaign live',
      'Agencies, freelancers, SaaS and chatbots each solve a slice. No tool both thinks and acts.',
    ],
    say: "One founder's real week, not a five-point pain list.",
  },
  {
    n: '04',
    label: 'The solution',
    kicker: 'Our solution',
    headline: 'The brain first. Agents second.',
    lines: [
      'Allya builds a living model of your business in 3–5 minutes of onboarding — goals, constraints, tone, history.',
      'Agents are what it reaches for once it already knows what to do.',
    ],
    stats: [
      { v: '85%', k: 'executed by agents' },
      { v: '15%', k: 'human oversight on top' },
    ],
    say: 'Lead with the headline, then point at the brain box.',
  },
  {
    n: '05',
    label: 'The product',
    kicker: 'The brain, in the product',
    headline: 'Every thought Allya connects about your business, visible while it works.',
    lines: [
      'The brain box — business context, ICP, tone, quarter goal, past campaigns.',
      'Decide together — discuss the problem, approve the plan. No prompt engineering.',
      'Work that shipped — the agents execute; the human gate signs off before it leaves.',
      'The outcome is logged back into the brain.',
    ],
    say: 'Walk the product: brain, conversation, shipped work.',
  },
  {
    n: '06',
    label: 'How it works',
    kicker: 'Everything routes through the brain',
    headline: 'A living model of the business — decisions, documents, tone, history. Denser with every use.',
    lines: [
      '01 — Founder input: onboard, discuss the problem, approve a direction',
      '02 — The brain decides: the task is planned against everything the business has ever told Allya',
      '03 — Agents execute: interchangeable hands across HR, Marketing, PR and Sales Ops',
      '04 — Human QA gate: 15% oversight before anything ships; every correction feeds back',
      'Not an agency. Not a freelancer marketplace. Not a prompt wrapper. Not a pile of agents you configure.',
    ],
    say: 'Agents are interchangeable hands. The brain is the product.',
  },
  {
    n: '07',
    label: 'Validation',
    kicker: 'Early execution, with outcomes attached',
    headline: '80% said yes at ₹5–10K per month.',
    lines: [
      'Mili Khare (dietician) — 28 tasks in 30 days across 3 client tiers; cut lead drop-offs and stabilised monthly revenue.',
      'SurferSearcher (marketing agency) — repositioned toward US B2B SaaS; 13 outbound campaigns live in month one.',
      'Dori (q-commerce) — idea validated through customer interviews and prior data; onboarding flows designed.',
      'Internal dogfooding — ZeroTo10 ran its own TAM sizing, validation process and this deck through Allya.',
    ],
    stats: [
      { v: '20+', k: 'founder conversations' },
      { v: '25', k: 'willingness-to-pay responses' },
      { v: '80%', k: 'yes at ₹5–10K/mo' },
    ],
    say: 'Outcome per case, not task counts alone.',
  },
  {
    n: '08',
    label: 'Market',
    kicker: "India's founder base, filtered down",
    headline: 'From 22 Cr down to a 1 Lakh beachhead.',
    lines: [
      'Total relevant population — 22 Cr',
      'Total addressable (TAM) — 15 Cr',
      'Entrepreneurially relevant — 5.85 Cr',
      'Serviceable (SAM) — 2 Cr',
      'SOM — 1 Lakh, 0.05% of SAM',
      'Entrepreneurial intention ~4.05 Cr (~27%); early-stage activity ~1.8 Cr (~12%); ~30% payment intention lands SAM at ~2 Cr.',
      'Blended ARPU ~₹35,000/year, so 1 Lakh implies roughly ₹350 Cr of annual revenue at full capture.',
    ],
    say: 'The top-down funnel is scaffolding; the bottom-up 18-month model is the real slide.',
  },
  {
    n: '09',
    label: 'Go-to-market',
    kicker: 'Six months, sequenced by trust',
    headline: 'Channel order = trust depth × memory lifespan.',
    lines: [
      'M1 Problem ID — reply to problem-led posts on X; learn from founder pain',
      'M2 Brand building — daily reels, startup communities, affiliates',
      'M3 Validation — community input shifts focus to demand capture',
      'M4 Public waitlist — waitlist live; webinars and partnership placements',
      'M5 Private beta — manual onboarding, close observation, testimonials',
      'M6 Public launch — countdown across every active channel; launch with proof',
      'Instagram · YouTube · Twitter/X · Reddit · Email · LinkedIn',
    ],
    say: 'The trust-depth sequencing is the most original thinking in the deck.',
  },
  {
    n: '10',
    label: 'Business model',
    kicker: 'Subscription for access, credits for execution',
    headline: `${PRICING.platform}/month for the platform, credits for the work.`,
    lines: [
      `Platform access — ${PRICING.platform}/month. Context store, unlimited asking, LinkedIn drafting and publishing.`,
      `Serviced tier — ${PRICING.platform}/mo plus a minimum 500 credits/mo. Adds the human 15%, a warm-up slot, campaign execution and a named operator. Floor ${PRICING.tier2Floor}/mo, realistic run rate ${PRICING.tier2Run}/mo.`,
      `Credits: ${PRICING.creditRate}, sold as prepaid packs of 300 / 800 / 2,000. Credits never expire.`,
      'The menu covers only what exists — LinkedIn post human-checked 40 / auto 15; warm-up 150 per domain per month; lead list 200 per 100 leads; email campaign 300 (150 contacts) or 800 (500 contacts); reply triage 150 per 100 replies.',
      'First month free is honoured as free platform plus 100 free credits. A campaign is never given away — it has real marginal cost.',
    ],
    say: 'Credits price the human work where it is consumed.',
  },
  {
    n: '11',
    label: 'Unit economics',
    kicker: 'Unit economics',
    headline: `${PRICING.arpu} blended ARPU per year.`,
    lines: [
      'Subscription plus credits, per customer per year.',
      '85% AI-executed at low marginal cost; the 15% human oversight on top carries the quality.',
      'Marginal cost per serviced client runs ₹4,000–6,000/month — LLM ₹800–1,500, email infrastructure ₹800–1,500, roughly 5 operator hours at ₹2,000–3,000.',
    ],
    say: 'The credit line exists so the human 15% is funded, not subsidised.',
  },
  {
    n: '12',
    label: 'Competition',
    kicker: 'Competition',
    headline: 'Agents are commodity. The brain is not.',
    lines: [
      'Allya — hybrid AI + human, India-first founders and MSMEs, human QA built in, compounding business brain.',
      'Cofounder.ai — AI agents, global founders, no human QA. Launched June 2026 at $39/mo; 12 founder personas plus saved business memory.',
      'Nas.io — AI-assisted, creators and communities, no human QA.',
      'Lindy.ai — AI agents, ops teams and marketers, no human QA.',
      'What founders actually use today — agency + ChatGPT, WhatsApp VAs, fractional COOs. All human, no memory across tools.',
      'Memory alone is no longer the wedge. The human QA gate and India-first distribution are.',
    ],
    say: 'Re-checked August 2026. Lead with the gate, not with memory.',
  },
  {
    n: '13',
    label: 'Why now',
    kicker: 'From copilots to autonomous execution',
    headline: 'Four tailwinds, all sourced.',
    lines: [
      '2.23 L DPIIT-recognised startups as of 31 March 2026. FY26 alone added a record 55,200 — recognitions up 51.6% year on year, from ~350 in 2014.',
      '63% of global WhatsApp Business downloads are Indian — the channel founders already run their business on.',
      '+38% Indian SaaS funding year on year: $1.26B raised by April 2026 against $915M in the same period of 2025.',
      '40% of enterprise apps embedding agents by end-2026, up from under 5% in 2025.',
      'Sources — Ministry of Commerce & Industry (31 Mar 2026); third-party WhatsApp download compilations (2026, not a Meta figure); Tracxn (Apr 2026); Gartner (Aug 2025).',
    ],
    say: 'Four sourced tailwinds, not "AI agents are hot".',
  },
  {
    n: '14',
    label: 'Team',
    kicker: 'Operator plus deep tech',
    headline: 'Two founders: the pain, and the build.',
    lines: [
      'Sanshat Bhatia — CEO & Founder. Built and led ops and marketing at Trailytics AI, SoftwareHunt and Zenith Media. Co-runs performance marketing agency Leadwisee — living the founder pain Allya solves.',
      'Ayush Soni — CTO & Co-founder. IIT Bhubaneswar; led Inter-IIT teams to two Top-5 finishes. Software developer at Oracle with production LLM workflow experience.',
      'Sep 24 — semi-automated ops agency launched; prompt workflows cut time 30%',
      'Dec 24 — 50% automation; repositioned as outsourced cofounder; pricing misfit exposed',
      'Jan–Mar 25 — 100-question onboarding built to standardise client context',
      'May 25 — agent workflows built out; chatbot concept emerged',
      'Oct 25 — full build started, CTO joined; onboarding cut from 100 to 22 questions',
      'Nov–Dec 25 — POC launched at ~70% automation; backend pivoted; tiered onboarding',
      '2026 → now — MVP live and in front of clients',
    ],
    say: 'The agency is not a side business. It is the research lab.',
  },
  {
    n: '15',
    label: 'Roadmap',
    kicker: 'Core platform, then ecosystem',
    headline: 'Launch at month 6, Forge in year one, ecosystem by year three.',
    lines: [
      'Months 1–2 · Core platform — pipeline architecture and APIs, onboarding schemas, chatbot behaviour validated internally, vector database finalised.',
      'Months 3–4 · MVP services — end-to-end flows for recruitment, policy, marketing and social. Human review loops integrated; deployment architecture finalised.',
      'Month 6 → Year 1 · Launch, scale and Forge — public launch, service expansion, and ZeroTo10 Forge, an AI CTO for full-stack company building. WhatsApp-first integration lands here.',
      'Year 3 · Ecosystem — multilingual foundation models and expansion into emerging markets.',
    ],
    say: 'WhatsApp-first is pulled into Year 1, not a Year 3 item.',
  },
  {
    n: '16',
    label: 'The ask',
    kicker: 'The ask',
    headline: '₹4 Cr for 7%, 24 months of runway.',
    lines: [
      'Monthly allocation at ~₹15 Lakh/month burn:',
      'Salaries and team — ₹9.5 L',
      'Marketing and GTM — ₹2.5 L',
      'Other / buffer — ₹2 L',
      'Server and infrastructure — ₹1 L',
    ],
    stats: [
      { v: '₹4 Cr', k: 'capital raise' },
      { v: '7%', k: 'equity offered' },
      { v: '₹57 Cr', k: 'post-money' },
      { v: '24 mo', k: 'runway' },
    ],
    say: 'Hand over the chatbot link here and stop talking.',
  },
];

/* The pointers that sit under the brain, where the product page shows
   "What I know". Each is a claim an investor can check against a slide. */
export interface Pointer {
  text: string;
  slide: string;
}

export const POINTERS: Pointer[] = [
  { text: 'MVP is live and in front of paying-tier clients — not a prototype', slide: '02' },
  { text: '85% of the work runs on agents; a human signs off on the other 15%', slide: '04' },
  { text: 'Onboarding builds the company model in 3–5 minutes, down from 100 questions to 22', slide: '06' },
  { text: '20+ founder conversations, 25 willingness-to-pay responses, 80% yes at ₹5–10K/mo', slide: '07' },
  { text: 'Three named early clients, each with an outcome attached, not just task counts', slide: '07' },
  { text: 'SAM of 2 Cr founders; a 1 Lakh beachhead is 0.05% of it', slide: '08' },
  { text: `${PRICING.platform}/month platform plus credits — the human 15% is funded, not subsidised`, slide: '10' },
  { text: `${PRICING.arpu} blended ARPU per year, subscription plus credits`, slide: '11' },
  { text: 'Cofounder.ai now advertises memory too — the gate and India-first distribution are the wedge', slide: '12' },
  { text: 'FY26 added a record 55,200 DPIIT-recognised startups, up 51.6% year on year', slide: '13' },
  { text: 'CEO co-runs a live performance-marketing agency; CTO shipped production LLM workflows at Oracle', slide: '14' },
  { text: '₹4 Cr for 7% at ₹57 Cr post, 24 months at ~₹15 L/month', slide: '16' },
];
