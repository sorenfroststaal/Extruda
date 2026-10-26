const DATA_IMAGE=/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/;
const PUBLIC_IMAGE=/^\.\/(data\/images|assets\/food)\/[a-z0-9-]+\.(png|jpe?g|webp)$/;

export function validImage(value){
  return value===null||value===''||(typeof value==='string'&&(PUBLIC_IMAGE.test(value)||DATA_IMAGE.test(value)));
}

export function slugify(value){
  return value.toLocaleLowerCase('da').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/æ/g,'ae').replace(/ø/g,'oe').replace(/å/g,'aa').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,70)||'ret';
}

export function normalizeDish(item){
  if(!item||typeof item!=='object')throw new Error('En ret har et ugyldigt format.');
  const id=String(item.id||'').trim();
  const navn=String(item.navn||'').trim();
  const ingredients=Array.isArray(item.ingredienser)?item.ingredienser:typeof item.ingredienser==='string'?item.ingredienser.split(/\r?\n/):[];
  const ingredienser=ingredients.map(value=>String(value).trim()).filter(Boolean);
  const fremgangsmaade=String(item.fremgangsmaade??item.opskrift??'').trim();
  let billede=item.billede||null;
  if(typeof billede==='string'&&/^\.\/data\/images\/[a-z0-9-]+-cirkel\.png$/.test(billede))billede=`./assets/food/${id}.webp`;
  if(!/^[a-z0-9-]{1,80}$/.test(id))throw new Error('En ret mangler et gyldigt id.');
  if(!navn||navn.length>120)throw new Error('En ret mangler et navn på højst 120 tegn.');
  if(ingredienser.length>200||ingredienser.some(value=>value.length>300))throw new Error(`Ingredienslisten til “${navn}” er for lang.`);
  if(fremgangsmaade.length>40000)throw new Error(`Fremgangsmåden til “${navn}” er for lang.`);
  if(!validImage(billede))throw new Error(`Billedet til “${navn}” er ikke et lokalt Open Planner-billede.`);
  return {id,navn,billede,ingredienser,fremgangsmaade};
}

export function validateDatabase(value){
  if(!value||value.version!==1||!Array.isArray(value.retter)||value.retter.length>200)throw new Error('Filen skal være en Open Planner-database (version 1) med højst 200 retter.');
  const retter=value.retter.map(normalizeDish);
  if(new Set(retter.map(item=>item.id)).size!==retter.length)throw new Error('To retter har samme id.');
  return {version:1,sprog:'da',opdateret:String(value.opdateret||new Date().toISOString().slice(0,10)),standardkortMm:{bredde:69,hoejde:66},retter};
}

export function dishToCard(dish){
  const item=normalizeDish(dish);
  return {text:item.navn,icon:'none',image:item.billede||'',kind:'food'};
}
