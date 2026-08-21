---
title: 'Reverse-engineering a black-box ranking formula'
org: Amex Campus Challenge
period: '2026'
status: archived
repo: https://github.com/falconboi12/amex-inverse-optimization
stack:
  - Python
  - Inverse optimization
  - Coordinate descent
  - Clustering
problem: >-
  Rank 500K cardmembers by a hidden profitability formula, with no ground-truth
  labels, 23 masked features, and a leaderboard that returns only top-20% set
  overlap — ten queries total.
approach: >-
  Framed it as inverse optimization rather than prediction: multi-start
  coordinate descent fitting a 14-parameter linear P&L equation against observed
  leaderboard scores, then clustering 31 near-perfect fits into robust solution
  families. Used set-arithmetic score bounds to rule out an infeasible
  hypothesis before spending a submission on it.
result: >-
  0.795 top-20% overlap against a 0.90 target, inside the ten-query budget. A
  self-directed follow-up rebuilt the scoring oracle offline and found the
  original spend-imputation heuristic was 5–8× miscalibrated (missingness
  classifiers up to 0.998 AUC, so the data was not missing at random) and that 9
  of 14 formula parameters were fundamentally unconstrained by the data.
featured: false
order: 20
writeup: null
papers: []
resultIsPlaceholder: false
---

## Why inverse optimization, not prediction

There are no labels. There is a black box that, ten times, will tell you how
much your top 20% overlaps with its top 20%. Fitting a model to predict
profitability is impossible; fitting the *formula* that produces the ranking is
not, because each query is a constraint on the parameter space.

Multi-start coordinate descent over a 14-parameter linear P&L equation produced
31 near-perfect fits. Clustering them into families is the important step —
a single best fit is overfit to the queries you happened to spend; a family that
several starts agree on is a hypothesis about the formula's shape.

## The negative result that saved a submission

A saturation curve on the interest-rate axis suggested one hypothesis about the
formula. Set-arithmetic bounds on what the score *could* be, given the overlap
already observed, showed it infeasible. Ruling it out on paper cost nothing;
testing it would have cost one of ten queries.

## The follow-up matters more than the score

After the competition I rebuilt the scoring oracle offline to stress-test my own
pipeline, and found two things that change how I read the 0.795:

- The spend-imputation heuristic I relied on was **5–8× miscalibrated**.
  Missingness classifiers reached up to 0.998 AUC — the values were emphatically
  not missing at random, so imputing them as if they were injected structured
  error.
- **9 of the 14 parameters were unconstrained** by the available data. Ten
  queries cannot pin down fourteen parameters; the fits that agreed were
  agreeing on the five that mattered and free-floating on the rest.

Those are offline findings against a rebuilt oracle, not leaderboard results.
The distinction is worth keeping straight: one is measured against the real
scorer, the other against my reconstruction of it.
