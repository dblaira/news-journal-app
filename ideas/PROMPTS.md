# Idea Capture Prompts

Copy-paste these prompts into any AI chat (ChatGPT, Claude, Gemini) to quickly format ideas for your News Journal App ideas folder.

---

## Quick Capture Prompt

```
Format this idea as a markdown file for my project ideas folder. Use this exact structure:

---
title: "[short title]"
label: [choose: Customer | Cost | Product Capability | Marketing]
importance: [choose: high | medium | low]
alignment: [choose: on-target | adjacent | far-fetched]
status: idea
created: [today's date YYYY-MM-DD]
updated: [today's date YYYY-MM-DD]

# Optional context (if available)
time: [HH:MM AM/PM]
location: [where you were]
activity: [what you were doing]
---

## Summary
[one paragraph]

## Problem/Opportunity
[what need this addresses]

## Possible Approach
[brief implementation thoughts]

## Notes
[any additional context]
```

---

## Label Reference

When the AI asks which label to use:

| Label | Use for... |
|-------|------------|
| **Customer** | User experience, user needs, accessibility, feedback |
| **Cost** | Infrastructure, API costs, optimization, pricing |
| **Product Capability** | Features, functionality, technical capabilities |
| **Marketing** | Growth, positioning, messaging, distribution |

---

## Alignment Reference

| Alignment | Meaning |
|-----------|---------|
| **on-target** | Fits current goals/sprint |
| **adjacent** | Related but not priority now |
| **far-fetched** | Visionary, save for later |

---

## Example Usage

You're chatting with an AI and an idea comes up. Say:

> "I just thought of a feature for my journal app - [describe idea]. Can you format this as a markdown file using my template? The label is Product Capability, importance is medium, and it's adjacent to current work. I was walking near the park around 3pm when I thought of it."

Then copy the output, save as `YYYY-MM-DD-short-name.md` in your `ideas/` folder.

---

## File Naming

Save ideas as: `YYYY-MM-DD-short-description.md`

Examples:
- `2025-12-28-weekly-email-digest.md`
- `2025-12-30-mood-tracking-analytics.md`

---

## Watch → Notes Workflow

For automatic metadata capture:
1. Record voice memo on Apple Watch
2. Share to Notes app (captures time + location automatically)
3. Later, transcribe and format using this prompt
