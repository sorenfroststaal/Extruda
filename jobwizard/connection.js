/* Optional browser-local credential vault. Never included in draft exports. */
(() => {
 'use strict';
 const database='extruda-jobwizard-connection-v1',store='connection',record='sorenfroststaal/Extruda';
 function open(){return new Promise((resolve,reject)=>{if(!globalThis.indexedDB||!globalThis.crypto?.subtle)return reject(new Error('Browseren kan ikke huske GitHub-adgangen.'));const r=indexedDB.open(database,1);r.onupgradeneeded=()=>r.result.createObjectStore(store);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(new Error('Luk andre Jobwizard-faner og prøv igen.'));r.onsuccess=()=>resolve(r.result);});}
 async function read(){const db=await open();try{return await new Promise((resolve,reject)=>{const tx=db.transaction(store,'readonly'),r=tx.objectStore(store).get(record);let value;r.onsuccess=()=>{value=r.result;};tx.oncomplete=()=>resolve(value);tx.onabort=()=>reject(tx.error);tx.onerror=()=>reject(tx.error);});}finally{db.close();}}
 async function write(value){const db=await open();try{await new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');if(value)tx.objectStore(store).put(value,record);else tx.objectStore(store).delete(record);tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);tx.onerror=()=>reject(tx.error);});}finally{db.close();}}
 async function remember(token){if(typeof token!=='string'||!token.trim())throw Error('Adgangsnøglen mangler.');const key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']),iv=crypto.getRandomValues(new Uint8Array(12));const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(token));await write({key,iv,encrypted,savedAt:new Date().toISOString()});}
 async function get(){const value=await read();if(!value)return '';try{return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:value.iv},value.key,value.encrypted));}catch{await write(null);return '';}}
 window.JobConnection={remember,get,forget:()=>write(null)};
})();
