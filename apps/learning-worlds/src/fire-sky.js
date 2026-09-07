import * as THREE from 'three';

// Original illustrated sky: one background draw, one small repeating noise map.
// Chapter lighting tells the story; it is not a reconstruction of exact weather.
export function createFireSky(scene){
 const size=128,bytes=new Uint8Array(size*size*4);let seed=1666;
 for(let i=0;i<size*size;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const v=seed>>>24;bytes[i*4]=bytes[i*4+1]=bytes[i*4+2]=v;bytes[i*4+3]=255;}
 const texture=new THREE.DataTexture(bytes,size,size);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.magFilter=texture.minFilter=THREE.LinearFilter;texture.needsUpdate=true;
 const uniforms={time:{value:0},chapter:{value:0},aspect:{value:1},veil:{value:0},noiseMap:{value:texture},horizon:{value:new THREE.Vector3(.72,.78,.76)}};
 const material=new THREE.ShaderMaterial({uniforms,depthWrite:false,depthTest:false,toneMapped:false,
 vertexShader:'varying vec2 skyUv;void main(){skyUv=uv;gl_Position=vec4(position.xy,1.0,1.0);}',
 fragmentShader:`precision highp float;
 varying vec2 skyUv;uniform float time;uniform float chapter;uniform float aspect;uniform float veil;uniform sampler2D noiseMap;uniform vec3 horizon;
 float noise(vec2 p){return texture2D(noiseMap,p/128.).r;}
 float clouds(vec2 p){return noise(p)*.55+noise(p*2.03+17.)*.28+noise(p*4.1+43.)*.17;}
 float line(vec2 p,vec2 a,vec2 b){vec2 d=b-a;return length(p-a-d*clamp(dot(p-a,d)/dot(d,d),0.,1.));}
 void main(){
  vec2 uv=skyUv;float night=1.-step(.1,abs(chapter-1.));float smoky=1.-step(.1,abs(chapter-2.));
  vec3 top=mix(vec3(.26,.48,.62),vec3(.055,.12,.22),night);top=mix(top,vec3(.36,.43,.48),smoky*.55);
  if(chapter>3.5)top=vec3(.35,.57,.68);
  vec3 col=mix(horizon,top,smoothstep(.22,1.,uv.y));
  vec2 sky=vec2(uv.x*aspect,uv.y);
  vec2 disc=vec2(.89*aspect,.93);float d=length(sky-disc);
  float halo=exp(-d*11.)*.18;
  col+=mix(vec3(1.,.72,.35),vec3(.5,.65,.85),night)*halo;
  float orb=1.-smoothstep(.025,.029,d);
  col=mix(col,mix(vec3(1.,.89,.63),vec3(.91,.94,.84),night),orb*.82);
  vec2 flow=vec2(sky.x*7.-time*(smoky>.5?.055:.022),sky.y*14.);
  float broad=clouds(flow),fine=clouds(flow*1.7+vec2(23.,11.));
  float coverage=smoothstep(.47,.69,broad*.78+fine*.22)*smoothstep(.28,.56,uv.y);
  coverage*=.75+sin(uv.y*9.)*.1;
  vec3 cloudColour=mix(vec3(.96,.94,.86),vec3(.25,.34,.44),night);cloudColour=mix(cloudColour,vec3(.64,.65,.62),smoky*.55);
  col=mix(col,cloudColour,coverage*.78);
  // A few stable stars. No flashing or random twinkle.
  vec2 cell=floor(sky*95.),local=fract(sky*95.)-.5;
  float star=step(.986,noise(cell*3.13))*exp(-dot(local,local)*150.)*smoothstep(.5,.85,uv.y);
  col+=vec3(.65,.72,.8)*star*night*(1.-coverage);
  // Three distant gull silhouettes glide through clear daytime sky.
  for(int i=0;i<3;i++){
   float n=float(i);vec2 centre=vec2(mod(.16+n*.055+time*.004,1.25)*aspect,.73+n*.019+sin(time*.14+n)*.005);
   vec2 q=(sky-centre)*vec2(1.,1.);float wing=.003+sin(time*1.7+n)*.003;
   float shape=min(line(q,vec2(-.012,wing),vec2(0.,0.)),line(q,vec2(0.,0.),vec2(.012,wing)));
   float bird=(1.-smoothstep(.0007,.0015,shape))*(1.-night)*(1.-smoky*.75);
   col=mix(col,vec3(.23,.31,.34),bird*.7);
  }
  gl_FragColor=vec4(col,mix(1.,smoothstep(.45,.82,uv.y),veil));
 }`});
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material);mesh.name='1666 illustrated sky';mesh.frustumCulled=false;mesh.renderOrder=-1000;scene.add(mesh);
 // A soft distance veil joins finite scenery to the illustrated sky. It is
 // drawn before landmark labels and never covers the activity controls.
 const veilMaterial=material.clone();veilMaterial.uniforms={...uniforms,veil:{value:1}};veilMaterial.transparent=true;
 const veilMesh=new THREE.Mesh(mesh.geometry,veilMaterial);veilMesh.name='Distant atmospheric haze';veilMesh.frustumCulled=false;veilMesh.renderOrder=2;scene.add(veilMesh);
 return {texture,update(t,aspect){uniforms.time.value=t;uniforms.aspect.value=aspect;},setChapter(index,fog){uniforms.chapter.value=index;const c=new THREE.Color(fog).getRGB({},THREE.SRGBColorSpace);uniforms.horizon.value.set(c.r,c.g,c.b);}};
}
