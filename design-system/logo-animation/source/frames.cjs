const fs=require('fs'),path=require('path');


const original=fs.existsSync(path.join(__dirname,'original-logo.svg'))?path.join(__dirname,'original-logo.svg'):path.resolve(__dirname,'../../../Assets/Brand/extruda-logo-horizontal-color.svg');
const source=fs.readFileSync(original,'utf8');
const inner=source.slice(source.indexOf('>')+1,source.lastIndexOf('</svg>'));
const parts=[...inner.matchAll(/<path[^>]+\/>|<g[\s\S]*<\/g>/g)].map(x=>x[0]);
const letters=[...parts[3].matchAll(/<path[^>]+\/>/g)].map(x=>x[0]);
const thinX='<path d="M153 -118 L236 0 M235 -118 L153 0" fill="none" stroke="#343B3B" stroke-width="12"/>';
const clamp=u=>Math.max(0,Math.min(1,u)),ease=u=>{u=clamp(u);return u*u*(3-2*u)};
const variants=[
 {id:'01-fold',name:'Fold',seconds:3.8,click:3.3},
 {id:'02-drej',name:'Drej',seconds:3.6,click:3.1},
 {id:'03-boelge',name:'Bølge',seconds:4,click:3.5},
 {id:'04-midtpunkt',name:'Midtpunkt',seconds:3.6,click:3.1},
 {id:'05-loeft',name:'Løft',seconds:3.8,click:3.3}
];
function thin(p,i){const silhouette=p.replace(/fill="#[A-Fa-f0-9]+"/,'fill="white"').replace('/>',' stroke="black" stroke-width="28" stroke-linejoin="round"/>');return `<defs><mask id="inset-${i}" maskUnits="userSpaceOnUse" x="0" y="0" width="256" height="256">${silhouette}</mask></defs><g mask="url(#inset-${i})">${p}</g>`;}
const wrap=c=>`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="480" viewBox="0 0 1200 480"><rect width="1200" height="480" fill="#F5F0E8"/><g transform="translate(145 138) scale(.8)">${c}</g></svg>`;
function frame(v,k,t){const clicked=t>=v.click;const fade=ease((t-.05)/1.05);const u=ease((t-.05)/1.7);return wrap(parts.map((p,i)=>{
 let tr='';
 if(i<3){if(!clicked)p=thin(p,i);let x=0,y=0,r=0,s=1,sx=1,sy=1;const q=ease((t-.05-(k===2?i*.13:0))/1.65),left=1-q;
 if(k===0){sx=.05+.95*q;r=[-10,10,-7][i]*left;x=[-10,14,-8][i]*left;}
 if(k===1){r=-38*left;x=[-14,16,-8][i]*left;y=[-16,-2,17][i]*left;}
 if(k===2){y=20*left-8*Math.sin(Math.PI*q);r=[-4,4,-3][i]*left;}
 if(k===3){x=[-28,32,-20][i]*left;y=[-30,-5,27][i]*left;s=.9+.1*q;}
 if(k===4){y=24*left;s=.96+.04*q;r=[-6,5,-3][i]*left;}
 if(clicked){x=y=r=0;s=sx=sy=1;}
 tr=`translate(${x} ${y}) translate(128 128) rotate(${r}) scale(${s*sx} ${s*sy}) translate(-128 -128)`;
 }else{
 if(!clicked){let xtr='';
 if(k===0)xtr=`translate(194.5 -59) scale(${.045+.955*u} 1) translate(-194.5 59)`;
 if(k===1)xtr=`rotate(${-90*(1-u)} 194.5 -59)`;
 if(k===2)xtr=`translate(0 ${14*(1-u)-6*Math.sin(Math.PI*u)})`;
 if(k===3)xtr=`translate(194.5 -59) scale(${.7+.3*u}) translate(-194.5 59)`;
 if(k===4)xtr=`translate(0 ${18*(1-u)})`;
 p=p.replace(letters[1],`<g transform="${xtr}">${thinX}</g>`);
 }
 tr=`translate(0 ${clicked?0:5*(1-fade)})`;
 }
 // Soft, single settling gesture immediately before the final thickness change.
 const settle=ease((t-(v.click-.3))/.3);
 if(!clicked&&k===4){const lift=-3*Math.sin(Math.PI*settle);tr=`translate(0 ${lift}) ${tr}`;}
 return `<g opacity="${fade}" transform="${tr}">${p}</g>`;
 }).join(''));}

module.exports={frame:t=>frame(variants[3],3,t)};
