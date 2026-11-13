// Behavior for the demo page only: token values, copyable markup, sample data,
// and the few lines of script the interactive examples need.
import { columns, heatmap, line, segments, spark } from '../js/charts.js';

const token = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// Theme switch. The choice is kept for the next visit.
const root = document.documentElement;
function setTheme(choice) {
  root.dataset.theme = choice;
  for (const button of document.querySelectorAll('[data-theme-choice]')) button.setAttribute('aria-pressed', String(button.dataset.themeChoice === choice));
  try { localStorage.setItem('crab-theme', choice); } catch {}
  showSwatchValues();
}
document.addEventListener('click', (event) => {
  const choice = event.target.closest('[data-theme-choice]');
  if (choice) setTheme(choice.dataset.themeChoice);
});
matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => showSwatchValues());

// A color token holds light-dark(…); the probe resolves it for the current theme.
const probe = document.createElement('i');
probe.hidden = true;
document.body.append(probe);
const resolved = (name) => {
  probe.style.color = `var(${name})`;
  const value = getComputedStyle(probe).color;
  const [r, g, b, a] = value.match(/[\d.]+/g)?.map(Number) ?? [];
  if (a === undefined && b !== undefined) return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
  return value;
};

// Token values are read from the stylesheet, so this page cannot drift from it.
const swatchValues = [];
for (const group of document.querySelectorAll('[data-swatches]')) {
  for (const name of group.dataset.swatches.split(' ')) {
    const item = document.createElement('div');
    item.className = 'swatch';
    const chip = document.createElement('i');
    chip.style.background = `var(${name})`;
    const label = document.createElement('code');
    label.textContent = name;
    const value = document.createElement('span');
    swatchValues.push([name, value]);
    item.append(chip, label, value);
    group.append(item);
  }
}
function showSwatchValues() {
  for (const [name, value] of swatchValues) value.textContent = resolved(name);
}
for (const cell of document.querySelectorAll('[data-token]')) cell.textContent = token(cell.dataset.token);
let saved = 'dark';
try { saved = localStorage.getItem('crab-theme') ?? 'dark'; } catch {}
setTheme(saved);

// "Markup" under each example, taken from the page itself before scripts change it.
function dedent(source) {
  const lines = source.replace(/^\s*\n/, '').trimEnd().split('\n');
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return lines.map((l) => l.slice(indent)).join('\n');
}
for (const demo of document.querySelectorAll('.demo:not([data-nocode])')) {
  const details = document.createElement('details');
  details.className = 'markup';
  const summary = document.createElement('summary');
  summary.textContent = 'Markup';
  const pre = document.createElement('pre');
  const code = document.createElement('code');
  code.textContent = dedent(demo.innerHTML);
  pre.append(code);
  details.append(summary, pre);
  demo.append(details);
}

// Sample data: fixed numbers, so the page looks the same on every load.
const days = (count, end = new Date(Date.UTC(2026, 10, 10))) =>
  Array.from({ length: count }, (_, i) => new Date(end - (count - 1 - i) * 864e5).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }));
const visitors = [1210, 1340, 1295, 980, 1010, 1420, 1515, 1480, 1390, 1602, 1120, 1075, 1688, 1740, 1695, 1810, 1920, 1300, 1255, 1890, 2010, 2140, 1985, 2230, 1520, 1490, 2310, 2405, 2290, 2480];

line(document.getElementById('chart-visitors'), { name: 'Visitors per day, last 30 days', labels: days(30), series: [{ name: 'Visitors', values: visitors }], area: true });
line(document.getElementById('pattern-chart'), { name: 'Visitors per day', labels: days(30), series: [{ name: 'Visitors', values: visitors }], height: 189 });
line(document.getElementById('chart-mail'), {
  name: 'Email activity, last 14 days',
  labels: days(14),
  series: [
    { name: 'Delivered', values: [820, 910, 880, 400, 380, 950, 1020, 990, 1080, 1130, 520, 470, 1190, 1240] },
    { name: 'Opened', values: [410, 480, 455, 190, 170, 520, 575, 540, 610, 660, 260, 230, 700, 745] },
    { name: 'Clicked', values: [90, 120, 104, 40, 36, 131, 150, 139, 162, 181, 60, 52, 197, 214] },
  ],
});
columns(document.getElementById('chart-sent'), {
  name: 'Emails sent per day',
  labels: days(14),
  series: [{ name: 'Sent', values: [840, 925, 899, 412, 390, 968, 1041, 1012, 1101, 1150, 534, 481, 1214, 1262] }],
});
columns(document.getElementById('chart-sources'), {
  name: 'Visits by source per week',
  labels: ['W38', 'W39', 'W40', 'W41', 'W42', 'W43', 'W44', 'W45'],
  series: [
    { name: 'Direct', values: [4200, 4410, 4380, 4900, 5150, 5020, 5600, 5890] },
    { name: 'Search', values: [2100, 2260, 2400, 2380, 2710, 2950, 3100, 3320] },
    { name: 'Referral', values: [1300, 1180, 1520, 1610, 1490, 1730, 1820, 2050] },
    { name: 'Social', values: [600, 720, 540, 910, 780, 690, 1040, 980] },
  ],
});
heatmap(document.getElementById('chart-heat'), {
  name: 'Messages received by weekday and hour',
  rows: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  cols: Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0')),
  values: Array.from({ length: 7 }, (_, d) => Array.from({ length: 24 }, (_, h) => {
    const work = h >= 7 && h <= 18 ? Math.round(34 * Math.sin(((h - 7) / 11) * Math.PI) + ((d * 7 + h * 3) % 9)) : (d + h) % 4 === 0 ? 2 : 0;
    return d > 4 ? Math.round(work / 5) : work;
  })),
});
segments(document.getElementById('chart-devices'), [
  { name: 'Desktop', value: 27840 },
  { name: 'Mobile', value: 17120 },
  { name: 'Tablet', value: 3952 },
]);
for (const node of document.querySelectorAll('[data-spark]')) spark(node, node.dataset.spark.split(',').map(Number));

// Interactive examples
const toasts = document.querySelector('.toasts');
document.addEventListener('click', (event) => {
  const opener = event.target.closest('[data-dialog]');
  if (opener) document.getElementById(opener.dataset.dialog).showModal();

  const pressed = event.target.closest('.segmented > button, .button-group > [aria-pressed]');
  if (pressed) for (const button of pressed.parentElement.children) button.setAttribute('aria-pressed', String(button === pressed));

  const tab = event.target.closest('[role="tab"]');
  if (tab) selectTab(tab);

  const remove = event.target.closest('.chip button');
  if (remove) remove.closest('.chip').remove();

  const toaster = event.target.closest('[data-toast]');
  if (toaster) {
    const toast = document.createElement('div');
    toast.className = `toast ${toaster.dataset.toast}`;
    toast.append(toaster.dataset.message);
    const dismiss = document.createElement('button');
    dismiss.type = 'button';
    dismiss.className = 'quiet';
    dismiss.textContent = 'Dismiss';
    dismiss.addEventListener('click', () => toast.remove());
    toast.append(dismiss);
    toasts.append(toast);
    setTimeout(() => toast.remove(), 5000);
  }

  const sort = event.target.closest('#demo-sort .sort');
  if (sort) sortBy(sort.closest('th'));
});

function selectTab(tab) {
  for (const other of tab.parentElement.children) {
    const on = other === tab;
    other.setAttribute('aria-selected', String(on));
    other.tabIndex = on ? 0 : -1;
    document.getElementById(other.getAttribute('aria-controls')).hidden = !on;
  }
  tab.focus();
}
document.addEventListener('keydown', (event) => {
  const tab = event.target.closest?.('[role="tab"]');
  const next = tab && { ArrowRight: tab.nextElementSibling, ArrowLeft: tab.previousElementSibling }[event.key];
  if (next) selectTab(next);
});

function sortBy(header) {
  const table = header.closest('table');
  const index = [...header.parentElement.children].indexOf(header);
  const descending = header.getAttribute('aria-sort') === 'ascending';
  for (const other of header.parentElement.querySelectorAll('[aria-sort]')) other.setAttribute('aria-sort', 'none');
  header.setAttribute('aria-sort', descending ? 'descending' : 'ascending');
  const value = (row) => row.children[index].textContent.trim();
  const number = (text) => Number(text.replace(/[^0-9.-]/g, ''));
  const numeric = header.classList.contains('num');
  const rows = [...table.tBodies[0].rows].sort((a, b) => (numeric ? number(value(a)) - number(value(b)) : value(a).localeCompare(value(b))));
  table.tBodies[0].append(...(descending ? rows.reverse() : rows));
}

// On small screens the contents start closed and close after a choice.
const contents = document.querySelector('.shell-nav');
const small = matchMedia('(max-width: 860px)');
const syncContents = () => { contents.open = !small.matches; };
small.addEventListener('change', syncContents);
syncContents();
contents.addEventListener('click', (event) => { if (small.matches && event.target.closest('a')) contents.open = false; });
