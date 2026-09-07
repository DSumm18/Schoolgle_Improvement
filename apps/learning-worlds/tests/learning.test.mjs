import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,readSave,completeMission,recordAttempt,canOpen,equalCargo,cargoEquation,correctOrder,nextMission} from '../src/learning.js';
test('untrusted/corrupt browser saves recover and recompute rewards',()=>{for(const v of ['{','null','{"version":999}','[]'])assert.equal(readSave(v).gems,0);const s=readSave(JSON.stringify({version:1,completed:[0,0,5,-1,'3',22],gems:999999,settings:{sound:'true'}}));assert.deepEqual(s.completed,[0]);assert.equal(s.gems,30);assert.equal(s.settings.sound,true);});
test('mission rewards are idempotent and prerequisites are explicit',()=>{const s=freshState();assert.equal(canOpen(s,1),false);assert.equal(completeMission(s,0),true);assert.equal(completeMission(s,0),false);assert.equal(s.gems,30);assert.equal(canOpen(s,1),true);assert.equal(nextMission(s),1);});
test('sharing checks equal quantities and the complete total',()=>{assert.equal(equalCargo([0,0,0]),false);assert.equal(equalCargo([7,8,9]),false);assert.equal(equalCargo([8,8,8]),true);assert.equal(equalCargo([2,2,2],6),true);assert.equal(equalCargo([2,2,2]),false);});
test('chronology uses historical order rather than numeric ascending dates',()=>{assert.equal(correctOrder(['pyramids','tutankhamun','discovery']),true);assert.equal(correctOrder(['tutankhamun','pyramids','discovery']),false);});
test('evidence preserves scaffolding separately from success',()=>{const s=freshState();recordAttempt(s,1,'6 divided by 3',true,'smaller-number scaffold');recordAttempt(s,1,'24 divided by 3',false,'hint');assert.equal(s.completed.length,0);assert.equal(s.evidence[0].support,'smaller-number scaffold');assert.equal(s.evidence[1].correct,false);assert.ok(s.evidence[0].at);});
test('partial equal loads never assert an incorrect division equation',()=>{
 for(let amount=0;amount<8;amount++)assert.equal(cargoEquation([amount,amount,amount]),'24 ÷ 3 = ?');
 assert.equal(cargoEquation([8,8,8]),'24 ÷ 3 = 8');
 assert.equal(cargoEquation([2,2,2],6),'6 ÷ 3 = 2');
 assert.equal(cargoEquation([7,8,9]),'24 ÷ 3 = ?');
 assert.equal(equalCargo(null),false);
 assert.equal(equalCargo([0,0,0],0),false);
});
test('saved false strings and impossible evidence cannot become correct answers',()=>{
 const valid={mission:1,objective:'Share baskets',correct:false,support:'explanation available',at:'2026-09-06T12:00:00Z'};
 const s=readSave(JSON.stringify({version:1,completed:[],evidence:[valid,{...valid,correct:'false'},{...valid,mission:99},{...valid,at:'not a date'},{...valid,objective:''},{...valid,correct:true,support:{unexpected:true}}]}));
 assert.equal(s.evidence.length,2);
 assert.equal(s.evidence.filter(e=>e.correct).length,1);
 assert.equal(s.evidence[0].correct,false);
 assert.equal(s.evidence[1].support,'context unavailable');
});
test('basket observations survive save without inventing a strategy or accepting arbitrary data',()=>{
 const s=freshState(),values=[8,8,8];
 recordAttempt(s,1,'Model equal sharing',true,'sharing tool; smaller-number scaffold',{phase:'model',representation:'Three groups',values,shareRounds:8,loadActions:0,unloadActions:0,diagnosis:'invented',response:'x'.repeat(300)});
 values[0]=0;
 const loaded=readSave(JSON.stringify(s)),details=loaded.evidence[0].details;
 assert.deepEqual(details.values,[8,8,8]);
 assert.equal(details.shareRounds,8);
 assert.equal(details.phase,'model');
 assert.equal(details.response.length,180);
 assert.equal('diagnosis' in details,false);
 assert.equal(loaded.evidence[0].support,'sharing tool; smaller-number scaffold');
 assert.equal(loaded.completed.length,0);
});
test('recall history keeps valid attempts and rejects malformed shapes',()=>{
 const a={question:1,correct:false,at:'2026-09-06T12:00:00Z',support:'explanation and retry'};
 const s=readSave(JSON.stringify({version:1,completed:[],recall:{'2026-09-06':[a,{...a,correct:'true'},{...a,question:4}],unexpected:[a],'2026-09-07':{question:0}}}));
 assert.deepEqual(Object.keys(s.recall),['2026-09-06']);
 assert.equal(s.recall['2026-09-06'].length,1);
 assert.equal(s.recall['2026-09-06'][0].correct,false);
 assert.equal(s.recall['2026-09-06'][0].support,'explanation and retry');
});
test('invalid mission identifiers cannot create rewards or evidence',()=>{
 const s=freshState();
 for(const id of [-1,7,'0',null,NaN]){
  assert.equal(completeMission(s,id),false);
  assert.equal(canOpen(s,id),false);
  assert.equal(recordAttempt(s,id,'Answer',true),false);
 }
 assert.equal(recordAttempt(s,0,'Answer','true'),false);
 assert.equal(s.gems,0);assert.equal(s.evidence.length,0);
});
