/**
 * Expose Three.js globally so ed-widget's Particle3D can use the same instance
 * This prevents "Multiple instances of Three.js" warning
 */
import * as THREE from 'three';

if (typeof window !== 'undefined') {
  (window as any).THREE = THREE;
  console.log('[Three.js Global] Exposed THREE to window:', THREE);
}

export default THREE;
