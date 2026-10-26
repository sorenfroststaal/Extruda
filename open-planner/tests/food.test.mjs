import test from 'node:test';
import assert from 'node:assert/strict';
import {foodGeometry,foodMarkup} from '../food.mjs';
import {QR} from '../qr.mjs';

const measure=(text,size)=>text.length*size*.55;

test('madkort bruger godkendt 69 × 66 mm geometri',()=>{
  const geometry=foodGeometry(69,66);
  assert.deepEqual(geometry.photo,{x:5,y:9,diameter:38});
  assert.deepEqual(geometry.qr,{x:47,y:3,size:19});
});

test('madkort har cirkulært foto, petrolring og QR til extruda.dk',()=>{
  const svg=foodMarkup({text:'Pasta med kødsovs',x:10,y:10},69,66,measure,'./assets/food/pasta-med-kodsovs.webp','0-0');
  assert.match(svg,/clipPath/);
  assert.match(svg,/class="photo-ring"/);
  assert.match(svg,/class="food-qr"/);
  assert.match(svg,/data-payload="https:\/\/extruda\.dk\/"/);
  assert.match(svg,new RegExp(QR.path.slice(0,20).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});

test('manglende foto vises ærligt som placeholder',()=>{
  const svg=foodMarkup({text:'Indbagte rejer med ris',x:10,y:10},69,66,measure,'','0-0');
  assert.match(svg,/Billede mangler/);
  assert.doesNotMatch(svg,/<image/);
});

test('madkort afviser mål under 50 mm',()=>{
  assert.throws(()=>foodGeometry(49,66),/mindst 50/);
});
