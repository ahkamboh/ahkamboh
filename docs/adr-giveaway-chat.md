# ADR: Web giveaway chat (replace Discord, keep the funnel)

Status: accepted, in build  
Author: Ali Hamza Kamboh  
Role: engineer who owned the call

This is the decision record for a consumer chat product that takes over a Discord giveaway funnel. Same job as a marketplace ticket: capture a person, run a bot, escalate to a human, measure the funnel. Company names and infra IDs are redacted.

## Context

Giveaway intake lived on Discord. The bot already worked. Discord as the host did not: mobile drop-off, no real ownership of the data, staff jumping between Discord and an admin site, and we could not retire the server without losing the funnel.

We needed a web app that looks like Discord enough that members do not bounce, runs the same ticket brain, and lets us turn Discord off after cutover.

## Locked decisions

1. One platform, brand by hostname. One worker process serves both brands. An unknown host fails closed. It does not default to a brand.
2. Firestore, named database, path-shaped ownership: `chats/{uid}/tickets/{ticketId}/messages/{msgId}`. The security rule is one line because the uid is in the path.
3. Entry is email only, asked once in the enrollment channel. New email: create user, sign in, open ticket on one press. Known email: six-digit code, then resume the same uid.
4. Staff are a role in the same UI, not a second app. Same email-plus-code machinery, extra claim, unlisted sign-in. Grant and revoke live on the existing admin portal, server-to-server, with an audit row written before the claim changes.
5. Hard "already used this chance" is email only, and it never expires. Reviewer name, screenshot lookalike, device, and IP are soft signals for staff. They do not refuse a new email. Shared phones would false-block honest people.
6. One open ticket per person, enforced inside the create transaction on `users/{uid}.openTicketId`. A check-then-create on a slow phone opens two tickets.
7. The create write sets `needsBotReply`. Nothing else polls for new tickets. A ticket with no flag is invisible to the brain forever.
8. `approval` starts as `none`. It becomes `pending` only when a screenshot exists. Creating as `pending` floods the review queue with empty tickets.
9. Mobile is the product. Over 80% of traffic is a phone. Our own message rows over a pinned virtualizer, end-anchored. No chat SaaS, no chat UI kit. Safari has no scroll anchoring.
10. Discord retires after cutover. This app owns the data.

## Architecture

```
Member (phone) --> Web app (host = brand)
                     |  enrollment: email + create ticket
                     |  ticket channel: live last 20 messages
                     v
                 Firestore
                     ^
                     | needsBotReply + leases
                 Brain worker (resident)
                     | vision pool, text fast-lane
                     v
                 Staff in the same shell
                     review queue, stats, takeover (botMuted)
```

## Why a resident worker, not a queue ping

The live portals ping a worker over HTTP, then enqueue. That ping is what we were insuring against with a sweep. A process that already watches Firestore does not need the ping. It needs three things:

- A bounded collection-group listener on `needsBotReply`
- Per-ticket leases (`claimedBy`, `claimedAt`) so two workers do not double-reply
- A 20 second sweep on due work and on stale leases, plus SIGTERM that releases leases

The worker never trusts a client payload. It re-reads stored state and decides from that.

## Auth and abuse (what we kept)

Kept: 60 second resend, five wrong guesses then lock that code, IP-level verify-failure ceiling.

Dropped: daily cap on codes per address. That refused returning members and looked like downtime.

Login code mail is the code, a blank line, "Expires in 10 minutes." No brand in the subject or from name. Envelope from stays on the authenticated domain.

## Funnel metric (two calendars on purpose)

Staff stats use a local-day bucket (Asia/Karachi) because that is how the old Discord report was read.

The daily accept cap uses UTC. Those two clocks are never merged. Mixing them made "we hit the cap" disagree with the chart.

Rollups are ten-shard daily docs written in the same transaction as the event. Firestore has no GROUP BY. Discord "joins" become platform signups.

## Cutover

Phase 1: one brand, one real ticket end to end, then keep Discord read-only.

Phase 2: second brand is a config row, not a fork.

Rollback: leave Discord live until phase 1 has a completed ticket and the vision path accepts a real screenshot URL. Preview deploys stay behind auth. Service account is a host secret, not a committed file.

## What I would not do again

I would not allocate the public ticket number on the create path. Two creates in flight mint the same number. The brain allocates the number after the ticket exists. The sidebar shows a creating row until `#ticket-NNNN` lands.

I would not put unread counts on a field members can write. v1 has no unread badges. If a preview lands later, that field is added on purpose, not copied from the old portal because it was there.
