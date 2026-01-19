"use client";

import { useEffect, useRef } from "react";

export interface OrbitBackgroundProps {
  density?: "sparse" | "medium";
  speed?: "slow" | "medium";
  variant?: "hero" | "footer" | "empty";
  className?: string;
}

/**
 * OrbitBackground - Controlled, subtle orbit dots that support the brand
 *
 * USAGE RULES (from COMPONENT_PORTFOLIO.md):
 * - Hero sections (medium density, positioned behind content)
 * - Footer (sparse density, corner accent)
 * - Empty states (sparse, centered)
 *
 * NOT for global background use on every page.
 *
 * @example
 * // Hero with medium density
 * <OrbitBackground variant="hero" density="medium" speed="slow" />
 *
 * @example
 * // Footer sparse
 * <OrbitBackground variant="footer" density="sparse" speed="slow" />
 *
 * @example
 * // Empty state
 * <OrbitBackground variant="empty" density="sparse" speed="slow" />
 */
export function OrbitBackground({
  density = "sparse",
  speed = "slow",
  variant = "hero",
  className = "",
}: OrbitBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Dot count based on density (sparse: 15-20, medium: 30-40) - reduced for redesign
  const dotCount = density === "sparse" ? 18 : 35;

  // Orbit period based on speed (slow: 90s, medium: 45s) - slowed down
  const orbitPeriod = speed === "slow" ? 90000 : 45000;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get accent color from CSS variable or fallback to brand-accent
    const getAccentColor = () => {
      if (typeof window === 'undefined') return "hsl(215 20% 65% / 0.15)";
      const style = getComputedStyle(canvas);
      const moduleAccent = style.getPropertyValue('--module-accent').trim();
      if (moduleAccent) return `${moduleAccent}26`; // ~15% opacity
      return "hsl(var(--brand-accent) / 0.15)";
    };

    let animationFrameId: number;
    let mouseX = 0;
    let mouseY = 0;
    let dots: Dot[] = [];

    // Position presets based on variant
    const getPosition = (index: number, total: number) => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      switch (variant) {
        case "footer":
          // Bottom corner positioning
          return {
            x: (canvas.width * 0.2) + Math.random() * (canvas.width * 0.6),
            y: (canvas.height * 0.7) + Math.random() * (canvas.height * 0.25),
          };
        case "empty":
          // Centered cluster
          return {
            x: centerX + (Math.random() - 0.5) * canvas.width * 0.4,
            y: centerY + (Math.random() - 0.5) * canvas.height * 0.4,
          };
        case "hero":
        default:
          // Full spread
          return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
          };
      }
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initDots();
    };

    const initDots = () => {
      dots = [];
      for (let i = 0; i < dotCount; i++) {
        const pos = getPosition(i, dotCount);
        dots.push({
          x: pos.x,
          y: pos.y,
          baseX: pos.x,
          baseY: pos.y,
          radius: 1 + Math.random() * 2,
          angle: Math.random() * Math.PI * 2,
          orbitRadius: 40 + Math.random() * 60,
          orbitSpeed: (Math.random() * 0.3 + 0.2) * (Math.PI * 2) / orbitPeriod * 16,
        });
      }
    };

    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const accentColor = getAccentColor();

      dots.forEach((dot) => {
        // Orbit animation
        dot.angle += dot.orbitSpeed;
        const orbitX = Math.cos(dot.angle) * dot.orbitRadius;
        const orbitY = Math.sin(dot.angle) * dot.orbitRadius;

        // Extremely subtle mouse parallax
        const parallaxX = (mouseX - window.innerWidth / 2) * 0.01;
        const parallaxY = (mouseY - window.innerHeight / 2) * 0.01;

        dot.x = dot.baseX + orbitX + parallaxX;
        dot.y = dot.baseY + orbitY + parallaxY;

        // Draw dot with low opacity
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.fillStyle = accentColor;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);
    resize();
    animate(performance.now());

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [dotCount, orbitPeriod, variant]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 z-[1] pointer-events-none ${className}`}
      style={{ mixBlendMode: "screen", opacity: 0.6 }}
    />
  );
}

interface Dot {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  radius: number;
  angle: number;
  orbitRadius: number;
  orbitSpeed: number;
}
