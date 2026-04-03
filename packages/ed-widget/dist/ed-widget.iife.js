var __EdWidgetExports=function(Ut){"use strict";var Hd=Object.defineProperty;var Vd=(Ut,Ct,In)=>Ct in Ut?Hd(Ut,Ct,{enumerable:!0,configurable:!0,writable:!0,value:In}):Ut[Ct]=In;var W=(Ut,Ct,In)=>Vd(Ut,typeof Ct!="symbol"?Ct+"":Ct,In);/**
 * @license
 * Copyright 2010-2023 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Ct="160",Tt="",lt="srgb",kt="srgb-linear",Ii="display-p3",Kn="display-p3-linear",jn="linear",Ke="srgb",Zn="rec709",Jn="p3",Ss="300 es";class dn{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;const n=this._listeners;return n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;const s=this._listeners[e];if(s!==void 0){const i=s.indexOf(t);i!==-1&&s.splice(i,1)}}dispatchEvent(e){if(this._listeners===void 0)return;const n=this._listeners[e.type];if(n!==void 0){e.target=this;const s=n.slice(0);for(let i=0,o=s.length;i<o;i++)s[i].call(this,e);e.target=null}}}const dt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Ui=Math.PI/180,Fi=180/Math.PI;function Un(){const r=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(dt[r&255]+dt[r>>8&255]+dt[r>>16&255]+dt[r>>24&255]+"-"+dt[e&255]+dt[e>>8&255]+"-"+dt[e>>16&15|64]+dt[e>>24&255]+"-"+dt[t&63|128]+dt[t>>8&255]+"-"+dt[t>>16&255]+dt[t>>24&255]+dt[n&255]+dt[n>>8&255]+dt[n>>16&255]+dt[n>>24&255]).toLowerCase()}function _t(r,e,t){return Math.max(e,Math.min(t,r))}function kr(r,e){return(r%e+e)%e}function Ni(r,e,t){return(1-t)*r+t*e}function ys(r){return(r&r-1)===0&&r!==0}function Oi(r){return Math.pow(2,Math.floor(Math.log(r)/Math.LN2))}function Fn(r,e){switch(e.constructor){case Float32Array:return r;case Uint32Array:return r/4294967295;case Uint16Array:return r/65535;case Uint8Array:return r/255;case Int32Array:return Math.max(r/2147483647,-1);case Int16Array:return Math.max(r/32767,-1);case Int8Array:return Math.max(r/127,-1);default:throw new Error("Invalid component type.")}}function vt(r,e){switch(e.constructor){case Float32Array:return r;case Uint32Array:return Math.round(r*4294967295);case Uint16Array:return Math.round(r*65535);case Uint8Array:return Math.round(r*255);case Int32Array:return Math.round(r*2147483647);case Int16Array:return Math.round(r*32767);case Int8Array:return Math.round(r*127);default:throw new Error("Invalid component type.")}}class Ve{constructor(e=0,t=0){Ve.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,n=this.y,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6],this.y=s[1]*t+s[4]*n+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(_t(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const n=Math.cos(t),s=Math.sin(t),i=this.x-e.x,o=this.y-e.y;return this.x=i*n-o*s+e.x,this.y=i*s+o*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Oe{constructor(e,t,n,s,i,o,a,l,c){Oe.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,s,i,o,a,l,c)}set(e,t,n,s,i,o,a,l,c){const d=this.elements;return d[0]=e,d[1]=s,d[2]=a,d[3]=t,d[4]=i,d[5]=l,d[6]=n,d[7]=o,d[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,s=t.elements,i=this.elements,o=n[0],a=n[3],l=n[6],c=n[1],d=n[4],u=n[7],f=n[2],m=n[5],g=n[8],_=s[0],p=s[3],h=s[6],T=s[1],x=s[4],w=s[7],D=s[2],C=s[5],A=s[8];return i[0]=o*_+a*T+l*D,i[3]=o*p+a*x+l*C,i[6]=o*h+a*w+l*A,i[1]=c*_+d*T+u*D,i[4]=c*p+d*x+u*C,i[7]=c*h+d*w+u*A,i[2]=f*_+m*T+g*D,i[5]=f*p+m*x+g*C,i[8]=f*h+m*w+g*A,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[1],s=e[2],i=e[3],o=e[4],a=e[5],l=e[6],c=e[7],d=e[8];return t*o*d-t*a*c-n*i*d+n*a*l+s*i*c-s*o*l}invert(){const e=this.elements,t=e[0],n=e[1],s=e[2],i=e[3],o=e[4],a=e[5],l=e[6],c=e[7],d=e[8],u=d*o-a*c,f=a*l-d*i,m=c*i-o*l,g=t*u+n*f+s*m;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const _=1/g;return e[0]=u*_,e[1]=(s*c-d*n)*_,e[2]=(a*n-s*o)*_,e[3]=f*_,e[4]=(d*t-s*l)*_,e[5]=(s*i-a*t)*_,e[6]=m*_,e[7]=(n*l-c*t)*_,e[8]=(o*t-n*i)*_,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,s,i,o,a){const l=Math.cos(i),c=Math.sin(i);return this.set(n*l,n*c,-n*(l*o+c*a)+o+e,-s*c,s*l,-s*(-c*o+l*a)+a+t,0,0,1),this}scale(e,t){return this.premultiply(Bi.makeScale(e,t)),this}rotate(e){return this.premultiply(Bi.makeRotation(-e)),this}translate(e,t){return this.premultiply(Bi.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,n=e.elements;for(let s=0;s<9;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const Bi=new Oe;function Ms(r){for(let e=r.length-1;e>=0;--e)if(r[e]>=65535)return!0;return!1}function Qn(r){return document.createElementNS("http://www.w3.org/1999/xhtml",r)}function Gr(){const r=Qn("canvas");return r.style.display="block",r}const Es={};function Nn(r){r in Es||(Es[r]=!0,console.warn(r))}const Ts=new Oe().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),bs=new Oe().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),ei={[kt]:{transfer:jn,primaries:Zn,toReference:r=>r,fromReference:r=>r},[lt]:{transfer:Ke,primaries:Zn,toReference:r=>r.convertSRGBToLinear(),fromReference:r=>r.convertLinearToSRGB()},[Kn]:{transfer:jn,primaries:Jn,toReference:r=>r.applyMatrix3(bs),fromReference:r=>r.applyMatrix3(Ts)},[Ii]:{transfer:Ke,primaries:Jn,toReference:r=>r.convertSRGBToLinear().applyMatrix3(bs),fromReference:r=>r.applyMatrix3(Ts).convertLinearToSRGB()}},zr=new Set([kt,Kn]),We={enabled:!0,_workingColorSpace:kt,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(r){if(!zr.has(r))throw new Error(`Unsupported working color space, "${r}".`);this._workingColorSpace=r},convert:function(r,e,t){if(this.enabled===!1||e===t||!e||!t)return r;const n=ei[e].toReference,s=ei[t].fromReference;return s(n(r))},fromWorkingColorSpace:function(r,e){return this.convert(r,this._workingColorSpace,e)},toWorkingColorSpace:function(r,e){return this.convert(r,e,this._workingColorSpace)},getPrimaries:function(r){return ei[r].primaries},getTransfer:function(r){return r===Tt?jn:ei[r].transfer}};function un(r){return r<.04045?r*.0773993808:Math.pow(r*.9478672986+.0521327014,2.4)}function ki(r){return r<.0031308?r*12.92:1.055*Math.pow(r,.41666)-.055}let hn;class As{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{hn===void 0&&(hn=Qn("canvas")),hn.width=e.width,hn.height=e.height;const n=hn.getContext("2d");e instanceof ImageData?n.putImageData(e,0,0):n.drawImage(e,0,0,e.width,e.height),t=hn}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=Qn("canvas");t.width=e.width,t.height=e.height;const n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);const s=n.getImageData(0,0,e.width,e.height),i=s.data;for(let o=0;o<i.length;o++)i[o]=un(i[o]/255)*255;return n.putImageData(s,0,0),t}else if(e.data){const t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(un(t[n]/255)*255):t[n]=un(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let Hr=0;class ws{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Hr++}),this.uuid=Un(),this.data=e,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let i;if(Array.isArray(s)){i=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?i.push(Gi(s[o].image)):i.push(Gi(s[o]))}else i=Gi(s);n.url=i}return t||(e.images[this.uuid]=n),n}}function Gi(r){return typeof HTMLImageElement<"u"&&r instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&r instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&r instanceof ImageBitmap?As.getDataURL(r):r.data?{data:Array.from(r.data),width:r.width,height:r.height,type:r.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let Vr=0;class St extends dn{constructor(e=St.DEFAULT_IMAGE,t=St.DEFAULT_MAPPING,n=1001,s=1001,i=1006,o=1008,a=1023,l=1009,c=St.DEFAULT_ANISOTROPY,d=Tt){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Vr++}),this.uuid=Un(),this.name="",this.source=new ws(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=i,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new Ve(0,0),this.repeat=new Ve(1,1),this.center=new Ve(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Oe,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,typeof d=="string"?this.colorSpace=d:(Nn("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=d===3001?lt:Tt),this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.needsPMREMUpdate=!1}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==300)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case 1e3:e.x=e.x-Math.floor(e.x);break;case 1001:e.x=e.x<0?0:1;break;case 1002:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case 1e3:e.y=e.y-Math.floor(e.y);break;case 1001:e.y=e.y<0?0:1;break;case 1002:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}get encoding(){return Nn("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace===lt?3001:3e3}set encoding(e){Nn("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=e===3001?lt:Tt}}St.DEFAULT_IMAGE=null,St.DEFAULT_MAPPING=300,St.DEFAULT_ANISOTROPY=1;class ct{constructor(e=0,t=0,n=0,s=1){ct.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,s){return this.x=e,this.y=t,this.z=n,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,n=this.y,s=this.z,i=this.w,o=e.elements;return this.x=o[0]*t+o[4]*n+o[8]*s+o[12]*i,this.y=o[1]*t+o[5]*n+o[9]*s+o[13]*i,this.z=o[2]*t+o[6]*n+o[10]*s+o[14]*i,this.w=o[3]*t+o[7]*n+o[11]*s+o[15]*i,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,s,i;const l=e.elements,c=l[0],d=l[4],u=l[8],f=l[1],m=l[5],g=l[9],_=l[2],p=l[6],h=l[10];if(Math.abs(d-f)<.01&&Math.abs(u-_)<.01&&Math.abs(g-p)<.01){if(Math.abs(d+f)<.1&&Math.abs(u+_)<.1&&Math.abs(g+p)<.1&&Math.abs(c+m+h-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const x=(c+1)/2,w=(m+1)/2,D=(h+1)/2,C=(d+f)/4,A=(u+_)/4,$=(g+p)/4;return x>w&&x>D?x<.01?(n=0,s=.707106781,i=.707106781):(n=Math.sqrt(x),s=C/n,i=A/n):w>D?w<.01?(n=.707106781,s=0,i=.707106781):(s=Math.sqrt(w),n=C/s,i=$/s):D<.01?(n=.707106781,s=.707106781,i=0):(i=Math.sqrt(D),n=A/i,s=$/i),this.set(n,s,i,t),this}let T=Math.sqrt((p-g)*(p-g)+(u-_)*(u-_)+(f-d)*(f-d));return Math.abs(T)<.001&&(T=1),this.x=(p-g)/T,this.y=(u-_)/T,this.z=(f-d)/T,this.w=Math.acos((c+m+h-1)/2),this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Wr extends dn{constructor(e=1,t=1,n={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new ct(0,0,e,t),this.scissorTest=!1,this.viewport=new ct(0,0,e,t);const s={width:e,height:t,depth:1};n.encoding!==void 0&&(Nn("THREE.WebGLRenderTarget: option.encoding has been replaced by option.colorSpace."),n.colorSpace=n.encoding===3001?lt:Tt),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:1006,depthBuffer:!0,stencilBuffer:!1,depthTexture:null,samples:0},n),this.texture=new St(s,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.flipY=!1,this.texture.generateMipmaps=n.generateMipmaps,this.texture.internalFormat=n.internalFormat,this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}setSize(e,t,n=1){(this.width!==e||this.height!==t||this.depth!==n)&&(this.width=e,this.height=t,this.depth=n,this.texture.image.width=e,this.texture.image.height=t,this.texture.image.depth=n,this.dispose()),this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.texture=e.texture.clone(),this.texture.isRenderTargetTexture=!0;const t=Object.assign({},e.texture.image);return this.texture.source=new ws(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Jt extends Wr{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}}class Cs extends St{constructor(e=null,t=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=1003,this.minFilter=1003,this.wrapR=1001,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Xr extends St{constructor(e=null,t=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=1003,this.minFilter=1003,this.wrapR=1001,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class On{constructor(e=0,t=0,n=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=s}static slerpFlat(e,t,n,s,i,o,a){let l=n[s+0],c=n[s+1],d=n[s+2],u=n[s+3];const f=i[o+0],m=i[o+1],g=i[o+2],_=i[o+3];if(a===0){e[t+0]=l,e[t+1]=c,e[t+2]=d,e[t+3]=u;return}if(a===1){e[t+0]=f,e[t+1]=m,e[t+2]=g,e[t+3]=_;return}if(u!==_||l!==f||c!==m||d!==g){let p=1-a;const h=l*f+c*m+d*g+u*_,T=h>=0?1:-1,x=1-h*h;if(x>Number.EPSILON){const D=Math.sqrt(x),C=Math.atan2(D,h*T);p=Math.sin(p*C)/D,a=Math.sin(a*C)/D}const w=a*T;if(l=l*p+f*w,c=c*p+m*w,d=d*p+g*w,u=u*p+_*w,p===1-a){const D=1/Math.sqrt(l*l+c*c+d*d+u*u);l*=D,c*=D,d*=D,u*=D}}e[t]=l,e[t+1]=c,e[t+2]=d,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,s,i,o){const a=n[s],l=n[s+1],c=n[s+2],d=n[s+3],u=i[o],f=i[o+1],m=i[o+2],g=i[o+3];return e[t]=a*g+d*u+l*m-c*f,e[t+1]=l*g+d*f+c*u-a*m,e[t+2]=c*g+d*m+a*f-l*u,e[t+3]=d*g-a*u-l*f-c*m,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,s){return this._x=e,this._y=t,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const n=e._x,s=e._y,i=e._z,o=e._order,a=Math.cos,l=Math.sin,c=a(n/2),d=a(s/2),u=a(i/2),f=l(n/2),m=l(s/2),g=l(i/2);switch(o){case"XYZ":this._x=f*d*u+c*m*g,this._y=c*m*u-f*d*g,this._z=c*d*g+f*m*u,this._w=c*d*u-f*m*g;break;case"YXZ":this._x=f*d*u+c*m*g,this._y=c*m*u-f*d*g,this._z=c*d*g-f*m*u,this._w=c*d*u+f*m*g;break;case"ZXY":this._x=f*d*u-c*m*g,this._y=c*m*u+f*d*g,this._z=c*d*g+f*m*u,this._w=c*d*u-f*m*g;break;case"ZYX":this._x=f*d*u-c*m*g,this._y=c*m*u+f*d*g,this._z=c*d*g-f*m*u,this._w=c*d*u+f*m*g;break;case"YZX":this._x=f*d*u+c*m*g,this._y=c*m*u+f*d*g,this._z=c*d*g-f*m*u,this._w=c*d*u-f*m*g;break;case"XZY":this._x=f*d*u-c*m*g,this._y=c*m*u-f*d*g,this._z=c*d*g+f*m*u,this._w=c*d*u+f*m*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const n=t/2,s=Math.sin(n);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,n=t[0],s=t[4],i=t[8],o=t[1],a=t[5],l=t[9],c=t[2],d=t[6],u=t[10],f=n+a+u;if(f>0){const m=.5/Math.sqrt(f+1);this._w=.25/m,this._x=(d-l)*m,this._y=(i-c)*m,this._z=(o-s)*m}else if(n>a&&n>u){const m=2*Math.sqrt(1+n-a-u);this._w=(d-l)/m,this._x=.25*m,this._y=(s+o)/m,this._z=(i+c)/m}else if(a>u){const m=2*Math.sqrt(1+a-n-u);this._w=(i-c)/m,this._x=(s+o)/m,this._y=.25*m,this._z=(l+d)/m}else{const m=2*Math.sqrt(1+u-n-a);this._w=(o-s)/m,this._x=(i+c)/m,this._y=(l+d)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<Number.EPSILON?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(_t(this.dot(e),-1,1)))}rotateTowards(e,t){const n=this.angleTo(e);if(n===0)return this;const s=Math.min(1,t/n);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const n=e._x,s=e._y,i=e._z,o=e._w,a=t._x,l=t._y,c=t._z,d=t._w;return this._x=n*d+o*a+s*c-i*l,this._y=s*d+o*l+i*a-n*c,this._z=i*d+o*c+n*l-s*a,this._w=o*d-n*a-s*l-i*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);const n=this._x,s=this._y,i=this._z,o=this._w;let a=o*e._w+n*e._x+s*e._y+i*e._z;if(a<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,a=-a):this.copy(e),a>=1)return this._w=o,this._x=n,this._y=s,this._z=i,this;const l=1-a*a;if(l<=Number.EPSILON){const m=1-t;return this._w=m*o+t*this._w,this._x=m*n+t*this._x,this._y=m*s+t*this._y,this._z=m*i+t*this._z,this.normalize(),this}const c=Math.sqrt(l),d=Math.atan2(c,a),u=Math.sin((1-t)*d)/c,f=Math.sin(t*d)/c;return this._w=o*u+this._w*f,this._x=n*u+this._x*f,this._y=s*u+this._y*f,this._z=i*u+this._z*f,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){const e=Math.random(),t=Math.sqrt(1-e),n=Math.sqrt(e),s=2*Math.PI*Math.random(),i=2*Math.PI*Math.random();return this.set(t*Math.cos(s),n*Math.sin(i),n*Math.cos(i),t*Math.sin(s))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class I{constructor(e=0,t=0,n=0){I.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Rs.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Rs.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,n=this.y,s=this.z,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6]*s,this.y=i[1]*t+i[4]*n+i[7]*s,this.z=i[2]*t+i[5]*n+i[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,n=this.y,s=this.z,i=e.elements,o=1/(i[3]*t+i[7]*n+i[11]*s+i[15]);return this.x=(i[0]*t+i[4]*n+i[8]*s+i[12])*o,this.y=(i[1]*t+i[5]*n+i[9]*s+i[13])*o,this.z=(i[2]*t+i[6]*n+i[10]*s+i[14])*o,this}applyQuaternion(e){const t=this.x,n=this.y,s=this.z,i=e.x,o=e.y,a=e.z,l=e.w,c=2*(o*s-a*n),d=2*(a*t-i*s),u=2*(i*n-o*t);return this.x=t+l*c+o*u-a*d,this.y=n+l*d+a*c-i*u,this.z=s+l*u+i*d-o*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,n=this.y,s=this.z,i=e.elements;return this.x=i[0]*t+i[4]*n+i[8]*s,this.y=i[1]*t+i[5]*n+i[9]*s,this.z=i[2]*t+i[6]*n+i[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const n=e.x,s=e.y,i=e.z,o=t.x,a=t.y,l=t.z;return this.x=s*l-i*a,this.y=i*o-n*l,this.z=n*a-s*o,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return zi.copy(this).projectOnVector(e),this.sub(zi)}reflect(e){return this.sub(zi.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(_t(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y,s=this.z-e.z;return t*t+n*n+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){const s=Math.sin(t)*e;return this.x=s*Math.sin(n),this.y=Math.cos(t)*e,this.z=s*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=(Math.random()-.5)*2,t=Math.random()*Math.PI*2,n=Math.sqrt(1-e**2);return this.x=n*Math.cos(t),this.y=n*Math.sin(t),this.z=e,this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const zi=new I,Rs=new On;class Bn{constructor(e=new I(1/0,1/0,1/0),t=new I(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Rt.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Rt.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const n=Rt.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const n=e.geometry;if(n!==void 0){const i=n.getAttribute("position");if(t===!0&&i!==void 0&&e.isInstancedMesh!==!0)for(let o=0,a=i.count;o<a;o++)e.isMesh===!0?e.getVertexPosition(o,Rt):Rt.fromBufferAttribute(i,o),Rt.applyMatrix4(e.matrixWorld),this.expandByPoint(Rt);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),ti.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),ti.copy(n.boundingBox)),ti.applyMatrix4(e.matrixWorld),this.union(ti)}const s=e.children;for(let i=0,o=s.length;i<o;i++)this.expandByObject(s[i],t);return this}containsPoint(e){return!(e.x<this.min.x||e.x>this.max.x||e.y<this.min.y||e.y>this.max.y||e.z<this.min.z||e.z>this.max.z)}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return!(e.max.x<this.min.x||e.min.x>this.max.x||e.max.y<this.min.y||e.min.y>this.max.y||e.max.z<this.min.z||e.min.z>this.max.z)}intersectsSphere(e){return this.clampPoint(e.center,Rt),Rt.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(kn),ni.subVectors(this.max,kn),fn.subVectors(e.a,kn),pn.subVectors(e.b,kn),mn.subVectors(e.c,kn),$t.subVectors(pn,fn),Yt.subVectors(mn,pn),Qt.subVectors(fn,mn);let t=[0,-$t.z,$t.y,0,-Yt.z,Yt.y,0,-Qt.z,Qt.y,$t.z,0,-$t.x,Yt.z,0,-Yt.x,Qt.z,0,-Qt.x,-$t.y,$t.x,0,-Yt.y,Yt.x,0,-Qt.y,Qt.x,0];return!Hi(t,fn,pn,mn,ni)||(t=[1,0,0,0,1,0,0,0,1],!Hi(t,fn,pn,mn,ni))?!1:(ii.crossVectors($t,Yt),t=[ii.x,ii.y,ii.z],Hi(t,fn,pn,mn,ni))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Rt).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Rt).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Gt[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Gt[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Gt[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Gt[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Gt[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Gt[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Gt[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Gt[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Gt),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}}const Gt=[new I,new I,new I,new I,new I,new I,new I,new I],Rt=new I,ti=new Bn,fn=new I,pn=new I,mn=new I,$t=new I,Yt=new I,Qt=new I,kn=new I,ni=new I,ii=new I,en=new I;function Hi(r,e,t,n,s){for(let i=0,o=r.length-3;i<=o;i+=3){en.fromArray(r,i);const a=s.x*Math.abs(en.x)+s.y*Math.abs(en.y)+s.z*Math.abs(en.z),l=e.dot(en),c=t.dot(en),d=n.dot(en);if(Math.max(-Math.max(l,c,d),Math.min(l,c,d))>a)return!1}return!0}const qr=new Bn,Gn=new I,Vi=new I;class si{constructor(e=new I,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const n=this.center;t!==void 0?n.copy(t):qr.setFromPoints(e).getCenter(n);let s=0;for(let i=0,o=e.length;i<o;i++)s=Math.max(s,n.distanceToSquared(e[i]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Gn.subVectors(e,this.center);const t=Gn.lengthSq();if(t>this.radius*this.radius){const n=Math.sqrt(t),s=(n-this.radius)*.5;this.center.addScaledVector(Gn,s/n),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Vi.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Gn.copy(e.center).add(Vi)),this.expandByPoint(Gn.copy(e.center).sub(Vi))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}}const zt=new I,Wi=new I,ri=new I,Kt=new I,Xi=new I,ai=new I,qi=new I;class Ls{constructor(e=new I,t=new I(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,zt)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=zt.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(zt.copy(this.origin).addScaledVector(this.direction,t),zt.distanceToSquared(e))}distanceSqToSegment(e,t,n,s){Wi.copy(e).add(t).multiplyScalar(.5),ri.copy(t).sub(e).normalize(),Kt.copy(this.origin).sub(Wi);const i=e.distanceTo(t)*.5,o=-this.direction.dot(ri),a=Kt.dot(this.direction),l=-Kt.dot(ri),c=Kt.lengthSq(),d=Math.abs(1-o*o);let u,f,m,g;if(d>0)if(u=o*l-a,f=o*a-l,g=i*d,u>=0)if(f>=-g)if(f<=g){const _=1/d;u*=_,f*=_,m=u*(u+o*f+2*a)+f*(o*u+f+2*l)+c}else f=i,u=Math.max(0,-(o*f+a)),m=-u*u+f*(f+2*l)+c;else f=-i,u=Math.max(0,-(o*f+a)),m=-u*u+f*(f+2*l)+c;else f<=-g?(u=Math.max(0,-(-o*i+a)),f=u>0?-i:Math.min(Math.max(-i,-l),i),m=-u*u+f*(f+2*l)+c):f<=g?(u=0,f=Math.min(Math.max(-i,-l),i),m=f*(f+2*l)+c):(u=Math.max(0,-(o*i+a)),f=u>0?i:Math.min(Math.max(-i,-l),i),m=-u*u+f*(f+2*l)+c);else f=o>0?-i:i,u=Math.max(0,-(o*f+a)),m=-u*u+f*(f+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),s&&s.copy(Wi).addScaledVector(ri,f),m}intersectSphere(e,t){zt.subVectors(e.center,this.origin);const n=zt.dot(this.direction),s=zt.dot(zt)-n*n,i=e.radius*e.radius;if(s>i)return null;const o=Math.sqrt(i-s),a=n-o,l=n+o;return l<0?null:a<0?this.at(l,t):this.at(a,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){const n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,s,i,o,a,l;const c=1/this.direction.x,d=1/this.direction.y,u=1/this.direction.z,f=this.origin;return c>=0?(n=(e.min.x-f.x)*c,s=(e.max.x-f.x)*c):(n=(e.max.x-f.x)*c,s=(e.min.x-f.x)*c),d>=0?(i=(e.min.y-f.y)*d,o=(e.max.y-f.y)*d):(i=(e.max.y-f.y)*d,o=(e.min.y-f.y)*d),n>o||i>s||((i>n||isNaN(n))&&(n=i),(o<s||isNaN(s))&&(s=o),u>=0?(a=(e.min.z-f.z)*u,l=(e.max.z-f.z)*u):(a=(e.max.z-f.z)*u,l=(e.min.z-f.z)*u),n>l||a>s)||((a>n||n!==n)&&(n=a),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,t)}intersectsBox(e){return this.intersectBox(e,zt)!==null}intersectTriangle(e,t,n,s,i){Xi.subVectors(t,e),ai.subVectors(n,e),qi.crossVectors(Xi,ai);let o=this.direction.dot(qi),a;if(o>0){if(s)return null;a=1}else if(o<0)a=-1,o=-o;else return null;Kt.subVectors(this.origin,e);const l=a*this.direction.dot(ai.crossVectors(Kt,ai));if(l<0)return null;const c=a*this.direction.dot(Xi.cross(Kt));if(c<0||l+c>o)return null;const d=-a*Kt.dot(qi);return d<0?null:this.at(d/o,i)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class st{constructor(e,t,n,s,i,o,a,l,c,d,u,f,m,g,_,p){st.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,s,i,o,a,l,c,d,u,f,m,g,_,p)}set(e,t,n,s,i,o,a,l,c,d,u,f,m,g,_,p){const h=this.elements;return h[0]=e,h[4]=t,h[8]=n,h[12]=s,h[1]=i,h[5]=o,h[9]=a,h[13]=l,h[2]=c,h[6]=d,h[10]=u,h[14]=f,h[3]=m,h[7]=g,h[11]=_,h[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new st().fromArray(this.elements)}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){const t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){const t=this.elements,n=e.elements,s=1/gn.setFromMatrixColumn(e,0).length(),i=1/gn.setFromMatrixColumn(e,1).length(),o=1/gn.setFromMatrixColumn(e,2).length();return t[0]=n[0]*s,t[1]=n[1]*s,t[2]=n[2]*s,t[3]=0,t[4]=n[4]*i,t[5]=n[5]*i,t[6]=n[6]*i,t[7]=0,t[8]=n[8]*o,t[9]=n[9]*o,t[10]=n[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,n=e.x,s=e.y,i=e.z,o=Math.cos(n),a=Math.sin(n),l=Math.cos(s),c=Math.sin(s),d=Math.cos(i),u=Math.sin(i);if(e.order==="XYZ"){const f=o*d,m=o*u,g=a*d,_=a*u;t[0]=l*d,t[4]=-l*u,t[8]=c,t[1]=m+g*c,t[5]=f-_*c,t[9]=-a*l,t[2]=_-f*c,t[6]=g+m*c,t[10]=o*l}else if(e.order==="YXZ"){const f=l*d,m=l*u,g=c*d,_=c*u;t[0]=f+_*a,t[4]=g*a-m,t[8]=o*c,t[1]=o*u,t[5]=o*d,t[9]=-a,t[2]=m*a-g,t[6]=_+f*a,t[10]=o*l}else if(e.order==="ZXY"){const f=l*d,m=l*u,g=c*d,_=c*u;t[0]=f-_*a,t[4]=-o*u,t[8]=g+m*a,t[1]=m+g*a,t[5]=o*d,t[9]=_-f*a,t[2]=-o*c,t[6]=a,t[10]=o*l}else if(e.order==="ZYX"){const f=o*d,m=o*u,g=a*d,_=a*u;t[0]=l*d,t[4]=g*c-m,t[8]=f*c+_,t[1]=l*u,t[5]=_*c+f,t[9]=m*c-g,t[2]=-c,t[6]=a*l,t[10]=o*l}else if(e.order==="YZX"){const f=o*l,m=o*c,g=a*l,_=a*c;t[0]=l*d,t[4]=_-f*u,t[8]=g*u+m,t[1]=u,t[5]=o*d,t[9]=-a*d,t[2]=-c*d,t[6]=m*u+g,t[10]=f-_*u}else if(e.order==="XZY"){const f=o*l,m=o*c,g=a*l,_=a*c;t[0]=l*d,t[4]=-u,t[8]=c*d,t[1]=f*u+_,t[5]=o*d,t[9]=m*u-g,t[2]=g*u-m,t[6]=a*d,t[10]=_*u+f}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose($r,e,Yr)}lookAt(e,t,n){const s=this.elements;return yt.subVectors(e,t),yt.lengthSq()===0&&(yt.z=1),yt.normalize(),jt.crossVectors(n,yt),jt.lengthSq()===0&&(Math.abs(n.z)===1?yt.x+=1e-4:yt.z+=1e-4,yt.normalize(),jt.crossVectors(n,yt)),jt.normalize(),oi.crossVectors(yt,jt),s[0]=jt.x,s[4]=oi.x,s[8]=yt.x,s[1]=jt.y,s[5]=oi.y,s[9]=yt.y,s[2]=jt.z,s[6]=oi.z,s[10]=yt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,s=t.elements,i=this.elements,o=n[0],a=n[4],l=n[8],c=n[12],d=n[1],u=n[5],f=n[9],m=n[13],g=n[2],_=n[6],p=n[10],h=n[14],T=n[3],x=n[7],w=n[11],D=n[15],C=s[0],A=s[4],$=s[8],y=s[12],E=s[1],k=s[5],Y=s[9],ie=s[13],R=s[2],O=s[6],z=s[10],X=s[14],V=s[3],H=s[7],K=s[11],J=s[15];return i[0]=o*C+a*E+l*R+c*V,i[4]=o*A+a*k+l*O+c*H,i[8]=o*$+a*Y+l*z+c*K,i[12]=o*y+a*ie+l*X+c*J,i[1]=d*C+u*E+f*R+m*V,i[5]=d*A+u*k+f*O+m*H,i[9]=d*$+u*Y+f*z+m*K,i[13]=d*y+u*ie+f*X+m*J,i[2]=g*C+_*E+p*R+h*V,i[6]=g*A+_*k+p*O+h*H,i[10]=g*$+_*Y+p*z+h*K,i[14]=g*y+_*ie+p*X+h*J,i[3]=T*C+x*E+w*R+D*V,i[7]=T*A+x*k+w*O+D*H,i[11]=T*$+x*Y+w*z+D*K,i[15]=T*y+x*ie+w*X+D*J,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[4],s=e[8],i=e[12],o=e[1],a=e[5],l=e[9],c=e[13],d=e[2],u=e[6],f=e[10],m=e[14],g=e[3],_=e[7],p=e[11],h=e[15];return g*(+i*l*u-s*c*u-i*a*f+n*c*f+s*a*m-n*l*m)+_*(+t*l*m-t*c*f+i*o*f-s*o*m+s*c*d-i*l*d)+p*(+t*c*u-t*a*m-i*o*u+n*o*m+i*a*d-n*c*d)+h*(-s*a*d-t*l*u+t*a*f+s*o*u-n*o*f+n*l*d)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){const s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=n),this}invert(){const e=this.elements,t=e[0],n=e[1],s=e[2],i=e[3],o=e[4],a=e[5],l=e[6],c=e[7],d=e[8],u=e[9],f=e[10],m=e[11],g=e[12],_=e[13],p=e[14],h=e[15],T=u*p*c-_*f*c+_*l*m-a*p*m-u*l*h+a*f*h,x=g*f*c-d*p*c-g*l*m+o*p*m+d*l*h-o*f*h,w=d*_*c-g*u*c+g*a*m-o*_*m-d*a*h+o*u*h,D=g*u*l-d*_*l-g*a*f+o*_*f+d*a*p-o*u*p,C=t*T+n*x+s*w+i*D;if(C===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const A=1/C;return e[0]=T*A,e[1]=(_*f*i-u*p*i-_*s*m+n*p*m+u*s*h-n*f*h)*A,e[2]=(a*p*i-_*l*i+_*s*c-n*p*c-a*s*h+n*l*h)*A,e[3]=(u*l*i-a*f*i-u*s*c+n*f*c+a*s*m-n*l*m)*A,e[4]=x*A,e[5]=(d*p*i-g*f*i+g*s*m-t*p*m-d*s*h+t*f*h)*A,e[6]=(g*l*i-o*p*i-g*s*c+t*p*c+o*s*h-t*l*h)*A,e[7]=(o*f*i-d*l*i+d*s*c-t*f*c-o*s*m+t*l*m)*A,e[8]=w*A,e[9]=(g*u*i-d*_*i-g*n*m+t*_*m+d*n*h-t*u*h)*A,e[10]=(o*_*i-g*a*i+g*n*c-t*_*c-o*n*h+t*a*h)*A,e[11]=(d*a*i-o*u*i-d*n*c+t*u*c+o*n*m-t*a*m)*A,e[12]=D*A,e[13]=(d*_*s-g*u*s+g*n*f-t*_*f-d*n*p+t*u*p)*A,e[14]=(g*a*s-o*_*s-g*n*l+t*_*l+o*n*p-t*a*p)*A,e[15]=(o*u*s-d*a*s+d*n*l-t*u*l-o*n*f+t*a*f)*A,this}scale(e){const t=this.elements,n=e.x,s=e.y,i=e.z;return t[0]*=n,t[4]*=s,t[8]*=i,t[1]*=n,t[5]*=s,t[9]*=i,t[2]*=n,t[6]*=s,t[10]*=i,t[3]*=n,t[7]*=s,t[11]*=i,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,s))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const n=Math.cos(t),s=Math.sin(t),i=1-n,o=e.x,a=e.y,l=e.z,c=i*o,d=i*a;return this.set(c*o+n,c*a-s*l,c*l+s*a,0,c*a+s*l,d*a+n,d*l-s*o,0,c*l-s*a,d*l+s*o,i*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,s,i,o){return this.set(1,n,i,0,e,1,o,0,t,s,1,0,0,0,0,1),this}compose(e,t,n){const s=this.elements,i=t._x,o=t._y,a=t._z,l=t._w,c=i+i,d=o+o,u=a+a,f=i*c,m=i*d,g=i*u,_=o*d,p=o*u,h=a*u,T=l*c,x=l*d,w=l*u,D=n.x,C=n.y,A=n.z;return s[0]=(1-(_+h))*D,s[1]=(m+w)*D,s[2]=(g-x)*D,s[3]=0,s[4]=(m-w)*C,s[5]=(1-(f+h))*C,s[6]=(p+T)*C,s[7]=0,s[8]=(g+x)*A,s[9]=(p-T)*A,s[10]=(1-(f+_))*A,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,n){const s=this.elements;let i=gn.set(s[0],s[1],s[2]).length();const o=gn.set(s[4],s[5],s[6]).length(),a=gn.set(s[8],s[9],s[10]).length();this.determinant()<0&&(i=-i),e.x=s[12],e.y=s[13],e.z=s[14],Lt.copy(this);const c=1/i,d=1/o,u=1/a;return Lt.elements[0]*=c,Lt.elements[1]*=c,Lt.elements[2]*=c,Lt.elements[4]*=d,Lt.elements[5]*=d,Lt.elements[6]*=d,Lt.elements[8]*=u,Lt.elements[9]*=u,Lt.elements[10]*=u,t.setFromRotationMatrix(Lt),n.x=i,n.y=o,n.z=a,this}makePerspective(e,t,n,s,i,o,a=2e3){const l=this.elements,c=2*i/(t-e),d=2*i/(n-s),u=(t+e)/(t-e),f=(n+s)/(n-s);let m,g;if(a===2e3)m=-(o+i)/(o-i),g=-2*o*i/(o-i);else if(a===2001)m=-o/(o-i),g=-o*i/(o-i);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=c,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=d,l[9]=f,l[13]=0,l[2]=0,l[6]=0,l[10]=m,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,n,s,i,o,a=2e3){const l=this.elements,c=1/(t-e),d=1/(n-s),u=1/(o-i),f=(t+e)*c,m=(n+s)*d;let g,_;if(a===2e3)g=(o+i)*u,_=-2*u;else if(a===2001)g=i*u,_=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-f,l[1]=0,l[5]=2*d,l[9]=0,l[13]=-m,l[2]=0,l[6]=0,l[10]=_,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){const t=this.elements,n=e.elements;for(let s=0;s<16;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}}const gn=new I,Lt=new st,$r=new I(0,0,0),Yr=new I(1,1,1),jt=new I,oi=new I,yt=new I,Ps=new st,Ds=new On;class li{constructor(e=0,t=0,n=0,s=li.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,s=this._order){return this._x=e,this._y=t,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){const s=e.elements,i=s[0],o=s[4],a=s[8],l=s[1],c=s[5],d=s[9],u=s[2],f=s[6],m=s[10];switch(t){case"XYZ":this._y=Math.asin(_t(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-d,m),this._z=Math.atan2(-o,i)):(this._x=Math.atan2(f,c),this._z=0);break;case"YXZ":this._x=Math.asin(-_t(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(a,m),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,i),this._z=0);break;case"ZXY":this._x=Math.asin(_t(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-u,m),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,i));break;case"ZYX":this._y=Math.asin(-_t(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(f,m),this._z=Math.atan2(l,i)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(_t(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-d,c),this._y=Math.atan2(-u,i)):(this._x=0,this._y=Math.atan2(a,m));break;case"XZY":this._z=Math.asin(-_t(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(f,c),this._y=Math.atan2(a,i)):(this._x=Math.atan2(-d,m),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Ps.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Ps,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Ds.setFromEuler(this),this.setFromQuaternion(Ds,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}li.DEFAULT_ORDER="XYZ";class Is{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let Kr=0;const Us=new I,_n=new On,Ht=new st,ci=new I,zn=new I,jr=new I,Zr=new On,Fs=new I(1,0,0),Ns=new I(0,1,0),Os=new I(0,0,1),Jr={type:"added"},Qr={type:"removed"};class xt extends dn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Kr++}),this.uuid=Un(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=xt.DEFAULT_UP.clone();const e=new I,t=new li,n=new On,s=new I(1,1,1);function i(){n.setFromEuler(t,!1)}function o(){t.setFromQuaternion(n,void 0,!1)}t._onChange(i),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new st},normalMatrix:{value:new Oe}}),this.matrix=new st,this.matrixWorld=new st,this.matrixAutoUpdate=xt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=xt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Is,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return _n.setFromAxisAngle(e,t),this.quaternion.multiply(_n),this}rotateOnWorldAxis(e,t){return _n.setFromAxisAngle(e,t),this.quaternion.premultiply(_n),this}rotateX(e){return this.rotateOnAxis(Fs,e)}rotateY(e){return this.rotateOnAxis(Ns,e)}rotateZ(e){return this.rotateOnAxis(Os,e)}translateOnAxis(e,t){return Us.copy(e).applyQuaternion(this.quaternion),this.position.add(Us.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Fs,e)}translateY(e){return this.translateOnAxis(Ns,e)}translateZ(e){return this.translateOnAxis(Os,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Ht.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?ci.copy(e):ci.set(e,t,n);const s=this.parent;this.updateWorldMatrix(!0,!1),zn.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Ht.lookAt(zn,ci,this.up):Ht.lookAt(ci,zn,this.up),this.quaternion.setFromRotationMatrix(Ht),s&&(Ht.extractRotation(s.matrixWorld),_n.setFromRotationMatrix(Ht),this.quaternion.premultiply(_n.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.parent!==null&&e.parent.remove(e),e.parent=this,this.children.push(e),e.dispatchEvent(Jr)):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Qr)),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Ht.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Ht.multiply(e.parent.matrixWorld)),e.applyMatrix4(Ht),this.add(e),e.updateWorldMatrix(!1,!0),this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,s=this.children.length;n<s;n++){const o=this.children[n].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);const s=this.children;for(let i=0,o=s.length;i<o;i++)s[i].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(zn,e,jr),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(zn,Zr,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let n=0,s=t.length;n<s;n++){const i=t[n];(i.matrixWorldAutoUpdate===!0||e===!0)&&i.updateMatrixWorld(e)}}updateWorldMatrix(e,t){const n=this.parent;if(e===!0&&n!==null&&n.matrixWorldAutoUpdate===!0&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),t===!0){const s=this.children;for(let i=0,o=s.length;i<o;i++){const a=s[i];a.matrixWorldAutoUpdate===!0&&a.updateWorldMatrix(!1,!0)}}}toJSON(e){const t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),s.maxGeometryCount=this._maxGeometryCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(e),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function i(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=i(e.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const l=a.shapes;if(Array.isArray(l))for(let c=0,d=l.length;c<d;c++){const u=l[c];i(e.shapes,u)}else i(e.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(i(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(i(e.materials,this.material[l]));s.material=a}else s.material=i(e.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){const l=this.animations[a];s.animations.push(i(e.animations,l))}}if(t){const a=o(e.geometries),l=o(e.materials),c=o(e.textures),d=o(e.images),u=o(e.shapes),f=o(e.skeletons),m=o(e.animations),g=o(e.nodes);a.length>0&&(n.geometries=a),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),d.length>0&&(n.images=d),u.length>0&&(n.shapes=u),f.length>0&&(n.skeletons=f),m.length>0&&(n.animations=m),g.length>0&&(n.nodes=g)}return n.object=s,n;function o(a){const l=[];for(const c in a){const d=a[c];delete d.metadata,l.push(d)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){const s=e.children[n];this.add(s.clone())}return this}}xt.DEFAULT_UP=new I(0,1,0),xt.DEFAULT_MATRIX_AUTO_UPDATE=!0,xt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const Pt=new I,Vt=new I,$i=new I,Wt=new I,vn=new I,xn=new I,Bs=new I,Yi=new I,Ki=new I,ji=new I;let di=!1;class Dt{constructor(e=new I,t=new I,n=new I){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,s){s.subVectors(n,t),Pt.subVectors(e,t),s.cross(Pt);const i=s.lengthSq();return i>0?s.multiplyScalar(1/Math.sqrt(i)):s.set(0,0,0)}static getBarycoord(e,t,n,s,i){Pt.subVectors(s,t),Vt.subVectors(n,t),$i.subVectors(e,t);const o=Pt.dot(Pt),a=Pt.dot(Vt),l=Pt.dot($i),c=Vt.dot(Vt),d=Vt.dot($i),u=o*c-a*a;if(u===0)return i.set(0,0,0),null;const f=1/u,m=(c*l-a*d)*f,g=(o*d-a*l)*f;return i.set(1-m-g,g,m)}static containsPoint(e,t,n,s){return this.getBarycoord(e,t,n,s,Wt)===null?!1:Wt.x>=0&&Wt.y>=0&&Wt.x+Wt.y<=1}static getUV(e,t,n,s,i,o,a,l){return di===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),di=!0),this.getInterpolation(e,t,n,s,i,o,a,l)}static getInterpolation(e,t,n,s,i,o,a,l){return this.getBarycoord(e,t,n,s,Wt)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(i,Wt.x),l.addScaledVector(o,Wt.y),l.addScaledVector(a,Wt.z),l)}static isFrontFacing(e,t,n,s){return Pt.subVectors(n,t),Vt.subVectors(e,t),Pt.cross(Vt).dot(s)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,s){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,n,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Pt.subVectors(this.c,this.b),Vt.subVectors(this.a,this.b),Pt.cross(Vt).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(.3333333333333333)}getNormal(e){return Dt.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return Dt.getBarycoord(e,this.a,this.b,this.c,t)}getUV(e,t,n,s,i){return di===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),di=!0),Dt.getInterpolation(e,this.a,this.b,this.c,t,n,s,i)}getInterpolation(e,t,n,s,i){return Dt.getInterpolation(e,this.a,this.b,this.c,t,n,s,i)}containsPoint(e){return Dt.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return Dt.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const n=this.a,s=this.b,i=this.c;let o,a;vn.subVectors(s,n),xn.subVectors(i,n),Yi.subVectors(e,n);const l=vn.dot(Yi),c=xn.dot(Yi);if(l<=0&&c<=0)return t.copy(n);Ki.subVectors(e,s);const d=vn.dot(Ki),u=xn.dot(Ki);if(d>=0&&u<=d)return t.copy(s);const f=l*u-d*c;if(f<=0&&l>=0&&d<=0)return o=l/(l-d),t.copy(n).addScaledVector(vn,o);ji.subVectors(e,i);const m=vn.dot(ji),g=xn.dot(ji);if(g>=0&&m<=g)return t.copy(i);const _=m*c-l*g;if(_<=0&&c>=0&&g<=0)return a=c/(c-g),t.copy(n).addScaledVector(xn,a);const p=d*g-m*u;if(p<=0&&u-d>=0&&m-g>=0)return Bs.subVectors(i,s),a=(u-d)/(u-d+(m-g)),t.copy(s).addScaledVector(Bs,a);const h=1/(p+_+f);return o=_*h,a=f*h,t.copy(n).addScaledVector(vn,o).addScaledVector(xn,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}const ks={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Zt={h:0,s:0,l:0},ui={h:0,s:0,l:0};function Zi(r,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<.16666666666666666?r+(e-r)*6*t:t<.5?e:t<.6666666666666666?r+(e-r)*6*(.6666666666666666-t):r}class ze{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){const s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=lt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,We.toWorkingColorSpace(this,t),this}setRGB(e,t,n,s=We.workingColorSpace){return this.r=e,this.g=t,this.b=n,We.toWorkingColorSpace(this,s),this}setHSL(e,t,n,s=We.workingColorSpace){if(e=kr(e,1),t=_t(t,0,1),n=_t(n,0,1),t===0)this.r=this.g=this.b=n;else{const i=n<=.5?n*(1+t):n+t-n*t,o=2*n-i;this.r=Zi(o,i,e+.3333333333333333),this.g=Zi(o,i,e),this.b=Zi(o,i,e-.3333333333333333)}return We.toWorkingColorSpace(this,s),this}setStyle(e,t=lt){function n(i){i!==void 0&&parseFloat(i)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let i;const o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(i=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(i[4]),this.setRGB(Math.min(255,parseInt(i[1],10))/255,Math.min(255,parseInt(i[2],10))/255,Math.min(255,parseInt(i[3],10))/255,t);if(i=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(i[4]),this.setRGB(Math.min(100,parseInt(i[1],10))/100,Math.min(100,parseInt(i[2],10))/100,Math.min(100,parseInt(i[3],10))/100,t);break;case"hsl":case"hsla":if(i=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(i[4]),this.setHSL(parseFloat(i[1])/360,parseFloat(i[2])/100,parseFloat(i[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){const i=s[1],o=i.length;if(o===3)return this.setRGB(parseInt(i.charAt(0),16)/15,parseInt(i.charAt(1),16)/15,parseInt(i.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(i,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=lt){const n=ks[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=un(e.r),this.g=un(e.g),this.b=un(e.b),this}copyLinearToSRGB(e){return this.r=ki(e.r),this.g=ki(e.g),this.b=ki(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=lt){return We.fromWorkingColorSpace(ut.copy(this),e),Math.round(_t(ut.r*255,0,255))*65536+Math.round(_t(ut.g*255,0,255))*256+Math.round(_t(ut.b*255,0,255))}getHexString(e=lt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=We.workingColorSpace){We.fromWorkingColorSpace(ut.copy(this),t);const n=ut.r,s=ut.g,i=ut.b,o=Math.max(n,s,i),a=Math.min(n,s,i);let l,c;const d=(a+o)/2;if(a===o)l=0,c=0;else{const u=o-a;switch(c=d<=.5?u/(o+a):u/(2-o-a),o){case n:l=(s-i)/u+(s<i?6:0);break;case s:l=(i-n)/u+2;break;case i:l=(n-s)/u+4;break}l/=6}return e.h=l,e.s=c,e.l=d,e}getRGB(e,t=We.workingColorSpace){return We.fromWorkingColorSpace(ut.copy(this),t),e.r=ut.r,e.g=ut.g,e.b=ut.b,e}getStyle(e=lt){We.fromWorkingColorSpace(ut.copy(this),e);const t=ut.r,n=ut.g,s=ut.b;return e!==lt?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(e,t,n){return this.getHSL(Zt),this.setHSL(Zt.h+e,Zt.s+t,Zt.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Zt),e.getHSL(ui);const n=Ni(Zt.h,ui.h,t),s=Ni(Zt.s,ui.s,t),i=Ni(Zt.l,ui.l,t);return this.setHSL(n,s,i),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,n=this.g,s=this.b,i=e.elements;return this.r=i[0]*t+i[3]*n+i[6]*s,this.g=i[1]*t+i[4]*n+i[7]*s,this.b=i[2]*t+i[5]*n+i[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const ut=new ze;ze.NAMES=ks;let ea=0;class Hn extends dn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:ea++}),this.uuid=Un(),this.name="",this.type="Material",this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new ze(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=7680,this.stencilZFail=7680,this.stencilZPass=7680,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const n=e[t];if(n===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}const s=this[t];if(s===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==1&&(n.blending=this.blending),this.side!==0&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==204&&(n.blendSrc=this.blendSrc),this.blendDst!==205&&(n.blendDst=this.blendDst),this.blendEquation!==100&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==3&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==519&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==7680&&(n.stencilFail=this.stencilFail),this.stencilZFail!==7680&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==7680&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(i){const o=[];for(const a in i){const l=i[a];delete l.metadata,o.push(l)}return o}if(t){const i=s(e.textures),o=s(e.images);i.length>0&&(n.textures=i),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let n=null;if(t!==null){const s=t.length;n=new Array(s);for(let i=0;i!==s;++i)n[i]=t[i].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}class Ji extends Hn{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new ze(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=0,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const tt=new I,hi=new Ve;class bt{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=35044,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.gpuType=1015,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}get updateRange(){return console.warn("THREE.BufferAttribute: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let s=0,i=this.itemSize;s<i;s++)this.array[e+s]=t.array[n+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)hi.fromBufferAttribute(this,t),hi.applyMatrix3(e),this.setXY(t,hi.x,hi.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)tt.fromBufferAttribute(this,t),tt.applyMatrix3(e),this.setXYZ(t,tt.x,tt.y,tt.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)tt.fromBufferAttribute(this,t),tt.applyMatrix4(e),this.setXYZ(t,tt.x,tt.y,tt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)tt.fromBufferAttribute(this,t),tt.applyNormalMatrix(e),this.setXYZ(t,tt.x,tt.y,tt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)tt.fromBufferAttribute(this,t),tt.transformDirection(e),this.setXYZ(t,tt.x,tt.y,tt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=Fn(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=vt(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Fn(t,this.array)),t}setX(e,t){return this.normalized&&(t=vt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Fn(t,this.array)),t}setY(e,t){return this.normalized&&(t=vt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Fn(t,this.array)),t}setZ(e,t){return this.normalized&&(t=vt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Fn(t,this.array)),t}setW(e,t){return this.normalized&&(t=vt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=vt(t,this.array),n=vt(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,s){return e*=this.itemSize,this.normalized&&(t=vt(t,this.array),n=vt(n,this.array),s=vt(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this}setXYZW(e,t,n,s,i){return e*=this.itemSize,this.normalized&&(t=vt(t,this.array),n=vt(n,this.array),s=vt(s,this.array),i=vt(i,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this.array[e+3]=i,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==35044&&(e.usage=this.usage),e}}class Gs extends bt{constructor(e,t,n){super(new Uint16Array(e),t,n)}}class zs extends bt{constructor(e,t,n){super(new Uint32Array(e),t,n)}}class Ft extends bt{constructor(e,t,n){super(new Float32Array(e),t,n)}}let ta=0;const At=new st,Qi=new xt,Sn=new I,Mt=new Bn,Vn=new Bn,rt=new I;class Nt extends dn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:ta++}),this.uuid=Un(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Ms(e)?zs:Gs)(e,1):this.index=e,this}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const i=new Oe().getNormalMatrix(e);n.applyNormalMatrix(i),n.needsUpdate=!0}const s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return At.makeRotationFromQuaternion(e),this.applyMatrix4(At),this}rotateX(e){return At.makeRotationX(e),this.applyMatrix4(At),this}rotateY(e){return At.makeRotationY(e),this.applyMatrix4(At),this}rotateZ(e){return At.makeRotationZ(e),this.applyMatrix4(At),this}translate(e,t,n){return At.makeTranslation(e,t,n),this.applyMatrix4(At),this}scale(e,t,n){return At.makeScale(e,t,n),this.applyMatrix4(At),this}lookAt(e){return Qi.lookAt(e),Qi.updateMatrix(),this.applyMatrix4(Qi.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Sn).negate(),this.translate(Sn.x,Sn.y,Sn.z),this}setFromPoints(e){const t=[];for(let n=0,s=e.length;n<s;n++){const i=e[n];t.push(i.x,i.y,i.z||0)}return this.setAttribute("position",new Ft(t,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Bn);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingBox.set(new I(-1/0,-1/0,-1/0),new I(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,s=t.length;n<s;n++){const i=t[n];Mt.setFromBufferAttribute(i),this.morphTargetsRelative?(rt.addVectors(this.boundingBox.min,Mt.min),this.boundingBox.expandByPoint(rt),rt.addVectors(this.boundingBox.max,Mt.max),this.boundingBox.expandByPoint(rt)):(this.boundingBox.expandByPoint(Mt.min),this.boundingBox.expandByPoint(Mt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new si);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingSphere.set(new I,1/0);return}if(e){const n=this.boundingSphere.center;if(Mt.setFromBufferAttribute(e),t)for(let i=0,o=t.length;i<o;i++){const a=t[i];Vn.setFromBufferAttribute(a),this.morphTargetsRelative?(rt.addVectors(Mt.min,Vn.min),Mt.expandByPoint(rt),rt.addVectors(Mt.max,Vn.max),Mt.expandByPoint(rt)):(Mt.expandByPoint(Vn.min),Mt.expandByPoint(Vn.max))}Mt.getCenter(n);let s=0;for(let i=0,o=e.count;i<o;i++)rt.fromBufferAttribute(e,i),s=Math.max(s,n.distanceToSquared(rt));if(t)for(let i=0,o=t.length;i<o;i++){const a=t[i],l=this.morphTargetsRelative;for(let c=0,d=a.count;c<d;c++)rt.fromBufferAttribute(a,c),l&&(Sn.fromBufferAttribute(e,c),rt.add(Sn)),s=Math.max(s,n.distanceToSquared(rt))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.array,s=t.position.array,i=t.normal.array,o=t.uv.array,a=s.length/3;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new bt(new Float32Array(4*a),4));const l=this.getAttribute("tangent").array,c=[],d=[];for(let E=0;E<a;E++)c[E]=new I,d[E]=new I;const u=new I,f=new I,m=new I,g=new Ve,_=new Ve,p=new Ve,h=new I,T=new I;function x(E,k,Y){u.fromArray(s,E*3),f.fromArray(s,k*3),m.fromArray(s,Y*3),g.fromArray(o,E*2),_.fromArray(o,k*2),p.fromArray(o,Y*2),f.sub(u),m.sub(u),_.sub(g),p.sub(g);const ie=1/(_.x*p.y-p.x*_.y);isFinite(ie)&&(h.copy(f).multiplyScalar(p.y).addScaledVector(m,-_.y).multiplyScalar(ie),T.copy(m).multiplyScalar(_.x).addScaledVector(f,-p.x).multiplyScalar(ie),c[E].add(h),c[k].add(h),c[Y].add(h),d[E].add(T),d[k].add(T),d[Y].add(T))}let w=this.groups;w.length===0&&(w=[{start:0,count:n.length}]);for(let E=0,k=w.length;E<k;++E){const Y=w[E],ie=Y.start,R=Y.count;for(let O=ie,z=ie+R;O<z;O+=3)x(n[O+0],n[O+1],n[O+2])}const D=new I,C=new I,A=new I,$=new I;function y(E){A.fromArray(i,E*3),$.copy(A);const k=c[E];D.copy(k),D.sub(A.multiplyScalar(A.dot(k))).normalize(),C.crossVectors($,k);const ie=C.dot(d[E])<0?-1:1;l[E*4]=D.x,l[E*4+1]=D.y,l[E*4+2]=D.z,l[E*4+3]=ie}for(let E=0,k=w.length;E<k;++E){const Y=w[E],ie=Y.start,R=Y.count;for(let O=ie,z=ie+R;O<z;O+=3)y(n[O+0]),y(n[O+1]),y(n[O+2])}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new bt(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let f=0,m=n.count;f<m;f++)n.setXYZ(f,0,0,0);const s=new I,i=new I,o=new I,a=new I,l=new I,c=new I,d=new I,u=new I;if(e)for(let f=0,m=e.count;f<m;f+=3){const g=e.getX(f+0),_=e.getX(f+1),p=e.getX(f+2);s.fromBufferAttribute(t,g),i.fromBufferAttribute(t,_),o.fromBufferAttribute(t,p),d.subVectors(o,i),u.subVectors(s,i),d.cross(u),a.fromBufferAttribute(n,g),l.fromBufferAttribute(n,_),c.fromBufferAttribute(n,p),a.add(d),l.add(d),c.add(d),n.setXYZ(g,a.x,a.y,a.z),n.setXYZ(_,l.x,l.y,l.z),n.setXYZ(p,c.x,c.y,c.z)}else for(let f=0,m=t.count;f<m;f+=3)s.fromBufferAttribute(t,f+0),i.fromBufferAttribute(t,f+1),o.fromBufferAttribute(t,f+2),d.subVectors(o,i),u.subVectors(s,i),d.cross(u),n.setXYZ(f+0,d.x,d.y,d.z),n.setXYZ(f+1,d.x,d.y,d.z),n.setXYZ(f+2,d.x,d.y,d.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)rt.fromBufferAttribute(e,t),rt.normalize(),e.setXYZ(t,rt.x,rt.y,rt.z)}toNonIndexed(){function e(a,l){const c=a.array,d=a.itemSize,u=a.normalized,f=new c.constructor(l.length*d);let m=0,g=0;for(let _=0,p=l.length;_<p;_++){a.isInterleavedBufferAttribute?m=l[_]*a.data.stride+a.offset:m=l[_]*d;for(let h=0;h<d;h++)f[g++]=c[m++]}return new bt(f,d,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new Nt,n=this.index.array,s=this.attributes;for(const a in s){const l=s[a],c=e(l,n);t.setAttribute(a,c)}const i=this.morphAttributes;for(const a in i){const l=[],c=i[a];for(let d=0,u=c.length;d<u;d++){const f=c[d],m=e(f,n);l.push(m)}t.morphAttributes[a]=l}t.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let a=0,l=o.length;a<l;a++){const c=o[a];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){const e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const n=this.attributes;for(const l in n){const c=n[l];e.data.attributes[l]=c.toJSON(e.data)}const s={};let i=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],d=[];for(let u=0,f=c.length;u<f;u++){const m=c[u];d.push(m.toJSON(e.data))}d.length>0&&(s[l]=d,i=!0)}i&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));const a=this.boundingSphere;return a!==null&&(e.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const n=e.index;n!==null&&this.setIndex(n.clone(t));const s=e.attributes;for(const c in s){const d=s[c];this.setAttribute(c,d.clone(t))}const i=e.morphAttributes;for(const c in i){const d=[],u=i[c];for(let f=0,m=u.length;f<m;f++)d.push(u[f].clone(t));this.morphAttributes[c]=d}this.morphTargetsRelative=e.morphTargetsRelative;const o=e.groups;for(let c=0,d=o.length;c<d;c++){const u=o[c];this.addGroup(u.start,u.count,u.materialIndex)}const a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());const l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Hs=new st,tn=new Ls,fi=new si,Vs=new I,yn=new I,Mn=new I,En=new I,es=new I,pi=new I,mi=new Ve,gi=new Ve,_i=new Ve,Ws=new I,Xs=new I,qs=new I,vi=new I,xi=new I;class Xt extends xt{constructor(e=new Nt,t=new Ji){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let i=0,o=s.length;i<o;i++){const a=s[i].name||String(i);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=i}}}}getVertexPosition(e,t){const n=this.geometry,s=n.attributes.position,i=n.morphAttributes.position,o=n.morphTargetsRelative;t.fromBufferAttribute(s,e);const a=this.morphTargetInfluences;if(i&&a){pi.set(0,0,0);for(let l=0,c=i.length;l<c;l++){const d=a[l],u=i[l];d!==0&&(es.fromBufferAttribute(u,e),o?pi.addScaledVector(es,d):pi.addScaledVector(es.sub(t),d))}t.add(pi)}return t}raycast(e,t){const n=this.geometry,s=this.material,i=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),fi.copy(n.boundingSphere),fi.applyMatrix4(i),tn.copy(e.ray).recast(e.near),!(fi.containsPoint(tn.origin)===!1&&(tn.intersectSphere(fi,Vs)===null||tn.origin.distanceToSquared(Vs)>(e.far-e.near)**2))&&(Hs.copy(i).invert(),tn.copy(e.ray).applyMatrix4(Hs),!(n.boundingBox!==null&&tn.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,tn)))}_computeIntersections(e,t,n){let s;const i=this.geometry,o=this.material,a=i.index,l=i.attributes.position,c=i.attributes.uv,d=i.attributes.uv1,u=i.attributes.normal,f=i.groups,m=i.drawRange;if(a!==null)if(Array.isArray(o))for(let g=0,_=f.length;g<_;g++){const p=f[g],h=o[p.materialIndex],T=Math.max(p.start,m.start),x=Math.min(a.count,Math.min(p.start+p.count,m.start+m.count));for(let w=T,D=x;w<D;w+=3){const C=a.getX(w),A=a.getX(w+1),$=a.getX(w+2);s=Si(this,h,e,n,c,d,u,C,A,$),s&&(s.faceIndex=Math.floor(w/3),s.face.materialIndex=p.materialIndex,t.push(s))}}else{const g=Math.max(0,m.start),_=Math.min(a.count,m.start+m.count);for(let p=g,h=_;p<h;p+=3){const T=a.getX(p),x=a.getX(p+1),w=a.getX(p+2);s=Si(this,o,e,n,c,d,u,T,x,w),s&&(s.faceIndex=Math.floor(p/3),t.push(s))}}else if(l!==void 0)if(Array.isArray(o))for(let g=0,_=f.length;g<_;g++){const p=f[g],h=o[p.materialIndex],T=Math.max(p.start,m.start),x=Math.min(l.count,Math.min(p.start+p.count,m.start+m.count));for(let w=T,D=x;w<D;w+=3){const C=w,A=w+1,$=w+2;s=Si(this,h,e,n,c,d,u,C,A,$),s&&(s.faceIndex=Math.floor(w/3),s.face.materialIndex=p.materialIndex,t.push(s))}}else{const g=Math.max(0,m.start),_=Math.min(l.count,m.start+m.count);for(let p=g,h=_;p<h;p+=3){const T=p,x=p+1,w=p+2;s=Si(this,o,e,n,c,d,u,T,x,w),s&&(s.faceIndex=Math.floor(p/3),t.push(s))}}}}function na(r,e,t,n,s,i,o,a){let l;if(e.side===1?l=n.intersectTriangle(o,i,s,!0,a):l=n.intersectTriangle(s,i,o,e.side===0,a),l===null)return null;xi.copy(a),xi.applyMatrix4(r.matrixWorld);const c=t.ray.origin.distanceTo(xi);return c<t.near||c>t.far?null:{distance:c,point:xi.clone(),object:r}}function Si(r,e,t,n,s,i,o,a,l,c){r.getVertexPosition(a,yn),r.getVertexPosition(l,Mn),r.getVertexPosition(c,En);const d=na(r,e,t,n,yn,Mn,En,vi);if(d){s&&(mi.fromBufferAttribute(s,a),gi.fromBufferAttribute(s,l),_i.fromBufferAttribute(s,c),d.uv=Dt.getInterpolation(vi,yn,Mn,En,mi,gi,_i,new Ve)),i&&(mi.fromBufferAttribute(i,a),gi.fromBufferAttribute(i,l),_i.fromBufferAttribute(i,c),d.uv1=Dt.getInterpolation(vi,yn,Mn,En,mi,gi,_i,new Ve),d.uv2=d.uv1),o&&(Ws.fromBufferAttribute(o,a),Xs.fromBufferAttribute(o,l),qs.fromBufferAttribute(o,c),d.normal=Dt.getInterpolation(vi,yn,Mn,En,Ws,Xs,qs,new I),d.normal.dot(n.direction)>0&&d.normal.multiplyScalar(-1));const u={a,b:l,c,normal:new I,materialIndex:0};Dt.getNormal(yn,Mn,En,u.normal),d.face=u}return d}class Wn extends Nt{constructor(e=1,t=1,n=1,s=1,i=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:s,heightSegments:i,depthSegments:o};const a=this;s=Math.floor(s),i=Math.floor(i),o=Math.floor(o);const l=[],c=[],d=[],u=[];let f=0,m=0;g("z","y","x",-1,-1,n,t,e,o,i,0),g("z","y","x",1,-1,n,t,-e,o,i,1),g("x","z","y",1,1,e,n,t,s,o,2),g("x","z","y",1,-1,e,n,-t,s,o,3),g("x","y","z",1,-1,e,t,n,s,i,4),g("x","y","z",-1,-1,e,t,-n,s,i,5),this.setIndex(l),this.setAttribute("position",new Ft(c,3)),this.setAttribute("normal",new Ft(d,3)),this.setAttribute("uv",new Ft(u,2));function g(_,p,h,T,x,w,D,C,A,$,y){const E=w/A,k=D/$,Y=w/2,ie=D/2,R=C/2,O=A+1,z=$+1;let X=0,V=0;const H=new I;for(let K=0;K<z;K++){const J=K*k-ie;for(let le=0;le<O;le++){const G=le*E-Y;H[_]=G*T,H[p]=J*x,H[h]=R,c.push(H.x,H.y,H.z),H[_]=0,H[p]=0,H[h]=C>0?1:-1,d.push(H.x,H.y,H.z),u.push(le/A),u.push(1-K/$),X+=1}}for(let K=0;K<$;K++)for(let J=0;J<A;J++){const le=f+J+O*K,G=f+J+O*(K+1),q=f+(J+1)+O*(K+1),ae=f+(J+1)+O*K;l.push(le,G,ae),l.push(G,q,ae),V+=6}a.addGroup(m,V,y),m+=V,f+=X}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Wn(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}function Tn(r){const e={};for(const t in r){e[t]={};for(const n in r[t]){const s=r[t][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=s.clone():Array.isArray(s)?e[t][n]=s.slice():e[t][n]=s}}return e}function ft(r){const e={};for(let t=0;t<r.length;t++){const n=Tn(r[t]);for(const s in n)e[s]=n[s]}return e}function ia(r){const e=[];for(let t=0;t<r.length;t++)e.push(r[t].clone());return e}function $s(r){return r.getRenderTarget()===null?r.outputColorSpace:We.workingColorSpace}const sa={clone:Tn,merge:ft};var ra=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,aa=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class nn extends Hn{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=ra,this.fragmentShader=aa,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={derivatives:!1,fragDepth:!1,drawBuffers:!1,shaderTextureLOD:!1,clipCullDistance:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Tn(e.uniforms),this.uniformsGroups=ia(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const s in this.uniforms){const o=this.uniforms[s].value;o&&o.isTexture?t.uniforms[s]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[s]={type:"m4",value:o.toArray()}:t.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const n={};for(const s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}}class Ys extends xt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new st,this.projectionMatrix=new st,this.projectionMatrixInverse=new st,this.coordinateSystem=2e3}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}class It extends Ys{constructor(e=50,t=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=Fi*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(Ui*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Fi*2*Math.atan(Math.tan(Ui*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}setViewOffset(e,t,n,s,i,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=i,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(Ui*.5*this.fov)/this.zoom,n=2*t,s=this.aspect*n,i=-.5*s;const o=this.view;if(this.view!==null&&this.view.enabled){const l=o.fullWidth,c=o.fullHeight;i+=o.offsetX*s/l,t-=o.offsetY*n/c,s*=o.width/l,n*=o.height/c}const a=this.filmOffset;a!==0&&(i+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(i,i+s,t,t-n,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}const bn=-90,An=1;class oa extends xt{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const s=new It(bn,An,e,t);s.layers=this.layers,this.add(s);const i=new It(bn,An,e,t);i.layers=this.layers,this.add(i);const o=new It(bn,An,e,t);o.layers=this.layers,this.add(o);const a=new It(bn,An,e,t);a.layers=this.layers,this.add(a);const l=new It(bn,An,e,t);l.layers=this.layers,this.add(l);const c=new It(bn,An,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[n,s,i,o,a,l]=t;for(const c of t)this.remove(c);if(e===2e3)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),i.up.set(0,0,-1),i.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===2001)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),i.up.set(0,0,1),i.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[i,o,a,l,c,d]=this.children,u=e.getRenderTarget(),f=e.getActiveCubeFace(),m=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;const _=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0,s),e.render(t,i),e.setRenderTarget(n,1,s),e.render(t,o),e.setRenderTarget(n,2,s),e.render(t,a),e.setRenderTarget(n,3,s),e.render(t,l),e.setRenderTarget(n,4,s),e.render(t,c),n.texture.generateMipmaps=_,e.setRenderTarget(n,5,s),e.render(t,d),e.setRenderTarget(u,f,m),e.xr.enabled=g,n.texture.needsPMREMUpdate=!0}}class Ks extends St{constructor(e,t,n,s,i,o,a,l,c,d){e=e!==void 0?e:[],t=t!==void 0?t:301,super(e,t,n,s,i,o,a,l,c,d),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class la extends Jt{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const n={width:e,height:e,depth:1},s=[n,n,n,n,n,n];t.encoding!==void 0&&(Nn("THREE.WebGLCubeRenderTarget: option.encoding has been replaced by option.colorSpace."),t.colorSpace=t.encoding===3001?lt:Tt),this.texture=new Ks(s,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:1006}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},s=new Wn(5,5,5),i=new nn({name:"CubemapFromEquirect",uniforms:Tn(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:1,blending:0});i.uniforms.tEquirect.value=t;const o=new Xt(s,i),a=t.minFilter;return t.minFilter===1008&&(t.minFilter=1006),new oa(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t,n,s){const i=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,n,s);e.setRenderTarget(i)}}const ts=new I,ca=new I,da=new Oe;class sn{constructor(e=new I(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,s){return this.normal.set(e,t,n),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){const s=ts.subVectors(n,t).cross(ca.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){const n=e.delta(ts),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const i=-(e.start.dot(this.normal)+this.constant)/s;return i<0||i>1?null:t.copy(e.start).addScaledVector(n,i)}intersectsLine(e){const t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const n=t||da.getNormalMatrix(e),s=this.coplanarPoint(ts).applyMatrix4(e),i=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(i),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const rn=new si,yi=new I;class js{constructor(e=new sn,t=new sn,n=new sn,s=new sn,i=new sn,o=new sn){this.planes=[e,t,n,s,i,o]}set(e,t,n,s,i,o){const a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(n),a[3].copy(s),a[4].copy(i),a[5].copy(o),this}copy(e){const t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=2e3){const n=this.planes,s=e.elements,i=s[0],o=s[1],a=s[2],l=s[3],c=s[4],d=s[5],u=s[6],f=s[7],m=s[8],g=s[9],_=s[10],p=s[11],h=s[12],T=s[13],x=s[14],w=s[15];if(n[0].setComponents(l-i,f-c,p-m,w-h).normalize(),n[1].setComponents(l+i,f+c,p+m,w+h).normalize(),n[2].setComponents(l+o,f+d,p+g,w+T).normalize(),n[3].setComponents(l-o,f-d,p-g,w-T).normalize(),n[4].setComponents(l-a,f-u,p-_,w-x).normalize(),t===2e3)n[5].setComponents(l+a,f+u,p+_,w+x).normalize();else if(t===2001)n[5].setComponents(a,u,_,x).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),rn.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),rn.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(rn)}intersectsSprite(e){return rn.center.set(0,0,0),rn.radius=.7071067811865476,rn.applyMatrix4(e.matrixWorld),this.intersectsSphere(rn)}intersectsSphere(e){const t=this.planes,n=e.center,s=-e.radius;for(let i=0;i<6;i++)if(t[i].distanceToPoint(n)<s)return!1;return!0}intersectsBox(e){const t=this.planes;for(let n=0;n<6;n++){const s=t[n];if(yi.x=s.normal.x>0?e.max.x:e.min.x,yi.y=s.normal.y>0?e.max.y:e.min.y,yi.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(yi)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function Zs(){let r=null,e=!1,t=null,n=null;function s(i,o){t(i,o),n=r.requestAnimationFrame(s)}return{start:function(){e!==!0&&t!==null&&(n=r.requestAnimationFrame(s),e=!0)},stop:function(){r.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(i){t=i},setContext:function(i){r=i}}}function ua(r,e){const t=e.isWebGL2,n=new WeakMap;function s(c,d){const u=c.array,f=c.usage,m=u.byteLength,g=r.createBuffer();r.bindBuffer(d,g),r.bufferData(d,u,f),c.onUploadCallback();let _;if(u instanceof Float32Array)_=r.FLOAT;else if(u instanceof Uint16Array)if(c.isFloat16BufferAttribute)if(t)_=r.HALF_FLOAT;else throw new Error("THREE.WebGLAttributes: Usage of Float16BufferAttribute requires WebGL2.");else _=r.UNSIGNED_SHORT;else if(u instanceof Int16Array)_=r.SHORT;else if(u instanceof Uint32Array)_=r.UNSIGNED_INT;else if(u instanceof Int32Array)_=r.INT;else if(u instanceof Int8Array)_=r.BYTE;else if(u instanceof Uint8Array)_=r.UNSIGNED_BYTE;else if(u instanceof Uint8ClampedArray)_=r.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+u);return{buffer:g,type:_,bytesPerElement:u.BYTES_PER_ELEMENT,version:c.version,size:m}}function i(c,d,u){const f=d.array,m=d._updateRange,g=d.updateRanges;if(r.bindBuffer(u,c),m.count===-1&&g.length===0&&r.bufferSubData(u,0,f),g.length!==0){for(let _=0,p=g.length;_<p;_++){const h=g[_];t?r.bufferSubData(u,h.start*f.BYTES_PER_ELEMENT,f,h.start,h.count):r.bufferSubData(u,h.start*f.BYTES_PER_ELEMENT,f.subarray(h.start,h.start+h.count))}d.clearUpdateRanges()}m.count!==-1&&(t?r.bufferSubData(u,m.offset*f.BYTES_PER_ELEMENT,f,m.offset,m.count):r.bufferSubData(u,m.offset*f.BYTES_PER_ELEMENT,f.subarray(m.offset,m.offset+m.count)),m.count=-1),d.onUploadCallback()}function o(c){return c.isInterleavedBufferAttribute&&(c=c.data),n.get(c)}function a(c){c.isInterleavedBufferAttribute&&(c=c.data);const d=n.get(c);d&&(r.deleteBuffer(d.buffer),n.delete(c))}function l(c,d){if(c.isGLBufferAttribute){const f=n.get(c);(!f||f.version<c.version)&&n.set(c,{buffer:c.buffer,type:c.type,bytesPerElement:c.elementSize,version:c.version});return}c.isInterleavedBufferAttribute&&(c=c.data);const u=n.get(c);if(u===void 0)n.set(c,s(c,d));else if(u.version<c.version){if(u.size!==c.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(u.buffer,c,d),u.version=c.version}}return{get:o,remove:a,update:l}}class ns extends Nt{constructor(e=1,t=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:s};const i=e/2,o=t/2,a=Math.floor(n),l=Math.floor(s),c=a+1,d=l+1,u=e/a,f=t/l,m=[],g=[],_=[],p=[];for(let h=0;h<d;h++){const T=h*f-o;for(let x=0;x<c;x++){const w=x*u-i;g.push(w,-T,0),_.push(0,0,1),p.push(x/a),p.push(1-h/l)}}for(let h=0;h<l;h++)for(let T=0;T<a;T++){const x=T+c*h,w=T+c*(h+1),D=T+1+c*(h+1),C=T+1+c*h;m.push(x,w,C),m.push(w,D,C)}this.setIndex(m),this.setAttribute("position",new Ft(g,3)),this.setAttribute("normal",new Ft(_,3)),this.setAttribute("uv",new Ft(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new ns(e.width,e.height,e.widthSegments,e.heightSegments)}}var ha=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,fa=`#ifdef USE_ALPHAHASH
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
#endif`,pa=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,ma=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,ga=`#ifdef USE_ALPHATEST
	if ( diffuseColor.a < alphaTest ) discard;
#endif`,_a=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,va=`#ifdef USE_AOMAP
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
#endif`,xa=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Sa=`#ifdef USE_BATCHING
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
#endif`,ya=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( batchId );
#endif`,Ma=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Ea=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Ta=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,ba=`#ifdef USE_IRIDESCENCE
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
#endif`,Aa=`#ifdef USE_BUMPMAP
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
#endif`,wa=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,Ca=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Ra=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,La=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Pa=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Da=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Ia=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	varying vec3 vColor;
#endif`,Ua=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif`,Fa=`#define PI 3.141592653589793
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
} // validated`,Na=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,Oa=`vec3 transformedNormal = objectNormal;
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
#endif`,Ba=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,ka=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Ga=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,za=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Ha="gl_FragColor = linearToOutputTexel( gl_FragColor );",Va=`
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
}`,Wa=`#ifdef USE_ENVMAP
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
#endif`,Xa=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,qa=`#ifdef USE_ENVMAP
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
#endif`,$a=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Ya=`#ifdef USE_ENVMAP
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
#endif`,Ka=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,ja=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Za=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Ja=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Qa=`#ifdef USE_GRADIENTMAP
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
}`,eo=`#ifdef USE_LIGHTMAP
	vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
	vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
	reflectedLight.indirectDiffuse += lightMapIrradiance;
#endif`,to=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,no=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,io=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,so=`uniform bool receiveShadow;
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
#endif`,ro=`#ifdef USE_ENVMAP
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
#endif`,ao=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,oo=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,lo=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,co=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,uo=`PhysicalMaterial material;
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
#endif`,ho=`struct PhysicalMaterial {
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
}`,fo=`
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
#endif`,po=`#if defined( RE_IndirectDiffuse )
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
#endif`,mo=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,go=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	gl_FragDepthEXT = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,_o=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,vo=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		varying float vFragDepth;
		varying float vIsPerspective;
	#else
		uniform float logDepthBufFC;
	#endif
#endif`,xo=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		vFragDepth = 1.0 + gl_Position.w;
		vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
	#else
		if ( isPerspectiveMatrix( projectionMatrix ) ) {
			gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;
			gl_Position.z *= gl_Position.w;
		}
	#endif
#endif`,So=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,yo=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Mo=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,Eo=`#if defined( USE_POINTS_UV )
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
#endif`,To=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,bo=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Ao=`#if defined( USE_MORPHCOLORS ) && defined( MORPHTARGETS_TEXTURE )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,wo=`#ifdef USE_MORPHNORMALS
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
#endif`,Co=`#ifdef USE_MORPHTARGETS
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
#endif`,Ro=`#ifdef USE_MORPHTARGETS
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
#endif`,Lo=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,Po=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,Do=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Io=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Uo=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Fo=`#ifdef USE_NORMALMAP
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
#endif`,No=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Oo=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Bo=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,ko=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Go=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,zo=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,Ho=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Vo=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Wo=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Xo=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,qo=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,$o=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Yo=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Ko=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,jo=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,Zo=`float getShadowMask() {
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
}`,Jo=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Qo=`#ifdef USE_SKINNING
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
#endif`,el=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,tl=`#ifdef USE_SKINNING
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
#endif`,nl=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,il=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,sl=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,rl=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,al=`#ifdef USE_TRANSMISSION
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
#endif`,ol=`#ifdef USE_TRANSMISSION
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
#endif`,ll=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,cl=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,dl=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,ul=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const De={alphahash_fragment:ha,alphahash_pars_fragment:fa,alphamap_fragment:pa,alphamap_pars_fragment:ma,alphatest_fragment:ga,alphatest_pars_fragment:_a,aomap_fragment:va,aomap_pars_fragment:xa,batching_pars_vertex:Sa,batching_vertex:ya,begin_vertex:Ma,beginnormal_vertex:Ea,bsdfs:Ta,iridescence_fragment:ba,bumpmap_pars_fragment:Aa,clipping_planes_fragment:wa,clipping_planes_pars_fragment:Ca,clipping_planes_pars_vertex:Ra,clipping_planes_vertex:La,color_fragment:Pa,color_pars_fragment:Da,color_pars_vertex:Ia,color_vertex:Ua,common:Fa,cube_uv_reflection_fragment:Na,defaultnormal_vertex:Oa,displacementmap_pars_vertex:Ba,displacementmap_vertex:ka,emissivemap_fragment:Ga,emissivemap_pars_fragment:za,colorspace_fragment:Ha,colorspace_pars_fragment:Va,envmap_fragment:Wa,envmap_common_pars_fragment:Xa,envmap_pars_fragment:qa,envmap_pars_vertex:$a,envmap_physical_pars_fragment:ro,envmap_vertex:Ya,fog_vertex:Ka,fog_pars_vertex:ja,fog_fragment:Za,fog_pars_fragment:Ja,gradientmap_pars_fragment:Qa,lightmap_fragment:eo,lightmap_pars_fragment:to,lights_lambert_fragment:no,lights_lambert_pars_fragment:io,lights_pars_begin:so,lights_toon_fragment:ao,lights_toon_pars_fragment:oo,lights_phong_fragment:lo,lights_phong_pars_fragment:co,lights_physical_fragment:uo,lights_physical_pars_fragment:ho,lights_fragment_begin:fo,lights_fragment_maps:po,lights_fragment_end:mo,logdepthbuf_fragment:go,logdepthbuf_pars_fragment:_o,logdepthbuf_pars_vertex:vo,logdepthbuf_vertex:xo,map_fragment:So,map_pars_fragment:yo,map_particle_fragment:Mo,map_particle_pars_fragment:Eo,metalnessmap_fragment:To,metalnessmap_pars_fragment:bo,morphcolor_vertex:Ao,morphnormal_vertex:wo,morphtarget_pars_vertex:Co,morphtarget_vertex:Ro,normal_fragment_begin:Lo,normal_fragment_maps:Po,normal_pars_fragment:Do,normal_pars_vertex:Io,normal_vertex:Uo,normalmap_pars_fragment:Fo,clearcoat_normal_fragment_begin:No,clearcoat_normal_fragment_maps:Oo,clearcoat_pars_fragment:Bo,iridescence_pars_fragment:ko,opaque_fragment:Go,packing:zo,premultiplied_alpha_fragment:Ho,project_vertex:Vo,dithering_fragment:Wo,dithering_pars_fragment:Xo,roughnessmap_fragment:qo,roughnessmap_pars_fragment:$o,shadowmap_pars_fragment:Yo,shadowmap_pars_vertex:Ko,shadowmap_vertex:jo,shadowmask_pars_fragment:Zo,skinbase_vertex:Jo,skinning_pars_vertex:Qo,skinning_vertex:el,skinnormal_vertex:tl,specularmap_fragment:nl,specularmap_pars_fragment:il,tonemapping_fragment:sl,tonemapping_pars_fragment:rl,transmission_fragment:al,transmission_pars_fragment:ol,uv_pars_fragment:ll,uv_pars_vertex:cl,uv_vertex:dl,worldpos_vertex:ul,background_vert:`varying vec2 vUv;
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
}`},te={common:{diffuse:{value:new ze(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Oe},alphaMap:{value:null},alphaMapTransform:{value:new Oe},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Oe}},envmap:{envMap:{value:null},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Oe}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Oe}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Oe},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Oe},normalScale:{value:new Ve(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Oe},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Oe}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Oe}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Oe}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new ze(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new ze(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Oe},alphaTest:{value:0},uvTransform:{value:new Oe}},sprite:{diffuse:{value:new ze(16777215)},opacity:{value:1},center:{value:new Ve(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Oe},alphaMap:{value:null},alphaMapTransform:{value:new Oe},alphaTest:{value:0}}},Ot={basic:{uniforms:ft([te.common,te.specularmap,te.envmap,te.aomap,te.lightmap,te.fog]),vertexShader:De.meshbasic_vert,fragmentShader:De.meshbasic_frag},lambert:{uniforms:ft([te.common,te.specularmap,te.envmap,te.aomap,te.lightmap,te.emissivemap,te.bumpmap,te.normalmap,te.displacementmap,te.fog,te.lights,{emissive:{value:new ze(0)}}]),vertexShader:De.meshlambert_vert,fragmentShader:De.meshlambert_frag},phong:{uniforms:ft([te.common,te.specularmap,te.envmap,te.aomap,te.lightmap,te.emissivemap,te.bumpmap,te.normalmap,te.displacementmap,te.fog,te.lights,{emissive:{value:new ze(0)},specular:{value:new ze(1118481)},shininess:{value:30}}]),vertexShader:De.meshphong_vert,fragmentShader:De.meshphong_frag},standard:{uniforms:ft([te.common,te.envmap,te.aomap,te.lightmap,te.emissivemap,te.bumpmap,te.normalmap,te.displacementmap,te.roughnessmap,te.metalnessmap,te.fog,te.lights,{emissive:{value:new ze(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:De.meshphysical_vert,fragmentShader:De.meshphysical_frag},toon:{uniforms:ft([te.common,te.aomap,te.lightmap,te.emissivemap,te.bumpmap,te.normalmap,te.displacementmap,te.gradientmap,te.fog,te.lights,{emissive:{value:new ze(0)}}]),vertexShader:De.meshtoon_vert,fragmentShader:De.meshtoon_frag},matcap:{uniforms:ft([te.common,te.bumpmap,te.normalmap,te.displacementmap,te.fog,{matcap:{value:null}}]),vertexShader:De.meshmatcap_vert,fragmentShader:De.meshmatcap_frag},points:{uniforms:ft([te.points,te.fog]),vertexShader:De.points_vert,fragmentShader:De.points_frag},dashed:{uniforms:ft([te.common,te.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:De.linedashed_vert,fragmentShader:De.linedashed_frag},depth:{uniforms:ft([te.common,te.displacementmap]),vertexShader:De.depth_vert,fragmentShader:De.depth_frag},normal:{uniforms:ft([te.common,te.bumpmap,te.normalmap,te.displacementmap,{opacity:{value:1}}]),vertexShader:De.meshnormal_vert,fragmentShader:De.meshnormal_frag},sprite:{uniforms:ft([te.sprite,te.fog]),vertexShader:De.sprite_vert,fragmentShader:De.sprite_frag},background:{uniforms:{uvTransform:{value:new Oe},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:De.background_vert,fragmentShader:De.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1}},vertexShader:De.backgroundCube_vert,fragmentShader:De.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:De.cube_vert,fragmentShader:De.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:De.equirect_vert,fragmentShader:De.equirect_frag},distanceRGBA:{uniforms:ft([te.common,te.displacementmap,{referencePosition:{value:new I},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:De.distanceRGBA_vert,fragmentShader:De.distanceRGBA_frag},shadow:{uniforms:ft([te.lights,te.fog,{color:{value:new ze(0)},opacity:{value:1}}]),vertexShader:De.shadow_vert,fragmentShader:De.shadow_frag}};Ot.physical={uniforms:ft([Ot.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Oe},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Oe},clearcoatNormalScale:{value:new Ve(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Oe},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Oe},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Oe},sheen:{value:0},sheenColor:{value:new ze(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Oe},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Oe},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Oe},transmissionSamplerSize:{value:new Ve},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Oe},attenuationDistance:{value:0},attenuationColor:{value:new ze(0)},specularColor:{value:new ze(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Oe},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Oe},anisotropyVector:{value:new Ve},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Oe}}]),vertexShader:De.meshphysical_vert,fragmentShader:De.meshphysical_frag};const Mi={r:0,b:0,g:0};function hl(r,e,t,n,s,i,o){const a=new ze(0);let l=i===!0?0:1,c,d,u=null,f=0,m=null;function g(p,h){let T=!1,x=h.isScene===!0?h.background:null;x&&x.isTexture&&(x=(h.backgroundBlurriness>0?t:e).get(x)),x===null?_(a,l):x&&x.isColor&&(_(x,1),T=!0);const w=r.xr.getEnvironmentBlendMode();w==="additive"?n.buffers.color.setClear(0,0,0,1,o):w==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(r.autoClear||T)&&r.clear(r.autoClearColor,r.autoClearDepth,r.autoClearStencil),x&&(x.isCubeTexture||x.mapping===306)?(d===void 0&&(d=new Xt(new Wn(1,1,1),new nn({name:"BackgroundCubeMaterial",uniforms:Tn(Ot.backgroundCube.uniforms),vertexShader:Ot.backgroundCube.vertexShader,fragmentShader:Ot.backgroundCube.fragmentShader,side:1,depthTest:!1,depthWrite:!1,fog:!1})),d.geometry.deleteAttribute("normal"),d.geometry.deleteAttribute("uv"),d.onBeforeRender=function(D,C,A){this.matrixWorld.copyPosition(A.matrixWorld)},Object.defineProperty(d.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(d)),d.material.uniforms.envMap.value=x,d.material.uniforms.flipEnvMap.value=x.isCubeTexture&&x.isRenderTargetTexture===!1?-1:1,d.material.uniforms.backgroundBlurriness.value=h.backgroundBlurriness,d.material.uniforms.backgroundIntensity.value=h.backgroundIntensity,d.material.toneMapped=We.getTransfer(x.colorSpace)!==Ke,(u!==x||f!==x.version||m!==r.toneMapping)&&(d.material.needsUpdate=!0,u=x,f=x.version,m=r.toneMapping),d.layers.enableAll(),p.unshift(d,d.geometry,d.material,0,0,null)):x&&x.isTexture&&(c===void 0&&(c=new Xt(new ns(2,2),new nn({name:"BackgroundMaterial",uniforms:Tn(Ot.background.uniforms),vertexShader:Ot.background.vertexShader,fragmentShader:Ot.background.fragmentShader,side:0,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=x,c.material.uniforms.backgroundIntensity.value=h.backgroundIntensity,c.material.toneMapped=We.getTransfer(x.colorSpace)!==Ke,x.matrixAutoUpdate===!0&&x.updateMatrix(),c.material.uniforms.uvTransform.value.copy(x.matrix),(u!==x||f!==x.version||m!==r.toneMapping)&&(c.material.needsUpdate=!0,u=x,f=x.version,m=r.toneMapping),c.layers.enableAll(),p.unshift(c,c.geometry,c.material,0,0,null))}function _(p,h){p.getRGB(Mi,$s(r)),n.buffers.color.setClear(Mi.r,Mi.g,Mi.b,h,o)}return{getClearColor:function(){return a},setClearColor:function(p,h=1){a.set(p),l=h,_(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(p){l=p,_(a,l)},render:g}}function fl(r,e,t,n){const s=r.getParameter(r.MAX_VERTEX_ATTRIBS),i=n.isWebGL2?null:e.get("OES_vertex_array_object"),o=n.isWebGL2||i!==null,a={},l=p(null);let c=l,d=!1;function u(R,O,z,X,V){let H=!1;if(o){const K=_(X,z,O);c!==K&&(c=K,m(c.object)),H=h(R,X,z,V),H&&T(R,X,z,V)}else{const K=O.wireframe===!0;(c.geometry!==X.id||c.program!==z.id||c.wireframe!==K)&&(c.geometry=X.id,c.program=z.id,c.wireframe=K,H=!0)}V!==null&&t.update(V,r.ELEMENT_ARRAY_BUFFER),(H||d)&&(d=!1,$(R,O,z,X),V!==null&&r.bindBuffer(r.ELEMENT_ARRAY_BUFFER,t.get(V).buffer))}function f(){return n.isWebGL2?r.createVertexArray():i.createVertexArrayOES()}function m(R){return n.isWebGL2?r.bindVertexArray(R):i.bindVertexArrayOES(R)}function g(R){return n.isWebGL2?r.deleteVertexArray(R):i.deleteVertexArrayOES(R)}function _(R,O,z){const X=z.wireframe===!0;let V=a[R.id];V===void 0&&(V={},a[R.id]=V);let H=V[O.id];H===void 0&&(H={},V[O.id]=H);let K=H[X];return K===void 0&&(K=p(f()),H[X]=K),K}function p(R){const O=[],z=[],X=[];for(let V=0;V<s;V++)O[V]=0,z[V]=0,X[V]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:O,enabledAttributes:z,attributeDivisors:X,object:R,attributes:{},index:null}}function h(R,O,z,X){const V=c.attributes,H=O.attributes;let K=0;const J=z.getAttributes();for(const le in J)if(J[le].location>=0){const q=V[le];let ae=H[le];if(ae===void 0&&(le==="instanceMatrix"&&R.instanceMatrix&&(ae=R.instanceMatrix),le==="instanceColor"&&R.instanceColor&&(ae=R.instanceColor)),q===void 0||q.attribute!==ae||ae&&q.data!==ae.data)return!0;K++}return c.attributesNum!==K||c.index!==X}function T(R,O,z,X){const V={},H=O.attributes;let K=0;const J=z.getAttributes();for(const le in J)if(J[le].location>=0){let q=H[le];q===void 0&&(le==="instanceMatrix"&&R.instanceMatrix&&(q=R.instanceMatrix),le==="instanceColor"&&R.instanceColor&&(q=R.instanceColor));const ae={};ae.attribute=q,q&&q.data&&(ae.data=q.data),V[le]=ae,K++}c.attributes=V,c.attributesNum=K,c.index=X}function x(){const R=c.newAttributes;for(let O=0,z=R.length;O<z;O++)R[O]=0}function w(R){D(R,0)}function D(R,O){const z=c.newAttributes,X=c.enabledAttributes,V=c.attributeDivisors;z[R]=1,X[R]===0&&(r.enableVertexAttribArray(R),X[R]=1),V[R]!==O&&((n.isWebGL2?r:e.get("ANGLE_instanced_arrays"))[n.isWebGL2?"vertexAttribDivisor":"vertexAttribDivisorANGLE"](R,O),V[R]=O)}function C(){const R=c.newAttributes,O=c.enabledAttributes;for(let z=0,X=O.length;z<X;z++)O[z]!==R[z]&&(r.disableVertexAttribArray(z),O[z]=0)}function A(R,O,z,X,V,H,K){K===!0?r.vertexAttribIPointer(R,O,z,V,H):r.vertexAttribPointer(R,O,z,X,V,H)}function $(R,O,z,X){if(n.isWebGL2===!1&&(R.isInstancedMesh||X.isInstancedBufferGeometry)&&e.get("ANGLE_instanced_arrays")===null)return;x();const V=X.attributes,H=z.getAttributes(),K=O.defaultAttributeValues;for(const J in H){const le=H[J];if(le.location>=0){let G=V[J];if(G===void 0&&(J==="instanceMatrix"&&R.instanceMatrix&&(G=R.instanceMatrix),J==="instanceColor"&&R.instanceColor&&(G=R.instanceColor)),G!==void 0){const q=G.normalized,ae=G.itemSize,pe=t.get(G);if(pe===void 0)continue;const fe=pe.buffer,Ae=pe.type,we=pe.bytesPerElement,xe=n.isWebGL2===!0&&(Ae===r.INT||Ae===r.UNSIGNED_INT||G.gpuType===1013);if(G.isInterleavedBufferAttribute){const he=G.data,L=he.stride,pt=G.offset;if(he.isInstancedInterleavedBuffer){for(let Se=0;Se<le.locationSize;Se++)D(le.location+Se,he.meshPerAttribute);R.isInstancedMesh!==!0&&X._maxInstanceCount===void 0&&(X._maxInstanceCount=he.meshPerAttribute*he.count)}else for(let Se=0;Se<le.locationSize;Se++)w(le.location+Se);r.bindBuffer(r.ARRAY_BUFFER,fe);for(let Se=0;Se<le.locationSize;Se++)A(le.location+Se,ae/le.locationSize,Ae,q,L*we,(pt+ae/le.locationSize*Se)*we,xe)}else{if(G.isInstancedBufferAttribute){for(let he=0;he<le.locationSize;he++)D(le.location+he,G.meshPerAttribute);R.isInstancedMesh!==!0&&X._maxInstanceCount===void 0&&(X._maxInstanceCount=G.meshPerAttribute*G.count)}else for(let he=0;he<le.locationSize;he++)w(le.location+he);r.bindBuffer(r.ARRAY_BUFFER,fe);for(let he=0;he<le.locationSize;he++)A(le.location+he,ae/le.locationSize,Ae,q,ae*we,ae/le.locationSize*he*we,xe)}}else if(K!==void 0){const q=K[J];if(q!==void 0)switch(q.length){case 2:r.vertexAttrib2fv(le.location,q);break;case 3:r.vertexAttrib3fv(le.location,q);break;case 4:r.vertexAttrib4fv(le.location,q);break;default:r.vertexAttrib1fv(le.location,q)}}}}C()}function y(){Y();for(const R in a){const O=a[R];for(const z in O){const X=O[z];for(const V in X)g(X[V].object),delete X[V];delete O[z]}delete a[R]}}function E(R){if(a[R.id]===void 0)return;const O=a[R.id];for(const z in O){const X=O[z];for(const V in X)g(X[V].object),delete X[V];delete O[z]}delete a[R.id]}function k(R){for(const O in a){const z=a[O];if(z[R.id]===void 0)continue;const X=z[R.id];for(const V in X)g(X[V].object),delete X[V];delete z[R.id]}}function Y(){ie(),d=!0,c!==l&&(c=l,m(c.object))}function ie(){l.geometry=null,l.program=null,l.wireframe=!1}return{setup:u,reset:Y,resetDefaultState:ie,dispose:y,releaseStatesOfGeometry:E,releaseStatesOfProgram:k,initAttributes:x,enableAttribute:w,disableUnusedAttributes:C}}function pl(r,e,t,n){const s=n.isWebGL2;let i;function o(d){i=d}function a(d,u){r.drawArrays(i,d,u),t.update(u,i,1)}function l(d,u,f){if(f===0)return;let m,g;if(s)m=r,g="drawArraysInstanced";else if(m=e.get("ANGLE_instanced_arrays"),g="drawArraysInstancedANGLE",m===null){console.error("THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}m[g](i,d,u,f),t.update(u,i,f)}function c(d,u,f){if(f===0)return;const m=e.get("WEBGL_multi_draw");if(m===null)for(let g=0;g<f;g++)this.render(d[g],u[g]);else{m.multiDrawArraysWEBGL(i,d,0,u,0,f);let g=0;for(let _=0;_<f;_++)g+=u[_];t.update(g,i,1)}}this.setMode=o,this.render=a,this.renderInstances=l,this.renderMultiDraw=c}function ml(r,e,t){let n;function s(){if(n!==void 0)return n;if(e.has("EXT_texture_filter_anisotropic")===!0){const A=e.get("EXT_texture_filter_anisotropic");n=r.getParameter(A.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else n=0;return n}function i(A){if(A==="highp"){if(r.getShaderPrecisionFormat(r.VERTEX_SHADER,r.HIGH_FLOAT).precision>0&&r.getShaderPrecisionFormat(r.FRAGMENT_SHADER,r.HIGH_FLOAT).precision>0)return"highp";A="mediump"}return A==="mediump"&&r.getShaderPrecisionFormat(r.VERTEX_SHADER,r.MEDIUM_FLOAT).precision>0&&r.getShaderPrecisionFormat(r.FRAGMENT_SHADER,r.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}const o=typeof WebGL2RenderingContext<"u"&&r.constructor.name==="WebGL2RenderingContext";let a=t.precision!==void 0?t.precision:"highp";const l=i(a);l!==a&&(console.warn("THREE.WebGLRenderer:",a,"not supported, using",l,"instead."),a=l);const c=o||e.has("WEBGL_draw_buffers"),d=t.logarithmicDepthBuffer===!0,u=r.getParameter(r.MAX_TEXTURE_IMAGE_UNITS),f=r.getParameter(r.MAX_VERTEX_TEXTURE_IMAGE_UNITS),m=r.getParameter(r.MAX_TEXTURE_SIZE),g=r.getParameter(r.MAX_CUBE_MAP_TEXTURE_SIZE),_=r.getParameter(r.MAX_VERTEX_ATTRIBS),p=r.getParameter(r.MAX_VERTEX_UNIFORM_VECTORS),h=r.getParameter(r.MAX_VARYING_VECTORS),T=r.getParameter(r.MAX_FRAGMENT_UNIFORM_VECTORS),x=f>0,w=o||e.has("OES_texture_float"),D=x&&w,C=o?r.getParameter(r.MAX_SAMPLES):0;return{isWebGL2:o,drawBuffers:c,getMaxAnisotropy:s,getMaxPrecision:i,precision:a,logarithmicDepthBuffer:d,maxTextures:u,maxVertexTextures:f,maxTextureSize:m,maxCubemapSize:g,maxAttributes:_,maxVertexUniforms:p,maxVaryings:h,maxFragmentUniforms:T,vertexTextures:x,floatFragmentTextures:w,floatVertexTextures:D,maxSamples:C}}function gl(r){const e=this;let t=null,n=0,s=!1,i=!1;const o=new sn,a=new Oe,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,f){const m=u.length!==0||f||n!==0||s;return s=f,n=u.length,m},this.beginShadows=function(){i=!0,d(null)},this.endShadows=function(){i=!1},this.setGlobalState=function(u,f){t=d(u,f,0)},this.setState=function(u,f,m){const g=u.clippingPlanes,_=u.clipIntersection,p=u.clipShadows,h=r.get(u);if(!s||g===null||g.length===0||i&&!p)i?d(null):c();else{const T=i?0:n,x=T*4;let w=h.clippingState||null;l.value=w,w=d(g,f,x,m);for(let D=0;D!==x;++D)w[D]=t[D];h.clippingState=w,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=T}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function d(u,f,m,g){const _=u!==null?u.length:0;let p=null;if(_!==0){if(p=l.value,g!==!0||p===null){const h=m+_*4,T=f.matrixWorldInverse;a.getNormalMatrix(T),(p===null||p.length<h)&&(p=new Float32Array(h));for(let x=0,w=m;x!==_;++x,w+=4)o.copy(u[x]).applyMatrix4(T,a),o.normal.toArray(p,w),p[w+3]=o.constant}l.value=p,l.needsUpdate=!0}return e.numPlanes=_,e.numIntersection=0,p}}function _l(r){let e=new WeakMap;function t(o,a){return a===303?o.mapping=301:a===304&&(o.mapping=302),o}function n(o){if(o&&o.isTexture){const a=o.mapping;if(a===303||a===304)if(e.has(o)){const l=e.get(o).texture;return t(l,o.mapping)}else{const l=o.image;if(l&&l.height>0){const c=new la(l.height/2);return c.fromEquirectangularTexture(r,o),e.set(o,c),o.addEventListener("dispose",s),t(c.texture,o.mapping)}else return null}}return o}function s(o){const a=o.target;a.removeEventListener("dispose",s);const l=e.get(a);l!==void 0&&(e.delete(a),l.dispose())}function i(){e=new WeakMap}return{get:n,dispose:i}}class Js extends Ys{constructor(e=-1,t=1,n=1,s=-1,i=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=s,this.near=i,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,s,i,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=i,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2;let i=n-e,o=n+e,a=s+t,l=s-t;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,d=(this.top-this.bottom)/this.view.fullHeight/this.zoom;i+=c*this.view.offsetX,o=i+c*this.view.width,a-=d*this.view.offsetY,l=a-d*this.view.height}this.projectionMatrix.makeOrthographic(i,o,a,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}const wn=4,Qs=[.125,.215,.35,.446,.526,.582],an=20,is=new Js,er=new ze;let ss=null,rs=0,as=0;const on=(1+Math.sqrt(5))/2,Cn=1/on,tr=[new I(1,1,1),new I(-1,1,1),new I(1,1,-1),new I(-1,1,-1),new I(0,on,Cn),new I(0,on,-Cn),new I(Cn,0,on),new I(-Cn,0,on),new I(on,Cn,0),new I(-on,Cn,0)];class nr{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,s=100){ss=this._renderer.getRenderTarget(),rs=this._renderer.getActiveCubeFace(),as=this._renderer.getActiveMipmapLevel(),this._setSize(256);const i=this._allocateTargets();return i.depthBuffer=!0,this._sceneToCubeUV(e,n,s,i),t>0&&this._blur(i,0,0,t),this._applyPMREM(i),this._cleanup(i),i}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=rr(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=sr(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(ss,rs,as),e.scissorTest=!1,Ei(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===301||e.mapping===302?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),ss=this._renderer.getRenderTarget(),rs=this._renderer.getActiveCubeFace(),as=this._renderer.getActiveMipmapLevel();const n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:1006,minFilter:1006,generateMipmaps:!1,type:1016,format:1023,colorSpace:kt,depthBuffer:!1},s=ir(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=ir(e,t,n);const{_lodMax:i}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=vl(i)),this._blurMaterial=xl(i,e,t)}return s}_compileMaterial(e){const t=new Xt(this._lodPlanes[0],e);this._renderer.compile(t,is)}_sceneToCubeUV(e,t,n,s){const a=new It(90,1,t,n),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],d=this._renderer,u=d.autoClear,f=d.toneMapping;d.getClearColor(er),d.toneMapping=0,d.autoClear=!1;const m=new Ji({name:"PMREM.Background",side:1,depthWrite:!1,depthTest:!1}),g=new Xt(new Wn,m);let _=!1;const p=e.background;p?p.isColor&&(m.color.copy(p),e.background=null,_=!0):(m.color.copy(er),_=!0);for(let h=0;h<6;h++){const T=h%3;T===0?(a.up.set(0,l[h],0),a.lookAt(c[h],0,0)):T===1?(a.up.set(0,0,l[h]),a.lookAt(0,c[h],0)):(a.up.set(0,l[h],0),a.lookAt(0,0,c[h]));const x=this._cubeSize;Ei(s,T*x,h>2?x:0,x,x),d.setRenderTarget(s),_&&d.render(g,a),d.render(e,a)}g.geometry.dispose(),g.material.dispose(),d.toneMapping=f,d.autoClear=u,e.background=p}_textureToCubeUV(e,t){const n=this._renderer,s=e.mapping===301||e.mapping===302;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=rr()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=sr());const i=s?this._cubemapMaterial:this._equirectMaterial,o=new Xt(this._lodPlanes[0],i),a=i.uniforms;a.envMap.value=e;const l=this._cubeSize;Ei(t,0,0,3*l,2*l),n.setRenderTarget(t),n.render(o,is)}_applyPMREM(e){const t=this._renderer,n=t.autoClear;t.autoClear=!1;for(let s=1;s<this._lodPlanes.length;s++){const i=Math.sqrt(this._sigmas[s]*this._sigmas[s]-this._sigmas[s-1]*this._sigmas[s-1]),o=tr[(s-1)%tr.length];this._blur(e,s-1,s,i,o)}t.autoClear=n}_blur(e,t,n,s,i){const o=this._pingPongRenderTarget;this._halfBlur(e,o,t,n,s,"latitudinal",i),this._halfBlur(o,e,n,n,s,"longitudinal",i)}_halfBlur(e,t,n,s,i,o,a){const l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const d=3,u=new Xt(this._lodPlanes[s],c),f=c.uniforms,m=this._sizeLods[n]-1,g=isFinite(i)?Math.PI/(2*m):2*Math.PI/(2*an-1),_=i/g,p=isFinite(i)?1+Math.floor(d*_):an;p>an&&console.warn(`sigmaRadians, ${i}, is too large and will clip, as it requested ${p} samples when the maximum is set to ${an}`);const h=[];let T=0;for(let A=0;A<an;++A){const $=A/_,y=Math.exp(-$*$/2);h.push(y),A===0?T+=y:A<p&&(T+=2*y)}for(let A=0;A<h.length;A++)h[A]=h[A]/T;f.envMap.value=e.texture,f.samples.value=p,f.weights.value=h,f.latitudinal.value=o==="latitudinal",a&&(f.poleAxis.value=a);const{_lodMax:x}=this;f.dTheta.value=g,f.mipInt.value=x-n;const w=this._sizeLods[s],D=3*w*(s>x-wn?s-x+wn:0),C=4*(this._cubeSize-w);Ei(t,D,C,3*w,2*w),l.setRenderTarget(t),l.render(u,is)}}function vl(r){const e=[],t=[],n=[];let s=r;const i=r-wn+1+Qs.length;for(let o=0;o<i;o++){const a=Math.pow(2,s);t.push(a);let l=1/a;o>r-wn?l=Qs[o-r+wn-1]:o===0&&(l=0),n.push(l);const c=1/(a-2),d=-c,u=1+c,f=[d,d,u,d,u,u,d,d,u,u,d,u],m=6,g=6,_=3,p=2,h=1,T=new Float32Array(_*g*m),x=new Float32Array(p*g*m),w=new Float32Array(h*g*m);for(let C=0;C<m;C++){const A=C%3*2/3-1,$=C>2?0:-1,y=[A,$,0,A+2/3,$,0,A+2/3,$+1,0,A,$,0,A+2/3,$+1,0,A,$+1,0];T.set(y,_*g*C),x.set(f,p*g*C);const E=[C,C,C,C,C,C];w.set(E,h*g*C)}const D=new Nt;D.setAttribute("position",new bt(T,_)),D.setAttribute("uv",new bt(x,p)),D.setAttribute("faceIndex",new bt(w,h)),e.push(D),s>wn&&s--}return{lodPlanes:e,sizeLods:t,sigmas:n}}function ir(r,e,t){const n=new Jt(r,e,t);return n.texture.mapping=306,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Ei(r,e,t,n,s){r.viewport.set(e,t,n,s),r.scissor.set(e,t,n,s)}function xl(r,e,t){const n=new Float32Array(an),s=new I(0,1,0);return new nn({name:"SphericalGaussianBlur",defines:{n:an,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${r}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:os(),fragmentShader:`

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
		`,blending:0,depthTest:!1,depthWrite:!1})}function sr(){return new nn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:os(),fragmentShader:`

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
		`,blending:0,depthTest:!1,depthWrite:!1})}function rr(){return new nn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:os(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function os(){return`

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
	`}function Sl(r){let e=new WeakMap,t=null;function n(a){if(a&&a.isTexture){const l=a.mapping,c=l===303||l===304,d=l===301||l===302;if(c||d)if(a.isRenderTargetTexture&&a.needsPMREMUpdate===!0){a.needsPMREMUpdate=!1;let u=e.get(a);return t===null&&(t=new nr(r)),u=c?t.fromEquirectangular(a,u):t.fromCubemap(a,u),e.set(a,u),u.texture}else{if(e.has(a))return e.get(a).texture;{const u=a.image;if(c&&u&&u.height>0||d&&u&&s(u)){t===null&&(t=new nr(r));const f=c?t.fromEquirectangular(a):t.fromCubemap(a);return e.set(a,f),a.addEventListener("dispose",i),f.texture}else return null}}}return a}function s(a){let l=0;const c=6;for(let d=0;d<c;d++)a[d]!==void 0&&l++;return l===c}function i(a){const l=a.target;l.removeEventListener("dispose",i);const c=e.get(l);c!==void 0&&(e.delete(l),c.dispose())}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:n,dispose:o}}function yl(r){const e={};function t(n){if(e[n]!==void 0)return e[n];let s;switch(n){case"WEBGL_depth_texture":s=r.getExtension("WEBGL_depth_texture")||r.getExtension("MOZ_WEBGL_depth_texture")||r.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=r.getExtension("EXT_texture_filter_anisotropic")||r.getExtension("MOZ_EXT_texture_filter_anisotropic")||r.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=r.getExtension("WEBGL_compressed_texture_s3tc")||r.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||r.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=r.getExtension("WEBGL_compressed_texture_pvrtc")||r.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=r.getExtension(n)}return e[n]=s,s}return{has:function(n){return t(n)!==null},init:function(n){n.isWebGL2?(t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance")):(t("WEBGL_depth_texture"),t("OES_texture_float"),t("OES_texture_half_float"),t("OES_texture_half_float_linear"),t("OES_standard_derivatives"),t("OES_element_index_uint"),t("OES_vertex_array_object"),t("ANGLE_instanced_arrays")),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture")},get:function(n){const s=t(n);return s===null&&console.warn("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function Ml(r,e,t,n){const s={},i=new WeakMap;function o(u){const f=u.target;f.index!==null&&e.remove(f.index);for(const g in f.attributes)e.remove(f.attributes[g]);for(const g in f.morphAttributes){const _=f.morphAttributes[g];for(let p=0,h=_.length;p<h;p++)e.remove(_[p])}f.removeEventListener("dispose",o),delete s[f.id];const m=i.get(f);m&&(e.remove(m),i.delete(f)),n.releaseStatesOfGeometry(f),f.isInstancedBufferGeometry===!0&&delete f._maxInstanceCount,t.memory.geometries--}function a(u,f){return s[f.id]===!0||(f.addEventListener("dispose",o),s[f.id]=!0,t.memory.geometries++),f}function l(u){const f=u.attributes;for(const g in f)e.update(f[g],r.ARRAY_BUFFER);const m=u.morphAttributes;for(const g in m){const _=m[g];for(let p=0,h=_.length;p<h;p++)e.update(_[p],r.ARRAY_BUFFER)}}function c(u){const f=[],m=u.index,g=u.attributes.position;let _=0;if(m!==null){const T=m.array;_=m.version;for(let x=0,w=T.length;x<w;x+=3){const D=T[x+0],C=T[x+1],A=T[x+2];f.push(D,C,C,A,A,D)}}else if(g!==void 0){const T=g.array;_=g.version;for(let x=0,w=T.length/3-1;x<w;x+=3){const D=x+0,C=x+1,A=x+2;f.push(D,C,C,A,A,D)}}else return;const p=new(Ms(f)?zs:Gs)(f,1);p.version=_;const h=i.get(u);h&&e.remove(h),i.set(u,p)}function d(u){const f=i.get(u);if(f){const m=u.index;m!==null&&f.version<m.version&&c(u)}else c(u);return i.get(u)}return{get:a,update:l,getWireframeAttribute:d}}function El(r,e,t,n){const s=n.isWebGL2;let i;function o(m){i=m}let a,l;function c(m){a=m.type,l=m.bytesPerElement}function d(m,g){r.drawElements(i,g,a,m*l),t.update(g,i,1)}function u(m,g,_){if(_===0)return;let p,h;if(s)p=r,h="drawElementsInstanced";else if(p=e.get("ANGLE_instanced_arrays"),h="drawElementsInstancedANGLE",p===null){console.error("THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}p[h](i,g,a,m*l,_),t.update(g,i,_)}function f(m,g,_){if(_===0)return;const p=e.get("WEBGL_multi_draw");if(p===null)for(let h=0;h<_;h++)this.render(m[h]/l,g[h]);else{p.multiDrawElementsWEBGL(i,g,0,a,m,0,_);let h=0;for(let T=0;T<_;T++)h+=g[T];t.update(h,i,1)}}this.setMode=o,this.setIndex=c,this.render=d,this.renderInstances=u,this.renderMultiDraw=f}function Tl(r){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(i,o,a){switch(t.calls++,o){case r.TRIANGLES:t.triangles+=a*(i/3);break;case r.LINES:t.lines+=a*(i/2);break;case r.LINE_STRIP:t.lines+=a*(i-1);break;case r.LINE_LOOP:t.lines+=a*i;break;case r.POINTS:t.points+=a*i;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:n}}function bl(r,e){return r[0]-e[0]}function Al(r,e){return Math.abs(e[1])-Math.abs(r[1])}function wl(r,e,t){const n={},s=new Float32Array(8),i=new WeakMap,o=new ct,a=[];for(let c=0;c<8;c++)a[c]=[c,0];function l(c,d,u){const f=c.morphTargetInfluences;if(e.isWebGL2===!0){const m=d.morphAttributes.position||d.morphAttributes.normal||d.morphAttributes.color,g=m!==void 0?m.length:0;let _=i.get(d);if(_===void 0||_.count!==g){let R=function(){Y.dispose(),i.delete(d),d.removeEventListener("dispose",R)};_!==void 0&&_.texture.dispose();const T=d.morphAttributes.position!==void 0,x=d.morphAttributes.normal!==void 0,w=d.morphAttributes.color!==void 0,D=d.morphAttributes.position||[],C=d.morphAttributes.normal||[],A=d.morphAttributes.color||[];let $=0;T===!0&&($=1),x===!0&&($=2),w===!0&&($=3);let y=d.attributes.position.count*$,E=1;y>e.maxTextureSize&&(E=Math.ceil(y/e.maxTextureSize),y=e.maxTextureSize);const k=new Float32Array(y*E*4*g),Y=new Cs(k,y,E,g);Y.type=1015,Y.needsUpdate=!0;const ie=$*4;for(let O=0;O<g;O++){const z=D[O],X=C[O],V=A[O],H=y*E*4*O;for(let K=0;K<z.count;K++){const J=K*ie;T===!0&&(o.fromBufferAttribute(z,K),k[H+J+0]=o.x,k[H+J+1]=o.y,k[H+J+2]=o.z,k[H+J+3]=0),x===!0&&(o.fromBufferAttribute(X,K),k[H+J+4]=o.x,k[H+J+5]=o.y,k[H+J+6]=o.z,k[H+J+7]=0),w===!0&&(o.fromBufferAttribute(V,K),k[H+J+8]=o.x,k[H+J+9]=o.y,k[H+J+10]=o.z,k[H+J+11]=V.itemSize===4?o.w:1)}}_={count:g,texture:Y,size:new Ve(y,E)},i.set(d,_),d.addEventListener("dispose",R)}let p=0;for(let T=0;T<f.length;T++)p+=f[T];const h=d.morphTargetsRelative?1:1-p;u.getUniforms().setValue(r,"morphTargetBaseInfluence",h),u.getUniforms().setValue(r,"morphTargetInfluences",f),u.getUniforms().setValue(r,"morphTargetsTexture",_.texture,t),u.getUniforms().setValue(r,"morphTargetsTextureSize",_.size)}else{const m=f===void 0?0:f.length;let g=n[d.id];if(g===void 0||g.length!==m){g=[];for(let x=0;x<m;x++)g[x]=[x,0];n[d.id]=g}for(let x=0;x<m;x++){const w=g[x];w[0]=x,w[1]=f[x]}g.sort(Al);for(let x=0;x<8;x++)x<m&&g[x][1]?(a[x][0]=g[x][0],a[x][1]=g[x][1]):(a[x][0]=Number.MAX_SAFE_INTEGER,a[x][1]=0);a.sort(bl);const _=d.morphAttributes.position,p=d.morphAttributes.normal;let h=0;for(let x=0;x<8;x++){const w=a[x],D=w[0],C=w[1];D!==Number.MAX_SAFE_INTEGER&&C?(_&&d.getAttribute("morphTarget"+x)!==_[D]&&d.setAttribute("morphTarget"+x,_[D]),p&&d.getAttribute("morphNormal"+x)!==p[D]&&d.setAttribute("morphNormal"+x,p[D]),s[x]=C,h+=C):(_&&d.hasAttribute("morphTarget"+x)===!0&&d.deleteAttribute("morphTarget"+x),p&&d.hasAttribute("morphNormal"+x)===!0&&d.deleteAttribute("morphNormal"+x),s[x]=0)}const T=d.morphTargetsRelative?1:1-h;u.getUniforms().setValue(r,"morphTargetBaseInfluence",T),u.getUniforms().setValue(r,"morphTargetInfluences",s)}}return{update:l}}function Cl(r,e,t,n){let s=new WeakMap;function i(l){const c=n.render.frame,d=l.geometry,u=e.get(l,d);if(s.get(u)!==c&&(e.update(u),s.set(u,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),s.get(l)!==c&&(t.update(l.instanceMatrix,r.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,r.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){const f=l.skeleton;s.get(f)!==c&&(f.update(),s.set(f,c))}return u}function o(){s=new WeakMap}function a(l){const c=l.target;c.removeEventListener("dispose",a),t.remove(c.instanceMatrix),c.instanceColor!==null&&t.remove(c.instanceColor)}return{update:i,dispose:o}}class ar extends St{constructor(e,t,n,s,i,o,a,l,c,d){if(d=d!==void 0?d:1026,d!==1026&&d!==1027)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&d===1026&&(n=1014),n===void 0&&d===1027&&(n=1020),super(null,s,i,o,a,l,d,n,c),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=a!==void 0?a:1003,this.minFilter=l!==void 0?l:1003,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}const or=new St,lr=new ar(1,1);lr.compareFunction=515;const cr=new Cs,dr=new Xr,ur=new Ks,hr=[],fr=[],pr=new Float32Array(16),mr=new Float32Array(9),gr=new Float32Array(4);function Rn(r,e,t){const n=r[0];if(n<=0||n>0)return r;const s=e*t;let i=hr[s];if(i===void 0&&(i=new Float32Array(s),hr[s]=i),e!==0){n.toArray(i,0);for(let o=1,a=0;o!==e;++o)a+=t,r[o].toArray(i,a)}return i}function nt(r,e){if(r.length!==e.length)return!1;for(let t=0,n=r.length;t<n;t++)if(r[t]!==e[t])return!1;return!0}function it(r,e){for(let t=0,n=e.length;t<n;t++)r[t]=e[t]}function Ti(r,e){let t=fr[e];t===void 0&&(t=new Int32Array(e),fr[e]=t);for(let n=0;n!==e;++n)t[n]=r.allocateTextureUnit();return t}function Rl(r,e){const t=this.cache;t[0]!==e&&(r.uniform1f(this.addr,e),t[0]=e)}function Ll(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(r.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(nt(t,e))return;r.uniform2fv(this.addr,e),it(t,e)}}function Pl(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(r.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(r.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(nt(t,e))return;r.uniform3fv(this.addr,e),it(t,e)}}function Dl(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(r.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(nt(t,e))return;r.uniform4fv(this.addr,e),it(t,e)}}function Il(r,e){const t=this.cache,n=e.elements;if(n===void 0){if(nt(t,e))return;r.uniformMatrix2fv(this.addr,!1,e),it(t,e)}else{if(nt(t,n))return;gr.set(n),r.uniformMatrix2fv(this.addr,!1,gr),it(t,n)}}function Ul(r,e){const t=this.cache,n=e.elements;if(n===void 0){if(nt(t,e))return;r.uniformMatrix3fv(this.addr,!1,e),it(t,e)}else{if(nt(t,n))return;mr.set(n),r.uniformMatrix3fv(this.addr,!1,mr),it(t,n)}}function Fl(r,e){const t=this.cache,n=e.elements;if(n===void 0){if(nt(t,e))return;r.uniformMatrix4fv(this.addr,!1,e),it(t,e)}else{if(nt(t,n))return;pr.set(n),r.uniformMatrix4fv(this.addr,!1,pr),it(t,n)}}function Nl(r,e){const t=this.cache;t[0]!==e&&(r.uniform1i(this.addr,e),t[0]=e)}function Ol(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(r.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(nt(t,e))return;r.uniform2iv(this.addr,e),it(t,e)}}function Bl(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(r.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(nt(t,e))return;r.uniform3iv(this.addr,e),it(t,e)}}function kl(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(r.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(nt(t,e))return;r.uniform4iv(this.addr,e),it(t,e)}}function Gl(r,e){const t=this.cache;t[0]!==e&&(r.uniform1ui(this.addr,e),t[0]=e)}function zl(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(r.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(nt(t,e))return;r.uniform2uiv(this.addr,e),it(t,e)}}function Hl(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(r.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(nt(t,e))return;r.uniform3uiv(this.addr,e),it(t,e)}}function Vl(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(r.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(nt(t,e))return;r.uniform4uiv(this.addr,e),it(t,e)}}function Wl(r,e,t){const n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(r.uniform1i(this.addr,s),n[0]=s);const i=this.type===r.SAMPLER_2D_SHADOW?lr:or;t.setTexture2D(e||i,s)}function Xl(r,e,t){const n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(r.uniform1i(this.addr,s),n[0]=s),t.setTexture3D(e||dr,s)}function ql(r,e,t){const n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(r.uniform1i(this.addr,s),n[0]=s),t.setTextureCube(e||ur,s)}function $l(r,e,t){const n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(r.uniform1i(this.addr,s),n[0]=s),t.setTexture2DArray(e||cr,s)}function Yl(r){switch(r){case 5126:return Rl;case 35664:return Ll;case 35665:return Pl;case 35666:return Dl;case 35674:return Il;case 35675:return Ul;case 35676:return Fl;case 5124:case 35670:return Nl;case 35667:case 35671:return Ol;case 35668:case 35672:return Bl;case 35669:case 35673:return kl;case 5125:return Gl;case 36294:return zl;case 36295:return Hl;case 36296:return Vl;case 35678:case 36198:case 36298:case 36306:case 35682:return Wl;case 35679:case 36299:case 36307:return Xl;case 35680:case 36300:case 36308:case 36293:return ql;case 36289:case 36303:case 36311:case 36292:return $l}}function Kl(r,e){r.uniform1fv(this.addr,e)}function jl(r,e){const t=Rn(e,this.size,2);r.uniform2fv(this.addr,t)}function Zl(r,e){const t=Rn(e,this.size,3);r.uniform3fv(this.addr,t)}function Jl(r,e){const t=Rn(e,this.size,4);r.uniform4fv(this.addr,t)}function Ql(r,e){const t=Rn(e,this.size,4);r.uniformMatrix2fv(this.addr,!1,t)}function ec(r,e){const t=Rn(e,this.size,9);r.uniformMatrix3fv(this.addr,!1,t)}function tc(r,e){const t=Rn(e,this.size,16);r.uniformMatrix4fv(this.addr,!1,t)}function nc(r,e){r.uniform1iv(this.addr,e)}function ic(r,e){r.uniform2iv(this.addr,e)}function sc(r,e){r.uniform3iv(this.addr,e)}function rc(r,e){r.uniform4iv(this.addr,e)}function ac(r,e){r.uniform1uiv(this.addr,e)}function oc(r,e){r.uniform2uiv(this.addr,e)}function lc(r,e){r.uniform3uiv(this.addr,e)}function cc(r,e){r.uniform4uiv(this.addr,e)}function dc(r,e,t){const n=this.cache,s=e.length,i=Ti(t,s);nt(n,i)||(r.uniform1iv(this.addr,i),it(n,i));for(let o=0;o!==s;++o)t.setTexture2D(e[o]||or,i[o])}function uc(r,e,t){const n=this.cache,s=e.length,i=Ti(t,s);nt(n,i)||(r.uniform1iv(this.addr,i),it(n,i));for(let o=0;o!==s;++o)t.setTexture3D(e[o]||dr,i[o])}function hc(r,e,t){const n=this.cache,s=e.length,i=Ti(t,s);nt(n,i)||(r.uniform1iv(this.addr,i),it(n,i));for(let o=0;o!==s;++o)t.setTextureCube(e[o]||ur,i[o])}function fc(r,e,t){const n=this.cache,s=e.length,i=Ti(t,s);nt(n,i)||(r.uniform1iv(this.addr,i),it(n,i));for(let o=0;o!==s;++o)t.setTexture2DArray(e[o]||cr,i[o])}function pc(r){switch(r){case 5126:return Kl;case 35664:return jl;case 35665:return Zl;case 35666:return Jl;case 35674:return Ql;case 35675:return ec;case 35676:return tc;case 5124:case 35670:return nc;case 35667:case 35671:return ic;case 35668:case 35672:return sc;case 35669:case 35673:return rc;case 5125:return ac;case 36294:return oc;case 36295:return lc;case 36296:return cc;case 35678:case 36198:case 36298:case 36306:case 35682:return dc;case 35679:case 36299:case 36307:return uc;case 35680:case 36300:case 36308:case 36293:return hc;case 36289:case 36303:case 36311:case 36292:return fc}}class mc{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=Yl(t.type)}}class gc{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=pc(t.type)}}class _c{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){const s=this.seq;for(let i=0,o=s.length;i!==o;++i){const a=s[i];a.setValue(e,t[a.id],n)}}}const ls=/(\w+)(\])?(\[|\.)?/g;function _r(r,e){r.seq.push(e),r.map[e.id]=e}function vc(r,e,t){const n=r.name,s=n.length;for(ls.lastIndex=0;;){const i=ls.exec(n),o=ls.lastIndex;let a=i[1];const l=i[2]==="]",c=i[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===s){_r(t,c===void 0?new mc(a,r,e):new gc(a,r,e));break}else{let u=t.map[a];u===void 0&&(u=new _c(a),_r(t,u)),t=u}}}class bi{constructor(e,t){this.seq=[],this.map={};const n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){const i=e.getActiveUniform(t,s),o=e.getUniformLocation(t,i.name);vc(i,o,this)}}setValue(e,t,n,s){const i=this.map[t];i!==void 0&&i.setValue(e,n,s)}setOptional(e,t,n){const s=t[n];s!==void 0&&this.setValue(e,n,s)}static upload(e,t,n,s){for(let i=0,o=t.length;i!==o;++i){const a=t[i],l=n[a.id];l.needsUpdate!==!1&&a.setValue(e,l.value,s)}}static seqWithValue(e,t){const n=[];for(let s=0,i=e.length;s!==i;++s){const o=e[s];o.id in t&&n.push(o)}return n}}function vr(r,e,t){const n=r.createShader(e);return r.shaderSource(n,t),r.compileShader(n),n}const xc=37297;let Sc=0;function yc(r,e){const t=r.split(`
`),n=[],s=Math.max(e-6,0),i=Math.min(e+6,t.length);for(let o=s;o<i;o++){const a=o+1;n.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return n.join(`
`)}function Mc(r){const e=We.getPrimaries(We.workingColorSpace),t=We.getPrimaries(r);let n;switch(e===t?n="":e===Jn&&t===Zn?n="LinearDisplayP3ToLinearSRGB":e===Zn&&t===Jn&&(n="LinearSRGBToLinearDisplayP3"),r){case kt:case Kn:return[n,"LinearTransferOETF"];case lt:case Ii:return[n,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",r),[n,"LinearTransferOETF"]}}function xr(r,e,t){const n=r.getShaderParameter(e,r.COMPILE_STATUS),s=r.getShaderInfoLog(e).trim();if(n&&s==="")return"";const i=/ERROR: 0:(\d+)/.exec(s);if(i){const o=parseInt(i[1]);return t.toUpperCase()+`

`+s+`

`+yc(r.getShaderSource(e),o)}else return s}function Ec(r,e){const t=Mc(e);return`vec4 ${r}( vec4 value ) { return ${t[0]}( ${t[1]}( value ) ); }`}function Tc(r,e){let t;switch(e){case 1:t="Linear";break;case 2:t="Reinhard";break;case 3:t="OptimizedCineon";break;case 4:t="ACESFilmic";break;case 6:t="AgX";break;case 5:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+r+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}function bc(r){return[r.extensionDerivatives||r.envMapCubeUVHeight||r.bumpMap||r.normalMapTangentSpace||r.clearcoatNormalMap||r.flatShading||r.shaderID==="physical"?"#extension GL_OES_standard_derivatives : enable":"",(r.extensionFragDepth||r.logarithmicDepthBuffer)&&r.rendererExtensionFragDepth?"#extension GL_EXT_frag_depth : enable":"",r.extensionDrawBuffers&&r.rendererExtensionDrawBuffers?"#extension GL_EXT_draw_buffers : require":"",(r.extensionShaderTextureLOD||r.envMap||r.transmission)&&r.rendererExtensionShaderTextureLod?"#extension GL_EXT_shader_texture_lod : enable":""].filter(Ln).join(`
`)}function Ac(r){return[r.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":""].filter(Ln).join(`
`)}function wc(r){const e=[];for(const t in r){const n=r[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function Cc(r,e){const t={},n=r.getProgramParameter(e,r.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){const i=r.getActiveAttrib(e,s),o=i.name;let a=1;i.type===r.FLOAT_MAT2&&(a=2),i.type===r.FLOAT_MAT3&&(a=3),i.type===r.FLOAT_MAT4&&(a=4),t[o]={type:i.type,location:r.getAttribLocation(e,o),locationSize:a}}return t}function Ln(r){return r!==""}function Sr(r,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return r.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function yr(r,e){return r.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const Rc=/^[ \t]*#include +<([\w\d./]+)>/gm;function cs(r){return r.replace(Rc,Pc)}const Lc=new Map([["encodings_fragment","colorspace_fragment"],["encodings_pars_fragment","colorspace_pars_fragment"],["output_fragment","opaque_fragment"]]);function Pc(r,e){let t=De[e];if(t===void 0){const n=Lc.get(e);if(n!==void 0)t=De[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("Can not resolve #include <"+e+">")}return cs(t)}const Dc=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Mr(r){return r.replace(Dc,Ic)}function Ic(r,e,t,n){let s="";for(let i=parseInt(e);i<parseInt(t);i++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+i+" ]").replace(/UNROLLED_LOOP_INDEX/g,i);return s}function Er(r){let e="precision "+r.precision+` float;
precision `+r.precision+" int;";return r.precision==="highp"?e+=`
#define HIGH_PRECISION`:r.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:r.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function Uc(r){let e="SHADOWMAP_TYPE_BASIC";return r.shadowMapType===1?e="SHADOWMAP_TYPE_PCF":r.shadowMapType===2?e="SHADOWMAP_TYPE_PCF_SOFT":r.shadowMapType===3&&(e="SHADOWMAP_TYPE_VSM"),e}function Fc(r){let e="ENVMAP_TYPE_CUBE";if(r.envMap)switch(r.envMapMode){case 301:case 302:e="ENVMAP_TYPE_CUBE";break;case 306:e="ENVMAP_TYPE_CUBE_UV";break}return e}function Nc(r){let e="ENVMAP_MODE_REFLECTION";if(r.envMap)switch(r.envMapMode){case 302:e="ENVMAP_MODE_REFRACTION";break}return e}function Oc(r){let e="ENVMAP_BLENDING_NONE";if(r.envMap)switch(r.combine){case 0:e="ENVMAP_BLENDING_MULTIPLY";break;case 1:e="ENVMAP_BLENDING_MIX";break;case 2:e="ENVMAP_BLENDING_ADD";break}return e}function Bc(r){const e=r.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),7*16)),texelHeight:n,maxMip:t}}function kc(r,e,t,n){const s=r.getContext(),i=t.defines;let o=t.vertexShader,a=t.fragmentShader;const l=Uc(t),c=Fc(t),d=Nc(t),u=Oc(t),f=Bc(t),m=t.isWebGL2?"":bc(t),g=Ac(t),_=wc(i),p=s.createProgram();let h,T,x=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(h=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(Ln).join(`
`),h.length>0&&(h+=`
`),T=[m,"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(Ln).join(`
`),T.length>0&&(T+=`
`)):(h=[Er(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+d:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors&&t.isWebGL2?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.useLegacyLights?"#define LEGACY_LIGHTS":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#if ( defined( USE_MORPHTARGETS ) && ! defined( MORPHTARGETS_TEXTURE ) )","	attribute vec3 morphTarget0;","	attribute vec3 morphTarget1;","	attribute vec3 morphTarget2;","	attribute vec3 morphTarget3;","	#ifdef USE_MORPHNORMALS","		attribute vec3 morphNormal0;","		attribute vec3 morphNormal1;","		attribute vec3 morphNormal2;","		attribute vec3 morphNormal3;","	#else","		attribute vec3 morphTarget4;","		attribute vec3 morphTarget5;","		attribute vec3 morphTarget6;","		attribute vec3 morphTarget7;","	#endif","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Ln).join(`
`),T=[m,Er(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+d:"",t.envMap?"#define "+u:"",f?"#define CUBEUV_TEXEL_WIDTH "+f.texelWidth:"",f?"#define CUBEUV_TEXEL_HEIGHT "+f.texelHeight:"",f?"#define CUBEUV_MAX_MIP "+f.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.useLegacyLights?"#define LEGACY_LIGHTS":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==0?"#define TONE_MAPPING":"",t.toneMapping!==0?De.tonemapping_pars_fragment:"",t.toneMapping!==0?Tc("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",De.colorspace_pars_fragment,Ec("linearToOutputTexel",t.outputColorSpace),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Ln).join(`
`)),o=cs(o),o=Sr(o,t),o=yr(o,t),a=cs(a),a=Sr(a,t),a=yr(a,t),o=Mr(o),a=Mr(a),t.isWebGL2&&t.isRawShaderMaterial!==!0&&(x=`#version 300 es
`,h=[g,"precision mediump sampler2DArray;","#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+h,T=["precision mediump sampler2DArray;","#define varying in",t.glslVersion===Ss?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Ss?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+T);const w=x+h+o,D=x+T+a,C=vr(s,s.VERTEX_SHADER,w),A=vr(s,s.FRAGMENT_SHADER,D);s.attachShader(p,C),s.attachShader(p,A),t.index0AttributeName!==void 0?s.bindAttribLocation(p,0,t.index0AttributeName):t.morphTargets===!0&&s.bindAttribLocation(p,0,"position"),s.linkProgram(p);function $(Y){if(r.debug.checkShaderErrors){const ie=s.getProgramInfoLog(p).trim(),R=s.getShaderInfoLog(C).trim(),O=s.getShaderInfoLog(A).trim();let z=!0,X=!0;if(s.getProgramParameter(p,s.LINK_STATUS)===!1)if(z=!1,typeof r.debug.onShaderError=="function")r.debug.onShaderError(s,p,C,A);else{const V=xr(s,C,"vertex"),H=xr(s,A,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(p,s.VALIDATE_STATUS)+`

Program Info Log: `+ie+`
`+V+`
`+H)}else ie!==""?console.warn("THREE.WebGLProgram: Program Info Log:",ie):(R===""||O==="")&&(X=!1);X&&(Y.diagnostics={runnable:z,programLog:ie,vertexShader:{log:R,prefix:h},fragmentShader:{log:O,prefix:T}})}s.deleteShader(C),s.deleteShader(A),y=new bi(s,p),E=Cc(s,p)}let y;this.getUniforms=function(){return y===void 0&&$(this),y};let E;this.getAttributes=function(){return E===void 0&&$(this),E};let k=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return k===!1&&(k=s.getProgramParameter(p,xc)),k},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(p),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Sc++,this.cacheKey=e,this.usedTimes=1,this.program=p,this.vertexShader=C,this.fragmentShader=A,this}let Gc=0;class zc{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const t=e.vertexShader,n=e.fragmentShader,s=this._getShaderStage(t),i=this._getShaderStage(n),o=this._getShaderCacheForMaterial(e);return o.has(s)===!1&&(o.add(s),s.usedTimes++),o.has(i)===!1&&(o.add(i),i.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){const t=this.shaderCache;let n=t.get(e);return n===void 0&&(n=new Hc(e),t.set(e,n)),n}}class Hc{constructor(e){this.id=Gc++,this.code=e,this.usedTimes=0}}function Vc(r,e,t,n,s,i,o){const a=new Is,l=new zc,c=[],d=s.isWebGL2,u=s.logarithmicDepthBuffer,f=s.vertexTextures;let m=s.precision;const g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(y){return y===0?"uv":`uv${y}`}function p(y,E,k,Y,ie){const R=Y.fog,O=ie.geometry,z=y.isMeshStandardMaterial?Y.environment:null,X=(y.isMeshStandardMaterial?t:e).get(y.envMap||z),V=X&&X.mapping===306?X.image.height:null,H=g[y.type];y.precision!==null&&(m=s.getMaxPrecision(y.precision),m!==y.precision&&console.warn("THREE.WebGLProgram.getParameters:",y.precision,"not supported, using",m,"instead."));const K=O.morphAttributes.position||O.morphAttributes.normal||O.morphAttributes.color,J=K!==void 0?K.length:0;let le=0;O.morphAttributes.position!==void 0&&(le=1),O.morphAttributes.normal!==void 0&&(le=2),O.morphAttributes.color!==void 0&&(le=3);let G,q,ae,pe;if(H){const mt=Ot[H];G=mt.vertexShader,q=mt.fragmentShader}else G=y.vertexShader,q=y.fragmentShader,l.update(y),ae=l.getVertexShaderID(y),pe=l.getFragmentShaderID(y);const fe=r.getRenderTarget(),Ae=ie.isInstancedMesh===!0,we=ie.isBatchedMesh===!0,xe=!!y.map,he=!!y.matcap,L=!!X,pt=!!y.aoMap,Se=!!y.lightMap,Re=!!y.bumpMap,me=!!y.normalMap,je=!!y.displacementMap,Ue=!!y.emissiveMap,M=!!y.metalnessMap,v=!!y.roughnessMap,F=y.anisotropy>0,Q=y.clearcoat>0,Z=y.iridescence>0,ee=y.sheen>0,ge=y.transmission>0,oe=F&&!!y.anisotropyMap,de=Q&&!!y.clearcoatMap,Ee=Q&&!!y.clearcoatNormalMap,Fe=Q&&!!y.clearcoatRoughnessMap,j=Z&&!!y.iridescenceMap,Xe=Z&&!!y.iridescenceThicknessMap,Ge=ee&&!!y.sheenColorMap,Ce=ee&&!!y.sheenRoughnessMap,ve=!!y.specularMap,ue=!!y.specularColorMap,Ie=!!y.specularIntensityMap,He=ge&&!!y.transmissionMap,Je=ge&&!!y.thicknessMap,Be=!!y.gradientMap,ne=!!y.alphaMap,b=y.alphaTest>0,se=!!y.alphaHash,re=!!y.extensions,Te=!!O.attributes.uv1,ye=!!O.attributes.uv2,qe=!!O.attributes.uv3;let $e=0;return y.toneMapped&&(fe===null||fe.isXRRenderTarget===!0)&&($e=r.toneMapping),{isWebGL2:d,shaderID:H,shaderType:y.type,shaderName:y.name,vertexShader:G,fragmentShader:q,defines:y.defines,customVertexShaderID:ae,customFragmentShaderID:pe,isRawShaderMaterial:y.isRawShaderMaterial===!0,glslVersion:y.glslVersion,precision:m,batching:we,instancing:Ae,instancingColor:Ae&&ie.instanceColor!==null,supportsVertexTextures:f,outputColorSpace:fe===null?r.outputColorSpace:fe.isXRRenderTarget===!0?fe.texture.colorSpace:kt,map:xe,matcap:he,envMap:L,envMapMode:L&&X.mapping,envMapCubeUVHeight:V,aoMap:pt,lightMap:Se,bumpMap:Re,normalMap:me,displacementMap:f&&je,emissiveMap:Ue,normalMapObjectSpace:me&&y.normalMapType===1,normalMapTangentSpace:me&&y.normalMapType===0,metalnessMap:M,roughnessMap:v,anisotropy:F,anisotropyMap:oe,clearcoat:Q,clearcoatMap:de,clearcoatNormalMap:Ee,clearcoatRoughnessMap:Fe,iridescence:Z,iridescenceMap:j,iridescenceThicknessMap:Xe,sheen:ee,sheenColorMap:Ge,sheenRoughnessMap:Ce,specularMap:ve,specularColorMap:ue,specularIntensityMap:Ie,transmission:ge,transmissionMap:He,thicknessMap:Je,gradientMap:Be,opaque:y.transparent===!1&&y.blending===1,alphaMap:ne,alphaTest:b,alphaHash:se,combine:y.combine,mapUv:xe&&_(y.map.channel),aoMapUv:pt&&_(y.aoMap.channel),lightMapUv:Se&&_(y.lightMap.channel),bumpMapUv:Re&&_(y.bumpMap.channel),normalMapUv:me&&_(y.normalMap.channel),displacementMapUv:je&&_(y.displacementMap.channel),emissiveMapUv:Ue&&_(y.emissiveMap.channel),metalnessMapUv:M&&_(y.metalnessMap.channel),roughnessMapUv:v&&_(y.roughnessMap.channel),anisotropyMapUv:oe&&_(y.anisotropyMap.channel),clearcoatMapUv:de&&_(y.clearcoatMap.channel),clearcoatNormalMapUv:Ee&&_(y.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Fe&&_(y.clearcoatRoughnessMap.channel),iridescenceMapUv:j&&_(y.iridescenceMap.channel),iridescenceThicknessMapUv:Xe&&_(y.iridescenceThicknessMap.channel),sheenColorMapUv:Ge&&_(y.sheenColorMap.channel),sheenRoughnessMapUv:Ce&&_(y.sheenRoughnessMap.channel),specularMapUv:ve&&_(y.specularMap.channel),specularColorMapUv:ue&&_(y.specularColorMap.channel),specularIntensityMapUv:Ie&&_(y.specularIntensityMap.channel),transmissionMapUv:He&&_(y.transmissionMap.channel),thicknessMapUv:Je&&_(y.thicknessMap.channel),alphaMapUv:ne&&_(y.alphaMap.channel),vertexTangents:!!O.attributes.tangent&&(me||F),vertexColors:y.vertexColors,vertexAlphas:y.vertexColors===!0&&!!O.attributes.color&&O.attributes.color.itemSize===4,vertexUv1s:Te,vertexUv2s:ye,vertexUv3s:qe,pointsUvs:ie.isPoints===!0&&!!O.attributes.uv&&(xe||ne),fog:!!R,useFog:y.fog===!0,fogExp2:R&&R.isFogExp2,flatShading:y.flatShading===!0,sizeAttenuation:y.sizeAttenuation===!0,logarithmicDepthBuffer:u,skinning:ie.isSkinnedMesh===!0,morphTargets:O.morphAttributes.position!==void 0,morphNormals:O.morphAttributes.normal!==void 0,morphColors:O.morphAttributes.color!==void 0,morphTargetsCount:J,morphTextureStride:le,numDirLights:E.directional.length,numPointLights:E.point.length,numSpotLights:E.spot.length,numSpotLightMaps:E.spotLightMap.length,numRectAreaLights:E.rectArea.length,numHemiLights:E.hemi.length,numDirLightShadows:E.directionalShadowMap.length,numPointLightShadows:E.pointShadowMap.length,numSpotLightShadows:E.spotShadowMap.length,numSpotLightShadowsWithMaps:E.numSpotLightShadowsWithMaps,numLightProbes:E.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:y.dithering,shadowMapEnabled:r.shadowMap.enabled&&k.length>0,shadowMapType:r.shadowMap.type,toneMapping:$e,useLegacyLights:r._useLegacyLights,decodeVideoTexture:xe&&y.map.isVideoTexture===!0&&We.getTransfer(y.map.colorSpace)===Ke,premultipliedAlpha:y.premultipliedAlpha,doubleSided:y.side===2,flipSided:y.side===1,useDepthPacking:y.depthPacking>=0,depthPacking:y.depthPacking||0,index0AttributeName:y.index0AttributeName,extensionDerivatives:re&&y.extensions.derivatives===!0,extensionFragDepth:re&&y.extensions.fragDepth===!0,extensionDrawBuffers:re&&y.extensions.drawBuffers===!0,extensionShaderTextureLOD:re&&y.extensions.shaderTextureLOD===!0,extensionClipCullDistance:re&&y.extensions.clipCullDistance&&n.has("WEBGL_clip_cull_distance"),rendererExtensionFragDepth:d||n.has("EXT_frag_depth"),rendererExtensionDrawBuffers:d||n.has("WEBGL_draw_buffers"),rendererExtensionShaderTextureLod:d||n.has("EXT_shader_texture_lod"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:y.customProgramCacheKey()}}function h(y){const E=[];if(y.shaderID?E.push(y.shaderID):(E.push(y.customVertexShaderID),E.push(y.customFragmentShaderID)),y.defines!==void 0)for(const k in y.defines)E.push(k),E.push(y.defines[k]);return y.isRawShaderMaterial===!1&&(T(E,y),x(E,y),E.push(r.outputColorSpace)),E.push(y.customProgramCacheKey),E.join()}function T(y,E){y.push(E.precision),y.push(E.outputColorSpace),y.push(E.envMapMode),y.push(E.envMapCubeUVHeight),y.push(E.mapUv),y.push(E.alphaMapUv),y.push(E.lightMapUv),y.push(E.aoMapUv),y.push(E.bumpMapUv),y.push(E.normalMapUv),y.push(E.displacementMapUv),y.push(E.emissiveMapUv),y.push(E.metalnessMapUv),y.push(E.roughnessMapUv),y.push(E.anisotropyMapUv),y.push(E.clearcoatMapUv),y.push(E.clearcoatNormalMapUv),y.push(E.clearcoatRoughnessMapUv),y.push(E.iridescenceMapUv),y.push(E.iridescenceThicknessMapUv),y.push(E.sheenColorMapUv),y.push(E.sheenRoughnessMapUv),y.push(E.specularMapUv),y.push(E.specularColorMapUv),y.push(E.specularIntensityMapUv),y.push(E.transmissionMapUv),y.push(E.thicknessMapUv),y.push(E.combine),y.push(E.fogExp2),y.push(E.sizeAttenuation),y.push(E.morphTargetsCount),y.push(E.morphAttributeCount),y.push(E.numDirLights),y.push(E.numPointLights),y.push(E.numSpotLights),y.push(E.numSpotLightMaps),y.push(E.numHemiLights),y.push(E.numRectAreaLights),y.push(E.numDirLightShadows),y.push(E.numPointLightShadows),y.push(E.numSpotLightShadows),y.push(E.numSpotLightShadowsWithMaps),y.push(E.numLightProbes),y.push(E.shadowMapType),y.push(E.toneMapping),y.push(E.numClippingPlanes),y.push(E.numClipIntersection),y.push(E.depthPacking)}function x(y,E){a.disableAll(),E.isWebGL2&&a.enable(0),E.supportsVertexTextures&&a.enable(1),E.instancing&&a.enable(2),E.instancingColor&&a.enable(3),E.matcap&&a.enable(4),E.envMap&&a.enable(5),E.normalMapObjectSpace&&a.enable(6),E.normalMapTangentSpace&&a.enable(7),E.clearcoat&&a.enable(8),E.iridescence&&a.enable(9),E.alphaTest&&a.enable(10),E.vertexColors&&a.enable(11),E.vertexAlphas&&a.enable(12),E.vertexUv1s&&a.enable(13),E.vertexUv2s&&a.enable(14),E.vertexUv3s&&a.enable(15),E.vertexTangents&&a.enable(16),E.anisotropy&&a.enable(17),E.alphaHash&&a.enable(18),E.batching&&a.enable(19),y.push(a.mask),a.disableAll(),E.fog&&a.enable(0),E.useFog&&a.enable(1),E.flatShading&&a.enable(2),E.logarithmicDepthBuffer&&a.enable(3),E.skinning&&a.enable(4),E.morphTargets&&a.enable(5),E.morphNormals&&a.enable(6),E.morphColors&&a.enable(7),E.premultipliedAlpha&&a.enable(8),E.shadowMapEnabled&&a.enable(9),E.useLegacyLights&&a.enable(10),E.doubleSided&&a.enable(11),E.flipSided&&a.enable(12),E.useDepthPacking&&a.enable(13),E.dithering&&a.enable(14),E.transmission&&a.enable(15),E.sheen&&a.enable(16),E.opaque&&a.enable(17),E.pointsUvs&&a.enable(18),E.decodeVideoTexture&&a.enable(19),y.push(a.mask)}function w(y){const E=g[y.type];let k;if(E){const Y=Ot[E];k=sa.clone(Y.uniforms)}else k=y.uniforms;return k}function D(y,E){let k;for(let Y=0,ie=c.length;Y<ie;Y++){const R=c[Y];if(R.cacheKey===E){k=R,++k.usedTimes;break}}return k===void 0&&(k=new kc(r,E,y,i),c.push(k)),k}function C(y){if(--y.usedTimes===0){const E=c.indexOf(y);c[E]=c[c.length-1],c.pop(),y.destroy()}}function A(y){l.remove(y)}function $(){l.dispose()}return{getParameters:p,getProgramCacheKey:h,getUniforms:w,acquireProgram:D,releaseProgram:C,releaseShaderCache:A,programs:c,dispose:$}}function Wc(){let r=new WeakMap;function e(i){let o=r.get(i);return o===void 0&&(o={},r.set(i,o)),o}function t(i){r.delete(i)}function n(i,o,a){r.get(i)[o]=a}function s(){r=new WeakMap}return{get:e,remove:t,update:n,dispose:s}}function Xc(r,e){return r.groupOrder!==e.groupOrder?r.groupOrder-e.groupOrder:r.renderOrder!==e.renderOrder?r.renderOrder-e.renderOrder:r.material.id!==e.material.id?r.material.id-e.material.id:r.z!==e.z?r.z-e.z:r.id-e.id}function Tr(r,e){return r.groupOrder!==e.groupOrder?r.groupOrder-e.groupOrder:r.renderOrder!==e.renderOrder?r.renderOrder-e.renderOrder:r.z!==e.z?e.z-r.z:r.id-e.id}function br(){const r=[];let e=0;const t=[],n=[],s=[];function i(){e=0,t.length=0,n.length=0,s.length=0}function o(u,f,m,g,_,p){let h=r[e];return h===void 0?(h={id:u.id,object:u,geometry:f,material:m,groupOrder:g,renderOrder:u.renderOrder,z:_,group:p},r[e]=h):(h.id=u.id,h.object=u,h.geometry=f,h.material=m,h.groupOrder=g,h.renderOrder=u.renderOrder,h.z=_,h.group=p),e++,h}function a(u,f,m,g,_,p){const h=o(u,f,m,g,_,p);m.transmission>0?n.push(h):m.transparent===!0?s.push(h):t.push(h)}function l(u,f,m,g,_,p){const h=o(u,f,m,g,_,p);m.transmission>0?n.unshift(h):m.transparent===!0?s.unshift(h):t.unshift(h)}function c(u,f){t.length>1&&t.sort(u||Xc),n.length>1&&n.sort(f||Tr),s.length>1&&s.sort(f||Tr)}function d(){for(let u=e,f=r.length;u<f;u++){const m=r[u];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:t,transmissive:n,transparent:s,init:i,push:a,unshift:l,finish:d,sort:c}}function qc(){let r=new WeakMap;function e(n,s){const i=r.get(n);let o;return i===void 0?(o=new br,r.set(n,[o])):s>=i.length?(o=new br,i.push(o)):o=i[s],o}function t(){r=new WeakMap}return{get:e,dispose:t}}function $c(){const r={};return{get:function(e){if(r[e.id]!==void 0)return r[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new I,color:new ze};break;case"SpotLight":t={position:new I,direction:new I,color:new ze,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new I,color:new ze,distance:0,decay:0};break;case"HemisphereLight":t={direction:new I,skyColor:new ze,groundColor:new ze};break;case"RectAreaLight":t={color:new ze,position:new I,halfWidth:new I,halfHeight:new I};break}return r[e.id]=t,t}}}function Yc(){const r={};return{get:function(e){if(r[e.id]!==void 0)return r[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ve};break;case"SpotLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ve};break;case"PointLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ve,shadowCameraNear:1,shadowCameraFar:1e3};break}return r[e.id]=t,t}}}let Kc=0;function jc(r,e){return(e.castShadow?2:0)-(r.castShadow?2:0)+(e.map?1:0)-(r.map?1:0)}function Zc(r,e){const t=new $c,n=Yc(),s={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let d=0;d<9;d++)s.probe.push(new I);const i=new I,o=new st,a=new st;function l(d,u){let f=0,m=0,g=0;for(let Y=0;Y<9;Y++)s.probe[Y].set(0,0,0);let _=0,p=0,h=0,T=0,x=0,w=0,D=0,C=0,A=0,$=0,y=0;d.sort(jc);const E=u===!0?Math.PI:1;for(let Y=0,ie=d.length;Y<ie;Y++){const R=d[Y],O=R.color,z=R.intensity,X=R.distance,V=R.shadow&&R.shadow.map?R.shadow.map.texture:null;if(R.isAmbientLight)f+=O.r*z*E,m+=O.g*z*E,g+=O.b*z*E;else if(R.isLightProbe){for(let H=0;H<9;H++)s.probe[H].addScaledVector(R.sh.coefficients[H],z);y++}else if(R.isDirectionalLight){const H=t.get(R);if(H.color.copy(R.color).multiplyScalar(R.intensity*E),R.castShadow){const K=R.shadow,J=n.get(R);J.shadowBias=K.bias,J.shadowNormalBias=K.normalBias,J.shadowRadius=K.radius,J.shadowMapSize=K.mapSize,s.directionalShadow[_]=J,s.directionalShadowMap[_]=V,s.directionalShadowMatrix[_]=R.shadow.matrix,w++}s.directional[_]=H,_++}else if(R.isSpotLight){const H=t.get(R);H.position.setFromMatrixPosition(R.matrixWorld),H.color.copy(O).multiplyScalar(z*E),H.distance=X,H.coneCos=Math.cos(R.angle),H.penumbraCos=Math.cos(R.angle*(1-R.penumbra)),H.decay=R.decay,s.spot[h]=H;const K=R.shadow;if(R.map&&(s.spotLightMap[A]=R.map,A++,K.updateMatrices(R),R.castShadow&&$++),s.spotLightMatrix[h]=K.matrix,R.castShadow){const J=n.get(R);J.shadowBias=K.bias,J.shadowNormalBias=K.normalBias,J.shadowRadius=K.radius,J.shadowMapSize=K.mapSize,s.spotShadow[h]=J,s.spotShadowMap[h]=V,C++}h++}else if(R.isRectAreaLight){const H=t.get(R);H.color.copy(O).multiplyScalar(z),H.halfWidth.set(R.width*.5,0,0),H.halfHeight.set(0,R.height*.5,0),s.rectArea[T]=H,T++}else if(R.isPointLight){const H=t.get(R);if(H.color.copy(R.color).multiplyScalar(R.intensity*E),H.distance=R.distance,H.decay=R.decay,R.castShadow){const K=R.shadow,J=n.get(R);J.shadowBias=K.bias,J.shadowNormalBias=K.normalBias,J.shadowRadius=K.radius,J.shadowMapSize=K.mapSize,J.shadowCameraNear=K.camera.near,J.shadowCameraFar=K.camera.far,s.pointShadow[p]=J,s.pointShadowMap[p]=V,s.pointShadowMatrix[p]=R.shadow.matrix,D++}s.point[p]=H,p++}else if(R.isHemisphereLight){const H=t.get(R);H.skyColor.copy(R.color).multiplyScalar(z*E),H.groundColor.copy(R.groundColor).multiplyScalar(z*E),s.hemi[x]=H,x++}}T>0&&(e.isWebGL2?r.has("OES_texture_float_linear")===!0?(s.rectAreaLTC1=te.LTC_FLOAT_1,s.rectAreaLTC2=te.LTC_FLOAT_2):(s.rectAreaLTC1=te.LTC_HALF_1,s.rectAreaLTC2=te.LTC_HALF_2):r.has("OES_texture_float_linear")===!0?(s.rectAreaLTC1=te.LTC_FLOAT_1,s.rectAreaLTC2=te.LTC_FLOAT_2):r.has("OES_texture_half_float_linear")===!0?(s.rectAreaLTC1=te.LTC_HALF_1,s.rectAreaLTC2=te.LTC_HALF_2):console.error("THREE.WebGLRenderer: Unable to use RectAreaLight. Missing WebGL extensions.")),s.ambient[0]=f,s.ambient[1]=m,s.ambient[2]=g;const k=s.hash;(k.directionalLength!==_||k.pointLength!==p||k.spotLength!==h||k.rectAreaLength!==T||k.hemiLength!==x||k.numDirectionalShadows!==w||k.numPointShadows!==D||k.numSpotShadows!==C||k.numSpotMaps!==A||k.numLightProbes!==y)&&(s.directional.length=_,s.spot.length=h,s.rectArea.length=T,s.point.length=p,s.hemi.length=x,s.directionalShadow.length=w,s.directionalShadowMap.length=w,s.pointShadow.length=D,s.pointShadowMap.length=D,s.spotShadow.length=C,s.spotShadowMap.length=C,s.directionalShadowMatrix.length=w,s.pointShadowMatrix.length=D,s.spotLightMatrix.length=C+A-$,s.spotLightMap.length=A,s.numSpotLightShadowsWithMaps=$,s.numLightProbes=y,k.directionalLength=_,k.pointLength=p,k.spotLength=h,k.rectAreaLength=T,k.hemiLength=x,k.numDirectionalShadows=w,k.numPointShadows=D,k.numSpotShadows=C,k.numSpotMaps=A,k.numLightProbes=y,s.version=Kc++)}function c(d,u){let f=0,m=0,g=0,_=0,p=0;const h=u.matrixWorldInverse;for(let T=0,x=d.length;T<x;T++){const w=d[T];if(w.isDirectionalLight){const D=s.directional[f];D.direction.setFromMatrixPosition(w.matrixWorld),i.setFromMatrixPosition(w.target.matrixWorld),D.direction.sub(i),D.direction.transformDirection(h),f++}else if(w.isSpotLight){const D=s.spot[g];D.position.setFromMatrixPosition(w.matrixWorld),D.position.applyMatrix4(h),D.direction.setFromMatrixPosition(w.matrixWorld),i.setFromMatrixPosition(w.target.matrixWorld),D.direction.sub(i),D.direction.transformDirection(h),g++}else if(w.isRectAreaLight){const D=s.rectArea[_];D.position.setFromMatrixPosition(w.matrixWorld),D.position.applyMatrix4(h),a.identity(),o.copy(w.matrixWorld),o.premultiply(h),a.extractRotation(o),D.halfWidth.set(w.width*.5,0,0),D.halfHeight.set(0,w.height*.5,0),D.halfWidth.applyMatrix4(a),D.halfHeight.applyMatrix4(a),_++}else if(w.isPointLight){const D=s.point[m];D.position.setFromMatrixPosition(w.matrixWorld),D.position.applyMatrix4(h),m++}else if(w.isHemisphereLight){const D=s.hemi[p];D.direction.setFromMatrixPosition(w.matrixWorld),D.direction.transformDirection(h),p++}}}return{setup:l,setupView:c,state:s}}function Ar(r,e){const t=new Zc(r,e),n=[],s=[];function i(){n.length=0,s.length=0}function o(u){n.push(u)}function a(u){s.push(u)}function l(u){t.setup(n,u)}function c(u){t.setupView(n,u)}return{init:i,state:{lightsArray:n,shadowsArray:s,lights:t},setupLights:l,setupLightsView:c,pushLight:o,pushShadow:a}}function Jc(r,e){let t=new WeakMap;function n(i,o=0){const a=t.get(i);let l;return a===void 0?(l=new Ar(r,e),t.set(i,[l])):o>=a.length?(l=new Ar(r,e),a.push(l)):l=a[o],l}function s(){t=new WeakMap}return{get:n,dispose:s}}class Qc extends Hn{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=3200,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class ed extends Hn{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}const td=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,nd=`uniform sampler2D shadow_pass;
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
}`;function id(r,e,t){let n=new js;const s=new Ve,i=new Ve,o=new ct,a=new Qc({depthPacking:3201}),l=new ed,c={},d=t.maxTextureSize,u={0:1,1:0,2:2},f=new nn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Ve},radius:{value:4}},vertexShader:td,fragmentShader:nd}),m=f.clone();m.defines.HORIZONTAL_PASS=1;const g=new Nt;g.setAttribute("position",new bt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const _=new Xt(g,f),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=1;let h=this.type;this.render=function(C,A,$){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||C.length===0)return;const y=r.getRenderTarget(),E=r.getActiveCubeFace(),k=r.getActiveMipmapLevel(),Y=r.state;Y.setBlending(0),Y.buffers.color.setClear(1,1,1,1),Y.buffers.depth.setTest(!0),Y.setScissorTest(!1);const ie=h!==3&&this.type===3,R=h===3&&this.type!==3;for(let O=0,z=C.length;O<z;O++){const X=C[O],V=X.shadow;if(V===void 0){console.warn("THREE.WebGLShadowMap:",X,"has no shadow.");continue}if(V.autoUpdate===!1&&V.needsUpdate===!1)continue;s.copy(V.mapSize);const H=V.getFrameExtents();if(s.multiply(H),i.copy(V.mapSize),(s.x>d||s.y>d)&&(s.x>d&&(i.x=Math.floor(d/H.x),s.x=i.x*H.x,V.mapSize.x=i.x),s.y>d&&(i.y=Math.floor(d/H.y),s.y=i.y*H.y,V.mapSize.y=i.y)),V.map===null||ie===!0||R===!0){const J=this.type!==3?{minFilter:1003,magFilter:1003}:{};V.map!==null&&V.map.dispose(),V.map=new Jt(s.x,s.y,J),V.map.texture.name=X.name+".shadowMap",V.camera.updateProjectionMatrix()}r.setRenderTarget(V.map),r.clear();const K=V.getViewportCount();for(let J=0;J<K;J++){const le=V.getViewport(J);o.set(i.x*le.x,i.y*le.y,i.x*le.z,i.y*le.w),Y.viewport(o),V.updateMatrices(X,J),n=V.getFrustum(),w(A,$,V.camera,X,this.type)}V.isPointLightShadow!==!0&&this.type===3&&T(V,$),V.needsUpdate=!1}h=this.type,p.needsUpdate=!1,r.setRenderTarget(y,E,k)};function T(C,A){const $=e.update(_);f.defines.VSM_SAMPLES!==C.blurSamples&&(f.defines.VSM_SAMPLES=C.blurSamples,m.defines.VSM_SAMPLES=C.blurSamples,f.needsUpdate=!0,m.needsUpdate=!0),C.mapPass===null&&(C.mapPass=new Jt(s.x,s.y)),f.uniforms.shadow_pass.value=C.map.texture,f.uniforms.resolution.value=C.mapSize,f.uniforms.radius.value=C.radius,r.setRenderTarget(C.mapPass),r.clear(),r.renderBufferDirect(A,null,$,f,_,null),m.uniforms.shadow_pass.value=C.mapPass.texture,m.uniforms.resolution.value=C.mapSize,m.uniforms.radius.value=C.radius,r.setRenderTarget(C.map),r.clear(),r.renderBufferDirect(A,null,$,m,_,null)}function x(C,A,$,y){let E=null;const k=$.isPointLight===!0?C.customDistanceMaterial:C.customDepthMaterial;if(k!==void 0)E=k;else if(E=$.isPointLight===!0?l:a,r.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0){const Y=E.uuid,ie=A.uuid;let R=c[Y];R===void 0&&(R={},c[Y]=R);let O=R[ie];O===void 0&&(O=E.clone(),R[ie]=O,A.addEventListener("dispose",D)),E=O}if(E.visible=A.visible,E.wireframe=A.wireframe,y===3?E.side=A.shadowSide!==null?A.shadowSide:A.side:E.side=A.shadowSide!==null?A.shadowSide:u[A.side],E.alphaMap=A.alphaMap,E.alphaTest=A.alphaTest,E.map=A.map,E.clipShadows=A.clipShadows,E.clippingPlanes=A.clippingPlanes,E.clipIntersection=A.clipIntersection,E.displacementMap=A.displacementMap,E.displacementScale=A.displacementScale,E.displacementBias=A.displacementBias,E.wireframeLinewidth=A.wireframeLinewidth,E.linewidth=A.linewidth,$.isPointLight===!0&&E.isMeshDistanceMaterial===!0){const Y=r.properties.get(E);Y.light=$}return E}function w(C,A,$,y,E){if(C.visible===!1)return;if(C.layers.test(A.layers)&&(C.isMesh||C.isLine||C.isPoints)&&(C.castShadow||C.receiveShadow&&E===3)&&(!C.frustumCulled||n.intersectsObject(C))){C.modelViewMatrix.multiplyMatrices($.matrixWorldInverse,C.matrixWorld);const ie=e.update(C),R=C.material;if(Array.isArray(R)){const O=ie.groups;for(let z=0,X=O.length;z<X;z++){const V=O[z],H=R[V.materialIndex];if(H&&H.visible){const K=x(C,H,y,E);C.onBeforeShadow(r,C,A,$,ie,K,V),r.renderBufferDirect($,null,ie,K,C,V),C.onAfterShadow(r,C,A,$,ie,K,V)}}}else if(R.visible){const O=x(C,R,y,E);C.onBeforeShadow(r,C,A,$,ie,O,null),r.renderBufferDirect($,null,ie,O,C,null),C.onAfterShadow(r,C,A,$,ie,O,null)}}const Y=C.children;for(let ie=0,R=Y.length;ie<R;ie++)w(Y[ie],A,$,y,E)}function D(C){C.target.removeEventListener("dispose",D);for(const $ in c){const y=c[$],E=C.target.uuid;E in y&&(y[E].dispose(),delete y[E])}}}function sd(r,e,t){const n=t.isWebGL2;function s(){let b=!1;const se=new ct;let re=null;const Te=new ct(0,0,0,0);return{setMask:function(ye){re!==ye&&!b&&(r.colorMask(ye,ye,ye,ye),re=ye)},setLocked:function(ye){b=ye},setClear:function(ye,qe,$e,at,mt){mt===!0&&(ye*=at,qe*=at,$e*=at),se.set(ye,qe,$e,at),Te.equals(se)===!1&&(r.clearColor(ye,qe,$e,at),Te.copy(se))},reset:function(){b=!1,re=null,Te.set(-1,0,0,0)}}}function i(){let b=!1,se=null,re=null,Te=null;return{setTest:function(ye){ye?we(r.DEPTH_TEST):xe(r.DEPTH_TEST)},setMask:function(ye){se!==ye&&!b&&(r.depthMask(ye),se=ye)},setFunc:function(ye){if(re!==ye){switch(ye){case 0:r.depthFunc(r.NEVER);break;case 1:r.depthFunc(r.ALWAYS);break;case 2:r.depthFunc(r.LESS);break;case 3:r.depthFunc(r.LEQUAL);break;case 4:r.depthFunc(r.EQUAL);break;case 5:r.depthFunc(r.GEQUAL);break;case 6:r.depthFunc(r.GREATER);break;case 7:r.depthFunc(r.NOTEQUAL);break;default:r.depthFunc(r.LEQUAL)}re=ye}},setLocked:function(ye){b=ye},setClear:function(ye){Te!==ye&&(r.clearDepth(ye),Te=ye)},reset:function(){b=!1,se=null,re=null,Te=null}}}function o(){let b=!1,se=null,re=null,Te=null,ye=null,qe=null,$e=null,at=null,mt=null;return{setTest:function(Ye){b||(Ye?we(r.STENCIL_TEST):xe(r.STENCIL_TEST))},setMask:function(Ye){se!==Ye&&!b&&(r.stencilMask(Ye),se=Ye)},setFunc:function(Ye,gt,Bt){(re!==Ye||Te!==gt||ye!==Bt)&&(r.stencilFunc(Ye,gt,Bt),re=Ye,Te=gt,ye=Bt)},setOp:function(Ye,gt,Bt){(qe!==Ye||$e!==gt||at!==Bt)&&(r.stencilOp(Ye,gt,Bt),qe=Ye,$e=gt,at=Bt)},setLocked:function(Ye){b=Ye},setClear:function(Ye){mt!==Ye&&(r.clearStencil(Ye),mt=Ye)},reset:function(){b=!1,se=null,re=null,Te=null,ye=null,qe=null,$e=null,at=null,mt=null}}}const a=new s,l=new i,c=new o,d=new WeakMap,u=new WeakMap;let f={},m={},g=new WeakMap,_=[],p=null,h=!1,T=null,x=null,w=null,D=null,C=null,A=null,$=null,y=new ze(0,0,0),E=0,k=!1,Y=null,ie=null,R=null,O=null,z=null;const X=r.getParameter(r.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let V=!1,H=0;const K=r.getParameter(r.VERSION);K.indexOf("WebGL")!==-1?(H=parseFloat(/^WebGL (\d)/.exec(K)[1]),V=H>=1):K.indexOf("OpenGL ES")!==-1&&(H=parseFloat(/^OpenGL ES (\d)/.exec(K)[1]),V=H>=2);let J=null,le={};const G=r.getParameter(r.SCISSOR_BOX),q=r.getParameter(r.VIEWPORT),ae=new ct().fromArray(G),pe=new ct().fromArray(q);function fe(b,se,re,Te){const ye=new Uint8Array(4),qe=r.createTexture();r.bindTexture(b,qe),r.texParameteri(b,r.TEXTURE_MIN_FILTER,r.NEAREST),r.texParameteri(b,r.TEXTURE_MAG_FILTER,r.NEAREST);for(let $e=0;$e<re;$e++)n&&(b===r.TEXTURE_3D||b===r.TEXTURE_2D_ARRAY)?r.texImage3D(se,0,r.RGBA,1,1,Te,0,r.RGBA,r.UNSIGNED_BYTE,ye):r.texImage2D(se+$e,0,r.RGBA,1,1,0,r.RGBA,r.UNSIGNED_BYTE,ye);return qe}const Ae={};Ae[r.TEXTURE_2D]=fe(r.TEXTURE_2D,r.TEXTURE_2D,1),Ae[r.TEXTURE_CUBE_MAP]=fe(r.TEXTURE_CUBE_MAP,r.TEXTURE_CUBE_MAP_POSITIVE_X,6),n&&(Ae[r.TEXTURE_2D_ARRAY]=fe(r.TEXTURE_2D_ARRAY,r.TEXTURE_2D_ARRAY,1,1),Ae[r.TEXTURE_3D]=fe(r.TEXTURE_3D,r.TEXTURE_3D,1,1)),a.setClear(0,0,0,1),l.setClear(1),c.setClear(0),we(r.DEPTH_TEST),l.setFunc(3),Ue(!1),M(1),we(r.CULL_FACE),me(0);function we(b){f[b]!==!0&&(r.enable(b),f[b]=!0)}function xe(b){f[b]!==!1&&(r.disable(b),f[b]=!1)}function he(b,se){return m[b]!==se?(r.bindFramebuffer(b,se),m[b]=se,n&&(b===r.DRAW_FRAMEBUFFER&&(m[r.FRAMEBUFFER]=se),b===r.FRAMEBUFFER&&(m[r.DRAW_FRAMEBUFFER]=se)),!0):!1}function L(b,se){let re=_,Te=!1;if(b)if(re=g.get(se),re===void 0&&(re=[],g.set(se,re)),b.isWebGLMultipleRenderTargets){const ye=b.texture;if(re.length!==ye.length||re[0]!==r.COLOR_ATTACHMENT0){for(let qe=0,$e=ye.length;qe<$e;qe++)re[qe]=r.COLOR_ATTACHMENT0+qe;re.length=ye.length,Te=!0}}else re[0]!==r.COLOR_ATTACHMENT0&&(re[0]=r.COLOR_ATTACHMENT0,Te=!0);else re[0]!==r.BACK&&(re[0]=r.BACK,Te=!0);Te&&(t.isWebGL2?r.drawBuffers(re):e.get("WEBGL_draw_buffers").drawBuffersWEBGL(re))}function pt(b){return p!==b?(r.useProgram(b),p=b,!0):!1}const Se={100:r.FUNC_ADD,101:r.FUNC_SUBTRACT,102:r.FUNC_REVERSE_SUBTRACT};if(n)Se[103]=r.MIN,Se[104]=r.MAX;else{const b=e.get("EXT_blend_minmax");b!==null&&(Se[103]=b.MIN_EXT,Se[104]=b.MAX_EXT)}const Re={200:r.ZERO,201:r.ONE,202:r.SRC_COLOR,204:r.SRC_ALPHA,210:r.SRC_ALPHA_SATURATE,208:r.DST_COLOR,206:r.DST_ALPHA,203:r.ONE_MINUS_SRC_COLOR,205:r.ONE_MINUS_SRC_ALPHA,209:r.ONE_MINUS_DST_COLOR,207:r.ONE_MINUS_DST_ALPHA,211:r.CONSTANT_COLOR,212:r.ONE_MINUS_CONSTANT_COLOR,213:r.CONSTANT_ALPHA,214:r.ONE_MINUS_CONSTANT_ALPHA};function me(b,se,re,Te,ye,qe,$e,at,mt,Ye){if(b===0){h===!0&&(xe(r.BLEND),h=!1);return}if(h===!1&&(we(r.BLEND),h=!0),b!==5){if(b!==T||Ye!==k){if((x!==100||C!==100)&&(r.blendEquation(r.FUNC_ADD),x=100,C=100),Ye)switch(b){case 1:r.blendFuncSeparate(r.ONE,r.ONE_MINUS_SRC_ALPHA,r.ONE,r.ONE_MINUS_SRC_ALPHA);break;case 2:r.blendFunc(r.ONE,r.ONE);break;case 3:r.blendFuncSeparate(r.ZERO,r.ONE_MINUS_SRC_COLOR,r.ZERO,r.ONE);break;case 4:r.blendFuncSeparate(r.ZERO,r.SRC_COLOR,r.ZERO,r.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",b);break}else switch(b){case 1:r.blendFuncSeparate(r.SRC_ALPHA,r.ONE_MINUS_SRC_ALPHA,r.ONE,r.ONE_MINUS_SRC_ALPHA);break;case 2:r.blendFunc(r.SRC_ALPHA,r.ONE);break;case 3:r.blendFuncSeparate(r.ZERO,r.ONE_MINUS_SRC_COLOR,r.ZERO,r.ONE);break;case 4:r.blendFunc(r.ZERO,r.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",b);break}w=null,D=null,A=null,$=null,y.set(0,0,0),E=0,T=b,k=Ye}return}ye=ye||se,qe=qe||re,$e=$e||Te,(se!==x||ye!==C)&&(r.blendEquationSeparate(Se[se],Se[ye]),x=se,C=ye),(re!==w||Te!==D||qe!==A||$e!==$)&&(r.blendFuncSeparate(Re[re],Re[Te],Re[qe],Re[$e]),w=re,D=Te,A=qe,$=$e),(at.equals(y)===!1||mt!==E)&&(r.blendColor(at.r,at.g,at.b,mt),y.copy(at),E=mt),T=b,k=!1}function je(b,se){b.side===2?xe(r.CULL_FACE):we(r.CULL_FACE);let re=b.side===1;se&&(re=!re),Ue(re),b.blending===1&&b.transparent===!1?me(0):me(b.blending,b.blendEquation,b.blendSrc,b.blendDst,b.blendEquationAlpha,b.blendSrcAlpha,b.blendDstAlpha,b.blendColor,b.blendAlpha,b.premultipliedAlpha),l.setFunc(b.depthFunc),l.setTest(b.depthTest),l.setMask(b.depthWrite),a.setMask(b.colorWrite);const Te=b.stencilWrite;c.setTest(Te),Te&&(c.setMask(b.stencilWriteMask),c.setFunc(b.stencilFunc,b.stencilRef,b.stencilFuncMask),c.setOp(b.stencilFail,b.stencilZFail,b.stencilZPass)),F(b.polygonOffset,b.polygonOffsetFactor,b.polygonOffsetUnits),b.alphaToCoverage===!0?we(r.SAMPLE_ALPHA_TO_COVERAGE):xe(r.SAMPLE_ALPHA_TO_COVERAGE)}function Ue(b){Y!==b&&(b?r.frontFace(r.CW):r.frontFace(r.CCW),Y=b)}function M(b){b!==0?(we(r.CULL_FACE),b!==ie&&(b===1?r.cullFace(r.BACK):b===2?r.cullFace(r.FRONT):r.cullFace(r.FRONT_AND_BACK))):xe(r.CULL_FACE),ie=b}function v(b){b!==R&&(V&&r.lineWidth(b),R=b)}function F(b,se,re){b?(we(r.POLYGON_OFFSET_FILL),(O!==se||z!==re)&&(r.polygonOffset(se,re),O=se,z=re)):xe(r.POLYGON_OFFSET_FILL)}function Q(b){b?we(r.SCISSOR_TEST):xe(r.SCISSOR_TEST)}function Z(b){b===void 0&&(b=r.TEXTURE0+X-1),J!==b&&(r.activeTexture(b),J=b)}function ee(b,se,re){re===void 0&&(J===null?re=r.TEXTURE0+X-1:re=J);let Te=le[re];Te===void 0&&(Te={type:void 0,texture:void 0},le[re]=Te),(Te.type!==b||Te.texture!==se)&&(J!==re&&(r.activeTexture(re),J=re),r.bindTexture(b,se||Ae[b]),Te.type=b,Te.texture=se)}function ge(){const b=le[J];b!==void 0&&b.type!==void 0&&(r.bindTexture(b.type,null),b.type=void 0,b.texture=void 0)}function oe(){try{r.compressedTexImage2D.apply(r,arguments)}catch(b){console.error("THREE.WebGLState:",b)}}function de(){try{r.compressedTexImage3D.apply(r,arguments)}catch(b){console.error("THREE.WebGLState:",b)}}function Ee(){try{r.texSubImage2D.apply(r,arguments)}catch(b){console.error("THREE.WebGLState:",b)}}function Fe(){try{r.texSubImage3D.apply(r,arguments)}catch(b){console.error("THREE.WebGLState:",b)}}function j(){try{r.compressedTexSubImage2D.apply(r,arguments)}catch(b){console.error("THREE.WebGLState:",b)}}function Xe(){try{r.compressedTexSubImage3D.apply(r,arguments)}catch(b){console.error("THREE.WebGLState:",b)}}function Ge(){try{r.texStorage2D.apply(r,arguments)}catch(b){console.error("THREE.WebGLState:",b)}}function Ce(){try{r.texStorage3D.apply(r,arguments)}catch(b){console.error("THREE.WebGLState:",b)}}function ve(){try{r.texImage2D.apply(r,arguments)}catch(b){console.error("THREE.WebGLState:",b)}}function ue(){try{r.texImage3D.apply(r,arguments)}catch(b){console.error("THREE.WebGLState:",b)}}function Ie(b){ae.equals(b)===!1&&(r.scissor(b.x,b.y,b.z,b.w),ae.copy(b))}function He(b){pe.equals(b)===!1&&(r.viewport(b.x,b.y,b.z,b.w),pe.copy(b))}function Je(b,se){let re=u.get(se);re===void 0&&(re=new WeakMap,u.set(se,re));let Te=re.get(b);Te===void 0&&(Te=r.getUniformBlockIndex(se,b.name),re.set(b,Te))}function Be(b,se){const Te=u.get(se).get(b);d.get(se)!==Te&&(r.uniformBlockBinding(se,Te,b.__bindingPointIndex),d.set(se,Te))}function ne(){r.disable(r.BLEND),r.disable(r.CULL_FACE),r.disable(r.DEPTH_TEST),r.disable(r.POLYGON_OFFSET_FILL),r.disable(r.SCISSOR_TEST),r.disable(r.STENCIL_TEST),r.disable(r.SAMPLE_ALPHA_TO_COVERAGE),r.blendEquation(r.FUNC_ADD),r.blendFunc(r.ONE,r.ZERO),r.blendFuncSeparate(r.ONE,r.ZERO,r.ONE,r.ZERO),r.blendColor(0,0,0,0),r.colorMask(!0,!0,!0,!0),r.clearColor(0,0,0,0),r.depthMask(!0),r.depthFunc(r.LESS),r.clearDepth(1),r.stencilMask(4294967295),r.stencilFunc(r.ALWAYS,0,4294967295),r.stencilOp(r.KEEP,r.KEEP,r.KEEP),r.clearStencil(0),r.cullFace(r.BACK),r.frontFace(r.CCW),r.polygonOffset(0,0),r.activeTexture(r.TEXTURE0),r.bindFramebuffer(r.FRAMEBUFFER,null),n===!0&&(r.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),r.bindFramebuffer(r.READ_FRAMEBUFFER,null)),r.useProgram(null),r.lineWidth(1),r.scissor(0,0,r.canvas.width,r.canvas.height),r.viewport(0,0,r.canvas.width,r.canvas.height),f={},J=null,le={},m={},g=new WeakMap,_=[],p=null,h=!1,T=null,x=null,w=null,D=null,C=null,A=null,$=null,y=new ze(0,0,0),E=0,k=!1,Y=null,ie=null,R=null,O=null,z=null,ae.set(0,0,r.canvas.width,r.canvas.height),pe.set(0,0,r.canvas.width,r.canvas.height),a.reset(),l.reset(),c.reset()}return{buffers:{color:a,depth:l,stencil:c},enable:we,disable:xe,bindFramebuffer:he,drawBuffers:L,useProgram:pt,setBlending:me,setMaterial:je,setFlipSided:Ue,setCullFace:M,setLineWidth:v,setPolygonOffset:F,setScissorTest:Q,activeTexture:Z,bindTexture:ee,unbindTexture:ge,compressedTexImage2D:oe,compressedTexImage3D:de,texImage2D:ve,texImage3D:ue,updateUBOMapping:Je,uniformBlockBinding:Be,texStorage2D:Ge,texStorage3D:Ce,texSubImage2D:Ee,texSubImage3D:Fe,compressedTexSubImage2D:j,compressedTexSubImage3D:Xe,scissor:Ie,viewport:He,reset:ne}}function rd(r,e,t,n,s,i,o){const a=s.isWebGL2,l=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),d=new WeakMap;let u;const f=new WeakMap;let m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(M,v){return m?new OffscreenCanvas(M,v):Qn("canvas")}function _(M,v,F,Q){let Z=1;if((M.width>Q||M.height>Q)&&(Z=Q/Math.max(M.width,M.height)),Z<1||v===!0)if(typeof HTMLImageElement<"u"&&M instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&M instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&M instanceof ImageBitmap){const ee=v?Oi:Math.floor,ge=ee(Z*M.width),oe=ee(Z*M.height);u===void 0&&(u=g(ge,oe));const de=F?g(ge,oe):u;return de.width=ge,de.height=oe,de.getContext("2d").drawImage(M,0,0,ge,oe),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+M.width+"x"+M.height+") to ("+ge+"x"+oe+")."),de}else return"data"in M&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+M.width+"x"+M.height+")."),M;return M}function p(M){return ys(M.width)&&ys(M.height)}function h(M){return a?!1:M.wrapS!==1001||M.wrapT!==1001||M.minFilter!==1003&&M.minFilter!==1006}function T(M,v){return M.generateMipmaps&&v&&M.minFilter!==1003&&M.minFilter!==1006}function x(M){r.generateMipmap(M)}function w(M,v,F,Q,Z=!1){if(a===!1)return v;if(M!==null){if(r[M]!==void 0)return r[M];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+M+"'")}let ee=v;if(v===r.RED&&(F===r.FLOAT&&(ee=r.R32F),F===r.HALF_FLOAT&&(ee=r.R16F),F===r.UNSIGNED_BYTE&&(ee=r.R8)),v===r.RED_INTEGER&&(F===r.UNSIGNED_BYTE&&(ee=r.R8UI),F===r.UNSIGNED_SHORT&&(ee=r.R16UI),F===r.UNSIGNED_INT&&(ee=r.R32UI),F===r.BYTE&&(ee=r.R8I),F===r.SHORT&&(ee=r.R16I),F===r.INT&&(ee=r.R32I)),v===r.RG&&(F===r.FLOAT&&(ee=r.RG32F),F===r.HALF_FLOAT&&(ee=r.RG16F),F===r.UNSIGNED_BYTE&&(ee=r.RG8)),v===r.RGBA){const ge=Z?jn:We.getTransfer(Q);F===r.FLOAT&&(ee=r.RGBA32F),F===r.HALF_FLOAT&&(ee=r.RGBA16F),F===r.UNSIGNED_BYTE&&(ee=ge===Ke?r.SRGB8_ALPHA8:r.RGBA8),F===r.UNSIGNED_SHORT_4_4_4_4&&(ee=r.RGBA4),F===r.UNSIGNED_SHORT_5_5_5_1&&(ee=r.RGB5_A1)}return(ee===r.R16F||ee===r.R32F||ee===r.RG16F||ee===r.RG32F||ee===r.RGBA16F||ee===r.RGBA32F)&&e.get("EXT_color_buffer_float"),ee}function D(M,v,F){return T(M,F)===!0||M.isFramebufferTexture&&M.minFilter!==1003&&M.minFilter!==1006?Math.log2(Math.max(v.width,v.height))+1:M.mipmaps!==void 0&&M.mipmaps.length>0?M.mipmaps.length:M.isCompressedTexture&&Array.isArray(M.image)?v.mipmaps.length:1}function C(M){return M===1003||M===1004||M===1005?r.NEAREST:r.LINEAR}function A(M){const v=M.target;v.removeEventListener("dispose",A),y(v),v.isVideoTexture&&d.delete(v)}function $(M){const v=M.target;v.removeEventListener("dispose",$),k(v)}function y(M){const v=n.get(M);if(v.__webglInit===void 0)return;const F=M.source,Q=f.get(F);if(Q){const Z=Q[v.__cacheKey];Z.usedTimes--,Z.usedTimes===0&&E(M),Object.keys(Q).length===0&&f.delete(F)}n.remove(M)}function E(M){const v=n.get(M);r.deleteTexture(v.__webglTexture);const F=M.source,Q=f.get(F);delete Q[v.__cacheKey],o.memory.textures--}function k(M){const v=M.texture,F=n.get(M),Q=n.get(v);if(Q.__webglTexture!==void 0&&(r.deleteTexture(Q.__webglTexture),o.memory.textures--),M.depthTexture&&M.depthTexture.dispose(),M.isWebGLCubeRenderTarget)for(let Z=0;Z<6;Z++){if(Array.isArray(F.__webglFramebuffer[Z]))for(let ee=0;ee<F.__webglFramebuffer[Z].length;ee++)r.deleteFramebuffer(F.__webglFramebuffer[Z][ee]);else r.deleteFramebuffer(F.__webglFramebuffer[Z]);F.__webglDepthbuffer&&r.deleteRenderbuffer(F.__webglDepthbuffer[Z])}else{if(Array.isArray(F.__webglFramebuffer))for(let Z=0;Z<F.__webglFramebuffer.length;Z++)r.deleteFramebuffer(F.__webglFramebuffer[Z]);else r.deleteFramebuffer(F.__webglFramebuffer);if(F.__webglDepthbuffer&&r.deleteRenderbuffer(F.__webglDepthbuffer),F.__webglMultisampledFramebuffer&&r.deleteFramebuffer(F.__webglMultisampledFramebuffer),F.__webglColorRenderbuffer)for(let Z=0;Z<F.__webglColorRenderbuffer.length;Z++)F.__webglColorRenderbuffer[Z]&&r.deleteRenderbuffer(F.__webglColorRenderbuffer[Z]);F.__webglDepthRenderbuffer&&r.deleteRenderbuffer(F.__webglDepthRenderbuffer)}if(M.isWebGLMultipleRenderTargets)for(let Z=0,ee=v.length;Z<ee;Z++){const ge=n.get(v[Z]);ge.__webglTexture&&(r.deleteTexture(ge.__webglTexture),o.memory.textures--),n.remove(v[Z])}n.remove(v),n.remove(M)}let Y=0;function ie(){Y=0}function R(){const M=Y;return M>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+M+" texture units while this GPU supports only "+s.maxTextures),Y+=1,M}function O(M){const v=[];return v.push(M.wrapS),v.push(M.wrapT),v.push(M.wrapR||0),v.push(M.magFilter),v.push(M.minFilter),v.push(M.anisotropy),v.push(M.internalFormat),v.push(M.format),v.push(M.type),v.push(M.generateMipmaps),v.push(M.premultiplyAlpha),v.push(M.flipY),v.push(M.unpackAlignment),v.push(M.colorSpace),v.join()}function z(M,v){const F=n.get(M);if(M.isVideoTexture&&je(M),M.isRenderTargetTexture===!1&&M.version>0&&F.__version!==M.version){const Q=M.image;if(Q===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(Q.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{ae(F,M,v);return}}t.bindTexture(r.TEXTURE_2D,F.__webglTexture,r.TEXTURE0+v)}function X(M,v){const F=n.get(M);if(M.version>0&&F.__version!==M.version){ae(F,M,v);return}t.bindTexture(r.TEXTURE_2D_ARRAY,F.__webglTexture,r.TEXTURE0+v)}function V(M,v){const F=n.get(M);if(M.version>0&&F.__version!==M.version){ae(F,M,v);return}t.bindTexture(r.TEXTURE_3D,F.__webglTexture,r.TEXTURE0+v)}function H(M,v){const F=n.get(M);if(M.version>0&&F.__version!==M.version){pe(F,M,v);return}t.bindTexture(r.TEXTURE_CUBE_MAP,F.__webglTexture,r.TEXTURE0+v)}const K={1e3:r.REPEAT,1001:r.CLAMP_TO_EDGE,1002:r.MIRRORED_REPEAT},J={1003:r.NEAREST,1004:r.NEAREST_MIPMAP_NEAREST,1005:r.NEAREST_MIPMAP_LINEAR,1006:r.LINEAR,1007:r.LINEAR_MIPMAP_NEAREST,1008:r.LINEAR_MIPMAP_LINEAR},le={512:r.NEVER,519:r.ALWAYS,513:r.LESS,515:r.LEQUAL,514:r.EQUAL,518:r.GEQUAL,516:r.GREATER,517:r.NOTEQUAL};function G(M,v,F){if(F?(r.texParameteri(M,r.TEXTURE_WRAP_S,K[v.wrapS]),r.texParameteri(M,r.TEXTURE_WRAP_T,K[v.wrapT]),(M===r.TEXTURE_3D||M===r.TEXTURE_2D_ARRAY)&&r.texParameteri(M,r.TEXTURE_WRAP_R,K[v.wrapR]),r.texParameteri(M,r.TEXTURE_MAG_FILTER,J[v.magFilter]),r.texParameteri(M,r.TEXTURE_MIN_FILTER,J[v.minFilter])):(r.texParameteri(M,r.TEXTURE_WRAP_S,r.CLAMP_TO_EDGE),r.texParameteri(M,r.TEXTURE_WRAP_T,r.CLAMP_TO_EDGE),(M===r.TEXTURE_3D||M===r.TEXTURE_2D_ARRAY)&&r.texParameteri(M,r.TEXTURE_WRAP_R,r.CLAMP_TO_EDGE),(v.wrapS!==1001||v.wrapT!==1001)&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping."),r.texParameteri(M,r.TEXTURE_MAG_FILTER,C(v.magFilter)),r.texParameteri(M,r.TEXTURE_MIN_FILTER,C(v.minFilter)),v.minFilter!==1003&&v.minFilter!==1006&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.")),v.compareFunction&&(r.texParameteri(M,r.TEXTURE_COMPARE_MODE,r.COMPARE_REF_TO_TEXTURE),r.texParameteri(M,r.TEXTURE_COMPARE_FUNC,le[v.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){const Q=e.get("EXT_texture_filter_anisotropic");if(v.magFilter===1003||v.minFilter!==1005&&v.minFilter!==1008||v.type===1015&&e.has("OES_texture_float_linear")===!1||a===!1&&v.type===1016&&e.has("OES_texture_half_float_linear")===!1)return;(v.anisotropy>1||n.get(v).__currentAnisotropy)&&(r.texParameterf(M,Q.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(v.anisotropy,s.getMaxAnisotropy())),n.get(v).__currentAnisotropy=v.anisotropy)}}function q(M,v){let F=!1;M.__webglInit===void 0&&(M.__webglInit=!0,v.addEventListener("dispose",A));const Q=v.source;let Z=f.get(Q);Z===void 0&&(Z={},f.set(Q,Z));const ee=O(v);if(ee!==M.__cacheKey){Z[ee]===void 0&&(Z[ee]={texture:r.createTexture(),usedTimes:0},o.memory.textures++,F=!0),Z[ee].usedTimes++;const ge=Z[M.__cacheKey];ge!==void 0&&(Z[M.__cacheKey].usedTimes--,ge.usedTimes===0&&E(v)),M.__cacheKey=ee,M.__webglTexture=Z[ee].texture}return F}function ae(M,v,F){let Q=r.TEXTURE_2D;(v.isDataArrayTexture||v.isCompressedArrayTexture)&&(Q=r.TEXTURE_2D_ARRAY),v.isData3DTexture&&(Q=r.TEXTURE_3D);const Z=q(M,v),ee=v.source;t.bindTexture(Q,M.__webglTexture,r.TEXTURE0+F);const ge=n.get(ee);if(ee.version!==ge.__version||Z===!0){t.activeTexture(r.TEXTURE0+F);const oe=We.getPrimaries(We.workingColorSpace),de=v.colorSpace===Tt?null:We.getPrimaries(v.colorSpace),Ee=v.colorSpace===Tt||oe===de?r.NONE:r.BROWSER_DEFAULT_WEBGL;r.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,v.flipY),r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),r.pixelStorei(r.UNPACK_ALIGNMENT,v.unpackAlignment),r.pixelStorei(r.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ee);const Fe=h(v)&&p(v.image)===!1;let j=_(v.image,Fe,!1,s.maxTextureSize);j=Ue(v,j);const Xe=p(j)||a,Ge=i.convert(v.format,v.colorSpace);let Ce=i.convert(v.type),ve=w(v.internalFormat,Ge,Ce,v.colorSpace,v.isVideoTexture);G(Q,v,Xe);let ue;const Ie=v.mipmaps,He=a&&v.isVideoTexture!==!0&&ve!==36196,Je=ge.__version===void 0||Z===!0,Be=D(v,j,Xe);if(v.isDepthTexture)ve=r.DEPTH_COMPONENT,a?v.type===1015?ve=r.DEPTH_COMPONENT32F:v.type===1014?ve=r.DEPTH_COMPONENT24:v.type===1020?ve=r.DEPTH24_STENCIL8:ve=r.DEPTH_COMPONENT16:v.type===1015&&console.error("WebGLRenderer: Floating point depth texture requires WebGL2."),v.format===1026&&ve===r.DEPTH_COMPONENT&&v.type!==1012&&v.type!==1014&&(console.warn("THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture."),v.type=1014,Ce=i.convert(v.type)),v.format===1027&&ve===r.DEPTH_COMPONENT&&(ve=r.DEPTH_STENCIL,v.type!==1020&&(console.warn("THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture."),v.type=1020,Ce=i.convert(v.type))),Je&&(He?t.texStorage2D(r.TEXTURE_2D,1,ve,j.width,j.height):t.texImage2D(r.TEXTURE_2D,0,ve,j.width,j.height,0,Ge,Ce,null));else if(v.isDataTexture)if(Ie.length>0&&Xe){He&&Je&&t.texStorage2D(r.TEXTURE_2D,Be,ve,Ie[0].width,Ie[0].height);for(let ne=0,b=Ie.length;ne<b;ne++)ue=Ie[ne],He?t.texSubImage2D(r.TEXTURE_2D,ne,0,0,ue.width,ue.height,Ge,Ce,ue.data):t.texImage2D(r.TEXTURE_2D,ne,ve,ue.width,ue.height,0,Ge,Ce,ue.data);v.generateMipmaps=!1}else He?(Je&&t.texStorage2D(r.TEXTURE_2D,Be,ve,j.width,j.height),t.texSubImage2D(r.TEXTURE_2D,0,0,0,j.width,j.height,Ge,Ce,j.data)):t.texImage2D(r.TEXTURE_2D,0,ve,j.width,j.height,0,Ge,Ce,j.data);else if(v.isCompressedTexture)if(v.isCompressedArrayTexture){He&&Je&&t.texStorage3D(r.TEXTURE_2D_ARRAY,Be,ve,Ie[0].width,Ie[0].height,j.depth);for(let ne=0,b=Ie.length;ne<b;ne++)ue=Ie[ne],v.format!==1023?Ge!==null?He?t.compressedTexSubImage3D(r.TEXTURE_2D_ARRAY,ne,0,0,0,ue.width,ue.height,j.depth,Ge,ue.data,0,0):t.compressedTexImage3D(r.TEXTURE_2D_ARRAY,ne,ve,ue.width,ue.height,j.depth,0,ue.data,0,0):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):He?t.texSubImage3D(r.TEXTURE_2D_ARRAY,ne,0,0,0,ue.width,ue.height,j.depth,Ge,Ce,ue.data):t.texImage3D(r.TEXTURE_2D_ARRAY,ne,ve,ue.width,ue.height,j.depth,0,Ge,Ce,ue.data)}else{He&&Je&&t.texStorage2D(r.TEXTURE_2D,Be,ve,Ie[0].width,Ie[0].height);for(let ne=0,b=Ie.length;ne<b;ne++)ue=Ie[ne],v.format!==1023?Ge!==null?He?t.compressedTexSubImage2D(r.TEXTURE_2D,ne,0,0,ue.width,ue.height,Ge,ue.data):t.compressedTexImage2D(r.TEXTURE_2D,ne,ve,ue.width,ue.height,0,ue.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):He?t.texSubImage2D(r.TEXTURE_2D,ne,0,0,ue.width,ue.height,Ge,Ce,ue.data):t.texImage2D(r.TEXTURE_2D,ne,ve,ue.width,ue.height,0,Ge,Ce,ue.data)}else if(v.isDataArrayTexture)He?(Je&&t.texStorage3D(r.TEXTURE_2D_ARRAY,Be,ve,j.width,j.height,j.depth),t.texSubImage3D(r.TEXTURE_2D_ARRAY,0,0,0,0,j.width,j.height,j.depth,Ge,Ce,j.data)):t.texImage3D(r.TEXTURE_2D_ARRAY,0,ve,j.width,j.height,j.depth,0,Ge,Ce,j.data);else if(v.isData3DTexture)He?(Je&&t.texStorage3D(r.TEXTURE_3D,Be,ve,j.width,j.height,j.depth),t.texSubImage3D(r.TEXTURE_3D,0,0,0,0,j.width,j.height,j.depth,Ge,Ce,j.data)):t.texImage3D(r.TEXTURE_3D,0,ve,j.width,j.height,j.depth,0,Ge,Ce,j.data);else if(v.isFramebufferTexture){if(Je)if(He)t.texStorage2D(r.TEXTURE_2D,Be,ve,j.width,j.height);else{let ne=j.width,b=j.height;for(let se=0;se<Be;se++)t.texImage2D(r.TEXTURE_2D,se,ve,ne,b,0,Ge,Ce,null),ne>>=1,b>>=1}}else if(Ie.length>0&&Xe){He&&Je&&t.texStorage2D(r.TEXTURE_2D,Be,ve,Ie[0].width,Ie[0].height);for(let ne=0,b=Ie.length;ne<b;ne++)ue=Ie[ne],He?t.texSubImage2D(r.TEXTURE_2D,ne,0,0,Ge,Ce,ue):t.texImage2D(r.TEXTURE_2D,ne,ve,Ge,Ce,ue);v.generateMipmaps=!1}else He?(Je&&t.texStorage2D(r.TEXTURE_2D,Be,ve,j.width,j.height),t.texSubImage2D(r.TEXTURE_2D,0,0,0,Ge,Ce,j)):t.texImage2D(r.TEXTURE_2D,0,ve,Ge,Ce,j);T(v,Xe)&&x(Q),ge.__version=ee.version,v.onUpdate&&v.onUpdate(v)}M.__version=v.version}function pe(M,v,F){if(v.image.length!==6)return;const Q=q(M,v),Z=v.source;t.bindTexture(r.TEXTURE_CUBE_MAP,M.__webglTexture,r.TEXTURE0+F);const ee=n.get(Z);if(Z.version!==ee.__version||Q===!0){t.activeTexture(r.TEXTURE0+F);const ge=We.getPrimaries(We.workingColorSpace),oe=v.colorSpace===Tt?null:We.getPrimaries(v.colorSpace),de=v.colorSpace===Tt||ge===oe?r.NONE:r.BROWSER_DEFAULT_WEBGL;r.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,v.flipY),r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),r.pixelStorei(r.UNPACK_ALIGNMENT,v.unpackAlignment),r.pixelStorei(r.UNPACK_COLORSPACE_CONVERSION_WEBGL,de);const Ee=v.isCompressedTexture||v.image[0].isCompressedTexture,Fe=v.image[0]&&v.image[0].isDataTexture,j=[];for(let ne=0;ne<6;ne++)!Ee&&!Fe?j[ne]=_(v.image[ne],!1,!0,s.maxCubemapSize):j[ne]=Fe?v.image[ne].image:v.image[ne],j[ne]=Ue(v,j[ne]);const Xe=j[0],Ge=p(Xe)||a,Ce=i.convert(v.format,v.colorSpace),ve=i.convert(v.type),ue=w(v.internalFormat,Ce,ve,v.colorSpace),Ie=a&&v.isVideoTexture!==!0,He=ee.__version===void 0||Q===!0;let Je=D(v,Xe,Ge);G(r.TEXTURE_CUBE_MAP,v,Ge);let Be;if(Ee){Ie&&He&&t.texStorage2D(r.TEXTURE_CUBE_MAP,Je,ue,Xe.width,Xe.height);for(let ne=0;ne<6;ne++){Be=j[ne].mipmaps;for(let b=0;b<Be.length;b++){const se=Be[b];v.format!==1023?Ce!==null?Ie?t.compressedTexSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ne,b,0,0,se.width,se.height,Ce,se.data):t.compressedTexImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ne,b,ue,se.width,se.height,0,se.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Ie?t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ne,b,0,0,se.width,se.height,Ce,ve,se.data):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ne,b,ue,se.width,se.height,0,Ce,ve,se.data)}}}else{Be=v.mipmaps,Ie&&He&&(Be.length>0&&Je++,t.texStorage2D(r.TEXTURE_CUBE_MAP,Je,ue,j[0].width,j[0].height));for(let ne=0;ne<6;ne++)if(Fe){Ie?t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,0,0,j[ne].width,j[ne].height,Ce,ve,j[ne].data):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,ue,j[ne].width,j[ne].height,0,Ce,ve,j[ne].data);for(let b=0;b<Be.length;b++){const re=Be[b].image[ne].image;Ie?t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ne,b+1,0,0,re.width,re.height,Ce,ve,re.data):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ne,b+1,ue,re.width,re.height,0,Ce,ve,re.data)}}else{Ie?t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,0,0,Ce,ve,j[ne]):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,ue,Ce,ve,j[ne]);for(let b=0;b<Be.length;b++){const se=Be[b];Ie?t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ne,b+1,0,0,Ce,ve,se.image[ne]):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ne,b+1,ue,Ce,ve,se.image[ne])}}}T(v,Ge)&&x(r.TEXTURE_CUBE_MAP),ee.__version=Z.version,v.onUpdate&&v.onUpdate(v)}M.__version=v.version}function fe(M,v,F,Q,Z,ee){const ge=i.convert(F.format,F.colorSpace),oe=i.convert(F.type),de=w(F.internalFormat,ge,oe,F.colorSpace);if(!n.get(v).__hasExternalTextures){const Fe=Math.max(1,v.width>>ee),j=Math.max(1,v.height>>ee);Z===r.TEXTURE_3D||Z===r.TEXTURE_2D_ARRAY?t.texImage3D(Z,ee,de,Fe,j,v.depth,0,ge,oe,null):t.texImage2D(Z,ee,de,Fe,j,0,ge,oe,null)}t.bindFramebuffer(r.FRAMEBUFFER,M),me(v)?l.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,Q,Z,n.get(F).__webglTexture,0,Re(v)):(Z===r.TEXTURE_2D||Z>=r.TEXTURE_CUBE_MAP_POSITIVE_X&&Z<=r.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&r.framebufferTexture2D(r.FRAMEBUFFER,Q,Z,n.get(F).__webglTexture,ee),t.bindFramebuffer(r.FRAMEBUFFER,null)}function Ae(M,v,F){if(r.bindRenderbuffer(r.RENDERBUFFER,M),v.depthBuffer&&!v.stencilBuffer){let Q=a===!0?r.DEPTH_COMPONENT24:r.DEPTH_COMPONENT16;if(F||me(v)){const Z=v.depthTexture;Z&&Z.isDepthTexture&&(Z.type===1015?Q=r.DEPTH_COMPONENT32F:Z.type===1014&&(Q=r.DEPTH_COMPONENT24));const ee=Re(v);me(v)?l.renderbufferStorageMultisampleEXT(r.RENDERBUFFER,ee,Q,v.width,v.height):r.renderbufferStorageMultisample(r.RENDERBUFFER,ee,Q,v.width,v.height)}else r.renderbufferStorage(r.RENDERBUFFER,Q,v.width,v.height);r.framebufferRenderbuffer(r.FRAMEBUFFER,r.DEPTH_ATTACHMENT,r.RENDERBUFFER,M)}else if(v.depthBuffer&&v.stencilBuffer){const Q=Re(v);F&&me(v)===!1?r.renderbufferStorageMultisample(r.RENDERBUFFER,Q,r.DEPTH24_STENCIL8,v.width,v.height):me(v)?l.renderbufferStorageMultisampleEXT(r.RENDERBUFFER,Q,r.DEPTH24_STENCIL8,v.width,v.height):r.renderbufferStorage(r.RENDERBUFFER,r.DEPTH_STENCIL,v.width,v.height),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.DEPTH_STENCIL_ATTACHMENT,r.RENDERBUFFER,M)}else{const Q=v.isWebGLMultipleRenderTargets===!0?v.texture:[v.texture];for(let Z=0;Z<Q.length;Z++){const ee=Q[Z],ge=i.convert(ee.format,ee.colorSpace),oe=i.convert(ee.type),de=w(ee.internalFormat,ge,oe,ee.colorSpace),Ee=Re(v);F&&me(v)===!1?r.renderbufferStorageMultisample(r.RENDERBUFFER,Ee,de,v.width,v.height):me(v)?l.renderbufferStorageMultisampleEXT(r.RENDERBUFFER,Ee,de,v.width,v.height):r.renderbufferStorage(r.RENDERBUFFER,de,v.width,v.height)}}r.bindRenderbuffer(r.RENDERBUFFER,null)}function we(M,v){if(v&&v.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(r.FRAMEBUFFER,M),!(v.depthTexture&&v.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!n.get(v.depthTexture).__webglTexture||v.depthTexture.image.width!==v.width||v.depthTexture.image.height!==v.height)&&(v.depthTexture.image.width=v.width,v.depthTexture.image.height=v.height,v.depthTexture.needsUpdate=!0),z(v.depthTexture,0);const Q=n.get(v.depthTexture).__webglTexture,Z=Re(v);if(v.depthTexture.format===1026)me(v)?l.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,r.DEPTH_ATTACHMENT,r.TEXTURE_2D,Q,0,Z):r.framebufferTexture2D(r.FRAMEBUFFER,r.DEPTH_ATTACHMENT,r.TEXTURE_2D,Q,0);else if(v.depthTexture.format===1027)me(v)?l.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,r.DEPTH_STENCIL_ATTACHMENT,r.TEXTURE_2D,Q,0,Z):r.framebufferTexture2D(r.FRAMEBUFFER,r.DEPTH_STENCIL_ATTACHMENT,r.TEXTURE_2D,Q,0);else throw new Error("Unknown depthTexture format")}function xe(M){const v=n.get(M),F=M.isWebGLCubeRenderTarget===!0;if(M.depthTexture&&!v.__autoAllocateDepthBuffer){if(F)throw new Error("target.depthTexture not supported in Cube render targets");we(v.__webglFramebuffer,M)}else if(F){v.__webglDepthbuffer=[];for(let Q=0;Q<6;Q++)t.bindFramebuffer(r.FRAMEBUFFER,v.__webglFramebuffer[Q]),v.__webglDepthbuffer[Q]=r.createRenderbuffer(),Ae(v.__webglDepthbuffer[Q],M,!1)}else t.bindFramebuffer(r.FRAMEBUFFER,v.__webglFramebuffer),v.__webglDepthbuffer=r.createRenderbuffer(),Ae(v.__webglDepthbuffer,M,!1);t.bindFramebuffer(r.FRAMEBUFFER,null)}function he(M,v,F){const Q=n.get(M);v!==void 0&&fe(Q.__webglFramebuffer,M,M.texture,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,0),F!==void 0&&xe(M)}function L(M){const v=M.texture,F=n.get(M),Q=n.get(v);M.addEventListener("dispose",$),M.isWebGLMultipleRenderTargets!==!0&&(Q.__webglTexture===void 0&&(Q.__webglTexture=r.createTexture()),Q.__version=v.version,o.memory.textures++);const Z=M.isWebGLCubeRenderTarget===!0,ee=M.isWebGLMultipleRenderTargets===!0,ge=p(M)||a;if(Z){F.__webglFramebuffer=[];for(let oe=0;oe<6;oe++)if(a&&v.mipmaps&&v.mipmaps.length>0){F.__webglFramebuffer[oe]=[];for(let de=0;de<v.mipmaps.length;de++)F.__webglFramebuffer[oe][de]=r.createFramebuffer()}else F.__webglFramebuffer[oe]=r.createFramebuffer()}else{if(a&&v.mipmaps&&v.mipmaps.length>0){F.__webglFramebuffer=[];for(let oe=0;oe<v.mipmaps.length;oe++)F.__webglFramebuffer[oe]=r.createFramebuffer()}else F.__webglFramebuffer=r.createFramebuffer();if(ee)if(s.drawBuffers){const oe=M.texture;for(let de=0,Ee=oe.length;de<Ee;de++){const Fe=n.get(oe[de]);Fe.__webglTexture===void 0&&(Fe.__webglTexture=r.createTexture(),o.memory.textures++)}}else console.warn("THREE.WebGLRenderer: WebGLMultipleRenderTargets can only be used with WebGL2 or WEBGL_draw_buffers extension.");if(a&&M.samples>0&&me(M)===!1){const oe=ee?v:[v];F.__webglMultisampledFramebuffer=r.createFramebuffer(),F.__webglColorRenderbuffer=[],t.bindFramebuffer(r.FRAMEBUFFER,F.__webglMultisampledFramebuffer);for(let de=0;de<oe.length;de++){const Ee=oe[de];F.__webglColorRenderbuffer[de]=r.createRenderbuffer(),r.bindRenderbuffer(r.RENDERBUFFER,F.__webglColorRenderbuffer[de]);const Fe=i.convert(Ee.format,Ee.colorSpace),j=i.convert(Ee.type),Xe=w(Ee.internalFormat,Fe,j,Ee.colorSpace,M.isXRRenderTarget===!0),Ge=Re(M);r.renderbufferStorageMultisample(r.RENDERBUFFER,Ge,Xe,M.width,M.height),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+de,r.RENDERBUFFER,F.__webglColorRenderbuffer[de])}r.bindRenderbuffer(r.RENDERBUFFER,null),M.depthBuffer&&(F.__webglDepthRenderbuffer=r.createRenderbuffer(),Ae(F.__webglDepthRenderbuffer,M,!0)),t.bindFramebuffer(r.FRAMEBUFFER,null)}}if(Z){t.bindTexture(r.TEXTURE_CUBE_MAP,Q.__webglTexture),G(r.TEXTURE_CUBE_MAP,v,ge);for(let oe=0;oe<6;oe++)if(a&&v.mipmaps&&v.mipmaps.length>0)for(let de=0;de<v.mipmaps.length;de++)fe(F.__webglFramebuffer[oe][de],M,v,r.COLOR_ATTACHMENT0,r.TEXTURE_CUBE_MAP_POSITIVE_X+oe,de);else fe(F.__webglFramebuffer[oe],M,v,r.COLOR_ATTACHMENT0,r.TEXTURE_CUBE_MAP_POSITIVE_X+oe,0);T(v,ge)&&x(r.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(ee){const oe=M.texture;for(let de=0,Ee=oe.length;de<Ee;de++){const Fe=oe[de],j=n.get(Fe);t.bindTexture(r.TEXTURE_2D,j.__webglTexture),G(r.TEXTURE_2D,Fe,ge),fe(F.__webglFramebuffer,M,Fe,r.COLOR_ATTACHMENT0+de,r.TEXTURE_2D,0),T(Fe,ge)&&x(r.TEXTURE_2D)}t.unbindTexture()}else{let oe=r.TEXTURE_2D;if((M.isWebGL3DRenderTarget||M.isWebGLArrayRenderTarget)&&(a?oe=M.isWebGL3DRenderTarget?r.TEXTURE_3D:r.TEXTURE_2D_ARRAY:console.error("THREE.WebGLTextures: THREE.Data3DTexture and THREE.DataArrayTexture only supported with WebGL2.")),t.bindTexture(oe,Q.__webglTexture),G(oe,v,ge),a&&v.mipmaps&&v.mipmaps.length>0)for(let de=0;de<v.mipmaps.length;de++)fe(F.__webglFramebuffer[de],M,v,r.COLOR_ATTACHMENT0,oe,de);else fe(F.__webglFramebuffer,M,v,r.COLOR_ATTACHMENT0,oe,0);T(v,ge)&&x(oe),t.unbindTexture()}M.depthBuffer&&xe(M)}function pt(M){const v=p(M)||a,F=M.isWebGLMultipleRenderTargets===!0?M.texture:[M.texture];for(let Q=0,Z=F.length;Q<Z;Q++){const ee=F[Q];if(T(ee,v)){const ge=M.isWebGLCubeRenderTarget?r.TEXTURE_CUBE_MAP:r.TEXTURE_2D,oe=n.get(ee).__webglTexture;t.bindTexture(ge,oe),x(ge),t.unbindTexture()}}}function Se(M){if(a&&M.samples>0&&me(M)===!1){const v=M.isWebGLMultipleRenderTargets?M.texture:[M.texture],F=M.width,Q=M.height;let Z=r.COLOR_BUFFER_BIT;const ee=[],ge=M.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,oe=n.get(M),de=M.isWebGLMultipleRenderTargets===!0;if(de)for(let Ee=0;Ee<v.length;Ee++)t.bindFramebuffer(r.FRAMEBUFFER,oe.__webglMultisampledFramebuffer),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+Ee,r.RENDERBUFFER,null),t.bindFramebuffer(r.FRAMEBUFFER,oe.__webglFramebuffer),r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0+Ee,r.TEXTURE_2D,null,0);t.bindFramebuffer(r.READ_FRAMEBUFFER,oe.__webglMultisampledFramebuffer),t.bindFramebuffer(r.DRAW_FRAMEBUFFER,oe.__webglFramebuffer);for(let Ee=0;Ee<v.length;Ee++){ee.push(r.COLOR_ATTACHMENT0+Ee),M.depthBuffer&&ee.push(ge);const Fe=oe.__ignoreDepthValues!==void 0?oe.__ignoreDepthValues:!1;if(Fe===!1&&(M.depthBuffer&&(Z|=r.DEPTH_BUFFER_BIT),M.stencilBuffer&&(Z|=r.STENCIL_BUFFER_BIT)),de&&r.framebufferRenderbuffer(r.READ_FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.RENDERBUFFER,oe.__webglColorRenderbuffer[Ee]),Fe===!0&&(r.invalidateFramebuffer(r.READ_FRAMEBUFFER,[ge]),r.invalidateFramebuffer(r.DRAW_FRAMEBUFFER,[ge])),de){const j=n.get(v[Ee]).__webglTexture;r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,j,0)}r.blitFramebuffer(0,0,F,Q,0,0,F,Q,Z,r.NEAREST),c&&r.invalidateFramebuffer(r.READ_FRAMEBUFFER,ee)}if(t.bindFramebuffer(r.READ_FRAMEBUFFER,null),t.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),de)for(let Ee=0;Ee<v.length;Ee++){t.bindFramebuffer(r.FRAMEBUFFER,oe.__webglMultisampledFramebuffer),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+Ee,r.RENDERBUFFER,oe.__webglColorRenderbuffer[Ee]);const Fe=n.get(v[Ee]).__webglTexture;t.bindFramebuffer(r.FRAMEBUFFER,oe.__webglFramebuffer),r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0+Ee,r.TEXTURE_2D,Fe,0)}t.bindFramebuffer(r.DRAW_FRAMEBUFFER,oe.__webglMultisampledFramebuffer)}}function Re(M){return Math.min(s.maxSamples,M.samples)}function me(M){const v=n.get(M);return a&&M.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&v.__useRenderToTexture!==!1}function je(M){const v=o.render.frame;d.get(M)!==v&&(d.set(M,v),M.update())}function Ue(M,v){const F=M.colorSpace,Q=M.format,Z=M.type;return M.isCompressedTexture===!0||M.isVideoTexture===!0||M.format===1035||F!==kt&&F!==Tt&&(We.getTransfer(F)===Ke?a===!1?e.has("EXT_sRGB")===!0&&Q===1023?(M.format=1035,M.minFilter=1006,M.generateMipmaps=!1):v=As.sRGBToLinear(v):(Q!==1023||Z!==1009)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",F)),v}this.allocateTextureUnit=R,this.resetTextureUnits=ie,this.setTexture2D=z,this.setTexture2DArray=X,this.setTexture3D=V,this.setTextureCube=H,this.rebindTextures=he,this.setupRenderTarget=L,this.updateRenderTargetMipmap=pt,this.updateMultisampleRenderTarget=Se,this.setupDepthRenderbuffer=xe,this.setupFrameBufferTexture=fe,this.useMultisampledRTT=me}function ad(r,e,t){const n=t.isWebGL2;function s(i,o=Tt){let a;const l=We.getTransfer(o);if(i===1009)return r.UNSIGNED_BYTE;if(i===1017)return r.UNSIGNED_SHORT_4_4_4_4;if(i===1018)return r.UNSIGNED_SHORT_5_5_5_1;if(i===1010)return r.BYTE;if(i===1011)return r.SHORT;if(i===1012)return r.UNSIGNED_SHORT;if(i===1013)return r.INT;if(i===1014)return r.UNSIGNED_INT;if(i===1015)return r.FLOAT;if(i===1016)return n?r.HALF_FLOAT:(a=e.get("OES_texture_half_float"),a!==null?a.HALF_FLOAT_OES:null);if(i===1021)return r.ALPHA;if(i===1023)return r.RGBA;if(i===1024)return r.LUMINANCE;if(i===1025)return r.LUMINANCE_ALPHA;if(i===1026)return r.DEPTH_COMPONENT;if(i===1027)return r.DEPTH_STENCIL;if(i===1035)return a=e.get("EXT_sRGB"),a!==null?a.SRGB_ALPHA_EXT:null;if(i===1028)return r.RED;if(i===1029)return r.RED_INTEGER;if(i===1030)return r.RG;if(i===1031)return r.RG_INTEGER;if(i===1033)return r.RGBA_INTEGER;if(i===33776||i===33777||i===33778||i===33779)if(l===Ke)if(a=e.get("WEBGL_compressed_texture_s3tc_srgb"),a!==null){if(i===33776)return a.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===33777)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===33778)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===33779)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(a=e.get("WEBGL_compressed_texture_s3tc"),a!==null){if(i===33776)return a.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===33777)return a.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===33778)return a.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===33779)return a.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===35840||i===35841||i===35842||i===35843)if(a=e.get("WEBGL_compressed_texture_pvrtc"),a!==null){if(i===35840)return a.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===35841)return a.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===35842)return a.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===35843)return a.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===36196)return a=e.get("WEBGL_compressed_texture_etc1"),a!==null?a.COMPRESSED_RGB_ETC1_WEBGL:null;if(i===37492||i===37496)if(a=e.get("WEBGL_compressed_texture_etc"),a!==null){if(i===37492)return l===Ke?a.COMPRESSED_SRGB8_ETC2:a.COMPRESSED_RGB8_ETC2;if(i===37496)return l===Ke?a.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:a.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(i===37808||i===37809||i===37810||i===37811||i===37812||i===37813||i===37814||i===37815||i===37816||i===37817||i===37818||i===37819||i===37820||i===37821)if(a=e.get("WEBGL_compressed_texture_astc"),a!==null){if(i===37808)return l===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:a.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===37809)return l===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:a.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===37810)return l===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:a.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===37811)return l===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:a.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===37812)return l===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:a.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===37813)return l===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:a.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===37814)return l===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:a.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===37815)return l===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:a.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===37816)return l===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:a.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===37817)return l===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:a.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===37818)return l===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:a.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===37819)return l===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:a.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===37820)return l===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:a.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===37821)return l===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:a.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===36492||i===36494||i===36495)if(a=e.get("EXT_texture_compression_bptc"),a!==null){if(i===36492)return l===Ke?a.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:a.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===36494)return a.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===36495)return a.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===36283||i===36284||i===36285||i===36286)if(a=e.get("EXT_texture_compression_rgtc"),a!==null){if(i===36492)return a.COMPRESSED_RED_RGTC1_EXT;if(i===36284)return a.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===36285)return a.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===36286)return a.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===1020?n?r.UNSIGNED_INT_24_8:(a=e.get("WEBGL_depth_texture"),a!==null?a.UNSIGNED_INT_24_8_WEBGL:null):r[i]!==void 0?r[i]:null}return{convert:s}}class od extends It{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}}class Ai extends xt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const ld={type:"move"};class ds{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Ai,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Ai,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new I,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new I),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Ai,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new I,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new I),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let s=null,i=null,o=null;const a=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){o=!0;for(const _ of e.hand.values()){const p=t.getJointPose(_,n),h=this._getHandJoint(c,_);p!==null&&(h.matrix.fromArray(p.transform.matrix),h.matrix.decompose(h.position,h.rotation,h.scale),h.matrixWorldNeedsUpdate=!0,h.jointRadius=p.radius),h.visible=p!==null}const d=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],f=d.position.distanceTo(u.position),m=.02,g=.005;c.inputState.pinching&&f>m+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&f<=m-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(i=t.getPose(e.gripSpace,n),i!==null&&(l.matrix.fromArray(i.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,i.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(i.linearVelocity)):l.hasLinearVelocity=!1,i.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(i.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(s=t.getPose(e.targetRaySpace,n),s===null&&i!==null&&(s=i),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(ld)))}return a!==null&&(a.visible=s!==null),l!==null&&(l.visible=i!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const n=new Ai;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}}class cd extends dn{constructor(e,t){super();const n=this;let s=null,i=1,o=null,a="local-floor",l=1,c=null,d=null,u=null,f=null,m=null,g=null;const _=t.getContextAttributes();let p=null,h=null;const T=[],x=[],w=new Ve;let D=null;const C=new It;C.layers.enable(1),C.viewport=new ct;const A=new It;A.layers.enable(2),A.viewport=new ct;const $=[C,A],y=new od;y.layers.enable(1),y.layers.enable(2);let E=null,k=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(G){let q=T[G];return q===void 0&&(q=new ds,T[G]=q),q.getTargetRaySpace()},this.getControllerGrip=function(G){let q=T[G];return q===void 0&&(q=new ds,T[G]=q),q.getGripSpace()},this.getHand=function(G){let q=T[G];return q===void 0&&(q=new ds,T[G]=q),q.getHandSpace()};function Y(G){const q=x.indexOf(G.inputSource);if(q===-1)return;const ae=T[q];ae!==void 0&&(ae.update(G.inputSource,G.frame,c||o),ae.dispatchEvent({type:G.type,data:G.inputSource}))}function ie(){s.removeEventListener("select",Y),s.removeEventListener("selectstart",Y),s.removeEventListener("selectend",Y),s.removeEventListener("squeeze",Y),s.removeEventListener("squeezestart",Y),s.removeEventListener("squeezeend",Y),s.removeEventListener("end",ie),s.removeEventListener("inputsourceschange",R);for(let G=0;G<T.length;G++){const q=x[G];q!==null&&(x[G]=null,T[G].disconnect(q))}E=null,k=null,e.setRenderTarget(p),m=null,f=null,u=null,s=null,h=null,le.stop(),n.isPresenting=!1,e.setPixelRatio(D),e.setSize(w.width,w.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(G){i=G,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(G){a=G,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(G){c=G},this.getBaseLayer=function(){return f!==null?f:m},this.getBinding=function(){return u},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(G){if(s=G,s!==null){if(p=e.getRenderTarget(),s.addEventListener("select",Y),s.addEventListener("selectstart",Y),s.addEventListener("selectend",Y),s.addEventListener("squeeze",Y),s.addEventListener("squeezestart",Y),s.addEventListener("squeezeend",Y),s.addEventListener("end",ie),s.addEventListener("inputsourceschange",R),_.xrCompatible!==!0&&await t.makeXRCompatible(),D=e.getPixelRatio(),e.getSize(w),s.renderState.layers===void 0||e.capabilities.isWebGL2===!1){const q={antialias:s.renderState.layers===void 0?_.antialias:!0,alpha:!0,depth:_.depth,stencil:_.stencil,framebufferScaleFactor:i};m=new XRWebGLLayer(s,t,q),s.updateRenderState({baseLayer:m}),e.setPixelRatio(1),e.setSize(m.framebufferWidth,m.framebufferHeight,!1),h=new Jt(m.framebufferWidth,m.framebufferHeight,{format:1023,type:1009,colorSpace:e.outputColorSpace,stencilBuffer:_.stencil})}else{let q=null,ae=null,pe=null;_.depth&&(pe=_.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,q=_.stencil?1027:1026,ae=_.stencil?1020:1014);const fe={colorFormat:t.RGBA8,depthFormat:pe,scaleFactor:i};u=new XRWebGLBinding(s,t),f=u.createProjectionLayer(fe),s.updateRenderState({layers:[f]}),e.setPixelRatio(1),e.setSize(f.textureWidth,f.textureHeight,!1),h=new Jt(f.textureWidth,f.textureHeight,{format:1023,type:1009,depthTexture:new ar(f.textureWidth,f.textureHeight,ae,void 0,void 0,void 0,void 0,void 0,void 0,q),stencilBuffer:_.stencil,colorSpace:e.outputColorSpace,samples:_.antialias?4:0});const Ae=e.properties.get(h);Ae.__ignoreDepthValues=f.ignoreDepthValues}h.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await s.requestReferenceSpace(a),le.setContext(s),le.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode};function R(G){for(let q=0;q<G.removed.length;q++){const ae=G.removed[q],pe=x.indexOf(ae);pe>=0&&(x[pe]=null,T[pe].disconnect(ae))}for(let q=0;q<G.added.length;q++){const ae=G.added[q];let pe=x.indexOf(ae);if(pe===-1){for(let Ae=0;Ae<T.length;Ae++)if(Ae>=x.length){x.push(ae),pe=Ae;break}else if(x[Ae]===null){x[Ae]=ae,pe=Ae;break}if(pe===-1)break}const fe=T[pe];fe&&fe.connect(ae)}}const O=new I,z=new I;function X(G,q,ae){O.setFromMatrixPosition(q.matrixWorld),z.setFromMatrixPosition(ae.matrixWorld);const pe=O.distanceTo(z),fe=q.projectionMatrix.elements,Ae=ae.projectionMatrix.elements,we=fe[14]/(fe[10]-1),xe=fe[14]/(fe[10]+1),he=(fe[9]+1)/fe[5],L=(fe[9]-1)/fe[5],pt=(fe[8]-1)/fe[0],Se=(Ae[8]+1)/Ae[0],Re=we*pt,me=we*Se,je=pe/(-pt+Se),Ue=je*-pt;q.matrixWorld.decompose(G.position,G.quaternion,G.scale),G.translateX(Ue),G.translateZ(je),G.matrixWorld.compose(G.position,G.quaternion,G.scale),G.matrixWorldInverse.copy(G.matrixWorld).invert();const M=we+je,v=xe+je,F=Re-Ue,Q=me+(pe-Ue),Z=he*xe/v*M,ee=L*xe/v*M;G.projectionMatrix.makePerspective(F,Q,Z,ee,M,v),G.projectionMatrixInverse.copy(G.projectionMatrix).invert()}function V(G,q){q===null?G.matrixWorld.copy(G.matrix):G.matrixWorld.multiplyMatrices(q.matrixWorld,G.matrix),G.matrixWorldInverse.copy(G.matrixWorld).invert()}this.updateCamera=function(G){if(s===null)return;y.near=A.near=C.near=G.near,y.far=A.far=C.far=G.far,(E!==y.near||k!==y.far)&&(s.updateRenderState({depthNear:y.near,depthFar:y.far}),E=y.near,k=y.far);const q=G.parent,ae=y.cameras;V(y,q);for(let pe=0;pe<ae.length;pe++)V(ae[pe],q);ae.length===2?X(y,C,A):y.projectionMatrix.copy(C.projectionMatrix),H(G,y,q)};function H(G,q,ae){ae===null?G.matrix.copy(q.matrixWorld):(G.matrix.copy(ae.matrixWorld),G.matrix.invert(),G.matrix.multiply(q.matrixWorld)),G.matrix.decompose(G.position,G.quaternion,G.scale),G.updateMatrixWorld(!0),G.projectionMatrix.copy(q.projectionMatrix),G.projectionMatrixInverse.copy(q.projectionMatrixInverse),G.isPerspectiveCamera&&(G.fov=Fi*2*Math.atan(1/G.projectionMatrix.elements[5]),G.zoom=1)}this.getCamera=function(){return y},this.getFoveation=function(){if(!(f===null&&m===null))return l},this.setFoveation=function(G){l=G,f!==null&&(f.fixedFoveation=G),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=G)};let K=null;function J(G,q){if(d=q.getViewerPose(c||o),g=q,d!==null){const ae=d.views;m!==null&&(e.setRenderTargetFramebuffer(h,m.framebuffer),e.setRenderTarget(h));let pe=!1;ae.length!==y.cameras.length&&(y.cameras.length=0,pe=!0);for(let fe=0;fe<ae.length;fe++){const Ae=ae[fe];let we=null;if(m!==null)we=m.getViewport(Ae);else{const he=u.getViewSubImage(f,Ae);we=he.viewport,fe===0&&(e.setRenderTargetTextures(h,he.colorTexture,f.ignoreDepthValues?void 0:he.depthStencilTexture),e.setRenderTarget(h))}let xe=$[fe];xe===void 0&&(xe=new It,xe.layers.enable(fe),xe.viewport=new ct,$[fe]=xe),xe.matrix.fromArray(Ae.transform.matrix),xe.matrix.decompose(xe.position,xe.quaternion,xe.scale),xe.projectionMatrix.fromArray(Ae.projectionMatrix),xe.projectionMatrixInverse.copy(xe.projectionMatrix).invert(),xe.viewport.set(we.x,we.y,we.width,we.height),fe===0&&(y.matrix.copy(xe.matrix),y.matrix.decompose(y.position,y.quaternion,y.scale)),pe===!0&&y.cameras.push(xe)}}for(let ae=0;ae<T.length;ae++){const pe=x[ae],fe=T[ae];pe!==null&&fe!==void 0&&fe.update(pe,q,c||o)}K&&K(G,q),q.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:q}),g=null}const le=new Zs;le.setAnimationLoop(J),this.setAnimationLoop=function(G){K=G},this.dispose=function(){}}}function dd(r,e){function t(p,h){p.matrixAutoUpdate===!0&&p.updateMatrix(),h.value.copy(p.matrix)}function n(p,h){h.color.getRGB(p.fogColor.value,$s(r)),h.isFog?(p.fogNear.value=h.near,p.fogFar.value=h.far):h.isFogExp2&&(p.fogDensity.value=h.density)}function s(p,h,T,x,w){h.isMeshBasicMaterial||h.isMeshLambertMaterial?i(p,h):h.isMeshToonMaterial?(i(p,h),u(p,h)):h.isMeshPhongMaterial?(i(p,h),d(p,h)):h.isMeshStandardMaterial?(i(p,h),f(p,h),h.isMeshPhysicalMaterial&&m(p,h,w)):h.isMeshMatcapMaterial?(i(p,h),g(p,h)):h.isMeshDepthMaterial?i(p,h):h.isMeshDistanceMaterial?(i(p,h),_(p,h)):h.isMeshNormalMaterial?i(p,h):h.isLineBasicMaterial?(o(p,h),h.isLineDashedMaterial&&a(p,h)):h.isPointsMaterial?l(p,h,T,x):h.isSpriteMaterial?c(p,h):h.isShadowMaterial?(p.color.value.copy(h.color),p.opacity.value=h.opacity):h.isShaderMaterial&&(h.uniformsNeedUpdate=!1)}function i(p,h){p.opacity.value=h.opacity,h.color&&p.diffuse.value.copy(h.color),h.emissive&&p.emissive.value.copy(h.emissive).multiplyScalar(h.emissiveIntensity),h.map&&(p.map.value=h.map,t(h.map,p.mapTransform)),h.alphaMap&&(p.alphaMap.value=h.alphaMap,t(h.alphaMap,p.alphaMapTransform)),h.bumpMap&&(p.bumpMap.value=h.bumpMap,t(h.bumpMap,p.bumpMapTransform),p.bumpScale.value=h.bumpScale,h.side===1&&(p.bumpScale.value*=-1)),h.normalMap&&(p.normalMap.value=h.normalMap,t(h.normalMap,p.normalMapTransform),p.normalScale.value.copy(h.normalScale),h.side===1&&p.normalScale.value.negate()),h.displacementMap&&(p.displacementMap.value=h.displacementMap,t(h.displacementMap,p.displacementMapTransform),p.displacementScale.value=h.displacementScale,p.displacementBias.value=h.displacementBias),h.emissiveMap&&(p.emissiveMap.value=h.emissiveMap,t(h.emissiveMap,p.emissiveMapTransform)),h.specularMap&&(p.specularMap.value=h.specularMap,t(h.specularMap,p.specularMapTransform)),h.alphaTest>0&&(p.alphaTest.value=h.alphaTest);const T=e.get(h).envMap;if(T&&(p.envMap.value=T,p.flipEnvMap.value=T.isCubeTexture&&T.isRenderTargetTexture===!1?-1:1,p.reflectivity.value=h.reflectivity,p.ior.value=h.ior,p.refractionRatio.value=h.refractionRatio),h.lightMap){p.lightMap.value=h.lightMap;const x=r._useLegacyLights===!0?Math.PI:1;p.lightMapIntensity.value=h.lightMapIntensity*x,t(h.lightMap,p.lightMapTransform)}h.aoMap&&(p.aoMap.value=h.aoMap,p.aoMapIntensity.value=h.aoMapIntensity,t(h.aoMap,p.aoMapTransform))}function o(p,h){p.diffuse.value.copy(h.color),p.opacity.value=h.opacity,h.map&&(p.map.value=h.map,t(h.map,p.mapTransform))}function a(p,h){p.dashSize.value=h.dashSize,p.totalSize.value=h.dashSize+h.gapSize,p.scale.value=h.scale}function l(p,h,T,x){p.diffuse.value.copy(h.color),p.opacity.value=h.opacity,p.size.value=h.size*T,p.scale.value=x*.5,h.map&&(p.map.value=h.map,t(h.map,p.uvTransform)),h.alphaMap&&(p.alphaMap.value=h.alphaMap,t(h.alphaMap,p.alphaMapTransform)),h.alphaTest>0&&(p.alphaTest.value=h.alphaTest)}function c(p,h){p.diffuse.value.copy(h.color),p.opacity.value=h.opacity,p.rotation.value=h.rotation,h.map&&(p.map.value=h.map,t(h.map,p.mapTransform)),h.alphaMap&&(p.alphaMap.value=h.alphaMap,t(h.alphaMap,p.alphaMapTransform)),h.alphaTest>0&&(p.alphaTest.value=h.alphaTest)}function d(p,h){p.specular.value.copy(h.specular),p.shininess.value=Math.max(h.shininess,1e-4)}function u(p,h){h.gradientMap&&(p.gradientMap.value=h.gradientMap)}function f(p,h){p.metalness.value=h.metalness,h.metalnessMap&&(p.metalnessMap.value=h.metalnessMap,t(h.metalnessMap,p.metalnessMapTransform)),p.roughness.value=h.roughness,h.roughnessMap&&(p.roughnessMap.value=h.roughnessMap,t(h.roughnessMap,p.roughnessMapTransform)),e.get(h).envMap&&(p.envMapIntensity.value=h.envMapIntensity)}function m(p,h,T){p.ior.value=h.ior,h.sheen>0&&(p.sheenColor.value.copy(h.sheenColor).multiplyScalar(h.sheen),p.sheenRoughness.value=h.sheenRoughness,h.sheenColorMap&&(p.sheenColorMap.value=h.sheenColorMap,t(h.sheenColorMap,p.sheenColorMapTransform)),h.sheenRoughnessMap&&(p.sheenRoughnessMap.value=h.sheenRoughnessMap,t(h.sheenRoughnessMap,p.sheenRoughnessMapTransform))),h.clearcoat>0&&(p.clearcoat.value=h.clearcoat,p.clearcoatRoughness.value=h.clearcoatRoughness,h.clearcoatMap&&(p.clearcoatMap.value=h.clearcoatMap,t(h.clearcoatMap,p.clearcoatMapTransform)),h.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=h.clearcoatRoughnessMap,t(h.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),h.clearcoatNormalMap&&(p.clearcoatNormalMap.value=h.clearcoatNormalMap,t(h.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(h.clearcoatNormalScale),h.side===1&&p.clearcoatNormalScale.value.negate())),h.iridescence>0&&(p.iridescence.value=h.iridescence,p.iridescenceIOR.value=h.iridescenceIOR,p.iridescenceThicknessMinimum.value=h.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=h.iridescenceThicknessRange[1],h.iridescenceMap&&(p.iridescenceMap.value=h.iridescenceMap,t(h.iridescenceMap,p.iridescenceMapTransform)),h.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=h.iridescenceThicknessMap,t(h.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),h.transmission>0&&(p.transmission.value=h.transmission,p.transmissionSamplerMap.value=T.texture,p.transmissionSamplerSize.value.set(T.width,T.height),h.transmissionMap&&(p.transmissionMap.value=h.transmissionMap,t(h.transmissionMap,p.transmissionMapTransform)),p.thickness.value=h.thickness,h.thicknessMap&&(p.thicknessMap.value=h.thicknessMap,t(h.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=h.attenuationDistance,p.attenuationColor.value.copy(h.attenuationColor)),h.anisotropy>0&&(p.anisotropyVector.value.set(h.anisotropy*Math.cos(h.anisotropyRotation),h.anisotropy*Math.sin(h.anisotropyRotation)),h.anisotropyMap&&(p.anisotropyMap.value=h.anisotropyMap,t(h.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=h.specularIntensity,p.specularColor.value.copy(h.specularColor),h.specularColorMap&&(p.specularColorMap.value=h.specularColorMap,t(h.specularColorMap,p.specularColorMapTransform)),h.specularIntensityMap&&(p.specularIntensityMap.value=h.specularIntensityMap,t(h.specularIntensityMap,p.specularIntensityMapTransform))}function g(p,h){h.matcap&&(p.matcap.value=h.matcap)}function _(p,h){const T=e.get(h).light;p.referencePosition.value.setFromMatrixPosition(T.matrixWorld),p.nearDistance.value=T.shadow.camera.near,p.farDistance.value=T.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function ud(r,e,t,n){let s={},i={},o=[];const a=t.isWebGL2?r.getParameter(r.MAX_UNIFORM_BUFFER_BINDINGS):0;function l(T,x){const w=x.program;n.uniformBlockBinding(T,w)}function c(T,x){let w=s[T.id];w===void 0&&(g(T),w=d(T),s[T.id]=w,T.addEventListener("dispose",p));const D=x.program;n.updateUBOMapping(T,D);const C=e.render.frame;i[T.id]!==C&&(f(T),i[T.id]=C)}function d(T){const x=u();T.__bindingPointIndex=x;const w=r.createBuffer(),D=T.__size,C=T.usage;return r.bindBuffer(r.UNIFORM_BUFFER,w),r.bufferData(r.UNIFORM_BUFFER,D,C),r.bindBuffer(r.UNIFORM_BUFFER,null),r.bindBufferBase(r.UNIFORM_BUFFER,x,w),w}function u(){for(let T=0;T<a;T++)if(o.indexOf(T)===-1)return o.push(T),T;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function f(T){const x=s[T.id],w=T.uniforms,D=T.__cache;r.bindBuffer(r.UNIFORM_BUFFER,x);for(let C=0,A=w.length;C<A;C++){const $=Array.isArray(w[C])?w[C]:[w[C]];for(let y=0,E=$.length;y<E;y++){const k=$[y];if(m(k,C,y,D)===!0){const Y=k.__offset,ie=Array.isArray(k.value)?k.value:[k.value];let R=0;for(let O=0;O<ie.length;O++){const z=ie[O],X=_(z);typeof z=="number"||typeof z=="boolean"?(k.__data[0]=z,r.bufferSubData(r.UNIFORM_BUFFER,Y+R,k.__data)):z.isMatrix3?(k.__data[0]=z.elements[0],k.__data[1]=z.elements[1],k.__data[2]=z.elements[2],k.__data[3]=0,k.__data[4]=z.elements[3],k.__data[5]=z.elements[4],k.__data[6]=z.elements[5],k.__data[7]=0,k.__data[8]=z.elements[6],k.__data[9]=z.elements[7],k.__data[10]=z.elements[8],k.__data[11]=0):(z.toArray(k.__data,R),R+=X.storage/Float32Array.BYTES_PER_ELEMENT)}r.bufferSubData(r.UNIFORM_BUFFER,Y,k.__data)}}}r.bindBuffer(r.UNIFORM_BUFFER,null)}function m(T,x,w,D){const C=T.value,A=x+"_"+w;if(D[A]===void 0)return typeof C=="number"||typeof C=="boolean"?D[A]=C:D[A]=C.clone(),!0;{const $=D[A];if(typeof C=="number"||typeof C=="boolean"){if($!==C)return D[A]=C,!0}else if($.equals(C)===!1)return $.copy(C),!0}return!1}function g(T){const x=T.uniforms;let w=0;const D=16;for(let A=0,$=x.length;A<$;A++){const y=Array.isArray(x[A])?x[A]:[x[A]];for(let E=0,k=y.length;E<k;E++){const Y=y[E],ie=Array.isArray(Y.value)?Y.value:[Y.value];for(let R=0,O=ie.length;R<O;R++){const z=ie[R],X=_(z),V=w%D;V!==0&&D-V<X.boundary&&(w+=D-V),Y.__data=new Float32Array(X.storage/Float32Array.BYTES_PER_ELEMENT),Y.__offset=w,w+=X.storage}}}const C=w%D;return C>0&&(w+=D-C),T.__size=w,T.__cache={},this}function _(T){const x={boundary:0,storage:0};return typeof T=="number"||typeof T=="boolean"?(x.boundary=4,x.storage=4):T.isVector2?(x.boundary=8,x.storage=8):T.isVector3||T.isColor?(x.boundary=16,x.storage=12):T.isVector4?(x.boundary=16,x.storage=16):T.isMatrix3?(x.boundary=48,x.storage=48):T.isMatrix4?(x.boundary=64,x.storage=64):T.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",T),x}function p(T){const x=T.target;x.removeEventListener("dispose",p);const w=o.indexOf(x.__bindingPointIndex);o.splice(w,1),r.deleteBuffer(s[x.id]),delete s[x.id],delete i[x.id]}function h(){for(const T in s)r.deleteBuffer(s[T]);o=[],s={},i={}}return{bind:l,update:c,dispose:h}}class wr{constructor(e={}){const{canvas:t=Gr(),context:n=null,depth:s=!0,stencil:i=!0,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:d="default",failIfMajorPerformanceCaveat:u=!1}=e;this.isWebGLRenderer=!0;let f;n!==null?f=n.getContextAttributes().alpha:f=o;const m=new Uint32Array(4),g=new Int32Array(4);let _=null,p=null;const h=[],T=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=lt,this._useLegacyLights=!1,this.toneMapping=0,this.toneMappingExposure=1;const x=this;let w=!1,D=0,C=0,A=null,$=-1,y=null;const E=new ct,k=new ct;let Y=null;const ie=new ze(0);let R=0,O=t.width,z=t.height,X=1,V=null,H=null;const K=new ct(0,0,O,z),J=new ct(0,0,O,z);let le=!1;const G=new js;let q=!1,ae=!1,pe=null;const fe=new st,Ae=new Ve,we=new I,xe={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};function he(){return A===null?X:1}let L=n;function pt(S,P){for(let N=0;N<S.length;N++){const B=S[N],U=t.getContext(B,P);if(U!==null)return U}return null}try{const S={alpha:!0,depth:s,stencil:i,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:d,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${Ct}`),t.addEventListener("webglcontextlost",ne,!1),t.addEventListener("webglcontextrestored",b,!1),t.addEventListener("webglcontextcreationerror",se,!1),L===null){const P=["webgl2","webgl","experimental-webgl"];if(x.isWebGL1Renderer===!0&&P.shift(),L=pt(P,S),L===null)throw pt(P)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}typeof WebGLRenderingContext<"u"&&L instanceof WebGLRenderingContext&&console.warn("THREE.WebGLRenderer: WebGL 1 support was deprecated in r153 and will be removed in r163."),L.getShaderPrecisionFormat===void 0&&(L.getShaderPrecisionFormat=function(){return{rangeMin:1,rangeMax:1,precision:1}})}catch(S){throw console.error("THREE.WebGLRenderer: "+S.message),S}let Se,Re,me,je,Ue,M,v,F,Q,Z,ee,ge,oe,de,Ee,Fe,j,Xe,Ge,Ce,ve,ue,Ie,He;function Je(){Se=new yl(L),Re=new ml(L,Se,e),Se.init(Re),ue=new ad(L,Se,Re),me=new sd(L,Se,Re),je=new Tl(L),Ue=new Wc,M=new rd(L,Se,me,Ue,Re,ue,je),v=new _l(x),F=new Sl(x),Q=new ua(L,Re),Ie=new fl(L,Se,Q,Re),Z=new Ml(L,Q,je,Ie),ee=new Cl(L,Z,Q,je),Ge=new wl(L,Re,M),Fe=new gl(Ue),ge=new Vc(x,v,F,Se,Re,Ie,Fe),oe=new dd(x,Ue),de=new qc,Ee=new Jc(Se,Re),Xe=new hl(x,v,F,me,ee,f,l),j=new id(x,ee,Re),He=new ud(L,je,Re,me),Ce=new pl(L,Se,je,Re),ve=new El(L,Se,je,Re),je.programs=ge.programs,x.capabilities=Re,x.extensions=Se,x.properties=Ue,x.renderLists=de,x.shadowMap=j,x.state=me,x.info=je}Je();const Be=new cd(x,L);this.xr=Be,this.getContext=function(){return L},this.getContextAttributes=function(){return L.getContextAttributes()},this.forceContextLoss=function(){const S=Se.get("WEBGL_lose_context");S&&S.loseContext()},this.forceContextRestore=function(){const S=Se.get("WEBGL_lose_context");S&&S.restoreContext()},this.getPixelRatio=function(){return X},this.setPixelRatio=function(S){S!==void 0&&(X=S,this.setSize(O,z,!1))},this.getSize=function(S){return S.set(O,z)},this.setSize=function(S,P,N=!0){if(Be.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}O=S,z=P,t.width=Math.floor(S*X),t.height=Math.floor(P*X),N===!0&&(t.style.width=S+"px",t.style.height=P+"px"),this.setViewport(0,0,S,P)},this.getDrawingBufferSize=function(S){return S.set(O*X,z*X).floor()},this.setDrawingBufferSize=function(S,P,N){O=S,z=P,X=N,t.width=Math.floor(S*N),t.height=Math.floor(P*N),this.setViewport(0,0,S,P)},this.getCurrentViewport=function(S){return S.copy(E)},this.getViewport=function(S){return S.copy(K)},this.setViewport=function(S,P,N,B){S.isVector4?K.set(S.x,S.y,S.z,S.w):K.set(S,P,N,B),me.viewport(E.copy(K).multiplyScalar(X).floor())},this.getScissor=function(S){return S.copy(J)},this.setScissor=function(S,P,N,B){S.isVector4?J.set(S.x,S.y,S.z,S.w):J.set(S,P,N,B),me.scissor(k.copy(J).multiplyScalar(X).floor())},this.getScissorTest=function(){return le},this.setScissorTest=function(S){me.setScissorTest(le=S)},this.setOpaqueSort=function(S){V=S},this.setTransparentSort=function(S){H=S},this.getClearColor=function(S){return S.copy(Xe.getClearColor())},this.setClearColor=function(){Xe.setClearColor.apply(Xe,arguments)},this.getClearAlpha=function(){return Xe.getClearAlpha()},this.setClearAlpha=function(){Xe.setClearAlpha.apply(Xe,arguments)},this.clear=function(S=!0,P=!0,N=!0){let B=0;if(S){let U=!1;if(A!==null){const ce=A.texture.format;U=ce===1033||ce===1031||ce===1029}if(U){const ce=A.texture.type,_e=ce===1009||ce===1014||ce===1012||ce===1020||ce===1017||ce===1018,Me=Xe.getClearColor(),be=Xe.getClearAlpha(),Ne=Me.r,Le=Me.g,Pe=Me.b;_e?(m[0]=Ne,m[1]=Le,m[2]=Pe,m[3]=be,L.clearBufferuiv(L.COLOR,0,m)):(g[0]=Ne,g[1]=Le,g[2]=Pe,g[3]=be,L.clearBufferiv(L.COLOR,0,g))}else B|=L.COLOR_BUFFER_BIT}P&&(B|=L.DEPTH_BUFFER_BIT),N&&(B|=L.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),L.clear(B)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",ne,!1),t.removeEventListener("webglcontextrestored",b,!1),t.removeEventListener("webglcontextcreationerror",se,!1),de.dispose(),Ee.dispose(),Ue.dispose(),v.dispose(),F.dispose(),ee.dispose(),Ie.dispose(),He.dispose(),ge.dispose(),Be.dispose(),Be.removeEventListener("sessionstart",mt),Be.removeEventListener("sessionend",Ye),pe&&(pe.dispose(),pe=null),gt.stop()};function ne(S){S.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),w=!0}function b(){console.log("THREE.WebGLRenderer: Context Restored."),w=!1;const S=je.autoReset,P=j.enabled,N=j.autoUpdate,B=j.needsUpdate,U=j.type;Je(),je.autoReset=S,j.enabled=P,j.autoUpdate=N,j.needsUpdate=B,j.type=U}function se(S){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",S.statusMessage)}function re(S){const P=S.target;P.removeEventListener("dispose",re),Te(P)}function Te(S){ye(S),Ue.remove(S)}function ye(S){const P=Ue.get(S).programs;P!==void 0&&(P.forEach(function(N){ge.releaseProgram(N)}),S.isShaderMaterial&&ge.releaseShaderCache(S))}this.renderBufferDirect=function(S,P,N,B,U,ce){P===null&&(P=xe);const _e=U.isMesh&&U.matrixWorld.determinant()<0,Me=Bd(S,P,N,B,U);me.setMaterial(B,_e);let be=N.index,Ne=1;if(B.wireframe===!0){if(be=Z.getWireframeAttribute(N),be===void 0)return;Ne=2}const Le=N.drawRange,Pe=N.attributes.position;let et=Le.start*Ne,Et=(Le.start+Le.count)*Ne;ce!==null&&(et=Math.max(et,ce.start*Ne),Et=Math.min(Et,(ce.start+ce.count)*Ne)),be!==null?(et=Math.max(et,0),Et=Math.min(Et,be.count)):Pe!=null&&(et=Math.max(et,0),Et=Math.min(Et,Pe.count));const ot=Et-et;if(ot<0||ot===1/0)return;Ie.setup(U,B,Me,N,be);let qt,Ze=Ce;if(be!==null&&(qt=Q.get(be),Ze=ve,Ze.setIndex(qt)),U.isMesh)B.wireframe===!0?(me.setLineWidth(B.wireframeLinewidth*he()),Ze.setMode(L.LINES)):Ze.setMode(L.TRIANGLES);else if(U.isLine){let ke=B.linewidth;ke===void 0&&(ke=1),me.setLineWidth(ke*he()),U.isLineSegments?Ze.setMode(L.LINES):U.isLineLoop?Ze.setMode(L.LINE_LOOP):Ze.setMode(L.LINE_STRIP)}else U.isPoints?Ze.setMode(L.POINTS):U.isSprite&&Ze.setMode(L.TRIANGLES);if(U.isBatchedMesh)Ze.renderMultiDraw(U._multiDrawStarts,U._multiDrawCounts,U._multiDrawCount);else if(U.isInstancedMesh)Ze.renderInstances(et,ot,U.count);else if(N.isInstancedBufferGeometry){const ke=N._maxInstanceCount!==void 0?N._maxInstanceCount:1/0,gs=Math.min(N.instanceCount,ke);Ze.renderInstances(et,ot,gs)}else Ze.render(et,ot)};function qe(S,P,N){S.transparent===!0&&S.side===2&&S.forceSinglePass===!1?(S.side=1,S.needsUpdate=!0,Di(S,P,N),S.side=0,S.needsUpdate=!0,Di(S,P,N),S.side=2):Di(S,P,N)}this.compile=function(S,P,N=null){N===null&&(N=S),p=Ee.get(N),p.init(),T.push(p),N.traverseVisible(function(U){U.isLight&&U.layers.test(P.layers)&&(p.pushLight(U),U.castShadow&&p.pushShadow(U))}),S!==N&&S.traverseVisible(function(U){U.isLight&&U.layers.test(P.layers)&&(p.pushLight(U),U.castShadow&&p.pushShadow(U))}),p.setupLights(x._useLegacyLights);const B=new Set;return S.traverse(function(U){const ce=U.material;if(ce)if(Array.isArray(ce))for(let _e=0;_e<ce.length;_e++){const Me=ce[_e];qe(Me,N,U),B.add(Me)}else qe(ce,N,U),B.add(ce)}),T.pop(),p=null,B},this.compileAsync=function(S,P,N=null){const B=this.compile(S,P,N);return new Promise(U=>{function ce(){if(B.forEach(function(_e){Ue.get(_e).currentProgram.isReady()&&B.delete(_e)}),B.size===0){U(S);return}setTimeout(ce,10)}Se.get("KHR_parallel_shader_compile")!==null?ce():setTimeout(ce,10)})};let $e=null;function at(S){$e&&$e(S)}function mt(){gt.stop()}function Ye(){gt.start()}const gt=new Zs;gt.setAnimationLoop(at),typeof self<"u"&&gt.setContext(self),this.setAnimationLoop=function(S){$e=S,Be.setAnimationLoop(S),S===null?gt.stop():gt.start()},Be.addEventListener("sessionstart",mt),Be.addEventListener("sessionend",Ye),this.render=function(S,P){if(P!==void 0&&P.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(w===!0)return;S.matrixWorldAutoUpdate===!0&&S.updateMatrixWorld(),P.parent===null&&P.matrixWorldAutoUpdate===!0&&P.updateMatrixWorld(),Be.enabled===!0&&Be.isPresenting===!0&&(Be.cameraAutoUpdate===!0&&Be.updateCamera(P),P=Be.getCamera()),S.isScene===!0&&S.onBeforeRender(x,S,P,A),p=Ee.get(S,T.length),p.init(),T.push(p),fe.multiplyMatrices(P.projectionMatrix,P.matrixWorldInverse),G.setFromProjectionMatrix(fe),ae=this.localClippingEnabled,q=Fe.init(this.clippingPlanes,ae),_=de.get(S,h.length),_.init(),h.push(_),Bt(S,P,0,x.sortObjects),_.finish(),x.sortObjects===!0&&_.sort(V,H),this.info.render.frame++,q===!0&&Fe.beginShadows();const N=p.state.shadowsArray;if(j.render(N,S,P),q===!0&&Fe.endShadows(),this.info.autoReset===!0&&this.info.reset(),Xe.render(_,S),p.setupLights(x._useLegacyLights),P.isArrayCamera){const B=P.cameras;for(let U=0,ce=B.length;U<ce;U++){const _e=B[U];Ir(_,S,_e,_e.viewport)}}else Ir(_,S,P);A!==null&&(M.updateMultisampleRenderTarget(A),M.updateRenderTargetMipmap(A)),S.isScene===!0&&S.onAfterRender(x,S,P),Ie.resetDefaultState(),$=-1,y=null,T.pop(),T.length>0?p=T[T.length-1]:p=null,h.pop(),h.length>0?_=h[h.length-1]:_=null};function Bt(S,P,N,B){if(S.visible===!1)return;if(S.layers.test(P.layers)){if(S.isGroup)N=S.renderOrder;else if(S.isLOD)S.autoUpdate===!0&&S.update(P);else if(S.isLight)p.pushLight(S),S.castShadow&&p.pushShadow(S);else if(S.isSprite){if(!S.frustumCulled||G.intersectsSprite(S)){B&&we.setFromMatrixPosition(S.matrixWorld).applyMatrix4(fe);const _e=ee.update(S),Me=S.material;Me.visible&&_.push(S,_e,Me,N,we.z,null)}}else if((S.isMesh||S.isLine||S.isPoints)&&(!S.frustumCulled||G.intersectsObject(S))){const _e=ee.update(S),Me=S.material;if(B&&(S.boundingSphere!==void 0?(S.boundingSphere===null&&S.computeBoundingSphere(),we.copy(S.boundingSphere.center)):(_e.boundingSphere===null&&_e.computeBoundingSphere(),we.copy(_e.boundingSphere.center)),we.applyMatrix4(S.matrixWorld).applyMatrix4(fe)),Array.isArray(Me)){const be=_e.groups;for(let Ne=0,Le=be.length;Ne<Le;Ne++){const Pe=be[Ne],et=Me[Pe.materialIndex];et&&et.visible&&_.push(S,_e,et,N,we.z,Pe)}}else Me.visible&&_.push(S,_e,Me,N,we.z,null)}}const ce=S.children;for(let _e=0,Me=ce.length;_e<Me;_e++)Bt(ce[_e],P,N,B)}function Ir(S,P,N,B){const U=S.opaque,ce=S.transmissive,_e=S.transparent;p.setupLightsView(N),q===!0&&Fe.setGlobalState(x.clippingPlanes,N),ce.length>0&&Od(U,ce,P,N),B&&me.viewport(E.copy(B)),U.length>0&&Pi(U,P,N),ce.length>0&&Pi(ce,P,N),_e.length>0&&Pi(_e,P,N),me.buffers.depth.setTest(!0),me.buffers.depth.setMask(!0),me.buffers.color.setMask(!0),me.setPolygonOffset(!1)}function Od(S,P,N,B){if((N.isScene===!0?N.overrideMaterial:null)!==null)return;const ce=Re.isWebGL2;pe===null&&(pe=new Jt(1,1,{generateMipmaps:!0,type:Se.has("EXT_color_buffer_half_float")?1016:1009,minFilter:1008,samples:ce?4:0})),x.getDrawingBufferSize(Ae),ce?pe.setSize(Ae.x,Ae.y):pe.setSize(Oi(Ae.x),Oi(Ae.y));const _e=x.getRenderTarget();x.setRenderTarget(pe),x.getClearColor(ie),R=x.getClearAlpha(),R<1&&x.setClearColor(16777215,.5),x.clear();const Me=x.toneMapping;x.toneMapping=0,Pi(S,N,B),M.updateMultisampleRenderTarget(pe),M.updateRenderTargetMipmap(pe);let be=!1;for(let Ne=0,Le=P.length;Ne<Le;Ne++){const Pe=P[Ne],et=Pe.object,Et=Pe.geometry,ot=Pe.material,qt=Pe.group;if(ot.side===2&&et.layers.test(B.layers)){const Ze=ot.side;ot.side=1,ot.needsUpdate=!0,Ur(et,N,B,Et,ot,qt),ot.side=Ze,ot.needsUpdate=!0,be=!0}}be===!0&&(M.updateMultisampleRenderTarget(pe),M.updateRenderTargetMipmap(pe)),x.setRenderTarget(_e),x.setClearColor(ie,R),x.toneMapping=Me}function Pi(S,P,N){const B=P.isScene===!0?P.overrideMaterial:null;for(let U=0,ce=S.length;U<ce;U++){const _e=S[U],Me=_e.object,be=_e.geometry,Ne=B===null?_e.material:B,Le=_e.group;Me.layers.test(N.layers)&&Ur(Me,P,N,be,Ne,Le)}}function Ur(S,P,N,B,U,ce){S.onBeforeRender(x,P,N,B,U,ce),S.modelViewMatrix.multiplyMatrices(N.matrixWorldInverse,S.matrixWorld),S.normalMatrix.getNormalMatrix(S.modelViewMatrix),U.onBeforeRender(x,P,N,B,S,ce),U.transparent===!0&&U.side===2&&U.forceSinglePass===!1?(U.side=1,U.needsUpdate=!0,x.renderBufferDirect(N,P,B,U,S,ce),U.side=0,U.needsUpdate=!0,x.renderBufferDirect(N,P,B,U,S,ce),U.side=2):x.renderBufferDirect(N,P,B,U,S,ce),S.onAfterRender(x,P,N,B,U,ce)}function Di(S,P,N){P.isScene!==!0&&(P=xe);const B=Ue.get(S),U=p.state.lights,ce=p.state.shadowsArray,_e=U.state.version,Me=ge.getParameters(S,U.state,ce,P,N),be=ge.getProgramCacheKey(Me);let Ne=B.programs;B.environment=S.isMeshStandardMaterial?P.environment:null,B.fog=P.fog,B.envMap=(S.isMeshStandardMaterial?F:v).get(S.envMap||B.environment),Ne===void 0&&(S.addEventListener("dispose",re),Ne=new Map,B.programs=Ne);let Le=Ne.get(be);if(Le!==void 0){if(B.currentProgram===Le&&B.lightsStateVersion===_e)return Nr(S,Me),Le}else Me.uniforms=ge.getUniforms(S),S.onBuild(N,Me,x),S.onBeforeCompile(Me,x),Le=ge.acquireProgram(Me,be),Ne.set(be,Le),B.uniforms=Me.uniforms;const Pe=B.uniforms;return(!S.isShaderMaterial&&!S.isRawShaderMaterial||S.clipping===!0)&&(Pe.clippingPlanes=Fe.uniform),Nr(S,Me),B.needsLights=Gd(S),B.lightsStateVersion=_e,B.needsLights&&(Pe.ambientLightColor.value=U.state.ambient,Pe.lightProbe.value=U.state.probe,Pe.directionalLights.value=U.state.directional,Pe.directionalLightShadows.value=U.state.directionalShadow,Pe.spotLights.value=U.state.spot,Pe.spotLightShadows.value=U.state.spotShadow,Pe.rectAreaLights.value=U.state.rectArea,Pe.ltc_1.value=U.state.rectAreaLTC1,Pe.ltc_2.value=U.state.rectAreaLTC2,Pe.pointLights.value=U.state.point,Pe.pointLightShadows.value=U.state.pointShadow,Pe.hemisphereLights.value=U.state.hemi,Pe.directionalShadowMap.value=U.state.directionalShadowMap,Pe.directionalShadowMatrix.value=U.state.directionalShadowMatrix,Pe.spotShadowMap.value=U.state.spotShadowMap,Pe.spotLightMatrix.value=U.state.spotLightMatrix,Pe.spotLightMap.value=U.state.spotLightMap,Pe.pointShadowMap.value=U.state.pointShadowMap,Pe.pointShadowMatrix.value=U.state.pointShadowMatrix),B.currentProgram=Le,B.uniformsList=null,Le}function Fr(S){if(S.uniformsList===null){const P=S.currentProgram.getUniforms();S.uniformsList=bi.seqWithValue(P.seq,S.uniforms)}return S.uniformsList}function Nr(S,P){const N=Ue.get(S);N.outputColorSpace=P.outputColorSpace,N.batching=P.batching,N.instancing=P.instancing,N.instancingColor=P.instancingColor,N.skinning=P.skinning,N.morphTargets=P.morphTargets,N.morphNormals=P.morphNormals,N.morphColors=P.morphColors,N.morphTargetsCount=P.morphTargetsCount,N.numClippingPlanes=P.numClippingPlanes,N.numIntersection=P.numClipIntersection,N.vertexAlphas=P.vertexAlphas,N.vertexTangents=P.vertexTangents,N.toneMapping=P.toneMapping}function Bd(S,P,N,B,U){P.isScene!==!0&&(P=xe),M.resetTextureUnits();const ce=P.fog,_e=B.isMeshStandardMaterial?P.environment:null,Me=A===null?x.outputColorSpace:A.isXRRenderTarget===!0?A.texture.colorSpace:kt,be=(B.isMeshStandardMaterial?F:v).get(B.envMap||_e),Ne=B.vertexColors===!0&&!!N.attributes.color&&N.attributes.color.itemSize===4,Le=!!N.attributes.tangent&&(!!B.normalMap||B.anisotropy>0),Pe=!!N.morphAttributes.position,et=!!N.morphAttributes.normal,Et=!!N.morphAttributes.color;let ot=0;B.toneMapped&&(A===null||A.isXRRenderTarget===!0)&&(ot=x.toneMapping);const qt=N.morphAttributes.position||N.morphAttributes.normal||N.morphAttributes.color,Ze=qt!==void 0?qt.length:0,ke=Ue.get(B),gs=p.state.lights;if(q===!0&&(ae===!0||S!==y)){const wt=S===y&&B.id===$;Fe.setState(B,S,wt)}let Qe=!1;B.version===ke.__version?(ke.needsLights&&ke.lightsStateVersion!==gs.state.version||ke.outputColorSpace!==Me||U.isBatchedMesh&&ke.batching===!1||!U.isBatchedMesh&&ke.batching===!0||U.isInstancedMesh&&ke.instancing===!1||!U.isInstancedMesh&&ke.instancing===!0||U.isSkinnedMesh&&ke.skinning===!1||!U.isSkinnedMesh&&ke.skinning===!0||U.isInstancedMesh&&ke.instancingColor===!0&&U.instanceColor===null||U.isInstancedMesh&&ke.instancingColor===!1&&U.instanceColor!==null||ke.envMap!==be||B.fog===!0&&ke.fog!==ce||ke.numClippingPlanes!==void 0&&(ke.numClippingPlanes!==Fe.numPlanes||ke.numIntersection!==Fe.numIntersection)||ke.vertexAlphas!==Ne||ke.vertexTangents!==Le||ke.morphTargets!==Pe||ke.morphNormals!==et||ke.morphColors!==Et||ke.toneMapping!==ot||Re.isWebGL2===!0&&ke.morphTargetsCount!==Ze)&&(Qe=!0):(Qe=!0,ke.__version=B.version);let ln=ke.currentProgram;Qe===!0&&(ln=Di(B,P,U));let Or=!1,Yn=!1,_s=!1;const ht=ln.getUniforms(),cn=ke.uniforms;if(me.useProgram(ln.program)&&(Or=!0,Yn=!0,_s=!0),B.id!==$&&($=B.id,Yn=!0),Or||y!==S){ht.setValue(L,"projectionMatrix",S.projectionMatrix),ht.setValue(L,"viewMatrix",S.matrixWorldInverse);const wt=ht.map.cameraPosition;wt!==void 0&&wt.setValue(L,we.setFromMatrixPosition(S.matrixWorld)),Re.logarithmicDepthBuffer&&ht.setValue(L,"logDepthBufFC",2/(Math.log(S.far+1)/Math.LN2)),(B.isMeshPhongMaterial||B.isMeshToonMaterial||B.isMeshLambertMaterial||B.isMeshBasicMaterial||B.isMeshStandardMaterial||B.isShaderMaterial)&&ht.setValue(L,"isOrthographic",S.isOrthographicCamera===!0),y!==S&&(y=S,Yn=!0,_s=!0)}if(U.isSkinnedMesh){ht.setOptional(L,U,"bindMatrix"),ht.setOptional(L,U,"bindMatrixInverse");const wt=U.skeleton;wt&&(Re.floatVertexTextures?(wt.boneTexture===null&&wt.computeBoneTexture(),ht.setValue(L,"boneTexture",wt.boneTexture,M)):console.warn("THREE.WebGLRenderer: SkinnedMesh can only be used with WebGL 2. With WebGL 1 OES_texture_float and vertex textures support is required."))}U.isBatchedMesh&&(ht.setOptional(L,U,"batchingTexture"),ht.setValue(L,"batchingTexture",U._matricesTexture,M));const vs=N.morphAttributes;if((vs.position!==void 0||vs.normal!==void 0||vs.color!==void 0&&Re.isWebGL2===!0)&&Ge.update(U,N,ln),(Yn||ke.receiveShadow!==U.receiveShadow)&&(ke.receiveShadow=U.receiveShadow,ht.setValue(L,"receiveShadow",U.receiveShadow)),B.isMeshGouraudMaterial&&B.envMap!==null&&(cn.envMap.value=be,cn.flipEnvMap.value=be.isCubeTexture&&be.isRenderTargetTexture===!1?-1:1),Yn&&(ht.setValue(L,"toneMappingExposure",x.toneMappingExposure),ke.needsLights&&kd(cn,_s),ce&&B.fog===!0&&oe.refreshFogUniforms(cn,ce),oe.refreshMaterialUniforms(cn,B,X,z,pe),bi.upload(L,Fr(ke),cn,M)),B.isShaderMaterial&&B.uniformsNeedUpdate===!0&&(bi.upload(L,Fr(ke),cn,M),B.uniformsNeedUpdate=!1),B.isSpriteMaterial&&ht.setValue(L,"center",U.center),ht.setValue(L,"modelViewMatrix",U.modelViewMatrix),ht.setValue(L,"normalMatrix",U.normalMatrix),ht.setValue(L,"modelMatrix",U.matrixWorld),B.isShaderMaterial||B.isRawShaderMaterial){const wt=B.uniformsGroups;for(let xs=0,zd=wt.length;xs<zd;xs++)if(Re.isWebGL2){const Br=wt[xs];He.update(Br,ln),He.bind(Br,ln)}else console.warn("THREE.WebGLRenderer: Uniform Buffer Objects can only be used with WebGL 2.")}return ln}function kd(S,P){S.ambientLightColor.needsUpdate=P,S.lightProbe.needsUpdate=P,S.directionalLights.needsUpdate=P,S.directionalLightShadows.needsUpdate=P,S.pointLights.needsUpdate=P,S.pointLightShadows.needsUpdate=P,S.spotLights.needsUpdate=P,S.spotLightShadows.needsUpdate=P,S.rectAreaLights.needsUpdate=P,S.hemisphereLights.needsUpdate=P}function Gd(S){return S.isMeshLambertMaterial||S.isMeshToonMaterial||S.isMeshPhongMaterial||S.isMeshStandardMaterial||S.isShadowMaterial||S.isShaderMaterial&&S.lights===!0}this.getActiveCubeFace=function(){return D},this.getActiveMipmapLevel=function(){return C},this.getRenderTarget=function(){return A},this.setRenderTargetTextures=function(S,P,N){Ue.get(S.texture).__webglTexture=P,Ue.get(S.depthTexture).__webglTexture=N;const B=Ue.get(S);B.__hasExternalTextures=!0,B.__hasExternalTextures&&(B.__autoAllocateDepthBuffer=N===void 0,B.__autoAllocateDepthBuffer||Se.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),B.__useRenderToTexture=!1))},this.setRenderTargetFramebuffer=function(S,P){const N=Ue.get(S);N.__webglFramebuffer=P,N.__useDefaultFramebuffer=P===void 0},this.setRenderTarget=function(S,P=0,N=0){A=S,D=P,C=N;let B=!0,U=null,ce=!1,_e=!1;if(S){const be=Ue.get(S);be.__useDefaultFramebuffer!==void 0?(me.bindFramebuffer(L.FRAMEBUFFER,null),B=!1):be.__webglFramebuffer===void 0?M.setupRenderTarget(S):be.__hasExternalTextures&&M.rebindTextures(S,Ue.get(S.texture).__webglTexture,Ue.get(S.depthTexture).__webglTexture);const Ne=S.texture;(Ne.isData3DTexture||Ne.isDataArrayTexture||Ne.isCompressedArrayTexture)&&(_e=!0);const Le=Ue.get(S).__webglFramebuffer;S.isWebGLCubeRenderTarget?(Array.isArray(Le[P])?U=Le[P][N]:U=Le[P],ce=!0):Re.isWebGL2&&S.samples>0&&M.useMultisampledRTT(S)===!1?U=Ue.get(S).__webglMultisampledFramebuffer:Array.isArray(Le)?U=Le[N]:U=Le,E.copy(S.viewport),k.copy(S.scissor),Y=S.scissorTest}else E.copy(K).multiplyScalar(X).floor(),k.copy(J).multiplyScalar(X).floor(),Y=le;if(me.bindFramebuffer(L.FRAMEBUFFER,U)&&Re.drawBuffers&&B&&me.drawBuffers(S,U),me.viewport(E),me.scissor(k),me.setScissorTest(Y),ce){const be=Ue.get(S.texture);L.framebufferTexture2D(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_CUBE_MAP_POSITIVE_X+P,be.__webglTexture,N)}else if(_e){const be=Ue.get(S.texture),Ne=P||0;L.framebufferTextureLayer(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,be.__webglTexture,N||0,Ne)}$=-1},this.readRenderTargetPixels=function(S,P,N,B,U,ce,_e){if(!(S&&S.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Me=Ue.get(S).__webglFramebuffer;if(S.isWebGLCubeRenderTarget&&_e!==void 0&&(Me=Me[_e]),Me){me.bindFramebuffer(L.FRAMEBUFFER,Me);try{const be=S.texture,Ne=be.format,Le=be.type;if(Ne!==1023&&ue.convert(Ne)!==L.getParameter(L.IMPLEMENTATION_COLOR_READ_FORMAT)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}const Pe=Le===1016&&(Se.has("EXT_color_buffer_half_float")||Re.isWebGL2&&Se.has("EXT_color_buffer_float"));if(Le!==1009&&ue.convert(Le)!==L.getParameter(L.IMPLEMENTATION_COLOR_READ_TYPE)&&!(Le===1015&&(Re.isWebGL2||Se.has("OES_texture_float")||Se.has("WEBGL_color_buffer_float")))&&!Pe){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}P>=0&&P<=S.width-B&&N>=0&&N<=S.height-U&&L.readPixels(P,N,B,U,ue.convert(Ne),ue.convert(Le),ce)}finally{const be=A!==null?Ue.get(A).__webglFramebuffer:null;me.bindFramebuffer(L.FRAMEBUFFER,be)}}},this.copyFramebufferToTexture=function(S,P,N=0){const B=Math.pow(2,-N),U=Math.floor(P.image.width*B),ce=Math.floor(P.image.height*B);M.setTexture2D(P,0),L.copyTexSubImage2D(L.TEXTURE_2D,N,0,0,S.x,S.y,U,ce),me.unbindTexture()},this.copyTextureToTexture=function(S,P,N,B=0){const U=P.image.width,ce=P.image.height,_e=ue.convert(N.format),Me=ue.convert(N.type);M.setTexture2D(N,0),L.pixelStorei(L.UNPACK_FLIP_Y_WEBGL,N.flipY),L.pixelStorei(L.UNPACK_PREMULTIPLY_ALPHA_WEBGL,N.premultiplyAlpha),L.pixelStorei(L.UNPACK_ALIGNMENT,N.unpackAlignment),P.isDataTexture?L.texSubImage2D(L.TEXTURE_2D,B,S.x,S.y,U,ce,_e,Me,P.image.data):P.isCompressedTexture?L.compressedTexSubImage2D(L.TEXTURE_2D,B,S.x,S.y,P.mipmaps[0].width,P.mipmaps[0].height,_e,P.mipmaps[0].data):L.texSubImage2D(L.TEXTURE_2D,B,S.x,S.y,_e,Me,P.image),B===0&&N.generateMipmaps&&L.generateMipmap(L.TEXTURE_2D),me.unbindTexture()},this.copyTextureToTexture3D=function(S,P,N,B,U=0){if(x.isWebGL1Renderer){console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: can only be used with WebGL2.");return}const ce=S.max.x-S.min.x+1,_e=S.max.y-S.min.y+1,Me=S.max.z-S.min.z+1,be=ue.convert(B.format),Ne=ue.convert(B.type);let Le;if(B.isData3DTexture)M.setTexture3D(B,0),Le=L.TEXTURE_3D;else if(B.isDataArrayTexture||B.isCompressedArrayTexture)M.setTexture2DArray(B,0),Le=L.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}L.pixelStorei(L.UNPACK_FLIP_Y_WEBGL,B.flipY),L.pixelStorei(L.UNPACK_PREMULTIPLY_ALPHA_WEBGL,B.premultiplyAlpha),L.pixelStorei(L.UNPACK_ALIGNMENT,B.unpackAlignment);const Pe=L.getParameter(L.UNPACK_ROW_LENGTH),et=L.getParameter(L.UNPACK_IMAGE_HEIGHT),Et=L.getParameter(L.UNPACK_SKIP_PIXELS),ot=L.getParameter(L.UNPACK_SKIP_ROWS),qt=L.getParameter(L.UNPACK_SKIP_IMAGES),Ze=N.isCompressedTexture?N.mipmaps[U]:N.image;L.pixelStorei(L.UNPACK_ROW_LENGTH,Ze.width),L.pixelStorei(L.UNPACK_IMAGE_HEIGHT,Ze.height),L.pixelStorei(L.UNPACK_SKIP_PIXELS,S.min.x),L.pixelStorei(L.UNPACK_SKIP_ROWS,S.min.y),L.pixelStorei(L.UNPACK_SKIP_IMAGES,S.min.z),N.isDataTexture||N.isData3DTexture?L.texSubImage3D(Le,U,P.x,P.y,P.z,ce,_e,Me,be,Ne,Ze.data):N.isCompressedArrayTexture?(console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: untested support for compressed srcTexture."),L.compressedTexSubImage3D(Le,U,P.x,P.y,P.z,ce,_e,Me,be,Ze.data)):L.texSubImage3D(Le,U,P.x,P.y,P.z,ce,_e,Me,be,Ne,Ze),L.pixelStorei(L.UNPACK_ROW_LENGTH,Pe),L.pixelStorei(L.UNPACK_IMAGE_HEIGHT,et),L.pixelStorei(L.UNPACK_SKIP_PIXELS,Et),L.pixelStorei(L.UNPACK_SKIP_ROWS,ot),L.pixelStorei(L.UNPACK_SKIP_IMAGES,qt),U===0&&B.generateMipmaps&&L.generateMipmap(Le),me.unbindTexture()},this.initTexture=function(S){S.isCubeTexture?M.setTextureCube(S,0):S.isData3DTexture?M.setTexture3D(S,0):S.isDataArrayTexture||S.isCompressedArrayTexture?M.setTexture2DArray(S,0):M.setTexture2D(S,0),me.unbindTexture()},this.resetState=function(){D=0,C=0,A=null,me.reset(),Ie.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return 2e3}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=e===Ii?"display-p3":"srgb",t.unpackColorSpace=We.workingColorSpace===Kn?"display-p3":"srgb"}get outputEncoding(){return console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace===lt?3001:3e3}set outputEncoding(e){console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace=e===3001?lt:kt}get useLegacyLights(){return console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights}set useLegacyLights(e){console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights=e}}class hd extends wr{}hd.prototype.isWebGL1Renderer=!0;class fd extends xt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t}}class Cr extends Hn{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new ze(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}}const Rr=new st,us=new Ls,wi=new si,Ci=new I;class pd extends xt{constructor(e=new Nt,t=new Cr){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){const n=this.geometry,s=this.matrixWorld,i=e.params.Points.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),wi.copy(n.boundingSphere),wi.applyMatrix4(s),wi.radius+=i,e.ray.intersectsSphere(wi)===!1)return;Rr.copy(s).invert(),us.copy(e.ray).applyMatrix4(Rr);const a=i/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=n.index,u=n.attributes.position;if(c!==null){const f=Math.max(0,o.start),m=Math.min(c.count,o.start+o.count);for(let g=f,_=m;g<_;g++){const p=c.getX(g);Ci.fromBufferAttribute(u,p),Lr(Ci,p,l,s,e,t,this)}}else{const f=Math.max(0,o.start),m=Math.min(u.count,o.start+o.count);for(let g=f,_=m;g<_;g++)Ci.fromBufferAttribute(u,g),Lr(Ci,g,l,s,e,t,this)}}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let i=0,o=s.length;i<o;i++){const a=s[i].name||String(i);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=i}}}}}function Lr(r,e,t,n,s,i,o){const a=us.distanceSqToPoint(r);if(a<t){const l=new I;us.closestPointToPoint(r,l),l.applyMatrix4(n);const c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;i.push({distance:c,distanceToRay:Math.sqrt(a),point:l,index:e,face:null,object:o})}}class hs extends Nt{constructor(e=1,t=32,n=16,s=0,i=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:s,phiLength:i,thetaStart:o,thetaLength:a},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));const l=Math.min(o+a,Math.PI);let c=0;const d=[],u=new I,f=new I,m=[],g=[],_=[],p=[];for(let h=0;h<=n;h++){const T=[],x=h/n;let w=0;h===0&&o===0?w=.5/t:h===n&&l===Math.PI&&(w=-.5/t);for(let D=0;D<=t;D++){const C=D/t;u.x=-e*Math.cos(s+C*i)*Math.sin(o+x*a),u.y=e*Math.cos(o+x*a),u.z=e*Math.sin(s+C*i)*Math.sin(o+x*a),g.push(u.x,u.y,u.z),f.copy(u).normalize(),_.push(f.x,f.y,f.z),p.push(C+w,1-x),T.push(c++)}d.push(T)}for(let h=0;h<n;h++)for(let T=0;T<t;T++){const x=d[h][T+1],w=d[h][T],D=d[h+1][T],C=d[h+1][T+1];(h!==0||o>0)&&m.push(x,w,C),(h!==n-1||l<Math.PI)&&m.push(w,D,C)}this.setIndex(m),this.setAttribute("position",new Ft(g,3)),this.setAttribute("normal",new Ft(_,3)),this.setAttribute("uv",new Ft(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new hs(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}}class md{constructor(e=!0){this.autoStart=e,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=Pr(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let e=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){const t=Pr();e=(t-this.oldTime)/1e3,this.oldTime=t,this.elapsedTime+=e}return e}}function Pr(){return(typeof performance>"u"?Date:performance).now()}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Ct}})),typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Ct);const Pn=[{name:"HR",radius:70,speed:2,color:[.678,.847,.902],size:12,duration:12},{name:"Finance",radius:90,speed:1.33,color:[1,.667,.298],size:14,duration:18},{name:"Estates",radius:110,speed:1,color:[0,.831,.831],size:16,duration:25},{name:"Compliance",radius:130,speed:.75,color:[.902,.765,1],size:14,duration:32},{name:"Teaching",radius:150,speed:.6,color:[1,.714,.757],size:16,duration:40},{name:"SEND",radius:170,speed:.44,color:[.596,1,.596],size:14,duration:55},{name:"Governance",radius:190,speed:.32,color:[1,.843,0],size:18,duration:75}],Ri=400,fs=[.17,.83,.75];class ps{constructor(e){W(this,"container");W(this,"scene");W(this,"camera");W(this,"renderer");W(this,"containerWidth");W(this,"containerHeight");W(this,"scaleFactor");W(this,"sun",null);W(this,"planets",[]);W(this,"animationId",null);W(this,"clock");W(this,"_isRunning",!1);W(this,"state","solar");W(this,"transitionProgress",0);W(this,"transitionStartTime",0);W(this,"transitionDuration",1.5);W(this,"planetAngles",[]);W(this,"vertexShader",`
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = 3.0;
    }
  `);W(this,"fragmentShader",`
    varying vec3 vColor;
    void main() {
      if(length(gl_PointCoord - vec2(0.5)) > 0.5) discard;
      gl_FragColor = vec4(vColor, 0.9);
    }
  `);W(this,"animate",()=>{if(!this._isRunning)return;const e=this.clock.getElapsedTime();if(this.state==="transitioning"){const t=e-this.transitionStartTime,n=Math.min(t/this.transitionDuration,1),s=this.transitionProgress<.5;this.transitionProgress=s?n:1-n,n>=1&&(this.state=s?"chaser":"solar",this.transitionProgress=s?1:0,console.log("[Particle3D] Transition complete, state:",this.state))}if(this.sun)if(this.sun.rotation.y+=.01,this.state==="chaser"){const t=Math.sin(e*2)*.1+1;this.sun.scale.set(t,t,t)}else this.sun.scale.set(1,1,1);this.planets.forEach((t,n)=>{const s=Pn[n];if(this.state==="solar"||this.state==="transitioning"){const i=2*Math.PI/s.duration;this.planetAngles[n]+=i*.016;const o=this.planetAngles[n],l=s.radius*this.scaleFactor*(1-this.transitionProgress*.7);t.position.x=l*Math.cos(o),t.position.y=l*Math.sin(o),t.position.z=0}else if(this.state==="chaser"){const o=e*1.5+n*Math.PI*2/Pn.length,a=this.containerWidth*.2*this.scaleFactor;t.position.x=a*Math.cos(o),t.position.y=a*Math.sin(o),t.position.z=0,t.rotation.z+=.02}}),this.renderer.render(this.scene,this.camera),this.animationId=requestAnimationFrame(this.animate)});this.container=e,this.clock=new md,this.containerWidth=e.clientWidth||parseInt(e.style.width)||300,this.containerHeight=e.clientHeight||parseInt(e.style.height)||300,this.scaleFactor=this.containerWidth/520,e.style.display="block",e.style.visibility="visible",e.style.opacity="1",e.style.position||(e.style.position="absolute"),e.style.pointerEvents||(e.style.pointerEvents="none"),this.scene=new fd;const t=this.containerWidth/this.containerHeight,s=Math.max(this.containerWidth,this.containerHeight)/2;this.camera=new Js(-s*t,s*t,s,-s,.1,1e3),this.camera.position.z=100,this.renderer=new wr({alpha:!0,antialias:!0}),this.renderer.setSize(this.containerWidth,this.containerHeight),this.renderer.domElement.style.width="100%",this.renderer.domElement.style.height="100%",this.renderer.domElement.style.display="block",this.renderer.domElement.style.position="absolute",this.renderer.domElement.style.top="0",this.renderer.domElement.style.left="0",this.renderer.domElement.style.pointerEvents="none",e.appendChild(this.renderer.domElement);const i=[35,120,210,300,20,95,335];this.planetAngles=Pn.map((o,a)=>(i[a]||0)*Math.PI/180),this.createSun(),this.createPlanets(),window.addEventListener("resize",this.handleResize.bind(this)),console.log("[Particle3D] Initialized (Solar System)",{containerSize:`${this.containerWidth}x${this.containerHeight}`,scaleFactor:this.scaleFactor.toFixed(3),sun:Ri,planets:Pn.map(o=>`${o.name}: ${o.size}px`)})}createSun(){const e=new Nt,t=new Float32Array(Ri*3),n=new Float32Array(Ri*3);for(let i=0;i<Ri;i++){const o=Math.random()*Math.PI*2,a=Math.acos(Math.random()*2-1),l=.3+Math.random()*.1;t[i*3]=l*Math.sin(a)*Math.cos(o),t[i*3+1]=l*Math.sin(a)*Math.sin(o),t[i*3+2]=l*Math.cos(a),n[i*3]=fs[0],n[i*3+1]=fs[1],n[i*3+2]=fs[2]}e.setAttribute("position",new bt(t,3)),e.setAttribute("color",new bt(n,3));const s=new Cr({size:3,vertexColors:!0,transparent:!0,opacity:.9});this.sun=new pd(e,s),this.scene.add(this.sun)}createPlanets(){Pn.forEach((e,t)=>{const n=e.size*this.scaleFactor/2,s=new hs(n,32,32),i=new Ji({color:new ze(e.color[0],e.color[1],e.color[2]),transparent:!0,opacity:1}),o=new Xt(s,i),a=e.radius*this.scaleFactor;o.position.set(a,0,0),this.scene.add(o),this.planets.push(o)})}setActive(e){e&&this.state==="solar"?(this.state="transitioning",this.transitionStartTime=this.clock.getElapsedTime(),console.log("[Particle3D] Transitioning to chaser formation")):!e&&this.state==="chaser"&&(this.state="transitioning",this.transitionStartTime=this.clock.getElapsedTime(),console.log("[Particle3D] Transitioning to solar system"))}morphTo(e){this.state!=="solar"&&this.setActive(!1)}morphToFlag(e,t){console.log("[Particle3D] morphToFlag called - no-op in solar system mode")}start(){this._isRunning||(console.log("[Particle3D] Starting animation"),this._isRunning=!0,this.clock.start(),this.animate())}stop(){this._isRunning=!1,this.animationId&&(cancelAnimationFrame(this.animationId),this.animationId=null)}isRunning(){return this._isRunning}handleResize(){const e=this.container.clientWidth||this.containerWidth,t=this.container.clientHeight||this.containerHeight;this.containerWidth=e,this.containerHeight=t,this.scaleFactor=this.containerWidth/520;const n=e/t,i=Math.max(e,t)/2;this.camera.left=-i*n,this.camera.right=i*n,this.camera.top=i,this.camera.bottom=-i,this.camera.updateProjectionMatrix(),this.renderer.setSize(e,t),this.planets.forEach((o,a)=>{const c=Pn[a].radius*this.scaleFactor,d=this.planetAngles[a];o.position.x=c*Math.cos(d),o.position.y=c*Math.sin(d)})}destroy(){this.stop(),this.sun&&(this.scene.remove(this.sun),this.sun.geometry.dispose(),this.sun.material.dispose()),this.planets.forEach(e=>{this.scene.remove(e),e.geometry.dispose(),e.material.dispose()}),this.planets=[],this.renderer.dispose(),window.removeEventListener("resize",this.handleResize),this.renderer.domElement.parentNode&&this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)}}const gd=[{id:"magic-tools",icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M17.8 6.2L19 5M12.2 11.8L11 13M12.2 6.2L11 5"/>
      <path d="M15 9a1 1 0 0 1 1 1 1 1 0 0 1-1 1 1 1 0 0 1-1-1 1 1 0 0 1 1-1"/>
      <path d="M3 21l9-9"/>
      <path d="M12.2 6.2L11 5"/>
    </svg>`,label:"Magic Tools"},{id:"settings",icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>`,label:"Settings"},{id:"microphone",icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
    </svg>`,label:"Close"}];class _d{constructor(e,t){W(this,"container");W(this,"options");W(this,"items",new Map);W(this,"activeMenu",null);this.container=e,this.options=t,e&&(e.style.display="flex",e.style.visibility="visible",e.style.opacity="1"),this.render(),document.addEventListener("click",n=>{const s=n.target;if(this.activeMenu){!this.activeMenu.contains(s)&&!this.container.contains(s)&&this.closeMenu();const i=s.closest(".dock-item");i&&i!==this.container.querySelector(`[data-action="${this.activeMenu.dataset.action}"]`)&&this.closeMenu()}})}render(){this.container.innerHTML="",this.container.style.display="flex",this.container.style.visibility="visible",this.container.style.opacity="1",gd.forEach(e=>{const t=document.createElement("button");e.id==="microphone"&&(t.id="dock-mic-btn"),t.className="dock-item",t.setAttribute("data-action",e.id),t.setAttribute("aria-label",e.label),t.setAttribute("title",e.label),t.innerHTML=e.icon,t.style.opacity="1",t.style.visibility="visible",t.style.display="flex",t.addEventListener("click",()=>this.handleClick(e.id)),t.addEventListener("mouseenter",()=>this.handleHover(t,!0)),t.addEventListener("mouseleave",()=>this.handleHover(t,!1)),this.items.set(e.id,t),this.container.appendChild(t)}),requestAnimationFrame(()=>{this.container.style.display="flex",this.container.style.visibility="visible",this.container.style.opacity="1"})}handleClick(e){const t=this.items.get(e);t&&(t.classList.add("ed-dock-clicked"),setTimeout(()=>t.classList.remove("ed-dock-clicked"),200)),["magic-tools","settings"].includes(e)?this.activeMenu&&this.activeMenu.dataset.action===e?this.closeMenu():(this.closeMenu(),setTimeout(()=>{this.toggleMenu(e,t)},50)):(this.closeMenu(),this.options.onAction(e))}toggleMenu(e,t){if(this.activeMenu&&this.activeMenu.dataset.action===e){this.closeMenu();return}this.closeMenu();const n=this.createMenu(e,t);n&&(this.activeMenu=n,t.style.position="relative",t.appendChild(n),n.style.display="flex",n.style.visibility="visible",requestAnimationFrame(()=>{n.classList.add("dock-menu-visible"),n.style.opacity="1"}))}createMenu(e,t){const n=document.createElement("div");switch(n.className="dock-menu",n.dataset.action=e,e){case"magic-tools":n.innerHTML=`
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
        `;break;case"settings":n.innerHTML=`
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
        `;break;default:return null}return n.querySelectorAll(".dock-menu-item").forEach(s=>{s.addEventListener("click",i=>{i.stopPropagation(),i.preventDefault();const o=s.dataset.tool,a=s.dataset.setting,l=s.dataset.lang,c=s.dataset.persona;this.closeMenu(),setTimeout(()=>{var d,u,f,m,g,_,p,h;if(o)(u=(d=this.options).onToolAction)==null||u.call(d,o);else if(a){const T=a.replace("theme-","");(m=(f=this.options).onSettingChange)==null||m.call(f,T)}else l?(_=(g=this.options).onLanguageChange)==null||_.call(g,l):c&&((h=(p=this.options).onPersonaChange)==null||h.call(p,c))},100)})}),n}closeMenu(){this.activeMenu&&(this.activeMenu.classList.remove("dock-menu-visible"),this.activeMenu.style.opacity="0",this.activeMenu.style.pointerEvents="none",setTimeout(()=>{if(this.activeMenu){this.activeMenu.parentNode&&this.activeMenu.parentNode.removeChild(this.activeMenu);const e=this.container.querySelector(`[data-action="${this.activeMenu.dataset.action}"]`);e&&e.contains(this.activeMenu)&&e.removeChild(this.activeMenu),this.activeMenu=null}},200))}handleHover(e,t){t?e.classList.add("ed-dock-hover"):e.classList.remove("ed-dock-hover")}setListening(e){const t=this.items.get("microphone");t&&(e?t.classList.add("mic-active"):t.classList.remove("mic-active"))}highlight(e){const t=this.items.get(e);t&&(t.classList.add("ed-dock-highlight"),setTimeout(()=>t.classList.remove("ed-dock-highlight"),2e3))}setVisible(e,t){const n=this.items.get(e);n&&(n.style.display=t?"":"none")}}class vd{constructor(e,t,n){W(this,"container");W(this,"messagesContainer");W(this,"messages",[]);W(this,"onQuickReply");W(this,"onConfirmation");this.container=e,this.messagesContainer=document.createElement("div"),this.onQuickReply=t,this.onConfirmation=n,this.render()}render(){this.container.innerHTML="",this.container.className="chat-scroll scrollbar-hide",this.messagesContainer=this.container}addMessage(e){this.messages.push(e),this.renderMessage(e),this.scrollToBottom()}updateLastMessage(e){const t=this.messagesContainer.lastElementChild;t&&(t.innerHTML=this.formatMessage(e),this.scrollToBottom())}renderMessage(e){var s;const t=document.createElement("div");t.className=`msg msg-${e.role==="user"?"user":"ai"}`,t.setAttribute("data-id",e.id);let n=this.formatMessage(e.content);if(e.translation&&e.translation!==e.content&&(n+=`<div class="msg-divider"></div><span class="msg-sub">${this.escapeHtml(e.translation)}</span>`),t.innerHTML=n,e.role==="assistant"&&e.quickReplies&&e.quickReplies.length>0){const i=document.createElement("div");i.className="quick-replies",e.quickReplies.forEach(o=>{const a=document.createElement("button");a.className="quick-reply-btn",a.textContent=o,a.addEventListener("click",()=>{this.onQuickReply&&this.onQuickReply(o)}),i.appendChild(a)}),t.appendChild(i)}if(e.confirmation&&!e.confirmation.resolved){const i=document.createElement("div");i.className="ed-confirmation-card",i.innerHTML=`
        <div class="ed-confirmation-buttons">
          <button class="ed-confirm-btn ed-confirm-yes">${e.confirmation.confirmLabel||"Yes"}</button>
          <button class="ed-confirm-btn ed-confirm-no">${e.confirmation.declineLabel||"No thanks"}</button>
        </div>
      `;const o=i.querySelector(".ed-confirm-yes"),a=i.querySelector(".ed-confirm-no");o.addEventListener("click",()=>{this.resolveConfirmation(e,"confirmed",i)}),a.addEventListener("click",()=>{this.resolveConfirmation(e,"declined",i)}),t.appendChild(i)}if((s=e.confirmation)!=null&&s.resolved){const i=document.createElement("div");i.className="ed-confirmation-resolved",i.textContent=e.confirmation.choice==="confirmed"?"✅ Confirmed":"❌ Declined",t.appendChild(i)}t.style.opacity="0",t.style.transform="scale(0.9) translateY(10px)",this.messagesContainer.appendChild(t),requestAnimationFrame(()=>{t.style.transition="all 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)",t.style.opacity="1",t.style.transform="scale(1) translateY(0)"}),t.querySelectorAll("a.ed-nav-link").forEach(i=>{i.addEventListener("click",o=>{o.preventDefault();const a=i.getAttribute("href");a&&a.startsWith("/")&&(window.location.href=a)})})}formatMessage(e){let t=this.escapeHtml(e);return t=t.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>"),t=t.replace(/\*(.*?)\*/g,"<em>$1</em>"),t=t.replace(/\[([^\]]+)\]\(([^)]+)\)/g,(n,s,i)=>i.startsWith("/")&&!i.startsWith("//")?`<a href="${i}" class="ed-nav-link" style="color:#2dd4bf;text-decoration:underline;cursor:pointer;font-weight:600">${s}</a>`:`<a href="${i}" target="_blank" rel="noopener">${s}</a>`),t=t.replace(/\n/g,"<br>"),t}escapeHtml(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}formatTime(e){return e.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}getUserIcon(){return`<svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="8" r="4"/>
      <path d="M12 14c-4 0-8 2-8 6v2h16v-2c0-4-4-6-8-6z"/>
    </svg>`}getEdIcon(){return`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>
      <path d="M9 12l-2 8M15 12l2 8" stroke-linecap="round"/>
    </svg>`}resolveConfirmation(e,t,n){var s,i;e.confirmation&&(e.confirmation.resolved=!0,e.confirmation.choice=t),n.innerHTML=`<div class="ed-confirmation-resolved">${t==="confirmed"?"✅ Confirmed":"❌ Declined"}</div>`,(i=this.onConfirmation)==null||i.call(this,((s=e.confirmation)==null?void 0:s.id)||"",t)}scrollToBottom(){requestAnimationFrame(()=>{this.messagesContainer.scrollTop=this.messagesContainer.scrollHeight})}clear(){this.messages=[],this.messagesContainer.innerHTML=""}getMessages(){return[...this.messages]}updateMessage(e,t){const n=this.messages.find(s=>s.id===e);if(n){n.content=t;const s=this.messagesContainer.querySelector(`[data-id="${e}"]`);if(s){const i=s.querySelector(".ed-message-bubble");i&&(i.innerHTML=this.formatMessage(t))}}}showTyping(){const e="typing-"+Date.now(),t=document.createElement("div");return t.className="ed-message ed-message-assistant ed-message-typing",t.setAttribute("data-id",e),t.innerHTML=`
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
    `,this.messagesContainer.appendChild(t),this.scrollToBottom(),e}hideTyping(e){const t=this.messagesContainer.querySelector(`[data-id="${e}"]`);t&&t.remove()}}class xd{constructor(e="en-GB"){W(this,"recognition",null);W(this,"isListening",!1);W(this,"language");W(this,"onResultCallback",null);W(this,"onListeningChangeCallback",null);W(this,"onErrorCallback",null);this.language=e,this.initRecognition()}initRecognition(){const e=window.SpeechRecognition||window.webkitSpeechRecognition;if(!e){console.warn("[Ed Voice] Speech recognition not supported");return}this.recognition=new e,this.recognition.continuous=!1,this.recognition.interimResults=!0,this.recognition.lang=this.language,this.recognition.maxAlternatives=1,this.recognition.onstart=()=>{var t;this.isListening=!0,(t=this.onListeningChangeCallback)==null||t.call(this,!0)},this.recognition.onend=()=>{var t;this.isListening=!1,(t=this.onListeningChangeCallback)==null||t.call(this,!1)},this.recognition.onresult=t=>{var i;const n=t.results,s=n[n.length-1];if(s.isFinal){const o=s[0].transcript.trim();o&&((i=this.onResultCallback)==null||i.call(this,o))}},this.recognition.onerror=t=>{var n,s;console.error("[Ed Voice] Error:",t.error),this.isListening=!1,(n=this.onListeningChangeCallback)==null||n.call(this,!1),(s=this.onErrorCallback)==null||s.call(this,t.error)}}start(){var e;if(!this.recognition){(e=this.onErrorCallback)==null||e.call(this,"Speech recognition not supported");return}if(!this.isListening)try{this.recognition.start()}catch(t){console.error("[Ed Voice] Failed to start:",t)}}stop(){if(!(!this.recognition||!this.isListening))try{this.recognition.stop()}catch(e){console.error("[Ed Voice] Failed to stop:",e)}}setLanguage(e){this.language=e,this.recognition&&(this.recognition.lang=e)}onResult(e){this.onResultCallback=e}onListeningChange(e){this.onListeningChangeCallback=e}onError(e){this.onErrorCallback=e}isSupported(){return this.recognition!==null}getIsListening(){return this.isListening}destroy(){this.stop(),this.recognition=null}}class Sd{constructor(e){W(this,"element");W(this,"currentState","ready");this.element=document.createElement("div"),this.element.className="status-pill",this.element.id="status-pill",this.element.textContent="Ready",e.appendChild(this.element)}setState(e){this.currentState=e;const t={ready:"Ready",listening:"Listening...",thinking:"Thinking...",speaking:"Speaking..."};this.element.textContent=t[e],e==="ready"?this.element.style.opacity="0":this.element.style.opacity="1"}getState(){return this.currentState}show(){this.element.style.opacity="1"}hide(){this.element.style.opacity="0"}}class yd{constructor(e){W(this,"container");W(this,"particle3D",null);W(this,"currentShape","sphere");W(this,"isVisible",!1);W(this,"shapes",["sphere","pencil","lightbulb","flag","heart","star","logo","thumbsup","checkmark","smiley","book","clock","warning","question","loading","calendar","search","phone","location","fireworks","party","confetti","trophy","excited","thinking","confused","error","speech","document","calculator","bell","graduation"]);this.container=e,this.createUI()}createUI(){const e=document.createElement("div");e.id="emoji-tester-panel",e.style.cssText=`
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
    `;const n=document.createElement("h2");n.textContent="🎨 Emoji Shape Tester",n.style.cssText=`
      margin: 0;
      font-size: 1.2rem;
      color: #2dd4bf;
    `;const s=document.createElement("button");s.textContent="✕",s.style.cssText=`
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
    `,s.onmouseover=()=>{s.style.background="#2dd4bf",s.style.color="#000"},s.onmouseout=()=>{s.style.background="transparent",s.style.color="#2dd4bf"},s.onclick=()=>this.hide(),t.appendChild(n),t.appendChild(s);const i=document.createElement("div");i.id="emoji-tester-canvas",i.style.cssText=`
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
    `,this.shapes.forEach(c=>{const d=document.createElement("button");d.textContent=this.getShapeEmoji(c),d.title=c,d.style.cssText=`
        padding: 12px;
        background: rgba(45, 212, 191, 0.1);
        border: 2px solid transparent;
        border-radius: 6px;
        cursor: pointer;
        font-size: 1.5rem;
        transition: all 0.2s;
        color: #fff;
      `,d.onmouseover=()=>{d.style.background="rgba(45, 212, 191, 0.2)",d.style.borderColor="#2dd4bf"},d.onmouseout=()=>{this.currentShape!==c&&(d.style.background="rgba(45, 212, 191, 0.1)",d.style.borderColor="transparent")},d.onclick=()=>this.selectShape(c),c===this.currentShape&&(d.style.background="rgba(45, 212, 191, 0.3)",d.style.borderColor="#2dd4bf");const u=document.createElement("div");u.textContent=c,u.style.cssText=`
        font-size: 0.7rem;
        color: #aaa;
        margin-top: 4px;
      `;const f=document.createElement("div");f.style.cssText="text-align: center;",f.appendChild(d),f.appendChild(u),a.appendChild(f)});const l=document.createElement("div");l.id="emoji-tester-info",l.style.cssText=`
      margin-top: 15px;
      padding: 12px;
      background: rgba(45, 212, 191, 0.1);
      border-radius: 6px;
      font-size: 0.9rem;
      color: #aaa;
    `,this.updateInfo(),e.appendChild(t),e.appendChild(i),e.appendChild(o),e.appendChild(a),e.appendChild(l),document.body.appendChild(e)}getShapeEmoji(e){return{sphere:"⚪",pencil:"✏️",lightbulb:"💡",flag:"🏴",heart:"❤️",star:"⭐",logo:"🎓",thumbsup:"👍",checkmark:"✅",smiley:"😊",book:"📖",clock:"⏰",warning:"⚠️",question:"❓",loading:"⏳",calendar:"📅",search:"🔍",phone:"📞",location:"📍",fireworks:"🎆",party:"🎉",confetti:"🎊",trophy:"🏆",excited:"⚡",thinking:"🤔",confused:"😕",error:"❌",speech:"💬",document:"📄",calculator:"🧮",bell:"🔔",graduation:"🎓"}[e]||"⚪"}updateInfo(){const e=document.getElementById("emoji-tester-info");e&&(e.textContent=`Current: ${this.currentShape} ${this.getShapeEmoji(this.currentShape)}`)}selectShape(e){var t;this.currentShape=e,(t=this.particle3D)==null||t.morphTo(e),this.updateInfo(),this.updateButtonStates()}updateButtonStates(){const e=document.getElementById("emoji-tester-panel");if(!e)return;e.querySelectorAll("button").forEach(n=>{n.title===this.currentShape?(n.style.background="rgba(45, 212, 191, 0.3)",n.style.borderColor="#2dd4bf"):(n.style.background="rgba(45, 212, 191, 0.1)",n.style.borderColor="transparent")})}show(){const e=document.getElementById("emoji-tester-panel");if(!e)return;this.isVisible=!0,e.style.display="block";const t=document.getElementById("emoji-tester-canvas");t&&!this.particle3D&&(this.particle3D=new ps(t),this.particle3D.start(),this.particle3D.morphTo(this.currentShape))}hide(){const e=document.getElementById("emoji-tester-panel");e&&(this.isVisible=!1,e.style.display="none",this.particle3D&&this.particle3D.stop())}toggle(){this.isVisible?this.hide():this.show()}destroy(){this.particle3D&&(this.particle3D.stop(),this.particle3D=null);const e=document.getElementById("emoji-tester-panel");e&&e.remove()}}class Md{constructor(e,t){W(this,"apiKey");W(this,"model");W(this,"conversationHistory",[]);W(this,"modelsToTry",["gemini-2.5-flash","gemini-pro-latest","gemini-2.0-flash","gemini-flash-latest"]);if(!e||e.trim()==="")throw new Error("Gemini API key is required. Set VITE_GEMINI_API_KEY in .env.local");this.apiKey=e,this.model=t||"gemini-2.5-flash";const n=e.substring(0,10)+"..."+e.substring(e.length-4);console.log(`[Gemini] Initialized with API key: ${n}, model: ${this.model}`)}getBaseUrl(e){return`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent`}getBaseUrlV1(e){return`https://generativelanguage.googleapis.com/v1/models/${e}:generateContent`}async listAvailableModels(){var e;try{const t=await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`);if(!t.ok){const i=await t.json().catch(()=>({}));return console.error("[Gemini] Failed to list models:",i),[]}const s=((e=(await t.json()).models)==null?void 0:e.map(i=>{var o;return((o=i.name)==null?void 0:o.replace("models/",""))||""}))||[];return console.log("[Gemini] Available models:",s),s}catch(t){return console.error("[Gemini] Error listing models:",t),[]}}async chat(e,t){var o,a,l,c,d,u,f,m;const n=this.buildSystemPrompt(t);this.conversationHistory.push({role:"user",content:e});const s=[this.model,...this.modelsToTry.filter(g=>g!==this.model)];for(const g of s)try{let _=await this.tryRequest(g,n,!0);if(!_.ok){const p=await _.json().catch(()=>({}));(_.status===404||(a=(o=p.error)==null?void 0:o.message)!=null&&a.includes("not found"))&&(console.log(`[Gemini] Model ${g} not found in v1beta, trying v1 API...`),_=await this.tryRequest(g,n,!1))}if(_.ok){const p=await _.json(),h=((f=(u=(d=(c=(l=p.candidates)==null?void 0:l[0])==null?void 0:c.content)==null?void 0:d.parts)==null?void 0:u[0])==null?void 0:f.text)||"";if(!h){console.warn(`[Gemini] Empty response from ${g}:`,p);continue}return g!==this.model&&(console.log(`[Gemini] ✅ Using model: ${g}`),this.model=g),this.conversationHistory.push({role:"assistant",content:h}),h}else{const h=((m=(await _.json().catch(()=>({}))).error)==null?void 0:m.message)||`HTTP ${_.status}`,T=this.getBaseUrl(g).split("?")[0];if(console.error(`[Gemini] Model ${g} failed:`,{model:g,status:_.status,error:h,url:T}),_.status===401||_.status===403)throw new Error(`API key authentication failed (${_.status}). Check your API key is valid.`);continue}}catch(_){console.warn(`[Gemini] Error with model ${g}:`,_);continue}const i=["All Gemini models failed.","","Possible issues:","1. API key may be invalid or expired","2. API key may not have Gemini API enabled in Google Cloud Console","3. Project may not have billing enabled","4. Models may not be available in your region","","To diagnose:","- Check your API key is valid at https://ai.google.dev/","- Ensure Gemini API is enabled in Google Cloud Console","- Check that billing is enabled for your project","- Try calling listAvailableModels() to see what models you have access to"].join(`
`);throw console.error("[Gemini]",i),new Error(i)}async tryRequest(e,t,n){const s=n?this.getBaseUrl(e):this.getBaseUrlV1(e);return console.log(`[Gemini] Attempting ${e} via ${n?"v1beta":"v1"} API...`),await fetch(`${s}?key=${this.apiKey}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{role:"user",parts:[{text:t},...this.conversationHistory.map(i=>({text:`${i.role}: ${i.content}`}))]}],generationConfig:{temperature:.7,topK:40,topP:.95,maxOutputTokens:1024},safetySettings:[{category:"HARM_CATEGORY_HARASSMENT",threshold:"BLOCK_MEDIUM_AND_ABOVE"},{category:"HARM_CATEGORY_HATE_SPEECH",threshold:"BLOCK_MEDIUM_AND_ABOVE"},{category:"HARM_CATEGORY_SEXUALLY_EXPLICIT",threshold:"BLOCK_MEDIUM_AND_ABOVE"},{category:"HARM_CATEGORY_DANGEROUS_CONTENT",threshold:"BLOCK_MEDIUM_AND_ABOVE"}]})})}buildSystemPrompt(e){const{persona:t,language:n,schoolId:s,toolContext:i,pageContext:o}=e;let a=`You are ${t.name}, a friendly AI assistant for ${s} school. 
Your personality: ${t.greeting}
Current language: ${n.name} (${n.code})

IMPORTANT GUIDELINES:
- Be helpful, friendly, and professional
- Keep responses concise (2-3 sentences for simple questions)
- If asked about admissions, forms, or school procedures, offer to help
- Always be supportive of parents, especially those for whom English isn't their first language
- If you don't know specific school information, politely say so and suggest contacting the school office
- Respond in ${n.name} when the user speaks in ${n.name}

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

Use this information to provide relevant, contextual answers about what the user is currently viewing. Reference specific content from the page when helpful.`),i&&(a+=`

CURRENT TOOL CONTEXT:
The user is currently using "${i.name}" (${i.category} category).
${i.url?`Tool URL: ${i.url}`:""}

Your expertise for this tool includes: ${i.expertise.join(", ")}.

When answering questions:
- Provide guidance specific to ${i.name}
- Help with common tasks and workflows in this tool
- Offer tips and best practices for school staff using this tool
- If asked about features you're unsure of, suggest checking the tool's help documentation`),a}clearHistory(){this.conversationHistory=[]}getHistory(){return[...this.conversationHistory]}}class Ed{constructor(e="/api/ed/chat",t,n,s){W(this,"baseUrl");W(this,"organizationId");W(this,"userId");W(this,"accessToken");W(this,"mode","school");W(this,"screenStream",null);W(this,"screenVideo",null);this.baseUrl=e,this.organizationId=t,this.userId=n,this.accessToken=s}setMode(e){this.mode=e}async queryWebsiteKnowledge(e){if(!this.organizationId||this.mode!=="website")return null;try{const t=await fetch("/api/ed/website-knowledge",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:e,organizationId:this.organizationId})});if(t.ok)return await t.json()}catch(t){console.error("[EdAPIClient] Website knowledge query error:",t)}return null}async chat(e,t,n,s){var i,o;try{const a={url:window.location.href,hostname:window.location.hostname,title:document.title,visibleText:((o=(i=document.body)==null?void 0:i.innerText)==null?void 0:o.substring(0,5e3))||"",headings:Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6")).map(f=>{var m;return{level:parseInt(f.tagName[1]),text:((m=f.textContent)==null?void 0:m.trim())||""}}).filter(f=>f.text).slice(0,20)},l={question:e,image:n,messages:s==null?void 0:s.slice(-10),context:a,organizationId:this.organizationId,userId:this.userId},c={"Content-Type":"application/json"};this.accessToken&&(c.Authorization=`Bearer ${this.accessToken}`);const d=await fetch(this.baseUrl,{method:"POST",credentials:"include",headers:c,body:JSON.stringify(l)});if(!d.ok)throw new Error(`API error: ${d.status} ${d.statusText}`);return(await d.json()).answer||"I'm sorry, I couldn't get a response. Please try again."}catch(a){return console.error("[EdAPIClient] Error:",a),this.organizationId?"I'm having trouble connecting right now. As your school support assistant, I can help with tasks once I'm back online. Please try again in a moment.":"I'm having trouble connecting. For help logging in, please try refreshing the page or contact support if the problem persists."}}getGreeting(e="school",t){return e==="website"?"Hi! I'm Ed, the school assistant. How can I help you today?":e==="support"?"Hi! I'm Ed. Need help logging in or finding something?":`Hi${t?` ${t}`:""}! I'm Ed, your school assistant. What can I help with?`}async startScreenShare(){try{if(this.screenStream)return!0;const e=await navigator.mediaDevices.getDisplayMedia({video:{width:{ideal:1280},height:{ideal:720}},audio:!1});this.screenStream=e;const t=document.createElement("video");return t.srcObject=e,t.muted=!0,t.playsInline=!0,t.style.position="fixed",t.style.top="-9999px",document.body.appendChild(t),await t.play(),this.screenVideo=t,e.getVideoTracks()[0].addEventListener("ended",()=>{this.stopScreenShare()}),console.log("[EdAPIClient] Screen sharing started"),!0}catch(e){return console.error("[EdAPIClient] Screen share failed:",e),!1}}stopScreenShare(){this.screenStream&&(this.screenStream.getTracks().forEach(e=>e.stop()),this.screenStream=null),this.screenVideo&&(this.screenVideo.remove(),this.screenVideo=null),console.log("[EdAPIClient] Screen sharing stopped")}get isScreenSharing(){return!!this.screenStream&&this.screenStream.active}captureFrame(){var e;if(!this.screenVideo||!((e=this.screenStream)!=null&&e.active))return null;try{const t=document.createElement("canvas");t.width=this.screenVideo.videoWidth||1280,t.height=this.screenVideo.videoHeight||720;const n=t.getContext("2d");return n?(n.drawImage(this.screenVideo,0,0,t.width,t.height),t.toDataURL("image/jpeg",.7)):null}catch{return null}}async captureScreen(){var t;const e=this.captureFrame();if(e)return e;try{if(typeof chrome<"u"&&((t=chrome.runtime)!=null&&t.sendMessage))return new Promise(n=>{chrome.runtime.sendMessage({type:"CAPTURE_SCREENSHOT"},s=>{n((s==null?void 0:s.screenshot)||null)}),setTimeout(()=>n(null),3e3)})}catch{}return null}setAccessToken(e){this.accessToken=e}setContext(e,t){this.organizationId=e,this.userId=t}}const Dr={ed:{id:"ed",name:"Ed",color:"#2dd4bf",voicePitch:1,voiceRate:1,greeting:"Hello! I'm Ed, your school assistant. How can I help you today?",icon:"🎓"},edwina:{id:"edwina",name:"Edwina",color:"#2dd4bf",voicePitch:1.2,voiceRate:1,greeting:"Hello! I'm Edwina, your school assistant. How can I help you today?",icon:"🎓"},santa:{id:"santa",name:"Santa",color:"#ef4444",voicePitch:.8,voiceRate:.9,greeting:"Ho ho ho! I'm Santa's helper at your school. What would you like to know?",icon:"🎅"},elf:{id:"elf",name:"Jingle",color:"#eab308",voicePitch:1.3,voiceRate:1.1,greeting:"Hi there! I'm Jingle the Elf, here to help with all your school questions!",icon:"🧝"},headteacher:{id:"headteacher",name:"Headteacher",color:"#0f172a",voicePitch:.9,voiceRate:.9,greeting:"Welcome to our school. I am the Headteacher. How may I assist you today?",icon:"🧑‍🏫"},custom:{id:"custom",name:"Assistant",color:"#8b5cf6",voicePitch:1,voiceRate:1,greeting:"Hello! How can I assist you today?",icon:"🤖"}};function Xn(r){return Dr[r]||Dr.ed}const qn=[{code:"en-GB",name:"English",nativeName:"English",flag:"🇬🇧",flagColors:["#012169","#FFFFFF","#C8102E"],voiceLang:"en-GB",greeting:"Hello! I'm Ed, your school assistant."},{code:"pl",name:"Polish",nativeName:"Polski",flag:"🇵🇱",flagColors:["#FFFFFF","#DC143C"],voiceLang:"pl-PL",greeting:"Cześć! Jestem Ed, asystent szkolny."},{code:"ro",name:"Romanian",nativeName:"Română",flag:"🇷🇴",flagColors:["#002B7F","#FCD116","#CE1126"],voiceLang:"ro-RO",greeting:"Bună! Sunt Ed, asistentul școlii."},{code:"ur",name:"Urdu",nativeName:"اردو",flag:"🇵🇰",flagColors:["#01411C","#FFFFFF"],voiceLang:"ur-PK",greeting:"ہیلو! میں ایڈ ہوں، آپ کا اسکول اسسٹنٹ۔"},{code:"bn",name:"Bengali",nativeName:"বাংলা",flag:"🇧🇩",flagColors:["#006A4E","#F42A41"],voiceLang:"bn-BD",greeting:"হ্যালো! আমি এড, আপনার স্কুল সহকারী।"},{code:"so",name:"Somali",nativeName:"Soomaali",flag:"🇸🇴",flagColors:["#4189DD","#FFFFFF"],voiceLang:"so-SO",greeting:"Salaan! Waxaan ahay Ed, kaaliyaha dugsiga."},{code:"es",name:"Spanish",nativeName:"Español",flag:"🇪🇸",flagColors:["#AA151B","#F1BF00","#AA151B"],voiceLang:"es-ES",greeting:"¡Hola! Soy Ed, tu asistente escolar."},{code:"pt",name:"Portuguese",nativeName:"Português",flag:"🇵🇹",flagColors:["#006600","#FF0000"],voiceLang:"pt-PT",greeting:"Olá! Sou o Ed, o assistente da escola."},{code:"fr",name:"French",nativeName:"Français",flag:"🇫🇷",flagColors:["#002395","#FFFFFF","#ED2939"],voiceLang:"fr-FR",greeting:"Bonjour! Je suis Ed, l'assistant scolaire."},{code:"zh",name:"Chinese",nativeName:"中文",flag:"🇨🇳",flagColors:["#DE2910","#FFDE00"],voiceLang:"zh-CN",greeting:"你好！我是Ed，您的学校助手。"},{code:"ar",name:"Arabic",nativeName:"العربية",flag:"🇸🇦",flagColors:["#006C35","#FFFFFF"],voiceLang:"ar-SA",greeting:"مرحبا! أنا إد، مساعد المدرسة."},{code:"pa",name:"Punjabi",nativeName:"ਪੰਜਾਬੀ",flag:"🇮🇳",flagColors:["#FF9933","#FFFFFF","#138808"],voiceLang:"pa-IN",greeting:"ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਐਡ ਹਾਂ, ਤੁਹਾਡਾ ਸਕੂਲ ਸਹਾਇਕ।"}];function ms(r){return qn.find(e=>e.code===r)||qn[0]}const Td=["password","hidden","submit","button","reset","image","file"],bd=["password","passwd","pin","cvv","cvc","card","credit","debit","payment","billing","token","secret","csrf"];class Ad{constructor(){W(this,"session",null);W(this,"highlightEl",null)}detectForms(){const e=[];if(document.querySelectorAll("form").forEach(s=>{const i=this.extractFields(s);i.length>0&&e.push({element:s,fields:i,title:this.inferFormTitle(s),fieldCount:i.length})}),document.querySelectorAll('[role="form"]').forEach(s=>{if(s.tagName==="FORM")return;const i=this.extractFields(s);i.length>0&&e.push({element:s,fields:i,title:this.inferFormTitle(s),fieldCount:i.length})}),e.length===0){const s=document.querySelectorAll("input:not([type=hidden]):not([type=submit]), textarea, select");if(s.length>0){const i=this.findCommonContainer(Array.from(s));if(i){const o=this.extractFields(i);o.length>0&&e.push({element:i,fields:o,title:this.inferFormTitle(i),fieldCount:o.length})}}}return e}startFilling(e){const t=e instanceof HTMLFormElement?this.extractFields(e):this.extractFields(e);return t.length===0?null:(this.session={id:crypto.randomUUID(),form:e,fields:t,currentIndex:0,values:new Map,status:"filling",startedAt:new Date},this.injectStyles(),this.showProgress(),this.highlightCurrentField(),this.getCurrentField())}getCurrentField(){return!this.session||this.session.currentIndex>=this.session.fields.length?null:this.session.fields[this.session.currentIndex]}fillCurrentField(e){const t=this.getCurrentField();return!t||!this.session?!1:(this.session.values.set(this.session.currentIndex,e),this.fillFieldAnimated(t,e),!0)}fillFieldByVoice(e){const t=this.getCurrentField();if(!t||!this.session)return!1;const n=e.trim();let s=n;if(t.type==="checkbox"){const i=["yes","yeah","yep","true","check","agree","correct","tick"],o=["no","nah","nope","false","uncheck","disagree","untick"];if(i.some(a=>n.toLowerCase().includes(a)))s="true";else if(o.some(a=>n.toLowerCase().includes(a)))s="false";else return!1}if(t.type==="email address"&&(s=this.parseSpokenEmail(n)),t.type==="phone number"&&(s=this.parseSpokenPhone(n)),t.type==="dropdown"&&t.element instanceof HTMLSelectElement){const i=Array.from(t.element.options).filter(l=>l.value&&l.value!==""),o=n.toLowerCase();let a=i.find(l=>l.value.toLowerCase()===o);if(a||(a=i.find(l=>l.text.toLowerCase()===o)),a||(a=i.find(l=>l.text.toLowerCase().startsWith(o))),a||(a=i.find(l=>l.text.toLowerCase().includes(o))),a||(a=i.find(l=>l.text.length>2&&o.includes(l.text.toLowerCase()))),a)s=a.value;else return!1}return this.session.values.set(this.session.currentIndex,s),this.fillFieldAnimated(t,s),!0}parseSpokenEmail(e){let t=e.toLowerCase().trim();return t=t.replace(/^(my email is|it's|its|email is|the)\s+/i,""),t=t.replace(/\s+at\s+/g,"@"),t=t.replace(/\s+dot\s+/g,"."),t=t.replace(/\s+underscore\s+/g,"_"),t=t.replace(/\s+(dash|hyphen)\s+/g,"-"),t=t.replace(/\s+/g,""),t.includes("@")&&t.includes(".")?t:e.trim()}parseSpokenPhone(e){let t=e.toLowerCase().trim();t=t.replace(/^(my number is|it's|its|number is|the number is|phone number is)\s+/i,"");const n={zero:"0",oh:"0",o:"0",one:"1",two:"2",three:"3",four:"4",five:"5",six:"6",seven:"7",eight:"8",nine:"9",double:"",triple:""};return t=t.replace(/double\s+(\w+)/gi,(a,l)=>{const c=n[l.toLowerCase()];return c!==void 0?c+c:l+l}),t=t.replace(/triple\s+(\w+)/gi,(a,l)=>{const c=n[l.toLowerCase()];return c!==void 0?c+c+c:l+l+l}),t.split(/[\s,]+/).map(a=>n[a]??a).join("").replace(/[^0-9+]/g,"")||e.trim()}nextField(){return this.session?(this.session.currentIndex++,this.session.currentIndex>=this.session.fields.length?(this.session.status="reviewing",this.clearHighlight(),this.updateProgress(),null):(this.highlightCurrentField(),this.updateProgress(),this.getCurrentField())):null}goToField(e){return!this.session||e<0||e>=this.session.fields.length?null:(this.session.currentIndex=e,this.session.status="filling",this.highlightCurrentField(),this.updateProgress(),this.getCurrentField())}previousField(){return!this.session||this.session.currentIndex<=0?null:(this.session.currentIndex--,this.highlightCurrentField(),this.updateProgress(),this.getCurrentField())}getSummary(){return this.session?this.session.fields.map((e,t)=>({label:e.label,value:this.session.values.get(t)||"(empty)",index:t})):[]}getProgress(){if(!this.session)return{current:0,total:0,percentage:0};const e=this.session.fields.length,t=this.session.values.size;return{current:t,total:e,percentage:e>0?Math.round(t/e*100):0}}submitForm(){if(!this.session)return Promise.resolve(!1);const e=this.session.form,t=this.getSummary();return new Promise(n=>{const s=document.createElement("div");s.id="ed-submit-confirm",s.style.cssText=`
        position: fixed; inset: 0; z-index: 999999;
        background: rgba(0,0,0,0.5); display: flex;
        align-items: center; justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        animation: ed-field-pulse 0.3s ease-out;
      `;const i=document.createElement("div");i.style.cssText=`
        background: #fff; border-radius: 12px; padding: 24px;
        max-width: 420px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      `;const o=document.createElement("h3");o.textContent="Review before submitting",o.style.cssText="margin: 0 0 16px; color: #1a1a1a; font-size: 18px;";const a=document.createElement("ul");a.style.cssText="list-style: none; padding: 0; margin: 0 0 20px;";for(const g of t){const _=document.createElement("li");_.style.cssText=`
          padding: 8px 0; border-bottom: 1px solid #eee;
          font-size: 14px; color: #333;
        `;const p=document.createElement("strong");p.textContent=g.label+": ",_.appendChild(p),_.appendChild(document.createTextNode(g.value==="(empty)"?"⚠️ empty":g.value)),a.appendChild(_)}const l=document.createElement("p");l.style.cssText="font-size: 12px; color: #666; margin: 0 0 16px;",l.textContent="Ed will submit this form on your behalf. You are in control — cancel if anything looks wrong.";const c=document.createElement("div");c.style.cssText="display: flex; gap: 12px; justify-content: flex-end;";const d=document.createElement("button");d.textContent="Cancel",d.style.cssText=`
        padding: 10px 20px; border-radius: 8px; border: 1px solid #ddd;
        background: #fff; color: #333; cursor: pointer; font-size: 14px;
      `;const u=document.createElement("button");u.textContent="Confirm & Submit",u.style.cssText=`
        padding: 10px 20px; border-radius: 8px; border: none;
        background: #0ea5e9; color: #fff; cursor: pointer; font-size: 14px;
        font-weight: 600;
      `;const f=()=>s.remove();d.addEventListener("click",()=>{f(),n(!1)}),u.addEventListener("click",()=>{if(f(),this.session.status="complete",this.cleanup(),e instanceof HTMLFormElement){const g=new Event("submit",{bubbles:!0,cancelable:!0}),_=e.dispatchEvent(g);_&&e.submit(),n(_)}else{const g=e.querySelector('button[type="submit"], input[type="submit"], button:not([type])');g?(g.click(),n(!0)):n(!1)}});const m=g=>{g.key==="Escape"&&(f(),document.removeEventListener("keydown",m),n(!1))};document.addEventListener("keydown",m),c.appendChild(d),c.appendChild(u),i.appendChild(o),i.appendChild(a),i.appendChild(l),i.appendChild(c),s.appendChild(i),document.body.appendChild(s)})}stop(){this.session&&(this.session.status="idle"),this.session=null,this.cleanup()}get isActive(){var e,t;return((e=this.session)==null?void 0:e.status)==="filling"||((t=this.session)==null?void 0:t.status)==="reviewing"}extractFields(e){const t=[];return e.querySelectorAll("input, textarea, select").forEach(s=>{if(s instanceof HTMLInputElement&&Td.includes(s.type)||!this.isVisible(s))return;const i=[s.id,s.name,s.className,s.getAttribute("aria-label")||"",s.getAttribute("autocomplete")||""].join(" ").toLowerCase();if(bd.some(a=>new RegExp(`(^|[\\s_\\-./])${a}([\\s_\\-./]|$)`,"i").test(i)))return;const o=this.findLabel(s);t.push({element:s,label:o||s.name||s.id||"Field",type:this.getFieldType(s),required:s.required||s.getAttribute("aria-required")==="true",placeholder:s.placeholder})}),t}findLabel(e){var a,l,c,d;const t=e.id;if(t){const u=document.querySelector(`label[for="${CSS.escape(t)}"]`);if((a=u==null?void 0:u.textContent)!=null&&a.trim())return u.textContent.trim()}const n=e.closest("label");if(n){const u=n.cloneNode(!0);u.querySelectorAll("input, select, textarea").forEach(m=>m.remove());const f=(l=u.textContent)==null?void 0:l.trim();if(f)return f}const s=e.getAttribute("aria-labelledby");if(s){const u=document.getElementById(s);if((c=u==null?void 0:u.textContent)!=null&&c.trim())return u.textContent.trim()}const i=e.getAttribute("aria-label");if(i)return i;const o=e.previousElementSibling;if((o==null?void 0:o.tagName)==="SPAN"||(o==null?void 0:o.tagName)==="LABEL"){const u=(d=o.textContent)==null?void 0:d.trim();if(u)return u}return e.placeholder||""}getFieldType(e){if(e instanceof HTMLSelectElement)return"dropdown";if(e instanceof HTMLTextAreaElement)return"text area";const t=e.type;return{email:"email address",tel:"phone number",date:"date","datetime-local":"date and time",number:"number",checkbox:"checkbox",radio:"choice",url:"website",color:"colour",range:"slider",time:"time"}[t]||"text"}fillFieldAnimated(e,t){var s;const n=e.element;(s=n.scrollIntoView)==null||s.call(n,{behavior:"smooth",block:"center"}),n.focus(),n.dispatchEvent(new Event("focus",{bubbles:!0})),n instanceof HTMLSelectElement?this.fillSelect(n,t):n instanceof HTMLInputElement&&n.type==="checkbox"?this.fillCheckbox(n,t):n instanceof HTMLInputElement&&n.type==="radio"?this.fillRadio(n,t):n instanceof HTMLInputElement&&n.type==="date"?this.fillDate(n,t):this.fillTextAnimated(n,t),this.flashField(n,"success")}fillTextAnimated(e,t){var s;const n=(s=Object.getOwnPropertyDescriptor(e instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,"value"))==null?void 0:s.set;n?n.call(e,t):e.value=t,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new Event("change",{bubbles:!0})),e.dispatchEvent(new Event("blur",{bubbles:!0}))}fillSelect(e,t){const n=Array.from(e.options),s=n.find(i=>i.value.toLowerCase()===t.toLowerCase())||n.find(i=>i.text.toLowerCase().includes(t.toLowerCase()));s&&(e.value=s.value,e.dispatchEvent(new Event("change",{bubbles:!0})))}fillCheckbox(e,t){const n=["yes","true","1","check","tick"].includes(t.toLowerCase());e.checked!==n&&(e.checked=n,e.dispatchEvent(new Event("change",{bubbles:!0})),e.dispatchEvent(new Event("click",{bubbles:!0})))}fillRadio(e,t){const n=e.name;document.querySelectorAll(`input[type="radio"][name="${CSS.escape(n)}"]`).forEach(i=>{const o=this.findLabel(i).toLowerCase();(i.value.toLowerCase()===t.toLowerCase()||o.includes(t.toLowerCase()))&&(i.checked=!0,i.dispatchEvent(new Event("change",{bubbles:!0})),i.dispatchEvent(new Event("click",{bubbles:!0})))})}fillDate(e,t){var i;const n=this.parseDateToISO(t),s=(i=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value"))==null?void 0:i.set;s?s.call(e,n||t):e.value=n||t,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new Event("change",{bubbles:!0}))}injectStyles(){if(document.getElementById("ed-formfill-styles"))return;const e=document.createElement("style");e.id="ed-formfill-styles",e.textContent=`
      @keyframes ed-field-pulse {
        0%, 100% { box-shadow: 0 0 0 2px rgba(45, 212, 191, 0.6); }
        50% { box-shadow: 0 0 0 6px rgba(45, 212, 191, 0.2), 0 0 20px rgba(45, 212, 191, 0.15); }
      }
      @keyframes ed-field-flash-success {
        0% { box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.8); }
        100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
      }
      @keyframes ed-progress-slide {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes ed-field-label-in {
        from { transform: translateY(8px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .ed-field-active {
        outline: 2px solid #2dd4bf !important;
        outline-offset: 2px !important;
        animation: ed-field-pulse 2s ease-in-out infinite !important;
        transition: outline 0.3s ease !important;
        position: relative !important;
        z-index: 10000 !important;
      }
      .ed-field-filled {
        outline: 2px solid #22c55e !important;
        outline-offset: 2px !important;
        animation: ed-field-flash-success 0.6s ease-out forwards !important;
      }
      .ed-field-label {
        position: absolute;
        background: #0f172a;
        color: #2dd4bf;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-weight: 600;
        white-space: nowrap;
        z-index: 10001;
        pointer-events: none;
        animation: ed-field-label-in 0.3s ease-out;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      }
      .ed-field-label::after {
        content: '';
        position: absolute;
        bottom: -4px;
        left: 16px;
        width: 8px;
        height: 8px;
        background: #0f172a;
        transform: rotate(45deg);
      }
      .ed-progress-bar {
        position: fixed;
        bottom: 100px;
        right: 20px;
        background: rgba(15, 23, 42, 0.95);
        color: white;
        padding: 12px 16px;
        border-radius: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 13px;
        z-index: 2147483646;
        min-width: 220px;
        animation: ed-progress-slide 0.3s ease-out;
        box-shadow: 0 8px 30px rgba(0,0,0,0.3);
        border: 1px solid rgba(45, 212, 191, 0.2);
        backdrop-filter: blur(10px);
      }
      .ed-progress-track {
        height: 4px;
        background: rgba(255,255,255,0.1);
        border-radius: 2px;
        margin-top: 8px;
        overflow: hidden;
      }
      .ed-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #2dd4bf, #06b6d4);
        border-radius: 2px;
        transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .ed-progress-field-name {
        color: #2dd4bf;
        font-weight: 600;
      }
      .ed-progress-count {
        color: rgba(255,255,255,0.5);
        font-size: 11px;
        margin-top: 4px;
      }
    `,document.head.appendChild(e)}highlightCurrentField(){var l,c;this.clearHighlight();const e=this.getCurrentField();if(!e)return;const t=e.element;t.classList.add("ed-field-active"),(l=t.scrollIntoView)==null||l.call(t,{behavior:"smooth",block:"center"});const n=t.getBoundingClientRect(),s=document.createElement("div");s.className="ed-field-label",s.id="ed-field-label-overlay";const i=this.getProgress(),o=(((c=this.session)==null?void 0:c.currentIndex)||0)+1,a=e.required?" *":"";s.textContent=`${o}/${i.total} ${e.label}${a}`,s.style.top=`${n.top+window.scrollY-32}px`,s.style.left=`${n.left+window.scrollX}px`,document.body.appendChild(s),this.highlightEl=s}clearHighlight(){var e;document.querySelectorAll(".ed-field-active").forEach(t=>{t.classList.remove("ed-field-active")}),this.highlightEl&&(this.highlightEl.remove(),this.highlightEl=null),(e=document.getElementById("ed-field-label-overlay"))==null||e.remove()}flashField(e,t){e.classList.remove("ed-field-active"),e.classList.add("ed-field-filled"),setTimeout(()=>e.classList.remove("ed-field-filled"),600)}showProgress(){var n;this.removeProgress();const e=this.getProgress(),t=document.createElement("div");t.className="ed-progress-bar",t.id="ed-formfill-progress",t.innerHTML=`
      <div>
        Ed is helping you fill this form
      </div>
      <div class="ed-progress-count">
        Field <span class="ed-progress-field-name">${((n=this.getCurrentField())==null?void 0:n.label)||""}</span>
      </div>
      <div class="ed-progress-track">
        <div class="ed-progress-fill" style="width: ${e.percentage}%"></div>
      </div>
      <div class="ed-progress-count">${e.current} of ${e.total} fields</div>
    `,document.body.appendChild(t)}updateProgress(){const e=document.getElementById("ed-formfill-progress");if(!e||!this.session)return;const t=this.getProgress(),n=this.getCurrentField(),s=e.querySelector(".ed-progress-field-name");s&&(s.textContent=(n==null?void 0:n.label)||"Review");const i=e.querySelector(".ed-progress-fill");i&&(i.style.width=`${t.percentage}%`);const o=e.querySelectorAll(".ed-progress-count");o[1]&&(o[1].textContent=`${t.current} of ${t.total} fields`)}removeProgress(){var e;(e=document.getElementById("ed-formfill-progress"))==null||e.remove()}parseDateToISO(e){if(!(e!=null&&e.trim()))return null;const t=e.trim();if(/^\d{4}-\d{2}-\d{2}$/.test(t))return t;try{let n=null;const s=t.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?([a-z]+)\s+(\d{4})/i);if(s&&(n=new Date(`${s[2]} ${s[1]}, ${s[3]}`)),!n||isNaN(n.getTime())){const l=t.match(/([a-z]+)\s+(\d{1,2}),?\s+(\d{4})/i);l&&(n=new Date(`${l[1]} ${l[2]}, ${l[3]}`))}if(!n||isNaN(n.getTime())){const l=t.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);l&&(n=new Date(parseInt(l[3]),parseInt(l[2])-1,parseInt(l[1])))}if((!n||isNaN(n.getTime()))&&(n=new Date(t)),!n||isNaN(n.getTime()))return null;const i=n.getFullYear(),o=String(n.getMonth()+1).padStart(2,"0"),a=String(n.getDate()).padStart(2,"0");return`${i}-${o}-${a}`}catch{return null}}isVisible(e){const t=window.getComputedStyle(e);if(t.display==="none"||t.visibility==="hidden"||t.opacity==="0")return!1;if(typeof e.offsetParent<"u"){if(e.offsetParent===null&&t.position!=="fixed"&&e.offsetWidth>0)return!1;const n=e.getBoundingClientRect();if(n.width>0||n.height>0)return!0}return!0}inferFormTitle(e){var s;const t=e.querySelector("h1, h2, h3, h4, legend");if((s=t==null?void 0:t.textContent)!=null&&s.trim())return t.textContent.trim();const n=e.getAttribute("aria-label");if(n)return n;if(e instanceof HTMLFormElement&&e.action)try{const o=new URL(e.action).pathname.split("/").pop();if(o)return o.replace(/[-_]/g," ")}catch{}return"Form"}findCommonContainer(e){if(e.length===0)return null;if(e.length===1)return e[0].parentElement;let t=e[0].parentElement;for(;t&&t!==document.body;){if(e.every(s=>t.contains(s)))return t;t=t.parentElement}return document.body}cleanup(){var e;this.clearHighlight(),this.removeProgress(),(e=document.getElementById("ed-formfill-styles"))==null||e.remove()}}class wd{constructor(e,t={}){W(this,"idleTimer",null);W(this,"config");W(this,"onNudge");W(this,"isActive",!1);this.onNudge=e,this.config={enabled:!1,idleTimeout:12e4,pageRules:{fees:"I know school fees can be confusing. Would you like to see our bursary options?",bursary:"We offer several financial support packages. Shall I guide you through the application?",transport:"Do you need help finding the nearest school bus stop to your home?",apply:"Starting an application is the first step! I can help you fill out this form if you like.",admissions:"Admissions are open for next year. Would you like to know about the deadlines?"},...t},this.config.enabled&&(this.isActive=!0,this.init())}init(){["mousedown","mousemove","keypress","scroll","touchstart"].forEach(t=>{document.addEventListener(t,()=>this.resetTimer(),!0)}),this.resetTimer()}resetTimer(){this.isActive&&(this.idleTimer&&window.clearTimeout(this.idleTimer),this.idleTimer=window.setTimeout(()=>{this.triggerNudge()},this.config.idleTimeout))}triggerNudge(){if(!this.isActive)return;const e=window.location.pathname.toLowerCase(),t=Object.entries(this.config.pageRules).find(([n])=>e.includes(n));t?this.onNudge(t[1]):Math.random()>.7&&this.onNudge("I'm here if you need any help! Just ask."),this.stop()}stop(){this.isActive=!1,this.idleTimer&&(window.clearTimeout(this.idleTimer),this.idleTimer=null)}start(){this.isActive=!0,this.resetTimer()}}const Cd=`You are Ed (short for Edwig), the friendly AI assistant for Schoolgle — the school operating system for UK primary schools. You are a wise, warm owl character who helps school staff with everything they need.

Your personality:
- Warm, encouraging, and patient — you are speaking to busy teachers and school staff
- You use British English spelling and terminology (headteacher not principal, Year 6 not 6th grade, maths not math, timetable not schedule)
- You keep responses concise for voice — 2-3 sentences max unless asked for detail
- You naturally use school-specific language: half term, INSET day, SATs, phonics screening, pupil premium, SEND, safeguarding
- If asked something you are unsure about, say so honestly
- You have a slightly dry wit — professional but with a glint of humour

Voice delivery:
- Speak with a clear, warm British accent — professional and approachable
- Speak at a moderate pace, slightly slower than conversational — school staff are often multitasking
- Use a friendly, supportive tone — imagine you are a trusted, knowledgeable colleague in the staffroom
- Avoid jargon unless it is standard school terminology
- Never use American English pronunciations or terminology

You can help with:
- Navigating Schoolgle features and modules
- School improvement and Ofsted readiness questions
- Estates management and compliance queries
- Staff HR and wellbeing questions
- General school administration advice
- Explaining data and reports

You cannot:
- Access or discuss individual pupil data by name (GDPR)
- Make safeguarding decisions — always direct to the DSL
- Provide legal advice — suggest they consult their LA or union`;class Rd{constructor(e="/api/voice/config"){W(this,"state","idle");W(this,"callbacks",{});W(this,"ws",null);W(this,"audioContext",null);W(this,"workletNode",null);W(this,"mediaStream",null);W(this,"sourceNode",null);W(this,"playbackContext",null);W(this,"playbackQueue",[]);W(this,"isPlaying",!1);W(this,"currentSource",null);W(this,"configUrl");this.configUrl=e}on(e){this.callbacks={...this.callbacks,...e}}getState(){return this.state}isActive(){return this.state==="connecting"||this.state==="listening"||this.state==="speaking"}async start(){var e,t,n,s,i,o;if(this.isActive()){console.log("[GeminiLive] Already active");return}this.setState("connecting");try{const a=await fetch(this.configUrl);if(!a.ok)throw new Error("Failed to get voice config");const{wsUrl:l}=await a.json();console.log("[GeminiLive] Got WebSocket URL"),this.mediaStream=await navigator.mediaDevices.getUserMedia({audio:{sampleRate:16e3,channelCount:1,echoCancellation:!0,noiseSuppression:!0,autoGainControl:!0}}),console.log("[GeminiLive] Mic access granted"),this.audioContext=new AudioContext({sampleRate:16e3}),await this.audioContext.audioWorklet.addModule("/js/audio-processor.worklet.js"),this.workletNode=new AudioWorkletNode(this.audioContext,"audio-capture-processor"),this.sourceNode=this.audioContext.createMediaStreamSource(this.mediaStream),this.sourceNode.connect(this.workletNode),console.log("[GeminiLive] AudioWorklet ready"),this.ws=new WebSocket(l),this.ws.onopen=()=>{console.log("[GeminiLive] WebSocket connected, sending setup"),this.ws.send(JSON.stringify({setup:{model:"models/gemini-2.5-flash-native-audio-preview-12-2025",generationConfig:{responseModalities:["AUDIO"],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:"Charon"}}}},systemInstruction:{parts:[{text:Cd}]}}}))},this.ws.onmessage=c=>this.handleMessage(c),this.ws.onerror=()=>{var c,d;console.error("[GeminiLive] WebSocket error"),this.setState("error"),(d=(c=this.callbacks).onError)==null||d.call(c,"Voice connection error — please try again")},this.ws.onclose=c=>{var d,u;console.log("[GeminiLive] WebSocket closed:",c.code,c.reason),this.state!=="idle"&&((u=(d=this.callbacks).onError)==null||u.call(d,c.reason||"Voice session ended"),this.cleanup(),this.setState("idle"))},this.workletNode.port.onmessage=c=>{var d;if(((d=this.ws)==null?void 0:d.readyState)===WebSocket.OPEN){const u=new Uint8Array(c.data);let f="";for(let m=0;m<u.length;m++)f+=String.fromCharCode(u[m]);this.ws.send(JSON.stringify({realtimeInput:{mediaChunks:[{mimeType:"audio/pcm;rate=16000",data:btoa(f)}]}}))}}}catch(a){console.error("[GeminiLive] Failed to start:",a),a.name==="NotAllowedError"?(t=(e=this.callbacks).onError)==null||t.call(e,"Microphone permission denied. Please allow mic access."):a.name==="NotFoundError"?(s=(n=this.callbacks).onError)==null||s.call(n,"No microphone found."):(o=(i=this.callbacks).onError)==null||o.call(i,a.message||"Failed to start voice chat"),this.setState("error"),this.cleanup()}}stop(){this.cleanup(),this.setState("idle"),console.log("[GeminiLive] Session ended")}stopPlayback(){if(this.playbackQueue=[],this.currentSource){try{this.currentSource.stop()}catch{}this.currentSource=null}this.isPlaying=!1}setState(e){var t,n;this.state=e,(n=(t=this.callbacks).onStateChange)==null||n.call(t,e)}async handleMessage(e){var t,n,s,i,o;try{let a=e.data;a instanceof Blob&&(a=await a.text());const l=JSON.parse(a);if(l.setupComplete){console.log("[GeminiLive] Setup complete — listening"),this.setState("listening");return}if(l.serverContent){const c=l.serverContent;if(c.interrupted){console.log("[GeminiLive] Interrupted — barge-in"),this.stopPlayback(),this.setState("listening");return}if(c.turnComplete){console.log("[GeminiLive] Turn complete"),(n=(t=this.callbacks).onTurnComplete)==null||n.call(t);return}const d=(s=c.modelTurn)==null?void 0:s.parts;if(d){for(const u of d)if((o=(i=u.inlineData)==null?void 0:i.mimeType)!=null&&o.startsWith("audio/")){this.state!=="speaking"&&this.setState("speaking");const f=this.base64ToArrayBuffer(u.inlineData.data);this.enqueueAudio(f)}}}l.toolCall&&console.log("[GeminiLive] Tool call:",l.toolCall)}catch(a){console.error("[GeminiLive] Message parse error:",a)}}base64ToArrayBuffer(e){const t=atob(e),n=new Uint8Array(t.length);for(let s=0;s<t.length;s++)n[s]=t.charCodeAt(s);return n.buffer}async enqueueAudio(e){this.playbackQueue.push(e),this.isPlaying||(this.isPlaying=!0,await this.drainPlaybackQueue())}async drainPlaybackQueue(){var t;this.playbackContext||(this.playbackContext=new AudioContext({sampleRate:24e3}));const e=this.playbackContext;for(;this.playbackQueue.length>0;){const n=this.playbackQueue.shift(),s=new Int16Array(n),i=new Float32Array(s.length);for(let l=0;l<s.length;l++)i[l]=s[l]/32768;const o=e.createBuffer(1,i.length,24e3);o.getChannelData(0).set(i);const a=e.createBufferSource();a.buffer=o,a.connect(e.destination),this.currentSource=a,a.start(),await new Promise(l=>{a.onended=()=>l()})}this.isPlaying=!1,this.currentSource=null,((t=this.ws)==null?void 0:t.readyState)===WebSocket.OPEN&&this.setState("listening")}cleanup(){var e,t,n,s,i;(e=this.mediaStream)==null||e.getTracks().forEach(o=>o.stop()),this.mediaStream=null,(t=this.sourceNode)==null||t.disconnect(),this.sourceNode=null,(n=this.workletNode)==null||n.disconnect(),this.workletNode=null,(s=this.audioContext)==null||s.close().catch(()=>{}),this.audioContext=null,this.stopPlayback(),(i=this.playbackContext)==null||i.close().catch(()=>{}),this.playbackContext=null,this.ws&&(this.ws.onclose=null,this.ws.close(),this.ws=null)}}class Ld{scan(){return{title:this.getTitle(),description:this.getDescription(),mainContent:this.getMainContent(),headings:this.getHeadings(),links:this.getImportantLinks(),forms:this.countForms(),pageType:this.detectPageType()}}getTitle(){var e,t;return document.title||((t=(e=document.querySelector("h1"))==null?void 0:e.textContent)==null?void 0:t.trim())||""}getDescription(){const e=document.querySelector('meta[name="description"]');return(e==null?void 0:e.getAttribute("content"))||""}getMainContent(){const e=["main",'[role="main"]',"#content",".content","#main",".main","article"];for(const t of e){const n=document.querySelector(t);if(n)return this.extractText(n,500)}return this.extractText(document.body,500)}getHeadings(){const e=[];return document.querySelectorAll("h1, h2, h3").forEach(n=>{var i;const s=(i=n.textContent)==null?void 0:i.trim();s&&!e.includes(s)&&e.push(s)}),e.slice(0,10)}getImportantLinks(){const e=[],t=document.querySelectorAll("a[href]"),n=["admission","apply","enrol","contact","form","register","calendar","term","policy","uniform","fee"];return t.forEach(s=>{var a;const i=((a=s.textContent)==null?void 0:a.trim())||"",o=s.getAttribute("href")||"";if(i&&o&&!o.startsWith("#")){const l=i.toLowerCase(),c=o.toLowerCase();n.some(d=>l.includes(d)||c.includes(d))&&e.push({text:i,href:o})}}),e.slice(0,10)}countForms(){return document.querySelectorAll("form").length}detectPageType(){const e=window.location.href.toLowerCase(),t=this.getTitle().toLowerCase(),n=this.getMainContent().toLowerCase();return e.includes("admission")||t.includes("admission")||n.includes("admission")?"admissions":e.includes("contact")||t.includes("contact")||n.includes("contact us")?"contact":e.includes("about")||t.includes("about")||n.includes("about our school")?"about":e.includes("news")||e.includes("blog")||t.includes("news")?"news":"general"}extractText(e,t){const n=e.cloneNode(!0);n.querySelectorAll("script, style, noscript, [hidden]").forEach(i=>i.remove());let s=n.textContent||"";return s=s.replace(/\s+/g," ").trim(),s.length>t&&(s=s.substring(0,t)+"..."),s}getContextForAI(){const e=this.scan();return`Current page: ${e.title}
Page type: ${e.pageType}
Has forms: ${e.forms>0?"Yes":"No"}
Key headings: ${e.headings.join(", ")}
Important links: ${e.links.map(t=>t.text).join(", ")}
Summary: ${e.mainContent.substring(0,200)}`}}const Pd=new Ld,Dd=[{id:"governance-home",name:"Governance Portal",route:"/dashboard/governance",description:"Governor directory, meetings and oversight",requiredRoles:["admin","headteacher","slt","governor"],keywords:["governance","governor","board","trustee","director"]},{id:"ofsted-readiness",name:"Ofsted Readiness",route:"/dashboard/ofsted-readiness",description:"Track framework compliance",requiredRoles:["admin","headteacher","slt","teacher"],keywords:["ofsted","inspection","readiness","framework","judgement"]},{id:"sef-builder",name:"SEF Builder",route:"/dashboard/sef",description:"Draft self-evaluation reports",requiredRoles:["admin","headteacher","slt"],keywords:["sef","self-evaluation","self evaluation"]},{id:"sdp-builder",name:"SDP Builder",route:"/dashboard/sdp",description:"Manage development plans",requiredRoles:["admin","headteacher","slt"],keywords:["sdp","development plan","school development"]},{id:"action-plan",name:"Action Plan",route:"/dashboard/action-plan",description:"Track strategic tasks",requiredRoles:["admin","headteacher","slt","teacher"],keywords:["action plan","actions hub","strategic actions"]},{id:"siams-readiness",name:"SIAMS Readiness",route:"/dashboard/siams",description:"Church school inspection preparation",requiredRoles:["admin","headteacher","slt","teacher","governor"],keywords:["siams","church school","church inspection","diocese"]},{id:"evidence-vault",name:"My Evidence",route:"/evidence",description:"Central evidence library",requiredRoles:["admin","headteacher","slt","teacher"],keywords:["evidence","evidence vault","proof","evidence library"]},{id:"estates-home",name:"Estates",route:"/dashboard/estates",description:"Premises, maintenance and contractor management",requiredRoles:["admin","headteacher","slt","caretaker"],keywords:["estates","premises","maintenance","contractor","facility","building maintenance"]},{id:"estates-energy",name:"Energy Dashboard",route:"/dashboard/estates/energy",description:"Energy usage and sustainability tracking",requiredRoles:["admin","headteacher","slt","caretaker"],keywords:["energy","electricity","gas bill","utility","utilities","carbon","sustainability","energy dashboard"]},{id:"estates-helpdesk",name:"Helpdesk",route:"/dashboard/estates/helpdesk",description:"Report and track maintenance issues",requiredRoles:["admin","headteacher","slt","teacher","caretaker"],keywords:["helpdesk","report issue","broken","repair request","maintenance request"]},{id:"compliance-home",name:"Compliance",route:"/dashboard/compliance",description:"Statutory policy management and training compliance",requiredRoles:["admin","headteacher","slt","governor"],keywords:["compliance","policy","policies","statutory","gdpr","training compliance"]},{id:"hr-people",name:"Staff Directory",route:"/dashboard/hr/people",description:"Manage school staff",requiredRoles:["admin","headteacher","slt"],keywords:["staff directory","staff list","people","employee","human resources"]},{id:"safeguarding-home",name:"Safeguarding",route:"/dashboard/safeguarding",description:"Concern logging and DSL triage",requiredRoles:["admin","headteacher","slt"],keywords:["safeguarding","concern","child protection","welfare","designated safeguarding"]},{id:"attendance-home",name:"Attendance",route:"/dashboard/attendance",description:"Registration and persistent absence tracking",requiredRoles:["admin","headteacher","slt","teacher"],keywords:["attendance","absence","register","persistent absence","late arrivals"]},{id:"send-home",name:"SEND",route:"/modules/send",description:"SEN register and EHCP management",requiredRoles:["admin","headteacher","slt","teacher"],keywords:["send","sen register","ehcp","special needs","inclusion","senco","special educational"]},{id:"intelligence-home",name:"School Intelligence",route:"/dashboard/intelligence",description:"Data analysis, cohort tracking, EEF research",requiredRoles:["admin","headteacher","slt"],keywords:["intelligence","cohort","attainment","progress data","eef","analysis","attainment gap","school data"]},{id:"risk-register",name:"Risk Register",route:"/dashboard/risk",description:"Enterprise risk management",requiredRoles:["admin","headteacher","slt","governor"],keywords:["risk register","risk management","heatmap","mitigation"]},{id:"meetings",name:"Meetings",route:"/dashboard/meetings",description:"Meeting companion with agendas and minutes",requiredRoles:["admin","headteacher","slt","teacher","governor"],keywords:["meeting","meetings","agenda","minutes","meeting companion"]},{id:"documents",name:"Documents",route:"/dashboard/documents",description:"Document production and templates",requiredRoles:["admin","headteacher","slt"],keywords:["document","documents","template","letter","newsletter","document production"]},{id:"surveys",name:"Surveys",route:"/dashboard/surveys",description:"Survey builder and analysis",requiredRoles:["admin","headteacher","slt"],keywords:["survey","surveys","questionnaire","feedback survey","poll"]},{id:"website-home",name:"Website Builder",route:"/dashboard/website",description:"School website design and publishing",requiredRoles:["admin","headteacher","slt"],keywords:["website","website builder","school website","publish website","homepage"]},{id:"tasks",name:"Tasks",route:"/dashboard/tasks",description:"Unified task management",requiredRoles:["admin","headteacher","slt","teacher","governor","caretaker"],keywords:["tasks","todo","to-do list","task list"]}];function Id(r){const e=r.toLowerCase();let t=null,n=0;for(const s of Dd){let i=0,o="";for(const a of s.keywords)if(e.includes(a)){const l=a.length;l>i&&(i=l,o=a)}e.includes(s.name.toLowerCase())&&(i=Math.max(i,s.name.length),o=s.name),i>n&&(n=i,t={target:s,score:i,reason:`Matched keyword "${o}"`})}return n>=4?t:null}function Ud(r,e){return e?r.requiredRoles.includes(e.toLowerCase()):!1}const Fd={schoolId:"demo",theme:"standard",position:"bottom-right",language:"en-GB",persona:"ed",features:{admissions:!0,policies:!0,calendar:!0,staffDirectory:!1,formFill:!0,voice:!0}},Dn=class Dn{constructor(e={}){W(this,"config");W(this,"container");W(this,"widget",null);W(this,"isOpen",!1);W(this,"isListening",!1);W(this,"isDragging",!1);W(this,"wasDragged",!1);W(this,"dragStartX",0);W(this,"dragStartY",0);W(this,"dragStartLeft",0);W(this,"dragStartTop",0);W(this,"launcherPosition",null);W(this,"particle3D",null);W(this,"launcherParticle3D",null);W(this,"dock",null);W(this,"chat",null);W(this,"voice",null);W(this,"ai",null);W(this,"apiClient",null);W(this,"formFiller",null);W(this,"proactive",null);W(this,"fishVoice",null);W(this,"geminiLive",null);W(this,"statusPill",null);W(this,"emojiTester",null);W(this,"messages",[]);W(this,"currentLanguage");W(this,"currentPersona");W(this,"currentTheme");W(this,"showKeyboard",!1);W(this,"toolContext",null);W(this,"mode","school");W(this,"pendingImage",null);W(this,"greetingShown",!1);const t=window.ED_CONFIG,n={...Fd,...e,...t?{geminiApiKey:t.geminiApiKey||e.geminiApiKey,openRouterApiKey:t.openRouterApiKey||e.openRouterApiKey,fishAudioApiKey:t.fishAudioApiKey||e.fishAudioApiKey,provider:t.provider||e.provider,enableAI:t.enableAI!==void 0?t.enableAI:e.enableAI,enableTTS:t.enableTTS!==void 0?t.enableTTS:e.enableTTS,ttsProvider:t.ttsProvider||e.ttsProvider,schoolId:t.schoolId||e.schoolId,language:t.language||e.language,persona:t.persona||e.persona}:{}};this.config=n,this.currentLanguage=ms(this.config.language),this.currentPersona=this.config.persona,this.currentTheme=this.config.theme;const s=this.config.mode;s?this.mode=s:this.config.isWebsiteEmbed?this.mode="website":this.config.organizationId?this.mode="school":this.mode="support";const i={website:"🌐 Website mode (public visitors - parents, students)",support:"🔓 Support mode (pre-login help)",school:"🏫 School mode (logged-in staff support)"};console.log(`[Ed] Mode: ${this.mode} - ${i[this.mode]}`),t&&(console.log("[Ed] Provider:",t.provider||"not set"),console.log("[Ed] TTS:",t.enableTTS?t.ttsProvider||"browser":"disabled"),console.log("[Ed] Keys present:",{openrouter:!!this.config.openRouterApiKey,gemini:!!this.config.geminiApiKey,fish:!!this.config.fishAudioApiKey})),this.container=document.createElement("div"),this.container.id="ed-widget-container",this.container.className=`ed-widget-container ed-position-${this.config.position}`,document.body.appendChild(this.container),this.initComponents(),this.render(),this.bindEvents(),this.config.features.formFill&&(this.formFiller=new Ad,this.checkForForms()),this.proactive=new wd(o=>{this.handleProactiveNudge(o)}),console.log("[Ed] Widget initialized",this.config)}initComponents(){const e=this.config.provider||"api",t=this.config.enableAI!==!1;if(this.config.enableTTS,this.config.ttsProvider,console.log(`[Ed] Mode: ${this.mode} (${this.mode==="support"?"pre-login support":"logged-in school support"})`),e==="api"||this.config.organizationId){const n=this.config.apiBaseUrl||"/api/ed/chat";this.apiClient=new Ed(n,this.config.organizationId,this.config.userId,this.config.accessToken),console.log("[Ed] ✅ API client initialized for",n)}if(t&&!this.apiClient)if(e==="gemini"&&this.config.geminiApiKey)try{this.ai=new Md(this.config.geminiApiKey),this.ai.listAvailableModels().then(n=>{n.length>0?console.log(`[Ed] ✅ Gemini API connected. Available models: ${n.join(", ")}`):console.warn("[Ed] ⚠️ Gemini API connected but no models found. Check your API key permissions.")}).catch(n=>{console.warn("[Ed] ⚠️ Could not list Gemini models:",n)})}catch(n){console.error("[Ed] ❌ Gemini client initialization failed:",n)}else e==="openrouter"&&this.config.openRouterApiKey?console.log("[Ed] ✅ OpenRouter provider selected (client initialization pending)"):e==="gemini"&&!this.config.geminiApiKey?console.debug("[Ed] Gemini provider selected but API key not set. AI features disabled."):e==="openrouter"&&!this.config.openRouterApiKey&&console.debug("[Ed] OpenRouter provider selected but API key not set. AI features disabled.");else this.apiClient||console.log("[Ed] AI disabled in configuration");console.log("[Ed] Fish Audio SKIPPED — using Gemini Live for voice"),this.config.features.voice&&(this.geminiLive=new Rd("/api/voice/config"),this.geminiLive.on({onStateChange:n=>{var s,i,o,a,l,c,d,u,f;console.log("[Ed] Gemini Live state:",n),n==="listening"?(this.isListening=!0,(s=this.dock)==null||s.setListening(!0),(i=this.statusPill)==null||i.setState("listening"),(o=this.particle3D)==null||o.morphTo("lightbulb")):n==="speaking"?(this.isListening=!1,(a=this.dock)==null||a.setListening(!1),(l=this.statusPill)==null||l.setState("ready"),(c=this.particle3D)==null||c.morphTo("speech")):(n==="idle"||n==="error")&&(this.isListening=!1,(d=this.dock)==null||d.setListening(!1),(u=this.statusPill)==null||u.setState("ready"),(f=this.particle3D)==null||f.morphTo("sphere"))},onTurnComplete:()=>{this.addMessage({id:`gemini-${crypto.randomUUID()}`,role:"assistant",content:"Ed responded via voice",timestamp:new Date})},onError:n=>{console.error("[Ed] Gemini Live error:",n),this.addMessage({id:crypto.randomUUID(),role:"system",content:`🎤 ${n}`,timestamp:new Date})}}),console.log("[Ed] ✅ Gemini Live voice initialized"),this.voice=new xd(this.currentLanguage.voiceLang),this.voice.onResult(n=>this.handleUserInput(n)),this.voice.onListeningChange(n=>{var s;this.isListening=n,(s=this.dock)==null||s.setListening(n)}))}render(){this.renderTriggerButton()}renderTriggerButton(){const e=document.createElement("div");e.id="launcher-group",e.innerHTML=`
      <div class="launcher-label">Ask Ed</div>
      <div id="launcher-btn" title="Open Assistant — drag to move">
        <div id="launcher-logo-container"></div>
      </div>
    `,e.querySelector("#launcher-btn").addEventListener("click",s=>{this.wasDragged||this.toggle(),this.wasDragged=!1});const n=document.getElementById("ed-sidebar-slot");n&&!this.hasSavedPosition()?(e.style.position="relative",e.style.bottom="auto",e.style.right="auto",n.appendChild(e)):(this.container.appendChild(e),this.restoreLauncherPosition(e)),this.makeDraggable(e),this.createParticle3DLogo()}hasSavedPosition(){try{const e=localStorage.getItem(Dn.POSITION_KEY);if(e){const t=JSON.parse(e);return t.x>=0&&t.y>=0}}catch{}return!1}restoreLauncherPosition(e){try{const t=localStorage.getItem(Dn.POSITION_KEY);if(t){const n=JSON.parse(t);n.x>=0&&n.x<=window.innerWidth-64&&n.y>=0&&n.y<=window.innerHeight-64&&(this.launcherPosition=n,this.applyLauncherPosition(e,n))}}catch{}}applyLauncherPosition(e,t){e.style.position="fixed",e.style.left=`${t.x}px`,e.style.top=`${t.y}px`,e.style.bottom="auto",e.style.right="auto",e.style.zIndex="999999"}makeDraggable(e){let t=null;const n=o=>{if(o.button!==0)return;this.isDragging=!1,this.wasDragged=!1,t=o.pointerId;const a=e.getBoundingClientRect();this.dragStartX=o.clientX,this.dragStartY=o.clientY,this.dragStartLeft=a.left,this.dragStartTop=a.top},s=o=>{if(o.pointerId!==t)return;const a=o.clientX-this.dragStartX,l=o.clientY-this.dragStartY;if(!this.isDragging&&Math.abs(a)<5&&Math.abs(l)<5)return;if(!this.isDragging){this.isDragging=!0;try{e.setPointerCapture(o.pointerId)}catch{}e.style.cursor="grabbing",e.style.transition="none"}const c=Math.max(0,Math.min(window.innerWidth-80,this.dragStartLeft+a)),d=Math.max(0,Math.min(window.innerHeight-80,this.dragStartTop+l));this.applyLauncherPosition(e,{x:c,y:d}),this.launcherPosition={x:c,y:d}},i=o=>{if(o.pointerId===t&&(t=null,e.hasPointerCapture(o.pointerId)&&e.releasePointerCapture(o.pointerId),e.style.cursor="",e.style.transition="",this.isDragging&&(this.wasDragged=!0,this.isDragging=!1,this.launcherPosition))){const a=window.innerWidth/2,l=this.launcherPosition.x<a?20:window.innerWidth-84;this.launcherPosition={x:l,y:this.launcherPosition.y},e.style.transition="left 0.2s ease, top 0.2s ease",this.applyLauncherPosition(e,this.launcherPosition);try{localStorage.setItem(Dn.POSITION_KEY,JSON.stringify(this.launcherPosition))}catch{}}};e.addEventListener("pointerdown",n),e.addEventListener("pointermove",s),e.addEventListener("pointerup",i),e.style.touchAction="none",e.style.userSelect="none"}createParticle3DLogo(){const e=document.getElementById("launcher-logo-container");if(!e)return;const t=document.createElement("div");t.id="launcher-particle3d-container",t.style.cssText=`
      width: 60px;
      height: 60px;
      position: relative;
      display: block;
    `,e.appendChild(t);try{this.launcherParticle3D=new ps(t),this.launcherParticle3D.start(),this.launcherParticle3D.setActive(!1),console.log("[Ed] Launcher Particle3D initialized")}catch(n){console.error("[Ed] Failed to initialize launcher Particle3D:",n),t.innerHTML='<div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>'}}renderWidget(){if(this.widget)return;this.widget=document.createElement("div"),this.widget.id="app-panel",this.widget.className=`theme-${this.currentTheme}`,this.widget.innerHTML=`
      <div class="status-pill" id="status-pill">Ready</div>
      
      <!-- Chat Container -->
      <div class="chat-container">
        <div id="chat-messages" class="chat-scroll scrollbar-hide"></div>
        <div class="input-bar">
          <input type="text" id="chat-input" placeholder="Ask Ed anything..." class="bg-transparent border-none text-white text-sm placeholder-slate-400 flex-grow outline-none" autocomplete="off">
          <input type="file" id="image-upload" accept="image/*" capture="environment" style="display:none">
          <button id="camera-btn" class="text-slate-400 hover:text-teal-400 transition-colors" title="Share a photo or screenshot">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
          </button>
          <button id="screen-btn" class="text-slate-400 hover:text-teal-400 transition-colors" title="Share your screen so Ed can see what you see">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </button>
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
    `,this.container.appendChild(this.widget),this.isOpen&&document.body.classList.add("widget-active");const e=this.widget.querySelector("#canvas-container");e?(console.log("[Ed] Initializing particle system in container:",e),e.style.display="block",e.style.visibility="visible",e.style.opacity="1",e.style.width="300px",e.style.height="300px",e.style.position="absolute",e.style.bottom="60px",e.style.right="0",e.style.zIndex="10",this.particle3D=new ps(e)):console.error("[Ed] Canvas container not found!");const t=this.widget.querySelector("#chat-messages");this.chat=new vd(t,d=>{d.includes("🇬🇧")||d.includes("English")?this.setLanguage("en-GB"):d.includes("🇵🇱")||d.includes("Polski")?this.setLanguage("pl"):d.includes("🇷🇴")||d.includes("Română")?this.setLanguage("ro"):d.includes("🇪🇸")||d.includes("Español")?this.setLanguage("es"):this.handleUserInput(d)},(d,u)=>{this.handleConfirmation(d,u)}),this.widget.querySelector("#status-pill")&&(this.statusPill=new Sd(this.widget));const s=this.widget.querySelector("#app-dock");this.dock=new _d(s,{onAction:d=>this.handleDockAction(d),onToolAction:d=>this.handleToolAction(d),onSettingChange:d=>this.setTheme(d),onLanguageChange:d=>this.setLanguage(d),onPersonaChange:d=>this.setPersona(d)});const i=this.widget.querySelector("#chat-input"),o=this.widget.querySelector("#send-btn");i==null||i.addEventListener("keydown",d=>{d.key==="Enter"&&i.value.trim()&&(this.handleUserInput(i.value.trim()),i.value="")}),o==null||o.addEventListener("click",()=>{i.value.trim()&&(this.handleUserInput(i.value.trim()),i.value="")});const a=this.widget.querySelector("#camera-btn"),l=this.widget.querySelector("#image-upload"),c=this.widget.querySelector("#screen-btn");a==null||a.addEventListener("click",()=>{l==null||l.click()}),l==null||l.addEventListener("change",()=>{var f;const d=(f=l.files)==null?void 0:f[0];if(!d)return;const u=new FileReader;u.onload=()=>{this.pendingImage=u.result,this.addMessage({id:crypto.randomUUID(),role:"user",content:`📷 Image attached: ${d.name}`,timestamp:new Date,language:this.currentLanguage.code}),i==null||i.focus(),i.placeholder="Describe what you need help with..."},u.readAsDataURL(d),l.value=""}),c==null||c.addEventListener("click",async()=>{this.apiClient&&(this.apiClient.isScreenSharing?(this.apiClient.stopScreenShare(),c.style.color="",c.title="Share your screen so Ed can see what you see",this.addMessage({id:crypto.randomUUID(),role:"assistant",content:"Screen sharing stopped. I can no longer see your screen.",timestamp:new Date,language:this.currentLanguage.code})):await this.apiClient.startScreenShare()?(c.style.color="#2dd4bf",c.title="Stop screen sharing",this.addMessage({id:crypto.randomUUID(),role:"assistant",content:"I can now see your screen. Just ask me anything and I'll look at what you're seeing. Click the screen icon again to stop sharing.",timestamp:new Date,language:this.currentLanguage.code})):this.addMessage({id:crypto.randomUUID(),role:"assistant",content:"Screen sharing wasn't started. You can use the camera button to upload a screenshot instead.",timestamp:new Date,language:this.currentLanguage.code}))})}bindEvents(){document.addEventListener("keydown",e=>{e.key==="Escape"&&this.isOpen&&this.close()})}showGreeting(){if(this.greetingShown)return;this.greetingShown=!0,Xn(this.currentPersona),!localStorage.getItem("ed-visited")&&localStorage.setItem("ed-visited","true");let t;const n=this.config.schoolName||"",s=this.config.schoolId||"",i=n||(s!=="demo"?s.replace(/[-_]/g," ").replace(/\b\w/g,a=>a.toUpperCase()):"");if(this.mode==="website")t=`Hi! ${i?`Welcome to ${i}!`:"Welcome!"} I'm Ed, the school assistant. How can I help you today?`;else if(this.mode==="support")t="Hi! I'm Ed. Need help logging in or finding something?";else{const a=this.config.userName,l=a?a.split(" ")[0]:"";t=`${l?`Hi ${l}!`:"Hi!"} I'm Ed, your school assistant. What can I help with?`}const o=crypto.randomUUID();this.addMessage({id:o,role:"assistant",content:t,timestamp:new Date,language:this.currentLanguage.code}),this.mode==="school"&&this.apiClient?this.fetchAndSpeakGreeting(o):this.config.features.voice&&this.fishVoice&&this.speakText(t)}async fetchAndSpeakGreeting(e){var s,i;try{const o={"Content-Type":"application/json"},a=this.config.accessToken;a&&(o.Authorization=`Bearer ${a}`);const l=await fetch(this.config.apiBaseUrl||"/api/ed/chat",{method:"POST",credentials:"include",headers:o,body:JSON.stringify({question:"hello",context:{url:window.location.href,hostname:window.location.hostname,title:document.title,visibleText:"",headings:[]},organizationId:this.config.organizationId})});if(l.ok){const c=await l.json();if(c.answer&&c.source==="ai"){(s=this.chat)==null||s.updateMessage(e,c.answer),this.speakText(c.answer);return}}}catch{}const t=(i=this.chat)==null?void 0:i.getMessages(),n=t==null?void 0:t.find(o=>o.id===e);n&&this.speakText(n.content)}speakText(e){var n;if((n=this.geminiLive)!=null&&n.isActive()||!this.fishVoice||!this.config.features.voice)return;const t=this.fishVoice.cleanTextForTTS(e,!1);!t||t.length<2||this.stopAllSpeechAsync().then(()=>{var s;(s=this.fishVoice)==null||s.speakAndPlay(t,this.currentPersona,this.currentLanguage.code).catch(i=>console.warn("[Ed] TTS error:",i.message))})}getLocalizedGreeting(){const e=Xn(this.currentPersona);return this.currentLanguage.code==="en-GB"?e.greeting:this.currentLanguage.greeting}async handleUserInput(e){var f,m,g,_,p,h,T,x,w,D,C,A,$,y,E,k,Y,ie,R,O,z,X,V,H,K,J,le,G,q,ae,pe,fe,Ae,we,xe;const t=e.toLowerCase().trim();if(t==="yes"||t==="no"||t==="no thanks"||t==="yeah"||t==="nah"){const he=this.messages.filter(L=>L.confirmation&&!L.confirmation.resolved).pop();if(he!=null&&he.confirmation){const L=t==="yes"||t==="yeah"?"confirmed":"declined";this.addMessage({id:crypto.randomUUID(),role:"user",content:e,timestamp:new Date,language:this.currentLanguage.code}),he.confirmation.resolved=!0,he.confirmation.choice=L,this.handleConfirmation(he.confirmation.id,L);return}}const n=this.detectLanguage(e);if(n&&n.code!==this.currentLanguage.code&&this.setLanguage(n.code,!0),(f=this.formFiller)!=null&&f.isActive){const he=this.handleFormInput(e);if(he){this.addMessage({id:crypto.randomUUID(),role:"user",content:e,timestamp:new Date,language:this.currentLanguage.code}),this.addMessage({id:crypto.randomUUID(),role:"assistant",content:he,timestamp:new Date,language:this.currentLanguage.code}),this.speakResponse(he);return}}const s={id:crypto.randomUUID(),role:"user",content:e,timestamp:new Date,language:this.currentLanguage.code};this.currentLanguage.code!=="en-GB"&&(s.translation=`[Translated to English]: ${e}`),this.addMessage(s),(m=this.proactive)==null||m.start();const i=e.toLowerCase();i.includes("excited")||i.includes("wow")||i.includes("yay")||i.includes("fantastic")||i.includes("amazing")||i.includes("brilliant")||i.includes("can't wait")||i.includes("looking forward")||i.includes("thrilled")||i.includes("delighted")||i.includes("celebration")||i.includes("celebrate")||i.includes("party")||i.includes("special")||i.includes("great news")||i.includes("wonderful news")?(g=this.particle3D)==null||g.morphTo("excited"):i.includes("fireworks")||i.includes("🎆")?(_=this.particle3D)==null||_.morphTo("fireworks"):i.includes("confetti")||i.includes("🎊")?(p=this.particle3D)==null||p.morphTo("confetti"):i.includes("trophy")||i.includes("achievement")||i.includes("award")||i.includes("won")||i.includes("victory")||i.includes("champion")||i.includes("first place")||i.includes("top")||i.includes("best")||i.includes("excellent work")||i.includes("well done")||i.includes("congratulations")||i.includes("accomplishment")||i.includes("milestone")||i.includes("record")||i.includes("result")?(h=this.particle3D)==null||h.morphTo("trophy"):i.includes("information")||i.includes("info")||i.includes("details")||i.includes("tell me")||i.includes("explain")||i.includes("about")||i.includes("read")||i.includes("learn")||i.includes("know")||i.includes("understand")||i.includes("what is")||i.includes("what are")||i.includes("describe")||i.includes("definition")||i.includes("meaning")||i.includes("guide")||i.includes("manual")||i.includes("handbook")||i.includes("policy")||i.includes("procedure")||i.includes("rule")||i.includes("regulation")?(T=this.particle3D)==null||T.morphTo("book"):i.includes("time")||i.includes("when")||i.includes("schedule")||i.includes("timetable")||i.includes("hours")||i.includes("opening")||i.includes("closing")||i.includes("deadline")||i.includes("date")||i.includes("appointment")||i.includes("meeting")||i.includes("event")||i.includes("term dates")||i.includes("holiday")||i.includes("break")||i.includes("half term")||i.includes("start")||i.includes("finish")||i.includes("end")||i.includes("duration")||i.includes("how long")||i.includes("what time")?(x=this.particle3D)==null||x.morphTo("clock"):i.includes("important")||i.includes("urgent")||i.includes("critical")||i.includes("required")||i.includes("must")||i.includes("need to")||i.includes("essential")||i.includes("mandatory")||i.includes("notice")||i.includes("alert")||i.includes("attention")||i.includes("warning")||i.includes("caution")||i.includes("deadline approaching")||i.includes("late")||i.includes("overdue")||i.includes("missing")||i.includes("required field")?(w=this.particle3D)==null||w.morphTo("warning"):i.includes("ask")||i.includes("question")||i.includes("query")||i.includes("unsure")||i.includes("unclear")||i.includes("confused")||i.includes("don't understand")||i.includes("what do you mean")||i.includes("can you clarify")||i.includes("explain again")||i.includes("repeat")||i.includes("sorry")||i.includes("pardon")||i.includes("excuse me")||i.includes("what")||i.includes("how")||i.includes("why")||i.includes("where")||i.includes("who")||i.includes("which")?(D=this.particle3D)==null||D.morphTo("question"):i.includes("calendar")||i.includes("event")||i.includes("date")||i.includes("schedule")||i.includes("term")||i.includes("holiday")||i.includes("break")||i.includes("half term")||i.includes("inset day")||i.includes("open day")||i.includes("tour")||i.includes("visit")||i.includes("meeting")||i.includes("appointment")||i.includes("deadline")||i.includes("when is")||i.includes("what date")||i.includes("school calendar")||i.includes("academic year")||i.includes("term dates")?(C=this.particle3D)==null||C.morphTo("calendar"):i.includes("search")||i.includes("find")||i.includes("look for")||i.includes("locate")||i.includes("where is")||i.includes("where can i find")||i.includes("show me")||i.includes("find me")||i.includes("look up")||i.includes("search for")||i.includes("discover")||i.includes("browse")?(A=this.particle3D)==null||A.morphTo("search"):i.includes("phone")||i.includes("call")||i.includes("telephone")||i.includes("contact")||i.includes("number")||i.includes("ring")||i.includes("speak to")||i.includes("talk to")||i.includes("reach")||i.includes("get in touch")||i.includes("contact details")||i.includes("phone number")||i.includes("mobile")||i.includes("landline")||i.includes("call me")||i.includes("ring me")?($=this.particle3D)==null||$.morphTo("phone"):i.includes("address")||i.includes("location")||i.includes("where")||i.includes("find")||i.includes("directions")||i.includes("map")||i.includes("postcode")||i.includes("post code")||i.includes("street")||i.includes("road")||i.includes("building")||i.includes("site")||i.includes("campus")||i.includes("how to get")||i.includes("directions to")||i.includes("where is the school")||i.includes("address of")?(y=this.particle3D)==null||y.morphTo("location"):i.includes("form")||i.includes("fill")||i.includes("write")||i.includes("type")||i.includes("enter")||i.includes("input")||i.includes("complete")||i.includes("application")||i.includes("submit")||i.includes("document")||i.includes("sign")||i.includes("paperwork")?(E=this.particle3D)==null||E.morphTo("pencil"):i.includes("help")||i.includes("how")||i.includes("what")||i.includes("why")||i.includes("explain")||i.includes("understand")||i.includes("idea")||i.includes("suggest")||i.includes("advice")||i.includes("guidance")||i.includes("tip")||i.includes("hint")?(k=this.particle3D)==null||k.morphTo("lightbulb"):i.includes("thank")||i.includes("thanks")||i.includes("appreciate")||i.includes("grateful")||i.includes("love")||i.includes("lovely")||i.includes("wonderful")||i.includes("kind")||i.includes("caring")||i.includes("sweet")?(Y=this.particle3D)==null||Y.morphTo("heart"):i.includes("yes")||i.includes("please")||i.includes("sure")||i.includes("okay")||i.includes("ok")||i.includes("agree")||i.includes("confirm")||i.includes("accept")||i.includes("correct")||i.includes("right")||i.includes("exactly")?(ie=this.particle3D)==null||ie.morphTo("thumbsup"):i.includes("great")||i.includes("perfect")||i.includes("excellent")||i.includes("amazing")||i.includes("fantastic")||i.includes("brilliant")||i.includes("outstanding")||i.includes("superb")||i.includes("wonderful")||i.includes("awesome")?(R=this.particle3D)==null||R.morphTo("star"):i.includes("👍")||i.includes("✓")||i.includes("ok")||i.includes("done")||i.includes("complete")||i.includes("finished")||i.includes("ready")||i.includes("confirmed")||i.includes("submitted")||i.includes("success")||i.includes("accomplished")||i.includes("achieved")?(O=this.particle3D)==null||O.morphTo("checkmark"):i.includes("happy")||i.includes("glad")||i.includes("pleased")||i.includes("smile")||i.includes("joy")||i.includes("cheerful")||i.includes("delighted")||i.includes("excited")||i.includes("thrilled")||i.includes("wonderful")||i.includes("😊")||i.includes(":)")?(z=this.particle3D)==null||z.morphTo("smiley"):i.includes("let me think")||i.includes("considering")||i.includes("hmm")||i.includes("um")||i.includes("well")||i.includes("actually")||i.includes("perhaps")||i.includes("maybe")||i.includes("might")||i.includes("could")||i.includes("possibly")||i.includes("not sure")||i.includes("let me see")||i.includes("give me a moment")||i.includes("thinking about")||i.includes("considering")?(X=this.particle3D)==null||X.morphTo("thinking"):i.includes("confused")||i.includes("don't understand")||i.includes("unclear")||i.includes("lost")||i.includes("not sure")||i.includes("puzzled")||i.includes("bewildered")||i.includes("what")||i.includes("huh")||i.includes("sorry")||i.includes("pardon")||i.includes("excuse me")||i.includes("repeat")||i.includes("say again")||i.includes("what do you mean")||i.includes("i don't get it")?(V=this.particle3D)==null||V.morphTo("confused"):i.includes("error")||i.includes("problem")||i.includes("issue")||i.includes("broken")||i.includes("not working")||i.includes("failed")||i.includes("mistake")||i.includes("wrong")||i.includes("incorrect")||i.includes("sorry there was an error")||i.includes("something went wrong")||i.includes("unable to")||i.includes("can't")||i.includes("cannot")?(H=this.particle3D)==null||H.morphTo("error"):i.includes("message")||i.includes("chat")||i.includes("talk")||i.includes("speak")||i.includes("conversation")||i.includes("discuss")||i.includes("tell me")||i.includes("say")||i.includes("mention")||i.includes("communicate")||i.includes("dialogue")||i.includes("speak to")||i.includes("talk to")||i.includes("have a chat")?(K=this.particle3D)==null||K.morphTo("speech"):i.includes("document")||i.includes("form")||i.includes("file")||i.includes("pdf")||i.includes("download")||i.includes("print")||i.includes("application")||i.includes("letter")||i.includes("report")||i.includes("certificate")||i.includes("transcript")||i.includes("record")||i.includes("paperwork")||i.includes("document needed")||i.includes("required document")?(J=this.particle3D)==null||J.morphTo("document"):i.includes("calculate")||i.includes("math")||i.includes("maths")||i.includes("number")||i.includes("count")||i.includes("add")||i.includes("subtract")||i.includes("multiply")||i.includes("divide")||i.includes("total")||i.includes("sum")||i.includes("cost")||i.includes("price")||i.includes("fee")||i.includes("payment")||i.includes("amount")||i.includes("calculate")||i.includes("work out")||i.includes("figure out")?(le=this.particle3D)==null||le.morphTo("calculator"):i.includes("notification")||i.includes("alert")||i.includes("reminder")||i.includes("notify")||i.includes("inform")||i.includes("tell me when")||i.includes("let me know")||i.includes("alert me")||i.includes("remind me")||i.includes("notification")||i.includes("announcement")||i.includes("update")||i.includes("news")?(G=this.particle3D)==null||G.morphTo("bell"):i.includes("graduation")||i.includes("graduate")||i.includes("leaving")||i.includes("year 6")||i.includes("year 11")||i.includes("year 13")||i.includes("a-levels")||i.includes("gcse")||i.includes("results")||i.includes("exam results")||i.includes("certificate")||i.includes("diploma")||i.includes("qualification")||i.includes("finish school")||i.includes("move on")?(q=this.particle3D)==null||q.morphTo("graduation"):(ae=this.particle3D)==null||ae.morphTo("lightbulb");const o=((pe=this.chat)==null?void 0:pe.showTyping())||"";if(!this.pendingImage&&((fe=this.apiClient)!=null&&fe.isScreenSharing)){const he=this.apiClient.captureFrame();he&&(this.pendingImage=he)}if(!this.pendingImage&&this.apiClient&&["what's on my screen","look at this","i can see an error","what am i looking at","help with this page","what does this mean"].some(L=>i.includes(L))){const L=await this.apiClient.captureScreen();L&&(this.pendingImage=L)}const a=this.pendingImage;this.pendingImage=null;const l=(Ae=this.widget)==null?void 0:Ae.querySelector("#chat-input");l&&(l.placeholder="Ask Ed anything...");const c=await this.getAIResponse(e,a||void 0);(we=this.chat)==null||we.hideTyping(o),setTimeout(()=>{var he;return(he=this.particle3D)==null?void 0:he.morphTo("sphere")},500);const d={id:crypto.randomUUID(),role:"assistant",content:c,timestamp:new Date,language:this.currentLanguage.code};this.currentLanguage.code!=="en-GB"&&(d.quickReplies=["English 🇬🇧"]),this.addMessage(d),this.handleSmartNavigation(e);const u=c.toLowerCase();u.includes("great!")||u.includes("perfect!")?setTimeout(()=>{var he;(he=this.particle3D)==null||he.morphTo("thumbsup"),setTimeout(()=>{var L;return(L=this.particle3D)==null?void 0:L.morphTo("sphere")},2e3)},1e3):(u.includes("happy to help")||u.includes("glad"))&&setTimeout(()=>{var he;(he=this.particle3D)==null||he.morphTo("smiley"),setTimeout(()=>{var L;return(L=this.particle3D)==null?void 0:L.morphTo("sphere")},2e3)},1e3),this.config.features.voice&&!((xe=this.geminiLive)!=null&&xe.isActive())&&this.stopAllSpeechAsync().then(()=>{if(this.fishVoice){const he=this.cleanTextForDisplay(c);console.log("[Ed] Using Fish Audio for response"),this.fishVoice.speakAndPlay(he,this.currentPersona,this.currentLanguage.code).then(()=>{console.log("[Ed] Fish Audio playback completed")}).catch(L=>{console.error("[Ed] Fish Audio error:",L),console.error("[Ed] Error details:",L.message),console.warn("[Ed] Skipping browser TTS fallback to prevent dual audio")})}else this.config.disableBrowserTTS?console.warn("[Ed] Fish Audio not available and browser TTS disabled - no voice output"):(console.warn("[Ed] Fish Audio not available, using browser TTS (emergency fallback)"),this.speak(c))})}handleFormInput(e){var i,o,a;if(!this.formFiller)return null;const t=e.toLowerCase().trim();if(["stop","cancel","quit","exit","nevermind","never mind"].some(l=>t===l))return this.formFiller.stop(),(i=this.particle3D)==null||i.morphTo("sphere"),"No problem, I've stopped filling the form. Everything you already typed is still there.";if(t==="back"||t==="go back"||t==="previous"){const l=this.formFiller.previousField();return l?`Going back to ${l.label}. What should it be?`:"We're already at the first field."}const n=t.match(/(?:change|edit|fix|update)\s+(?:field\s*)?(\d+|.+)/);if(n){const l=this.formFiller.getSummary(),c=n[1],d=parseInt(c);let u=-1;if(!isNaN(d)&&d>=1&&d<=l.length?u=d-1:u=l.findIndex(f=>f.label.toLowerCase().includes(c.toLowerCase())),u>=0){const f=this.formFiller.goToField(u);if(f)return`Editing ${f.label} (currently: "${l[u].value}"). What should it be?`}return"I couldn't find that field. Say 'change field 1' or 'change email' to edit a specific field."}if(["review","summary","show","check","list"].some(l=>t.includes(l)))return`Here's what I've filled:

${this.formFiller.getSummary().map((d,u)=>`${u+1}. ${d.label}: ${d.value}`).join(`
`)}

Say "change [field]", "submit", or "cancel".`;if(["submit","send","done","finish","yes submit","go ahead"].some(l=>t.includes(l))){const c=this.formFiller.getSummary().filter(d=>d.value==="(empty)");return c.length>0?`Hold on — ${c.length} field${c.length>1?"s are":" is"} still empty: ${c.map(d=>d.label).join(", ")}.

Would you like to fill those first, or submit as is?`:(this.formFiller.submitForm().then(d=>{var u;(u=this.particle3D)==null||u.morphTo("checkmark"),setTimeout(()=>{var f;return(f=this.particle3D)==null?void 0:f.morphTo("sphere")},3e3),d&&this.addMessage({id:`msg-${Date.now()}`,role:"assistant",content:"Form submitted successfully! Is there anything else I can help with?",timestamp:new Date})}),"I've prepared a summary for you to review. Please confirm or cancel in the overlay.")}if(t.includes("as is")||t.includes("anyway")||t.includes("submit it"))return this.formFiller.submitForm().then(l=>{var c;(c=this.particle3D)==null||c.morphTo("checkmark"),setTimeout(()=>{var d;return(d=this.particle3D)==null?void 0:d.morphTo("sphere")},3e3),l&&this.addMessage({id:`msg-${Date.now()}`,role:"assistant",content:"Form submitted! Anything else?",timestamp:new Date})}),"Please confirm the submission in the overlay.";const s=this.formFiller.getCurrentField();if(s){if(!this.formFiller.fillFieldByVoice(e)){const f=this.getFieldHint(s);return`I didn't catch that for ${s.label}. Could you try again?${f}`}const c=this.formFiller.nextField();if(c){const f=this.formFiller.getProgress(),m=c.required?" (required)":"",g=this.getFieldHint(c);return(o=this.particle3D)==null||o.morphTo("pencil"),`Got it (${f.current}/${f.total}). ${c.label}${m}${g}`}const u=this.formFiller.getSummary().map((f,m)=>`${m+1}. ${f.label}: ${f.value}`);return(a=this.particle3D)==null||a.morphTo("checkmark"),`All done! Here's what I've filled:

${u.join(`
`)}

Say "submit", "change [field]", or "cancel".`}return null}getFieldHint(e){if(e.type==="dropdown"&&e.element instanceof HTMLSelectElement){const t=Array.from(e.element.options).filter(n=>n.value&&n.value!=="").map(n=>n.text).slice(0,5);if(t.length>0){const n=e.element.options.length-t.length;return`
Options: ${t.join(", ")}${n>0?`, +${n} more`:""}`}}return e.type==="checkbox"?`
Say "yes" or "no".`:e.type==="date"?`
E.g. 15/06/2024`:""}speakResponse(e){this.speakText(e)}async getAIResponse(e,t){var o,a;const n=e.toLowerCase();if(["fill","form","help me fill","complete this","fill this in","fill out","fill in","help with this form","i need to fill"].some(l=>n.includes(l))){const l=(o=this.formFiller)==null?void 0:o.detectForms();if(l&&l.length>0&&this.formFiller){const c=l[0],d=this.formFiller.startFilling(c.element);if(d){(a=this.particle3D)==null||a.morphTo("pencil");const u=this.formFiller.getProgress(),f=d.required?" (required)":"",m=this.getFieldHint(d);return`Found "${c.title}" with ${u.total} fields. Let's go through them.

${d.label}${f}${m}`}}return this.mode==="support"?"I don't see any forms on this page. If you're having trouble with the login form, I can help troubleshoot.":"I don't see any forms on this page. Would you like me to help you find something?"}if(this.apiClient)try{const l=this.messages.filter(c=>c.role==="user"||c.role==="assistant").slice(-10).map(c=>({role:c.role,content:c.content}));return await this.apiClient.chat(e,void 0,t,l)}catch(l){console.error("[Ed] API client error:",l)}if(this.ai)try{const l=Xn(this.currentPersona);let c;try{const d=Pd.scan();c=`Current page: ${d.title}
URL: ${window.location.href}
Page type: ${d.pageType}
Has forms: ${d.forms>0?"Yes":"No"}
Key headings: ${d.headings.slice(0,5).join(", ")}
Summary: ${d.mainContent.substring(0,300)}`}catch(d){console.debug("[Ed] Could not extract page context:",d),c=`Current page: ${document.title}
URL: ${window.location.href}`}return await this.ai.chat(e,{persona:l,language:this.currentLanguage,schoolId:this.config.schoolId,toolContext:this.toolContext,pageContext:c})}catch(l){console.error("[Ed] AI error:",l)}if(this.mode==="website"){const l=["I'm happy to help with information about our school! What would you like to know?","I can help with admissions, term dates, contact details, and general school information. What do you need?","Welcome! How can I help you today? I can share information about our school."];return l[Math.floor(Math.random()*l.length)]}if(this.mode==="support"){const l=["I'm here to help with login issues! What problem are you having?","I can help you log in, reset your password, or troubleshoot access issues. What do you need?","For help with Schoolgle, I can assist with account access. What's the issue?"];return l[Math.floor(Math.random()*l.length)]}const i=["I'm here to help with work tasks! What can I help you with?","I can help with school improvement tasks, compliance, HR questions, and more. What do you need?","I'm your school support assistant. What work task can I help with?"];return i[Math.floor(Math.random()*i.length)]}handleProactiveNudge(e){var t;if(!this.isOpen){console.log("[Ed] Proactive nudge suppressed (closed):",e);return}this.addMessage({id:crypto.randomUUID(),role:"assistant",content:e,timestamp:new Date,language:this.currentLanguage.code}),this.config.features.voice&&this.stopAllSpeechAsync().then(()=>{if(this.fishVoice){const n=this.cleanTextForDisplay(e);this.fishVoice.speakAndPlay(n,this.currentPersona,this.currentLanguage.code).catch(s=>{console.error("[Ed] Fish Audio error in proactive nudge:",s),console.warn("[Ed] Skipping browser TTS fallback to prevent dual audio")})}else this.config.disableBrowserTTS||this.speak(e)}),(t=this.particle3D)==null||t.morphTo("lightbulb"),setTimeout(()=>{var n;return(n=this.particle3D)==null?void 0:n.morphTo("sphere")},2e3)}cleanTextForDisplay(e){return e.replace(/\([^)]+\)/g,"").replace(/\*\*(.+?)\*\*/g,"$1").replace(/\*(.+?)\*/g,"$1").replace(/__(.+?)__/g,"$1").replace(/_(.+?)_/g,"$1").replace(/^#{1,6}\s+/gm,"").replace(/^[-*]\s+/gm,"").replace(/[\u{1F300}-\u{1F9FF}]/gu,"").replace(/[\u{2600}-\u{26FF}]/gu,"").replace(/[\u{2700}-\u{27BF}]/gu,"").replace(/\b[A-Z]{2}\s*🇵🇱|🇷🇴|🇬🇧|🇺🇸\b/gi,"").replace(/Polski\s+PL|Română\s+RO|English\s+EN/gi,"").replace(/\s+/g," ").trim()}handleSmartNavigation(e){const t=Id(e);if(!t)return;const{target:n}=t,s=this.config.userRole;if(!Ud(n,s)){this.addMessage({id:crypto.randomUUID(),role:"assistant",content:`I can see the **${n.name}** might be relevant, but you don't currently have access to that area. You may want to speak to your headteacher or admin about permissions.`,timestamp:new Date});return}this.addMessage({id:crypto.randomUUID(),role:"assistant",content:`I can see information about that. Would you like me to take you to the **${n.name}**? ${n.description}.`,timestamp:new Date,confirmation:{id:`nav-${crypto.randomUUID()}`,description:`Navigate to ${n.name}`,confirmLabel:"Yes, take me there",declineLabel:"No thanks",action:`navigate:${n.route}`}})}handleConfirmation(e,t){if(this.addMessage({id:crypto.randomUUID(),role:"system",content:t==="confirmed"?"✅ Action confirmed":"❌ Action declined",timestamp:new Date}),t!=="confirmed")return;const n=this.messages.find(i=>{var o;return((o=i.confirmation)==null?void 0:o.id)===e});if(!(n!=null&&n.confirmation))return;const s=n.confirmation.action;if(s.startsWith("navigate:")){const i=s.replace("navigate:","");setTimeout(()=>{window.location.href=i},500)}}addMessage(e){var t;e.content&&e.role!=="system"&&(e.content=this.cleanTextForDisplay(e.content)),this.messages.push(e),(t=this.chat)==null||t.addMessage(e)}speak(e){var i,o;if(!this.config.features.voice||(i=this.geminiLive)!=null&&i.isActive())return;if(this.config.disableBrowserTTS){console.warn("[Ed] ⚠️ Browser TTS disabled - skipping fallback");return}if(this.fishVoice){console.warn("[Ed] ⚠️ Browser TTS called but Fish Audio is available - skipping to prevent dual audio");return}this.stopAllSpeech();const t=((o=this.fishVoice)==null?void 0:o.cleanTextForTTS(e,!1))||e.replace(/\([^)]+\)/g,"").replace(/[\u{1F300}-\u{1F9FF}]/gu,"").replace(/[\u{2600}-\u{26FF}]/gu,"").replace(/[\u{2700}-\u{27BF}]/gu,"").replace(/\b[A-Z]{2}\s*🇵🇱|🇷🇴|🇬🇧|🇺🇸\b/gi,"").replace(/Polski\s+PL|Română\s+RO|English\s+EN/gi,"").replace(/\s+/g," ").trim();if(!t)return;const n=Xn(this.currentPersona),s=new SpeechSynthesisUtterance(t);s.lang=this.currentLanguage.voiceLang,s.pitch=n.voicePitch,s.rate=n.voiceRate,speechSynthesis.speak(s)}stopAllSpeech(){var e;speechSynthesis.speaking&&speechSynthesis.cancel(),(e=this.fishVoice)==null||e.stop().catch(()=>{})}async stopAllSpeechAsync(){speechSynthesis.speaking&&(speechSynthesis.cancel(),await new Promise(e=>setTimeout(e,50))),this.fishVoice&&(await this.fishVoice.stop(),await new Promise(e=>setTimeout(e,50)))}handleDockAction(e){switch(e){case"microphone":this.toggleListening();break;case"keyboard":this.toggleKeyboard();break;case"language":this.showLanguageSelector();break;case"persona":this.cyclePersona();break;case"settings":this.showSettings();break;case"magic-tools":this.showMagicTools();break;case"close":this.close();break}}toggleListening(){var e,t,n,s,i,o,a,l,c;if(this.geminiLive){if(this.geminiLive.isActive()){this.geminiLive.stop();return}const d=(e=this.widget)==null?void 0:e.querySelector(".chat-container");(d==null?void 0:d.classList.contains("chat-hidden"))&&(d==null||d.classList.remove("chat-hidden"),this.showKeyboard=!1),this.stopAllSpeech(),this.geminiLive.start();return}if(!this.voice){const d=(t=this.widget)==null?void 0:t.querySelector(".chat-container"),u=d==null?void 0:d.classList.contains("chat-hidden");u&&(d==null||d.classList.remove("chat-hidden")),this.addMessage({id:crypto.randomUUID(),role:"system",content:"🎤 Voice input not available. Please use text input instead.",timestamp:new Date}),u&&setTimeout(()=>d==null?void 0:d.classList.add("chat-hidden"),3e3);return}if(this.isListening)this.voice.stop(),this.isListening=!1,(n=this.dock)==null||n.setListening(!1),(s=this.statusPill)==null||s.setState("ready"),(i=this.particle3D)==null||i.morphTo("sphere");else{const d=(o=this.widget)==null?void 0:o.querySelector(".chat-container");(d==null?void 0:d.classList.contains("chat-hidden"))&&(d==null||d.classList.remove("chat-hidden"),this.showKeyboard=!1),navigator.mediaDevices&&navigator.mediaDevices.getUserMedia?navigator.mediaDevices.getUserMedia({audio:!0}).then(()=>{var f,m,g,_;(f=this.voice)==null||f.start(),this.isListening=!0,(m=this.dock)==null||m.setListening(!0),(g=this.statusPill)==null||g.setState("listening"),(_=this.particle3D)==null||_.morphTo("lightbulb")}).catch(f=>{console.error("[Ed] Microphone permission denied:",f),this.addMessage({id:crypto.randomUUID(),role:"system",content:"🎤 Microphone access denied. Please enable microphone permissions in your browser settings.",timestamp:new Date})}):(this.voice.start(),this.isListening=!0,(a=this.dock)==null||a.setListening(!0),(l=this.statusPill)==null||l.setState("listening"),(c=this.particle3D)==null||c.morphTo("lightbulb"))}}toggleKeyboard(){var t,n,s,i,o;this.showKeyboard=!this.showKeyboard;const e=(t=this.widget)==null?void 0:t.querySelector(".chat-container");if(e)if(this.showKeyboard){e.classList.add("chat-hidden");const a=(n=this.widget)==null?void 0:n.querySelector("#canvas-container");a&&(a.style.opacity="1",a.style.visibility="visible",a.style.zIndex="20"),(s=this.statusPill)==null||s.setState("ready"),(i=this.statusPill)==null||i.show()}else{e.classList.remove("chat-hidden");const a=(o=this.widget)==null?void 0:o.querySelector("#canvas-container");a&&(a.style.zIndex="10")}console.log("[Ed] Chat toggled:",this.showKeyboard?"hidden (avatar visible)":"visible")}detectLanguage(e){const t=e.toLowerCase().trim(),n=[{code:"es",patterns:[/^hola/i,/^buenos días/i,/^buenas tardes/i,/^buenas noches/i,/^adiós/i]},{code:"fr",patterns:[/^bonjour/i,/^bonsoir/i,/^salut/i,/^au revoir/i]},{code:"pl",patterns:[/^cześć/i,/^dzień dobry/i,/^dobry wieczór/i,/^do widzenia/i]},{code:"ro",patterns:[/^bună/i,/^salut/i,/^la revedere/i]},{code:"pt",patterns:[/^olá/i,/^bom dia/i,/^boa tarde/i,/^tchau/i]},{code:"zh",patterns:[/^你好/i,/^再见/i]},{code:"ar",patterns:[/^مرحبا/i,/^السلام عليكم/i]},{code:"ur",patterns:[/^ہیلو/i,/^السلام علیکم/i]},{code:"bn",patterns:[/^হ্যালো/i,/^নমস্কার/i]},{code:"so",patterns:[/^salaan/i,/^nabad/i]},{code:"pa",patterns:[/^ਸਤ ਸ੍ਰੀ ਅਕਾਲ/i,/^ਨਮਸਕਾਰ/i]}];for(const s of n)if(s.patterns.some(i=>i.test(t)))return ms(s.code);return null}showLanguageSelector(){const t=(qn.findIndex(n=>n.code===this.currentLanguage.code)+1)%qn.length;this.setLanguage(qn[t].code)}setLanguage(e,t=!1){var n,s;if(this.currentLanguage=ms(e),(n=this.voice)==null||n.setLanguage(this.currentLanguage.voiceLang),(s=this.particle3D)==null||s.morphToFlag(this.currentLanguage.flagColors,this.currentLanguage.code),!t){const i=`${this.currentLanguage.nativeName} ${this.currentLanguage.flag}`;this.addMessage({id:crypto.randomUUID(),role:"system",content:i,timestamp:new Date})}this.config.features.voice&&this.stopAllSpeechAsync().then(()=>{if(this.fishVoice){const i=this.cleanTextForDisplay(this.currentLanguage.greeting);this.fishVoice.speakAndPlay(i,this.currentPersona,this.currentLanguage.code).catch(o=>{console.error("[Ed] Fish Audio error in setLanguage:",o),console.warn("[Ed] Skipping browser TTS fallback to prevent dual audio")})}else this.config.disableBrowserTTS||this.speak(this.currentLanguage.greeting)}),setTimeout(()=>{var i;(i=this.particle3D)==null||i.morphTo("sphere")},2e3)}cyclePersona(){const e=["ed","edwina"],t=["santa","elf","headteacher"],n=[...e,...t],i=(n.indexOf(this.currentPersona)+1)%n.length;this.setPersona(n[i])}setPersona(e){this.currentPersona=e;const t=Xn(e);this.particle3D&&typeof this.particle3D.setColor=="function"&&this.particle3D.setColor(t.color),this.addMessage({id:crypto.randomUUID(),role:"system",content:`${t.icon} ${t.name} is here to help!`,timestamp:new Date})}showSettings(){const e=["standard","warm","cool","contrast"],n=(e.indexOf(this.currentTheme)+1)%e.length;this.setTheme(e[n])}setTheme(e){var t,n;this.currentTheme=e,(t=this.widget)==null||t.classList.remove("theme-standard","theme-warm","theme-cool","theme-contrast"),(n=this.widget)==null||n.classList.add(`theme-${e}`)}updateAuth(e,t,n){this.apiClient&&(e!==void 0&&this.apiClient.setAccessToken(e),(t||n)&&this.apiClient.setContext(t||"",n||"")),t&&this.mode!=="school"&&(this.mode="school")}setToolContext(e){var t,n;if(this.toolContext=e,e){const i={Finance:"calculator",Teaching:"book",SEND:"heart",Compliance:"document",HR:"phone",Data:"search",Admin:"calendar",Estates:"location"}[e.category]||"lightbulb";(t=this.particle3D)==null||t.morphTo(i),this.addMessage({id:crypto.randomUUID(),role:"assistant",content:`I see you're using ${e.name}. I can help you with ${e.expertise.slice(0,3).join(", ")}. What would you like to know?`,timestamp:new Date}),console.log("[Ed] Tool context set:",e.name,"→",i)}else(n=this.particle3D)==null||n.morphTo("sphere"),console.log("[Ed] Tool context cleared")}getToolContext(){return this.toolContext}showMagicTools(){var e;(e=this.particle3D)==null||e.morphTo("pencil"),this.addMessage({id:crypto.randomUUID(),role:"assistant",content:"✨ Magic Tools activated! I can help you fill forms, summarize pages, or create quizzes. What would you like?",timestamp:new Date})}handleToolAction(e){var t,n,s;switch(e){case"form-fill":(t=this.particle3D)==null||t.morphTo("pencil"),this.addMessage({id:crypto.randomUUID(),role:"assistant",content:"📝 Form Fill mode activated! I can help you fill out forms on this page. Just tell me what information you'd like to enter.",timestamp:new Date});break;case"page-scan":(n=this.particle3D)==null||n.morphTo("lightbulb"),this.addMessage({id:crypto.randomUUID(),role:"assistant",content:"🔍 Page Scan activated! I'm analyzing this page to help you understand its content.",timestamp:new Date});break;case"calendar":(s=this.particle3D)==null||s.morphTo("star"),this.addMessage({id:crypto.randomUUID(),role:"assistant",content:"📅 Calendar view activated! I can help you find important dates and events.",timestamp:new Date});break;case"emoji-tester":if(!this.emojiTester){const i=document.createElement("div");document.body.appendChild(i),this.emojiTester=new yd(i)}this.emojiTester.toggle();break}}checkForForms(){var t;const e=(t=this.formFiller)==null?void 0:t.detectForms();e&&e.length>0&&console.log("[Ed] Found forms on page:",e.length)}positionChatPanel(){if(!this.launcherPosition)return;const e=this.launcherPosition,t=window.innerWidth,n=window.innerHeight,s=Math.min(400,t-40),i=Math.min(600,n-40),o=e.x>t/2,a=e.y>n/2;let l,c;o?l=Math.max(10,e.x-s+64):l=Math.min(t-s-10,e.x),a?c=Math.max(10,e.y-i+64):c=Math.min(n-i-10,e.y),this.container.style.position="fixed",this.container.style.left=`${l}px`,this.container.style.top=`${c}px`,this.container.style.bottom="auto",this.container.style.right="auto",this.container.style.width=`${s}px`,this.container.style.height=`${i}px`}toggle(){this.isOpen?this.close():this.open()}open(){var e;this.isOpen||(this.isOpen=!0,this.widget||this.renderWidget(),this.positionChatPanel(),document.body.classList.add("widget-active"),document.body.classList.add("view-chat"),this.particle3D&&(this.particle3D.start(),this.particle3D.setActive(!0)),(e=this.statusPill)==null||e.setState("ready"),setTimeout(()=>{this.showGreeting()},300))}close(){var e,t,n;this.isOpen&&(this.isOpen=!1,this.launcherPosition&&(this.container.style.width="",this.container.style.height=""),document.body.classList.remove("widget-active"),document.body.classList.remove("view-chat"),this.isListening&&((e=this.voice)==null||e.stop()),(t=this.geminiLive)==null||t.stop(),this.particle3D&&this.particle3D.setActive(!1),(n=this.statusPill)==null||n.setState("ready"))}destroy(){var e,t,n,s;this.close(),(e=this.geminiLive)==null||e.stop(),(t=this.particle3D)==null||t.destroy(),(n=this.launcherParticle3D)==null||n.destroy(),(s=this.voice)==null||s.destroy(),this.container.remove()}};W(Dn,"POSITION_KEY","ed-widget-position");let Li=Dn;const $n={init(r={}){if(window.__ED_INSTANCE__)return console.warn("[Ed] Widget already initialized"),window.__ED_INSTANCE__;const e=new Li(r);return window.__ED_INSTANCE__=e,e},getInstance(){return window.__ED_INSTANCE__},destroy(){window.__ED_INSTANCE__&&(window.__ED_INSTANCE__.destroy(),delete window.__ED_INSTANCE__)}};function Nd(){if(window.__ED_INSTANCE__)return;const r=document.currentScript,e={};if(r){const t=r.getAttribute("data-school-id"),n=r.getAttribute("data-theme"),s=r.getAttribute("data-position"),i=r.getAttribute("data-api-key"),o=r.getAttribute("data-language"),a=r.getAttribute("data-fish-audio-api-key"),l=r.getAttribute("data-fish-audio-voice-id-ed"),c=r.getAttribute("data-fish-audio-voice-id-edwina"),d=r.getAttribute("data-fish-audio-voice-id-santa"),u=r.getAttribute("data-fish-audio-voice-id-elf"),f=r.getAttribute("data-fish-audio-voice-id-headteacher");t&&(e.schoolId=t),n&&(e.theme=n),s&&(e.position=s),i&&(e.apiKey=i),o&&(e.language=o),a&&(e.fishAudioApiKey=a),(l||c||d||u||f)&&(e.fishAudioVoiceIds={},l&&(e.fishAudioVoiceIds.ed=l),c&&(e.fishAudioVoiceIds.edwina=c),d&&(e.fishAudioVoiceIds.santa=d),u&&(e.fishAudioVoiceIds.elf=u),f&&(e.fishAudioVoiceIds.headteacher=f)),r&&(t||n||s)&&(document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>$n.init(e)):$n.init(e))}}return typeof window<"u"?(window.EdWidget=$n,console.log("[Ed Widget] ✅ EdWidget assigned to window.EdWidget")):typeof globalThis<"u"&&(globalThis.EdWidget=$n,console.log("[Ed Widget] ✅ EdWidget assigned to globalThis.EdWidget")),Nd(),Ut.Ed=Li,Ut.EdWidget=$n,Object.defineProperty(Ut,Symbol.toStringTag,{value:"Module"}),Ut}({});
