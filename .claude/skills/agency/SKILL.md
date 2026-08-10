---
name: agency
description: 'Route any substantial task through the 270-specialist Agency catalog before doing it — pick the owning specialist, adopt or delegate to it, and chain the required reviewers. Use at the START of any build, fix, audit, migration, design, content, campaign, research, or planning task, and whenever asked which agent/specialist should handle something, to list available agents, or to run a multi-phase project through the strategy playbooks.'
---

# The Agency — specialist routing

270 specialist subagents live in `.claude/agents/`, indexed by
`.claude/agency/manifest.tsv` (`slug <TAB> division <TAB> human name`).
This skill is how work gets assigned to them. Installing the catalog is not the
point — routing through it is.

## The loop

**1. Classify.** One sentence: what kind of work is this, and what does "done"
look like? Skip the catalog only for trivia — a one-line typo fix, a question
about a file, a command lookup.

**2. Find the owner.** Search the index, never guess a name:

```bash
grep -i 'supabase\|rls\|postgres' .claude/agency/manifest.tsv
awk -F'\t' '$2=="security"{print $1}' .claude/agency/manifest.tsv   # by division
./scripts/agency/agency.sh list engineering                         # with status
```

**3. Announce the pick** on one line, so the standards the work is held to are
on the record:

```
Agency → engineering/backend-architect — Supabase RLS + session locking
```

**4. Work as that specialist.** Two ways, pick by shape of the task:

| Delegate with `Agent` (`subagent_type: <slug>`) | Adopt inline (`Read` the agent file, follow it) |
| ----------------------------------------------- | ----------------------------------------------- |
| Separable, self-contained unit of work          | Small, or interleaved with the current thread   |
| Wide search, audit, or research sweep           | You already hold the context it needs           |
| You want its output as a report                 | Its rules should shape code you write now       |

Adopting inline means reading `.claude/agents/<slug>.md` and actually applying
its critical rules, deliverables, and success metrics — not just borrowing the
name.

**5. Chain the checkers.** A builder alone never closes a task:

| The change touches                          | Also route through                                          |
| ------------------------------------------- | ----------------------------------------------------------- |
| auth, RLS, tokens, customer or payment data | `security-architect`, `secrets-credential-hygiene-engineer` |
| any code that ships                         | `code-reviewer`                                             |
| user-visible behavior                       | `test-automation-engineer`, `accessibility-auditor`         |
| UI surface or brand                         | `ui-designer`, `brand-guardian`                             |
| schema or query performance                 | `database-optimizer`, `database-reliability-engineer`       |
| deploy, CI, or infra                        | `devops-automator`, `sre-site-reliability-engineer`         |
| copy, campaigns, funnels                    | the matching `marketing/` or `paid-media/` specialist       |

**6. Report** which specialists ran and what each concluded.

## Divisions

`engineering` 58 · `specialized` 57 · `marketing` 36 · `game-development` 21 ·
`gis` 13 · `security` 12 · `design` 10 · `testing` 9 · `sales` 9 ·
`project-management` 7 · `paid-media` 7 · `support` 6 · `spatial-computing` 6 ·
`academic` 6 · `product` 5 · `finance` 5 · `healthcare` 3

## Multi-phase work

Anything larger than a single change runs on the vendored playbooks in
`.claude/agency/strategy/` instead of an improvised plan:

- `playbooks/phase-0-discovery.md` … `phase-6-operate.md` — the standard arc
- `runbooks/scenario-startup-mvp.md`, `scenario-marketing-campaign.md`,
  `scenario-enterprise-feature.md`, `scenario-incident-response.md`
- `coordination/handoff-templates.md` — how one specialist hands off to the next

Read the phase file before starting the phase, and use the handoff template
between specialists so context survives the transfer.

## When nothing fits

Say so out loud — "no owner in the catalog for X, proceeding as generalist" —
and continue. An unroutable task is a normal outcome; a silent one is not.

## Maintenance

```bash
./scripts/agency/agency.sh doctor            # verify the install
./scripts/agency/agency.sh sync              # pull the latest catalog upstream
./scripts/agency/agency.sh profile list      # narrow the loaded set
./scripts/agency/agency.sh install --global  # apply to every project on this machine
```
