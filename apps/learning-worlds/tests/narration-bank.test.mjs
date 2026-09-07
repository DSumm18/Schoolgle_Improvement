import fs from 'node:fs';import path from 'node:path';import test from 'node:test';import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
for(const game of ['nile','plot','fire'])test(`${game}: each approved script has one existing MP3 and no private metadata`,()=>{
 const scripts=JSON.parse(fs.readFileSync(new URL(`src/narration/${game}.json`,root)));const bank=JSON.parse(fs.readFileSync(new URL(`src/narration/${game}-audio.json`,root)));
 assert.equal(new Set(scripts.map(r=>r.id)).size,scripts.length);assert.equal(bank.length,scripts.length);
 for(const script of scripts){const found=bank.filter(r=>r.id===script.id);assert.equal(found.length,1);const entry=found[0];assert.equal(entry.text,script.text.replace(/\s+/g,' ').trim());assert.match(entry.file,/^audio\/voices\/[a-z0-9-]+\.mp3$/);assert.deepEqual(Object.keys(entry).sort(),['file','id','text']);const bytes=fs.readFileSync(new URL('public/'+entry.file,root));assert.ok(bytes.length>1000);assert.ok(bytes.subarray(0,3).toString()==='ID3'||bytes[0]===255,'MP3 header');}
});
