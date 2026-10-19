(() => {
  if (location.origin !== 'https://app.extruda.local' || window.extrudaNative) return;
  window.extrudaNative = true; document.body.classList.add('native');
  let pixels, busy = false, running = false, lastFrame = 0, changing = false;
  const sizes = [[640,480,'480p · 640 × 480'],[1280,720,'720p · 1280 × 720'],[1920,1080,'1080p · 1920 × 1080'],[2560,1440,'1440p · 2560 × 1440'],[3840,2160,'4K · 3840 × 2160']];
  const canvas = document.createElement('canvas'); canvas.width = window.extrudaCaptureSize?.width || 1920; canvas.height = window.extrudaCaptureSize?.height || 1080;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const control = document.createElement('div'); control.hidden = true;
  const label = document.createElement('label'); label.htmlFor = 'resolution'; label.textContent = 'Opløsning';
  const select = document.createElement('select'); select.id = 'resolution';
  for (const [w,h,title] of sizes) { const option = document.createElement('option'); option.value = `${w}x${h}`; option.textContent = title; select.append(option); }
  select.value = `${canvas.width}x${canvas.height}`;
  const hint = document.createElement('p'); hint.textContent = 'Skift under video. Vælg eventuelt kameraet igen i Teams.';
  const actual = document.createElement('p'); actual.id = 'resolution-info';
  let captureInfo = '', receivedInfo = '';
  const showResolution = () => { actual.textContent = `${captureInfo}${receivedInfo}Windows-kamera: ${canvas.width} × ${canvas.height}. Teams kan nedskalere.`; };
  control.append(label, select, hint, actual); document.getElementById('create').before(control);
  const updateEnabled = () => { select.disabled = changing; };
  window.addEventListener('extruda-connection', event => { control.hidden = !event.detail.connected; });
  select.onchange = () => { changing = true; updateEnabled(); document.getElementById('create').disabled = true; chrome.webview.postMessage(`resolution:${select.value}`); };
  window.extrudaResolutionApplied = (width,height) => {
    if (!sizes.some(([w,h]) => w === width && h === height)) return;
    const changed = canvas.width !== width || canvas.height !== height;
    canvas.width = width; canvas.height = height; changing = false; select.value = `${width}x${height}`;
    window.extrudaCaptureSize = {width,height}; if (changed) window.extrudaSetCaptureSize?.({width,height}).catch(() => { hint.textContent = 'Videoen fortsætter. Opløsningen på telefonen kunne ikke ændres.'; }); showResolution(); document.getElementById('create').disabled = false; updateEnabled();
    if (document.getElementById('native-camera-guide')) document.getElementById('native-camera-guide').textContent = `Vælg “Extruda Phone Camera (${width}x${height}) Windows Virtual Camera” i dit mødeprogram. Hold appen åben.`;
  };
  window.extrudaResolutionApplied(canvas.width, canvas.height);
  window.addEventListener('extruda-capture-info', event => { const {width,height} = event.detail; captureInfo = `Telefonkamera: ${width} × ${height} · `; showResolution(); });
  window.extrudaFrameAck = () => { busy = false; };
  chrome.webview.addEventListener('sharedbufferreceived', event => { pixels = new Uint32Array(event.getBuffer()); chrome.webview.postMessage('buffer-ready'); if (window.extrudaSelectorTest) { select.value = '3840x2160'; select.onchange(); } });
  function frame(now) {
    const video = document.getElementById('remote');
    const received = video?.srcObject && video.videoWidth ? `Modtaget video: ${video.videoWidth} × ${video.videoHeight} · ` : '';
    if (received !== receivedInfo) { receivedInfo = received; if (!received) captureInfo = ''; showResolution(); }
    if (pixels && !busy && !changing && video?.srcObject && video.readyState >= 2 && !video.paused && now - lastFrame >= 32) {
      try {
        const width = canvas.width, height = canvas.height;
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height);
        const scale = Math.min(width / video.videoWidth, height / video.videoHeight);
        const w = Math.round(video.videoWidth * scale), h = Math.round(video.videoHeight * scale);
        ctx.drawImage(video, (width - w) / 2, (height - h) / 2, w, h);
        const image = ctx.getImageData(0, 0, width, height);
        const rgba = new Uint32Array(image.data.buffer);
        for (let i = 0; i < rgba.length; i++) { const p = rgba[i]; pixels[i] = (p & 0xff00ff00) | ((p & 0xff) << 16) | ((p >>> 16) & 0xff); }
        busy = true; running = true; lastFrame = now; chrome.webview.postMessage('frame');
      } catch { running = false; chrome.webview.postMessage('clear'); }
    } else if (running && !video?.srcObject) { running = false; chrome.webview.postMessage('clear'); }
    setTimeout(() => frame(performance.now()), 33);
  }
  const guide = document.getElementById('guide');
  if (guide) { guide.replaceChildren(); const text = document.createElement('p'); text.id = 'native-camera-guide'; text.textContent = `Vælg “Extruda Phone Camera (${canvas.width}x${canvas.height}) Windows Virtual Camera” i dit mødeprogram. Hold appen åben.`; guide.append(text); }
  document.title = 'Extruda Phone Camera · Windows';
  if (window.extrudaTestPattern) {
    const pattern = document.createElement('canvas'); pattern.width = canvas.width; pattern.height = canvas.height;
    const paint = pattern.getContext('2d');
    let tick = 0;
    setInterval(() => { paint.fillStyle = 'rgb(200,80,20)'; paint.fillRect(0, 0, pattern.width, pattern.height); paint.fillStyle = 'white'; paint.font = '48px sans-serif'; paint.fillText(`Extruda test ${++tick}`, 100, 300); }, 33);
    const video = document.getElementById('remote'); video.srcObject = pattern.captureStream(30); video.play();
    document.getElementById('placeholder').hidden = true;
  }
  chrome.webview.postMessage('ready');
  if (!window.extrudaTestPattern) {
    // Run the same pairing flow as the button, once per app launch/navigation.
    Promise.resolve(document.getElementById('create').onclick()).then(() => {
      if (window.extrudaPairingTest && !document.getElementById('pairing').hidden && document.getElementById('pair-link').value && document.getElementById('qr').width > 0)
        chrome.webview.postMessage('pairing-ready');
      else if (window.extrudaPairingTest) chrome.webview.postMessage('pairing-failed:'+document.getElementById('status').textContent.slice(0,80));
    });
  }
  frame(performance.now());
})();
