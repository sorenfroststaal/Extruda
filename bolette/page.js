'use strict';
(function(){
var $=function(id){return document.getElementById(id)};
var kr=function(n){return Math.round(n).toLocaleString('da-DK')+' kr.'};

/* ---------- forløb ---------- */
var steps=[
 {pos:0,t:'Virksomhed B udsteder en faktura på 200.000 kr. plus moms for nedrivningsarbejde, som aldrig er udført. Her kan stk. 2, nr. 2, komme i spil.'},
 {pos:1,t:'Virksomhed A bogfører fakturaen og tager 50.000 kr. i købsmoms med på sin momsangivelse. Her kan stk. 2, nr. 1, komme i spil.'},
 {pos:2,t:'Angivelsen lander hos Skatteforvaltningen, som udtager virksomheden til kontrol.'},
 {pos:2,stamp:1,t:'Kontrollen viser, at der ikke er leveret noget. Fakturaen har et urigtigt indhold, og begge virksomheder vidste det.'},
 {pos:2,stamp:1,gone:1,t:'Skatteforvaltningen kan nu inddrage registreringen hos både A, der brugte fakturaen, og B, der udstedte den.'}
];
var cur=steps.length-1,timer=null,inv=$('inv'),dots=$('dots');
steps.forEach(function(_,i){var b=document.createElement('button');b.type='button';b.setAttribute('aria-label','Trin '+(i+1));b.onclick=function(){stop();show(i)};dots.appendChild(b)});
function show(i){cur=i;var s=steps[i];
  inv.style.left=['16.66%','50%','83.33%'][s.pos];
  inv.classList.toggle('stamped',!!s.stamp);
  [0,1,2].forEach(function(k){$('n'+k).classList.toggle('on',k===s.pos||(s.gone&&k<2))});
  ['r0','r1'].forEach(function(id){$(id).classList.toggle('gone',!!s.gone);$(id).textContent=s.gone?'inddraget':'registreret'});
  $('capN').textContent=i+1;$('capT').textContent=s.t;
  [].forEach.call(dots.children,function(d,k){d.classList.toggle('cur',k===i)});
}
function stop(){if(timer){clearInterval(timer);timer=null}}
$('play').onclick=function(){stop();show(0);timer=setInterval(function(){if(cur>=steps.length-1){stop();return}show(cur+1)},2800)};
$('prev').onclick=function(){stop();show(Math.max(0,cur-1))};
$('next').onclick=function(){stop();show(Math.min(steps.length-1,cur+1))};
show(cur);

/* ---------- lovtekst ---------- */
var gloss={
 kan:['"kan"','Skatteforvaltningen har en mulighed, ikke en pligt. Den skal foretage en konkret vurdering i hver sag.'],
 inddrage:['"inddrage"','Virksomheden mister en registrering, den allerede har, for eksempel for moms, A-skat og AM-bidrag. Stk. 2 nævner kun inddragelse. Stk. 1 om urigtig adresse og stråmænd giver også adgang til at nægte en ny registrering.'],
 vegne:['"nogen på dennes vegne"','Det er uden betydning, om det er ejeren, en ansat eller en anden med tilknytning til virksomheden, der har afgivet oplysningerne.'],
 tilregn:['"forsætlig eller groft uagtsomt"','Virksomheden skal have vidst det eller have handlet groft uforsvarligt. Begreberne forstås som i lovens straffebestemmelse i § 17, men der behøver ikke være en straffesag. En undskyldelig fejl er ikke nok.'],
 brug:['"til brug for angivelse eller indberetning"','Der er ingen formkrav. Oplysningerne kan være afgivet i momsangivelsen i TastSelv Erhverv, i oplysningsskemaet eller på anden måde. Det afgørende er, at de er afgivet til brug for og har haft indflydelse på opgørelsen af skatter og afgifter.'],
 urigtig:['"urigtigt indhold"','Enten en faktura for noget, der slet ikke er leveret, eller en faktura for en reel levering, som er udformet forkert, for eksempel med et forkert beløb.'],
 anden:['"anden urigtig dokumentation"','For eksempel et afregningsbilag eller en kreditnota. Både papir og elektroniske dokumenter er omfattet.'],
 egnet:['"egnet til at blive anvendt som grundlag"','Fejlen skal kunne påvirke opgørelsen af en virksomheds skatter eller afgifter. En forkert dato er kun omfattet, hvis datoen kan få betydning for opgørelsen.']
};
var lawBtns=document.querySelectorAll('.law [role=button]');
function pick(k){[].forEach.call(lawBtns,function(b){b.setAttribute('aria-pressed',b.dataset.k===k?'true':'false')});$('gK').textContent=gloss[k][0];$('gT').textContent=gloss[k][1]}
[].forEach.call(lawBtns,function(b){b.onclick=function(){pick(b.dataset.k)};b.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();pick(b.dataset.k)}}});
pick('tilregn');

/* ---------- sagsbygger ---------- */
var role=1;
var skyldN=['Undskyldelig fejl','Simpel uagtsomhed','Grov uagtsomhed','Forsæt'];
var skyldT=[
 'Eksempel: en tastefejl i et beløb, som rettes, så snart den bliver opdaget.',
 'Eksempel: virksomheden burde have opdaget fejlen, men har ikke handlet groft uforsvarligt.',
 'Eksempel: virksomheden bogfører fakturaer uden at kunne dokumentere nogen samhandel og overser tydelige advarselstegn.',
 'Eksempel: ledelsen ved, at arbejdet aldrig er udført, og bruger alligevel fakturaen.'];
var mdr=['juli','august','september','oktober','november','december','januar','februar','marts','april','maj','juni'];
function datoTxt(i){return mdr[i%12]+' '+(i<6?2023:2024)}
function setRole(r){role=r;$('role1').setAttribute('aria-pressed',r===1?'true':'false');$('role2').setAttribute('aria-pressed',r===2?'true':'false');
  $('datoL').textContent=r===1?'Oplysningen afgivet':'Fakturaen udstedt';
  $('betydL').textContent=r===1?'Betydning for angivelsen':'Egnet som grundlag';calc()}
function evalCase(c){
  var urigtig=c.cont!=='ok';
  var betyd=urigtig&&c.betyd===1;
  var skyld=c.skyld>=2;
  var tid=c.dato>=6;
  return {urigtig:urigtig,betyd:betyd,skyld:skyld,tid:tid,all:urigtig&&betyd&&skyld&&tid};
}
function calc(){
  var c={cont:$('cont').value,betyd:+$('betyd').value,skyld:+$('skyld').value,dato:+$('dato').value};
  var r=evalCase(c);
  $('skyldO').textContent=skyldN[c.skyld];$('skyldT').textContent=skyldT[c.skyld];
  $('datoO').textContent=datoTxt(c.dato);
  [].forEach.call($('scale').children,function(s,i){s.className=i===c.skyld?(i>=2?'hit':'safe'):''});
  var rows=[
   [r.urigtig,'Fakturaen eller dokumentationen har et urigtigt indhold'],
   [r.betyd,role===1?'De urigtige oplysninger er afgivet til brug for angivelse eller indberetning og har påvirket opgørelsen':'Dokumentationen er egnet til at danne grundlag for opgørelsen af skat eller afgift'],
   [r.skyld,'Forholdet er forsætligt eller groft uagtsomt'],
   [r.tid,(role===1?'Oplysningen er afgivet':'Fakturaen er udstedt')+' den 1. januar 2024 eller senere']];
  $('checks').innerHTML=rows.map(function(x){return '<li><span class="mark'+(x[0]?'':' no')+'">'+(x[0]?'✓':'✕')+'</span><span>'+x[1]+'</span></li>'}).join('');
  var v=$('verdict');v.classList.toggle('hit',r.all);
  if(r.all){$('vH').textContent='Registreringen kan inddrages';$('vT').textContent='Betingelserne i stk. 2, nr. '+role+', er opfyldt. Skatteforvaltningen skal stadig foretage en konkret vurdering.'}
  else{$('vH').textContent='Stk. 2, nr. '+role+', kan ikke bruges';
    $('vT').textContent=!r.urigtig?'Uden urigtigt indhold er der intet at reagere på.':!r.betyd?'En fejl, der ikke kan påvirke opgørelsen af skat eller afgift, er ikke omfattet.':!r.skyld?'Kravet om forsæt eller grov uagtsomhed er ikke opfyldt.':'Forholdet ligger før 1. januar 2024. Andre regler kan stadig være relevante.'}
}
var presets={
 fiktiv:{role:1,cont:'fiktiv',betyd:1,skyld:2,dato:11},
 fabrik:{role:2,cont:'fiktiv',betyd:1,skyld:3,dato:14},
 taste:{role:1,cont:'belob',betyd:1,skyld:0,dato:12},
 dato:{role:2,cont:'dato',betyd:0,skyld:3,dato:9},
 gammel:{role:1,cont:'fiktiv',betyd:1,skyld:3,dato:3}
};
[].forEach.call(document.querySelectorAll('#presets button'),function(b){b.onclick=function(){var p=presets[b.dataset.p];
  $('cont').value=p.cont;$('betyd').value=p.betyd;$('skyld').value=p.skyld;$('dato').value=p.dato;setRole(p.role)}});
$('role1').onclick=function(){setRole(1)};$('role2').onclick=function(){setRole(2)};
['cont','betyd','skyld','dato'].forEach(function(id){$(id).addEventListener('input',calc)});
setRole(1);

/* ---------- moms ---------- */
function moms(){var b=+$('bel').value,a=+$('and').value/100;
  $('belO').textContent=kr(b);$('andO').textContent=Math.round(a*100)+' %';
  $('bF').style.width=(a*100)+'%';$('bR').style.width=((1-a)*100)+'%';
  $('mT').textContent=kr(b*.25);$('mF').textContent=kr(b*a*.25);$('mR').textContent=kr(b*(1-a)*.25)}
$('bel').addEventListener('input',moms);$('and').addEventListener('input',moms);moms();

/* ---------- 5 år ---------- */
var ys=$('years');for(var i=0;i<=8;i++){var s=document.createElement('span');s.textContent=i+' år';if(i>5)s.className='free';ys.appendChild(s)}
function aar(){var a=+$('aar').value;$('aarO').textContent=a+' år';
  [].forEach.call(ys.children,function(s,i){s.classList.toggle('cur',i===a)});
  $('aarT').textContent=a<=5?'Inddragelsen ligger inden for de seneste fem år. Skatteforvaltningen kan kræve sikkerhed, hvis der konkret er nærliggende risiko for tab.':'Inddragelsen er mere end fem år gammel og kan ikke længere i sig selv begrunde et krav om sikkerhed efter § 11, stk. 2, nr. 2 og 3.'}
$('aar').addEventListener('input',aar);aar();
})();
