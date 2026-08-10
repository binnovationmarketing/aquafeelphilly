#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# agency.sh — manage the vendored "Agency Agents" specialist catalog.
#
# Upstream: https://github.com/msitarzewski/agency-agents (MIT)
# The catalog is vendored into .claude/agents/ so every session of this repo
# loads it with no network access and no install step.
#
# Subcommands:
#   sync [--ref REF]        re-vendor the catalog from upstream and pin the commit
#   install --global        install into ~/.claude (applies to ALL local projects)
#   install --project DIR   install into another project's .claude/
#   profile <name|list>     activate a subset of the catalog
#   list [division]         list agents, optionally filtered by division
#   doctor                  verify the local install
#
# Pure bash + awk. No runtime dependencies beyond git (only for `sync`).
# ---------------------------------------------------------------------------
set -euo pipefail

UPSTREAM_REPO="https://github.com/msitarzewski/agency-agents.git"
DIVISIONS=(academic design engineering finance game-development gis healthcare
           marketing paid-media product project-management sales security
           spatial-computing specialized support testing)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
AGENCY_DIR="$REPO_ROOT/.claude/agency"
AGENTS_DIR="$REPO_ROOT/.claude/agents"
INACTIVE_DIR="$AGENCY_DIR/inactive"
SKILL_DIR="$REPO_ROOT/.claude/skills/agency"
MANIFEST="$AGENCY_DIR/manifest.tsv"

BLOCK_START="<!-- agency-agents:start -->"
BLOCK_END="<!-- agency-agents:end -->"
SYNC_TMP=""

die()  { printf '\033[31merror\033[0m  %s\n' "$*" >&2; exit 1; }
ok()   { printf '\033[32mok\033[0m     %s\n' "$*"; }
info() { printf '\033[36minfo\033[0m   %s\n' "$*"; }
warn() { printf '\033[33mwarn\033[0m   %s\n' "$*"; }

# slugify <string> — lowercase, non-alphanumerics collapsed to single dashes.
slugify() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//'
}

# frontmatter_field <file> <key> — first value of <key> inside the leading ---
# fence, with surrounding quotes stripped.
frontmatter_field() {
  awk -v key="$2" '
    NR == 1 && $0 != "---" { exit }
    NR == 1 { infm = 1; next }
    infm && $0 == "---" { exit }
    infm && index($0, key ":") == 1 {
      v = substr($0, length(key) + 2)
      sub(/^[[:space:]]+/, "", v); sub(/[[:space:]]+$/, "", v)
      gsub(/^"|"$/, "", v); gsub(/^'\''|'\''$/, "", v)
      print v; exit
    }
  ' "$1"
}

# rewrite_name <src> <dest> <slug> — copy an agent file, forcing its frontmatter
# `name:` to <slug> so `subagent_type` is predictable. Body is untouched.
rewrite_name() {
  awk -v slug="$3" '
    NR == 1 { infm = ($0 == "---"); print; next }
    infm && $0 == "---" { infm = 0; print; next }
    infm && index($0, "name:") == 1 { print "name: " slug; next }
    { print }
  ' "$1" > "$2"
}

# --------------------------------------------------------------------------
# sync
# --------------------------------------------------------------------------
cmd_sync() {
  local ref="main"
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --ref) ref="${2:?--ref needs a value}"; shift 2 ;;
      *) die "unknown flag for sync: $1" ;;
    esac
  done

  command -v git >/dev/null 2>&1 || die "git is required for sync"

  local tmp; tmp="$(mktemp -d)"
  SYNC_TMP="$tmp"
  trap 'rm -rf "${SYNC_TMP:-}"' EXIT

  info "cloning $UPSTREAM_REPO ($ref)"
  git clone --quiet --depth 1 --branch "$ref" "$UPSTREAM_REPO" "$tmp/src" 2>/dev/null \
    || git clone --quiet --depth 1 "$UPSTREAM_REPO" "$tmp/src" \
    || die "clone failed"

  local commit; commit="$(git -C "$tmp/src" rev-parse HEAD)"

  # Preserve which agents were deactivated so sync does not silently re-enable
  # a narrowed profile.
  local -a was_inactive=()
  if [[ -d "$INACTIVE_DIR" ]]; then
    while IFS= read -r f; do
      was_inactive+=("$(basename "$f")")
    done < <(find "$INACTIVE_DIR" -name '*.md' -type f 2>/dev/null)
  fi

  rm -rf "$AGENTS_DIR" "$INACTIVE_DIR" "$AGENCY_DIR/strategy"
  mkdir -p "$AGENTS_DIR" "$INACTIVE_DIR" "$AGENCY_DIR"
  : > "$MANIFEST"

  local count=0 div f name slug
  for div in "${DIVISIONS[@]}"; do
    [[ -d "$tmp/src/$div" ]] || { warn "division missing upstream: $div"; continue; }
    while IFS= read -r f; do
      [[ "$(head -n 1 "$f")" == "---" ]] || continue   # not an agent file
      name="$(frontmatter_field "$f" name)"
      [[ -n "$name" ]] || { warn "no name in $f — skipped"; continue; }
      slug="$(slugify "$name")"
      if grep -q "^${slug}	" "$MANIFEST" 2>/dev/null; then
        warn "duplicate slug '$slug' ($div) — skipped"
        continue
      fi
      rewrite_name "$f" "$AGENTS_DIR/$slug.md" "$slug"
      printf '%s\t%s\t%s\n' "$slug" "$div" "$name" >> "$MANIFEST"
      count=$((count + 1))
    done < <(find "$tmp/src/$div" -name '*.md' -type f | sort)
  done

  LC_ALL=C sort -o "$MANIFEST" "$MANIFEST"

  # Orchestration layer: playbooks, runbooks, handoff templates.
  if [[ -d "$tmp/src/strategy" ]]; then
    mkdir -p "$AGENCY_DIR/strategy"
    cp -R "$tmp/src/strategy/." "$AGENCY_DIR/strategy/"
  fi
  cp "$tmp/src/LICENSE" "$AGENCY_DIR/UPSTREAM-LICENSE" 2>/dev/null || true

  cat > "$AGENCY_DIR/UPSTREAM" <<EOF
repo=$UPSTREAM_REPO
ref=$ref
commit=$commit
synced=$(date -u +%Y-%m-%dT%H:%M:%SZ)
agents=$count
license=MIT (see UPSTREAM-LICENSE)
EOF

  # Re-apply the previous profile narrowing.
  local b
  for b in ${was_inactive[@]+"${was_inactive[@]}"}; do
    [[ -f "$AGENTS_DIR/$b" ]] && mv "$AGENTS_DIR/$b" "$INACTIVE_DIR/$b"
  done
  touch "$INACTIVE_DIR/.gitkeep"

  ok "vendored $count agents at ${commit:0:12}"
  [[ ${#was_inactive[@]} -gt 0 ]] && info "re-applied profile: ${#was_inactive[@]} agents kept inactive"
  return 0
}

# --------------------------------------------------------------------------
# install
# --------------------------------------------------------------------------

# write_policy_block <claude-md-path> — insert or replace the managed routing
# policy block, leaving everything else in the file alone.
write_policy_block() {
  local target="$1" tmp
  tmp="$(mktemp)"
  mkdir -p "$(dirname "$target")"
  [[ -f "$target" ]] || : > "$target"

  awk -v s="$BLOCK_START" -v e="$BLOCK_END" '
    $0 == s { skip = 1 }
    !skip { print }
    $0 == e { skip = 0 }
  ' "$target" > "$tmp"

  # Drop trailing blank lines, then append a fresh block.
  awk 'BEGIN{blank=0} { if ($0 ~ /^[[:space:]]*$/) { blank++ } else { while (blank-- > 0) print ""; blank=0; print } }' "$tmp" > "$tmp.trim"
  mv "$tmp.trim" "$tmp"

  {
    [[ -s "$tmp" ]] && printf '\n'
    printf '%s\n' "$BLOCK_START"
    cat "$AGENCY_DIR/POLICY.md"
    printf '%s\n' "$BLOCK_END"
  } >> "$tmp"

  mv "$tmp" "$target"
}

cmd_install() {
  local scope="" dest=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --global)  scope="global"; shift ;;
      --project) scope="project"; dest="${2:?--project needs a directory}"; shift 2 ;;
      *) die "unknown flag for install: $1" ;;
    esac
  done
  [[ -n "$scope" ]] || die "install needs --global or --project DIR"

  local base
  if [[ "$scope" == "global" ]]; then
    base="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
  else
    [[ -d "$dest" ]] || die "not a directory: $dest"
    base="$(cd "$dest" && pwd)/.claude"
  fi

  [[ "$base/agents" != "$AGENTS_DIR" ]] \
    || die "that is this repo — the catalog is already vendored here"

  local n; n="$(find "$AGENTS_DIR" -name '*.md' -type f | wc -l | tr -d ' ')"
  [[ "$n" -gt 0 ]] || die "no agents in $AGENTS_DIR — run: $0 sync"

  mkdir -p "$base/agents" "$base/skills/agency"
  cp "$AGENTS_DIR"/*.md "$base/agents/"
  cp "$SKILL_DIR/SKILL.md" "$base/skills/agency/SKILL.md"
  mkdir -p "$base/agency"
  cp "$MANIFEST" "$base/agency/manifest.tsv"
  cp "$AGENCY_DIR/POLICY.md" "$base/agency/POLICY.md"
  cp "$AGENCY_DIR/UPSTREAM" "$base/agency/UPSTREAM"
  [[ -d "$AGENCY_DIR/strategy" ]] && { rm -rf "$base/agency/strategy"; cp -R "$AGENCY_DIR/strategy" "$base/agency/strategy"; }

  if [[ "$scope" == "global" ]]; then
    write_policy_block "$base/CLAUDE.md"
    ok "$n agents -> $base/agents/"
    ok "routing skill -> $base/skills/agency/"
    ok "policy block  -> $base/CLAUDE.md"
    info "every project on this machine now routes through the agency"
  else
    write_policy_block "$(dirname "$base")/CLAUDE.md"
    ok "$n agents -> $base/agents/"
    ok "policy block  -> $(dirname "$base")/CLAUDE.md"
  fi
}

# --------------------------------------------------------------------------
# profile
# --------------------------------------------------------------------------
cmd_profile() {
  local name="${1:-list}"
  local pdir="$AGENCY_DIR/profiles"

  if [[ "$name" == "list" ]]; then
    printf 'available profiles:\n'
    local p
    for p in "$pdir"/*.txt; do
      [[ -f "$p" ]] || continue
      local base; base="$(basename "$p" .txt)"
      local c; c="$(grep -cvE '^\s*(#|$)' "$p" || true)"
      printf '  %-14s %s agents\n' "$base" "$c"
    done
    printf '  %-14s %s agents (everything)\n' "full" "$(wc -l < "$MANIFEST" | tr -d ' ')"
    return 0
  fi

  mkdir -p "$INACTIVE_DIR"
  # Start from a full catalog.
  local f
  while IFS= read -r f; do
    mv "$f" "$AGENTS_DIR/$(basename "$f")"
  done < <(find "$INACTIVE_DIR" -name '*.md' -type f)

  if [[ "$name" == "full" ]]; then
    ok "profile 'full' active — $(find "$AGENTS_DIR" -name '*.md' | wc -l | tr -d ' ') agents"
    return 0
  fi

  local plist="$pdir/$name.txt"
  [[ -f "$plist" ]] || die "no such profile: $name (try: $0 profile list)"

  local keep; keep="$(mktemp)"
  grep -vE '^\s*(#|$)' "$plist" | tr -d '\r' | LC_ALL=C sort -u > "$keep"

  # Warn about profile entries that do not exist in the catalog.
  local missing
  missing="$(LC_ALL=C comm -23 "$keep" <(cut -f1 "$MANIFEST" | LC_ALL=C sort))"
  [[ -n "$missing" ]] && warn "not in catalog: $(echo "$missing" | tr '\n' ' ')"

  local kept=0 off=0 slug
  while IFS= read -r f; do
    slug="$(basename "$f" .md)"
    if grep -qx "$slug" "$keep"; then
      kept=$((kept + 1))
    else
      mv "$f" "$INACTIVE_DIR/$(basename "$f")"
      off=$((off + 1))
    fi
  done < <(find "$AGENTS_DIR" -name '*.md' -type f)
  rm -f "$keep"

  ok "profile '$name' active — $kept agents loaded, $off parked in .claude/agency/inactive/"
}

# --------------------------------------------------------------------------
# list / doctor
# --------------------------------------------------------------------------
cmd_list() {
  local filter="${1:-}"
  [[ -f "$MANIFEST" ]] || die "no manifest — run: $0 sync"
  awk -F'\t' -v filter="$filter" -v dir="$AGENTS_DIR" '
    filter == "" || $2 == filter {
      state = (system("test -f " dir "/" $1 ".md") == 0) ? "on " : "off"
      printf "%s %-42s %-20s %s\n", state, $1, $2, $3
    }
  ' "$MANIFEST"
}

cmd_doctor() {
  local rc=0
  [[ -f "$MANIFEST" ]] || { warn "missing manifest"; rc=1; }
  [[ -f "$SKILL_DIR/SKILL.md" ]] || { warn "missing routing skill"; rc=1; }
  [[ -f "$AGENCY_DIR/POLICY.md" ]] || { warn "missing policy"; rc=1; }

  local active inactive total
  active="$(find "$AGENTS_DIR" -name '*.md' -type f 2>/dev/null | wc -l | tr -d ' ')"
  inactive="$(find "$INACTIVE_DIR" -name '*.md' -type f 2>/dev/null | wc -l | tr -d ' ')"
  total="$(wc -l < "$MANIFEST" 2>/dev/null | tr -d ' ' || echo 0)"

  printf 'catalog   %s agents (%s active, %s inactive)\n' "$total" "$active" "$inactive"
  [[ -f "$AGENCY_DIR/UPSTREAM" ]] && sed 's/^/upstream  /' "$AGENCY_DIR/UPSTREAM"

  if [[ $((active + inactive)) -ne "$total" ]]; then
    warn "manifest and files disagree — run: $0 sync"; rc=1
  fi

  # Every active agent must carry a name + description or Claude Code ignores it.
  local bad=0 f
  while IFS= read -r f; do
    [[ -n "$(frontmatter_field "$f" name)" ]] && [[ -n "$(frontmatter_field "$f" description)" ]] || {
      warn "bad frontmatter: $f"; bad=$((bad + 1)); }
  done < <(find "$AGENTS_DIR" -name '*.md' -type f 2>/dev/null)
  [[ "$bad" -eq 0 ]] || rc=1

  local gdir="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
  if [[ -d "$gdir/agents" ]]; then
    printf 'global    %s agents in %s\n' \
      "$(find "$gdir/agents" -name '*.md' -type f | wc -l | tr -d ' ')" "$gdir/agents"
  else
    info "not installed globally — run: $0 install --global"
  fi

  [[ $rc -eq 0 ]] && ok "healthy"
  return $rc
}

usage() {
  sed -n '2,20p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
}

main() {
  local cmd="${1:-}"; shift || true
  case "$cmd" in
    sync)    cmd_sync "$@" ;;
    install) cmd_install "$@" ;;
    profile) cmd_profile "$@" ;;
    list)    cmd_list "$@" ;;
    doctor)  cmd_doctor "$@" ;;
    ""|-h|--help|help) usage ;;
    *) die "unknown command: $cmd (try --help)" ;;
  esac
}

main "$@"
