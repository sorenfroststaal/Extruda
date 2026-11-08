/* Direct, explicit GitHub publication. Tokens are never persisted or exported. */
(() => {
 'use strict';
 const $=s=>document.querySelector(s),dialog=$('#publish-dialog'),button=$('#share-publish');
 const repo='https://api.github.com/repos/sorenfroststaal/Extruda';
 let draft=null,busy=false;button.disabled=typeof window.JobSharing?.buildDraft!=='function';
 const tr=(da,en)=>document.documentElement.lang==='en'?en:da;
 const status=message=>{$('#publish-status').textContent=message;$('#publish-result').textContent=message};
 function utf8Base64(value){const bytes=new TextEncoder().encode(value);let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(binary)}
 function failure(response){
  if(response.status===401)return tr('Adgangsnøglen er forkert eller udløbet.','The access token is invalid or expired.');
  if(response.status===403)return tr('GitHub afviste adgangen. Kontrollér at nøglen kun gælder Extruda og har Contents: Read and write.','GitHub denied access. Check repository access and Contents: Read and write.');
  if(window.JobPageEditing&&(response.status===409||response.status===422))return 'Siden er ændret samtidig. Hent din kladde og genindlæs siden. Intet er overskrevet.';
  if(response.status===409||response.status===422)return tr('Koden er optaget, eller hjemmesiden blev ændret samtidig. Vælg en ny kode og prøv igen.','The code is taken or the site changed concurrently. Choose a new code and retry.');
  return tr(`GitHub kunne ikke gemme siden (status ${response.status}). Dine valg er bevaret.`,`GitHub could not save the page (status ${response.status}). Your input is preserved.`);
 }
 button.addEventListener('click',()=>{
  if(busy)return;
  try{draft=window.JobSharing.buildDraft()}catch(e){$('#publish-result').textContent=e.message;$('#share-code').focus();return}
  $('#publish-review').textContent=tr('Adresse: ','Address: ')+draft.url;
  const selected=Object.entries(draft.settings).filter(([,v])=>v===true);
  const jobs=selected.filter(([id])=>/^job-\d+$/.test(id)).length;
  const skills=selected.filter(([id])=>/^skill-\d+$/.test(id)).length;
  $('#publish-counts').textContent=tr(`${jobs} ansættelser og ${skills} færdigheder. Ansøgningstekst, valgte personafsnit og billede følger forhåndsvisningen.`,`${jobs} jobs and ${skills} skills. Application text, personal sections and photo match your preview.`);
  $('#publish-token').value='';$('#publish-status').textContent='';dialog.showModal();$('#publish-token').focus();
 });
 $('#publish-close').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{$('#publish-token').value='';button.focus()});
 $('#publish-confirm').addEventListener('click',async()=>{
  if(busy||!draft)return;
  let token=$('#publish-token').value.trim();
  if(!token){status(tr('Indsæt din GitHub-adgangsnøgle.','Enter your GitHub access token.'));$('#publish-token').focus();return}
  const snapshot=draft,editing=window.JobPageEditing;if(editing&&(!editing.sha||snapshot.code!==editing.code)){status('Den eksisterende underside er ikke indlæst korrekt. Genindlæs før opdatering.');return;}
  busy=true;button.disabled=true;$('#publish-confirm').disabled=true;
  status(editing?tr('Kontrollerer den eksisterende underside…','Checking existing page…'):tr('Kontrollerer at sidekoden er ledig…','Checking that the page code is available…'));
  let committed=false;
  try{
   const headers={Accept:'application/vnd.github+json',Authorization:'Bearer '+token,'X-GitHub-Api-Version':'2026-03-10'};
   let previousSha='';
   if(editing){
    const current=await fetch(repo+'/contents/'+encodeURIComponent(snapshot.code)+'/index.html?ref=main',{headers,cache:'no-store'});
    if(!current.ok)throw new Error(failure(current));
    const file=await current.json();
    if(file.type!=='file'||file.path!==snapshot.code+'/index.html'||file.sha!==editing.sha)throw new Error('Siden er ændret siden indlæsning. Hent din kladde og genindlæs siden. Intet er overskrevet.');
    let raw;if(file.content)raw=new TextDecoder().decode(Uint8Array.from(atob(file.content.replace(/\s/g,'')),c=>c.charCodeAt(0)));else{const large=await fetch(repo+'/contents/'+encodeURIComponent(snapshot.code)+'/index.html?ref=main',{headers:{...headers,Accept:'application/vnd.github.raw+json'},cache:'no-store'});if(!large.ok)throw new Error(failure(large));raw=await large.text();}
    const currentPage=new DOMParser().parseFromString(raw,'text/html');
    if(!currentPage.body.classList.contains('shared-application')||currentPage.querySelectorAll('main .sheet').length!==2)throw new Error('Filen er ikke en ansøgningsside. Intet er overskrevet.');
    previousSha=file.sha;
   }else{
    const existing=await fetch(repo+'/contents?ref=main',{headers,cache:'no-store'});
    if(!existing.ok)throw new Error(failure(existing));
    const entries=await existing.json();
    if(!Array.isArray(entries))throw new Error(tr('GitHub returnerede ikke en gyldig mappeoversigt.','GitHub did not return a valid directory listing.'));
    if(entries.some(n=>n.name.toLowerCase()===snapshot.code.toLowerCase()))throw new Error(tr('Denne sidekode er allerede i brug. Vælg en anden kode.','This page code is already in use. Choose another code.'));
   }
   const publication=[...crypto.getRandomValues(new Uint8Array(16))].map(n=>n.toString(16).padStart(2,'0')).join('');
   const html=snapshot.html.replace('</head>',`<meta name="extruda-publication" content="${publication}"></head>`);
   if(new TextEncoder().encode(html).length>12000000)throw new Error(tr('Siden er for stor. Vælg et mindre billede og prøv igen.','The page is too large. Choose a smaller image and retry.'));
   status(tr('Gemmer den valgte underside hos GitHub…','Saving the selected page to GitHub…'));
   const response=await fetch(repo+'/contents/'+encodeURIComponent(snapshot.code)+'/index.html',{method:'PUT',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({message:(editing?'Update selected application ':'Publish selected application ')+snapshot.code,branch:'main',...(previousSha?{sha:previousSha}:{}),content:utf8Base64(html)})});
   if(!response.ok)throw new Error(failure(response));
   committed=true;const saved=await response.json();if(editing){editing.sha=saved.content.sha;window.JobWizard?.save();}
   token='';$('#publish-token').value='';
   status(tr('Undersiden er gemt. Venter på at hjemmesiden bliver opdateret…','Page saved. Waiting for the website to update…'));
   // Public verification needs no token. Do not report a page as live before it is served.
   let live=false;
   for(let attempt=0;attempt<36;attempt++){
    await new Promise(resolve=>setTimeout(resolve,4000));
    try{const check=await fetch(snapshot.url+'/?publication='+publication,{cache:'no-store'});if(check.ok&&(await check.text()).includes(publication)){live=true;break}}catch{}
   }
   status(live?tr('Undersiden er publiceret: ','Page is live: ')+snapshot.url:tr('Siden er gemt hos GitHub, men er endnu ikke bekræftet online. Vent lidt og åbn adressen; publicér ikke igen med samme kode. ','Saved on GitHub but not yet confirmed live. Wait and open the address; do not publish the same code again. ')+snapshot.url);
   const link=document.createElement('a');link.href=snapshot.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=tr('Åbn undersiden','Open page');$('#publish-result').append(document.createTextNode(' '),link);
  }catch(error){status(committed?tr('Siden er gemt hos GitHub. Publiceringen kunne ikke bekræftes endnu: ','The page was saved on GitHub but publication is not confirmed yet: ')+snapshot.url:(error instanceof TypeError?tr('Forbindelsen til GitHub blev afbrudt. Dine valg er bevaret. Kontrollér adressen før du prøver igen.','Connection to GitHub was interrupted. Your input is preserved. Check the address before retrying.'):error.message))}
  finally{token='';$('#publish-token').value='';busy=false;button.disabled=false;$('#publish-confirm').disabled=false}
 });
})();
