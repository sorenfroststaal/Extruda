(() => {
const gallery=document.querySelector('.gallery');
const viewer=document.getElementById('image-viewer');
const image=document.getElementById('gallery-image');
const largeImage=document.getElementById('viewer-image');
const zoomButton=document.getElementById('viewer-zoom');
const images=[
  {file:'square.svg',width:1080,height:1080,da:'Neutral illustration · kvadratisk format (1:1).',en:'Neutral illustration · square format (1:1).'},
  {file:'portrait.svg',width:1080,height:1920,da:'Neutral illustration · stående format (9:16).',en:'Neutral illustration · portrait format (9:16).'},
  {file:'landscape.svg',width:1440,height:1080,da:'Neutral illustration · liggende format (4:3).',en:'Neutral illustration · landscape format (4:3).'},
  {file:'panorama.svg',width:1680,height:720,da:'Neutral illustration · panoramaformat (21:9).',en:'Neutral illustration · panorama format (21:9).'}
];
let index=0;
let zoomed=false;
let swipeStart=null;
let suppressClick=false;
const thumbnails=document.querySelector('.gallery-thumbnails');
images.forEach((item,i)=>{
  const button=document.createElement('button');
  button.type='button';
  button.className='gallery-thumbnail';
  button.addEventListener('click',()=>selectImage(i));
  const thumb=document.createElement('img');
  thumb.src=`../Assets/Examples/${item.file}`;
  thumb.alt='';
  thumb.loading='lazy';
  thumb.width=item.width;
  thumb.height=item.height;
  button.append(thumb);
  thumbnails.append(button);
});
function translated(item){return item[document.documentElement.lang==='en'?'en':'da'];}
function setZoom(value){
  zoomed=value;
  document.querySelector('.viewer-stage').classList.toggle('zoomed',value);
  zoomButton.setAttribute('aria-pressed',String(value));
  zoomButton.firstElementChild.textContent=document.documentElement.lang==='en'?(value?'Fit to screen':'View at 100%'):(value?'Tilpas til skærm':'Vis 100 %');
  document.querySelector('.viewer-stage').scrollTo(0,0);
}
function syncGallery(){
  const item=images[index];
  const en=document.documentElement.lang==='en';
  const count=`${index+1} ${en?'of':'af'} ${images.length}`;
  for(const node of [image,largeImage]){
    if(node.getAttribute('src')!==`../Assets/Examples/${item.file}`)node.src=`../Assets/Examples/${item.file}`;
    node.alt=translated(item);
    node.width=item.width;
    node.height=item.height;
  }
  document.getElementById('gallery-caption').textContent=translated(item);
  document.getElementById('viewer-caption').textContent=translated(item);
  document.querySelector('.gallery-count').textContent=count;
  document.getElementById('viewer-count').textContent=count;
  document.querySelectorAll('[data-gallery-prev],#viewer-prev').forEach(button=>button.disabled=index===0);
  document.querySelectorAll('[data-gallery-next],#viewer-next').forEach(button=>button.disabled=index===images.length-1);
  [...thumbnails.children].forEach((button,i)=>{
    button.setAttribute('aria-label',`${en?'Show image':'Vis billede'} ${i+1}: ${translated(images[i])}`);
    button.setAttribute('aria-pressed',String(i===index));
  });
  document.querySelectorAll('[data-alt-da][data-alt-en]').forEach(node=>node.alt=node.dataset[en?'altEn':'altDa']);
  gallery.setAttribute('aria-roledescription',en?'carousel':'karrusel');
  setZoom(zoomed);
}
function selectImage(next){index=Math.max(0,Math.min(images.length-1,next));setZoom(false);syncGallery();}
function move(amount){selectImage(index+amount);}
document.querySelectorAll('[data-gallery-prev],#viewer-prev').forEach(button=>button.addEventListener('click',()=>move(-1)));
document.querySelectorAll('[data-gallery-next],#viewer-next').forEach(button=>button.addEventListener('click',()=>move(1)));
document.querySelector('.gallery-open').addEventListener('click',()=>{
  if(suppressClick){suppressClick=false;return;}
  setZoom(false);
  viewer.showModal();
  document.getElementById('viewer-close').focus();
});
document.getElementById('viewer-close').addEventListener('click',()=>viewer.close());
zoomButton.addEventListener('click',()=>setZoom(!zoomed));
viewer.addEventListener('close',()=>setZoom(false));
viewer.addEventListener('click',event=>{
  if(event.target!==viewer)return;
  const rect=viewer.getBoundingClientRect();
  if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)viewer.close();
});
for(const region of [gallery,viewer])region.addEventListener('keydown',event=>{
  if(zoomed)return;
  if(event.key==='ArrowRight'){event.preventDefault();move(1);}
  if(event.key==='ArrowLeft'){event.preventDefault();move(-1);}
});
const swipeArea=document.querySelector('.gallery-open');
swipeArea.addEventListener('pointerdown',event=>{suppressClick=false;swipeStart={x:event.clientX,y:event.clientY};});
swipeArea.addEventListener('pointercancel',()=>{swipeStart=null;});
swipeArea.addEventListener('pointerup',event=>{
  if(!swipeStart)return;
  const dx=event.clientX-swipeStart.x;
  const dy=event.clientY-swipeStart.y;
  if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.5){move(dx<0?1:-1);suppressClick=true;}
  swipeStart=null;
});
for(const node of [image,largeImage])node.addEventListener('error',()=>{
  const en=document.documentElement.lang==='en';
  const caption=document.getElementById(node===image?'gallery-caption':'viewer-caption');
  caption.textContent=en?'The image could not be loaded. ':'Billedet kunne ikke indlæses. ';
  const link=document.createElement('a');
  link.href=`../Assets/Examples/${images[index].file}`;
  link.textContent=en?'Open original file':'Åbn originalfil';
  caption.append(link);
});
document.addEventListener('extruda:language',syncGallery);
syncGallery();

})();
