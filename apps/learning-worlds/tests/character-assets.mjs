import fs from 'node:fs';
import assert from 'node:assert/strict';
const report=[];
for(const role of ['explorer','explorer-girl','farmer','scribe','archaeologist','curator']){
 const bytes=fs.readFileSync(`public/models/${role}.glb`);assert.equal(bytes.toString('utf8',0,4),'glTF');assert.equal(bytes.readUInt32LE(8),bytes.length);
 const jsonSize=bytes.readUInt32LE(12),gltf=JSON.parse(bytes.toString('utf8',20,20+jsonSize));const binary=bytes.subarray(28+jsonSize);
 const components={SCALAR:1,VEC3:3,VEC4:4,MAT4:16};
 function values(index){const a=gltf.accessors[index],view=gltf.bufferViews[a.bufferView];assert.equal(a.componentType,5126);const width=components[a.type],result=[];for(let i=0;i<a.count;i++)for(let j=0;j<width;j++)result.push(binary.readFloatLE((view.byteOffset||0)+(a.byteOffset||0)+i*(view.byteStride||width*4)+j*4));return{array:result,width};}
 assert.deepEqual(gltf.animations.map(a=>a.name).sort(),['Celebrate','Idle','Run','Walk']);assert.ok(gltf.skins[0].joints.length>=13);
 let tracks=0,maxLoopDifference=0;
 for(const animation of gltf.animations)for(const sampler of animation.samplers){
  const time=values(sampler.input).array,out=values(sampler.output);assert.ok(time.every(Number.isFinite)&&out.array.every(Number.isFinite));assert.ok(time.at(-1)>time[0]);
  if(animation.name!=='Celebrate')for(let j=0;j<out.width;j++)maxLoopDifference=Math.max(maxLoopDifference,Math.abs(out.array[j]-out.array[out.array.length-out.width+j]));tracks++;
 }
 assert.ok(maxLoopDifference<.001,`${role} loop discontinuity ${maxLoopDifference}`);
 report.push({role,bytes:bytes.length,clips:4,joints:gltf.skins[0].joints.length,tracks,maxLoopDifference});console.log('PASS',role,'four finite, continuous rig animation clips');
}
fs.writeFileSync('test-results/character-assets-report.json',JSON.stringify(report,null,2));
