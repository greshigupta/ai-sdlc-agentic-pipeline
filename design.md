# Snip Design System

Compact visual language inspired by a dark, minimal AI-chat landing aesthetic.

## Tokens

### Color

- `--bg`: `#08090d` (near-black page background)
- `--surface`: `#12141a` (primary card surface)
- `--surface-2`: `#171a22` (input shell / elevated surface)
- `--text`: `#f4f6fb` (primary text)
- `--muted`: `#9aa3b5` (secondary text)
- `--border`: `rgba(255,255,255,0.12)`
- `--success`: `#67f0be`
- `--error`: `#ff8f9a`

### Accent Gradient

- `--accent-gradient`: `radial-gradient(circle at 50% 10%, rgba(255,128,94,0.34), rgba(255,102,153,0.22) 32%, rgba(255,95,59,0.16) 48%, transparent 70%)`
- Use as soft hero glow behind the top section only.

### Typography

- Font stack: `"Inter", "Avenir Next", "Segoe UI", "Helvetica Neue", Arial, sans-serif`
- `--text-hero`: `clamp(2rem, 5vw, 3.3rem)` / 1.05 / 700
- `--text-sub`: `clamp(1rem, 2vw, 1.15rem)` / 1.6 / 400
- Body text: `0.95rem` / 1.5

### Spacing

- `--space-1`: `0.5rem`
- `--space-2`: `0.875rem`
- `--space-3`: `1.25rem`
- `--space-4`: `1.75rem`
- `--space-5`: `2.5rem`
- `--space-6`: `4rem`

### Radius

- `--radius-pill`: `999px` (chat-style input/button)
- `--radius-card`: `24px`
- `--radius-soft`: `14px`

### Borders, Shadow, Glow

- Border: `1px solid var(--border)`
- Card shadow: `0 20px 50px rgba(0,0,0,0.45)`
- Soft glow: `0 0 0 1px rgba(255,255,255,0.05), 0 14px 45px rgba(255,110,96,0.12)`

## Component Mapping

- Page header maps to hero: centered headline + muted subline + accent glow.
- URL form maps to chat input: large pill field with attached primary action.
- Success/error messages map to compact rounded notice chips.
- Links table maps to a rounded surface card with subtle borders and generous padding.