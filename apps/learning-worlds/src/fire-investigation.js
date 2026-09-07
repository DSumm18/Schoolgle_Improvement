import narrationCatalog from './narration/fire.json' with {type:'json'};
const readingCatalog=new Map(narrationCatalog.map(({id,text})=>[id,text]));
// Historical rationale: London Museum describes dry conditions, close timber
// houses, wind, and attempts to create gaps. Our directional paper model is a
// deliberately bounded illustration, not a reconstruction of fire behaviour.
// https://www.londonmuseum.org.uk/collections/london-stories/great-fire-of-london/
export const STREET_MODELS=Object.freeze({
 practice:Object.freeze({id:'practice',houses:5,start:0,direction:1,target:4}),
 transfer:Object.freeze({id:'transfer',houses:6,start:2,direction:1,target:5})
});
export const PREDICTIONS=Object.freeze({fewer:'Fewer houses might be reached.',same:'The same number might be reached.',unsure:'I am not sure yet. I want to find out.'});
export const REFLECTIONS=Object.freeze({kept:'My first idea matched the result.',changed:'I changed my idea after watching.',learned:'I was unsure. Now I have evidence.'});
const phases=new Set(['predict','place','running','observe','explain','reflect','transfer','transfer-running','transfer-observe','transfer-explain','summary','complete']);
const safe=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function evaluateStreet(model,gapAfter=null){
 const {houses,start,direction,target}=model||{};
 if(!Number.isInteger(houses)||houses<2||houses>8||!Number.isInteger(start)||start<0||start>=houses||![1,-1].includes(direction)||!Number.isInteger(target)||target<0||target>=houses)throw new RangeError('Invalid bounded street model');
 if(gapAfter!==null&&(!Number.isInteger(gapAfter)||gapAfter<0||gapAfter>=houses-1))throw new RangeError('Invalid gap position');
 const reached=[start];let current=start;
 for(let step=0;step<houses-1;step++){
  const next=current+direction;if(next<0||next>=houses)break;
  if(gapAfter===(direction===1?current:next))break;
  reached.push(next);current=next;
 }
 return {model:model.id,gapAfter,reached,count:reached.length,reachesTarget:reached.includes(target)};
}
export function canFinishInvestigation(s){
 if(!s||!Object.hasOwn(PREDICTIONS,s.prediction)||!Object.hasOwn(REFLECTIONS,s.reflection))return false;
 if(!s.practiceResult||s.practiceResult.model!=='practice'||!s.transferResult||s.transferResult.model!=='transfer')return false;
 try{
  const practice=evaluateStreet(STREET_MODELS.practice,s.practiceResult.gapAfter),transfer=evaluateStreet(STREET_MODELS.transfer,s.transferResult.gapAfter);
  return s.practiceResult.gapAfter!==null&&s.transferResult.gapAfter!==null&&practice.count===s.practiceResult.count&&transfer.count===s.transferResult.count&&!transfer.reachesTarget&&s.change==='fewer'&&s.reason==='gap'&&s.explanationAccepted===true&&s.transferReason==='route'&&s.transferAccepted===true;
 }catch{return false;}
}
const fresh=()=>({version:1,phase:'predict',prediction:null,gapAfter:null,practiceResult:null,transferResult:null,change:null,reason:null,explanationAccepted:false,reflection:null,transferReason:null,transferAccepted:false,runs:0,feedback:''});

/**
 * Mount one contained investigation. The caller owns CSS import and disposal
 * before replacing the container, leaving a chapter, or changing motion mode.
 * record(question, JSON-string response, correct|null, kind, helpSet) matches
 * Fire's existing bounded event API. No timers can record or finish after dispose.
 */
export function mountFireInvestigation(container,{draft={},record=()=>{},help=new Set(),save=()=>{},finish=()=>{},reducedMotion=false,speak=()=>{},stopReading=()=>{}}={}){
 if(!container||typeof container.querySelector!=='function')throw new TypeError('An investigation container is required');
 let s=draft.fireInvestigation;
 if(!s||s.version!==1||!phases.has(s.phase))s=draft.fireInvestigation=fresh();
 if(s.phase==='running')s.phase='place';
 if(s.phase==='transfer-running')s.phase='transfer';
 const support=help instanceof Set?help:new Set();
 let disposed=false,timers=new Set(),runToken=0,finishCalled=false;
 const $=selector=>container.querySelector(selector);
 const emit=(question,payload,correct=null,kind=correct===null?'observation':'response')=>{if(disposed)return;record(question,JSON.stringify(payload),correct,kind,new Set([...support,`paper-street ${s.phase}`,'simplified directional model']));};
 const persist=()=>{if(!disposed)save();};
 const cancelTimers=()=>{runToken++;for(const timer of timers)clearTimeout(timer);timers.clear();};
 const later=(fn,delay)=>{const timer=setTimeout(()=>{timers.delete(timer);if(!disposed)fn();},delay);timers.add(timer);};
 const bind=(selector,fn)=>{for(const element of container.querySelectorAll(selector))element.onclick=event=>{if(!disposed)fn(element,event);};};
 const btn=(id,label,disabled=false)=>`<button type="button" id="${id}" ${disabled?'disabled':''}>${label}</button>`;
 const setPhase=phase=>{if(disposed)return;stopReading();s.phase=phase;s.feedback='';persist();draw(true);};
 const modelForPhase=()=>s.phase.startsWith('transfer')?STREET_MODELS.transfer:STREET_MODELS.practice;
 const gapText=gap=>gap===null?'No wide gap':`Gap ${String.fromCharCode(65+gap)}, after house ${gap+1}`;
 const house=(index,model,reached)=>`<div class="fi-house ${reached.includes(index)?'fi-reached':''} ${index===model.start?'fi-start':''} ${index===model.target?'fi-target':''}" data-fi-house="${index}"><svg viewBox="0 0 64 88" aria-hidden="true"><path class="fi-roof" d="M3 28 31 5l30 23-3 4H6Z"/><path class="fi-wall" d="M10 29h44v49H10Z"/><path class="fi-timber" d="M10 43h44M31 29v49M10 30l21 25 23-25M10 77l21-22 23 22"/><path class="fi-window" d="M16 46h9v12h-9Zm22 0h9v12h-9Z"/><path class="fi-door" d="M27 64h10v14H27Z"/></svg><b>${index+1}</b>${index===model.start?'<span class="fi-start-marker">Start</span>':''}${index===model.target?'<span class="fi-target-marker">Last</span>':''}<span class="fi-route-mark" aria-hidden="true">●</span></div>`;
 const street=(model,gap=null,reached=[],row='preview')=>`<div class="fi-street" data-fi-row="${row}" role="img" aria-label="${safe(`Paper street: ${model.houses} houses. Starting marker at house ${model.start+1}; arrows point right. ${gapText(gap)}. ${reached.length?`${reached.length} houses marked.`:'Route not shown yet.'}`)}"><div class="fi-direction">MODEL ROUTE <span aria-hidden="true">→</span></div><div class="fi-house-row">${Array.from({length:model.houses},(_,i)=>house(i,model,reached)+(i<model.houses-1?`<span class="fi-gap ${gap===i?'fi-wide':''}" aria-hidden="true"><b>${String.fromCharCode(65+i)}</b><i>${gap===i?'‖':'→'}</i></span>`:'')).join('')}</div></div>`;
 const gapButtons=model=>`<fieldset class="fi-options"><legend>Where will you put the wide gap?</legend><div class="fi-gap-options">${Array.from({length:model.houses-1},(_,i)=>`<button type="button" data-fi-gap="${i}" aria-pressed="${s.gapAfter===i}"><b>${String.fromCharCode(65+i)}</b> After house ${i+1}</button>`).join('')}</div></fieldset>`;
 const baseNotice='<p class="fi-model-note">A paper model: markers follow one arrowed route and stop at a wide gap. Real fire can cross gaps; wind and burning material matter. This does not predict a real fire or change what happened in 1666.</p>';
 const noteBefore='<p class="fi-model-note">This is an illustrated paper model, not a real fire experiment. We will compare the same street with and without a wide gap. The arrows show the direction we are studying.</p>';
 function readingForPhase(){
  const phase=s.phase;
  const suffix=phase==='observe'?'-'+s.practiceResult.gapAfter:phase==='explain'?'-'+s.practiceResult.count:phase==='reflect'?'-'+s.prediction+'-'+s.practiceResult.count:phase==='transfer-observe'||phase==='transfer-explain'?'-'+s.transferResult.gapAfter:'';
  return readingCatalog.get('lab-'+(phase==='transfer-running'?'running':phase==='complete'?'summary':phase)+suffix);
 }
 function shell(title,body,step){
  container.innerHTML=`<section class="fi-lab ${reducedMotion?'fi-still':''}"><div class="fi-heading"><span>YOUR PAPER-STREET INVESTIGATION</span><b>${step} / 5</b></div><div class="fi-titlebar"><h3 tabindex="-1" class="fi-title">${title}</h3>${btn('fi-read','Read this step aloud')}</div>${body}<p class="fi-feedback" role="status">${safe(s.feedback)}</p></section>`;
  $('#fi-read').onclick=()=>{if(disposed)return;support.add('read-aloud requested');emit('Paper-street reading support',{phase:s.phase});speak(readingForPhase());};
 }
 function chooseGap(){bind('[data-fi-gap]',button=>{s.gapAfter=Number(button.dataset.fiGap);s.feedback='';persist();draw(false);});}
 function resultMarkup(model,result,transfer=false){const baseline=evaluateStreet(model);return `<div class="fi-comparison"><article><h4>Same street · no wide gap</h4>${street(model,null,baseline.reached,'baseline')}<p><b>${baseline.count}</b> houses reached by the markers</p></article><article><h4>Your plan · ${gapText(result.gapAfter)}</h4>${street(model,result.gapAfter,result.reached,'changed')}<p><b>${result.count}</b> ${result.count===1?'house':'houses'} reached by the markers</p></article></div><p class="fi-observation">${transfer?result.reachesTarget?'The last house was reached in this run.':'The last house was not reached in this run.':`You changed the gap. The starting house and arrow stayed the same.`}</p>`;}
 function beginRun(transfer){
  if(disposed)return;stopReading();
  const model=transfer?STREET_MODELS.transfer:STREET_MODELS.practice;
  if(!Number.isInteger(s.gapAfter)||s.gapAfter<0||s.gapAfter>=model.houses-1)return;
  cancelTimers();const token=runToken,result=evaluateStreet(model,s.gapAfter),baseline=evaluateStreet(model),gap=s.gapAfter;
  s.runs++;
  emit(transfer?'Paper-street transfer plan':'Paper-street gap plan',{layout:model.id,startingHouse:model.start+1,direction:'right',gapAfterHouse:gap+1,targetHouse:model.target+1,prediction:s.prediction,run:s.runs,label:`I put a wide gap after house ${gap+1}. The route starts at house ${model.start+1} and points towards house ${model.target+1}.`},transfer?!result.reachesTarget:null);
  s.phase=transfer?'transfer-running':'running';persist();
  shell('Watch the two routes',`<p>The blue markers show this model’s route. Compare the original street with your plan.</p><div class="fi-comparison"><article><h4>Same street · no wide gap</h4>${street(model,null,[],'baseline')}</article><article><h4>Your plan · ${gapText(gap)}</h4>${street(model,gap,[],'changed')}</article></div><p id="fi-run-count" role="status">Ready to compare.</p>${btn('fi-show-result','Show the result now')}${baseNotice}`,transfer?5:2);
  const complete=skipped=>{
   if(disposed||token!==runToken)return;stopReading();cancelTimers();
   const payload={layout:model.id,startingHouse:model.start+1,gapAfterHouse:gap+1,baseline:baseline.reached.map(i=>i+1),changed:result.reached.map(i=>i+1),baselineCount:baseline.count,changedCount:result.count,lastHouseReached:result.reachesTarget,animation:skipped?'result requested without waiting':reducedMotion?'instant reduced motion':'animated route'};
   if(skipped)emit('Paper-street animation skipped',{layout:model.id,run:s.runs});
   emit('Paper-street model outcome',payload);
   if(transfer)s.transferResult=result;else s.practiceResult=result;
   s.phase=transfer?'transfer-observe':'observe';
   if(transfer&&result.reachesTarget){support.add('transfer gap feedback');s.feedback='Your gap was behind the starting marker. Follow the arrow from Start. Choose another gap and compare again.';}
   else s.feedback='';
   persist();draw(true);
  };
  $('#fi-show-result').onclick=()=>complete(true);
  if(reducedMotion){complete(false);return;}
  for(let i=0;i<baseline.reached.length;i++)later(()=>{
   if(token!==runToken)return;
   const left=baseline.reached[i],right=result.reached[i];$(`[data-fi-row="baseline"] [data-fi-house="${left}"]`)?.classList.add('fi-reached');if(right!==undefined)$(`[data-fi-row="changed"] [data-fi-house="${right}"]`)?.classList.add('fi-reached');
   $('#fi-run-count').textContent=`Original route: ${i+1}. Your route: ${Math.min(i+1,result.count)} houses marked.`;
  },(i+1)*320);
  later(()=>complete(false),baseline.reached.length*320+260);
 }
 function draw(focus=false){
  if(disposed)return;const active=container.contains(document.activeElement)?document.activeElement:null;const restore=active?.id?`#${active.id}`:active?Object.entries(active.dataset).filter(([key])=>key.startsWith('fi')).map(([key,value])=>`[data-${key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())}="${value}"]`)[0]:null;cancelTimers();
  if(s.phase==='predict'){
   shell('What do you think a gap might change?',`<p>We have five paper houses. The route starts at house 1 and points right. Soon you can choose where a wide gap goes.</p>${street(STREET_MODELS.practice)}<p><strong>Make a first prediction.</strong> It is fine to be unsure or change your mind after observing.</p><div class="fi-choice-list">${Object.entries(PREDICTIONS).map(([id,text])=>`<button type="button" data-fi-prediction="${id}" aria-pressed="${s.prediction===id}">${text}</button>`).join('')}</div>${btn('fi-predict','Save my prediction and make a plan',!Object.hasOwn(PREDICTIONS,s.prediction))}${noteBefore}`,1);
   bind('[data-fi-prediction]',button=>{s.prediction=button.dataset.fiPrediction;persist();draw(false);});
   $('#fi-predict').onclick=()=>{if(!Object.hasOwn(PREDICTIONS,s.prediction))return;emit('Paper-street first prediction',{prediction:s.prediction,response:PREDICTIONS[s.prediction],label:PREDICTIONS[s.prediction]},null);setPhase('place');};
  }else if(s.phase==='place'||s.phase==='transfer'){
   const transfer=s.phase==='transfer',model=modelForPhase();
   shell(transfer?'A new street. Make your own plan.':'Choose where your gap goes',`<p>${transfer?'This street has six houses. The starting marker has moved to <strong>house 3</strong>. The route still points right. Choose a gap that keeps the <strong>last house</strong> out of the marked route.':'Choose one gap below. Then compare your street with an identical street that has no wide gap.'}</p>${street(model,s.gapAfter)}${gapButtons(model)}${btn('fi-run',transfer?'Test my new plan':'Run my comparison',s.gapAfter===null)}${transfer?noteBefore:'<p class="fi-small">You can try a different gap after watching. Only the position of the gap changes.</p>'}`,transfer?5:2);
   chooseGap();$('#fi-run').onclick=()=>beginRun(transfer);
  }else if(s.phase==='observe'){
   if(!s.practiceResult){setPhase('place');return;}
   shell('What changed in your comparison?',`${resultMarkup(STREET_MODELS.practice,s.practiceResult)}<div class="fi-actions">${btn('fi-try-again','Try a different gap')}${btn('fi-observe-next','Use my result to explain')}</div>${baseNotice}`,3);
   $('#fi-try-again').onclick=()=>setPhase('place');$('#fi-observe-next').onclick=()=>setPhase('explain');
  }else if(s.phase==='explain'){
   const result=s.practiceResult;if(!result){setPhase('place');return;}
   shell('Build an explanation from your evidence',`<p>Original street: <strong>5 reached</strong>. Your street: <strong>${result.count} reached</strong>.</p><fieldset class="fi-options"><legend>With my gap, the model reached…</legend><div class="fi-choice-list">${[['fewer','fewer houses.'],['same','the same number of houses.'],['more','more houses.']].map(([id,label])=>`<button type="button" data-fi-change="${id}" aria-pressed="${s.change===id}">${label}</button>`).join('')}</div></fieldset><fieldset class="fi-options"><legend>That changed because…</legend><div class="fi-choice-list">${[['gap','the gap interrupted the model’s route.'],['wind','I changed the arrow’s direction.'],['start','I moved the starting marker.']].map(([id,label])=>`<button type="button" data-fi-reason="${id}" aria-pressed="${s.reason===id}">${label}</button>`).join('')}</div></fieldset>${btn('fi-explain','Check my explanation',!s.change||!s.reason)}`,3);
   bind('[data-fi-change]',b=>{s.change=b.dataset.fiChange;persist();draw(false);});bind('[data-fi-reason]',b=>{s.reason=b.dataset.fiReason;persist();draw(false);});
   $('#fi-explain').onclick=()=>{if(!s.change||!s.reason)return;const ok=s.change==='fewer'&&s.reason==='gap';emit('Paper-street evidence explanation',{change:s.change,reason:s.reason,baselineCount:5,changedCount:result.count,gapAfterHouse:result.gapAfter+1,label:`I chose ${s.change} houses, because ${s.reason==='gap'?'the gap interrupted the route':s.reason==='wind'?'I changed the arrow direction':'I moved the start marker'}.`},ok);if(ok){s.explanationAccepted=true;setPhase('reflect');}else{support.add('comparison explanation feedback');s.feedback=s.change!=='fewer'?`Compare the counts: 5 on the original street and ${result.count} on yours. Which is smaller?`:'The arrow and starting marker stayed in the same places. Look at the one thing you changed between the streets.';persist();draw(false);}};
  }else if(s.phase==='reflect'){
   shell('Has your thinking changed?',`<p>Your first prediction: <strong>${safe(PREDICTIONS[s.prediction])}</strong></p><p>Your model reached ${s.practiceResult.count} ${s.practiceResult.count===1?'house':'houses'} instead of 5. How does that compare with your first idea?</p><div class="fi-choice-list">${Object.entries(REFLECTIONS).map(([id,text])=>`<button type="button" data-fi-reflection="${id}">${text}</button>`).join('')}</div><p class="fi-small">This is your reflection, not a score. Next, try a new layout without this explanation beside it.</p>`,4);
   bind('[data-fi-reflection]',b=>{s.reflection=b.dataset.fiReflection;emit('Paper-street prediction reflection',{firstPrediction:s.prediction,reflection:s.reflection,response:REFLECTIONS[s.reflection],observedCount:s.practiceResult.count});s.gapAfter=null;setPhase('transfer');});
  }else if(s.phase==='transfer-observe'){
   const result=s.transferResult;if(!result){setPhase('transfer');return;}
   shell('Check your new plan against the result',`${resultMarkup(STREET_MODELS.transfer,result,true)}<div class="fi-actions">${btn('fi-transfer-retry','Change my gap')}${btn('fi-transfer-next','Explain why my plan worked',result.reachesTarget)}</div>${baseNotice}`,5);
   $('#fi-transfer-retry').onclick=()=>{s.gapAfter=null;setPhase('transfer');};$('#fi-transfer-next').onclick=()=>{if(!result.reachesTarget)setPhase('transfer-explain');};
  }else if(s.phase==='transfer-explain'){
   shell('What evidence supports your new plan?',`<p>Starting marker: house 3. Your gap: after house ${s.transferResult.gapAfter+1}. The last house was not reached.</p><div class="fi-choice-list">${[['route','The gap was ahead of the starting marker, on the route towards the last house.'],['count','Choosing a gap removed some of the houses from the model.'],['behind','The gap was behind the starting marker, away from the route.']].map(([id,label])=>`<button type="button" data-fi-transfer-reason="${id}" aria-pressed="${s.transferReason===id}">${label}</button>`).join('')}</div>${btn('fi-transfer-explain','Check my new explanation',!s.transferReason)}`,5);
   bind('[data-fi-transfer-reason]',b=>{s.transferReason=b.dataset.fiTransferReason;persist();draw(false);});$('#fi-transfer-explain').onclick=()=>{if(!s.transferReason)return;const ok=s.transferReason==='route';emit('Paper-street transfer explanation',{reason:s.transferReason,startingHouse:3,gapAfterHouse:s.transferResult.gapAfter+1,lastHouseReached:s.transferResult.reachesTarget,label:s.transferReason==='route'?'My gap was ahead of the starting marker, on the route to the last house.':s.transferReason==='count'?'I thought choosing a gap removed houses.':'I thought a gap behind the starting marker interrupted the route.'},ok);if(ok){s.transferAccepted=true;setPhase('summary');}else{support.add('transfer explanation feedback');s.feedback='All six houses stayed in the model. Follow the arrow from house 3 and find where your gap interrupted that route.';persist();draw(false);}};
  }else if(s.phase==='summary'||s.phase==='complete'){
   if(!canFinishInvestigation(s)){s.phase='predict';draw(true);return;}
   shell('Your investigation, backed by evidence',`<div class="fi-casebook"><span>MY PAPER-STREET DISCOVERY</span><h4>I made a plan and checked it.</h4><dl><dt>My first idea</dt><dd>${safe(PREDICTIONS[s.prediction])}</dd><dt>My comparison</dt><dd>${gapText(s.practiceResult.gapAfter)}: ${s.practiceResult.count} ${s.practiceResult.count===1?'house':'houses'} reached, compared with 5.</dd><dt>My reflection</dt><dd>${safe(REFLECTIONS[s.reflection])}</dd><dt>My new plan</dt><dd>${gapText(s.transferResult.gapAfter)} with the start at house 3. The last house was not reached.</dd></dl><p>A gap on the route changed this model’s outcome. Real fires are more complicated.</p></div><div class="fi-history"><h4>Back in London, 1666</h4><p>A dry summer, strong wind and closely packed timber buildings helped the fire spread. Gaps between buildings could help slow it, but wind and burning material still mattered. Our one-way paper route shows only part of that story.</p></div>${btn('fi-finish','Save my investigation discovery')}${baseNotice}`,5);
   $('#fi-finish').onclick=()=>{if(disposed||finishCalled||!canFinishInvestigation(s))return;finishCalled=true;s.phase='complete';emit('Paper-street investigation completed',{prediction:s.prediction,reflection:s.reflection,practiceGap:s.practiceResult.gapAfter+1,practiceCount:s.practiceResult.count,transferGap:s.transferResult.gapAfter+1,transferCount:s.transferResult.count,runs:s.runs});persist();finish();};
  }
  if(focus){const title=$('.fi-title');if(title){title.style.scrollMarginTop=`${Math.ceil(document.querySelector('.fire-header')?.getBoundingClientRect().height||0)+16}px`;title.focus({preventScroll:true});title.scrollIntoView({block:'start',behavior:'instant'});}}else if(restore)$(restore)?.focus({preventScroll:true});
 }
 draw(false);
 return {dispose(){if(disposed)return;stopReading();cancelTimers();if(s.phase==='running')s.phase='place';if(s.phase==='transfer-running')s.phase='transfer';disposed=true;}};
}
