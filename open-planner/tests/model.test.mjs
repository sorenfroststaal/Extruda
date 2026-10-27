import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT,layout,validate,fitText,escapeXml} from '../model.mjs';
const state=(changes={})=>({...structuredClone(DEFAULT),...changes});

test('Default seven weekday cards use two columns at 69 × 66 mm on A4',()=>{
  const plan=layout(state());assert.equal(plan.pages.length,2);assert.equal(plan.columns,2);assert.equal(plan.rows,3);assert.equal(plan.total,7);
  assert.deepEqual(plan.pages[0].map(c=>[c.x,c.y]),[[10,10],[83,10],[10,80],[83,80],[10,150],[83,150]]);
});
test('All cards stay inside the print margin and footer for both directions',()=>{
  for(const orientation of ['portrait','landscape'])for(const [cardWidth,cardHeight]of [[20,20],[60,60],[80.5,42.3],[180,170]]){
    const plan=layout(state({orientation,cardWidth,cardHeight,copies:20}));
    assert.equal(plan.pages.flat().length,140);
    for(const card of plan.pages.flat()){assert.ok(card.x>=10);assert.ok(card.y>=10);assert.ok(card.x+cardWidth<=plan.pageWidth-10+.00001);assert.ok(card.y+cardHeight<=plan.pageHeight-20+.00001);}
  }
});
test('Dimensions are preserved as mm with decimal precision',()=>{const plan=layout(state({cardWidth:61.5,cardHeight:59.2}));assert.equal(plan.pages[0][1].x,75.5);assert.equal(plan.pages[0][3].y,73.2);});
test('Reject oversize cards, impossible fields, excessive copies and malformed imports',()=>{
  for(const changes of [{cardWidth:191},{cardHeight:268},{cardWidth:NaN},{copies:0},{copies:1.5},{copies:21},{orientation:'other'},{color:'injected'},{cards:[{text:'',icon:'none'}]},{cards:[{text:'x',icon:'constructor'}]},{cards:Array(201).fill({text:'x',icon:'none'})}])assert.throws(()=>layout(state(changes)));
  assert.throws(()=>validate({...state(),version:2}));
});
test('Empty list has no pages; an icon without text is valid',()=>{assert.equal(layout(state({cards:[]})).pages.length,0);assert.equal(layout(state({cards:[{text:'',icon:'sun'}]})).total,1);});
test('Fit long words and Danish text within exact text region',()=>{
  const measure=(text,size)=>text.length*size*.65;
  for(const text of ['Søndag','Morgenmad og en gåtur','Megetlangtsammenhængendeordudenmellemrum']){
    const fitted=fitText(text,12,12,measure);assert.ok(fitted.lines.length*fitted.fontSize*1.25<=12);assert.ok(fitted.lines.every(line=>measure(line,fitted.fontSize)<=12));
  }
  assert.deepEqual(fitText('',20,20,measure).lines,[]);
});
test('User text cannot inject SVG or markup',()=>{assert.equal(escapeXml('<script>" &'), '&lt;script&gt;&quot; &amp;');});
