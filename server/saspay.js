const crypto = require('crypto');
const tls = require('tls');
const { pool, query } = require('./db');

// Sur Windows / Node 24+, inclure les certificats racines système tout en gardant la validation TLS active
if (typeof tls.getCACertificates === 'function' && typeof tls.setDefaultCACertificates === 'function') {
  try {
    tls.setDefaultCACertificates([
      ...tls.getCACertificates('default'),
      ...tls.getCACertificates('system'),
    ]);
  } catch {}
}

const CREDIT_PRICE_USD = 0.80;

const CURRENCY_RATES = {
  USD: 1,
  CDF: 2850,
  EUR: 0.92,
  XAF: 615,
  XOF: 615,
  NGN: 1550,
  KES: 130,
  GHS: 15.5,
  RWF: 1350,
};

// Codes ISO2 actifs dans /countries/ SasPay (ZA étant inactif, ZAR bascule en USD)
const CURRENCY_COUNTRY_MAP = {
  CDF: 'CD',
  XOF: 'CI',
  XAF: 'CM',
  EUR: 'FR',
  NGN: 'NG',
  KES: 'KE',
  GHS: 'GH',
  RWF: 'RW',
};

const NAMED_PACKS = {
  pack_createur: {
    id: 'pack_createur',
    name: 'Pack Créateur',
    credits: 5,
    amount: 9.99,
    currency: 'EUR',
  },
  pack_illimite: {
    id: 'pack_illimite',
    name: 'Abonnement Illimité',
    credits: 50,
    amount: 24.99,
    currency: 'EUR',
  },
};

const PROMO_DISCOUNTS = {
  NZEMBO: 0.15,
  PROMO15: 0.15,
};

function getSaspayConfig() {
  const secretKey = (process.env.SASPAY_SECRET_KEY || '').trim();
  const defaultBase = secretKey.startsWith('sk_test_')
    ? 'https://sandbox-api.saspay.me/api/v1'
    : 'https://api.saspay.me/api/v1';
  const baseUrl = (process.env.SASPAY_API_BASE_URL || defaultBase).replace(/\/+$/, '');
  const webhookSecret = (process.env.SASPAY_WEBHOOK_SECRET || '').trim();
  return { secretKey, baseUrl, webhookSecret };
}

function unwrapSaspayData(json) {
  if (json && json.data && typeof json.data === 'object' && !Array.isArray(json.data)) {
    return json.data;
  }
  return json || {};
}

function extractSaspayError(json, statusCode) {
  if (!json || typeof json !== 'object') {
    return `Erreur API SasPay (HTTP ${statusCode})`;
  }
  if (json.error && typeof json.error === 'object' && json.error.message) {
    return json.error.message;
  }
  if (typeof json.message === 'string' && json.message.trim()) {
    return json.message;
  }
  if (json.error && typeof json.error === 'object') {
    const firstKey = Object.keys(json.error)[0];
    if (firstKey) {
      const val = json.error[firstKey];
      return `${firstKey}: ${Array.isArray(val) ? val.join(', ') : val}`;
    }
  }
  const topKey = Object.keys(json).find((k) => k !== 'success' && k !== 'code');
  if (topKey && Array.isArray(json[topKey])) {
    return `${topKey}: ${json[topKey].join(', ')}`;
  }
  return `Erreur API SasPay (HTTP ${statusCode})`;
}

async function saspayRequest(endpointPath, { method = 'GET', body, idempotencyKey } = {}) {
  const { secretKey, baseUrl } = getSaspayConfig();
  if (!secretKey) {
    const err = new Error('SASPAY_SECRET_KEY non configurée dans server/.env');
    err.statusCode = 500;
    throw err;
  }

  const headers = {
    Authorization: `Bearer ${secretKey}`,
    'Content-Type': 'application/json',
  };
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  const response = await fetch(`${baseUrl}${endpointPath}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { message: text };
  }

  if (!response.ok || json.success === false) {
    const err = new Error(extractSaspayError(json, response.status));
    err.statusCode = response.status >= 400 ? response.status : 502;
    err.details = json.error || json;
    throw err;
  }

  return unwrapSaspayData(json);
}

function computeAuthoritativeOrder({ pack_id, pack_name, credits, currency, promo_code }) {
  const normalizedPromo = String(promo_code || '').trim().toUpperCase();
  const discount = PROMO_DISCOUNTS[normalizedPromo] || 0;

  if (pack_id && NAMED_PACKS[pack_id]) {
    const pack = NAMED_PACKS[pack_id];
    const requestedCurr = String(currency || pack.currency).trim().toUpperCase();
    const effectiveCurr = CURRENCY_RATES[requestedCurr] ? requestedCurr : pack.currency;
    const baseUsd = pack.amount / CURRENCY_RATES[pack.currency];
    const finalUsd = +(baseUsd * (1 - discount)).toFixed(2);
    const rate = CURRENCY_RATES[effectiveCurr];
    const rawAmount = effectiveCurr === pack.currency && discount === 0
      ? pack.amount
      : finalUsd * rate;
    const formattedAmount = (rate >= 100 ? Math.round(rawAmount) : +rawAmount.toFixed(2)).toFixed(2);

    return {
      packId: pack.id,
      packName: pack_name || pack.name,
      credits: pack.credits,
      amountDecimal: formattedAmount,
      currency: effectiveCurr,
      amountUSD: finalUsd,
      amountCDF: Math.round(finalUsd * CURRENCY_RATES.CDF),
      promoCode: discount > 0 ? normalizedPromo : null,
      country: CURRENCY_COUNTRY_MAP[effectiveCurr] || null,
    };
  }

  const qty = parseInt(credits, 10);
  if (!Number.isInteger(qty) || qty < 1 || qty > 1000) {
    const err = new Error('Quantité de crédits invalide (entre 1 et 1000).');
    err.statusCode = 400;
    throw err;
  }

  const reqCurr = String(currency || 'USD').trim().toUpperCase();
  const effectiveCurr = CURRENCY_RATES[reqCurr] ? reqCurr : 'USD';
  const rate = CURRENCY_RATES[effectiveCurr];

  const baseUsd = qty * CREDIT_PRICE_USD;
  const finalUsd = +(baseUsd * (1 - discount)).toFixed(2);
  const rawAmount = finalUsd * rate;
  const normalizedAmount = rate >= 100 ? Math.round(rawAmount) : +rawAmount.toFixed(2);

  return {
    packId: pack_id || 'custom_credits',
    packName: pack_name || `Recharge ${qty} Crédits`,
    credits: qty,
    amountDecimal: normalizedAmount.toFixed(2),
    currency: effectiveCurr,
    amountUSD: finalUsd,
    amountCDF: Math.round(finalUsd * CURRENCY_RATES.CDF),
    promoCode: discount > 0 ? normalizedPromo : null,
    country: CURRENCY_COUNTRY_MAP[effectiveCurr] || null,
  };
}

function sanitizeFrontendReturnUrl(rawUrl) {
  const defaultAppUrl = (process.env.APP_URL || 'http://localhost:3001').replace(/\/+$/, '');
  if (!rawUrl || typeof rawUrl !== 'string') return defaultAppUrl;

  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return defaultAppUrl;
    }
    const allowedHosts = new Set(['localhost', '127.0.0.1', 'app.nzembo.com', 'nzembo.com']);
    try {
      allowedHosts.add(new URL(defaultAppUrl).hostname);
    } catch {}
    if (!allowedHosts.has(parsed.hostname)) {
      return defaultAppUrl;
    }
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return defaultAppUrl;
  }
}

function getBackendPublicUrl(req) {
  if (process.env.BACKEND_PUBLIC_URL) {
    return process.env.BACKEND_PUBLIC_URL.replace(/\/+$/, '');
  }
  const proto = req.get('x-forwarded-proto') || req.protocol || 'http';
  return `${proto}://${req.get('host')}`;
}

function verifyWebhookSignature(rawBodyBuffer, signatureHeader, timestampHeader, secret) {
  if (!secret || !rawBodyBuffer || !signatureHeader || !timestampHeader) {
    return false;
  }
  const ts = Number(timestampHeader);
  if (!Number.isFinite(ts)) return false;

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - ts) > 300) {
    return false;
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestampHeader}.`)
    .update(rawBodyBuffer)
    .digest('hex');

  const sigBuf = Buffer.from(String(signatureHeader).trim().toLowerCase(), 'utf8');
  const expBuf = Buffer.from(expected.toLowerCase(), 'utf8');
  return sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
}

async function getUserBalance(userId, userEmail) {
  let res = await query('SELECT id, credits FROM users WHERE id = $1', [userId]);
  if (res.rows.length === 0 && userEmail) {
    res = await query('SELECT id, credits FROM users WHERE email = $1', [userEmail]);
  }
  if (res.rows.length === 0) return 0;
  return Math.max(0, Number(res.rows[0].credits) || 0);
}

async function creditOrderOnce(order, { paymentId = null, reference = null, rawPayload = null } = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const lockRes = await client.query(
      `UPDATE payment_transactions
       SET status = 'SUCCESS',
           credited = TRUE,
           credited_at = NOW(),
           saspay_payment_id = COALESCE($2, saspay_payment_id),
           saspay_reference = COALESCE($3, saspay_reference),
           raw_payload = COALESCE($4::jsonb, raw_payload),
           updated_at = NOW()
       WHERE id = $1 AND credited = FALSE
       RETURNING *`,
      [order.id, paymentId, reference, rawPayload ? JSON.stringify(rawPayload) : null]
    );

    if (lockRes.rowCount === 0) {
      await client.query('ROLLBACK');
      const existing = await query('SELECT * FROM payment_transactions WHERE id = $1', [order.id]);
      const balance = await getUserBalance(order.user_id, order.user_email);
      return {
        newlyCredited: false,
        alreadyCredited: true,
        balance,
        order: existing.rows[0] || order,
      };
    }

    const updatedOrder = lockRes.rows[0];
    const creditsToAdd = Math.max(0, parseInt(updatedOrder.credits, 10) || 0);

    let userRes = await client.query('SELECT id, credits FROM users WHERE id = $1 FOR UPDATE', [updatedOrder.user_id]);
    if (userRes.rows.length === 0 && updatedOrder.user_email) {
      userRes = await client.query('SELECT id, credits FROM users WHERE email = $1 FOR UPDATE', [updatedOrder.user_email]);
    }

    let dbUserId = updatedOrder.user_id;
    let newBalance = creditsToAdd;

    if (userRes.rows.length > 0) {
      dbUserId = userRes.rows[0].id;
      const upd = await client.query(
        'UPDATE users SET credits = COALESCE(credits, 0) + $1 WHERE id = $2 RETURNING credits',
        [creditsToAdd, dbUserId]
      );
      newBalance = Number(upd.rows[0].credits) || 0;
    } else {
      const safeEmail = updatedOrder.user_email || `${updatedOrder.user_id}@users.nzembo.local`;
      const refCode = `NZ-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const ins = await client.query(
        `INSERT INTO users (id, name, email, credits, referral_code)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, credits`,
        [dbUserId, updatedOrder.user_name || 'Créateur Nzembo', safeEmail, creditsToAdd, refCode]
      );
      newBalance = Number(ins.rows[0].credits) || creditsToAdd;
    }

    const txId = `TX-SP-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
    const amountUSD = Number(((Number(updatedOrder.amount) || 0) / (CURRENCY_RATES[updatedOrder.currency] || 1)).toFixed(2));
    const amountCDF = Math.round(amountUSD * CURRENCY_RATES.CDF);

    await client.query(
      `INSERT INTO transactions (id, user_id, pack, credits, amount_usd, amount_cdf, method, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        txId,
        dbUserId,
        `${updatedOrder.pack_name} (${creditsToAdd} crédit${creditsToAdd > 1 ? 's' : ''})`,
        creditsToAdd,
        amountUSD,
        amountCDF,
        'SasPay',
        'Payé',
      ]
    );

    await client.query('COMMIT');

    return {
      newlyCredited: true,
      alreadyCredited: false,
      balance: newBalance,
      order: updatedOrder,
    };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

async function findOrder({ orderId, sessionId, paymentId }) {
  if (orderId) {
    const r = await query('SELECT * FROM payment_transactions WHERE id = $1', [orderId]);
    if (r.rows[0]) return r.rows[0];
  }
  if (sessionId) {
    const r = await query('SELECT * FROM payment_transactions WHERE checkout_session_id = $1', [sessionId]);
    if (r.rows[0]) return r.rows[0];
  }
  if (paymentId) {
    const r = await query('SELECT * FROM payment_transactions WHERE saspay_payment_id = $1', [paymentId]);
    if (r.rows[0]) return r.rows[0];

    // Si le webhook arrive avant le retour navigateur, rechercher parmi les sessions PENDING récentes
    const pendingRes = await query(
      `SELECT * FROM payment_transactions
       WHERE status = 'PENDING' AND credited = FALSE AND checkout_session_id IS NOT NULL
         AND created_at >= NOW() - INTERVAL '24 hours'
       ORDER BY created_at DESC LIMIT 20`
    );
    for (const row of pendingRes.rows) {
      try {
        const st = await saspayRequest(
          `/checkout-sessions/${encodeURIComponent(row.checkout_session_id)}/status/`
        );
        if (st && st.transaction_id) {
          await query(
            'UPDATE payment_transactions SET saspay_payment_id = $2, updated_at = NOW() WHERE id = $1',
            [row.id, st.transaction_id]
          );
          if (String(st.transaction_id) === String(paymentId)) {
            return { ...row, saspay_payment_id: st.transaction_id };
          }
        }
      } catch {}
    }
  }
  return null;
}

async function verifyAndFulfillOrder({ orderId = null, sessionId = null, paymentId = null } = {}) {
  const order = await findOrder({ orderId, sessionId, paymentId });
  if (!order) {
    return { found: false, verified: false, status: 'NOT_FOUND', balance: 0 };
  }

  if (order.credited) {
    const balance = await getUserBalance(order.user_id, order.user_email);
    return {
      found: true,
      verified: true,
      status: 'SUCCESS',
      credited: true,
      alreadyCredited: true,
      balance,
      order,
    };
  }

  let sessionStatusData = null;
  let resolvedPaymentId = paymentId || order.saspay_payment_id || null;

  if (order.checkout_session_id) {
    sessionStatusData = await saspayRequest(
      `/checkout-sessions/${encodeURIComponent(order.checkout_session_id)}/status/`
    );
    if (sessionStatusData.transaction_id) {
      resolvedPaymentId = sessionStatusData.transaction_id;
    }
  }

  let verifyData = null;
  if (resolvedPaymentId) {
    verifyData = await saspayRequest(
      `/payments/${encodeURIComponent(resolvedPaymentId)}/verify/`
    );
  }

  const txStatus = String(
    (verifyData && verifyData.status) ||
      (sessionStatusData && sessionStatusData.transaction_status) ||
      ''
  ).toUpperCase();
  const sessStatus = String((sessionStatusData && sessionStatusData.status) || '').toUpperCase();

  const isSuccess =
    (verifyData && txStatus === 'SUCCESS') ||
    (!resolvedPaymentId && sessStatus === 'PAID' && txStatus === 'SUCCESS');

  if (isSuccess) {
    const verifiedCurrency = String((verifyData && verifyData.currency) || order.currency).toUpperCase();
    const verifiedAmount = verifyData
      ? Number(verifyData.requested_amount || verifyData.net_amount || verifyData.amount || 0)
      : Number(order.amount);

    if (
      verifyData &&
      verifiedCurrency === String(order.currency).toUpperCase() &&
      verifiedAmount + 0.01 < Number(order.amount)
    ) {
      await query(
        `UPDATE payment_transactions SET status = 'AMOUNT_MISMATCH', raw_payload = $2, updated_at = NOW() WHERE id = $1`,
        [order.id, JSON.stringify({ sessionStatusData, verifyData })]
      );
      return { found: true, verified: false, status: 'FAILED', reason: 'amount_mismatch', order };
    }

    const fulfillment = await creditOrderOnce(order, {
      paymentId: resolvedPaymentId,
      reference:
        (verifyData && verifyData.reference) ||
        (sessionStatusData && sessionStatusData.transaction_reference) ||
        null,
      rawPayload: { sessionStatusData, verifyData },
    });

    return {
      found: true,
      verified: true,
      status: 'SUCCESS',
      credited: true,
      newlyCredited: fulfillment.newlyCredited,
      alreadyCredited: fulfillment.alreadyCredited,
      balance: fulfillment.balance,
      order: fulfillment.order,
    };
  }

  if (txStatus === 'FAILED' || txStatus === 'CANCELLED' || sessStatus === 'EXPIRED' || sessStatus === 'CANCELLED') {
    await query(
      `UPDATE payment_transactions
       SET status = $2,
           saspay_payment_id = COALESCE($3, saspay_payment_id),
           raw_payload = $4::jsonb,
           updated_at = NOW()
       WHERE id = $1`,
      [order.id, txStatus || sessStatus || 'FAILED', resolvedPaymentId, JSON.stringify({ sessionStatusData, verifyData })]
    );
    const balance = await getUserBalance(order.user_id, order.user_email);
    return { found: true, verified: false, status: 'FAILED', balance, order };
  }

  if (resolvedPaymentId && !order.saspay_payment_id) {
    await query(
      `UPDATE payment_transactions SET saspay_payment_id = $2, updated_at = NOW() WHERE id = $1`,
      [order.id, resolvedPaymentId]
    );
  }

  const balance = await getUserBalance(order.user_id, order.user_email);
  return { found: true, verified: false, status: 'PENDING', balance, order };
}

function registerSaspayRoutes(app) {
  // 1. Créer une session de paiement hébergée SasPay (POST /api/payments/saspay/checkout)
  app.post('/api/payments/saspay/checkout', async (req, res) => {
    try {
      const {
        user_id,
        user_email,
        user_name,
        pack_id,
        pack_name,
        credits,
        currency,
        promo_code,
        frontend_return_url,
      } = req.body || {};

      const userId = String(user_id || '').trim();
      if (!userId) {
        return res.status(400).json({ success: false, error: 'Identifiant utilisateur (user_id) requis.' });
      }

      const orderSpec = computeAuthoritativeOrder({
        pack_id,
        pack_name,
        credits,
        currency,
        promo_code,
      });

      const orderId = `ord_${crypto.randomUUID()}`;
      const customerEmail =
        user_email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(user_email).trim())
          ? String(user_email).trim()
          : 'client@nzembo.com';
      const customerName = String(user_name || 'Créateur Nzembo').trim().slice(0, 100) || 'Créateur Nzembo';

      const safeFrontendUrl = sanitizeFrontendReturnUrl(frontend_return_url);
      const backendPublicUrl = getBackendPublicUrl(req);
      const returnUrl = `${backendPublicUrl}/api/payments/saspay/callback?order_id=${encodeURIComponent(orderId)}`;

      await query(
        `INSERT INTO payment_transactions
         (id, provider, user_id, user_email, user_name, pack_id, pack_name, credits, amount, currency, promo_code, frontend_return_url, status)
         VALUES ($1, 'saspay', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'PENDING')`,
        [
          orderId,
          userId,
          customerEmail,
          customerName,
          orderSpec.packId,
          orderSpec.packName,
          orderSpec.credits,
          orderSpec.amountDecimal,
          orderSpec.currency,
          orderSpec.promoCode,
          safeFrontendUrl,
        ]
      );

      const saspayPayload = {
        amount: orderSpec.amountDecimal,
        currency: orderSpec.currency,
        description: `Nzembo — ${orderSpec.packName} (${orderSpec.credits} crédits)`,
        customer_email: customerEmail,
        customer_name: customerName,
        return_url: returnUrl,
        metadata: {
          order_id: orderId,
          user_id: userId,
          credits: orderSpec.credits,
          pack_id: orderSpec.packId,
          pack_name: orderSpec.packName,
        },
      };
      if (orderSpec.country) {
        saspayPayload.country = orderSpec.country;
      }

      const sessionData = await saspayRequest('/checkout-sessions/', {
        method: 'POST',
        body: saspayPayload,
      });

      if (!sessionData.checkout_url || !sessionData.id) {
        throw new Error('Réponse SasPay invalide : checkout_url manquant.');
      }

      await query(
        `UPDATE payment_transactions
         SET checkout_session_id = $2,
             saspay_slug = $3,
             checkout_url = $4,
             raw_payload = $5::jsonb,
             updated_at = NOW()
         WHERE id = $1`,
        [orderId, sessionData.id, sessionData.slug || null, sessionData.checkout_url, JSON.stringify(sessionData)]
      );

      return res.json({
        success: true,
        orderId,
        sessionId: sessionData.id,
        checkoutUrl: sessionData.checkout_url,
        amount: orderSpec.amountDecimal,
        currency: orderSpec.currency,
        credits: orderSpec.credits,
      });
    } catch (err) {
      const code = err.statusCode || 500;
      console.error('❌ [SasPay Checkout Error]:', err.message);
      return res.status(code).json({
        success: false,
        error: err.message || 'Impossible d\'initialiser le paiement SasPay.',
      });
    }
  });

  // 2. Route de retour navigateur après paiement SasPay (GET /api/payments/saspay/callback)
  app.get('/api/payments/saspay/callback', async (req, res) => {
    const orderId = req.query.order_id ? String(req.query.order_id) : null;
    const sessionId = req.query.session_id ? String(req.query.session_id) : null;
    const paymentId = req.query.payment_id || req.query.transaction_id ? String(req.query.payment_id || req.query.transaction_id) : null;

    let targetBase = sanitizeFrontendReturnUrl(null);
    try {
      const result = await verifyAndFulfillOrder({ orderId, sessionId, paymentId });
      if (result.order && result.order.frontend_return_url) {
        targetBase = sanitizeFrontendReturnUrl(result.order.frontend_return_url);
      }
      const redirectUrl = new URL(targetBase);
      redirectUrl.searchParams.set('payment', 'saspay');
      if (orderId || (result.order && result.order.id)) {
        redirectUrl.searchParams.set('order_id', orderId || result.order.id);
      }
      redirectUrl.searchParams.set('status', String(result.status || 'PENDING').toLowerCase());
      if (result.order) {
        redirectUrl.searchParams.set('credits', String(result.order.credits));
      }
      if (result.balance !== undefined) {
        redirectUrl.searchParams.set('balance', String(result.balance));
      }
      redirectUrl.hash = 'credits';
      return res.redirect(302, redirectUrl.toString());
    } catch (err) {
      console.error('❌ [SasPay Callback Error]:', err.message);
      const fallbackUrl = new URL(targetBase);
      fallbackUrl.searchParams.set('payment', 'saspay');
      if (orderId) fallbackUrl.searchParams.set('order_id', orderId);
      fallbackUrl.searchParams.set('status', 'pending');
      fallbackUrl.hash = 'credits';
      return res.redirect(302, fallbackUrl.toString());
    }
  });

  // 3. Vérification API côté frontend (GET /api/payments/saspay/verify/:orderId)
  app.get('/api/payments/saspay/verify/:orderId', async (req, res) => {
    try {
      const result = await verifyAndFulfillOrder({ orderId: req.params.orderId });
      if (!result.found) {
        return res.status(404).json({ success: false, error: 'Commande introuvable.' });
      }
      return res.json({
        success: true,
        verified: result.verified,
        status: result.status,
        credited: Boolean(result.credited),
        newlyCredited: Boolean(result.newlyCredited),
        credits: result.order ? result.order.credits : 0,
        packName: result.order ? result.order.pack_name : '',
        amount: result.order ? result.order.amount : '0.00',
        currency: result.order ? result.order.currency : 'USD',
        balance: result.balance,
      });
    } catch (err) {
      console.error('❌ [SasPay Verify Error]:', err.message);
      return res.status(err.statusCode || 500).json({
        success: false,
        error: err.message || 'Erreur lors de la vérification du paiement.',
      });
    }
  });

  // 4. Webhook officiel SasPay (POST /api/payments/saspay/webhook)
  app.post('/api/payments/saspay/webhook', async (req, res) => {
    try {
      const { webhookSecret } = getSaspayConfig();
      const sig = req.get('X-Webhook-Signature');
      const ts = req.get('X-Webhook-Timestamp');
      const evt = req.get('X-Webhook-Event') || (req.body && req.body.event) || '';

      if (webhookSecret) {
        const valid = verifyWebhookSignature(req.rawBody, sig, ts, webhookSecret);
        if (!valid) {
          console.warn('⚠️ [SasPay Webhook] Signature ou horodatage invalide.');
          return res.status(403).json({ success: false, error: 'Invalid webhook signature or timestamp' });
        }
      }

      if (evt === 'webhook.test') {
        return res.status(200).json({ received: true, test: true });
      }

      const data = (req.body && req.body.data) || {};
      const paymentId = data.id || null;
      const orderId = (data.metadata && data.metadata.order_id) || null;
      const sessionId = data.checkout_session_id || data.session_id || null;

      if (
        evt === 'transaction.success' ||
        evt === 'transaction.failed' ||
        evt === 'transaction.cancelled' ||
        String(data.status || '').toUpperCase() === 'SUCCESS'
      ) {
        if (orderId || sessionId || paymentId) {
          await verifyAndFulfillOrder({ orderId, sessionId, paymentId });
        }
      }

      return res.status(200).json({ received: true });
    } catch (err) {
      console.error('❌ [SasPay Webhook Error]:', err.message);
      return res.status(500).json({ received: false, error: err.message });
    }
  });

  // 5. Solde utilisateur autoritaire en base (GET /api/users/:id/credits)
  app.get('/api/users/:id/credits', async (req, res) => {
    try {
      const balance = await getUserBalance(req.params.id, req.query.email ? String(req.query.email) : null);
      return res.json({ success: true, userId: req.params.id, credits: balance });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
}

module.exports = {
  registerSaspayRoutes,
  verifyWebhookSignature,
  computeAuthoritativeOrder,
};
