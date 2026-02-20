# Parallel Agents with Git Worktrees

Run multiple Cursor agents on the same repo without conflicts. Each agent gets its own branch, directory, and dev server.

---

## The Problem

When you have one repo and want multiple Cursor agents working simultaneously — one on a feature, another on a bug fix — they fight over the same files. Stashing, switching branches mid-work, and merge conflicts slow everything down.

## The Solution: Git Worktrees

Git worktrees let you check out multiple branches into separate directories at the same time, all sharing the same `.git` history. Each directory is a fully independent workspace.

```
~/Documents/GitHub/
├── news-journal-app/                  ← main (your primary workspace)
├── news-journal-app-feature-ai-chat/  ← feature branch (agent 2)
└── news-journal-app-fix-mobile/       ← bugfix branch (agent 3)
```

Each Cursor window opens a different directory. No file conflicts, no overwrites.

---

## Setup

### 1. The Worktree Script

Save this as `./worktree` in your repo root and make it executable (`chmod +x worktree`):

```bash
#!/usr/bin/env bash
set -euo pipefail

# worktree — create / remove isolated workspaces for parallel agents
#
# Usage:
#   ./worktree create <branch-name>
#   ./worktree remove <branch-name>
#   ./worktree list
#   ./worktree open <branch-name>

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAIN_REPO="$SCRIPT_DIR"
WORKTREE_PARENT="$(dirname "$MAIN_REPO")"
INCLUDE_FILE="$MAIN_REPO/.worktreeinclude"

info()  { echo -e "${CYAN}▸${NC} $1"; }
ok()    { echo -e "${GREEN}✓${NC} $1"; }
warn()  { echo -e "${YELLOW}⚠${NC} $1"; }
err()   { echo -e "${RED}✗${NC} $1" >&2; }

usage() {
  echo ""
  echo -e "${CYAN}Usage:${NC}"
  echo "  ./worktree create <branch-name>    Create worktree with symlinks"
  echo "  ./worktree remove <branch-name>    Remove worktree and clean up"
  echo "  ./worktree list                    List all worktrees"
  echo "  ./worktree open <branch-name>      Open worktree in Cursor"
  echo ""
  exit 1
}

cmd_create() {
  local branch="$1"
  local repo_name
  repo_name="$(basename "$MAIN_REPO")"
  local worktree_dir="$WORKTREE_PARENT/${repo_name}-${branch}"

  if [ -d "$worktree_dir" ]; then
    err "Worktree already exists at $worktree_dir"
    exit 1
  fi

  echo ""
  echo -e "${CYAN}━━━ Creating worktree: ${branch} ━━━${NC}"
  echo ""

  # Create the worktree (new branch from current HEAD)
  info "Creating git worktree..."
  if git -C "$MAIN_REPO" show-ref --verify --quiet "refs/heads/$branch" 2>/dev/null; then
    git -C "$MAIN_REPO" worktree add "$worktree_dir" "$branch"
  else
    git -C "$MAIN_REPO" worktree add -b "$branch" "$worktree_dir"
  fi
  ok "Worktree created at $worktree_dir"

  # Symlink files from .worktreeinclude
  if [ -f "$INCLUDE_FILE" ]; then
    info "Symlinking secrets and config..."
    while IFS= read -r line || [ -n "$line" ]; do
      line="$(echo "$line" | sed 's/#.*//' | xargs)"
      [ -z "$line" ] && continue

      local src="$MAIN_REPO/$line"
      local dest="$worktree_dir/$line"

      if [ -e "$src" ]; then
        local dest_parent
        dest_parent="$(dirname "$dest")"
        [ "$dest_parent" != "$worktree_dir" ] && mkdir -p "$dest_parent"
        rm -rf "$dest"
        ln -s "$src" "$dest"
        ok "  Linked: $line"
      else
        warn "  Skipped (not found): $line"
      fi
    done < "$INCLUDE_FILE"
  else
    warn "No .worktreeinclude file found — skipping symlinks"
  fi

  # Install dependencies
  info "Installing dependencies (npm install)..."
  (cd "$worktree_dir" && npm install --silent 2>&1 | tail -1)
  ok "Dependencies installed"

  echo ""
  echo -e "${GREEN}━━━ Ready! ━━━${NC}"
  echo ""
  echo -e "  Branch:    ${CYAN}${branch}${NC}"
  echo -e "  Directory: ${CYAN}${worktree_dir}${NC}"
  echo ""
  echo -e "  Open in Cursor:  ${YELLOW}./worktree open ${branch}${NC}"
  echo -e "  Start dev server: ${YELLOW}cd ${worktree_dir} && PORT=3001 npm run dev${NC}"
  echo -e "  Remove when done: ${YELLOW}./worktree remove ${branch}${NC}"
  echo ""
}

cmd_remove() {
  local branch="$1"
  local repo_name
  repo_name="$(basename "$MAIN_REPO")"
  local worktree_dir="$WORKTREE_PARENT/${repo_name}-${branch}"

  if [ ! -d "$worktree_dir" ]; then
    err "No worktree found at $worktree_dir"
    exit 1
  fi

  echo ""
  echo -e "${CYAN}━━━ Removing worktree: ${branch} ━━━${NC}"
  echo ""

  if [ -n "$(git -C "$worktree_dir" status --porcelain 2>/dev/null)" ]; then
    warn "Worktree has uncommitted changes!"
    echo ""
    git -C "$worktree_dir" status --short
    echo ""
    read -p "Continue removing? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      info "Cancelled."
      exit 0
    fi
  fi

  info "Removing worktree..."
  git -C "$MAIN_REPO" worktree remove "$worktree_dir" --force
  ok "Worktree removed"

  if git -C "$MAIN_REPO" branch --merged main | grep -q "$branch"; then
    info "Branch '$branch' is merged into main — deleting..."
    git -C "$MAIN_REPO" branch -d "$branch"
    ok "Branch deleted"
  else
    info "Branch '$branch' is not merged — keeping it"
  fi

  echo ""
  echo -e "${GREEN}━━━ Cleaned up ━━━${NC}"
  echo ""
}

cmd_list() {
  echo ""
  echo -e "${CYAN}━━━ Active Worktrees ━━━${NC}"
  echo ""
  git -C "$MAIN_REPO" worktree list
  echo ""
}

cmd_open() {
  local branch="$1"
  local repo_name
  repo_name="$(basename "$MAIN_REPO")"
  local worktree_dir="$WORKTREE_PARENT/${repo_name}-${branch}"

  if [ ! -d "$worktree_dir" ]; then
    err "No worktree found at $worktree_dir"
    echo -e "  Run: ${YELLOW}./worktree create ${branch}${NC}"
    exit 1
  fi

  info "Opening in Cursor..."
  cursor "$worktree_dir"
  ok "Opened $worktree_dir"
}

[ $# -lt 1 ] && usage

case "$1" in
  create)
    [ $# -lt 2 ] && { err "Missing branch name"; usage; }
    cmd_create "$2"
    ;;
  remove|rm)
    [ $# -lt 2 ] && { err "Missing branch name"; usage; }
    cmd_remove "$2"
    ;;
  list|ls)
    cmd_list
    ;;
  open)
    [ $# -lt 2 ] && { err "Missing branch name"; usage; }
    cmd_open "$2"
    ;;
  *)
    err "Unknown command: $1"
    usage
    ;;
esac
```

### 2. The `.worktreeinclude` File

Create this in your repo root. One path per line — these get symlinked into every worktree so all environments share the same secrets and config:

```
.env
.env.local
.env.example
.cursor
```

### 3. Make the script executable

```bash
chmod +x worktree
```

---

## Daily Workflow

### Create a worktree for a new feature

```bash
./worktree create feature-ai-chat
```

This does three things:
1. Creates a git worktree (new branch from HEAD) in a sibling directory
2. Symlinks secrets and config from `.worktreeinclude`
3. Runs `npm install`

### Open it in Cursor

```bash
./worktree open feature-ai-chat
```

Opens `~/Documents/GitHub/news-journal-app-feature-ai-chat/` in a new Cursor window. The agent in that window works on its own branch with its own files.

### Run dev servers on different ports

```
Terminal 1 (main):           PORT=3000 npm run dev
Terminal 2 (feature-ai):     PORT=3001 npm run dev
Terminal 3 (fix-mobile):     PORT=3002 npm run dev
```

### Merge when done

```bash
# From your main repo directory
git checkout main
git merge feature-ai-chat

# Clean up
./worktree remove feature-ai-chat
```

The `remove` command auto-deletes the branch if it's already merged.

---

## Commands Reference

| Command | What it does |
|---------|-------------|
| `./worktree create <branch>` | Creates worktree, symlinks secrets, runs npm install |
| `./worktree remove <branch>` | Removes worktree, deletes branch if merged |
| `./worktree list` | Shows all active worktrees |
| `./worktree open <branch>` | Opens worktree in a new Cursor window |

---

## Key Concepts

- **Worktrees share git history** — commits on any branch are visible from any worktree via `git log --all`
- **Symlinked secrets** — `.env`, `.env.local`, and `.cursor/` rules are shared, not duplicated
- **Isolated node_modules** — each worktree gets its own dependencies to avoid version conflicts
- **No stashing required** — you never need to stash or switch branches in your main workspace
- **Safe cleanup** — the remove command warns about uncommitted changes before deleting

## When to Use This

- Running 2-3 Cursor agents in parallel on different features
- Working on a bug fix while a long feature build is in progress
- Testing a risky refactor without touching your stable workspace
- Reviewing a PR while your main branch has uncommitted work
