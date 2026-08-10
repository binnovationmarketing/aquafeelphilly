# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

Aquafeel VIP Proposal — an interactive sales proposal platform for a water
purification product in the Philadelphia market. React 18 + TypeScript on Vite,
Tailwind for styling, Supabase for auth and data, deployed on Vercel.

```bash
npm run dev          # vite dev server
npm run build        # tsc && vite build
npm test             # vitest run
npm run lint         # eslint
npm run type-check   # tsc --noEmit
npm run format       # prettier --write
```

Entry points: `index.tsx` → `App.tsx` → `routes.tsx`. Supabase client and
helpers live in `lib/`, shared state in `contexts/`, SQL and edge functions in
`supabase/`.

Before calling a change done: `npm run type-check && npm run lint && npm test`.

<!-- agency-agents:start -->

## The Agency — mandatory specialist routing

Every non-trivial task goes through the agency before it goes through you.
The catalog is the 270 specialist subagents in `agents/` under this config
directory — index at `agency/manifest.tsv`, routing playbook in the `agency`
skill.

**Before starting work, classify the request and name the specialist(s) that own
it.** State the pick in one line, then do the work as that specialist — either by
delegating with the `Agent` tool (`subagent_type` = the agent's slug) or by
reading the agent file and adopting its rules directly.

```
Agency → <division>/<agent-slug> — <one-line reason>
```

Routing rules:

1. **Look before you guess.** Find the owner by grepping the manifest —
   `grep -i '<topic>' .claude/agency/manifest.tsv` in a project that vendors the
   catalog, `~/.claude/agency/manifest.tsv` otherwise. Never invent agent names.
2. **Delegate when the work is separable** (a self-contained audit, migration,
   research sweep, or build). Adopt the agent's persona inline when the work is
   small or heavily interleaved with the current thread.
3. **Chain, don't stop at one.** Shipping work pairs a builder with a checker:
   anything touching auth, payments, RLS, or customer data also passes
   `security-architect`; anything user-facing also passes `code-reviewer` and
   `test-automation-engineer` before it is called done.
4. **Multi-phase work uses the playbooks** in `agency/strategy/` — phases 0-6
   and the scenario runbooks — instead of an ad-hoc plan.
5. **No owner in the catalog?** Say so explicitly and proceed as generalist.
   Silence is not an allowed outcome.

The routing line is not decoration: it is the record of which specialist's
standards the change was held to.

<!-- agency-agents:end -->

This project's most common routes: `frontend-developer` and `ui-designer` for
the proposal UI, `backend-architect` and `database-optimizer` for Supabase
schema and RLS, `security-architect` for anything touching sessions, invites or
client data, `payments-billing-engineer` for the financing calculator, and
`seo-specialist` / `content-creator` for the public landing page.

See `docs/AGENCY.md` for installing the catalog into other projects.
