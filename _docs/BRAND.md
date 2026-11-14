# BuzzQR Brand Book (v0.2)

> *BuzzQR* is a temporary name (see PRD). Keep it in one config constant. This book uses palette **A, "Azul Confianza"**, chosen on 2026-11-14. Exploration of the other options: `color-palettes.html`. Related: [PRD](PRD.md) (landing page FR-0, i18n), [AGENTS.md](../AGENTS.md) (rules agents follow).

## 1. Brand idea

BuzzQR helps small businesses in Mexico get paid with QR codes (CoDi) and know right away that the money arrived.

**Personality:** trustworthy, clear, modern, calm. Never flashy or playful with money.

**Tone of voice (Spanish default, English equal):**
- Plain, short and direct. Talk to the business owner ("tú").
- Say what happened and what to do next.
- No hype, no jargon, no promises we can't back up (no invented numbers, testimonials or security badges).
- Examples: "Pago recibido" / "Payment received"; "Crea tu QR" / "Create your QR"; error: "No pudimos crear el QR. Revisa el monto e inténtalo de nuevo." / "We couldn't create the QR. Check the amount and try again."

## 2. Color

### Core palette

| Token | Name | Hex | Use |
|---|---|---|---|
| `--brand` | Midnight | `#0B2A5B` | Brand surfaces, headers, dark sections |
| `--action` | Electric | `#1F5EFF` | Buttons, links, focus, active states |
| `--success` | Emerald | `#00B37E` | Payment received: fills, badges, icons |
| `--bg` | Ice | `#F5F8FF` | Page background (light) |
| `--surface` | White | `#FFFFFF` | Cards, inputs |
| `--text` | Ink | `#0B1220` | Primary text |

### Supporting tokens (added for accessibility)

| Token | Hex | Use |
|---|---|---|
| `--text-muted` | `#4A5873` | Secondary text |
| `--success-text` | `#067A55` | Green **text** on light backgrounds (Emerald fails as text) |
| `--warning-text` | `#8A5300` | Warning text on light backgrounds |
| `--warning-fill` | `#F59E0B` | Warning badges/fills (use Ink text on it) |
| `--error` | `#C62F34` | Error text, error borders, destructive buttons |
| `--border` | `#6F7C93` | Input and control borders (needs 3:1 against the background) |
| `--divider` | `#DCE3F0` | Decorative lines only (never the only way to see a control) |

### Dark theme

| Token | Hex |
|---|---|
| `--bg` | `#0A1426` |
| `--surface` | `#0E2347` |
| `--text` | `#EAF0FF` |
| `--text-muted` | `#A9B7D0` |
| `--action` | `#5B8CFF` (button text `#0A1426`) |
| `--success` | `#00B37E` |
| `--error` | `#FF7A7E` |
| `--border` | `#7C8CAB` |

### Rules
- **Green means "money arrived", nothing else.** Do not use it for decoration.
- Emerald `#00B37E` is never a text color on white (2.7:1). Use `--success-text` for text, or put Ink or Midnight text on an Emerald fill.
- **Never use color alone** to convey state. Pair it with an icon and a word (for example a check icon + "Pago recibido").
- Midnight and Electric are the brand; keep the rest of the screen quiet and mostly Ice/White.
- CoDi and Pey logos keep their original colors and clear space; follow Pey's [brand asset rules](https://docs.pey.mx/brand-assets).

### Verified contrast (WCAG 2.2; ratio needed: 4.5:1 normal text, 3:1 large text and UI components)

| Pair | Ratio | Result |
|---|---|---|
| Ink on White / Ice | 18.7 / 17.6 | AAA |
| Muted `#4A5873` on White / Ice | 7.2 / 6.7 | AAA |
| White on Midnight | 14.0 | AAA |
| White on Electric (button) | 5.1 | AA |
| Electric link on White / Ice | 5.1 / 4.8 | AA |
| Ink on Emerald | 6.9 | AA |
| Midnight on Emerald | 5.2 | AA |
| `--success-text` on White / Ice | 5.4 / 5.0 | AA |
| `--error` on White (and white text on it) | 5.4 | AA |
| `--warning-text` on White | 6.3 | AA |
| Ink on Warning fill | 8.7 | AAA |
| `--border` on White | 4.2 | Passes 3:1 |
| Dark: text on `#0A1426` / on surface | 16.1 / 13.6 | AAA |
| Dark: muted on bg | 9.1 | AAA |
| Dark: action `#5B8CFF` on bg (and button text on it) | 5.8 | AA |
| Dark: success / error on bg | 6.8 / 7.3 | AA |

Re-check any new color pair before using it.

## 3. Typography

Goal: maximum legibility on a phone held at arm's length at a busy counter, and on a desktop dashboard, including for people with low vision or dyslexia.

### Typefaces
- **UI and body: Inter.** Large x-height, open apertures, clear letterforms at small sizes, and tabular figures for amounts.
- **Headings (landing page and large titles only): Plus Jakarta Sans** (700/800). Never use it below 20 px.
- Fallback stack: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
- Load from Google Fonts with `display=swap`; self-host later for privacy and speed.
- **Numbers and money:** `font-variant-numeric: tabular-nums` and the slashed-zero feature (`font-feature-settings: "zero"`) so `0` and `O`, and `1` and `l`, are never confused. Format: `$1,250.00 MXN`.

### Scale: mobile (base 16 px, never smaller for body text)

| Role | Size / line height | Weight |
|---|---|---|
| Display (landing hero) | 32 / 40 | 800 |
| H1 | 28 / 36 | 700 |
| H2 | 22 / 30 | 700 |
| H3 | 18 / 26 | 600 |
| Body | 16 / 24 | 400 |
| Small / caption | 14 / 20 | 400-500 (minimum for any text) |
| Amount (payment received) | 36 / 44 | 700 |
| Button label | 16 / 24 | 600 |

### Scale: desktop (≥ 1024 px, base 16 px, optional 18 px for landing copy)

| Role | Size / line height | Weight |
|---|---|---|
| Display (landing hero) | 56 / 64 | 800 |
| H1 | 40 / 48 | 700 |
| H2 | 28 / 36 | 700 |
| H3 | 20 / 28 | 600 |
| Body | 16 / 26 (landing: 18 / 28) | 400 |
| Small / caption | 14 / 20 | 400-500 |
| Amount (payment received) | 48 / 56 | 700 |
| Button label | 16 / 24 | 600 |

Use `clamp()` between the two scales so sizes change smoothly instead of jumping at breakpoints.

### Legibility rules
- Body line length 45-75 characters; line height at least 1.5 for body text.
- Left-aligned text, never justified; no all-caps for sentences (short labels only, with letter-spacing).
- Avoid light weights (below 400) and text over images or gradients.
- Use real `rem` units, not `px`, for text so it follows the user's browser font setting. The layout must still work at **200% zoom** and with text spacing increased (WCAG 1.4.4, 1.4.12), without horizontal scrolling at 320 px wide.
- Do not disable pinch-zoom (no `user-scalable=no`).
- Italics and underline only for meaning; links are always underlined or otherwise clearly marked, not just a color change.

## 4. Accessibility standard

Target **WCAG 2.2 level AA** for the whole app and landing page. This is a design target and a good-practice standard; it is not legal advice.

**Visual**
- Contrast as listed above; 3:1 for icons, input borders and focus indicators.
- Color is never the only signal (icon + text for success, error, warning).
- Support light and dark themes and `prefers-color-scheme`; respect `prefers-contrast: more` with stronger borders and text.
- QR codes: always dark on a white background with a quiet zone of at least 4 modules, even in dark theme, so they scan reliably.

**Interaction**
- Touch targets at least **44 × 44 px** (minimum 24 × 24 per WCAG 2.2), with spacing between them.
- Visible focus ring on every interactive element: 3 px Electric (`#1F5EFF`; `#5B8CFF` in dark) with a 2 px offset, never removed.
- Everything works with keyboard only, in a logical tab order; no keyboard traps; skip-to-content link.

**Content and structure**
- Semantic HTML (headings in order, landmarks, labels tied to inputs); ARIA only when needed.
- Every input has a visible label (not placeholder-only), clear error text linked to the field, and the error is announced.
- "Payment received" notifications use an ARIA live region (`role="status"`) so screen readers announce them, plus an optional sound and vibration, never sound alone.
- Alt text for meaningful images; the QR has a text alternative (name, type, amount) and the visible amount.
- Language set on the page (`lang="es-MX"` / `lang="en"`), and switched when the user toggles language.

**Motion**
- Animations are subtle and short; respect `prefers-reduced-motion` (replace motion with a simple fade or none).
- No flashing content (never more than 3 flashes per second).

**Testing before release**
- Automated: axe or Lighthouse accessibility score ≥ 90 (landing) and no critical axe issues in the app.
- Manual: keyboard-only pass, 200% zoom, screen reader smoke test (VoiceOver on iOS/macOS, TalkBack on Android), a pass in grayscale to check nothing depends on color.

## 5. Logo and name (temporary)

- Wordmark "BuzzQR" in Plus Jakarta Sans ExtraBold, Midnight on light backgrounds, white on dark. The "QR" can use Electric. No logo mark yet.
- A real logo is pending the final name; keep the name in one constant so it can change.
- Clear space around the wordmark: at least the height of the "B". Minimum size: 24 px tall on screen.
- Partner logos on the landing page (CoDi, Pey) sit in a "Powered by" row at equal height, in their original colors, on a white or Ice background.

## 6. UI basics

| Element | Spec |
|---|---|
| **Primary button** | Electric fill, white text, 48 px tall (min 44), radius 12 px, 16/600 label. Hover: slightly darker; focus: 3 px ring; disabled: 40% opacity plus clear label |
| **Secondary button** | White fill, 2 px Electric border, Electric text |
| **Inputs** | 48 px tall, 1.5 px `--border`, radius 10 px, visible label above, helper/error text below in `--text-muted` / `--error` with an icon |
| **QR card** | White card, radius 16 px, QR centered at ≥ 240 px on mobile (full-screen mode scales up), name and type underneath, amount in tabular figures |
| **Payment toast** | Emerald fill with Ink text, check icon, "Pago recibido · $150.00 MXN", `role="status"`, stays at least 6 s (pausable) |
| **Wallet buttons (mock)** | Follow Apple and Google badge guidelines for the real buttons later; the mock uses neutral black/white buttons with the wallet name |
| **Cards and spacing** | 8 px grid; page gutter 16 px mobile / 24+ px desktop; card radius 16 px; one level of soft shadow only |
| **Icons** | 24 px outline set, 2 px stroke, always paired with text for key actions |
| **Dark mode** | Use the dark tokens above; do not invert the QR |

## 7. Implementation notes

- Define the colors, type scale and spacing as **CSS variables (design tokens)** in `apps/web`, with light values on `:root`, dark values under `prefers-color-scheme: dark` and `[data-theme="dark"]`. No hard-coded hex values in components.
- Copy and product name come from the i18n files and config constant, not from components.
- Keep this file the source of truth; update it when the final name and logo are chosen.

## 8. Changelog and open items

- **v0.2:** cross-links to PRD and AGENTS.md; implementation tied to i18n and the product-name constant.
- **v0.1:** palette A chosen; typography (desktop and mobile), accessibility standard, UI basics.
- **Open:** final product name and logo; whether to self-host fonts; icon set choice; real Apple/Google Wallet button assets (post-MVP).
