import {equalCargo,cargoEquation,correctOrder} from './learning.js';
const el=(tag,cls='',text='')=>{const e=document.createElement(tag);e.className=cls;e.textContent=text;return e;};
function focusHeading(container){const heading=container.querySelector('h3');if(heading){heading.tabIndex=-1;heading.focus();}}
function button(text,fn,cls='choice'){let b=el('button',cls,text);b.type='button';b.onclick=fn;return b;}
const BOAT='<svg viewBox="0 0 140 85" aria-hidden="true"><path d="M15 56h113l-19 23H34Z" fill="#91643c"/><path d="M70 5v53" stroke="#694c31" stroke-width="4"/><path d="m74 8 39 43H74Z" fill="#faf0cf"/><path d="M8 80q14-8 28 0t28 0t28 0t28 0" stroke="#57b4aa" stroke-width="4" fill="none"/></svg>';
export function buildChallenge(m,{attempt,complete,speak,markSupport}) {
 const root=el('div','challenge');const status=el('div','challenge-feedback');status.setAttribute('role','status');const feedback=(message,good=false)=>{status.className='challenge-feedback '+(good?'good':'');status.textContent=message;};
 const check=(correct,message,objective=m.objective,details={})=>{attempt(correct,objective,details);if(!correct)markSupport('corrective feedback');feedback(message,correct);return correct;};
 let finished=false;const finish=()=>{if(finished)return;finished=true;complete();};
 const success=(text='Discovery recorded')=>{feedback(text,true);const b=button('Collect your discovery →',finish,'primary claim');root.append(b);b.focus();};
 if(m.type==='irrigation'){
  const turns=[false,false,false],gateButtons=[];let watered=false;
  const instructions='Tap or click each numbered gate to open it. You do not need to drag anything. Open all three gates so water can reach the garden. Then choose an answer to the farming question and collect your discovery. On a keyboard, use Tab to reach a gate and Enter or Space to open it.';
  root.classList.add('garden-challenge');
  root.innerHTML='<section class="garden-directions"><span class="mini-label">STEP 1 OF 2</span><h3>Let water reach the garden</h3><p><strong>Tap or click gates 1, 2 and 3 below.</strong> Each tap opens or closes a gate. Open all three to let the water through.</p><p class="garden-keyboard">No dragging needed. Keyboard: Tab to a gate, then Enter or Space.</p><div class="garden-help-actions"></div></section><div class="irrigation"><div class="river-source"><span class="water-symbol" aria-hidden="true">≈</span><strong>River</strong><small>Water starts here</small></div><div class="channels" role="group" aria-label="Three water gates"></div><div class="garden-target"><span class="plant-symbol" aria-hidden="true">♧</span><strong>Garden</strong><small>Waiting for water</small></div></div><p id="gate-next" class="gate-next" role="status"></p>';
  const help=root.querySelector('.garden-help-actions');
  help.append(button('Listen to what to do',()=>{markSupport('control instructions read aloud');speak(instructions,'controls-garden');},'secondary'),button('Show me the next gate',()=>{markSupport('control guidance');const next=gateButtons.find(b=>b.getAttribute('aria-pressed')==='false');next?.focus();},'secondary gate-show'));
  const gates=root.querySelector('.channels');
  function renderGates(){
   const count=turns.filter(Boolean).length,firstClosed=turns.indexOf(false),prefix=firstClosed<0?3:firstClosed;
   gates.style.setProperty('--water-progress',`${prefix/3*100}%`);
   gateButtons.forEach((b,i)=>{b.classList.toggle('open',turns[i]);b.classList.toggle('next-gate',i===firstClosed);b.setAttribute('aria-pressed',String(turns[i]));b.innerHTML=`<span class="gate-number">Gate ${i+1}</span><span class="gate-symbol" aria-hidden="true">${turns[i]?'↔':'│'}</span><span class="gate-state">${turns[i]?'Open':'Closed'}</span><small>${watered?'✓ Done':turns[i]?'Tap to close':'Tap to open'}</small>`;b.disabled=watered;});
   root.querySelector('#gate-next').textContent=watered?'All 3 gates are open. The garden has water! Now choose an answer below.':`${count} of 3 gates open. Next: tap Gate ${firstClosed+1}.`;
  }
  for(let i=0;i<3;i++){
   const b=button('',()=>{if(watered)return;turns[i]=!turns[i];if(turns.every(Boolean)){watered=true;root.querySelector('.irrigation').classList.add('flowing');root.querySelector('.garden-target small').textContent='Water has arrived!';root.querySelector('.garden-directions .mini-label').textContent='STEP 1 COMPLETE';root.querySelector('.gate-show').hidden=true;}renderGates();if(watered)ask();},'gate');b.setAttribute('aria-label','Water gate '+(i+1));b.setAttribute('aria-describedby','gate-next');gates.append(b);gateButtons.push(b);
  }
  renderGates();
  function ask(){const q=el('div','followup garden-question');q.append(el('div','mini-label','STEP 2 OF 2'),el('h3','','Why did farmers grow crops near the Nile?'),el('p','','Tap or click one answer. Think about what the river brought to the fields.'));q.append(status);
   [['The floodwater brought water and fertile silt.',true],['The desert sand never needed water.',false],['Pyramids made plants grow faster.',false]].forEach(([text,correct])=>q.append(button(text,()=>{if(check(correct,correct?'Yes. Water and fertile soil supported farming. Now collect your discovery below.':'Try again. Think about the water and rich soil the Nile brought.',m.objective,{phase:'explanation',response:text})){q.querySelectorAll('button').forEach(b=>b.disabled=true);success('Well done! Tap Collect your discovery to finish this activity.');}})));
   root.append(q);focusHeading(q);q.scrollIntoView({block:'nearest',behavior:'instant'});
  }
 }
 if(m.type==='cargo'){
  let total=24,values=[0,0,0],hint=false,loadActions=0,unloadActions=0,shareRounds=0;
  root.innerHTML='<div class="cargo-summary"><span>Baskets waiting</span><strong id="remaining">24</strong></div><div class="boats"></div><div class="equation" aria-live="polite">24 ÷ 3 = ?</div>';
  const boats=root.querySelector('.boats'),counts=[],pictures=[];
  const reset=()=>{values=[0,0,0];loadActions=0;unloadActions=0;shareRounds=0;render();};
  const details=()=>({phase:'model',representation:'Three boats; each basket is one unit',values:[...values],loadActions,unloadActions,shareRounds,response:values.join(', '),equation:cargoEquation(values,total)});
  for(let i=0;i<3;i++){
   const b=el('div','cargo-boat');b.innerHTML=BOAT;
   const count=el('strong','cargo-count','0');counts.push(count);
   const picture=document.createElementNS('http://www.w3.org/2000/svg','svg');picture.classList.add('basket-units');picture.setAttribute('viewBox','0 0 120 72');picture.setAttribute('role','img');pictures.push(picture);
   b.append(el('span','boat-name','Boat '+(i+1)),picture,count);
   const controls=el('div','stepper');
   controls.append(button('−',()=>{if(values[i]>0){values[i]--;unloadActions++;render();}},'minus'),button('+',()=>{if(values.reduce((a,b)=>a+b,0)<total){values[i]++;loadActions++;render();}},'plus'));
   controls.children[0].setAttribute('aria-label','Unload boat '+(i+1));controls.children[1].setAttribute('aria-label','Load boat '+(i+1));b.append(controls);boats.append(b);
  }
  function render(){
   counts.forEach((c,i)=>{
    c.textContent=values[i];c.parentElement.style.setProperty('--load',values[i]);
    pictures[i].setAttribute('aria-label',`Boat ${i+1}: ${values[i]} baskets`);
    pictures[i].innerHTML=Array.from({length:values[i]},(_,n)=>`<rect x="${3+(n%6)*19}" y="${3+Math.floor(n/6)*17}" width="15" height="13" rx="3" fill="#b67e32" stroke="#6f5028"/><path d="M${5+(n%6)*19} ${9+Math.floor(n/6)*17}h11" stroke="#f8dda2"/>`).join('');
   });
   root.querySelector('#remaining').textContent=total-values.reduce((a,b)=>a+b,0);
   root.querySelector('.equation').textContent=cargoEquation(values,total);
  }
  function explain(){
   const q=el('div','followup');q.append(el('h3','','How does your model show 24 ÷ 3 = 8?'));
   for(const[text,correct]of [['3 groups of 8 use all 24 baskets.',true],['Equal groups are enough, even with baskets left.',false]]){
    q.append(button(text,()=>{
     if(check(correct,correct?'You linked the baskets, equal groups and equation.':'Equal sharing needs both checks: every group has the same amount, and all 24 are used.','Explain equal sharing using groups and the whole total.',{phase:'explanation',representation:'Three groups of eight',response:text})){
      q.querySelectorAll('button').forEach(b=>b.disabled=true);success('24 ÷ 3 = 8. Three equal groups of eight.');
     }
    }));
   }
   root.append(q);focusHeading(q);
  }
  root.append(button('Share one to each boat',()=>{if(values.reduce((a,b)=>a+b,0)+3<=total){markSupport('sharing tool');values=values.map(v=>v+1);shareRounds++;render();}},'secondary'),button('Check the cargo',()=>{
   const ok=equalCargo(values,total);
   if(total===6){
    attempt(ok,'Represent and solve equal sharing: 6 divided by 3.',details());
    if(ok){total=24;reset();feedback('6 ÷ 3 = 2. You have practised the method. Now use it to share all 24 baskets.',true);}
    else{markSupport('corrective feedback');feedback('Share the six baskets equally between all three boats.');}
    return;
   }
   if(check(ok,ok?'Each boat has the same share, with no baskets left. Now explain your model.':'Check both things: are the shares equal, and have you used every basket?',m.objective,details())){
    root.querySelectorAll('button').forEach(b=>b.disabled=true);explain();
   }else if(!hint){
    hint=true;root.append(button('Practise first with 6 baskets',()=>{markSupport('smaller-number scaffold');total=6;reset();feedback('Try the same equal-sharing method with six.');},'text-button'));
   }
  },'primary'));render();
 }
 if(m.type==='scribe'){
  const story='The flood has left dark soil beside the river. Our first field is ready for planting. The second field is dry, beyond the channel. Send workers to extend the channel before we plant there.';
  root.append(el('blockquote','papyrus',story),button('Listen to the message',()=>{markSupport('read aloud');speak(story);},'text-button'),el('h3','','Why is the second field not ready?'));
  let first=false;const q=el('div','choices');[['It needs water from the channel.',true],['It is already full of crops.',false],['The writer has lost the seeds.',false]].forEach(([text,c])=>q.append(button(text,()=>{if(first)return;if(check(c,c?'Now choose the sentence that supports your answer.':'Look for what the message says about the second field.','Infer why the second field is not ready for planting.',{phase:'explanation',response:text})){first=true;q.querySelectorAll('button').forEach(b=>b.disabled=true);const evidence=el('div','followup');evidence.append(el('h3','','Which words are your evidence?'));['Our first field is ready for planting.','The second field is dry, beyond the channel.','The flood has left dark soil beside the river.'].forEach((t,i)=>evidence.append(button(t,()=>{if(check(i===1,i===1?'You connected your answer to evidence in the text.':'Choose the sentence about the field that needs help.','Select textual evidence supporting the field inference.',{phase:'evidence',response:t})){evidence.querySelectorAll('button').forEach(b=>b.disabled=true);success('Reading evidence recorded. Listening support is recorded separately when used.');}})));root.append(evidence);focusHeading(evidence);}})));root.append(q);
 }
 if(m.type==='timeline'){
  let order=['discovery','pyramids','tutankhamun'];const labels={pyramids:['△','Great pyramids','Around 2500 BC'],tutankhamun:['☥','Tutankhamun','Around 1330 BC'],discovery:['⌕','Tomb discovery','AD 1922']};let drag=null;
  root.append(el('p','widget-instruction','Move the cards from oldest → most recent. Drag a card, or use its arrow buttons.'));const cards=el('div','timeline');root.append(cards);
  function render(focusId){cards.replaceChildren();order.forEach((id,i)=>{const c=el('div','timeline-card');c.draggable=true;c.dataset.id=id;c.tabIndex=-1;c.setAttribute('role','group');c.setAttribute('aria-label',labels[id][1]+', position '+(i+1)+' of 3');c.ondragstart=()=>drag=i;c.ondragover=e=>e.preventDefault();c.ondrop=e=>{e.preventDefault();if(drag!==null){const t=order.splice(drag,1)[0];order.splice(i,0,t);render(t);}};c.append(el('span','time-icon',labels[id][0]),el('strong','',labels[id][1]),el('span','',labels[id][2]));const controls=el('div','reorder');const left=button('←',()=>{[order[i-1],order[i]]=[order[i],order[i-1]];render(id);},'small-button');left.disabled=i===0;left.setAttribute('aria-label','Move '+labels[id][1]+' earlier');const right=button('→',()=>{[order[i+1],order[i]]=[order[i],order[i+1]];render(id);},'small-button');right.disabled=i===2;right.setAttribute('aria-label','Move '+labels[id][1]+' later');controls.append(left,right);c.append(controls);cards.append(c);});if(focusId)cards.querySelector('[data-id="'+focusId+'"]').focus();}render();
  root.append(button('Set the timeline',()=>{if(check(correctOrder(order),correctOrder(order)?'The pyramids came first, then Tutankhamun, then the discovery thousands of years later.':'Compare the BC dates first: 2500 BC is earlier than 1330 BC.',m.objective,{phase:'evidence',response:order.map(id=>labels[id][1]).join(' → ')})){root.querySelectorAll('button').forEach(b=>b.disabled=true);success();}},'primary'));
 }
 if(m.type==='shadow'){
  let changed=false,predicted=false;root.innerHTML='<p class="widget-instruction">Predict first: moving the panel nearer the lamp will make its shadow…</p><div class="prediction"></div><svg class="shadow-scene" viewBox="0 0 600 260" role="img" aria-label="A lamp, movable opaque panel and a screen showing its shadow"><defs><linearGradient id="light"><stop stop-color="#f6c768" stop-opacity=".75"/><stop offset="1" stop-color="#f6c768" stop-opacity=".06"/></linearGradient></defs><rect x="5" y="5" width="590" height="245" rx="18" fill="#203c3d"/><path d="M30 130 550 5V250Z" fill="url(#light)"/><rect x="545" y="20" width="8" height="220" fill="#d7c495"/><rect id="shadow" x="544" y="55" width="12" height="150" fill="#122629"/><rect x="539" y="80" width="22" height="100" rx="2" fill="none" stroke="#75d6c0" stroke-width="2" stroke-dasharray="5 4"/><path id="rays" fill="#071919" opacity=".28"/><rect id="panel" x="320" y="110" width="8" height="40" fill="#dc9e50"/><circle cx="30" cy="130" r="15" fill="#ffe3a1"/><text x="20" y="238" fill="#f2dfb5">Lamp</text><text x="471" y="238" fill="#f2dfb5">Target outline</text></svg><label class="slider-label" for="shadow-distance">Move the panel <span id="shadow-readout"></span></label><input id="shadow-distance" aria-label="Distance of panel from lamp" type="range" min="20" max="80" value="75"/><div class="range-ends"><span>Nearer the lamp</span><span>Farther away</span></div>';
  const slider=root.querySelector('input');slider.disabled=true;
  const pred=root.querySelector('.prediction');for(let [text,c]of[['Larger',true],['Smaller',false]])pred.append(button(text,()=>{attempt(c,'Predict the effect of moving an opaque panel nearer the lamp.',{phase:'prediction',response:text});predicted=true;slider.disabled=false;pred.querySelectorAll('button').forEach(b=>b.disabled=true);feedback('Prediction recorded. Now test the idea by moving the panel.');slider.focus();},'small-button'));
  let height;function draw(){const val=+root.querySelector('input').value,x=50+val*4;height=20000/(x-30);const y=130-height/2;root.querySelector('#shadow').setAttribute('y',y);root.querySelector('#shadow').setAttribute('height',height);root.querySelector('#panel').setAttribute('x',x);root.querySelector('#rays').setAttribute('d',`M${x} 110 550 ${y}V${130+height/2}L${x} 150Z`);root.querySelector('#shadow-readout').textContent=Math.abs(height-100)<8?'Shadow matches the outline':'Shadow is '+(height>100?'larger':'smaller')+' than the outline';}draw();root.querySelector('input').oninput=()=>{changed=true;draw();};
  root.append(button('Open the chamber',()=>{
   if(!predicted){feedback('Choose a prediction before checking the result.');return;}
   const ok=changed&&Math.abs(height-100)<8;
   if(check(ok,ok?'The shadow fits. Compare it with the smaller shadow where you started.':'Move the panel until its shadow fits the dotted outline.','Use the distance control to match a shadow to a target.',{phase:'model',representation:'Lamp, opaque panel and fixed screen',distanceSetting:+slider.value})){
    root.querySelectorAll('button,input').forEach(b=>b.disabled=true);
    const q=el('div','followup');q.append(el('h3','','What did your investigation show?'),el('p','','The lamp and screen stayed in the same places. Only the panel moved.'));
    for(const[text,correct]of [['Nearer the lamp made the shadow larger.',true],['Nearer the lamp made the shadow smaller.',false]])q.append(button(text,()=>{
     if(check(correct,correct?'You used the result to explain the pattern. Scientists can revise a prediction after testing it.':'The panel blocks light. Nearer the lamp, it casts a larger shadow on our fixed screen. Use that observation to try again.','Explain the pattern between panel distance and shadow size.',{phase:'explanation',response:text})){
      q.querySelectorAll('button').forEach(b=>b.disabled=true);success('The chamber opens. Its light-lock is a fictional science puzzle.');
     }
    }));
    root.append(q);focusHeading(q);
   }
  },'primary'));
 }
 if(m.type==='dig'){
  let patches=new Set(),recorded=false;root.innerHTML='<div class="dig-site"><div class="dig-grid"><span>A1</span><span>B1</span><span>C1</span><span>A2</span><span>B2</span><span>C2</span></div><svg viewBox="0 0 600 250" class="buried-relic" aria-hidden="true"><g transform="translate(300 155)"><path d="M-44-30-90-65M44-30 90-65M-47 0-100 0M47 0 100 0M-44 30-85 70M44 30 85 70" stroke="#bd9a48" stroke-width="9"/><ellipse rx="50" ry="65" fill="#258785" stroke="#e5c277" stroke-width="6"/><path d="M0-58V60M-44-15Q0 10 44-15" stroke="#e5c277" stroke-width="5" fill="none"/><ellipse cy="-72" rx="30" ry="18" fill="#26716f"/></g></svg><canvas class="sand-layer" width="600" height="250" aria-label="Brush away sand with your pointer. An accessible brushing button is below."></canvas></div><p class="widget-instruction">Gently brush across the replica. Keep it in place so its position can be recorded.</p>';
  const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d');ctx.fillStyle='#cfb17b';ctx.fillRect(0,0,600,250);for(let i=0;i<4000;i++){ctx.fillStyle=i%2?'#e2c695':'#bfa06b';ctx.fillRect(Math.random()*600,Math.random()*250,1.5,1.5);}ctx.globalCompositeOperation='destination-out';let down=false;
  const brush=(x,y)=>{ctx.beginPath();ctx.arc(x,y,28,0,Math.PI*2);ctx.fill();patches.add(Math.floor(x/30)+','+Math.floor(y/25));feedback(`Careful brushing: ${Math.min(100,Math.round(patches.size/80*100))}%`);if(patches.size>=80&&!recorded)record();};
  canvas.onpointerdown=e=>{down=true;canvas.setPointerCapture(e.pointerId);paint(e);};canvas.onpointermove=e=>{if(down)paint(e);};canvas.onpointerup=()=>down=false;canvas.onpointercancel=()=>down=false;
  function paint(e){let r=canvas.getBoundingClientRect();brush((e.clientX-r.left)*600/r.width,(e.clientY-r.top)*250/r.height);}
  root.append(button('Use the guided careful brush',()=>{markSupport('alternative brush control');for(let y=12;y<250;y+=25)for(let x=15;x<600;x+=30)brush(x,y);},'text-button'));
  function record(){recorded=true;canvas.style.opacity='.08';feedback('The replica is uncovered. Record the square containing its centre.');const q=el('div','followup');q.append(el('h3','','Which grid square holds the replica’s centre?'));for(let square of ['A1','B2','C2'])q.append(button(square,()=>{if(check(square==='B2',square==='B2'?'Position recorded. Now explain why this matters.':'Use the grid: the object is in the middle column, lower row.','Record the replica centre using the excavation grid.',{phase:'evidence',response:square})){q.querySelectorAll('button').forEach(b=>b.disabled=true);const next=el('div','followup');next.append(el('h3','','Why record an object before moving it?'));for(let[t,c]of[['Its position can help explain how it was used.',true],['It makes the object more magical.',false],['It lets us take the object home.',false]])next.append(button(t,()=>{if(check(c,c?'Context is evidence. A position is one clue; it cannot tell us everything about an object.':'Archaeology protects evidence, including where things were found.','Explain why find position is part of archaeological evidence.',{phase:'explanation',response:t})){next.querySelectorAll('button').forEach(b=>b.disabled=true);success();}}));root.append(next);focusHeading(next);}}));root.append(q);}
 }
 if(m.type==='museum'){
  let step=0;const rounds=[['Choose a label for the river display.',['The Nile supported farming and travel.','The Nile made every part of the desert fertile.'],0],['Choose a label for Tutankhamun’s tomb.',['He was buried inside the Great Pyramid.','His tomb was in the Valley of the Kings.'],1],['Choose a label for the excavation team.',['Carter worked alone and kept no records.','Egyptian workers were essential to Carter’s excavation team.'],1]];const area=el('div','exhibit-question');root.append(area);const draw=()=>{area.replaceChildren();if(step===rounds.length){area.append(el('h3','','Finish the explanation'),el('p','','Recording where an object was found matters because…'));for(let[t,c]of[['…its position is part of the evidence.',true],['…all old objects belong to whoever finds them.',false]])area.append(button(t,()=>{if(check(c,c?'Your exhibition tells a story supported by evidence.':'Think about protecting the object and its context.',m.objective,{phase:'explanation',response:t})){area.querySelectorAll('button').forEach(b=>b.disabled=true);success('Seven discoveries. One connected story.');}}));return;}const [q,answers,correct]=rounds[step];area.append(el('div','mini-label',`EXHIBITION LABEL ${step+1} / 3`),el('h3','',q));answers.forEach((t,i)=>area.append(button(t,()=>{if(check(i===correct,i===correct?'Accurate label added.':'That claim does not match the evidence. Revisit your field notes if needed.',q,{phase:'recall',response:t})){step++;draw();focusHeading(area);}})));};draw();
 }
 root.append(status);return root;
}
