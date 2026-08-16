// api/comcard-purchase.js — Contact ComCard™ Purchase + Stripe Checkout
// CC-5: $5 / 500,000 governed tokens. One card. One COIN. Universal purchasing.
// The card IS the license. Physical + digital. Clear substrate.
// Authority: Joshua Lopez — DCGP.AI — USPTO 19/555,951
'use strict';

const {
  COMCARD_TIERS,
  STRIPE_PUBLISHABLE_KEY,
  DOMAIN,
  ensureProducts,
  createCheckoutSession,
  listProducts,
} = require('../lib/stripe-engine');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-aura-operator-key');
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }

  const json = (code, obj) => {
    res.statusCode = code;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(obj));
  };

  // GET — product catalog (works with or without Stripe)
  if (req.method === 'GET') {
    const tiers = {};
    for (const [k, v] of Object.entries(COMCARD_TIERS)) {
      tiers[k] = { price: v.price / 100, tokens: v.tokens, label: v.label, note: v.note };
    }

    return json(200, {
      ok: true,
      route: '/api/comcard-purchase',
      product: 'Contact ComCard™',
      description: 'Constitutional Contact Card — governed identity + governed inference tokens. Clear substrate, physical + digital. The card IS the license.',
      tiers,
      purchasing: 'Universal — everyone buys equally. No enterprise agreements. No extraction. A gift.',
      payment: STRIPE_PUBLISHABLE_KEY ? 'LIVE — Stripe Checkout active' : 'PENDING — Stripe keys not configured',
      publishableKey: STRIPE_PUBLISHABLE_KEY || null,
      checkoutUrl: STRIPE_PUBLISHABLE_KEY ? '/api/comcard-purchase (POST with tier)' : null,
      authority: 'Joshua Lopez — DCGP.AI — USPTO 19/555,951',
      patent: 'USPTO 19/693,411 (NAME SVG)',
      protocol: 'CCTP-NAME-SVG-v1 + QHP',
      timestamp: new Date().toISOString(),
    });
  }

  // POST — create Stripe Checkout session OR return intent if Stripe not configured
  if (req.method === 'POST') {
    const body = req.body || {};
    const rawCardFields = ['card_number', 'cardNumber', 'pan', 'cvv', 'cvc', 'expiry', 'exp_month', 'exp_year'];
    const hasRawCardData = rawCardFields.some((field) => {
      const value = body[field];
      return typeof value === 'string' && value.trim().length > 0;
    });
    if (hasRawCardData) {
      return json(400, {
        ok: false,
        error: 'tokenized_payment_required',
        message: 'Raw card data is not accepted. Use tokenized Stripe Checkout only.'
      });
    }
    const tier = String(body.tier || body.product || 'CC-5').toUpperCase();
    const card = COMCARD_TIERS[tier];

    if (!card) {
      return json(400, {
        ok: false,
        error: 'invalid_tier',
        available: Object.keys(COMCARD_TIERS),
        message: 'Select a valid ComCard tier.',
      });
    }

    // If Stripe is configured, create a real checkout session
    if (STRIPE_PUBLISHABLE_KEY) {
      try {
        const accountId = body.accountId || null;
        const email = body.email || null;
        const session = await createCheckoutSession(tier, accountId, email);

        // If client wants JSON (API call), return session data
        if (req.headers['accept']?.includes('application/json') || body.returnJson) {
          return json(200, {
            ok: true,
            route: '/api/comcard-purchase',
            intent: 'checkout',
            tier,
            product: card.label,
            tokens: card.tokens,
            sessionId: session.sessionId,
            checkoutUrl: session.url,
            governed: true,
            authority: 'Joshua Lopez — DCGP.AI — USPTO 19/555,951',
            timestamp: new Date().toISOString(),
          });
        }

        // Otherwise redirect to Stripe hosted checkout
        res.statusCode = 303;
        res.setHeader('Location', session.url);
        return res.end();
      } catch (e) {
        return json(500, { ok: false, error: 'stripe_error', message: e.message });
      }
    }

    // Stripe not configured — return purchase intent
    return json(200, {
      ok: true,
      route: '/api/comcard-purchase',
      intent: 'purchase',
      tier,
      product: card.label,
      price: card.price / 100,
      tokens: card.tokens,
      note: card.note,
      payment_status: 'PENDING — Stripe keys not yet configured. Contact joshua@dcgp.ai for manual purchase.',
      card_is_license: true,
      digital_equals_physical: true,
      self_deploying: true,
      governed: true,
      authority: 'Joshua Lopez — DCGP.AI — USPTO 19/555,951',
      timestamp: new Date().toISOString(),
    });
  }

  return json(405, { ok: false, error: 'method_not_allowed' });
};
