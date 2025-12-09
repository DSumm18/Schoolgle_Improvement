"use client";

import { useEffect, useRef } from 'react';

type ShapeType = 'crane' | 'shield' | 'house' | 'heart' | 'hexagon' | 'person';

interface OrigamiParticlesProps {
    text?: string;
    opacity?: number;
    shape?: ShapeType;
    position?: 'center' | 'top-left' | 'top-center' | 'bottom-center';
    size?: 'small' | 'medium' | 'large';
}

const OrigamiParticles = ({ 
    text = "Schoolgle", 
    opacity = 0.25,
    shape = 'crane',
    position = 'center',
    size = 'medium'
}: OrigamiParticlesProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        let animationFrameId: number;
        let particles: Particle[] = [];
        let targets: { x: number; y: number }[] = [];

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initTargets();
        };

        const initTargets = () => {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            if (!tempCtx) return;
            
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;

            // Size-based font scaling
            const sizeMultiplier = {
                small: 0.08,
                medium: 0.12,
                large: 0.16
            };
            const fontSize = Math.min(canvas.width * sizeMultiplier[size], size === 'large' ? 250 : size === 'medium' ? 180 : 120);
            
            tempCtx.font = `700 ${fontSize}px system-ui, -apple-system, sans-serif`;
            tempCtx.fillStyle = 'white';
            tempCtx.textAlign = 'center';
            tempCtx.textBaseline = 'middle';
            
            // Position-based text placement
            let textX: number, textY: number;
            switch (position) {
                case 'top-left':
                    tempCtx.textAlign = 'left';
                    tempCtx.textBaseline = 'top';
                    textX = canvas.width * 0.08;
                    textY = canvas.height * 0.12;
                    break;
                case 'top-center':
                    textX = canvas.width / 2;
                    textY = canvas.height * 0.15;
                    break;
                case 'bottom-center':
                    textX = canvas.width / 2;
                    textY = canvas.height * 0.85;
                    break;
                default: // center
                    textX = canvas.width / 2;
                    textY = canvas.height / 2;
            }
            
            tempCtx.fillText(text, textX, textY);

            const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height).data;
            targets = [];

            const step = 8;
            for (let y = 0; y < canvas.height; y += step) {
                for (let x = 0; x < canvas.width; x += step) {
                    const alpha = imageData[(y * canvas.width + x) * 4 + 3];
                    if (alpha > 128) {
                        targets.push({ x, y });
                    }
                }
            }

            initParticles();
        };

        // Draw different origami shapes
        const drawShape = (ctx: CanvasRenderingContext2D, size: number, color: string, shapeType: ShapeType) => {
            ctx.fillStyle = color;
            ctx.beginPath();

            switch (shapeType) {
                case 'crane':
                    // Origami crane - elegant bird shape
                    ctx.moveTo(0, -size * 1.5);        // Head/beak
                    ctx.lineTo(size * 1.3, 0);         // Right wing
                    ctx.lineTo(size * 0.3, size * 0.5);// Right body
                    ctx.lineTo(0, size * 1.2);         // Tail
                    ctx.lineTo(-size * 0.3, size * 0.5);// Left body
                    ctx.lineTo(-size * 1.3, 0);        // Left wing
                    ctx.closePath();
                    break;

                case 'shield':
                    // Shield shape - for compliance
                    ctx.moveTo(0, -size * 1.2);
                    ctx.lineTo(size, -size * 0.6);
                    ctx.lineTo(size, size * 0.3);
                    ctx.lineTo(0, size * 1.2);
                    ctx.lineTo(-size, size * 0.3);
                    ctx.lineTo(-size, -size * 0.6);
                    ctx.closePath();
                    break;

                case 'house':
                    // House shape - for estates
                    ctx.moveTo(0, -size * 1.4);        // Roof peak
                    ctx.lineTo(size * 1.2, -size * 0.3);// Right roof
                    ctx.lineTo(size * 1.2, size * 1);   // Right wall
                    ctx.lineTo(-size * 1.2, size * 1);  // Bottom
                    ctx.lineTo(-size * 1.2, -size * 0.3);// Left wall
                    ctx.closePath();
                    break;

                case 'heart':
                    // Heart shape - for SEND
                    ctx.moveTo(0, -size * 0.5);
                    ctx.bezierCurveTo(size, -size * 1.5, size * 1.5, 0, 0, size * 1.2);
                    ctx.bezierCurveTo(-size * 1.5, 0, -size, -size * 1.5, 0, -size * 0.5);
                    break;

                case 'hexagon':
                    // Hexagon - for signup/generic
                    for (let i = 0; i < 6; i++) {
                        const angle = (i * Math.PI) / 3 - Math.PI / 6;
                        const px = Math.cos(angle) * size;
                        const py = Math.sin(angle) * size;
                        if (i === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    break;

                case 'person':
                    // Simple person shape - for HR
                    // Head
                    ctx.arc(0, -size * 0.8, size * 0.4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    // Body
                    ctx.moveTo(-size * 0.6, size * 1);
                    ctx.lineTo(-size * 0.3, 0);
                    ctx.lineTo(size * 0.3, 0);
                    ctx.lineTo(size * 0.6, size * 1);
                    ctx.closePath();
                    break;

                default:
                    // Default to crane
                    ctx.moveTo(0, -size * 1.5);
                    ctx.lineTo(size * 1.2, 0);
                    ctx.lineTo(0, size * 0.8);
                    ctx.lineTo(-size * 1.2, 0);
                    ctx.closePath();
            }
            
            ctx.fill();

            // Add fold line for 3D effect (except heart and person)
            if (shapeType !== 'heart' && shapeType !== 'person') {
                ctx.beginPath();
                ctx.moveTo(0, -size * 1.5);
                ctx.lineTo(0, size * 1);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        };

        class Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;
            color: string;
            target: { x: number; y: number } | null;
            maxSpeed: number;
            maxForce: number;
            rotation: number;

            constructor() {
                this.x = Math.random() * (canvas?.width || 800);
                this.y = Math.random() * (canvas?.height || 600);
                this.vx = (Math.random() - 0.5) * 1;
                this.vy = (Math.random() - 0.5) * 1;
                this.size = Math.random() * 2.5 + 1.5;
                this.color = `rgba(25, 25, 45, ${Math.random() * opacity + opacity * 0.8})`;
                this.target = targets.length > 0 ? targets[Math.floor(Math.random() * targets.length)] : null;
            this.maxSpeed = 2.5; // Slightly faster for more dynamic movement
            this.maxForce = 0.08; // Stronger force for more active formation
                this.rotation = Math.random() * Math.PI * 2;
            }

            update(mouse: { x: number; y: number }) {
                const arrive = this.arrive(this.target);
                const mouseRepel = this.repel(mouse);

                this.vx += arrive.x + mouseRepel.x * 5;
                this.vy += arrive.y + mouseRepel.y * 5;

                const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                if (speed > this.maxSpeed) {
                    this.vx = (this.vx / speed) * this.maxSpeed;
                    this.vy = (this.vy / speed) * this.maxSpeed;
                }

                this.x += this.vx;
                this.y += this.vy;
                
                // Rotate based on movement
                this.rotation = Math.atan2(this.vy, this.vx) + Math.PI / 2;
            }

            arrive(target: { x: number; y: number } | null) {
                if (!target) return { x: 0, y: 0 };

                const desiredX = target.x - this.x;
                const desiredY = target.y - this.y;
                const d = Math.sqrt(desiredX * desiredX + desiredY * desiredY);

                if (d === 0) return { x: 0, y: 0 };

                let speed = this.maxSpeed;
                if (d < 100) {
                    speed = (d / 100) * this.maxSpeed;
                }

                const desiredVx = (desiredX / d) * speed;
                const desiredVy = (desiredY / d) * speed;

                const steerX = desiredVx - this.vx;
                const steerY = desiredVy - this.vy;

                const steerLen = Math.sqrt(steerX * steerX + steerY * steerY);
                if (steerLen > this.maxForce) {
                    return {
                        x: (steerX / steerLen) * this.maxForce,
                        y: (steerY / steerLen) * this.maxForce
                    };
                }
                return { x: steerX, y: steerY };
            }

            repel(target: { x: number; y: number }) {
                const dX = this.x - target.x;
                const dY = this.y - target.y;
                const dist = Math.sqrt(dX * dX + dY * dY);

                if (dist < 120 && dist > 0) {
                    const force = (120 - dist) / 120;
                    return {
                        x: (dX / dist) * force * 1.2,
                        y: (dY / dist) * force * 1.2
                    };
                }
                return { x: 0, y: 0 };
            }

            draw() {
                if (!ctx) return;
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                drawShape(ctx, this.size, this.color, shape);
                ctx.restore();
            }
        }

        const initParticles = () => {
            particles = [];
            const count = Math.max(targets.length, 500);
            for (let i = 0; i < count; i++) {
                particles.push(new Particle());
            }

            if (targets.length > 0) {
                particles.forEach((p, i) => {
                    p.target = targets[i % targets.length];
                });
            }
        };

        let mouse = { x: -1000, y: -1000 };

        const animate = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach(particle => {
                particle.update(mouse);
                particle.draw();
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };

        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('mousemove', handleMouseMove);

        resizeCanvas();
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [text, opacity, shape]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-[1] pointer-events-none"
            style={{ mixBlendMode: 'multiply' }}
        />
    );
};

export default OrigamiParticles;
