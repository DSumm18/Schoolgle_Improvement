"use client";

import { motion } from "framer-motion";

/**
 * Schoolgle Animated Planet Logo
 * - Infinite, seamless rotation
 * - Central wordmark uses currentColor (auto light/dark)
 * - Planets retain fixed colours
 * - No visible orbit rings
 * - Optimised for hero, header, loaders, and video capture
 */

// ✅ PLANETS MATCH ORIGINAL SVG SIZES - Consistent across all assets
// ✅ SOLAR SYSTEM PHYSICS - Inner planets orbit faster (like real solar system)
// Planets orbit around center "Schoolgle" like planets around the sun
const planets = [
  { name: "HR",         color: "#ADD8E6", size: 12, duration: 12, radius: 70,  start: 35 },    // Inner - fastest
  { name: "Finance",    color: "#FFAA4C", size: 14, duration: 18, radius: 90,  start: 120 },  // Fast
  { name: "Estates",    color: "#00D4D4", size: 16, duration: 25, radius: 110, start: 210 },  // Medium-fast
  { name: "Compliance", color: "#E6C3FF", size: 14, duration: 32, radius: 130, start: 300 },  // Medium
  { name: "Teaching",   color: "#FFB6C1", size: 16, duration: 40, radius: 150, start: 20 },   // Medium-slow
  { name: "SEND",       color: "#98FF98", size: 14, duration: 55, radius: 170, start: 95 },   // Slow
  { name: "Governance", color: "#FFD700", size: 18, duration: 75, radius: 190, start: 335 }  // Outer - slowest
];

interface SchoolgleAnimatedLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export default function SchoolgleAnimatedLogo({ 
  size = 520, 
  className = "",
  showText = true 
}: SchoolgleAnimatedLogoProps) {
  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Central Wordmark */}
      {showText && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <span 
            className="text-5xl md:text-6xl font-semibold tracking-tight" 
            style={{ color: "currentColor" }}
          >
            Schoolgle
          </span>
        </div>
      )}

      {/* Orbiting Planets - Solar System Physics */}
      {planets.map((planet) => (
        <motion.div
          key={planet.name}
          className="absolute will-change-transform"
          style={{ 
            width: planet.radius * 2, 
            height: planet.radius * 2,
            left: '50%',
            top: '50%',
            marginLeft: -planet.radius,
            marginTop: -planet.radius,
            transformOrigin: `${planet.radius}px ${planet.radius}px`
          }}
          initial={{ rotate: planet.start }}
          animate={{ rotate: planet.start + 360 }}
          transition={{
            duration: planet.duration,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {/* Planet positioned at top of orbit circle */}
          <motion.div
            className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
            style={{
              width: planet.size,
              height: planet.size,
              backgroundColor: planet.color,
              boxShadow: `0 2px 4px rgba(0,0,0,0.1)`
            }}
            whileHover={{ scale: 1.25, zIndex: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            title={planet.name}
          />
        </motion.div>
      ))}
    </div>
  );
}

/**
 * ✅ Usage Examples
 * 
 * // Hero Section
 * <div className="text-gray-900 dark:text-white flex items-center justify-center min-h-screen">
 *   <SchoolgleAnimatedLogo size={560} />
 * </div>
 * 
 * // Header (smaller)
 * <SchoolgleAnimatedLogo size={200} showText={false} />
 * 
 * // Loading Screen
 * <div className="flex items-center justify-center h-screen">
 *   <SchoolgleAnimatedLogo size={300} />
 * </div>
 * 
 * Features:
 * - Text auto-switches via currentColor (light/dark mode)
 * - Planets always remain coloured
 * - Animation never pauses or resets
 * - Responsive sizing
 * - Hover effects on planets
 * - Accessible (title attributes)
 */

