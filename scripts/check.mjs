// Run with: node scripts/check.mjs
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = readFileSync(new URL('../assets/subscribe.js', import.meta.url), 'utf8');
const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
assert.deepEqual(schema['@graph'].map(node => node['@type']), ['Organization', 'WebSite']);
assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
assert.ok(html.includes('href="https://loverunninghate.com/"'));
assert.equal((html.match(/type="email"/g) || []).length, 4, 'One field per form');
assert.ok(!html.includes('subEmailDesktop') && !html.includes('subEmailMobile'));
for (const id of ['loveEmail', 'runningEmail', 'hateEmail', 'subEmail']) {
  assert.ok(html.includes(`for="${id}"`), `Label for ${id}`);
}
for (const tag of ['og:title', 'og:description', 'og:url', 'og:image', 'twitter:card', 'twitter:image']) {
  assert.ok(html.includes(`="${tag}"`), `Missing ${tag}`);
}
assert.ok(existsSync(new URL('../assets/social-preview.png', import.meta.url)));
assert.ok(readFileSync(new URL('../robots.txt', import.meta.url), 'utf8').includes('Sitemap: https://loverunninghate.com/sitemap.xml'));
const sitemap = readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
assert.deepEqual([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]), ['https://loverunninghate.com/']);

function makeForm(product) {
  const field = { value: ' runner@example.test ', disabled: false, readOnly: false, focus() { this.focused = true; } };
  const button = { disabled: false, textContent: product ? 'Notify me' : 'Join the list' };
  const status = { textContent: '' };
  const attributes = {};
  return {
    field, button, status, attributes, valid: true,
    querySelector(selector) { return selector.startsWith('input') ? field : selector.startsWith('button') ? button : status; },
    closest() { return { dataset: { product } }; },
    reportValidity() { return this.valid; },
    getAttribute(name) { return attributes[name]; },
    setAttribute(name, value) { attributes[name] = value; },
    addEventListener(name, callback) { this.submit = callback; }
  };
}
const products = ['Love', 'Running', 'Hate'].map(makeForm);
const footer = makeForm();
let request;
let respond;
let reject;
let timeout;
let requests = 0;
const context = {
  document: { querySelectorAll: () => products, getElementById: () => footer },
  AbortController,
  setTimeout(callback) { timeout = callback; return 1; },
  clearTimeout() {},
  fetch(url, options) {
    requests++;
    request = { url, ...options };
    return new Promise((resolve, rejectPromise) => {
      respond = resolve;
      reject = rejectPromise;
      options.signal.addEventListener('abort', () => rejectPromise(new Error('Aborted')));
    });
  }
};
vm.runInNewContext(script, context);
const submit = form => form.submit({ preventDefault() {} });

// The footer sends once, locks its field, recovers from failure and can retry.
let pending = submit(footer);
assert.equal(footer.attributes['aria-busy'], 'true');
assert.ok(footer.button.disabled && footer.field.readOnly);
assert.deepEqual(JSON.parse(request.body), { email: 'runner@example.test', source: 'subscribe' });
await submit(footer);
assert.equal(requests, 1, 'Do not send duplicate in-flight requests');
respond({ ok: false });
await pending;
assert.ok(!footer.field.disabled && !footer.field.readOnly && !footer.button.disabled);
assert.equal(footer.field.value, 'runner@example.test');
assert.match(footer.status.textContent, /Please try again/);
assert.equal(footer.button.textContent, 'Join the list');
pending = submit(footer);
respond({ ok: true });
await pending;
assert.ok(footer.field.disabled && footer.button.disabled);
assert.match(footer.status.textContent, /You're on the list/);
await submit(footer);
assert.equal(requests, 2, 'Do not resubmit a successful signup');

// Every product keeps its own source and receives the same recovery behavior.
for (const [index, form] of products.entries()) {
  pending = submit(form);
  assert.equal(JSON.parse(request.body).source, ['love', 'running', 'hate'][index]);
  if (index === 0) reject(new Error('Offline'));
  else if (index === 1) timeout();
  else respond({ ok: true });
  await pending;
  assert.equal(form.attributes['aria-busy'], 'false');
  if (index < 2) {
    assert.ok(!form.button.disabled && !form.field.disabled);
    assert.match(form.status.textContent, /Please try again/);
  } else assert.ok(form.field.disabled);
}
const count = requests;
products[0].valid = false;
await submit(products[0]);
assert.equal(requests, count, 'Invalid email must not send a request');
console.log('PASS: metadata, schema, sitemap, four labeled fields; signup success, retry, offline, timeout, duplicate and invalid-submit checks.');
