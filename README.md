# Crab design system

Design tokens, components and charts for CrabPHP applications. It carries the look of the Crab site into application UI: one typeface, one size, a dark page, amber for what you can act on.

It is plain CSS on semantic HTML. There is no build step and no dependency, so the same markup works in a React dashboard, an Arc template or a static page.

## See it

```sh
npm run dev
```

Open <http://127.0.0.1:5174>. The page shows every token, component and chart, with the markup to copy under each example, and three assembled screens: analytics, a mailbox and settings.

## Use it

Link the whole system:

```html
<link rel="stylesheet" href="css/crab.css">
```

Or take only the layers you need, in this order:

```html
<link rel="stylesheet" href="css/tokens.css">
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/components.css">
<link rel="stylesheet" href="css/charts.css">
```

With a bundler:

```js
import '@crabphp/design';                       // css/crab.css
import { line, columns } from '@crabphp/design/charts.js';
```

Keep `fonts/` next to `css/`: `base.css` loads JetBrains Mono from `../fonts/`.

Then write HTML. Plain elements are already styled; components are classes:

```html
<div class="field">
  <label for="domain">Domain</label>
  <input id="domain" type="text">
</div>
<button class="solid">Create site</button>
```

## Charts

`js/charts.js` is an optional ES module that draws SVG charts styled by `charts.css`:

```js
import { line } from './js/charts.js';

line(document.querySelector('#visitors'), {
  labels: ['Mon', 'Tue', 'Wed'],
  series: [{ name: 'Visitors', values: [120, 180, 150] }],
});
```

`line`, `columns` (single or stacked) and `heatmap` redraw at the container's width, show values on hover and arrow keys, and add a data table. `segments` draws one whole split into parts; `spark` draws a trend beside a number. Each call returns `{ destroy() }` where it observes size.

## Files

```text
css/tokens.css       every value, as CSS custom properties
css/base.css         fonts, reset, plain elements, form controls
css/components.css   layout, navigation, forms, data, feedback
css/charts.css       chart marks, legend, tooltip
css/crab.css         imports the four above
js/charts.js         optional chart renderers
fonts/               JetBrains Mono (OFL)
index.html, demo/    the demo page; not part of the system
design.md            the rules, and why
```

## Rules

`design.md` is the source of truth. Read it before adding a colour, a size or a component.

```sh
npm test
```

checks that every CSS variable in use is defined in `tokens.css`, that no component holds a raw colour, and that every class used on the demo page exists.

## Browser support

Current Chrome, Firefox and Safari. The menu uses the Popover API with CSS anchor positioning; where anchor positioning is missing the menu still opens, centred.

## Licence

MIT. JetBrains Mono is licensed under the SIL Open Font License; see `fonts/OFL.txt`.
