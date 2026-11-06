import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';

function makeEnv() {
  const writes = [];
  return {
    writes,
    ANALYTICS_DB: {
      prepare(sql) {
        return {
          bind(...values) {
            return {
              async run() {
                writes.push({ sql, values });
                return { success: true };
              },
            };
          },
        };
      },
    },
  };
}

test('records a ref and redirects to the portfolio with that ref', async () => {
  const env = makeEnv();
  const response = await worker.fetch(new Request('https://tracker.example/?ref=lochan'), env);

  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), 'https://lochangowda10.github.io/?ref=lochan');
  assert.equal(env.writes.length, 1);
  assert.deepEqual(env.writes[0].values.slice(0, 1), ['lochan']);
});

test('does not write a visit when the ref parameter is absent', async () => {
  const env = makeEnv();
  const response = await worker.fetch(new Request('https://tracker.example/'), env);

  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), 'https://lochangowda10.github.io/');
  assert.equal(env.writes.length, 0);
});

test('does not count link-preview bots or HEAD preflights as visits', async () => {
  const env = makeEnv();
  const head = await worker.fetch(new Request('https://tracker.example/?ref=lochan', { method: 'HEAD' }), env);
  const preview = await worker.fetch(new Request('https://tracker.example/?ref=lochan', {
    headers: { 'user-agent': 'Slackbot-LinkExpanding 1.0' },
  }), env);

  assert.equal(head.status, 302);
  assert.equal(preview.status, 302);
  assert.equal(env.writes.length, 0);
});

test('rejects oversized or unsafe refs without storing them', async () => {
  const env = makeEnv();
  const unsafe = encodeURIComponent('https://bad.example/');
  const response = await worker.fetch(new Request(`https://tracker.example/?ref=${unsafe}`), env);

  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), 'https://lochangowda10.github.io/');
  assert.equal(env.writes.length, 0);
});
