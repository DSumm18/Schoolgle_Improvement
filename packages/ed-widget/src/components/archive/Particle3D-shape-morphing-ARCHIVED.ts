/**
 * ARCHIVED: Particle3D - Three.js Particle Avatar System (Gemini Implementation)
 * 
 * This file contains the original shape morphing functionality (pencil, heart, star, etc.)
 * Archived on 2025-01-XX to preserve functionality when switching to solar system animation.
 * 
 * To restore: Copy this file back to Particle3D.ts and update imports in Ed.ts
 * 
 * Features preserved:
 * - All shape morphing (pencil, heart, star, thumbsup, checkmark, smiley, etc.)
 * - Flag morphing with color patterns
 * - Emoji reference integration
 * - SVG path-based shape generation
 * - Reaction mode system
 * - All 30+ shape types
 */

import * as THREE from 'three';
import type { ParticleShape } from '../../types';
import { 
  generateSpherePoints, 
  generatePencilPoints, 
  generateLightbulbPoints, 
  generateFlagPoints, 
  generateHeartPoints, 
  generateStarPoints, 
  generateThumbsUpPoints, 
  generateCheckmarkPoints, 
  generateSmileyPoints,
  generateBookPoints,
  generateClockPoints,
  generateWarningPoints,
  generateQuestionPoints,
  generateLoadingPoints,
  generateCalendarPoints,
  generateSearchPoints,
  generatePhonePoints,
  generateLocationPoints,
  generateFireworksPoints,
  generatePartyPoints,
  generateConfettiPoints,
  generateTrophyPoints,
  generateExcitedPoints,
  generateThinkingPoints,
  generateConfusedPoints,
  generateErrorPoints,
  generateSpeechPoints,
  generateDocumentPoints,
  generateCalculatorPoints,
  generateBellPoints,
  generateGraduationPoints
} from '../../utils/shapes';
import { getEmojiReference } from '../../utils/emoji-references';
import { generateFromSVGPath } from '../../utils/shapes';
import { FLAG_PATTERNS, generateFlagPatternPoints, generateFlagPatternColors } from '../../utils/flag-patterns';

const PARTICLE_COUNT = 2500; // Reduced for more spaced-out, comet-like effect

// Reaction modes
enum ReactionMode {
  BASE = 0,
  REACTION = 1,
}

export class Particle3D {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private particleSystem: THREE.Points | null = null;
  private geometry: THREE.BufferGeometry | null = null;
  private material: THREE.ShaderMaterial | null = null;
  
  private animationId: number | null = null;
  private clock: THREE.Clock;
  private _isRunning = false;
  
  private reactionMode = 0; // 0 = Base Sphere, 1 = Reaction Shape
  private currentShape: ParticleShape = 'sphere';
  private morphStartTime = 0;
  private morphSpeed = 0.05; // Default morph speed
  
  // Uniforms
  private uniforms = {
    u_time: { value: 0.0 },
    u_reaction_mix: { value: 0.0 },
  };
  
  // Shape-specific animation speeds (higher = faster)
  private shapeSpeeds: Record<ParticleShape, number> = {
    // Fast (0.3s morph) - celebrations, urgent
    fireworks: 0.15,
    party: 0.15,
    confetti: 0.15,
    excited: 0.15,
    warning: 0.12,
    error: 0.12,
    
    // Medium (0.6s morph) - standard shapes
    sphere: 0.05,
    pencil: 0.05,
    lightbulb: 0.05,
    flag: 0.05,
    book: 0.05,
    clock: 0.05,
    question: 0.05,
    loading: 0.05,
    calendar: 0.05,
    search: 0.05,
    phone: 0.05,
    location: 0.05,
    trophy: 0.05,
    thinking: 0.05,
    confused: 0.05,
    speech: 0.05,
    document: 0.05,
    calculator: 0.05,
    bell: 0.05,
    graduation: 0.05,
    
    // Slow (1.0s morph) - calm shapes
    heart: 0.03,
    smiley: 0.03,
    star: 0.04,
    thumbsup: 0.04,
    checkmark: 0.04,
    
    // Legacy
    logo: 0.05,
  };

  // Vertex shader (matching Gemini)
  private vertexShader = `
    uniform float u_time;
    uniform float u_reaction_mix;
    attribute vec3 reactionPos;
    attribute vec3 reactionColor;
    varying vec3 vColor;
    
    void main() {
      vec3 finalPos = mix(position, reactionPos, u_reaction_mix);
      vColor = mix(vec3(0.17, 0.83, 0.75), reactionColor, u_reaction_mix);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPos, 1.0);
      gl_PointSize = 3.0;
    }
  `;

  // Fragment shader (matching Gemini)
  private fragmentShader = `
    varying vec3 vColor;
    void main() {
      if(length(gl_PointCoord - vec2(0.5)) > 0.5) discard;
      gl_FragColor = vec4(vColor, 0.9);
    }
  `;

  constructor(container: HTMLElement) {
    this.container = container;
    this.clock = new THREE.Clock();

    // Ensure container has dimensions
    container.style.width = '300px';
    container.style.height = '300px';
    container.style.display = 'block';
    container.style.visibility = 'visible';
    container.style.opacity = '1';
    container.style.position = 'absolute';
    container.style.bottom = '60px';
    container.style.right = '0';
    container.style.zIndex = '10';
    container.style.pointerEvents = 'none';

    // Setup Three.js (matching Gemini)
    this.scene = new THREE.Scene();
    
    const width = 300;
    const height = 300;
    const aspect = width / height;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    this.camera.position.z = 3.5;

    // Renderer (matching Gemini)
    this.renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true 
    });
    this.renderer.setSize(width, height);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.pointerEvents = 'none';
    container.appendChild(this.renderer.domElement);

    // Create particles
    this.createParticles();

    // Handle resize
    window.addEventListener('resize', this.handleResize.bind(this));
    
    console.log('[Particle3D] Initialized (Gemini style)', {
      container,
      width: container.clientWidth,
      height: container.clientHeight,
    });
  }

  private createParticles(): void {
    // Create geometry
    this.geometry = new THREE.BufferGeometry();

    // Create buffers for morph targets (matching Gemini structure)
    const spherePosArray = new Float32Array(PARTICLE_COUNT * 3);
    const reactionPosArray = new Float32Array(PARTICLE_COUNT * 3);
    const reactionColorArray = new Float32Array(PARTICLE_COUNT * 3);

    // Initialize particle positions (matching Gemini)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Default base shape (sphere)
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const r = 0.9 + Math.random() * 0.1;
      
      spherePosArray[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      spherePosArray[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      spherePosArray[i * 3 + 2] = r * Math.cos(phi);

      // Initialize reaction buffers to default sphere
      reactionPosArray[i * 3] = spherePosArray[i * 3];
      reactionPosArray[i * 3 + 1] = spherePosArray[i * 3 + 1];
      reactionPosArray[i * 3 + 2] = spherePosArray[i * 3 + 2];
      
      // Default teal color
      reactionColorArray[i * 3] = 0.17;   // R
      reactionColorArray[i * 3 + 1] = 0.83; // G
      reactionColorArray[i * 3 + 2] = 0.75; // B
    }

    // Add attributes to geometry (matching Gemini)
    this.geometry.setAttribute('position', new THREE.BufferAttribute(spherePosArray, 3));
    this.geometry.setAttribute('reactionPos', new THREE.BufferAttribute(reactionPosArray, 3));
    this.geometry.setAttribute('reactionColor', new THREE.BufferAttribute(reactionColorArray, 3));

    // Create shader material (matching Gemini)
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      transparent: true,
    });

    // Create particle system
    this.particleSystem = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.particleSystem);
  }

  public morphTo(shape: ParticleShape): void {
    if (!this.geometry) return;
    
    this.currentShape = shape;
    this.reactionMode = 1; // Enable reaction mode
    this.morphStartTime = this.clock.getElapsedTime();
    this.morphSpeed = this.shapeSpeeds[shape] || 0.05;
    
    // Generate target positions based on shape
    const reactionPosArray = this.generateShapePoints(shape);
    const reactionColorArray = this.generateShapeColors(shape);
    
    // Update geometry attributes
    this.geometry.setAttribute('reactionPos', new THREE.BufferAttribute(reactionPosArray, 3));
    this.geometry.setAttribute('reactionColor', new THREE.BufferAttribute(reactionColorArray, 3));
    
    console.log('[Particle3D] Morphing to:', shape, 'speed:', this.morphSpeed);
  }

  public morphToFlag(flagColors: string[], languageCode?: string): void {
    if (!this.geometry) return;
    
    this.currentShape = 'flag';
    this.reactionMode = 1;
    
    // Try to use pattern-based generation if language code provided
    if (languageCode && FLAG_PATTERNS[languageCode]) {
      const pattern = FLAG_PATTERNS[languageCode];
      const reactionPosArray = generateFlagPatternPoints(PARTICLE_COUNT, pattern);
      const reactionColorArray = generateFlagPatternColors(PARTICLE_COUNT, pattern);
      
      this.geometry.setAttribute('reactionPos', new THREE.BufferAttribute(reactionPosArray, 3));
      this.geometry.setAttribute('reactionColor', new THREE.BufferAttribute(reactionColorArray, 3));
    } else {
      // Fallback to simple stripe generation
      const reactionPosArray = this.generateFlagPoints();
      const reactionColorArray = this.generateFlagColors(flagColors);
      
      this.geometry.setAttribute('reactionPos', new THREE.BufferAttribute(reactionPosArray, 3));
      this.geometry.setAttribute('reactionColor', new THREE.BufferAttribute(reactionColorArray, 3));
    }
  }

  private generateShapePoints(shape: ParticleShape): Float32Array {
    switch (shape) {
      // Core shapes - use emoji-accurate SVG paths when available
      case 'pencil':
        const pencilRef = getEmojiReference('pencil');
        if (pencilRef) {
          return generateFromSVGPath('pencil', PARTICLE_COUNT, 0.2);
        }
        return generatePencilPoints(PARTICLE_COUNT);
      case 'lightbulb':
        const lightbulbRef = getEmojiReference('lightbulb');
        if (lightbulbRef) {
          return generateFromSVGPath('lightbulb', PARTICLE_COUNT, 0.2);
        }
        return generateLightbulbPoints(PARTICLE_COUNT);
      case 'heart':
        const heartRef = getEmojiReference('heart');
        if (heartRef) {
          return generateFromSVGPath('heart', PARTICLE_COUNT, 0.2);
        }
        return generateHeartPoints(PARTICLE_COUNT);
      case 'star':
        const starRef = getEmojiReference('star');
        if (starRef) {
          return generateFromSVGPath('star', PARTICLE_COUNT, 0.2);
        }
        return generateStarPoints(PARTICLE_COUNT);
      case 'thumbsup':
        const thumbsupRef = getEmojiReference('thumbsup');
        if (thumbsupRef) {
          return generateFromSVGPath('thumbsup', PARTICLE_COUNT, 0.2);
        }
        return generateThumbsUpPoints(PARTICLE_COUNT);
      case 'checkmark':
        const checkmarkRef = getEmojiReference('checkmark');
        if (checkmarkRef) {
          return generateFromSVGPath('checkmark', PARTICLE_COUNT, 0.15);
        }
        return generateCheckmarkPoints(PARTICLE_COUNT);
      case 'smiley':
        const smileyRef = getEmojiReference('smiley');
        if (smileyRef) {
          return generateFromSVGPath('smiley', PARTICLE_COUNT, 0.2);
        }
        return generateSmileyPoints(PARTICLE_COUNT);
      
      // Essential new shapes
      case 'book':
        return generateBookPoints(PARTICLE_COUNT);
      case 'clock':
        return generateClockPoints(PARTICLE_COUNT);
      case 'warning':
        return generateWarningPoints(PARTICLE_COUNT);
      case 'question':
        return generateQuestionPoints(PARTICLE_COUNT);
      case 'loading':
        return generateLoadingPoints(PARTICLE_COUNT);
      case 'calendar':
        return generateCalendarPoints(PARTICLE_COUNT);
      case 'search':
        return generateSearchPoints(PARTICLE_COUNT);
      case 'phone':
        return generatePhonePoints(PARTICLE_COUNT);
      case 'location':
        return generateLocationPoints(PARTICLE_COUNT);
      
      // Celebration shapes
      case 'fireworks':
        return generateFireworksPoints(PARTICLE_COUNT);
      case 'party':
        return generatePartyPoints(PARTICLE_COUNT);
      case 'confetti':
        return generateConfettiPoints(PARTICLE_COUNT);
      case 'trophy':
        return generateTrophyPoints(PARTICLE_COUNT);
      case 'excited':
        return generateExcitedPoints(PARTICLE_COUNT);
      
      // Additional shapes
      case 'thinking':
        return generateThinkingPoints(PARTICLE_COUNT);
      case 'confused':
        return generateConfusedPoints(PARTICLE_COUNT);
      case 'error':
        return generateErrorPoints(PARTICLE_COUNT);
      case 'speech':
        return generateSpeechPoints(PARTICLE_COUNT);
      case 'document':
        return generateDocumentPoints(PARTICLE_COUNT);
      case 'calculator':
        return generateCalculatorPoints(PARTICLE_COUNT);
      case 'bell':
        return generateBellPoints(PARTICLE_COUNT);
      case 'graduation':
        return generateGraduationPoints(PARTICLE_COUNT);
      
      case 'sphere':
      default:
        return generateSpherePoints(PARTICLE_COUNT);
    }
  }

  private generateShapeColors(shape: ParticleShape): Float32Array {
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    
    // Get emoji reference for accurate colors
    const emojiRef = getEmojiReference(shape);
    
    if (emojiRef && emojiRef.colors) {
      const palette = emojiRef.colors;
      const primary = palette.primary;
      const secondary = palette.secondary || primary;
      const accent = palette.accent || primary;
      
      // Distribute colors based on particle position
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const t = i / PARTICLE_COUNT;
        let r: number, g: number, b: number;
        
        // Use different colors for different regions
        if (t < 0.6) {
          // Primary color for most particles
          r = primary[0];
          g = primary[1];
          b = primary[2];
        } else if (t < 0.85) {
          // Secondary color
          r = secondary[0];
          g = secondary[1];
          b = secondary[2];
        } else {
          // Accent color
          r = accent[0];
          g = accent[1];
          b = accent[2];
        }
        
        colors[i * 3] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;
      }
    } else {
      // Fallback to default colors for shapes without emoji reference
      let r = 0.17, g = 0.83, b = 0.75; // Default teal
      
      switch (shape) {
        case 'heart':
          r = 1.0; g = 0.2; b = 0.3; // Red
          break;
        case 'star':
          r = 1.0; g = 0.84; b = 0.0; // Gold
          break;
        case 'thumbsup':
          r = 0.2; g = 0.8; b = 0.2; // Green
          break;
        case 'checkmark':
          r = 0.2; g = 0.8; b = 0.2; // Green
          break;
      }
      
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        colors[i * 3] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;
      }
    }
    
    return colors;
  }

  private generateFlagPoints(): Float32Array {
    // Use simple rectangle for now - pattern will be in colors
    const points = generateFlagPoints(PARTICLE_COUNT);
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < points.length; i++) {
      positions[i] = points[i];
    }
    return positions;
  }

  private generateFlagColors(flagColors: string[]): Float32Array {
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const parsedColors = flagColors.map(c => new THREE.Color(c));
    
    // Determine pattern type from color count and order
    // This is a simplified version - for better results, use flag-patterns.ts
    const isVertical = flagColors.length === 3 && flagColors[0] === '#002395'; // French flag pattern
    const isHorizontal = flagColors.length === 2 && (flagColors[0] === '#FFFFFF' || flagColors[0] === '#006A4E');
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      let colorIndex = 0;
      
      if (isVertical) {
        // Vertical stripes (left to right)
        const x = (i / PARTICLE_COUNT) * 2 - 1; // -1 to 1
        const normalizedX = (x + 1) / 2; // 0 to 1
        colorIndex = Math.min(Math.floor(normalizedX * flagColors.length), flagColors.length - 1);
      } else {
        // Horizontal stripes (top to bottom) - default
        const y = (i / PARTICLE_COUNT) * 2 - 1; // -1 to 1
        const normalizedY = 1 - (y + 1) / 2; // Flip: top is 0, bottom is 1
        colorIndex = Math.min(Math.floor(normalizedY * flagColors.length), flagColors.length - 1);
      }
      
      const color = parsedColors[colorIndex];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    return colors;
  }

  public setColor(hexColor: string): void {
    // This would update base color, but we use reaction colors now
    console.log('[Particle3D] Color set to:', hexColor);
  }

  public start(): void {
    if (this._isRunning) return;
    
    console.log('[Particle3D] Starting animation');
    this._isRunning = true;
    this.clock.start();
    this.animate();
  }

  public stop(): void {
    this._isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public isRunning(): boolean {
    return this._isRunning;
  }

  private animate = (): void => {
    if (!this._isRunning) return;

    const time = this.clock.getElapsedTime();
    this.uniforms.u_time.value = time;

    // Reaction Mix Logic with shape-specific speed
    // If reacting OR form filling, morph to special shape
    const tMix = (this.reactionMode !== 0) ? 1.0 : 0.0;
    
    // Smoothly interpolate the uniform value with shape-specific speed
    const speed = this.morphSpeed;
    this.uniforms.u_reaction_mix.value += (tMix - this.uniforms.u_reaction_mix.value) * speed;

    // Always rotate slowly (matching Gemini)
    if (this.particleSystem) {
      this.particleSystem.rotation.y += 0.02;
    }

    this.renderer.render(this.scene, this.camera);
    this.animationId = requestAnimationFrame(this.animate);
  };

  private handleResize(): void {
    const width = this.container.clientWidth || 300;
    const height = this.container.clientHeight || 300;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public destroy(): void {
    this.stop();
    
    if (this.particleSystem) {
      this.scene.remove(this.particleSystem);
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




