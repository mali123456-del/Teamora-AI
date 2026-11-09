# TEAMORA AI — Design System & Visual Identity

## 1. Brand Tokens & Color Palette

TEAMORA AI intentionally rejects generic bright-blue gradients and boilerplate AI sparkle templates in favor of a distinctive, warm, professional executive aesthetic.

| Token | Hex Value | Semantic Role |
|---|---|---|
| **Deep Ink** | `#211B2C` | Primary dark surface, dark theme base, high-contrast text |
| **Dark Surface** | `#2C2438` | Card background in dark mode, secondary surface |
| **Warm Ivory** | `#F5F1E9` | Light theme primary canvas background, warmth token |
| **White Surface** | `#FFFEFC` | Card and panel background in light mode |
| **Muted Lavender** | `#A78BFA` / `#8B5CF6` | Primary action buttons, active navigation, brand accent |
| **Electric Lime** | `#C7F36B` | Positive statuses, active system indicators, 3D highlights |
| **Soft Coral** | `#FF806E` | Warnings, approval safety gates, destructive alerts |
| **Secondary Text** | `#77717D` / `#AFA8B8`| Subtitles, timestamps, metadata labels |
| **Warm Neutral Borders** | `#E2DBD0` / `#382F47`| Subtle borders, structural separation |

---

## 2. Typography

- **Headings & Brand:** `Manrope`, sans-serif (Weights: 700, 800)
- **Interface & Prose:** `Inter`, sans-serif (Weights: 400, 500, 600)
- **System Fallbacks:** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

---

## 3. Original SVG Logo Concept

The TEAMORA logo combines an architectural capital letter **T** with connected team network nodes.
- Scalable vector geometry: `src/components/common/TeamoraLogo.tsx`
- Usable in Full Logo, Compact Symbol, Favicon, and Monochrome variations.

---

## 4. Internationalization & RTL Adaptation

- When language is set to Urdu (`ur`), the root document adapts:
  - `dir="rtl"`
  - `lang="ur"`
  - Text alignment, flex directions, icons, and menus mirror naturally for native right-to-left readers.
- Default currency automatically shifts to Pakistani Rupee (`PKR`) when Urdu is activated.

---

## 5. Three.js Neural Workforce Discipline

- **Procedural 3D Geometry:** 15 multi-part procedural models representing core orchestration and satellite departments.
- **Lighting:** Studio PBR lighting with `RoomEnvironment`, `PMREMGenerator`, and `ACESFilmicToneMapping`.
- **Software WebGL Guard:** Detects WebGL availability; gracefully hides canvas and presents accessible table/card directory if hardware acceleration is unavailable.
- **Collapsible Bottom Dock:** Canvas control bar is strictly capped at `<= 15%` viewport height to guarantee zero obstruction of business dashboard data.
