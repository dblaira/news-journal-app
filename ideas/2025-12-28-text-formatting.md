---
title: "Add text formatting to journal entries"
label: Product Capability
importance: high
alignment: on-target
status: completed
created: 2025-12-28
updated: 2025-12-28
---

## Summary

Add rich text formatting capabilities to journal entries and notes, allowing users to style their writing with bold, italic, headers, lists, and other formatting options beyond plain text.

## Problem/Opportunity

Plain text journaling limits expression and organization. Users who want to:
- Emphasize key thoughts or insights
- Create structured lists and outlines
- Add headers to organize longer entries
- Include links or references

...are currently unable to do so. Rich text makes entries more readable and helps users return to past entries with better context.

## Possible Approach

Implemented using TiptapEditor component with a custom toolbar. The editor supports:
- Bold, italic, underline
- Headers (H1, H2, H3)
- Bullet and numbered lists
- Links
- Block quotes

Content stored as HTML/JSON in the database, rendered appropriately in the entry cards and modals.

## Notes

- Implemented in `components/editor/TiptapEditor.tsx`
- Toolbar controls in `components/editor/Toolbar.tsx`
- This was prioritized because it directly enhances the core journaling experience
- Consider future: adding image embedding, code blocks, or markdown shortcuts

