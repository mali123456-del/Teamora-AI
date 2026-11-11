# TEAMORA AI — Design System & Theme Audit

**Product:** TEAMORA AI — Your AI Team. One Smart Workspace  
**Design Constitution:** Zero-Pill Discipline, Tabular Numerals, 60-30-10 Palette, WCAG 2.2 AA Contrast  
**Target Hardware:** Dell Latitude 3340 (Intel HD Graphics, 1366x768 / 1440px desktop baseline)  
**Date:** 2026-11-10  

---

## 1. Color Palette & Token Hierarchy

The TEAMORA design system avoids generic AI templates (hyper-saturated purple/cyan neon or floating candy cards) in favor of an authentic, editorial, and industrial-futuristic aesthetic.

| Token Name | Hex Code | Role & Usage | Light Mode | Dark Mode | Contrast Ratio |
|---|---|---|---|---|:---:|
| **Deep Ink** | `#211B2C` | Primary text, high-emphasis icons, brand anchor | Dark Text (`#211B2C`) | Dark Canvas (`#211B2C`) | 12.8:1 |
| **Dark Surface** | `#2C2438` | Dark mode container surfaces, cards, modals | N/A | Card Surface (`#2C2438`) | 7.6:1 |
| **Warm Ivory** | `#F5F1E9` | Light mode canvas field, subdued card sections | Light Canvas (`#F5F1E9`) | Light Text (`#F5F1E9`) | 13.1:1 |
| **White Surface** | `#FFFEFC` | Light mode container surfaces, cards, dropdowns | Container (`#FFFEFC`) | N/A | 14.5:1 |
| **Muted Lavender**| `#8B5CF6` / `#A78BFA` | Primary active accent, interactive CTAs, focused states | Primary Accent (`#8B5CF6`)| Accent Hover (`#A78BFA`) | 5.2:1 |
| **Electric Lime** | `#C7F36B` | Status indicators, system health badges, new feature markers | Accent Tag (`#162700` text) | Dark Glow (`#C7F36B`) | 6.8:1 |
| **Soft Coral** | `#FF806E` | Urgent priority, pending approval alerts, destructive actions | Alert Text / Badge | Alert Text / Badge | 4.8:1 |
| **Hairline Border**| `#E2DBD0` / `#382F47`| Structural dividing lines (1px solid) | Light Border (`#E2DBD0`)| Dark Border (`#382F47`) | 1.8:1 |
| **Subdued Slate** | `#77717D` / `#AFA8B8`| Secondary body text, timestamps, metadata | Muted Light (`#77717D`)| Muted Dark (`#AFA8B8`) | 4.9:1 |

---

## 2. Typographic Standards

1. **Display & Headings:** `Plus Jakarta Sans` / `Manrope` for brand wordmarks, modal titles, and section headers (`font-heading font-bold`).
2. **Body Prose:** `Inter` / `Public Sans` with 1.5–1.7 line height for high-density readability across business tables, tickets, and agent outputs.
3. **Tabular Numerals (`font-mono tabular-nums`):** Mandatory for all numeric data, currency amounts (USD / PKR), timestamps (`12m ago`), badge counts, and FPS telemetry.
4. **Urdu Typography & RTL:** Automatic `dir="rtl"` layout direction and Urdu glyph baseline compensation when Urdu (`ur`) is selected.

---

## 3. Anti-AI Slop Rules & Visual Restraint

- **Zero-Pill Metadata:** Timestamps, categories, and tags are rendered as quiet, unboxed inline text with typographic separators (`12m ago · Task · Medium priority`), never wrapped in rounded pill boxes or bordered candy chips.
- **Interactive Segmented Controls:** Filter bars and tab selectors that trigger client-side filtering are functional `<button>` elements styled with clean subtle backgrounds.
- **No Pseudo-Technical Clutter:** Section headers never contain mechanical comment prefixes (`//`, `/* */`, `>_`). Clean editorial title-case is strictly enforced.
- **No Decorative Pulsing Dots:** Pulsing dots are banned from static headings, card titles, and footer links. They are reserved strictly for active real-time data streaming.
- **No Thick Left Accent Borders:** Prohibits `border-l-4` asymmetric colored stripes on cards or callouts. Content boundaries use subtle all-around hairline borders (`border border-[#E2DBD0] dark:border-[#382F47]`).
- **Single-Elevation Depth:** Maximum 1 level of card elevation per view to avoid "cards inside cards" clutter.

---

## 4. Reusable Component Inventory

| Component | File Path | Variants | Key States | Accessibility Guarantee |
|---|---|---|---|---|
| **Header** | `src/components/layout/Header.tsx` | Authenticated, Demo Sandbox, Public | Default, Org dropdown, Voice active | Focus rings, `aria-label`, Escape key |
| **Sidebar** | `src/components/layout/Sidebar.tsx` | Expanded, Collapsed, Mobile Drawer | Active tab, Hover, Badge counters | Keyboard navigable, contrast WCAG AA |
| **NotificationBell**| `src/components/common/NotificationBell.tsx` | Normal, Unread Badge, Active Dropdown | Filter tabs, Preferences toggle, Empty state | Outside-click dismiss, Escape key, tab routing |
| **VoiceModal** | `src/components/common/VoiceCommandModal.tsx`| Listening, Reviewing, Fallback Text | Idle, Starting, Recording, Processing | Fallback text input, microphone permission check |
| **WorkforceCanvas**| `src/components/three/TeamoraWorkforceCanvas.tsx`| ECO, STANDARD, HIGH | 2D Fallback, Interactive hover, Orbital pan | Canvas aria fallback, memory auto-disposal |
| **ErrorBoundary** | `src/components/common/ErrorBoundary.tsx` | Global Shell, Per-View Isolation | Crashing state, Friendly recovery retry | Captures uncaught errors without black-screen |
