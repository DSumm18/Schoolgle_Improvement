import {ASSET_BASE} from './asset-paths.js';
import './narration.css';
const banks=import.meta.glob('./narration/*-audio.json',{eager:true,import:'default'});
export const normaliseNarration=text=>String(text??'').replace(/\s+/g,' ').trim();
let activeStop=null;
/** Static, reviewed recordings only. No pupil text or credentials leave the browser. */
export function createNarrator(game){
 const entries=banks[`./narration/${game}-audio.json`]||[];
 const index=new Map(entries.map(row=>[normaliseNarration(row.text),row.file]));
 let audio=null,utterance=null,dock=null,dialog=null,invoker=null,version=0,playVersion=0,lastText='',paused=false,startAudio=null,pauseButton=null;
 function stop({restoreFocus=true}={}){
  const restore=restoreFocus&&dock?.contains(document.activeElement)&&invoker?.isConnected;
  version++;playVersion++;
  if(audio){audio.onended=null;audio.onerror=null;audio.pause();}audio=null;startAudio=null;
  if(utterance){utterance.onend=null;utterance.onerror=null;window.speechSynthesis?.cancel();}utterance=null;
  dialog?.removeEventListener('close',stop);dialog=null;dock?.remove();dock=null;pauseButton=null;paused=false;
  if(activeStop===stop)activeStop=null;
  if(restore&&(!invoker.closest('dialog')||invoker.closest('dialog').open))invoker.focus({preventScroll:true});
 }
 function controls(label){
  dialog?.removeEventListener('close',stop);dock?.remove();dock=document.createElement('div');dock.className='worlds-narration';dock.setAttribute('role','group');dock.setAttribute('aria-label','Narration controls');
  const status=document.createElement('span');status.textContent=label;status.setAttribute('role','status');
  pauseButton=document.createElement('button');pauseButton.type='button';pauseButton.textContent=paused?'Resume voice':'Pause voice';pauseButton.onclick=()=>{
   paused=!paused;
   if(audio){if(paused){playVersion++;audio.pause();}else startAudio?.();}
   else if(paused)window.speechSynthesis?.pause();else window.speechSynthesis?.resume();
   if(pauseButton)pauseButton.textContent=paused?'Resume voice':'Pause voice';
  };
  const end=document.createElement('button');end.type='button';end.textContent='Stop voice';end.onclick=()=>stop();
  dock.append(status,pauseButton,end);dialog=document.querySelector('dialog[open]');const parent=dialog||document.body;dock.classList.toggle('in-dialog',Boolean(dialog));parent.append(dock);dialog?.addEventListener('close',stop);return status;
 }
 function fallback(text,ticket){
  if(ticket!==version)return;
  if(!('speechSynthesis'in window)){controls('Voice unavailable — read the text on screen');pauseButton.disabled=true;return;}
  controls('Device voice · recording unavailable');utterance=new SpeechSynthesisUtterance(text);utterance.lang='en-GB';utterance.rate=.9;
  const voice=window.speechSynthesis.getVoices().find(v=>v.lang==='en-GB');if(voice)utterance.voice=voice;
  utterance.onend=()=>{if(ticket===version)stop();};utterance.onerror=()=>{if(ticket===version)stop();};
  // cancel() clears the queue but need not clear the browser's paused flag.
  if(!paused&&window.speechSynthesis.paused)window.speechSynthesis.resume();
  window.speechSynthesis.speak(utterance);if(paused)window.speechSynthesis.pause();
 }
 function speak(input){
  const origin=document.activeElement;activeStop?.({restoreFocus:false});stop({restoreFocus:false});const text=normaliseNarration(input);if(!text)return;invoker=origin;lastText=text;activeStop=stop;const ticket=version;const file=index.get(text);
  if(!file){fallback(text,ticket);return;}
  const status=controls('Loading guide voice…'),clip=new Audio(ASSET_BASE+file);audio=clip;clip.preload='auto';let fellBack=false;
  const failed=()=>{
   // Browsers may emit both an error event and a rejected play promise.
   if(ticket!==version||fellBack||audio!==clip)return;fellBack=true;playVersion++;clip.onerror=null;clip.onended=null;clip.pause();audio=null;startAudio=null;fallback(text,ticket);
  };
  clip.onended=()=>{if(ticket===version&&audio===clip)stop();};clip.onerror=failed;
  startAudio=()=>{
   const attempt=++playVersion;
   clip.play().then(()=>{if(ticket!==version||attempt!==playVersion||audio!==clip||paused)return;status.textContent='Guide reading';}).catch(error=>{
    if(ticket!==version||attempt!==playVersion||audio!==clip)return;
    if(error.name==='AbortError'&&paused)return;
    if(error.name==='NotAllowedError'){paused=true;status.textContent='Playback blocked — tap Resume voice';if(pauseButton)pauseButton.textContent='Resume voice';return;}
    failed();
   });
  };
  startAudio();
 }
 window.addEventListener('pagehide',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop({restoreFocus:false});});
 return {speak,stop,replay:()=>speak(lastText)};
}
