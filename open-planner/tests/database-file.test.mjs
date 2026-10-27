import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateDatabase,portableDatabase,parseDatabase,DATABASE_FORMAT} from '../catalog.mjs';
import {DatabaseFileSession,FileConflictError} from '../database-file.mjs';
import {imageReference} from '../images.mjs';
const seed=JSON.parse(readFileSync(new URL('../data/retter.json',import.meta.url),'utf8'));
const resolveImage=async source=>'data:image/webp;base64,'+readFileSync(new URL('../'+source.replace(/^\.\//,''),import.meta.url)).toString('base64');
const small=navn=>validateDatabase({version:1,retter:[{id:'egen-ret',navn,billede:null,ingredienser:[],fremgangsmaade:''}]});
class Handle{
  constructor(name,text){Object.assign(this,{name,text,stamp:1,permission:'granted',writes:0,queries:0,requests:0,fail:false});}
  getFile(){return Promise.resolve(new File([this.text],this.name,{lastModified:this.stamp}));}
  queryPermission(){this.queries++;return Promise.resolve(this.permission);}
  requestPermission(){this.requests++;this.onPermission?.();return Promise.resolve(this.permission);}
  external(text){this.text=text;this.stamp++;}
  async createWritable(){let staged='';return {write:async text=>{if(this.fail)throw new Error('Disk full');staged=text;this.onWrite?.();},close:async()=>{this.text=staged;this.stamp++;this.writes++;},abort:async()=>{this.aborted=true;}};}
}
test('Standard export embeds all 38 images; portable JSON round-trips without modifying seed',async()=>{
  const before=JSON.stringify(seed),complete=await portableDatabase(seed,resolveImage);
  assert.equal(complete.version,2);assert.equal(complete.format,DATABASE_FORMAT);assert.equal(complete.retter.length,40);assert.equal(complete.retter.filter(d=>d.billede).length,38);
  assert.ok(complete.retter.every(d=>!d.billede||d.billede.startsWith('data:image/webp;base64,')));assert.deepEqual(parseDatabase(JSON.stringify(complete)),complete);assert.equal(JSON.stringify(seed),before);
});
test('Own file is authoritative without seed merge; opening never requests write permission',async()=>{
  const h=new Handle('mine.json',JSON.stringify(small('Min ret'))),s=new DatabaseFileSession(resolveImage);s.activate(seed);await s.open(h);
  assert.equal(s.data.retter.length,1);assert.equal(s.data.retter[0].navn,'Min ret');assert.equal(s.name,'mine.json');assert.equal(s.dirty,false);assert.equal(h.queries+h.requests+h.writes,0);
});
test('Save checks readwrite and marks clean only after close and verified reread',async()=>{
  const h=new Handle('mine.json',JSON.stringify(small('Før'))),s=new DatabaseFileSession(resolveImage);await s.open(h);s.edit(small('Efter'));assert.equal(s.dirty,true);await s.save();
  assert.equal(s.dirty,false);assert.equal(JSON.parse(h.text).retter[0].navn,'Efter');assert.equal(h.queries,1);assert.equal(s.data.opdateret,JSON.parse(h.text).opdateret);
});
test('Permission denial, write failure and malformed imports preserve edits and active file',async()=>{
  const h=new Handle('mine.json',JSON.stringify(small('Før'))),s=new DatabaseFileSession(resolveImage);await s.open(h);s.edit(small('Efter'));h.permission='denied';await assert.rejects(s.save(),/skrivetilladelse/);assert.equal(s.dirty,true);assert.equal(h.writes,0);
  h.permission='granted';h.fail=true;await assert.rejects(s.save(),/Disk full/);assert.equal(s.dirty,true);assert.equal(h.aborted,true);assert.equal(JSON.parse(h.text).retter[0].navn,'Før');await assert.rejects(s.import(new File(['<html>'],'bad.json')));assert.equal(s.data.retter[0].navn,'Efter');assert.equal(s.name,'mine.json');
});
test('External change refuses overwrite; Save as preserves the external file and local edits',async()=>{
  const h=new Handle('mine.json',JSON.stringify(small('Før'))),s=new DatabaseFileSession(resolveImage);await s.open(h);s.edit(small('Mine rettelser'));h.external(JSON.stringify(small('Ekstern rettelse')));await assert.rejects(s.save(),FileConflictError);assert.equal(h.writes,0);assert.equal(s.dirty,true);
  const copy=new Handle('ny.json','');await s.save(copy,{saveAs:true});assert.equal(JSON.parse(h.text).retter[0].navn,'Ekstern rettelse');assert.equal(JSON.parse(copy.text).retter[0].navn,'Mine rettelser');assert.equal(s.handle,copy);assert.equal(s.dirty,false);
});
test('Change during permission request is detected too',async()=>{
  const h=new Handle('mine.json',JSON.stringify(small('Før'))),s=new DatabaseFileSession(resolveImage);await s.open(h);s.edit(small('Efter'));h.permission='prompt';h.requestPermission=async()=>{h.external(JSON.stringify(small('Ekstern')));return 'granted';};await assert.rejects(s.save(),FileConflictError);assert.equal(h.writes,0);
});
test('Change while writing is detected before close; staged write is aborted',async()=>{
  const h=new Handle('mine.json',JSON.stringify(small('Før'))),s=new DatabaseFileSession(resolveImage);await s.open(h);s.edit(small('Efter'));h.onWrite=()=>h.external(JSON.stringify(small('Ekstern')));await assert.rejects(s.save(),FileConflictError);assert.equal(h.writes,0);assert.equal(h.aborted,true);assert.equal(JSON.parse(h.text).retter[0].navn,'Ekstern');assert.equal(s.dirty,true);
});
test('Failed raster decode preserves active data; new empty files can be created',async()=>{
  const complete=await portableDatabase(seed,resolveImage);const s=new DatabaseFileSession(resolveImage,async()=>{throw new Error('Cannot decode image');});s.activate(small('Bevar mig'));
  await assert.rejects(s.open(new Handle('bad.json',JSON.stringify(complete))),/decode/);assert.equal(s.data.retter[0].navn,'Bevar mig');
  const fresh=new DatabaseFileSession(resolveImage);fresh.activate({version:1,retter:[]},{source:'import',dirty:true});const target=new Handle('tom.json','');await fresh.save(target,{saveAs:true});assert.equal(JSON.parse(target.text).retter.length,0);assert.equal(fresh.dirty,false);assert.equal(fresh.source,'file');
});
test('New edits during save remain dirty; concurrent writes are refused',async()=>{
  const h=new Handle('mine.json',JSON.stringify(small('Før'))),s=new DatabaseFileSession(resolveImage);await s.open(h);s.edit(small('Snapshot'));h.onWrite=()=>s.edit(small('Nyere rettelse'));const pending=s.save();await assert.rejects(s.save(),/allerede/);await pending;
  assert.equal(s.dirty,true);assert.equal(s.data.retter[0].navn,'Nyere rettelse');assert.equal(JSON.parse(h.text).retter[0].navn,'Snapshot');
});
test('Legacy files migrate without writes; portable v2 files reject external references',async()=>{
  const s=new DatabaseFileSession(resolveImage),h=new Handle('gammel.json',JSON.stringify(seed));await s.open(h);assert.equal(s.dirty,true);assert.equal(h.writes,0);assert.equal(s.data.version,2);assert.ok(s.data.retter[0].billede.startsWith('data:'));
  assert.throws(()=>parseDatabase(JSON.stringify({...small('Test'),retter:[{...small('Test').retter[0],billede:'./assets/food/tomatsuppe.webp'}]})),/PNG|JPEG|WebP/);
});
test('Schema types, duplicate ids, image formats, magic bytes, byte size and dimensions are checked',()=>{
  for(const value of ['https://evil.test/a.png','data:image/svg+xml;base64,PHN2Zy8+','data:image/png;base64,'+Buffer.from('<svg/>').toString('base64'),'data:image/jpeg;base64,'+'A'.repeat(2_700_000)])assert.throws(()=>imageReference(value));
  const db=small('Test');assert.throws(()=>parseDatabase(JSON.stringify({...db,version:3})));assert.throws(()=>validateDatabase({...db,retter:[db.retter[0],db.retter[0]]}));assert.throws(()=>validateDatabase({...db,retter:[{...db.retter[0],navn:{bad:true}}]}));assert.throws(()=>validateDatabase({...db,retter:[{...db.retter[0],ingredienser:[{}]}]}));
  const png=Buffer.alloc(33);png[0]=137;png.write('PNG',1);png.write('IHDR',12);png.writeUInt32BE(5000,16);png.writeUInt32BE(5000,20);assert.throws(()=>imageReference('data:image/png;base64,'+png.toString('base64')),/4096/);
});
