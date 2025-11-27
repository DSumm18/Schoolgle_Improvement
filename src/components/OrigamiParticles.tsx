"use client";

import { useEffect, useRef } from 'react';

interface OrigamiParticlesProps {
    text?: string;
    opacity?: number;
}

const OrigamiParticles = ({ text = "Schoolgle", opacity = 0.25 }: OrigamiParticlesProps) => {
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

        // Generate target points from text
        const initTargets = () => {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            if (!tempCtx) return;
            
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;

            const fontSize = Math.min(canvas.width / 8, 150);
            tempCtx.font = `700 ${fontSize}px system-ui, -apple-system, sans-serif`;
            tempCtx.fillStyle = 'white';
            tempCtx.textAlign = 'center';
            tempCtx.textBaseline = 'middle';
            tempCtx.fillText(text, canvas.width / 2, canvas.height / 2);

            const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height).data;
            targets = [];

            const step = 10;
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

            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 1;
                this.vy = (Math.random() - 0.5) * 1;
                this.size = Math.random() * 2 + 1;
                this.color = `rgba(20, 20, 40, ${Math.random() * opacity + opacity})`;
                this.target = targets.length > 0 ? targets[Math.floor(Math.random() * targets.length)] : null;
                this.maxSpeed = 2;
                this.maxForce = 0.05;
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

                if (dist < 150 && dist > 0) {
                    const force = (150 - dist) / 150;
                    return {
                        x: (dX / dist) * force * 1,
                        y: (dY / dist) * force * 1
                    };
                }
                return { x: 0, y: 0 };
            }

            draw() {
                if (!ctx) return;
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(Math.atan2(this.vy, this.vx) + Math.PI / 2);

                // Draw Origami Crane (Stylized)
                ctx.beginPath();
                ctx.moveTo(0, -this.size * 1.5);
                ctx.lineTo(this.size * 1.2, 0);
                ctx.lineTo(0, this.size * 0.8);
                ctx.lineTo(-this.size * 1.2, 0);
                ctx.closePath();

                ctx.fillStyle = this.color;
                ctx.fill();

                // Central fold line
                ctx.beginPath();
                ctx.moveTo(0, -this.size * 1.5);
                ctx.lineTo(0, this.size * 0.8);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 0.5;
                ctx.stroke();

                ctx.restore();
            }
        }

        const initParticles = () => {
            particles = [];
            const count = Math.max(targets.length, 400);
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
    }, [text, opacity]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0 pointer-events-none"
        />
    );
};

export default OrigamiParticles;

