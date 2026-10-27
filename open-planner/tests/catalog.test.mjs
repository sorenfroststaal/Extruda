import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {validateDatabase,dishToCard} from '../catalog.mjs';
import {validate} from '../model.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');

test('den offentlige database indeholder 40 rene retposter',async()=>{
  const database=validateDatabase(JSON.parse(await readFile(resolve(root,'data/retter.json'),'utf8')));
  assert.equal(database.retter.length,40);
  assert.deepEqual(Object.keys(database.retter[0]),['id','navn','billede','ingredienser','fremgangsmaade']);
  assert.equal(database.retter.every(item=>item.ingredienser.length===0&&item.fremgangsmaade===''),true);
});

test('alle billedreferencer i databasen findes',async()=>{
  const database=validateDatabase(JSON.parse(await readFile(resolve(root,'data/retter.json'),'utf8')));
  const images=database.retter.filter(item=>item.billede);
  assert.equal(images.length,38);
  await Promise.all(images.map(item=>access(resolve(root,item.billede.replace(/^\.\//,'')))));
});

test('en ret kan omdannes til et gyldigt printkort',async()=>{
  const database=validateDatabase(JSON.parse(await readFile(resolve(root,'data/retter.json'),'utf8')));
  const card=dishToCard(database.retter[0]);
  const state=validate({version:1,cardWidth:69,cardHeight:66,orientation:'portrait',color:'petrol',copies:1,cards:[card]});
  assert.equal(state.cards[0].text,'Pasta med kødsovs');
  assert.match(state.cards[0].image,/^\.\/assets\/food\//);
  assert.equal(state.cards[0].kind,'food');
});

test('eksterne billedadresser afvises',()=>{
  assert.throws(()=>validateDatabase({version:1,retter:[{id:'test',navn:'Test',billede:'https://example.com/a.png',ingredienser:[],fremgangsmaade:''}]}),/Billedet/);
});
