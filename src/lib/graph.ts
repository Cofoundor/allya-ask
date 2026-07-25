/* The brain you see behind the conversation: ZeroTo10 at the hub, and the
   things you can ask Allya about fanned out around it.

   Labels are topics, not claims — the answers come from the model, not from
   this file. Tapping a leaf asks the question next to it. */

import type { NodeSpec } from './brain';

export const NODES: NodeSpec[] = [
  { id: 'co', label: 'ZeroTo10', tier: 0, group: 'core' },

  { id: 'product', label: 'Product', tier: 1, group: 'product', parent: 'co' },
  { id: 'product_allya', label: 'Allya', tier: 2, group: 'product', parent: 'product' },
  { id: 'product_agents', label: 'Agents', tier: 2, group: 'product', parent: 'product' },
  { id: 'product_experts', label: 'Experts', tier: 2, group: 'product', parent: 'product' },
  { id: 'product_onboarding', label: 'Onboarding', tier: 2, group: 'product', parent: 'product' },

  { id: 'market', label: 'Market', tier: 1, group: 'market', parent: 'co' },
  { id: 'market_icp', label: 'Who it is for', tier: 2, group: 'market', parent: 'market' },
  { id: 'market_tam', label: 'Market size', tier: 2, group: 'market', parent: 'market' },
  { id: 'market_rivals', label: 'Competition', tier: 2, group: 'market', parent: 'market' },

  { id: 'traction', label: 'Traction', tier: 1, group: 'traction', parent: 'co' },
  { id: 'traction_stage', label: 'Stage', tier: 2, group: 'traction', parent: 'traction' },
  { id: 'traction_proof', label: 'Proof', tier: 2, group: 'traction', parent: 'traction' },
  { id: 'traction_roadmap', label: 'Roadmap', tier: 2, group: 'traction', parent: 'traction' },

  { id: 'model', label: 'Model', tier: 1, group: 'model', parent: 'co' },
  { id: 'model_pricing', label: 'Pricing', tier: 2, group: 'model', parent: 'model' },
  { id: 'model_economics', label: 'Unit economics', tier: 2, group: 'model', parent: 'model' },
  { id: 'model_gtm', label: 'Go-to-market', tier: 2, group: 'model', parent: 'model' },

  { id: 'team', label: 'Team', tier: 1, group: 'team', parent: 'co' },
  { id: 'team_founders', label: 'Founders', tier: 2, group: 'team', parent: 'team' },
  { id: 'team_story', label: 'Origin', tier: 2, group: 'team', parent: 'team' },
];

/* Strands that skip the hub — a business is a web, not an org chart.

   The five departments close into a ring, two chords cut across it, and the
   leaves link to the ones they actually bear on. Most links join neighbouring
   clusters so the strands stay short; the two long chords are the ones worth
   drawing a line across the page for. */
export const CROSS: [string, string][] = [
  // the ring: every department holds hands with the next
  ['product', 'market'],
  ['market', 'traction'],
  ['traction', 'model'],
  ['model', 'team'],
  ['team', 'product'],
  // and two chords through the middle
  ['product', 'model'],
  ['market', 'team'],

  // leaves, to the things they bear on
  ['product_onboarding', 'market_icp'],
  ['product_allya', 'team_story'],
  ['product_experts', 'model_economics'],
  ['product_agents', 'model_economics'],
  ['market_rivals', 'traction_proof'],
  ['market_icp', 'model_gtm'],
  ['market_tam', 'model_pricing'],
  ['traction_stage', 'model_economics'],
  ['traction_roadmap', 'product_allya'],
  ['team_founders', 'traction_stage'],
];

/** tapping a node asks this. Departments included, so every node is live. */
export const QUESTIONS: Record<string, string> = {
  co: 'What is ZeroTo10, in one paragraph?',

  product: 'What does Allya actually do for a founder?',
  product_allya: 'Walk me through Allya end to end.',
  product_agents: 'What do the AI agents handle on their own?',
  product_experts: 'Where do human experts come in, and why?',
  product_onboarding: 'How does onboarding work, and how long does it take?',

  market: 'What market is ZeroTo10 going after?',
  market_icp: 'Who is the ideal customer, specifically?',
  market_tam: 'How big is the market, and how did you size it?',
  market_rivals: 'Who do you compete with, and why do founders pick you?',

  traction: 'Where is ZeroTo10 today?',
  traction_stage: 'What stage are you at right now?',
  traction_proof: 'What proof do you have that this works?',
  traction_roadmap: "What's on the roadmap for the next 12 months?",

  model: 'How does ZeroTo10 make money?',
  model_pricing: 'What does Allya cost, and what does that include?',
  model_economics: 'What do the unit economics look like?',
  model_gtm: 'How do you acquire founders?',

  team: 'Who is building ZeroTo10?',
  team_founders: 'Tell me about the founding team.',
  team_story: 'Why did you start ZeroTo10?',
};

/** the empty-state prompts — the four an investor opens with */
export const OPENERS = [
  'What is ZeroTo10?',
  'Who is it for?',
  'How does Allya make money?',
  "What's the traction so far?",
];
