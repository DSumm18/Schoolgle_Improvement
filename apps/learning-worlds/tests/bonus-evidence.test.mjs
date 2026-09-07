import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,completeMission,canOpen,completeBonus,recordAttempt,readSave} from '../src/learning.js';
import {attemptCard,demoLearners} from '../src/teacher-view.js';
test('All prerequisite discoveries are required, including when a saved record has holes',()=>{
 for(let id=1;id<7;id++){const s=freshState();assert.equal(completeMission(s,id),false);assert.equal(s.gems,0);}
 assert.deepEqual(readSave(JSON.stringify({...freshState(),completed:[6]})).completed,[]);
 assert.deepEqual(readSave(JSON.stringify({...freshState(),completed:[0,2,3]})).completed,[0]);
 assert.equal(canOpen({completed:[5]},6),false);
});
test('Bonus requires cargo and successful model, calculation and explanation; rewards once across reload and later missions',()=>{
 const s=freshState();assert.equal(completeBonus(s),false);completeMission(s,0);completeMission(s,1);
 const add=(phase,correct=true)=>recordAttempt(s,1,phase,correct,'model visible',{activity:'sphinx-sharing',phase,response:phase==='calculation'?'5':'3 equal groups of 5',values:[5,5,5]});
 add('model');assert.equal(completeBonus(s),false);add('calculation');add('explanation',false);assert.equal(completeBonus(s),false);add('explanation');assert.equal(completeBonus(s),true);assert.equal(s.gems,75);assert.equal(completeBonus(s),false);
 const reloaded=readSave(JSON.stringify(s));assert.equal(reloaded.gems,75);assert.equal(completeBonus(reloaded),false);completeMission(reloaded,2);assert.equal(reloaded.gems,105);
});
test('New calculations and return responses survive save; unsupported metadata is discarded',()=>{
 const s=freshState();recordAttempt(s,1,'Calculate',false,'model visible',{phase:'calculation',activity:'sphinx-sharing',response:'3',equation:'15 ÷ 3 = 3',question:'How many per tray?',diagnosis:'not allowed'});
 s.recall={'2026-09-06':[{question:1,correct:false,at:new Date().toISOString(),details:{response:'Three',equation:'18 ÷ 3 = 3',question:'18 among 3'},support:'new-context question'}]};
 const reloaded=readSave(JSON.stringify(s));assert.equal(reloaded.evidence[0].details.equation,'15 ÷ 3 = 3');assert.equal(reloaded.evidence[0].details.diagnosis,undefined);assert.equal(reloaded.recall['2026-09-06'][0].details.response,'Three');
 assert.equal(readSave(JSON.stringify({...s,bonus:{sphinx:'true'}})).gems,0);
});
test('Teacher response rendering escapes untrusted strings and distinguishes missing old responses',()=>{
 const e={objective:'<script>bad()</script>',correct:false,support:'<img src=x>',at:new Date().toISOString(),details:{response:'<svg onload=bad()>',equation:'<x>'}};
 const html=attemptCard(e);assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<svg'));assert.match(html,/&lt;svg/);assert.match(attemptCard({...e,details:{}}),/not captured in this older attempt/);
 assert.equal(demoLearners.length,3);assert.equal(freshState().evidence.length,0);
});
