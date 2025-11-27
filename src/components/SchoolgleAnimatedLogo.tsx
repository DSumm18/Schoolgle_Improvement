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

// ✅ TIGHTENED ORBITS — matches the compact look you approved
// All 7 planets remain visible and close to the wordmark
const planets = [
  { name: "HR",         color: "#ADD8E6", size: 11, duration: 18, radius: 70,  start: 35 },
  { name: "Finance",    color: "#FFAA4C", size: 12, duration: 24, radius: 90,  start: 120 },
  { name: "Estates",    color: "#00D4D4", size: 14, duration: 30, radius: 110, start: 210 },
  { name: "Compliance", color: "#E6C3FF", size: 12, duration: 36, radius: 130, start: 300 },
  { name: "Teaching",   color: "#FFB6C1", size: 14, duration: 44, radius: 150, start: 20 },
  { name: "SEND",       color: "#98FF98", size: 12, duration: 60, radius: 170, start: 95 },
  { name: "Governance", color: "#FFD700", size: 16, duration: 75, radius: 190, start: 335 }
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

      {/* Orbiting Planets */}
      {planets.map((planet) => (
        <motion.div
          key={planet.name}
          className="absolute inset-0 m-auto will-change-transform"
          style={{ width: planet.radius * 2, height: planet.radius * 2 }}
          initial={{ rotate: planet.start }}
          animate={{ rotate: planet.start + 360 }}
          transition={{
            duration: planet.duration,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <motion.div
            className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
            style={{
              width: planet.size,
              height: planet.size,
              backgroundColor: planet.color
            }}
            whileHover={{ scale: 1.15 }}
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

