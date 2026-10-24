import {validateOptions,validateRecipe,availableFamilies,families,goals} from './core.mjs?v=math-0.2.0';

const copy=value=>JSON.parse(JSON.stringify(value));
const presentationKeys=['language','textLevel','visualSupport','style','theme'];
export const DRAFT_KEY='extruda.learning-books.draft.v1';

// Only choices that affect the exercises belong to this key. Family choices for
// other grades/areas must not accidentally cause a new book to be generated.
export function contentKey(o){
 const grade=o.grade??'legacy',selected=new Set(o.familyIds??families.map(f=>f.id));
 return JSON.stringify({grade,goals:[...o.goals].sort(),pages:o.pages,seed:o.seed,repetition:o.repetition,
  families:availableFamilies(grade).filter(f=>o.goals.includes(f.goal)&&selected.has(f.id)).map(f=>f.id).sort()});
}
export function applyPresentation(book,nextOptions){
 validateRecipe(book);validateOptions(nextOptions);
 if(contentKey(book.options)!==contentKey(nextOptions))throw Error('Indholdet er ændret. Lav en ny bog for at anvende det.');
 const result=copy(book);
 for(const key of presentationKeys)if(nextOptions[key]!==undefined)result.options[key]=copy(nextOptions[key]);
 return validateRecipe(result);
}

// Drafts may contain unfinished choices (no areas, an empty seed or an invalid
// page count). Restoring those is useful; restoring unknown IDs or arbitrary
// objects is not. The generated book is validated independently of those choices.
export function validateWorkspace(state){
 const o=state?.options;
 const uniqueKnown=(a,known)=>Array.isArray(a)&&a.length<=known.length&&new Set(a).size===a.length&&a.every(v=>known.includes(v));
 if(!o||!['all','legacy',0,1,2,3,4].includes(o.grade)
  ||!uniqueKnown(o.goals,goals.map(g=>g.id))||!uniqueKnown(o.familyIds,families.map(f=>f.id))
  ||typeof o.seed!=='string'||o.seed.length>80||!Number.isSafeInteger(o.pages)
  ||typeof state.includeAnswers!=='boolean')throw Error('Kladdeformatet er ugyldigt.');
 for(const [key,allowed] of Object.entries({language:['da','en','da-en'],textLevel:['short','standard'],visualSupport:['none','pictures'],style:['calm','colorful','monochrome'],repetition:['low','standard','extra']}))
  if(!allowed.includes(o[key]))throw Error('Kladdevalget er ugyldigt.');
 if(!o.theme||!/^#[0-9a-f]{6}$/i.test(o.theme.accent)||!/^#[0-9a-f]{6}$/i.test(o.theme.secondary))throw Error('Kladdens farver er ugyldige.');
 const options={grade:o.grade,goals:[...o.goals],familyIds:[...o.familyIds],pages:o.pages,seed:o.seed,
  language:o.language,textLevel:o.textLevel,visualSupport:o.visualSupport,style:o.style,repetition:o.repetition,
  theme:{accent:o.theme.accent,secondary:o.theme.secondary}};
 const book=state.book===null?null:copy(validateRecipe(state.book));
 return {options,book,includeAnswers:state.includeAnswers};
}

export function createDraftStore(getStorage){
 return {
  load(){let raw;try{raw=getStorage().getItem(DRAFT_KEY);}catch{return {status:'unavailable'};}if(!raw)return {status:'empty'};try{
   if(raw.length>250000)throw Error('Kladdefilen er for stor.');const data=JSON.parse(raw);
   if(data.schemaVersion!==1)return {status:'unsupported'};
   if(typeof data.savedAt!=='string'||!Number.isFinite(Date.parse(data.savedAt)))throw Error('Ugyldig dato.');
   return {status:'saved',state:validateWorkspace(data.state),savedAt:data.savedAt};
  }catch{return {status:'invalid'};}},
  save(state){try{const data=JSON.stringify({schemaVersion:1,savedAt:new Date().toISOString(),state:validateWorkspace(state)});
   if(data.length>250000)throw Error('Kladdefilen er for stor.');getStorage().setItem(DRAFT_KEY,data);return true;
  }catch{return false;}},
  clear(){try{getStorage().removeItem(DRAFT_KEY);return true;}catch{return false;}}
 };
}

export function createHistory(initial,limit=30){
 let current=JSON.stringify(validateWorkspace(initial)),past=[],future=[],lastGroup=null,lastTime=0;
 return {
  record(next,label,{group=null,time=Date.now()}={}){
   const encoded=JSON.stringify(validateWorkspace(next));if(encoded===current)return false;
   if(!(group&&group===lastGroup&&time-lastTime<800)){
    past.push({encoded:current,label});if(past.length>limit)past.shift();
   }
   current=encoded;future=[];lastGroup=group;lastTime=time;
   // Typing and deleting the same text in one edit should leave no fake undo.
   if(past.at(-1)?.encoded===current)past.pop();
   return true;
  },
  undo(){const previous=past.pop();if(!previous)return null;future.push({encoded:current,label:previous.label});current=previous.encoded;lastGroup=null;return {state:JSON.parse(current),label:previous.label};},
  redo(){const next=future.pop();if(!next)return null;past.push({encoded:current,label:next.label});current=next.encoded;lastGroup=null;return {state:JSON.parse(current),label:next.label};},
  undoLabel(){return past.at(-1)?.label??null;},
  redoLabel(){return future.at(-1)?.label??null;},
  reset(next){current=JSON.stringify(validateWorkspace(next));past=[];future=[];lastGroup=null;lastTime=0;}
 };
}
