import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshState,readSave} from '../src/learning.js';
test('Avatar and tutorial preferences survive save and reject arbitrary asset paths',()=>{
 const state=freshState();state.settings.character='explorer-girl';state.settings.skinTone='deep';state.settings.controlsSeen=true;state.completed=[0];
 const restored=readSave(JSON.stringify(state));assert.equal(restored.settings.character,'explorer-girl');assert.equal(restored.settings.skinTone,'deep');assert.equal(restored.settings.controlsSeen,true);assert.equal(restored.gems,30);
 state.settings.character='https://untrusted.example/avatar.glb';state.settings.skinTone={colour:'red'};state.settings.controlsSeen='false';
 const invalid=readSave(JSON.stringify(state));assert.equal(invalid.settings.character,'explorer');assert.equal(invalid.settings.skinTone,'warm');assert.equal(invalid.settings.controlsSeen,false);
});
test('Lighting choices survive saves and older or invalid saves remain readable',()=>{
 const state=freshState();state.settings.lighting='day';state.completed=[0];
 const restored=readSave(JSON.stringify(state));assert.equal(restored.settings.lighting,'day');assert.equal(restored.gems,30);
 for(const value of [undefined,'night',{},false]){state.settings.lighting=value;const safe=readSave(JSON.stringify(state));assert.equal(safe.settings.lighting,'evening');assert.deepEqual(safe.completed,[0]);}
});
