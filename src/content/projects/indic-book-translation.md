---
title: 'Indic book translation — multi-stage correction pipeline'
org: AICTE tender
period: '2026'
status: shipped
stack:
  - Gemma
  - PPO
  - RLHF
  - DSPy
  - Node-level caching
problem: >-
  Textbook translation into regional Indian languages degrades badly on
  off-the-shelf models — format, grammar and terminology drift apart across a
  page, and worse on low-resource languages.
approach: >-
  A harness around Gemma models enforcing format, grammar and terminology
  consistency across local, page and chapter context. An error-correction module
  trained with PPO over both outcome and process reward so correction converges
  in minimum steps; corrections are applied algorithmically to bound
  hallucination. Human evaluation feeds an RLHF loop and self-evolving
  correction rules, with DSPy for prompt versioning.
result: >-
  ~10 s per page with parallel execution across languages and node-level
  caching. Secured a Ministry of Education / AICTE tender to translate NCERT
  textbooks.
featured: true
order: 3
repo: null
writeup: null
papers:
  - does-transliteration-help-multilingual-language-modeling
  - a-comparison-of-different-machine-transliteration-models
  - m3-embedding-bge-m3-multi-linguality-multi-functionality-multi-granularity
  - a-vision-researcher-s-guide-to-rl-ppo-grpo
  - dpo-direct-preference-optimization
  - neural-text-degeneration-with-unlikelihood-training
  - privileged-information-distillation-for-language-models
resultIsPlaceholder: false
---

## Why correction is a separate model

A single translation pass has to hold three things at once: local fluency,
page-level format, and chapter-level terminology consistency. Asking one model
to do all three means every improvement on one trades against the others.

Splitting correction out changes the problem. The translator produces a
candidate; the corrector is trained specifically to find and fix the
inconsistencies. Training it with PPO over *both* outcome and process reward
matters — outcome reward alone gets you a corrector that reaches a fixed point
eventually, and process reward is what makes it converge in a small number of
steps.

## Bounding hallucination

The corrector proposes; it does not rewrite. Corrections are applied
algorithmically against the source, which means a corrector that hallucinates a
"fix" produces a no-op rather than a fabricated sentence in a school textbook.
For this deployment that constraint is not negotiable.

## Transliteration as a front-end

Low-resource Indic languages arrive in mixed scripts. Script normalisation and
transliteration run ahead of the translation stage, which is why the reading
list here leans on transliteration and multilingual-representation work rather
than translation papers as such.
