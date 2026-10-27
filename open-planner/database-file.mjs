import {portableDatabase,parseDatabase,MAX_DATABASE_BYTES,validateDatabase} from './catalog.mjs?v=20261027-db1';
export class FileConflictError extends Error{constructor(){super('Filen er ændret uden for Open Planner. Åbn den igen, eller vælg Gem som for at bevare dine ændringer i en anden fil.');this.name='FileConflictError';}}
export async function fingerprint(file){return `${file.lastModified}:${file.size}:`+Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer())),v=>v.toString(16).padStart(2,'0')).join('');}
export class DatabaseFileSession{
  constructor(resolveImage,verifyImage=async()=>{}){this.resolveImage=resolveImage;this.verifyImage=verifyImage;this.data=null;this.handle=null;this.source='none';this.name='';this.dirty=false;this.baseline=null;this.revision=0;this.busy=false;}
  activate(data,{source='standard',name='Standarddatabase',handle=null,baseline=null,dirty=false}={}){if(this.busy)throw new Error('Vent til filen er gemt.');this.data=validateDatabase(data);this.source=source;this.name=name;this.handle=handle;this.baseline=baseline;this.dirty=dirty;this.revision++;}
  edit(data){this.data=validateDatabase(data);this.data.opdateret=new Date().toISOString().slice(0,10);this.dirty=true;this.revision++;}
  async readFile(file){if(file.size>MAX_DATABASE_BYTES)throw new Error('Vælg en database under 50 MB.');const text=await file.text();const parsed=parseDatabase(text),legacy=JSON.parse(text).version===1;const data=await portableDatabase(parsed,this.resolveImage);for(const image of new Set(data.retter.map(d=>d.billede).filter(Boolean)))await this.verifyImage(image);return {data,legacy};}
  async open(handle){const file=await handle.getFile();const {data,legacy}=await this.readFile(file);this.activate(data,{source:'file',name:handle.name,handle,baseline:await fingerprint(file),dirty:legacy});return data;}
  async import(file){const {data,legacy}=await this.readFile(file);this.activate(data,{source:'import',name:file.name,dirty:legacy});return data;}
  async serialize(){const data=await portableDatabase(this.data,this.resolveImage);data.opdateret=new Date().toISOString().slice(0,10);const text=JSON.stringify(data,null,2)+'\n';if(new TextEncoder().encode(text).byteLength>MAX_DATABASE_BYTES)throw new Error('Databasen er over 50 MB. Fjern nogle billeder før gemning.');return text;}
  async save(handle=this.handle,{saveAs=false}={}){
    if(this.busy)throw new Error('En gemning er allerede i gang.');
    if(!handle)throw new Error('Vælg først en databasefil med Gem som.');
    this.busy=true;const revision=this.revision;let writer;
    try{
      const before=await handle.getFile(),expected=await fingerprint(before);
      if(!saveAs&&(handle!==this.handle||expected!==this.baseline))throw new FileConflictError();
      let permission=await handle.queryPermission({mode:'readwrite'});
      if(permission!=='granted')permission=await handle.requestPermission({mode:'readwrite'});
      if(permission!=='granted')throw new Error('Filen blev ikke gemt. Giv skrivetilladelse, eller hent en kopi.');
      const text=await this.serialize();
      if(await fingerprint(await handle.getFile())!==expected)throw new FileConflictError();
      writer=await handle.createWritable();await writer.write(text);if(await fingerprint(await handle.getFile())!==expected)throw new FileConflictError();await writer.close();writer=null;
      const after=await handle.getFile();if(await after.text()!==text)throw new FileConflictError();
      this.handle=handle;this.source='file';this.name=handle.name;this.baseline=await fingerprint(after);if(this.revision===revision){this.data=parseDatabase(text);this.dirty=false;}
      return {name:this.name,dirty:this.dirty};
    }finally{if(writer)try{await writer.abort();}catch{}this.busy=false;}
  }
}
