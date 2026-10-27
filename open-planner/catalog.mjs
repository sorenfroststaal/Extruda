import {imageReference} from './images.mjs?v=20261027-db1';
export const DATABASE_FORMAT='extruda-open-planner-database';
export const MAX_DATABASE_BYTES=50_000_000;

export function validImage(value){
  try{imageReference(value);return true;}catch{return false;}
}

export function slugify(value){
  return value.toLocaleLowerCase('da').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/æ/g,'ae').replace(/ø/g,'oe').replace(/å/g,'aa').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,70)||'ret';
}

export function normalizeDish(item){
  if(!item||typeof item!=='object')throw new Error('En ret har et ugyldigt format.');
  if(typeof item.id!=='string'||typeof item.navn!=='string')throw new Error('Retten skal have et id og et navn som tekst.');
  const id=item.id.trim();
  const navn=item.navn.trim();
  if(item.ingredienser!==undefined&&!Array.isArray(item.ingredienser)&&typeof item.ingredienser!=='string')throw new Error('Ingredienser skal være en liste eller tekst.');
  const ingredients=Array.isArray(item.ingredienser)?item.ingredienser:typeof item.ingredienser==='string'?item.ingredienser.split(/\r?\n/):[];
  if(ingredients.some(value=>typeof value!=='string'))throw new Error('Ingredienser skal være tekst.');
  const ingredienser=ingredients.map(value=>value.trim()).filter(Boolean);
  const method=item.fremgangsmaade??item.opskrift??'';if(typeof method!=='string')throw new Error('Opskriften skal være tekst.');
  const fremgangsmaade=method.trim();
  let billede=item.billede??null;
  if(typeof billede==='string'&&/^\.\/data\/images\/[a-z0-9-]+-cirkel\.png$/.test(billede))billede=`./assets/food/${id}.webp`;
  if(!/^[a-z0-9-]{1,80}$/.test(id))throw new Error('En ret mangler et gyldigt id.');
  if(!navn||navn.length>120)throw new Error('En ret mangler et navn på højst 120 tegn.');
  if(ingredienser.length>200||ingredienser.some(value=>value.length>300))throw new Error(`Ingredienslisten til “${navn}” er for lang.`);
  if(fremgangsmaade.length>40000)throw new Error(`Fremgangsmåden til “${navn}” er for lang.`);
  try{billede=imageReference(billede);}catch(error){throw new Error(`Billedet til “${navn}”: ${error.message}`);}
  return {id,navn,billede,ingredienser,fremgangsmaade};
}

export function validateDatabase(value,{embedded=false}={}){
  if(!value||![1,2].includes(value.version)||(value.version===2&&value.format!==DATABASE_FORMAT)||!Array.isArray(value.retter)||value.retter.length>200)throw new Error('Vælg en Open Planner-database (version 1 eller 2) med højst 200 retter.');
  const retter=value.retter.map(normalizeDish);
  for(const dish of retter)imageReference(dish.billede,{embedded});
  if(new Set(retter.map(item=>item.id)).size!==retter.length)throw new Error('To retter har samme id.');
  if(retter.reduce((sum,dish)=>sum+(dish.billede?.length||0),0)>40_000_000)throw new Error('Databasen indeholder for mange billeddata (maks. 40 MB).');
  return {format:DATABASE_FORMAT,version:2,sprog:'da',opdateret:typeof value.opdateret==='string'?value.opdateret.slice(0,30):'',standardkortMm:{bredde:69,hoejde:66},retter};
}

export async function portableDatabase(value,resolveImage){
  const data=validateDatabase(value);
  const retter=await Promise.all(data.retter.map(async dish=>({...dish,billede:dish.billede&&!dish.billede.startsWith('data:')?await resolveImage(dish.billede):dish.billede})));
  return validateDatabase({...data,retter},{embedded:true});
}
export function parseDatabase(text){
  if(typeof text!=='string'||new TextEncoder().encode(text).byteLength>MAX_DATABASE_BYTES)throw new Error('Vælg en database under 50 MB.');
  let value;try{value=JSON.parse(text);}catch{throw new Error('Filen er ikke gyldig JSON.');}
  return validateDatabase(value,{embedded:value.version===2});
}

export function dishToCard(dish){
  const item=normalizeDish(dish);
  return {text:item.navn,icon:'none',image:item.billede||'',kind:'food'};
}
