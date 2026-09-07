import test from 'node:test';
import assert from 'node:assert/strict';
import {freshPlot,readPlotSave,recordPlot,completePlot,canVisit} from '../src/plot-state.js';
test('Plot saves preserve a consecutive journey and reject forged completion gaps',()=>{
 const s=readPlotSave(JSON.stringify({version:1,completed:[0,2,3,4],settings:{character:'../../bad',largeText:'false'}}));
 assert.deepEqual(s.completed,[0]);assert.equal(canVisit(s,2),false);assert.equal(canVisit(s,1),true);assert.equal(s.settings.character,'explorer');assert.equal(s.settings.largeText,false);
 assert.equal(completePlot(s,4),false);assert.equal(completePlot(s,1),true);assert.equal(completePlot(s,1),false);assert.equal(completePlot(s,-1),false);
});
test('Plot distinguishes observations, reading access and editing from assessed responses',()=>{
 const s=freshPlot();recordPlot(s,3,'undo-timeline-card',['opening'],false,['Read-aloud access used']);recordPlot(s,3,'submit-timeline',['opening'],false);recordPlot(s,3,'submit-timeline',['warning','search','opening'],true);
 const restored=readPlotSave(JSON.stringify(s));assert.equal(restored.attempts[0].kind,'observation');assert.equal(restored.attempts[0].correct,null);assert.equal(restored.attempts[1].correct,false);assert.equal(restored.attempts[2].correct,true);assert.deepEqual(restored.attempts[0].help,['Read-aloud access used']);
});
test('Plot handles corrupt and hostile saved evidence without accepting unsupported fields',()=>{
 assert.deepEqual(readPlotSave('{oops'),freshPlot());
 const data={version:1,attempts:[{at:'bad',chapter:0,action:'x',correct:true},{at:'2026-09-07',chapter:0,action:'x',correct:'false'},{at:'2026-09-07',chapter:0,action:'x',correct:false,help:{join:'bad'},response:'x'.repeat(2000),objective:'invented'}]};
 const s=readPlotSave(JSON.stringify(data));assert.equal(s.attempts.length,1);assert.equal(s.attempts[0].response.length,1000);assert.deepEqual(s.attempts[0].help,[]);assert.notEqual(s.attempts[0].objective,'invented');assert.equal(recordPlot(s,50,'x','bad',true),false);
});
test('Wardrobe choices migrate without changing discoveries or rewriting historical evidence versions',()=>{
 const legacy={version:1,started:true,completed:[0,1,2],settings:{character:'explorer-girl',largeText:true},attempts:[{at:'2026-09-07T10:00:00Z',version:'1605.1',chapter:1,action:'source-limits',response:'uncertain',correct:true}]};
 const s=readPlotSave(JSON.stringify(legacy));assert.deepEqual(s.completed,[0,1,2]);assert.equal(s.settings.costumeReady,false);assert.equal(s.settings.character,'explorer-girl');assert.equal(s.attempts[0].version,'1605.1');
 s.settings.outfit='petticoat';s.settings.skinTone='deep';s.settings.costumeReady=true;recordPlot(s,2,'wardrobe-outfit',{character:'explorer-girl',outfit:'petticoat'},null);
 const restored=readPlotSave(JSON.stringify(s));assert.equal(restored.settings.outfit,'petticoat');assert.equal(restored.settings.skinTone,'deep');assert.equal(restored.settings.costumeReady,true);assert.deepEqual(restored.completed,[0,1,2]);assert.equal(restored.attempts[1].correct,null);assert.equal(restored.attempts[1].kind,'observation');assert.match(restored.attempts[1].objective,/clothing/);assert.equal(restored.attempts[0].version,'1605.1');
});
test('Invalid wardrobe settings cannot become model paths or bypass wearing a valid costume',()=>{
 const s=readPlotSave(JSON.stringify({version:1,completed:[0],settings:{outfit:'../../bad.glb',skinTone:'<script>',costumeReady:true}}));
 assert.equal(s.settings.outfit,'doublet');assert.equal(s.settings.skinTone,'warm');assert.equal(s.settings.costumeReady,false);assert.deepEqual(s.completed,[0]);
});
