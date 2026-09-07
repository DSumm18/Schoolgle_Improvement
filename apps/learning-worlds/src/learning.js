import {practiceKey} from './demo-session.js';
export const SAVE_KEY = practiceKey('schoolgle-nile-v1');
export const CONTENT_VERSION = 'nile-learning-2026-09-v2';
const validMission = id => Number.isInteger(id) && id >= 0 && id < 7;
const phases = new Set(['prediction', 'model', 'calculation', 'explanation', 'evidence', 'recall']);
export const freshState = () => ({ version: 1, completed: [], bonus: {sphinx:false}, gems: 0, evidence: [], recall: {}, position: null, settings: { narration: true, sound: true, reducedMotion: false, largeText: false, guided: false, mode: 'adventure', quality: 'high', lighting: 'evening', controlsSeen: false, character: 'explorer', skinTone: 'warm' } });
export const gemTotal = state => state.completed.length * 30 + (state.bonus?.sphinx ? 15 : 0);

// Keep only bounded observations from game controls. These describe actions,
// not a diagnosis or an inference about the child's internal strategy.
export function evidenceDetails(value) {
  const result = {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
  if (phases.has(value.phase)) result.phase = value.phase;
  for (const key of ['representation', 'response', 'question', 'equation']) if (typeof value[key] === 'string') result[key] = value[key].slice(0, 180);
  if(value.activity==='sphinx-sharing')result.activity=value.activity;
  for (const key of ['loadActions', 'unloadActions', 'shareRounds', 'distanceSetting']) {
    if (Number.isInteger(value[key]) && value[key] >= 0 && value[key] <= 10000) result[key] = value[key];
  }
  if (Array.isArray(value.values) && value.values.length === 3 && value.values.every(v => Number.isInteger(v) && v >= 0 && v <= 24)) result.values = [...value.values];
  return result;
}
function validEvidence(e) {
  return e && validMission(e.mission) && typeof e.objective === 'string' && e.objective.length > 0 && typeof e.correct === 'boolean' && typeof e.at === 'string' && Number.isFinite(Date.parse(e.at));
}
export function readSave(raw) {
  try {
    const s = JSON.parse(raw);
    if (s?.version !== 1 || !Array.isArray(s.completed)) return freshState();
    const n = freshState();
    const saved = new Set(s.completed.filter(validMission));
    for(let id=0;id<7&&saved.has(id);id++)n.completed.push(id);
    n.bonus.sphinx=s.bonus?.sphinx===true&&n.completed.includes(1);
    n.bonus.demoViewed=s.bonus?.demoViewed===true;
    n.gems = gemTotal(n);
    n.evidence = Array.isArray(s.evidence) ? s.evidence.filter(validEvidence).slice(-200).map(e => ({
      mission: e.mission, objective: e.objective.slice(0, 240), correct: e.correct,
      support: typeof e.support === 'string' ? e.support.slice(0, 500) : 'context unavailable',
      at: new Date(e.at).toISOString(), contentVersion:e.contentVersion===CONTENT_VERSION?CONTENT_VERSION:'legacy-unversioned', details: evidenceDetails(e.details)
    })) : [];
    for (const k of ['narration', 'sound', 'reducedMotion', 'largeText', 'guided', 'controlsSeen']) if (typeof s.settings?.[k] === 'boolean') n.settings[k] = s.settings[k];
    if (['explorer', 'explorer-girl'].includes(s.settings?.character)) n.settings.character = s.settings.character;
    if (['warm', 'deep', 'light'].includes(s.settings?.skinTone)) n.settings.skinTone = s.settings.skinTone;
    if (['evening', 'day'].includes(s.settings?.lighting)) n.settings.lighting = s.settings.lighting;
    if (['adventure', 'classroom'].includes(s.settings?.mode)) n.settings.mode = s.settings.mode;
    if (['high', 'low'].includes(s.settings?.quality)) n.settings.quality = s.settings.quality;
    if (Array.isArray(s.position) && s.position.length === 2 && s.position.every(Number.isFinite)) n.position = s.position.map(x => Math.max(-85, Math.min(85, x)));
    if (s.recall && typeof s.recall === 'object' && !Array.isArray(s.recall)) {
      for (const [date, attempts] of Object.entries(s.recall).slice(-60)) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Array.isArray(attempts)) continue;
        n.recall[date] = attempts.filter(a => a && Number.isInteger(a.question) && a.question >= 0 && a.question < 3 && typeof a.correct === 'boolean' && typeof a.at === 'string' && Number.isFinite(Date.parse(a.at)))
          .slice(-100).map(a => ({ question: a.question, correct: a.correct, at: new Date(a.at).toISOString(), contentVersion:a.contentVersion===CONTENT_VERSION?CONTENT_VERSION:'legacy-unversioned', support: typeof a.support === 'string' ? a.support.slice(0, 500) : 'context unavailable', details:evidenceDetails(a.details) }));
      }
    }
    return n;
  } catch { return freshState(); }
}
export function recordAttempt(state, mission, objective, correct, support = 'none', details = {}) {
  if (!validMission(mission) || typeof objective !== 'string' || !objective.length || typeof correct !== 'boolean') return false;
  state.evidence.push({ mission, objective: objective.slice(0, 240), correct, support: typeof support === 'string' ? support.slice(0, 500) : 'context unavailable', at: new Date().toISOString(), contentVersion:CONTENT_VERSION, details: evidenceDetails(details) });
  state.evidence = state.evidence.slice(-200);
  return true;
}
export function completeMission(state, id) { if (!canOpen(state,id) || state.completed.includes(id)) return false; state.completed.push(id); state.gems = gemTotal(state); return true; }
export function canOpen(state, id) { return validMission(id) && Array.from({length:id},(_,i)=>i).every(i=>state.completed.includes(i)); }
export function completeBonus(state){
 if(!state.completed.includes(1)||state.bonus?.sphinx)return false;
 const attempts=state.evidence.filter(e=>e.details?.activity==='sphinx-sharing');
 if(!['model','calculation','explanation'].every(phase=>attempts.filter(e=>e.details.phase===phase).at(-1)?.correct===true))return false;
 state.bonus??={sphinx:false};state.bonus.sphinx=true;state.gems=gemTotal(state);return true;
}
export function equalCargo(values, total = 24) { return Number.isInteger(total) && total > 0 && total % 3 === 0 && Array.isArray(values) && values.length === 3 && values.every(v => v === total / 3); }
export function cargoEquation(values, total = 24) { return `${total} ÷ 3 = ${equalCargo(values, total) ? values[0] : '?'}`; }
export function correctOrder(ids) { return Array.isArray(ids) && ids.join(',') === 'pyramids,tutankhamun,discovery'; }
export function nextMission(state) { return Array.from({ length: 7 }, (_, i) => i).find(i => !state.completed.includes(i)) ?? 6; }
