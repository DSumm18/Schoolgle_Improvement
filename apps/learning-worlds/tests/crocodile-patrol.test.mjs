import {test} from 'node:test';import assert from 'node:assert/strict';import {crocodilePatrol} from '../src/world.js';
const period=2*Math.PI/.08,epsilon=.001;
test('crocodile faces actual travel direction throughout both halves and stays in river corridor',()=>{
 for(let i=0;i<=720;i++){
  const t=i*period/720,p=crocodilePatrol(t),a=crocodilePatrol(t-epsilon),b=crocodilePatrol(t+epsilon),dx=b.x-a.x,dz=b.z-a.z;
  assert.ok(p.x>=-22.000001&&p.x<=-18.999999);assert.ok(p.z>=-14.000001&&p.z<=4.000001);
  const alignment=(Math.sin(p.yaw)*dx+Math.cos(p.yaw)*dz)/Math.hypot(dx,dz);assert.ok(alignment>.999999,'snout must face the numerical path derivative');
 }
});
test('patrol wraps without position or orientation discontinuity and retains the existing zero-time pose',()=>{
 const first=crocodilePatrol(0),last=crocodilePatrol(period),before=crocodilePatrol(period-epsilon),after=crocodilePatrol(period+epsilon);
 assert.deepEqual(first,{x:-19,z:-5,yaw:-0});assert.ok(Math.hypot(first.x-last.x,first.z-last.z)<1e-10);
 assert.ok(Math.hypot(before.x-after.x,before.z-after.z)<.002);
 assert.ok(Math.abs(Math.atan2(Math.sin(after.yaw-before.yaw),Math.cos(after.yaw-before.yaw)))<.002);
});
