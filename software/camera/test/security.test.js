import test from 'node:test';
import assert from 'node:assert/strict';
import {AbuseGuard,limitedBody} from '../src/worker.js';
test('body reader enforces the byte limit without relying on Content-Length',async()=>{
 const stream=new ReadableStream({start(c){c.enqueue(new Uint8Array(700));c.enqueue(new Uint8Array(700));c.close()}});
 await assert.rejects(limitedBody(new Request('https://example.test',{method:'POST',body:stream,duplex:'half'})),/Too large/);
});
test('room creation is limited across rooms and limiter stores no raw addresses',async()=>{
 const state=new Map(); const ctx={blockConcurrencyWhile:fn=>fn(),storage:{get:async k=>state.get(k),put:async(k,v)=>state.set(k,structuredClone(v)),setAlarm:async()=>{}}};
 const guard=new AbuseGuard(ctx); const request=ip=>new Request('https://guard/check',{method:'POST',body:JSON.stringify({ip,create:true})});
 for(let i=0;i<20;i++)assert.equal((await guard.fetch(request('192.0.2.1'))).status,200);
 assert.equal((await guard.fetch(request('192.0.2.1'))).status,429);
 assert.equal((await guard.fetch(request('192.0.2.2'))).status,200);
 assert.ok(!JSON.stringify([...state]).includes('192.0.2.'));
});
import worker from '../src/worker.js';
test('legacy installer URL redirects to the fixed GitHub release asset',async()=>{
 const result=await worker.fetch(new Request('https://camera.example/downloads/ExtrudaCamera-Setup-0.3.0-x64.exe'),{});
 assert.equal(result.status,302);
 assert.equal(result.headers.get('location'),'https://github.com/sorenfroststaal/Extruda/releases/download/camera-v0.4.0/ExtrudaCamera-Setup-0.4.0-x64.exe');
});
