# Phase 3 Cutover — Tuning

Load-bearing reference for Phase 3 sessions. Every subsequent Phase 3 session reads this first.

Phase 2 tuning.md structure carried forward; numbering starts fresh at §1.

---

## 1. Phase 3 mission

Close out the scaffolding installed during Phases 1–2 by performing destructive-but-safe cutovers:

1. **Flip Health gating** from shadow-mode to real-mode (X05) — gating policy TBD in P3.M01
2. **Remove the derivation shim** that let partners live without explicit `engines` arrays
3. **Delete `relay-block-taxonomy.ts`** now that the block-registry path is fully adopted
4. **Simplify orchestrator permissive fallbacks** — the "partner has no engines → show everything" branches become unreachable after the shim removal
5. **Ship X04 Drafting AI** (Narrow scope only — admin seed-drafting tool, no runtime AI)
6. **Close the observation window** via evidence-based Model B closure (already satisfied at Phase 2 close)

Phase 3 closes when all the above ship cleanly and production code surface is smaller than Phase 2 close.

---

## 2. Baseline context

tsc baseline = **100** (updated 2026-04-21 per Phase 0 recon — Phase 3/4 work reduced the count from 276 to 100; see `docs/relay-mission/PHASE_0_RECON.md`).

The 401 figure was a stable but incorrect measurement: `scripts/extract-block-registry-data.js` declared `ServerSubVerticalData` as `{ id, blocks }` in its output template but emitted vertical-source literals carrying `{ id, name, industryId, blocks }`. 125 identical TS2353 errors resulted. Baseline investigation (see `docs/baseline-investigation/outcome.md`) widened the interface and regenerated the file; baseline fell to 276. Subsequent Phase 3/4 work brought it to 100.

Every session measures against 100 with:
```
rm -rf .next && rm -f tsconfig.tsbuildinfo && npx tsc --noEmit 2>&1 | grep -c "error TS"
```

The remaining 100 errors are distributed cleanup concerns. Bringing 100 to zero is **not a mission prerequisite** — it's separate work.

---

## 3. Non-negotiable carry-forwards from Phase 2

These disciplines apply to every Phase 3 commit and session:

### 3.1 Speculative-From footers

Every commit that implements a tuning-decision choice carries a `Speculative-From:` footer pointing at this file or a Phase 3 decision doc. Retrospectives evaluate each footer.

### 3.2 Confirm-by-test retrospectives

Session retrospectives list each speculative item with a test reference confirming (or revising) it. "Confirmed by absence of failure" does not count.

### 3.3 Q16 lexicon-stress rule

If any Phase 3 work touches the classifier or keywords, lexicon-stress tests re-run. Failure categorization rule: **≤ 2 thematic categories proceed; ≥ 3 stops**. No post-hoc category invention. Rule stable across 4 Phase 2 engine sessions.

### 3.4 Adjustment 3 — service-exception cap at 5

Currently 4/5 consumed. Phase 3 may consume the 5th slot only if genuinely warranted (engagement-primary partner with zero post-interaction state). More than 5 triggers Q21 architectural review of the auto-enable rule.

### 3.5 Adjustment 4 — per-block dual-tag justification

Every dual-tagged block carries a single-line source comment explaining the genuine dual-engine use. Zero triple-tags tolerated.

### 3.6 Adjustment 5 — no new session-state fields

Preserved across all 4 Phase 2 engine sessions. Any Phase 3 milestone proposing a new session field needs explicit escalation. X04 Narrow scope respects this; X04 Medium/Broad would not (another reason Narrow won).

### 3.7 Adjustment 6 — simpler ≠ lighter

Phase 3 milestones are structurally smaller than Phase 2 engine sessions but still ship full retrospectives, confirm-by-test, and rollback strategies. Destructive milestones especially.

---

## 4. Phase 3-specific rules

### 4.1 Evidence precedes removal

No code is deleted until a written record proves zero live callers. Every destructive milestone commits an "audit" artifact before the "removal" commit.

### 4.2 No production migration needed

Confirmed: there are no production partners requiring migration. Phase 3's risk model is **architectural cleanup**, not **production cutover**. Removes:
- Partner-migration milestone from the playbook's original P3.M02
- 48-hour settling windows between destructive milestones
- Partner-state verification checkpoints

### 4.3 Feature-flag gating for X05

X05 Health gating flips via a runtime constant, not a schema migration. Ships two-step:
- Step 1: land the feature-flag code, default off
- Step 2: flip default to on in a separate atomic PR

Rollback = flip flag back. No state migration.

### 4.4 Service-break fallback rule

Per Q10 audit, uncovered service-break intents route to `contact` shared block with error context, not to a permissive catalog fallback. Single orchestrator rule; no per-intent service blocks authored. Covered in P3.M05.

### 4.5 Audit-mismatch halt rule

If a destructive milestone's pre-session expected caller count differs
materially from actual on the first grep, pause before any removal commit.
Write an extended audit covering each caller's data path, the value the
removed code produces today, and the empty-behavior downstream. Surface to
the user with explicit options (proceed / extend audit / defer). Removals
that skip this step after a mismatch are drift-prone — Session 1's P3.M03
(1 expected, 4 actual) established the pattern.

### 4.6 No observation-window gating

Observation closed by Model B evidence (see `observation-closure.md`). No time-based checkpoints between Phase 3 milestones.

---

## 5. Pre-flight decisions (this session)

Referenced from the four decision documents:

- **Q10 service audit** — 16 service-tagged blocks (not 4 as Phase 2 summary suggests). Per-engine gaps are 3–6 blocks total; below escalation threshold. Recommendation: contact-fallback rule instead of per-intent blocks. See `q10-service-audit.md`.
- **Observation closure** — Model B (evidence-based). All 7 signals satisfied today. Q2 and Q11 transition to resolved. See `observation-closure.md`.
- **X04 scope** — Narrow (admin seed-drafting tool only). Runtime-AI excluded; partner-facing UI excluded. Evaluation criteria defined. See `x04-scope-decision.md`.
- **X05 timing** — Before X04. Feature-flag rollout. See `x05-timing-decision.md`.

---

## 6. Open questions for Phase 3

- **Q10 completion** — tracked in Q10 audit doc. Resolution lands as part of P3.M05 (orchestrator contact-fallback rule).
- **Q13 Playwright smoke** — deferred through Phase 2; becomes relevant again once X05 gating ships (UI behavior changes under gating). Possible P3.M06 final-validation inclusion.
- **Q15 service-exception cap** — 4/5 consumed. Watch for 5th consumption during any Phase 3 work; revisit cap at Phase 3 close.
- **Q17 dual-tag drift** — decelerated through Phase 2 (0→9→4→1). Check at Phase 3 close; close if stable.

---

## 7. Phase 3 session structure

Per-session template (adapted from Phase 2 per-engine sessions):

1. **State assessment** — tsc baseline check, test suite green, prerequisite artifacts present
2. **Execute milestones** in order per `plan.md`
3. **One commit per milestone boundary**, format `[cutover <milestone>] <summary>`
4. **Per-milestone rollback documented** (especially for destructive milestones)
5. **Session retrospective** — confirm-by-test table + any tuning revisions + next-session gate decision

---

## 8. Baseline drift discipline

`tsc = 100` is the anchor. Every milestone leaves tsc at ≤ 100 (never higher). Cleanup milestones may bring it lower; that's welcome but not required.

If a milestone introduces drift (> 100), stop at commit boundary, escalate to a dedicated cleanup session. Never amend or force-push to "fix" drift silently.
