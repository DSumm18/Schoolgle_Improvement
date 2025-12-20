/**
 * Particle3D - Solar System → Chaser Formation Animation
 * 
 * Idle (chat closed): 8 planets orbit around central sun (Ed's head) in solar system formation
 * Active (chat open): Planets spiral inward, then form tight chaser formation
 * 
 * Replaces shape morphing system for better performance on older devices.
 * Original shape morphing code archived in: archive/Particle3D-shape-morphing-ARCHIVED.ts
 */

import * as THREE from 'three';

// Planet definitions (in order from sun)
// Logo reference: 520px container, planets 12-18px, orbital radii 70-190px
interface PlanetDef {
  name: string;
  radius: number;         // Orbital radius in pixels (from logo: 70, 90, 110, 130, 150, 170, 190)
  speed: number;          // Orbital speed multiplier (inner fastest, outer slowest)
  color: [number, number, number]; // RGB color (0-1 range)
  size: number;          // Planet size in pixels (from logo: 12, 14, 16, 14, 16, 14, 18)
  duration: number;      // Orbit duration in seconds (from logo: 12, 18, 25, 32, 40, 55, 75)
}

// Match Schoolgle logo planets exactly (7 planets, same colors, sizes, and orbital radii)
// Logo reference: size=520px, planets: 12-18px, radii: 70-190px
// Colors converted from hex to RGB (0-1 range)
const PLANETS: PlanetDef[] = [
  { name: 'HR', radius: 70, speed: 2.0, color: [0.678, 0.847, 0.902], size: 12, duration: 12 }, // #ADD8E6 - Inner, fastest
  { name: 'Finance', radius: 90, speed: 1.33, color: [1.0, 0.667, 0.298], size: 14, duration: 18 }, // #FFAA4C
  { name: 'Estates', radius: 110, speed: 1.0, color: [0.0, 0.831, 0.831], size: 16, duration: 25 }, // #00D4D4
  { name: 'Compliance', radius: 130, speed: 0.75, color: [0.902, 0.765, 1.0], size: 14, duration: 32 }, // #E6C3FF
  { name: 'Teaching', radius: 150, speed: 0.6, color: [1.0, 0.714, 0.757], size: 16, duration: 40 }, // #FFB6C1
  { name: 'SEND', radius: 170, speed: 0.44, color: [0.596, 1.0, 0.596], size: 14, duration: 55 }, // #98FF98
  { name: 'Governance', radius: 190, speed: 0.32, color: [1.0, 0.843, 0.0], size: 18, duration: 75 }, // #FFD700 - Outer, slowest
];

const SUN_PARTICLE_COUNT = 400;
const SUN_COLOR: [number, number, number] = [0.17, 0.83, 0.75]; // Ed teal

type AnimationState = 'solar' | 'transitioning' | 'chaser';

export class Particle3D {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  
  // Container dimensions (detected from actual container size)
  private containerWidth: number;
  private containerHeight: number;
  private scaleFactor: number; // Scale from logo reference (520px) to actual container
  
  // Particle systems
  private sun: THREE.Points | null = null;
  private planets: THREE.Mesh[] = []; // Using Mesh spheres for solid circles (matching logo exactly)
  
  private animationId: number | null = null;
  private clock: THREE.Clock;
  private _isRunning = false;
  
  // Animation state
  private state: AnimationState = 'solar';
  private transitionProgress = 0; // 0 = solar, 1 = chaser
  private transitionStartTime = 0;
  private transitionDuration = 1.5; // seconds
  
  // Planet orbital angles (for solar system state)
  private planetAngles: number[] = [];
  
  // Shaders (simple - positions updated directly in animate loop)
  private vertexShader = `
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = 3.0;
    }
  `;
  
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

    // Detect actual container dimensions (supports both 60px launcher and 300px widget)
    this.containerWidth = container.clientWidth || parseInt(container.style.width) || 300;
    this.containerHeight = container.clientHeight || parseInt(container.style.height) || 300;
    
    // Calculate scale factor from logo reference (520px) to actual container
    // Logo reference: 520px container, planets 12-18px, orbital radii 70-190px
    this.scaleFactor = this.containerWidth / 520;
    
    // Ensure container has proper styling (but don't override existing dimensions)
    container.style.display = 'block';
    container.style.visibility = 'visible';
    container.style.opacity = '1';
    if (!container.style.position) {
      container.style.position = 'absolute';
    }
    if (!container.style.pointerEvents) {
      container.style.pointerEvents = 'none';
    }

    // Setup Three.js
    this.scene = new THREE.Scene();
    
    // Use OrthographicCamera for flat 2D appearance (matching logo)
    // Orthographic camera removes perspective distortion, making planets appear as flat circles
    const aspect = this.containerWidth / this.containerHeight;
    const viewSize = Math.max(this.containerWidth, this.containerHeight);
    const halfView = viewSize / 2;
    
    this.camera = new THREE.OrthographicCamera(
      -halfView * aspect, // left
      halfView * aspect,  // right
      halfView,           // top
      -halfView,          // bottom
      0.1,                // near
      1000                // far
    );
    this.camera.position.z = 100; // Position camera along Z axis (orthographic, so distance doesn't matter)

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true 
    });
    this.renderer.setSize(this.containerWidth, this.containerHeight);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.pointerEvents = 'none';
    container.appendChild(this.renderer.domElement);

    // Initialize planet angles to match logo starting positions (in degrees, converted to radians)
    // Logo planets start at: 35°, 120°, 210°, 300°, 20°, 95°, 335°
    const logoStarts = [35, 120, 210, 300, 20, 95, 335];
    this.planetAngles = PLANETS.map((_, i) => (logoStarts[i] || 0) * Math.PI / 180);

    // Create particle systems
    this.createSun();
    this.createPlanets();

    // Handle resize
    window.addEventListener('resize', this.handleResize.bind(this));
    
    console.log('[Particle3D] Initialized (Solar System)', {
      containerSize: `${this.containerWidth}x${this.containerHeight}`,
      scaleFactor: this.scaleFactor.toFixed(3),
      sun: SUN_PARTICLE_COUNT,
      planets: PLANETS.map(p => `${p.name}: ${p.size}px`),
    });
  }

  private createSun(): void {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(SUN_PARTICLE_COUNT * 3);
    const colors = new Float32Array(SUN_PARTICLE_COUNT * 3);

    // Create sphere of particles for the sun
    for (let i = 0; i < SUN_PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const r = 0.3 + Math.random() * 0.1; // Small central sphere
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      
      colors[i * 3] = SUN_COLOR[0];
      colors[i * 3 + 1] = SUN_COLOR[1];
      colors[i * 3 + 2] = SUN_COLOR[2];
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 3.0,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    });

    this.sun = new THREE.Points(geometry, material);
    this.scene.add(this.sun);
  }

  private createPlanets(): void {
    PLANETS.forEach((planetDef, index) => {
      // Use SphereGeometry to create solid circles (matching logo style exactly)
      // Logo planets are 12-18px actual pixels
      // Convert pixel size to 3D space: scale by scaleFactor to match container size
      const planetRadius = (planetDef.size * this.scaleFactor) / 2; // Radius in 3D space (half of diameter)
      
      // Use high segment count for smooth circles (32 segments = very smooth circle)
      const geometry = new THREE.SphereGeometry(planetRadius, 32, 32);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(planetDef.color[0], planetDef.color[1], planetDef.color[2]),
        transparent: true,
        opacity: 1.0,
      });

      const planet = new THREE.Mesh(geometry, material);
      
      // Calculate orbital distance: scale logo radius (70-190px) to 3D space
      const orbitalDistance = planetDef.radius * this.scaleFactor;
      
      // Initial position at orbital distance (will be updated in animate)
      planet.position.set(orbitalDistance, 0, 0);
      
      this.scene.add(planet);
      this.planets.push(planet);
    });
  }

  /**
   * Set active state (chat open/closed)
   * When active: planets spiral in and form chaser
   * When inactive: planets return to solar system
   */
  public setActive(isActive: boolean): void {
    if (isActive && this.state === 'solar') {
      this.state = 'transitioning';
      this.transitionStartTime = this.clock.getElapsedTime();
      console.log('[Particle3D] Transitioning to chaser formation');
    } else if (!isActive && this.state === 'chaser') {
      this.state = 'transitioning';
      this.transitionStartTime = this.clock.getElapsedTime();
      console.log('[Particle3D] Transitioning to solar system');
    }
  }

  /**
   * Legacy method for compatibility - maps to setActive
   */
  public morphTo(shape: string): void {
    // For backward compatibility, ignore shape and just ensure we're in solar mode
    if (this.state !== 'solar') {
      this.setActive(false);
    }
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

    // Update transition progress
    if (this.state === 'transitioning') {
      const elapsed = time - this.transitionStartTime;
      const progress = Math.min(elapsed / this.transitionDuration, 1);
      
      // Determine target state based on current transition direction
      const wasSolar = this.transitionProgress < 0.5;
      this.transitionProgress = wasSolar ? progress : (1 - progress);
      
      // Check if transition complete
      if (progress >= 1) {
        this.state = wasSolar ? 'chaser' : 'solar';
        this.transitionProgress = wasSolar ? 1 : 0;
        console.log('[Particle3D] Transition complete, state:', this.state);
      }
    }

    // Update sun rotation
    if (this.sun) {
      this.sun.rotation.y += 0.01;
      
      // Pulse sun when active
      if (this.state === 'chaser') {
        const pulse = Math.sin(time * 2) * 0.1 + 1.0;
        this.sun.scale.set(pulse, pulse, pulse);
      } else {
        this.sun.scale.set(1, 1, 1);
      }
    }

    // Update planets (now using Mesh spheres - simple position updates)
    this.planets.forEach((planet, index) => {
      const planetDef = PLANETS[index];
      
      if (this.state === 'solar' || this.state === 'transitioning') {
        // Solar system mode: planets orbit around center (like logo)
        // Use logo duration to calculate rotation speed (faster for inner planets)
        const rotationSpeed = (2 * Math.PI) / planetDef.duration; // Full rotation per duration
        this.planetAngles[index] += rotationSpeed * 0.016; // ~60fps timing
        
        const angle = this.planetAngles[index];
        // Calculate orbital distance: scale logo radius to 3D space
        const baseDistance = planetDef.radius * this.scaleFactor;
        const distance = baseDistance * (1 - this.transitionProgress * 0.7); // Spiral in during transition
        
        // Update planet position (simple orbit, like logo)
        planet.position.x = distance * Math.cos(angle);
        planet.position.y = distance * Math.sin(angle);
        planet.position.z = 0;
      } else if (this.state === 'chaser') {
        // Chaser mode: planets form a circle and rotate (activation/loading indicator)
        const baseAngle = time * 1.5; // Rotation speed
        const planetAngle = baseAngle + (index * Math.PI * 2 / PLANETS.length);
        // Circular formation radius: scale to container (use ~40% of container width)
        const radius = this.containerWidth * 0.2 * this.scaleFactor;
        
        // Position planet on circle
        planet.position.x = radius * Math.cos(planetAngle);
        planet.position.y = radius * Math.sin(planetAngle);
        planet.position.z = 0;
        
        // Optional: slight rotation on own axis for visual interest
        planet.rotation.z += 0.02;
      }
    });

    this.renderer.render(this.scene, this.camera);
    this.animationId = requestAnimationFrame(this.animate);
  };

  private handleResize(): void {
    const width = this.container.clientWidth || this.containerWidth;
    const height = this.container.clientHeight || this.containerHeight;
    
    // Update container dimensions and scale factor
    this.containerWidth = width;
    this.containerHeight = height;
    this.scaleFactor = this.containerWidth / 520;
    
    // Update orthographic camera bounds
    const aspect = width / height;
    const viewSize = Math.max(width, height);
    const halfView = viewSize / 2;
    
    this.camera.left = -halfView * aspect;
    this.camera.right = halfView * aspect;
    this.camera.top = halfView;
    this.camera.bottom = -halfView;
    this.camera.updateProjectionMatrix();
    
    // Update renderer size
    this.renderer.setSize(width, height);
    
    // Recreate planets with new scale (or update their positions)
    // For now, just update positions - planets will resize on next frame
    this.planets.forEach((planet, index) => {
      const planetDef = PLANETS[index];
      const orbitalDistance = planetDef.radius * this.scaleFactor;
      const currentAngle = this.planetAngles[index];
      planet.position.x = orbitalDistance * Math.cos(currentAngle);
      planet.position.y = orbitalDistance * Math.sin(currentAngle);
    });
  }

  public destroy(): void {
    this.stop();
    
    if (this.sun) {
      this.scene.remove(this.sun);
      this.sun.geometry.dispose();
      (this.sun.material as THREE.Material).dispose();
    }
    
    this.planets.forEach((planet) => {
      this.scene.remove(planet);
      planet.geometry.dispose();
      (planet.material as THREE.Material).dispose();
    });
    
    // Clear arrays
    this.planets = [];
    
    this.renderer.dispose();
    
    window.removeEventListener('resize', this.handleResize);
    
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
