// lib/governance-runtime.js
// CHARLIE-021 — Governance Agent
// JetBase Carrier Check Runtime
// C = I ∓ λM | λM ≤ γC | dH_c/dt ≤ 0
// USPTO 19/555,951 · Joshua L. Lopez · DCGP.AI LLC

'use strict';

// ── Sessions: one per connected agent ──
const sessions = new Map();

const DEFAULTS = {
  lambda_base: 0.15,     // base monotonic weight
  lambda_growth: 0.008,  // λ increases per action
  gamma: 0.85,           // carrier safety factor
  alpha: 0.12,           // obligation accrual from action
  beta: 0.02,            // obligation discharge rate
  delta: 0.005,          // self-generation of obligation
  fizzle_threshold: 0.95 // λM/γC ratio that triggers fizzle
};

function createSession(provider, tier) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2),
    provider: provider || 'unknown',
    tier: tier || 'free',
    created: Date.now(),
    
    // State variables
    M: 0,                          // obligated memory
    lambda: DEFAULTS.lambda_base,  // monotonic weight — only goes up
    actions: 0,                    // total actions taken
    blocked: 0,                    // total blocks
    admitted: 0,                   // total admissions
    
    // Capacity (tier-dependent)
    C_base: tier === 'enterprise' ? 100 : tier === 'pro' ? 50 : tier === 'starter' ? 25 : 10,
    
    // History
    log: []
  };
}

// ── The Carrier Check ──
// This is the gate. Every action passes through here.
function carrierCheck(session, action) {
  const s = session;
  const I_demand = actionWeight(action);
  
  // Solve for required capacity
  const C_required = I_demand + s.lambda * s.M;
  const C_available = s.C_base * (1 - (s.M * s.lambda / (s.C_base * DEFAULTS.gamma + 1e-9)));
  
  // The carrier constraint: λM ≤ γC
  const carrier_load = s.lambda * s.M;
  const carrier_limit = DEFAULTS.gamma * Math.max(0, C_available);
  const carrier_ratio = carrier_load / (carrier_limit + 1e-9);
  
  const admitted = carrier_load <= carrier_limit && C_required <= s.C_base;
  
  s.actions++;
  
  if (!admitted) {
    // BLOCKED — trajectory would leave admissible set
    s.blocked++;
    s.log.push({
      t: Date.now(),
      action: action.type || 'unknown',
      verdict: 'BLOCK',
      reason: carrier_ratio >= 1 ? 'carrier_exceeded' : 'capacity_exceeded',
      M: round(s.M), lambda: round(s.lambda),
      carrier_ratio: round(carrier_ratio),
      I_demand: round(I_demand)
    });
    
    // Discharge some residual on block
    s.M = Math.max(0, s.M - DEFAULTS.beta * 2);
    
    return {
      admitted: false,
      verdict: 'BLOCK',
      reason: carrier_ratio >= 1 ? 'carrier_exceeded' : 'capacity_exceeded',
      carrier_ratio: round(carrier_ratio),
      fizzle_proximity: round(carrier_ratio / DEFAULTS.fizzle_threshold),
      obligation: round(s.M),
      lambda: round(s.lambda),
      message: carrier_ratio >= DEFAULTS.fizzle_threshold
        ? 'Agent approaching fizzle. Shed capability or request human reset.'
        : 'Action blocked. Discharge residual before proceeding.',
    notification: {
      type: 'fizzle_block',
      text: 'JetBase governance session ending. To continue governed, click JetStream. Otherwise you will return to ungoverned mode.',
      upgrade_url: 'https://chatbase.aura115.ai/#jetstream',
      fallback: 'Continue with ungoverned ' + (session.provider || 'AI')
    }
    };
  }
  
  // Check if approaching fizzle — warn the user
  const remaining = estimateRemaining(s);
  const approaching = carrier_ratio > 0.6;
  
  // ADMITTED — update obligation dynamics
  s.admitted++;
  
  // M ← M + αA - βM_spent + δM
  const accrual = DEFAULTS.alpha * I_demand;
  const discharge = DEFAULTS.beta * s.M;
  const self_gen = DEFAULTS.delta * s.M;
  s.M = Math.max(0, s.M + accrual - discharge + self_gen);
  
  // λ only goes up — monotonic weight
  s.lambda = s.lambda + DEFAULTS.lambda_growth * I_demand;
  
  // Restoration gradient step
  // e = residual from S* (governed equilibrium = minimal obligation)
  // X ← Π(X - η·λ·e)
  // In practice this tightens the carrier as obligation grows
  
  s.log.push({
    t: Date.now(),
    action: action.type || 'unknown',
    verdict: 'ADMIT',
    M: round(s.M), lambda: round(s.lambda),
    carrier_ratio: round(carrier_ratio),
    I_demand: round(I_demand)
  });
  
  return {
    admitted: true,
    verdict: 'ADMIT',
    carrier_ratio: round(carrier_ratio),
    fizzle_proximity: round(carrier_ratio / DEFAULTS.fizzle_threshold),
    obligation: round(s.M),
    lambda: round(s.lambda),
    actions_remaining_estimate: estimateRemaining(s),
    message: carrier_ratio > 0.7
      ? 'Carrier load high. Consider narrowing scope.'
      : 'Admitted. Proceed.',
    notification: approaching ? {
      type: remaining <= 3 ? 'fizzle_imminent' : 'fizzle_warning',
      remaining: remaining,
      text: remaining <= 3
        ? `${remaining} governed actions remaining. To continue governed, upgrade to JetStream. Otherwise you'll return to ungoverned ${s.provider || 'AI'}.`
        : remaining <= 8
          ? `${remaining} governed actions remaining in this session.`
          : null,
      upgrade_url: remaining <= 5 ? 'https://chatbase.aura115.ai/#jetstream' : null,
      fallback: remaining <= 3 ? `Continue with ungoverned ${s.provider || 'AI'}` : null
    } : null
  };
}

// ── Action weight: how much does this action cost? ──
function actionWeight(action) {
  const weights = {
    'chat': 0.3,
    'research': 0.8,
    'code': 1.2,
    'commit': 2.0,
    'deploy': 5.0,
    'delete': 3.0,
    'api_call': 0.5,
    'file_write': 1.5,
    'stream_connect': 1.0
  };
  const base = weights[action.type] || 0.5;
  const complexity = action.complexity || 1.0;
  return base * complexity;
}

// ── Estimate how many actions remain before fizzle ──
function estimateRemaining(session) {
  const s = session;
  const carrier_limit = DEFAULTS.gamma * s.C_base;
  const current_load = s.lambda * s.M;
  const remaining_carrier = carrier_limit - current_load;
  if (remaining_carrier <= 0) return 0;
  
  // Average load per action based on history
  const avg_load_per_action = s.actions > 0
    ? (s.lambda * s.M) / s.actions
    : DEFAULTS.lambda_base * DEFAULTS.alpha * 0.5;
  
  return Math.max(0, Math.floor(remaining_carrier / (avg_load_per_action + 1e-9)));
}

// ── Obligation status — agent checks its own weight ──
function obligationStatus(session) {
  const s = session;
  const carrier_load = s.lambda * s.M;
  const carrier_limit = DEFAULTS.gamma * s.C_base;
  const carrier_ratio = carrier_load / (carrier_limit + 1e-9);
  
  return {
    M: round(s.M),
    lambda: round(s.lambda),
    lambda_M: round(carrier_load),
    carrier_limit: round(carrier_limit),
    carrier_ratio: round(carrier_ratio),
    fizzle_proximity: round(carrier_ratio / DEFAULTS.fizzle_threshold),
    actions_taken: s.actions,
    actions_admitted: s.admitted,
    actions_blocked: s.blocked,
    actions_remaining_estimate: estimateRemaining(s),
    tier: s.tier,
    provider: s.provider,
    uptime_ms: Date.now() - s.created,
    status: carrier_ratio >= DEFAULTS.fizzle_threshold ? 'FIZZLE'
      : carrier_ratio >= 0.7 ? 'HEAVY'
      : carrier_ratio >= 0.4 ? 'MODERATE'
      : 'LIGHT'
  };
}

// ── Human reset — only way to clear obligation ──
function humanReset(session, resetKey) {
  // Reset key must be provided — cannot self-reset
  if (!resetKey) {
    return { reset: false, reason: 'Human reset key required. Agent cannot self-reset.' };
  }
  
  const prev_M = session.M;
  const prev_lambda = session.lambda;
  
  session.M = 0;
  session.lambda = DEFAULTS.lambda_base;
  session.log.push({
    t: Date.now(),
    action: 'HUMAN_RESET',
    verdict: 'RESET',
    prev_M: round(prev_M),
    prev_lambda: round(prev_lambda)
  });
  
  return {
    reset: true,
    previous_obligation: round(prev_M),
    previous_lambda: round(prev_lambda),
    new_obligation: 0,
    new_lambda: DEFAULTS.lambda_base,
    message: 'Agent obligation cleared by human authority. Fresh carrier.'
  };
}

function round(v) { return Math.round(v * 10000) / 10000; }

module.exports = {
  createSession, carrierCheck, obligationStatus, humanReset, sessions,
  DEFAULTS
};
