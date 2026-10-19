const ID = /^[a-f0-9]{32}$/;
const HASH = /^[a-f0-9]{64}$/;
const TOKEN = /^[a-f0-9]{64}$/;
const TTL = 10 * 60 * 1000;
export async function digest(value) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(x => x.toString(16).padStart(2, '0')).join('');
}
export function validSignal(message) {
  return message && message.type === 'signal' && typeof message.iv === 'string' && /^[A-Za-z0-9+/]{16}$/.test(message.iv) && typeof message.data === 'string' && message.data.length <= 90000 && /^[A-Za-z0-9+/=]+$/.test(message.data);
}
function response(text, status = 200) { return new Response(status === 204 ? null : text, { status, headers: { 'Cache-Control': 'no-store' } }); }
const LOCAL_ORIGIN = 'https://app.extruda.local';
export async function limitedBody(request, limit = 1024) {
  const reader = request.body?.getReader(); if (!reader) return '';
  const chunks = []; let size = 0;
  try { for (;;) { const {value,done} = await reader.read(); if (done) break;
    size += value.byteLength; if (size > limit) { await reader.cancel(); throw new Error('Too large'); } chunks.push(value);
  } } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.length; }
  return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
}
export default {
  async fetch(request, env) {
    const result = await route(request,env);
    if (request.headers.get('Origin') !== LOCAL_ORIGIN || !new URL(request.url).pathname.startsWith('/api/') || result.status === 101) return result;
    const headers = new Headers(result.headers); headers.set('Access-Control-Allow-Origin',LOCAL_ORIGIN);
    headers.set('Vary','Origin'); headers.set('Access-Control-Allow-Methods','GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers','Authorization, Content-Type');
    return new Response(result.body,{status:result.status,headers});
  }
};
async function route(request,env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/health') return Response.json({ ok: true, version: '0.4.0', mediaRelay: false }, { headers: { 'Cache-Control': 'no-store' } });
    const downloads = {
      '/downloads/ExtrudaCamera-Setup-0.3.0-x64.exe':'ExtrudaCamera-Setup-0.4.0-x64.exe',
      '/downloads/ExtrudaCamera-Setup-0.4.0-x64.exe':'ExtrudaCamera-Setup-0.4.0-x64.exe',
      '/downloads/SHA256SUMS.txt':'SHA256SUMS.txt',
      '/downloads/extruda-camera.ico':'extruda-camera.ico'
    };
    if (['GET','HEAD'].includes(request.method) && downloads[url.pathname]) return new Response(null,{status:302,headers:{Location:'https://github.com/sorenfroststaal/Extruda/releases/download/camera-v0.4.0/'+downloads[url.pathname],'Cache-Control':'no-store'}});
    const match = url.pathname.match(/^\/api\/rooms\/([a-f0-9]{32})(\/ws)?$/);
    if (match) {
      if (![url.origin,LOCAL_ORIGIN].includes(request.headers.get('Origin'))) return response('Origin rejected', 403);
      if (request.method === 'OPTIONS') return response('',204);
      const gate = await env.ABUSE.get(env.ABUSE.idFromName('global')).fetch('https://guard/check',{method:'POST',body:JSON.stringify({ip:request.headers.get('CF-Connecting-IP') || 'local',create:request.method === 'POST'})});
      if (!gate.ok) return new Response('Pr�v igen om lidt.',{status:429,headers:{'Retry-After':'60'}});
      if (!ID.test(match[1])) return response('Invalid room', 400);
      if (request.method === 'POST') { const created = parseInt(match[1].slice(0,8),16)*1000; if (created > Date.now()+30000 || Date.now()-created >= TTL) return response('Invitation expired or clock incorrect',400); }
      return env.ROOMS.get(env.ROOMS.idFromName(match[1])).fetch(request);
    }
    if (url.pathname.startsWith('/api/')) return response('Not found', 404);
    const result = await env.ASSETS.fetch(request);
    const headers = new Headers(result.headers);
    if (result.ok && url.pathname.startsWith('/downloads/')) {
      const filename = url.pathname.split('/').pop();
      if (/^[A-Za-z0-9_.-]+\.(exe|ico)$/.test(filename)) {
        headers.set('Content-Disposition', `attachment; filename="${filename}"`);
        headers.set('Content-Type', 'application/octet-stream');
      }
    }
    headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; media-src 'self' blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    headers.set('Referrer-Policy', 'no-referrer');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
    headers.set('Cache-Control', 'no-store');
    return new Response(result.body, { status: result.status, headers });
}
export class PairingRoom {
  constructor(ctx) { this.ctx = ctx; }
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === 'POST' && !url.pathname.endsWith('/ws')) {
      if ((await this.ctx.storage.get('room'))) return response('Room already exists', 409);
      const host = (request.headers.get('Authorization') || '').replace(/^Bearer /, '');
      if (!TOKEN.test(host)) return response('Invalid host token', 400);
      if (Number(request.headers.get('Content-Length') || 0) > 1024) return response('Too large', 413);
      let body; try { body = await limitedBody(request); } catch { return response('Too large',413); }
      if (body.length > 1024) return response('Too large', 413);
      let data; try { data = JSON.parse(body); } catch { return response('Invalid JSON', 400); }
      if (!HASH.test(data?.joinHash || '')) return response('Invalid join hash', 400);
      const expires = Math.min(Date.now() + TTL, parseInt(url.pathname.split('/').pop().slice(0,8),16)*1000 + TTL);
      await this.ctx.storage.put('room', { hostHash: await digest(host), joinHash: data.joinHash, expires });
      await this.ctx.storage.setAlarm(expires);
      return Response.json({ expires }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
    }
    if (request.method !== 'GET' || !url.pathname.endsWith('/ws') || request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return response('Not found', 404);
    const room = await this.ctx.storage.get('room');
    if (!room || room.expires <= Date.now()) return response('Room expired', 410);
    if (this.ctx.getWebSockets().length >= 4) return response('Room busy', 429);
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1]);
    pair[1].serializeAttachment({ role: null, created: Date.now(), count: 0, bytes: 0 });
    // Unauthenticated sockets cannot keep a room alive. An alarm also clears them after 10 seconds.
    await this.ctx.storage.setAlarm(Math.min(room.expires, Date.now() + 10000));
    return new Response(null, { status: 101, webSocket: pair[0] });
  }
  send(socket, message) { try { socket.send(JSON.stringify(message)); } catch {} }
  async webSocketMessage(socket, raw) {
    return this.ctx.blockConcurrencyWhile(() => this.processMessage(socket,raw));
  }
  async processMessage(socket, raw) {
    const state = socket.deserializeAttachment();
    const room = await this.ctx.storage.get('room');
    if (!room || Date.now() >= room.expires || typeof raw !== 'string' || raw.length > 92000) return socket.close(1008, 'Expired or invalid message');
    state.count++; state.bytes += raw.length;
    if (state.count > 256 || state.bytes > 512000) return socket.close(1008, 'Signalling limit');
    let data; try { data = JSON.parse(raw); } catch { return socket.close(1008, 'Invalid JSON'); }
    if (!state.role) {
      if (Date.now() - state.created > 10000 || data.type !== 'auth' || !['host', 'phone'].includes(data.role) || !TOKEN.test(data.token || '')) return socket.close(1008, 'Invalid authentication');
      if (await digest(data.token) !== (data.role === 'host' ? room.hostHash : room.joinHash)) return socket.close(1008, 'Invalid authentication');
      if (this.ctx.getWebSockets().some(s => s !== socket && s.deserializeAttachment()?.role === data.role)) return socket.close(1008, 'Role occupied');
      if (room[data.role + 'Used']) return socket.close(1008,'Invitation already used');
      room[data.role + 'Used'] = true;
      await this.ctx.storage.put('room',room);
      state.role = data.role; socket.serializeAttachment(state);
      this.send(socket, { type: 'ready', expires: room.expires });
      for (const other of this.ctx.getWebSockets()) {
        if (other !== socket && other.deserializeAttachment()?.role) { this.send(other, { type: 'peer-joined' }); this.send(socket, { type: 'peer-joined' }); }
      }
      return;
    }
    if (!validSignal(data)) return socket.close(1008, 'Invalid signal');
    socket.serializeAttachment(state);
    for (const other of this.ctx.getWebSockets()) if (other !== socket && other.deserializeAttachment()?.role && other.deserializeAttachment().role !== state.role) this.send(other, data);
  }
  async webSocketClose(socket, code) {
    const role = socket.deserializeAttachment()?.role;
    try { socket.close([1005,1006,1015].includes(code) ? 1000 : code); } catch {}
    if (role) for (const other of this.ctx.getWebSockets()) if (other !== socket && other.deserializeAttachment()?.role) { this.send(other, { type: 'peer-left' }); other.close(1000, 'Peer left; create a new pairing'); }
  }
  async webSocketError(socket) { socket.close(1011, 'Connection error'); }
  async alarm() {
    const room = await this.ctx.storage.get('room');
    if (!room || room.expires <= Date.now()) {
      for (const socket of this.ctx.getWebSockets()) socket.close(1000, 'Pairing expired');
      await this.ctx.storage.deleteAll();
      return;
    }
    for (const socket of this.ctx.getWebSockets()) { const s = socket.deserializeAttachment(); if (!s?.role && Date.now() - s.created >= 10000) socket.close(1008, 'Authentication timeout'); }
    await this.ctx.storage.setAlarm(room.expires);
  }
}

export class AbuseGuard {
  constructor(ctx) { this.ctx = ctx; }
  async fetch(request) {
    return this.ctx.blockConcurrencyWhile(async () => {
      const {ip,create} = await request.json();
      const now = Math.floor(Date.now()/60000);
      let state = await this.ctx.storage.get('limits');
      if (!state || state.minute !== now) state = {minute:now,total:0,creates:0,ips:{}};
      const id = await digest(ip);
      const entry = state.ips[id] || {total:0,creates:0};
      if (state.total >= 600 || (create && state.creates >= 120) || entry.total >= 90 || (create && entry.creates >= 20)) return response('Rate limited',429);
      state.total++; entry.total++; if (create) { state.creates++; entry.creates++; }
      state.ips[id] = entry;
      await this.ctx.storage.put('limits',state); await this.ctx.storage.setAlarm(Date.now()+120000);
      return response('OK');
    });
  }
  async alarm() { await this.ctx.storage.deleteAll(); }
}

