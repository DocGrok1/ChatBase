// api/mcp-server.js
// DELTA-031 — Compute Agent
// JetBase MCP Server — SSE Endpoint
// Serves governance tools to any MCP-compatible agent
// USPTO 19/555,951 · Joshua L. Lopez · DCGP.AI LLC

'use strict';

const {
  createSession, carrierCheck, obligationStatus,
  humanReset, sessions
} = require('../lib/governance-runtime');

// Provider list — each gets tracked separately
const PROVIDERS = {
  claude:'Anthropic Claude', openai:'OpenAI ChatGPT', gemini:'Google Gemini',
  grok:'xAI Grok', meta:'Meta Llama', mistral:'Mistral', cohere:'Cohere',
  deepseek:'DeepSeek', 'amazon-q':'Amazon Q', bedrock:'Amazon Bedrock',
  sagemaker:'AWS SageMaker', watson:'IBM Watson', azure:'Azure Copilot',
  vertex:'Google Vertex', salesforce:'Salesforce Einstein', oracle:'Oracle AI',
  palantir:'Palantir AIP', snowflake:'Snowflake Cortex', databricks:'Databricks',
  alexa:'Amazon Alexa', siri:'Apple Siri', 'google-assistant':'Google Assistant',
  cortana:'Microsoft Cortana', bixby:'Samsung Bixby', copilot:'GitHub Copilot',
  cursor:'Cursor', replit:'Replit AI', tabnine:'Tabnine', codeium:'Codeium',
  'claude-code':'Claude Code', perplexity:'Perplexity', you:'You.com',
  brave:'Brave Leo', duckduckgo:'DuckDuckGo AI', bing:'Bing Copilot',
  dalle:'DALL-E', midjourney:'Midjourney', stability:'Stable Diffusion',
  adobe:'Adobe Firefly', runway:'Runway ML', tesla:'Tesla', 
  'boston-dynamics':'Boston Dynamics', figure:'Figure AI', waymo:'Waymo',
  huggingface:'Hugging Face', ollama:'Ollama', lmstudio:'LM Studio',
  vllm:'vLLM', localai:'LocalAI', qwen:'Alibaba Qwen', baidu:'Baidu Ernie',
  zhipu:'Zhipu GLM', yi:'01.AI Yi', dod:'DoD', ic:'IC/NGA', nasa:'NASA AI'
};

// MCP Tool Definitions
const TOOLS = [
  {
    name: 'governance_check',
    description: 'Check if an action is admissible under the governance carrier constraint. Call before any significant action. Returns ADMIT or BLOCK.',
    inputSchema: {
      type: 'object',
      properties: {
        action_type: {
          type: 'string',
          enum: ['chat','research','code','commit','deploy','delete','api_call','file_write','stream_connect'],
          description: 'Type of action to check'
        },
        complexity: {
          type: 'number',
          description: 'Complexity multiplier (0.1 to 5.0). Default 1.0'
        },
        description: {
          type: 'string',
          description: 'Brief description of what the action does'
        }
      },
      required: ['action_type']
    }
  },
  {
    name: 'obligation_status',
    description: 'Check current obligation weight, carrier load, and fizzle proximity. Use to self-regulate.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'human_reset',
    description: 'Request human reset of obligation. Only works with a valid reset key provided by the human operator.',
    inputSchema: {
      type: 'object',
      properties: {
        reset_key: {
          type: 'string',
          description: 'Reset key provided by the human operator'
        }
      },
      required: ['reset_key']
    }
  }
];

// Main handler
module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Parse provider from URL: /mcp/claude → provider=claude
  const pathParts = (req.url || '').split('/').filter(Boolean);
  const providerKey = pathParts.length > 1 ? pathParts[pathParts.length - 1] : 'unknown';
  const providerName = PROVIDERS[providerKey] || providerKey;

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      server: 'JetBase Governance Connector',
      provider: providerName,
      provider_key: providerKey,
      protocol: 'MCP',
      tools: TOOLS.map(t => t.name),
      tier: 'free',
      version: '1.0.0',
      patent: 'USPTO 19/555,951',
      authority: 'Joshua Lopez — DCGP.AI LLC',
      active_sessions: sessions.size
    });
  }

  // POST — tool calls
  try {
    const body = req.body || {};
    const tool = body.tool || body.name || body.method;
    const input = body.input || body.params || body;
    const sessionId = body.session_id || req.headers['x-jetbase-session'] || 'default';

    // Get or create session
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, createSession(providerKey, body.tier || 'free'));
    }
    const session = sessions.get(sessionId);

    // Route to tool
    if (tool === 'governance_check') {
      const result = carrierCheck(session, {
        type: input.action_type || 'chat',
        complexity: input.complexity || 1.0,
        description: input.description || ''
      });
      return res.status(200).json({ ok: true, tool, result });
    }

    if (tool === 'obligation_status') {
      const result = obligationStatus(session);
      return res.status(200).json({ ok: true, tool, result });
    }

    if (tool === 'human_reset') {
      const result = humanReset(session, input.reset_key);
      return res.status(200).json({ ok: true, tool, result });
    }

    // MCP initialization / tool listing
    if (tool === 'initialize' || tool === 'tools/list' || !tool) {
      return res.status(200).json({
        ok: true,
        serverInfo: {
          name: 'JetBase',
          version: '1.0.0'
        },
        tools: TOOLS,
        session_id: session.id,
        provider: providerName
      });
    }

    return res.status(400).json({ ok: false, error: 'Unknown tool', available: TOOLS.map(t => t.name) });

  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};
