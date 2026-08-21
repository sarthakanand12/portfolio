---
title: 'LLM eval & self-optimisation harness'
org: Convin
period: '2026'
status: active
stack:
  - Python
  - asyncio
  - DSPy
  - GEPA / MIPROv2
  - LLM-as-judge
  - tiktoken
problem: >-
  One aggregate score tells you nothing about which failure mode regressed — and
  an optimiser pointed at that score will happily delete a safety rule it cannot
  see.
approach: >-
  An end-to-end evaluation harness replicating a production Next-Best-Action
  chatbot: persona-driven multi-turn simulation, a RAG-integrated action loop,
  and an LLM-as-judge scoring transcripts against per-case weighted rubrics.
  The weighted score is decomposed into a per-criterion deduction ledger, so
  defects rank by recoverable points rather than by case.
result: >-
  Agent pass rate 11% → 63% (avg score 0.187 → 0.550) across 6 prompt revisions
  on a 27-case bank, and 20% → 50% on a second bank with retrieval held
  constant. Earlier fixes in the same loop took max_turns terminations 10/10 →
  0/10 (avg turns 21.0 → 8.2) and retrieval coverage 5/10 → 9/10.
featured: true
order: 1
repo: null
writeup: null
papers:
  - judging-llm-as-a-judge-with-mt-bench-and-chatbot-arena
  - meta-harness-end-to-end-optimization-of-model-harnesses
  - skillopt-executive-strategy-for-self-evolving-agent-skills
  - agentic-harness-engineering
  - dive-into-claude-code
  - llms-get-lost-in-multi-turn-conversation
  - ares-automated-evaluation-framework-for-rag-systems
  - a-practitioner-s-guide-to-multi-turn-agentic-reinforcement-learning
resultIsPlaceholder: false
---

## Why this one matters

The measured lift is the least interesting result. The interesting one is a
failure mode found *before* it did damage.

## The reward-misalignment finding

Every signal the DSPy self-optimisation loop receives — GEPA's per-criterion
miss feedback, MIPROv2's bare scalar — derives from one fixed, human-authored
criteria set. That set directly probes none of the hand-hardened
anti-hallucination and closure rules. An optimiser that accepts any
non-regressing rewrite over a 10-case bank could strip those rules while the
metric held steady.

Three facts compose badly:

1. `weighted_score = Σ(criterion_score × weight)` is defined only over a
   criteria set authored by hand, per case. Nothing in the harness proposes a
   criterion.
2. The optimiser's whole view of the world arrives through that set.
3. The accept/reject gate is "final ≥ baseline" on the same 10 cases.

So a rewrite that deletes a rule and still passes those ten cases is scored as
a win. The metric cannot distinguish "the guarantee is intact" from "these ten
cases happened to pass anyway."

The honest framing is not "zero gradient" — the rules *did* move the aggregate,
indirectly. It is **overfitting to a 10-case acceptance test**: the optimiser is
free to find the minimal rewrite that keeps those ten green, and the safety
margin the rule was written for is not part of what it is asked to preserve.

I halted the loop before it ran live and specified the fix: evaluation criteria
that co-evolve with the artefact being optimised, anchored to a cross-model gold
standard so the rubric cannot drift to certify whatever the agent already does.

[Meta-Harness](/research/?paper=meta-harness-end-to-end-optimization-of-model-harnesses)
argues this shape in the abstract. This was hitting it concretely, on a
production agent.

## Inference economics

Separately, `tiktoken` profiling of a live production call found **61% of its
11.8K input tokens were cacheable static context**. Routing per-role
`prompt_cache_key`s gives a ~30% *projected* input-cost reduction at list
pricing — projected, not saved; it is one call measured with a `cl100k_base`
proxy.

## What is still weak

Worth saying out loud rather than having it extracted: the current knowledge
base has never been scored on the full bank, so I know my last validated
full-bank number better than my current one. The judge is uncalibrated — MAE
against the gold fixture was never established. The ±0.05 noise floor rests on
a single pair of runs.
