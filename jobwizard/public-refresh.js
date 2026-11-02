/* Keep selected factual records current; preserve the authored application. */
(async()=>{
 try{
  const response=await fetch('../arbejdsliv/',{cache:'no-cache'});if(!response.ok)return;
  const source=new DOMParser().parseFromString(await response.text(),'text/html');
  const language=document.documentElement.lang;
  const text=node=>node?.getAttribute('data-'+language)||node?.textContent.trim()||'';
  document.querySelectorAll('[data-source-skill]').forEach(row=>{
   const skill=source.getElementById(row.dataset.sourceSkill);if(!skill)return;
   row.firstElementChild.textContent=text(skill.querySelector('.skill-name'));
   const rating=skill.querySelector('.skill-rating');if(rating)row.querySelector('.skill-rating')?.replaceWith(rating.cloneNode(true));
  });
  const jobs=[...source.querySelectorAll('.cv-job')];
  document.querySelectorAll('[data-source-employer]').forEach(row=>{
   const job=jobs.find(n=>n.querySelector('summary img')?.getAttribute('src').split('/').pop()===row.dataset.sourceEmployer&&text(n.querySelector('.cv-row-period'))===row.dataset.sourcePeriod);
   if(!job)return;
   row.querySelector('strong').textContent=text(job.querySelector('summary strong'));
   row.querySelector('small').textContent=text(job.querySelector('.cv-job-title'));
   row.querySelector('img').src=new URL(job.querySelector('summary img').getAttribute('src'),new URL('../arbejdsliv/',document.baseURI)).href;
  });
 }catch{/* The selected snapshot remains readable if the source cannot load. */}
})();
