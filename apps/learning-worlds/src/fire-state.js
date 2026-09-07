import {practiceKey} from './demo-session.js';
export const FIRE_KEY=practiceKey('schoolgle-great-fire-v1');
export const FIRE_VERSION='1666.2';
export const fireObjectives=[
  'Locate the start of the Great Fire and place it in 1666',
  'Connect conditions in London to the spread of the fire',
  'Use a historical source and recognise its limits',
  'Sequence the fire and explain how Londoners responded',
  'Explain rebuilding changes and recall the story'
];
export const freshFire=()=>({version:1,completed:[],attempts:[],started:false,completedAt:null,settings:{character:'explorer',skinTone:'warm',reducedMotion:false,largeText:false}});
function cleanEvent(e){
  if(!e||!Number.isInteger(e.chapter)||e.chapter<0||e.chapter>4||!['response','observation','recall'].includes(e.kind)||!Number.isFinite(Date.parse(e.at)))return null;
  if(e.kind!=='observation'&&typeof e.correct!=='boolean')return null;
  return {at:new Date(e.at).toISOString(),version:typeof e.version==='string'?e.version.slice(0,40):FIRE_VERSION,chapter:e.chapter,objective:fireObjectives[e.chapter],kind:e.kind,question:String(e.question||'').slice(0,500),response:String(e.response||'').slice(0,1000),correct:e.kind==='observation'?null:e.correct,help:Array.isArray(e.help)?e.help.filter(x=>typeof x==='string').slice(0,12).map(x=>x.slice(0,160)):[]};
}
export function readFire(raw){const s=freshFire();try{const x=JSON.parse(raw);if(x?.version!==1)return s;for(let i=0;i<5;i++){if(Array.isArray(x.completed)&&x.completed.includes(i))s.completed.push(i);else break;}s.started=x.started===true;if(s.completed.length===5&&Number.isFinite(Date.parse(x.completedAt)))s.completedAt=new Date(x.completedAt).toISOString();for(const k of ['reducedMotion','largeText'])if(typeof x.settings?.[k]==='boolean')s.settings[k]=x.settings[k];if(['explorer','explorer-girl'].includes(x.settings?.character))s.settings.character=x.settings.character;if(['warm','deep','light'].includes(x.settings?.skinTone))s.settings.skinTone=x.settings.skinTone;s.attempts=Array.isArray(x.attempts)?x.attempts.slice(-200).map(cleanEvent).filter(Boolean):[];}catch{}return s;}
export const canVisitFire=(s,id)=>Number.isInteger(id)&&id>=0&&id<5&&id<=s.completed.length;
export function recordFire(s,event){const e=cleanEvent({...event,at:new Date().toISOString(),version:FIRE_VERSION});if(!e)return false;s.attempts.push(e);s.attempts=s.attempts.slice(-200);return true;}
export function completeFire(s,id){if(!canVisitFire(s,id)||s.completed.includes(id))return false;s.completed.push(id);if(s.completed.length===5)s.completedAt=new Date().toISOString();return true;}
