import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {DISHES} from '../dishes.mjs';
import {QR} from '../qr.mjs';
import {DEFAULT,validate,layout} from '../model.mjs';
import {foodGeometry,foodMarkup} from '../food.mjs';
const cards=DISHES.map(d=>({text:d.name,icon:'none',dishId:d.id,ingredients:'',recipe:''}));
const state={...structuredClone(DEFAULT),cards};
const measure=(text,size)=>text.length*size*.58;
test('Approved catalogue contains 40 unique dishes and 38 existing photos',()=>{
  assert.equal(DISHES.length,40);assert.equal(new Set(DISHES.map(d=>d.id)).size,40);
  assert.equal(DISHES.filter(d=>d.image).length,38);
  for(const dish of DISHES)if(dish.image)assert.ok(existsSync(new URL('../'+dish.image,import.meta.url)));
});
test('Mixed old/new card sets preserve optional recipes through JSON round-trip',()=>{
  const value={...state,cards:[...DEFAULT.cards,{...cards[0],ingredients:'Tomater\nPasta',recipe:'Min egen tekst'}]};
  const roundTrip=validate(JSON.parse(JSON.stringify(validate(value))));
  assert.equal(roundTrip.cards.length,8);assert.equal(roundTrip.cards[7].ingredients,'Tomater\nPasta');assert.equal(roundTrip.cards[7].recipe,'Min egen tekst');assert.equal(roundTrip.cards[7].dishId,cards[0].dishId);
  assert.throws(()=>validate({...value,cards:[{...cards[0],dishId:'unknown'}]}));
});
test('Photo, ring and fixed-size QR never overlap at permitted food dimensions',()=>{
  for(const [w,h]of [[50,50],[69,66],[100,90],[190,267]]){
    const g=foodGeometry(w,h);assert.equal(g.qr.size,19);
    assert.ok(g.photo.x+g.photo.diameter+.6<g.qr.x);
    assert.ok(g.qr.x+19<=w-3);assert.ok(g.qr.y>=3);
    assert.ok(g.title.y>g.photo.y+g.photo.diameter);assert.ok(g.title.y>g.qr.y+19);assert.ok(g.title.height>0);
  }
  assert.throws(()=>validate({...state,cardWidth:49}));assert.throws(()=>validate({...state,cardHeight:49}));
});
test('Every approved dish renders with a vector ring/QR and safe vector text',()=>{
  const pages=layout(state).pages;assert.equal(pages.length,7);
  for(const card of pages.flat()){
    const svg=foodMarkup(card,69,66,measure,DISHES.find(d=>d.id===card.dishId).image?'data:image/webp;base64,AA==':null);
    assert.match(svg,/class="photo-ring"/);assert.match(svg,/class="food-qr"/);assert.match(svg,/width="69" height="66"/);
    assert.match(svg,/data-payload="https:\/\/extruda.dk\/"/);
    assert.match(svg,/<text /);
  }
  const svg=foodMarkup({...cards[0],text:'<script>&',x:10,y:10},69,66,measure,null);assert.ok(!svg.includes('<script>'));assert.ok(svg.includes('&lt;script&gt;'));
});
test('QR retains four-module quiet zone and the fixed approved destination',()=>{
  assert.equal(QR.url,'https://extruda.dk/');assert.equal(QR.size,33);assert.equal(QR.quietZone,4);
  for(const match of QR.path.matchAll(/M(\d+) (\d+)/g)){const [,x,y]=match.map(Number);assert.ok(x>=4&&x<29&&y>=4&&y<29);}
});
