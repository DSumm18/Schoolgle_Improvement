import test from 'node:test';
import assert from 'node:assert/strict';
import {freshFire,readFire,recordFire,completeFire,canVisitFire} from '../src/fire-state.js';
test('Fire prevents skipped discoveries and repeat rewards; completion has a recall anchor',()=>{
 const s=freshFire();assert.equal(completeFire(s,4),false);
 for(let i=0;i<5;i++){assert.equal(canVisitFire(s,i),true);assert.equal(completeFire(s,i),true);assert.equal(completeFire(s,i),false);}
 assert.equal(s.completed.length,5);assert.ok(Number.isFinite(Date.parse(s.completedAt)));
 assert.equal(canVisitFire(s,5),false);assert.equal(completeFire(s,-1),false);
});
test('Fire recovers malformed saves without fabricated completion or correct responses',()=>{
 assert.deepEqual(readFire('{bad'),freshFire());
 const s=readFire(JSON.stringify({version:1,completed:[0,2,3,4],settings:{reducedMotion:'false',character:'../../asset'},attempts:[{at:new Date().toISOString(),chapter:0,kind:'response',correct:'true'}]}));
 assert.deepEqual(s.completed,[0]);assert.equal(s.settings.reducedMotion,false);assert.equal(s.settings.character,'explorer');assert.equal(s.attempts.length,0);
 assert.deepEqual(readFire(JSON.stringify({version:1,completed:'01234'})).completed,[]);
 const oldSave=readFire(JSON.stringify({version:1,completed:[0],settings:{character:'explorer-girl'}}));
 assert.equal(oldSave.settings.skinTone,'warm');assert.deepEqual(oldSave.completed,[0]);
 oldSave.settings.skinTone='deep';assert.equal(readFire(JSON.stringify(oldSave)).settings.skinTone,'deep');
 oldSave.settings.skinTone='invalid';assert.equal(readFire(JSON.stringify(oldSave)).settings.skinTone,'warm');
});
test('Fire preserves wrong answers, help and recall separately from unassessed actions',()=>{
 const s=freshFire();recordFire(s,{chapter:1,kind:'observation',question:'Inspect',response:'wind',correct:true,help:[]});
 recordFire(s,{chapter:4,kind:'recall',question:'Where?',response:'Wrong place',correct:false,help:['story hidden']});
 recordFire(s,{chapter:4,kind:'recall',question:'Where?',response:'Pudding Lane',correct:true,help:['story hidden','corrective feedback']});
 const restored=readFire(JSON.stringify(s));assert.equal(restored.attempts[0].correct,null);assert.equal(restored.attempts[1].correct,false);assert.deepEqual(restored.attempts[2].help,['story hidden','corrective feedback']);
 assert.equal(recordFire(s,{chapter:8,kind:'response',correct:true}),false);
 for(let i=0;i<210;i++)recordFire(s,{chapter:0,kind:'observation',response:'map'});
 assert.equal(s.attempts.length,200);
});
