---
title: 'Embedding-space engineering for IVR/human separation'
org: Convin
period: '2026'
status: active
stack:
  - mmBERT
  - Contrastive fine-tuning
  - Teacher distillation
  - Chunked classifier
problem: >-
  Telling an IVR/bot utterance from a human one is easy for a human and hard for
  an off-the-shelf embedding model — the two classes sit in overlapping regions
  of embedding space, across many languages and both native and Roman scripts.
approach: >-
  Treat it as a geometry problem rather than a classifier problem: measure how
  well embeddings separate the two classes (silhouette, Davies-Bouldin,
  Calinski-Harabasz, intra/inter-class cosine), then fine-tune contrastively to
  make "bot-ness" a tight region. A chunked classifier head runs over long
  transcripts, with a distilled teacher for the production path.
result: >-
  Benchmark harness covering multilingual and transliterated inputs, with
  FLORES and IVR-robustness metric suites. Headline separation and downstream
  detection numbers are still being consolidated.
featured: false
order: 10
repo: null
writeup: null
papers:
  - supervised-contrastive-learning-supcon
  - supcl-seq-supervised-contrastive-learning-for-sequence-representations
  - pooling-and-semantic-shift-challenges-in-long-text-embedding-and-retrieval
  - m3-embedding-bge-m3-multi-linguality-multi-functionality-multi-granularity
  - setfit-efficient-few-shot-learning-without-prompts
  - gliner-generalist-model-for-named-entity-recognition
  - does-transliteration-help-multilingual-language-modeling
resultIsPlaceholder: true
---

## Measuring before training

The instinct is to fine-tune first and check accuracy after. That hides the
interesting question, which is whether the embedding space has any usable
structure to begin with.

So the harness measures geometry directly — silhouette score, Davies-Bouldin,
Calinski-Harabasz, and intra- versus inter-class cosine similarity. High
intra-class similarity means the model has learned "bot-ness" as a tight region
rather than a scattered set of points that a classifier is papering over. Those
metrics tell you whether a contrastive objective has anything to grip.

## The multilingual/script axis

Utterances arrive in many languages, in native script and in Roman
transliteration of the same content. That means a data point has both a
`language` and a `script` field, and transliterated rows are marked as such —
because a model that separates the classes only in Roman script has not learned
what it appears to have learned.

## Status

The metric suites (FLORES, IVR-robustness) and the chunked-classifier engine
exist. Consolidated headline numbers do not yet — this card is deliberately
flagged rather than filled with a number I cannot defend.
