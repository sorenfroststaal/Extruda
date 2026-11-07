/* Public page content. Drafts and research stay in the existing local workspace. */
window.WorkshopContent = {
  technology: [
    ['Jeg bruger 3D-print, laserskæring, CNC, digitalt design og AI til at udvikle løsninger på konkrete behov. Værktøjet vælges efter opgaven.',
     'I use 3D printing, laser cutting, CNC, digital design and AI to develop solutions to specific needs. The task determines the tool.'],
    ['Min vision er lokal produktion med fælles, åbne designs. En løsning kan tilpasses og fremstilles hjemme, på en skole eller i et værksted. Vi kan reparere ting og dele forbedringer, så andre kan bruge dem.',
     'My vision is local production using shared, open designs. A solution can be adapted and made at home, at school or in a workshop. We can repair things and share improvements for others to use.']
  ],
  role: [
    ['Jeg er god til teknologi, til at tale med mennesker og til at undervise. Jeg finder behov sammen med dem, der har dem, og udvikler noget, de kan bruge. Mine løsninger her skal altid deles open source med filer og vejledninger, som andre kan ændre og bygge videre på.',
     'I am good with technology, talking to people and teaching. I identify needs with the people who have them and develop something they can use. My solutions here will always be shared as open source, with files and instructions others can adapt and build on.'],
    ['ADHD og hverdagen med børn med diagnoser er en del af mit eget liv. Jeg ved, at overskuddet til at finde og tilpasse en løsning kan være lille. Det skal være enkelt at få hjælp og at bidrage med det, man kan.',
     'ADHD and everyday life with children with diagnoses are part of my own life. I know there can be little energy left to find and adapt a solution. Getting help and contributing what you can should be straightforward.'],
    ['Jeg vil give både brugbare løsninger og værktøjer til selv at løse noget og hjælpe andre. Man skal kunne få hjælp uden at føle sig som en belastning. Jeg underviser gennem rigtige opgaver for andre mennesker. Min erfaring er, at det gør det lærte lettere at huske og bruge.',
     'I want to provide both useful solutions and tools for solving things yourself and helping others. People should be able to get help without feeling like a burden. I teach through real tasks for other people. In my experience, this makes learning easier to remember and use.']
  ],
  projects: [
    {name:'Open Planner',url:'../open-planner/',source:'https://github.com/sorenfroststaal/Extruda/tree/main/open-planner',description:['Lav og print kort til hverdagsplanlægning. Kortmål og indhold kan tilpasses.','Create and print cards for everyday planning. Card sizes and content can be adapted.']},
    {name:'Learning Books',url:'../learning-books/app.html',source:'https://github.com/sorenfroststaal/Extruda/tree/main/learning-books',description:['Lav øvebøger til børn. En prøveversion, hvor en voksen skal gennemgå materialet.','Create practice books for children. A trial version; an adult needs to review the material.']},
    {name:'Mobile as Webcam',url:'../mobile-as-webcam/',source:'https://github.com/sorenfroststaal/Extruda-Mobile-As-Webcam',description:['Brug telefonen som kamera på en Windows-computer. Kræver installation.','Use a phone as a camera on a Windows computer. Installation required.']}
  ],
  render(t,pair,esc) {
    return `<section id="technology" class="public-section"><h2>${t('Teknologi og udvikling','Technology and development')}</h2>${this.technology.map(p=>`<p>${pair(p)}</p>`).join('')}</section>
      <section id="role" class="public-section"><h2>${t('Min rolle','My role')}</h2>${this.role.map(p=>`<p>${pair(p)}</p>`).join('')}</section>
      <section id="projects" class="public-section"><h2>${t('Konkrete projekter','Practical projects')}</h2><p>${t('Her samler jeg de løsninger, jeg laver, som andre kan bruge. Filer, kode og vilkår findes ved det enkelte projekt.','This is where I collect the solutions I make for others to use. Files, code and terms are available with each project.')}</p><ul class="project-links">${this.projects.map(p=>`<li><a class="project-name" href="${esc(p.url)}">${esc(p.name)} ↗</a><p>${pair(p.description)}</p><a class="project-source" href="${esc(p.source)}">${t('Kildekode','Source code')} ↗</a></li>`).join('')}</ul></section>`;
  },
  markdown(lang) {
    const t=(da,en)=>lang==='en'?en:da, pair=p=>p[lang==='en'?1:0];
    return `## ${t('Teknologi og udvikling','Technology and development')}\n\n${this.technology.map(pair).join('\n\n')}\n\n## ${t('Min rolle','My role')}\n\n${this.role.map(pair).join('\n\n')}\n\n## ${t('Konkrete projekter','Practical projects')}\n\n${this.projects.map(p=>`- ${p.name}: ${pair(p.description)}\n  https://extruda.dk/${p.url.slice(3)}\n  ${p.source}`).join('\n\n')}\n\n`;
  }
};
