import test from 'node:test';
import assert from 'node:assert/strict';
import {practiceKey,demoMetadata,demoTeacherPanel} from '../src/demo-session.js';
test('fictional learner uses distinct saves and export identity without personal registration',()=>{
  const previous=globalThis.location;
  try{
    globalThis.location={search:'?game=plot'};
    assert.equal(practiceKey('schoolgle-midnight-letter-v1'),'schoolgle-midnight-letter-v1');
    assert.equal(demoMetadata().learner,null);
    globalThis.location={search:'?game=plot&demo=1'};
    assert.equal(practiceKey('schoolgle-midnight-letter-v1'),'schoolgle-midnight-letter-v1-demo-alex');
    assert.equal(demoMetadata().learner.fictional,true);
    assert.match(demoTeacherPanel('plot'),/Clear Alex/);
    assert.doesNotMatch(demoTeacherPanel('<script>'),/<script>/);
  }finally{if(previous===undefined)delete globalThis.location;else globalThis.location=previous;}
});
