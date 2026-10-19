const serviceOrigin = location.origin === 'https://app.extruda.local' ? 'https://extruda-phone-camera.sorenfroststaal.workers.dev' : location.origin;
const $ = id => document.getElementById(id);
const status = text => { $('status').textContent = text; };
const bytes = length => crypto.getRandomValues(new Uint8Array(length));
const hex = data => [...data].map(x => x.toString(16).padStart(2, '0')).join('');
const b64 = data => btoa(String.fromCharCode(...new Uint8Array(data)));
const unb64 = text => Uint8Array.from(atob(text), c => c.charCodeAt(0));
const hash = async text => hex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))));
let socket, pc, stream, key, role = 'host', approved = false, pendingIce = [], stopped = false, serial = Promise.resolve(), wakeLock, expiryTimer;
let startingCamera = false;
let controlChannel, controlSerial = Promise.resolve(), controlQueued = 0, controlWindow = 0, controlCount = 0;
let pairSecret = '', phoneNonce = '', peerVerified = false;
let captureSize = {width:1280,height:720};
const supportedCaptureSize = size => [[640,480],[1280,720],[1920,1080],[2560,1440],[3840,2160]].some(([w,h]) => size?.width === w && size?.height === h);
const fragment = new URLSearchParams(location.hash.slice(1));
const valid = /^[a-f0-9]{64}$/;
// Remove the bearer material from the visible address/history after reading it.
if (location.hash) history.replaceState(null, '', location.pathname);
async function verificationCode(nonce) { return String(parseInt((await hash('extruda-camera-v2:'+pairSecret+':'+nonce)).slice(0,10),16)%1000000).padStart(6,'0'); }
function closeApproval() { if ($('approval').open) $('approval').close(); }
function fail(error) { console.error(error?.name || 'Connection error'); status(error?.message || 'Forbindelsen kunne ikke oprettes. Opret en ny parring.'); }
async function importKey(secret) { pairSecret = secret; return crypto.subtle.importKey('raw', Uint8Array.from(secret.match(/../g), x => parseInt(x, 16)), 'AES-GCM', false, ['encrypt', 'decrypt']); }
async function send(message) {
  if (socket?.readyState !== WebSocket.OPEN) throw new Error('Parringsforbindelsen er lukket. Opret en ny parring.');
  const iv = bytes(12);
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify({ ...message, sender: role })));
  socket.send(JSON.stringify({ type: 'signal', iv: b64(iv), data: b64(data) }));
}
async function sendControl(message) {
  if (controlChannel?.readyState === 'open') controlChannel.send(JSON.stringify(message));
  else await send(message);
}
async function receiveControl(data) {
  if (!approved || stopped) return;
  if (data.type === 'stop') { await stop(false); return; }
  if (data.type === 'capture-size' && role === 'phone' && supportedCaptureSize(data.size)) {
    const track = stream?.getVideoTracks()[0];
    if (!track) return;
    const connection = pc;
    try {
      await track.applyConstraints({width:{ideal:data.size.width},height:{ideal:data.size.height},aspectRatio:{ideal:data.size.width/data.size.height},frameRate:{ideal:30,max:30}});
      if (pc !== connection || stopped) return;
      captureSize = data.size;
      const settings = track.getSettings();
      await sendControl({type:'capture-info',width:settings.width,height:settings.height});
    } catch { if (!stopped) status('Opløsningen kunne ikke ændres. Videoen fortsætter.'); }
  } else if (data.type === 'capture-info' && role === 'host' && Number.isInteger(data.width) && Number.isInteger(data.height) && data.width > 0 && data.width <= 8192 && data.height > 0 && data.height <= 8192) {
    window.dispatchEvent(new CustomEvent('extruda-capture-info',{detail:{width:data.width,height:data.height}}));
  }
}
function bindControl(channel) {
  if (controlChannel && controlChannel !== channel) { channel.close(); return; }
  const connection = pc;
  controlChannel = channel;
  channel.onmessage = event => {
    if (pc !== connection || stopped) return;
    const now = Date.now(); if (now-controlWindow >= 1000) {controlWindow=now;controlCount=0;}
    if (typeof event.data !== 'string' || event.data.length > 1024 || ++controlCount > 12 || controlQueued >= 4) { void stop(); return; }
    let data; try { data=JSON.parse(event.data); } catch { void stop(); return; }
    if (!data || !['capture-size','capture-info','stop'].includes(data.type)) { void stop(); return; }
    if (data.type === 'stop') { void stop(false); return; }
    controlQueued++;
    controlSerial = controlSerial.then(() => pc === connection && !stopped ? receiveControl(data) : undefined).catch(() => {}).finally(() => {controlQueued--;});
  };
}
window.extrudaSetCaptureSize = async size => {
  if (!supportedCaptureSize(size)) return;
  window.extrudaCaptureSize = size;
  if (role === 'host' && approved && pc?.connectionState === 'connected') await sendControl({type:'capture-size',size});
};
function makePeer() {
  pc = new RTCPeerConnection({ iceServers: [] });
  const connection = pc;
  if (role === 'host') bindControl(pc.createDataChannel('camera-control'));
  else pc.ondatachannel = event => { if (event.channel.label === 'camera-control') bindControl(event.channel); };
  pc.onicecandidate = event => { if (event.candidate) send({ type: 'ice', candidate: event.candidate.toJSON() }).catch(fail); };
  pc.ontrack = event => { $('remote').srcObject = event.streams[0]; $('placeholder').hidden = true; $('fullscreen').hidden = false; };
  pc.onconnectionstatechange = () => {
    if (pc !== connection) return;
    window.dispatchEvent(new CustomEvent('extruda-connection',{detail:{connected:pc.connectionState === 'connected'}}));
    if (pc.connectionState === 'connected') {
      status('Forbundet · Video sendes direkte mellem telefon og pc');
      // The direct WebRTC session survives signalling expiry; no keep-alive traffic needed.
      $('pairing').hidden = true;
    }
    if (['failed', 'disconnected'].includes(pc.connectionState)) {
      stop(false).then(() => status('Videoforbindelsen er afbrudt, og kameraet er stoppet. Opret en ny parring. Tjek Wi-Fi.'));
    }
  };
}
async function flushIce() { for (const candidate of pendingIce.splice(0)) await pc.addIceCandidate(candidate); }
async function receive(payload) {
  const data = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(payload.iv) }, key, unb64(payload.data))));
  if (!data || data.sender !== (role === 'host' ? 'phone' : 'host')) throw new Error('Ugyldig afsender');
  if (data.type === 'hello' && role === 'host' && !peerVerified && !approved && /^[a-f0-9]{32}$/.test(data.nonce)) {
    phoneNonce = data.nonce; peerVerified = true;
    $('approval-code').textContent = await verificationCode(phoneNonce);
    $('approve').disabled = false;
  }
  else if (data.type === 'approved' && role === 'phone' && !approved && !stopped && data.nonce === phoneNonce) {
    captureSize = supportedCaptureSize(data.size) ? data.size : {width:1280,height:720};
    approved = true; $('phone-controls').hidden = false; $('stop').textContent = 'Afbryd';
    // Do not block incoming stop messages while the browser asks for camera permission.
    void startCamera();
  }
  else if (['capture-info','capture-size'].includes(data.type)) await receiveControl(data);
  else if (data.type === 'offer' && role === 'host' && approved) { await pc.setRemoteDescription(data.sdp); await flushIce(); await pc.setLocalDescription(await pc.createAnswer()); await send({ type: 'answer', sdp: pc.localDescription.toJSON() }); }
  else if (data.type === 'answer' && role === 'phone' && approved) { await pc.setRemoteDescription(data.sdp); await flushIce(); }
  else if (data.type === 'ice' && approved) { if (pc.remoteDescription) await pc.addIceCandidate(data.candidate); else pendingIce.push(data.candidate); }
  else if (data.type === 'stop') await stop(false);
}
async function connect(room, token) {
  makePeer();
  const url = new URL(`/api/rooms/${room}/ws`, serviceOrigin); url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    socket.onopen = () => { socket.send(JSON.stringify({ type: 'auth', role, token })); };
    socket.onerror = () => reject(new Error('Kan ikke nå parringsserveren. Prøv igen.'));
    socket.onclose = () => { reject(new Error('Parringen er lukket eller udløbet. Opret en ny parring.')); if (!stopped && pc?.connectionState !== 'connected') { $('start').disabled = true; closeApproval(); status('Parringen er lukket. Opret en ny parring på pc’en.'); } };
    socket.onmessage = event => {
      serial = serial.then(async () => {
        const message = JSON.parse(event.data);
        if (message.type === 'ready') { clearTimeout(expiryTimer); expiryTimer = setTimeout(() => { if (pc?.connectionState !== 'connected') { $('start').disabled = true; closeApproval(); status('Parringen er udløbet. Opret en ny på pc’en.'); } }, Math.max(0, message.expires - Date.now())); resolve(); }
        if (message.type === 'peer-joined') { if (role === 'host') { if (!approved && !$('approval').open) { $('approve').disabled = !peerVerified; $('approval-code').textContent = peerVerified ? $('approval-code').textContent : '…'; $('approval').showModal(); } status('Afventer din accept'); } else { $('phone-info').textContent = 'Afventer accept på pc'; status('Afventer accept på pc'); } }
        if (message.type === 'peer-left' && pc?.connectionState !== 'connected') { await stop(false); status('Parring annulleret'); }
        if (message.type === 'signal') await receive(message);
      }).catch(error => { fail(new Error('Parringsdata kunne ikke bekræftes. Opret en ny parring.')); });
    };
  });
  $('stop').hidden = false;
}
$('create').onclick = async () => {
  $('create').disabled = true;
  try {
    await stop(false); stopped = false; approved = false; peerVerified = false; phoneNonce = '';  pendingIce = []; serial = Promise.resolve();
    const room = Math.floor(Date.now()/1000).toString(16).padStart(8,'0') + hex(bytes(12)), host = hex(bytes(32)), join = hex(bytes(32)), secret = hex(bytes(32));
    key = await importKey(secret);
    status('Opretter sikker parring…');
    const response = await fetch(`${serviceOrigin}/api/rooms/${room}`, { method: 'POST', headers: { Authorization: `Bearer ${host}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ joinHash: await hash(join) }) });
    if (!response.ok) throw new Error(`Parringsserveren svarede ${response.status}. Prøv igen.`);
    await connect(room, host);
    const link = new URL('/', serviceOrigin); link.hash = new URLSearchParams({ room, token: join, key: secret }).toString();
    $('pair-link').value = link.href;
    await QRCode.toCanvas($('qr'), link.href, { width: 260, margin: 1, errorCorrectionLevel: 'L' });
    $('pairing').hidden = false; $('create').hidden = true; status('Scan QR-koden med din telefon · Gyldig i 10 minutter');
  } catch (error) { fail(error); } finally { $('create').disabled = false; }
};
$('approve').onclick = async () => {
  if (!peerVerified) return;
  $('approve').disabled = true;
  try {
    await send({ type: 'approved', nonce: phoneNonce, size: supportedCaptureSize(window.extrudaCaptureSize) ? window.extrudaCaptureSize : {width:1280,height:720} });
    approved = true; closeApproval(); $('pairing').hidden = true; $('stop').textContent = 'Afbryd'; status('Afventer telefonkamera…');
  } catch (error) { closeApproval(); fail(error); }
  finally { $('approve').disabled = false; }
};
$('reject').onclick = () => stop();
$('approval').addEventListener('cancel', event => { event.preventDefault(); stop(); });
$('copy').onclick = async () => { try { await navigator.clipboard.writeText($('pair-link').value); status('Parringslink kopieret'); } catch { $('pair-link').select(); status('Markér og kopiér linket manuelt'); } };
async function startCamera() {
  if (startingCamera || stream || !approved || !pc || stopped) return;
  startingCamera = true;
  const connection = pc;
  $('start').disabled = true; $('start').hidden = true;
  $('phone-info').textContent = 'Starter kamera…'; status('Tillad kameraet, hvis telefonen spørger.');
  try {
    if (!approved || !pc) throw new Error('Godkend først forbindelsen på din pc.');
    const captured = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: $('camera').value }, width: { ideal: captureSize.width }, height: { ideal: captureSize.height }, aspectRatio: {ideal: captureSize.width/captureSize.height}, frameRate: { ideal: 30, max: 30 } } });
    if (stopped || !approved || pc !== connection) { captured.getTracks().forEach(track => track.stop()); return; }
    stream = captured;
    const settings = stream.getVideoTracks()[0].getSettings();
    await sendControl({type:'capture-info',width:settings.width,height:settings.height});
    $('local').srcObject = stream; $('camera').disabled = true;
    for (const track of stream.getTracks()) pc.addTrack(track, stream);
    await pc.setLocalDescription(await pc.createOffer()); await send({ type: 'offer', sdp: pc.localDescription.toJSON() });
    if ('wakeLock' in navigator) try { wakeLock = await navigator.wakeLock.request('screen'); } catch {}
    $('start').hidden = true; $('phone-info').textContent = 'Kamera startet'; status('Forbinder video…');
  } catch (error) {
    stream?.getTracks().forEach(t => t.stop()); stream = null; $('camera').disabled = false;
    if (!stopped && approved && pc === connection) {
      $('start').hidden = false;
      $('phone-info').textContent = 'Tryk Start kamera på telefonen';
      fail(new Error(error.name === 'NotAllowedError' ? 'Tillad kameraadgang og tryk Start kamera.' : error.message));
    }
  } finally { startingCamera = false; $('start').disabled = !approved || stopped; }
}
$('start').onclick = startCamera;
async function stop(notify = true) {
  if (notify && key) try { await sendControl({ type: 'stop' }); } catch {}
  stopped = true; clearTimeout(expiryTimer); controlChannel?.close(); controlChannel = null;
  window.dispatchEvent(new CustomEvent('extruda-connection',{detail:{connected:false}}));
  $('create').hidden = false;
  stream?.getTracks().forEach(t => t.stop()); stream = null;
  pc?.close(); pc = null; socket?.close(); socket = null;
  if (wakeLock) try { await wakeLock.release(); } catch {} wakeLock = null;
  $('remote').srcObject = null; $('local').srcObject = null;
  $('pairing').hidden = true; closeApproval(); $('stop').hidden = true; $('fullscreen').hidden = true; $('placeholder').hidden = false;
  $('pair-link').value = ''; $('qr').getContext('2d').clearRect(0, 0, $('qr').width, $('qr').height);
  approved = false; $('phone-controls').hidden = true; $('phone-info').textContent = 'Parring afsluttet'; $('stop').textContent = 'Annuller'; $('start').hidden = false; $('start').disabled = true; $('camera').disabled = false;
  document.body.classList.remove('video-only'); status('Stoppet · Kamera og forbindelse er lukket');
}
$('stop').onclick = () => stop();
$('fullscreen').onclick = () => { document.body.classList.toggle('video-only'); $('fullscreen').textContent = document.body.classList.contains('video-only') ? 'Tilbage' : 'Vis kun video'; };
document.addEventListener('keydown', e => { if (e.key === 'Escape') document.body.classList.remove('video-only'); });
document.addEventListener('visibilitychange', async () => { if (document.visibilityState === 'visible' && stream && 'wakeLock' in navigator) try { wakeLock = await navigator.wakeLock.request('screen'); } catch {} });
window.addEventListener('pagehide', () => { stream?.getTracks().forEach(t => t.stop()); pc?.close(); socket?.close(); });
if (fragment.has('room')) {
  role = 'phone'; $('phone').hidden = false; $('guide').hidden = true; document.querySelector('.intro').hidden = true;
  if (!/^[a-f0-9]{32}$/.test(fragment.get('room')) || !valid.test(fragment.get('token')) || !valid.test(fragment.get('key'))) status('Parringslinket er ugyldigt. Scan en ny QR-kode på pc’en.');
  else { try { if (!navigator.mediaDevices?.getUserMedia) throw new Error('Kamera kræver HTTPS og en understøttet browser.'); key = await importKey(fragment.get('key')); await connect(fragment.get('room'), fragment.get('token')); phoneNonce = hex(bytes(16)); $('phone-code').textContent = await verificationCode(phoneNonce); await send({type:'hello',nonce:phoneNonce}); if (!approved) status('Afventer accept på pc'); } catch (error) { fail(error); } }
} else $('desktop').hidden = false;
