(() => {
  'use strict';
  const root=document.documentElement;
  const language=document.getElementById('demo-language');
  const theme=document.getElementById('demo-theme');
  const systemTheme=window.matchMedia('(prefers-color-scheme: dark)');
  const mobileMenu=window.matchMedia('(max-width: 640px)');
  const setupBody=document.getElementById('setup-body');
  const setupNext=document.getElementById('setup-next');
  const titleInput=document.getElementById('content-title');
  const state={view:'app',setup:0,start:true,desktop:false,busy:false,progress:0,timer:null,notice:'',customTitle:false,menuOpen:false,attempted:false,downloaded:false,task:null,returnToReview:false,taskErrors:[],reviewed:false,
    description:{name:'',note:'',saved:false,touched:false,dirty:false},appearance:{mode:'brand',saved:false,touched:false,dirty:false}};
  const tr=(da,en)=>language.value==='en'?en:da;
  const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));
  function focusHeading(node){if(node){node.setAttribute('tabindex','-1');node.focus();}}
  function navigate(route){if(location.hash==='#'+route)applyRoute(true);else location.hash=route;}
  function updateTheme(){
    const selected=theme.value==='system'?(systemTheme.matches?'dark':'light'):theme.value;
    root.dataset.theme=selected;
    document.querySelector('meta[name="theme-color"]').content=selected==='dark'?'#252C2C':'#F5F0E8';
  }
  function updateMenu(){
    const toggle=document.getElementById('demo-menu-toggle');
    toggle.hidden=!mobileMenu.matches;
    toggle.setAttribute('aria-expanded',String(state.menuOpen));
    document.getElementById('demo-menu-links').hidden=mobileMenu.matches&&!state.menuOpen;
  }
  function updateWindow(){
    const setup=state.view==='setup';
    document.getElementById('window-name').textContent=tr('Mit værktøj · demo','My tool · demo');
    document.getElementById('window-context').textContent=setup?tr('Installation · demo','Setup · demo'):tr('Kun denne åbne side · genindlæsning nulstiller','This open page only · reload resets');
    document.getElementById('demo-window').classList.toggle('is-setup',setup);
    document.getElementById('setup-view').hidden=!setup;
    document.getElementById('app-view').hidden=state.view!=='app';
    document.getElementById('tasks-view').hidden=state.view!=='tasks';
    document.getElementById('demo-main-nav').hidden=setup;
    document.querySelectorAll('[data-destination]').forEach(link=>{
      if(link.dataset.destination===state.view)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
    });
    document.title=setup?tr(`Trin ${state.setup+1} af 3 · Installation · Demo`,`Step ${state.setup+1} of 3 · Setup · Demo`):state.view==='tasks'?tr('Opgaveoverblik · Demo','Task overview · Demo'):tr('Arbejdsflade · Demo','Workspace · Demo');
    updateMenu();
  }
  function translate(){
    root.lang=language.value;
    document.querySelectorAll('[data-da][data-en]').forEach(node=>node.textContent=node.dataset[language.value]);
    document.querySelectorAll('[data-aria-da][data-aria-en]').forEach(node=>node.setAttribute('aria-label',node.dataset[language.value==='en'?'ariaEn':'ariaDa']));
    if(!state.customTitle)titleInput.value=tr('Mit indhold','My content');
    renderSetup();renderWork();renderTasks();updateWindow();
  }
  function shortcutSummary(){return tr(`Start-menu: ${state.start?'ja':'nej'}. Skrivebord: ${state.desktop?'ja':'nej'}. Proceslinje: separat valg efter første start. Start med Windows: fra.`,`Start menu: ${state.start?'yes':'no'}. Desktop: ${state.desktop?'yes':'no'}. Taskbar: a separate choice after first launch. Launch with Windows: off.`);}
  function renderSetup(){
    const names=tr(['Genveje','Gennemse valg','Klar'],['Shortcuts','Review choices','Ready']);
    document.getElementById('setup-steps').innerHTML=names.map((name,i)=>`<li ${i===state.setup?'aria-current="step"':''}><span aria-hidden="true">${i+1}</span>${i<state.setup&&!state.busy?`<a href="#setup-${i+1}">${name} · ${tr('udfyldt','completed')}</a>`:name}</li>`).join('');
    document.getElementById('wizard-position').textContent=tr(`Trin ${state.setup+1} af 3: ${names[state.setup]}`,`Step ${state.setup+1} of 3: ${names[state.setup]}`);
    const back=document.getElementById('setup-back-link');back.hidden=false;back.href=state.setup===0?'#app':'#setup-1';back.textContent=state.setup===0?tr('← Til arbejdsfladen','← Back to workspace'):tr('← Tilbage til genveje','← Back to shortcuts');
    let body='';
    if(state.setup===0){
      body=`<h2 tabindex="-1">${tr('Hvor vil du finde appen?','Where would you like to find the app?')}</h2><p>${tr('Demo-installation kun til din bruger. Vælg de genveje, du vil have.','Demo setup for your user only. Choose the shortcuts you want.')}</p><label class="check-row"><input id="shortcut-start" type="checkbox" ${state.start?'checked':''}><span>${tr('Opret genvej i Start-menuen','Create a Start menu shortcut')}</span></label><p class="field-help">${tr('I listen over apps. Fastgøres ikke automatisk i Start.','In the app list. Not automatically pinned to Start.')}</p><label class="check-row"><input id="shortcut-desktop" type="checkbox" ${state.desktop?'checked':''}><span>${tr('Opret genvej på skrivebordet','Create a desktop shortcut')}</span></label><p class="demo-inline-note">${tr('Proceslinjen vælger du efter første start. Start med Windows er fra. Næste side samler dine valg, før demo-installationen starter.','Choose taskbar pinning after first launch. Launch with Windows is off. The next page reviews your choices before demo setup starts.')}</p>`;
    }else if(state.setup===1){
      body=`<h2 tabindex="-1">${tr('Gennemse før installation','Review before setup')}</h2><dl class="review-list"><div><dt>${tr('Placering','Location')}</dt><dd><code>%LOCALAPPDATA%\\MitVaerktoej</code></dd></div><div><dt>${tr('Genveje','Shortcuts')}</dt><dd>${shortcutSummary()} <a href="#setup-1" aria-label="${tr('Ændr genveje','Change shortcuts')}">${tr('Ændr','Change')}</a></dd></div><div><dt>${tr('Hvad sker der?','What happens?')}</dt><dd>${tr('Kun en simulation. Ingen filer installeres, ingen genveje oprettes, og ingen administratorrettigheder kræves.','A simulation only. No files are installed, no shortcuts are created and no administrator privileges are requested.')}</dd></div><div><dt>${tr('Dependencies','Dependencies')}</dt><dd>${tr('Denne demo kræver kun browser og lokal JavaScript. Ingen konto eller ekstra download.','This demo only needs a browser and local JavaScript. No account or extra download.')}</dd></div></dl>${state.busy?`<div class="demo-progress"><label for="install-progress">${tr('Simulerer installation','Simulating setup')} · ${state.progress}%</label><progress id="install-progress" max="100" value="${state.progress}">${state.progress}%</progress></div>`:''}`;
    }else body=`<h2 tabindex="-1">${tr('Demo-installationen er færdig','Demo setup is complete')}</h2><p>${tr('Åbn appen og prøv arbejdsfladen. Sprog og tema følger med.','Open the app and try the workspace. Language and theme carry over.')}</p><p>${shortcutSummary()}</p><p class="demo-inline-note">${tr('Din computer er ikke ændret. En rigtig app viser her, hvad der faktisk blev installeret.','Your computer has not changed. A real app shows what was actually installed here.')}</p>`;
    setupBody.innerHTML=body;
    setupNext.disabled=state.busy;
    setupNext.textContent=state.busy?tr('Arbejder…','Working…'):state.setup===0?tr('Gennemse valg','Review choices'):state.setup===1?tr('Installer · demo','Install · demo'):tr('Åbn arbejdsfladen','Open workspace');
    document.getElementById('setup-cancel').hidden=!state.busy;
    document.getElementById('setup-status').textContent=state.notice==='cancelled'?tr('Simulationen er annulleret. Dine valg er bevaret.','Simulation cancelled. Your choices are preserved.'):state.busy?tr('Simulation · ingen filer ændres.','Simulation · no files are changed.'):'';
    document.getElementById('shortcut-summary').textContent=shortcutSummary();
  }
  function cancelSimulation(){clearInterval(state.timer);state.timer=null;state.busy=false;state.progress=0;state.notice='cancelled';renderSetup();}
  function simulateInstall(){
    state.busy=true;state.notice='';state.progress=0;renderSetup();
    state.timer=setInterval(()=>{
      state.progress+=25;
      if(state.progress>=100){clearInterval(state.timer);state.timer=null;state.busy=false;navigate('setup-3');}
      else{document.getElementById('install-progress').value=state.progress;document.querySelector('.demo-progress label').textContent=tr('Simulerer installation','Simulating setup')+` · ${state.progress}%`;}
    },250);
  }
  setupBody.addEventListener('change',event=>{if(event.target.id==='shortcut-start')state.start=event.target.checked;if(event.target.id==='shortcut-desktop')state.desktop=event.target.checked;});
  setupNext.addEventListener('click',()=>{if(state.busy)return;state.notice='';if(state.setup===0)navigate('setup-2');else if(state.setup===1)simulateInstall();else navigate('app');});
  document.getElementById('setup-cancel').addEventListener('click',cancelSimulation);

  function luminance(hex){
    const values=hex.match(/[a-f\d]{2}/gi).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
    return values[0]*.2126+values[1]*.7152+values[2]*.0722;
  }
  function ink(hex){return luminance(hex)>.179?'#000000':'#ffffff';}
  function svgContent(){
    const mode=document.querySelector('[name="output-mode"]:checked').value;
    const colours=mode==='custom'?['primary','accent','paper'].map(n=>document.getElementById(`output-${n}`).value):mode==='mono'?['#ffffff','#ffffff','#ffffff']:['#28645f','#e8b08e','#ffffff'];
    const [primary,accent,paper]=colours;
    const text=ink(paper);
    const title=titleInput.value.trim()||tr('Mit indhold','My content');
    const chars=Array.from(title);
    const lines=chars.length>24?[chars.slice(0,24).join(''),chars.slice(24).join('')]:[title];
    return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="800" viewBox="0 0 640 800" role="img" aria-labelledby="sheet-title"><title id="sheet-title">${escape(title)}</title><defs><pattern id="stripes" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="#fff"/><path d="M0 0v10" stroke="#000" stroke-width="2"/></pattern></defs><rect width="640" height="800" fill="${paper}"/><rect x="0" y="0" width="640" height="176" fill="${primary}" stroke="${mode==='mono'?'#000':primary}"/><g fill="${ink(primary)}" font-family="sans-serif" font-size="32" font-weight="600">${lines.map((line,i)=>`<text x="48" y="${78+i*44}">${escape(line)}</text>`).join('')}</g><rect x="48" y="224" width="544" height="72" fill="${accent}" stroke="${ink(accent)}"/><text x="72" y="269" fill="${ink(accent)}" font-family="sans-serif" font-size="24">${tr('Et enkelt eksempel','A simple example')}</text><g fill="${text}" font-family="sans-serif" font-size="22"><text x="48" y="358">${tr('Dit indhold har plads til at trække vejret.','Your content has room to breathe.')}</text></g><path d="M48 410H592M48 458H592M48 506H420" stroke="${text}" stroke-width="2"/><rect x="48" y="560" width="152" height="112" fill="${mode==='mono'?'url(#stripes)':primary}" stroke="${text}"/><rect x="224" y="608" width="152" height="64" fill="${accent}" stroke="${text}"/><rect x="400" y="584" width="152" height="88" fill="${text}" stroke="${text}"/>${document.getElementById('output-branding').checked?`<text x="48" y="752" fill="${text}" font-family="sans-serif" font-size="20">extruda</text>`:''}</svg>`;
  }


  function showWorkErrors(focus=false){
    const invalid=state.attempted&&!titleInput.value.trim();
    const summary=document.getElementById('workspace-errors');
    summary.hidden=!invalid;
    document.getElementById('title-error').hidden=!invalid;
    if(invalid){
      const error=tr('Skriv en overskrift.','Enter a heading.');
      titleInput.setAttribute('aria-invalid','true');
      document.getElementById('title-error').textContent=error;
      summary.innerHTML=`<h4>${tr('Der mangler en oplysning','An answer is missing')}</h4><ul><li><a href="#content-title">${error}</a></li></ul>`;
      if(focus)summary.focus();
    }else titleInput.removeAttribute('aria-invalid');
    return !invalid;
  }
  function renderWork(){
    const mode=document.querySelector('[name="output-mode"]:checked').value;
    document.getElementById('output-colours').hidden=mode!=='custom';
    document.getElementById('output-preview').innerHTML=svgContent();
    showWorkErrors();
    document.getElementById('app-status').textContent=state.downloaded?tr('SVG-filen er klargjort til download. Du kan stadig rette i indholdet.','The SVG file is prepared for download. You can still edit the content.'):'';
  }
  document.getElementById('workspace-form').addEventListener('submit',event=>{
    event.preventDefault();state.attempted=true;
    if(!showWorkErrors(true))return;
    const url=URL.createObjectURL(new Blob([svgContent()],{type:'image/svg+xml;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='mit-indhold.svg';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    state.downloaded=true;renderWork();
  });
  titleInput.addEventListener('input',()=>{state.customTitle=true;state.downloaded=false;renderWork();});
  document.querySelectorAll('[name="output-mode"],#output-primary,#output-accent,#output-paper,#output-branding').forEach(input=>input.addEventListener('input',()=>{state.downloaded=false;renderWork();}));

  function taskStatus(item){return item.dirty||(!item.saved&&item.touched)?tr('I gang','In progress'):item.saved?tr('Klar','Ready'):tr('Ikke startet','Not started');}
  function taskReady(){return state.description.saved&&!state.description.dirty&&state.appearance.saved&&!state.appearance.dirty;}
  function renderTaskList(){
    document.getElementById('task-description-status').textContent=taskStatus(state.description);
    document.getElementById('task-appearance-status').textContent=taskStatus(state.appearance);
    document.getElementById('task-review-status').textContent=state.reviewed?tr('Klar','Ready'):tr('Ikke gennemgået','Not reviewed');
    const count=Number(state.description.saved&&!state.description.dirty)+Number(state.appearance.saved&&!state.appearance.dirty)+Number(state.reviewed);
    document.getElementById('task-progress').textContent=tr(`${count} af 3 afsnit er klar.`,`${count} of 3 sections are ready.`);
  }
  function errorMarkup(errors){return `<div class="form-error-summary" id="task-errors" tabindex="-1" role="alert"><h3>${tr('Ret det, der mangler','Complete the missing answers')}</h3><ul>${errors.map(e=>`<li><a href="${e.href}">${e.text}</a></li>`).join('')}</ul></div>`;}
  function renderTasks(){
    state.taskErrors.forEach(error=>{error.text=error.href==='#task-name'?tr('Skriv et navn.','Enter a name.'):error.href.includes('description')?tr('Udfyld og gem beskrivelsen.','Complete and save the description.'):tr('Gem dit valg af udseende.','Save your appearance choice.');});
    renderTaskList();
    document.getElementById('task-overview').hidden=Boolean(state.task);
    const screen=document.getElementById('task-edit-screen');screen.hidden=!state.task;
    if(!state.task)return;
    const returnPath=state.returnToReview?'#task-review':'#tasks';
    let content=`<a class="task-back-link" href="${returnPath}">${state.returnToReview?tr('← Til gennemgang','← Back to review'):tr('← Til opgaveoverblikket','← Back to task overview')}</a>`;
    content+='<form id="task-form" novalidate>';
    if(state.taskErrors.length)content+=errorMarkup(state.taskErrors);
    if(state.task==='description'){
      const error=state.taskErrors.length?state.taskErrors[0].text:'';
      content+=`<h2 tabindex="-1">${tr('Beskriv dit indhold','Describe your content')}</h2><label class="demo-field" for="task-name"><span>${tr('Navn','Name')}</span><input id="task-name" type="text" maxlength="80" required value="${escape(state.description.name)}" aria-describedby="task-name-help task-name-error" ${error?'aria-invalid="true"':''}></label><p id="task-name-help" class="field-help">${tr('Et kort navn, du kan kende igen.','A short name you can recognise.')}</p><p id="task-name-error" class="form-field-error" ${error?'':'hidden'}>${error}</p><label class="demo-field" for="task-note"><span>${tr('Note (valgfrit)','Note (optional)')}</span><textarea id="task-note" rows="3" maxlength="2000">${escape(state.description.note)}</textarea></label>`;
    }else if(state.task==='appearance'){
      content+=`<h2 tabindex="-1">${tr('Vælg et udseende','Choose an appearance')}</h2><fieldset class="work-form-group"><legend>${tr('Farver','Colours')}</legend>${[['brand',tr('Fælles farver','Shared colours')],['mono',tr('Sort / hvid','Black / white')]].map(([value,label])=>`<label class="radio-row"><input type="radio" name="task-mode" value="${value}" ${state.appearance.mode===value?'checked':''}><span>${label}</span></label>`).join('')}</fieldset>`;
    }else{
      content+=`<h2 tabindex="-1">${tr('Gennemse dine valg','Review your choices')}</h2><dl class="review-list"><div><dt>${tr('Beskrivelse','Description')}</dt><dd>${escape(state.description.name)||tr('Ikke udfyldt','Not completed')}<br>${escape(state.description.note)||tr('Ingen note','No note')}<br><a href="#task-description?return=review" aria-label="${tr('Ændr beskrivelse','Change description')}">${tr('Ændr','Change')}</a></dd></div><div><dt>${tr('Udseende','Appearance')}</dt><dd>${state.appearance.mode==='mono'?tr('Sort / hvid','Black / white'):tr('Fælles farver','Shared colours')}<br><a href="#task-appearance?return=review" aria-label="${tr('Ændr udseende','Change appearance')}">${tr('Ændr','Change')}</a></dd></div></dl><p>${tr('Der sendes ingen oplysninger. Godkend markerer kun denne demooversigt som gennemgået.','No information is sent. Confirm only marks this demo overview as reviewed.')}</p>`;
    }
    content+=`<button type="submit" class="button primary">${state.task==='review'?tr('Godkend valg','Confirm choices'):state.returnToReview?tr('Gem og gennemse','Save and review'):tr('Gem og gå til overblik','Save and return to overview')}</button></form>`;
    screen.innerHTML=content;
  }
  document.getElementById('task-edit-screen').addEventListener('input',event=>{
    if(event.target.id==='task-name')state.description.name=event.target.value;
    if(event.target.id==='task-note')state.description.note=event.target.value;
    if(event.target.name==='task-mode')state.appearance.mode=event.target.value;
    if(state.task==='description'||state.task==='appearance'){state[state.task].touched=true;state[state.task].dirty=true;state.reviewed=false;renderTaskList();}
  });
  document.getElementById('task-edit-screen').addEventListener('submit',event=>{
    event.preventDefault();state.taskErrors=[];
    if(state.task==='description'&&!state.description.name.trim())state.taskErrors=[{href:'#task-name',text:tr('Skriv et navn.','Enter a name.')}];
    if(state.task==='review'&&!taskReady()){
      if(!state.description.saved||state.description.dirty)state.taskErrors.push({href:'#task-description?return=review',text:tr('Udfyld og gem beskrivelsen.','Complete and save the description.')});
      if(!state.appearance.saved||state.appearance.dirty)state.taskErrors.push({href:'#task-appearance?return=review',text:tr('Gem dit valg af udseende.','Save your appearance choice.')});
    }
    if(state.taskErrors.length){renderTasks();document.getElementById('task-errors').focus();return;}
    if(state.task==='review'){state.reviewed=true;renderTaskList();navigate('tasks');return;}
    state[state.task].saved=true;state[state.task].dirty=false;state[state.task].touched=true;
    renderTaskList();
    navigate(state.returnToReview?'task-review':'tasks');
  });
  function applyRoute(focus=false){
    const [route,query='']=location.hash.slice(1).split('?');
    if(!['app','tasks','task-description','task-appearance','task-review','setup-1','setup-2','setup-3'].includes(route))return;
    if(state.busy)cancelSimulation();
    state.menuOpen=false;state.taskErrors=[];
    state.view=route.startsWith('setup-')?'setup':route.startsWith('task')?'tasks':'app';
    state.task=route.startsWith('task-')?route.slice(5):null;
    state.returnToReview=new URLSearchParams(query).get('return')==='review';
    if(state.view==='setup')state.setup=Number(route.slice(-1))-1;
    renderSetup();renderWork();renderTasks();updateWindow();
    if(focus)focusHeading(state.view==='setup'?setupBody.querySelector('h2'):state.view==='tasks'?state.task?document.querySelector('#task-edit-screen h2'):document.getElementById('tasks-heading'):document.querySelector('.demo-product-heading h2'));
  }
  window.addEventListener('hashchange',()=>applyRoute(true));
  document.getElementById('demo-menu-toggle').addEventListener('click',()=>{state.menuOpen=!state.menuOpen;updateMenu();});
  document.getElementById('demo-main-nav').addEventListener('keydown',event=>{if(event.key==='Escape'&&state.menuOpen){state.menuOpen=false;updateMenu();document.getElementById('demo-menu-toggle').focus();}});
  document.getElementById('demo-menu-links').addEventListener('click',event=>{if(event.target.closest('a')){state.menuOpen=false;updateMenu();}});
  mobileMenu.addEventListener('change',()=>{state.menuOpen=false;updateMenu();});
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href="#content-title"],a[href="#task-name"]');
    if(link){event.preventDefault();document.querySelector(link.getAttribute('href')).focus();}
  });
  language.addEventListener('change',translate);
  theme.addEventListener('change',updateTheme);
  systemTheme.addEventListener('change',()=>{if(theme.value==='system')updateTheme();});
  if(!location.hash)history.replaceState(null,'','#app');
  updateTheme();translate();applyRoute();
})();
