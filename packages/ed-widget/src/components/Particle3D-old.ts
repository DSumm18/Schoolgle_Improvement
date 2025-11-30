/**
 * Particle3D - Three.js Particle Avatar System
 * Creates a beautiful particle sphere that morphs between shapes
 */

import * as THREE from 'three';
import type { ParticleShape } from '../types';
import { generateSpherePoints, generatePencilPoints, generateLightbulbPoints, generateFlagPoints, generateHeartPoints, generateStarPoints, generateThumbsUpPoints, generateCheckmarkPoints, generateSmileyPoints } from '../utils/shapes';

// Use Gemini implementation
export { Particle3D } from './Particle3D-Gemini';

const PARTICLE_COUNT = 5000;
const MORPH_DURATION = 300;

// Vertex shader for particle rendering
const vertexShader = `
  attribute vec3 targetPosition;
  attribute vec3 color;
  attribute float size;
  attribute float morphProgress;
  
  varying vec3 vColor;
  varying float vAlpha;
  
  uniform float time;
  uniform float globalMorphProgress;
  
  void main() {
    vColor = color;
    
    // Interpolate between current and target position
    float progress = smoothstep(0.0, 1.0, globalMorphProgress);
    vec3 pos = mix(position, targetPosition, progress);
    
    // Add subtle floating animation
    pos.x += sin(time * 0.5 + position.y * 2.0) * 0.02;
    pos.y += cos(time * 0.7 + position.x * 2.0) * 0.02;
    pos.z += sin(time * 0.6 + position.z * 2.0) * 0.02;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    // Size attenuation - make particles larger and more visible
    gl_PointSize = size * (400.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
    
    // Fade particles at edges
    vAlpha = 1.0 - smoothstep(0.8, 1.0, length(pos));
  }
`;

// Fragment shader for particle rendering
const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    // Create circular particle
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    
    if (dist > 0.5) discard;
    
    // Soft edges
    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
    alpha *= vAlpha;
    
    // Add glow effect - brighter and more visible
    vec3 glow = vColor * 2.0;
    vec3 finalColor = mix(glow, vColor, dist * 2.0);
    
    // Make particles more opaque and visible
    gl_FragColor = vec4(finalColor, alpha * 1.0);
  }
`;

export class Particle3D {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private particles: THREE.Points | null = null;
  private geometry: THREE.BufferGeometry | null = null;
  private material: THREE.ShaderMaterial | null = null;
  
  private animationId: number | null = null;
  private clock: THREE.Clock;
  private isRunning = false;
  
  private currentShape: ParticleShape = 'sphere';
  private morphProgress = 0;
  private isMorphing = false;
  private morphStartTime = 0;
  
  private baseColor = new THREE.Color(0.17, 0.83, 0.75); // Ed teal - matching original vec3(0.17, 0.83, 0.75)
  private targetColors: THREE.Color[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
    this.clock = new THREE.Clock();

    // Ensure container has dimensions and is visible
    container.style.width = '300px';
    container.style.height = '300px';
    container.style.display = 'block';
    container.style.visibility = 'visible';
    container.style.opacity = '1';
    container.style.position = 'absolute';

    // Setup Three.js
    this.scene = new THREE.Scene();
    
    // Camera - use fixed dimensions if container not sized yet
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 300;
    const aspect = width / height;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);
    this.camera.position.z = 3;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0); // Transparent background
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.pointerEvents = 'none';
    // Ensure canvas is visible with high z-index
    this.renderer.domElement.style.opacity = '1';
    this.renderer.domElement.style.visibility = 'visible';
    this.renderer.domElement.style.zIndex = '11';
    this.renderer.domElement.id = 'particle-canvas';
    container.appendChild(this.renderer.domElement);
    
    // Force a render to ensure it's visible
    this.renderer.render(this.scene, this.camera);

    // Create particles
    this.createParticles();

    // Handle resize
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Debug: Log initialization
    console.log('[Particle3D] Initialized', {
      container: container,
      width: container.clientWidth,
      height: container.clientHeight,
      canvas: this.renderer.domElement,
      particles: this.particles,
    });
  }

  private createParticles(): void {
    // Generate initial sphere positions
    const positions = generateSpherePoints(PARTICLE_COUNT);
    const targetPositions = new Float32Array(positions);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const morphProgress = new Float32Array(PARTICLE_COUNT);

    // Set initial colors and sizes - make particles more visible
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      colors[i * 3] = this.baseColor.r;
      colors[i * 3 + 1] = this.baseColor.g;
      colors[i * 3 + 2] = this.baseColor.b;
      
      // Larger, more visible particles
      sizes[i] = Math.random() * 4 + 3;
      morphProgress[i] = 0;
    }

    // Create geometry
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('targetPosition', new THREE.BufferAttribute(targetPositions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.geometry.setAttribute('morphProgress', new THREE.BufferAttribute(morphProgress, 1));

    // Create shader material
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 },
        globalMorphProgress: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    // Create points
    this.particles = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.particles);
  }

  public morphTo(shape: ParticleShape): void {
    if (this.currentShape === shape || !this.geometry) return;

    let targetPositions: Float32Array;

    switch (shape) {
      case 'pencil':
        targetPositions = generatePencilPoints(PARTICLE_COUNT);
        break;
      case 'lightbulb':
        targetPositions = generateLightbulbPoints(PARTICLE_COUNT);
        break;
      case 'heart':
        targetPositions = generateHeartPoints(PARTICLE_COUNT);
        break;
      case 'star':
        targetPositions = generateStarPoints(PARTICLE_COUNT);
        break;
      case 'thumbsup':
        targetPositions = generateThumbsUpPoints(PARTICLE_COUNT);
        break;
      case 'checkmark':
        targetPositions = generateCheckmarkPoints(PARTICLE_COUNT);
        break;
      case 'smiley':
        targetPositions = generateSmileyPoints(PARTICLE_COUNT);
        break;
      case 'sphere':
      default:
        targetPositions = generateSpherePoints(PARTICLE_COUNT);
        break;
    }

    // Update current positions to current rendered positions
    const positions = this.geometry.attributes.position.array as Float32Array;
    const currentTarget = this.geometry.attributes.targetPosition.array as Float32Array;
    
    for (let i = 0; i < positions.length; i++) {
      positions[i] = currentTarget[i];
    }
    this.geometry.attributes.position.needsUpdate = true;

    // Set new target positions
    this.geometry.setAttribute('targetPosition', new THREE.BufferAttribute(targetPositions, 3));

    // Start morph animation
    this.currentShape = shape;
    this.isMorphing = true;
    this.morphStartTime = this.clock.getElapsedTime();
    this.morphProgress = 0;
  }

  public morphToFlag(flagColors: string[]): void {
    if (!this.geometry) return;

    // Generate flag shape
    const targetPositions = generateFlagPoints(PARTICLE_COUNT);

    // Update positions
    const positions = this.geometry.attributes.position.array as Float32Array;
    const currentTarget = this.geometry.attributes.targetPosition.array as Float32Array;
    
    for (let i = 0; i < positions.length; i++) {
      positions[i] = currentTarget[i];
    }
    this.geometry.attributes.position.needsUpdate = true;

    // Set new target positions
    this.geometry.setAttribute('targetPosition', new THREE.BufferAttribute(targetPositions, 3));

    // Update colors to flag colors
    const colors = this.geometry.attributes.color.array as Float32Array;
    const stripeHeight = 2 / flagColors.length;
    const parsedColors = flagColors.map(c => new THREE.Color(c));

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const y = targetPositions[i * 3 + 1]; // y position
      const normalizedY = (y + 1) / 2; // 0 to 1
      const stripeIndex = Math.min(Math.floor(normalizedY * flagColors.length), flagColors.length - 1);
      const color = parsedColors[stripeIndex];

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    this.geometry.attributes.color.needsUpdate = true;

    // Start morph
    this.currentShape = 'flag';
    this.isMorphing = true;
    this.morphStartTime = this.clock.getElapsedTime();
    this.morphProgress = 0;
  }

  public setColor(hexColor: string): void {
    this.baseColor = new THREE.Color(hexColor);
    
    if (!this.geometry) return;

    const colors = this.geometry.attributes.color.array as Float32Array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      colors[i * 3] = this.baseColor.r;
      colors[i * 3 + 1] = this.baseColor.g;
      colors[i * 3 + 2] = this.baseColor.b;
    }
    this.geometry.attributes.color.needsUpdate = true;
  }

  public start(): void {
    if (this.isRunning) {
      console.log('[Particle3D] Already running');
      return;
    }
    console.log('[Particle3D] Starting animation');
    this.isRunning = true;
    this.clock.start();
    this.animate();
    // Force initial render
    this.renderer.render(this.scene, this.camera);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public isRunning(): boolean {
    return this.isRunning;
  }

  private animate = (): void => {
    if (!this.isRunning) return;

    const time = this.clock.getElapsedTime();

    // Update uniforms
    if (this.material) {
      this.material.uniforms.time.value = time;

      // Handle morph animation
      if (this.isMorphing) {
        const elapsed = (time - this.morphStartTime) * 1000; // ms
        this.morphProgress = Math.min(elapsed / MORPH_DURATION, 1);
        this.material.uniforms.globalMorphProgress.value = this.morphProgress;

        if (this.morphProgress >= 1) {
          this.isMorphing = false;
          // Update positions to final
          if (this.geometry) {
            const positions = this.geometry.attributes.position.array as Float32Array;
            const targets = this.geometry.attributes.targetPosition.array as Float32Array;
            for (let i = 0; i < positions.length; i++) {
              positions[i] = targets[i];
            }
            this.geometry.attributes.position.needsUpdate = true;
          }
        }
      }
    }

    // Subtle rotation
    if (this.particles) {
      this.particles.rotation.y = time * 0.1;
      this.particles.rotation.x = Math.sin(time * 0.2) * 0.1;
    }

    this.renderer.render(this.scene, this.camera);
    this.animationId = requestAnimationFrame(this.animate);
  };

  private handleResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public destroy(): void {
    this.stop();
    
    if (this.particles) {
      this.scene.remove(this.particles);
    }
    this.geometry?.dispose();
    this.material?.dispose();
    this.renderer.dispose();
    
    window.removeEventListener('resize', this.handleResize);
    
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}

