import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('dashboard contains a Codal reports section and data loader', async () => {
  const [html, script, server] = await Promise.all([
    readFile('public/index.html', 'utf8'),
    readFile('public/app.js', 'utf8'),
    readFile('server.mjs', 'utf8')
  ]);
  assert.match(html, /آخرین اطلاعیه‌های کدال/);
  assert.match(script, /\/api\/reports/);
  assert.match(server, /search\.codal\.ir/);
});
