---
title: 'Text-to-SQL agent over enterprise databases'
org: Convin
period: '2026'
status: production
stack:
  - Python
  - Knowledge graph
  - Vector search
  - Model routing (1.7B / 32B)
  - Speculative decoding
problem: >-
  Analysts need answers that span eight databases; a single-shot text-to-SQL
  call cannot resolve cross-database foreign keys, and putting ~1600 columns in
  a prompt is neither affordable nor accurate.
approach: >-
  A multi-hop agent — intent classification, query decomposition, schema
  discovery, value resolution, supervisor gate, SQL planning. A knowledge-graph
  module maps the full ERD into one connected graph; vector search over column
  descriptions plus a shortest-path graph walk trims LLM context and resolves
  cross-database keys. A 1.7B model serves narrow hops against a 32B reasoning
  supervisor, with speculative and graph decoding for latency.
result: >-
  85% request accuracy at ~10 s latency over 8 databases, 45 tables and ~1600
  columns. Read-only by design with a per-user-group encryption policy; drift
  monitoring diffs the knowledge graph against live catalog metadata.
featured: true
order: 2
repo: null
writeup: null
papers:
  - next-generation-database-interfaces-a-survey-of-llm-based-text-to-sql
  - dcg-sql-enhancing-in-context-learning-with-deep-contextual-schema-link-graph
  - sql-palm-improved-llm-adaptation-for-text-to-sql
  - h-star-llm-driven-hybrid-sql-text-adaptive-reasoning-on-tables
  - weaver-interweaving-sql-and-llm-for-table-reasoning
  - blendsql-a-scalable-dialect-for-unifying-hybrid-question-answering
  - eagle-3-scaling-up-inference-acceleration-via-training-time-test
  - suffixdecoding-extreme-speculative-decoding-for-agentic-applications
  - dopd-dual-on-policy-distillation
resultIsPlaceholder: false
---

## The schema problem is a retrieval problem

Eight databases, 45 tables, roughly 1600 columns. The naive approach — paste the
schema, ask for SQL — fails twice over: the context cost is prohibitive, and the
model has no way to know that a customer ID in one database is the same entity
as a subscriber ID in another.

Treating the ERD as a graph fixes both. Vector search over column descriptions
finds candidate entry points; a shortest-path walk between them returns the join
route, including the foreign keys that cross a database boundary. What reaches
the LLM is a subgraph, not a catalog.

## Why two model sizes

Most hops in a decomposed query are narrow: classify an intent, resolve a
literal to a canonical value, pick a column. Those do not need a frontier model.
A 1.7B model handles them and a 32B reasoning model acts as supervisor and SQL
planner, gating what the small model produces. Speculative and graph decoding
cover the latency budget.

## Operational constraints that shaped the design

Read-only by construction — the agent has no write path, which removes a whole
class of failure from the threat model. Per-user-group encryption policy governs
what any given caller can see. Business rules and per-schema query conventions
live in persistent cross-session memory rather than the prompt, so they survive
a context reset. Drift monitoring diffs the knowledge graph against live catalog
metadata, because a schema migration that silently invalidates a join path is
the most likely way this breaks.

The audit trail is retained deliberately: it is training data for on-policy
distillation and RL, which is the path to making the small model carry more of
the load.
