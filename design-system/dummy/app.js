(() => {
  'use strict';
  const root=document.documentElement;
  const language=document.getElementById('demo-language');
  const theme=document.getElementById('demo-theme');
  const systemTheme=window.matchMedia('(prefers-color-scheme: dark)');
  const setupBody=document.getElementById('setup-body');
  const setupNext=document.getElementById('setup-next');
  const setupBack=document.getElementById('setup-back');
  const titleInput=document.getElementById('content-title');
  const state={view:'setup',setup:0,work:0,start:true,desktop:false,busy:false,progress:0,timer:null,customTitle:false,downloaded:false};
  const tr=(da,en)=>language.value==='en'?en:da;
  const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));

  function updateTheme(){
    const selected=theme.value==='system'?(systemTheme.matches?'dark':'light'):theme.value;
    root.dataset.theme=selected;
    document.querySelector('meta[name="theme-color"]').content=selected==='dark'?'#252C2C':'#F5F0E8';
  }
  function translate(){
    root.lang=language.value;
    document.querySelectorAll('[data-da][data-en]').forEach(node=>node.textContent=node.dataset[language.value]);
    document.querySelectorAll('[data-aria-da][data-aria-en]').forEach(node=>node.setAttribute('aria-label',node.dataset[language.value==='en'?'ariaEn':'ariaDa']));
    document.title=tr('Dummy-app · Visuel identitet','Dummy app · Visual identity');
    if(!state.customTitle)titleInput.value=tr('Mit indhold','My content');
    renderSetup();
    renderWork();
    updateWindow();
  }
  function updateWindow(){
    document.getElementById('window-name').textContent=tr('Mit værktøj · demo','My tool · demo');
    document.getElementById('window-context').textContent=state.view==='setup'?tr('Installation · demo','Setup · demo'):tr('Arbejdsskærm','Workspace');
    document.getElementById('demo-window').classList.toggle('is-setup',state.view==='setup');
    document.getElementById('setup-view').hidden=state.view!=='setup';
    document.getElementById('app-view').hidden=state.view!=='app';
    document.querySelectorAll('[data-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.view===state.view)));
  }
  function showView(view){
    if(state.busy)cancelSimulation();
    state.view=view;
    updateWindow();
    renderWork();
    const heading=view==='app'?document.querySelector('.demo-product-heading h2'):setupBody.querySelector('h2');
    heading?.setAttribute('tabindex','-1');
    heading?.focus({preventScroll:true});
  }
  function shortcutSummary(){
    return tr(`Start-menu: ${state.start?'ja':'nej'}. Skrivebord: ${state.desktop?'ja':'nej'}. Proceslinje: du vælger selv efter første start. Start med Windows: fra.`,
      `Start menu: ${state.start?'yes':'no'}. Desktop: ${state.desktop?'yes':'no'}. Taskbar: your choice after first launch. Launch with Windows: off.`);
  }
  function renderSetup(){
    const names=tr(['Velkommen','Genveje','Kontrollér','Klar'],['Welcome','Shortcuts','Review','Ready']);
    document.getElementById('setup-steps').innerHTML=names.map((name,i)=>`<li ${i===state.setup?'aria-current="step"':''}><span>${i+1}</span>${name}</li>`).join('');
    let body='';
    if(state.setup===0){
      body=`<h2 tabindex="-1">${tr('Installer Mit værktøj','Install My tool')}</h2><p>${tr('En enkel installation med få valg. Sprog og udseende kan ændres øverst til højre, også senere i appen.','A simple setup with a few choices. Change language and appearance at the top right, including later in the app.')}</p><dl class="demo-summary"><div><dt>${tr('Installationssted','Install location')}</dt><dd><code>%LOCALAPPDATA%\\MitVaerktoej</code></dd></div><div><dt>${tr('Bruger','User')}</dt><dd>${tr('Kun din bruger · anbefalet standard','Only your user · recommended default')}</dd></div></dl><p class="demo-inline-note">${tr('Dette er en demonstration. Næste trin viser valg af genveje. Der installeres ingen filer.','This is a demonstration. The next step shows shortcut choices. No files are installed.')}</p>`;
    }else if(state.setup===1){
      body=`<h2 tabindex="-1">${tr('Hvor vil du finde appen?','Where would you like to find the app?')}</h2><p>${tr('Vælg genveje. Du kan altid åbne appen fra dens mappe.','Choose shortcuts. You can always open the app from its folder.')}</p><label class="check-row"><input id="shortcut-start" type="checkbox" ${state.start?'checked':''}><span>${tr('Opret genvej i Start-menuen','Create a Start menu shortcut')}</span></label><p class="field-help">${tr('Slået til som standard. Vises i listen over apps; fastgøres ikke automatisk i Start.','On by default. Appears in the app list; not automatically pinned to Start.')}</p><label class="check-row"><input id="shortcut-desktop" type="checkbox" ${state.desktop?'checked':''}><span>${tr('Opret genvej på skrivebordet','Create a desktop shortcut')}</span></label><p class="field-help">${tr('Slået fra som standard.','Off by default.')}</p><div class="demo-inline-note"><strong>${tr('Hvad med proceslinjen?','What about the taskbar?')}</strong><p>${tr('Det vælger du efter første start. Installationen fastgør ikke noget automatisk. Start med Windows er også slået fra.','You choose after the first launch. Setup does not pin anything automatically. Launch with Windows is also off.')}</p></div>`;
    }else if(state.setup===2){
      body=`<h2 tabindex="-1">${tr('Kontrollér dine valg','Review your choices')}</h2><p>${tr('Her viser en rigtig installation placering, genveje, krav og det, den vil ændre, før du fortsætter.','A real setup shows the location, shortcuts, requirements and changes before you continue.')}</p><dl class="demo-summary"><div><dt>${tr('Placering','Location')}</dt><dd><code>%LOCALAPPDATA%\\MitVaerktoej</code></dd></div><div><dt>${tr('Genveje','Shortcuts')}</dt><dd>${shortcutSummary()}</dd></div><div><dt>${tr('Krav i denne demo','Requirements in this demo')}</dt><dd>${tr('Kun en browser med JavaScript. Ingen download af en rigtig app, konto eller administratorgodkendelse.','Only a browser with JavaScript. No real app download, account or administrator approval.')}</dd></div></dl>${state.busy?`<div class="demo-progress"><label for="install-progress">${tr('Simulerer installation','Simulating setup')} · ${state.progress}%</label><progress id="install-progress" max="100" value="${state.progress}">${state.progress}%</progress></div>`:''}`;
    }else{
      body=`<h2 tabindex="-1">${tr('Klar til første tur','Ready for the first run')}</h2><p>${tr('Den simulerede installation er færdig. Åbn appen, og prøv den faste arbejdsgang. Dine valg af sprog og tema følger med.','The simulated setup is complete. Open the app and try the fixed workflow. Your language and theme choices carry over.')}</p><p class="demo-inline-note">${shortcutSummary()}</p><p>${tr('Ingen genveje er faktisk oprettet på din computer. Inde i demo-appen finder du vejledningen til proceslinjen under Genveje og proceslinje.','No shortcuts have actually been created on your computer. In the demo app, find taskbar guidance under Shortcuts and taskbar.')}</p>`;
    }
    setupBody.innerHTML=body;
    setupBack.hidden=state.setup===0;
    setupBack.textContent=state.busy?tr('Annuller','Cancel'):tr('Tilbage','Back');
    setupNext.disabled=state.busy;
    setupNext.textContent=state.busy?tr('Arbejder…','Working…'):state.setup===2?tr('Installer · demo','Install · demo'):state.setup===3?tr('Åbn appen','Open app'):tr('Næste','Next');
    document.getElementById('shortcut-summary').textContent=shortcutSummary();
  }
  function focusSetupHeading(){setupBody.querySelector('h2')?.focus({preventScroll:true});}
  function cancelSimulation(){
    clearInterval(state.timer);
    state.timer=null;state.busy=false;state.progress=0;
    renderSetup();
    document.getElementById('setup-status').textContent=tr('Demo-installationen er annulleret. Dine valg er bevaret.','Demo setup cancelled. Your choices are preserved.');
  }
  function simulateInstall(){
    state.busy=true;state.progress=0;
    document.getElementById('setup-status').textContent=tr('Simulerer installation. Ingen filer ændres.','Simulating setup. No files are changed.');
    renderSetup();
    state.timer=setInterval(()=>{
      state.progress+=25;
      if(state.progress>=100){clearInterval(state.timer);state.timer=null;state.busy=false;state.setup=3;document.getElementById('setup-status').textContent=tr('Demo-installationen er færdig.','Demo setup is complete.');renderSetup();focusSetupHeading();}
      else renderSetup();
    },250);
  }
  setupBody.addEventListener('change',event=>{
    if(event.target.id==='shortcut-start')state.start=event.target.checked;
    if(event.target.id==='shortcut-desktop')state.desktop=event.target.checked;
  });
  setupNext.addEventListener('click',()=>{
    if(state.busy)return;
    document.getElementById('setup-status').textContent='';
    if(state.setup===3){showView('app');return;}
    if(state.setup===2){simulateInstall();return;}
    state.setup++;renderSetup();focusSetupHeading();
  });
  setupBack.addEventListener('click',()=>{if(state.busy){cancelSimulation();return;}state.setup=Math.max(0,state.setup-1);renderSetup();focusSetupHeading();});

  function luminance(hex){
    const values=hex.match(/[a-f\d]{2}/gi).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
    return values[0]*.2126+values[1]*.7152+values[2]*.0722;
  }
  function ink(hex){return luminance(hex)>.179?'#000000':'#ffffff';}
  function svgContent(){
    const mode=document.getElementById('output-mode').value;
    const colours=mode==='custom'?['primary','accent','paper'].map(n=>document.getElementById(`output-${n}`).value):mode==='mono'?['#ffffff','#ffffff','#ffffff']:['#28645f','#e8b08e','#ffffff'];
    const [primary,accent,paper]=colours;
    const text=ink(paper);
    const title=titleInput.value.trim()||tr('Mit indhold','My content');
    const lines=title.length>24?[title.slice(0,24),title.slice(24)]:[title];
    return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="800" viewBox="0 0 640 800" role="img" aria-labelledby="sheet-title"><title id="sheet-title">${escape(title)}</title><defs><pattern id="stripes" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="#fff"/><path d="M0 0v10" stroke="#000" stroke-width="2"/></pattern></defs><rect width="640" height="800" fill="${paper}"/><rect x="0" y="0" width="640" height="176" fill="${primary}" stroke="${mode==='mono'?'#000':primary}"/><g fill="${ink(primary)}" font-family="sans-serif" font-size="32" font-weight="600">${lines.map((line,i)=>`<text x="48" y="${78+i*44}">${escape(line)}</text>`).join('')}</g><rect x="48" y="224" width="544" height="72" fill="${accent}" stroke="${ink(accent)}"/><text x="72" y="269" fill="${ink(accent)}" font-family="sans-serif" font-size="24">${tr('Et enkelt eksempel','A simple example')}</text><g fill="${text}" font-family="sans-serif" font-size="22"><text x="48" y="358">${tr('Dit indhold har plads til at trække vejret.','Your content has room to breathe.')}</text></g><path d="M48 410H592M48 458H592M48 506H420" stroke="${text}" stroke-width="2"/><rect x="48" y="560" width="152" height="112" fill="${mode==='mono'?'url(#stripes)':primary}" stroke="${text}"/><rect x="224" y="608" width="152" height="64" fill="${accent}" stroke="${text}"/><rect x="400" y="584" width="152" height="88" fill="${text}" stroke="${text}"/>${document.getElementById('output-branding').checked?`<text x="48" y="752" fill="${text}" font-family="sans-serif" font-size="20">extruda</text>`:''}</svg>`;
  }
  function renderWork(){
    document.querySelectorAll('[data-workpanel]').forEach(panel=>panel.hidden=Number(panel.dataset.workpanel)!==state.work);
    document.querySelectorAll('[data-workstep]').forEach(button=>{if(Number(button.dataset.workstep)===state.work)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
    document.getElementById('work-back').hidden=state.work===0;
    document.getElementById('work-next').textContent=state.work===2?tr('Hent SVG','Download SVG'):tr('Næste','Next');
    const mode=document.getElementById('output-mode').value;
    document.getElementById('output-colours').disabled=mode!=='custom';
    document.getElementById('export-colour-summary').textContent=mode==='custom'?tr('Egne farver','Custom colours'):mode==='mono'?tr('Sort / hvid','Black / white'):tr('Fælles farver','Shared colours');
    document.getElementById('output-preview').innerHTML=svgContent();
    if(state.downloaded)document.getElementById('app-status').textContent=tr('SVG-filen er klargjort til download.','The SVG file is prepared for download.');
  }
  function setWorkStep(step){
    state.work=step;renderWork();
    const heading=document.querySelector(`[data-workpanel="${step}"] h3`);
    heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});
  }
  document.getElementById('work-next').addEventListener('click',()=>{
    if(state.work<2){setWorkStep(state.work+1);return;}
    const url=URL.createObjectURL(new Blob([svgContent()],{type:'image/svg+xml;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='mit-indhold.svg';document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    state.downloaded=true;renderWork();
  });
  document.getElementById('work-back').addEventListener('click',()=>setWorkStep(Math.max(0,state.work-1)));
  document.querySelectorAll('[data-workstep]').forEach(button=>button.addEventListener('click',()=>setWorkStep(Number(button.dataset.workstep))));
  document.getElementById('edit-colours').addEventListener('click',()=>setWorkStep(1));
  titleInput.addEventListener('input',()=>{state.customTitle=true;state.downloaded=false;document.getElementById('app-status').textContent='';renderWork();});
  document.querySelectorAll('#output-mode,#output-primary,#output-accent,#output-paper,#output-branding').forEach(input=>input.addEventListener('input',()=>{state.downloaded=false;document.getElementById('app-status').textContent='';renderWork();}));
  document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>showView(button.dataset.view)));
  language.addEventListener('change',translate);
  theme.addEventListener('change',updateTheme);
  systemTheme.addEventListener('change',()=>{if(theme.value==='system')updateTheme();});
  updateTheme();translate();
})();
