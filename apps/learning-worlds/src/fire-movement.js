// Movement belongs to the scene, never to an answer field or story activity.
export function mountFireMovement({scene,toolbar,world,enabled}){
 const events=new AbortController(),options={signal:events.signal};
 const keys=new Set(),directions={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
 const keyDirection={arrowup:'up',w:'up',arrowdown:'down',s:'down',arrowleft:'left',a:'left',arrowright:'right',d:'right'};
 let pointer=null,pointerDirection=null,buttonDirection=null,pulse=null;
 const available=()=>enabled()&&!document.querySelector('dialog[open]')&&!document.hidden;
 const inControls=target=>target instanceof Element&&(scene.contains(target)||toolbar.contains(target)||Boolean(target.closest('#fire-nearby')));
 function apply(){let x=0,y=0;if(available()){for(const key of keys){const d=directions[keyDirection[key]];x+=d[0];y+=d[1];}for(const name of [pointerDirection,buttonDirection])if(name){x+=directions[name][0];y+=directions[name][1];}}world()?.moveExplorer(x,y);}
 function stop(){keys.clear();pointer=null;pointerDirection=null;buttonDirection=null;clearTimeout(pulse);pulse=null;toolbar.querySelectorAll('[data-fire-move]').forEach(b=>b.classList.remove('is-moving'));world()?.stopExplorer();}
 function focusExplorer(){if(available())world()?.focusExplorer();}
 scene.addEventListener('pointerdown',()=>{if(available())scene.focus({preventScroll:true});},options);
 scene.addEventListener('focus',focusExplorer,options);
 document.addEventListener('keydown',e=>{if(!available()||!inControls(e.target)||e.altKey||e.ctrlKey||e.metaKey)return;const key=e.key.toLowerCase();if(keyDirection[key]){e.preventDefault();keys.add(key);apply();}},options);
 document.addEventListener('keyup',e=>{const key=e.key.toLowerCase();if(keys.delete(key)){e.preventDefault();apply();}},options);
 document.addEventListener('focusin',e=>{if(!inControls(e.target))stop();},options);
 for(const button of toolbar.querySelectorAll('[data-fire-move]')){
  const name=button.dataset.fireMove;
  button.addEventListener('pointerdown',e=>{if(!available()||pointer!==null||(e.pointerType==='mouse'&&e.button!==0))return;e.preventDefault();stop();scene.focus({preventScroll:true});pointer=e.pointerId;pointerDirection=name;button.setPointerCapture(e.pointerId);button.classList.add('is-moving');apply();},options);
  const release=e=>{if(e.pointerId===pointer)stop();};
  button.addEventListener('pointerup',release,options);button.addEventListener('pointercancel',release,options);button.addEventListener('lostpointercapture',release,options);
  button.addEventListener('keydown',e=>{if(!available()||![' ','Enter'].includes(e.key))return;e.preventDefault();if(e.repeat)return;buttonDirection=name;button.classList.add('is-moving');focusExplorer();apply();},options);
  button.addEventListener('keyup',e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();stop();}},options);
  // Assistive technology can activate a button without pointer/key events.
  button.addEventListener('click',e=>{if(e.detail!==0||!available())return;stop();buttonDirection=name;focusExplorer();apply();pulse=setTimeout(stop,180);},options);
 }
 toolbar.querySelector('#fire-walk-focus').addEventListener('click',()=>{stop();scene.focus({preventScroll:true});focusExplorer();},options);
 window.addEventListener('blur',stop,options);document.addEventListener('visibilitychange',stop,options);
 return {stop,dispose(){stop();events.abort();}};
}
