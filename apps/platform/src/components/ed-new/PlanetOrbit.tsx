/**
 * Planet Orbit Component
 *
 * 7 coloured dots orbiting around Ed — representing the 7 modules.
 * Mercury through Uranus with their astronomical colours.
 */

'use client';

import React from 'react';
import { getModuleColour } from './EdContext';

// Planet colours (Mercury through Uranus)
const PLANET_COLOURS = [
  '#6B7280', // Mercury - gray
  '#F59E0B', // Venus - amber
  '#3B82F6', // Earth - blue
  '#EF4444', // Mars - red
  '#F97316', // Jupiter - orange
  '#A78BFA', // Saturn - purple/violet
  '#06B6D4', // Uranus - cyan
];

export interface PlanetOrbitProps {
  paused?: boolean;
  size?: number;
  orbitRadius?: number;
  dotSize?: number;
  className?: string;
}

export function PlanetOrbit({
  paused = false,
  size = 56,
  orbitRadius = 36,
  dotSize = 6,
  className = '',
}: PlanetOrbitProps) {
  const center = size / 2;

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`} style={{ width: size, height: size }}>
      {/* Planet dots orbiting */}
      {PLANET_COLOURS.map((color, i) => {
        // Calculate position on the orbit
        const angle = (i / PLANET_COLOURS.length) * 2 * Math.PI - Math.PI / 2;
        const x = center + Math.cos(angle) * orbitRadius - dotSize / 2;
        const y = center + Math.sin(angle) * orbitRadius - dotSize / 2;

        return (
          <div
            key={i}
            className="absolute rounded-full transition-colors duration-300"
            style={{
              left: x,
              top: y,
              width: dotSize,
              height: dotSize,
              backgroundColor: color,
              animation: paused ? 'none' : `orbit-rotate 20s linear infinite`,
              animationDelay: `${i * -2.86}s`, // Distribute evenly
            }}
          />
        );
      })}

      {/* Inline keyframes for orbit animation */}
      <style jsx>{`
        @keyframes orbit-rotate {
          from {
            transform: rotate(0deg) translateX(${orbitRadius}px) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(${orbitRadius}px) rotate(-360deg);
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Module context dot — shows current module colour
 */
export function ModuleDot({
  module,
  size = 8,
  className = '',
}: {
  module: string | null;
  size?: number;
  className?: string;
}) {
  const color = getModuleColour(module);

  return (
    <div
      className={`rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
      }}
      title={module || 'General'}
    />
  );
}
