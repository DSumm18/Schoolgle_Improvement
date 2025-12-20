var EdWidget=function(Ot){"use strict";var qu=Object.defineProperty;var $u=(Ot,Pt,Fn)=>Pt in Ot?qu(Ot,Pt,{enumerable:!0,configurable:!0,writable:!0,value:Fn}):Ot[Pt]=Fn;var ee=(Ot,Pt,Fn)=>$u(Ot,typeof Pt!="symbol"?Pt+"":Pt,Fn);/**
 * @license
 * Copyright 2010-2023 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Pt="160",wt="",ut="srgb",Ht="srgb-linear",Fi="display-p3",Jn="display-p3-linear",Qn="linear",je="srgb",ei="rec709",ti="p3",ys="300 es";class fn{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;const i=this._listeners;return i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;const n=this._listeners[e];if(n!==void 0){const r=n.indexOf(t);r!==-1&&n.splice(r,1)}}dispatchEvent(e){if(this._listeners===void 0)return;const i=this._listeners[e.type];if(i!==void 0){e.target=this;const n=i.slice(0);for(let r=0,o=n.length;r<o;r++)n[r].call(this,e);e.target=null}}}const ht=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Ni=Math.PI/180,Oi=180/Math.PI;function Nn(){const s=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(ht[s&255]+ht[s>>8&255]+ht[s>>16&255]+ht[s>>24&255]+"-"+ht[e&255]+ht[e>>8&255]+"-"+ht[e>>16&15|64]+ht[e>>24&255]+"-"+ht[t&63|128]+ht[t>>8&255]+"-"+ht[t>>16&255]+ht[t>>24&255]+ht[i&255]+ht[i>>8&255]+ht[i>>16&255]+ht[i>>24&255]).toLowerCase()}function xt(s,e,t){return Math.max(e,Math.min(t,s))}function $r(s,e){return(s%e+e)%e}function Bi(s,e,t){return(1-t)*s+t*e}function Es(s){return(s&s-1)===0&&s!==0}function ki(s){return Math.pow(2,Math.floor(Math.log(s)/Math.LN2))}function On(s,e){switch(e.constructor){case Float32Array:return s;case Uint32Array:return s/4294967295;case Uint16Array:return s/65535;case Uint8Array:return s/255;case Int32Array:return Math.max(s/2147483647,-1);case Int16Array:return Math.max(s/32767,-1);case Int8Array:return Math.max(s/127,-1);default:throw new Error("Invalid component type.")}}function St(s,e){switch(e.constructor){case Float32Array:return s;case Uint32Array:return Math.round(s*4294967295);case Uint16Array:return Math.round(s*65535);case Uint8Array:return Math.round(s*255);case Int32Array:return Math.round(s*2147483647);case Int16Array:return Math.round(s*32767);case Int8Array:return Math.round(s*127);default:throw new Error("Invalid component type.")}}class We{constructor(e=0,t=0){We.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,i=this.y,n=e.elements;return this.x=n[0]*t+n[3]*i+n[6],this.y=n[1]*t+n[4]*i+n[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(xt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const i=Math.cos(t),n=Math.sin(t),r=this.x-e.x,o=this.y-e.y;return this.x=r*i-o*n+e.x,this.y=r*n+o*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Oe{constructor(e,t,i,n,r,o,a,l,c){Oe.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,n,r,o,a,l,c)}set(e,t,i,n,r,o,a,l,c){const u=this.elements;return u[0]=e,u[1]=n,u[2]=a,u[3]=t,u[4]=r,u[5]=l,u[6]=i,u[7]=o,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,n=t.elements,r=this.elements,o=i[0],a=i[3],l=i[6],c=i[1],u=i[4],h=i[7],f=i[2],m=i[5],g=i[8],_=n[0],p=n[3],d=n[6],E=n[1],x=n[4],A=n[7],P=n[2],R=n[5],w=n[8];return r[0]=o*_+a*E+l*P,r[3]=o*p+a*x+l*R,r[6]=o*d+a*A+l*w,r[1]=c*_+u*E+h*P,r[4]=c*p+u*x+h*R,r[7]=c*d+u*A+h*w,r[2]=f*_+m*E+g*P,r[5]=f*p+m*x+g*R,r[8]=f*d+m*A+g*w,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[1],n=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],u=e[8];return t*o*u-t*a*c-i*r*u+i*a*l+n*r*c-n*o*l}invert(){const e=this.elements,t=e[0],i=e[1],n=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],u=e[8],h=u*o-a*c,f=a*l-u*r,m=c*r-o*l,g=t*h+i*f+n*m;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const _=1/g;return e[0]=h*_,e[1]=(n*c-u*i)*_,e[2]=(a*i-n*o)*_,e[3]=f*_,e[4]=(u*t-n*l)*_,e[5]=(n*r-a*t)*_,e[6]=m*_,e[7]=(i*l-c*t)*_,e[8]=(o*t-i*r)*_,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,n,r,o,a){const l=Math.cos(r),c=Math.sin(r);return this.set(i*l,i*c,-i*(l*o+c*a)+o+e,-n*c,n*l,-n*(-c*o+l*a)+a+t,0,0,1),this}scale(e,t){return this.premultiply(Gi.makeScale(e,t)),this}rotate(e){return this.premultiply(Gi.makeRotation(-e)),this}translate(e,t){return this.premultiply(Gi.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,i=e.elements;for(let n=0;n<9;n++)if(t[n]!==i[n])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const Gi=new Oe;function Ts(s){for(let e=s.length-1;e>=0;--e)if(s[e]>=65535)return!0;return!1}function ni(s){return document.createElementNS("http://www.w3.org/1999/xhtml",s)}function Yr(){const s=ni("canvas");return s.style.display="block",s}const bs={};function Bn(s){s in bs||(bs[s]=!0,console.warn(s))}const As=new Oe().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),ws=new Oe().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),ii={[Ht]:{transfer:Qn,primaries:ei,toReference:s=>s,fromReference:s=>s},[ut]:{transfer:je,primaries:ei,toReference:s=>s.convertSRGBToLinear(),fromReference:s=>s.convertLinearToSRGB()},[Jn]:{transfer:Qn,primaries:ti,toReference:s=>s.applyMatrix3(ws),fromReference:s=>s.applyMatrix3(As)},[Fi]:{transfer:je,primaries:ti,toReference:s=>s.convertSRGBToLinear().applyMatrix3(ws),fromReference:s=>s.applyMatrix3(As).convertLinearToSRGB()}},Kr=new Set([Ht,Jn]),Xe={enabled:!0,_workingColorSpace:Ht,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(s){if(!Kr.has(s))throw new Error(`Unsupported working color space, "${s}".`);this._workingColorSpace=s},convert:function(s,e,t){if(this.enabled===!1||e===t||!e||!t)return s;const i=ii[e].toReference,n=ii[t].fromReference;return n(i(s))},fromWorkingColorSpace:function(s,e){return this.convert(s,this._workingColorSpace,e)},toWorkingColorSpace:function(s,e){return this.convert(s,e,this._workingColorSpace)},getPrimaries:function(s){return ii[s].primaries},getTransfer:function(s){return s===wt?Qn:ii[s].transfer}};function pn(s){return s<.04045?s*.0773993808:Math.pow(s*.9478672986+.0521327014,2.4)}function zi(s){return s<.0031308?s*12.92:1.055*Math.pow(s,.41666)-.055}let mn;class Rs{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{mn===void 0&&(mn=ni("canvas")),mn.width=e.width,mn.height=e.height;const i=mn.getContext("2d");e instanceof ImageData?i.putImageData(e,0,0):i.drawImage(e,0,0,e.width,e.height),t=mn}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=ni("canvas");t.width=e.width,t.height=e.height;const i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);const n=i.getImageData(0,0,e.width,e.height),r=n.data;for(let o=0;o<r.length;o++)r[o]=pn(r[o]/255)*255;return i.putImageData(n,0,0),t}else if(e.data){const t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(pn(t[i]/255)*255):t[i]=pn(t[i]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let jr=0;class Cs{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:jr++}),this.uuid=Nn(),this.data=e,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const i={uuid:this.uuid,url:""},n=this.data;if(n!==null){let r;if(Array.isArray(n)){r=[];for(let o=0,a=n.length;o<a;o++)n[o].isDataTexture?r.push(Hi(n[o].image)):r.push(Hi(n[o]))}else r=Hi(n);i.url=r}return t||(e.images[this.uuid]=i),i}}function Hi(s){return typeof HTMLImageElement<"u"&&s instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&s instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&s instanceof ImageBitmap?Rs.getDataURL(s):s.data?{data:Array.from(s.data),width:s.width,height:s.height,type:s.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let Zr=0;class Et extends fn{constructor(e=Et.DEFAULT_IMAGE,t=Et.DEFAULT_MAPPING,i=1001,n=1001,r=1006,o=1008,a=1023,l=1009,c=Et.DEFAULT_ANISOTROPY,u=wt){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Zr++}),this.uuid=Nn(),this.name="",this.source=new Cs(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=n,this.magFilter=r,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new We(0,0),this.repeat=new We(1,1),this.center=new We(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Oe,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,typeof u=="string"?this.colorSpace=u:(Bn("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=u===3001?ut:wt),this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.needsPMREMUpdate=!1}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const i={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==300)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case 1e3:e.x=e.x-Math.floor(e.x);break;case 1001:e.x=e.x<0?0:1;break;case 1002:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case 1e3:e.y=e.y-Math.floor(e.y);break;case 1001:e.y=e.y<0?0:1;break;case 1002:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}get encoding(){return Bn("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace===ut?3001:3e3}set encoding(e){Bn("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=e===3001?ut:wt}}Et.DEFAULT_IMAGE=null,Et.DEFAULT_MAPPING=300,Et.DEFAULT_ANISOTROPY=1;class dt{constructor(e=0,t=0,i=0,n=1){dt.prototype.isVector4=!0,this.x=e,this.y=t,this.z=i,this.w=n}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,n){return this.x=e,this.y=t,this.z=i,this.w=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,i=this.y,n=this.z,r=this.w,o=e.elements;return this.x=o[0]*t+o[4]*i+o[8]*n+o[12]*r,this.y=o[1]*t+o[5]*i+o[9]*n+o[13]*r,this.z=o[2]*t+o[6]*i+o[10]*n+o[14]*r,this.w=o[3]*t+o[7]*i+o[11]*n+o[15]*r,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,n,r;const l=e.elements,c=l[0],u=l[4],h=l[8],f=l[1],m=l[5],g=l[9],_=l[2],p=l[6],d=l[10];if(Math.abs(u-f)<.01&&Math.abs(h-_)<.01&&Math.abs(g-p)<.01){if(Math.abs(u+f)<.1&&Math.abs(h+_)<.1&&Math.abs(g+p)<.1&&Math.abs(c+m+d-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const x=(c+1)/2,A=(m+1)/2,P=(d+1)/2,R=(u+f)/4,w=(h+_)/4,q=(g+p)/4;return x>A&&x>P?x<.01?(i=0,n=.707106781,r=.707106781):(i=Math.sqrt(x),n=R/i,r=w/i):A>P?A<.01?(i=.707106781,n=0,r=.707106781):(n=Math.sqrt(A),i=R/n,r=q/n):P<.01?(i=.707106781,n=.707106781,r=0):(r=Math.sqrt(P),i=w/r,n=q/r),this.set(i,n,r,t),this}let E=Math.sqrt((p-g)*(p-g)+(h-_)*(h-_)+(f-u)*(f-u));return Math.abs(E)<.001&&(E=1),this.x=(p-g)/E,this.y=(h-_)/E,this.z=(f-u)/E,this.w=Math.acos((c+m+d-1)/2),this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Jr extends fn{constructor(e=1,t=1,i={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new dt(0,0,e,t),this.scissorTest=!1,this.viewport=new dt(0,0,e,t);const n={width:e,height:t,depth:1};i.encoding!==void 0&&(Bn("THREE.WebGLRenderTarget: option.encoding has been replaced by option.colorSpace."),i.colorSpace=i.encoding===3001?ut:wt),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:1006,depthBuffer:!0,stencilBuffer:!1,depthTexture:null,samples:0},i),this.texture=new Et(n,i.mapping,i.wrapS,i.wrapT,i.magFilter,i.minFilter,i.format,i.type,i.anisotropy,i.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.flipY=!1,this.texture.generateMipmaps=i.generateMipmaps,this.texture.internalFormat=i.internalFormat,this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.depthTexture=i.depthTexture,this.samples=i.samples}setSize(e,t,i=1){(this.width!==e||this.height!==t||this.depth!==i)&&(this.width=e,this.height=t,this.depth=i,this.texture.image.width=e,this.texture.image.height=t,this.texture.image.depth=i,this.dispose()),this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.texture=e.texture.clone(),this.texture.isRenderTargetTexture=!0;const t=Object.assign({},e.texture.image);return this.texture.source=new Cs(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class tn extends Jr{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}}class Ls extends Et{constructor(e=null,t=1,i=1,n=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:n},this.magFilter=1003,this.minFilter=1003,this.wrapR=1001,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Qr extends Et{constructor(e=null,t=1,i=1,n=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:n},this.magFilter=1003,this.minFilter=1003,this.wrapR=1001,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class kn{constructor(e=0,t=0,i=0,n=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=n}static slerpFlat(e,t,i,n,r,o,a){let l=i[n+0],c=i[n+1],u=i[n+2],h=i[n+3];const f=r[o+0],m=r[o+1],g=r[o+2],_=r[o+3];if(a===0){e[t+0]=l,e[t+1]=c,e[t+2]=u,e[t+3]=h;return}if(a===1){e[t+0]=f,e[t+1]=m,e[t+2]=g,e[t+3]=_;return}if(h!==_||l!==f||c!==m||u!==g){let p=1-a;const d=l*f+c*m+u*g+h*_,E=d>=0?1:-1,x=1-d*d;if(x>Number.EPSILON){const P=Math.sqrt(x),R=Math.atan2(P,d*E);p=Math.sin(p*R)/P,a=Math.sin(a*R)/P}const A=a*E;if(l=l*p+f*A,c=c*p+m*A,u=u*p+g*A,h=h*p+_*A,p===1-a){const P=1/Math.sqrt(l*l+c*c+u*u+h*h);l*=P,c*=P,u*=P,h*=P}}e[t]=l,e[t+1]=c,e[t+2]=u,e[t+3]=h}static multiplyQuaternionsFlat(e,t,i,n,r,o){const a=i[n],l=i[n+1],c=i[n+2],u=i[n+3],h=r[o],f=r[o+1],m=r[o+2],g=r[o+3];return e[t]=a*g+u*h+l*m-c*f,e[t+1]=l*g+u*f+c*h-a*m,e[t+2]=c*g+u*m+a*f-l*h,e[t+3]=u*g-a*h-l*f-c*m,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,n){return this._x=e,this._y=t,this._z=i,this._w=n,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const i=e._x,n=e._y,r=e._z,o=e._order,a=Math.cos,l=Math.sin,c=a(i/2),u=a(n/2),h=a(r/2),f=l(i/2),m=l(n/2),g=l(r/2);switch(o){case"XYZ":this._x=f*u*h+c*m*g,this._y=c*m*h-f*u*g,this._z=c*u*g+f*m*h,this._w=c*u*h-f*m*g;break;case"YXZ":this._x=f*u*h+c*m*g,this._y=c*m*h-f*u*g,this._z=c*u*g-f*m*h,this._w=c*u*h+f*m*g;break;case"ZXY":this._x=f*u*h-c*m*g,this._y=c*m*h+f*u*g,this._z=c*u*g+f*m*h,this._w=c*u*h-f*m*g;break;case"ZYX":this._x=f*u*h-c*m*g,this._y=c*m*h+f*u*g,this._z=c*u*g-f*m*h,this._w=c*u*h+f*m*g;break;case"YZX":this._x=f*u*h+c*m*g,this._y=c*m*h+f*u*g,this._z=c*u*g-f*m*h,this._w=c*u*h-f*m*g;break;case"XZY":this._x=f*u*h-c*m*g,this._y=c*m*h-f*u*g,this._z=c*u*g+f*m*h,this._w=c*u*h+f*m*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const i=t/2,n=Math.sin(i);return this._x=e.x*n,this._y=e.y*n,this._z=e.z*n,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,i=t[0],n=t[4],r=t[8],o=t[1],a=t[5],l=t[9],c=t[2],u=t[6],h=t[10],f=i+a+h;if(f>0){const m=.5/Math.sqrt(f+1);this._w=.25/m,this._x=(u-l)*m,this._y=(r-c)*m,this._z=(o-n)*m}else if(i>a&&i>h){const m=2*Math.sqrt(1+i-a-h);this._w=(u-l)/m,this._x=.25*m,this._y=(n+o)/m,this._z=(r+c)/m}else if(a>h){const m=2*Math.sqrt(1+a-i-h);this._w=(r-c)/m,this._x=(n+o)/m,this._y=.25*m,this._z=(l+u)/m}else{const m=2*Math.sqrt(1+h-i-a);this._w=(o-n)/m,this._x=(r+c)/m,this._y=(l+u)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<Number.EPSILON?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(xt(this.dot(e),-1,1)))}rotateTowards(e,t){const i=this.angleTo(e);if(i===0)return this;const n=Math.min(1,t/i);return this.slerp(e,n),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const i=e._x,n=e._y,r=e._z,o=e._w,a=t._x,l=t._y,c=t._z,u=t._w;return this._x=i*u+o*a+n*c-r*l,this._y=n*u+o*l+r*a-i*c,this._z=r*u+o*c+i*l-n*a,this._w=o*u-i*a-n*l-r*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);const i=this._x,n=this._y,r=this._z,o=this._w;let a=o*e._w+i*e._x+n*e._y+r*e._z;if(a<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,a=-a):this.copy(e),a>=1)return this._w=o,this._x=i,this._y=n,this._z=r,this;const l=1-a*a;if(l<=Number.EPSILON){const m=1-t;return this._w=m*o+t*this._w,this._x=m*i+t*this._x,this._y=m*n+t*this._y,this._z=m*r+t*this._z,this.normalize(),this}const c=Math.sqrt(l),u=Math.atan2(c,a),h=Math.sin((1-t)*u)/c,f=Math.sin(t*u)/c;return this._w=o*h+this._w*f,this._x=i*h+this._x*f,this._y=n*h+this._y*f,this._z=r*h+this._z*f,this._onChangeCallback(),this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){const e=Math.random(),t=Math.sqrt(1-e),i=Math.sqrt(e),n=2*Math.PI*Math.random(),r=2*Math.PI*Math.random();return this.set(t*Math.cos(n),i*Math.sin(r),i*Math.cos(r),t*Math.sin(n))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class D{constructor(e=0,t=0,i=0){D.prototype.isVector3=!0,this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Ps.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Ps.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,i=this.y,n=this.z,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6]*n,this.y=r[1]*t+r[4]*i+r[7]*n,this.z=r[2]*t+r[5]*i+r[8]*n,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,i=this.y,n=this.z,r=e.elements,o=1/(r[3]*t+r[7]*i+r[11]*n+r[15]);return this.x=(r[0]*t+r[4]*i+r[8]*n+r[12])*o,this.y=(r[1]*t+r[5]*i+r[9]*n+r[13])*o,this.z=(r[2]*t+r[6]*i+r[10]*n+r[14])*o,this}applyQuaternion(e){const t=this.x,i=this.y,n=this.z,r=e.x,o=e.y,a=e.z,l=e.w,c=2*(o*n-a*i),u=2*(a*t-r*n),h=2*(r*i-o*t);return this.x=t+l*c+o*h-a*u,this.y=i+l*u+a*c-r*h,this.z=n+l*h+r*u-o*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,i=this.y,n=this.z,r=e.elements;return this.x=r[0]*t+r[4]*i+r[8]*n,this.y=r[1]*t+r[5]*i+r[9]*n,this.z=r[2]*t+r[6]*i+r[10]*n,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const i=e.x,n=e.y,r=e.z,o=t.x,a=t.y,l=t.z;return this.x=n*l-r*a,this.y=r*o-i*l,this.z=i*a-n*o,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return Vi.copy(this).projectOnVector(e),this.sub(Vi)}reflect(e){return this.sub(Vi.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(xt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y,n=this.z-e.z;return t*t+i*i+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){const n=Math.sin(t)*e;return this.x=n*Math.sin(i),this.y=Math.cos(t)*e,this.z=n*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),n=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=n,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=(Math.random()-.5)*2,t=Math.random()*Math.PI*2,i=Math.sqrt(1-e**2);return this.x=i*Math.cos(t),this.y=i*Math.sin(t),this.z=e,this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Vi=new D,Ps=new kn;class Gn{constructor(e=new D(1/0,1/0,1/0),t=new D(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(Dt.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(Dt.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const i=Dt.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const i=e.geometry;if(i!==void 0){const r=i.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)e.isMesh===!0?e.getVertexPosition(o,Dt):Dt.fromBufferAttribute(r,o),Dt.applyMatrix4(e.matrixWorld),this.expandByPoint(Dt);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),si.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),si.copy(i.boundingBox)),si.applyMatrix4(e.matrixWorld),this.union(si)}const n=e.children;for(let r=0,o=n.length;r<o;r++)this.expandByObject(n[r],t);return this}containsPoint(e){return!(e.x<this.min.x||e.x>this.max.x||e.y<this.min.y||e.y>this.max.y||e.z<this.min.z||e.z>this.max.z)}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return!(e.max.x<this.min.x||e.min.x>this.max.x||e.max.y<this.min.y||e.min.y>this.max.y||e.max.z<this.min.z||e.min.z>this.max.z)}intersectsSphere(e){return this.clampPoint(e.center,Dt),Dt.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(zn),ri.subVectors(this.max,zn),gn.subVectors(e.a,zn),_n.subVectors(e.b,zn),vn.subVectors(e.c,zn),jt.subVectors(_n,gn),Zt.subVectors(vn,_n),nn.subVectors(gn,vn);let t=[0,-jt.z,jt.y,0,-Zt.z,Zt.y,0,-nn.z,nn.y,jt.z,0,-jt.x,Zt.z,0,-Zt.x,nn.z,0,-nn.x,-jt.y,jt.x,0,-Zt.y,Zt.x,0,-nn.y,nn.x,0];return!Wi(t,gn,_n,vn,ri)||(t=[1,0,0,0,1,0,0,0,1],!Wi(t,gn,_n,vn,ri))?!1:(ai.crossVectors(jt,Zt),t=[ai.x,ai.y,ai.z],Wi(t,gn,_n,vn,ri))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Dt).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Dt).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Vt[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Vt[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Vt[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Vt[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Vt[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Vt[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Vt[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Vt[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Vt),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}}const Vt=[new D,new D,new D,new D,new D,new D,new D,new D],Dt=new D,si=new Gn,gn=new D,_n=new D,vn=new D,jt=new D,Zt=new D,nn=new D,zn=new D,ri=new D,ai=new D,sn=new D;function Wi(s,e,t,i,n){for(let r=0,o=s.length-3;r<=o;r+=3){sn.fromArray(s,r);const a=n.x*Math.abs(sn.x)+n.y*Math.abs(sn.y)+n.z*Math.abs(sn.z),l=e.dot(sn),c=t.dot(sn),u=i.dot(sn);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>a)return!1}return!0}const ea=new Gn,Hn=new D,Xi=new D;class oi{constructor(e=new D,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const i=this.center;t!==void 0?i.copy(t):ea.setFromPoints(e).getCenter(i);let n=0;for(let r=0,o=e.length;r<o;r++)n=Math.max(n,i.distanceToSquared(e[r]));return this.radius=Math.sqrt(n),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Hn.subVectors(e,this.center);const t=Hn.lengthSq();if(t>this.radius*this.radius){const i=Math.sqrt(t),n=(i-this.radius)*.5;this.center.addScaledVector(Hn,n/i),this.radius+=n}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Xi.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Hn.copy(e.center).add(Xi)),this.expandByPoint(Hn.copy(e.center).sub(Xi))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}}const Wt=new D,qi=new D,li=new D,Jt=new D,$i=new D,ci=new D,Yi=new D;class Ds{constructor(e=new D,t=new D(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Wt)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=Wt.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Wt.copy(this.origin).addScaledVector(this.direction,t),Wt.distanceToSquared(e))}distanceSqToSegment(e,t,i,n){qi.copy(e).add(t).multiplyScalar(.5),li.copy(t).sub(e).normalize(),Jt.copy(this.origin).sub(qi);const r=e.distanceTo(t)*.5,o=-this.direction.dot(li),a=Jt.dot(this.direction),l=-Jt.dot(li),c=Jt.lengthSq(),u=Math.abs(1-o*o);let h,f,m,g;if(u>0)if(h=o*l-a,f=o*a-l,g=r*u,h>=0)if(f>=-g)if(f<=g){const _=1/u;h*=_,f*=_,m=h*(h+o*f+2*a)+f*(o*h+f+2*l)+c}else f=r,h=Math.max(0,-(o*f+a)),m=-h*h+f*(f+2*l)+c;else f=-r,h=Math.max(0,-(o*f+a)),m=-h*h+f*(f+2*l)+c;else f<=-g?(h=Math.max(0,-(-o*r+a)),f=h>0?-r:Math.min(Math.max(-r,-l),r),m=-h*h+f*(f+2*l)+c):f<=g?(h=0,f=Math.min(Math.max(-r,-l),r),m=f*(f+2*l)+c):(h=Math.max(0,-(o*r+a)),f=h>0?r:Math.min(Math.max(-r,-l),r),m=-h*h+f*(f+2*l)+c);else f=o>0?-r:r,h=Math.max(0,-(o*f+a)),m=-h*h+f*(f+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,h),n&&n.copy(qi).addScaledVector(li,f),m}intersectSphere(e,t){Wt.subVectors(e.center,this.origin);const i=Wt.dot(this.direction),n=Wt.dot(Wt)-i*i,r=e.radius*e.radius;if(n>r)return null;const o=Math.sqrt(r-n),a=i-o,l=i+o;return l<0?null:a<0?this.at(l,t):this.at(a,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){const i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,n,r,o,a,l;const c=1/this.direction.x,u=1/this.direction.y,h=1/this.direction.z,f=this.origin;return c>=0?(i=(e.min.x-f.x)*c,n=(e.max.x-f.x)*c):(i=(e.max.x-f.x)*c,n=(e.min.x-f.x)*c),u>=0?(r=(e.min.y-f.y)*u,o=(e.max.y-f.y)*u):(r=(e.max.y-f.y)*u,o=(e.min.y-f.y)*u),i>o||r>n||((r>i||isNaN(i))&&(i=r),(o<n||isNaN(n))&&(n=o),h>=0?(a=(e.min.z-f.z)*h,l=(e.max.z-f.z)*h):(a=(e.max.z-f.z)*h,l=(e.min.z-f.z)*h),i>l||a>n)||((a>i||i!==i)&&(i=a),(l<n||n!==n)&&(n=l),n<0)?null:this.at(i>=0?i:n,t)}intersectsBox(e){return this.intersectBox(e,Wt)!==null}intersectTriangle(e,t,i,n,r){$i.subVectors(t,e),ci.subVectors(i,e),Yi.crossVectors($i,ci);let o=this.direction.dot(Yi),a;if(o>0){if(n)return null;a=1}else if(o<0)a=-1,o=-o;else return null;Jt.subVectors(this.origin,e);const l=a*this.direction.dot(ci.crossVectors(Jt,ci));if(l<0)return null;const c=a*this.direction.dot($i.cross(Jt));if(c<0||l+c>o)return null;const u=-a*Jt.dot(Yi);return u<0?null:this.at(u/o,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class at{constructor(e,t,i,n,r,o,a,l,c,u,h,f,m,g,_,p){at.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,n,r,o,a,l,c,u,h,f,m,g,_,p)}set(e,t,i,n,r,o,a,l,c,u,h,f,m,g,_,p){const d=this.elements;return d[0]=e,d[4]=t,d[8]=i,d[12]=n,d[1]=r,d[5]=o,d[9]=a,d[13]=l,d[2]=c,d[6]=u,d[10]=h,d[14]=f,d[3]=m,d[7]=g,d[11]=_,d[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new at().fromArray(this.elements)}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){const t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){const t=this.elements,i=e.elements,n=1/xn.setFromMatrixColumn(e,0).length(),r=1/xn.setFromMatrixColumn(e,1).length(),o=1/xn.setFromMatrixColumn(e,2).length();return t[0]=i[0]*n,t[1]=i[1]*n,t[2]=i[2]*n,t[3]=0,t[4]=i[4]*r,t[5]=i[5]*r,t[6]=i[6]*r,t[7]=0,t[8]=i[8]*o,t[9]=i[9]*o,t[10]=i[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,i=e.x,n=e.y,r=e.z,o=Math.cos(i),a=Math.sin(i),l=Math.cos(n),c=Math.sin(n),u=Math.cos(r),h=Math.sin(r);if(e.order==="XYZ"){const f=o*u,m=o*h,g=a*u,_=a*h;t[0]=l*u,t[4]=-l*h,t[8]=c,t[1]=m+g*c,t[5]=f-_*c,t[9]=-a*l,t[2]=_-f*c,t[6]=g+m*c,t[10]=o*l}else if(e.order==="YXZ"){const f=l*u,m=l*h,g=c*u,_=c*h;t[0]=f+_*a,t[4]=g*a-m,t[8]=o*c,t[1]=o*h,t[5]=o*u,t[9]=-a,t[2]=m*a-g,t[6]=_+f*a,t[10]=o*l}else if(e.order==="ZXY"){const f=l*u,m=l*h,g=c*u,_=c*h;t[0]=f-_*a,t[4]=-o*h,t[8]=g+m*a,t[1]=m+g*a,t[5]=o*u,t[9]=_-f*a,t[2]=-o*c,t[6]=a,t[10]=o*l}else if(e.order==="ZYX"){const f=o*u,m=o*h,g=a*u,_=a*h;t[0]=l*u,t[4]=g*c-m,t[8]=f*c+_,t[1]=l*h,t[5]=_*c+f,t[9]=m*c-g,t[2]=-c,t[6]=a*l,t[10]=o*l}else if(e.order==="YZX"){const f=o*l,m=o*c,g=a*l,_=a*c;t[0]=l*u,t[4]=_-f*h,t[8]=g*h+m,t[1]=h,t[5]=o*u,t[9]=-a*u,t[2]=-c*u,t[6]=m*h+g,t[10]=f-_*h}else if(e.order==="XZY"){const f=o*l,m=o*c,g=a*l,_=a*c;t[0]=l*u,t[4]=-h,t[8]=c*u,t[1]=f*h+_,t[5]=o*u,t[9]=m*h-g,t[2]=g*h-m,t[6]=a*u,t[10]=_*h+f}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(ta,e,na)}lookAt(e,t,i){const n=this.elements;return Tt.subVectors(e,t),Tt.lengthSq()===0&&(Tt.z=1),Tt.normalize(),Qt.crossVectors(i,Tt),Qt.lengthSq()===0&&(Math.abs(i.z)===1?Tt.x+=1e-4:Tt.z+=1e-4,Tt.normalize(),Qt.crossVectors(i,Tt)),Qt.normalize(),ui.crossVectors(Tt,Qt),n[0]=Qt.x,n[4]=ui.x,n[8]=Tt.x,n[1]=Qt.y,n[5]=ui.y,n[9]=Tt.y,n[2]=Qt.z,n[6]=ui.z,n[10]=Tt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,n=t.elements,r=this.elements,o=i[0],a=i[4],l=i[8],c=i[12],u=i[1],h=i[5],f=i[9],m=i[13],g=i[2],_=i[6],p=i[10],d=i[14],E=i[3],x=i[7],A=i[11],P=i[15],R=n[0],w=n[4],q=n[8],M=n[12],T=n[1],k=n[5],$=n[9],ie=n[13],C=n[2],O=n[6],z=n[10],W=n[14],V=n[3],H=n[7],Y=n[11],Z=n[15];return r[0]=o*R+a*T+l*C+c*V,r[4]=o*w+a*k+l*O+c*H,r[8]=o*q+a*$+l*z+c*Y,r[12]=o*M+a*ie+l*W+c*Z,r[1]=u*R+h*T+f*C+m*V,r[5]=u*w+h*k+f*O+m*H,r[9]=u*q+h*$+f*z+m*Y,r[13]=u*M+h*ie+f*W+m*Z,r[2]=g*R+_*T+p*C+d*V,r[6]=g*w+_*k+p*O+d*H,r[10]=g*q+_*$+p*z+d*Y,r[14]=g*M+_*ie+p*W+d*Z,r[3]=E*R+x*T+A*C+P*V,r[7]=E*w+x*k+A*O+P*H,r[11]=E*q+x*$+A*z+P*Y,r[15]=E*M+x*ie+A*W+P*Z,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[4],n=e[8],r=e[12],o=e[1],a=e[5],l=e[9],c=e[13],u=e[2],h=e[6],f=e[10],m=e[14],g=e[3],_=e[7],p=e[11],d=e[15];return g*(+r*l*h-n*c*h-r*a*f+i*c*f+n*a*m-i*l*m)+_*(+t*l*m-t*c*f+r*o*f-n*o*m+n*c*u-r*l*u)+p*(+t*c*h-t*a*m-r*o*h+i*o*m+r*a*u-i*c*u)+d*(-n*a*u-t*l*h+t*a*f+n*o*h-i*o*f+i*l*u)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){const n=this.elements;return e.isVector3?(n[12]=e.x,n[13]=e.y,n[14]=e.z):(n[12]=e,n[13]=t,n[14]=i),this}invert(){const e=this.elements,t=e[0],i=e[1],n=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],u=e[8],h=e[9],f=e[10],m=e[11],g=e[12],_=e[13],p=e[14],d=e[15],E=h*p*c-_*f*c+_*l*m-a*p*m-h*l*d+a*f*d,x=g*f*c-u*p*c-g*l*m+o*p*m+u*l*d-o*f*d,A=u*_*c-g*h*c+g*a*m-o*_*m-u*a*d+o*h*d,P=g*h*l-u*_*l-g*a*f+o*_*f+u*a*p-o*h*p,R=t*E+i*x+n*A+r*P;if(R===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const w=1/R;return e[0]=E*w,e[1]=(_*f*r-h*p*r-_*n*m+i*p*m+h*n*d-i*f*d)*w,e[2]=(a*p*r-_*l*r+_*n*c-i*p*c-a*n*d+i*l*d)*w,e[3]=(h*l*r-a*f*r-h*n*c+i*f*c+a*n*m-i*l*m)*w,e[4]=x*w,e[5]=(u*p*r-g*f*r+g*n*m-t*p*m-u*n*d+t*f*d)*w,e[6]=(g*l*r-o*p*r-g*n*c+t*p*c+o*n*d-t*l*d)*w,e[7]=(o*f*r-u*l*r+u*n*c-t*f*c-o*n*m+t*l*m)*w,e[8]=A*w,e[9]=(g*h*r-u*_*r-g*i*m+t*_*m+u*i*d-t*h*d)*w,e[10]=(o*_*r-g*a*r+g*i*c-t*_*c-o*i*d+t*a*d)*w,e[11]=(u*a*r-o*h*r-u*i*c+t*h*c+o*i*m-t*a*m)*w,e[12]=P*w,e[13]=(u*_*n-g*h*n+g*i*f-t*_*f-u*i*p+t*h*p)*w,e[14]=(g*a*n-o*_*n-g*i*l+t*_*l+o*i*p-t*a*p)*w,e[15]=(o*h*n-u*a*n+u*i*l-t*h*l-o*i*f+t*a*f)*w,this}scale(e){const t=this.elements,i=e.x,n=e.y,r=e.z;return t[0]*=i,t[4]*=n,t[8]*=r,t[1]*=i,t[5]*=n,t[9]*=r,t[2]*=i,t[6]*=n,t[10]*=r,t[3]*=i,t[7]*=n,t[11]*=r,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],n=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,n))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const i=Math.cos(t),n=Math.sin(t),r=1-i,o=e.x,a=e.y,l=e.z,c=r*o,u=r*a;return this.set(c*o+i,c*a-n*l,c*l+n*a,0,c*a+n*l,u*a+i,u*l-n*o,0,c*l-n*a,u*l+n*o,r*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,n,r,o){return this.set(1,i,r,0,e,1,o,0,t,n,1,0,0,0,0,1),this}compose(e,t,i){const n=this.elements,r=t._x,o=t._y,a=t._z,l=t._w,c=r+r,u=o+o,h=a+a,f=r*c,m=r*u,g=r*h,_=o*u,p=o*h,d=a*h,E=l*c,x=l*u,A=l*h,P=i.x,R=i.y,w=i.z;return n[0]=(1-(_+d))*P,n[1]=(m+A)*P,n[2]=(g-x)*P,n[3]=0,n[4]=(m-A)*R,n[5]=(1-(f+d))*R,n[6]=(p+E)*R,n[7]=0,n[8]=(g+x)*w,n[9]=(p-E)*w,n[10]=(1-(f+_))*w,n[11]=0,n[12]=e.x,n[13]=e.y,n[14]=e.z,n[15]=1,this}decompose(e,t,i){const n=this.elements;let r=xn.set(n[0],n[1],n[2]).length();const o=xn.set(n[4],n[5],n[6]).length(),a=xn.set(n[8],n[9],n[10]).length();this.determinant()<0&&(r=-r),e.x=n[12],e.y=n[13],e.z=n[14],It.copy(this);const c=1/r,u=1/o,h=1/a;return It.elements[0]*=c,It.elements[1]*=c,It.elements[2]*=c,It.elements[4]*=u,It.elements[5]*=u,It.elements[6]*=u,It.elements[8]*=h,It.elements[9]*=h,It.elements[10]*=h,t.setFromRotationMatrix(It),i.x=r,i.y=o,i.z=a,this}makePerspective(e,t,i,n,r,o,a=2e3){const l=this.elements,c=2*r/(t-e),u=2*r/(i-n),h=(t+e)/(t-e),f=(i+n)/(i-n);let m,g;if(a===2e3)m=-(o+r)/(o-r),g=-2*o*r/(o-r);else if(a===2001)m=-o/(o-r),g=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=c,l[4]=0,l[8]=h,l[12]=0,l[1]=0,l[5]=u,l[9]=f,l[13]=0,l[2]=0,l[6]=0,l[10]=m,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,i,n,r,o,a=2e3){const l=this.elements,c=1/(t-e),u=1/(i-n),h=1/(o-r),f=(t+e)*c,m=(i+n)*u;let g,_;if(a===2e3)g=(o+r)*h,_=-2*h;else if(a===2001)g=r*h,_=-1*h;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-f,l[1]=0,l[5]=2*u,l[9]=0,l[13]=-m,l[2]=0,l[6]=0,l[10]=_,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){const t=this.elements,i=e.elements;for(let n=0;n<16;n++)if(t[n]!==i[n])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}}const xn=new D,It=new at,ta=new D(0,0,0),na=new D(1,1,1),Qt=new D,ui=new D,Tt=new D,Is=new at,Us=new kn;class di{constructor(e=0,t=0,i=0,n=di.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=n}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,n=this._order){return this._x=e,this._y=t,this._z=i,this._order=n,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){const n=e.elements,r=n[0],o=n[4],a=n[8],l=n[1],c=n[5],u=n[9],h=n[2],f=n[6],m=n[10];switch(t){case"XYZ":this._y=Math.asin(xt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-u,m),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(f,c),this._z=0);break;case"YXZ":this._x=Math.asin(-xt(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(a,m),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-h,r),this._z=0);break;case"ZXY":this._x=Math.asin(xt(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-h,m),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-xt(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(f,m),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(xt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-h,r)):(this._x=0,this._y=Math.atan2(a,m));break;case"XZY":this._z=Math.asin(-xt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(f,c),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-u,m),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return Is.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Is,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Us.setFromEuler(this),this.setFromQuaternion(Us,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}di.DEFAULT_ORDER="XYZ";class Fs{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let ia=0;const Ns=new D,Sn=new kn,Xt=new at,hi=new D,Vn=new D,sa=new D,ra=new kn,Os=new D(1,0,0),Bs=new D(0,1,0),ks=new D(0,0,1),aa={type:"added"},oa={type:"removed"};class Mt extends fn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:ia++}),this.uuid=Nn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Mt.DEFAULT_UP.clone();const e=new D,t=new di,i=new kn,n=new D(1,1,1);function r(){i.setFromEuler(t,!1)}function o(){t.setFromQuaternion(i,void 0,!1)}t._onChange(r),i._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:n},modelViewMatrix:{value:new at},normalMatrix:{value:new Oe}}),this.matrix=new at,this.matrixWorld=new at,this.matrixAutoUpdate=Mt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Mt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Fs,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Sn.setFromAxisAngle(e,t),this.quaternion.multiply(Sn),this}rotateOnWorldAxis(e,t){return Sn.setFromAxisAngle(e,t),this.quaternion.premultiply(Sn),this}rotateX(e){return this.rotateOnAxis(Os,e)}rotateY(e){return this.rotateOnAxis(Bs,e)}rotateZ(e){return this.rotateOnAxis(ks,e)}translateOnAxis(e,t){return Ns.copy(e).applyQuaternion(this.quaternion),this.position.add(Ns.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Os,e)}translateY(e){return this.translateOnAxis(Bs,e)}translateZ(e){return this.translateOnAxis(ks,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Xt.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?hi.copy(e):hi.set(e,t,i);const n=this.parent;this.updateWorldMatrix(!0,!1),Vn.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Xt.lookAt(Vn,hi,this.up):Xt.lookAt(hi,Vn,this.up),this.quaternion.setFromRotationMatrix(Xt),n&&(Xt.extractRotation(n.matrixWorld),Sn.setFromRotationMatrix(Xt),this.quaternion.premultiply(Sn.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.parent!==null&&e.parent.remove(e),e.parent=this,this.children.push(e),e.dispatchEvent(aa)):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(oa)),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Xt.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Xt.multiply(e.parent.matrixWorld)),e.applyMatrix4(Xt),this.add(e),e.updateWorldMatrix(!1,!0),this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,n=this.children.length;i<n;i++){const o=this.children[i].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);const n=this.children;for(let r=0,o=n.length;r<o;r++)n[r].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Vn,e,sa),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Vn,ra,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let i=0,n=t.length;i<n;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let i=0,n=t.length;i<n;i++)t[i].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let i=0,n=t.length;i<n;i++){const r=t[i];(r.matrixWorldAutoUpdate===!0||e===!0)&&r.updateMatrixWorld(e)}}updateWorldMatrix(e,t){const i=this.parent;if(e===!0&&i!==null&&i.matrixWorldAutoUpdate===!0&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),t===!0){const n=this.children;for(let r=0,o=n.length;r<o;r++){const a=n[r];a.matrixWorldAutoUpdate===!0&&a.updateWorldMatrix(!1,!0)}}}toJSON(e){const t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const n={};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.castShadow===!0&&(n.castShadow=!0),this.receiveShadow===!0&&(n.receiveShadow=!0),this.visible===!1&&(n.visible=!1),this.frustumCulled===!1&&(n.frustumCulled=!1),this.renderOrder!==0&&(n.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(n.userData=this.userData),n.layers=this.layers.mask,n.matrix=this.matrix.toArray(),n.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(n.matrixAutoUpdate=!1),this.isInstancedMesh&&(n.type="InstancedMesh",n.count=this.count,n.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(n.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(n.type="BatchedMesh",n.perObjectFrustumCulled=this.perObjectFrustumCulled,n.sortObjects=this.sortObjects,n.drawRanges=this._drawRanges,n.reservedRanges=this._reservedRanges,n.visibility=this._visibility,n.active=this._active,n.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),n.maxGeometryCount=this._maxGeometryCount,n.maxVertexCount=this._maxVertexCount,n.maxIndexCount=this._maxIndexCount,n.geometryInitialized=this._geometryInitialized,n.geometryCount=this._geometryCount,n.matricesTexture=this._matricesTexture.toJSON(e),this.boundingSphere!==null&&(n.boundingSphere={center:n.boundingSphere.center.toArray(),radius:n.boundingSphere.radius}),this.boundingBox!==null&&(n.boundingBox={min:n.boundingBox.min.toArray(),max:n.boundingBox.max.toArray()}));function r(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?n.background=this.background.toJSON():this.background.isTexture&&(n.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(n.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){n.geometry=r(e.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const l=a.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){const h=l[c];r(e.shapes,h)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(n.bindMode=this.bindMode,n.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),n.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(r(e.materials,this.material[l]));n.material=a}else n.material=r(e.materials,this.material);if(this.children.length>0){n.children=[];for(let a=0;a<this.children.length;a++)n.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){n.animations=[];for(let a=0;a<this.animations.length;a++){const l=this.animations[a];n.animations.push(r(e.animations,l))}}if(t){const a=o(e.geometries),l=o(e.materials),c=o(e.textures),u=o(e.images),h=o(e.shapes),f=o(e.skeletons),m=o(e.animations),g=o(e.nodes);a.length>0&&(i.geometries=a),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),u.length>0&&(i.images=u),h.length>0&&(i.shapes=h),f.length>0&&(i.skeletons=f),m.length>0&&(i.animations=m),g.length>0&&(i.nodes=g)}return i.object=n,i;function o(a){const l=[];for(const c in a){const u=a[c];delete u.metadata,l.push(u)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){const n=e.children[i];this.add(n.clone())}return this}}Mt.DEFAULT_UP=new D(0,1,0),Mt.DEFAULT_MATRIX_AUTO_UPDATE=!0,Mt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const Ut=new D,qt=new D,Ki=new D,$t=new D,Mn=new D,yn=new D,Gs=new D,ji=new D,Zi=new D,Ji=new D;let fi=!1;class Ft{constructor(e=new D,t=new D,i=new D){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,n){n.subVectors(i,t),Ut.subVectors(e,t),n.cross(Ut);const r=n.lengthSq();return r>0?n.multiplyScalar(1/Math.sqrt(r)):n.set(0,0,0)}static getBarycoord(e,t,i,n,r){Ut.subVectors(n,t),qt.subVectors(i,t),Ki.subVectors(e,t);const o=Ut.dot(Ut),a=Ut.dot(qt),l=Ut.dot(Ki),c=qt.dot(qt),u=qt.dot(Ki),h=o*c-a*a;if(h===0)return r.set(0,0,0),null;const f=1/h,m=(c*l-a*u)*f,g=(o*u-a*l)*f;return r.set(1-m-g,g,m)}static containsPoint(e,t,i,n){return this.getBarycoord(e,t,i,n,$t)===null?!1:$t.x>=0&&$t.y>=0&&$t.x+$t.y<=1}static getUV(e,t,i,n,r,o,a,l){return fi===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),fi=!0),this.getInterpolation(e,t,i,n,r,o,a,l)}static getInterpolation(e,t,i,n,r,o,a,l){return this.getBarycoord(e,t,i,n,$t)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,$t.x),l.addScaledVector(o,$t.y),l.addScaledVector(a,$t.z),l)}static isFrontFacing(e,t,i,n){return Ut.subVectors(i,t),qt.subVectors(e,t),Ut.cross(qt).dot(n)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,n){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[n]),this}setFromAttributeAndIndices(e,t,i,n){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,n),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Ut.subVectors(this.c,this.b),qt.subVectors(this.a,this.b),Ut.cross(qt).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(.3333333333333333)}getNormal(e){return Ft.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return Ft.getBarycoord(e,this.a,this.b,this.c,t)}getUV(e,t,i,n,r){return fi===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),fi=!0),Ft.getInterpolation(e,this.a,this.b,this.c,t,i,n,r)}getInterpolation(e,t,i,n,r){return Ft.getInterpolation(e,this.a,this.b,this.c,t,i,n,r)}containsPoint(e){return Ft.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return Ft.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const i=this.a,n=this.b,r=this.c;let o,a;Mn.subVectors(n,i),yn.subVectors(r,i),ji.subVectors(e,i);const l=Mn.dot(ji),c=yn.dot(ji);if(l<=0&&c<=0)return t.copy(i);Zi.subVectors(e,n);const u=Mn.dot(Zi),h=yn.dot(Zi);if(u>=0&&h<=u)return t.copy(n);const f=l*h-u*c;if(f<=0&&l>=0&&u<=0)return o=l/(l-u),t.copy(i).addScaledVector(Mn,o);Ji.subVectors(e,r);const m=Mn.dot(Ji),g=yn.dot(Ji);if(g>=0&&m<=g)return t.copy(r);const _=m*c-l*g;if(_<=0&&c>=0&&g<=0)return a=c/(c-g),t.copy(i).addScaledVector(yn,a);const p=u*g-m*h;if(p<=0&&h-u>=0&&m-g>=0)return Gs.subVectors(r,n),a=(h-u)/(h-u+(m-g)),t.copy(n).addScaledVector(Gs,a);const d=1/(p+_+f);return o=_*d,a=f*d,t.copy(i).addScaledVector(Mn,o).addScaledVector(yn,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}const zs={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},en={h:0,s:0,l:0},pi={h:0,s:0,l:0};function Qi(s,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<.16666666666666666?s+(e-s)*6*t:t<.5?e:t<.6666666666666666?s+(e-s)*6*(.6666666666666666-t):s}class He{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){const n=e;n&&n.isColor?this.copy(n):typeof n=="number"?this.setHex(n):typeof n=="string"&&this.setStyle(n)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=ut){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Xe.toWorkingColorSpace(this,t),this}setRGB(e,t,i,n=Xe.workingColorSpace){return this.r=e,this.g=t,this.b=i,Xe.toWorkingColorSpace(this,n),this}setHSL(e,t,i,n=Xe.workingColorSpace){if(e=$r(e,1),t=xt(t,0,1),i=xt(i,0,1),t===0)this.r=this.g=this.b=i;else{const r=i<=.5?i*(1+t):i+t-i*t,o=2*i-r;this.r=Qi(o,r,e+.3333333333333333),this.g=Qi(o,r,e),this.b=Qi(o,r,e-.3333333333333333)}return Xe.toWorkingColorSpace(this,n),this}setStyle(e,t=ut){function i(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let n;if(n=/^(\w+)\(([^\)]*)\)/.exec(e)){let r;const o=n[1],a=n[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(n=/^\#([A-Fa-f\d]+)$/.exec(e)){const r=n[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(r,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=ut){const i=zs[e.toLowerCase()];return i!==void 0?this.setHex(i,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=pn(e.r),this.g=pn(e.g),this.b=pn(e.b),this}copyLinearToSRGB(e){return this.r=zi(e.r),this.g=zi(e.g),this.b=zi(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=ut){return Xe.fromWorkingColorSpace(ft.copy(this),e),Math.round(xt(ft.r*255,0,255))*65536+Math.round(xt(ft.g*255,0,255))*256+Math.round(xt(ft.b*255,0,255))}getHexString(e=ut){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Xe.workingColorSpace){Xe.fromWorkingColorSpace(ft.copy(this),t);const i=ft.r,n=ft.g,r=ft.b,o=Math.max(i,n,r),a=Math.min(i,n,r);let l,c;const u=(a+o)/2;if(a===o)l=0,c=0;else{const h=o-a;switch(c=u<=.5?h/(o+a):h/(2-o-a),o){case i:l=(n-r)/h+(n<r?6:0);break;case n:l=(r-i)/h+2;break;case r:l=(i-n)/h+4;break}l/=6}return e.h=l,e.s=c,e.l=u,e}getRGB(e,t=Xe.workingColorSpace){return Xe.fromWorkingColorSpace(ft.copy(this),t),e.r=ft.r,e.g=ft.g,e.b=ft.b,e}getStyle(e=ut){Xe.fromWorkingColorSpace(ft.copy(this),e);const t=ft.r,i=ft.g,n=ft.b;return e!==ut?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${n.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(n*255)})`}offsetHSL(e,t,i){return this.getHSL(en),this.setHSL(en.h+e,en.s+t,en.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(en),e.getHSL(pi);const i=Bi(en.h,pi.h,t),n=Bi(en.s,pi.s,t),r=Bi(en.l,pi.l,t);return this.setHSL(i,n,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,i=this.g,n=this.b,r=e.elements;return this.r=r[0]*t+r[3]*i+r[6]*n,this.g=r[1]*t+r[4]*i+r[7]*n,this.b=r[2]*t+r[5]*i+r[8]*n,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const ft=new He;He.NAMES=zs;let la=0;class Wn extends fn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:la++}),this.uuid=Nn(),this.name="",this.type="Material",this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new He(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=7680,this.stencilZFail=7680,this.stencilZPass=7680,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const i=e[t];if(i===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}const n=this[t];if(n===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}n&&n.isColor?n.set(i):n&&n.isVector3&&i&&i.isVector3?n.copy(i):this[t]=i}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const i={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==1&&(i.blending=this.blending),this.side!==0&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==204&&(i.blendSrc=this.blendSrc),this.blendDst!==205&&(i.blendDst=this.blendDst),this.blendEquation!==100&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==3&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==519&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==7680&&(i.stencilFail=this.stencilFail),this.stencilZFail!==7680&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==7680&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function n(r){const o=[];for(const a in r){const l=r[a];delete l.metadata,o.push(l)}return o}if(t){const r=n(e.textures),o=n(e.images);r.length>0&&(i.textures=r),o.length>0&&(i.images=o)}return i}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let i=null;if(t!==null){const n=t.length;i=new Array(n);for(let r=0;r!==n;++r)i[r]=t[r].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}class es extends Wn{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new He(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=0,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const it=new D,mi=new We;class Rt{constructor(e,t,i=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=35044,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.gpuType=1015,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}get updateRange(){return console.warn("THREE.BufferAttribute: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let n=0,r=this.itemSize;n<r;n++)this.array[e+n]=t.array[i+n];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)mi.fromBufferAttribute(this,t),mi.applyMatrix3(e),this.setXY(t,mi.x,mi.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)it.fromBufferAttribute(this,t),it.applyMatrix3(e),this.setXYZ(t,it.x,it.y,it.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)it.fromBufferAttribute(this,t),it.applyMatrix4(e),this.setXYZ(t,it.x,it.y,it.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)it.fromBufferAttribute(this,t),it.applyNormalMatrix(e),this.setXYZ(t,it.x,it.y,it.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)it.fromBufferAttribute(this,t),it.transformDirection(e),this.setXYZ(t,it.x,it.y,it.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=On(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=St(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=On(t,this.array)),t}setX(e,t){return this.normalized&&(t=St(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=On(t,this.array)),t}setY(e,t){return this.normalized&&(t=St(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=On(t,this.array)),t}setZ(e,t){return this.normalized&&(t=St(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=On(t,this.array)),t}setW(e,t){return this.normalized&&(t=St(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=St(t,this.array),i=St(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,n){return e*=this.itemSize,this.normalized&&(t=St(t,this.array),i=St(i,this.array),n=St(n,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=n,this}setXYZW(e,t,i,n,r){return e*=this.itemSize,this.normalized&&(t=St(t,this.array),i=St(i,this.array),n=St(n,this.array),r=St(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=n,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==35044&&(e.usage=this.usage),e}}class Hs extends Rt{constructor(e,t,i){super(new Uint16Array(e),t,i)}}class Vs extends Rt{constructor(e,t,i){super(new Uint32Array(e),t,i)}}class Bt extends Rt{constructor(e,t,i){super(new Float32Array(e),t,i)}}let ca=0;const Ct=new at,ts=new Mt,En=new D,bt=new Gn,Xn=new Gn,ot=new D;class kt extends fn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:ca++}),this.uuid=Nn(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Ts(e)?Vs:Hs)(e,1):this.index=e,this}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const i=this.attributes.normal;if(i!==void 0){const r=new Oe().getNormalMatrix(e);i.applyNormalMatrix(r),i.needsUpdate=!0}const n=this.attributes.tangent;return n!==void 0&&(n.transformDirection(e),n.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return Ct.makeRotationFromQuaternion(e),this.applyMatrix4(Ct),this}rotateX(e){return Ct.makeRotationX(e),this.applyMatrix4(Ct),this}rotateY(e){return Ct.makeRotationY(e),this.applyMatrix4(Ct),this}rotateZ(e){return Ct.makeRotationZ(e),this.applyMatrix4(Ct),this}translate(e,t,i){return Ct.makeTranslation(e,t,i),this.applyMatrix4(Ct),this}scale(e,t,i){return Ct.makeScale(e,t,i),this.applyMatrix4(Ct),this}lookAt(e){return ts.lookAt(e),ts.updateMatrix(),this.applyMatrix4(ts.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(En).negate(),this.translate(En.x,En.y,En.z),this}setFromPoints(e){const t=[];for(let i=0,n=e.length;i<n;i++){const r=e[i];t.push(r.x,r.y,r.z||0)}return this.setAttribute("position",new Bt(t,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Gn);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingBox.set(new D(-1/0,-1/0,-1/0),new D(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,n=t.length;i<n;i++){const r=t[i];bt.setFromBufferAttribute(r),this.morphTargetsRelative?(ot.addVectors(this.boundingBox.min,bt.min),this.boundingBox.expandByPoint(ot),ot.addVectors(this.boundingBox.max,bt.max),this.boundingBox.expandByPoint(ot)):(this.boundingBox.expandByPoint(bt.min),this.boundingBox.expandByPoint(bt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new oi);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingSphere.set(new D,1/0);return}if(e){const i=this.boundingSphere.center;if(bt.setFromBufferAttribute(e),t)for(let r=0,o=t.length;r<o;r++){const a=t[r];Xn.setFromBufferAttribute(a),this.morphTargetsRelative?(ot.addVectors(bt.min,Xn.min),bt.expandByPoint(ot),ot.addVectors(bt.max,Xn.max),bt.expandByPoint(ot)):(bt.expandByPoint(Xn.min),bt.expandByPoint(Xn.max))}bt.getCenter(i);let n=0;for(let r=0,o=e.count;r<o;r++)ot.fromBufferAttribute(e,r),n=Math.max(n,i.distanceToSquared(ot));if(t)for(let r=0,o=t.length;r<o;r++){const a=t[r],l=this.morphTargetsRelative;for(let c=0,u=a.count;c<u;c++)ot.fromBufferAttribute(a,c),l&&(En.fromBufferAttribute(e,c),ot.add(En)),n=Math.max(n,i.distanceToSquared(ot))}this.boundingSphere.radius=Math.sqrt(n),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const i=e.array,n=t.position.array,r=t.normal.array,o=t.uv.array,a=n.length/3;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Rt(new Float32Array(4*a),4));const l=this.getAttribute("tangent").array,c=[],u=[];for(let T=0;T<a;T++)c[T]=new D,u[T]=new D;const h=new D,f=new D,m=new D,g=new We,_=new We,p=new We,d=new D,E=new D;function x(T,k,$){h.fromArray(n,T*3),f.fromArray(n,k*3),m.fromArray(n,$*3),g.fromArray(o,T*2),_.fromArray(o,k*2),p.fromArray(o,$*2),f.sub(h),m.sub(h),_.sub(g),p.sub(g);const ie=1/(_.x*p.y-p.x*_.y);isFinite(ie)&&(d.copy(f).multiplyScalar(p.y).addScaledVector(m,-_.y).multiplyScalar(ie),E.copy(m).multiplyScalar(_.x).addScaledVector(f,-p.x).multiplyScalar(ie),c[T].add(d),c[k].add(d),c[$].add(d),u[T].add(E),u[k].add(E),u[$].add(E))}let A=this.groups;A.length===0&&(A=[{start:0,count:i.length}]);for(let T=0,k=A.length;T<k;++T){const $=A[T],ie=$.start,C=$.count;for(let O=ie,z=ie+C;O<z;O+=3)x(i[O+0],i[O+1],i[O+2])}const P=new D,R=new D,w=new D,q=new D;function M(T){w.fromArray(r,T*3),q.copy(w);const k=c[T];P.copy(k),P.sub(w.multiplyScalar(w.dot(k))).normalize(),R.crossVectors(q,k);const ie=R.dot(u[T])<0?-1:1;l[T*4]=P.x,l[T*4+1]=P.y,l[T*4+2]=P.z,l[T*4+3]=ie}for(let T=0,k=A.length;T<k;++T){const $=A[T],ie=$.start,C=$.count;for(let O=ie,z=ie+C;O<z;O+=3)M(i[O+0]),M(i[O+1]),M(i[O+2])}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new Rt(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let f=0,m=i.count;f<m;f++)i.setXYZ(f,0,0,0);const n=new D,r=new D,o=new D,a=new D,l=new D,c=new D,u=new D,h=new D;if(e)for(let f=0,m=e.count;f<m;f+=3){const g=e.getX(f+0),_=e.getX(f+1),p=e.getX(f+2);n.fromBufferAttribute(t,g),r.fromBufferAttribute(t,_),o.fromBufferAttribute(t,p),u.subVectors(o,r),h.subVectors(n,r),u.cross(h),a.fromBufferAttribute(i,g),l.fromBufferAttribute(i,_),c.fromBufferAttribute(i,p),a.add(u),l.add(u),c.add(u),i.setXYZ(g,a.x,a.y,a.z),i.setXYZ(_,l.x,l.y,l.z),i.setXYZ(p,c.x,c.y,c.z)}else for(let f=0,m=t.count;f<m;f+=3)n.fromBufferAttribute(t,f+0),r.fromBufferAttribute(t,f+1),o.fromBufferAttribute(t,f+2),u.subVectors(o,r),h.subVectors(n,r),u.cross(h),i.setXYZ(f+0,u.x,u.y,u.z),i.setXYZ(f+1,u.x,u.y,u.z),i.setXYZ(f+2,u.x,u.y,u.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)ot.fromBufferAttribute(e,t),ot.normalize(),e.setXYZ(t,ot.x,ot.y,ot.z)}toNonIndexed(){function e(a,l){const c=a.array,u=a.itemSize,h=a.normalized,f=new c.constructor(l.length*u);let m=0,g=0;for(let _=0,p=l.length;_<p;_++){a.isInterleavedBufferAttribute?m=l[_]*a.data.stride+a.offset:m=l[_]*u;for(let d=0;d<u;d++)f[g++]=c[m++]}return new Rt(f,u,h)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new kt,i=this.index.array,n=this.attributes;for(const a in n){const l=n[a],c=e(l,i);t.setAttribute(a,c)}const r=this.morphAttributes;for(const a in r){const l=[],c=r[a];for(let u=0,h=c.length;u<h;u++){const f=c[u],m=e(f,i);l.push(m)}t.morphAttributes[a]=l}t.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let a=0,l=o.length;a<l;a++){const c=o[a];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){const e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const i=this.attributes;for(const l in i){const c=i[l];e.data.attributes[l]=c.toJSON(e.data)}const n={};let r=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],u=[];for(let h=0,f=c.length;h<f;h++){const m=c[h];u.push(m.toJSON(e.data))}u.length>0&&(n[l]=u,r=!0)}r&&(e.data.morphAttributes=n,e.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));const a=this.boundingSphere;return a!==null&&(e.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const i=e.index;i!==null&&this.setIndex(i.clone(t));const n=e.attributes;for(const c in n){const u=n[c];this.setAttribute(c,u.clone(t))}const r=e.morphAttributes;for(const c in r){const u=[],h=r[c];for(let f=0,m=h.length;f<m;f++)u.push(h[f].clone(t));this.morphAttributes[c]=u}this.morphTargetsRelative=e.morphTargetsRelative;const o=e.groups;for(let c=0,u=o.length;c<u;c++){const h=o[c];this.addGroup(h.start,h.count,h.materialIndex)}const a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());const l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Ws=new at,rn=new Ds,gi=new oi,Xs=new D,Tn=new D,bn=new D,An=new D,ns=new D,_i=new D,vi=new We,xi=new We,Si=new We,qs=new D,$s=new D,Ys=new D,Mi=new D,yi=new D;class Yt extends Mt{constructor(e=new kt,t=new es){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){const n=t[i[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=n.length;r<o;r++){const a=n[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(e,t){const i=this.geometry,n=i.attributes.position,r=i.morphAttributes.position,o=i.morphTargetsRelative;t.fromBufferAttribute(n,e);const a=this.morphTargetInfluences;if(r&&a){_i.set(0,0,0);for(let l=0,c=r.length;l<c;l++){const u=a[l],h=r[l];u!==0&&(ns.fromBufferAttribute(h,e),o?_i.addScaledVector(ns,u):_i.addScaledVector(ns.sub(t),u))}t.add(_i)}return t}raycast(e,t){const i=this.geometry,n=this.material,r=this.matrixWorld;n!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),gi.copy(i.boundingSphere),gi.applyMatrix4(r),rn.copy(e.ray).recast(e.near),!(gi.containsPoint(rn.origin)===!1&&(rn.intersectSphere(gi,Xs)===null||rn.origin.distanceToSquared(Xs)>(e.far-e.near)**2))&&(Ws.copy(r).invert(),rn.copy(e.ray).applyMatrix4(Ws),!(i.boundingBox!==null&&rn.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,rn)))}_computeIntersections(e,t,i){let n;const r=this.geometry,o=this.material,a=r.index,l=r.attributes.position,c=r.attributes.uv,u=r.attributes.uv1,h=r.attributes.normal,f=r.groups,m=r.drawRange;if(a!==null)if(Array.isArray(o))for(let g=0,_=f.length;g<_;g++){const p=f[g],d=o[p.materialIndex],E=Math.max(p.start,m.start),x=Math.min(a.count,Math.min(p.start+p.count,m.start+m.count));for(let A=E,P=x;A<P;A+=3){const R=a.getX(A),w=a.getX(A+1),q=a.getX(A+2);n=Ei(this,d,e,i,c,u,h,R,w,q),n&&(n.faceIndex=Math.floor(A/3),n.face.materialIndex=p.materialIndex,t.push(n))}}else{const g=Math.max(0,m.start),_=Math.min(a.count,m.start+m.count);for(let p=g,d=_;p<d;p+=3){const E=a.getX(p),x=a.getX(p+1),A=a.getX(p+2);n=Ei(this,o,e,i,c,u,h,E,x,A),n&&(n.faceIndex=Math.floor(p/3),t.push(n))}}else if(l!==void 0)if(Array.isArray(o))for(let g=0,_=f.length;g<_;g++){const p=f[g],d=o[p.materialIndex],E=Math.max(p.start,m.start),x=Math.min(l.count,Math.min(p.start+p.count,m.start+m.count));for(let A=E,P=x;A<P;A+=3){const R=A,w=A+1,q=A+2;n=Ei(this,d,e,i,c,u,h,R,w,q),n&&(n.faceIndex=Math.floor(A/3),n.face.materialIndex=p.materialIndex,t.push(n))}}else{const g=Math.max(0,m.start),_=Math.min(l.count,m.start+m.count);for(let p=g,d=_;p<d;p+=3){const E=p,x=p+1,A=p+2;n=Ei(this,o,e,i,c,u,h,E,x,A),n&&(n.faceIndex=Math.floor(p/3),t.push(n))}}}}function ua(s,e,t,i,n,r,o,a){let l;if(e.side===1?l=i.intersectTriangle(o,r,n,!0,a):l=i.intersectTriangle(n,r,o,e.side===0,a),l===null)return null;yi.copy(a),yi.applyMatrix4(s.matrixWorld);const c=t.ray.origin.distanceTo(yi);return c<t.near||c>t.far?null:{distance:c,point:yi.clone(),object:s}}function Ei(s,e,t,i,n,r,o,a,l,c){s.getVertexPosition(a,Tn),s.getVertexPosition(l,bn),s.getVertexPosition(c,An);const u=ua(s,e,t,i,Tn,bn,An,Mi);if(u){n&&(vi.fromBufferAttribute(n,a),xi.fromBufferAttribute(n,l),Si.fromBufferAttribute(n,c),u.uv=Ft.getInterpolation(Mi,Tn,bn,An,vi,xi,Si,new We)),r&&(vi.fromBufferAttribute(r,a),xi.fromBufferAttribute(r,l),Si.fromBufferAttribute(r,c),u.uv1=Ft.getInterpolation(Mi,Tn,bn,An,vi,xi,Si,new We),u.uv2=u.uv1),o&&(qs.fromBufferAttribute(o,a),$s.fromBufferAttribute(o,l),Ys.fromBufferAttribute(o,c),u.normal=Ft.getInterpolation(Mi,Tn,bn,An,qs,$s,Ys,new D),u.normal.dot(i.direction)>0&&u.normal.multiplyScalar(-1));const h={a,b:l,c,normal:new D,materialIndex:0};Ft.getNormal(Tn,bn,An,h.normal),u.face=h}return u}class qn extends kt{constructor(e=1,t=1,i=1,n=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:n,heightSegments:r,depthSegments:o};const a=this;n=Math.floor(n),r=Math.floor(r),o=Math.floor(o);const l=[],c=[],u=[],h=[];let f=0,m=0;g("z","y","x",-1,-1,i,t,e,o,r,0),g("z","y","x",1,-1,i,t,-e,o,r,1),g("x","z","y",1,1,e,i,t,n,o,2),g("x","z","y",1,-1,e,i,-t,n,o,3),g("x","y","z",1,-1,e,t,i,n,r,4),g("x","y","z",-1,-1,e,t,-i,n,r,5),this.setIndex(l),this.setAttribute("position",new Bt(c,3)),this.setAttribute("normal",new Bt(u,3)),this.setAttribute("uv",new Bt(h,2));function g(_,p,d,E,x,A,P,R,w,q,M){const T=A/w,k=P/q,$=A/2,ie=P/2,C=R/2,O=w+1,z=q+1;let W=0,V=0;const H=new D;for(let Y=0;Y<z;Y++){const Z=Y*k-ie;for(let le=0;le<O;le++){const G=le*T-$;H[_]=G*E,H[p]=Z*x,H[d]=C,c.push(H.x,H.y,H.z),H[_]=0,H[p]=0,H[d]=R>0?1:-1,u.push(H.x,H.y,H.z),h.push(le/w),h.push(1-Y/q),W+=1}}for(let Y=0;Y<q;Y++)for(let Z=0;Z<w;Z++){const le=f+Z+O*Y,G=f+Z+O*(Y+1),X=f+(Z+1)+O*(Y+1),ae=f+(Z+1)+O*Y;l.push(le,G,ae),l.push(G,X,ae),V+=6}a.addGroup(m,V,M),m+=V,f+=W}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new qn(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}function wn(s){const e={};for(const t in s){e[t]={};for(const i in s[t]){const n=s[t][i];n&&(n.isColor||n.isMatrix3||n.isMatrix4||n.isVector2||n.isVector3||n.isVector4||n.isTexture||n.isQuaternion)?n.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=n.clone():Array.isArray(n)?e[t][i]=n.slice():e[t][i]=n}}return e}function mt(s){const e={};for(let t=0;t<s.length;t++){const i=wn(s[t]);for(const n in i)e[n]=i[n]}return e}function da(s){const e=[];for(let t=0;t<s.length;t++)e.push(s[t].clone());return e}function Ks(s){return s.getRenderTarget()===null?s.outputColorSpace:Xe.workingColorSpace}const ha={clone:wn,merge:mt};var fa=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,pa=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class an extends Wn{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=fa,this.fragmentShader=pa,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={derivatives:!1,fragDepth:!1,drawBuffers:!1,shaderTextureLOD:!1,clipCullDistance:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=wn(e.uniforms),this.uniformsGroups=da(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const n in this.uniforms){const o=this.uniforms[n].value;o&&o.isTexture?t.uniforms[n]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[n]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[n]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[n]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[n]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[n]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[n]={type:"m4",value:o.toArray()}:t.uniforms[n]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const i={};for(const n in this.extensions)this.extensions[n]===!0&&(i[n]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}}class js extends Mt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new at,this.projectionMatrix=new at,this.projectionMatrixInverse=new at,this.coordinateSystem=2e3}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}class Nt extends js{constructor(e=50,t=1,i=.1,n=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=n,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=Oi*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(Ni*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Oi*2*Math.atan(Math.tan(Ni*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}setViewOffset(e,t,i,n,r,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=n,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(Ni*.5*this.fov)/this.zoom,i=2*t,n=this.aspect*i,r=-.5*n;const o=this.view;if(this.view!==null&&this.view.enabled){const l=o.fullWidth,c=o.fullHeight;r+=o.offsetX*n/l,t-=o.offsetY*i/c,n*=o.width/l,i*=o.height/c}const a=this.filmOffset;a!==0&&(r+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+n,t,t-i,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}const Rn=-90,Cn=1;class ma extends Mt{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;const n=new Nt(Rn,Cn,e,t);n.layers=this.layers,this.add(n);const r=new Nt(Rn,Cn,e,t);r.layers=this.layers,this.add(r);const o=new Nt(Rn,Cn,e,t);o.layers=this.layers,this.add(o);const a=new Nt(Rn,Cn,e,t);a.layers=this.layers,this.add(a);const l=new Nt(Rn,Cn,e,t);l.layers=this.layers,this.add(l);const c=new Nt(Rn,Cn,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[i,n,r,o,a,l]=t;for(const c of t)this.remove(c);if(e===2e3)i.up.set(0,1,0),i.lookAt(1,0,0),n.up.set(0,1,0),n.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===2001)i.up.set(0,-1,0),i.lookAt(-1,0,0),n.up.set(0,-1,0),n.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:i,activeMipmapLevel:n}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[r,o,a,l,c,u]=this.children,h=e.getRenderTarget(),f=e.getActiveCubeFace(),m=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;const _=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,e.setRenderTarget(i,0,n),e.render(t,r),e.setRenderTarget(i,1,n),e.render(t,o),e.setRenderTarget(i,2,n),e.render(t,a),e.setRenderTarget(i,3,n),e.render(t,l),e.setRenderTarget(i,4,n),e.render(t,c),i.texture.generateMipmaps=_,e.setRenderTarget(i,5,n),e.render(t,u),e.setRenderTarget(h,f,m),e.xr.enabled=g,i.texture.needsPMREMUpdate=!0}}class Zs extends Et{constructor(e,t,i,n,r,o,a,l,c,u){e=e!==void 0?e:[],t=t!==void 0?t:301,super(e,t,i,n,r,o,a,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class ga extends tn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const i={width:e,height:e,depth:1},n=[i,i,i,i,i,i];t.encoding!==void 0&&(Bn("THREE.WebGLCubeRenderTarget: option.encoding has been replaced by option.colorSpace."),t.colorSpace=t.encoding===3001?ut:wt),this.texture=new Zs(n,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:1006}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},n=new qn(5,5,5),r=new an({name:"CubemapFromEquirect",uniforms:wn(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:1,blending:0});r.uniforms.tEquirect.value=t;const o=new Yt(n,r),a=t.minFilter;return t.minFilter===1008&&(t.minFilter=1006),new ma(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t,i,n){const r=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,i,n);e.setRenderTarget(r)}}const is=new D,_a=new D,va=new Oe;class on{constructor(e=new D(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,n){return this.normal.set(e,t,i),this.constant=n,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){const n=is.subVectors(i,t).cross(_a.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(n,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){const i=e.delta(is),n=this.normal.dot(i);if(n===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const r=-(e.start.dot(this.normal)+this.constant)/n;return r<0||r>1?null:t.copy(e.start).addScaledVector(i,r)}intersectsLine(e){const t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const i=t||va.getNormalMatrix(e),n=this.coplanarPoint(is).applyMatrix4(e),r=this.normal.applyMatrix3(i).normalize();return this.constant=-n.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const ln=new oi,Ti=new D;class Js{constructor(e=new on,t=new on,i=new on,n=new on,r=new on,o=new on){this.planes=[e,t,i,n,r,o]}set(e,t,i,n,r,o){const a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(i),a[3].copy(n),a[4].copy(r),a[5].copy(o),this}copy(e){const t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=2e3){const i=this.planes,n=e.elements,r=n[0],o=n[1],a=n[2],l=n[3],c=n[4],u=n[5],h=n[6],f=n[7],m=n[8],g=n[9],_=n[10],p=n[11],d=n[12],E=n[13],x=n[14],A=n[15];if(i[0].setComponents(l-r,f-c,p-m,A-d).normalize(),i[1].setComponents(l+r,f+c,p+m,A+d).normalize(),i[2].setComponents(l+o,f+u,p+g,A+E).normalize(),i[3].setComponents(l-o,f-u,p-g,A-E).normalize(),i[4].setComponents(l-a,f-h,p-_,A-x).normalize(),t===2e3)i[5].setComponents(l+a,f+h,p+_,A+x).normalize();else if(t===2001)i[5].setComponents(a,h,_,x).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),ln.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),ln.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(ln)}intersectsSprite(e){return ln.center.set(0,0,0),ln.radius=.7071067811865476,ln.applyMatrix4(e.matrixWorld),this.intersectsSphere(ln)}intersectsSphere(e){const t=this.planes,i=e.center,n=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(i)<n)return!1;return!0}intersectsBox(e){const t=this.planes;for(let i=0;i<6;i++){const n=t[i];if(Ti.x=n.normal.x>0?e.max.x:e.min.x,Ti.y=n.normal.y>0?e.max.y:e.min.y,Ti.z=n.normal.z>0?e.max.z:e.min.z,n.distanceToPoint(Ti)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function Qs(){let s=null,e=!1,t=null,i=null;function n(r,o){t(r,o),i=s.requestAnimationFrame(n)}return{start:function(){e!==!0&&t!==null&&(i=s.requestAnimationFrame(n),e=!0)},stop:function(){s.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){s=r}}}function xa(s,e){const t=e.isWebGL2,i=new WeakMap;function n(c,u){const h=c.array,f=c.usage,m=h.byteLength,g=s.createBuffer();s.bindBuffer(u,g),s.bufferData(u,h,f),c.onUploadCallback();let _;if(h instanceof Float32Array)_=s.FLOAT;else if(h instanceof Uint16Array)if(c.isFloat16BufferAttribute)if(t)_=s.HALF_FLOAT;else throw new Error("THREE.WebGLAttributes: Usage of Float16BufferAttribute requires WebGL2.");else _=s.UNSIGNED_SHORT;else if(h instanceof Int16Array)_=s.SHORT;else if(h instanceof Uint32Array)_=s.UNSIGNED_INT;else if(h instanceof Int32Array)_=s.INT;else if(h instanceof Int8Array)_=s.BYTE;else if(h instanceof Uint8Array)_=s.UNSIGNED_BYTE;else if(h instanceof Uint8ClampedArray)_=s.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+h);return{buffer:g,type:_,bytesPerElement:h.BYTES_PER_ELEMENT,version:c.version,size:m}}function r(c,u,h){const f=u.array,m=u._updateRange,g=u.updateRanges;if(s.bindBuffer(h,c),m.count===-1&&g.length===0&&s.bufferSubData(h,0,f),g.length!==0){for(let _=0,p=g.length;_<p;_++){const d=g[_];t?s.bufferSubData(h,d.start*f.BYTES_PER_ELEMENT,f,d.start,d.count):s.bufferSubData(h,d.start*f.BYTES_PER_ELEMENT,f.subarray(d.start,d.start+d.count))}u.clearUpdateRanges()}m.count!==-1&&(t?s.bufferSubData(h,m.offset*f.BYTES_PER_ELEMENT,f,m.offset,m.count):s.bufferSubData(h,m.offset*f.BYTES_PER_ELEMENT,f.subarray(m.offset,m.offset+m.count)),m.count=-1),u.onUploadCallback()}function o(c){return c.isInterleavedBufferAttribute&&(c=c.data),i.get(c)}function a(c){c.isInterleavedBufferAttribute&&(c=c.data);const u=i.get(c);u&&(s.deleteBuffer(u.buffer),i.delete(c))}function l(c,u){if(c.isGLBufferAttribute){const f=i.get(c);(!f||f.version<c.version)&&i.set(c,{buffer:c.buffer,type:c.type,bytesPerElement:c.elementSize,version:c.version});return}c.isInterleavedBufferAttribute&&(c=c.data);const h=i.get(c);if(h===void 0)i.set(c,n(c,u));else if(h.version<c.version){if(h.size!==c.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");r(h.buffer,c,u),h.version=c.version}}return{get:o,remove:a,update:l}}class ss extends kt{constructor(e=1,t=1,i=1,n=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:n};const r=e/2,o=t/2,a=Math.floor(i),l=Math.floor(n),c=a+1,u=l+1,h=e/a,f=t/l,m=[],g=[],_=[],p=[];for(let d=0;d<u;d++){const E=d*f-o;for(let x=0;x<c;x++){const A=x*h-r;g.push(A,-E,0),_.push(0,0,1),p.push(x/a),p.push(1-d/l)}}for(let d=0;d<l;d++)for(let E=0;E<a;E++){const x=E+c*d,A=E+c*(d+1),P=E+1+c*(d+1),R=E+1+c*d;m.push(x,A,R),m.push(A,P,R)}this.setIndex(m),this.setAttribute("position",new Bt(g,3)),this.setAttribute("normal",new Bt(_,3)),this.setAttribute("uv",new Bt(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new ss(e.width,e.height,e.widthSegments,e.heightSegments)}}var Sa=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Ma=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,ya=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Ea=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Ta=`#ifdef USE_ALPHATEST
	if ( diffuseColor.a < alphaTest ) discard;
#endif`,ba=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Aa=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,wa=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Ra=`#ifdef USE_BATCHING
	attribute float batchId;
	uniform highp sampler2D batchingTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Ca=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( batchId );
#endif`,La=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Pa=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Da=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Ia=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Ua=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Fa=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#pragma unroll_loop_start
	for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
		plane = clippingPlanes[ i ];
		if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
	}
	#pragma unroll_loop_end
	#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
		bool clipped = true;
		#pragma unroll_loop_start
		for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
		}
		#pragma unroll_loop_end
		if ( clipped ) discard;
	#endif
#endif`,Na=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Oa=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Ba=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,ka=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Ga=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,za=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	varying vec3 vColor;
#endif`,Ha=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif`,Va=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
float luminance( const in vec3 rgb ) {
	const vec3 weights = vec3( 0.2126729, 0.7151522, 0.0721750 );
	return dot( weights, rgb );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Wa=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Xa=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,qa=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,$a=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Ya=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Ka=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,ja="gl_FragColor = linearToOutputTexel( gl_FragColor );",Za=`
const mat3 LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 = mat3(
	vec3( 0.8224621, 0.177538, 0.0 ),
	vec3( 0.0331941, 0.9668058, 0.0 ),
	vec3( 0.0170827, 0.0723974, 0.9105199 )
);
const mat3 LINEAR_DISPLAY_P3_TO_LINEAR_SRGB = mat3(
	vec3( 1.2249401, - 0.2249404, 0.0 ),
	vec3( - 0.0420569, 1.0420571, 0.0 ),
	vec3( - 0.0196376, - 0.0786361, 1.0982735 )
);
vec4 LinearSRGBToLinearDisplayP3( in vec4 value ) {
	return vec4( value.rgb * LINEAR_SRGB_TO_LINEAR_DISPLAY_P3, value.a );
}
vec4 LinearDisplayP3ToLinearSRGB( in vec4 value ) {
	return vec4( value.rgb * LINEAR_DISPLAY_P3_TO_LINEAR_SRGB, value.a );
}
vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}
vec4 LinearToLinear( in vec4 value ) {
	return value;
}
vec4 LinearTosRGB( in vec4 value ) {
	return sRGBTransferOETF( value );
}`,Ja=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,Qa=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,eo=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,to=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,no=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,io=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,so=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,ro=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,ao=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,oo=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,lo=`#ifdef USE_LIGHTMAP
	vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
	vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
	reflectedLight.indirectDiffuse += lightMapIrradiance;
#endif`,co=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,uo=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,ho=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,fo=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	#if defined ( LEGACY_LIGHTS )
		if ( cutoffDistance > 0.0 && decayExponent > 0.0 ) {
			return pow( saturate( - lightDistance / cutoffDistance + 1.0 ), decayExponent );
		}
		return 1.0;
	#else
		float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
		if ( cutoffDistance > 0.0 ) {
			distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
		}
		return distanceFalloff;
	#endif
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,po=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,mo=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,go=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,_o=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,vo=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,xo=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,So=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Mo=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,yo=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Eo=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,To=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	gl_FragDepthEXT = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,bo=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Ao=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		varying float vFragDepth;
		varying float vIsPerspective;
	#else
		uniform float logDepthBufFC;
	#endif
#endif`,wo=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		vFragDepth = 1.0 + gl_Position.w;
		vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
	#else
		if ( isPerspectiveMatrix( projectionMatrix ) ) {
			gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;
			gl_Position.z *= gl_Position.w;
		}
	#endif
#endif`,Ro=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Co=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Lo=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Po=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Do=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Io=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Uo=`#if defined( USE_MORPHCOLORS ) && defined( MORPHTARGETS_TEXTURE )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Fo=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		objectNormal += morphNormal0 * morphTargetInfluences[ 0 ];
		objectNormal += morphNormal1 * morphTargetInfluences[ 1 ];
		objectNormal += morphNormal2 * morphTargetInfluences[ 2 ];
		objectNormal += morphNormal3 * morphTargetInfluences[ 3 ];
	#endif
#endif`,No=`#ifdef USE_MORPHTARGETS
	uniform float morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
		uniform sampler2DArray morphTargetsTexture;
		uniform ivec2 morphTargetsTextureSize;
		vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
			int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
			int y = texelIndex / morphTargetsTextureSize.x;
			int x = texelIndex - y * morphTargetsTextureSize.x;
			ivec3 morphUV = ivec3( x, y, morphTargetIndex );
			return texelFetch( morphTargetsTexture, morphUV, 0 );
		}
	#else
		#ifndef USE_MORPHNORMALS
			uniform float morphTargetInfluences[ 8 ];
		#else
			uniform float morphTargetInfluences[ 4 ];
		#endif
	#endif
#endif`,Oo=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		transformed += morphTarget0 * morphTargetInfluences[ 0 ];
		transformed += morphTarget1 * morphTargetInfluences[ 1 ];
		transformed += morphTarget2 * morphTargetInfluences[ 2 ];
		transformed += morphTarget3 * morphTargetInfluences[ 3 ];
		#ifndef USE_MORPHNORMALS
			transformed += morphTarget4 * morphTargetInfluences[ 4 ];
			transformed += morphTarget5 * morphTargetInfluences[ 5 ];
			transformed += morphTarget6 * morphTargetInfluences[ 6 ];
			transformed += morphTarget7 * morphTargetInfluences[ 7 ];
		#endif
	#endif
#endif`,Bo=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,ko=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Go=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,zo=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Ho=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Vo=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Wo=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Xo=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,qo=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,$o=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Yo=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Ko=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;
const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
const float ShiftRight8 = 1. / 256.;
vec4 packDepthToRGBA( const in float v ) {
	vec4 r = vec4( fract( v * PackFactors ), v );
	r.yzw -= r.xyz * ShiftRight8;	return r * PackUpscale;
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors );
}
vec2 packDepthToRG( in highp float v ) {
	return packDepthToRGBA( v ).yx;
}
float unpackRGToDepth( const in highp vec2 v ) {
	return unpackRGBAToDepth( vec4( v.xy, 0.0, 0.0 ) );
}
vec4 pack2HalfToRGBA( vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,jo=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Zo=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Jo=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Qo=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,el=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,tl=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,nl=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return shadow;
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
		vec3 lightToPosition = shadowCoord.xyz;
		float dp = ( length( lightToPosition ) - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );		dp += shadowBias;
		vec3 bd3D = normalize( lightToPosition );
		#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
			vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
			return (
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
			) * ( 1.0 / 9.0 );
		#else
			return texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
		#endif
	}
#endif`,il=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,sl=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,rl=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,al=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,ol=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,ll=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,cl=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,ul=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,dl=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,hl=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,fl=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 OptimizedCineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color *= toneMappingExposure;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	return color;
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,pl=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,ml=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
		vec3 refractedRayExit = position + transmissionRay;
		vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
		vec2 refractionCoords = ndcPos.xy / ndcPos.w;
		refractionCoords += 1.0;
		refractionCoords /= 2.0;
		vec4 transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
		vec3 transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,gl=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,_l=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,vl=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,xl=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const De={alphahash_fragment:Sa,alphahash_pars_fragment:Ma,alphamap_fragment:ya,alphamap_pars_fragment:Ea,alphatest_fragment:Ta,alphatest_pars_fragment:ba,aomap_fragment:Aa,aomap_pars_fragment:wa,batching_pars_vertex:Ra,batching_vertex:Ca,begin_vertex:La,beginnormal_vertex:Pa,bsdfs:Da,iridescence_fragment:Ia,bumpmap_pars_fragment:Ua,clipping_planes_fragment:Fa,clipping_planes_pars_fragment:Na,clipping_planes_pars_vertex:Oa,clipping_planes_vertex:Ba,color_fragment:ka,color_pars_fragment:Ga,color_pars_vertex:za,color_vertex:Ha,common:Va,cube_uv_reflection_fragment:Wa,defaultnormal_vertex:Xa,displacementmap_pars_vertex:qa,displacementmap_vertex:$a,emissivemap_fragment:Ya,emissivemap_pars_fragment:Ka,colorspace_fragment:ja,colorspace_pars_fragment:Za,envmap_fragment:Ja,envmap_common_pars_fragment:Qa,envmap_pars_fragment:eo,envmap_pars_vertex:to,envmap_physical_pars_fragment:po,envmap_vertex:no,fog_vertex:io,fog_pars_vertex:so,fog_fragment:ro,fog_pars_fragment:ao,gradientmap_pars_fragment:oo,lightmap_fragment:lo,lightmap_pars_fragment:co,lights_lambert_fragment:uo,lights_lambert_pars_fragment:ho,lights_pars_begin:fo,lights_toon_fragment:mo,lights_toon_pars_fragment:go,lights_phong_fragment:_o,lights_phong_pars_fragment:vo,lights_physical_fragment:xo,lights_physical_pars_fragment:So,lights_fragment_begin:Mo,lights_fragment_maps:yo,lights_fragment_end:Eo,logdepthbuf_fragment:To,logdepthbuf_pars_fragment:bo,logdepthbuf_pars_vertex:Ao,logdepthbuf_vertex:wo,map_fragment:Ro,map_pars_fragment:Co,map_particle_fragment:Lo,map_particle_pars_fragment:Po,metalnessmap_fragment:Do,metalnessmap_pars_fragment:Io,morphcolor_vertex:Uo,morphnormal_vertex:Fo,morphtarget_pars_vertex:No,morphtarget_vertex:Oo,normal_fragment_begin:Bo,normal_fragment_maps:ko,normal_pars_fragment:Go,normal_pars_vertex:zo,normal_vertex:Ho,normalmap_pars_fragment:Vo,clearcoat_normal_fragment_begin:Wo,clearcoat_normal_fragment_maps:Xo,clearcoat_pars_fragment:qo,iridescence_pars_fragment:$o,opaque_fragment:Yo,packing:Ko,premultiplied_alpha_fragment:jo,project_vertex:Zo,dithering_fragment:Jo,dithering_pars_fragment:Qo,roughnessmap_fragment:el,roughnessmap_pars_fragment:tl,shadowmap_pars_fragment:nl,shadowmap_pars_vertex:il,shadowmap_vertex:sl,shadowmask_pars_fragment:rl,skinbase_vertex:al,skinning_pars_vertex:ol,skinning_vertex:ll,skinnormal_vertex:cl,specularmap_fragment:ul,specularmap_pars_fragment:dl,tonemapping_fragment:hl,tonemapping_pars_fragment:fl,transmission_fragment:pl,transmission_pars_fragment:ml,uv_pars_fragment:gl,uv_pars_vertex:_l,uv_vertex:vl,worldpos_vertex:xl,background_vert:`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,background_frag:`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,backgroundCube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,backgroundCube_frag:`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,cube_frag:`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,depth_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,depth_frag:`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#endif
}`,distanceRGBA_vert:`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,distanceRGBA_frag:`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,equirect_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,equirect_frag:`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,linedashed_vert:`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,linedashed_frag:`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,meshbasic_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,meshbasic_frag:`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshlambert_vert:`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshlambert_frag:`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshmatcap_vert:`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,meshmatcap_frag:`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshnormal_vert:`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,meshnormal_frag:`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), opacity );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,meshphong_vert:`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshphong_frag:`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshphysical_vert:`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,meshphysical_frag:`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshtoon_vert:`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshtoon_frag:`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,points_vert:`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,points_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,shadow_vert:`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,shadow_frag:`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,sprite_vert:`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
	vec2 scale;
	scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
	scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,sprite_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`},te={common:{diffuse:{value:new He(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Oe},alphaMap:{value:null},alphaMapTransform:{value:new Oe},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Oe}},envmap:{envMap:{value:null},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Oe}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Oe}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Oe},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Oe},normalScale:{value:new We(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Oe},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Oe}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Oe}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Oe}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new He(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new He(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Oe},alphaTest:{value:0},uvTransform:{value:new Oe}},sprite:{diffuse:{value:new He(16777215)},opacity:{value:1},center:{value:new We(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Oe},alphaMap:{value:null},alphaMapTransform:{value:new Oe},alphaTest:{value:0}}},Gt={basic:{uniforms:mt([te.common,te.specularmap,te.envmap,te.aomap,te.lightmap,te.fog]),vertexShader:De.meshbasic_vert,fragmentShader:De.meshbasic_frag},lambert:{uniforms:mt([te.common,te.specularmap,te.envmap,te.aomap,te.lightmap,te.emissivemap,te.bumpmap,te.normalmap,te.displacementmap,te.fog,te.lights,{emissive:{value:new He(0)}}]),vertexShader:De.meshlambert_vert,fragmentShader:De.meshlambert_frag},phong:{uniforms:mt([te.common,te.specularmap,te.envmap,te.aomap,te.lightmap,te.emissivemap,te.bumpmap,te.normalmap,te.displacementmap,te.fog,te.lights,{emissive:{value:new He(0)},specular:{value:new He(1118481)},shininess:{value:30}}]),vertexShader:De.meshphong_vert,fragmentShader:De.meshphong_frag},standard:{uniforms:mt([te.common,te.envmap,te.aomap,te.lightmap,te.emissivemap,te.bumpmap,te.normalmap,te.displacementmap,te.roughnessmap,te.metalnessmap,te.fog,te.lights,{emissive:{value:new He(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:De.meshphysical_vert,fragmentShader:De.meshphysical_frag},toon:{uniforms:mt([te.common,te.aomap,te.lightmap,te.emissivemap,te.bumpmap,te.normalmap,te.displacementmap,te.gradientmap,te.fog,te.lights,{emissive:{value:new He(0)}}]),vertexShader:De.meshtoon_vert,fragmentShader:De.meshtoon_frag},matcap:{uniforms:mt([te.common,te.bumpmap,te.normalmap,te.displacementmap,te.fog,{matcap:{value:null}}]),vertexShader:De.meshmatcap_vert,fragmentShader:De.meshmatcap_frag},points:{uniforms:mt([te.points,te.fog]),vertexShader:De.points_vert,fragmentShader:De.points_frag},dashed:{uniforms:mt([te.common,te.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:De.linedashed_vert,fragmentShader:De.linedashed_frag},depth:{uniforms:mt([te.common,te.displacementmap]),vertexShader:De.depth_vert,fragmentShader:De.depth_frag},normal:{uniforms:mt([te.common,te.bumpmap,te.normalmap,te.displacementmap,{opacity:{value:1}}]),vertexShader:De.meshnormal_vert,fragmentShader:De.meshnormal_frag},sprite:{uniforms:mt([te.sprite,te.fog]),vertexShader:De.sprite_vert,fragmentShader:De.sprite_frag},background:{uniforms:{uvTransform:{value:new Oe},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:De.background_vert,fragmentShader:De.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1}},vertexShader:De.backgroundCube_vert,fragmentShader:De.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:De.cube_vert,fragmentShader:De.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:De.equirect_vert,fragmentShader:De.equirect_frag},distanceRGBA:{uniforms:mt([te.common,te.displacementmap,{referencePosition:{value:new D},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:De.distanceRGBA_vert,fragmentShader:De.distanceRGBA_frag},shadow:{uniforms:mt([te.lights,te.fog,{color:{value:new He(0)},opacity:{value:1}}]),vertexShader:De.shadow_vert,fragmentShader:De.shadow_frag}};Gt.physical={uniforms:mt([Gt.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Oe},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Oe},clearcoatNormalScale:{value:new We(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Oe},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Oe},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Oe},sheen:{value:0},sheenColor:{value:new He(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Oe},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Oe},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Oe},transmissionSamplerSize:{value:new We},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Oe},attenuationDistance:{value:0},attenuationColor:{value:new He(0)},specularColor:{value:new He(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Oe},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Oe},anisotropyVector:{value:new We},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Oe}}]),vertexShader:De.meshphysical_vert,fragmentShader:De.meshphysical_frag};const bi={r:0,b:0,g:0};function Sl(s,e,t,i,n,r,o){const a=new He(0);let l=r===!0?0:1,c,u,h=null,f=0,m=null;function g(p,d){let E=!1,x=d.isScene===!0?d.background:null;x&&x.isTexture&&(x=(d.backgroundBlurriness>0?t:e).get(x)),x===null?_(a,l):x&&x.isColor&&(_(x,1),E=!0);const A=s.xr.getEnvironmentBlendMode();A==="additive"?i.buffers.color.setClear(0,0,0,1,o):A==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,o),(s.autoClear||E)&&s.clear(s.autoClearColor,s.autoClearDepth,s.autoClearStencil),x&&(x.isCubeTexture||x.mapping===306)?(u===void 0&&(u=new Yt(new qn(1,1,1),new an({name:"BackgroundCubeMaterial",uniforms:wn(Gt.backgroundCube.uniforms),vertexShader:Gt.backgroundCube.vertexShader,fragmentShader:Gt.backgroundCube.fragmentShader,side:1,depthTest:!1,depthWrite:!1,fog:!1})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(P,R,w){this.matrixWorld.copyPosition(w.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(u)),u.material.uniforms.envMap.value=x,u.material.uniforms.flipEnvMap.value=x.isCubeTexture&&x.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=d.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=d.backgroundIntensity,u.material.toneMapped=Xe.getTransfer(x.colorSpace)!==je,(h!==x||f!==x.version||m!==s.toneMapping)&&(u.material.needsUpdate=!0,h=x,f=x.version,m=s.toneMapping),u.layers.enableAll(),p.unshift(u,u.geometry,u.material,0,0,null)):x&&x.isTexture&&(c===void 0&&(c=new Yt(new ss(2,2),new an({name:"BackgroundMaterial",uniforms:wn(Gt.background.uniforms),vertexShader:Gt.background.vertexShader,fragmentShader:Gt.background.fragmentShader,side:0,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(c)),c.material.uniforms.t2D.value=x,c.material.uniforms.backgroundIntensity.value=d.backgroundIntensity,c.material.toneMapped=Xe.getTransfer(x.colorSpace)!==je,x.matrixAutoUpdate===!0&&x.updateMatrix(),c.material.uniforms.uvTransform.value.copy(x.matrix),(h!==x||f!==x.version||m!==s.toneMapping)&&(c.material.needsUpdate=!0,h=x,f=x.version,m=s.toneMapping),c.layers.enableAll(),p.unshift(c,c.geometry,c.material,0,0,null))}function _(p,d){p.getRGB(bi,Ks(s)),i.buffers.color.setClear(bi.r,bi.g,bi.b,d,o)}return{getClearColor:function(){return a},setClearColor:function(p,d=1){a.set(p),l=d,_(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(p){l=p,_(a,l)},render:g}}function Ml(s,e,t,i){const n=s.getParameter(s.MAX_VERTEX_ATTRIBS),r=i.isWebGL2?null:e.get("OES_vertex_array_object"),o=i.isWebGL2||r!==null,a={},l=p(null);let c=l,u=!1;function h(C,O,z,W,V){let H=!1;if(o){const Y=_(W,z,O);c!==Y&&(c=Y,m(c.object)),H=d(C,W,z,V),H&&E(C,W,z,V)}else{const Y=O.wireframe===!0;(c.geometry!==W.id||c.program!==z.id||c.wireframe!==Y)&&(c.geometry=W.id,c.program=z.id,c.wireframe=Y,H=!0)}V!==null&&t.update(V,s.ELEMENT_ARRAY_BUFFER),(H||u)&&(u=!1,q(C,O,z,W),V!==null&&s.bindBuffer(s.ELEMENT_ARRAY_BUFFER,t.get(V).buffer))}function f(){return i.isWebGL2?s.createVertexArray():r.createVertexArrayOES()}function m(C){return i.isWebGL2?s.bindVertexArray(C):r.bindVertexArrayOES(C)}function g(C){return i.isWebGL2?s.deleteVertexArray(C):r.deleteVertexArrayOES(C)}function _(C,O,z){const W=z.wireframe===!0;let V=a[C.id];V===void 0&&(V={},a[C.id]=V);let H=V[O.id];H===void 0&&(H={},V[O.id]=H);let Y=H[W];return Y===void 0&&(Y=p(f()),H[W]=Y),Y}function p(C){const O=[],z=[],W=[];for(let V=0;V<n;V++)O[V]=0,z[V]=0,W[V]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:O,enabledAttributes:z,attributeDivisors:W,object:C,attributes:{},index:null}}function d(C,O,z,W){const V=c.attributes,H=O.attributes;let Y=0;const Z=z.getAttributes();for(const le in Z)if(Z[le].location>=0){const X=V[le];let ae=H[le];if(ae===void 0&&(le==="instanceMatrix"&&C.instanceMatrix&&(ae=C.instanceMatrix),le==="instanceColor"&&C.instanceColor&&(ae=C.instanceColor)),X===void 0||X.attribute!==ae||ae&&X.data!==ae.data)return!0;Y++}return c.attributesNum!==Y||c.index!==W}function E(C,O,z,W){const V={},H=O.attributes;let Y=0;const Z=z.getAttributes();for(const le in Z)if(Z[le].location>=0){let X=H[le];X===void 0&&(le==="instanceMatrix"&&C.instanceMatrix&&(X=C.instanceMatrix),le==="instanceColor"&&C.instanceColor&&(X=C.instanceColor));const ae={};ae.attribute=X,X&&X.data&&(ae.data=X.data),V[le]=ae,Y++}c.attributes=V,c.attributesNum=Y,c.index=W}function x(){const C=c.newAttributes;for(let O=0,z=C.length;O<z;O++)C[O]=0}function A(C){P(C,0)}function P(C,O){const z=c.newAttributes,W=c.enabledAttributes,V=c.attributeDivisors;z[C]=1,W[C]===0&&(s.enableVertexAttribArray(C),W[C]=1),V[C]!==O&&((i.isWebGL2?s:e.get("ANGLE_instanced_arrays"))[i.isWebGL2?"vertexAttribDivisor":"vertexAttribDivisorANGLE"](C,O),V[C]=O)}function R(){const C=c.newAttributes,O=c.enabledAttributes;for(let z=0,W=O.length;z<W;z++)O[z]!==C[z]&&(s.disableVertexAttribArray(z),O[z]=0)}function w(C,O,z,W,V,H,Y){Y===!0?s.vertexAttribIPointer(C,O,z,V,H):s.vertexAttribPointer(C,O,z,W,V,H)}function q(C,O,z,W){if(i.isWebGL2===!1&&(C.isInstancedMesh||W.isInstancedBufferGeometry)&&e.get("ANGLE_instanced_arrays")===null)return;x();const V=W.attributes,H=z.getAttributes(),Y=O.defaultAttributeValues;for(const Z in H){const le=H[Z];if(le.location>=0){let G=V[Z];if(G===void 0&&(Z==="instanceMatrix"&&C.instanceMatrix&&(G=C.instanceMatrix),Z==="instanceColor"&&C.instanceColor&&(G=C.instanceColor)),G!==void 0){const X=G.normalized,ae=G.itemSize,de=t.get(G);if(de===void 0)continue;const ue=de.buffer,xe=de.type,we=de.bytesPerElement,ve=i.isWebGL2===!0&&(xe===s.INT||xe===s.UNSIGNED_INT||G.gpuType===1013);if(G.isInterleavedBufferAttribute){const ze=G.data,I=ze.stride,gt=G.offset;if(ze.isInstancedInterleavedBuffer){for(let Se=0;Se<le.locationSize;Se++)P(le.location+Se,ze.meshPerAttribute);C.isInstancedMesh!==!0&&W._maxInstanceCount===void 0&&(W._maxInstanceCount=ze.meshPerAttribute*ze.count)}else for(let Se=0;Se<le.locationSize;Se++)A(le.location+Se);s.bindBuffer(s.ARRAY_BUFFER,ue);for(let Se=0;Se<le.locationSize;Se++)w(le.location+Se,ae/le.locationSize,xe,X,I*we,(gt+ae/le.locationSize*Se)*we,ve)}else{if(G.isInstancedBufferAttribute){for(let ze=0;ze<le.locationSize;ze++)P(le.location+ze,G.meshPerAttribute);C.isInstancedMesh!==!0&&W._maxInstanceCount===void 0&&(W._maxInstanceCount=G.meshPerAttribute*G.count)}else for(let ze=0;ze<le.locationSize;ze++)A(le.location+ze);s.bindBuffer(s.ARRAY_BUFFER,ue);for(let ze=0;ze<le.locationSize;ze++)w(le.location+ze,ae/le.locationSize,xe,X,ae*we,ae/le.locationSize*ze*we,ve)}}else if(Y!==void 0){const X=Y[Z];if(X!==void 0)switch(X.length){case 2:s.vertexAttrib2fv(le.location,X);break;case 3:s.vertexAttrib3fv(le.location,X);break;case 4:s.vertexAttrib4fv(le.location,X);break;default:s.vertexAttrib1fv(le.location,X)}}}}R()}function M(){$();for(const C in a){const O=a[C];for(const z in O){const W=O[z];for(const V in W)g(W[V].object),delete W[V];delete O[z]}delete a[C]}}function T(C){if(a[C.id]===void 0)return;const O=a[C.id];for(const z in O){const W=O[z];for(const V in W)g(W[V].object),delete W[V];delete O[z]}delete a[C.id]}function k(C){for(const O in a){const z=a[O];if(z[C.id]===void 0)continue;const W=z[C.id];for(const V in W)g(W[V].object),delete W[V];delete z[C.id]}}function $(){ie(),u=!0,c!==l&&(c=l,m(c.object))}function ie(){l.geometry=null,l.program=null,l.wireframe=!1}return{setup:h,reset:$,resetDefaultState:ie,dispose:M,releaseStatesOfGeometry:T,releaseStatesOfProgram:k,initAttributes:x,enableAttribute:A,disableUnusedAttributes:R}}function yl(s,e,t,i){const n=i.isWebGL2;let r;function o(u){r=u}function a(u,h){s.drawArrays(r,u,h),t.update(h,r,1)}function l(u,h,f){if(f===0)return;let m,g;if(n)m=s,g="drawArraysInstanced";else if(m=e.get("ANGLE_instanced_arrays"),g="drawArraysInstancedANGLE",m===null){console.error("THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}m[g](r,u,h,f),t.update(h,r,f)}function c(u,h,f){if(f===0)return;const m=e.get("WEBGL_multi_draw");if(m===null)for(let g=0;g<f;g++)this.render(u[g],h[g]);else{m.multiDrawArraysWEBGL(r,u,0,h,0,f);let g=0;for(let _=0;_<f;_++)g+=h[_];t.update(g,r,1)}}this.setMode=o,this.render=a,this.renderInstances=l,this.renderMultiDraw=c}function El(s,e,t){let i;function n(){if(i!==void 0)return i;if(e.has("EXT_texture_filter_anisotropic")===!0){const w=e.get("EXT_texture_filter_anisotropic");i=s.getParameter(w.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function r(w){if(w==="highp"){if(s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.HIGH_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.HIGH_FLOAT).precision>0)return"highp";w="mediump"}return w==="mediump"&&s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.MEDIUM_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}const o=typeof WebGL2RenderingContext<"u"&&s.constructor.name==="WebGL2RenderingContext";let a=t.precision!==void 0?t.precision:"highp";const l=r(a);l!==a&&(console.warn("THREE.WebGLRenderer:",a,"not supported, using",l,"instead."),a=l);const c=o||e.has("WEBGL_draw_buffers"),u=t.logarithmicDepthBuffer===!0,h=s.getParameter(s.MAX_TEXTURE_IMAGE_UNITS),f=s.getParameter(s.MAX_VERTEX_TEXTURE_IMAGE_UNITS),m=s.getParameter(s.MAX_TEXTURE_SIZE),g=s.getParameter(s.MAX_CUBE_MAP_TEXTURE_SIZE),_=s.getParameter(s.MAX_VERTEX_ATTRIBS),p=s.getParameter(s.MAX_VERTEX_UNIFORM_VECTORS),d=s.getParameter(s.MAX_VARYING_VECTORS),E=s.getParameter(s.MAX_FRAGMENT_UNIFORM_VECTORS),x=f>0,A=o||e.has("OES_texture_float"),P=x&&A,R=o?s.getParameter(s.MAX_SAMPLES):0;return{isWebGL2:o,drawBuffers:c,getMaxAnisotropy:n,getMaxPrecision:r,precision:a,logarithmicDepthBuffer:u,maxTextures:h,maxVertexTextures:f,maxTextureSize:m,maxCubemapSize:g,maxAttributes:_,maxVertexUniforms:p,maxVaryings:d,maxFragmentUniforms:E,vertexTextures:x,floatFragmentTextures:A,floatVertexTextures:P,maxSamples:R}}function Tl(s){const e=this;let t=null,i=0,n=!1,r=!1;const o=new on,a=new Oe,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(h,f){const m=h.length!==0||f||i!==0||n;return n=f,i=h.length,m},this.beginShadows=function(){r=!0,u(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(h,f){t=u(h,f,0)},this.setState=function(h,f,m){const g=h.clippingPlanes,_=h.clipIntersection,p=h.clipShadows,d=s.get(h);if(!n||g===null||g.length===0||r&&!p)r?u(null):c();else{const E=r?0:i,x=E*4;let A=d.clippingState||null;l.value=A,A=u(g,f,x,m);for(let P=0;P!==x;++P)A[P]=t[P];d.clippingState=A,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=E}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function u(h,f,m,g){const _=h!==null?h.length:0;let p=null;if(_!==0){if(p=l.value,g!==!0||p===null){const d=m+_*4,E=f.matrixWorldInverse;a.getNormalMatrix(E),(p===null||p.length<d)&&(p=new Float32Array(d));for(let x=0,A=m;x!==_;++x,A+=4)o.copy(h[x]).applyMatrix4(E,a),o.normal.toArray(p,A),p[A+3]=o.constant}l.value=p,l.needsUpdate=!0}return e.numPlanes=_,e.numIntersection=0,p}}function bl(s){let e=new WeakMap;function t(o,a){return a===303?o.mapping=301:a===304&&(o.mapping=302),o}function i(o){if(o&&o.isTexture){const a=o.mapping;if(a===303||a===304)if(e.has(o)){const l=e.get(o).texture;return t(l,o.mapping)}else{const l=o.image;if(l&&l.height>0){const c=new ga(l.height/2);return c.fromEquirectangularTexture(s,o),e.set(o,c),o.addEventListener("dispose",n),t(c.texture,o.mapping)}else return null}}return o}function n(o){const a=o.target;a.removeEventListener("dispose",n);const l=e.get(a);l!==void 0&&(e.delete(a),l.dispose())}function r(){e=new WeakMap}return{get:i,dispose:r}}class er extends js{constructor(e=-1,t=1,i=1,n=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=n,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,n,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=n,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,n=(this.top+this.bottom)/2;let r=i-e,o=i+e,a=n+t,l=n-t;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,o=r+c*this.view.width,a-=u*this.view.offsetY,l=a-u*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}const Ln=4,tr=[.125,.215,.35,.446,.526,.582],cn=20,rs=new er,nr=new He;let as=null,os=0,ls=0;const un=(1+Math.sqrt(5))/2,Pn=1/un,ir=[new D(1,1,1),new D(-1,1,1),new D(1,1,-1),new D(-1,1,-1),new D(0,un,Pn),new D(0,un,-Pn),new D(Pn,0,un),new D(-Pn,0,un),new D(un,Pn,0),new D(-un,Pn,0)];class sr{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,i=.1,n=100){as=this._renderer.getRenderTarget(),os=this._renderer.getActiveCubeFace(),ls=this._renderer.getActiveMipmapLevel(),this._setSize(256);const r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(e,i,n,r),t>0&&this._blur(r,0,0,t),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=or(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=ar(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(as,os,ls),e.scissorTest=!1,Ai(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===301||e.mapping===302?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),as=this._renderer.getRenderTarget(),os=this._renderer.getActiveCubeFace(),ls=this._renderer.getActiveMipmapLevel();const i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:1006,minFilter:1006,generateMipmaps:!1,type:1016,format:1023,colorSpace:Ht,depthBuffer:!1},n=rr(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=rr(e,t,i);const{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Al(r)),this._blurMaterial=wl(r,e,t)}return n}_compileMaterial(e){const t=new Yt(this._lodPlanes[0],e);this._renderer.compile(t,rs)}_sceneToCubeUV(e,t,i,n){const a=new Nt(90,1,t,i),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],u=this._renderer,h=u.autoClear,f=u.toneMapping;u.getClearColor(nr),u.toneMapping=0,u.autoClear=!1;const m=new es({name:"PMREM.Background",side:1,depthWrite:!1,depthTest:!1}),g=new Yt(new qn,m);let _=!1;const p=e.background;p?p.isColor&&(m.color.copy(p),e.background=null,_=!0):(m.color.copy(nr),_=!0);for(let d=0;d<6;d++){const E=d%3;E===0?(a.up.set(0,l[d],0),a.lookAt(c[d],0,0)):E===1?(a.up.set(0,0,l[d]),a.lookAt(0,c[d],0)):(a.up.set(0,l[d],0),a.lookAt(0,0,c[d]));const x=this._cubeSize;Ai(n,E*x,d>2?x:0,x,x),u.setRenderTarget(n),_&&u.render(g,a),u.render(e,a)}g.geometry.dispose(),g.material.dispose(),u.toneMapping=f,u.autoClear=h,e.background=p}_textureToCubeUV(e,t){const i=this._renderer,n=e.mapping===301||e.mapping===302;n?(this._cubemapMaterial===null&&(this._cubemapMaterial=or()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=ar());const r=n?this._cubemapMaterial:this._equirectMaterial,o=new Yt(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=e;const l=this._cubeSize;Ai(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(o,rs)}_applyPMREM(e){const t=this._renderer,i=t.autoClear;t.autoClear=!1;for(let n=1;n<this._lodPlanes.length;n++){const r=Math.sqrt(this._sigmas[n]*this._sigmas[n]-this._sigmas[n-1]*this._sigmas[n-1]),o=ir[(n-1)%ir.length];this._blur(e,n-1,n,r,o)}t.autoClear=i}_blur(e,t,i,n,r){const o=this._pingPongRenderTarget;this._halfBlur(e,o,t,i,n,"latitudinal",r),this._halfBlur(o,e,i,i,n,"longitudinal",r)}_halfBlur(e,t,i,n,r,o,a){const l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const u=3,h=new Yt(this._lodPlanes[n],c),f=c.uniforms,m=this._sizeLods[i]-1,g=isFinite(r)?Math.PI/(2*m):2*Math.PI/(2*cn-1),_=r/g,p=isFinite(r)?1+Math.floor(u*_):cn;p>cn&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${p} samples when the maximum is set to ${cn}`);const d=[];let E=0;for(let w=0;w<cn;++w){const q=w/_,M=Math.exp(-q*q/2);d.push(M),w===0?E+=M:w<p&&(E+=2*M)}for(let w=0;w<d.length;w++)d[w]=d[w]/E;f.envMap.value=e.texture,f.samples.value=p,f.weights.value=d,f.latitudinal.value=o==="latitudinal",a&&(f.poleAxis.value=a);const{_lodMax:x}=this;f.dTheta.value=g,f.mipInt.value=x-i;const A=this._sizeLods[n],P=3*A*(n>x-Ln?n-x+Ln:0),R=4*(this._cubeSize-A);Ai(t,P,R,3*A,2*A),l.setRenderTarget(t),l.render(h,rs)}}function Al(s){const e=[],t=[],i=[];let n=s;const r=s-Ln+1+tr.length;for(let o=0;o<r;o++){const a=Math.pow(2,n);t.push(a);let l=1/a;o>s-Ln?l=tr[o-s+Ln-1]:o===0&&(l=0),i.push(l);const c=1/(a-2),u=-c,h=1+c,f=[u,u,h,u,h,h,u,u,h,h,u,h],m=6,g=6,_=3,p=2,d=1,E=new Float32Array(_*g*m),x=new Float32Array(p*g*m),A=new Float32Array(d*g*m);for(let R=0;R<m;R++){const w=R%3*2/3-1,q=R>2?0:-1,M=[w,q,0,w+2/3,q,0,w+2/3,q+1,0,w,q,0,w+2/3,q+1,0,w,q+1,0];E.set(M,_*g*R),x.set(f,p*g*R);const T=[R,R,R,R,R,R];A.set(T,d*g*R)}const P=new kt;P.setAttribute("position",new Rt(E,_)),P.setAttribute("uv",new Rt(x,p)),P.setAttribute("faceIndex",new Rt(A,d)),e.push(P),n>Ln&&n--}return{lodPlanes:e,sizeLods:t,sigmas:i}}function rr(s,e,t){const i=new tn(s,e,t);return i.texture.mapping=306,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Ai(s,e,t,i,n){s.viewport.set(e,t,i,n),s.scissor.set(e,t,i,n)}function wl(s,e,t){const i=new Float32Array(cn),n=new D(0,1,0);return new an({name:"SphericalGaussianBlur",defines:{n:cn,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${s}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:n}},vertexShader:cs(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function ar(){return new an({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:cs(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function or(){return new an({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:cs(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function cs(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function Rl(s){let e=new WeakMap,t=null;function i(a){if(a&&a.isTexture){const l=a.mapping,c=l===303||l===304,u=l===301||l===302;if(c||u)if(a.isRenderTargetTexture&&a.needsPMREMUpdate===!0){a.needsPMREMUpdate=!1;let h=e.get(a);return t===null&&(t=new sr(s)),h=c?t.fromEquirectangular(a,h):t.fromCubemap(a,h),e.set(a,h),h.texture}else{if(e.has(a))return e.get(a).texture;{const h=a.image;if(c&&h&&h.height>0||u&&h&&n(h)){t===null&&(t=new sr(s));const f=c?t.fromEquirectangular(a):t.fromCubemap(a);return e.set(a,f),a.addEventListener("dispose",r),f.texture}else return null}}}return a}function n(a){let l=0;const c=6;for(let u=0;u<c;u++)a[u]!==void 0&&l++;return l===c}function r(a){const l=a.target;l.removeEventListener("dispose",r);const c=e.get(l);c!==void 0&&(e.delete(l),c.dispose())}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:i,dispose:o}}function Cl(s){const e={};function t(i){if(e[i]!==void 0)return e[i];let n;switch(i){case"WEBGL_depth_texture":n=s.getExtension("WEBGL_depth_texture")||s.getExtension("MOZ_WEBGL_depth_texture")||s.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":n=s.getExtension("EXT_texture_filter_anisotropic")||s.getExtension("MOZ_EXT_texture_filter_anisotropic")||s.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":n=s.getExtension("WEBGL_compressed_texture_s3tc")||s.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||s.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":n=s.getExtension("WEBGL_compressed_texture_pvrtc")||s.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:n=s.getExtension(i)}return e[i]=n,n}return{has:function(i){return t(i)!==null},init:function(i){i.isWebGL2?(t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance")):(t("WEBGL_depth_texture"),t("OES_texture_float"),t("OES_texture_half_float"),t("OES_texture_half_float_linear"),t("OES_standard_derivatives"),t("OES_element_index_uint"),t("OES_vertex_array_object"),t("ANGLE_instanced_arrays")),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture")},get:function(i){const n=t(i);return n===null&&console.warn("THREE.WebGLRenderer: "+i+" extension not supported."),n}}}function Ll(s,e,t,i){const n={},r=new WeakMap;function o(h){const f=h.target;f.index!==null&&e.remove(f.index);for(const g in f.attributes)e.remove(f.attributes[g]);for(const g in f.morphAttributes){const _=f.morphAttributes[g];for(let p=0,d=_.length;p<d;p++)e.remove(_[p])}f.removeEventListener("dispose",o),delete n[f.id];const m=r.get(f);m&&(e.remove(m),r.delete(f)),i.releaseStatesOfGeometry(f),f.isInstancedBufferGeometry===!0&&delete f._maxInstanceCount,t.memory.geometries--}function a(h,f){return n[f.id]===!0||(f.addEventListener("dispose",o),n[f.id]=!0,t.memory.geometries++),f}function l(h){const f=h.attributes;for(const g in f)e.update(f[g],s.ARRAY_BUFFER);const m=h.morphAttributes;for(const g in m){const _=m[g];for(let p=0,d=_.length;p<d;p++)e.update(_[p],s.ARRAY_BUFFER)}}function c(h){const f=[],m=h.index,g=h.attributes.position;let _=0;if(m!==null){const E=m.array;_=m.version;for(let x=0,A=E.length;x<A;x+=3){const P=E[x+0],R=E[x+1],w=E[x+2];f.push(P,R,R,w,w,P)}}else if(g!==void 0){const E=g.array;_=g.version;for(let x=0,A=E.length/3-1;x<A;x+=3){const P=x+0,R=x+1,w=x+2;f.push(P,R,R,w,w,P)}}else return;const p=new(Ts(f)?Vs:Hs)(f,1);p.version=_;const d=r.get(h);d&&e.remove(d),r.set(h,p)}function u(h){const f=r.get(h);if(f){const m=h.index;m!==null&&f.version<m.version&&c(h)}else c(h);return r.get(h)}return{get:a,update:l,getWireframeAttribute:u}}function Pl(s,e,t,i){const n=i.isWebGL2;let r;function o(m){r=m}let a,l;function c(m){a=m.type,l=m.bytesPerElement}function u(m,g){s.drawElements(r,g,a,m*l),t.update(g,r,1)}function h(m,g,_){if(_===0)return;let p,d;if(n)p=s,d="drawElementsInstanced";else if(p=e.get("ANGLE_instanced_arrays"),d="drawElementsInstancedANGLE",p===null){console.error("THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}p[d](r,g,a,m*l,_),t.update(g,r,_)}function f(m,g,_){if(_===0)return;const p=e.get("WEBGL_multi_draw");if(p===null)for(let d=0;d<_;d++)this.render(m[d]/l,g[d]);else{p.multiDrawElementsWEBGL(r,g,0,a,m,0,_);let d=0;for(let E=0;E<_;E++)d+=g[E];t.update(d,r,1)}}this.setMode=o,this.setIndex=c,this.render=u,this.renderInstances=h,this.renderMultiDraw=f}function Dl(s){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(r,o,a){switch(t.calls++,o){case s.TRIANGLES:t.triangles+=a*(r/3);break;case s.LINES:t.lines+=a*(r/2);break;case s.LINE_STRIP:t.lines+=a*(r-1);break;case s.LINE_LOOP:t.lines+=a*r;break;case s.POINTS:t.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function n(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:n,update:i}}function Il(s,e){return s[0]-e[0]}function Ul(s,e){return Math.abs(e[1])-Math.abs(s[1])}function Fl(s,e,t){const i={},n=new Float32Array(8),r=new WeakMap,o=new dt,a=[];for(let c=0;c<8;c++)a[c]=[c,0];function l(c,u,h){const f=c.morphTargetInfluences;if(e.isWebGL2===!0){const m=u.morphAttributes.position||u.morphAttributes.normal||u.morphAttributes.color,g=m!==void 0?m.length:0;let _=r.get(u);if(_===void 0||_.count!==g){let C=function(){$.dispose(),r.delete(u),u.removeEventListener("dispose",C)};_!==void 0&&_.texture.dispose();const E=u.morphAttributes.position!==void 0,x=u.morphAttributes.normal!==void 0,A=u.morphAttributes.color!==void 0,P=u.morphAttributes.position||[],R=u.morphAttributes.normal||[],w=u.morphAttributes.color||[];let q=0;E===!0&&(q=1),x===!0&&(q=2),A===!0&&(q=3);let M=u.attributes.position.count*q,T=1;M>e.maxTextureSize&&(T=Math.ceil(M/e.maxTextureSize),M=e.maxTextureSize);const k=new Float32Array(M*T*4*g),$=new Ls(k,M,T,g);$.type=1015,$.needsUpdate=!0;const ie=q*4;for(let O=0;O<g;O++){const z=P[O],W=R[O],V=w[O],H=M*T*4*O;for(let Y=0;Y<z.count;Y++){const Z=Y*ie;E===!0&&(o.fromBufferAttribute(z,Y),k[H+Z+0]=o.x,k[H+Z+1]=o.y,k[H+Z+2]=o.z,k[H+Z+3]=0),x===!0&&(o.fromBufferAttribute(W,Y),k[H+Z+4]=o.x,k[H+Z+5]=o.y,k[H+Z+6]=o.z,k[H+Z+7]=0),A===!0&&(o.fromBufferAttribute(V,Y),k[H+Z+8]=o.x,k[H+Z+9]=o.y,k[H+Z+10]=o.z,k[H+Z+11]=V.itemSize===4?o.w:1)}}_={count:g,texture:$,size:new We(M,T)},r.set(u,_),u.addEventListener("dispose",C)}let p=0;for(let E=0;E<f.length;E++)p+=f[E];const d=u.morphTargetsRelative?1:1-p;h.getUniforms().setValue(s,"morphTargetBaseInfluence",d),h.getUniforms().setValue(s,"morphTargetInfluences",f),h.getUniforms().setValue(s,"morphTargetsTexture",_.texture,t),h.getUniforms().setValue(s,"morphTargetsTextureSize",_.size)}else{const m=f===void 0?0:f.length;let g=i[u.id];if(g===void 0||g.length!==m){g=[];for(let x=0;x<m;x++)g[x]=[x,0];i[u.id]=g}for(let x=0;x<m;x++){const A=g[x];A[0]=x,A[1]=f[x]}g.sort(Ul);for(let x=0;x<8;x++)x<m&&g[x][1]?(a[x][0]=g[x][0],a[x][1]=g[x][1]):(a[x][0]=Number.MAX_SAFE_INTEGER,a[x][1]=0);a.sort(Il);const _=u.morphAttributes.position,p=u.morphAttributes.normal;let d=0;for(let x=0;x<8;x++){const A=a[x],P=A[0],R=A[1];P!==Number.MAX_SAFE_INTEGER&&R?(_&&u.getAttribute("morphTarget"+x)!==_[P]&&u.setAttribute("morphTarget"+x,_[P]),p&&u.getAttribute("morphNormal"+x)!==p[P]&&u.setAttribute("morphNormal"+x,p[P]),n[x]=R,d+=R):(_&&u.hasAttribute("morphTarget"+x)===!0&&u.deleteAttribute("morphTarget"+x),p&&u.hasAttribute("morphNormal"+x)===!0&&u.deleteAttribute("morphNormal"+x),n[x]=0)}const E=u.morphTargetsRelative?1:1-d;h.getUniforms().setValue(s,"morphTargetBaseInfluence",E),h.getUniforms().setValue(s,"morphTargetInfluences",n)}}return{update:l}}function Nl(s,e,t,i){let n=new WeakMap;function r(l){const c=i.render.frame,u=l.geometry,h=e.get(l,u);if(n.get(h)!==c&&(e.update(h),n.set(h,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),n.get(l)!==c&&(t.update(l.instanceMatrix,s.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,s.ARRAY_BUFFER),n.set(l,c))),l.isSkinnedMesh){const f=l.skeleton;n.get(f)!==c&&(f.update(),n.set(f,c))}return h}function o(){n=new WeakMap}function a(l){const c=l.target;c.removeEventListener("dispose",a),t.remove(c.instanceMatrix),c.instanceColor!==null&&t.remove(c.instanceColor)}return{update:r,dispose:o}}class lr extends Et{constructor(e,t,i,n,r,o,a,l,c,u){if(u=u!==void 0?u:1026,u!==1026&&u!==1027)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");i===void 0&&u===1026&&(i=1014),i===void 0&&u===1027&&(i=1020),super(null,n,r,o,a,l,u,i,c),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=a!==void 0?a:1003,this.minFilter=l!==void 0?l:1003,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}const cr=new Et,ur=new lr(1,1);ur.compareFunction=515;const dr=new Ls,hr=new Qr,fr=new Zs,pr=[],mr=[],gr=new Float32Array(16),_r=new Float32Array(9),vr=new Float32Array(4);function Dn(s,e,t){const i=s[0];if(i<=0||i>0)return s;const n=e*t;let r=pr[n];if(r===void 0&&(r=new Float32Array(n),pr[n]=r),e!==0){i.toArray(r,0);for(let o=1,a=0;o!==e;++o)a+=t,s[o].toArray(r,a)}return r}function st(s,e){if(s.length!==e.length)return!1;for(let t=0,i=s.length;t<i;t++)if(s[t]!==e[t])return!1;return!0}function rt(s,e){for(let t=0,i=e.length;t<i;t++)s[t]=e[t]}function wi(s,e){let t=mr[e];t===void 0&&(t=new Int32Array(e),mr[e]=t);for(let i=0;i!==e;++i)t[i]=s.allocateTextureUnit();return t}function Ol(s,e){const t=this.cache;t[0]!==e&&(s.uniform1f(this.addr,e),t[0]=e)}function Bl(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(st(t,e))return;s.uniform2fv(this.addr,e),rt(t,e)}}function kl(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(s.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(st(t,e))return;s.uniform3fv(this.addr,e),rt(t,e)}}function Gl(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(st(t,e))return;s.uniform4fv(this.addr,e),rt(t,e)}}function zl(s,e){const t=this.cache,i=e.elements;if(i===void 0){if(st(t,e))return;s.uniformMatrix2fv(this.addr,!1,e),rt(t,e)}else{if(st(t,i))return;vr.set(i),s.uniformMatrix2fv(this.addr,!1,vr),rt(t,i)}}function Hl(s,e){const t=this.cache,i=e.elements;if(i===void 0){if(st(t,e))return;s.uniformMatrix3fv(this.addr,!1,e),rt(t,e)}else{if(st(t,i))return;_r.set(i),s.uniformMatrix3fv(this.addr,!1,_r),rt(t,i)}}function Vl(s,e){const t=this.cache,i=e.elements;if(i===void 0){if(st(t,e))return;s.uniformMatrix4fv(this.addr,!1,e),rt(t,e)}else{if(st(t,i))return;gr.set(i),s.uniformMatrix4fv(this.addr,!1,gr),rt(t,i)}}function Wl(s,e){const t=this.cache;t[0]!==e&&(s.uniform1i(this.addr,e),t[0]=e)}function Xl(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(st(t,e))return;s.uniform2iv(this.addr,e),rt(t,e)}}function ql(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(st(t,e))return;s.uniform3iv(this.addr,e),rt(t,e)}}function $l(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(st(t,e))return;s.uniform4iv(this.addr,e),rt(t,e)}}function Yl(s,e){const t=this.cache;t[0]!==e&&(s.uniform1ui(this.addr,e),t[0]=e)}function Kl(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(st(t,e))return;s.uniform2uiv(this.addr,e),rt(t,e)}}function jl(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(st(t,e))return;s.uniform3uiv(this.addr,e),rt(t,e)}}function Zl(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(st(t,e))return;s.uniform4uiv(this.addr,e),rt(t,e)}}function Jl(s,e,t){const i=this.cache,n=t.allocateTextureUnit();i[0]!==n&&(s.uniform1i(this.addr,n),i[0]=n);const r=this.type===s.SAMPLER_2D_SHADOW?ur:cr;t.setTexture2D(e||r,n)}function Ql(s,e,t){const i=this.cache,n=t.allocateTextureUnit();i[0]!==n&&(s.uniform1i(this.addr,n),i[0]=n),t.setTexture3D(e||hr,n)}function ec(s,e,t){const i=this.cache,n=t.allocateTextureUnit();i[0]!==n&&(s.uniform1i(this.addr,n),i[0]=n),t.setTextureCube(e||fr,n)}function tc(s,e,t){const i=this.cache,n=t.allocateTextureUnit();i[0]!==n&&(s.uniform1i(this.addr,n),i[0]=n),t.setTexture2DArray(e||dr,n)}function nc(s){switch(s){case 5126:return Ol;case 35664:return Bl;case 35665:return kl;case 35666:return Gl;case 35674:return zl;case 35675:return Hl;case 35676:return Vl;case 5124:case 35670:return Wl;case 35667:case 35671:return Xl;case 35668:case 35672:return ql;case 35669:case 35673:return $l;case 5125:return Yl;case 36294:return Kl;case 36295:return jl;case 36296:return Zl;case 35678:case 36198:case 36298:case 36306:case 35682:return Jl;case 35679:case 36299:case 36307:return Ql;case 35680:case 36300:case 36308:case 36293:return ec;case 36289:case 36303:case 36311:case 36292:return tc}}function ic(s,e){s.uniform1fv(this.addr,e)}function sc(s,e){const t=Dn(e,this.size,2);s.uniform2fv(this.addr,t)}function rc(s,e){const t=Dn(e,this.size,3);s.uniform3fv(this.addr,t)}function ac(s,e){const t=Dn(e,this.size,4);s.uniform4fv(this.addr,t)}function oc(s,e){const t=Dn(e,this.size,4);s.uniformMatrix2fv(this.addr,!1,t)}function lc(s,e){const t=Dn(e,this.size,9);s.uniformMatrix3fv(this.addr,!1,t)}function cc(s,e){const t=Dn(e,this.size,16);s.uniformMatrix4fv(this.addr,!1,t)}function uc(s,e){s.uniform1iv(this.addr,e)}function dc(s,e){s.uniform2iv(this.addr,e)}function hc(s,e){s.uniform3iv(this.addr,e)}function fc(s,e){s.uniform4iv(this.addr,e)}function pc(s,e){s.uniform1uiv(this.addr,e)}function mc(s,e){s.uniform2uiv(this.addr,e)}function gc(s,e){s.uniform3uiv(this.addr,e)}function _c(s,e){s.uniform4uiv(this.addr,e)}function vc(s,e,t){const i=this.cache,n=e.length,r=wi(t,n);st(i,r)||(s.uniform1iv(this.addr,r),rt(i,r));for(let o=0;o!==n;++o)t.setTexture2D(e[o]||cr,r[o])}function xc(s,e,t){const i=this.cache,n=e.length,r=wi(t,n);st(i,r)||(s.uniform1iv(this.addr,r),rt(i,r));for(let o=0;o!==n;++o)t.setTexture3D(e[o]||hr,r[o])}function Sc(s,e,t){const i=this.cache,n=e.length,r=wi(t,n);st(i,r)||(s.uniform1iv(this.addr,r),rt(i,r));for(let o=0;o!==n;++o)t.setTextureCube(e[o]||fr,r[o])}function Mc(s,e,t){const i=this.cache,n=e.length,r=wi(t,n);st(i,r)||(s.uniform1iv(this.addr,r),rt(i,r));for(let o=0;o!==n;++o)t.setTexture2DArray(e[o]||dr,r[o])}function yc(s){switch(s){case 5126:return ic;case 35664:return sc;case 35665:return rc;case 35666:return ac;case 35674:return oc;case 35675:return lc;case 35676:return cc;case 5124:case 35670:return uc;case 35667:case 35671:return dc;case 35668:case 35672:return hc;case 35669:case 35673:return fc;case 5125:return pc;case 36294:return mc;case 36295:return gc;case 36296:return _c;case 35678:case 36198:case 36298:case 36306:case 35682:return vc;case 35679:case 36299:case 36307:return xc;case 35680:case 36300:case 36308:case 36293:return Sc;case 36289:case 36303:case 36311:case 36292:return Mc}}class Ec{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=nc(t.type)}}class Tc{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=yc(t.type)}}class bc{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){const n=this.seq;for(let r=0,o=n.length;r!==o;++r){const a=n[r];a.setValue(e,t[a.id],i)}}}const us=/(\w+)(\])?(\[|\.)?/g;function xr(s,e){s.seq.push(e),s.map[e.id]=e}function Ac(s,e,t){const i=s.name,n=i.length;for(us.lastIndex=0;;){const r=us.exec(i),o=us.lastIndex;let a=r[1];const l=r[2]==="]",c=r[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===n){xr(t,c===void 0?new Ec(a,s,e):new Tc(a,s,e));break}else{let h=t.map[a];h===void 0&&(h=new bc(a),xr(t,h)),t=h}}}class Ri{constructor(e,t){this.seq=[],this.map={};const i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let n=0;n<i;++n){const r=e.getActiveUniform(t,n),o=e.getUniformLocation(t,r.name);Ac(r,o,this)}}setValue(e,t,i,n){const r=this.map[t];r!==void 0&&r.setValue(e,i,n)}setOptional(e,t,i){const n=t[i];n!==void 0&&this.setValue(e,i,n)}static upload(e,t,i,n){for(let r=0,o=t.length;r!==o;++r){const a=t[r],l=i[a.id];l.needsUpdate!==!1&&a.setValue(e,l.value,n)}}static seqWithValue(e,t){const i=[];for(let n=0,r=e.length;n!==r;++n){const o=e[n];o.id in t&&i.push(o)}return i}}function Sr(s,e,t){const i=s.createShader(e);return s.shaderSource(i,t),s.compileShader(i),i}const wc=37297;let Rc=0;function Cc(s,e){const t=s.split(`
`),i=[],n=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let o=n;o<r;o++){const a=o+1;i.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return i.join(`
`)}function Lc(s){const e=Xe.getPrimaries(Xe.workingColorSpace),t=Xe.getPrimaries(s);let i;switch(e===t?i="":e===ti&&t===ei?i="LinearDisplayP3ToLinearSRGB":e===ei&&t===ti&&(i="LinearSRGBToLinearDisplayP3"),s){case Ht:case Jn:return[i,"LinearTransferOETF"];case ut:case Fi:return[i,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",s),[i,"LinearTransferOETF"]}}function Mr(s,e,t){const i=s.getShaderParameter(e,s.COMPILE_STATUS),n=s.getShaderInfoLog(e).trim();if(i&&n==="")return"";const r=/ERROR: 0:(\d+)/.exec(n);if(r){const o=parseInt(r[1]);return t.toUpperCase()+`

`+n+`

`+Cc(s.getShaderSource(e),o)}else return n}function Pc(s,e){const t=Lc(e);return`vec4 ${s}( vec4 value ) { return ${t[0]}( ${t[1]}( value ) ); }`}function Dc(s,e){let t;switch(e){case 1:t="Linear";break;case 2:t="Reinhard";break;case 3:t="OptimizedCineon";break;case 4:t="ACESFilmic";break;case 6:t="AgX";break;case 5:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+s+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}function Ic(s){return[s.extensionDerivatives||s.envMapCubeUVHeight||s.bumpMap||s.normalMapTangentSpace||s.clearcoatNormalMap||s.flatShading||s.shaderID==="physical"?"#extension GL_OES_standard_derivatives : enable":"",(s.extensionFragDepth||s.logarithmicDepthBuffer)&&s.rendererExtensionFragDepth?"#extension GL_EXT_frag_depth : enable":"",s.extensionDrawBuffers&&s.rendererExtensionDrawBuffers?"#extension GL_EXT_draw_buffers : require":"",(s.extensionShaderTextureLOD||s.envMap||s.transmission)&&s.rendererExtensionShaderTextureLod?"#extension GL_EXT_shader_texture_lod : enable":""].filter(In).join(`
`)}function Uc(s){return[s.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":""].filter(In).join(`
`)}function Fc(s){const e=[];for(const t in s){const i=s[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function Nc(s,e){const t={},i=s.getProgramParameter(e,s.ACTIVE_ATTRIBUTES);for(let n=0;n<i;n++){const r=s.getActiveAttrib(e,n),o=r.name;let a=1;r.type===s.FLOAT_MAT2&&(a=2),r.type===s.FLOAT_MAT3&&(a=3),r.type===s.FLOAT_MAT4&&(a=4),t[o]={type:r.type,location:s.getAttribLocation(e,o),locationSize:a}}return t}function In(s){return s!==""}function yr(s,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return s.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Er(s,e){return s.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const Oc=/^[ \t]*#include +<([\w\d./]+)>/gm;function ds(s){return s.replace(Oc,kc)}const Bc=new Map([["encodings_fragment","colorspace_fragment"],["encodings_pars_fragment","colorspace_pars_fragment"],["output_fragment","opaque_fragment"]]);function kc(s,e){let t=De[e];if(t===void 0){const i=Bc.get(e);if(i!==void 0)t=De[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("Can not resolve #include <"+e+">")}return ds(t)}const Gc=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Tr(s){return s.replace(Gc,zc)}function zc(s,e,t,i){let n="";for(let r=parseInt(e);r<parseInt(t);r++)n+=i.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return n}function br(s){let e="precision "+s.precision+` float;
precision `+s.precision+" int;";return s.precision==="highp"?e+=`
#define HIGH_PRECISION`:s.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:s.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function Hc(s){let e="SHADOWMAP_TYPE_BASIC";return s.shadowMapType===1?e="SHADOWMAP_TYPE_PCF":s.shadowMapType===2?e="SHADOWMAP_TYPE_PCF_SOFT":s.shadowMapType===3&&(e="SHADOWMAP_TYPE_VSM"),e}function Vc(s){let e="ENVMAP_TYPE_CUBE";if(s.envMap)switch(s.envMapMode){case 301:case 302:e="ENVMAP_TYPE_CUBE";break;case 306:e="ENVMAP_TYPE_CUBE_UV";break}return e}function Wc(s){let e="ENVMAP_MODE_REFLECTION";if(s.envMap)switch(s.envMapMode){case 302:e="ENVMAP_MODE_REFRACTION";break}return e}function Xc(s){let e="ENVMAP_BLENDING_NONE";if(s.envMap)switch(s.combine){case 0:e="ENVMAP_BLENDING_MULTIPLY";break;case 1:e="ENVMAP_BLENDING_MIX";break;case 2:e="ENVMAP_BLENDING_ADD";break}return e}function qc(s){const e=s.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),7*16)),texelHeight:i,maxMip:t}}function $c(s,e,t,i){const n=s.getContext(),r=t.defines;let o=t.vertexShader,a=t.fragmentShader;const l=Hc(t),c=Vc(t),u=Wc(t),h=Xc(t),f=qc(t),m=t.isWebGL2?"":Ic(t),g=Uc(t),_=Fc(r),p=n.createProgram();let d,E,x=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(d=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(In).join(`
`),d.length>0&&(d+=`
`),E=[m,"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(In).join(`
`),E.length>0&&(E+=`
`)):(d=[br(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors&&t.isWebGL2?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.useLegacyLights?"#define LEGACY_LIGHTS":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#if ( defined( USE_MORPHTARGETS ) && ! defined( MORPHTARGETS_TEXTURE ) )","	attribute vec3 morphTarget0;","	attribute vec3 morphTarget1;","	attribute vec3 morphTarget2;","	attribute vec3 morphTarget3;","	#ifdef USE_MORPHNORMALS","		attribute vec3 morphNormal0;","		attribute vec3 morphNormal1;","		attribute vec3 morphNormal2;","		attribute vec3 morphNormal3;","	#else","		attribute vec3 morphTarget4;","		attribute vec3 morphTarget5;","		attribute vec3 morphTarget6;","		attribute vec3 morphTarget7;","	#endif","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(In).join(`
`),E=[m,br(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+u:"",t.envMap?"#define "+h:"",f?"#define CUBEUV_TEXEL_WIDTH "+f.texelWidth:"",f?"#define CUBEUV_TEXEL_HEIGHT "+f.texelHeight:"",f?"#define CUBEUV_MAX_MIP "+f.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.useLegacyLights?"#define LEGACY_LIGHTS":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==0?"#define TONE_MAPPING":"",t.toneMapping!==0?De.tonemapping_pars_fragment:"",t.toneMapping!==0?Dc("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",De.colorspace_pars_fragment,Pc("linearToOutputTexel",t.outputColorSpace),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(In).join(`
`)),o=ds(o),o=yr(o,t),o=Er(o,t),a=ds(a),a=yr(a,t),a=Er(a,t),o=Tr(o),a=Tr(a),t.isWebGL2&&t.isRawShaderMaterial!==!0&&(x=`#version 300 es
`,d=[g,"precision mediump sampler2DArray;","#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+d,E=["precision mediump sampler2DArray;","#define varying in",t.glslVersion===ys?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===ys?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+E);const A=x+d+o,P=x+E+a,R=Sr(n,n.VERTEX_SHADER,A),w=Sr(n,n.FRAGMENT_SHADER,P);n.attachShader(p,R),n.attachShader(p,w),t.index0AttributeName!==void 0?n.bindAttribLocation(p,0,t.index0AttributeName):t.morphTargets===!0&&n.bindAttribLocation(p,0,"position"),n.linkProgram(p);function q($){if(s.debug.checkShaderErrors){const ie=n.getProgramInfoLog(p).trim(),C=n.getShaderInfoLog(R).trim(),O=n.getShaderInfoLog(w).trim();let z=!0,W=!0;if(n.getProgramParameter(p,n.LINK_STATUS)===!1)if(z=!1,typeof s.debug.onShaderError=="function")s.debug.onShaderError(n,p,R,w);else{const V=Mr(n,R,"vertex"),H=Mr(n,w,"fragment");console.error("THREE.WebGLProgram: Shader Error "+n.getError()+" - VALIDATE_STATUS "+n.getProgramParameter(p,n.VALIDATE_STATUS)+`

Program Info Log: `+ie+`
`+V+`
`+H)}else ie!==""?console.warn("THREE.WebGLProgram: Program Info Log:",ie):(C===""||O==="")&&(W=!1);W&&($.diagnostics={runnable:z,programLog:ie,vertexShader:{log:C,prefix:d},fragmentShader:{log:O,prefix:E}})}n.deleteShader(R),n.deleteShader(w),M=new Ri(n,p),T=Nc(n,p)}let M;this.getUniforms=function(){return M===void 0&&q(this),M};let T;this.getAttributes=function(){return T===void 0&&q(this),T};let k=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return k===!1&&(k=n.getProgramParameter(p,wc)),k},this.destroy=function(){i.releaseStatesOfProgram(this),n.deleteProgram(p),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Rc++,this.cacheKey=e,this.usedTimes=1,this.program=p,this.vertexShader=R,this.fragmentShader=w,this}let Yc=0;class Kc{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const t=e.vertexShader,i=e.fragmentShader,n=this._getShaderStage(t),r=this._getShaderStage(i),o=this._getShaderCacheForMaterial(e);return o.has(n)===!1&&(o.add(n),n.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){const t=this.shaderCache;let i=t.get(e);return i===void 0&&(i=new jc(e),t.set(e,i)),i}}class jc{constructor(e){this.id=Yc++,this.code=e,this.usedTimes=0}}function Zc(s,e,t,i,n,r,o){const a=new Fs,l=new Kc,c=[],u=n.isWebGL2,h=n.logarithmicDepthBuffer,f=n.vertexTextures;let m=n.precision;const g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(M){return M===0?"uv":`uv${M}`}function p(M,T,k,$,ie){const C=$.fog,O=ie.geometry,z=M.isMeshStandardMaterial?$.environment:null,W=(M.isMeshStandardMaterial?t:e).get(M.envMap||z),V=W&&W.mapping===306?W.image.height:null,H=g[M.type];M.precision!==null&&(m=n.getMaxPrecision(M.precision),m!==M.precision&&console.warn("THREE.WebGLProgram.getParameters:",M.precision,"not supported, using",m,"instead."));const Y=O.morphAttributes.position||O.morphAttributes.normal||O.morphAttributes.color,Z=Y!==void 0?Y.length:0;let le=0;O.morphAttributes.position!==void 0&&(le=1),O.morphAttributes.normal!==void 0&&(le=2),O.morphAttributes.color!==void 0&&(le=3);let G,X,ae,de;if(H){const _t=Gt[H];G=_t.vertexShader,X=_t.fragmentShader}else G=M.vertexShader,X=M.fragmentShader,l.update(M),ae=l.getVertexShaderID(M),de=l.getFragmentShaderID(M);const ue=s.getRenderTarget(),xe=ie.isInstancedMesh===!0,we=ie.isBatchedMesh===!0,ve=!!M.map,ze=!!M.matcap,I=!!W,gt=!!M.aoMap,Se=!!M.lightMap,Ce=!!M.bumpMap,pe=!!M.normalMap,Ze=!!M.displacementMap,Ue=!!M.emissiveMap,y=!!M.metalnessMap,v=!!M.roughnessMap,F=M.anisotropy>0,J=M.clearcoat>0,j=M.iridescence>0,Q=M.sheen>0,me=M.transmission>0,oe=F&&!!M.anisotropyMap,he=J&&!!M.clearcoatMap,Ee=J&&!!M.clearcoatNormalMap,Fe=J&&!!M.clearcoatRoughnessMap,K=j&&!!M.iridescenceMap,qe=j&&!!M.iridescenceThicknessMap,Ge=Q&&!!M.sheenColorMap,Re=Q&&!!M.sheenRoughnessMap,_e=!!M.specularMap,fe=!!M.specularColorMap,Ie=!!M.specularIntensityMap,Ve=me&&!!M.transmissionMap,et=me&&!!M.thicknessMap,Be=!!M.gradientMap,ne=!!M.alphaMap,b=M.alphaTest>0,se=!!M.alphaHash,re=!!M.extensions,Te=!!O.attributes.uv1,Me=!!O.attributes.uv2,$e=!!O.attributes.uv3;let Ye=0;return M.toneMapped&&(ue===null||ue.isXRRenderTarget===!0)&&(Ye=s.toneMapping),{isWebGL2:u,shaderID:H,shaderType:M.type,shaderName:M.name,vertexShader:G,fragmentShader:X,defines:M.defines,customVertexShaderID:ae,customFragmentShaderID:de,isRawShaderMaterial:M.isRawShaderMaterial===!0,glslVersion:M.glslVersion,precision:m,batching:we,instancing:xe,instancingColor:xe&&ie.instanceColor!==null,supportsVertexTextures:f,outputColorSpace:ue===null?s.outputColorSpace:ue.isXRRenderTarget===!0?ue.texture.colorSpace:Ht,map:ve,matcap:ze,envMap:I,envMapMode:I&&W.mapping,envMapCubeUVHeight:V,aoMap:gt,lightMap:Se,bumpMap:Ce,normalMap:pe,displacementMap:f&&Ze,emissiveMap:Ue,normalMapObjectSpace:pe&&M.normalMapType===1,normalMapTangentSpace:pe&&M.normalMapType===0,metalnessMap:y,roughnessMap:v,anisotropy:F,anisotropyMap:oe,clearcoat:J,clearcoatMap:he,clearcoatNormalMap:Ee,clearcoatRoughnessMap:Fe,iridescence:j,iridescenceMap:K,iridescenceThicknessMap:qe,sheen:Q,sheenColorMap:Ge,sheenRoughnessMap:Re,specularMap:_e,specularColorMap:fe,specularIntensityMap:Ie,transmission:me,transmissionMap:Ve,thicknessMap:et,gradientMap:Be,opaque:M.transparent===!1&&M.blending===1,alphaMap:ne,alphaTest:b,alphaHash:se,combine:M.combine,mapUv:ve&&_(M.map.channel),aoMapUv:gt&&_(M.aoMap.channel),lightMapUv:Se&&_(M.lightMap.channel),bumpMapUv:Ce&&_(M.bumpMap.channel),normalMapUv:pe&&_(M.normalMap.channel),displacementMapUv:Ze&&_(M.displacementMap.channel),emissiveMapUv:Ue&&_(M.emissiveMap.channel),metalnessMapUv:y&&_(M.metalnessMap.channel),roughnessMapUv:v&&_(M.roughnessMap.channel),anisotropyMapUv:oe&&_(M.anisotropyMap.channel),clearcoatMapUv:he&&_(M.clearcoatMap.channel),clearcoatNormalMapUv:Ee&&_(M.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Fe&&_(M.clearcoatRoughnessMap.channel),iridescenceMapUv:K&&_(M.iridescenceMap.channel),iridescenceThicknessMapUv:qe&&_(M.iridescenceThicknessMap.channel),sheenColorMapUv:Ge&&_(M.sheenColorMap.channel),sheenRoughnessMapUv:Re&&_(M.sheenRoughnessMap.channel),specularMapUv:_e&&_(M.specularMap.channel),specularColorMapUv:fe&&_(M.specularColorMap.channel),specularIntensityMapUv:Ie&&_(M.specularIntensityMap.channel),transmissionMapUv:Ve&&_(M.transmissionMap.channel),thicknessMapUv:et&&_(M.thicknessMap.channel),alphaMapUv:ne&&_(M.alphaMap.channel),vertexTangents:!!O.attributes.tangent&&(pe||F),vertexColors:M.vertexColors,vertexAlphas:M.vertexColors===!0&&!!O.attributes.color&&O.attributes.color.itemSize===4,vertexUv1s:Te,vertexUv2s:Me,vertexUv3s:$e,pointsUvs:ie.isPoints===!0&&!!O.attributes.uv&&(ve||ne),fog:!!C,useFog:M.fog===!0,fogExp2:C&&C.isFogExp2,flatShading:M.flatShading===!0,sizeAttenuation:M.sizeAttenuation===!0,logarithmicDepthBuffer:h,skinning:ie.isSkinnedMesh===!0,morphTargets:O.morphAttributes.position!==void 0,morphNormals:O.morphAttributes.normal!==void 0,morphColors:O.morphAttributes.color!==void 0,morphTargetsCount:Z,morphTextureStride:le,numDirLights:T.directional.length,numPointLights:T.point.length,numSpotLights:T.spot.length,numSpotLightMaps:T.spotLightMap.length,numRectAreaLights:T.rectArea.length,numHemiLights:T.hemi.length,numDirLightShadows:T.directionalShadowMap.length,numPointLightShadows:T.pointShadowMap.length,numSpotLightShadows:T.spotShadowMap.length,numSpotLightShadowsWithMaps:T.numSpotLightShadowsWithMaps,numLightProbes:T.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:M.dithering,shadowMapEnabled:s.shadowMap.enabled&&k.length>0,shadowMapType:s.shadowMap.type,toneMapping:Ye,useLegacyLights:s._useLegacyLights,decodeVideoTexture:ve&&M.map.isVideoTexture===!0&&Xe.getTransfer(M.map.colorSpace)===je,premultipliedAlpha:M.premultipliedAlpha,doubleSided:M.side===2,flipSided:M.side===1,useDepthPacking:M.depthPacking>=0,depthPacking:M.depthPacking||0,index0AttributeName:M.index0AttributeName,extensionDerivatives:re&&M.extensions.derivatives===!0,extensionFragDepth:re&&M.extensions.fragDepth===!0,extensionDrawBuffers:re&&M.extensions.drawBuffers===!0,extensionShaderTextureLOD:re&&M.extensions.shaderTextureLOD===!0,extensionClipCullDistance:re&&M.extensions.clipCullDistance&&i.has("WEBGL_clip_cull_distance"),rendererExtensionFragDepth:u||i.has("EXT_frag_depth"),rendererExtensionDrawBuffers:u||i.has("WEBGL_draw_buffers"),rendererExtensionShaderTextureLod:u||i.has("EXT_shader_texture_lod"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:M.customProgramCacheKey()}}function d(M){const T=[];if(M.shaderID?T.push(M.shaderID):(T.push(M.customVertexShaderID),T.push(M.customFragmentShaderID)),M.defines!==void 0)for(const k in M.defines)T.push(k),T.push(M.defines[k]);return M.isRawShaderMaterial===!1&&(E(T,M),x(T,M),T.push(s.outputColorSpace)),T.push(M.customProgramCacheKey),T.join()}function E(M,T){M.push(T.precision),M.push(T.outputColorSpace),M.push(T.envMapMode),M.push(T.envMapCubeUVHeight),M.push(T.mapUv),M.push(T.alphaMapUv),M.push(T.lightMapUv),M.push(T.aoMapUv),M.push(T.bumpMapUv),M.push(T.normalMapUv),M.push(T.displacementMapUv),M.push(T.emissiveMapUv),M.push(T.metalnessMapUv),M.push(T.roughnessMapUv),M.push(T.anisotropyMapUv),M.push(T.clearcoatMapUv),M.push(T.clearcoatNormalMapUv),M.push(T.clearcoatRoughnessMapUv),M.push(T.iridescenceMapUv),M.push(T.iridescenceThicknessMapUv),M.push(T.sheenColorMapUv),M.push(T.sheenRoughnessMapUv),M.push(T.specularMapUv),M.push(T.specularColorMapUv),M.push(T.specularIntensityMapUv),M.push(T.transmissionMapUv),M.push(T.thicknessMapUv),M.push(T.combine),M.push(T.fogExp2),M.push(T.sizeAttenuation),M.push(T.morphTargetsCount),M.push(T.morphAttributeCount),M.push(T.numDirLights),M.push(T.numPointLights),M.push(T.numSpotLights),M.push(T.numSpotLightMaps),M.push(T.numHemiLights),M.push(T.numRectAreaLights),M.push(T.numDirLightShadows),M.push(T.numPointLightShadows),M.push(T.numSpotLightShadows),M.push(T.numSpotLightShadowsWithMaps),M.push(T.numLightProbes),M.push(T.shadowMapType),M.push(T.toneMapping),M.push(T.numClippingPlanes),M.push(T.numClipIntersection),M.push(T.depthPacking)}function x(M,T){a.disableAll(),T.isWebGL2&&a.enable(0),T.supportsVertexTextures&&a.enable(1),T.instancing&&a.enable(2),T.instancingColor&&a.enable(3),T.matcap&&a.enable(4),T.envMap&&a.enable(5),T.normalMapObjectSpace&&a.enable(6),T.normalMapTangentSpace&&a.enable(7),T.clearcoat&&a.enable(8),T.iridescence&&a.enable(9),T.alphaTest&&a.enable(10),T.vertexColors&&a.enable(11),T.vertexAlphas&&a.enable(12),T.vertexUv1s&&a.enable(13),T.vertexUv2s&&a.enable(14),T.vertexUv3s&&a.enable(15),T.vertexTangents&&a.enable(16),T.anisotropy&&a.enable(17),T.alphaHash&&a.enable(18),T.batching&&a.enable(19),M.push(a.mask),a.disableAll(),T.fog&&a.enable(0),T.useFog&&a.enable(1),T.flatShading&&a.enable(2),T.logarithmicDepthBuffer&&a.enable(3),T.skinning&&a.enable(4),T.morphTargets&&a.enable(5),T.morphNormals&&a.enable(6),T.morphColors&&a.enable(7),T.premultipliedAlpha&&a.enable(8),T.shadowMapEnabled&&a.enable(9),T.useLegacyLights&&a.enable(10),T.doubleSided&&a.enable(11),T.flipSided&&a.enable(12),T.useDepthPacking&&a.enable(13),T.dithering&&a.enable(14),T.transmission&&a.enable(15),T.sheen&&a.enable(16),T.opaque&&a.enable(17),T.pointsUvs&&a.enable(18),T.decodeVideoTexture&&a.enable(19),M.push(a.mask)}function A(M){const T=g[M.type];let k;if(T){const $=Gt[T];k=ha.clone($.uniforms)}else k=M.uniforms;return k}function P(M,T){let k;for(let $=0,ie=c.length;$<ie;$++){const C=c[$];if(C.cacheKey===T){k=C,++k.usedTimes;break}}return k===void 0&&(k=new $c(s,T,M,r),c.push(k)),k}function R(M){if(--M.usedTimes===0){const T=c.indexOf(M);c[T]=c[c.length-1],c.pop(),M.destroy()}}function w(M){l.remove(M)}function q(){l.dispose()}return{getParameters:p,getProgramCacheKey:d,getUniforms:A,acquireProgram:P,releaseProgram:R,releaseShaderCache:w,programs:c,dispose:q}}function Jc(){let s=new WeakMap;function e(r){let o=s.get(r);return o===void 0&&(o={},s.set(r,o)),o}function t(r){s.delete(r)}function i(r,o,a){s.get(r)[o]=a}function n(){s=new WeakMap}return{get:e,remove:t,update:i,dispose:n}}function Qc(s,e){return s.groupOrder!==e.groupOrder?s.groupOrder-e.groupOrder:s.renderOrder!==e.renderOrder?s.renderOrder-e.renderOrder:s.material.id!==e.material.id?s.material.id-e.material.id:s.z!==e.z?s.z-e.z:s.id-e.id}function Ar(s,e){return s.groupOrder!==e.groupOrder?s.groupOrder-e.groupOrder:s.renderOrder!==e.renderOrder?s.renderOrder-e.renderOrder:s.z!==e.z?e.z-s.z:s.id-e.id}function wr(){const s=[];let e=0;const t=[],i=[],n=[];function r(){e=0,t.length=0,i.length=0,n.length=0}function o(h,f,m,g,_,p){let d=s[e];return d===void 0?(d={id:h.id,object:h,geometry:f,material:m,groupOrder:g,renderOrder:h.renderOrder,z:_,group:p},s[e]=d):(d.id=h.id,d.object=h,d.geometry=f,d.material=m,d.groupOrder=g,d.renderOrder=h.renderOrder,d.z=_,d.group=p),e++,d}function a(h,f,m,g,_,p){const d=o(h,f,m,g,_,p);m.transmission>0?i.push(d):m.transparent===!0?n.push(d):t.push(d)}function l(h,f,m,g,_,p){const d=o(h,f,m,g,_,p);m.transmission>0?i.unshift(d):m.transparent===!0?n.unshift(d):t.unshift(d)}function c(h,f){t.length>1&&t.sort(h||Qc),i.length>1&&i.sort(f||Ar),n.length>1&&n.sort(f||Ar)}function u(){for(let h=e,f=s.length;h<f;h++){const m=s[h];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:t,transmissive:i,transparent:n,init:r,push:a,unshift:l,finish:u,sort:c}}function eu(){let s=new WeakMap;function e(i,n){const r=s.get(i);let o;return r===void 0?(o=new wr,s.set(i,[o])):n>=r.length?(o=new wr,r.push(o)):o=r[n],o}function t(){s=new WeakMap}return{get:e,dispose:t}}function tu(){const s={};return{get:function(e){if(s[e.id]!==void 0)return s[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new D,color:new He};break;case"SpotLight":t={position:new D,direction:new D,color:new He,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new D,color:new He,distance:0,decay:0};break;case"HemisphereLight":t={direction:new D,skyColor:new He,groundColor:new He};break;case"RectAreaLight":t={color:new He,position:new D,halfWidth:new D,halfHeight:new D};break}return s[e.id]=t,t}}}function nu(){const s={};return{get:function(e){if(s[e.id]!==void 0)return s[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new We};break;case"SpotLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new We};break;case"PointLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new We,shadowCameraNear:1,shadowCameraFar:1e3};break}return s[e.id]=t,t}}}let iu=0;function su(s,e){return(e.castShadow?2:0)-(s.castShadow?2:0)+(e.map?1:0)-(s.map?1:0)}function ru(s,e){const t=new tu,i=nu(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let u=0;u<9;u++)n.probe.push(new D);const r=new D,o=new at,a=new at;function l(u,h){let f=0,m=0,g=0;for(let $=0;$<9;$++)n.probe[$].set(0,0,0);let _=0,p=0,d=0,E=0,x=0,A=0,P=0,R=0,w=0,q=0,M=0;u.sort(su);const T=h===!0?Math.PI:1;for(let $=0,ie=u.length;$<ie;$++){const C=u[$],O=C.color,z=C.intensity,W=C.distance,V=C.shadow&&C.shadow.map?C.shadow.map.texture:null;if(C.isAmbientLight)f+=O.r*z*T,m+=O.g*z*T,g+=O.b*z*T;else if(C.isLightProbe){for(let H=0;H<9;H++)n.probe[H].addScaledVector(C.sh.coefficients[H],z);M++}else if(C.isDirectionalLight){const H=t.get(C);if(H.color.copy(C.color).multiplyScalar(C.intensity*T),C.castShadow){const Y=C.shadow,Z=i.get(C);Z.shadowBias=Y.bias,Z.shadowNormalBias=Y.normalBias,Z.shadowRadius=Y.radius,Z.shadowMapSize=Y.mapSize,n.directionalShadow[_]=Z,n.directionalShadowMap[_]=V,n.directionalShadowMatrix[_]=C.shadow.matrix,A++}n.directional[_]=H,_++}else if(C.isSpotLight){const H=t.get(C);H.position.setFromMatrixPosition(C.matrixWorld),H.color.copy(O).multiplyScalar(z*T),H.distance=W,H.coneCos=Math.cos(C.angle),H.penumbraCos=Math.cos(C.angle*(1-C.penumbra)),H.decay=C.decay,n.spot[d]=H;const Y=C.shadow;if(C.map&&(n.spotLightMap[w]=C.map,w++,Y.updateMatrices(C),C.castShadow&&q++),n.spotLightMatrix[d]=Y.matrix,C.castShadow){const Z=i.get(C);Z.shadowBias=Y.bias,Z.shadowNormalBias=Y.normalBias,Z.shadowRadius=Y.radius,Z.shadowMapSize=Y.mapSize,n.spotShadow[d]=Z,n.spotShadowMap[d]=V,R++}d++}else if(C.isRectAreaLight){const H=t.get(C);H.color.copy(O).multiplyScalar(z),H.halfWidth.set(C.width*.5,0,0),H.halfHeight.set(0,C.height*.5,0),n.rectArea[E]=H,E++}else if(C.isPointLight){const H=t.get(C);if(H.color.copy(C.color).multiplyScalar(C.intensity*T),H.distance=C.distance,H.decay=C.decay,C.castShadow){const Y=C.shadow,Z=i.get(C);Z.shadowBias=Y.bias,Z.shadowNormalBias=Y.normalBias,Z.shadowRadius=Y.radius,Z.shadowMapSize=Y.mapSize,Z.shadowCameraNear=Y.camera.near,Z.shadowCameraFar=Y.camera.far,n.pointShadow[p]=Z,n.pointShadowMap[p]=V,n.pointShadowMatrix[p]=C.shadow.matrix,P++}n.point[p]=H,p++}else if(C.isHemisphereLight){const H=t.get(C);H.skyColor.copy(C.color).multiplyScalar(z*T),H.groundColor.copy(C.groundColor).multiplyScalar(z*T),n.hemi[x]=H,x++}}E>0&&(e.isWebGL2?s.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=te.LTC_FLOAT_1,n.rectAreaLTC2=te.LTC_FLOAT_2):(n.rectAreaLTC1=te.LTC_HALF_1,n.rectAreaLTC2=te.LTC_HALF_2):s.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=te.LTC_FLOAT_1,n.rectAreaLTC2=te.LTC_FLOAT_2):s.has("OES_texture_half_float_linear")===!0?(n.rectAreaLTC1=te.LTC_HALF_1,n.rectAreaLTC2=te.LTC_HALF_2):console.error("THREE.WebGLRenderer: Unable to use RectAreaLight. Missing WebGL extensions.")),n.ambient[0]=f,n.ambient[1]=m,n.ambient[2]=g;const k=n.hash;(k.directionalLength!==_||k.pointLength!==p||k.spotLength!==d||k.rectAreaLength!==E||k.hemiLength!==x||k.numDirectionalShadows!==A||k.numPointShadows!==P||k.numSpotShadows!==R||k.numSpotMaps!==w||k.numLightProbes!==M)&&(n.directional.length=_,n.spot.length=d,n.rectArea.length=E,n.point.length=p,n.hemi.length=x,n.directionalShadow.length=A,n.directionalShadowMap.length=A,n.pointShadow.length=P,n.pointShadowMap.length=P,n.spotShadow.length=R,n.spotShadowMap.length=R,n.directionalShadowMatrix.length=A,n.pointShadowMatrix.length=P,n.spotLightMatrix.length=R+w-q,n.spotLightMap.length=w,n.numSpotLightShadowsWithMaps=q,n.numLightProbes=M,k.directionalLength=_,k.pointLength=p,k.spotLength=d,k.rectAreaLength=E,k.hemiLength=x,k.numDirectionalShadows=A,k.numPointShadows=P,k.numSpotShadows=R,k.numSpotMaps=w,k.numLightProbes=M,n.version=iu++)}function c(u,h){let f=0,m=0,g=0,_=0,p=0;const d=h.matrixWorldInverse;for(let E=0,x=u.length;E<x;E++){const A=u[E];if(A.isDirectionalLight){const P=n.directional[f];P.direction.setFromMatrixPosition(A.matrixWorld),r.setFromMatrixPosition(A.target.matrixWorld),P.direction.sub(r),P.direction.transformDirection(d),f++}else if(A.isSpotLight){const P=n.spot[g];P.position.setFromMatrixPosition(A.matrixWorld),P.position.applyMatrix4(d),P.direction.setFromMatrixPosition(A.matrixWorld),r.setFromMatrixPosition(A.target.matrixWorld),P.direction.sub(r),P.direction.transformDirection(d),g++}else if(A.isRectAreaLight){const P=n.rectArea[_];P.position.setFromMatrixPosition(A.matrixWorld),P.position.applyMatrix4(d),a.identity(),o.copy(A.matrixWorld),o.premultiply(d),a.extractRotation(o),P.halfWidth.set(A.width*.5,0,0),P.halfHeight.set(0,A.height*.5,0),P.halfWidth.applyMatrix4(a),P.halfHeight.applyMatrix4(a),_++}else if(A.isPointLight){const P=n.point[m];P.position.setFromMatrixPosition(A.matrixWorld),P.position.applyMatrix4(d),m++}else if(A.isHemisphereLight){const P=n.hemi[p];P.direction.setFromMatrixPosition(A.matrixWorld),P.direction.transformDirection(d),p++}}}return{setup:l,setupView:c,state:n}}function Rr(s,e){const t=new ru(s,e),i=[],n=[];function r(){i.length=0,n.length=0}function o(h){i.push(h)}function a(h){n.push(h)}function l(h){t.setup(i,h)}function c(h){t.setupView(i,h)}return{init:r,state:{lightsArray:i,shadowsArray:n,lights:t},setupLights:l,setupLightsView:c,pushLight:o,pushShadow:a}}function au(s,e){let t=new WeakMap;function i(r,o=0){const a=t.get(r);let l;return a===void 0?(l=new Rr(s,e),t.set(r,[l])):o>=a.length?(l=new Rr(s,e),a.push(l)):l=a[o],l}function n(){t=new WeakMap}return{get:i,dispose:n}}class ou extends Wn{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=3200,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class lu extends Wn{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}const cu=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,uu=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function du(s,e,t){let i=new Js;const n=new We,r=new We,o=new dt,a=new ou({depthPacking:3201}),l=new lu,c={},u=t.maxTextureSize,h={0:1,1:0,2:2},f=new an({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new We},radius:{value:4}},vertexShader:cu,fragmentShader:uu}),m=f.clone();m.defines.HORIZONTAL_PASS=1;const g=new kt;g.setAttribute("position",new Rt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const _=new Yt(g,f),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=1;let d=this.type;this.render=function(R,w,q){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||R.length===0)return;const M=s.getRenderTarget(),T=s.getActiveCubeFace(),k=s.getActiveMipmapLevel(),$=s.state;$.setBlending(0),$.buffers.color.setClear(1,1,1,1),$.buffers.depth.setTest(!0),$.setScissorTest(!1);const ie=d!==3&&this.type===3,C=d===3&&this.type!==3;for(let O=0,z=R.length;O<z;O++){const W=R[O],V=W.shadow;if(V===void 0){console.warn("THREE.WebGLShadowMap:",W,"has no shadow.");continue}if(V.autoUpdate===!1&&V.needsUpdate===!1)continue;n.copy(V.mapSize);const H=V.getFrameExtents();if(n.multiply(H),r.copy(V.mapSize),(n.x>u||n.y>u)&&(n.x>u&&(r.x=Math.floor(u/H.x),n.x=r.x*H.x,V.mapSize.x=r.x),n.y>u&&(r.y=Math.floor(u/H.y),n.y=r.y*H.y,V.mapSize.y=r.y)),V.map===null||ie===!0||C===!0){const Z=this.type!==3?{minFilter:1003,magFilter:1003}:{};V.map!==null&&V.map.dispose(),V.map=new tn(n.x,n.y,Z),V.map.texture.name=W.name+".shadowMap",V.camera.updateProjectionMatrix()}s.setRenderTarget(V.map),s.clear();const Y=V.getViewportCount();for(let Z=0;Z<Y;Z++){const le=V.getViewport(Z);o.set(r.x*le.x,r.y*le.y,r.x*le.z,r.y*le.w),$.viewport(o),V.updateMatrices(W,Z),i=V.getFrustum(),A(w,q,V.camera,W,this.type)}V.isPointLightShadow!==!0&&this.type===3&&E(V,q),V.needsUpdate=!1}d=this.type,p.needsUpdate=!1,s.setRenderTarget(M,T,k)};function E(R,w){const q=e.update(_);f.defines.VSM_SAMPLES!==R.blurSamples&&(f.defines.VSM_SAMPLES=R.blurSamples,m.defines.VSM_SAMPLES=R.blurSamples,f.needsUpdate=!0,m.needsUpdate=!0),R.mapPass===null&&(R.mapPass=new tn(n.x,n.y)),f.uniforms.shadow_pass.value=R.map.texture,f.uniforms.resolution.value=R.mapSize,f.uniforms.radius.value=R.radius,s.setRenderTarget(R.mapPass),s.clear(),s.renderBufferDirect(w,null,q,f,_,null),m.uniforms.shadow_pass.value=R.mapPass.texture,m.uniforms.resolution.value=R.mapSize,m.uniforms.radius.value=R.radius,s.setRenderTarget(R.map),s.clear(),s.renderBufferDirect(w,null,q,m,_,null)}function x(R,w,q,M){let T=null;const k=q.isPointLight===!0?R.customDistanceMaterial:R.customDepthMaterial;if(k!==void 0)T=k;else if(T=q.isPointLight===!0?l:a,s.localClippingEnabled&&w.clipShadows===!0&&Array.isArray(w.clippingPlanes)&&w.clippingPlanes.length!==0||w.displacementMap&&w.displacementScale!==0||w.alphaMap&&w.alphaTest>0||w.map&&w.alphaTest>0){const $=T.uuid,ie=w.uuid;let C=c[$];C===void 0&&(C={},c[$]=C);let O=C[ie];O===void 0&&(O=T.clone(),C[ie]=O,w.addEventListener("dispose",P)),T=O}if(T.visible=w.visible,T.wireframe=w.wireframe,M===3?T.side=w.shadowSide!==null?w.shadowSide:w.side:T.side=w.shadowSide!==null?w.shadowSide:h[w.side],T.alphaMap=w.alphaMap,T.alphaTest=w.alphaTest,T.map=w.map,T.clipShadows=w.clipShadows,T.clippingPlanes=w.clippingPlanes,T.clipIntersection=w.clipIntersection,T.displacementMap=w.displacementMap,T.displacementScale=w.displacementScale,T.displacementBias=w.displacementBias,T.wireframeLinewidth=w.wireframeLinewidth,T.linewidth=w.linewidth,q.isPointLight===!0&&T.isMeshDistanceMaterial===!0){const $=s.properties.get(T);$.light=q}return T}function A(R,w,q,M,T){if(R.visible===!1)return;if(R.layers.test(w.layers)&&(R.isMesh||R.isLine||R.isPoints)&&(R.castShadow||R.receiveShadow&&T===3)&&(!R.frustumCulled||i.intersectsObject(R))){R.modelViewMatrix.multiplyMatrices(q.matrixWorldInverse,R.matrixWorld);const ie=e.update(R),C=R.material;if(Array.isArray(C)){const O=ie.groups;for(let z=0,W=O.length;z<W;z++){const V=O[z],H=C[V.materialIndex];if(H&&H.visible){const Y=x(R,H,M,T);R.onBeforeShadow(s,R,w,q,ie,Y,V),s.renderBufferDirect(q,null,ie,Y,R,V),R.onAfterShadow(s,R,w,q,ie,Y,V)}}}else if(C.visible){const O=x(R,C,M,T);R.onBeforeShadow(s,R,w,q,ie,O,null),s.renderBufferDirect(q,null,ie,O,R,null),R.onAfterShadow(s,R,w,q,ie,O,null)}}const $=R.children;for(let ie=0,C=$.length;ie<C;ie++)A($[ie],w,q,M,T)}function P(R){R.target.removeEventListener("dispose",P);for(const q in c){const M=c[q],T=R.target.uuid;T in M&&(M[T].dispose(),delete M[T])}}}function hu(s,e,t){const i=t.isWebGL2;function n(){let b=!1;const se=new dt;let re=null;const Te=new dt(0,0,0,0);return{setMask:function(Me){re!==Me&&!b&&(s.colorMask(Me,Me,Me,Me),re=Me)},setLocked:function(Me){b=Me},setClear:function(Me,$e,Ye,lt,_t){_t===!0&&(Me*=lt,$e*=lt,Ye*=lt),se.set(Me,$e,Ye,lt),Te.equals(se)===!1&&(s.clearColor(Me,$e,Ye,lt),Te.copy(se))},reset:function(){b=!1,re=null,Te.set(-1,0,0,0)}}}function r(){let b=!1,se=null,re=null,Te=null;return{setTest:function(Me){Me?we(s.DEPTH_TEST):ve(s.DEPTH_TEST)},setMask:function(Me){se!==Me&&!b&&(s.depthMask(Me),se=Me)},setFunc:function(Me){if(re!==Me){switch(Me){case 0:s.depthFunc(s.NEVER);break;case 1:s.depthFunc(s.ALWAYS);break;case 2:s.depthFunc(s.LESS);break;case 3:s.depthFunc(s.LEQUAL);break;case 4:s.depthFunc(s.EQUAL);break;case 5:s.depthFunc(s.GEQUAL);break;case 6:s.depthFunc(s.GREATER);break;case 7:s.depthFunc(s.NOTEQUAL);break;default:s.depthFunc(s.LEQUAL)}re=Me}},setLocked:function(Me){b=Me},setClear:function(Me){Te!==Me&&(s.clearDepth(Me),Te=Me)},reset:function(){b=!1,se=null,re=null,Te=null}}}function o(){let b=!1,se=null,re=null,Te=null,Me=null,$e=null,Ye=null,lt=null,_t=null;return{setTest:function(Ke){b||(Ke?we(s.STENCIL_TEST):ve(s.STENCIL_TEST))},setMask:function(Ke){se!==Ke&&!b&&(s.stencilMask(Ke),se=Ke)},setFunc:function(Ke,vt,zt){(re!==Ke||Te!==vt||Me!==zt)&&(s.stencilFunc(Ke,vt,zt),re=Ke,Te=vt,Me=zt)},setOp:function(Ke,vt,zt){($e!==Ke||Ye!==vt||lt!==zt)&&(s.stencilOp(Ke,vt,zt),$e=Ke,Ye=vt,lt=zt)},setLocked:function(Ke){b=Ke},setClear:function(Ke){_t!==Ke&&(s.clearStencil(Ke),_t=Ke)},reset:function(){b=!1,se=null,re=null,Te=null,Me=null,$e=null,Ye=null,lt=null,_t=null}}}const a=new n,l=new r,c=new o,u=new WeakMap,h=new WeakMap;let f={},m={},g=new WeakMap,_=[],p=null,d=!1,E=null,x=null,A=null,P=null,R=null,w=null,q=null,M=new He(0,0,0),T=0,k=!1,$=null,ie=null,C=null,O=null,z=null;const W=s.getParameter(s.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let V=!1,H=0;const Y=s.getParameter(s.VERSION);Y.indexOf("WebGL")!==-1?(H=parseFloat(/^WebGL (\d)/.exec(Y)[1]),V=H>=1):Y.indexOf("OpenGL ES")!==-1&&(H=parseFloat(/^OpenGL ES (\d)/.exec(Y)[1]),V=H>=2);let Z=null,le={};const G=s.getParameter(s.SCISSOR_BOX),X=s.getParameter(s.VIEWPORT),ae=new dt().fromArray(G),de=new dt().fromArray(X);function ue(b,se,re,Te){const Me=new Uint8Array(4),$e=s.createTexture();s.bindTexture(b,$e),s.texParameteri(b,s.TEXTURE_MIN_FILTER,s.NEAREST),s.texParameteri(b,s.TEXTURE_MAG_FILTER,s.NEAREST);for(let Ye=0;Ye<re;Ye++)i&&(b===s.TEXTURE_3D||b===s.TEXTURE_2D_ARRAY)?s.texImage3D(se,0,s.RGBA,1,1,Te,0,s.RGBA,s.UNSIGNED_BYTE,Me):s.texImage2D(se+Ye,0,s.RGBA,1,1,0,s.RGBA,s.UNSIGNED_BYTE,Me);return $e}const xe={};xe[s.TEXTURE_2D]=ue(s.TEXTURE_2D,s.TEXTURE_2D,1),xe[s.TEXTURE_CUBE_MAP]=ue(s.TEXTURE_CUBE_MAP,s.TEXTURE_CUBE_MAP_POSITIVE_X,6),i&&(xe[s.TEXTURE_2D_ARRAY]=ue(s.TEXTURE_2D_ARRAY,s.TEXTURE_2D_ARRAY,1,1),xe[s.TEXTURE_3D]=ue(s.TEXTURE_3D,s.TEXTURE_3D,1,1)),a.setClear(0,0,0,1),l.setClear(1),c.setClear(0),we(s.DEPTH_TEST),l.setFunc(3),Ue(!1),y(1),we(s.CULL_FACE),pe(0);function we(b){f[b]!==!0&&(s.enable(b),f[b]=!0)}function ve(b){f[b]!==!1&&(s.disable(b),f[b]=!1)}function ze(b,se){return m[b]!==se?(s.bindFramebuffer(b,se),m[b]=se,i&&(b===s.DRAW_FRAMEBUFFER&&(m[s.FRAMEBUFFER]=se),b===s.FRAMEBUFFER&&(m[s.DRAW_FRAMEBUFFER]=se)),!0):!1}function I(b,se){let re=_,Te=!1;if(b)if(re=g.get(se),re===void 0&&(re=[],g.set(se,re)),b.isWebGLMultipleRenderTargets){const Me=b.texture;if(re.length!==Me.length||re[0]!==s.COLOR_ATTACHMENT0){for(let $e=0,Ye=Me.length;$e<Ye;$e++)re[$e]=s.COLOR_ATTACHMENT0+$e;re.length=Me.length,Te=!0}}else re[0]!==s.COLOR_ATTACHMENT0&&(re[0]=s.COLOR_ATTACHMENT0,Te=!0);else re[0]!==s.BACK&&(re[0]=s.BACK,Te=!0);Te&&(t.isWebGL2?s.drawBuffers(re):e.get("WEBGL_draw_buffers").drawBuffersWEBGL(re))}function gt(b){return p!==b?(s.useProgram(b),p=b,!0):!1}const Se={100:s.FUNC_ADD,101:s.FUNC_SUBTRACT,102:s.FUNC_REVERSE_SUBTRACT};if(i)Se[103]=s.MIN,Se[104]=s.MAX;else{const b=e.get("EXT_blend_minmax");b!==null&&(Se[103]=b.MIN_EXT,Se[104]=b.MAX_EXT)}const Ce={200:s.ZERO,201:s.ONE,202:s.SRC_COLOR,204:s.SRC_ALPHA,210:s.SRC_ALPHA_SATURATE,208:s.DST_COLOR,206:s.DST_ALPHA,203:s.ONE_MINUS_SRC_COLOR,205:s.ONE_MINUS_SRC_ALPHA,209:s.ONE_MINUS_DST_COLOR,207:s.ONE_MINUS_DST_ALPHA,211:s.CONSTANT_COLOR,212:s.ONE_MINUS_CONSTANT_COLOR,213:s.CONSTANT_ALPHA,214:s.ONE_MINUS_CONSTANT_ALPHA};function pe(b,se,re,Te,Me,$e,Ye,lt,_t,Ke){if(b===0){d===!0&&(ve(s.BLEND),d=!1);return}if(d===!1&&(we(s.BLEND),d=!0),b!==5){if(b!==E||Ke!==k){if((x!==100||R!==100)&&(s.blendEquation(s.FUNC_ADD),x=100,R=100),Ke)switch(b){case 1:s.blendFuncSeparate(s.ONE,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case 2:s.blendFunc(s.ONE,s.ONE);break;case 3:s.blendFuncSeparate(s.ZERO,s.ONE_MINUS_SRC_COLOR,s.ZERO,s.ONE);break;case 4:s.blendFuncSeparate(s.ZERO,s.SRC_COLOR,s.ZERO,s.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",b);break}else switch(b){case 1:s.blendFuncSeparate(s.SRC_ALPHA,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case 2:s.blendFunc(s.SRC_ALPHA,s.ONE);break;case 3:s.blendFuncSeparate(s.ZERO,s.ONE_MINUS_SRC_COLOR,s.ZERO,s.ONE);break;case 4:s.blendFunc(s.ZERO,s.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",b);break}A=null,P=null,w=null,q=null,M.set(0,0,0),T=0,E=b,k=Ke}return}Me=Me||se,$e=$e||re,Ye=Ye||Te,(se!==x||Me!==R)&&(s.blendEquationSeparate(Se[se],Se[Me]),x=se,R=Me),(re!==A||Te!==P||$e!==w||Ye!==q)&&(s.blendFuncSeparate(Ce[re],Ce[Te],Ce[$e],Ce[Ye]),A=re,P=Te,w=$e,q=Ye),(lt.equals(M)===!1||_t!==T)&&(s.blendColor(lt.r,lt.g,lt.b,_t),M.copy(lt),T=_t),E=b,k=!1}function Ze(b,se){b.side===2?ve(s.CULL_FACE):we(s.CULL_FACE);let re=b.side===1;se&&(re=!re),Ue(re),b.blending===1&&b.transparent===!1?pe(0):pe(b.blending,b.blendEquation,b.blendSrc,b.blendDst,b.blendEquationAlpha,b.blendSrcAlpha,b.blendDstAlpha,b.blendColor,b.blendAlpha,b.premultipliedAlpha),l.setFunc(b.depthFunc),l.setTest(b.depthTest),l.setMask(b.depthWrite),a.setMask(b.colorWrite);const Te=b.stencilWrite;c.setTest(Te),Te&&(c.setMask(b.stencilWriteMask),c.setFunc(b.stencilFunc,b.stencilRef,b.stencilFuncMask),c.setOp(b.stencilFail,b.stencilZFail,b.stencilZPass)),F(b.polygonOffset,b.polygonOffsetFactor,b.polygonOffsetUnits),b.alphaToCoverage===!0?we(s.SAMPLE_ALPHA_TO_COVERAGE):ve(s.SAMPLE_ALPHA_TO_COVERAGE)}function Ue(b){$!==b&&(b?s.frontFace(s.CW):s.frontFace(s.CCW),$=b)}function y(b){b!==0?(we(s.CULL_FACE),b!==ie&&(b===1?s.cullFace(s.BACK):b===2?s.cullFace(s.FRONT):s.cullFace(s.FRONT_AND_BACK))):ve(s.CULL_FACE),ie=b}function v(b){b!==C&&(V&&s.lineWidth(b),C=b)}function F(b,se,re){b?(we(s.POLYGON_OFFSET_FILL),(O!==se||z!==re)&&(s.polygonOffset(se,re),O=se,z=re)):ve(s.POLYGON_OFFSET_FILL)}function J(b){b?we(s.SCISSOR_TEST):ve(s.SCISSOR_TEST)}function j(b){b===void 0&&(b=s.TEXTURE0+W-1),Z!==b&&(s.activeTexture(b),Z=b)}function Q(b,se,re){re===void 0&&(Z===null?re=s.TEXTURE0+W-1:re=Z);let Te=le[re];Te===void 0&&(Te={type:void 0,texture:void 0},le[re]=Te),(Te.type!==b||Te.texture!==se)&&(Z!==re&&(s.activeTexture(re),Z=re),s.bindTexture(b,se||xe[b]),Te.type=b,Te.texture=se)}function me(){const b=le[Z];b!==void 0&&b.type!==void 0&&(s.bindTexture(b.type,null),b.type=void 0,b.texture=void 0)}function oe(){try{s.compressedTexImage2D.apply(s,arguments)}catch(b){console.error("THREE.WebGLState:",b)}}function he(){try{s.compressedTexImage3D.apply(s,arguments)}catch(b){console.error("THREE.WebGLState:",b)}}function Ee(){try{s.texSubImage2D.apply(s,arguments)}catch(b){console.error("THREE.WebGLState:",b)}}function Fe(){try{s.texSubImage3D.apply(s,arguments)}catch(b){console.error("THREE.WebGLState:",b)}}function K(){try{s.compressedTexSubImage2D.apply(s,arguments)}catch(b){console.error("THREE.WebGLState:",b)}}function qe(){try{s.compressedTexSubImage3D.apply(s,arguments)}catch(b){console.error("THREE.WebGLState:",b)}}function Ge(){try{s.texStorage2D.apply(s,arguments)}catch(b){console.error("THREE.WebGLState:",b)}}function Re(){try{s.texStorage3D.apply(s,arguments)}catch(b){console.error("THREE.WebGLState:",b)}}function _e(){try{s.texImage2D.apply(s,arguments)}catch(b){console.error("THREE.WebGLState:",b)}}function fe(){try{s.texImage3D.apply(s,arguments)}catch(b){console.error("THREE.WebGLState:",b)}}function Ie(b){ae.equals(b)===!1&&(s.scissor(b.x,b.y,b.z,b.w),ae.copy(b))}function Ve(b){de.equals(b)===!1&&(s.viewport(b.x,b.y,b.z,b.w),de.copy(b))}function et(b,se){let re=h.get(se);re===void 0&&(re=new WeakMap,h.set(se,re));let Te=re.get(b);Te===void 0&&(Te=s.getUniformBlockIndex(se,b.name),re.set(b,Te))}function Be(b,se){const Te=h.get(se).get(b);u.get(se)!==Te&&(s.uniformBlockBinding(se,Te,b.__bindingPointIndex),u.set(se,Te))}function ne(){s.disable(s.BLEND),s.disable(s.CULL_FACE),s.disable(s.DEPTH_TEST),s.disable(s.POLYGON_OFFSET_FILL),s.disable(s.SCISSOR_TEST),s.disable(s.STENCIL_TEST),s.disable(s.SAMPLE_ALPHA_TO_COVERAGE),s.blendEquation(s.FUNC_ADD),s.blendFunc(s.ONE,s.ZERO),s.blendFuncSeparate(s.ONE,s.ZERO,s.ONE,s.ZERO),s.blendColor(0,0,0,0),s.colorMask(!0,!0,!0,!0),s.clearColor(0,0,0,0),s.depthMask(!0),s.depthFunc(s.LESS),s.clearDepth(1),s.stencilMask(4294967295),s.stencilFunc(s.ALWAYS,0,4294967295),s.stencilOp(s.KEEP,s.KEEP,s.KEEP),s.clearStencil(0),s.cullFace(s.BACK),s.frontFace(s.CCW),s.polygonOffset(0,0),s.activeTexture(s.TEXTURE0),s.bindFramebuffer(s.FRAMEBUFFER,null),i===!0&&(s.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),s.bindFramebuffer(s.READ_FRAMEBUFFER,null)),s.useProgram(null),s.lineWidth(1),s.scissor(0,0,s.canvas.width,s.canvas.height),s.viewport(0,0,s.canvas.width,s.canvas.height),f={},Z=null,le={},m={},g=new WeakMap,_=[],p=null,d=!1,E=null,x=null,A=null,P=null,R=null,w=null,q=null,M=new He(0,0,0),T=0,k=!1,$=null,ie=null,C=null,O=null,z=null,ae.set(0,0,s.canvas.width,s.canvas.height),de.set(0,0,s.canvas.width,s.canvas.height),a.reset(),l.reset(),c.reset()}return{buffers:{color:a,depth:l,stencil:c},enable:we,disable:ve,bindFramebuffer:ze,drawBuffers:I,useProgram:gt,setBlending:pe,setMaterial:Ze,setFlipSided:Ue,setCullFace:y,setLineWidth:v,setPolygonOffset:F,setScissorTest:J,activeTexture:j,bindTexture:Q,unbindTexture:me,compressedTexImage2D:oe,compressedTexImage3D:he,texImage2D:_e,texImage3D:fe,updateUBOMapping:et,uniformBlockBinding:Be,texStorage2D:Ge,texStorage3D:Re,texSubImage2D:Ee,texSubImage3D:Fe,compressedTexSubImage2D:K,compressedTexSubImage3D:qe,scissor:Ie,viewport:Ve,reset:ne}}function fu(s,e,t,i,n,r,o){const a=n.isWebGL2,l=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),u=new WeakMap;let h;const f=new WeakMap;let m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(y,v){return m?new OffscreenCanvas(y,v):ni("canvas")}function _(y,v,F,J){let j=1;if((y.width>J||y.height>J)&&(j=J/Math.max(y.width,y.height)),j<1||v===!0)if(typeof HTMLImageElement<"u"&&y instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&y instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&y instanceof ImageBitmap){const Q=v?ki:Math.floor,me=Q(j*y.width),oe=Q(j*y.height);h===void 0&&(h=g(me,oe));const he=F?g(me,oe):h;return he.width=me,he.height=oe,he.getContext("2d").drawImage(y,0,0,me,oe),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+y.width+"x"+y.height+") to ("+me+"x"+oe+")."),he}else return"data"in y&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+y.width+"x"+y.height+")."),y;return y}function p(y){return Es(y.width)&&Es(y.height)}function d(y){return a?!1:y.wrapS!==1001||y.wrapT!==1001||y.minFilter!==1003&&y.minFilter!==1006}function E(y,v){return y.generateMipmaps&&v&&y.minFilter!==1003&&y.minFilter!==1006}function x(y){s.generateMipmap(y)}function A(y,v,F,J,j=!1){if(a===!1)return v;if(y!==null){if(s[y]!==void 0)return s[y];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+y+"'")}let Q=v;if(v===s.RED&&(F===s.FLOAT&&(Q=s.R32F),F===s.HALF_FLOAT&&(Q=s.R16F),F===s.UNSIGNED_BYTE&&(Q=s.R8)),v===s.RED_INTEGER&&(F===s.UNSIGNED_BYTE&&(Q=s.R8UI),F===s.UNSIGNED_SHORT&&(Q=s.R16UI),F===s.UNSIGNED_INT&&(Q=s.R32UI),F===s.BYTE&&(Q=s.R8I),F===s.SHORT&&(Q=s.R16I),F===s.INT&&(Q=s.R32I)),v===s.RG&&(F===s.FLOAT&&(Q=s.RG32F),F===s.HALF_FLOAT&&(Q=s.RG16F),F===s.UNSIGNED_BYTE&&(Q=s.RG8)),v===s.RGBA){const me=j?Qn:Xe.getTransfer(J);F===s.FLOAT&&(Q=s.RGBA32F),F===s.HALF_FLOAT&&(Q=s.RGBA16F),F===s.UNSIGNED_BYTE&&(Q=me===je?s.SRGB8_ALPHA8:s.RGBA8),F===s.UNSIGNED_SHORT_4_4_4_4&&(Q=s.RGBA4),F===s.UNSIGNED_SHORT_5_5_5_1&&(Q=s.RGB5_A1)}return(Q===s.R16F||Q===s.R32F||Q===s.RG16F||Q===s.RG32F||Q===s.RGBA16F||Q===s.RGBA32F)&&e.get("EXT_color_buffer_float"),Q}function P(y,v,F){return E(y,F)===!0||y.isFramebufferTexture&&y.minFilter!==1003&&y.minFilter!==1006?Math.log2(Math.max(v.width,v.height))+1:y.mipmaps!==void 0&&y.mipmaps.length>0?y.mipmaps.length:y.isCompressedTexture&&Array.isArray(y.image)?v.mipmaps.length:1}function R(y){return y===1003||y===1004||y===1005?s.NEAREST:s.LINEAR}function w(y){const v=y.target;v.removeEventListener("dispose",w),M(v),v.isVideoTexture&&u.delete(v)}function q(y){const v=y.target;v.removeEventListener("dispose",q),k(v)}function M(y){const v=i.get(y);if(v.__webglInit===void 0)return;const F=y.source,J=f.get(F);if(J){const j=J[v.__cacheKey];j.usedTimes--,j.usedTimes===0&&T(y),Object.keys(J).length===0&&f.delete(F)}i.remove(y)}function T(y){const v=i.get(y);s.deleteTexture(v.__webglTexture);const F=y.source,J=f.get(F);delete J[v.__cacheKey],o.memory.textures--}function k(y){const v=y.texture,F=i.get(y),J=i.get(v);if(J.__webglTexture!==void 0&&(s.deleteTexture(J.__webglTexture),o.memory.textures--),y.depthTexture&&y.depthTexture.dispose(),y.isWebGLCubeRenderTarget)for(let j=0;j<6;j++){if(Array.isArray(F.__webglFramebuffer[j]))for(let Q=0;Q<F.__webglFramebuffer[j].length;Q++)s.deleteFramebuffer(F.__webglFramebuffer[j][Q]);else s.deleteFramebuffer(F.__webglFramebuffer[j]);F.__webglDepthbuffer&&s.deleteRenderbuffer(F.__webglDepthbuffer[j])}else{if(Array.isArray(F.__webglFramebuffer))for(let j=0;j<F.__webglFramebuffer.length;j++)s.deleteFramebuffer(F.__webglFramebuffer[j]);else s.deleteFramebuffer(F.__webglFramebuffer);if(F.__webglDepthbuffer&&s.deleteRenderbuffer(F.__webglDepthbuffer),F.__webglMultisampledFramebuffer&&s.deleteFramebuffer(F.__webglMultisampledFramebuffer),F.__webglColorRenderbuffer)for(let j=0;j<F.__webglColorRenderbuffer.length;j++)F.__webglColorRenderbuffer[j]&&s.deleteRenderbuffer(F.__webglColorRenderbuffer[j]);F.__webglDepthRenderbuffer&&s.deleteRenderbuffer(F.__webglDepthRenderbuffer)}if(y.isWebGLMultipleRenderTargets)for(let j=0,Q=v.length;j<Q;j++){const me=i.get(v[j]);me.__webglTexture&&(s.deleteTexture(me.__webglTexture),o.memory.textures--),i.remove(v[j])}i.remove(v),i.remove(y)}let $=0;function ie(){$=0}function C(){const y=$;return y>=n.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+y+" texture units while this GPU supports only "+n.maxTextures),$+=1,y}function O(y){const v=[];return v.push(y.wrapS),v.push(y.wrapT),v.push(y.wrapR||0),v.push(y.magFilter),v.push(y.minFilter),v.push(y.anisotropy),v.push(y.internalFormat),v.push(y.format),v.push(y.type),v.push(y.generateMipmaps),v.push(y.premultiplyAlpha),v.push(y.flipY),v.push(y.unpackAlignment),v.push(y.colorSpace),v.join()}function z(y,v){const F=i.get(y);if(y.isVideoTexture&&Ze(y),y.isRenderTargetTexture===!1&&y.version>0&&F.__version!==y.version){const J=y.image;if(J===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(J.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{ae(F,y,v);return}}t.bindTexture(s.TEXTURE_2D,F.__webglTexture,s.TEXTURE0+v)}function W(y,v){const F=i.get(y);if(y.version>0&&F.__version!==y.version){ae(F,y,v);return}t.bindTexture(s.TEXTURE_2D_ARRAY,F.__webglTexture,s.TEXTURE0+v)}function V(y,v){const F=i.get(y);if(y.version>0&&F.__version!==y.version){ae(F,y,v);return}t.bindTexture(s.TEXTURE_3D,F.__webglTexture,s.TEXTURE0+v)}function H(y,v){const F=i.get(y);if(y.version>0&&F.__version!==y.version){de(F,y,v);return}t.bindTexture(s.TEXTURE_CUBE_MAP,F.__webglTexture,s.TEXTURE0+v)}const Y={1e3:s.REPEAT,1001:s.CLAMP_TO_EDGE,1002:s.MIRRORED_REPEAT},Z={1003:s.NEAREST,1004:s.NEAREST_MIPMAP_NEAREST,1005:s.NEAREST_MIPMAP_LINEAR,1006:s.LINEAR,1007:s.LINEAR_MIPMAP_NEAREST,1008:s.LINEAR_MIPMAP_LINEAR},le={512:s.NEVER,519:s.ALWAYS,513:s.LESS,515:s.LEQUAL,514:s.EQUAL,518:s.GEQUAL,516:s.GREATER,517:s.NOTEQUAL};function G(y,v,F){if(F?(s.texParameteri(y,s.TEXTURE_WRAP_S,Y[v.wrapS]),s.texParameteri(y,s.TEXTURE_WRAP_T,Y[v.wrapT]),(y===s.TEXTURE_3D||y===s.TEXTURE_2D_ARRAY)&&s.texParameteri(y,s.TEXTURE_WRAP_R,Y[v.wrapR]),s.texParameteri(y,s.TEXTURE_MAG_FILTER,Z[v.magFilter]),s.texParameteri(y,s.TEXTURE_MIN_FILTER,Z[v.minFilter])):(s.texParameteri(y,s.TEXTURE_WRAP_S,s.CLAMP_TO_EDGE),s.texParameteri(y,s.TEXTURE_WRAP_T,s.CLAMP_TO_EDGE),(y===s.TEXTURE_3D||y===s.TEXTURE_2D_ARRAY)&&s.texParameteri(y,s.TEXTURE_WRAP_R,s.CLAMP_TO_EDGE),(v.wrapS!==1001||v.wrapT!==1001)&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping."),s.texParameteri(y,s.TEXTURE_MAG_FILTER,R(v.magFilter)),s.texParameteri(y,s.TEXTURE_MIN_FILTER,R(v.minFilter)),v.minFilter!==1003&&v.minFilter!==1006&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.")),v.compareFunction&&(s.texParameteri(y,s.TEXTURE_COMPARE_MODE,s.COMPARE_REF_TO_TEXTURE),s.texParameteri(y,s.TEXTURE_COMPARE_FUNC,le[v.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){const J=e.get("EXT_texture_filter_anisotropic");if(v.magFilter===1003||v.minFilter!==1005&&v.minFilter!==1008||v.type===1015&&e.has("OES_texture_float_linear")===!1||a===!1&&v.type===1016&&e.has("OES_texture_half_float_linear")===!1)return;(v.anisotropy>1||i.get(v).__currentAnisotropy)&&(s.texParameterf(y,J.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(v.anisotropy,n.getMaxAnisotropy())),i.get(v).__currentAnisotropy=v.anisotropy)}}function X(y,v){let F=!1;y.__webglInit===void 0&&(y.__webglInit=!0,v.addEventListener("dispose",w));const J=v.source;let j=f.get(J);j===void 0&&(j={},f.set(J,j));const Q=O(v);if(Q!==y.__cacheKey){j[Q]===void 0&&(j[Q]={texture:s.createTexture(),usedTimes:0},o.memory.textures++,F=!0),j[Q].usedTimes++;const me=j[y.__cacheKey];me!==void 0&&(j[y.__cacheKey].usedTimes--,me.usedTimes===0&&T(v)),y.__cacheKey=Q,y.__webglTexture=j[Q].texture}return F}function ae(y,v,F){let J=s.TEXTURE_2D;(v.isDataArrayTexture||v.isCompressedArrayTexture)&&(J=s.TEXTURE_2D_ARRAY),v.isData3DTexture&&(J=s.TEXTURE_3D);const j=X(y,v),Q=v.source;t.bindTexture(J,y.__webglTexture,s.TEXTURE0+F);const me=i.get(Q);if(Q.version!==me.__version||j===!0){t.activeTexture(s.TEXTURE0+F);const oe=Xe.getPrimaries(Xe.workingColorSpace),he=v.colorSpace===wt?null:Xe.getPrimaries(v.colorSpace),Ee=v.colorSpace===wt||oe===he?s.NONE:s.BROWSER_DEFAULT_WEBGL;s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,v.flipY),s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),s.pixelStorei(s.UNPACK_ALIGNMENT,v.unpackAlignment),s.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ee);const Fe=d(v)&&p(v.image)===!1;let K=_(v.image,Fe,!1,n.maxTextureSize);K=Ue(v,K);const qe=p(K)||a,Ge=r.convert(v.format,v.colorSpace);let Re=r.convert(v.type),_e=A(v.internalFormat,Ge,Re,v.colorSpace,v.isVideoTexture);G(J,v,qe);let fe;const Ie=v.mipmaps,Ve=a&&v.isVideoTexture!==!0&&_e!==36196,et=me.__version===void 0||j===!0,Be=P(v,K,qe);if(v.isDepthTexture)_e=s.DEPTH_COMPONENT,a?v.type===1015?_e=s.DEPTH_COMPONENT32F:v.type===1014?_e=s.DEPTH_COMPONENT24:v.type===1020?_e=s.DEPTH24_STENCIL8:_e=s.DEPTH_COMPONENT16:v.type===1015&&console.error("WebGLRenderer: Floating point depth texture requires WebGL2."),v.format===1026&&_e===s.DEPTH_COMPONENT&&v.type!==1012&&v.type!==1014&&(console.warn("THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture."),v.type=1014,Re=r.convert(v.type)),v.format===1027&&_e===s.DEPTH_COMPONENT&&(_e=s.DEPTH_STENCIL,v.type!==1020&&(console.warn("THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture."),v.type=1020,Re=r.convert(v.type))),et&&(Ve?t.texStorage2D(s.TEXTURE_2D,1,_e,K.width,K.height):t.texImage2D(s.TEXTURE_2D,0,_e,K.width,K.height,0,Ge,Re,null));else if(v.isDataTexture)if(Ie.length>0&&qe){Ve&&et&&t.texStorage2D(s.TEXTURE_2D,Be,_e,Ie[0].width,Ie[0].height);for(let ne=0,b=Ie.length;ne<b;ne++)fe=Ie[ne],Ve?t.texSubImage2D(s.TEXTURE_2D,ne,0,0,fe.width,fe.height,Ge,Re,fe.data):t.texImage2D(s.TEXTURE_2D,ne,_e,fe.width,fe.height,0,Ge,Re,fe.data);v.generateMipmaps=!1}else Ve?(et&&t.texStorage2D(s.TEXTURE_2D,Be,_e,K.width,K.height),t.texSubImage2D(s.TEXTURE_2D,0,0,0,K.width,K.height,Ge,Re,K.data)):t.texImage2D(s.TEXTURE_2D,0,_e,K.width,K.height,0,Ge,Re,K.data);else if(v.isCompressedTexture)if(v.isCompressedArrayTexture){Ve&&et&&t.texStorage3D(s.TEXTURE_2D_ARRAY,Be,_e,Ie[0].width,Ie[0].height,K.depth);for(let ne=0,b=Ie.length;ne<b;ne++)fe=Ie[ne],v.format!==1023?Ge!==null?Ve?t.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,ne,0,0,0,fe.width,fe.height,K.depth,Ge,fe.data,0,0):t.compressedTexImage3D(s.TEXTURE_2D_ARRAY,ne,_e,fe.width,fe.height,K.depth,0,fe.data,0,0):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ve?t.texSubImage3D(s.TEXTURE_2D_ARRAY,ne,0,0,0,fe.width,fe.height,K.depth,Ge,Re,fe.data):t.texImage3D(s.TEXTURE_2D_ARRAY,ne,_e,fe.width,fe.height,K.depth,0,Ge,Re,fe.data)}else{Ve&&et&&t.texStorage2D(s.TEXTURE_2D,Be,_e,Ie[0].width,Ie[0].height);for(let ne=0,b=Ie.length;ne<b;ne++)fe=Ie[ne],v.format!==1023?Ge!==null?Ve?t.compressedTexSubImage2D(s.TEXTURE_2D,ne,0,0,fe.width,fe.height,Ge,fe.data):t.compressedTexImage2D(s.TEXTURE_2D,ne,_e,fe.width,fe.height,0,fe.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ve?t.texSubImage2D(s.TEXTURE_2D,ne,0,0,fe.width,fe.height,Ge,Re,fe.data):t.texImage2D(s.TEXTURE_2D,ne,_e,fe.width,fe.height,0,Ge,Re,fe.data)}else if(v.isDataArrayTexture)Ve?(et&&t.texStorage3D(s.TEXTURE_2D_ARRAY,Be,_e,K.width,K.height,K.depth),t.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,0,K.width,K.height,K.depth,Ge,Re,K.data)):t.texImage3D(s.TEXTURE_2D_ARRAY,0,_e,K.width,K.height,K.depth,0,Ge,Re,K.data);else if(v.isData3DTexture)Ve?(et&&t.texStorage3D(s.TEXTURE_3D,Be,_e,K.width,K.height,K.depth),t.texSubImage3D(s.TEXTURE_3D,0,0,0,0,K.width,K.height,K.depth,Ge,Re,K.data)):t.texImage3D(s.TEXTURE_3D,0,_e,K.width,K.height,K.depth,0,Ge,Re,K.data);else if(v.isFramebufferTexture){if(et)if(Ve)t.texStorage2D(s.TEXTURE_2D,Be,_e,K.width,K.height);else{let ne=K.width,b=K.height;for(let se=0;se<Be;se++)t.texImage2D(s.TEXTURE_2D,se,_e,ne,b,0,Ge,Re,null),ne>>=1,b>>=1}}else if(Ie.length>0&&qe){Ve&&et&&t.texStorage2D(s.TEXTURE_2D,Be,_e,Ie[0].width,Ie[0].height);for(let ne=0,b=Ie.length;ne<b;ne++)fe=Ie[ne],Ve?t.texSubImage2D(s.TEXTURE_2D,ne,0,0,Ge,Re,fe):t.texImage2D(s.TEXTURE_2D,ne,_e,Ge,Re,fe);v.generateMipmaps=!1}else Ve?(et&&t.texStorage2D(s.TEXTURE_2D,Be,_e,K.width,K.height),t.texSubImage2D(s.TEXTURE_2D,0,0,0,Ge,Re,K)):t.texImage2D(s.TEXTURE_2D,0,_e,Ge,Re,K);E(v,qe)&&x(J),me.__version=Q.version,v.onUpdate&&v.onUpdate(v)}y.__version=v.version}function de(y,v,F){if(v.image.length!==6)return;const J=X(y,v),j=v.source;t.bindTexture(s.TEXTURE_CUBE_MAP,y.__webglTexture,s.TEXTURE0+F);const Q=i.get(j);if(j.version!==Q.__version||J===!0){t.activeTexture(s.TEXTURE0+F);const me=Xe.getPrimaries(Xe.workingColorSpace),oe=v.colorSpace===wt?null:Xe.getPrimaries(v.colorSpace),he=v.colorSpace===wt||me===oe?s.NONE:s.BROWSER_DEFAULT_WEBGL;s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,v.flipY),s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),s.pixelStorei(s.UNPACK_ALIGNMENT,v.unpackAlignment),s.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,he);const Ee=v.isCompressedTexture||v.image[0].isCompressedTexture,Fe=v.image[0]&&v.image[0].isDataTexture,K=[];for(let ne=0;ne<6;ne++)!Ee&&!Fe?K[ne]=_(v.image[ne],!1,!0,n.maxCubemapSize):K[ne]=Fe?v.image[ne].image:v.image[ne],K[ne]=Ue(v,K[ne]);const qe=K[0],Ge=p(qe)||a,Re=r.convert(v.format,v.colorSpace),_e=r.convert(v.type),fe=A(v.internalFormat,Re,_e,v.colorSpace),Ie=a&&v.isVideoTexture!==!0,Ve=Q.__version===void 0||J===!0;let et=P(v,qe,Ge);G(s.TEXTURE_CUBE_MAP,v,Ge);let Be;if(Ee){Ie&&Ve&&t.texStorage2D(s.TEXTURE_CUBE_MAP,et,fe,qe.width,qe.height);for(let ne=0;ne<6;ne++){Be=K[ne].mipmaps;for(let b=0;b<Be.length;b++){const se=Be[b];v.format!==1023?Re!==null?Ie?t.compressedTexSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ne,b,0,0,se.width,se.height,Re,se.data):t.compressedTexImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ne,b,fe,se.width,se.height,0,se.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Ie?t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ne,b,0,0,se.width,se.height,Re,_e,se.data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ne,b,fe,se.width,se.height,0,Re,_e,se.data)}}}else{Be=v.mipmaps,Ie&&Ve&&(Be.length>0&&et++,t.texStorage2D(s.TEXTURE_CUBE_MAP,et,fe,K[0].width,K[0].height));for(let ne=0;ne<6;ne++)if(Fe){Ie?t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,0,0,K[ne].width,K[ne].height,Re,_e,K[ne].data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,fe,K[ne].width,K[ne].height,0,Re,_e,K[ne].data);for(let b=0;b<Be.length;b++){const re=Be[b].image[ne].image;Ie?t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ne,b+1,0,0,re.width,re.height,Re,_e,re.data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ne,b+1,fe,re.width,re.height,0,Re,_e,re.data)}}else{Ie?t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,0,0,Re,_e,K[ne]):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,fe,Re,_e,K[ne]);for(let b=0;b<Be.length;b++){const se=Be[b];Ie?t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ne,b+1,0,0,Re,_e,se.image[ne]):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ne,b+1,fe,Re,_e,se.image[ne])}}}E(v,Ge)&&x(s.TEXTURE_CUBE_MAP),Q.__version=j.version,v.onUpdate&&v.onUpdate(v)}y.__version=v.version}function ue(y,v,F,J,j,Q){const me=r.convert(F.format,F.colorSpace),oe=r.convert(F.type),he=A(F.internalFormat,me,oe,F.colorSpace);if(!i.get(v).__hasExternalTextures){const Fe=Math.max(1,v.width>>Q),K=Math.max(1,v.height>>Q);j===s.TEXTURE_3D||j===s.TEXTURE_2D_ARRAY?t.texImage3D(j,Q,he,Fe,K,v.depth,0,me,oe,null):t.texImage2D(j,Q,he,Fe,K,0,me,oe,null)}t.bindFramebuffer(s.FRAMEBUFFER,y),pe(v)?l.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,J,j,i.get(F).__webglTexture,0,Ce(v)):(j===s.TEXTURE_2D||j>=s.TEXTURE_CUBE_MAP_POSITIVE_X&&j<=s.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&s.framebufferTexture2D(s.FRAMEBUFFER,J,j,i.get(F).__webglTexture,Q),t.bindFramebuffer(s.FRAMEBUFFER,null)}function xe(y,v,F){if(s.bindRenderbuffer(s.RENDERBUFFER,y),v.depthBuffer&&!v.stencilBuffer){let J=a===!0?s.DEPTH_COMPONENT24:s.DEPTH_COMPONENT16;if(F||pe(v)){const j=v.depthTexture;j&&j.isDepthTexture&&(j.type===1015?J=s.DEPTH_COMPONENT32F:j.type===1014&&(J=s.DEPTH_COMPONENT24));const Q=Ce(v);pe(v)?l.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,Q,J,v.width,v.height):s.renderbufferStorageMultisample(s.RENDERBUFFER,Q,J,v.width,v.height)}else s.renderbufferStorage(s.RENDERBUFFER,J,v.width,v.height);s.framebufferRenderbuffer(s.FRAMEBUFFER,s.DEPTH_ATTACHMENT,s.RENDERBUFFER,y)}else if(v.depthBuffer&&v.stencilBuffer){const J=Ce(v);F&&pe(v)===!1?s.renderbufferStorageMultisample(s.RENDERBUFFER,J,s.DEPTH24_STENCIL8,v.width,v.height):pe(v)?l.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,J,s.DEPTH24_STENCIL8,v.width,v.height):s.renderbufferStorage(s.RENDERBUFFER,s.DEPTH_STENCIL,v.width,v.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.DEPTH_STENCIL_ATTACHMENT,s.RENDERBUFFER,y)}else{const J=v.isWebGLMultipleRenderTargets===!0?v.texture:[v.texture];for(let j=0;j<J.length;j++){const Q=J[j],me=r.convert(Q.format,Q.colorSpace),oe=r.convert(Q.type),he=A(Q.internalFormat,me,oe,Q.colorSpace),Ee=Ce(v);F&&pe(v)===!1?s.renderbufferStorageMultisample(s.RENDERBUFFER,Ee,he,v.width,v.height):pe(v)?l.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,Ee,he,v.width,v.height):s.renderbufferStorage(s.RENDERBUFFER,he,v.width,v.height)}}s.bindRenderbuffer(s.RENDERBUFFER,null)}function we(y,v){if(v&&v.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(s.FRAMEBUFFER,y),!(v.depthTexture&&v.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!i.get(v.depthTexture).__webglTexture||v.depthTexture.image.width!==v.width||v.depthTexture.image.height!==v.height)&&(v.depthTexture.image.width=v.width,v.depthTexture.image.height=v.height,v.depthTexture.needsUpdate=!0),z(v.depthTexture,0);const J=i.get(v.depthTexture).__webglTexture,j=Ce(v);if(v.depthTexture.format===1026)pe(v)?l.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,s.DEPTH_ATTACHMENT,s.TEXTURE_2D,J,0,j):s.framebufferTexture2D(s.FRAMEBUFFER,s.DEPTH_ATTACHMENT,s.TEXTURE_2D,J,0);else if(v.depthTexture.format===1027)pe(v)?l.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,s.DEPTH_STENCIL_ATTACHMENT,s.TEXTURE_2D,J,0,j):s.framebufferTexture2D(s.FRAMEBUFFER,s.DEPTH_STENCIL_ATTACHMENT,s.TEXTURE_2D,J,0);else throw new Error("Unknown depthTexture format")}function ve(y){const v=i.get(y),F=y.isWebGLCubeRenderTarget===!0;if(y.depthTexture&&!v.__autoAllocateDepthBuffer){if(F)throw new Error("target.depthTexture not supported in Cube render targets");we(v.__webglFramebuffer,y)}else if(F){v.__webglDepthbuffer=[];for(let J=0;J<6;J++)t.bindFramebuffer(s.FRAMEBUFFER,v.__webglFramebuffer[J]),v.__webglDepthbuffer[J]=s.createRenderbuffer(),xe(v.__webglDepthbuffer[J],y,!1)}else t.bindFramebuffer(s.FRAMEBUFFER,v.__webglFramebuffer),v.__webglDepthbuffer=s.createRenderbuffer(),xe(v.__webglDepthbuffer,y,!1);t.bindFramebuffer(s.FRAMEBUFFER,null)}function ze(y,v,F){const J=i.get(y);v!==void 0&&ue(J.__webglFramebuffer,y,y.texture,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,0),F!==void 0&&ve(y)}function I(y){const v=y.texture,F=i.get(y),J=i.get(v);y.addEventListener("dispose",q),y.isWebGLMultipleRenderTargets!==!0&&(J.__webglTexture===void 0&&(J.__webglTexture=s.createTexture()),J.__version=v.version,o.memory.textures++);const j=y.isWebGLCubeRenderTarget===!0,Q=y.isWebGLMultipleRenderTargets===!0,me=p(y)||a;if(j){F.__webglFramebuffer=[];for(let oe=0;oe<6;oe++)if(a&&v.mipmaps&&v.mipmaps.length>0){F.__webglFramebuffer[oe]=[];for(let he=0;he<v.mipmaps.length;he++)F.__webglFramebuffer[oe][he]=s.createFramebuffer()}else F.__webglFramebuffer[oe]=s.createFramebuffer()}else{if(a&&v.mipmaps&&v.mipmaps.length>0){F.__webglFramebuffer=[];for(let oe=0;oe<v.mipmaps.length;oe++)F.__webglFramebuffer[oe]=s.createFramebuffer()}else F.__webglFramebuffer=s.createFramebuffer();if(Q)if(n.drawBuffers){const oe=y.texture;for(let he=0,Ee=oe.length;he<Ee;he++){const Fe=i.get(oe[he]);Fe.__webglTexture===void 0&&(Fe.__webglTexture=s.createTexture(),o.memory.textures++)}}else console.warn("THREE.WebGLRenderer: WebGLMultipleRenderTargets can only be used with WebGL2 or WEBGL_draw_buffers extension.");if(a&&y.samples>0&&pe(y)===!1){const oe=Q?v:[v];F.__webglMultisampledFramebuffer=s.createFramebuffer(),F.__webglColorRenderbuffer=[],t.bindFramebuffer(s.FRAMEBUFFER,F.__webglMultisampledFramebuffer);for(let he=0;he<oe.length;he++){const Ee=oe[he];F.__webglColorRenderbuffer[he]=s.createRenderbuffer(),s.bindRenderbuffer(s.RENDERBUFFER,F.__webglColorRenderbuffer[he]);const Fe=r.convert(Ee.format,Ee.colorSpace),K=r.convert(Ee.type),qe=A(Ee.internalFormat,Fe,K,Ee.colorSpace,y.isXRRenderTarget===!0),Ge=Ce(y);s.renderbufferStorageMultisample(s.RENDERBUFFER,Ge,qe,y.width,y.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+he,s.RENDERBUFFER,F.__webglColorRenderbuffer[he])}s.bindRenderbuffer(s.RENDERBUFFER,null),y.depthBuffer&&(F.__webglDepthRenderbuffer=s.createRenderbuffer(),xe(F.__webglDepthRenderbuffer,y,!0)),t.bindFramebuffer(s.FRAMEBUFFER,null)}}if(j){t.bindTexture(s.TEXTURE_CUBE_MAP,J.__webglTexture),G(s.TEXTURE_CUBE_MAP,v,me);for(let oe=0;oe<6;oe++)if(a&&v.mipmaps&&v.mipmaps.length>0)for(let he=0;he<v.mipmaps.length;he++)ue(F.__webglFramebuffer[oe][he],y,v,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+oe,he);else ue(F.__webglFramebuffer[oe],y,v,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+oe,0);E(v,me)&&x(s.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(Q){const oe=y.texture;for(let he=0,Ee=oe.length;he<Ee;he++){const Fe=oe[he],K=i.get(Fe);t.bindTexture(s.TEXTURE_2D,K.__webglTexture),G(s.TEXTURE_2D,Fe,me),ue(F.__webglFramebuffer,y,Fe,s.COLOR_ATTACHMENT0+he,s.TEXTURE_2D,0),E(Fe,me)&&x(s.TEXTURE_2D)}t.unbindTexture()}else{let oe=s.TEXTURE_2D;if((y.isWebGL3DRenderTarget||y.isWebGLArrayRenderTarget)&&(a?oe=y.isWebGL3DRenderTarget?s.TEXTURE_3D:s.TEXTURE_2D_ARRAY:console.error("THREE.WebGLTextures: THREE.Data3DTexture and THREE.DataArrayTexture only supported with WebGL2.")),t.bindTexture(oe,J.__webglTexture),G(oe,v,me),a&&v.mipmaps&&v.mipmaps.length>0)for(let he=0;he<v.mipmaps.length;he++)ue(F.__webglFramebuffer[he],y,v,s.COLOR_ATTACHMENT0,oe,he);else ue(F.__webglFramebuffer,y,v,s.COLOR_ATTACHMENT0,oe,0);E(v,me)&&x(oe),t.unbindTexture()}y.depthBuffer&&ve(y)}function gt(y){const v=p(y)||a,F=y.isWebGLMultipleRenderTargets===!0?y.texture:[y.texture];for(let J=0,j=F.length;J<j;J++){const Q=F[J];if(E(Q,v)){const me=y.isWebGLCubeRenderTarget?s.TEXTURE_CUBE_MAP:s.TEXTURE_2D,oe=i.get(Q).__webglTexture;t.bindTexture(me,oe),x(me),t.unbindTexture()}}}function Se(y){if(a&&y.samples>0&&pe(y)===!1){const v=y.isWebGLMultipleRenderTargets?y.texture:[y.texture],F=y.width,J=y.height;let j=s.COLOR_BUFFER_BIT;const Q=[],me=y.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,oe=i.get(y),he=y.isWebGLMultipleRenderTargets===!0;if(he)for(let Ee=0;Ee<v.length;Ee++)t.bindFramebuffer(s.FRAMEBUFFER,oe.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+Ee,s.RENDERBUFFER,null),t.bindFramebuffer(s.FRAMEBUFFER,oe.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+Ee,s.TEXTURE_2D,null,0);t.bindFramebuffer(s.READ_FRAMEBUFFER,oe.__webglMultisampledFramebuffer),t.bindFramebuffer(s.DRAW_FRAMEBUFFER,oe.__webglFramebuffer);for(let Ee=0;Ee<v.length;Ee++){Q.push(s.COLOR_ATTACHMENT0+Ee),y.depthBuffer&&Q.push(me);const Fe=oe.__ignoreDepthValues!==void 0?oe.__ignoreDepthValues:!1;if(Fe===!1&&(y.depthBuffer&&(j|=s.DEPTH_BUFFER_BIT),y.stencilBuffer&&(j|=s.STENCIL_BUFFER_BIT)),he&&s.framebufferRenderbuffer(s.READ_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.RENDERBUFFER,oe.__webglColorRenderbuffer[Ee]),Fe===!0&&(s.invalidateFramebuffer(s.READ_FRAMEBUFFER,[me]),s.invalidateFramebuffer(s.DRAW_FRAMEBUFFER,[me])),he){const K=i.get(v[Ee]).__webglTexture;s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,K,0)}s.blitFramebuffer(0,0,F,J,0,0,F,J,j,s.NEAREST),c&&s.invalidateFramebuffer(s.READ_FRAMEBUFFER,Q)}if(t.bindFramebuffer(s.READ_FRAMEBUFFER,null),t.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),he)for(let Ee=0;Ee<v.length;Ee++){t.bindFramebuffer(s.FRAMEBUFFER,oe.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+Ee,s.RENDERBUFFER,oe.__webglColorRenderbuffer[Ee]);const Fe=i.get(v[Ee]).__webglTexture;t.bindFramebuffer(s.FRAMEBUFFER,oe.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+Ee,s.TEXTURE_2D,Fe,0)}t.bindFramebuffer(s.DRAW_FRAMEBUFFER,oe.__webglMultisampledFramebuffer)}}function Ce(y){return Math.min(n.maxSamples,y.samples)}function pe(y){const v=i.get(y);return a&&y.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&v.__useRenderToTexture!==!1}function Ze(y){const v=o.render.frame;u.get(y)!==v&&(u.set(y,v),y.update())}function Ue(y,v){const F=y.colorSpace,J=y.format,j=y.type;return y.isCompressedTexture===!0||y.isVideoTexture===!0||y.format===1035||F!==Ht&&F!==wt&&(Xe.getTransfer(F)===je?a===!1?e.has("EXT_sRGB")===!0&&J===1023?(y.format=1035,y.minFilter=1006,y.generateMipmaps=!1):v=Rs.sRGBToLinear(v):(J!==1023||j!==1009)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",F)),v}this.allocateTextureUnit=C,this.resetTextureUnits=ie,this.setTexture2D=z,this.setTexture2DArray=W,this.setTexture3D=V,this.setTextureCube=H,this.rebindTextures=ze,this.setupRenderTarget=I,this.updateRenderTargetMipmap=gt,this.updateMultisampleRenderTarget=Se,this.setupDepthRenderbuffer=ve,this.setupFrameBufferTexture=ue,this.useMultisampledRTT=pe}function pu(s,e,t){const i=t.isWebGL2;function n(r,o=wt){let a;const l=Xe.getTransfer(o);if(r===1009)return s.UNSIGNED_BYTE;if(r===1017)return s.UNSIGNED_SHORT_4_4_4_4;if(r===1018)return s.UNSIGNED_SHORT_5_5_5_1;if(r===1010)return s.BYTE;if(r===1011)return s.SHORT;if(r===1012)return s.UNSIGNED_SHORT;if(r===1013)return s.INT;if(r===1014)return s.UNSIGNED_INT;if(r===1015)return s.FLOAT;if(r===1016)return i?s.HALF_FLOAT:(a=e.get("OES_texture_half_float"),a!==null?a.HALF_FLOAT_OES:null);if(r===1021)return s.ALPHA;if(r===1023)return s.RGBA;if(r===1024)return s.LUMINANCE;if(r===1025)return s.LUMINANCE_ALPHA;if(r===1026)return s.DEPTH_COMPONENT;if(r===1027)return s.DEPTH_STENCIL;if(r===1035)return a=e.get("EXT_sRGB"),a!==null?a.SRGB_ALPHA_EXT:null;if(r===1028)return s.RED;if(r===1029)return s.RED_INTEGER;if(r===1030)return s.RG;if(r===1031)return s.RG_INTEGER;if(r===1033)return s.RGBA_INTEGER;if(r===33776||r===33777||r===33778||r===33779)if(l===je)if(a=e.get("WEBGL_compressed_texture_s3tc_srgb"),a!==null){if(r===33776)return a.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(r===33777)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(r===33778)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(r===33779)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(a=e.get("WEBGL_compressed_texture_s3tc"),a!==null){if(r===33776)return a.COMPRESSED_RGB_S3TC_DXT1_EXT;if(r===33777)return a.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(r===33778)return a.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(r===33779)return a.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(r===35840||r===35841||r===35842||r===35843)if(a=e.get("WEBGL_compressed_texture_pvrtc"),a!==null){if(r===35840)return a.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(r===35841)return a.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(r===35842)return a.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(r===35843)return a.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(r===36196)return a=e.get("WEBGL_compressed_texture_etc1"),a!==null?a.COMPRESSED_RGB_ETC1_WEBGL:null;if(r===37492||r===37496)if(a=e.get("WEBGL_compressed_texture_etc"),a!==null){if(r===37492)return l===je?a.COMPRESSED_SRGB8_ETC2:a.COMPRESSED_RGB8_ETC2;if(r===37496)return l===je?a.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:a.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(r===37808||r===37809||r===37810||r===37811||r===37812||r===37813||r===37814||r===37815||r===37816||r===37817||r===37818||r===37819||r===37820||r===37821)if(a=e.get("WEBGL_compressed_texture_astc"),a!==null){if(r===37808)return l===je?a.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:a.COMPRESSED_RGBA_ASTC_4x4_KHR;if(r===37809)return l===je?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:a.COMPRESSED_RGBA_ASTC_5x4_KHR;if(r===37810)return l===je?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:a.COMPRESSED_RGBA_ASTC_5x5_KHR;if(r===37811)return l===je?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:a.COMPRESSED_RGBA_ASTC_6x5_KHR;if(r===37812)return l===je?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:a.COMPRESSED_RGBA_ASTC_6x6_KHR;if(r===37813)return l===je?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:a.COMPRESSED_RGBA_ASTC_8x5_KHR;if(r===37814)return l===je?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:a.COMPRESSED_RGBA_ASTC_8x6_KHR;if(r===37815)return l===je?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:a.COMPRESSED_RGBA_ASTC_8x8_KHR;if(r===37816)return l===je?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:a.COMPRESSED_RGBA_ASTC_10x5_KHR;if(r===37817)return l===je?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:a.COMPRESSED_RGBA_ASTC_10x6_KHR;if(r===37818)return l===je?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:a.COMPRESSED_RGBA_ASTC_10x8_KHR;if(r===37819)return l===je?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:a.COMPRESSED_RGBA_ASTC_10x10_KHR;if(r===37820)return l===je?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:a.COMPRESSED_RGBA_ASTC_12x10_KHR;if(r===37821)return l===je?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:a.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(r===36492||r===36494||r===36495)if(a=e.get("EXT_texture_compression_bptc"),a!==null){if(r===36492)return l===je?a.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:a.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(r===36494)return a.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(r===36495)return a.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(r===36283||r===36284||r===36285||r===36286)if(a=e.get("EXT_texture_compression_rgtc"),a!==null){if(r===36492)return a.COMPRESSED_RED_RGTC1_EXT;if(r===36284)return a.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(r===36285)return a.COMPRESSED_RED_GREEN_RGTC2_EXT;if(r===36286)return a.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return r===1020?i?s.UNSIGNED_INT_24_8:(a=e.get("WEBGL_depth_texture"),a!==null?a.UNSIGNED_INT_24_8_WEBGL:null):s[r]!==void 0?s[r]:null}return{convert:n}}class mu extends Nt{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}}class Ci extends Mt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const gu={type:"move"};class hs{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Ci,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Ci,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new D,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new D),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Ci,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new D,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new D),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let n=null,r=null,o=null;const a=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){o=!0;for(const _ of e.hand.values()){const p=t.getJointPose(_,i),d=this._getHandJoint(c,_);p!==null&&(d.matrix.fromArray(p.transform.matrix),d.matrix.decompose(d.position,d.rotation,d.scale),d.matrixWorldNeedsUpdate=!0,d.jointRadius=p.radius),d.visible=p!==null}const u=c.joints["index-finger-tip"],h=c.joints["thumb-tip"],f=u.position.distanceTo(h.position),m=.02,g=.005;c.inputState.pinching&&f>m+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&f<=m-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,i),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(n=t.getPose(e.targetRaySpace,i),n===null&&r!==null&&(n=r),n!==null&&(a.matrix.fromArray(n.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,n.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(n.linearVelocity)):a.hasLinearVelocity=!1,n.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(n.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(gu)))}return a!==null&&(a.visible=n!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const i=new Ci;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}}class _u extends fn{constructor(e,t){super();const i=this;let n=null,r=1,o=null,a="local-floor",l=1,c=null,u=null,h=null,f=null,m=null,g=null;const _=t.getContextAttributes();let p=null,d=null;const E=[],x=[],A=new We;let P=null;const R=new Nt;R.layers.enable(1),R.viewport=new dt;const w=new Nt;w.layers.enable(2),w.viewport=new dt;const q=[R,w],M=new mu;M.layers.enable(1),M.layers.enable(2);let T=null,k=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(G){let X=E[G];return X===void 0&&(X=new hs,E[G]=X),X.getTargetRaySpace()},this.getControllerGrip=function(G){let X=E[G];return X===void 0&&(X=new hs,E[G]=X),X.getGripSpace()},this.getHand=function(G){let X=E[G];return X===void 0&&(X=new hs,E[G]=X),X.getHandSpace()};function $(G){const X=x.indexOf(G.inputSource);if(X===-1)return;const ae=E[X];ae!==void 0&&(ae.update(G.inputSource,G.frame,c||o),ae.dispatchEvent({type:G.type,data:G.inputSource}))}function ie(){n.removeEventListener("select",$),n.removeEventListener("selectstart",$),n.removeEventListener("selectend",$),n.removeEventListener("squeeze",$),n.removeEventListener("squeezestart",$),n.removeEventListener("squeezeend",$),n.removeEventListener("end",ie),n.removeEventListener("inputsourceschange",C);for(let G=0;G<E.length;G++){const X=x[G];X!==null&&(x[G]=null,E[G].disconnect(X))}T=null,k=null,e.setRenderTarget(p),m=null,f=null,h=null,n=null,d=null,le.stop(),i.isPresenting=!1,e.setPixelRatio(P),e.setSize(A.width,A.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(G){r=G,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(G){a=G,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(G){c=G},this.getBaseLayer=function(){return f!==null?f:m},this.getBinding=function(){return h},this.getFrame=function(){return g},this.getSession=function(){return n},this.setSession=async function(G){if(n=G,n!==null){if(p=e.getRenderTarget(),n.addEventListener("select",$),n.addEventListener("selectstart",$),n.addEventListener("selectend",$),n.addEventListener("squeeze",$),n.addEventListener("squeezestart",$),n.addEventListener("squeezeend",$),n.addEventListener("end",ie),n.addEventListener("inputsourceschange",C),_.xrCompatible!==!0&&await t.makeXRCompatible(),P=e.getPixelRatio(),e.getSize(A),n.renderState.layers===void 0||e.capabilities.isWebGL2===!1){const X={antialias:n.renderState.layers===void 0?_.antialias:!0,alpha:!0,depth:_.depth,stencil:_.stencil,framebufferScaleFactor:r};m=new XRWebGLLayer(n,t,X),n.updateRenderState({baseLayer:m}),e.setPixelRatio(1),e.setSize(m.framebufferWidth,m.framebufferHeight,!1),d=new tn(m.framebufferWidth,m.framebufferHeight,{format:1023,type:1009,colorSpace:e.outputColorSpace,stencilBuffer:_.stencil})}else{let X=null,ae=null,de=null;_.depth&&(de=_.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,X=_.stencil?1027:1026,ae=_.stencil?1020:1014);const ue={colorFormat:t.RGBA8,depthFormat:de,scaleFactor:r};h=new XRWebGLBinding(n,t),f=h.createProjectionLayer(ue),n.updateRenderState({layers:[f]}),e.setPixelRatio(1),e.setSize(f.textureWidth,f.textureHeight,!1),d=new tn(f.textureWidth,f.textureHeight,{format:1023,type:1009,depthTexture:new lr(f.textureWidth,f.textureHeight,ae,void 0,void 0,void 0,void 0,void 0,void 0,X),stencilBuffer:_.stencil,colorSpace:e.outputColorSpace,samples:_.antialias?4:0});const xe=e.properties.get(d);xe.__ignoreDepthValues=f.ignoreDepthValues}d.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await n.requestReferenceSpace(a),le.setContext(n),le.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(n!==null)return n.environmentBlendMode};function C(G){for(let X=0;X<G.removed.length;X++){const ae=G.removed[X],de=x.indexOf(ae);de>=0&&(x[de]=null,E[de].disconnect(ae))}for(let X=0;X<G.added.length;X++){const ae=G.added[X];let de=x.indexOf(ae);if(de===-1){for(let xe=0;xe<E.length;xe++)if(xe>=x.length){x.push(ae),de=xe;break}else if(x[xe]===null){x[xe]=ae,de=xe;break}if(de===-1)break}const ue=E[de];ue&&ue.connect(ae)}}const O=new D,z=new D;function W(G,X,ae){O.setFromMatrixPosition(X.matrixWorld),z.setFromMatrixPosition(ae.matrixWorld);const de=O.distanceTo(z),ue=X.projectionMatrix.elements,xe=ae.projectionMatrix.elements,we=ue[14]/(ue[10]-1),ve=ue[14]/(ue[10]+1),ze=(ue[9]+1)/ue[5],I=(ue[9]-1)/ue[5],gt=(ue[8]-1)/ue[0],Se=(xe[8]+1)/xe[0],Ce=we*gt,pe=we*Se,Ze=de/(-gt+Se),Ue=Ze*-gt;X.matrixWorld.decompose(G.position,G.quaternion,G.scale),G.translateX(Ue),G.translateZ(Ze),G.matrixWorld.compose(G.position,G.quaternion,G.scale),G.matrixWorldInverse.copy(G.matrixWorld).invert();const y=we+Ze,v=ve+Ze,F=Ce-Ue,J=pe+(de-Ue),j=ze*ve/v*y,Q=I*ve/v*y;G.projectionMatrix.makePerspective(F,J,j,Q,y,v),G.projectionMatrixInverse.copy(G.projectionMatrix).invert()}function V(G,X){X===null?G.matrixWorld.copy(G.matrix):G.matrixWorld.multiplyMatrices(X.matrixWorld,G.matrix),G.matrixWorldInverse.copy(G.matrixWorld).invert()}this.updateCamera=function(G){if(n===null)return;M.near=w.near=R.near=G.near,M.far=w.far=R.far=G.far,(T!==M.near||k!==M.far)&&(n.updateRenderState({depthNear:M.near,depthFar:M.far}),T=M.near,k=M.far);const X=G.parent,ae=M.cameras;V(M,X);for(let de=0;de<ae.length;de++)V(ae[de],X);ae.length===2?W(M,R,w):M.projectionMatrix.copy(R.projectionMatrix),H(G,M,X)};function H(G,X,ae){ae===null?G.matrix.copy(X.matrixWorld):(G.matrix.copy(ae.matrixWorld),G.matrix.invert(),G.matrix.multiply(X.matrixWorld)),G.matrix.decompose(G.position,G.quaternion,G.scale),G.updateMatrixWorld(!0),G.projectionMatrix.copy(X.projectionMatrix),G.projectionMatrixInverse.copy(X.projectionMatrixInverse),G.isPerspectiveCamera&&(G.fov=Oi*2*Math.atan(1/G.projectionMatrix.elements[5]),G.zoom=1)}this.getCamera=function(){return M},this.getFoveation=function(){if(!(f===null&&m===null))return l},this.setFoveation=function(G){l=G,f!==null&&(f.fixedFoveation=G),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=G)};let Y=null;function Z(G,X){if(u=X.getViewerPose(c||o),g=X,u!==null){const ae=u.views;m!==null&&(e.setRenderTargetFramebuffer(d,m.framebuffer),e.setRenderTarget(d));let de=!1;ae.length!==M.cameras.length&&(M.cameras.length=0,de=!0);for(let ue=0;ue<ae.length;ue++){const xe=ae[ue];let we=null;if(m!==null)we=m.getViewport(xe);else{const ze=h.getViewSubImage(f,xe);we=ze.viewport,ue===0&&(e.setRenderTargetTextures(d,ze.colorTexture,f.ignoreDepthValues?void 0:ze.depthStencilTexture),e.setRenderTarget(d))}let ve=q[ue];ve===void 0&&(ve=new Nt,ve.layers.enable(ue),ve.viewport=new dt,q[ue]=ve),ve.matrix.fromArray(xe.transform.matrix),ve.matrix.decompose(ve.position,ve.quaternion,ve.scale),ve.projectionMatrix.fromArray(xe.projectionMatrix),ve.projectionMatrixInverse.copy(ve.projectionMatrix).invert(),ve.viewport.set(we.x,we.y,we.width,we.height),ue===0&&(M.matrix.copy(ve.matrix),M.matrix.decompose(M.position,M.quaternion,M.scale)),de===!0&&M.cameras.push(ve)}}for(let ae=0;ae<E.length;ae++){const de=x[ae],ue=E[ae];de!==null&&ue!==void 0&&ue.update(de,X,c||o)}Y&&Y(G,X),X.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:X}),g=null}const le=new Qs;le.setAnimationLoop(Z),this.setAnimationLoop=function(G){Y=G},this.dispose=function(){}}}function vu(s,e){function t(p,d){p.matrixAutoUpdate===!0&&p.updateMatrix(),d.value.copy(p.matrix)}function i(p,d){d.color.getRGB(p.fogColor.value,Ks(s)),d.isFog?(p.fogNear.value=d.near,p.fogFar.value=d.far):d.isFogExp2&&(p.fogDensity.value=d.density)}function n(p,d,E,x,A){d.isMeshBasicMaterial||d.isMeshLambertMaterial?r(p,d):d.isMeshToonMaterial?(r(p,d),h(p,d)):d.isMeshPhongMaterial?(r(p,d),u(p,d)):d.isMeshStandardMaterial?(r(p,d),f(p,d),d.isMeshPhysicalMaterial&&m(p,d,A)):d.isMeshMatcapMaterial?(r(p,d),g(p,d)):d.isMeshDepthMaterial?r(p,d):d.isMeshDistanceMaterial?(r(p,d),_(p,d)):d.isMeshNormalMaterial?r(p,d):d.isLineBasicMaterial?(o(p,d),d.isLineDashedMaterial&&a(p,d)):d.isPointsMaterial?l(p,d,E,x):d.isSpriteMaterial?c(p,d):d.isShadowMaterial?(p.color.value.copy(d.color),p.opacity.value=d.opacity):d.isShaderMaterial&&(d.uniformsNeedUpdate=!1)}function r(p,d){p.opacity.value=d.opacity,d.color&&p.diffuse.value.copy(d.color),d.emissive&&p.emissive.value.copy(d.emissive).multiplyScalar(d.emissiveIntensity),d.map&&(p.map.value=d.map,t(d.map,p.mapTransform)),d.alphaMap&&(p.alphaMap.value=d.alphaMap,t(d.alphaMap,p.alphaMapTransform)),d.bumpMap&&(p.bumpMap.value=d.bumpMap,t(d.bumpMap,p.bumpMapTransform),p.bumpScale.value=d.bumpScale,d.side===1&&(p.bumpScale.value*=-1)),d.normalMap&&(p.normalMap.value=d.normalMap,t(d.normalMap,p.normalMapTransform),p.normalScale.value.copy(d.normalScale),d.side===1&&p.normalScale.value.negate()),d.displacementMap&&(p.displacementMap.value=d.displacementMap,t(d.displacementMap,p.displacementMapTransform),p.displacementScale.value=d.displacementScale,p.displacementBias.value=d.displacementBias),d.emissiveMap&&(p.emissiveMap.value=d.emissiveMap,t(d.emissiveMap,p.emissiveMapTransform)),d.specularMap&&(p.specularMap.value=d.specularMap,t(d.specularMap,p.specularMapTransform)),d.alphaTest>0&&(p.alphaTest.value=d.alphaTest);const E=e.get(d).envMap;if(E&&(p.envMap.value=E,p.flipEnvMap.value=E.isCubeTexture&&E.isRenderTargetTexture===!1?-1:1,p.reflectivity.value=d.reflectivity,p.ior.value=d.ior,p.refractionRatio.value=d.refractionRatio),d.lightMap){p.lightMap.value=d.lightMap;const x=s._useLegacyLights===!0?Math.PI:1;p.lightMapIntensity.value=d.lightMapIntensity*x,t(d.lightMap,p.lightMapTransform)}d.aoMap&&(p.aoMap.value=d.aoMap,p.aoMapIntensity.value=d.aoMapIntensity,t(d.aoMap,p.aoMapTransform))}function o(p,d){p.diffuse.value.copy(d.color),p.opacity.value=d.opacity,d.map&&(p.map.value=d.map,t(d.map,p.mapTransform))}function a(p,d){p.dashSize.value=d.dashSize,p.totalSize.value=d.dashSize+d.gapSize,p.scale.value=d.scale}function l(p,d,E,x){p.diffuse.value.copy(d.color),p.opacity.value=d.opacity,p.size.value=d.size*E,p.scale.value=x*.5,d.map&&(p.map.value=d.map,t(d.map,p.uvTransform)),d.alphaMap&&(p.alphaMap.value=d.alphaMap,t(d.alphaMap,p.alphaMapTransform)),d.alphaTest>0&&(p.alphaTest.value=d.alphaTest)}function c(p,d){p.diffuse.value.copy(d.color),p.opacity.value=d.opacity,p.rotation.value=d.rotation,d.map&&(p.map.value=d.map,t(d.map,p.mapTransform)),d.alphaMap&&(p.alphaMap.value=d.alphaMap,t(d.alphaMap,p.alphaMapTransform)),d.alphaTest>0&&(p.alphaTest.value=d.alphaTest)}function u(p,d){p.specular.value.copy(d.specular),p.shininess.value=Math.max(d.shininess,1e-4)}function h(p,d){d.gradientMap&&(p.gradientMap.value=d.gradientMap)}function f(p,d){p.metalness.value=d.metalness,d.metalnessMap&&(p.metalnessMap.value=d.metalnessMap,t(d.metalnessMap,p.metalnessMapTransform)),p.roughness.value=d.roughness,d.roughnessMap&&(p.roughnessMap.value=d.roughnessMap,t(d.roughnessMap,p.roughnessMapTransform)),e.get(d).envMap&&(p.envMapIntensity.value=d.envMapIntensity)}function m(p,d,E){p.ior.value=d.ior,d.sheen>0&&(p.sheenColor.value.copy(d.sheenColor).multiplyScalar(d.sheen),p.sheenRoughness.value=d.sheenRoughness,d.sheenColorMap&&(p.sheenColorMap.value=d.sheenColorMap,t(d.sheenColorMap,p.sheenColorMapTransform)),d.sheenRoughnessMap&&(p.sheenRoughnessMap.value=d.sheenRoughnessMap,t(d.sheenRoughnessMap,p.sheenRoughnessMapTransform))),d.clearcoat>0&&(p.clearcoat.value=d.clearcoat,p.clearcoatRoughness.value=d.clearcoatRoughness,d.clearcoatMap&&(p.clearcoatMap.value=d.clearcoatMap,t(d.clearcoatMap,p.clearcoatMapTransform)),d.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=d.clearcoatRoughnessMap,t(d.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),d.clearcoatNormalMap&&(p.clearcoatNormalMap.value=d.clearcoatNormalMap,t(d.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(d.clearcoatNormalScale),d.side===1&&p.clearcoatNormalScale.value.negate())),d.iridescence>0&&(p.iridescence.value=d.iridescence,p.iridescenceIOR.value=d.iridescenceIOR,p.iridescenceThicknessMinimum.value=d.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=d.iridescenceThicknessRange[1],d.iridescenceMap&&(p.iridescenceMap.value=d.iridescenceMap,t(d.iridescenceMap,p.iridescenceMapTransform)),d.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=d.iridescenceThicknessMap,t(d.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),d.transmission>0&&(p.transmission.value=d.transmission,p.transmissionSamplerMap.value=E.texture,p.transmissionSamplerSize.value.set(E.width,E.height),d.transmissionMap&&(p.transmissionMap.value=d.transmissionMap,t(d.transmissionMap,p.transmissionMapTransform)),p.thickness.value=d.thickness,d.thicknessMap&&(p.thicknessMap.value=d.thicknessMap,t(d.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=d.attenuationDistance,p.attenuationColor.value.copy(d.attenuationColor)),d.anisotropy>0&&(p.anisotropyVector.value.set(d.anisotropy*Math.cos(d.anisotropyRotation),d.anisotropy*Math.sin(d.anisotropyRotation)),d.anisotropyMap&&(p.anisotropyMap.value=d.anisotropyMap,t(d.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=d.specularIntensity,p.specularColor.value.copy(d.specularColor),d.specularColorMap&&(p.specularColorMap.value=d.specularColorMap,t(d.specularColorMap,p.specularColorMapTransform)),d.specularIntensityMap&&(p.specularIntensityMap.value=d.specularIntensityMap,t(d.specularIntensityMap,p.specularIntensityMapTransform))}function g(p,d){d.matcap&&(p.matcap.value=d.matcap)}function _(p,d){const E=e.get(d).light;p.referencePosition.value.setFromMatrixPosition(E.matrixWorld),p.nearDistance.value=E.shadow.camera.near,p.farDistance.value=E.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:n}}function xu(s,e,t,i){let n={},r={},o=[];const a=t.isWebGL2?s.getParameter(s.MAX_UNIFORM_BUFFER_BINDINGS):0;function l(E,x){const A=x.program;i.uniformBlockBinding(E,A)}function c(E,x){let A=n[E.id];A===void 0&&(g(E),A=u(E),n[E.id]=A,E.addEventListener("dispose",p));const P=x.program;i.updateUBOMapping(E,P);const R=e.render.frame;r[E.id]!==R&&(f(E),r[E.id]=R)}function u(E){const x=h();E.__bindingPointIndex=x;const A=s.createBuffer(),P=E.__size,R=E.usage;return s.bindBuffer(s.UNIFORM_BUFFER,A),s.bufferData(s.UNIFORM_BUFFER,P,R),s.bindBuffer(s.UNIFORM_BUFFER,null),s.bindBufferBase(s.UNIFORM_BUFFER,x,A),A}function h(){for(let E=0;E<a;E++)if(o.indexOf(E)===-1)return o.push(E),E;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function f(E){const x=n[E.id],A=E.uniforms,P=E.__cache;s.bindBuffer(s.UNIFORM_BUFFER,x);for(let R=0,w=A.length;R<w;R++){const q=Array.isArray(A[R])?A[R]:[A[R]];for(let M=0,T=q.length;M<T;M++){const k=q[M];if(m(k,R,M,P)===!0){const $=k.__offset,ie=Array.isArray(k.value)?k.value:[k.value];let C=0;for(let O=0;O<ie.length;O++){const z=ie[O],W=_(z);typeof z=="number"||typeof z=="boolean"?(k.__data[0]=z,s.bufferSubData(s.UNIFORM_BUFFER,$+C,k.__data)):z.isMatrix3?(k.__data[0]=z.elements[0],k.__data[1]=z.elements[1],k.__data[2]=z.elements[2],k.__data[3]=0,k.__data[4]=z.elements[3],k.__data[5]=z.elements[4],k.__data[6]=z.elements[5],k.__data[7]=0,k.__data[8]=z.elements[6],k.__data[9]=z.elements[7],k.__data[10]=z.elements[8],k.__data[11]=0):(z.toArray(k.__data,C),C+=W.storage/Float32Array.BYTES_PER_ELEMENT)}s.bufferSubData(s.UNIFORM_BUFFER,$,k.__data)}}}s.bindBuffer(s.UNIFORM_BUFFER,null)}function m(E,x,A,P){const R=E.value,w=x+"_"+A;if(P[w]===void 0)return typeof R=="number"||typeof R=="boolean"?P[w]=R:P[w]=R.clone(),!0;{const q=P[w];if(typeof R=="number"||typeof R=="boolean"){if(q!==R)return P[w]=R,!0}else if(q.equals(R)===!1)return q.copy(R),!0}return!1}function g(E){const x=E.uniforms;let A=0;const P=16;for(let w=0,q=x.length;w<q;w++){const M=Array.isArray(x[w])?x[w]:[x[w]];for(let T=0,k=M.length;T<k;T++){const $=M[T],ie=Array.isArray($.value)?$.value:[$.value];for(let C=0,O=ie.length;C<O;C++){const z=ie[C],W=_(z),V=A%P;V!==0&&P-V<W.boundary&&(A+=P-V),$.__data=new Float32Array(W.storage/Float32Array.BYTES_PER_ELEMENT),$.__offset=A,A+=W.storage}}}const R=A%P;return R>0&&(A+=P-R),E.__size=A,E.__cache={},this}function _(E){const x={boundary:0,storage:0};return typeof E=="number"||typeof E=="boolean"?(x.boundary=4,x.storage=4):E.isVector2?(x.boundary=8,x.storage=8):E.isVector3||E.isColor?(x.boundary=16,x.storage=12):E.isVector4?(x.boundary=16,x.storage=16):E.isMatrix3?(x.boundary=48,x.storage=48):E.isMatrix4?(x.boundary=64,x.storage=64):E.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",E),x}function p(E){const x=E.target;x.removeEventListener("dispose",p);const A=o.indexOf(x.__bindingPointIndex);o.splice(A,1),s.deleteBuffer(n[x.id]),delete n[x.id],delete r[x.id]}function d(){for(const E in n)s.deleteBuffer(n[E]);o=[],n={},r={}}return{bind:l,update:c,dispose:d}}class Cr{constructor(e={}){const{canvas:t=Yr(),context:i=null,depth:n=!0,stencil:r=!0,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:h=!1}=e;this.isWebGLRenderer=!0;let f;i!==null?f=i.getContextAttributes().alpha:f=o;const m=new Uint32Array(4),g=new Int32Array(4);let _=null,p=null;const d=[],E=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=ut,this._useLegacyLights=!1,this.toneMapping=0,this.toneMappingExposure=1;const x=this;let A=!1,P=0,R=0,w=null,q=-1,M=null;const T=new dt,k=new dt;let $=null;const ie=new He(0);let C=0,O=t.width,z=t.height,W=1,V=null,H=null;const Y=new dt(0,0,O,z),Z=new dt(0,0,O,z);let le=!1;const G=new Js;let X=!1,ae=!1,de=null;const ue=new at,xe=new We,we=new D,ve={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};function ze(){return w===null?W:1}let I=i;function gt(S,L){for(let N=0;N<S.length;N++){const B=S[N],U=t.getContext(B,L);if(U!==null)return U}return null}try{const S={alpha:!0,depth:n,stencil:r,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:h};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${Pt}`),t.addEventListener("webglcontextlost",ne,!1),t.addEventListener("webglcontextrestored",b,!1),t.addEventListener("webglcontextcreationerror",se,!1),I===null){const L=["webgl2","webgl","experimental-webgl"];if(x.isWebGL1Renderer===!0&&L.shift(),I=gt(L,S),I===null)throw gt(L)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}typeof WebGLRenderingContext<"u"&&I instanceof WebGLRenderingContext&&console.warn("THREE.WebGLRenderer: WebGL 1 support was deprecated in r153 and will be removed in r163."),I.getShaderPrecisionFormat===void 0&&(I.getShaderPrecisionFormat=function(){return{rangeMin:1,rangeMax:1,precision:1}})}catch(S){throw console.error("THREE.WebGLRenderer: "+S.message),S}let Se,Ce,pe,Ze,Ue,y,v,F,J,j,Q,me,oe,he,Ee,Fe,K,qe,Ge,Re,_e,fe,Ie,Ve;function et(){Se=new Cl(I),Ce=new El(I,Se,e),Se.init(Ce),fe=new pu(I,Se,Ce),pe=new hu(I,Se,Ce),Ze=new Dl(I),Ue=new Jc,y=new fu(I,Se,pe,Ue,Ce,fe,Ze),v=new bl(x),F=new Rl(x),J=new xa(I,Ce),Ie=new Ml(I,Se,J,Ce),j=new Ll(I,J,Ze,Ie),Q=new Nl(I,j,J,Ze),Ge=new Fl(I,Ce,y),Fe=new Tl(Ue),me=new Zc(x,v,F,Se,Ce,Ie,Fe),oe=new vu(x,Ue),he=new eu,Ee=new au(Se,Ce),qe=new Sl(x,v,F,pe,Q,f,l),K=new du(x,Q,Ce),Ve=new xu(I,Ze,Ce,pe),Re=new yl(I,Se,Ze,Ce),_e=new Pl(I,Se,Ze,Ce),Ze.programs=me.programs,x.capabilities=Ce,x.extensions=Se,x.properties=Ue,x.renderLists=he,x.shadowMap=K,x.state=pe,x.info=Ze}et();const Be=new _u(x,I);this.xr=Be,this.getContext=function(){return I},this.getContextAttributes=function(){return I.getContextAttributes()},this.forceContextLoss=function(){const S=Se.get("WEBGL_lose_context");S&&S.loseContext()},this.forceContextRestore=function(){const S=Se.get("WEBGL_lose_context");S&&S.restoreContext()},this.getPixelRatio=function(){return W},this.setPixelRatio=function(S){S!==void 0&&(W=S,this.setSize(O,z,!1))},this.getSize=function(S){return S.set(O,z)},this.setSize=function(S,L,N=!0){if(Be.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}O=S,z=L,t.width=Math.floor(S*W),t.height=Math.floor(L*W),N===!0&&(t.style.width=S+"px",t.style.height=L+"px"),this.setViewport(0,0,S,L)},this.getDrawingBufferSize=function(S){return S.set(O*W,z*W).floor()},this.setDrawingBufferSize=function(S,L,N){O=S,z=L,W=N,t.width=Math.floor(S*N),t.height=Math.floor(L*N),this.setViewport(0,0,S,L)},this.getCurrentViewport=function(S){return S.copy(T)},this.getViewport=function(S){return S.copy(Y)},this.setViewport=function(S,L,N,B){S.isVector4?Y.set(S.x,S.y,S.z,S.w):Y.set(S,L,N,B),pe.viewport(T.copy(Y).multiplyScalar(W).floor())},this.getScissor=function(S){return S.copy(Z)},this.setScissor=function(S,L,N,B){S.isVector4?Z.set(S.x,S.y,S.z,S.w):Z.set(S,L,N,B),pe.scissor(k.copy(Z).multiplyScalar(W).floor())},this.getScissorTest=function(){return le},this.setScissorTest=function(S){pe.setScissorTest(le=S)},this.setOpaqueSort=function(S){V=S},this.setTransparentSort=function(S){H=S},this.getClearColor=function(S){return S.copy(qe.getClearColor())},this.setClearColor=function(){qe.setClearColor.apply(qe,arguments)},this.getClearAlpha=function(){return qe.getClearAlpha()},this.setClearAlpha=function(){qe.setClearAlpha.apply(qe,arguments)},this.clear=function(S=!0,L=!0,N=!0){let B=0;if(S){let U=!1;if(w!==null){const ce=w.texture.format;U=ce===1033||ce===1031||ce===1029}if(U){const ce=w.texture.type,ge=ce===1009||ce===1014||ce===1012||ce===1020||ce===1017||ce===1018,ye=qe.getClearColor(),be=qe.getClearAlpha(),Ne=ye.r,Le=ye.g,Pe=ye.b;ge?(m[0]=Ne,m[1]=Le,m[2]=Pe,m[3]=be,I.clearBufferuiv(I.COLOR,0,m)):(g[0]=Ne,g[1]=Le,g[2]=Pe,g[3]=be,I.clearBufferiv(I.COLOR,0,g))}else B|=I.COLOR_BUFFER_BIT}L&&(B|=I.DEPTH_BUFFER_BIT),N&&(B|=I.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),I.clear(B)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",ne,!1),t.removeEventListener("webglcontextrestored",b,!1),t.removeEventListener("webglcontextcreationerror",se,!1),he.dispose(),Ee.dispose(),Ue.dispose(),v.dispose(),F.dispose(),Q.dispose(),Ie.dispose(),Ve.dispose(),me.dispose(),Be.dispose(),Be.removeEventListener("sessionstart",_t),Be.removeEventListener("sessionend",Ke),de&&(de.dispose(),de=null),vt.stop()};function ne(S){S.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),A=!0}function b(){console.log("THREE.WebGLRenderer: Context Restored."),A=!1;const S=Ze.autoReset,L=K.enabled,N=K.autoUpdate,B=K.needsUpdate,U=K.type;et(),Ze.autoReset=S,K.enabled=L,K.autoUpdate=N,K.needsUpdate=B,K.type=U}function se(S){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",S.statusMessage)}function re(S){const L=S.target;L.removeEventListener("dispose",re),Te(L)}function Te(S){Me(S),Ue.remove(S)}function Me(S){const L=Ue.get(S).programs;L!==void 0&&(L.forEach(function(N){me.releaseProgram(N)}),S.isShaderMaterial&&me.releaseShaderCache(S))}this.renderBufferDirect=function(S,L,N,B,U,ce){L===null&&(L=ve);const ge=U.isMesh&&U.matrixWorld.determinant()<0,ye=Hu(S,L,N,B,U);pe.setMaterial(B,ge);let be=N.index,Ne=1;if(B.wireframe===!0){if(be=j.getWireframeAttribute(N),be===void 0)return;Ne=2}const Le=N.drawRange,Pe=N.attributes.position;let nt=Le.start*Ne,At=(Le.start+Le.count)*Ne;ce!==null&&(nt=Math.max(nt,ce.start*Ne),At=Math.min(At,(ce.start+ce.count)*Ne)),be!==null?(nt=Math.max(nt,0),At=Math.min(At,be.count)):Pe!=null&&(nt=Math.max(nt,0),At=Math.min(At,Pe.count));const ct=At-nt;if(ct<0||ct===1/0)return;Ie.setup(U,B,ye,N,be);let Kt,Je=Re;if(be!==null&&(Kt=J.get(be),Je=_e,Je.setIndex(Kt)),U.isMesh)B.wireframe===!0?(pe.setLineWidth(B.wireframeLinewidth*ze()),Je.setMode(I.LINES)):Je.setMode(I.TRIANGLES);else if(U.isLine){let ke=B.linewidth;ke===void 0&&(ke=1),pe.setLineWidth(ke*ze()),U.isLineSegments?Je.setMode(I.LINES):U.isLineLoop?Je.setMode(I.LINE_LOOP):Je.setMode(I.LINE_STRIP)}else U.isPoints?Je.setMode(I.POINTS):U.isSprite&&Je.setMode(I.TRIANGLES);if(U.isBatchedMesh)Je.renderMultiDraw(U._multiDrawStarts,U._multiDrawCounts,U._multiDrawCount);else if(U.isInstancedMesh)Je.renderInstances(nt,ct,U.count);else if(N.isInstancedBufferGeometry){const ke=N._maxInstanceCount!==void 0?N._maxInstanceCount:1/0,vs=Math.min(N.instanceCount,ke);Je.renderInstances(nt,ct,vs)}else Je.render(nt,ct)};function $e(S,L,N){S.transparent===!0&&S.side===2&&S.forceSinglePass===!1?(S.side=1,S.needsUpdate=!0,Ui(S,L,N),S.side=0,S.needsUpdate=!0,Ui(S,L,N),S.side=2):Ui(S,L,N)}this.compile=function(S,L,N=null){N===null&&(N=S),p=Ee.get(N),p.init(),E.push(p),N.traverseVisible(function(U){U.isLight&&U.layers.test(L.layers)&&(p.pushLight(U),U.castShadow&&p.pushShadow(U))}),S!==N&&S.traverseVisible(function(U){U.isLight&&U.layers.test(L.layers)&&(p.pushLight(U),U.castShadow&&p.pushShadow(U))}),p.setupLights(x._useLegacyLights);const B=new Set;return S.traverse(function(U){const ce=U.material;if(ce)if(Array.isArray(ce))for(let ge=0;ge<ce.length;ge++){const ye=ce[ge];$e(ye,N,U),B.add(ye)}else $e(ce,N,U),B.add(ce)}),E.pop(),p=null,B},this.compileAsync=function(S,L,N=null){const B=this.compile(S,L,N);return new Promise(U=>{function ce(){if(B.forEach(function(ge){Ue.get(ge).currentProgram.isReady()&&B.delete(ge)}),B.size===0){U(S);return}setTimeout(ce,10)}Se.get("KHR_parallel_shader_compile")!==null?ce():setTimeout(ce,10)})};let Ye=null;function lt(S){Ye&&Ye(S)}function _t(){vt.stop()}function Ke(){vt.start()}const vt=new Qs;vt.setAnimationLoop(lt),typeof self<"u"&&vt.setContext(self),this.setAnimationLoop=function(S){Ye=S,Be.setAnimationLoop(S),S===null?vt.stop():vt.start()},Be.addEventListener("sessionstart",_t),Be.addEventListener("sessionend",Ke),this.render=function(S,L){if(L!==void 0&&L.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(A===!0)return;S.matrixWorldAutoUpdate===!0&&S.updateMatrixWorld(),L.parent===null&&L.matrixWorldAutoUpdate===!0&&L.updateMatrixWorld(),Be.enabled===!0&&Be.isPresenting===!0&&(Be.cameraAutoUpdate===!0&&Be.updateCamera(L),L=Be.getCamera()),S.isScene===!0&&S.onBeforeRender(x,S,L,w),p=Ee.get(S,E.length),p.init(),E.push(p),ue.multiplyMatrices(L.projectionMatrix,L.matrixWorldInverse),G.setFromProjectionMatrix(ue),ae=this.localClippingEnabled,X=Fe.init(this.clippingPlanes,ae),_=he.get(S,d.length),_.init(),d.push(_),zt(S,L,0,x.sortObjects),_.finish(),x.sortObjects===!0&&_.sort(V,H),this.info.render.frame++,X===!0&&Fe.beginShadows();const N=p.state.shadowsArray;if(K.render(N,S,L),X===!0&&Fe.endShadows(),this.info.autoReset===!0&&this.info.reset(),qe.render(_,S),p.setupLights(x._useLegacyLights),L.isArrayCamera){const B=L.cameras;for(let U=0,ce=B.length;U<ce;U++){const ge=B[U];zr(_,S,ge,ge.viewport)}}else zr(_,S,L);w!==null&&(y.updateMultisampleRenderTarget(w),y.updateRenderTargetMipmap(w)),S.isScene===!0&&S.onAfterRender(x,S,L),Ie.resetDefaultState(),q=-1,M=null,E.pop(),E.length>0?p=E[E.length-1]:p=null,d.pop(),d.length>0?_=d[d.length-1]:_=null};function zt(S,L,N,B){if(S.visible===!1)return;if(S.layers.test(L.layers)){if(S.isGroup)N=S.renderOrder;else if(S.isLOD)S.autoUpdate===!0&&S.update(L);else if(S.isLight)p.pushLight(S),S.castShadow&&p.pushShadow(S);else if(S.isSprite){if(!S.frustumCulled||G.intersectsSprite(S)){B&&we.setFromMatrixPosition(S.matrixWorld).applyMatrix4(ue);const ge=Q.update(S),ye=S.material;ye.visible&&_.push(S,ge,ye,N,we.z,null)}}else if((S.isMesh||S.isLine||S.isPoints)&&(!S.frustumCulled||G.intersectsObject(S))){const ge=Q.update(S),ye=S.material;if(B&&(S.boundingSphere!==void 0?(S.boundingSphere===null&&S.computeBoundingSphere(),we.copy(S.boundingSphere.center)):(ge.boundingSphere===null&&ge.computeBoundingSphere(),we.copy(ge.boundingSphere.center)),we.applyMatrix4(S.matrixWorld).applyMatrix4(ue)),Array.isArray(ye)){const be=ge.groups;for(let Ne=0,Le=be.length;Ne<Le;Ne++){const Pe=be[Ne],nt=ye[Pe.materialIndex];nt&&nt.visible&&_.push(S,ge,nt,N,we.z,Pe)}}else ye.visible&&_.push(S,ge,ye,N,we.z,null)}}const ce=S.children;for(let ge=0,ye=ce.length;ge<ye;ge++)zt(ce[ge],L,N,B)}function zr(S,L,N,B){const U=S.opaque,ce=S.transmissive,ge=S.transparent;p.setupLightsView(N),X===!0&&Fe.setGlobalState(x.clippingPlanes,N),ce.length>0&&zu(U,ce,L,N),B&&pe.viewport(T.copy(B)),U.length>0&&Ii(U,L,N),ce.length>0&&Ii(ce,L,N),ge.length>0&&Ii(ge,L,N),pe.buffers.depth.setTest(!0),pe.buffers.depth.setMask(!0),pe.buffers.color.setMask(!0),pe.setPolygonOffset(!1)}function zu(S,L,N,B){if((N.isScene===!0?N.overrideMaterial:null)!==null)return;const ce=Ce.isWebGL2;de===null&&(de=new tn(1,1,{generateMipmaps:!0,type:Se.has("EXT_color_buffer_half_float")?1016:1009,minFilter:1008,samples:ce?4:0})),x.getDrawingBufferSize(xe),ce?de.setSize(xe.x,xe.y):de.setSize(ki(xe.x),ki(xe.y));const ge=x.getRenderTarget();x.setRenderTarget(de),x.getClearColor(ie),C=x.getClearAlpha(),C<1&&x.setClearColor(16777215,.5),x.clear();const ye=x.toneMapping;x.toneMapping=0,Ii(S,N,B),y.updateMultisampleRenderTarget(de),y.updateRenderTargetMipmap(de);let be=!1;for(let Ne=0,Le=L.length;Ne<Le;Ne++){const Pe=L[Ne],nt=Pe.object,At=Pe.geometry,ct=Pe.material,Kt=Pe.group;if(ct.side===2&&nt.layers.test(B.layers)){const Je=ct.side;ct.side=1,ct.needsUpdate=!0,Hr(nt,N,B,At,ct,Kt),ct.side=Je,ct.needsUpdate=!0,be=!0}}be===!0&&(y.updateMultisampleRenderTarget(de),y.updateRenderTargetMipmap(de)),x.setRenderTarget(ge),x.setClearColor(ie,C),x.toneMapping=ye}function Ii(S,L,N){const B=L.isScene===!0?L.overrideMaterial:null;for(let U=0,ce=S.length;U<ce;U++){const ge=S[U],ye=ge.object,be=ge.geometry,Ne=B===null?ge.material:B,Le=ge.group;ye.layers.test(N.layers)&&Hr(ye,L,N,be,Ne,Le)}}function Hr(S,L,N,B,U,ce){S.onBeforeRender(x,L,N,B,U,ce),S.modelViewMatrix.multiplyMatrices(N.matrixWorldInverse,S.matrixWorld),S.normalMatrix.getNormalMatrix(S.modelViewMatrix),U.onBeforeRender(x,L,N,B,S,ce),U.transparent===!0&&U.side===2&&U.forceSinglePass===!1?(U.side=1,U.needsUpdate=!0,x.renderBufferDirect(N,L,B,U,S,ce),U.side=0,U.needsUpdate=!0,x.renderBufferDirect(N,L,B,U,S,ce),U.side=2):x.renderBufferDirect(N,L,B,U,S,ce),S.onAfterRender(x,L,N,B,U,ce)}function Ui(S,L,N){L.isScene!==!0&&(L=ve);const B=Ue.get(S),U=p.state.lights,ce=p.state.shadowsArray,ge=U.state.version,ye=me.getParameters(S,U.state,ce,L,N),be=me.getProgramCacheKey(ye);let Ne=B.programs;B.environment=S.isMeshStandardMaterial?L.environment:null,B.fog=L.fog,B.envMap=(S.isMeshStandardMaterial?F:v).get(S.envMap||B.environment),Ne===void 0&&(S.addEventListener("dispose",re),Ne=new Map,B.programs=Ne);let Le=Ne.get(be);if(Le!==void 0){if(B.currentProgram===Le&&B.lightsStateVersion===ge)return Wr(S,ye),Le}else ye.uniforms=me.getUniforms(S),S.onBuild(N,ye,x),S.onBeforeCompile(ye,x),Le=me.acquireProgram(ye,be),Ne.set(be,Le),B.uniforms=ye.uniforms;const Pe=B.uniforms;return(!S.isShaderMaterial&&!S.isRawShaderMaterial||S.clipping===!0)&&(Pe.clippingPlanes=Fe.uniform),Wr(S,ye),B.needsLights=Wu(S),B.lightsStateVersion=ge,B.needsLights&&(Pe.ambientLightColor.value=U.state.ambient,Pe.lightProbe.value=U.state.probe,Pe.directionalLights.value=U.state.directional,Pe.directionalLightShadows.value=U.state.directionalShadow,Pe.spotLights.value=U.state.spot,Pe.spotLightShadows.value=U.state.spotShadow,Pe.rectAreaLights.value=U.state.rectArea,Pe.ltc_1.value=U.state.rectAreaLTC1,Pe.ltc_2.value=U.state.rectAreaLTC2,Pe.pointLights.value=U.state.point,Pe.pointLightShadows.value=U.state.pointShadow,Pe.hemisphereLights.value=U.state.hemi,Pe.directionalShadowMap.value=U.state.directionalShadowMap,Pe.directionalShadowMatrix.value=U.state.directionalShadowMatrix,Pe.spotShadowMap.value=U.state.spotShadowMap,Pe.spotLightMatrix.value=U.state.spotLightMatrix,Pe.spotLightMap.value=U.state.spotLightMap,Pe.pointShadowMap.value=U.state.pointShadowMap,Pe.pointShadowMatrix.value=U.state.pointShadowMatrix),B.currentProgram=Le,B.uniformsList=null,Le}function Vr(S){if(S.uniformsList===null){const L=S.currentProgram.getUniforms();S.uniformsList=Ri.seqWithValue(L.seq,S.uniforms)}return S.uniformsList}function Wr(S,L){const N=Ue.get(S);N.outputColorSpace=L.outputColorSpace,N.batching=L.batching,N.instancing=L.instancing,N.instancingColor=L.instancingColor,N.skinning=L.skinning,N.morphTargets=L.morphTargets,N.morphNormals=L.morphNormals,N.morphColors=L.morphColors,N.morphTargetsCount=L.morphTargetsCount,N.numClippingPlanes=L.numClippingPlanes,N.numIntersection=L.numClipIntersection,N.vertexAlphas=L.vertexAlphas,N.vertexTangents=L.vertexTangents,N.toneMapping=L.toneMapping}function Hu(S,L,N,B,U){L.isScene!==!0&&(L=ve),y.resetTextureUnits();const ce=L.fog,ge=B.isMeshStandardMaterial?L.environment:null,ye=w===null?x.outputColorSpace:w.isXRRenderTarget===!0?w.texture.colorSpace:Ht,be=(B.isMeshStandardMaterial?F:v).get(B.envMap||ge),Ne=B.vertexColors===!0&&!!N.attributes.color&&N.attributes.color.itemSize===4,Le=!!N.attributes.tangent&&(!!B.normalMap||B.anisotropy>0),Pe=!!N.morphAttributes.position,nt=!!N.morphAttributes.normal,At=!!N.morphAttributes.color;let ct=0;B.toneMapped&&(w===null||w.isXRRenderTarget===!0)&&(ct=x.toneMapping);const Kt=N.morphAttributes.position||N.morphAttributes.normal||N.morphAttributes.color,Je=Kt!==void 0?Kt.length:0,ke=Ue.get(B),vs=p.state.lights;if(X===!0&&(ae===!0||S!==M)){const Lt=S===M&&B.id===q;Fe.setState(B,S,Lt)}let tt=!1;B.version===ke.__version?(ke.needsLights&&ke.lightsStateVersion!==vs.state.version||ke.outputColorSpace!==ye||U.isBatchedMesh&&ke.batching===!1||!U.isBatchedMesh&&ke.batching===!0||U.isInstancedMesh&&ke.instancing===!1||!U.isInstancedMesh&&ke.instancing===!0||U.isSkinnedMesh&&ke.skinning===!1||!U.isSkinnedMesh&&ke.skinning===!0||U.isInstancedMesh&&ke.instancingColor===!0&&U.instanceColor===null||U.isInstancedMesh&&ke.instancingColor===!1&&U.instanceColor!==null||ke.envMap!==be||B.fog===!0&&ke.fog!==ce||ke.numClippingPlanes!==void 0&&(ke.numClippingPlanes!==Fe.numPlanes||ke.numIntersection!==Fe.numIntersection)||ke.vertexAlphas!==Ne||ke.vertexTangents!==Le||ke.morphTargets!==Pe||ke.morphNormals!==nt||ke.morphColors!==At||ke.toneMapping!==ct||Ce.isWebGL2===!0&&ke.morphTargetsCount!==Je)&&(tt=!0):(tt=!0,ke.__version=B.version);let dn=ke.currentProgram;tt===!0&&(dn=Ui(B,L,U));let Xr=!1,Zn=!1,xs=!1;const pt=dn.getUniforms(),hn=ke.uniforms;if(pe.useProgram(dn.program)&&(Xr=!0,Zn=!0,xs=!0),B.id!==q&&(q=B.id,Zn=!0),Xr||M!==S){pt.setValue(I,"projectionMatrix",S.projectionMatrix),pt.setValue(I,"viewMatrix",S.matrixWorldInverse);const Lt=pt.map.cameraPosition;Lt!==void 0&&Lt.setValue(I,we.setFromMatrixPosition(S.matrixWorld)),Ce.logarithmicDepthBuffer&&pt.setValue(I,"logDepthBufFC",2/(Math.log(S.far+1)/Math.LN2)),(B.isMeshPhongMaterial||B.isMeshToonMaterial||B.isMeshLambertMaterial||B.isMeshBasicMaterial||B.isMeshStandardMaterial||B.isShaderMaterial)&&pt.setValue(I,"isOrthographic",S.isOrthographicCamera===!0),M!==S&&(M=S,Zn=!0,xs=!0)}if(U.isSkinnedMesh){pt.setOptional(I,U,"bindMatrix"),pt.setOptional(I,U,"bindMatrixInverse");const Lt=U.skeleton;Lt&&(Ce.floatVertexTextures?(Lt.boneTexture===null&&Lt.computeBoneTexture(),pt.setValue(I,"boneTexture",Lt.boneTexture,y)):console.warn("THREE.WebGLRenderer: SkinnedMesh can only be used with WebGL 2. With WebGL 1 OES_texture_float and vertex textures support is required."))}U.isBatchedMesh&&(pt.setOptional(I,U,"batchingTexture"),pt.setValue(I,"batchingTexture",U._matricesTexture,y));const Ss=N.morphAttributes;if((Ss.position!==void 0||Ss.normal!==void 0||Ss.color!==void 0&&Ce.isWebGL2===!0)&&Ge.update(U,N,dn),(Zn||ke.receiveShadow!==U.receiveShadow)&&(ke.receiveShadow=U.receiveShadow,pt.setValue(I,"receiveShadow",U.receiveShadow)),B.isMeshGouraudMaterial&&B.envMap!==null&&(hn.envMap.value=be,hn.flipEnvMap.value=be.isCubeTexture&&be.isRenderTargetTexture===!1?-1:1),Zn&&(pt.setValue(I,"toneMappingExposure",x.toneMappingExposure),ke.needsLights&&Vu(hn,xs),ce&&B.fog===!0&&oe.refreshFogUniforms(hn,ce),oe.refreshMaterialUniforms(hn,B,W,z,de),Ri.upload(I,Vr(ke),hn,y)),B.isShaderMaterial&&B.uniformsNeedUpdate===!0&&(Ri.upload(I,Vr(ke),hn,y),B.uniformsNeedUpdate=!1),B.isSpriteMaterial&&pt.setValue(I,"center",U.center),pt.setValue(I,"modelViewMatrix",U.modelViewMatrix),pt.setValue(I,"normalMatrix",U.normalMatrix),pt.setValue(I,"modelMatrix",U.matrixWorld),B.isShaderMaterial||B.isRawShaderMaterial){const Lt=B.uniformsGroups;for(let Ms=0,Xu=Lt.length;Ms<Xu;Ms++)if(Ce.isWebGL2){const qr=Lt[Ms];Ve.update(qr,dn),Ve.bind(qr,dn)}else console.warn("THREE.WebGLRenderer: Uniform Buffer Objects can only be used with WebGL 2.")}return dn}function Vu(S,L){S.ambientLightColor.needsUpdate=L,S.lightProbe.needsUpdate=L,S.directionalLights.needsUpdate=L,S.directionalLightShadows.needsUpdate=L,S.pointLights.needsUpdate=L,S.pointLightShadows.needsUpdate=L,S.spotLights.needsUpdate=L,S.spotLightShadows.needsUpdate=L,S.rectAreaLights.needsUpdate=L,S.hemisphereLights.needsUpdate=L}function Wu(S){return S.isMeshLambertMaterial||S.isMeshToonMaterial||S.isMeshPhongMaterial||S.isMeshStandardMaterial||S.isShadowMaterial||S.isShaderMaterial&&S.lights===!0}this.getActiveCubeFace=function(){return P},this.getActiveMipmapLevel=function(){return R},this.getRenderTarget=function(){return w},this.setRenderTargetTextures=function(S,L,N){Ue.get(S.texture).__webglTexture=L,Ue.get(S.depthTexture).__webglTexture=N;const B=Ue.get(S);B.__hasExternalTextures=!0,B.__hasExternalTextures&&(B.__autoAllocateDepthBuffer=N===void 0,B.__autoAllocateDepthBuffer||Se.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),B.__useRenderToTexture=!1))},this.setRenderTargetFramebuffer=function(S,L){const N=Ue.get(S);N.__webglFramebuffer=L,N.__useDefaultFramebuffer=L===void 0},this.setRenderTarget=function(S,L=0,N=0){w=S,P=L,R=N;let B=!0,U=null,ce=!1,ge=!1;if(S){const be=Ue.get(S);be.__useDefaultFramebuffer!==void 0?(pe.bindFramebuffer(I.FRAMEBUFFER,null),B=!1):be.__webglFramebuffer===void 0?y.setupRenderTarget(S):be.__hasExternalTextures&&y.rebindTextures(S,Ue.get(S.texture).__webglTexture,Ue.get(S.depthTexture).__webglTexture);const Ne=S.texture;(Ne.isData3DTexture||Ne.isDataArrayTexture||Ne.isCompressedArrayTexture)&&(ge=!0);const Le=Ue.get(S).__webglFramebuffer;S.isWebGLCubeRenderTarget?(Array.isArray(Le[L])?U=Le[L][N]:U=Le[L],ce=!0):Ce.isWebGL2&&S.samples>0&&y.useMultisampledRTT(S)===!1?U=Ue.get(S).__webglMultisampledFramebuffer:Array.isArray(Le)?U=Le[N]:U=Le,T.copy(S.viewport),k.copy(S.scissor),$=S.scissorTest}else T.copy(Y).multiplyScalar(W).floor(),k.copy(Z).multiplyScalar(W).floor(),$=le;if(pe.bindFramebuffer(I.FRAMEBUFFER,U)&&Ce.drawBuffers&&B&&pe.drawBuffers(S,U),pe.viewport(T),pe.scissor(k),pe.setScissorTest($),ce){const be=Ue.get(S.texture);I.framebufferTexture2D(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_CUBE_MAP_POSITIVE_X+L,be.__webglTexture,N)}else if(ge){const be=Ue.get(S.texture),Ne=L||0;I.framebufferTextureLayer(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,be.__webglTexture,N||0,Ne)}q=-1},this.readRenderTargetPixels=function(S,L,N,B,U,ce,ge){if(!(S&&S.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let ye=Ue.get(S).__webglFramebuffer;if(S.isWebGLCubeRenderTarget&&ge!==void 0&&(ye=ye[ge]),ye){pe.bindFramebuffer(I.FRAMEBUFFER,ye);try{const be=S.texture,Ne=be.format,Le=be.type;if(Ne!==1023&&fe.convert(Ne)!==I.getParameter(I.IMPLEMENTATION_COLOR_READ_FORMAT)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}const Pe=Le===1016&&(Se.has("EXT_color_buffer_half_float")||Ce.isWebGL2&&Se.has("EXT_color_buffer_float"));if(Le!==1009&&fe.convert(Le)!==I.getParameter(I.IMPLEMENTATION_COLOR_READ_TYPE)&&!(Le===1015&&(Ce.isWebGL2||Se.has("OES_texture_float")||Se.has("WEBGL_color_buffer_float")))&&!Pe){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}L>=0&&L<=S.width-B&&N>=0&&N<=S.height-U&&I.readPixels(L,N,B,U,fe.convert(Ne),fe.convert(Le),ce)}finally{const be=w!==null?Ue.get(w).__webglFramebuffer:null;pe.bindFramebuffer(I.FRAMEBUFFER,be)}}},this.copyFramebufferToTexture=function(S,L,N=0){const B=Math.pow(2,-N),U=Math.floor(L.image.width*B),ce=Math.floor(L.image.height*B);y.setTexture2D(L,0),I.copyTexSubImage2D(I.TEXTURE_2D,N,0,0,S.x,S.y,U,ce),pe.unbindTexture()},this.copyTextureToTexture=function(S,L,N,B=0){const U=L.image.width,ce=L.image.height,ge=fe.convert(N.format),ye=fe.convert(N.type);y.setTexture2D(N,0),I.pixelStorei(I.UNPACK_FLIP_Y_WEBGL,N.flipY),I.pixelStorei(I.UNPACK_PREMULTIPLY_ALPHA_WEBGL,N.premultiplyAlpha),I.pixelStorei(I.UNPACK_ALIGNMENT,N.unpackAlignment),L.isDataTexture?I.texSubImage2D(I.TEXTURE_2D,B,S.x,S.y,U,ce,ge,ye,L.image.data):L.isCompressedTexture?I.compressedTexSubImage2D(I.TEXTURE_2D,B,S.x,S.y,L.mipmaps[0].width,L.mipmaps[0].height,ge,L.mipmaps[0].data):I.texSubImage2D(I.TEXTURE_2D,B,S.x,S.y,ge,ye,L.image),B===0&&N.generateMipmaps&&I.generateMipmap(I.TEXTURE_2D),pe.unbindTexture()},this.copyTextureToTexture3D=function(S,L,N,B,U=0){if(x.isWebGL1Renderer){console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: can only be used with WebGL2.");return}const ce=S.max.x-S.min.x+1,ge=S.max.y-S.min.y+1,ye=S.max.z-S.min.z+1,be=fe.convert(B.format),Ne=fe.convert(B.type);let Le;if(B.isData3DTexture)y.setTexture3D(B,0),Le=I.TEXTURE_3D;else if(B.isDataArrayTexture||B.isCompressedArrayTexture)y.setTexture2DArray(B,0),Le=I.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}I.pixelStorei(I.UNPACK_FLIP_Y_WEBGL,B.flipY),I.pixelStorei(I.UNPACK_PREMULTIPLY_ALPHA_WEBGL,B.premultiplyAlpha),I.pixelStorei(I.UNPACK_ALIGNMENT,B.unpackAlignment);const Pe=I.getParameter(I.UNPACK_ROW_LENGTH),nt=I.getParameter(I.UNPACK_IMAGE_HEIGHT),At=I.getParameter(I.UNPACK_SKIP_PIXELS),ct=I.getParameter(I.UNPACK_SKIP_ROWS),Kt=I.getParameter(I.UNPACK_SKIP_IMAGES),Je=N.isCompressedTexture?N.mipmaps[U]:N.image;I.pixelStorei(I.UNPACK_ROW_LENGTH,Je.width),I.pixelStorei(I.UNPACK_IMAGE_HEIGHT,Je.height),I.pixelStorei(I.UNPACK_SKIP_PIXELS,S.min.x),I.pixelStorei(I.UNPACK_SKIP_ROWS,S.min.y),I.pixelStorei(I.UNPACK_SKIP_IMAGES,S.min.z),N.isDataTexture||N.isData3DTexture?I.texSubImage3D(Le,U,L.x,L.y,L.z,ce,ge,ye,be,Ne,Je.data):N.isCompressedArrayTexture?(console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: untested support for compressed srcTexture."),I.compressedTexSubImage3D(Le,U,L.x,L.y,L.z,ce,ge,ye,be,Je.data)):I.texSubImage3D(Le,U,L.x,L.y,L.z,ce,ge,ye,be,Ne,Je),I.pixelStorei(I.UNPACK_ROW_LENGTH,Pe),I.pixelStorei(I.UNPACK_IMAGE_HEIGHT,nt),I.pixelStorei(I.UNPACK_SKIP_PIXELS,At),I.pixelStorei(I.UNPACK_SKIP_ROWS,ct),I.pixelStorei(I.UNPACK_SKIP_IMAGES,Kt),U===0&&B.generateMipmaps&&I.generateMipmap(Le),pe.unbindTexture()},this.initTexture=function(S){S.isCubeTexture?y.setTextureCube(S,0):S.isData3DTexture?y.setTexture3D(S,0):S.isDataArrayTexture||S.isCompressedArrayTexture?y.setTexture2DArray(S,0):y.setTexture2D(S,0),pe.unbindTexture()},this.resetState=function(){P=0,R=0,w=null,pe.reset(),Ie.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return 2e3}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=e===Fi?"display-p3":"srgb",t.unpackColorSpace=Xe.workingColorSpace===Jn?"display-p3":"srgb"}get outputEncoding(){return console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace===ut?3001:3e3}set outputEncoding(e){console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace=e===3001?ut:Ht}get useLegacyLights(){return console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights}set useLegacyLights(e){console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights=e}}class Su extends Cr{}Su.prototype.isWebGL1Renderer=!0;class Mu extends Mt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t}}class Lr extends Wn{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new He(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}}const Pr=new at,fs=new Ds,Li=new oi,Pi=new D;class yu extends Mt{constructor(e=new kt,t=new Lr){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){const i=this.geometry,n=this.matrixWorld,r=e.params.Points.threshold,o=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Li.copy(i.boundingSphere),Li.applyMatrix4(n),Li.radius+=r,e.ray.intersectsSphere(Li)===!1)return;Pr.copy(n).invert(),fs.copy(e.ray).applyMatrix4(Pr);const a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=i.index,h=i.attributes.position;if(c!==null){const f=Math.max(0,o.start),m=Math.min(c.count,o.start+o.count);for(let g=f,_=m;g<_;g++){const p=c.getX(g);Pi.fromBufferAttribute(h,p),Dr(Pi,p,l,n,e,t,this)}}else{const f=Math.max(0,o.start),m=Math.min(h.count,o.start+o.count);for(let g=f,_=m;g<_;g++)Pi.fromBufferAttribute(h,g),Dr(Pi,g,l,n,e,t,this)}}updateMorphTargets(){const t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){const n=t[i[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=n.length;r<o;r++){const a=n[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}}function Dr(s,e,t,i,n,r,o){const a=fs.distanceSqToPoint(s);if(a<t){const l=new D;fs.closestPointToPoint(s,l),l.applyMatrix4(i);const c=n.ray.origin.distanceTo(l);if(c<n.near||c>n.far)return;r.push({distance:c,distanceToRay:Math.sqrt(a),point:l,index:e,face:null,object:o})}}class ps extends kt{constructor(e=1,t=32,i=16,n=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:i,phiStart:n,phiLength:r,thetaStart:o,thetaLength:a},t=Math.max(3,Math.floor(t)),i=Math.max(2,Math.floor(i));const l=Math.min(o+a,Math.PI);let c=0;const u=[],h=new D,f=new D,m=[],g=[],_=[],p=[];for(let d=0;d<=i;d++){const E=[],x=d/i;let A=0;d===0&&o===0?A=.5/t:d===i&&l===Math.PI&&(A=-.5/t);for(let P=0;P<=t;P++){const R=P/t;h.x=-e*Math.cos(n+R*r)*Math.sin(o+x*a),h.y=e*Math.cos(o+x*a),h.z=e*Math.sin(n+R*r)*Math.sin(o+x*a),g.push(h.x,h.y,h.z),f.copy(h).normalize(),_.push(f.x,f.y,f.z),p.push(R+A,1-x),E.push(c++)}u.push(E)}for(let d=0;d<i;d++)for(let E=0;E<t;E++){const x=u[d][E+1],A=u[d][E],P=u[d+1][E],R=u[d+1][E+1];(d!==0||o>0)&&m.push(x,A,R),(d!==i-1||l<Math.PI)&&m.push(A,P,R)}this.setIndex(m),this.setAttribute("position",new Bt(g,3)),this.setAttribute("normal",new Bt(_,3)),this.setAttribute("uv",new Bt(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new ps(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}}class Eu{constructor(e=!0){this.autoStart=e,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=Ir(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let e=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){const t=Ir();e=(t-this.oldTime)/1e3,this.oldTime=t,this.elapsedTime+=e}return e}}function Ir(){return(typeof performance>"u"?Date:performance).now()}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Pt}})),typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Pt);const Un=[{name:"HR",radius:70,speed:2,color:[.678,.847,.902],size:12,duration:12},{name:"Finance",radius:90,speed:1.33,color:[1,.667,.298],size:14,duration:18},{name:"Estates",radius:110,speed:1,color:[0,.831,.831],size:16,duration:25},{name:"Compliance",radius:130,speed:.75,color:[.902,.765,1],size:14,duration:32},{name:"Teaching",radius:150,speed:.6,color:[1,.714,.757],size:16,duration:40},{name:"SEND",radius:170,speed:.44,color:[.596,1,.596],size:14,duration:55},{name:"Governance",radius:190,speed:.32,color:[1,.843,0],size:18,duration:75}],Di=400,ms=[.17,.83,.75];class gs{constructor(e){ee(this,"container");ee(this,"scene");ee(this,"camera");ee(this,"renderer");ee(this,"containerWidth");ee(this,"containerHeight");ee(this,"scaleFactor");ee(this,"sun",null);ee(this,"planets",[]);ee(this,"animationId",null);ee(this,"clock");ee(this,"_isRunning",!1);ee(this,"state","solar");ee(this,"transitionProgress",0);ee(this,"transitionStartTime",0);ee(this,"transitionDuration",1.5);ee(this,"planetAngles",[]);ee(this,"vertexShader",`
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = 3.0;
    }
  `);ee(this,"fragmentShader",`
    varying vec3 vColor;
    void main() {
      if(length(gl_PointCoord - vec2(0.5)) > 0.5) discard;
      gl_FragColor = vec4(vColor, 0.9);
    }
  `);ee(this,"animate",()=>{if(!this._isRunning)return;const e=this.clock.getElapsedTime();if(this.state==="transitioning"){const t=e-this.transitionStartTime,i=Math.min(t/this.transitionDuration,1),n=this.transitionProgress<.5;this.transitionProgress=n?i:1-i,i>=1&&(this.state=n?"chaser":"solar",this.transitionProgress=n?1:0,console.log("[Particle3D] Transition complete, state:",this.state))}if(this.sun)if(this.sun.rotation.y+=.01,this.state==="chaser"){const t=Math.sin(e*2)*.1+1;this.sun.scale.set(t,t,t)}else this.sun.scale.set(1,1,1);this.planets.forEach((t,i)=>{const n=Un[i];if(this.state==="solar"||this.state==="transitioning"){const r=2*Math.PI/n.duration;this.planetAngles[i]+=r*.016;const o=this.planetAngles[i],l=n.radius*this.scaleFactor*(1-this.transitionProgress*.7);t.position.x=l*Math.cos(o),t.position.y=l*Math.sin(o),t.position.z=0}else if(this.state==="chaser"){const o=e*1.5+i*Math.PI*2/Un.length,a=this.containerWidth*.2*this.scaleFactor;t.position.x=a*Math.cos(o),t.position.y=a*Math.sin(o),t.position.z=0,t.rotation.z+=.02}}),this.renderer.render(this.scene,this.camera),this.animationId=requestAnimationFrame(this.animate)});this.container=e,this.clock=new Eu,this.containerWidth=e.clientWidth||parseInt(e.style.width)||300,this.containerHeight=e.clientHeight||parseInt(e.style.height)||300,this.scaleFactor=this.containerWidth/520,e.style.display="block",e.style.visibility="visible",e.style.opacity="1",e.style.position||(e.style.position="absolute"),e.style.pointerEvents||(e.style.pointerEvents="none"),this.scene=new Mu;const t=this.containerWidth/this.containerHeight,n=Math.max(this.containerWidth,this.containerHeight)/2;this.camera=new er(-n*t,n*t,n,-n,.1,1e3),this.camera.position.z=100,this.renderer=new Cr({alpha:!0,antialias:!0}),this.renderer.setSize(this.containerWidth,this.containerHeight),this.renderer.domElement.style.width="100%",this.renderer.domElement.style.height="100%",this.renderer.domElement.style.display="block",this.renderer.domElement.style.position="absolute",this.renderer.domElement.style.top="0",this.renderer.domElement.style.left="0",this.renderer.domElement.style.pointerEvents="none",e.appendChild(this.renderer.domElement);const r=[35,120,210,300,20,95,335];this.planetAngles=Un.map((o,a)=>(r[a]||0)*Math.PI/180),this.createSun(),this.createPlanets(),window.addEventListener("resize",this.handleResize.bind(this)),console.log("[Particle3D] Initialized (Solar System)",{containerSize:`${this.containerWidth}x${this.containerHeight}`,scaleFactor:this.scaleFactor.toFixed(3),sun:Di,planets:Un.map(o=>`${o.name}: ${o.size}px`)})}createSun(){const e=new kt,t=new Float32Array(Di*3),i=new Float32Array(Di*3);for(let r=0;r<Di;r++){const o=Math.random()*Math.PI*2,a=Math.acos(Math.random()*2-1),l=.3+Math.random()*.1;t[r*3]=l*Math.sin(a)*Math.cos(o),t[r*3+1]=l*Math.sin(a)*Math.sin(o),t[r*3+2]=l*Math.cos(a),i[r*3]=ms[0],i[r*3+1]=ms[1],i[r*3+2]=ms[2]}e.setAttribute("position",new Rt(t,3)),e.setAttribute("color",new Rt(i,3));const n=new Lr({size:3,vertexColors:!0,transparent:!0,opacity:.9});this.sun=new yu(e,n),this.scene.add(this.sun)}createPlanets(){Un.forEach((e,t)=>{const i=e.size*this.scaleFactor/2,n=new ps(i,32,32),r=new es({color:new He(e.color[0],e.color[1],e.color[2]),transparent:!0,opacity:1}),o=new Yt(n,r),a=e.radius*this.scaleFactor;o.position.set(a,0,0),this.scene.add(o),this.planets.push(o)})}setActive(e){e&&this.state==="solar"?(this.state="transitioning",this.transitionStartTime=this.clock.getElapsedTime(),console.log("[Particle3D] Transitioning to chaser formation")):!e&&this.state==="chaser"&&(this.state="transitioning",this.transitionStartTime=this.clock.getElapsedTime(),console.log("[Particle3D] Transitioning to solar system"))}morphTo(e){this.state!=="solar"&&this.setActive(!1)}start(){this._isRunning||(console.log("[Particle3D] Starting animation"),this._isRunning=!0,this.clock.start(),this.animate())}stop(){this._isRunning=!1,this.animationId&&(cancelAnimationFrame(this.animationId),this.animationId=null)}isRunning(){return this._isRunning}handleResize(){const e=this.container.clientWidth||this.containerWidth,t=this.container.clientHeight||this.containerHeight;this.containerWidth=e,this.containerHeight=t,this.scaleFactor=this.containerWidth/520;const i=e/t,r=Math.max(e,t)/2;this.camera.left=-r*i,this.camera.right=r*i,this.camera.top=r,this.camera.bottom=-r,this.camera.updateProjectionMatrix(),this.renderer.setSize(e,t),this.planets.forEach((o,a)=>{const c=Un[a].radius*this.scaleFactor,u=this.planetAngles[a];o.position.x=c*Math.cos(u),o.position.y=c*Math.sin(u)})}destroy(){this.stop(),this.sun&&(this.scene.remove(this.sun),this.sun.geometry.dispose(),this.sun.material.dispose()),this.planets.forEach(e=>{this.scene.remove(e),e.geometry.dispose(),e.material.dispose()}),this.planets=[],this.renderer.dispose(),window.removeEventListener("resize",this.handleResize),this.renderer.domElement.parentNode&&this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)}}const Tu=[{id:"magic-tools",icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M17.8 6.2L19 5M12.2 11.8L11 13M12.2 6.2L11 5"/>
      <path d="M15 9a1 1 0 0 1 1 1 1 1 0 0 1-1 1 1 1 0 0 1-1-1 1 1 0 0 1 1-1"/>
      <path d="M3 21l9-9"/>
      <path d="M12.2 6.2L11 5"/>
    </svg>`,label:"Magic Tools"},{id:"settings",icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>`,label:"Settings"},{id:"language",icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>`,label:"Language"},{id:"persona",icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="8" width="18" height="14" rx="2"/>
      <path d="M12 8V6a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2"/>
      <path d="M8 8V6a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v2"/>
      <path d="M9 15h6"/>
    </svg>`,label:"Persona"},{id:"microphone",icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>`,label:"Speak",className:"ed-dock-mic"},{id:"keyboard",icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8"/>
    </svg>`,label:"Keyboard"},{id:"close",icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>`,label:"Close"}];class bu{constructor(e,t){ee(this,"container");ee(this,"options");ee(this,"items",new Map);ee(this,"activeMenu",null);this.container=e,this.options=t,e&&(e.style.display="flex",e.style.visibility="visible",e.style.opacity="1"),this.render(),document.addEventListener("click",i=>{const n=i.target;if(this.activeMenu){!this.activeMenu.contains(n)&&!this.container.contains(n)&&this.closeMenu();const r=n.closest(".dock-item");r&&r!==this.container.querySelector(`[data-action="${this.activeMenu.dataset.action}"]`)&&this.closeMenu()}})}render(){this.container.innerHTML="",this.container.style.display="flex",this.container.style.visibility="visible",this.container.style.opacity="1",Tu.forEach(e=>{const t=document.createElement("button");e.id==="microphone"&&(t.id="dock-mic-btn"),t.className="dock-item",t.setAttribute("data-action",e.id),t.setAttribute("aria-label",e.label),t.setAttribute("title",e.label),t.innerHTML=e.icon,t.style.opacity="1",t.style.visibility="visible",t.style.display="flex",t.addEventListener("click",()=>this.handleClick(e.id)),t.addEventListener("mouseenter",()=>this.handleHover(t,!0)),t.addEventListener("mouseleave",()=>this.handleHover(t,!1)),this.items.set(e.id,t),this.container.appendChild(t)}),requestAnimationFrame(()=>{this.container.style.display="flex",this.container.style.visibility="visible",this.container.style.opacity="1"})}handleClick(e){const t=this.items.get(e);t&&(t.classList.add("ed-dock-clicked"),setTimeout(()=>t.classList.remove("ed-dock-clicked"),200)),["magic-tools","settings","language","persona"].includes(e)?this.activeMenu&&this.activeMenu.dataset.action===e?this.closeMenu():(this.closeMenu(),setTimeout(()=>{this.toggleMenu(e,t)},50)):(this.closeMenu(),this.options.onAction(e))}toggleMenu(e,t){if(this.activeMenu&&this.activeMenu.dataset.action===e){this.closeMenu();return}this.closeMenu();const i=this.createMenu(e,t);i&&(this.activeMenu=i,t.style.position="relative",t.appendChild(i),i.style.display="flex",i.style.visibility="visible",requestAnimationFrame(()=>{i.classList.add("dock-menu-visible"),i.style.opacity="1"}))}createMenu(e,t){const i=document.createElement("div");switch(i.className="dock-menu",i.dataset.action=e,e){case"magic-tools":i.innerHTML=`
          <div class="dock-menu-item" data-tool="form-fill">
            <span class="dock-menu-icon">📝</span>
            <span>Form Fill</span>
          </div>
          <div class="dock-menu-item" data-tool="page-scan">
            <span class="dock-menu-icon">🔍</span>
            <span>Page Scan</span>
          </div>
          <div class="dock-menu-item" data-tool="calendar">
            <span class="dock-menu-icon">📅</span>
            <span>Calendar</span>
          </div>
          <div class="dock-menu-item" data-tool="emoji-tester">
            <span class="dock-menu-icon">🎨</span>
            <span>Emoji Tester</span>
          </div>
        `;break;case"settings":i.innerHTML=`
          <div class="dock-menu-item" data-setting="theme-standard">
            <span class="dock-menu-icon">🎨</span>
            <span>Standard Theme</span>
          </div>
          <div class="dock-menu-item" data-setting="theme-warm">
            <span class="dock-menu-icon">🔥</span>
            <span>Warm Theme</span>
          </div>
          <div class="dock-menu-item" data-setting="theme-cool">
            <span class="dock-menu-icon">❄️</span>
            <span>Cool Theme</span>
          </div>
          <div class="dock-menu-item" data-setting="theme-contrast">
            <span class="dock-menu-icon">⚡</span>
            <span>High Contrast</span>
          </div>
        `;break;case"language":i.innerHTML=`
          <div class="dock-menu-item" data-lang="en-GB">🇬🇧 English</div>
          <div class="dock-menu-item" data-lang="pl">🇵🇱 Polski</div>
          <div class="dock-menu-item" data-lang="ro">🇷🇴 Română</div>
          <div class="dock-menu-item" data-lang="es">🇪🇸 Español</div>
          <div class="dock-menu-item" data-lang="pt">🇵🇹 Português</div>
          <div class="dock-menu-item" data-lang="fr">🇫🇷 Français</div>
          <div class="dock-menu-item" data-lang="ur">🇵🇰 Urdu</div>
          <div class="dock-menu-item" data-lang="bn">🇧🇩 Bengali</div>
          <div class="dock-menu-item" data-lang="so">🇸🇴 Somali</div>
          <div class="dock-menu-item" data-lang="zh">🇨🇳 Chinese</div>
          <div class="dock-menu-item" data-lang="ar">🇸🇦 Arabic</div>
          <div class="dock-menu-item" data-lang="pa">🇮🇳 Punjabi</div>
        `;break;case"persona":i.innerHTML=`
          <div class="dock-menu-section">
            <div class="dock-menu-section-title">Main Assistant</div>
            <div class="dock-menu-item" data-persona="ed">
              <span class="dock-menu-icon">🎓</span>
              <span>Ed (Male Voice)</span>
            </div>
            <div class="dock-menu-item" data-persona="edwina">
              <span class="dock-menu-icon">🎓</span>
              <span>Edwina (Female Voice)</span>
            </div>
          </div>
          <div class="dock-menu-divider"></div>
          <div class="dock-menu-section">
            <div class="dock-menu-section-title">Character Voices</div>
            <div class="dock-menu-item" data-persona="santa">
              <span class="dock-menu-icon">🎅</span>
              <span>Santa</span>
            </div>
            <div class="dock-menu-item" data-persona="elf">
              <span class="dock-menu-icon">🧝</span>
              <span>Elf</span>
            </div>
            <div class="dock-menu-item" data-persona="headteacher">
              <span class="dock-menu-icon">👔</span>
              <span>Headteacher</span>
            </div>
          </div>
        `;break;default:return null}return i.querySelectorAll(".dock-menu-item").forEach(n=>{n.addEventListener("click",r=>{r.stopPropagation(),r.preventDefault();const o=n.dataset.tool,a=n.dataset.setting,l=n.dataset.lang,c=n.dataset.persona;this.closeMenu(),setTimeout(()=>{var u,h,f,m,g,_,p,d;if(o)(h=(u=this.options).onToolAction)==null||h.call(u,o);else if(a){const E=a.replace("theme-","");(m=(f=this.options).onSettingChange)==null||m.call(f,E)}else l?(_=(g=this.options).onLanguageChange)==null||_.call(g,l):c&&((d=(p=this.options).onPersonaChange)==null||d.call(p,c))},100)})}),i}closeMenu(){this.activeMenu&&(this.activeMenu.classList.remove("dock-menu-visible"),this.activeMenu.style.opacity="0",this.activeMenu.style.pointerEvents="none",setTimeout(()=>{if(this.activeMenu){this.activeMenu.parentNode&&this.activeMenu.parentNode.removeChild(this.activeMenu);const e=this.container.querySelector(`[data-action="${this.activeMenu.dataset.action}"]`);e&&e.contains(this.activeMenu)&&e.removeChild(this.activeMenu),this.activeMenu=null}},200))}handleHover(e,t){t?e.classList.add("ed-dock-hover"):e.classList.remove("ed-dock-hover")}setListening(e){const t=this.items.get("microphone");t&&(e?t.classList.add("mic-active"):t.classList.remove("mic-active"))}highlight(e){const t=this.items.get(e);t&&(t.classList.add("ed-dock-highlight"),setTimeout(()=>t.classList.remove("ed-dock-highlight"),2e3))}setVisible(e,t){const i=this.items.get(e);i&&(i.style.display=t?"":"none")}}class Au{constructor(e,t){ee(this,"container");ee(this,"messagesContainer");ee(this,"messages",[]);ee(this,"onQuickReply");this.container=e,this.messagesContainer=document.createElement("div"),this.onQuickReply=t,this.render()}render(){this.container.innerHTML="",this.container.className="chat-scroll scrollbar-hide",this.messagesContainer=this.container}addMessage(e){this.messages.push(e),this.renderMessage(e),this.scrollToBottom()}renderMessage(e){const t=document.createElement("div");t.className=`msg msg-${e.role==="user"?"user":"ai"}`,t.setAttribute("data-id",e.id);let i=this.formatMessage(e.content);if(e.translation&&e.translation!==e.content&&(i+=`<div class="msg-divider"></div><span class="msg-sub">${this.escapeHtml(e.translation)}</span>`),t.innerHTML=i,e.role==="assistant"&&e.quickReplies&&e.quickReplies.length>0){const n=document.createElement("div");n.className="quick-replies",e.quickReplies.forEach(r=>{const o=document.createElement("button");o.className="quick-reply-btn",o.textContent=r,o.addEventListener("click",()=>{this.onQuickReply&&this.onQuickReply(r)}),n.appendChild(o)}),t.appendChild(n)}t.style.opacity="0",t.style.transform="scale(0.9) translateY(10px)",this.messagesContainer.appendChild(t),requestAnimationFrame(()=>{t.style.transition="all 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)",t.style.opacity="1",t.style.transform="scale(1) translateY(0)"})}formatMessage(e){let t=this.escapeHtml(e);return t=t.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>"),t=t.replace(/\*(.*?)\*/g,"<em>$1</em>"),t=t.replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>'),t=t.replace(/\n/g,"<br>"),t}escapeHtml(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}formatTime(e){return e.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}getUserIcon(){return`<svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="8" r="4"/>
      <path d="M12 14c-4 0-8 2-8 6v2h16v-2c0-4-4-6-8-6z"/>
    </svg>`}getEdIcon(){return`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>
      <path d="M9 12l-2 8M15 12l2 8" stroke-linecap="round"/>
    </svg>`}scrollToBottom(){requestAnimationFrame(()=>{this.messagesContainer.scrollTop=this.messagesContainer.scrollHeight})}clear(){this.messages=[],this.messagesContainer.innerHTML=""}getMessages(){return[...this.messages]}updateMessage(e,t){const i=this.messages.find(n=>n.id===e);if(i){i.content=t;const n=this.messagesContainer.querySelector(`[data-id="${e}"]`);if(n){const r=n.querySelector(".ed-message-bubble");r&&(r.innerHTML=this.formatMessage(t))}}}showTyping(){const e="typing-"+Date.now(),t=document.createElement("div");return t.className="ed-message ed-message-assistant ed-message-typing",t.setAttribute("data-id",e),t.innerHTML=`
      <div class="ed-message-content">
        <div class="ed-message-avatar">${this.getEdIcon()}</div>
        <div class="ed-message-bubble">
          <div class="ed-typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    `,this.messagesContainer.appendChild(t),this.scrollToBottom(),e}hideTyping(e){const t=this.messagesContainer.querySelector(`[data-id="${e}"]`);t&&t.remove()}}class wu{constructor(e="en-GB"){ee(this,"recognition",null);ee(this,"isListening",!1);ee(this,"language");ee(this,"onResultCallback",null);ee(this,"onListeningChangeCallback",null);ee(this,"onErrorCallback",null);this.language=e,this.initRecognition()}initRecognition(){const e=window.SpeechRecognition||window.webkitSpeechRecognition;if(!e){console.warn("[Ed Voice] Speech recognition not supported");return}this.recognition=new e,this.recognition.continuous=!1,this.recognition.interimResults=!0,this.recognition.lang=this.language,this.recognition.maxAlternatives=1,this.recognition.onstart=()=>{var t;this.isListening=!0,(t=this.onListeningChangeCallback)==null||t.call(this,!0)},this.recognition.onend=()=>{var t;this.isListening=!1,(t=this.onListeningChangeCallback)==null||t.call(this,!1)},this.recognition.onresult=t=>{var r;const i=t.results,n=i[i.length-1];if(n.isFinal){const o=n[0].transcript.trim();o&&((r=this.onResultCallback)==null||r.call(this,o))}},this.recognition.onerror=t=>{var i,n;console.error("[Ed Voice] Error:",t.error),this.isListening=!1,(i=this.onListeningChangeCallback)==null||i.call(this,!1),(n=this.onErrorCallback)==null||n.call(this,t.error)}}start(){var e;if(!this.recognition){(e=this.onErrorCallback)==null||e.call(this,"Speech recognition not supported");return}if(!this.isListening)try{this.recognition.start()}catch(t){console.error("[Ed Voice] Failed to start:",t)}}stop(){if(!(!this.recognition||!this.isListening))try{this.recognition.stop()}catch(e){console.error("[Ed Voice] Failed to stop:",e)}}setLanguage(e){this.language=e,this.recognition&&(this.recognition.lang=e)}onResult(e){this.onResultCallback=e}onListeningChange(e){this.onListeningChangeCallback=e}onError(e){this.onErrorCallback=e}isSupported(){return this.recognition!==null}getIsListening(){return this.isListening}destroy(){this.stop(),this.recognition=null}}class Ru{constructor(e){ee(this,"element");ee(this,"currentState","ready");this.element=document.createElement("div"),this.element.className="status-pill",this.element.id="status-pill",this.element.textContent="Ready",e.appendChild(this.element)}setState(e){this.currentState=e;const t={ready:"Ready",listening:"Listening...",thinking:"Thinking...",speaking:"Speaking..."};this.element.textContent=t[e],e==="ready"?this.element.style.opacity="0":this.element.style.opacity="1"}getState(){return this.currentState}show(){this.element.style.opacity="1"}hide(){this.element.style.opacity="0"}}class Cu{constructor(e){ee(this,"container");ee(this,"particle3D",null);ee(this,"currentShape","sphere");ee(this,"isVisible",!1);ee(this,"shapes",["sphere","pencil","lightbulb","flag","heart","star","logo","thumbsup","checkmark","smiley","book","clock","warning","question","loading","calendar","search","phone","location","fireworks","party","confetti","trophy","excited","thinking","confused","error","speech","document","calculator","bell","graduation"]);this.container=e,this.createUI()}createUI(){const e=document.createElement("div");e.id="emoji-tester-panel",e.style.cssText=`
      position: fixed;
      top: 20px;
      right: 20px;
      width: 400px;
      max-height: 90vh;
      background: rgba(20, 20, 30, 0.95);
      border: 2px solid #2dd4bf;
      border-radius: 12px;
      padding: 20px;
      z-index: 10000;
      overflow-y: auto;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #ffffff;
      display: none;
    `;const t=document.createElement("div");t.style.cssText=`
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid rgba(45, 212, 191, 0.3);
    `;const i=document.createElement("h2");i.textContent="🎨 Emoji Shape Tester",i.style.cssText=`
      margin: 0;
      font-size: 1.2rem;
      color: #2dd4bf;
    `;const n=document.createElement("button");n.textContent="✕",n.style.cssText=`
      background: transparent;
      border: 1px solid #2dd4bf;
      color: #2dd4bf;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1.2rem;
      line-height: 1;
      transition: all 0.2s;
    `,n.onmouseover=()=>{n.style.background="#2dd4bf",n.style.color="#000"},n.onmouseout=()=>{n.style.background="transparent",n.style.color="#2dd4bf"},n.onclick=()=>this.hide(),t.appendChild(i),t.appendChild(n);const r=document.createElement("div");r.id="emoji-tester-canvas",r.style.cssText=`
      width: 300px;
      height: 300px;
      margin: 0 auto 20px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      border: 1px solid rgba(45, 212, 191, 0.2);
      position: relative;
    `;const o=document.createElement("div");o.textContent="Select Shape:",o.style.cssText=`
      font-size: 0.9rem;
      color: #aaa;
      margin-bottom: 10px;
    `;const a=document.createElement("div");a.style.cssText=`
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      max-height: 400px;
      overflow-y: auto;
      padding: 10px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
    `,this.shapes.forEach(c=>{const u=document.createElement("button");u.textContent=this.getShapeEmoji(c),u.title=c,u.style.cssText=`
        padding: 12px;
        background: rgba(45, 212, 191, 0.1);
        border: 2px solid transparent;
        border-radius: 6px;
        cursor: pointer;
        font-size: 1.5rem;
        transition: all 0.2s;
        color: #fff;
      `,u.onmouseover=()=>{u.style.background="rgba(45, 212, 191, 0.2)",u.style.borderColor="#2dd4bf"},u.onmouseout=()=>{this.currentShape!==c&&(u.style.background="rgba(45, 212, 191, 0.1)",u.style.borderColor="transparent")},u.onclick=()=>this.selectShape(c),c===this.currentShape&&(u.style.background="rgba(45, 212, 191, 0.3)",u.style.borderColor="#2dd4bf");const h=document.createElement("div");h.textContent=c,h.style.cssText=`
        font-size: 0.7rem;
        color: #aaa;
        margin-top: 4px;
      `;const f=document.createElement("div");f.style.cssText="text-align: center;",f.appendChild(u),f.appendChild(h),a.appendChild(f)});const l=document.createElement("div");l.id="emoji-tester-info",l.style.cssText=`
      margin-top: 15px;
      padding: 12px;
      background: rgba(45, 212, 191, 0.1);
      border-radius: 6px;
      font-size: 0.9rem;
      color: #aaa;
    `,this.updateInfo(),e.appendChild(t),e.appendChild(r),e.appendChild(o),e.appendChild(a),e.appendChild(l),document.body.appendChild(e)}getShapeEmoji(e){return{sphere:"⚪",pencil:"✏️",lightbulb:"💡",flag:"🏴",heart:"❤️",star:"⭐",logo:"🎓",thumbsup:"👍",checkmark:"✅",smiley:"😊",book:"📖",clock:"⏰",warning:"⚠️",question:"❓",loading:"⏳",calendar:"📅",search:"🔍",phone:"📞",location:"📍",fireworks:"🎆",party:"🎉",confetti:"🎊",trophy:"🏆",excited:"⚡",thinking:"🤔",confused:"😕",error:"❌",speech:"💬",document:"📄",calculator:"🧮",bell:"🔔",graduation:"🎓"}[e]||"⚪"}updateInfo(){const e=document.getElementById("emoji-tester-info");e&&(e.textContent=`Current: ${this.currentShape} ${this.getShapeEmoji(this.currentShape)}`)}selectShape(e){var t;this.currentShape=e,(t=this.particle3D)==null||t.morphTo(e),this.updateInfo(),this.updateButtonStates()}updateButtonStates(){const e=document.getElementById("emoji-tester-panel");if(!e)return;e.querySelectorAll("button").forEach(i=>{i.title===this.currentShape?(i.style.background="rgba(45, 212, 191, 0.3)",i.style.borderColor="#2dd4bf"):(i.style.background="rgba(45, 212, 191, 0.1)",i.style.borderColor="transparent")})}show(){const e=document.getElementById("emoji-tester-panel");if(!e)return;this.isVisible=!0,e.style.display="block";const t=document.getElementById("emoji-tester-canvas");t&&!this.particle3D&&(this.particle3D=new gs(t),this.particle3D.start(),this.particle3D.morphTo(this.currentShape))}hide(){const e=document.getElementById("emoji-tester-panel");e&&(this.isVisible=!1,e.style.display="none",this.particle3D&&this.particle3D.stop())}toggle(){this.isVisible?this.hide():this.show()}destroy(){this.particle3D&&(this.particle3D.stop(),this.particle3D=null);const e=document.getElementById("emoji-tester-panel");e&&e.remove()}}class Lu{constructor(e,t){ee(this,"apiKey");ee(this,"model");ee(this,"conversationHistory",[]);ee(this,"modelsToTry",["gemini-2.5-flash","gemini-pro-latest","gemini-2.0-flash","gemini-flash-latest"]);if(!e||e.trim()==="")throw new Error("Gemini API key is required. Set VITE_GEMINI_API_KEY in .env.local");this.apiKey=e,this.model=t||"gemini-2.5-flash";const i=e.substring(0,10)+"..."+e.substring(e.length-4);console.log(`[Gemini] Initialized with API key: ${i}, model: ${this.model}`)}getBaseUrl(e){return`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent`}getBaseUrlV1(e){return`https://generativelanguage.googleapis.com/v1/models/${e}:generateContent`}async listAvailableModels(){var e;try{const t=await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`);if(!t.ok){const r=await t.json().catch(()=>({}));return console.error("[Gemini] Failed to list models:",r),[]}const n=((e=(await t.json()).models)==null?void 0:e.map(r=>{var o;return((o=r.name)==null?void 0:o.replace("models/",""))||""}))||[];return console.log("[Gemini] Available models:",n),n}catch(t){return console.error("[Gemini] Error listing models:",t),[]}}async chat(e,t){var o,a,l,c,u,h,f,m;const i=this.buildSystemPrompt(t);this.conversationHistory.push({role:"user",content:e});const n=[this.model,...this.modelsToTry.filter(g=>g!==this.model)];for(const g of n)try{let _=await this.tryRequest(g,i,!0);if(!_.ok){const p=await _.json().catch(()=>({}));(_.status===404||(a=(o=p.error)==null?void 0:o.message)!=null&&a.includes("not found"))&&(console.log(`[Gemini] Model ${g} not found in v1beta, trying v1 API...`),_=await this.tryRequest(g,i,!1))}if(_.ok){const p=await _.json(),d=((f=(h=(u=(c=(l=p.candidates)==null?void 0:l[0])==null?void 0:c.content)==null?void 0:u.parts)==null?void 0:h[0])==null?void 0:f.text)||"";if(!d){console.warn(`[Gemini] Empty response from ${g}:`,p);continue}return g!==this.model&&(console.log(`[Gemini] ✅ Using model: ${g}`),this.model=g),this.conversationHistory.push({role:"assistant",content:d}),d}else{const d=((m=(await _.json().catch(()=>({}))).error)==null?void 0:m.message)||`HTTP ${_.status}`;if(console.error(`[Gemini] Model ${g} failed:`,{model:g,status:_.status,error:d,url:baseUrl.split("?")[0]}),_.status===401||_.status===403)throw new Error(`API key authentication failed (${_.status}). Check your API key is valid.`);continue}}catch(_){console.warn(`[Gemini] Error with model ${g}:`,_);continue}const r=["All Gemini models failed.","","Possible issues:","1. API key may be invalid or expired","2. API key may not have Gemini API enabled in Google Cloud Console","3. Project may not have billing enabled","4. Models may not be available in your region","","To diagnose:","- Check your API key is valid at https://ai.google.dev/","- Ensure Gemini API is enabled in Google Cloud Console","- Check that billing is enabled for your project","- Try calling listAvailableModels() to see what models you have access to"].join(`
`);throw console.error("[Gemini]",r),new Error(r)}async tryRequest(e,t,i){const n=i?this.getBaseUrl(e):this.getBaseUrlV1(e);return console.log(`[Gemini] Attempting ${e} via ${i?"v1beta":"v1"} API...`),await fetch(`${n}?key=${this.apiKey}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{role:"user",parts:[{text:t},...this.conversationHistory.map(r=>({text:`${r.role}: ${r.content}`}))]}],generationConfig:{temperature:.7,topK:40,topP:.95,maxOutputTokens:1024},safetySettings:[{category:"HARM_CATEGORY_HARASSMENT",threshold:"BLOCK_MEDIUM_AND_ABOVE"},{category:"HARM_CATEGORY_HATE_SPEECH",threshold:"BLOCK_MEDIUM_AND_ABOVE"},{category:"HARM_CATEGORY_SEXUALLY_EXPLICIT",threshold:"BLOCK_MEDIUM_AND_ABOVE"},{category:"HARM_CATEGORY_DANGEROUS_CONTENT",threshold:"BLOCK_MEDIUM_AND_ABOVE"}]})})}buildSystemPrompt(e){const{persona:t,language:i,schoolId:n,toolContext:r,pageContext:o}=e;let a=`You are ${t.name}, a friendly AI assistant for ${n} school. 
Your personality: ${t.greeting}
Current language: ${i.name} (${i.code})

IMPORTANT GUIDELINES:
- Be helpful, friendly, and professional
- Keep responses concise (2-3 sentences for simple questions)
- If asked about admissions, forms, or school procedures, offer to help
- Always be supportive of parents, especially those for whom English isn't their first language
- If you don't know specific school information, politely say so and suggest contacting the school office
- Respond in ${i.name} when the user speaks in ${i.name}

When helping with forms:
- Offer to guide through each field
- Explain what information is needed
- Be patient and encouraging

You can help with:
- Admissions enquiries
- Form filling assistance
- General school information
- Explaining school procedures
- Translating between languages`;return o&&(a+=`

CURRENT PAGE CONTEXT:
${o}

Use this information to provide relevant, contextual answers about what the user is currently viewing. Reference specific content from the page when helpful.`),r&&(a+=`

CURRENT TOOL CONTEXT:
The user is currently using "${r.name}" (${r.category} category).
${r.url?`Tool URL: ${r.url}`:""}

Your expertise for this tool includes: ${r.expertise.join(", ")}.

When answering questions:
- Provide guidance specific to ${r.name}
- Help with common tasks and workflows in this tool
- Offer tips and best practices for school staff using this tool
- If asked about features you're unsure of, suggest checking the tool's help documentation`),a}clearHistory(){this.conversationHistory=[]}getHistory(){return[...this.conversationHistory]}}const Ur={ed:{id:"ed",name:"Ed",color:"#2dd4bf",voicePitch:1,voiceRate:1,greeting:"Hello! I'm Ed, your school assistant. How can I help you today?",icon:"🎓"},edwina:{id:"edwina",name:"Edwina",color:"#2dd4bf",voicePitch:1.2,voiceRate:1,greeting:"Hello! I'm Edwina, your school assistant. How can I help you today?",icon:"🎓"},santa:{id:"santa",name:"Santa",color:"#ef4444",voicePitch:.8,voiceRate:.9,greeting:"Ho ho ho! I'm Santa's helper at your school. What would you like to know?",icon:"🎅"},elf:{id:"elf",name:"Jingle",color:"#eab308",voicePitch:1.3,voiceRate:1.1,greeting:"Hi there! I'm Jingle the Elf, here to help with all your school questions!",icon:"🧝"},custom:{id:"custom",name:"Assistant",color:"#8b5cf6",voicePitch:1,voiceRate:1,greeting:"Hello! How can I assist you today?",icon:"🤖"}};function $n(s){return Ur[s]||Ur.ed}const Yn=[{code:"en-GB",name:"English",nativeName:"English",flag:"🇬🇧",flagColors:["#012169","#FFFFFF","#C8102E"],voiceLang:"en-GB",greeting:"Hello! I'm Ed, your school assistant."},{code:"pl",name:"Polish",nativeName:"Polski",flag:"🇵🇱",flagColors:["#FFFFFF","#DC143C"],voiceLang:"pl-PL",greeting:"Cześć! Jestem Ed, asystent szkolny."},{code:"ro",name:"Romanian",nativeName:"Română",flag:"🇷🇴",flagColors:["#002B7F","#FCD116","#CE1126"],voiceLang:"ro-RO",greeting:"Bună! Sunt Ed, asistentul școlii."},{code:"ur",name:"Urdu",nativeName:"اردو",flag:"🇵🇰",flagColors:["#01411C","#FFFFFF"],voiceLang:"ur-PK",greeting:"ہیلو! میں ایڈ ہوں، آپ کا اسکول اسسٹنٹ۔"},{code:"bn",name:"Bengali",nativeName:"বাংলা",flag:"🇧🇩",flagColors:["#006A4E","#F42A41"],voiceLang:"bn-BD",greeting:"হ্যালো! আমি এড, আপনার স্কুল সহকারী।"},{code:"so",name:"Somali",nativeName:"Soomaali",flag:"🇸🇴",flagColors:["#4189DD","#FFFFFF"],voiceLang:"so-SO",greeting:"Salaan! Waxaan ahay Ed, kaaliyaha dugsiga."},{code:"es",name:"Spanish",nativeName:"Español",flag:"🇪🇸",flagColors:["#AA151B","#F1BF00","#AA151B"],voiceLang:"es-ES",greeting:"¡Hola! Soy Ed, tu asistente escolar."},{code:"pt",name:"Portuguese",nativeName:"Português",flag:"🇵🇹",flagColors:["#006600","#FF0000"],voiceLang:"pt-PT",greeting:"Olá! Sou o Ed, o assistente da escola."},{code:"fr",name:"French",nativeName:"Français",flag:"🇫🇷",flagColors:["#002395","#FFFFFF","#ED2939"],voiceLang:"fr-FR",greeting:"Bonjour! Je suis Ed, l'assistant scolaire."},{code:"zh",name:"Chinese",nativeName:"中文",flag:"🇨🇳",flagColors:["#DE2910","#FFDE00"],voiceLang:"zh-CN",greeting:"你好！我是Ed，您的学校助手。"},{code:"ar",name:"Arabic",nativeName:"العربية",flag:"🇸🇦",flagColors:["#006C35","#FFFFFF"],voiceLang:"ar-SA",greeting:"مرحبا! أنا إد، مساعد المدرسة."},{code:"pa",name:"Punjabi",nativeName:"ਪੰਜਾਬੀ",flag:"🇮🇳",flagColors:["#FF9933","#FFFFFF","#138808"],voiceLang:"pa-IN",greeting:"ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਐਡ ਹਾਂ, ਤੁਹਾਡਾ ਸਕੂਲ ਸਹਾਇਕ।"}];function _s(s){return Yn.find(e=>e.code===s)||Yn[0]}class Pu{constructor(){ee(this,"currentForm",null);ee(this,"fields",[]);ee(this,"currentFieldIndex",0);ee(this,"isActive",!1)}detectForms(){const e=document.querySelectorAll("form");return Array.from(e).filter(t=>t.querySelectorAll("input, textarea, select").length>0&&this.isVisible(t))}startFilling(e){return this.currentForm=e,this.fields=this.extractFields(e),this.currentFieldIndex=0,this.isActive=!0,this.getCurrentField()}getCurrentField(){return!this.isActive||this.currentFieldIndex>=this.fields.length?null:this.fields[this.currentFieldIndex]}fillCurrentField(e){const t=this.getCurrentField();return t?(this.fillField(t,e),!0):!1}fillFieldByVoice(e){const t=this.getCurrentField();if(!t)return!1;const i=e.trim();if(t.type==="checkbox"){const n=["yes","check","true","agree","correct","right"],r=["no","uncheck","false","disagree","wrong"];if(n.some(o=>i.toLowerCase().includes(o)))return this.fillField(t,"true"),!0;if(r.some(o=>i.toLowerCase().includes(o)))return this.fillField(t,"false"),!0}return this.fillField(t,i),!0}nextField(){return this.currentFieldIndex++,this.getCurrentField()}previousField(){return this.currentFieldIndex>0&&this.currentFieldIndex--,this.getCurrentField()}stop(){this.isActive=!1,this.currentForm=null,this.fields=[],this.currentFieldIndex=0}submitForm(){if(!this.currentForm)return!1;const e=new Event("submit",{bubbles:!0,cancelable:!0}),t=this.currentForm.dispatchEvent(e);return t&&this.currentForm.submit(),t}getProgress(){const e=this.fields.length,t=this.currentFieldIndex+1,i=e>0?Math.round(t/e*100):0;return{current:t,total:e,percentage:i}}extractFields(e){const t=[];return e.querySelectorAll("input, textarea, select").forEach(n=>{if(n instanceof HTMLInputElement&&["hidden","submit","button","reset","image"].includes(n.type)||!this.isVisible(n))return;const r=this.findLabel(n),o={element:n,label:r||n.name||n.id||"Field",type:this.getFieldType(n),required:n.required,placeholder:n.placeholder};t.push(o)}),t}findLabel(e){var o,a;const t=e.id;if(t){const l=document.querySelector(`label[for="${t}"]`);if(l)return((o=l.textContent)==null?void 0:o.trim())||""}const i=e.closest("label");if(i){const l=((a=i.textContent)==null?void 0:a.trim())||"",c=e.value;return l.replace(c,"").trim()}const n=e.getAttribute("aria-label");if(n)return n;const r=e.getAttribute("placeholder");return r||""}getFieldType(e){if(e instanceof HTMLSelectElement)return"dropdown";if(e instanceof HTMLTextAreaElement)return"text area";switch(e.type){case"email":return"email address";case"tel":return"phone number";case"date":return"date";case"number":return"number";case"checkbox":return"checkbox";case"radio":return"choice";case"password":return"password";case"url":return"website";default:return"text"}}fillField(e,t){const i=e.element;if(i.scrollIntoView({behavior:"smooth",block:"center"}),i.focus(),i instanceof HTMLSelectElement){const r=Array.from(i.options).find(o=>o.value.toLowerCase()===t.toLowerCase()||o.text.toLowerCase().includes(t.toLowerCase()));r&&(i.value=r.value)}else if(i instanceof HTMLInputElement&&i.type==="checkbox")i.checked=["yes","true","1"].includes(t.toLowerCase());else if(i instanceof HTMLInputElement&&i.type==="radio"){const n=i.name;document.querySelectorAll(`input[name="${n}"]`).forEach(o=>{(o.value.toLowerCase()===t.toLowerCase()||this.findLabel(o).toLowerCase().includes(t.toLowerCase()))&&(o.checked=!0)})}else if(i instanceof HTMLInputElement&&i.type==="date"){const n=this.parseDateToISO(t);n?i.value=n:i.value=t}else this.typeText(i,t);this.highlightField(i),i.dispatchEvent(new Event("change",{bubbles:!0})),i.dispatchEvent(new Event("input",{bubbles:!0}))}parseDateToISO(e){if(!e||!e.trim())return null;const t=e.trim();if(/^\d{4}-\d{2}-\d{2}$/.test(t))return t;try{let n=new Date(t);if(isNaN(n.getTime())){const l=/(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?([a-z]+)\s+(\d{4})/i,c=t.match(l);if(c){const u=parseInt(c[1],10),h=c[2],f=parseInt(c[3],10);n=new Date(`${h} ${u}, ${f}`)}else{const u=/([a-z]+)\s+(\d{1,2}),?\s+(\d{4})/i,h=t.match(u);if(h){const f=h[1],m=parseInt(h[2],10),g=parseInt(h[3],10);n=new Date(`${f} ${m}, ${g}`)}else{const f=/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,m=t.match(f);if(m){const g=parseInt(m[1],10),_=parseInt(m[2],10),p=parseInt(m[3],10);n=new Date(p,_-1,g)}}}}if(isNaN(n.getTime()))return null;const r=n.getFullYear(),o=String(n.getMonth()+1).padStart(2,"0"),a=String(n.getDate()).padStart(2,"0");return`${r}-${o}-${a}`}catch(n){return console.warn("[FormFill] Failed to parse date:",e,n),null}}typeText(e,t){return new Promise(i=>{e.value="";let n=0;const r=()=>{n<t.length?(e.value+=t[n],n++,setTimeout(r,30+Math.random()*50)):i()};r()})}highlightField(e){const t=e.style.outline,i=e.style.boxShadow;e.style.outline="2px solid #2dd4bf",e.style.boxShadow="0 0 10px rgba(45, 212, 191, 0.5)",setTimeout(()=>{e.style.outline=t,e.style.boxShadow=i},2e3)}isVisible(e){const t=window.getComputedStyle(e);return t.display!=="none"&&t.visibility!=="hidden"&&t.opacity!=="0"&&e.offsetParent!==null}}class Du{constructor(e,t={}){ee(this,"idleTimer",null);ee(this,"config");ee(this,"onNudge");ee(this,"isActive",!0);this.onNudge=e,this.config={idleTimeout:3e4,pageRules:{fees:"I know school fees can be confusing. Would you like to see our bursary options?",bursary:"We offer several financial support packages. Shall I guide you through the application?",transport:"Do you need help finding the nearest school bus stop to your home?",apply:"Starting an application is the first step! I can help you fill out this form if you like.",admissions:"Admissions are open for next year. Would you like to know about the deadlines?"},...t},this.init()}init(){["mousedown","mousemove","keypress","scroll","touchstart"].forEach(t=>{document.addEventListener(t,()=>this.resetTimer(),!0)}),this.resetTimer()}resetTimer(){this.isActive&&(this.idleTimer&&window.clearTimeout(this.idleTimer),this.idleTimer=window.setTimeout(()=>{this.triggerNudge()},this.config.idleTimeout))}triggerNudge(){if(!this.isActive)return;const e=window.location.pathname.toLowerCase(),t=Object.entries(this.config.pageRules).find(([i])=>e.includes(i));t?this.onNudge(t[1]):Math.random()>.7&&this.onNudge("I'm here if you need any help! Just ask."),this.stop()}stop(){this.isActive=!1,this.idleTimer&&(window.clearTimeout(this.idleTimer),this.idleTimer=null)}start(){this.isActive=!0,this.resetTimer()}}const Fr={ed:{tone:"helpful",emotion:"friendly",pitch:0,speed:1,description:"Professional, warm school assistant (male)"},edwina:{tone:"helpful",emotion:"friendly",pitch:5,speed:1,description:"Professional, warm school assistant (female)"},santa:{tone:"jolly",emotion:"warm",pitch:-10,speed:.95,description:"Festive, deep Santa voice"},elf:{tone:"upbeat",emotion:"excited",pitch:15,speed:1.1,description:"Energetic, playful elf helper"},headteacher:{tone:"professional",emotion:"calm",pitch:-5,speed:.9,description:"Authoritative, welcoming headteacher"},custom:{tone:"neutral",emotion:"neutral",pitch:0,speed:1,description:"Custom voice"}},Nr={"en-GB":"en","en-US":"en",pl:"pl",ro:"ro",es:"es",pt:"pt",fr:"fr",zh:"zh",ar:"ar",pa:"hi",bn:"bn",ur:"ur",so:"en"};class Iu{constructor(e,t){ee(this,"apiKey");ee(this,"baseUrl","/api/fish-audio");ee(this,"audioCache",new Map);ee(this,"activeAudio",null);ee(this,"voiceIds",{ed:"",edwina:"",santa:"",elf:"",headteacher:"",custom:""});ee(this,"monthlyCharCount",0);ee(this,"lastResetDate",new Date().getMonth());this.apiKey=e,t&&(this.voiceIds=t)}async speak(e,t="ed",i="en-GB"){var u;const n=this.cleanTextForTTS(e,!1),r=`${t}-${i}-${n}`;if(this.audioCache.has(r))return this.audioCache.get(r);const o=this.stripEmotionTags(n);this.updateUsage(o.length);const a=Fr[t],l=Nr[i]||"en",c=this.voiceIds[t];if(!c||c.trim()===""?(console.warn(`[Fish Audio] ⚠️ No voice ID set for ${t}, using default Fish Audio voice`),console.warn(`[Fish Audio] To use cloned voice, set voice ID in config: fishAudioVoiceIds.${t}`)):console.log(`[Fish Audio] Using cloned voice for ${t}: ${c}`),!this.apiKey||this.apiKey.trim()==="")throw new Error("Fish Audio API key is required");try{const h={text:n};c&&c.trim()!==""&&(h.reference_id=c),l&&(h.language=l);const f=this.apiKey?`${this.apiKey.substring(0,8)}...${this.apiKey.substring(this.apiKey.length-4)}`:"MISSING";console.log("[Fish Audio] Request Details:",{url:`${this.baseUrl}`,method:"POST",apiKeyMasked:f,apiKeyLength:((u=this.apiKey)==null?void 0:u.length)||0,voiceId:c||"none",requestBody:h});const m={"Content-Type":"application/json"};this.baseUrl.startsWith("/api/")?console.log("[Fish Audio] Using proxy, skipping client Authorization header"):m.Authorization=`Bearer ${this.apiKey}`;const g=await fetch(this.baseUrl,{method:"POST",headers:m,body:JSON.stringify(h)});if(!g.ok){let d=`HTTP ${g.status}`,E={};try{const x=await g.text();console.error("[Fish Audio] API Error Response (raw):",x);try{E=JSON.parse(x),d=E.message||E.error||d,console.error("[Fish Audio] API Error Response (parsed):",E)}catch{d=x||d,console.error("[Fish Audio] API Error Response (text):",x)}g.status===402?(console.error("[Fish Audio] ❌ 402 Payment Required - Possible causes:"),console.error("  1. Invalid API key (check .env.local)"),console.error("  2. Account has no credits/balance"),console.error("  3. API key might be a voice ID instead of API key"),console.error("  → Get API key from: https://fish.audio dashboard → Account Settings")):g.status===401?console.error("[Fish Audio] ❌ 401 Unauthorized - API key is invalid"):g.status===400?(console.error("[Fish Audio] ❌ 400 Bad Request - Request format issue:"),console.error("  - Check request body format"),console.error("  - Verify reference_id format"),console.error("  - Check if all required fields are present"),console.error("  Request body sent:",JSON.stringify(h,null,2))):g.status===500&&(console.error("[Fish Audio] ❌ 500 Internal Server Error - Fish Audio API issue"),console.error("  - This might be a temporary Fish Audio service issue"),console.error("  - Try again in a few moments"))}catch(x){console.error("[Fish Audio] Error parsing response:",x)}throw new Error(`TTS error: ${g.status} - ${d}`)}const _=await g.blob(),p=URL.createObjectURL(_);if(this.audioCache.size>50){const d=this.audioCache.keys().next().value;if(d){const E=this.audioCache.get(d);E&&URL.revokeObjectURL(E),this.audioCache.delete(d)}}return this.audioCache.set(r,p),console.log("[Fish Audio] Generated:",{persona:t,tone:a.tone,emotion:a.emotion,chars:e.length,monthlyTotal:this.monthlyCharCount,cost:this.estimateCost()}),p}catch(h){throw console.error("[Fish Audio] Error:",h),h}}async cloneVoice(e,t,i){const n=new FormData;n.append("audio",e),n.append("name",t),n.append("description",i);try{const r=await fetch(`${this.baseUrl}/voices/clone`,{method:"POST",headers:{Authorization:`Bearer ${this.apiKey}`},body:n});if(!r.ok)throw new Error(`Voice cloning failed: ${r.status}`);const o=await r.json(),a=o.voice_id||o.id;return console.log("[Fish Audio] Voice cloned:",{name:t,voiceId:a,duration:"15 seconds"}),a}catch(r){throw console.error("[Fish Audio] Clone error:",r),r}}async play(e){if(this.activeAudio)try{this.activeAudio.pause(),this.activeAudio.currentTime=0,await new Promise(t=>setTimeout(t,100)),this.activeAudio&&(this.activeAudio=null)}catch(t){console.warn("[Fish Audio] Error stopping previous audio:",t),this.activeAudio=null}return new Promise((t,i)=>{const n=new Audio(e);this.activeAudio=n,n.volume=1,n.load(),n.onended=()=>{this.activeAudio=null,t()},n.onerror=o=>{console.error("[Fish Audio] Audio playback error:",o),this.activeAudio=null,i(new Error("Audio playback failed"))};const r=n.play();r!==void 0&&r.then(()=>{console.log("[Fish Audio] Audio playing successfully")}).catch(o=>{if(console.error("[Fish Audio] Play promise rejected:",o),o.name==="NotAllowedError"){console.warn("[Fish Audio] Autoplay blocked, audio will play on next user interaction");const a=()=>{n.play().then(()=>{document.removeEventListener("click",a),document.removeEventListener("touchstart",a)}).catch(()=>{document.removeEventListener("click",a),document.removeEventListener("touchstart",a),i(o)})};document.addEventListener("click",a,{once:!0}),document.addEventListener("touchstart",a,{once:!0})}else i(o)})})}async stop(){if(this.activeAudio)try{this.activeAudio.pause(),this.activeAudio.currentTime=0,await new Promise(e=>setTimeout(e,100)),this.activeAudio=null}catch(e){console.warn("[Fish Audio] Error stopping audio:",e),this.activeAudio=null}}async speakAndPlay(e,t="ed",i="en-GB"){const n=await this.speak(e,t,i);await this.play(n)}async speakStream(e,t="ed",i="en-GB"){const n=Fr[t],r=Nr[i]||"en",o=await fetch(`${this.baseUrl}/tts`,{method:"POST",headers:{Authorization:`Bearer ${this.apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({text:e,reference_id:this.voiceIds[t],model:"fish-audio-s1",language:r,tone:n.tone,emotion:n.emotion,pitch:n.pitch,speed:n.speed,streaming:!0,format:"mp3"})});if(!o.ok||!o.body)throw new Error("Streaming failed");return o.body}setVoiceIds(e){this.voiceIds={...this.voiceIds,...e}}updateUsage(e){const t=new Date().getMonth();t!==this.lastResetDate&&(this.monthlyCharCount=0,this.lastResetDate=t),this.monthlyCharCount+=e}estimateCost(){return`£${(this.monthlyCharCount/1e3*.12).toFixed(2)}`}getUsageStats(){const t=Math.max(15e4-this.monthlyCharCount,0);return{charsUsedThisMonth:this.monthlyCharCount,estimatedCost:this.monthlyCharCount/1e3*.12,estimatedConversationsRemaining:Math.floor(t/800)}}clearCache(){this.audioCache.forEach(e=>URL.revokeObjectURL(e)),this.audioCache.clear()}stripEmotionTags(e){return e.replace(/\([^)]+\)/g,"").replace(/\s+/g," ").trim()}cleanTextForTTS(e,t=!0){const i=new Map;let n=e;if(t){const r=/\((?:happy|excited|calm|friendly|empathetic|professional|neutral|confident|warm|cheerful|enthusiastic|understanding|supportive|encouraging|laughing|sighing|pause\s*:\s*\d+\s*ms)\)/gi,o=e.matchAll(r);let a=0;for(const l of o){const c=`__FISH_TAG_${a}__`;i.set(c,l[0]),n=n.replace(l[0],c),a++}}return n=n.replace(/[\u{1F300}-\u{1F9FF}]/gu,"").replace(/[\u{2600}-\u{26FF}]/gu,"").replace(/[\u{2700}-\u{27BF}]/gu,"").replace(/\b[A-Z]{2}\s*🇵🇱|🇷🇴|🇬🇧|🇺🇸|🇵🇱|🇷🇴\b/gi,"").replace(/Polski\s+PL|Română\s+RO|English\s+EN/gi,"").replace(/\*\*([^*]+)\*\*/g,"$1").replace(/\*([^*]+)\*/g,"$1").replace(/`([^`]+)`/g,"$1").replace(/<[^>]+>/g,"").replace(/\[Translated to [^\]]+\]:\s*/gi,""),t?n=n.replace(/\([^)]+\)/g,""):n=n.replace(/\([^)]+\)/g,""),n=n.replace(/\s+/g," ").trim(),t&&i.forEach((r,o)=>{n=n.replace(o,r)}),n.trim()}destroy(){this.clearCache()}}const Ae={happy:"(happy)",excited:"(excited)",friendly:"(friendly)",warm:"(warm)",cheerful:"(cheerful)",enthusiastic:"(enthusiastic)",calm:"(calm)",professional:"(professional)",supportive:"(supportive)",encouraging:"(encouraging)"};function Or(s){return`(pause:${s}ms)`}const yt=Or(300),Qe=Or(500);function Kn(s){const{hasForm:e=!1,isAdmissionsPage:t=!1,isFirstVisit:i=!0}=s||{};return i?`${Ae.happy} Hello! ${yt} I'm Ed, your school assistant. ${Qe} ${Ae.friendly} I'm here to help you with any questions about our school. ${Qe} ${Ae.calm} How can I assist you today?`:t&&e?`${Ae.excited} Welcome to our admissions page! ${yt} ${Ae.friendly} I can see you're looking at our application form. ${Qe} ${Ae.supportive} I'd be happy to help you fill it out step by step. ${Qe} ${Ae.calm} Would you like me to guide you through it?`:e?`${Ae.friendly} Hello again! ${yt} ${Ae.supportive} I notice there's a form on this page. ${Qe} ${Ae.encouraging} I can help you fill it out if you'd like. ${Qe} ${Ae.calm} Just let me know when you're ready!`:`${Ae.happy} Hello! ${yt} I'm Ed, your school assistant. ${Qe} ${Ae.friendly} How can I help you today?`}function Uu(s){const{hasForm:e=!1,isAdmissionsPage:t=!1,isFirstVisit:i=!0}=s||{};return i?`${Ae.happy} Hello! ${yt} I'm Edwina, your school assistant. ${Qe} ${Ae.friendly} I'm here to help you with any questions about our school. ${Qe} ${Ae.calm} How can I assist you today?`:t&&e?`${Ae.excited} Welcome to our admissions page! ${yt} ${Ae.friendly} I can see you're looking at our application form. ${Qe} ${Ae.supportive} I'd be happy to help you fill it out step by step. ${Qe} ${Ae.calm} Would you like me to guide you through it?`:e?`${Ae.friendly} Hello again! ${yt} ${Ae.supportive} I notice there's a form on this page. ${Qe} ${Ae.encouraging} I can help you fill it out if you'd like. ${Qe} ${Ae.calm} Just let me know when you're ready!`:`${Ae.happy} Hello! ${yt} I'm Edwina, your school assistant. ${Qe} ${Ae.friendly} How can I help you today?`}function Br(s){const{isFirstVisit:e=!0}=s||{};return e?`${Ae.excited} Ho ho ho! ${yt} ${Ae.warm} I'm Santa's helper at your school. ${Qe} ${Ae.cheerful} What would you like to know? ${Qe} ${Ae.friendly} I'm here to spread some holiday cheer and help with any questions!`:`${Ae.warm} Ho ho ho! ${yt} ${Ae.friendly} Back again? ${Qe} ${Ae.cheerful} How can I help you today?`}function kr(s){const{isFirstVisit:e=!0}=s||{};return e?`${Ae.excited} Hi there! ${yt} ${Ae.enthusiastic} I'm Jingle the Elf, here to help with all your school questions! ${Qe} ${Ae.cheerful} What can I do for you today?`:`${Ae.cheerful} Hey! ${yt} ${Ae.friendly} Good to see you again! ${Qe} ${Ae.excited} What would you like to know?`}function Fu(s){const{isFirstVisit:e=!0}=s||{};return e?`${Ae.professional} Welcome to our school. ${yt} ${Ae.warm} I am the Headteacher. ${Qe} ${Ae.calm} We are proud of our community and I am here to help you explore what makes us special. ${Qe} How may I assist you?`:`${Ae.warm} Welcome back. ${yt} ${Ae.calm} I trust you are finding everything you need? ${Qe} Please let me know if I can be of further assistance.`}function Nu(s,e){switch(s){case"ed":return Kn(e);case"edwina":return Uu(e);case"santa":return Br(e);case"elf":return kr(e);case"headteacher":return Fu(e);default:return Kn(e)}}Kn(),Kn({hasForm:!0}),Kn({isAdmissionsPage:!0,hasForm:!0}),Br(),kr();class Ou{scan(){return{title:this.getTitle(),description:this.getDescription(),mainContent:this.getMainContent(),headings:this.getHeadings(),links:this.getImportantLinks(),forms:this.countForms(),pageType:this.detectPageType()}}getTitle(){var e,t;return document.title||((t=(e=document.querySelector("h1"))==null?void 0:e.textContent)==null?void 0:t.trim())||""}getDescription(){const e=document.querySelector('meta[name="description"]');return(e==null?void 0:e.getAttribute("content"))||""}getMainContent(){const e=["main",'[role="main"]',"#content",".content","#main",".main","article"];for(const t of e){const i=document.querySelector(t);if(i)return this.extractText(i,500)}return this.extractText(document.body,500)}getHeadings(){const e=[];return document.querySelectorAll("h1, h2, h3").forEach(i=>{var r;const n=(r=i.textContent)==null?void 0:r.trim();n&&!e.includes(n)&&e.push(n)}),e.slice(0,10)}getImportantLinks(){const e=[],t=document.querySelectorAll("a[href]"),i=["admission","apply","enrol","contact","form","register","calendar","term","policy","uniform","fee"];return t.forEach(n=>{var a;const r=((a=n.textContent)==null?void 0:a.trim())||"",o=n.getAttribute("href")||"";if(r&&o&&!o.startsWith("#")){const l=r.toLowerCase(),c=o.toLowerCase();i.some(u=>l.includes(u)||c.includes(u))&&e.push({text:r,href:o})}}),e.slice(0,10)}countForms(){return document.querySelectorAll("form").length}detectPageType(){const e=window.location.href.toLowerCase(),t=this.getTitle().toLowerCase(),i=this.getMainContent().toLowerCase();return e.includes("admission")||t.includes("admission")||i.includes("admission")?"admissions":e.includes("contact")||t.includes("contact")||i.includes("contact us")?"contact":e.includes("about")||t.includes("about")||i.includes("about our school")?"about":e.includes("news")||e.includes("blog")||t.includes("news")?"news":"general"}extractText(e,t){const i=e.cloneNode(!0);i.querySelectorAll("script, style, noscript, [hidden]").forEach(r=>r.remove());let n=i.textContent||"";return n=n.replace(/\s+/g," ").trim(),n.length>t&&(n=n.substring(0,t)+"..."),n}getContextForAI(){const e=this.scan();return`Current page: ${e.title}
Page type: ${e.pageType}
Has forms: ${e.forms>0?"Yes":"No"}
Key headings: ${e.headings.join(", ")}
Important links: ${e.links.map(t=>t.text).join(", ")}
Summary: ${e.mainContent.substring(0,200)}`}}const Bu=new Ou,ku={schoolId:"demo",theme:"standard",position:"bottom-right",language:"en-GB",persona:"ed",features:{admissions:!0,policies:!0,calendar:!0,staffDirectory:!1,formFill:!0,voice:!0}};class Gr{constructor(e={}){ee(this,"config");ee(this,"container");ee(this,"widget",null);ee(this,"isOpen",!1);ee(this,"isListening",!1);ee(this,"particle3D",null);ee(this,"launcherParticle3D",null);ee(this,"dock",null);ee(this,"chat",null);ee(this,"voice",null);ee(this,"ai",null);ee(this,"formFiller",null);ee(this,"proactive",null);ee(this,"fishVoice",null);ee(this,"statusPill",null);ee(this,"emojiTester",null);ee(this,"messages",[]);ee(this,"currentLanguage");ee(this,"currentPersona");ee(this,"currentTheme");ee(this,"showKeyboard",!1);ee(this,"toolContext",null);const t=window.ED_CONFIG,i={...ku,...e,...t?{geminiApiKey:t.geminiApiKey||e.geminiApiKey,openRouterApiKey:t.openRouterApiKey||e.openRouterApiKey,fishAudioApiKey:t.fishAudioApiKey||e.fishAudioApiKey,provider:t.provider||e.provider,enableAI:t.enableAI!==void 0?t.enableAI:e.enableAI,enableTTS:t.enableTTS!==void 0?t.enableTTS:e.enableTTS,ttsProvider:t.ttsProvider||e.ttsProvider,schoolId:t.schoolId||e.schoolId,language:t.language||e.language,persona:t.persona||e.persona}:{}};this.config=i,this.currentLanguage=_s(this.config.language),this.currentPersona=this.config.persona,this.currentTheme=this.config.theme,t&&(console.log("[Ed] Provider:",t.provider||"not set"),console.log("[Ed] TTS:",t.enableTTS?t.ttsProvider||"browser":"disabled"),console.log("[Ed] Keys present:",{openrouter:!!this.config.openRouterApiKey,gemini:!!this.config.geminiApiKey,fish:!!this.config.fishAudioApiKey})),this.container=document.createElement("div"),this.container.id="ed-widget-container",this.container.className=`ed-widget-container ed-position-${this.config.position}`,document.body.appendChild(this.container),this.initComponents(),this.render(),this.bindEvents(),this.config.features.formFill&&(this.formFiller=new Pu,this.checkForForms()),this.proactive=new Du(n=>{this.handleProactiveNudge(n)}),console.log("[Ed] Widget initialized",this.config)}initComponents(){const e=this.config.provider||"gemini",t=this.config.enableAI!==!1,i=this.config.enableTTS!==!1,n=this.config.ttsProvider||"browser";if(t)if(e==="gemini"&&this.config.geminiApiKey)try{this.ai=new Lu(this.config.geminiApiKey),this.ai.listAvailableModels().then(r=>{r.length>0?console.log(`[Ed] ✅ Gemini API connected. Available models: ${r.join(", ")}`):console.warn("[Ed] ⚠️ Gemini API connected but no models found. Check your API key permissions.")}).catch(r=>{console.warn("[Ed] ⚠️ Could not list Gemini models:",r)})}catch(r){console.error("[Ed] ❌ Gemini client initialization failed:",r)}else e==="openrouter"&&this.config.openRouterApiKey?console.log("[Ed] ✅ OpenRouter provider selected (client initialization pending)"):e==="gemini"&&!this.config.geminiApiKey?console.debug("[Ed] Gemini provider selected but API key not set. AI features disabled."):e==="openrouter"&&!this.config.openRouterApiKey&&console.debug("[Ed] OpenRouter provider selected but API key not set. AI features disabled.");else console.log("[Ed] AI disabled in configuration");if(i&&n==="fish")if(this.config.fishAudioApiKey&&this.config.fishAudioApiKey.trim()!=="")try{this.fishVoice=new Iu(this.config.fishAudioApiKey,this.config.fishAudioVoiceIds),console.log("[Ed] ✅ Fish Audio voice initialized",{hasApiKey:!!this.config.fishAudioApiKey,voiceIds:this.config.fishAudioVoiceIds})}catch(r){console.error("[Ed] ❌ Fish Audio initialization failed:",r)}else console.debug("[Ed] Fish Audio provider selected but API key not set. Falling back to browser TTS.");else console.log(i&&n==="browser"?"[Ed] Using browser TTS":"[Ed] TTS disabled in configuration");this.config.features.voice&&(this.voice=new wu(this.currentLanguage.voiceLang),this.voice.onResult(r=>this.handleUserInput(r)),this.voice.onListeningChange(r=>{var o;this.isListening=r,(o=this.dock)==null||o.setListening(r)}))}render(){this.renderTriggerButton()}renderTriggerButton(){const e=document.createElement("div");e.id="launcher-group",e.innerHTML=`
      <div class="launcher-label">Ask Ed</div>
      <div id="launcher-btn" title="Open Assistant">
        <div id="launcher-logo-container"></div>
      </div>
    `,e.querySelector("#launcher-btn").addEventListener("click",()=>this.toggle()),this.container.appendChild(e),this.createParticle3DLogo()}createParticle3DLogo(){const e=document.getElementById("launcher-logo-container");if(!e)return;const t=document.createElement("div");t.id="launcher-particle3d-container",t.style.cssText=`
      width: 60px;
      height: 60px;
      position: relative;
      display: block;
    `,e.appendChild(t);try{this.launcherParticle3D=new gs(t),this.launcherParticle3D.start(),this.launcherParticle3D.setActive(!1),console.log("[Ed] Launcher Particle3D initialized")}catch(i){console.error("[Ed] Failed to initialize launcher Particle3D:",i),t.innerHTML='<div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>'}}renderWidget(){if(this.widget)return;this.widget=document.createElement("div"),this.widget.id="app-panel",this.widget.className=`theme-${this.currentTheme}`,this.widget.innerHTML=`
      <div class="status-pill" id="status-pill">Ready</div>
      
      <!-- Chat Container -->
      <div class="chat-container">
        <div id="chat-messages" class="chat-scroll scrollbar-hide"></div>
        <div class="input-bar">
          <input type="text" id="chat-input" placeholder="Ask about admissions..." class="bg-transparent border-none text-white text-sm placeholder-slate-400 flex-grow outline-none" autocomplete="off">
          <button id="send-btn" class="text-teal-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Dock -->
      <div id="app-dock"></div>
      
      <!-- 3D PARTICLE AVATAR CONTAINER (Inside app-panel, matching Gemini) -->
      <div id="canvas-container"></div>
    `,this.container.appendChild(this.widget),this.isOpen&&document.body.classList.add("widget-active");const e=this.widget.querySelector("#canvas-container");e?(console.log("[Ed] Initializing particle system in container:",e),e.style.display="block",e.style.visibility="visible",e.style.opacity="1",e.style.width="300px",e.style.height="300px",e.style.position="absolute",e.style.bottom="60px",e.style.right="0",e.style.zIndex="10",this.particle3D=new gs(e)):console.error("[Ed] Canvas container not found!");const t=this.widget.querySelector("#chat-messages");this.chat=new Au(t,a=>{a.includes("🇬🇧")||a.includes("English")?this.setLanguage("en-GB"):a.includes("🇵🇱")||a.includes("Polski")?this.setLanguage("pl"):a.includes("🇷🇴")||a.includes("Română")?this.setLanguage("ro"):a.includes("🇪🇸")||a.includes("Español")?this.setLanguage("es"):this.handleUserInput(a)}),this.widget.querySelector("#status-pill")&&(this.statusPill=new Ru(this.widget));const n=this.widget.querySelector("#app-dock");this.dock=new bu(n,{onAction:a=>this.handleDockAction(a),onToolAction:a=>this.handleToolAction(a),onSettingChange:a=>this.setTheme(a),onLanguageChange:a=>this.setLanguage(a),onPersonaChange:a=>this.setPersona(a)});const r=this.widget.querySelector("#chat-input"),o=this.widget.querySelector("#send-btn");r==null||r.addEventListener("keydown",a=>{a.key==="Enter"&&r.value.trim()&&(this.handleUserInput(r.value.trim()),r.value="")}),o==null||o.addEventListener("click",()=>{r.value.trim()&&(this.handleUserInput(r.value.trim()),r.value="")}),this.showGreeting()}bindEvents(){document.addEventListener("keydown",e=>{e.key==="Escape"&&this.isOpen&&this.close()})}showGreeting(){var a;$n(this.currentPersona);const e=!localStorage.getItem("ed-visited");e&&localStorage.setItem("ed-visited","true");const i=(((a=this.formFiller)==null?void 0:a.detectForms())||[]).length>0,n=window.location.pathname.toLowerCase().includes("admission")||window.location.pathname.toLowerCase().includes("apply")||window.location.pathname.toLowerCase().includes("enrol");let r;this.fishVoice?r=Nu(this.currentPersona,{hasForm:i,isAdmissionsPage:n,isFirstVisit:e}):(r=this.getLocalizedGreeting(),i&&(r+=" I can see you're on an admissions page. Would you like help filling out the form?"));const o=this.cleanTextForDisplay(r);this.addMessage({id:crypto.randomUUID(),role:"assistant",content:o,timestamp:new Date,language:this.currentLanguage.code}),i&&(setTimeout(()=>{var l;return(l=this.particle3D)==null?void 0:l.morphTo("pencil")},1e3),setTimeout(()=>{var l;return(l=this.particle3D)==null?void 0:l.morphTo("sphere")},3e3)),this.config.features.voice&&this.stopAllSpeechAsync().then(()=>{if(this.fishVoice){const l=this.cleanTextForDisplay(r);console.log("[Ed] Using Fish Audio for greeting"),this.fishVoice.speakAndPlay(l,this.currentPersona,this.currentLanguage.code).then(()=>{console.log("[Ed] Fish Audio greeting playback completed")}).catch(c=>{console.error("[Ed] Fish Audio error:",c),console.error("[Ed] Error details:",c.message),console.warn("[Ed] Skipping browser TTS fallback to prevent dual audio")})}else this.config.disableBrowserTTS?console.warn("[Ed] Fish Audio not available and browser TTS disabled - no voice output"):(console.warn("[Ed] Fish Audio not available, using browser TTS for greeting (emergency fallback)"),this.speak(o))})}getLocalizedGreeting(){const e=$n(this.currentPersona);return this.currentLanguage.code==="en-GB"?e.greeting:this.currentLanguage.greeting}async handleUserInput(e){var c,u,h,f,m,g,_,p,d,E,x,A,P,R,w,q,M,T,k,$,ie,C,O,z,W,V,H,Y,Z,le,G,X,ae;const t=this.detectLanguage(e);if(t&&t.code!==this.currentLanguage.code&&this.setLanguage(t.code),(c=this.formFiller)!=null&&c.getCurrentField()&&this.formFiller.fillFieldByVoice(e)){this.addMessage({id:crypto.randomUUID(),role:"user",content:e,timestamp:new Date,language:this.currentLanguage.code});const ue=this.formFiller.nextField();if(ue){const xe=`Got it. Next is ${ue.label}. What should I put?`;this.addMessage({id:crypto.randomUUID(),role:"assistant",content:xe,timestamp:new Date,language:this.currentLanguage.code}),this.config.features.voice&&this.stopAllSpeechAsync().then(()=>{if(this.fishVoice){const we=this.cleanTextForDisplay(xe);this.fishVoice.speakAndPlay(we,this.currentPersona,this.currentLanguage.code).catch(ve=>{console.error("[Ed] Fish Audio error in form fill:",ve),console.warn("[Ed] Skipping browser TTS fallback to prevent dual audio")})}else this.config.disableBrowserTTS||this.speak(xe)});return}else{const xe="That's the last field! Would you like me to submit the form now?";this.addMessage({id:crypto.randomUUID(),role:"assistant",content:xe,timestamp:new Date,language:this.currentLanguage.code}),this.config.features.voice&&this.stopAllSpeechAsync().then(()=>{if(this.fishVoice){const we=this.cleanTextForDisplay(xe);this.fishVoice.speakAndPlay(we,this.currentPersona,this.currentLanguage.code).catch(ve=>{console.error("[Ed] Fish Audio error in form fill:",ve),console.warn("[Ed] Skipping browser TTS fallback to prevent dual audio")})}else this.config.disableBrowserTTS||this.speak(xe)}),(u=this.particle3D)==null||u.morphTo("checkmark");return}}const i={id:crypto.randomUUID(),role:"user",content:e,timestamp:new Date,language:this.currentLanguage.code};this.currentLanguage.code!=="en-GB"&&(i.translation=`[Translated to English]: ${e}`),this.addMessage(i),(h=this.proactive)==null||h.start();const n=e.toLowerCase();n.includes("excited")||n.includes("wow")||n.includes("yay")||n.includes("fantastic")||n.includes("amazing")||n.includes("brilliant")||n.includes("can't wait")||n.includes("looking forward")||n.includes("thrilled")||n.includes("delighted")||n.includes("celebration")||n.includes("celebrate")||n.includes("party")||n.includes("special")||n.includes("great news")||n.includes("wonderful news")?(f=this.particle3D)==null||f.morphTo("excited"):n.includes("fireworks")||n.includes("🎆")?(m=this.particle3D)==null||m.morphTo("fireworks"):n.includes("confetti")||n.includes("🎊")?(g=this.particle3D)==null||g.morphTo("confetti"):n.includes("trophy")||n.includes("achievement")||n.includes("award")||n.includes("won")||n.includes("victory")||n.includes("champion")||n.includes("first place")||n.includes("top")||n.includes("best")||n.includes("excellent work")||n.includes("well done")||n.includes("congratulations")||n.includes("accomplishment")||n.includes("milestone")||n.includes("record")||n.includes("result")?(_=this.particle3D)==null||_.morphTo("trophy"):n.includes("information")||n.includes("info")||n.includes("details")||n.includes("tell me")||n.includes("explain")||n.includes("about")||n.includes("read")||n.includes("learn")||n.includes("know")||n.includes("understand")||n.includes("what is")||n.includes("what are")||n.includes("describe")||n.includes("definition")||n.includes("meaning")||n.includes("guide")||n.includes("manual")||n.includes("handbook")||n.includes("policy")||n.includes("procedure")||n.includes("rule")||n.includes("regulation")?(p=this.particle3D)==null||p.morphTo("book"):n.includes("time")||n.includes("when")||n.includes("schedule")||n.includes("timetable")||n.includes("hours")||n.includes("opening")||n.includes("closing")||n.includes("deadline")||n.includes("date")||n.includes("appointment")||n.includes("meeting")||n.includes("event")||n.includes("term dates")||n.includes("holiday")||n.includes("break")||n.includes("half term")||n.includes("start")||n.includes("finish")||n.includes("end")||n.includes("duration")||n.includes("how long")||n.includes("what time")?(d=this.particle3D)==null||d.morphTo("clock"):n.includes("important")||n.includes("urgent")||n.includes("critical")||n.includes("required")||n.includes("must")||n.includes("need to")||n.includes("essential")||n.includes("mandatory")||n.includes("notice")||n.includes("alert")||n.includes("attention")||n.includes("warning")||n.includes("caution")||n.includes("deadline approaching")||n.includes("late")||n.includes("overdue")||n.includes("missing")||n.includes("required field")?(E=this.particle3D)==null||E.morphTo("warning"):n.includes("ask")||n.includes("question")||n.includes("query")||n.includes("unsure")||n.includes("unclear")||n.includes("confused")||n.includes("don't understand")||n.includes("what do you mean")||n.includes("can you clarify")||n.includes("explain again")||n.includes("repeat")||n.includes("sorry")||n.includes("pardon")||n.includes("excuse me")||n.includes("what")||n.includes("how")||n.includes("why")||n.includes("where")||n.includes("who")||n.includes("which")?(x=this.particle3D)==null||x.morphTo("question"):n.includes("calendar")||n.includes("event")||n.includes("date")||n.includes("schedule")||n.includes("term")||n.includes("holiday")||n.includes("break")||n.includes("half term")||n.includes("inset day")||n.includes("open day")||n.includes("tour")||n.includes("visit")||n.includes("meeting")||n.includes("appointment")||n.includes("deadline")||n.includes("when is")||n.includes("what date")||n.includes("school calendar")||n.includes("academic year")||n.includes("term dates")?(A=this.particle3D)==null||A.morphTo("calendar"):n.includes("search")||n.includes("find")||n.includes("look for")||n.includes("locate")||n.includes("where is")||n.includes("where can i find")||n.includes("show me")||n.includes("find me")||n.includes("look up")||n.includes("search for")||n.includes("discover")||n.includes("browse")?(P=this.particle3D)==null||P.morphTo("search"):n.includes("phone")||n.includes("call")||n.includes("telephone")||n.includes("contact")||n.includes("number")||n.includes("ring")||n.includes("speak to")||n.includes("talk to")||n.includes("reach")||n.includes("get in touch")||n.includes("contact details")||n.includes("phone number")||n.includes("mobile")||n.includes("landline")||n.includes("call me")||n.includes("ring me")?(R=this.particle3D)==null||R.morphTo("phone"):n.includes("address")||n.includes("location")||n.includes("where")||n.includes("find")||n.includes("directions")||n.includes("map")||n.includes("postcode")||n.includes("post code")||n.includes("street")||n.includes("road")||n.includes("building")||n.includes("site")||n.includes("campus")||n.includes("how to get")||n.includes("directions to")||n.includes("where is the school")||n.includes("address of")?(w=this.particle3D)==null||w.morphTo("location"):n.includes("form")||n.includes("fill")||n.includes("write")||n.includes("type")||n.includes("enter")||n.includes("input")||n.includes("complete")||n.includes("application")||n.includes("submit")||n.includes("document")||n.includes("sign")||n.includes("paperwork")?(q=this.particle3D)==null||q.morphTo("pencil"):n.includes("help")||n.includes("how")||n.includes("what")||n.includes("why")||n.includes("explain")||n.includes("understand")||n.includes("idea")||n.includes("suggest")||n.includes("advice")||n.includes("guidance")||n.includes("tip")||n.includes("hint")?(M=this.particle3D)==null||M.morphTo("lightbulb"):n.includes("thank")||n.includes("thanks")||n.includes("appreciate")||n.includes("grateful")||n.includes("love")||n.includes("lovely")||n.includes("wonderful")||n.includes("kind")||n.includes("caring")||n.includes("sweet")?(T=this.particle3D)==null||T.morphTo("heart"):n.includes("yes")||n.includes("please")||n.includes("sure")||n.includes("okay")||n.includes("ok")||n.includes("agree")||n.includes("confirm")||n.includes("accept")||n.includes("correct")||n.includes("right")||n.includes("exactly")?(k=this.particle3D)==null||k.morphTo("thumbsup"):n.includes("great")||n.includes("perfect")||n.includes("excellent")||n.includes("amazing")||n.includes("fantastic")||n.includes("brilliant")||n.includes("outstanding")||n.includes("superb")||n.includes("wonderful")||n.includes("awesome")?($=this.particle3D)==null||$.morphTo("star"):n.includes("👍")||n.includes("✓")||n.includes("ok")||n.includes("done")||n.includes("complete")||n.includes("finished")||n.includes("ready")||n.includes("confirmed")||n.includes("submitted")||n.includes("success")||n.includes("accomplished")||n.includes("achieved")?(ie=this.particle3D)==null||ie.morphTo("checkmark"):n.includes("happy")||n.includes("glad")||n.includes("pleased")||n.includes("smile")||n.includes("joy")||n.includes("cheerful")||n.includes("delighted")||n.includes("excited")||n.includes("thrilled")||n.includes("wonderful")||n.includes("😊")||n.includes(":)")?(C=this.particle3D)==null||C.morphTo("smiley"):n.includes("let me think")||n.includes("considering")||n.includes("hmm")||n.includes("um")||n.includes("well")||n.includes("actually")||n.includes("perhaps")||n.includes("maybe")||n.includes("might")||n.includes("could")||n.includes("possibly")||n.includes("not sure")||n.includes("let me see")||n.includes("give me a moment")||n.includes("thinking about")||n.includes("considering")?(O=this.particle3D)==null||O.morphTo("thinking"):n.includes("confused")||n.includes("don't understand")||n.includes("unclear")||n.includes("lost")||n.includes("not sure")||n.includes("puzzled")||n.includes("bewildered")||n.includes("what")||n.includes("huh")||n.includes("sorry")||n.includes("pardon")||n.includes("excuse me")||n.includes("repeat")||n.includes("say again")||n.includes("what do you mean")||n.includes("i don't get it")?(z=this.particle3D)==null||z.morphTo("confused"):n.includes("error")||n.includes("problem")||n.includes("issue")||n.includes("broken")||n.includes("not working")||n.includes("failed")||n.includes("mistake")||n.includes("wrong")||n.includes("incorrect")||n.includes("sorry there was an error")||n.includes("something went wrong")||n.includes("unable to")||n.includes("can't")||n.includes("cannot")?(W=this.particle3D)==null||W.morphTo("error"):n.includes("message")||n.includes("chat")||n.includes("talk")||n.includes("speak")||n.includes("conversation")||n.includes("discuss")||n.includes("tell me")||n.includes("say")||n.includes("mention")||n.includes("communicate")||n.includes("dialogue")||n.includes("speak to")||n.includes("talk to")||n.includes("have a chat")?(V=this.particle3D)==null||V.morphTo("speech"):n.includes("document")||n.includes("form")||n.includes("file")||n.includes("pdf")||n.includes("download")||n.includes("print")||n.includes("application")||n.includes("letter")||n.includes("report")||n.includes("certificate")||n.includes("transcript")||n.includes("record")||n.includes("paperwork")||n.includes("document needed")||n.includes("required document")?(H=this.particle3D)==null||H.morphTo("document"):n.includes("calculate")||n.includes("math")||n.includes("maths")||n.includes("number")||n.includes("count")||n.includes("add")||n.includes("subtract")||n.includes("multiply")||n.includes("divide")||n.includes("total")||n.includes("sum")||n.includes("cost")||n.includes("price")||n.includes("fee")||n.includes("payment")||n.includes("amount")||n.includes("calculate")||n.includes("work out")||n.includes("figure out")?(Y=this.particle3D)==null||Y.morphTo("calculator"):n.includes("notification")||n.includes("alert")||n.includes("reminder")||n.includes("notify")||n.includes("inform")||n.includes("tell me when")||n.includes("let me know")||n.includes("alert me")||n.includes("remind me")||n.includes("notification")||n.includes("announcement")||n.includes("update")||n.includes("news")?(Z=this.particle3D)==null||Z.morphTo("bell"):n.includes("graduation")||n.includes("graduate")||n.includes("leaving")||n.includes("year 6")||n.includes("year 11")||n.includes("year 13")||n.includes("a-levels")||n.includes("gcse")||n.includes("results")||n.includes("exam results")||n.includes("certificate")||n.includes("diploma")||n.includes("qualification")||n.includes("finish school")||n.includes("move on")?(le=this.particle3D)==null||le.morphTo("graduation"):(G=this.particle3D)==null||G.morphTo("lightbulb");const r=((X=this.chat)==null?void 0:X.showTyping())||"",o=await this.getAIResponse(e);(ae=this.chat)==null||ae.hideTyping(r),setTimeout(()=>{var de;return(de=this.particle3D)==null?void 0:de.morphTo("sphere")},500);const a={id:crypto.randomUUID(),role:"assistant",content:o,timestamp:new Date,language:this.currentLanguage.code};this.currentLanguage.code!=="en-GB"?a.quickReplies=[`${this.currentLanguage.nativeName} ${this.currentLanguage.flag}`,"English 🇬🇧"]:a.quickReplies=["Polski PL 🇵🇱","Română RO 🇷🇴","Español ES 🇪🇸"],this.addMessage(a);const l=o.toLowerCase();l.includes("great!")||l.includes("perfect!")?setTimeout(()=>{var de;(de=this.particle3D)==null||de.morphTo("thumbsup"),setTimeout(()=>{var ue;return(ue=this.particle3D)==null?void 0:ue.morphTo("sphere")},2e3)},1e3):(l.includes("happy to help")||l.includes("glad"))&&setTimeout(()=>{var de;(de=this.particle3D)==null||de.morphTo("smiley"),setTimeout(()=>{var ue;return(ue=this.particle3D)==null?void 0:ue.morphTo("sphere")},2e3)},1e3),this.config.features.voice&&this.stopAllSpeechAsync().then(()=>{if(this.fishVoice){const de=this.cleanTextForDisplay(o);console.log("[Ed] Using Fish Audio for response"),this.fishVoice.speakAndPlay(de,this.currentPersona,this.currentLanguage.code).then(()=>{console.log("[Ed] Fish Audio playback completed")}).catch(ue=>{console.error("[Ed] Fish Audio error:",ue),console.error("[Ed] Error details:",ue.message),console.warn("[Ed] Skipping browser TTS fallback to prevent dual audio")})}else this.config.disableBrowserTTS?console.warn("[Ed] Fish Audio not available and browser TTS disabled - no voice output"):(console.warn("[Ed] Fish Audio not available, using browser TTS (emergency fallback)"),this.speak(o))})}async getAIResponse(e){var n;const t=e.toLowerCase();if(t.includes("form")||t.includes("fill")){const r=(n=this.formFiller)==null?void 0:n.detectForms();if(r&&r.length>0&&this.formFiller){const o=this.formFiller.startFilling(r[0]);if(o)return`Great! I've found a form. I'll help you fill it out. The first field is ${o.label}. What should I type?`}return"I don't see any forms on this page. Are you looking for the admissions form?"}if(t.includes("admission")||t.includes("enrol")||t.includes("apply"))return"I can help with admissions! This school typically has deadlines in January for Reception class. You can fill out the enquiry form on this page, or I can guide you through the local authority application process. What would you like to know?";if(t.includes("open day")||t.includes("visit")||t.includes("tour"))return"According to the page, the next virtual tour is on Saturday, 12th December at 10:00 AM. Would you like me to help you register for it?";if(t.includes("contact")||t.includes("phone")||t.includes("email"))return`You can contact the school at:
📧 admin@greenwoodhigh.edu
📞 +44 (0) 20 7946 0123

Would you like me to help you draft an email?`;if(this.ai)try{const r=$n(this.currentPersona);let o;try{const a=Bu.scan();o=`Current page: ${a.title}
URL: ${window.location.href}
Page type: ${a.pageType}
Has forms: ${a.forms>0?"Yes":"No"}
Key headings: ${a.headings.slice(0,5).join(", ")}
Summary: ${a.mainContent.substring(0,300)}`}catch(a){console.debug("[Ed] Could not extract page context:",a),o=`Current page: ${document.title}
URL: ${window.location.href}`}return await this.ai.chat(e,{persona:r,language:this.currentLanguage,schoolId:this.config.schoolId,toolContext:this.toolContext,pageContext:o})}catch(r){console.error("[Ed] AI error:",r)}const i=["I'm here to help! Could you tell me more about what you're looking for?","That's a great question. I can help with admissions, forms, open days, and general school information. What would you like to know?","I'd be happy to assist! You can ask me about admissions, filling out forms, term dates, or contacting the school."];return i[Math.floor(Math.random()*i.length)]}handleProactiveNudge(e){var t;if(!this.isOpen){console.log("[Ed] Proactive nudge suppressed (closed):",e);return}this.addMessage({id:crypto.randomUUID(),role:"assistant",content:e,timestamp:new Date,language:this.currentLanguage.code}),this.config.features.voice&&this.stopAllSpeechAsync().then(()=>{if(this.fishVoice){const i=this.cleanTextForDisplay(e);this.fishVoice.speakAndPlay(i,this.currentPersona,this.currentLanguage.code).catch(n=>{console.error("[Ed] Fish Audio error in proactive nudge:",n),console.warn("[Ed] Skipping browser TTS fallback to prevent dual audio")})}else this.config.disableBrowserTTS||this.speak(e)}),(t=this.particle3D)==null||t.morphTo("lightbulb"),setTimeout(()=>{var i;return(i=this.particle3D)==null?void 0:i.morphTo("sphere")},2e3)}cleanTextForDisplay(e){return e.replace(/\([^)]+\)/g,"").replace(/[\u{1F300}-\u{1F9FF}]/gu,"").replace(/[\u{2600}-\u{26FF}]/gu,"").replace(/[\u{2700}-\u{27BF}]/gu,"").replace(/\b[A-Z]{2}\s*🇵🇱|🇷🇴|🇬🇧|🇺🇸\b/gi,"").replace(/Polski\s+PL|Română\s+RO|English\s+EN/gi,"").replace(/\s+/g," ").trim()}addMessage(e){var t;e.content&&(e.content=this.cleanTextForDisplay(e.content)),this.messages.push(e),(t=this.chat)==null||t.addMessage(e)}speak(e){var r;if(!this.config.features.voice)return;if(this.config.disableBrowserTTS){console.warn("[Ed] ⚠️ Browser TTS disabled - skipping fallback");return}if(this.fishVoice){console.warn("[Ed] ⚠️ Browser TTS called but Fish Audio is available - skipping to prevent dual audio");return}this.stopAllSpeech();const t=((r=this.fishVoice)==null?void 0:r.cleanTextForTTS(e,!1))||e.replace(/\([^)]+\)/g,"").replace(/[\u{1F300}-\u{1F9FF}]/gu,"").replace(/[\u{2600}-\u{26FF}]/gu,"").replace(/[\u{2700}-\u{27BF}]/gu,"").replace(/\b[A-Z]{2}\s*🇵🇱|🇷🇴|🇬🇧|🇺🇸\b/gi,"").replace(/Polski\s+PL|Română\s+RO|English\s+EN/gi,"").replace(/\s+/g," ").trim();if(!t)return;const i=$n(this.currentPersona),n=new SpeechSynthesisUtterance(t);n.lang=this.currentLanguage.voiceLang,n.pitch=i.voicePitch,n.rate=i.voiceRate,speechSynthesis.speak(n)}stopAllSpeech(){var e;speechSynthesis.speaking&&speechSynthesis.cancel(),(e=this.fishVoice)==null||e.stop().catch(()=>{})}async stopAllSpeechAsync(){speechSynthesis.speaking&&(speechSynthesis.cancel(),await new Promise(e=>setTimeout(e,50))),this.fishVoice&&(await this.fishVoice.stop(),await new Promise(e=>setTimeout(e,50)))}handleDockAction(e){switch(e){case"microphone":this.toggleListening();break;case"keyboard":this.toggleKeyboard();break;case"language":this.showLanguageSelector();break;case"persona":this.cyclePersona();break;case"settings":this.showSettings();break;case"magic-tools":this.showMagicTools();break;case"close":this.close();break}}toggleListening(){var e,t,i,n,r,o,a,l;if(!this.voice){const c=(e=this.widget)==null?void 0:e.querySelector(".chat-container"),u=c==null?void 0:c.classList.contains("chat-hidden");u&&(c==null||c.classList.remove("chat-hidden")),this.addMessage({id:crypto.randomUUID(),role:"system",content:"🎤 Voice input not available. Please use text input instead.",timestamp:new Date}),u&&setTimeout(()=>c==null?void 0:c.classList.add("chat-hidden"),3e3);return}if(this.isListening)this.voice.stop(),this.isListening=!1,(t=this.dock)==null||t.setListening(!1),(i=this.statusPill)==null||i.setState("ready"),(n=this.particle3D)==null||n.morphTo("sphere");else{const c=(r=this.widget)==null?void 0:r.querySelector(".chat-container");(c==null?void 0:c.classList.contains("chat-hidden"))&&(c==null||c.classList.remove("chat-hidden"),this.showKeyboard=!1),navigator.mediaDevices&&navigator.mediaDevices.getUserMedia?navigator.mediaDevices.getUserMedia({audio:!0}).then(()=>{var h,f,m,g;(h=this.voice)==null||h.start(),this.isListening=!0,(f=this.dock)==null||f.setListening(!0),(m=this.statusPill)==null||m.setState("listening"),(g=this.particle3D)==null||g.morphTo("lightbulb")}).catch(h=>{console.error("[Ed] Microphone permission denied:",h),this.addMessage({id:crypto.randomUUID(),role:"system",content:"🎤 Microphone access denied. Please enable microphone permissions in your browser settings.",timestamp:new Date})}):(this.voice.start(),this.isListening=!0,(o=this.dock)==null||o.setListening(!0),(a=this.statusPill)==null||a.setState("listening"),(l=this.particle3D)==null||l.morphTo("lightbulb"))}}toggleKeyboard(){var t,i,n,r,o;this.showKeyboard=!this.showKeyboard;const e=(t=this.widget)==null?void 0:t.querySelector(".chat-container");if(e)if(this.showKeyboard){e.classList.add("chat-hidden");const a=(i=this.widget)==null?void 0:i.querySelector("#canvas-container");a&&(a.style.opacity="1",a.style.visibility="visible",a.style.zIndex="20"),(n=this.statusPill)==null||n.setState("ready"),(r=this.statusPill)==null||r.show()}else{e.classList.remove("chat-hidden");const a=(o=this.widget)==null?void 0:o.querySelector("#canvas-container");a&&(a.style.zIndex="10")}console.log("[Ed] Chat toggled:",this.showKeyboard?"hidden (avatar visible)":"visible")}detectLanguage(e){const t=e.toLowerCase().trim(),i=[{code:"es",patterns:[/^hola/i,/^buenos días/i,/^buenas tardes/i,/^buenas noches/i,/^adiós/i]},{code:"fr",patterns:[/^bonjour/i,/^bonsoir/i,/^salut/i,/^au revoir/i]},{code:"pl",patterns:[/^cześć/i,/^dzień dobry/i,/^dobry wieczór/i,/^do widzenia/i]},{code:"ro",patterns:[/^bună/i,/^salut/i,/^la revedere/i]},{code:"pt",patterns:[/^olá/i,/^bom dia/i,/^boa tarde/i,/^tchau/i]},{code:"zh",patterns:[/^你好/i,/^再见/i]},{code:"ar",patterns:[/^مرحبا/i,/^السلام عليكم/i]},{code:"ur",patterns:[/^ہیلو/i,/^السلام علیکم/i]},{code:"bn",patterns:[/^হ্যালো/i,/^নমস্কার/i]},{code:"so",patterns:[/^salaan/i,/^nabad/i]},{code:"pa",patterns:[/^ਸਤ ਸ੍ਰੀ ਅਕਾਲ/i,/^ਨਮਸਕਾਰ/i]}];for(const n of i)if(n.patterns.some(r=>r.test(t)))return _s(n.code);return null}showLanguageSelector(){const t=(Yn.findIndex(i=>i.code===this.currentLanguage.code)+1)%Yn.length;this.setLanguage(Yn[t].code)}setLanguage(e){var i,n;this.currentLanguage=_s(e),(i=this.voice)==null||i.setLanguage(this.currentLanguage.voiceLang),(n=this.particle3D)==null||n.morphToFlag(this.currentLanguage.flagColors,this.currentLanguage.code);const t=`${this.currentLanguage.nativeName} ${this.currentLanguage.flag}`;this.addMessage({id:crypto.randomUUID(),role:"system",content:t,timestamp:new Date}),this.config.features.voice&&this.stopAllSpeechAsync().then(()=>{if(this.fishVoice){const r=this.cleanTextForDisplay(this.currentLanguage.greeting);this.fishVoice.speakAndPlay(r,this.currentPersona,this.currentLanguage.code).catch(o=>{console.error("[Ed] Fish Audio error in setLanguage:",o),console.warn("[Ed] Skipping browser TTS fallback to prevent dual audio")})}else this.config.disableBrowserTTS||this.speak(this.currentLanguage.greeting)}),setTimeout(()=>{var r;(r=this.particle3D)==null||r.morphTo("sphere")},2e3)}cyclePersona(){const e=["ed","edwina"],t=["santa","elf","headteacher"],i=[...e,...t],r=(i.indexOf(this.currentPersona)+1)%i.length;this.setPersona(i[r])}setPersona(e){var i;this.currentPersona=e;const t=$n(e);(i=this.particle3D)==null||i.setColor(t.color),this.addMessage({id:crypto.randomUUID(),role:"system",content:`${t.icon} ${t.name} is here to help!`,timestamp:new Date})}showSettings(){const e=["standard","warm","cool","contrast"],i=(e.indexOf(this.currentTheme)+1)%e.length;this.setTheme(e[i])}setTheme(e){var t,i;this.currentTheme=e,(t=this.widget)==null||t.classList.remove("theme-standard","theme-warm","theme-cool","theme-contrast"),(i=this.widget)==null||i.classList.add(`theme-${e}`)}setToolContext(e){var t,i;if(this.toolContext=e,e){const r={Finance:"calculator",Teaching:"book",SEND:"heart",Compliance:"document",HR:"phone",Data:"search",Admin:"calendar",Estates:"location"}[e.category]||"lightbulb";(t=this.particle3D)==null||t.morphTo(r),this.addMessage({id:crypto.randomUUID(),role:"assistant",content:`I see you're using ${e.name}. I can help you with ${e.expertise.slice(0,3).join(", ")}. What would you like to know?`,timestamp:new Date}),console.log("[Ed] Tool context set:",e.name,"→",r)}else(i=this.particle3D)==null||i.morphTo("sphere"),console.log("[Ed] Tool context cleared")}getToolContext(){return this.toolContext}showMagicTools(){var e;(e=this.particle3D)==null||e.morphTo("pencil"),this.addMessage({id:crypto.randomUUID(),role:"assistant",content:"✨ Magic Tools activated! I can help you fill forms, summarize pages, or create quizzes. What would you like?",timestamp:new Date})}handleToolAction(e){var t,i,n;switch(e){case"form-fill":(t=this.particle3D)==null||t.morphTo("pencil"),this.addMessage({id:crypto.randomUUID(),role:"assistant",content:"📝 Form Fill mode activated! I can help you fill out forms on this page. Just tell me what information you'd like to enter.",timestamp:new Date});break;case"page-scan":(i=this.particle3D)==null||i.morphTo("lightbulb"),this.addMessage({id:crypto.randomUUID(),role:"assistant",content:"🔍 Page Scan activated! I'm analyzing this page to help you understand its content.",timestamp:new Date});break;case"calendar":(n=this.particle3D)==null||n.morphTo("star"),this.addMessage({id:crypto.randomUUID(),role:"assistant",content:"📅 Calendar view activated! I can help you find important dates and events.",timestamp:new Date});break;case"emoji-tester":if(!this.emojiTester){const r=document.createElement("div");document.body.appendChild(r),this.emojiTester=new Cu(r)}this.emojiTester.toggle();break}}checkForForms(){var t;const e=(t=this.formFiller)==null?void 0:t.detectForms();e&&e.length>0&&console.log("[Ed] Found forms on page:",e.length)}toggle(){this.isOpen?this.close():this.open()}open(){var e;this.isOpen||(this.isOpen=!0,this.widget||this.renderWidget(),document.body.classList.add("widget-active"),document.body.classList.add("view-chat"),this.particle3D&&(this.particle3D.start(),this.particle3D.setActive(!0)),(e=this.statusPill)==null||e.setState("ready"),setTimeout(()=>{this.showGreeting()},300))}close(){var e,t;this.isOpen&&(this.isOpen=!1,document.body.classList.remove("widget-active"),document.body.classList.remove("view-chat"),this.isListening&&((e=this.voice)==null||e.stop()),this.particle3D&&this.particle3D.setActive(!1),(t=this.statusPill)==null||t.setState("ready"))}destroy(){var e,t,i;this.close(),(e=this.particle3D)==null||e.destroy(),(t=this.launcherParticle3D)==null||t.destroy(),(i=this.voice)==null||i.destroy(),this.container.remove()}}const jn={init(s={}){if(window.__ED_INSTANCE__)return console.warn("[Ed] Widget already initialized"),window.__ED_INSTANCE__;const e=new Gr(s);return window.__ED_INSTANCE__=e,e},getInstance(){return window.__ED_INSTANCE__},destroy(){window.__ED_INSTANCE__&&(window.__ED_INSTANCE__.destroy(),delete window.__ED_INSTANCE__)}};function Gu(){if(window.__ED_INSTANCE__)return;const s=document.currentScript,e={};if(s){const t=s.getAttribute("data-school-id"),i=s.getAttribute("data-theme"),n=s.getAttribute("data-position"),r=s.getAttribute("data-api-key"),o=s.getAttribute("data-language"),a=s.getAttribute("data-fish-audio-api-key"),l=s.getAttribute("data-fish-audio-voice-id-ed"),c=s.getAttribute("data-fish-audio-voice-id-edwina"),u=s.getAttribute("data-fish-audio-voice-id-santa"),h=s.getAttribute("data-fish-audio-voice-id-elf"),f=s.getAttribute("data-fish-audio-voice-id-headteacher");t&&(e.schoolId=t),i&&(e.theme=i),n&&(e.position=n),r&&(e.apiKey=r),o&&(e.language=o),a&&(e.fishAudioApiKey=a),(l||c||u||h||f)&&(e.fishAudioVoiceIds={},l&&(e.fishAudioVoiceIds.ed=l),c&&(e.fishAudioVoiceIds.edwina=c),u&&(e.fishAudioVoiceIds.santa=u),h&&(e.fishAudioVoiceIds.elf=h),f&&(e.fishAudioVoiceIds.headteacher=f)),s&&(t||i||n)&&(document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>jn.init(e)):jn.init(e))}}return typeof window<"u"?(window.EdWidget=jn,console.log("[Ed Widget] ✅ EdWidget assigned to window.EdWidget")):typeof globalThis<"u"&&(globalThis.EdWidget=jn,console.log("[Ed Widget] ✅ EdWidget assigned to globalThis.EdWidget")),Gu(),Ot.Ed=Gr,Ot.EdWidget=jn,Object.defineProperty(Ot,Symbol.toStringTag,{value:"Module"}),Ot}({});
