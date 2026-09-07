// Each stone is one persistent DOM object. Moving changes its container; no
// decorative duplicate is created, so the whole quantity remains observable.
export function createStoneBoard({total=15,demo=false,reducedMotion=false,onMove=()=>{}}={}){
 const element=document.createElement('section');element.className='stone-board';element.dataset.board=demo?'demo':'pupil';
 const places=Array(total).fill(-1),stones=[],slots=[],trays=[],adds=[],takes=[];
 element.innerHTML=`<div class="stone-pool"><div class="pool-caption"><strong>${total} stones altogether</strong><span class="pool-left"></span><small>Shared pile · stones start here</small></div><div class="pool-stones" role="group" aria-label="Shared pile"></div></div><div class="bonus-trays physical-trays"></div><p class="stone-conservation"></p><p class="stone-move-status" role="status" aria-live="polite" aria-atomic="true"></p>`;
 const pool=element.querySelector('.pool-stones'),trayRow=element.querySelector('.bonus-trays');
 const values=()=>[0,1,2].map(i=>places.filter(p=>p===i).length);
 function update(){const counts=values(),left=places.filter(p=>p===-1).length;element.querySelector('.pool-left').textContent=`${left} left to share`;element.querySelector('.stone-conservation').textContent=`${left} in the pile + ${total-left} in the trays = ${total} altogether`;counts.forEach((v,i)=>{trays[i].count.textContent=`Tray ${i+1} · ${v} ${v===1?'stone':'stones'}`;adds[i].disabled=demo||left===0;takes[i].disabled=demo||v===0;});}
 function move(tray,back=false){
  if(!Number.isInteger(tray)||tray<0||tray>2)return false;
  const id=back?places.lastIndexOf(tray):places.indexOf(-1);if(id<0)return false;
  const stone=stones[id],before=stone.getBoundingClientRect();stone.getAnimations().forEach(a=>a.cancel());
  places[id]=back?-1:tray;stone.dataset.location=back?'pile':`tray-${tray+1}`;
  (back?slots[id]:trays[tray].bowl).append(stone);update();
  const after=stone.getBoundingClientRect();
  if(!reducedMotion&&element.isConnected&&before.width&&after.width){stone.animate([{transform:`translate(${before.x-after.x}px,${before.y-after.y}px)`,zIndex:10},{transform:'translate(0,0)',zIndex:10}],{duration:480,easing:'cubic-bezier(.22,.7,.26,1)'});}
  element.querySelector('.stone-move-status').textContent=`One stone ${back?'returned to the pile':`moved into tray ${tray+1}`}. ${places.filter(p=>p===-1).length} left to share.`;
  onMove(values(),back);return true;
 }
 for(let i=0;i<total;i++){const slot=document.createElement('span');slot.className='pool-slot';slots.push(slot);pool.append(slot);const stone=document.createElement('span');stone.className='sharing-stone';stone.dataset.stone=String(i+1);stone.dataset.location='pile';stone.setAttribute('role','img');stone.setAttribute('aria-label',`Stone ${i+1}`);stones.push(stone);slot.append(stone);}
 for(let i=0;i<3;i++){
  const tray=document.createElement('div');tray.className='physical-tray';const count=document.createElement('strong');count.id=`${demo?'demo':'pupil'}-tray-${i+1}`;
  const bowl=document.createElement('div');bowl.className='tray-bowl';bowl.setAttribute('role','group');bowl.setAttribute('aria-labelledby',count.id);bowl.dataset.tray=String(i+1);
  const controls=document.createElement('div');controls.className='tray-controls';
  for(const back of [false,true]){const button=document.createElement('button');button.type='button';button.className=back?'take-stone':'add-stone';button.innerHTML=back?'<b aria-hidden="true">−</b> Take 1 back':'<b aria-hidden="true">+</b> Add 1';button.setAttribute('aria-label',`${back?'Remove an offering from':'Add an offering to'} tray ${i+1}`);button.onclick=()=>move(i,back);controls.append(button);(back?takes:adds).push(button);}
  tray.append(count,bowl,controls);trayRow.append(tray);trays.push({bowl,count});
 }
 update();return {element,move,values,highlight(tray,back){element.querySelectorAll('.demo-highlight').forEach(e=>e.classList.remove('demo-highlight'));(back?takes:adds)[tray]?.classList.add('demo-highlight');},dispose(){stones.forEach(s=>s.getAnimations().forEach(a=>a.cancel()));}};
}

export function createStoneDemo({reducedMotion,onClose}){
 const element=document.createElement('section');element.className='stone-demo';element.setAttribute('aria-label','Separate controls example');
 element.innerHTML='<div class="demo-heading"><strong>Watch an example with 3 stones</strong><button type="button" class="secondary demo-close">Back to my stones</button></div><p>Your 15 stones are waiting exactly where you left them. This example earns no gems.</p><p class="demo-caption" role="status" aria-live="polite"></p><div class="demo-board-host"></div><button type="button" class="secondary demo-replay">Play example again</button>';
 const caption=element.querySelector('.demo-caption'),replay=element.querySelector('.demo-replay');let board,controller;
 const stop=()=>{controller?.abort();board?.dispose();};
 const wait=(ms,signal)=>new Promise(resolve=>{if(signal.aborted)return resolve(false);const end=()=>{clearTimeout(timer);resolve(false);};const timer=setTimeout(()=>{signal.removeEventListener('abort',end);resolve(true);},ms);signal.addEventListener('abort',end,{once:true});});
 async function play(){
  stop();controller=new AbortController();const {signal}=controller;replay.disabled=true;
  board=createStoneBoard({total:3,demo:true,reducedMotion});element.querySelector('.demo-board-host').replaceChildren(board.element);
  const alive=()=>!signal.aborted&&element.isConnected&&element.closest('dialog')?.open!==false;
  caption.textContent='1. Tap or click + Add 1 on a tray. Watch one stone leave the pile.';board.highlight(0,false);
  if(!await wait(1100,signal)||!alive())return;board.move(0);
  if(!await wait(1900,signal)||!alive())return;caption.textContent='2. Tap or click − Take 1 back. The same stone returns to the pile.';board.highlight(0,true);
  if(!await wait(1100,signal)||!alive())return;board.move(0,true);
  if(!await wait(1400,signal)||!alive())return;board.highlight(-1,false);caption.textContent='Your turn! Add one stone at a time. Make all three trays equal and use all 15.';replay.disabled=false;
 }
 element.querySelector('.demo-close').onclick=()=>{stop();onClose();};replay.onclick=play;
 // Cancel immediately when the surrounding native dialog closes or its contents
 // are replaced. The demo never writes into the pupil board or assessment data.
 const observer=new MutationObserver(()=>{if(!element.isConnected||element.closest('dialog')?.open===false){stop();observer.disconnect();}});
 queueMicrotask(()=>{if(element.isConnected){observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open']});play();}});
 return {element,dispose(){stop();observer.disconnect();}};
}
