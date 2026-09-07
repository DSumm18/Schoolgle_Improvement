import * as THREE from 'three';

// Original illustrated night sky. Star positions and moon phase are artistic,
// not an astronomical reconstruction of a particular night in November 1605.
// The sky uses view direction, so orbiting does not drag it with the buildings.
export function createPlotSky(scene) {
 let seed=1605,disposed=false;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const makeCanvas=(width,height)=>{const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;return [canvas,canvas.getContext('2d')];};
 const cloudCanvas=makeCanvas(1024,512),[cloud,ctx]=cloudCanvas;
 // A seamless strip of soft, uneven banks; the two sampled layers use different
 // scales, heights and speeds. This needs two texture reads rather than costly
 // multi-octave noise in every pixel on a tablet.
 for(let cluster=0;cluster<22;cluster++){
  const cx=random()*1024,cy=80+random()*360,width=50+random()*100;
  for(let puff=0;puff<12;puff++){
   const x=cx+(random()-.5)*width*2,y=cy+(random()-.5)*28,r=18+random()*43;
   for(const wrap of [-1024,0,1024]){
    const gradient=ctx.createRadialGradient(x+wrap,y,0,x+wrap,y,r);
    gradient.addColorStop(0,`rgba(215,225,235,${.10+random()*.08})`);
    gradient.addColorStop(.48,'rgba(175,195,211,.09)');gradient.addColorStop(1,'rgba(125,155,180,0)');
    ctx.fillStyle=gradient;ctx.save();ctx.translate(x+wrap,y);ctx.scale(1.6,.68);ctx.translate(-x-wrap,-y);ctx.fillRect(x+wrap-r,y-r,r*2,r*2);ctx.restore();
   }
  }
 }
 const cloudMap=new THREE.CanvasTexture(cloud);cloudMap.wrapS=THREE.RepeatWrapping;cloudMap.wrapT=THREE.MirroredRepeatWrapping;
 const [starCanvas,stars]=makeCanvas(512,512);
 for(let i=0;i<155;i++){
  const x=random()*512,y=random()*512,r=.28+random()*.38;
  const glow=stars.createRadialGradient(x,y,0,x,y,1.7);glow.addColorStop(0,'rgba(210,226,249,.65)');glow.addColorStop(1,'rgba(210,226,249,0)');stars.fillStyle=glow;stars.fillRect(x-2,y-2,4,4);
  stars.fillStyle=i%7?'rgba(207,224,248,.95)':'rgba(252,233,196,.9)';stars.beginPath();stars.arc(x,y,r,0,Math.PI*2);stars.fill();
 }
 const starMap=new THREE.CanvasTexture(starCanvas);starMap.wrapS=starMap.wrapT=THREE.RepeatWrapping;
 const [moonCanvas,lunar]=makeCanvas(256,256);
 const base=lunar.createRadialGradient(90,75,4,128,128,170);base.addColorStop(0,'#fff2d5');base.addColorStop(.55,'#e5e1d0');base.addColorStop(1,'#b6bec1');lunar.fillStyle=base;lunar.fillRect(0,0,256,256);
 for(let i=0;i<48;i++){
  const x=18+random()*220,y=18+random()*220,r=2+random()*13;
  const crater=lunar.createRadialGradient(x-r*.22,y-r*.18,r*.08,x,y,r);crater.addColorStop(0,'rgba(91,108,118,.09)');crater.addColorStop(.7,'rgba(118,131,133,.06)');crater.addColorStop(1,'rgba(245,239,216,0)');lunar.fillStyle=crater;lunar.beginPath();lunar.arc(x,y,r,0,Math.PI*2);lunar.fill();
  if(i%4===0){lunar.strokeStyle='rgba(245,241,220,.18)';lunar.lineWidth=1;lunar.beginPath();lunar.arc(x+1,y+1,r*.73,.1,2.4);lunar.stroke();}
 }
 const moonMap=new THREE.CanvasTexture(moonCanvas);moonMap.colorSpace=THREE.SRGBColorSpace;
 const uniforms={cloudMap:{value:cloudMap},starMap:{value:starMap},moonMap:{value:moonMap},moonDirection:{value:new THREE.Vector3(-.28,-.07,-1).normalize()},time:{value:0},inverseProjection:{value:new THREE.Matrix4()},viewRotation:{value:new THREE.Matrix3()}};
 const material=new THREE.ShaderMaterial({uniforms,depthWrite:false,depthTest:true,toneMapped:false,
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,1.,1.);}`,
  fragmentShader:`
   precision highp float;
   uniform sampler2D cloudMap,starMap,moonMap;
   uniform float time;
   uniform vec3 moonDirection;
   uniform mat4 inverseProjection;
   uniform mat3 viewRotation;
   varying vec2 vUv;
   void main(){
    vec4 eye=inverseProjection*vec4(vUv*2.-1.,1.,1.);
    vec3 d=normalize(viewRotation*eye.xyz);
    vec2 sky=vec2(atan(d.x,-d.z)/6.2831853+.5,asin(clamp(d.y,-1.,1.))/3.14159265+.5);
    float high=smoothstep(-.48,.40,d.y);
    vec3 colour=mix(vec3(.115,.205,.275),vec3(.022,.052,.105),high);
    colour+=vec3(.016,.026,.04)*exp(-pow((d.y+.16)*4.,2.));
    vec3 right=normalize(cross(moonDirection,vec3(0.,1.,0.)));
    vec3 up=normalize(cross(right,moonDirection));
    vec2 m=vec2(dot(d,right),dot(d,up))/.030;
    float front=step(.9,dot(d,moonDirection));
    float r=length(m);
    float halo=(.11*exp(-r*r*.12)+.022*exp(-r*r*.018))*front;
    colour+=vec3(.73,.76,.76)*halo;
    vec4 st=texture2D(starMap,sky*12.);
    colour+=st.rgb*st.a*.72*smoothstep(-.55,-.04,d.y)*(1.-min(.9,halo*5.));
    if(r<1.02&&front>.5){
     float edge=1.-smoothstep(.965,1.01,r);
     vec3 moon=pow(texture2D(moonMap,m*.5+.5).rgb,vec3(.4545));
     float roundLight=.68+.32*sqrt(max(0.,1.-r*r));
     colour=mix(colour,moon*roundLight,edge);
    }
    float cloudA=texture2D(cloudMap,vec2(sky.x*3.+time*.0024,(sky.y-.31)*3.7)).a;
    float cloudB=texture2D(cloudMap,vec2(sky.x*2.-time*.0011+.38,(sky.y-.22)*5.3)).a;
    float cloud=clamp(cloudA*.92+cloudB*.54,0.,.76);
    float silver=exp(-r*r*.017)*front;
    vec3 cloudColour=mix(vec3(.20,.265,.33),vec3(.40,.46,.51),silver*.68+cloudA*.12);
    colour=mix(colour,cloudColour,cloud);
    gl_FragColor=vec4(colour,1.);
   }`});
 const geometry=new THREE.PlaneGeometry(2,2),mesh=new THREE.Mesh(geometry,material);
 mesh.frustumCulled=false;mesh.renderOrder=-1000;mesh.name='1605 illustrated moon and drifting clouds';scene.add(mesh);
 return {
  update(camera,time){if(disposed)return;camera.updateMatrixWorld();uniforms.inverseProjection.value.copy(camera.projectionMatrixInverse);uniforms.viewRotation.value.setFromMatrix4(camera.matrixWorld);uniforms.time.value=time;
   // Compress the artistic moon azimuth on narrow panes so it remains visible
   // beside the title. Its direction otherwise remains fixed during orbit.
   const azimuth=-.598+.325*Math.min(1,camera.aspect/1.6);
   uniforms.moonDirection.value.set(Math.sin(azimuth),-.07,-Math.cos(azimuth)).normalize();
  },
  dispose(){if(disposed)return;disposed=true;scene.remove(mesh);geometry.dispose();material.dispose();cloudMap.dispose();starMap.dispose();moonMap.dispose();}
 };
}
