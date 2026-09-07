// A fictional learner uses the real activity/evidence paths with separate saves.
export const isDemo = () => typeof location !== 'undefined' && new URLSearchParams(location.search).get('demo') === '1';
export const practiceKey = base => isDemo() ? `${base}-demo-alex` : base;
export const demoMetadata = () => ({learner: isDemo() ? {id:'fictional-alex',displayName:'Alex (fictional test pupil)',fictional:true} : null, recordScope:isDemo()?'fictional learner; actual game interactions; separate browser save':'local browser practice; no authenticated pupil'});
export function demoTeacherPanel(game){
  const id=['nile','plot','fire'].includes(game)?game:'nile';
  return `<section class="demo-teacher-panel"><h3>${isDemo()?'You are testing as Alex':'Try the evidence capture yourself'}</h3><p>${isDemo()?'Alex is a made-up pupil. The responses below come from what you actually do in this demonstration, including mistakes and help. This separate save continues when you return.':'Play as Alex, a fictional pupil, then return to the grown-up view to inspect the actual answers, calculations where applicable, corrections and help used. Your normal progress stays separate.'}</p>${isDemo()?`<a href="?game=${id}">Return to my normal game</a> <button type="button" data-reset-demo="${id}">Clear Alex’s ${id==='nile'?'Nile':id==='plot'?'Plot':'Fire'} practice and start again</button>`:`<a href="?game=${id}&demo=1">Play as Alex — fictional test pupil →</a>`}<p><a href="?game=${id}&view=example">View a completed Alex example →</a></p><p><small>This is a local demonstration, not a pupil account or school dashboard. No name, date of birth or school registration is needed.</small></p></section>`;
}
export function bindDemoControls(){
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-reset-demo]');
    if(!button||!isDemo())return;
    const keys={nile:'schoolgle-nile-v1',plot:'schoolgle-midnight-letter-v1',fire:'schoolgle-great-fire-v1'};
    const base=keys[button.dataset.resetDemo];
    if(!base)return;
    try{localStorage.removeItem(practiceKey(base));location.reload();}catch{button.textContent='This browser could not clear the demonstration save.';}
  });
}
