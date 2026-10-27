import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT,validate,layout} from '../model.mjs';
import {foodMarkup} from '../food.mjs';
import {sheetMarkup} from '../sheet.mjs';
const card={text:'Tomatsuppe',kind:'food',icon:'none',image:''};
const measure=(text,size)=>text.length*size*.55;
function exportSvg(changes={}){const state=validate({...structuredClone(DEFAULT),cards:[card],...changes}),plan=layout(state);return sheetMarkup({cards:plan.pages[0],index:0,plan,state,renderCard:(c,id)=>foodMarkup(c,69,66,measure,null,id,{showQr:state.showQr,showBranding:state.showBranding,background:state.color==='mono'?'white':state.paperColor,ink:state.color==='mono'?'black':state.inkColor,monochrome:state.color==='mono'})});}
test('Default export retains the approved QR, ring, source and measurement footer',()=>{const svg=exportSvg();assert.match(svg,/photo-ring/);assert.match(svg,/food-qr/);assert.match(svg,/extruda.dk/);assert.match(svg,/Open Planner/);assert.match(svg,/Kontrolmål: 50 mm/);});
test('Unbranded export without QR, footer or metadata has no Extruda strings or title',()=>{const svg=exportSvg({showBranding:false,showQr:true,showFooter:false,includeMetadata:false});assert.doesNotMatch(svg,/extruda|Open Planner|food-qr|<title|<metadata|Kontrolmål|data-payload/i);assert.match(svg,/Tomatsuppe/);assert.match(svg,/width="69" height="66"/);});
test('Custom colours and monochrome are applied to the food layout',()=>{const custom=exportSvg({color:'custom',paperColor:'#FFF8CC',inkColor:'#123456'});assert.match(custom,/#FFF8CC/);assert.match(custom,/#123456/);const mono=exportSvg({color:'mono'});assert.match(mono,/fill="white"/);assert.match(mono,/stroke="black"/);});
test('Monochrome photos use a vector greyscale filter and custom values cannot inject SVG',()=>{const svg=foodMarkup({...card,x:10,y:10},69,66,measure,'data:image/png;base64,AA==','example',{monochrome:true});assert.match(svg,/feColorMatrix type="saturate" values="0"/);assert.throws(()=>validate({...DEFAULT,paperColor:'red\"/><script>'}));assert.throws(()=>validate({...DEFAULT,includeMetadata:'false'}));});
