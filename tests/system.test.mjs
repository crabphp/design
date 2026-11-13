import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const tokens = read('css/tokens.css');
const layers = { 'base.css': read('css/base.css'), 'components.css': read('css/components.css'), 'charts.css': read('css/charts.css') };
const demoCss = read('demo/demo.css');
const withoutComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

const defined = new Set([...tokens.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));

test('every variable in use is defined in tokens.css', () => {
  // Set per element by a component or by inline style, not global tokens.
  const local = new Set(['--c', '--v', '--bar', '--col', '--split', '--term', '--content']);
  for (const [name, css] of Object.entries({ ...layers, 'tokens.css': tokens, 'demo.css': demoCss })) {
    for (const [, variable] of withoutComments(css).matchAll(/var\((--[\w-]+)/g)) {
      assert.ok(defined.has(variable) || local.has(variable), `${name} uses ${variable}, which tokens.css does not define`);
    }
  }
});

test('colors live in tokens.css only', () => {
  for (const [name, css] of Object.entries(layers)) {
    const raw = withoutComments(css).match(/#[0-9a-f]{3,8}\b|rgba?\(/gi) ?? [];
    assert.deepEqual(raw, [], `${name} holds a raw color`);
  }
});

test('every color token has a light and a dark value', () => {
  const root = withoutComments(tokens).match(/:root\s*\{([\s\S]*?)\n\}/)[1];
  for (const [, name, value] of root.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    if (!/#|rgba?\(/.test(value)) continue;
    assert.match(value, /^light-dark\(/, `${name} has one value; give it light-dark(light, dark)`);
  }
});

test('nothing outside tokens.css assumes a dark page', () => {
  for (const [name, css] of Object.entries(layers)) {
    const body = withoutComments(css);
    assert.doesNotMatch(body, /url\("data:/, `${name} draws an image that cannot follow the theme`);
    assert.doesNotMatch(body, /invert\(\s*[\d.]/, `${name} inverts by a fixed amount; use --icon-invert`);
    assert.doesNotMatch(body, /color-scheme/, `${name} sets color-scheme; only tokens.css does`);
  }
});

test('the site tokens keep their names and values', () => {
  const site = {
    '--bg': '#111111', '--text': 'rgba(255, 255, 255, .88)', '--strong': '#ffffff', '--amber': '#f5b800',
    '--muted': 'rgba(255, 255, 255, .62)', '--faint': 'rgba(255, 255, 255, .5)', '--line': 'rgba(255, 255, 255, .14)',
    '--surface': 'rgba(255, 255, 255, .045)', '--size': '13px', '--lh': '21px', '--measure': '680px', '--pad-x': '40px',
  };
  for (const [name, value] of Object.entries(site)) {
    const found = tokens.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1].trim();
    // The site is dark: compare the dark half of light-dark(light, dark).
    const dark = found?.match(/^light-dark\((?:rgba\([^)]*\)|[^,]+),\s*(.+)\)$/)?.[1] ?? found;
    assert.equal(dark, value, name);
  }
});

test('every class on the demo page exists in a stylesheet', () => {
  const css = Object.values(layers).join('\n') + demoCss;
  const known = new Set([...withoutComments(css).matchAll(/\.(-?[a-zA-Z_][\w-]*)/g)].map((m) => m[1]));
  // Hooks for the demo script, with no styles of their own.
  const hooks = new Set(['demo-form', 'demo']);
  const used = new Set([...read('index.html').matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/)));
  for (const name of used) assert.ok(known.has(name) || hooks.has(name), `index.html uses .${name}, which no stylesheet defines`);
});

test('every class charts.js adds exists in a stylesheet', () => {
  const css = withoutComments(Object.values(layers).join('\n'));
  const known = new Set([...css.matchAll(/\.(-?[a-zA-Z_][\w-]*)/g)].map((m) => m[1]));
  const source = read('js/charts.js');
  const literals = [
    ...source.matchAll(/class(?:Name)?:\s*[`'"]([^`'"]+)/g),
    ...source.matchAll(/classList\.(?:add|toggle|remove)\('([\w-]+)'/g),
  ].flatMap((m) => m[1].split(/\s+/)).filter((name) => /^[a-z][\w-]*$/i.test(name));
  for (const name of new Set(literals)) assert.ok(known.has(name), `charts.js adds .${name}, which no stylesheet defines`);
});

test('chart helpers', async () => {
  const { ticks, formatNumber } = await import('../js/charts.js');
  assert.deepEqual(ticks(2480), [0, 1000, 2000, 3000]);
  assert.deepEqual(ticks(12240), [0, 5000, 10000, 15000]);
  assert.deepEqual(ticks(7), [0, 2, 4, 6, 8]);
  assert.deepEqual(ticks(0), [0, 1]);
  assert.equal(formatNumber(1284), '1,284');
  assert.equal(formatNumber(5000, 15000), '5K');
});
