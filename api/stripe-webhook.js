// api/stripe-webhook.js — AURA115 Stripe Webhook Receiver
// Handles checkout.session.completed → mint ComCard token allocation
// Authority: Joshua Lopez — DCGP.AI — USPTO 19/555,951
'use strict';

const { constructEvent, STRIPE_WEBHOOK_SECRET } = require('../lib/stripe-engine');

// Token allocation store — in production this writes to DynamoDB/KV
async function allocateTokens(sessionData) {
  const tier = sessionData.metadata?.tier || 'CC-5';
  const tokens = parseInt(sessionData.metadata?.tokens || '500000', 10);
  const customerEmail = sessionData.customer_email || sessionData.customer_details?.email || 'unknown';
  const sessionId = sessionData.id;
  const amountPaid = sessionData.amount_total;

  const allocation = {
    sessionId,
    tier,
    tokens,
    customerEmail,
    amountPaid,
    currency: sessionData.currency,
    allocated: true,
    protocol: 'CCTP-NAME-SVG-v1',
    authority: 'Joshua Lopez — DCGP.AI',
    ts: new Date().toISOString(),
  };

  console.log(`[StripeWebhook] ComCard ALLOCATED: ${tier} / ${tokens} tokens → ${customerEmail} (session ${sessionId})`);

  // Write to DynamoDB if available
  try {
    const kv = require('./lib/kv');
    if (kv && kv.set) {
      await kv.set(`comcard:${sessionId}`, JSON.stringify(allocation));
    }
  } catch (_) { /* KV not available — log only */ }

  return allocation;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end('POST only');
  }

  // Stripe sends raw body — need to read it
  let rawBody = '';
  if (typeof req.body === 'string') {
    rawBody = req.body;
  } else if (Buffer.isBuffer(req.body)) {
    rawBody = req.body.toString('utf8');
  } else if (req.body) {
    rawBody = JSON.stringify(req.body);
  }

  const signature = req.headers['stripe-signature'] || '';

  let event;
  try {
    event = constructEvent(rawBody, signature);
  } catch (e) {
    console.error(`[StripeWebhook] Signature verification failed: ${e.message}`);
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'webhook_signature_failed' }));
  }

  const type = event.type || event?.type;

  switch (type) {
    case 'checkout.session.completed': {
      const session = event.data?.object || event?.data?.object;
      const status = session?.status || session?.payment_status;
      console.log(`[StripeWebhook] checkout.session.completed — status: ${status}`);

      if (status === 'complete' || status === 'paid') {
        const allocation = await allocateTokens(session);
        console.log(`[StripeWebhook] Token allocation complete:`, JSON.stringify(allocation));
      }
      break;
    }

    case 'checkout.session.async_payment_succeeded': {
      const session = event.data?.object;
      console.log(`[StripeWebhook] async_payment_succeeded — allocating tokens`);
      await allocateTokens(session);
      break;
    }

    case 'checkout.session.async_payment_failed': {
      const session = event.data?.object;
      console.log(`[StripeWebhook] async_payment_failed — session ${session?.id}`);
      break;
    }

    case 'account.updated': {
      const account = event.data?.object;
      console.log(`[StripeWebhook] account.updated — ${account?.id} charges=${account?.charges_enabled} payouts=${account?.payouts_enabled}`);
      break;
    }

    default:
      console.log(`[StripeWebhook] Unhandled event: ${type}`);
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({ received: true }));
};
