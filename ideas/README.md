# Ideas

A structured repository for capturing, organizing, and tracking ideas for the News Journal App.

## How to Add a New Idea

1. Copy `_TEMPLATE.md` to a new file
2. Name the file using the format: `YYYY-MM-DD-short-description.md`
3. Fill in the YAML frontmatter and body sections
4. Commit to the repository

## Frontmatter Schema

Each idea file uses YAML frontmatter for structured metadata:

```yaml
---
title: "Short descriptive title"
label: Product Capability
importance: high
alignment: on-target
status: idea
created: 2025-12-28
updated: 2025-12-28
---
```

### Labels

Labels identify which business function the idea relates to:

| Label | Description |
|-------|-------------|
| **Customer** | User experience, user needs, user feedback, accessibility |
| **Cost** | Infrastructure, API costs, optimization, pricing strategy |
| **Product Capability** | Features, functionality, technical capabilities |
| **Marketing** | Growth, positioning, messaging, distribution, branding |

### Importance

How critical is this idea to the success of the product?

| Level | Description |
|-------|-------------|
| **high** | Essential for core value proposition or blocking significant progress |
| **medium** | Would meaningfully improve the product |
| **low** | Nice to have, incremental improvement |

### Alignment

How well does this idea fit with current goals and priorities?

| Level | Description |
|-------|-------------|
| **on-target** | Directly supports current sprint/phase goals |
| **adjacent** | Related to current work but not a priority right now |
| **far-fetched** | Visionary or exploratory—keep for future consideration |

### Status

Track the lifecycle of each idea:

| Status | Description |
|--------|-------------|
| **idea** | Initial capture, not yet evaluated |
| **exploring** | Actively researching or prototyping |
| **planned** | Accepted and scheduled for implementation |
| **in-progress** | Currently being built |
| **completed** | Shipped and live |
| **rejected** | Decided against (document why in notes) |

## File Naming Convention

Use this format for consistency and chronological sorting:

```
YYYY-MM-DD-short-description.md
```

Examples:
- `2025-12-28-text-formatting.md`
- `2025-12-30-weekly-email-digest.md`
- `2026-01-05-collaborative-journaling.md`

## Body Sections

Each idea file should include:

- **Summary** — One paragraph overview
- **Problem/Opportunity** — What user need or business opportunity this addresses
- **Possible Approach** — Initial thoughts on implementation (optional)
- **Notes** — Links, related ideas, follow-up thoughts

## Quick Reference

To find ideas by criteria, use grep or your editor's search:

```bash
# Find all high-importance ideas
grep -l "importance: high" ideas/*.md

# Find all Customer-related ideas
grep -l "label: Customer" ideas/*.md

# Find ideas that are planned
grep -l "status: planned" ideas/*.md
```

