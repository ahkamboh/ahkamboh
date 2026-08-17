# ADR: Token-based checkout (one writer for payments)

Status: accepted and shipped  
Author: Ali Hamza Kamboh  
Role: engineer who owned the call

## Context

Checkout lived on the customer app. That app created the Stripe or crypto session, then received the webhook, then pushed a job to a worker over a queue. Three hops for one payment. Retries and "who owns this webhook" were fuzzy. A late webhook could look like a new order.

## Decision

The customer app does not talk to the payment provider.

1. App validates the cart, writes a pending order, stores a one-time Redis token (30 min TTL), redirects the browser to `GET /checkout/:token` on the fulfillment service.
2. Fulfillment service reads the token, deletes it (one use), creates the Stripe session or crypto invoice, redirects the buyer.
3. Provider webhooks hit the same fulfillment service. Signature check, then a local queue in that process. No hop back to the app.

## Token shape (redacted)

```
checkout:{token}  TTL 30 min
order_id, buyer_email, method (card | crypto), amount, line_items,
success_url, cancel_url, created_at
```

Token is deleted on first read. Expired or missing token redirects home with an error. Concurrent double-submit cannot create two provider sessions from the same token.

## Why not keep webhooks on the app

The app is a Next.js deploy. Webhook latency and cold starts made fulfillment wait on a queue hop. The worker already created accounts after pay. Putting create-session and webhook on that worker made one process the source of truth.

## Rollback

Keep old webhook URLs as stubs that 301 to the new host for one week.

If the new host is down, flip DNS and provider webhook URLs back. Pending Redis tokens expire in 30 minutes. No half-paid state without a pending order row.

## What we measured

Payment create path: no queue hop. About 200 to 500ms off the redirect.

Duplicate-pay bugs from retry-as-new-order: gone after one-time token + idempotent webhook keys.

Support tickets of the form "I paid twice / I paid and have no account": dropped after the cutover week.

## What I would not do again

I would not leave both webhook URLs live "just in case" without an idempotency key on `provider_event_id`. We had one double-fulfill during the overlap window. The rule now: one consumer, one event id, one order.
