// Centre-space allowlist, reviewed against fire-world.js. Geometry deliberately
// uses the union of pre-fire and rebuilding obstacles, so changing the story
// cannot leave a child standing inside a newly visible wall or scaffold.
export const explorerHeight=1.5;
export const footprintRadius=.45;
const bounds={minX:-4.9,maxX:48,minZ:-20,maxZ:24};
const areas=[
 {id:'quay-and-streets',minX:5.35,maxX:48,minZ:-20,maxZ:24},
 {id:'jetty',minX:-4.9,maxX:4,minZ:13.35,maxZ:16.65},
 {id:'jetty-entrance',minX:3.8,maxX:5.7,minZ:14,maxZ:16},
];
const props=[[10,12],[13,-1],[25,6],[-4,15],[36,-1]];
export const stationStops=props.map(([x,z],index)=>({index,x:x+2.6,y:index===3?.235:-.15,z}));
const houses=[[9,-5,4.8,5],[15,-7,5.1,5],[22,-6,5,5],[29,-9,5.2,5],[35,-12,5.3,5],[12,-15,4.7,5],[20,-16,4.8,5],[28,-19,5,5],[36,-22,4.6,5],[40,-6,4.6,5]];
const rect=(id,x,z,w,d,pad=footprintRadius+.2)=>({id,shape:'rect',minX:x-w/2-pad,maxX:x+w/2+pad,minZ:z-d/2-pad,maxZ:z+d/2+pad});
const obstacles=[
 ...houses.map(([x,z,w,d],i)=>rect('timber-house-'+i,x,z,w,d)),
 ...[[10,-7],[28,-12],[36,-21]].map(([x,z],i)=>rect('ruins-'+i,x,z,5.1,5.2)),
 ...[[15,-8],[29,-19]].map(([x,z],i)=>rect('rebuilding-scaffold-'+i,x,z+.25,6.7,6.2)),
 rect('stacked-bricks',18.63,-.5,2.66,.65),
 rect('stacked-stone',31.75,-6,2.7,.7),
 rect('raised-bridge-end',-18,8,48.8,6.2),
 // Cathedral front portico and warehouse lie beyond this walkable map edge.
 ...props.map(([x,z],index)=>({id:'station-'+index,shape:'circle',x,z,radius:1.65+footprintRadius})),
 ...[-5.1,3.7].flatMap(x=>[13.4,16.6].map(z=>({id:'mooring-post',shape:'circle',x,z,radius:.15+footprintRadius}))),
];
const inRect=(x,z,r)=>x>=r.minX&&x<=r.maxX&&z>=r.minZ&&z<=r.maxZ;
export function isFireWalkable(x,z){
 return Number.isFinite(x)&&Number.isFinite(z)&&areas.some(r=>inRect(x,z,r))&&!obstacles.some(r=>r.shape==='circle'?Math.hypot(x-r.x,z-r.z)<r.radius:inRect(x,z,r));
}
export function fireGroundHeight(x,z){return z>=13.1&&z<=16.9&&x<5.35?-.15+.385*Math.max(0,Math.min(1,(5.35-x)/.895)):-.15;}
export function nearestFireStation(x,z){
 let result=null;props.forEach(([px,pz],index)=>{const distance=Math.hypot(x-px,z-pz);if(distance<=3.2&&(!result||distance<result.distance))result={index,distance};});return result;
}
// Substeps prevent tunnelling, and axis sliding makes brushing a corner forgiving.
export function moveFirePosition(position,dx,dz){
 let {x,z}=position;dx=Number.isFinite(dx)?dx:0;dz=Number.isFinite(dz)?dz:0;
 if(!isFireWalkable(x,z))return {x,y:fireGroundHeight(x,z),z,blocked:true};
 const length=Math.hypot(dx,dz);if(length>128){dx*=128/length;dz*=128/length;}
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.08)),sx=dx/steps,sz=dz/steps;let blocked=false;
 for(let i=0;i<steps;i++){
  if(isFireWalkable(x+sx,z+sz)){x+=sx;z+=sz;continue;}
  blocked=true;
  if(Math.abs(sx)>=Math.abs(sz)){if(isFireWalkable(x+sx,z))x+=sx;if(isFireWalkable(x,z+sz))z+=sz;}
  else{if(isFireWalkable(x,z+sz))z+=sz;if(isFireWalkable(x+sx,z))x+=sx;}
 }
 return {x,y:fireGroundHeight(x,z),z,blocked};
}
export function fireSegmentClear(a,b){
 const dx=b.x-a.x,dz=b.z-a.z;
 // Exact obstacle intersections prevent smoothing diagonally across a corner
 // between two sampled points; movement substeps must never need to repair a path.
 for(const obstacle of obstacles){
  if(obstacle.shape==='circle'){
   const length=dx*dx+dz*dz,t=length?Math.max(0,Math.min(1,((obstacle.x-a.x)*dx+(obstacle.z-a.z)*dz)/length)):0;
   if(Math.hypot(a.x+dx*t-obstacle.x,a.z+dz*t-obstacle.z)<obstacle.radius)return false;
  }else{
   let lo=0,hi=1;
   for(const [start,d,min,max] of [[a.x,dx,obstacle.minX,obstacle.maxX],[a.z,dz,obstacle.minZ,obstacle.maxZ]]){
    if(Math.abs(d)<1e-12){if(start<min||start>max){lo=1;hi=0;break;}}
    else{let t0=(min-start)/d,t1=(max-start)/d;if(t0>t1)[t0,t1]=[t1,t0];lo=Math.max(lo,t0);hi=Math.min(hi,t1);}
   }
   if(lo<=hi)return false;
  }
 }
 const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.08));
 for(let i=0;i<=steps;i++)if(!isFireWalkable(a.x+(b.x-a.x)*i/steps,a.z+(b.z-a.z)*i/steps))return false;return true;
}
// Small static half-unit grid; breadth-first search is bounded at <10k cells.
// Smoothing only joins points when the whole segment is clear of every obstacle.
const grid=.5,nx=107,nz=89,gridPoint=id=>({x:-5+(id%nx)*grid,z:-20+Math.floor(id/nx)*grid});
let cells;
function gridCells(){if(!cells)cells=Uint8Array.from({length:nx*nz},(_,i)=>{const p=gridPoint(i);return Number(isFireWalkable(p.x,p.z));});return cells;}
function gridAnchor(p){
 let nearest=-1,distance=Infinity;const cx=Math.round((p.x+5)/grid),cz=Math.round((p.z+20)/grid),valid=gridCells();
 for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){const x=cx+dx,z=cz+dz;if(x<0||z<0||x>=nx||z>=nz)continue;const id=z*nx+x,q=gridPoint(id),d=Math.hypot(q.x-p.x,q.z-p.z);if(valid[id]&&d<distance&&fireSegmentClear(p,q)){nearest=id;distance=d;}}
 return nearest;
}
export function findFirePath(start,end){
 if(!isFireWalkable(start.x,start.z)||!isFireWalkable(end.x,end.z))return [];
 const point=p=>({x:p.x,y:fireGroundHeight(p.x,p.z),z:p.z});
 if(fireSegmentClear(start,end))return [point(start),point(end)];
 const first=gridAnchor(start),last=gridAnchor(end);if(first<0||last<0)return [];
 const previous=new Int32Array(nx*nz).fill(-1),queue=new Int32Array(nx*nz),valid=gridCells();let head=0,tail=1;queue[0]=first;previous[first]=first;
 while(head<tail&&previous[last]===-1){const id=queue[head++],x=id%nx,z=Math.floor(id/nx);for(const next of [x? id-1:-1,x<nx-1?id+1:-1,z?id-nx:-1,z<nz-1?id+nx:-1]){
  if(next<0||!valid[next]||previous[next]!==-1||!fireSegmentClear(gridPoint(id),gridPoint(next)))continue;previous[next]=id;queue[tail++]=next;
 }}
 if(previous[last]===-1)return [];
 const reversed=[];for(let id=last;;id=previous[id]){reversed.push(gridPoint(id));if(id===first)break;}
 const raw=[start,...reversed.reverse(),end],smoothed=[point(start)];let current=0;
 while(current<raw.length-1){let next=raw.length-1;while(next>current+1&&!fireSegmentClear(raw[current],raw[next]))next--;smoothed.push(point(raw[next]));current=next;}
 return smoothed;
}
export function getFireNavigation(){return {bounds:{...bounds},footprintRadius,areas:areas.map(r=>({...r})),obstacles:obstacles.map(r=>({...r})),stations:props.map(([x,z],index)=>({index,x,z,stop:{...stationStops[index]}}))};}
