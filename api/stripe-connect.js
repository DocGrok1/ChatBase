// api/stripe-connect.js — AURA115 Stripe Connect Account Management
// Connected account creation, onboarding, and status
// Authority: Joshua Lopez — DCGP.AI — USPTO 19/555,951
'use strict';

const {
  createConnectAccount,
  createAccountLink,
  getAccountStatus,
  listProducts,
  ensureProducts,
  STRIPE_PUBLISHABLE_KEY,
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

  if (!STRIPE_PUBLISHABLE_KEY) {
    return json(503, { ok: false, error: 'stripe_not_configured', message: 'Stripe keys not set.' });
  }

  const body = req.body || {};
  const action = body.action || req.query?.action || (req.method === 'GET' ? 'status' : null);

  try {
    // POST — create connected account
    if (action === 'create-account') {
      const email = body.email;
      if (!email) return json(400, { ok: false, error: 'email_required' });
      const result = await createConnectAccount(email, body.displayName);
      return json(200, { ok: true, ...result });
    }

    // POST — create onboarding link
    if (action === 'create-account-link') {
      const accountId = body.accountId;
      if (!accountId) return json(400, { ok: false, error: 'accountId_required' });
      const result = await createAccountLink(accountId, body.refreshUrl, body.returnUrl);
      return json(200, { ok: true, ...result });
    }

    // GET/POST — account status
    if (action === 'status') {
      const accountId = body.accountId || req.query?.accountId;
      if (!accountId) return json(400, { ok: false, error: 'accountId_required' });
      const result = await getAccountStatus(accountId);
      return json(200, { ok: true, ...result });
    }

    // GET/POST — list products
    if (action === 'products') {
      const accountId = body.accountId || req.query?.accountId;
      const products = await listProducts(accountId);
      return json(200, { ok: true, products });
    }

    // POST — sync/create products in Stripe
    if (action === 'sync-products') {
      const accountId = body.accountId || null;
      const products = await ensureProducts(accountId);
      return json(200, { ok: true, synced: true, products });
    }

    return json(400, {
      ok: false,
      error: 'invalid_action',
      available: ['create-account', 'create-account-link', 'status', 'products', 'sync-products'],
    });
  } catch (e) {
    return json(500, { ok: false, error: 'stripe_error', message: e.message });
  }
};
