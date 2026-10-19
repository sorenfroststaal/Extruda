import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../public/app.js',import.meta.url),'utf8').split("if (fragment.has('room')) {")[0];
function setup(getUserMedia) {
  const elements=new Map();
  const element=id=>{if(!elements.has(id))elements.set(id,{hidden:false,disabled:false,value:'environment',textContent:'',addEventListener(){},getContext(){return{clearRect(){}}},close(){this.open=false}});return elements.get(id)};
  const context=vm.createContext({console,CustomEvent,TextEncoder,TextDecoder,Uint8Array,URLSearchParams,URL,atob,btoa,setTimeout,clearTimeout,
    crypto:{getRandomValues:a=>a,subtle:{decrypt:async(_a,_b,data)=>data,encrypt:async()=>new Uint8Array(),digest:(...args)=>webcrypto.subtle.digest(...args)}},
    location:{hash:'',pathname:'/',origin:'https://example.test',protocol:'https:'},history:{replaceState(){}},
    document:{getElementById:element,addEventListener(){},body:{classList:{remove(){}}}},window:{addEventListener(){},dispatchEvent(){}},
    navigator:{mediaDevices:{getUserMedia}},WebSocket:{OPEN:1}});
  vm.runInContext(source+`;role='phone';phoneNonce='test-nonce';stopped=false;pc={addTrack(){},async setLocalDescription(){},async createOffer(){return{}},localDescription:{toJSON(){return{}}},close(){}};socket={readyState:1,send(){},close(){}};`,context);
  const approve=()=>vm.runInContext(`receive({iv:'',data:btoa(JSON.stringify({type:'approved',sender:'host',nonce:'test-nonce'}))})`,context);
  return{context,element,approve};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('PC approval starts camera automatically and duplicate approval does not reopen it',async()=>{
 let calls=0;const track={getSettings:()=>({width:1280,height:720}),stop(){}};
 const s=setup(async()=>{calls++;return{getVideoTracks:()=>[track],getTracks:()=>[track]}});
 assert.equal(calls,0);await s.approve();await settle();await s.approve();await settle();
 assert.equal(calls,1);assert.equal(s.element('phone-info').textContent,'Kamera startet');assert.equal(s.element('start').hidden,true);
});
test('permission denial leaves an enabled manual fallback',async()=>{
 const s=setup(async()=>{throw Object.assign(new Error('Denied'),{name:'NotAllowedError'})});await s.approve();await settle();
 assert.equal(s.element('start').hidden,false);assert.equal(s.element('start').disabled,false);assert.match(s.element('status').textContent,/Tillad kameraadgang/);
});
test('cancelling while permission is pending stops the returned camera track',async()=>{
 let release,stops=0;const s=setup(()=>new Promise(resolve=>release=resolve));await s.approve();
 await vm.runInContext('stop(false)',s.context);
 release({getTracks:()=>[{stop(){stops++}}]});await settle();assert.equal(stops,1);assert.equal(s.element('start').disabled,true);
});

test('live resolution changes use existing capture track and direct control channel',async()=>{
 let constraints,requests=0;const track={applyConstraints:async c=>{constraints=c},getSettings:()=>({width:1920,height:1080}),stop(){}};
 const s=setup(async()=>{requests++;return{getVideoTracks:()=>[track],getTracks:()=>[track]}});await s.approve();await settle();
 vm.runInContext("pc.connectionState='connected'; controlChannel={readyState:'open',send(){}};socket=null;",s.context);
 await vm.runInContext("receiveControl({type:'capture-size',size:{width:3840,height:2160}})",s.context);
 assert.equal(constraints.width.ideal,3840);assert.equal(constraints.height.ideal,2160);assert.equal(requests,1);
});

test('phone refuses acceptance for a different phone nonce',async()=>{
 let requests=0;const s=setup(async()=>{requests++;throw Error('unexpected camera access')});
 await vm.runInContext("receive({iv:'',data:btoa(JSON.stringify({type:'approved',sender:'host',nonce:'wrong-phone'}))})",s.context);
 assert.equal(requests,0);
});

test('comparison code is deterministic and binds the phone nonce',async()=>{
 const s=setup(async()=>{});vm.runInContext("pairSecret='example-secret'",s.context);
 const a=await vm.runInContext("verificationCode('first-phone')",s.context);
 const b=await vm.runInContext("verificationCode('first-phone')",s.context);
 const c=await vm.runInContext("verificationCode('second-phone')",s.context);
 assert.match(a,/^[0-9]{6}$/);assert.equal(a,b);assert.notEqual(a,c);
});
test('oversized direct control message stops the session',async()=>{
 const s=setup(async()=>{});
 vm.runInContext("approved=true;bindControl({readyState:'open',send(){},close(){}});controlChannel.onmessage({data:'x'.repeat(1025)})",s.context);
 await settle();assert.equal(vm.runInContext('stopped',s.context),true);
});
