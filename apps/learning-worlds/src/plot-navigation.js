// Connected palace courtyard. Areas describe permitted explorer centres;
// exclusion shapes include the half-unit clothed-avatar clearance.
export const explorerHeight=1.5,footprintRadius=.5;
const bounds={minX:-17.3,maxX:30.8,minZ:-15.5,maxZ:20};
const areas=[{id:'palace-courtyard',...bounds}];
const props=[[-8,5],[2,-3],[12,3],[22,0],[24,-12]];
export const stationStops=props.map(([x,z],index)=>({index,x,y:-.035,z:z+3.25}));
const rect=(id,x,z,w,d,pad=footprintRadius)=>({id,shape:'rect',minX:x-w/2-pad,maxX:x+w/2+pad,minZ:z-d/2-pad,maxZ:z+d/2+pad});
const obstacles=[
 rect('Westminster Hall and buttresses',-6,-30,15.2,43.7),
 rect('St Stephens Chapel and buttresses',14,-29,12.9,30.6),
 rect('Eastern palace range',26,-28,8,21),
 ...props.map(([x,z],index)=>({id:'station-'+index,shape:'circle',x,z,radius:2.4+footprintRadius})),
 ...[[-15,14],[-15,-2],[-4,12],[8,12],[20,10],[26,-7]].map(([x,z])=>({id:'lantern',shape:'circle',x,z,radius:.12+footprintRadius})),
];
const inRect=(x,z,r)=>x>=r.minX&&x<=r.maxX&&z>=r.minZ&&z<=r.maxZ;
export function isPlotWalkable(x,z){
 return Number.isFinite(x)&&Number.isFinite(z)&&areas.some(r=>inRect(x,z,r))&&!obstacles.some(r=>r.shape==='circle'?Math.hypot(x-r.x,z-r.z)<r.radius:inRect(x,z,r));
}
export function plotGroundHeight(){return -.035;}
export function nearestPlotStation(x,z){
 let result=null;props.forEach(([px,pz],index)=>{const distance=Math.hypot(x-px,z-pz);if(distance<=3.75&&(!result||distance<result.distance))result={index,distance};});return result;
}
// Substeps prevent tunnelling, and axis sliding makes brushing a corner forgiving.
export function movePlotPosition(position,dx,dz){
 let {x,z}=position;dx=Number.isFinite(dx)?dx:0;dz=Number.isFinite(dz)?dz:0;
 if(!isPlotWalkable(x,z))return {x,y:plotGroundHeight(x,z),z,blocked:true};
 const length=Math.hypot(dx,dz);if(length>128){dx*=128/length;dz*=128/length;}
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.08)),sx=dx/steps,sz=dz/steps;let blocked=false;
 for(let i=0;i<steps;i++){
  if(isPlotWalkable(x+sx,z+sz)){x+=sx;z+=sz;continue;}
  blocked=true;
  if(Math.abs(sx)>=Math.abs(sz)){if(isPlotWalkable(x+sx,z))x+=sx;if(isPlotWalkable(x,z+sz))z+=sz;}
  else{if(isPlotWalkable(x,z+sz))z+=sz;if(isPlotWalkable(x+sx,z))x+=sx;}
 }
 return {x,y:plotGroundHeight(x,z),z,blocked};
}
export function plotSegmentClear(a,b){
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
 for(let i=0;i<=steps;i++)if(!isPlotWalkable(a.x+(b.x-a.x)*i/steps,a.z+(b.z-a.z)*i/steps))return false;return true;
}
// Small static half-unit grid; breadth-first search is bounded at <10k cells.
// Smoothing only joins points when the whole segment is clear of every obstacle.
const grid=.5,nx=98,nz=72,gridPoint=id=>({x:-17.5+(id%nx)*grid,z:-15.5+Math.floor(id/nx)*grid});
let cells;
function gridCells(){if(!cells)cells=Uint8Array.from({length:nx*nz},(_,i)=>{const p=gridPoint(i);return Number(isPlotWalkable(p.x,p.z));});return cells;}
function gridAnchor(p){
 let nearest=-1,distance=Infinity;const cx=Math.round((p.x+17.5)/grid),cz=Math.round((p.z+15.5)/grid),valid=gridCells();
 for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){const x=cx+dx,z=cz+dz;if(x<0||z<0||x>=nx||z>=nz)continue;const id=z*nx+x,q=gridPoint(id),d=Math.hypot(q.x-p.x,q.z-p.z);if(valid[id]&&d<distance&&plotSegmentClear(p,q)){nearest=id;distance=d;}}
 return nearest;
}
export function findPlotPath(start,end){
 if(!isPlotWalkable(start.x,start.z)||!isPlotWalkable(end.x,end.z))return [];
 const point=p=>({x:p.x,y:plotGroundHeight(p.x,p.z),z:p.z});
 if(plotSegmentClear(start,end))return [point(start),point(end)];
 const first=gridAnchor(start),last=gridAnchor(end);if(first<0||last<0)return [];
 const previous=new Int32Array(nx*nz).fill(-1),queue=new Int32Array(nx*nz),valid=gridCells();let head=0,tail=1;queue[0]=first;previous[first]=first;
 while(head<tail&&previous[last]===-1){const id=queue[head++],x=id%nx,z=Math.floor(id/nx);for(const next of [x? id-1:-1,x<nx-1?id+1:-1,z?id-nx:-1,z<nz-1?id+nx:-1]){
  if(next<0||!valid[next]||previous[next]!==-1||!plotSegmentClear(gridPoint(id),gridPoint(next)))continue;previous[next]=id;queue[tail++]=next;
 }}
 if(previous[last]===-1)return [];
 const reversed=[];for(let id=last;;id=previous[id]){reversed.push(gridPoint(id));if(id===first)break;}
 const raw=[start,...reversed.reverse(),end],smoothed=[point(start)];let current=0;
 while(current<raw.length-1){let next=raw.length-1;while(next>current+1&&!plotSegmentClear(raw[current],raw[next]))next--;smoothed.push(point(raw[next]));current=next;}
 return smoothed;
}
export function getPlotNavigation(){return {bounds:{...bounds},footprintRadius,areas:areas.map(r=>({...r})),obstacles:obstacles.map(r=>({...r})),stations:props.map(([x,z],index)=>({index,x,z,stop:{...stationStops[index]}}))};}
