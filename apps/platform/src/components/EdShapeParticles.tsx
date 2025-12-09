"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type PointData = { x: number; y: number; z: number; r: number; g: number; b: number };
type ShapeGenerator = (i: number, p: number) => PointData;

interface EdShapeParticlesProps {
    type?: 'flag' | 'orb' | 'thinking';
    countryCode?: string;
    size?: number;
    animated?: boolean;
    shape?: string; // e.g. 'pencil', 'lightbulb'
}

const SHAPE_GENERATORS: Record<string, ShapeGenerator> = {
    pencil: (i, p) => {
        let x, y, z, r_c = 1.0, g_c = 0.8, b_c = 0.0;
        if (p < 0.15) { x = Math.random() * 0.05 * Math.cos(i); y = -0.9 + Math.random() * 0.2; z = Math.random() * 0.05 * Math.sin(i); r_c = 0.2; g_c = 0.2; b_c = 0.2; }
        else if (p < 0.25) { const r = 0.15 * (p - 0.15) / 0.1; x = r * Math.cos(i); y = -0.7 + (p - 0.15) * 2.0; z = r * Math.sin(i); r_c = 0.8; g_c = 0.6; b_c = 0.4; }
        else if (p < 0.85) { const r = 0.15; const ang = Math.floor(i % 6) * (Math.PI / 3); x = r * Math.cos(ang); y = -0.5 + (p - 0.25) * 2.0; z = r * Math.sin(ang); }
        else { const r = 0.15; x = r * Math.cos(i); y = 0.7 + Math.random() * 0.2; z = r * Math.sin(i); r_c = 1.0; g_c = 0.6; b_c = 0.7; }
        return { x, y, z, r: r_c, g: g_c, b: b_c };
    },
    lightbulb: (i, p) => ({ x: Math.sin(i), y: Math.cos(i), z: Math.sin(i * 2), r: 1, g: 1, b: 0 }),
    thumbsup: (i, p) => {
        let x, y, z, r_c = 1.0, g_c = 0.8, b_c = 0.1;
        if (p < 0.2) {
            x = -0.1 + Math.random() * 0.1; y = 0.2 + Math.random() * 0.5; z = Math.random() * 0.1;
        } else if (p < 0.8) {
            const f = Math.floor((p - 0.2) / 0.15); const fy = 0.1 - f * 0.15; const angle = (i % 100) / 100 * Math.PI;
            x = 0.1 + 0.3 * Math.cos(angle); y = fy + Math.random() * 0.05; z = 0.15 * Math.sin(angle);
        } else {
            x = Math.random() * 0.3; y = -0.3 + Math.random() * 0.3; z = Math.random() * 0.2;
        }
        return { x, y, z, r: r_c, g: g_c, b: b_c };
    },
    flag: (i, p) => {
        // Placeholder for flat flag, actual colors set dynamically
        const cols = 80;
        const c = i % cols;
        const x = (c / cols) * 1.5 - 0.75;
        // Approximate rows based on 5000 particles
        const rows = 5000 / cols;
        const r = Math.floor(i / cols);
        const y = (r / rows) * 1.0 - 0.5;
        const z = Math.sin(x * 3.0) * 0.1;
        return { x, y, z, r: 1, g: 1, b: 1 };
    },
    book: (i, p) => {
        let side = (i % 2 === 0) ? 1 : -1; let w = Math.random() * 0.6; let h = (Math.random() - 0.5) * 0.9;
        let x = side * (0.05 + w); let y = h; let z = Math.sin(w * 2.5) * 0.2;
        let r_c = 0.95, g_c = 0.95, b_c = 0.95; if (Math.abs(h) > 0.4 || w > 0.58) { r_c = 0.1; g_c = 0.3; b_c = 0.8; }
        return { x, y, z, r: r_c, g: g_c, b: b_c };
    },
    orb: (i, p) => {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const r = 0.9 + Math.random() * 0.1;
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        return { x, y, z, r: 0.17, g: 0.83, b: 0.75 }; // Default Ed Teal
    }
};

const EdShapeParticles = ({
    type = 'orb',
    countryCode,
    size = 40,
    animated = true,
    shape
}: EdShapeParticlesProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const particlesRef = useRef<THREE.Points | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // 1. Setup Scene
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
        camera.position.z = 2.5; // Closer for small widget

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(size, size);
        containerRef.current.innerHTML = ''; // Clear previous
        containerRef.current.appendChild(renderer.domElement);

        // 2. Setup Particles
        const particlesCount = 2000; // Reduced count for small icon performance
        const particlesGeometry = new THREE.BufferGeometry();
        const posArray = new Float32Array(particlesCount * 3);
        const reactionPosArray = new Float32Array(particlesCount * 3);
        const reactionColorArray = new Float32Array(particlesCount * 3);

        // Initial Layout (Orb)
        for (let i = 0; i < particlesCount; i++) {
            const d = SHAPE_GENERATORS.orb(i, i / particlesCount);
            posArray[i * 3] = d.x; posArray[i * 3 + 1] = d.y; posArray[i * 3 + 2] = d.z;
            reactionPosArray[i * 3] = d.x; reactionPosArray[i * 3 + 1] = d.y; reactionPosArray[i * 3 + 2] = d.z;
            reactionColorArray[i * 3] = d.r; reactionColorArray[i * 3 + 1] = d.g; reactionColorArray[i * 3 + 2] = d.b;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        particlesGeometry.setAttribute('reactionPos', new THREE.BufferAttribute(reactionPosArray, 3));
        particlesGeometry.setAttribute('reactionColor', new THREE.BufferAttribute(reactionColorArray, 3));

        const vertexShader = `
            uniform float u_time;
            uniform float u_reaction_mix;
            attribute vec3 reactionPos;
            attribute vec3 reactionColor;
            varying vec3 vColor;
            void main() {
                vec3 finalPos = mix(position, reactionPos, u_reaction_mix);
                vColor = mix(vec3(0.17, 0.83, 0.75), reactionColor, u_reaction_mix);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPos, 1.0);
                gl_PointSize = 2.0;
            }
        `;
        const fragmentShader = `
            varying vec3 vColor;
            void main() {
                if(length(gl_PointCoord - vec2(0.5)) > 0.5) discard;
                gl_FragColor = vec4(vColor, 0.9);
            }
        `;

        const uniforms = {
            u_time: { value: 0.0 },
            u_reaction_mix: { value: 0.0 }
        };

        const material = new THREE.ShaderMaterial({
            uniforms, vertexShader, fragmentShader, transparent: true
        });

        const particleSystem = new THREE.Points(particlesGeometry, material);
        particlesRef.current = particleSystem;
        scene.add(particleSystem);

        // 3. Animation Loop
        const clock = new THREE.Clock();
        let frameId: number;

        const animate = () => {
            frameId = requestAnimationFrame(animate);
            const time = clock.getElapsedTime();
            uniforms.u_time.value = time;

            // Auto-morph logic (simplified for React prop based control)
            // If we have a target shape, we morph to it (mix = 1.0)
            const targetMix = (shape || type !== 'orb') ? 1.0 : 0.0;
            uniforms.u_reaction_mix.value += (targetMix - uniforms.u_reaction_mix.value) * 0.05;

            particleSystem.rotation.y += 0.01;
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            cancelAnimationFrame(frameId);
            renderer.dispose();
            material.dispose();
            particlesGeometry.dispose();
        };
    }, [size]); // Init only on size change

    // 4. Handle Shape Updates (React Prop Changes)
    useEffect(() => {
        if (!particlesRef.current) return;

        const geometry = particlesRef.current.geometry;
        const posAttr = geometry.attributes.reactionPos as THREE.BufferAttribute;
        const colAttr = geometry.attributes.reactionColor as THREE.BufferAttribute;
        const pos = posAttr.array as Float32Array;
        const col = colAttr.array as Float32Array;
        const count = posAttr.count;

        let generator = SHAPE_GENERATORS.orb;
        let targetShapeKey = shape;

        // Map Props to Shape Keys
        if (targetShapeKey && SHAPE_GENERATORS[targetShapeKey]) {
            generator = SHAPE_GENERATORS[targetShapeKey];
        } else if (type === 'flag') {
            generator = SHAPE_GENERATORS.flag;
        } else if (type === 'thinking') {
            generator = SHAPE_GENERATORS.lightbulb;
        }

        // Generate Target Positions
        for (let i = 0; i < count; i++) {
            const d = generator(i, i / count);
            pos[i * 3] = d.x; pos[i * 3 + 1] = d.y; pos[i * 3 + 2] = d.z;

            // Special Color Handling for Flags
            if (type === 'flag' && countryCode) {
                // Simplified Flag Coloring Logic (from demo.html)
                const cols = 80; const c = i % cols; const xPct = c / cols;
                let r = 1, g = 1, b = 1;
                // Add more flags as needed from demo.html logic
                if (countryCode === 'fr-FR' || countryCode === 'fr') {
                    if (xPct < 0.33) { r = 0; g = 0.1; b = 0.6; } else if (xPct < 0.66) { r = 1; g = 1; b = 1; } else { r = 0.9; g = 0.1; b = 0.1; }
                } else if (countryCode === 'pl-PL' || countryCode === 'pl') {
                    const row = Math.floor(i / cols); const yPct = row / (count / cols);
                    if (yPct < 0.5) { r = 0.9; g = 0.1; b = 0.1; } else { r = 1; g = 1; b = 1; }
                } else if (countryCode === 'en-GB' || countryCode === 'gb') {
                    const row = Math.floor(i / cols); const yPct = row / (count / cols);
                    if (Math.abs(xPct - 0.5) < 0.1 || Math.abs(yPct - 0.5) < 0.1) { r = 0.9; g = 0.1; b = 0.1; } else { r = 0.1; g = 0.2; b = 0.6; }
                }
                col[i * 3] = r; col[i * 3 + 1] = g; col[i * 3 + 2] = b;
            } else {
                col[i * 3] = d.r; col[i * 3 + 1] = d.g; col[i * 3 + 2] = d.b;
            }
        }

        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;

    }, [type, countryCode, shape]);

    return <div ref={containerRef} style={{ width: size, height: size }} />;
};

export { EdShapeParticles };
