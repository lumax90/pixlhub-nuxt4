---
trigger: always_on
---

# PixlHub UI Guidelines

## Design Philosophy
PixlHub’s interface embodies clarity, precision, and productivity. The UI must communicate reliability and speed. All components should feel **light, modern, and task-oriented**, avoiding unnecessary visual noise.

### Core Principles
1. **Consistency:** Every layout, interaction, and spacing must follow the same grid and rhythm system.
2. **Focus:** Prioritize usability and accessibility. Avoid decorative visuals unless they guide the user.
3. **Scalability:** UI must scale from small annotation tools to complex project dashboards without changing its visual language.
4. **Feedback:** Every user action (click, hover, loading) must provide clear feedback.
5. **Harmony:** Maintain balance between simplicity (for labelers) and capability (for admins and reviewers).

---

## Color System
- **Primary:** `#2563EB` (Pixl Blue) – used for actions and key highlights.
- **Secondary:** `#1E293B` (Slate) – text and structural elements.
- **Accent:** `#10B981` (Success), `#F59E0B` (Warning), `#EF4444` (Error)
- **Backgrounds:**
  - Light mode: `#F9FAFB`
  - Dark mode: `#0F172A`
- **Borders:** use neutral grays (`#E5E7EB` light / `#1E293B` dark)

> Rule: Never introduce new colors arbitrarily. All shades must derive from Tailwind’s color system.

---

## Typography
- **Primary font:** Inter
- **Secondary font:** Space Grotesk (used for numbers, metrics, or accent headings)
- **Weights:** 400, 500, 600
- **Line height:** 1.4–1.6 depending on component type.

| Type | Font Size | Line Height | Usage |
|------|------------|--------------|--------|
| h1 | 28px | 1.2 | Page titles |
| h2 | 22px | 1.3 | Section titles |
| h3 | 18px | 1.4 | Sub-sections |
| Body | 15px | 1.5 | Default text |
| Small | 13px | 1.4 | Hints, labels |

> Rule: Always maintain readable contrast. Font color must adapt automatically to theme (light/dark).

---

## Layout & Spacing
- **Grid:** 8px system. All spacing, padding, and border-radius values must be multiples of 8.
- **Container width:** max 1280px for dashboards, full width for annotation tool.
- **Border radius:** 8px (standard), 16px (cards and modals)
- **Elevation:** use subtle shadows for layering, never more than 3 levels.

> Rule: Avoid tight layouts. Breathing room = better focus.

---

## Components
Built with **Naive UI + TailwindCSS**.
Each component should be minimal, functional, and reusable.

### Buttons
- Primary: filled blue (`#2563EB`), white text.
- Secondary: outlined or ghost, gray tones.
- Hover: lighter tint or drop shadow.
- Disabled: reduce opacity to 40%, no shadow.

### Inputs & Selects
- Rounded corners (8px)
- Focus ring in primary blue.
- Placeholder gray (`#9CA3AF`)
- Validation states: red border for error, green for success.

### Cards
- Used for dashboard elements.
- Padding: 16px–24px.
- Rounded corners (16px), subtle shadow.
- Light background with clear separation.

### Modals / Dialogs
- Centered, semi-transparent overlay.
- Keyboard and click-outside dismiss.
- Always have a clear action hierarchy (primary button > secondary > cancel).

### Tables & Lists
- Compact, responsive.
- Sticky headers.
- Hover rows highlight with light tint.
- Support sorting, filtering, and pagination.

---

## Interaction & Motion
- **Animations:** 150–250ms ease-in-out.
- **Hover states:** minimal, highlight only actionable areas.
- **Transitions:** consistent easing curves across all components.
- **Feedback:** success/failure toasts via Naive’s message component.
- **Loading:** use skeleton loaders or subtle progress bars.

---

## Theming
PixlHub supports **Light and Dark** themes.
- Theme switching should be instant, without reloading.
- Both themes must preserve identical hierarchy and contrast ratios.
- Store user theme preference in Redis or local storage.

---

## Iconography
- Use **Lucide Icons** only.
- Size range: 16–24px.
- Color: inherit from text or primary color.

> Rule: Icons should clarify, not decorate.

---

## UX Behavior (Annotation Tool)
- State-driven interface (Pinia store): all annotation data, selection, and undo/redo live in centralized store.
- Canvas (Konva) must respond instantly, zero lag.
- Keyboard shortcuts for all major actions (create box, undo, save, next image).
- Autosave every 10 seconds.
- Never block user flow with modals during labeling.

---

## Accessibility & Internationalization
- Follow WCAG 2.1 AA contrast rules.
- Tab navigation and keyboard actions must work for all interactive elements.
- All strings must be translatable (EN/TR ready).

---

## Summary Prompt (for AI models)
> Design and build all PixlHub interfaces using this guideline. Every UI element must adhere to the principles of clarity, scalability, and consistency defined above. Use Nuxt + Naive UI + Tailwind. Maintain visual balance and coherence across annotation tools, dashboards, and review systems. Never deviate from defined spacing, typography, and color rules.