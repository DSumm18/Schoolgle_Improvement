import {defineConfig} from 'vite';
import {readdir,unlink} from 'node:fs/promises';
import {resolve,relative,isAbsolute} from 'node:path';

export default defineConfig(({mode})=>{
 const hosted=mode==='hosted'||process.env.VITE_HOSTED_PLAYTEST==='true';
 let buildRoot;
 return {
  base:hosted?'/worlds/play/':'/',
  define:{'import.meta.env.VITE_HOSTED_PLAYTEST':JSON.stringify(hosted?'true':'false')},
  plugins:[{
   name:'hosted-browser-narration',
   configResolved(config){buildRoot=resolve(config.root,config.build.outDir);},
   async closeBundle(){
    if(!hosted||!buildRoot)return;
    const audioRoot=resolve(buildRoot,'audio'),inside=relative(buildRoot,audioRoot);
    if(inside.startsWith('..')||isAbsolute(inside))throw new Error('Unexpected narration output path');
    // These locally prepared voices have not been cleared for redistribution.
    // Remove only WAV outputs; retain source files for local authoring/use.
    for(const entry of await readdir(audioRoot,{withFileTypes:true}).catch(()=>[])){
     if(entry.isFile()&&entry.name.toLowerCase().endsWith('.wav'))await unlink(resolve(audioRoot,entry.name));
    }
   }
  }]
 };
});
