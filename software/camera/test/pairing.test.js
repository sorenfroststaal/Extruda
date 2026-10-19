import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, webcrypto } from 'node:crypto';
import WebSocket from 'ws';
import { digest, validSignal } from '../src/worker.js';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:8787';
const origin = new URL(base).origin;
const random = n => randomBytes(n).toString('hex');
async function room() {
  const id = Math.floor(Date.now()/1000).toString(16).padStart(8,'0')+random(12), host = random(32), phone = random(32);
  const url = `${base}/api/rooms/${id}`;
  const result = await fetch(url, { method: 'POST', headers: { Origin: origin, Authorization: `Bearer ${host}` }, body: JSON.stringify({ joinHash: await digest(phone) }) });
  assert.equal(result.status, 201);
  return { url, host, phone };
}
function connect(url, role, token) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url.replace(/^http/, 'ws') + '/ws', { origin });
    ws.on('error', reject);
    ws.once('open', () => { ws.send(JSON.stringify({ type: 'auth', role, token })); resolve(ws); });
  });
}
function message(ws) { return new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error('message timeout')), 5000); ws.once('message', raw => { clearTimeout(timer); resolve(JSON.parse(raw)); }); }); }
function close(ws) { return new Promise(resolve => ws.once('close', (code, reason) => resolve({ code, reason: reason.toString() }))); }
test('encrypted signals validate and oversized payloads are rejected', () => {
  assert.ok(validSignal({ type: 'signal', iv: 'AAAAAAAAAAAAAAAA', data: 'AAAA' }));
  assert.ok(!validSignal({ type: 'offer', sdp: 'plaintext' }));
  assert.ok(!validSignal({ type: 'signal', iv: 'AAAAAAAAAAAAAAAA', data: 'A'.repeat(90001) }));
});
test('health and response security headers', async () => {
  assert.equal((await (await fetch(`${base}/api/health`)).json()).mediaRelay, false);
  const response = await fetch(base);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
});
test('cross-origin room creation is blocked', async () => {
  const response = await fetch(`${base}/api/rooms/${random(16)}`, { method: 'POST', headers: { Origin: 'https://evil.example' } });
  assert.equal(response.status, 403);
});
test('pairing, encrypted relay, duplicate role, bad token, malformed message and stop', async t => {
  const r = await room();
  const host = await connect(r.url, 'host', r.host); t.after(() => host.terminate());
  assert.equal((await message(host)).type, 'ready');
  const hostJoined = message(host);
  const phone = await connect(r.url, 'phone', r.phone); t.after(() => phone.terminate());
  assert.equal((await message(phone)).type, 'ready');
  assert.equal((await hostJoined).type, 'peer-joined');
  const key = await webcrypto.subtle.importKey('raw', randomBytes(32), 'AES-GCM', false, ['encrypt', 'decrypt']);
  const iv = randomBytes(12);
  const plain = JSON.stringify({ type: 'approved', sender: 'host' });
  const cipher = await webcrypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, Buffer.from(plain));
  const expected = { type: 'signal', iv: iv.toString('base64'), data: Buffer.from(cipher).toString('base64') };
  // Ignore the peer-joined event already queued at the phone before checking a signal.
  const received = new Promise(resolve => phone.on('message', raw => { const data = JSON.parse(raw); if (data.type === 'signal') resolve(data); }));
  host.send(JSON.stringify(expected));
  const encrypted = await received;
  assert.deepEqual(encrypted, expected);
  const decrypted = await webcrypto.subtle.decrypt({ name: 'AES-GCM', iv: Buffer.from(encrypted.iv, 'base64') }, key, Buffer.from(encrypted.data, 'base64'));
  assert.equal(Buffer.from(decrypted).toString(), plain);
  const duplicate = await connect(r.url, 'phone', r.phone); assert.equal((await close(duplicate)).code, 1008);
  const wrong = await connect(r.url, 'phone', random(32)); assert.equal((await close(wrong)).code, 1008);
  const hostLeft = message(host);
  phone.send('{broken');
  assert.equal((await close(phone)).code, 1008);
  assert.equal((await hostLeft).type, 'peer-left');
});
test('unknown room cannot connect', async () => {
  const code = await new Promise(resolve => {
    const ws = new WebSocket(`${base.replace(/^http/, 'ws')}/api/rooms/${random(16)}/ws`, { origin });
    ws.on('unexpected-response', (request, response) => { resolve(response.statusCode); request.destroy(); });
    ws.on('error', () => {});
  });
  assert.equal(code, 410);
});

test('packaged local app origin has narrow CORS support',async()=>{
 const result=await fetch(`${base}/api/rooms/${random(16)}`,{method:'OPTIONS',headers:{Origin:'https://app.extruda.local','Access-Control-Request-Method':'POST'}});
 assert.equal(result.status,204);assert.equal(result.headers.get('access-control-allow-origin'),'https://app.extruda.local');
});
test('authenticated room tokens cannot be reused after disconnect',async()=>{
 const r=await room();const host=await connect(r.url,'host',r.host);await message(host);
 const ended=close(host);host.close(1000);await ended;
 const retry=await connect(r.url,'host',r.host);assert.equal((await close(retry)).code,1008);
});


test('an expired room id cannot be recreated with new host credentials',async()=>{
 const id=Math.floor((Date.now()-11*60000)/1000).toString(16).padStart(8,'0')+random(12);
 const result=await fetch(`${base}/api/rooms/${id}`,{method:'POST',headers:{Origin:origin,Authorization:`Bearer ${random(32)}`},body:JSON.stringify({joinHash:await digest(random(32))})});
 assert.equal(result.status,400);
});
