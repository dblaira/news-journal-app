# Visual Design Framework — Understood.

This document is the single source of truth for all visual decisions in the Understood. journal app. It is designed to be handed to any AI agent so it can make visual choices without asking the owner for per-element guidance.

---

## How This Document Works

Every visual element belongs to one of **four hierarchy levels**. Each level has locked specifications — font, size, weight, color, spacing, and behavior. When building something new, an agent determines the level first, then applies the specs. No improvisation.

**The origin story:** This framework was derived from analyzing Vanity Fair's mobile and desktop editorial layouts, then mapping those patterns onto the app's existing component library.

---

## 1. Visual Hierarchy Levels

### Level 1 — Hero / Feature

The single most important element on the page. Only one Level 1 per page.

| Property | Value |
|----------|-------|
| Font | Bodoni Moda (serif) |
| Size | Fluid, scaling between ~2.8rem and ~4.5rem based on viewport width |
| Weight | 400 (the font's design carries its own visual weight) |
| Line height | 1.15 |
| Letter spacing | 0 |
| Text color | White on dark background |
| Background | Black |
| Image | Full-bleed or half-width, minimum 500px tall on desktop, 300px on mobile |
| Padding | Generous — ~40px horizontal on desktop, ~24px on mobile |

### Level 2 — Section Banner / Theme

Marks transitions between content areas. Creates a visual "pause" between sections.

| Property | Value |
|----------|-------|
| Font | Bodoni Moda (serif) |
| Size | Fluid, scaling between ~2.5rem and ~3.6rem |
| Weight | 400 |
| Line height | 1.15 |
| Letter spacing | Slightly tight (-0.02em) |
| Text color | Near-black (#1A1A1A) |
| Background | Warm cream (#F5F0E8) |
| Border | 2px crimson red line on bottom edge |
| Padding | ~32px vertical, ~24px horizontal |

### Level 3 — Content Cards

The repeating unit of the feed. Entry cards, feature cards, connection cards. Medium prominence.

| Property | Value |
|----------|-------|
| Font | Bodoni Moda (serif) |
| Size | 1.6rem–1.7rem for headlines |
| Weight | 400 |
| Line height | 1.3 |
| Text color | Black |
| Background | White |
| Border | Thin, light line on bottom edge only (no boxes) |
| Image | Thumbnail, 160px height, cropped to fill |
| Hover | Subtle rightward nudge (4px) |

### Level 4 — Metadata / Navigation

Scannable labels. Never the focus. Always uppercase, letterspaced, small.

| Property | Value |
|----------|-------|
| Font | Inter (sans-serif) |
| Size | 0.7rem |
| Weight | 600–700 |
| Letter spacing | Wide (0.08rem–0.12rem) |
| Text transform | UPPERCASE |
| Text color | Crimson red for category labels, muted gray for timestamps/bylines |

---

## 2. Typography System

Two fonts. Two roles. No exceptions.

| Role | Font | Purpose |
|------|------|---------|
| **Editorial voice** | Bodoni Moda | All headlines (Level 1–3), brand title, section headers, button text |
| **Functional voice** | Inter | Body text, descriptions, metadata (Level 4), form labels, UI controls |

### The Type Scale (all sizes used in the app)

| Size | Role |
|------|------|
| ~2.8rem–4.5rem (fluid) | Hero headlines (Level 1 only) |
| ~2.5rem–3.6rem (fluid) | Banner headlines (Level 2 only) |
| 2rem | Section headings |
| 1.6rem–1.7rem | Card headlines (Level 3) |
| 1.25rem | Sub-headlines |
| 1.05rem–1.1rem | Emphasized body (buttons, hero descriptions) |
| 0.95rem | Default body text |
| 0.85rem | Small body (form labels, nav) |
| 0.7rem–0.75rem | Metadata (category labels, timestamps) |

### Weight Rules

| Weight | When |
|--------|------|
| 400 | All Bodoni Moda headlines |
| 500 | Medium emphasis on Inter text |
| 600 | Buttons, form labels, nav items |
| 700 | Category labels, badges, uppercase section titles |

### Paragraph Content (Entry Body, Connection Descriptions)

| Property | Value |
|----------|-------|
| Font | Inter |
| Size | 0.95rem |
| Weight | 400 |
| Line height | 1.6 |
| Max width | 65ch (roughly 65 characters per line — the optimal reading width) |
| Color | Near-black (#1A1A1A) |
| Paragraph spacing | 1em between paragraphs |

---

## 3. Spacing System

### Decision Logic

Match the relationship between elements to a spacing tier:

| Relationship | Spacing | Example |
|-------------|---------|---------|
| Tightly coupled | 4px | Icon next to its label |
| Same group | 8px | Category label above a headline |
| Groups within a component | 12px–16px | Meta block, headline, and description inside a card |
| Component internal padding | 24px (desktop) / 16px (mobile) | Card body padding |
| Between sibling components | 32px | Between two entry cards |
| Between major sections | 48px | Between hero section and feed |

### The Whitespace Rule

**When in doubt, go one step larger.** Whitespace signals quality. Cramped signals cheap. This is the single most impactful principle from the Vanity Fair analysis — generous empty space between elements makes the entire design feel premium.

---

## 4. New Component Decision Tree

When building anything new, determine its hierarchy level first:

```
Is this the single most important element on the page?
  → Yes: Level 1
  → No: Does it mark a section transition or set context?
    → Yes: Level 2
    → No: Is it a content unit the user reads or interacts with?
      → Yes: Level 3
      → No: Level 4 (metadata, navigation, or label)
```

Then apply that level's specs from Section 1. No guessing.

### Existing Component Classifications

These are locked. Agents should not re-classify existing components.

#### Level 1 — Hero / Feature
- Daily summary hero banner (main dashboard)
- Entry detail hero (full entry view)
- Weekly theme display

#### Level 2 — Section Banner / Theme
- Life Area section dividers (Business, Finance, Health, etc.)
- Connections category headers
- "Your Week" / time-period banners
- Settings section headers

#### Level 3 — Content Cards
- Entry cards (feed grid)
- Connection cards (belief library)
- AI rewrite voice cards (Literary, News, Poetic, Humorous)
- Mind map canvas
- Export format cards
- Image gallery items
- Context builder summary line (the chip row)

#### Level 4 — Metadata / Navigation
- Sidebar navigation items
- Category pills / filter tabs
- Timestamps and bylines on cards
- "Pinned" badges
- Mood and energy labels
- Entry view counts
- Capture FAB label text
- Form field labels
- Context chip labels (Environment, Activity, Energy, Mood)
- Breadcrumbs and back-navigation text

**Rule:** If a component isn't listed here, use the decision tree above to classify it. Then add it to this list so the next agent doesn't have to decide again.

---

## 5. Responsive Behavior

### What Never Changes (Any Screen Size)

- Hierarchy order — Level 1 is always most prominent
- Font families — Bodoni Moda for headlines, Inter for body
- Colors — same palette everywhere
- Spacing relationships — same tiers, smaller absolute values on mobile

### What Changes on Tablet (1024px and below)

- 2-column layouts collapse to single column
- Hero image stacks above text instead of beside it
- Hero image minimum height reduces from 500px to 300px

### What Changes on Mobile (768px and below)

- Page padding drops to zero (content goes edge-to-edge)
- Card grids become single column
- Section headers stack vertically
- Banners stack vertically (title above, subtitle below)
- Category navigation switches from horizontal tabs to dropdown
- Form buttons become full-width, stacked vertically

### Mobile-Specific Rules

1. Touch targets: minimum 44px tall
2. No hover-only interactions — everything must work with taps
3. Text never smaller than 0.7rem (the Level 4 minimum)
4. Horizontal scrolling: only for carousels, never for content
5. Full-bleed images preferred over padded images

---

## 6. Color Palette

| Color | Value | When to Use |
|-------|-------|-------------|
| Crimson Red | #DC143C | Primary accent — category labels, active states, call-to-action buttons |
| Crimson Dark | #B01030 | Hover states on red elements |
| Crimson Soft | rgba(220,20,60,0.12) | Subtle red backgrounds |
| Black | #000000 | Level 1 hero backgrounds, primary text |
| Near-black | #1A1A1A | Level 2 banner text, secondary text |
| White | #FFFFFF | Page background, card backgrounds |
| Warm cream | #F5F0E8 | Level 2 banner backgrounds |
| Light gray | #F5F5F5 / #FAFAFA | Alternate surfaces, input backgrounds |
| Muted gray | #666666 | Descriptions, timestamps, secondary info |
| Ghost gray | #999999 | Placeholder text, disabled states, muted text on dark backgrounds |

---

## 7. Design Principles (The "Why" Behind the Rules)

These principles were extracted from analyzing Vanity Fair's editorial layout and apply to all visual decisions:

1. **Size encodes importance.** The bigger the text or image, the more important it is. This applies to both typography (the type scale) and imagery (hero images vs. thumbnails). Never make two things the same size unless they're equally important.

2. **Repetition creates scannability.** The same pattern — red category label, serif headline, muted byline — repeating consistently lets users scan without reading. Break the pattern only when something genuinely deserves special treatment.

3. **Whitespace signals quality.** Generous spacing between elements makes the design feel premium. Tight spacing feels rushed. When in doubt, add more space, not less.

4. **Color is surgical.** One accent color (crimson red) used for one purpose (marking categories and actions). Everything else is black, white, or gray. Adding more colors dilutes the signal.

5. **Mobile is not a shrunk desktop.** Mobile gets its own interaction patterns — carousels instead of grids, dropdowns instead of tab bars, stacked layouts instead of side-by-side. The hierarchy stays the same; the arrangement changes.

6. **Two fonts maximum.** One serif (Bodoni Moda) for the editorial voice — headlines that feel like a magazine. One sans-serif (Inter) for the functional voice — body text, labels, and UI. Mixing more than two creates visual noise.

---

## How to Use This Document

**For AI agents:** Read the hierarchy levels first. When asked to build or modify a component, determine its level, then apply the locked specs. Don't freestyle sizes, spacing, or fonts — the values are fixed.

**For the product owner:** When something looks off, check which hierarchy level the element belongs to and whether its specs match. The fix is almost always: wrong level assignment, wrong spacing tier, or mixed styling approach.

**For new features:** Every new visual element must declare its hierarchy level before implementation begins. This prevents the correction loop of building first and tweaking second.

---

## 8. Interaction States & Animation

### Transitions

All transitions use the same timing unless noted otherwise.

| Property | Value |
|----------|-------|
| Duration | 200ms |
| Easing | ease-out |
| Properties to animate | transform, opacity, background-color, border-color |

Never animate layout properties (width, height, padding, margin) — these cause the browser to recalculate the position of every element on the page. Use transform (scale, translate) instead, which the browser can handle without that recalculation.

### State Specs

| State | Spec |
|-------|------|
| **Hover (cards)** | Subtle 4px rightward nudge, 200ms ease-out |
| **Hover (buttons)** | Background shifts to Crimson Dark (#B01030), 200ms |
| **Hover (nav items)** | Text color shifts to Crimson Red (#DC143C) |
| **Active / Pressed** | Slight scale-down (0.97), 100ms — snappy, not sluggish |
| **Focus (keyboard)** | 2px solid Crimson Red outline, 2px offset from the element edge |
| **Focus (input fields)** | Border color shifts to Crimson Red — the border itself is the indicator, no separate outline |
| **Disabled** | 40% opacity, cursor shows "not-allowed", no hover or active states |
| **Selected / Active tab** | Crimson Red text + 2px Crimson Red bottom border |
| **Unselected tab** | Muted gray (#666) text, no border |

### Loading States

| Element | Loading Behavior |
|---------|-----------------|
| **Cards** | Skeleton placeholder — light gray (#F5F5F5) with subtle pulse animation (opacity fades between 0.4 and 1.0, 1.5 second loop) |
| **AI rewrites** | Skeleton text lines (3 lines, varying widths: 100%, 85%, 60%) |
| **Buttons (pending)** | Text replaced with spinner (16px), button stays same width — no layout shift |
| **Full page** | Centered spinner + "Understood." brand text below in Bodoni Moda |

### Expand / Collapse (Context Builder, Sidebar Sections)

| Property | Value |
|----------|-------|
| Duration | 250ms |
| Easing | ease-in-out |
| Method | Animated height with content hidden during transition |
| Chevron rotation | 180 degree rotation on toggle, same 250ms timing |

### Toast / Notification Behavior

| Property | Value |
|----------|-------|
| Entry | Slide in from right + fade in, 300ms |
| Exit | Fade out, 200ms |
| Duration | 3 seconds for success messages, 5 seconds for errors |
| Position | Bottom-right on desktop, bottom-center on mobile |
| Max visible | 3 stacked, 8px gap between |

### Drag & Drop (Context Chips, Image Reorder)

| Property | Value |
|----------|-------|
| Pickup | Slight scale-up (1.05), shadow appears underneath |
| Drop zone | 2px dashed Crimson Red border |
| Snap | 150ms ease-out to final position |
