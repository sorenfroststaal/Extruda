/* Application layout derived from the user's PDF mockup; all prose stays editable. */
(() => {
 const $=s=>document.querySelector(s),on=id=>document.getElementById(id)?.checked;
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const paragraphs=s=>s.split(/\n\s*\n/).filter(Boolean).map(p=>`<p>${escape(p).replaceAll('\n','<br>')}</p>`).join('');
 window.ApplicationTemplate={
  render({source,lang,photo,translated}){
   const tr=(da,en)=>lang==='da'?da:en;
   const company=$('#application-company').value.trim(),role=$('#application-role').value.trim();
   const light=color=>{const rgb=color.replace('#','').match(/../g).map(n=>parseInt(n,16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722>.179};
   const contrast=(light(on('mono')?'#222222':$('#primary').value)?' vision-dark-ink':'')+(!light(on('mono')?'#999999':$('#accent').value)?' accent-light-ink':'');
   const selected=[0,1,2].filter(i=>on('track-'+i));
   const headings=[tr(company?`Hvorfor ${company}?`:'Hvorfor virksomheden?',company?`Why ${company}?`:'Why this company?'),tr(role?`Hvad kan jeg tilbyde fagligt som ${role}?`:'Hvad kan jeg tilbyde fagligt i rollen?',role?`What can I contribute as ${role}?`:'What can I contribute professionally?'),tr('Hvad kan jeg tilbyde som kollega?','What can I contribute as a colleague?'),tr('Hvad skal der til, for at jeg lykkes?','What do I need to succeed?'),tr('Hvad kan stå i vejen for, at jeg lykkes?','What could prevent me from succeeding?')];
   const copy=source.querySelector('.work-aside-copy');
   const introduction=copy?translated(copy).innerHTML:'';
   const numbers=selected.map(i=>i+1);
   const list=numbers.length>1?numbers.slice(0,-1).join(', ')+tr(' og ',' and ')+numbers.at(-1):numbers.join('');
   const trackReference=selected.length===3?tr('alle tre spor','all three tracks'):tr('spor '+list,(selected.length===1?'track ':'tracks ')+list);
   const explanation=tr('Det har jeg samlet i tre spor.','I have brought these interests together in three tracks.')+(selected.length?' '+tr(`Jeg søger hos jer, fordi stillingen rummer elementer fra ${trackReference} og kan være et skridt i den retning, jeg gerne vil.`,`I am applying because this position includes elements of ${trackReference} and could be a step in the direction I want to take.`):'');
   const labels=[tr('Mennesker og pædagogik','People and education'),tr('Håndværk og produktion','Craft and production'),tr('Data og digitale værktøjer','Data and digital tools')];
   const icons=['social','craft','digital'];
   const trackStrip=on('application-track-strip')?`<div class="application-tracks" aria-label="${tr('De tre spor','Three tracks')}">${icons.map((icon,i)=>`<div class="application-track ${!selected.includes(i)?'is-muted':''}"><img src="../Assets/Icons/work/${icon}.svg" alt=""><strong>${tr('Spor','Track')} ${i+1}</strong><span>${labels[i]}</span></div>`).join('')}</div>`:'';
   const match=$('#application-match').value.trim()||(selected.length?tr('Jeg ser stillingen som et match til ','I see this position as a match for ')+trackReference+'.':'');
   const sections=headings.map((heading,i)=>on('application-section-'+i+'-show')?`<section class="application-answer" data-application-section="${i}"><h3>${escape(heading)}</h3>${paragraphs($('#application-section-'+i).value)}</section>`:'').join('');
   return `<div class="application-template${contrast}"><div class="application-hero"><div class="identity ${on('photo')?'has-portrait':''}">${on('photo')?`<img class="portrait" src="${escape(photo)}" alt="Søren Frost Staal">`:''}<div><h1>Søren Frost Staal</h1><img class="slogan" src="../Assets/Brand/slogan-${lang}.svg" alt="${tr('Jeg kan sgu nogle ting. Du kan nogle andre. Hvad kan vi sammen?','I can do some stuff. You can too. What can we do together?')}"></div></div>${on('application-vision-show')?`<section class="application-vision ${on('photo')?'has-portrait':''} ${on('application-ronaldo-show')?'has-ronaldo':''}"><div class="application-vision-copy">${introduction}<p>${escape(explanation)}</p></div>${on('application-ronaldo-show')?'<img class="application-ronaldo" src="../Assets/Icons/ronaldo-pose.svg?v=5" alt="">':''}</section>`:''}</div><div class="application-position-row">${trackStrip}<section class="application-position"><h2>${escape(tr('Stillingen jeg søger','Position I am applying for')+(role?': '+role:''))}</h2>${on('application-match-show')&&match?`<p>${escape(match)}</p>`:''}</section></div><div class="application-answer-area">${on('application-heading-show')?`<h2 class="application-document-title">${escape($('#title').value)}</h2>`:''}${paragraphs($('#letter').value)}${sections}</div></div>`;
  },
  fit(content,available){
   const template=content.querySelector('.application-template');if(!template)return;
   // Fill the writing surface only when no optional track appendices follow it.
   template.style.minHeight=content.children.length===1?Math.max(0,available-1)+'px':'0';
  }
 };
})();
