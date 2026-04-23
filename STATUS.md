# Schoolgle Improvement — STATUS

_Generated 2026-04-21 from a sweep of all live + recent Claude Code sessions in this repo and a structural audit of the codebase. This is a living doc — update at the end of each working session._

---

## TL;DR

- **"11 sessions running" was misleading.** Only **2 are alive today** (Trust Assessor + Lesson Studio). 4 more did real work in the last 10 days but are paused. The other ~5 are noise.
- **Two pieces are effectively shippable** (Estates Compliance passed 36/36 tests on Apr 12; Lesson Studio v2 handover written Apr 14). These are your fastest paths to revenue conversations.
- **One thing is actively blocked on you right now**: Lesson Studio session 8b204f8c is waiting for you to hard-refresh the browser and confirm a login error is gone (server was fixed at 07:54).
- **The gap you flagged is real**: CEPH SDP builder page exists in the codebase but has had **zero active dev sessions** in the last 2 weeks. Nobody is pushing it forward. Same for Pathfinder (stub only).

---

## Live + recent sessions (last 10 days)

| Session ID | Last touch | App | State | What it needs next |
|---|---|---|---|---|
| `254f3d00` | **today 08:16** | Trust Assessor | 🟢 alive | Finish 400/403 org-context fix; verify Playwright test pass; commit the 7 uncommitted route files |
| `8b204f8c` | **today 07:54** | Lesson Studio | 🟡 BLOCKED ON YOU | Hard refresh `localhost:3000`, confirm login error gone, reply in that session |
| `f1a25ae1` | Apr 14 | Lesson Studio v2 | ✅ done | Decide: is this the same as `8b204f8c`'s work or a parallel branch? Handover doc exists |
| `f57660de` | Apr 14 | Estates (sidebar UX) | 🟡 paused | Answer "should the duplicate 'Estates' label go?" — 30-second decision |
| `b3130333` | Apr 12 | Estates Compliance | ✅ done | Ship it. 36/36 functional tests pass. 4 non-blocking issues logged |
| `09c55ce8` | Apr 12 | Ofsted Readiness (Report Builder) | 🟡 paused | Wire Canvas.tsx + LookerCanvas.tsx to the new API response format (API itself is fixed) |

**The other ~5 sessions** in this directory are <1MB each, mostly Apr 9–10, and are abandoned spikes. Safe to ignore.

---

## App portfolio — Status board

| App | Code exists? | State | Revenue link | Recommendation |
|---|---|---|---|---|
| **Estates Management / Compliance** | ✅ extensive (12 sub-modules) | **DONE & TESTED** (36/36 Apr 12) | High — SBMs buy compliance | 🚀 **SHIP** — package + sell. Demo this first. |
| **Lesson Studio v2** | ✅ functional | **DONE** (handover Apr 14) | High — every teacher needs this | 🚀 **SHIP** — but reconcile vs. today's session first |
| **Trust Assessor** | ✅ functional (~120 commits) | 🟢 active debug today | High — MAT trusts pay £££ | 🏁 **FINISH this week** — auth fix + smoke test, then demo |
| **Ofsted Readiness** | ✅ functional + Report Builder | 🟡 paused mid-task Apr 12 | **HIGHEST** — Ofsted = panic-buy | 🏁 **FINISH next** — only Canvas wiring left in `09c55ce8` |
| **CEPH SDP builder** | ✅ page exists at `/sdp/` | ⚠️ NO ACTIVE WORK | High — paired with Ofsted | 🔍 **AUDIT** — open the page, see what's there, decide finish vs. scope |
| **Paymat data analysis** | ⚠️ partial (seeder + capture API) | 🟢 part of Trust Assessor work | Medium — feeds other apps | 🏁 **FINISH as part of Trust Assessor** — same session |
| **Pathfinder (PDF→3D)** | ⚠️ stub only (`pathfinder-prototype`) | ⚠️ NO ACTIVE WORK | Medium — separate product line | 🅿️ **PARK** — keep specs, no dev cycles until 4 above ship |

**Noise routes (NOT apps — features inside the platform):**
`/tasks/`, `/evidence/`, `/my-insights/`, `/my-toolbox/` — leave alone, don't treat as portfolio items.

---

## Revenue-first finish order (next 14 days)

If the goal is "money in", do them in this order:

1. **Today**: Hard-refresh Lesson Studio (unblock `8b204f8c`). Answer the Estates sidebar question (unblock `f57660de`). Both 5-minute moves.
2. **Today/tomorrow**: Finish Trust Assessor auth fix in `254f3d00`. Commit. Smoke-test end-to-end.
3. **This week**: Resume `09c55ce8` and wire the Ofsted Report Builder Canvas. Ship Ofsted Readiness as v1.
4. **This week**: Audit CEPH SDP page. If 70%+ done → finish in 2 days. If <50% → park.
5. **Next week**: Package Estates Compliance + Lesson Studio + Trust Assessor + Ofsted Readiness as **a bundle**. One demo, one price (£X/module or £4k full).
6. **Park**: Pathfinder. Revisit when above 4 are sold.

---

## Hygiene rules going forward

So we don't end up here again:

1. **One repo = one STATUS.md.** Update at the end of every working session. Never start a new session without skim-reading this.
2. **Name your sessions.** When you start a session, the first message should say "Working on: <App Name>". That makes future audits trivial.
3. **Commit before you stop.** 7 uncommitted route files right now means work could be lost. Always end a session with `git status` clean or a WIP commit.
4. **One in-flight item per app.** If you have 3 sessions open on Lesson Studio you'll fork the work. Pick one, kill the others.
5. **Daily 5-min triage.** Open this file, mark anything that moved, kill anything that's been paused >7 days without a reason.

---

## Open questions for David

1. Lesson Studio v2 (`f1a25ae1`, finished Apr 14) vs. today's Lesson Studio session (`8b204f8c`) — same work, or two branches? **Risk: duplicating effort.**
2. Estates Compliance is shippable today. Is there a customer / pilot school we can put it in front of this week?
3. CEPH SDP — do you want me to open the `/sdp/` page right now and assess what state it's in, or do you already know?
4. Trust Assessor uncommitted work (7 files) — want me to commit it on your behalf with a sensible message, or leave for you?
