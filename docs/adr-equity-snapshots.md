---
layout: docs
title: ADR, one writer for equity snapshots
---

# ADR: one writer for equity snapshots

Status: accepted  
Author: Ali Hamza Kamboh  
Role: engineer who owned the call

I write this down before the agent implements. The PR has to match it.

## Decision

Do not let hook-worker and metrics-worker both write equity snapshots.

## Why

Two writers looked faster. In practice we got duplicate snapshots, wrong daily drawdown, and false pauses. The business number (accounts incorrectly paused) moved the wrong way.

## Call

One writer owns snapshots. The other emits events only. Replay from the event log if we need history. Six months of replay stays under 30 seconds.

## Revisit if

Ingest lag exceeds one minute, or replay exceeds 30 seconds on the live book.
