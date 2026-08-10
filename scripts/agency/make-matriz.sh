#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# make-matriz.sh — build the standalone "matriz" repository from the catalog
# vendored here, so every project can install from one central source instead
# of from this application repo.
#
#   ./scripts/agency/make-matriz.sh                       # build in ../agency-matriz
#   ./scripts/agency/make-matriz.sh --out ~/code/matriz   # build somewhere else
#   ./scripts/agency/make-matriz.sh --push git@github.com:binnovationmarketing/agency-matriz.git
#
# --push requires the GitHub repository to exist and be empty. Create it first:
#   gh repo create binnovationmarketing/agency-matriz --public
#   (or via the GitHub web UI — do NOT initialize it with a README)
#
# The generated repository always carries the FULL 270-agent catalog, whatever
# profile is active here. Profiles are chosen per project at install time.
# ---------------------------------------------------------------------------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SRC_AGENCY="$REPO_ROOT/.claude/agency"

OUT="$REPO_ROOT/../agency-matriz"
PUSH_URL=""
BRANCH="main"

die() { printf '\033[31merror\033[0m  %s\n' "$*" >&2; exit 1; }
ok()  { printf '\033[32mok\033[0m     %s\n' "$*"; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --out)    OUT="${2:?--out needs a path}"; shift 2 ;;
    --push)   PUSH_URL="${2:?--push needs a git URL}"; shift 2 ;;
    --branch) BRANCH="${2:?--branch needs a name}"; shift 2 ;;
    -h|--help) sed -n '2,17p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) die "unknown flag: $1" ;;
  esac
done

command -v git >/dev/null 2>&1 || die "git is required"
[[ -f "$SRC_AGENCY/manifest.tsv" ]] || die "no catalog here — run: ./scripts/agency/agency.sh sync"

mkdir -p "$OUT"
OUT="$(cd "$OUT" && pwd)"
[[ "$OUT" != "$REPO_ROOT" ]] || die "--out cannot be this repository"

mkdir -p "$OUT/.claude/agents" "$OUT/.claude/agency/profiles" \
         "$OUT/.claude/agency/inactive" "$OUT/.claude/skills/agency" \
         "$OUT/scripts/agency"

# Full catalog: whatever is active here plus whatever a profile parked.
cp "$REPO_ROOT/.claude/agents"/*.md "$OUT/.claude/agents/"
if compgen -G "$SRC_AGENCY/inactive/*.md" > /dev/null; then
  cp "$SRC_AGENCY/inactive"/*.md "$OUT/.claude/agents/"
fi
touch "$OUT/.claude/agency/inactive/.gitkeep"

cp "$SRC_AGENCY/POLICY.md" "$SRC_AGENCY/manifest.tsv" "$SRC_AGENCY/UPSTREAM" "$OUT/.claude/agency/"
cp "$SRC_AGENCY/UPSTREAM-LICENSE" "$OUT/.claude/agency/" 2>/dev/null || true
cp "$SRC_AGENCY/profiles"/*.txt "$OUT/.claude/agency/profiles/"
rm -rf "$OUT/.claude/agency/strategy"
cp -R "$SRC_AGENCY/strategy" "$OUT/.claude/agency/strategy"
cp "$REPO_ROOT/.claude/skills/agency/SKILL.md" "$OUT/.claude/skills/agency/SKILL.md"
cp "$SCRIPT_DIR/agency.sh" "$SCRIPT_DIR/bootstrap.sh" "$OUT/scripts/agency/"
chmod +x "$OUT/scripts/agency/agency.sh" "$OUT/scripts/agency/bootstrap.sh"

agent_count="$(find "$OUT/.claude/agents" -name '*.md' -type f | wc -l | tr -d ' ')"

# The matriz is its own default source — installs pull from here, not from the
# application repo that happened to build it.
if [[ -n "$PUSH_URL" ]]; then
  https_url="$(printf '%s' "$PUSH_URL" \
    | sed -E 's#^git@github\.com:#https://github.com/#; s#\.git$##')"
  raw_base="$(printf '%s' "$https_url" | sed -E 's#^https://github\.com/#https://raw.githubusercontent.com/#')"
  awk -v url="${https_url}.git" \
      -v raw="${raw_base}/${BRANCH}/scripts/agency/bootstrap.sh" '
    { gsub(/https:\/\/github\.com\/binnovationmarketing\/aquafeelphilly\.git/, url)
      gsub(/https:\/\/raw\.githubusercontent\.com\/binnovationmarketing\/aquafeelphilly\/main\/scripts\/agency\/bootstrap\.sh/, raw)
      print }
  ' "$SCRIPT_DIR/bootstrap.sh" > "$OUT/scripts/agency/bootstrap.sh"
  chmod +x "$OUT/scripts/agency/bootstrap.sh"
  bootstrap_url="$raw_base/$BRANCH/scripts/agency/bootstrap.sh"
else
  bootstrap_url="https://raw.githubusercontent.com/<owner>/<repo>/$BRANCH/scripts/agency/bootstrap.sh"
fi

cat > "$OUT/README.md" <<EOF
# Agency Matriz

The central catalog every project installs from — $agent_count specialist
subagents for Claude Code, plus the routing policy that makes work actually
pass through them.

## Install

Every project on this machine:

\`\`\`bash
curl -fsSL $bootstrap_url | bash
\`\`\`

One project only, with a profile:

\`\`\`bash
curl -fsSL $bootstrap_url | bash -s -- --project . --profile web-product
\`\`\`

## What lands where

| Scope | Path | Applies to |
| --- | --- | --- |
| Machine | \`~/.claude/agents/\`, \`~/.claude/skills/agency/\`, policy block in \`~/.claude/CLAUDE.md\` | every project you open, including future ones |
| Project | \`<project>/.claude/\` + policy block in \`<project>/CLAUDE.md\` | that repo — teammates, web sessions and CI included |

Machine scope is per-user and invisible to everyone else; commit the project
scope when the whole team should route the same way.

## Profiles

\`\`\`bash
./scripts/agency/agency.sh profile list
./scripts/agency/agency.sh profile web-product   # React/TS/Supabase apps
./scripts/agency/agency.sh profile growth        # marketing, sales, paid media
./scripts/agency/agency.sh profile full          # all $agent_count
\`\`\`

Profiles compose — a project profile can start with \`@include web-product\` and
add only what it needs on top. Deactivated agents move to
\`.claude/agency/inactive/\`; nothing is deleted.

## Maintenance

\`\`\`bash
./scripts/agency/agency.sh sync      # pull the latest agents from upstream
./scripts/agency/agency.sh doctor    # verify an install
./scripts/agency/agency.sh list engineering
\`\`\`

## Credits

Agents are vendored from [msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents)
(MIT) — see \`.claude/agency/UPSTREAM\` for the pinned commit and
\`.claude/agency/UPSTREAM-LICENSE\` for the license. The frontmatter \`name\` of
each agent is rewritten to its kebab-case slug so \`subagent_type\` values are
stable; agent bodies are untouched.
EOF

cat > "$OUT/.gitignore" <<'EOF'
.DS_Store
node_modules/
EOF

if [[ ! -d "$OUT/.git" ]]; then
  git -C "$OUT" init -q -b "$BRANCH"
fi
git -C "$OUT" add -A
if git -C "$OUT" diff --cached --quiet; then
  ok "no changes — $OUT already up to date"
else
  git -C "$OUT" commit -q -m "chore: sync agency catalog ($agent_count agents)"
  ok "committed $agent_count agents in $OUT"
fi

if [[ -n "$PUSH_URL" ]]; then
  if git -C "$OUT" remote | grep -qx origin; then
    git -C "$OUT" remote set-url origin "$PUSH_URL"
  else
    git -C "$OUT" remote add origin "$PUSH_URL"
  fi
  git -C "$OUT" push -u origin "$BRANCH"
  ok "pushed to $PUSH_URL ($BRANCH)"
  echo
  echo "now install it anywhere with:"
  echo "  curl -fsSL $bootstrap_url | bash"
else
  echo
  echo "built at: $OUT"
  echo "to publish:"
  echo "  gh repo create binnovationmarketing/agency-matriz --public"
  echo "  $0 --out '$OUT' --push git@github.com:binnovationmarketing/agency-matriz.git"
fi
