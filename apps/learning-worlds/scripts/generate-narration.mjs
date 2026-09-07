import fs from 'node:fs';import crypto from 'node:crypto';
const root=new URL('../',import.meta.url);
const key=process.env.FISH_AUDIO_API_KEY;
if(!key)throw Error('Set server-side FISH_AUDIO_API_KEY; never expose it through VITE_ or NEXT_PUBLIC_.');
const games=process.argv.slice(2);if(!games.length||games.some(g=>!['nile','plot','fire'].includes(g)))throw Error('Usage: node scripts/generate-narration.mjs nile plot fire');
const output=new URL('public/audio/voices/',root);fs.mkdirSync(output,{recursive:true});
for(const game of games){
 const reference=process.env['FISH_WORLDS_VOICE_'+game.toUpperCase()];if(!reference)throw Error('Set private generation reference FISH_WORLDS_VOICE_'+game.toUpperCase());
 const rows=JSON.parse(fs.readFileSync(new URL('src/narration/'+game+'.json',root)));const manifest=[];
 const previousPath=new URL('src/narration/'+game+'-audio.json',root);const previous=fs.existsSync(previousPath)?JSON.parse(fs.readFileSync(previousPath)):[];
 for(const row of rows){
  const text=row.text.replace(/\s+/g,' ').trim();const hash=crypto.createHash('sha256').update(game+'|v1|'+text).digest('hex').slice(0,12);const existing=previous.find(r=>r.id===row.id&&r.text===text);const file=existing?.file?.split('/').at(-1)||game+'-'+row.id+'-'+hash+'.mp3';const path=new URL(file,output);
  if(!fs.existsSync(path)){
   const spoken=text.replaceAll('Pepys','Peeps').replaceAll('Thames','Temz').replaceAll('Monteagle','Mount Eagle').replaceAll('1666','sixteen sixty-six');
   const response=await fetch('https://api.fish.audio/v1/tts',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json',model:'s2-pro'},body:JSON.stringify({text:spoken,reference_id:reference,format:'mp3',mp3_bitrate:128,normalize:true,prosody:{speed:.94,volume:0,normalize_loudness:true}}),signal:AbortSignal.timeout(120000)});
   if(!response.ok)throw Error(`Generation stopped at ${game}/${row.id}: HTTP ${response.status}. Check billing/credentials privately; no automatic paid retries.`);
   const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length<1000)throw Error('Invalid short audio response');fs.writeFileSync(path,bytes);
  }
  manifest.push({...row,text,file:'audio/voices/'+file});console.log(`${game}: ${manifest.length}/${rows.length}`);
 }
 fs.writeFileSync(new URL('src/narration/'+game+'-audio.json',root),JSON.stringify(manifest,null,2)+'\n');
}
