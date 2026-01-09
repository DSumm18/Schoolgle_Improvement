"use client";

import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';

interface AntigravityBackgroundProps {
    moduleName?: string;
    shape?: 'orb' | 'pencil' | 'shield' | 'document';
}

const MODULE_COLORS: Record<string, string> = {
    default: '#3b82f6',
    hr: '#ADD8E6',
    finance: '#FFAA4C',
    estates: '#00D4D4',
    compliance: '#E6C3FF',
    teaching: '#FFB6C1',
    improvement: '#FFB6C1',
    send: '#98FF98',
    governance: '#FFD700',
};

const SHAPE_GENERATORS: Record<string, (i: number, count: number) => THREE.Vector3> = {
    orb: (i, count) => {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const r = 4 + Math.random() * 0.5;
        return new THREE.Vector3(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
        );
    },
    document: (i, count) => {
        const x = (Math.random() - 0.5) * 4;
        const y = (Math.random() - 0.5) * 6;
        const z = (Math.random() - 0.5) * 0.5;
        // Simple rectangular plate
        return new THREE.Vector3(x, y, z);
    },
    shield: (i, count) => {
        const x = (Math.random() - 0.5) * 4;
        const y = (Math.random() - 0.5) * 5;
        const z = (1 - (x * x) / 8 - (y * y) / 10); // Curved shield
        return new THREE.Vector3(x, y, z);
    },
    pencil: (i, count) => {
        const p = i / count;
        let x, y, z;
        if (p < 0.2) { // Tip
            const r = 0.5 * p / 0.2;
            const angle = Math.random() * Math.PI * 2;
            x = r * Math.cos(angle); y = -3 + p * 5; z = r * Math.sin(angle);
        } else { // Body
            const r = 0.5;
            const angle = Math.random() * Math.PI * 2;
            x = r * Math.cos(angle); y = -2 + p * 8; z = r * Math.sin(angle);
        }
        return new THREE.Vector3(x, y, z);
    }
};

const AntigravityBackground = ({ moduleName, shape = 'orb' }: AntigravityBackgroundProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mouseRef = useRef({ x: 0, y: 0 });
    const { theme } = useTheme();
    const pathname = usePathname();

    // Identify module from URL if not prop-provided
    const activeModule = useMemo(() => {
        if (moduleName) return moduleName.toLowerCase();
        const parts = pathname.split('/');
        if (parts.includes('hr')) return 'hr';
        if (parts.includes('finance')) return 'finance';
        if (parts.includes('estates')) return 'estates';
        if (parts.includes('compliance')) return 'compliance';
        if (parts.includes('teaching')) return 'teaching';
        if (parts.includes('improvement')) return 'improvement';
        if (parts.includes('send')) return 'send';
        if (parts.includes('governance')) return 'governance';
        return 'default';
    }, [moduleName, pathname]);

    const activeColor = useMemo(() => {
        return new THREE.Color(MODULE_COLORS[activeModule] || MODULE_COLORS.default);
    }, [activeModule]);

    useEffect(() => {
        if (!containerRef.current) return;

        // --- Scene Setup ---
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);

        // --- Particles Setup ---
        const particlesCount = 4000;
        const initialPositions = new Float32Array(particlesCount * 3);
        const targetPositions = new Float32Array(particlesCount * 3);
        const velocities = new Float32Array(particlesCount * 3);
        const sizes = new Float32Array(particlesCount);

        for (let i = 0; i < particlesCount; i++) {
            // Random initial distribution
            initialPositions[i * 3] = (Math.random() - 0.5) * 20;
            initialPositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
            initialPositions[i * 3 + 2] = (Math.random() - 0.5) * 10;

            velocities[i * 3 + 1] = Math.random() * 0.02 + 0.01; // Constant upward drift (Liftoff)
            sizes[i] = Math.random() * 2 + 1;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(initialPositions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Custom Shader for "Antigravity" look
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uColor: { value: activeColor },
                uTime: { value: 0 },
                uMouse: { value: new THREE.Vector2(0, 0) },
                uOpacity: { value: theme === 'dark' ? 0.6 : 0.3 },
            },
            vertexShader: `
        uniform float uTime;
        uniform vec2 uMouse;
        attribute float size;
        varying float vOpacity;

        void main() {
          vec3 pos = position;
          
          // Mouse displacement
          float dist = distance(pos.xy, uMouse * 10.0);
          if (dist < 3.0) {
            vec2 dir = normalize(pos.xy - uMouse * 10.0);
            pos.xy += dir * (3.0 - dist) * 0.5;
          }

          // Subtle float animation
          pos.y += sin(uTime + pos.x) * 0.1;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (10.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
          vOpacity = 1.0 - (dist / 10.0);
        }
      `,
            fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying float vOpacity;

        void main() {
          // Circle particles
          if (length(gl_PointCoord - vec2(0.5)) > 0.5) discard;
          gl_FragColor = vec4(uColor, uOpacity * clamp(vOpacity, 0.2, 1.0));
        }
      `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });

        const points = new THREE.Points(geometry, material);
        scene.add(points);

        // --- Target Positions for Morphing ---
        const updateTargetPositions = (shapeKey: string) => {
            const generator = SHAPE_GENERATORS[shapeKey] || SHAPE_GENERATORS.orb;
            for (let i = 0; i < particlesCount; i++) {
                const target = generator(i, particlesCount);
                targetPositions[i * 3] = target.x;
                targetPositions[i * 3 + 1] = target.y;
                targetPositions[i * 3 + 2] = target.z;
            }
        };

        updateTargetPositions(shape);

        // --- Interaction ---
        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
            mouseRef.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
        };

        window.addEventListener('mousemove', handleMouseMove);

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        // --- Animation Loop ---
        const clock = new THREE.Clock();
        let animationId: number;

        const animate = () => {
            const elapsedTime = clock.getElapsedTime();
            material.uniforms.uTime.value = elapsedTime;
            material.uniforms.uMouse.value.set(mouseRef.current.x, mouseRef.current.y);

            const positions = geometry.attributes.position.array as Float32Array;

            for (let i = 0; i < particlesCount; i++) {
                // Morph towards target
                positions[i * 3] += (targetPositions[i * 3] - positions[i * 3]) * 0.02;
                positions[i * 3 + 1] += (targetPositions[i * 3 + 1] - positions[i * 3 + 1]) * 0.02;
                positions[i * 3 + 2] += (targetPositions[i * 3 + 2] - positions[i * 3 + 2]) * 0.02;

                // Subtle displacement animation on the target itself for liftoff feel
                targetPositions[i * 3 + 1] += 0.002;
                if (targetPositions[i * 3 + 1] > 8) targetPositions[i * 3 + 1] = -8;
            }
            geometry.attributes.position.needsUpdate = true;

            material.uniforms.uColor.value.lerp(activeColor, 0.05);

            renderer.render(scene, camera);
            animationId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationId);
            renderer.dispose();
            geometry.dispose();
            material.dispose();
        };
    }, [activeColor, theme]);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 -z-20 pointer-events-none overflow-hidden bg-background"
            style={{ filter: 'blur(0.5px)' }}
        />
    );
};

export default AntigravityBackground;
