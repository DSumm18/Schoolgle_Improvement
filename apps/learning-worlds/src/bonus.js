import {ASSET_BASE} from './asset-paths.js';
import './stone-sharing.css';
import {createStoneBoard,createStoneDemo} from './stone-sharing.js';
import {equalCargo,recordAttempt,completeBonus} from './learning.js';

// A new numerical context after the taught cargo task. Each submitted stage is
// retained; neither a model nor a correct calculation alone earns the reward.
export function buildSphinxChallenge({state,save,onReward,speak}){
 const root=document.createElement('section');root.className='sphinx-challenge';
 let values=[0,0,0],stage=0,loads=0,unloads=0;const prior=state.evidence.filter(e=>e.details?.activity==='sphinx-sharing');const support=new Set([prior.length?'repeat of the same numerical task; model visible':'new-number practice; model visible']);
 for(const e of prior)for(const tag of ['corrective feedback and retry','read aloud'])if(e.support.includes(tag))support.add(tag);
 if(state.bonus?.demoViewed)support.add('visual control demonstration viewed');
 const status=document.createElement('p');status.className='challenge-feedback';status.setAttribute('role','status');
 const say=text=>{status.textContent=text;};
 const record=(correct,phase,response)=>{recordAttempt(state,1,`Sphinx challenge: ${phase} for 15 divided by 3.`,correct,[...support].join('; '),{activity:'sphinx-sharing',phase,question:phase==='model'?'Share 15 offerings equally between three trays.':phase==='calculation'?'15 ÷ 3 = ?':'How do you know the sharing is fair?',response,representation:'Three trays; one stone per offering',values:[...values],loadActions:loads,unloadActions:unloads,equation:phase==='calculation'?`15 ÷ 3 = ${response}`:''});save();if(!correct)support.add('corrective feedback and retry');};
 const button=(text,fn,cls='secondary')=>{const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=text;b.onclick=fn;return b;};
 function render(){
  root.replaceChildren();const intro=document.createElement('div');intro.innerHTML=`<div class="bonus-banner"><img class="sphinx-portrait" src="${ASSET_BASE}portraits/sphinx.png" alt="A sandstone sphinx with a royal headcloth"><span class="mini-label">OPTIONAL • 15 EXTRA GEMS</span><h3>The Sphinx’s fair-share challenge</h3><p>Three visitors. Fifteen offerings. Can you make a fair share for each?</p><small>An invented story puzzle. These stones are game counters.</small></div><ol class="bonus-steps" aria-label="Challenge progress"><li ${stage===0?'aria-current="step"':''}>1 · Build</li><li ${stage===1?'aria-current="step"':''}>2 · Calculate</li><li ${stage===2?'aria-current="step"':''}>3 · Explain</li></ol>`;root.append(intro);
  if(stage===0){
   const work=document.createElement('div');work.className='stone-work';root.append(work);
   const instruction=document.createElement('p');instruction.className='stone-instruction';instruction.innerHTML='<strong>Share all 15 stones equally.</strong> Tap or click <strong>+ Add 1</strong> on a tray to move one stone from the pile. <strong>− Take 1 back</strong> returns one. No dragging needed.';
   const help=document.createElement('div');help.className='stone-help-actions';
   const show=button('Show me how',()=>{
    support.add('visual control demonstration viewed');state.bonus.demoViewed=true;save();work.hidden=true;intro.hidden=true;
    const demo=createStoneDemo({reducedMotion:state.settings.reducedMotion,onClose:()=>{demo.dispose();demo.element.remove();work.hidden=false;intro.hidden=false;show.focus();}});root.append(demo.element);requestAnimationFrame(()=>{if(demo.element.isConnected)demo.element.scrollIntoView({block:'start',behavior:'instant'});});const heading=demo.element.querySelector('strong');heading.tabIndex=-1;heading.focus({preventScroll:true});
   });
   help.append(show,button('Read the challenge aloud',()=>{support.add('read aloud');speak('Share all fifteen stones equally. Tap or click Add one on a tray to move one stone from the pile. Take one back returns one. No dragging needed.');},'text-button'));
   const board=createStoneBoard({reducedMotion:state.settings.reducedMotion,onMove:(next,back)=>{values=next;back?unloads++:loads++;}});
   work.append(instruction,help,board.element,button('Check my model',()=>{const ok=equalCargo(values,15);record(ok,'model',values.join(', '));if(ok){board.dispose();stage=1;render();}else say('Check both things: each tray needs the same number, and all 15 stones must be used. Keep adjusting your model.');},'primary'));
  }else if(stage===1){
   root.insertAdjacentHTML('beforeend',`<p>Your three equal trays used all 15 offerings. Connect your model to a division calculation: how many were on <strong>one</strong> tray?</p><form id="bonus-calculation"><label for="bonus-answer">15 ÷ 3 = <span class="sr-only">How many offerings on each tray?</span></label><input id="bonus-answer" name="answer" type="text" inputmode="numeric" pattern="[0-9]{1,2}" maxlength="2" autocomplete="off" required aria-describedby="bonus-number-help"><p id="bonus-number-help" class="muted small">Type a whole number, then choose Check my calculation.</p><button class="primary" type="submit">Check my calculation</button></form>`);
   root.querySelector('form').onsubmit=e=>{e.preventDefault();const raw=root.querySelector('input').value.trim();const ok=/^\d{1,2}$/.test(raw)&&Number(raw)===5;record(ok,'calculation',raw);if(ok){stage=2;render();}else say('The model has three equal groups of five. The division answer is the number in one group. Try again.');};
  }else if(stage===2){
   root.insertAdjacentHTML('beforeend','<h3>How do you know the sharing is fair?</h3><p>Use both the groups and the whole total in your explanation.</p>');
   for(const[text,ok]of [['All 15 are used: 3 equal groups of 5.',true],['The trays look nice, so it must be fair.',false],['Equal groups are enough, even if some are left.',false]])root.append(button(text,()=>{record(ok,'explanation',text);if(ok){stage=3;render();}else say('Fair sharing uses every offering and gives each visitor the same number. Use both checks in your explanation.');},'choice'));
  }else{
   root.insertAdjacentHTML('beforeend','<h3>You built it. You calculated it. You explained it.</h3><p>15 ÷ 3 = 5. Your model and responses are in the practice record.</p>');root.append(button(state.bonus?.sphinx?'Finish practice · gems already collected':'Collect 15 bonus gems',()=>{const awarded=completeBonus(state);save();onReward(awarded);},'primary'));
  }
  status.textContent='';root.append(status);const focus=root.querySelector(stage===0?'.stone-instruction':stage===1?'input':'h3');if(focus){focus.tabIndex=focus.tagName==='INPUT'?0:-1;queueMicrotask(()=>{focus.focus({preventScroll:true});if(stage===0)requestAnimationFrame(()=>{if(focus.isConnected)focus.scrollIntoView({block:'start',behavior:'instant'});});});}
 }
 render();return root;
}
