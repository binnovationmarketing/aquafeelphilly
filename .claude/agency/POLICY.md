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

