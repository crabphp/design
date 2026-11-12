// Crab charts: small SVG renderers for css/charts.css. No dependencies.
//
//   import { line, columns, heatmap, segments, spark } from './charts.js';
//   line(figure, { labels: ['Mon', 'Tue'], series: [{ name: 'Visitors', values: [12, 30] }] });
//
// Every chart draws at its container's real width, redraws when that changes,
// shows values on hover and on arrow keys, and adds the same numbers as a table.
// Names and labels are untrusted data: they are only ever written as text.

const SVG = 'http://www.w3.org/2000/svg';

function svg(name, attrs = {}, parent) {
  const node = document.createElementNS(SVG, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  parent?.append(node);
  return node;
}

function html(name, props = {}, parent) {
  const node = Object.assign(document.createElement(name), props);
  parent?.append(node);
  return node;
}

const whole = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

/** 1,284 in full; 12.9K once the axis reaches ten thousand. */
export function formatNumber(value, axisMax = value) {
  return Math.abs(axisMax) >= 10000 ? compact.format(value) : whole.format(value);
}

/** Round axis steps from zero up to at least `max`: 0, 500, 1000, 1500. */
export function ticks(max, count = 4) {
  if (!(max > 0)) return [0, 1];
  const rough = max / count;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= rough);
  const out = [];
  for (let value = 0; value < max + step - 1e-9; value += step) out.push(+value.toFixed(10));
  return out;
}

const seriesClass = (series, index) => `c${series.color ?? index + 1}`;

// Shared frame: legend, plot with tooltip, data table, redraw on resize.
function mount(root, { series, labels, legend = 'stroke', format, draw }) {
  root.querySelectorAll(':scope > .legend, :scope > .chart-plot, :scope > .chart-data, :scope > .empty').forEach((n) => n.remove());
  root.classList.add('chart');

  if (!labels.length || !series.length) {
    html('p', { className: 'empty', textContent: 'No data for this range.' }, root);
    return { destroy() {} };
  }

  if (series.length > 1 && legend) {
    const list = html('ul', { className: 'legend' }, root);
    series.forEach((s, i) => {
      const item = html('li', {}, list);
      html('span', { className: `key ${legend === 'stroke' ? 'stroke ' : ''}${seriesClass(s, i)}` }, item);
      item.append(s.name);
    });
  }

  const plot = html('div', { className: 'chart-plot' }, root);
  const tip = html('div', { className: 'chart-tip', hidden: true }, plot);
  tip.setAttribute('role', 'status');

  const data = html('details', { className: 'chart-data' }, root);
  html('summary', { textContent: 'Data table' }, data);
  const table = html('table', { className: 'compact' }, html('div', { className: 'table-wrap' }, data));
  const head = html('tr', {}, html('thead', {}, table));
  html('th', { textContent: '' }, head);
  series.forEach((s) => html('th', { className: 'num', textContent: s.name }, head));
  const body = html('tbody', {}, table);
  labels.forEach((label, i) => {
    const row = html('tr', {}, body);
    html('td', { textContent: label }, row);
    series.forEach((s) => html('td', { className: 'num', textContent: format(s.values[i] ?? 0) }, row));
  });

  let width = 0;
  const render = () => {
    const next = Math.floor(plot.clientWidth);
    if (!next || next === width) return;
    width = next;
    plot.querySelector('svg')?.remove();
    tip.hidden = true;
    draw({ plot, tip, width });
  };
  const observer = new ResizeObserver(render);
  observer.observe(plot);
  render();
  return { destroy: () => observer.disconnect() };
}

// Fills the tooltip for one position and keeps it inside the plot.
function showTip(tip, plot, x, title, rows, keyClass = 'stroke') {
  tip.replaceChildren(html('p', { textContent: title }));
  for (const row of rows) {
    const line = html('div', {}, tip);
    if (row.className) html('span', { className: `key ${keyClass} ${row.className}` }, line);
    line.append(row.name);
    html('strong', { textContent: row.value }, line);
  }
  tip.hidden = false;
  const room = plot.scrollWidth - tip.offsetWidth;
  const left = x + 12 + tip.offsetWidth > plot.scrollWidth ? x - 12 - tip.offsetWidth : x + 12;
  tip.style.left = `${Math.max(0, Math.min(room, left))}px`;
}

// Pointer and arrow keys both pick a position along the x axis.
function pickable(root, count, indexAt, select) {
  let current = -1;
  const set = (index) => { current = index; select(index); };
  root.setAttribute('tabindex', '0');
  root.addEventListener('pointermove', (event) => set(indexAt(event)));
  root.addEventListener('pointerleave', () => { if (document.activeElement !== root) set(-1); });
  root.addEventListener('blur', () => set(-1));
  root.addEventListener('focus', () => { if (current < 0 && root.matches(':focus-visible')) set(count - 1); });
  root.addEventListener('keydown', (event) => {
    const move = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
    if (event.key === 'Escape') return set(-1);
    if (event.key === 'Home') { event.preventDefault(); return set(0); }
    if (event.key === 'End') { event.preventDefault(); return set(count - 1); }
    if (!move) return;
    event.preventDefault();
    set(Math.max(0, Math.min(count - 1, (current < 0 ? count - 1 : current) + move)));
  });
}

function frame({ plot, width, height, labels, max, format, name, charWidth, rightRoom = 0 }) {
  const axis = ticks(max);
  const top = axis.at(-1);
  const left = Math.ceil(Math.max(...axis.map((t) => format(t, top).length)) * charWidth + charWidth);
  const box = { left, right: width - rightRoom - 4, top: 10, bottom: height - 26 };
  const root = svg('svg', { width, height, viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': name }, plot);
  const y = (value) => box.bottom - (value / top) * (box.bottom - box.top);
  for (const tick of axis) {
    svg('line', { class: tick ? 'grid' : 'axis', x1: box.left, x2: box.right, y1: Math.round(y(tick)) + .5, y2: Math.round(y(tick)) + .5 }, root);
    svg('text', { x: box.left - charWidth, y: y(tick) + 4, 'text-anchor': 'end' }, root).textContent = format(tick, top);
  }
  return { root, box, y, top };
}

// X labels: as many as fit without touching, evenly spaced. A line chart
// anchors its first and last label to the ends of the plot.
function xLabels(root, labels, x, box, height, charWidth, anchorEnds) {
  const last = labels.length - 1;
  const anchor = (i) => (!anchorEnds || last === 0 ? 'middle' : i === 0 ? 'start' : i === last ? 'end' : 'middle');
  const extent = (i) => {
    const width = labels[i].length * charWidth;
    const start = x(i) - { start: 0, middle: width / 2, end: width }[anchor(i)];
    return [start, start + width];
  };
  const widest = Math.max(...labels.map((l) => l.length)) * charWidth + charWidth * 2;
  const every = Math.max(1, Math.ceil((labels.length * widest) / (box.right - box.left)));
  const picked = labels.map((_, i) => i).filter((i) => i % every === 0);
  if (anchorEnds && picked.at(-1) !== last) picked.push(last);
  const shown = [];
  for (const i of picked) {
    const touches = shown.length && extent(i)[0] < extent(shown.at(-1))[1] + charWidth;
    // The last label wins over the one before it; otherwise the later one is dropped.
    if (touches && i === last && shown.length > 1) shown.pop();
    else if (touches) continue;
    shown.push(i);
  }
  for (const i of shown) svg('text', { x: x(i), y: height - 6, 'text-anchor': anchor(i) }, root).textContent = labels[i];
}

const charWidthOf = (node) => parseFloat(getComputedStyle(node).fontSize) * .6;

/**
 * Change over time. One 2px line per series, at most four for end labels.
 * options: { labels, series: [{ name, values, color? }], height?, area?, format?, name? }
 */
export function line(root, { labels = [], series = [], height = 231, area = false, format = formatNumber, name = 'Line chart' } = {}) {
  // Every series gets one value per label; a missing value is drawn as zero.
  series = series.map((s) => ({ ...s, values: labels.map((_, i) => s.values[i] ?? 0) }));
  return mount(root, {
    labels, series, legend: 'stroke', format,
    draw({ plot, tip, width }) {
      const charWidth = charWidthOf(plot);
      const max = Math.max(...series.flatMap((s) => s.values));
      const direct = series.length > 1 && series.length <= 4;
      const rightRoom = direct ? Math.max(...series.map((s) => s.name.length)) * charWidth + charWidth * 2 : 6;
      const { root: chart, box, y, top } = frame({ plot, width, height, labels, max, format, name, charWidth, rightRoom });
      const x = (i) => (labels.length === 1 ? (box.left + box.right) / 2 : box.left + (i / (labels.length - 1)) * (box.right - box.left));
      xLabels(chart, labels, x, box, height, charWidth, true);

      const ends = series.map((s) => y(s.values.at(-1)));
      const crowded = ends.some((a, i) => ends.some((b, j) => i < j && Math.abs(a - b) < 16));
      series.forEach((s, si) => {
        const group = svg('g', { class: seriesClass(s, si) }, chart);
        const points = s.values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
        if (area && series.length === 1) svg('path', { class: 'area', d: `M${x(0)},${box.bottom}L${points.join('L')}L${x(labels.length - 1)},${box.bottom}Z` }, group);
        svg('path', { class: 'line', d: `M${points.join('L')}` }, group);
        svg('circle', { class: 'dot', cx: x(labels.length - 1), cy: ends[si], r: 5 }, group);
        if (direct && !crowded) svg('text', { class: 'label', x: box.right + charWidth * 1.5, y: ends[si] + 4 }, chart).textContent = s.name;
      });

      const cross = svg('line', { class: 'cross', y1: box.top, y2: box.bottom, hidden: '' }, chart);
      const dots = series.map((s, si) => svg('circle', { class: `dot ${seriesClass(s, si)}`, r: 5, hidden: '' }, chart));
      pickable(chart, labels.length,
        (event) => {
          const ratio = (event.clientX - chart.getBoundingClientRect().left - box.left) / (box.right - box.left);
          return Math.max(0, Math.min(labels.length - 1, Math.round(ratio * (labels.length - 1))));
        },
        (index) => {
          const on = index >= 0;
          cross.toggleAttribute('hidden', !on);
          dots.forEach((dot) => dot.toggleAttribute('hidden', !on));
          tip.hidden = !on;
          if (!on) return;
          const px = Math.round(x(index)) + .5;
          cross.setAttribute('x1', px);
          cross.setAttribute('x2', px);
          dots.forEach((dot, si) => { dot.setAttribute('cx', x(index)); dot.setAttribute('cy', y(series[si].values[index])); });
          showTip(tip, plot, x(index), labels[index], series.map((s, si) => ({ name: s.name, value: format(s.values[index], top), className: seriesClass(s, si) })));
        });
    },
  });
}

/**
 * Amounts per category or period. One series, or several stacked into a total.
 * options: { labels, series: [{ name, values, color? }], height?, format?, name? }
 */
export function columns(root, { labels = [], series = [], height = 231, format = formatNumber, name = 'Bar chart' } = {}) {
  return mount(root, {
    labels, series, legend: 'block', format,
    draw({ plot, tip, width }) {
      const charWidth = charWidthOf(plot);
      const totals = labels.map((_, i) => series.reduce((sum, s) => sum + (s.values[i] ?? 0), 0));
      const { root: chart, box, y, top } = frame({ plot, width, height, labels, max: Math.max(...totals), format, name, charWidth });
      const slot = (box.right - box.left) / labels.length;
      const thick = Math.max(2, Math.min(24, Math.floor(slot - 2)));
      const x = (i) => box.left + slot * i + slot / 2;
      xLabels(chart, labels, x, box, height, charWidth, false);

      const bands = labels.map((_, i) => svg('rect', { class: 'band', x: box.left + slot * i, y: box.top, width: slot, height: box.bottom - box.top }, chart));
      labels.forEach((_, i) => {
        let base = 0;
        series.forEach((s, si) => {
          const value = s.values[i] ?? 0;
          if (value <= 0) return;
          const y0 = y(base), y1 = y(base + value);
          base += value;
          // A 2px gap in the background colour separates stacked segments.
          const gap = si > 0 && y0 - y1 > 3 ? 2 : 0;
          svg('rect', { class: `col ${seriesClass(s, si)}`, x: Math.round(x(i) - thick / 2), y: y1, width: thick, height: Math.max(1, y0 - y1 - gap) }, chart);
        });
      });

      pickable(chart, labels.length,
        (event) => Math.max(0, Math.min(labels.length - 1, Math.floor((event.clientX - chart.getBoundingClientRect().left - box.left) / slot))),
        (index) => {
          bands.forEach((band, i) => band.classList.toggle('is-active', i === index));
          tip.hidden = index < 0;
          if (index < 0) return;
          const rows = series.map((s, si) => ({ name: s.name, value: format(s.values[index] ?? 0, top), className: seriesClass(s, si) }));
          if (series.length > 1) rows.push({ name: 'Total', value: format(totals[index], top) });
          showTip(tip, plot, x(index), labels[index], rows, '');
        });
    },
  });
}

/**
 * Magnitude across two dimensions, in five steps of one hue.
 * options: { rows, cols, values: number[row][col], format?, name? }
 */
export function heatmap(root, { rows = [], cols = [], values = [], format = formatNumber, name = 'Heatmap' } = {}) {
  const series = cols.map((col, c) => ({ name: col, values: rows.map((_, r) => values[r]?.[c] ?? 0) }));
  const max = Math.max(1, ...values.flat());
  const step = (value) => (value <= 0 ? 0 : Math.max(1, Math.ceil((value / max) * 5)));
  const chart = mount(root, {
    labels: rows, series, legend: false, format,
    draw({ plot, tip, width }) {
      const charWidth = charWidthOf(plot);
      const left = Math.max(...rows.map((r) => r.length)) * charWidth + charWidth;
      // Cells never get smaller than a line of text; a narrow screen scrolls instead.
      const size = Math.max(Math.ceil(charWidth / .6) + 6, Math.min(28, Math.floor((width - left) / cols.length)));
      const height = rows.length * size + 26;
      const full = Math.max(width, Math.ceil(left + cols.length * size));
      plot.classList.add('scrolls');
      tip.style.left = '0';
      const node = svg('svg', { width: full, height, viewBox: `0 0 ${full} ${height}`, role: 'img', 'aria-label': name }, plot);
      rows.forEach((row, r) => { svg('text', { x: left - charWidth, y: r * size + size / 2 + 4, 'text-anchor': 'end' }, node).textContent = row; });
      const every = Math.max(1, Math.ceil((Math.max(...cols.map((c) => c.length)) * charWidth + charWidth) / size));
      cols.forEach((col, c) => { if (c % every === 0) svg('text', { x: left + c * size + size / 2, y: height - 6, 'text-anchor': 'middle' }, node).textContent = col; });
      const cells = rows.map((_, r) => cols.map((_, c) => svg('rect', { class: `cell h${step(values[r]?.[c] ?? 0)}`, x: left + c * size, y: r * size, width: size, height: size }, node)));

      let at = [-1, -1];
      const select = (r, c) => {
        cells[at[0]]?.[at[1]]?.classList.remove('is-active');
        at = [r, c];
        tip.hidden = r < 0;
        if (r < 0) return;
        cells[r][c].classList.add('is-active');
        // Drawn last so its outline is not covered by its neighbours.
        node.append(cells[r][c]);
        showTip(tip, plot, left + c * size + size / 2, `${rows[r]} ${cols[c]}`, [{ name: '', value: format(values[r]?.[c] ?? 0) }]);
        tip.style.top = `${Math.max(0, r * size - tip.offsetHeight - 4)}px`;
      };
      node.setAttribute('tabindex', '0');
      node.addEventListener('pointermove', (event) => {
        const rect = node.getBoundingClientRect();
        const c = Math.floor((event.clientX - rect.left - left) / size), r = Math.floor((event.clientY - rect.top) / size);
        if (r >= 0 && r < rows.length && c >= 0 && c < cols.length) select(r, c); else select(-1, -1);
      });
      node.addEventListener('pointerleave', () => { if (document.activeElement !== node) select(-1, -1); });
      node.addEventListener('blur', () => select(-1, -1));
      node.addEventListener('keydown', (event) => {
        const move = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[event.key];
        if (event.key === 'Escape') return select(-1, -1);
        if (!move) return;
        event.preventDefault();
        const [r, c] = at[0] < 0 ? [0, 0] : [at[0] + move[0], at[1] + move[1]];
        select(Math.max(0, Math.min(rows.length - 1, r)), Math.max(0, Math.min(cols.length - 1, c)));
      });
    },
  });

  const plot = root.querySelector(':scope > .chart-plot');
  if (plot) {
    const scale = html('p', { className: 'scale' });
    scale.append('less');
    for (let i = 0; i <= 5; i++) html('i', { className: `h${i}` }, scale);
    scale.append('more');
    plot.after(scale);
  }
  return chart;
}

/**
 * One whole split into parts: a thin bar, with names and shares in the legend.
 * parts: [{ name, value, color? }]
 */
export function segments(root, parts = [], { format = formatNumber } = {}) {
  root.querySelectorAll(':scope > .segments, :scope > .legend').forEach((n) => n.remove());
  const total = parts.reduce((sum, part) => sum + part.value, 0);
  const share = (part) => `${total > 0 ? Math.round((part.value / total) * 100) : 0}%`;
  const bar = html('div', { className: 'segments' }, root);
  bar.setAttribute('role', 'img');
  bar.setAttribute('aria-label', parts.map((part) => `${part.name} ${share(part)}`).join(', '));
  const list = html('ul', { className: 'legend' }, root);
  parts.forEach((part, i) => {
    if (part.value > 0) html('span', { className: seriesClass(part, i), title: `${part.name}: ${format(part.value)} (${share(part)})` }, bar).style.setProperty('--v', part.value);
    const item = html('li', {}, list);
    html('span', { className: `key ${seriesClass(part, i)}` }, item);
    item.append(part.name, ' ');
    html('strong', { textContent: share(part) }, item);
  });
}

/** A trend beside a number. Decorative: the number next to it carries the value. */
export function spark(root, values = []) {
  const width = 100, height = 21, pad = 3;
  const min = Math.min(...values), span = Math.max(...values) - min || 1;
  const points = values.map((v, i) => [pad + (i / Math.max(1, values.length - 1)) * (width - pad * 2), height - pad - ((v - min) / span) * (height - pad * 2)]);
  const node = svg('svg', { class: 'spark', viewBox: `0 0 ${width} ${height}`, preserveAspectRatio: 'none', 'aria-hidden': 'true' });
  if (points.length) {
    svg('path', { class: 'line', d: `M${points.map((p) => p.map((n) => n.toFixed(1)).join(',')).join('L')}`, 'vector-effect': 'non-scaling-stroke' }, node);
    const [x, y] = points.at(-1);
    svg('rect', { class: 'dot', x: x - 2, y: y - 2, width: 4, height: 4 }, node);
  }
  root.replaceChildren(node);
}
