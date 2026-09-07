import test from 'node:test';
import assert from 'node:assert/strict';
import {STREET_MODELS,evaluateStreet,canFinishInvestigation,PREDICTIONS} from '../src/fire-investigation.js';

test('A bounded route begins at its marker and stops at the chosen gap',()=>{
 assert.deepEqual(evaluateStreet(STREET_MODELS.practice).reached,[0,1,2,3,4]);
 assert.deepEqual(evaluateStreet(STREET_MODELS.practice,1).reached,[0,1]);
 assert.deepEqual(evaluateStreet(STREET_MODELS.practice,3).reached,[0,1,2,3]);
 assert.equal(evaluateStreet(STREET_MODELS.practice,3).reachesTarget,false);
});
test('Transfer moves the starting point: gaps behind it cannot protect the last house',()=>{
 const baseline=evaluateStreet(STREET_MODELS.transfer);
 assert.deepEqual(baseline.reached,[2,3,4,5]);
 for(const gap of [0,1])assert.deepEqual(evaluateStreet(STREET_MODELS.transfer,gap).reached,baseline.reached);
 for(const gap of [2,3,4])assert.equal(evaluateStreet(STREET_MODELS.transfer,gap).reachesTarget,false);
});
test('Direction is part of the bounded model, not an implicit leftmost start',()=>{
 const model={id:'mirror',houses:5,start:3,direction:-1,target:0};
 assert.deepEqual(evaluateStreet(model).reached,[3,2,1,0]);
 assert.deepEqual(evaluateStreet(model,1).reached,[3,2]);
 assert.deepEqual(evaluateStreet(model,3).reached,[3,2,1,0]);
});
test('Malformed model positions are rejected instead of producing a fabricated outcome',()=>{
 for(const gap of [-1,4,1.5,NaN,'2'])assert.throws(()=>evaluateStreet(STREET_MODELS.practice,gap),RangeError);
 for(const bad of [{houses:100},{start:-1},{start:5},{direction:0},{target:5}])assert.throws(()=>evaluateStreet({...STREET_MODELS.practice,...bad}),RangeError);
});
const complete=()=>({prediction:'same',reflection:'changed',practiceResult:evaluateStreet(STREET_MODELS.practice,1),transferResult:evaluateStreet(STREET_MODELS.transfer,2),change:'fewer',reason:'gap',explanationAccepted:true,transferReason:'route',transferAccepted:true});
test('Completion requires both model results, explanations and a reflection',()=>{
 const s=complete();assert.equal(canFinishInvestigation(s),true);
 for(const key of ['prediction','reflection','practiceResult','transferResult','change','reason','explanationAccepted','transferReason','transferAccepted'])assert.equal(canFinishInvestigation({...s,[key]:null}),false,key);
 assert.equal(canFinishInvestigation({...s,transferResult:evaluateStreet(STREET_MODELS.transfer,0)}),false);
 assert.equal(canFinishInvestigation({...s,transferResult:{...s.transferResult,count:99}}),false);
});
test('A different or uncertain first prediction never blocks later evidence-based completion',()=>{
 for(const prediction of Object.keys(PREDICTIONS))assert.equal(canFinishInvestigation({...complete(),prediction}),true);
});
