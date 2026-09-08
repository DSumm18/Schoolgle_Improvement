import {createCostumePreview,COSTUME_OPTIONS} from './plot-costume.js';
import './plot-wardrobe.css';

const skinOptions=[['warm','Warm brown'],['deep','Deep brown'],['light','Light']];
const facts={
 doublet:['A doublet','A fitted upper garment, worn over a shirt. Buttons and seams help give it its shape.'],
 breeches:['Breeches and stockings','Breeches covered the upper legs. Stockings covered the lower legs.'],
 petticoat:['A bodice and petticoat','A fitted upper garment and a skirt. Layers, fabrics and decoration varied with a person’s work and wealth.'],
 cloak:['A cloak','An outer layer worn over other clothes. Our explorer’s wool-style cloak is a simplified costume choice for the chilly setting.'],
 linen:['Linen underneath','Linen was used for shirts and other underclothes. The pale collar and cuffs show a little of the layer underneath.']
};
export function createWardrobeController({state,record,save,dialog,speak,onAppearance=()=>{}}){
 let preview=null,disposed=false,open=false,afterClose=null;
 const $=s=>document.querySelector(s);
 const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const currentName=()=>state.settings.character==='explorer-girl'?'Maya':'Leo';
 function release(){preview?.dispose();preview=null;}
 function makePreview(container,outfit){
  release();
  try{preview=createCostumePreview(container,{character:state.settings.character,outfit,skinTone:state.settings.skinTone,reducedMotion:state.settings.reducedMotion});}
  catch(error){console.warn('Costume preview unavailable',error);container.innerHTML='<p class="wardrobe-fallback">The 3D dressing mirror is unavailable here. You can still choose an outfit and read about every piece below.</p>';}
 }
 function mountCompact(){
  if(disposed||open)return;
  const host=$('#plot-costumed-explorer');if(!host)return;
  release();host.hidden=true;host.replaceChildren();
  onAppearance();
 }
 function syncChoices(){
  document.querySelectorAll('[data-wardrobe-character]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.wardrobeCharacter===state.settings.character)));
  document.querySelectorAll('[data-wear]').forEach(b=>b.setAttribute('aria-pressed',String(state.settings.costumeReady&&b.dataset.wear===state.settings.outfit)));
  const worn=COSTUME_OPTIONS.find(o=>o.id===state.settings.outfit);
  $('#wardrobe-mirror-label').textContent=`${currentName()} · ${state.settings.costumeReady?(worn?.name||'1605 outfit'):'travelling clothes'}`;
  $('#wardrobe-enter').disabled=!state.settings.costumeReady;
  if($('#plot-start')&&state.settings.costumeReady)$('#plot-start').textContent='Continue my investigation →';
  document.querySelectorAll('[data-character]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.character===state.settings.character)));
 }
 function show(onDone=null){
  if(disposed)return;
  release();open=true;afterClose=onDone;
  $('#plot-costumed-explorer').hidden=true;
  dialog('Dress for London, 1605',`<div class="wardrobe-intro"><p>Same explorer. A different time.</p><p>Put on a period-inspired outfit before you investigate. People’s clothes varied with their work, wealth and the occasion.</p></div><div class="wardrobe-layout"><section class="wardrobe-mirror"><div id="wardrobe-preview" aria-label="Your explorer’s dressing mirror"></div><p id="wardrobe-mirror-label" role="status"></p><span class="wardrobe-mirror-note">A modern explorer trying historical clothes</span></section><section class="wardrobe-choices" aria-label="Choose your explorer and outfit"><h3>Your explorer</h3><div class="wardrobe-person-options"><button data-wardrobe-character="explorer">Leo</button><button data-wardrobe-character="explorer-girl">Maya</button></div><label class="wardrobe-skin">Skin tone<select id="wardrobe-skin">${skinOptions.map(([id,name])=>`<option value="${id}" ${state.settings.skinTone===id?'selected':''}>${name}</option>`).join('')}</select></label><h3>Tap an outfit to put it on</h3>${COSTUME_OPTIONS.map(o=>`<button class="wardrobe-outfit" data-wear="${safe(o.id)}"><span class="wardrobe-cloth-swatch ${safe(o.id)}" aria-hidden="true"></span><span><strong>Put on: ${safe(o.name)}</strong><small>${safe(o.description)}</small></span><span class="wardrobe-tick" aria-hidden="true">✓</span></button>`).join('')}<p class="wardrobe-choice-note">Either explorer can try either outfit. You can change later.</p></section></div><details class="wardrobe-learning"><summary>What are these clothes?</summary><p>Tap a piece to find out more. These are simplified game costumes, not exact copies of a surviving child’s outfit.</p><div class="wardrobe-piece-buttons">${Object.entries(facts).map(([id,[name]])=>`<button data-clothing-fact="${id}">${name}</button>`).join('')}</div><p id="wardrobe-fact" role="status">Look for the collar, buttons and layers on your explorer.</p><button id="wardrobe-listen" class="plot-text">Read the clothing fact aloud</button></details><div class="wardrobe-footer"><p id="wardrobe-status" role="status">${state.settings.costumeReady?'Your outfit is ready.':'Choose an outfit above, then enter 1605.'}</p><button id="wardrobe-enter" class="plot-primary">${onDone?'Enter 1605 →':'Back to my investigation'}</button></div>`);
  $('#plot-dialog').classList.add('wardrobe-dialog');
  makePreview($('#wardrobe-preview'),state.settings.costumeReady?state.settings.outfit:'modern');
  syncChoices();
  document.querySelectorAll('[data-wardrobe-character]').forEach(b=>b.onclick=()=>{state.settings.character=b.dataset.wardrobeCharacter;preview?.setCharacter(state.settings.character);record('wardrobe-character',state.settings.character,null);save();syncChoices();});
  $('#wardrobe-skin').onchange=e=>{state.settings.skinTone=e.target.value;preview?.setSkinTone(e.target.value);save();};
  document.querySelectorAll('[data-wear]').forEach(b=>b.onclick=()=>{state.settings.outfit=b.dataset.wear;state.settings.costumeReady=true;preview?.setOutfit(state.settings.outfit);record('wardrobe-outfit',{character:state.settings.character,outfit:state.settings.outfit},null);save();syncChoices();$('#wardrobe-status').textContent='Ready for 1605. Look at your new clothes!';});
  document.querySelectorAll('[data-clothing-fact]').forEach(b=>b.onclick=()=>{const id=b.dataset.clothingFact;$('#wardrobe-fact').textContent=facts[id][1];record('wardrobe-inspect',id,null);});
  $('#wardrobe-listen').onclick=()=>{record('wardrobe-read-aloud',$('#wardrobe-fact').textContent,null);speak($('#wardrobe-fact').textContent);};
  $('#wardrobe-enter').onclick=()=>{if(!state.settings.costumeReady)return;const done=afterClose;afterClose=null;$('#plot-dialog').close();done?.();};
 }
 function onClosed(){if(!open)return;open=false;afterClose=null;release();$('#plot-dialog').classList.remove('wardrobe-dialog');mountCompact();}
 $('#plot-dialog').addEventListener('close',onClosed);
 return {open:show,mountCompact,setReducedMotion(value){preview?.setReducedMotion(value);},setCharacter(id){preview?.setCharacter(id);},dispose(){disposed=true;release();$('#plot-dialog').removeEventListener('close',onClosed);}};
}
