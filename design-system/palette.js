(() => {
const inputs=['primary','accent','paper'].map(name=>document.getElementById(`colour-${name}`));
const customFields=document.getElementById('custom-palette');
const previews=[...document.querySelectorAll('.palette-output')];
const contrastStatus=document.getElementById('palette-contrast');
function luminance(hex){
  const rgb=hex.match(/[a-f\d]{2}/gi).map(part=>parseInt(part,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
}
function inkFor(hex){return luminance(hex)>.179?'#000000':'#ffffff';}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
function updatePalette(){
  const mode=document.querySelector('[name="palette-mode"]:checked').value;
  customFields.disabled=mode!=='custom';
  const values=mode==='custom'?inputs.map(input=>input.value):mode==='mono'?['#ffffff','#ffffff','#ffffff']:['#28645f','#e8b08e','#ffffff'];
  const [primary,accent,paper]=values;
  for(const preview of previews){
    for(const [name,value]of Object.entries({'content-primary':primary,'content-primary-text':inkFor(primary),'content-accent':accent,'content-accent-text':inkFor(accent),'content-paper':paper,'content-text':inkFor(paper)}))preview.style.setProperty(`--${name}`,value);
    preview.classList.toggle('is-mono',mode==='mono');
  }
  inputs.forEach(input=>document.getElementById(input.id.replace('colour-','hex-')).value=input.value.toUpperCase());
  const en=document.documentElement.lang==='en';
  const low=contrast(primary,paper)<1.5||contrast(accent,paper)<1.5||contrast(primary,accent)<1.5;
  contrastStatus.textContent=mode==='mono'?(en?'Black / white: labels, outlines and patterns distinguish the elements.':'Sort / hvid: labels, streger og mønstre adskiller elementerne.'):low?(en?'Some selected colours are similar. Text remains black or white; use labels, outlines or patterns to distinguish the coloured elements.':'Nogle af de valgte farver ligger tæt. Tekst forbliver sort eller hvid; brug labels, streger eller mønstre til at adskille de farvede elementer.'):(en?'Text is automatically black or white on each chosen background. The app controls retain their fixed theme colours.':'Tekst vælges automatisk som sort eller hvid på hver valgt baggrund. Appens knapper og felter beholder temaets faste farver.');
}
document.querySelectorAll('[name="palette-mode"]').forEach(input=>input.addEventListener('change',updatePalette));
inputs.forEach(input=>input.addEventListener('input',updatePalette));
document.addEventListener('extruda:language',updatePalette);
updatePalette();

})();
