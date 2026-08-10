#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# bootstrap.sh — install the Agency catalog into a machine or a project with
# one command, without cloning this repository by hand.
#
#   # every project on this machine (the "matriz" install)
#   curl -fsSL https://raw.githubusercontent.com/binnovationmarketing/aquafeelphilly/main/scripts/agency/bootstrap.sh | bash
#
#   # just the project in the current directory
#   curl -fsSL https://raw.githubusercontent.com/binnovationmarketing/aquafeelphilly/main/scripts/agency/bootstrap.sh | bash -s -- --project .
#
#   # pin a profile instead of all 270 agents
#   ... | bash -s -- --profile web-product
#
# Env overrides: AGENCY_SOURCE (git URL), AGENCY_REF (branch/tag/commit).
# ---------------------------------------------------------------------------
set -euo pipefail

SOURCE="${AGENCY_SOURCE:-https://github.com/binnovationmarketing/aquafeelphilly.git}"
REF="${AGENCY_REF:-main}"

scope="--global"
profile=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --global)  scope="--global"; shift ;;
    --project) scope="--project ${2:-.}"; shift 2 ;;
    --profile) profile="${2:?--profile needs a name}"; shift 2 ;;
    -h|--help) sed -n '2,18p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) printf 'unknown flag: %s\n' "$1" >&2; exit 1 ;;
  esac
done

command -v git >/dev/null 2>&1 || { echo "git is required" >&2; exit 1; }

# --project . must resolve before we change directories.
case "$scope" in
  "--project "*)
    target="${scope#--project }"
    [[ -d "$target" ]] || { printf 'no such directory: %s\n' "$target" >&2; exit 1; }
    scope="--project $(cd "$target" && pwd)"
    ;;
esac

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

echo "fetching the agency catalog from $SOURCE ($REF)"
git clone --quiet --depth 1 --branch "$REF" "$SOURCE" "$tmp/src" \
  || { echo "could not clone $SOURCE at $REF" >&2; exit 1; }

[[ -n "$profile" ]] && "$tmp/src/scripts/agency/agency.sh" profile "$profile"

# shellcheck disable=SC2086
"$tmp/src/scripts/agency/agency.sh" install $scope

echo
echo "done — open any project with Claude Code and it will route through the agency."
echo "the catalog lives in ~/.claude/agents/ (global) or <project>/.claude/agents/."
