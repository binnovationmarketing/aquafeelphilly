# The Agency — specialist catalog

A 270-specialist catalog from [msitarzewski/agency-agents][upstream] (MIT),
vendored into this repository and wired so that work is _routed_ through it
rather than merely having it installed. This repo loads the 81 of them that its
profile selects; the rest stay in the catalog, one command away.

[upstream]: https://github.com/msitarzewski/agency-agents

## What is installed

| Path                             | What it is                                                                                            |
| -------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `.claude/agents/*.md`            | The agents Claude Code loads — the active profile’s set, flat, one file per agent, named by slug.     |
| `.claude/skills/agency/SKILL.md` | The routing skill — how a task gets assigned to a specialist and which reviewers must follow.         |
| `.claude/agency/POLICY.md`       | The mandatory routing rule, mirrored into `CLAUDE.md` between `<!-- agency-agents:start -->` markers. |
| `.claude/agency/manifest.tsv`    | `slug <TAB> division <TAB> human name` — the index to grep.                                           |
| `.claude/agency/strategy/`       | Upstream playbooks (phases 0-6), scenario runbooks, handoff templates.                                |
| `.claude/agency/profiles/*.txt`  | Named subsets of the catalog.                                                                         |
| `.claude/agency/inactive/`       | Agents parked by a profile. Kept in git, not deleted.                                                 |
| `.claude/agency/UPSTREAM`        | The pinned upstream commit and sync timestamp.                                                        |
| `scripts/agency/agency.sh`       | Sync, install, profile, list, doctor. Bash + awk, no dependencies.                                    |
| `scripts/agency/bootstrap.sh`    | One-command install on a machine or project, no clone needed.                                         |
| `scripts/agency/make-matriz.sh`  | Builds and publishes the standalone matriz repository.                                                |

Because the agents are committed, every session in this repository — local,
web, or CI — loads them with no install step and no network.

## Making it the matrix — all projects

The catalog is per-project by default. To apply it to **every project on a
machine**, install it into the user-level Claude config:

```bash
./scripts/agency/agency.sh install --global
```

That copies the agents to `~/.claude/agents/`, the routing skill to
`~/.claude/skills/agency/`, and inserts the policy block into `~/.claude/CLAUDE.md`
(existing content is preserved — the block sits between the `agency-agents`
markers and is replaced in place on re-runs). User-level config applies to every
project Claude Code opens, so from then on every project routes through the
agency.

To seed one specific other project instead:

```bash
./scripts/agency/agency.sh install --project ~/code/other-project
```

From a machine that has no clone at all, `bootstrap.sh` does the same in one
command:

```bash
curl -fsSL https://raw.githubusercontent.com/binnovationmarketing/aquafeelphilly/main/scripts/agency/bootstrap.sh | bash
```

It takes `--project .` for the current directory only and `--profile <name>` for
a narrowed set, and honours `AGENCY_SOURCE` / `AGENCY_REF` to install from
somewhere else — which is how the matriz below becomes the source of truth.

All of these are idempotent — re-run after a `sync` to push updates out.

> Note: on ephemeral environments (Claude Code on the web, CI containers)
> `~/.claude` is discarded when the container is reclaimed, so `--global` has to
> be re-run per session there. Committed project-level agents are what actually
> persists — which is why this repo vendors them.

## The matriz repository

Installing from an application repo does not scale — the catalog would have a
different owner in every project. `make-matriz.sh` builds a standalone central
repository that every project installs from instead:

```bash
gh repo create binnovationmarketing/agency-matriz --public   # empty, no README
./scripts/agency/make-matriz.sh --push git@github.com:binnovationmarketing/agency-matriz.git
```

It exports the full 270-agent catalog (regardless of the profile active here),
the routing skill, the policy, the profiles, the strategy playbooks and both
scripts, then rewrites the generated `bootstrap.sh` so the matriz points at
itself. After that, every install anywhere comes from the matriz:

```bash
curl -fsSL https://raw.githubusercontent.com/binnovationmarketing/agency-matriz/main/scripts/agency/bootstrap.sh | bash
```

Re-run `make-matriz.sh --push ...` after a `sync` to publish catalog updates.
Build without publishing by omitting `--push`.

## Profiles

The full catalog costs roughly 70 KB (~18k tokens) of context in every session,
because Claude Code loads every agent's description. Profiles trade reach for
that overhead:

```bash
./scripts/agency/agency.sh profile list          # what is available
./scripts/agency/agency.sh profile aquafeel      # 81 — what this repo runs on
./scripts/agency/agency.sh profile web-product   # 70 — React/TS/Supabase apps
./scripts/agency/agency.sh profile growth        # 63 — marketing/sales/paid media
./scripts/agency/agency.sh profile full          # all 270
```

This repository runs the `aquafeel` profile: the `web-product` engineering set
plus the go-to-market specialists that own the landing page, the proposal flow
and the funnel.

Profiles compose — a profile file may start with `@include <other-profile>` and
list only what it adds on top, which is how `aquafeel` is built. Includes nest
and cycles are ignored. Add your own by dropping a `<name>.txt` of slugs into
`.claude/agency/profiles/`.

Deactivated agents move to `.claude/agency/inactive/` — nothing is lost, and the
choice is committed so the whole team loads the same set. `agency.sh sync`
re-applies the active profile after pulling a new catalog.

## Updating the catalog

```bash
./scripts/agency/agency.sh sync             # latest upstream main
./scripts/agency/agency.sh sync --ref v2.0  # a specific tag or branch
```

`sync` re-vendors every agent, rewrites `manifest.tsv`, re-pins the commit in
`.claude/agency/UPSTREAM`, and re-applies whatever profile was active. Review
the diff before committing — it is upstream content.

## Verifying

```bash
./scripts/agency/agency.sh doctor
./scripts/agency/agency.sh list security     # or any division
```

`doctor` checks the manifest against the files on disk, validates that every
active agent has usable `name` + `description` frontmatter, and reports whether
a global install exists.

## Local changes vs upstream

Agent files are vendored verbatim from upstream with one deliberate edit: the
frontmatter `name:` is rewritten to the kebab-case slug (upstream ships display
names like `AI Engineer`) so `subagent_type` values are predictable and stable.
The body of every agent is untouched.

Editing an agent in `.claude/agents/` works, but `sync` overwrites it. Fork
upstream and point `UPSTREAM_REPO` in `scripts/agency/agency.sh` at your fork if
you need durable customizations.
