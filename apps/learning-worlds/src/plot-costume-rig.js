import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {skinTones} from './characters.js';

// Shared original clothing geometry: dressing mirror and in-world explorer use
// exactly the same face, colours, pieces and outfit, with no replacement avatar.
export function createPlotCostumeRig({character='explorer',outfit='doublet',skinTone='warm',height=1.5}={}){
 let characterId=character==='explorer-girl'?character:'explorer',outfitId=['modern','doublet','petticoat'].includes(outfit)?outfit:'doublet',toneId=skinTones.some(t=>t.id===skinTone)?skinTone:'warm';
 let disposed=false,dirty=true,avatar=null,head=null,arms=[],cloak=null,building=false,phase=0,legs=[],rawHeight=0,minFoot=0;
 const geometries=new Set(),materials=new Set(),textures=new Set(),modelGeometries=new Set();
 const turntable=new THREE.Group();turntable.name='Period-dressed explorer';
 const m=(color,extra={})=>{const v=new THREE.MeshStandardMaterial({color,roughness:.78,...extra});materials.add(v);return v;};
 const cloth=()=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#ffffff';x.fillRect(0,0,128,128);for(let i=0;i<128;i+=2){x.fillStyle=i%4?'#eeeeee':'#dddddd';x.fillRect(i,0,1,128);x.fillStyle='#d9d9d944';x.fillRect(0,i,128,1);}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,3);t.colorSpace=THREE.SRGBColorSpace;textures.add(t);return t;};
 const weave=cloth(),wool=(color)=>m(color,{map:weave,roughness:.96});
 const skin=m(0xffffff),hair=m(new THREE.Color(.07,.038,.025)),white=m(new THREE.Color(.96,.94,.87)),eyes=m(new THREE.Color(.025,.028,.026)),leather=m(0x423026),sole=m(0x242a29),linen=wool(0xeee2c6);
 const blue=wool(0x24556b),blueTrim=m(0x42788b),ochre=m(0xc4a36a),gold=m(0xc2a263,{metalness:.45,roughness:.42}),rust=wool(0x9f553a),green=wool(0x32695e),greenTrim=m(0x538579),cloakRed=wool(0x613844),cloakGreen=wool(0x29484a),cloakLining=wool(0xba9370);
 const modernTeal=m(new THREE.Color(.025,.31,.31)),modernCream=m(new THREE.Color(.83,.74,.54)),modernScarf=m(new THREE.Color(.79,.22,.075)),modernPack=m(new THREE.Color(.32,.36,.19));
 const geometry=(g)=>{geometries.add(g);return g;};
 const sphere=geometry(new THREE.SphereGeometry(1,24,16)),boxGeo=geometry(new THREE.BoxGeometry(1,1,1));
 const mesh=(g,material,parent,name,x=0,y=0,z=0)=>{const o=new THREE.Mesh(g,material);o.name=name;o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 const ell=(p,n,x,y,z,sx,sy,sz,mat)=>{const o=mesh(sphere,mat,p,n,x,y,z);o.scale.set(sx,sy,sz);return o;};
 const box=(p,n,x,y,z,sx,sy,sz,mat)=>{const o=mesh(boxGeo,mat,p,n,x,y,z);o.scale.set(sx,sy,sz);return o;};
 const line=(p,n,points,r,mat)=>mesh(geometry(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v))),Math.max(8,points.length*5),r,5,false)),mat,p,n);
 const cylinder=(p,n,x,y,z,rt,rb,h,mat,segments=32)=>mesh(geometry(new THREE.CylinderGeometry(rt,rb,h,segments)),mat,p,n,x,y,z);
 const group=(p,n,x=0,y=0,z=0)=>{const g=new THREE.Group();g.name=n;g.position.set(x,y,z);p.add(g);return g;};
 const torso=(p,n,mat)=>{const o=mesh(geometry(new THREE.LatheGeometry([[.255,1.035],[.26,1.10],[.238,1.18],[.29,1.42],[.305,1.51],[.245,1.59],[.115,1.64]].map(v=>new THREE.Vector2(...v)),32)),mat,p,n);o.scale.z=.66;return o;};
 // Cloth panels are curved meshes with shallow folds, not rigid cones.
 const drape=(p,n,{top=.22,bottom=.5,yTop=1.1,yBottom=.26,depth=.76,start=-Math.PI,end=Math.PI,pleats=18,amplitude=.022},mat)=>{
  const vertices=[],uv=[],indices=[],rows=14,cols=72;
  for(let j=0;j<=rows;j++){const t=j/rows,y=yTop+(yBottom-yTop)*t,r=top+(bottom-top)*t;
   for(let i=0;i<=cols;i++){const u=i/cols,a=start+(end-start)*u,fold=Math.sin(a*pleats)*amplitude*(.3+.7*t),rr=r+fold;vertices.push(Math.sin(a)*rr,y,-Math.cos(a)*rr*depth);uv.push(u,t);}}
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const k=j*(cols+1)+i;indices.push(k,k+cols+1,k+1,k+1,k+cols+1,k+cols+2);}
  const g=geometry(new THREE.BufferGeometry());g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();const o=mesh(g,mat,p,n);o.material.side=THREE.DoubleSide;return o;
 };
 function batch(p){
  for(const child of [...p.children])if(child.isGroup)batch(child);
  const sets=new Map();for(const o of p.children){if(!o.isMesh)continue;const key=o.material.uuid+'|'+Object.keys(o.geometry.attributes).sort().join(',')+'|'+!!o.geometry.index;if(!sets.has(key))sets.set(key,[]);sets.get(key).push(o);}
  for(const objects of sets.values()){
   if(objects.length<2)continue;const copies=objects.map(o=>{o.updateMatrix();return o.geometry.clone().applyMatrix4(o.matrix);}),g=mergeGeometries(copies,false);for(const c of copies)c.dispose();if(!g)continue;
   mesh(geometry(g),objects[0].material,p,'Combined '+objects[0].name);
   for(const o of objects){p.remove(o);if(o.geometry!==sphere&&o.geometry!==boxGeo){o.geometry.dispose();geometries.delete(o.geometry);}}
  }
 }
 // Track and release outfit-specific geometry after a rebuild. Shared sphere
 // and box geometry and the small fixed material palette live until dispose.
 function clearModel(){if(!avatar)return;avatar.traverse(o=>{if(o.isMesh&&o.geometry!==sphere&&o.geometry!==boxGeo)modelGeometries.add(o.geometry);});turntable.remove(avatar);for(const g of modelGeometries){g.dispose();geometries.delete(g);}modelGeometries.clear();}
 function updateLabel(){}
 function colourSkin(){skin.color.setRGB(...skinTones.find(t=>t.id===toneId).colour);}
 function measure(){
  legs=[];for(const s of [-1,1]){const leg=avatar.getObjectByName('Leg '+s);if(!leg)continue;leg.position.set(s*.155,1.03,0);for(const child of leg.children){child.position.x-=s*.155;child.position.y-=1.03;}legs.push({leg,s});}
  const copy=avatar.clone(true);copy.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(copy,true);rawHeight=bounds.max.y-bounds.min.y;minFoot=bounds.min.y;
  turntable.scale.setScalar(height/rawHeight);turntable.position.y=-minFoot*height/rawHeight;
 }
 function build(){
  if(disposed||building)return;building=true;clearModel();avatar=group(turntable,'Same explorer, different clothes');arms=[];cloak=null;
  const modern=outfitId==='modern',dress=outfitId==='petticoat',bodyMat=modern?modernTeal:dress?green:blue;
  ell(avatar,'Neck',0,1.66,0,.105,.13,.10,skin);
  for(const s of [-1,1]){
   const leg=group(avatar,`Leg ${s}`);
   ell(leg,'Stocking',s*.155,.48,0,.088,.29,.087,modern?skin:linen);
   ell(leg,'Leather shoe',s*.155,.155,.076,.12,.12,.195,leather);ell(leg,'Shoe sole',s*.155,.065,.075,.126,.031,.197,sole);
   if(!modern){line(leg,'Shoe tie',[[s*.155-.05,.245,.14],[s*.155,.25,.12],[s*.155+.05,.245,.14]],.009,ochre);}
   if(modern){ell(leg,'Explorer sock',s*.155,.30,0,.10,.10,.10,modernCream);ell(leg,'Explorer shorts',s*.155,.88,0,.148,.23,.145,modernCream);}
   else if(!dress){ell(leg,'Full knee breeches',s*.158,.83,0,.19,.27,.185,rust);cylinder(leg,'Breeches knee band',s*.155,.61,0,.101,.102,.062,ochre);for(let k=-1;k<=1;k++)line(leg,'Breeches seam',[[s*.158+k*.07,1.035,.065],[s*.158+k*.07,.85,.176],[s*.158+k*.045,.64,.07]],.006,ochre);}
  }
  if(dress){
   drape(avatar,'Pleated petticoat',{top:.26,bottom:.49,yTop:1.10,yBottom:.22,pleats:20},rust);
   drape(avatar,'Petticoat broad hem',{top:.474,bottom:.49,yTop:.31,yBottom:.22,pleats:20},ochre);
   // A separate, modest linen apron: deliberately recognisable at small sizes.
   const apron=drape(avatar,'Linen apron',{top:.26,bottom:.43,yTop:1.065,yBottom:.37,start:Math.PI-.72,end:Math.PI+.72,pleats:14,amplitude:.009},linen);apron.position.z=.032;
  }
  if(modern){ell(avatar,'Explorer jacket',0,1.34,0,.31,.36,.19,modernTeal);ell(avatar,'Explorer shirt',0,1.37,.175,.115,.27,.035,modernCream);ell(avatar,'Backpack',0,1.36,-.25,.25,.27,.13,modernPack);ell(avatar,'Backpack flap',0,1.54,-.32,.24,.09,.065,modernCream);}
  else{
   torso(avatar,dress?'Fitted bodice':'Fitted doublet',bodyMat);
   // The front closes at the middle; side seams make the fitted construction visible.
   for(const s of [-1,1])line(avatar,'Tailored seam',[[s*.21,1.53,.13],[s*.19,1.32,.16],[s*.13,1.09,.145]],.009,dress?greenTrim:blueTrim);
   if(dress){for(let j=0;j<5;j++){const y=1.18+j*.065;line(avatar,'Bodice cross lacing',[[-.047,y,.185],[.047,y+.052,.188]],.009,ochre);line(avatar,'Bodice cross lacing',[[.047,y,.185],[-.047,y+.052,.188]],.009,ochre);}}
   else{line(avatar,'Doublet opening',[[0,1.1,.183],[0,1.36,.199],[0,1.57,.145]],.01,ochre);for(let j=0;j<7;j++)ell(avatar,'Doublet button',.031,1.13+j*.065,.203,.016,.016,.012,gold);}
   for(let i=-2;i<=2;i++){const tab=box(avatar,'Waist tab',i*.103,1.025,.152-.03*Math.abs(i),.10,.15,.039,bodyMat);tab.rotation.z=-i*.075;}
  }
  ell(avatar,'Belt',0,1.075,0,.29,.033,.198,leather);box(avatar,'Belt buckle',0,1.078,.204,.084,.056,.018,gold);
  for(const s of [-1,1]){
   const arm=group(avatar,`Arm ${s}`,s*.31,1.53,0);arms.push({arm,s});arm.rotation.z=s*.16;
   ell(arm,'Upper sleeve',s*.027,-.115,0,.116,.20,.116,bodyMat);
   ell(arm,modern?'Bare forearm':'Long sleeve',s*.059,-.34,.008,.078,.205,.081,modern?skin:bodyMat);
   if(!modern){ell(arm,'Linen cuff',s*.064,-.493,.014,.084,.033,.088,linen);for(let k=-1;k<=1;k++)line(arm,'Sleeve stitched detail',[[k*.027,-.04,.112],[k*.027+s*.04,-.25,.082],[k*.022+s*.06,-.45,.078]],.004,dress?greenTrim:blueTrim);}
   ell(arm,'Hand',s*.067,-.565,.038,.085,.105,.08,skin);ell(arm,'Thumb',s*.017,-.543,.092,.035,.053,.038,skin);
   if(modern)ell(avatar,'Backpack strap',s*.21,1.43,.167,.035,.225,.035,leather);
  }
  if(!modern){
   cloak=group(avatar,'Draped shoulder cloak');
   drape(cloak,'Wool cloak',{top:.33,bottom:dress?.54:.50,yTop:1.57,yBottom:dress?.40:.61,start:-2.04,end:2.04,depth:.86,pleats:13,amplitude:.018},dress?cloakGreen:cloakRed);
   drape(cloak,'Cloak lower binding',{top:dress?.53:.489,bottom:dress?.546:.506,yTop:dress?.46:.67,yBottom:dress?.40:.61,start:-2.04,end:2.04,depth:.87,pleats:13,amplitude:.018},cloakLining);
   line(avatar,'Cloak fastening',[[-.18,1.59,.16],[0,1.54,.204],[.18,1.59,.16]],.012,gold);
   if(dress){for(const s of [-1,1]){const collar=ell(avatar,'Linen collar',s*.091,1.586,.146,.092,.077,.034,linen);collar.rotation.z=s*.44;}}
   else for(let i=0;i<28;i++){const a=i/28*Math.PI*2;const pleat=box(avatar,'Small folded linen ruff',Math.sin(a)*.151,1.672,-Math.cos(a)*.141,.028,.039,.088,linen);pleat.rotation.y=-a;pleat.rotation.z=Math.sin(a*2)*.04;}
  }else{ell(avatar,'Explorer neckerchief',0,1.66,.01,.16,.065,.15,modernScarf);ell(avatar,'Scarf knot',0,1.62,.17,.055,.065,.05,modernScarf);line(avatar,'Scarf tail',[[0,1.59,.18],[.085,1.4,.18]],.033,modernScarf);}
  head=group(avatar,'Explorer face and hair',0,1.66,0);
  const face=(n,x,y,z,sx,sy,sz,mat)=>ell(head,n,x,y-1.66,z,sx,sy,sz,mat);
  face('Same explorer head',0,1.96,.017,.255,.29,.235,skin);
  for(const s of [-1,1]){face('Ear',s*.252,1.97,.005,.060,.09,.05,skin);face('Eye white',s*.097,2.01,.224,.060,.070,.022,white);face('Iris',s*.097,2.006,.245,.028,.039,.01,eyes);face('Eye glint',s*.088,2.026,.254,.009,.013,.005,white);face('Eyebrow',s*.095,2.103,.222,.066,.014,.026,hair);}
  face('Nose',0,1.956,.255,.047,.055,.058,skin);face('Smile',0,1.857,.229,.064,.016,.012,leather);
  face('Curly hair cap',0,2.12,-.008,.26,.17,.226,hair);
  for(let i=0;i<9;i++){const a=i*Math.PI*2/9;face('Original curl',Math.cos(a)*.215,2.18,-Math.sin(a)*.18,.075,.068,.066,hair);}
  if(characterId==='explorer-girl'){
   face('Maya ponytail tie',.245,2.10,-.16,.095,.08,.065,modernScarf);
   const tail=face('Maya ponytail',.295,1.90,-.13,.105,.265,.10,hair);tail.rotation.z=.12;
   face('Maya ponytail tip',.32,1.66,-.075,.08,.1,.075,hair);
   for(const s of [-1,1])face('Maya side curl',s*.23,1.96,-.05,.045,.145,.045,hair);
  }
  if(modern){face('Original safari brim',0,2.235,0,.38,.025,.33,modernCream);face('Original safari crown',0,2.33,-.01,.25,.145,.23,modernCream);face('Original hat band',0,2.267,-.008,.254,.031,.234,leather);}
  else if(dress){
   // Open-front linen coif: hair fringe and the identity-defining ponytail stay visible.
   const cap=mesh(geometry(new THREE.SphereGeometry(1,32,20,0,Math.PI*2,0,Math.PI*.48)),linen,head,'Linen coif',0,2.12-1.66,-.017);cap.scale.set(.277,.245,.247);
   for(const s of [-1,1]){face('Coif side',s*.253,2.135,-.075,.035,.13,.15,linen);line(head,'Coif tie',[[s*.255,.44,-.075],[s*.235,.32,-.084],[s*.18,.20,-.02]],.009,linen);}
   for(let i=0;i<=22;i++){const a=i/22*Math.PI;face('Coif stitched edge',Math.cos(a)*.276,2.126,Math.sin(a)*.225-.017,.005,.005,.007,ochre);}
  }else{
   face('Cloth cap brim',0,2.229,0,.31,.026,.28,blue);const cap=face('Soft cloth cap',-.025,2.28,-.025,.278,.12,.247,blue);cap.rotation.z=.13;
   face('Cap band',0,2.235,0,.287,.025,.254,ochre);face('Small cap button',-.03,2.389,-.018,.033,.018,.03,gold);
  }
  batch(avatar);colourSkin();measure();dirty=true;building=false;
 }
 build();
 function animate(dt,action='Idle',reducedMotion=false){
  if(disposed)return false;
  if(!reducedMotion)phase+=Math.max(0,Math.min(.1,Number(dt)||0));
  const walking=action==='Walk'&&!reducedMotion,p=phase*Math.PI*2/.64;
  for(const {leg,s} of legs){leg.rotation.x=walking?Math.sin(p+(s===1?Math.PI:0))*.4:0;leg.position.y=1.03;}
  for(const {arm,s} of arms){arm.rotation.x=walking?-Math.sin(p+(s===1?Math.PI:0))*.25:0;arm.rotation.z=s*.16+(action==='Celebrate'&&!reducedMotion?s*.85*Math.abs(Math.sin(phase*3)):0);}
  if(head)head.rotation.z=reducedMotion?0:Math.sin(phase*.85)*.01;
  if(cloak){cloak.rotation.x=walking?Math.sin(p)*.012:0;cloak.rotation.z=walking?Math.sin(p)*.013:0;}
  // Keep the stance shoe on the paving as the hip turns; lift the swing shoe.
  turntable.updateWorldMatrix(true,true);const base=turntable.localToWorld(new THREE.Vector3(0,minFoot,0)).y,scale=turntable.getWorldScale(new THREE.Vector3()).y;
  for(const {leg,s} of legs){const bounds=new THREE.Box3().setFromObject(leg,true),lift=walking?Math.max(0,Math.sin(p+(s===1?Math.PI:0)))*.055:0;leg.position.y+=(base+lift-bounds.min.y)/scale;}
  return !reducedMotion;
 }
 return {root:turntable,animate,setAppearance(settings={}){if(disposed)return;const c=settings.character==='explorer-girl'?'explorer-girl':'explorer',o=['modern','doublet','petticoat'].includes(settings.outfit)?settings.outfit:'doublet',t=skinTones.some(t=>t.id===settings.skinTone)?settings.skinTone:'warm';const rebuild=c!==characterId||o!==outfitId;characterId=c;outfitId=o;toneId=t;if(rebuild)build();else colourSkin();},getState:()=>({character:characterId,outfit:outfitId,skinTone:toneId,standingHeight:height,rawHeight,modelScale:height/rawHeight}),dispose(){if(disposed)return;disposed=true;turntable.removeFromParent();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();turntable.clear();}};
}
