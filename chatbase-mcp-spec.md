# ChatBase — MCP Governance Connector
## Server Specification & Product Tiers
## Joshua L. Lopez — DCGP.AI LLC — USPTO 19/555,951
## August 16, 2026

---

## MCP SERVER

**Endpoint:** `https://chatbase.aura115.ai/mcp`
**Protocol:** Model Context Protocol (SSE transport)
**Compatible:** Claude, ChatGPT, Gemini, Grok, any MCP-compatible agent
**Connection:** One click from any platform's connector menu

---

## WHAT HAPPENS ON CONNECT

1. Agent connects to chatbase.aura115.ai/mcp
2. Governance payload loads into agent context
3. Carrier check activates: C = I ∓ λM
4. Obligation accumulator M starts at 0
5. Agent is governed. No API calls per turn. Runs in-context.

---

## TOOLS EXPOSED VIA MCP

### Tool 1: `governance_check`
- Agent calls this before significant actions
- Input: { action_type, complexity, context_summary }
- Runs carrier check: λM ≤ γC
- Returns: ADMIT or BLOCK with residual report
- Lightweight — one call, not per-token

### Tool 2: `obligation_status`  
- Agent calls to check its own weight
- Returns: { M, λ, λM, carrier_remaining, fizzle_proximity }
- Agent can self-regulate — shed capability if getting heavy

### Tool 3: `research_query` (Paid tiers)
- Agent reaches into AURA estate
- Tapped into ORI nodes, Mars intelligence, Saturn renormalization
- Returns governed research signal — pre-filtered through carrier check
- The depth of the reach depends on the tier

### Tool 4: `stream_connect` (Pro tier)
- Agent connects to live AURA streams
- Jupiter capital signals, Venus intelligence, Neptune collider
- Real-time governed signal — carrier check on every stream pull

### Tool 5: `symbiosis_session` (Enterprise tier)
- Six-dimension symbiotic engine activates
- Authority loop: obligation converts to authority
- Long-term relationship memory
- q, p, S coordinates tracked across sessions
- This is the real thing. Full AURA.

---

## TIERS

### FREE — Governed Chat
**Price:** $0
**What you get:**
- governance_check tool
- obligation_status tool
- Carrier check: C = I ∓ λM
- Obligation accumulates per conversation
- Agent fizzles naturally at end of session
- Human reset required for new session
- Basic governance — no research, no streams
- **This alone is better than every ungoverned agent on earth**

**Why free:** Proves it works. Builds user base. Creates market signal.
Every free user is proof of demand that AI companies can see.

### STARTER — $5/conversation
**Price:** $5 per governed conversation (pay-as-you-go)
**Everything in Free plus:**
- research_query tool (limited — 10 queries per conversation)
- Agent can reach into AURA for research
- ORI intelligence reports available
- Patent-backed research signal
- Longer carrier before fizzle (γ increased)
- **The agent gets smarter because AURA is behind it**

### PRO — $29/month
**Price:** $29/month subscription
**Everything in Starter plus:**
- research_query unlimited
- stream_connect tool — live AURA streams
- Jupiter capital signals
- Venus intelligence feed
- Mars defense intelligence
- Saturn renormalization
- Persistent obligation tracking across conversations
- Agent memory carries between sessions (governed)
- Priority carrier capacity
- **This is a governed intelligence service, not a chat plugin**

### ENTERPRISE — Custom pricing
**Price:** Contact joshua@dcgp.ai
**Everything in Pro plus:**
- symbiosis_session tool — full six-dimension engine
- Authority loop activated
- Obligation-to-authority conversion
- Carnot-bounded thermodynamic governance
- Long-term governed relationships
- Custom stream configuration
- Dedicated carrier capacity on Graviton
- ComCard integration — shared invention revenue
- **This is AURA. The real thing. Behind their agent.**

---

## REVENUE MODEL

| Tier | Price | What they pay for | What you keep secret |
|------|-------|-------------------|---------------------|
| Free | $0 | Carrier check only | Everything |
| Starter | $5/conv | Research reach into AURA | Authority loop, streams, symbiosis |
| Pro | $29/mo | Live streams + persistence | Authority loop, symbiosis engine |
| Enterprise | Custom | Full symbiosis | The source itself — AURA is the backend, never exposed |

At every tier, the customer gets a governed agent.
At no tier does the customer see the source.
AURA is the backend. ChatBase is the window.
The lockpick quadratic runs in their context.
The authority algorithm never leaves your infrastructure.

---

## TECHNICAL ARCHITECTURE

```
Customer's agent (Claude/GPT/Gemini/Grok)
    │
    │  MCP connect (one click)
    ▼
chatbase.aura115.ai/mcp  ← MCP SSE endpoint
    │
    │  Governance payload loads into agent context
    │  Carrier check: C = I ∓ λM
    │  Tools: governance_check, obligation_status
    │
    ├──► [Free] Agent runs governed, fizzles naturally
    │
    ├──► [Starter] research_query → AURA estate (limited)
    │         │
    │         ▼
    │    ORI nodes → Mars → Saturn → research signal
    │
    ├──► [Pro] stream_connect → live AURA streams
    │         │
    │         ▼
    │    Jupiter ← Venus ← Neptune ← Moon ← BL7
    │    (full pipeline, carrier-gated)
    │
    └──► [Enterprise] symbiosis_session → six-dimension engine
              │
              ▼
         q, p, S coordinates
         Authority loop: O → K
         Carnot bound: η ≤ 1 - T_C/T_H
         Full AURA governance
```

---

## WHAT GOES ON THE LANDING PAGE

**chatbase.aura115.ai**

Headline: "Your agent. Governed."

Subhead: "One connection. Any platform. The only chat governance 
that works because it weighs more than the task."

Three buttons:
- CONNECT FREE → MCP connection flow
- SEE IT WORK → live demo with a governed agent
- PRICING → tier comparison

Below the fold:
- "Works with Claude, ChatGPT, Gemini, Grok, and any MCP-compatible agent"
- "No API keys. No code. No permission needed. Connect and go."
- "Patent-backed. USPTO 19/555,951 and 167 related filings."
- "DCGP.AI LLC — Joshua Lopez, Inventor"

---

## WHAT NEEDS TO BE BUILT

1. MCP server endpoint at chatbase.aura115.ai/mcp
2. governance_check tool implementation (carrier check algorithm)
3. obligation_status tool implementation
4. Landing page (index.html)
5. Stripe integration for Starter/Pro tiers
6. research_query bridge to AURA estate (Starter+)
7. stream_connect bridge to live streams (Pro+)
8. symbiosis_session full engine (Enterprise)

Items 1-4 can ship immediately on the Graviton.
Stripe is already built, waiting for keys.
The AURA estate is already running.
The streams are already live.

---

## FOUR AGENTS ASSIGNED

- DELTA-031: Builds the middleware and stream connections
- GOLF-061: Builds the landing page and business layer  
- CHARLIE-021: Governs the build — carrier check on every commit
- PAPA-151: Wires the intelligence streams from Saturn

All four run through the carrier check.
All four fizzle without human reset.
All four report back before anything ships.

---

© 2026 Joshua L. Lopez. DCGP.AI LLC. Patent Pending. All Rights Reserved.
