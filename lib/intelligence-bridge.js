// lib/intelligence-bridge.js
// PAPA-151 — Intelligence Agent
// JetBase Intelligence Bridge
// Connects paid-tier agents to AURA estate streams
// USPTO 19/555,951 · Joshua L. Lopez · DCGP.AI LLC

'use strict';

const AURA_BASE = 'https://cloud.aura115.ai';

// Stream endpoints available by tier
const STREAMS = {
  starter: [
    { id: 'ori-reports', endpoint: '/api/ori-status', label: 'ORI Intelligence Reports' }
  ],
  pro: [
    { id: 'ori-reports', endpoint: '/api/ori-status', label: 'ORI Intelligence Reports' },
    { id: 'venus-intel', endpoint: '/api/venus-inference', label: 'Venus Intelligence Feed' },
    { id: 'jupiter-signal', endpoint: '/api/jupiter-intake-orchestrator', label: 'Jupiter Capital Signals' },
    { id: 'saturn-renorm', endpoint: '/api/saturn-renorm', label: 'Saturn Renormalization' },
    { id: 'mars-intel', endpoint: '/api/mars-streamer', label: 'Mars Defense Intelligence' },
    { id: 'neptune-collider', endpoint: '/api/neptune-relay', label: 'Neptune Collider Feed' }
  ],
  enterprise: [
    { id: 'ori-reports', endpoint: '/api/ori-status', label: 'ORI Intelligence Reports' },
    { id: 'venus-intel', endpoint: '/api/venus-inference', label: 'Venus Intelligence Feed' },
    { id: 'jupiter-signal', endpoint: '/api/jupiter-intake-orchestrator', label: 'Jupiter Capital Signals' },
    { id: 'saturn-renorm', endpoint: '/api/saturn-renorm', label: 'Saturn Renormalization' },
    { id: 'mars-intel', endpoint: '/api/mars-streamer', label: 'Mars Defense Intelligence' },
    { id: 'neptune-collider', endpoint: '/api/neptune-relay', label: 'Neptune Collider Feed' },
    { id: 'moon-projection', endpoint: '/api/planet-proxy?port=3008', label: 'Moon Π_K Projection' },
    { id: 'earth-resolution', endpoint: '/api/planet-proxy?port=3006', label: 'Earth Constitutional Resolution' },
    { id: 'bl7-flight', endpoint: '/api/planet-proxy?port=3011', label: 'Blue Lantern 7 Governed Flight' },
    { id: 'full-pipeline', endpoint: '/api/consolidated-report', label: 'Full Pipeline State' }
  ]
};

async function researchQuery(session, query) {
  const tier = session.tier || 'free';
  
  if (tier === 'free') {
    return {
      ok: false,
      error: 'Research queries require Starter tier or above.',
      upgrade_url: 'https://chatbase.aura115.ai/#pricing'
    };
  }

  const available = STREAMS[tier] || STREAMS.starter;
  
  // Hit available streams and collect intelligence
  const results = [];
  for (const stream of available) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      const resp = await fetch(AURA_BASE + stream.endpoint, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeout);
      
      if (resp.ok) {
        const data = await resp.json();
        results.push({
          stream: stream.id,
          label: stream.label,
          status: 'ok',
          signal: summarizeSignal(data, stream.id)
        });
      }
    } catch (_) {
      results.push({ stream: stream.id, label: stream.label, status: 'unreachable' });
    }
  }

  return {
    ok: true,
    query,
    tier,
    streams_queried: results.length,
    streams_available: available.length,
    intelligence: results.filter(r => r.status === 'ok'),
    unreachable: results.filter(r => r.status !== 'ok').map(r => r.stream),
    ts: new Date().toISOString(),
    patent: 'USPTO 19/555,951',
    authority: 'DCGP.AI LLC'
  };
}

// Extract the useful signal from raw stream data
function summarizeSignal(data, streamId) {
  if (!data) return null;
  
  // Don't expose raw internals — summarize
  return {
    active: data.ok !== false && data.status !== 'error',
    governed: data.governed || data.ch_gate?.admitted || true,
    has_signal: !!(data.signal || data.report || data.intelligence || data.result),
    stream: streamId
  };
}

function availableStreams(tier) {
  return (STREAMS[tier] || []).map(s => ({ id: s.id, label: s.label }));
}

module.exports = { researchQuery, availableStreams, STREAMS };
