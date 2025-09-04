## Design System Overview

### Typography
- Headings are standardized via base layer:
  - h1: 2xl/3xl, extrabold, tracking-tight, `text-slate-900`
  - h2: xl/2xl, bold, tracking-tight, `text-slate-900`
  - h3: lg, semibold, `text-slate-900`
- Body: default Tailwind sizing with `text-slate-700`/`text-slate-600` for secondary text.

### Colors
- Primary: Blue → Indigo gradients for primary actions and hero headers
  - From `from-blue-600` to `to-indigo-600`
- Surfaces: `bg-white/95` with `backdrop-blur`
- Borders: `border-slate-100`
- Text: `text-slate-900` headings, `text-slate-700/600` body
  
### Components
- Containers
  - `.app-container`: responsive page container
  - `.section`: vertical rhythm wrapper with `space-y-6`
- Cards
  - `.card`, `.card-header`, `.card-body`
- Buttons
  - `.btn-primary`: gradient primary CTA
- Inputs
  - `.input`: text inputs with consistent focus ring
  - `.select`: select inputs with consistent focus ring
- Chips
  - `.chip`: pill for statuses and categories

### Layout Utilities
- `.stat-grid`: 1/2/4 col grid for KPI cards
- `.dashboard-grid`: 1/12 col grid for main panels
- `.page-header`: responsive header layout

### Accessibility
- Minimum 4.5:1 contrast for text on surfaces
- Focus-visible via Tailwind ring utilities on `.input`, `.select`, and interactive elements

### Patterns
- Sidebar: fixed at `w-72`, content offset with `lg:pl-72`
- Header: sticky with subtle blur and border, aligns with `.app-container`
- Content: cards follow uniform padding and spacing

### Responsive Rules
- Mobile-first stacking, then `md` and `lg` grids
- KPI cards use `.stat-grid`
- Tables and detail grids collapse to single column at smaller widths

### Usage
- Prefer semantic elements and rely on the provided utility classes from `src/index.css` for consistent spacing and visual hierarchy.


