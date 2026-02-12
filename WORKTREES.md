# Parallel Agents with Git Worktrees

Run multiple Cursor agents on the same repo without conflicts.
Each agent gets its own branch, directory, and dev server.

## Quick Start

```bash
# Create a worktree for a new feature
./worktree create feature-ai-chat

# Open it in a new Cursor window
./worktree open feature-ai-chat

# Start dev server on a different port
cd ../news-journal-app-feature-ai-chat
PORT=3001 npm run dev

# When done, merge and clean up
git checkout main
git merge feature-ai-chat
./worktree remove feature-ai-chat
```

## Commands

| Command | What it does |
|---------|-------------|
| `./worktree create <branch>` | Creates worktree, symlinks secrets, runs npm install |
| `./worktree remove <branch>` | Removes worktree, deletes branch if merged |
| `./worktree list` | Shows all active worktrees |
| `./worktree open <branch>` | Opens worktree in a new Cursor window |

## How It Works

1. **Git worktree** checks out a new branch into a sibling directory
   - `news-journal-app/` (main)
   - `news-journal-app-feature-ai-chat/` (feature branch)

2. **Symlinked secrets** — `.env`, `.env.local`, `.cursor/` are symlinked
   back to the main repo so all worktrees share the same config

3. **Isolated node_modules** — each worktree runs its own `npm install`

## Running Multiple Agents

```
Terminal 1 (main):           PORT=3000 npm run dev
Terminal 2 (feature-ai):     PORT=3001 npm run dev
Terminal 3 (fix-mobile):     PORT=3002 npm run dev
```

Each Cursor window works independently. No file conflicts, no overwrites.

## Adding Files to Symlink

Edit `.worktreeinclude` in the repo root — one path per line:

```
.env
.env.local
.env.example
.cursor
```

## Merging Back

```bash
# From main repo
git checkout main
git merge feature-ai-chat

# If conflicts, resolve them, then:
git add . && git commit

# Clean up
./worktree remove feature-ai-chat
```
