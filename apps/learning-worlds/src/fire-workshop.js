// Original illustrated cutaway model. The open front is deliberate: pupils can
// see three outside walls being assembled without a roof hiding their actions.
export function workshopMarkup(material,walls,lastPlaced=false){
 const chosen=material==='brick'?'Brick or stone':material==='timber'?'Timber':'Choose a material';
 return `<div class="fire-workshop ${material||'unselected'}" aria-label="${walls} of 3 model walls placed">
  <div class="workshop-caption"><span>THE REBUILDING WORKSHOP</span><strong>${chosen}</strong></div>
  <div class="workshop-scene" aria-hidden="true"><div class="workshop-foundation"></div><div class="workshop-floor"></div>
   ${['back','left','right'].map((side,i)=>`<div class="workshop-wall ${side} ${i<walls?'placed':''} ${lastPlaced&&i===walls-1?'just-placed':''}"><div class="workshop-window"></div><b>${i+1}</b></div>`).join('')}
   <span class="workshop-open">OPEN FRONT · LOOK INSIDE</span>
  </div>
  <div class="workshop-stock" aria-hidden="true">${Array.from({length:3},(_,i)=>`<span class="${i<walls?'used':''}"></span>`).join('')}</div>
  <div class="workshop-counts" role="status"><span><b>${3-walls}</b> walls in the supply</span><span><b>${walls} / 3</b> walls in your model</span></div>
 </div>`;
}
