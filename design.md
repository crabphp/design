# Crab design system

This document is the source of truth for how CrabPHP applications look and behave. The CSS in `css/` implements it; `index.html` shows every part of it.

It grew out of the Crab site's `design.md`. The site reads like a plain text file in a terminal: one font, one size, a single column. Applications keep that and add what a text file never needed: controls, data, charts and feedback.

## Direction

- One typeface (JetBrains Mono), one size, one line height, two weights.
- A dark page by default (a light theme is available), text at four strengths, amber for what you can act on.
- Headings are uppercase bold at body size, prefixed with `#`, `##`, `###`.
- Square corners. No shadows, gradients, icons or images. Hierarchy comes from words, weight, whitespace and thin rules.
- Meaning is always in words. Colour helps you scan; it never carries a state on its own.
- Semantic HTML first. Native elements (`dialog`, `details`, `popover`, `progress`) do the behaviour, so most components need no JavaScript.

## Layers

| File | What it holds | Depends on |
|---|---|---|
| `css/tokens.css` | Every value, as CSS custom properties | nothing |
| `css/base.css` | Fonts, reset, plain HTML elements, form controls | tokens |
| `css/components.css` | Layout, navigation, forms, data, feedback | tokens, base |
| `css/charts.css` | Chart marks, legend, tooltip | tokens, base |
| `css/crab.css` | Imports all four | |
| `js/charts.js` | Optional SVG chart renderers | charts.css |

## Themes

Dark is the default and the site's look. A light theme is chosen with `data-theme` on `<html>` or on any subtree:

| Attribute | Theme |
|---|---|
| none, or `data-theme="dark"` | dark |
| `data-theme="light"` | light |
| `data-theme="auto"` | follows `prefers-color-scheme` |

Every colour token is written `light-dark(light, dark)` and resolves through `color-scheme`, which the attribute sets. Components never know which theme is on. The only token that is not a colour is `--icon-invert`, which tells native icons (the date picker) whether to invert.

The light values are not a mechanical flip. Each one was chosen and measured on `#fbfbf9`:

- Text alphas are raised (`--muted` .7, `--faint` .6) so `--faint` still reaches AA (4.9:1). `--line-strong` is .46 to keep 3:1.
- `--amber` becomes `#8f6500`. The dark amber would be 1.6:1 on a light page; this one is 5:1 as text and as the background of a `.solid` button.
- Status and code colours are darker versions of the same hues, each at least 4.8:1.
- Series colours keep their hues and order, darkened to at least 3.6:1. Under protanopia and deuteranopia, neighbours stay as far apart as in the dark palette.
- `--seq-*` runs from pale to dark, so "more" is still the stronger mark.

## Tokens

Values below are the dark theme's; the light value is the first argument of each `light-dark()` in `tokens.css`.

The first eleven names are the site's own and keep their (dark) values, so the site and existing apps can adopt `tokens.css` without renaming anything.

### Colour

```css
--bg: #111111;
--surface: rgba(255, 255, 255, .045);       /* code blocks, read-only regions */
--surface-hover: rgba(255, 255, 255, .08);  /* hovered or selected row */
--overlay: rgba(0, 0, 0, .72);              /* behind a dialog */

--strong: #ffffff;                  /* headings, values, code */
--text: rgba(255, 255, 255, .88);   /* body */
--muted: rgba(255, 255, 255, .62);  /* descriptions */
--faint: rgba(255, 255, 255, .5);   /* metadata, marks, placeholders */

--line: rgba(255, 255, 255, .14);         /* table grids, dividers */
--line-strong: rgba(255, 255, 255, .36);  /* control boundaries */

--amber: #f5b800;                   /* links, actions, current item, selection, focus */
--amber-wash: rgba(245, 184, 0, .14);

--ok: #5ecc71;  --warn: #ffa359;  --danger: #ff678d;  --info: #68cdf2;
```

- `--faint` is the lowest opacity allowed for text; it keeps contrast at or above WCAG AA on `--bg`.
- `--line` is for rules you read along. `--line-strong` is for the edge of something you interact with: it reaches 3:1 against `--bg`, which an input's boundary needs.
- The four status colours come from the site's code palette, so no new hue was introduced. They mark a word (`● Delivered`, a note's rule, an invalid input's border). Body text never takes a status colour, except an `.error` line and a `.danger` button, which also say what they are.
- `--code-*` is the syntax palette, based on Pierre Dark, used by `.highlights` only.

### Chart colour

```css
--chart-1: #ba8b05;  /* amber */    --chart-5: #3dae54;  /* green */
--chart-2: #37a1c5;  /* cyan */     --chart-6: #9865f5;  /* purple */
--chart-3: #c7701d;  /* orange */   --chart-7: #d6416b;  /* pink */
--chart-4: #cb5ee0;  /* magenta */  --chart-other: #6b6b6b;
--seq-1 … --seq-5: #3c2b00, #5c4301, #7e5d03, #a27907, #c89501;
```

The series colours are the same seven code hues, stepped down in lightness so a filled bar does not glare on a dark page. The order is fixed and was chosen by measuring: every neighbouring pair stays clearly apart under protanopia and deuteranopia (worst pair ΔE 20, target 8), and every colour has at least 3:1 contrast on `--bg`.

- Assign colours in order: the first series is `--chart-1`, the second `--chart-2`. Never cycle, reorder or invent an eighth; fold the rest into "Other" with `--chart-other`.
- A colour follows the thing it names. Filtering a chart must not repaint the series that remain.
- `--chart-1` and `--chart-3` (amber and orange) are close. They are never neighbours in a line or stacked chart, but do not rely on telling them apart in a scatter plot.
- `--seq-*` is one hue from low to high, for magnitude (a heatmap). Zero uses `--surface`.
- Status colours are not series colours. A series that *means* good or bad may use `--ok` and `--danger`; "series 4" may not.

### Type, space and layout

```css
--font: "JetBrains Mono", ui-monospace, monospace;
--size: 13px;     /* 14px below 560px */
--lh: 21px;       /* 22px below 560px */
--half: calc(var(--lh) / 2);
--gap: 2ch;
--measure: 680px; --wide: 1120px;
--nav: 22ch;      --rail: 24ch;   --gutter: 6ch;
--pad-x: 40px;    --pad-y: 40px;  /* 16px and 24px below 560px */
--control: calc(var(--lh) * 1.25);
--touch: 44px;    /* tap area of a text button on touch screens */
```

There is no type scale and no spacing scale. Vertical space is counted in lines (`--lh`, `--half`) and horizontal space in characters (`ch`), which is what keeps every screen on one grid.

## Rhythm

- `1 × --lh` after paragraphs, lists, code blocks, tables, fields and components.
- `2 × --lh` before `##` and deeper headings.
- `3 × --lh` between page sections and under the header.
- A control is 1.25 lines tall. A field (label, a quarter line, control) is 2.5 lines.
- Table cells have half a line of vertical padding and `2ch` horizontal.

Breakpoints: `560px` (phone type and padding), `860px` (the navigation column becomes a bar), `1280px` (room for a third column). Touch sizing (36px controls, 44px tap areas, 16px input text) applies below `860px` and on any coarse pointer, so a tablet in landscape or a touch laptop gets it too.

## Components

The page `index.html` shows each one with its markup. In short:

**Layout** `.page` (one column, `.wide` for applications) · `.shell` with `.shell-nav` and `.shell-main` (navigation column plus content) · `.split` (list beside detail) · `.cols` (equal columns that wrap) · `.toolbar` · `.actions` · `.site-header` · `.wordmark` · `.site-footer`

**Navigation** `.nav-list` · `.tabs` · `.segmented` · `.button-group` · `.breadcrumb` · `.pagination` · `.pager`

**Actions** `button` and `.button` are bracketed amber text. Modifiers: `.solid` (the one main action of a view), `.quiet` (secondary), `.danger` (destructive), `.block` (full width). `.button-group` joins buttons into one bordered strip: a choice of one with `aria-pressed` (the theme switch), or a few related actions. `.menu` is a native popover, anchored below its button; where anchor positioning is not supported it opens centred.

**Forms** `.field` with `label`, a control and optional `small` help · `.hint` · `.error` with `aria-invalid="true"` · `.check` for a checkbox, radio or switch with its label · `.input-group` and `.addon` · `.form-grid` · `.chips` and `.chip`. Checkboxes, radios and switches (`role="switch"`) are drawn as text: `[x]`, `(*)`, `[ on]`.

**Data** `table` (grid) with `.plain`, `.compact`, `.fixed`, `.hover`, sortable headers (`aria-sort` plus `.sort`), selected rows (`aria-selected`) · `.table-wrap` · `.defs` · `.stats` and `.stat` with `.delta` · `.badge` · `.count` · `.avatar` · `.bar` · `.rows` and `.row` · `.empty` · `progress` and `meter`

**Feedback** `.note` (`.ok`, `.warn`, `.danger`, `.info`) · `.toasts` and `.toast` · `dialog` · `.spinner` · `[data-tip]`

**Charts** `.chart` figure with `.legend`, `.chart-plot`, `.chart-tip` and `.chart-data` · `.segments` · `.spark` · marks `.line`, `.area`, `.dot`, `.col`, `.cell`

State is carried by ARIA attributes, not extra classes: `aria-current`, `aria-selected`, `aria-pressed`, `aria-sort`, `aria-invalid`, `disabled`. Styling the attribute means a component cannot look selected without being announced as selected.

### Rules of use

- One `.solid` button per view. Everything else is bracketed text.
- A `.danger` action asks for confirmation in a `dialog` that names what will be lost.
- A `.note` or `.toast` starts with the word that says what it is: "Saved.", "Error.".
- A `.delta` names what it is compared with ("vs last week"). Add `.invert` where up is bad.
- No cards. Group with a heading and whitespace; separate with a `--line` rule.
- Add a component only when the same structure appears in more than one place. Until then it lives in the application.

## Charts

- Pick the form by the job: change over time is a line, amounts per period are columns, named things compared are a table with a `.bar`, magnitude across two dimensions is a heatmap, parts of one whole are `.segments`. A single number is a `.stat`, not a chart.
- One y axis, starting at zero. Two measures of different scale get two charts.
- Lines are 2px. Columns are at most 24px wide and square, since nothing in this system is rounded. Stacked parts are separated by a 2px gap in the page colour, not an outline.
- Grid lines are `--line`; the baseline is `--line-strong`. Axis text is `--faint`.
- Two or more series always have a legend. Up to four also get a label at the end of the line. Labels and legends stay in text colours; only the mark beside them is coloured.
- Every chart shows values on hover and on the arrow keys, and offers the same numbers as a table underneath. The tooltip adds convenience; nothing is only in the tooltip.
- A sparkline sits beside the number it explains and is hidden from screen readers.

`js/charts.js` implements these rules for `line`, `columns`, `heatmap`, `segments` and `spark`. It is optional: the CSS classes style any SVG, so an application may draw its own.

## Accessibility

- Every page has a skip link to `#main` and exactly one `h1`.
- Focus is a 2px amber outline, offset 4px (inside controls: on the border).
- Below `860px` and on coarse pointers, text buttons and disclosures have a 44px tap area, inputs and solid buttons are 36px tall, and inputs use 16px text so iOS does not zoom.
- Tables, code and wide charts scroll inside their own box; the page never scrolls sideways.
- Motion (smooth scrolling, cursor blink, spinner) only runs under `prefers-reduced-motion: no-preference`.
- Decorative marks (`#`, `[`, `]`, `>`, `●`) are generated content with empty alternative text, so screen readers skip them. Marks that carry meaning get words instead: a `.delta` is read as "up", "down" or "unchanged".
- `[data-tip]` is a hint, not a label: screen readers do not reliably read it and Escape cannot close it. The target must have its own accessible name.
- Every theme meets the same contrast: `--faint` at least 4.5:1, control boundaries and chart marks at least 3:1.

## Content voice

Direct, calm and specific. Short sentences. Say what happened and what to do next. No hype. Labels are sentence case; headings are uppercased by the stylesheet, not typed that way.

## Changing the system

- Update this document before adding a colour, a size or a layout pattern.
- A new token goes in `tokens.css` and nowhere else; components never hold a raw colour.
- A new colour token needs both values, `light-dark(light, dark)`, each measured on its own page.
- A new series colour or a reordered palette must be measured for colour-blind separation before it ships.
- `npm test` checks that every variable used is defined, every colour has both themes, nothing outside `tokens.css` assumes a dark page, and every class on the demo page or added by `charts.js` exists.

## Not here yet

- Cua, the site's mascot, and the docs layout (`.docs`, `.toc`) stay in the site's stylesheet.
- React or Arc wrappers. The markup is plain HTML, so both can use the classes directly.
