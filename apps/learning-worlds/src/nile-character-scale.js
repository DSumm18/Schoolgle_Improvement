import {Box3,Vector3} from 'three';

export const NILE_EXPLORER_HEIGHT=1.5;
export const NILE_ADULT_HEIGHT=1.7;

// Measure the actual posed rig, including its hat, rather than assuming Blender units.
export function fitNileCharacter(avatar,mixer,animations,height=NILE_EXPLORER_HEIGHT){
 if(!Number.isFinite(height)||height<=0)throw new RangeError('Invalid character height');
 const idle=animations.find(clip=>clip.name==='Idle');
 if(idle)mixer.clipAction(idle).play();
 mixer.setTime(0);avatar.updateMatrixWorld(true);
 const box=new Box3().setFromObject(avatar,true),rawHeight=box.getSize(new Vector3()).y;
 if(!Number.isFinite(rawHeight)||rawHeight<=0)throw new RangeError('Character has no measurable height');
 const scale=height/rawHeight;
 avatar.scale.multiplyScalar(scale);avatar.position.y-=box.min.y*scale;
 mixer.stopAllAction();avatar.updateMatrixWorld(true);
 return {standingHeight:height,rawHeight,modelScale:scale};
}
