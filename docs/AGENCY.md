# The Agency — specialist catalog

270 specialist subagents from [msitarzewski/agency-agents][upstream] (MIT),
vendored into this repository and wired so that work is _routed_ through them
rather than merely having them installed.

[upstream]: https://github.com/msitarzewski/agency-agents

## What is installed

| Path                             | What it is                                                                                            |
| -------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `.claude/agents/*.md`            | The 270 agents Claude Code loads. Flat, one file per agent, named by slug.                            |
| `.claude/skills/agency/SKILL.md` | The routing skill — how a task gets assigned to a specialist and which reviewers must follow.         |
| `.claude/agency/POLICY.md`       | The mandatory routing rule, mirrored into `CLAUDE.md` between `<!-- agency-agents:start -->` markers. |
| `.claude/agency/manifest.tsv`    | `slug <TAB> division <TAB> human name` — the index to grep.                                           |
| `.claude/agency/strategy/`       | Upstream playbooks (phases 0-6), scenario runbooks, handoff templates.                                |
| `.claude/agency/profiles/*.txt`  | Named subsets of the catalog.                                                                         |
| `.claude/agency/inactive/`       | Agents parked by a profile. Kept in git, not deleted.                                                 |
| `.claude/agency/UPSTREAM`        | The pinned upstream commit and sync timestamp.                                                        |
| `scripts/agency/agency.sh`       | Sync, install, profile, list, doctor. Bash + awk, no dependencies.                                    |

Because the agents are committed, every session in this repository — local,
web, or CI — loads them with no install step and no network.

## Making it the matrix — all projects

The catalog is per-project by default. To apply it to **every project on a
machine**, install it into the user-level Claude config:

```bash
./scripts/agency/agency.sh install --global
```

From a machine that does not have this repo cloned, the same install is one
command:

```bash
curl -fsSL https://raw.githubusercontent.com/binnovationmarketing/aquafeelphilly/main/scripts/agency/bootstrap.sh | bash
```

`bootstrap.sh` also takes `--project .` to install into the current directory
only, and `--profile <name>` to install a narrowed set. Point it at a different
source with `AGENCY_SOURCE` / `AGENCY_REF`.

That copies the 270 agents to `~/.claude/agents/`, the routing skill to
`~/.claude/skills/agency/`, and inserts the policy block into `~/.claude/CLAUDE.md`
(existing content is preserved — the block sits between the `agency-agents`
markers and is replaced in place on re-runs). User-level config applies to every
project Claude Code opens, so from then on every project routes through the
agency.

To seed one specific other project instead:

```bash
./scripts/agency/agency.sh install --project ~/code/other-project
```

Both commands are idempotent — re-run after a `sync` to push updates out.

> Note: on ephemeral environments (Claude Code on the web, CI containers)
> `~/.claude` is discarded when the container is reclaimed, so `--global` has to
> be re-run per session there. Committed project-level agents are what actually
> persists — which is why this repo vendors them.

## Profiles

All 270 agents are active by default. Their frontmatter descriptions cost
roughly 70 KB (~18k tokens) of context in every session. If that overhead
matters more than reach, narrow the loaded set:

```bash
./scripts/agency/agency.sh profile list          # what is available
./scripts/agency/agency.sh profile web-product   # 70 agents — this app's stack
./scripts/agency/agency.sh profile growth        # 63 agents — marketing/sales/paid media
./scripts/agency/agency.sh profile full          # back to all 270
```

Deactivated agents move to `.claude/agency/inactive/` — nothing is lost, and the
choice is committed so the whole team loads the same set. Add your own profile
by dropping a `<name>.txt` of slugs into `.claude/agency/profiles/`.

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
