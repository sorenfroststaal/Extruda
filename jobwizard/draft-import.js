/* Import a private draft without publishing its contents. */
(() => {
 'use strict';
 if (window.JobPageEditing) return;
 const form=document.getElementById('settings');
 const box=document.createElement('fieldset');
 box.innerHTML='<legend data-da="Åbn gemt kladde" data-en="Open a saved draft">Åbn gemt kladde</legend><label><span data-da="Jobwizard-JSON fra en ansøgningspakke" data-en="Jobwizard JSON from an application package">Jobwizard-JSON fra en ansøgningspakke</span><input type="file" id="draft-import" accept=".json,application/json"></label><p class="help" data-da="Kladden erstatter valgene i formularen og gemmes i denne browser. Filen publiceres ikke. Hent din aktuelle kladde først, hvis du vil bevare den." data-en="The draft replaces the form choices and is saved in this browser. The file is not published. Download your current draft first if you want to keep it.">Kladden erstatter valgene i formularen og gemmes i denne browser. Filen publiceres ikke. Hent din aktuelle kladde først, hvis du vil bevare den.</p><p id="draft-import-status" role="status"></p>';
 form.prepend(box);
 box.querySelectorAll('[data-da][data-en]').forEach(n=>n.textContent=n.getAttribute(document.documentElement.lang==='en'?'data-en':'data-da'));
 const input=box.querySelector('input'),status=box.querySelector('[role=status]');
 input.addEventListener('change',async()=>{
  const en=document.documentElement.lang==='en';
  try{
   const file=input.files[0];if(!file)return;
   if(!document.querySelector('#choices input'))throw Error(en?'Wait for the profile to load.':'Vent på, at profilen er indlæst.');
   if(file.size>12000000)throw Error(en?'The file is too large.':'Filen er for stor.');
   const draft=JSON.parse(await file.text());
   if(draft.format!=='extruda-job-page-v1'||!/^[A-Za-z0-9]{4,12}$/.test(draft.code)||!draft.settings||Array.isArray(draft.settings)||typeof draft.settings!=='object')throw Error(en?'Choose a Jobwizard draft.':'Vælg en Jobwizard-kladde.');
   if(Object.values(draft.settings).some(v=>typeof v!=='string'&&typeof v!=='boolean'))throw Error(en?'Invalid draft settings.':'Kladden har ugyldige indstillinger.');
   const parsed=new DOMParser().parseFromString(draft.html||'','text/html');
   const portrait=parsed.querySelector('.portrait')?.getAttribute('src');
   window.JobWizard.restore({...draft.settings,'share-code':draft.code},portrait);
   window.JobWizard.save();
   status.textContent=en?'Draft '+draft.code+' loaded. Review the content before exporting.':'Kladde '+draft.code+' indlæst. Gennemse indholdet før eksport.';
  }catch(error){status.textContent=error instanceof SyntaxError?(en?'The file is not valid JSON.':'Filen er ikke gyldig JSON.'):error.message;}
  finally{input.value='';}
 });
})();
