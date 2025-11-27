"use client";

import { motion } from "framer-motion";

/**
 * Schoolgle Loading Spinner
 * - Planets orbiting around center (like solar system)
 * - Uses same planet sizes and colors as logo
 * - Perfect for loading states, data fetching, etc.
 */

// Planets match original SVG sizes and colors
const planets = [
  { name: "HR",         color: "#ADD8E6", size: 10, duration: 1.8, radius: 30 },
  { name: "Finance",    color: "#FFAA4C", size: 12, duration: 2.4, radius: 40 },
  { name: "Estates",    color: "#00D4D4", size: 14, duration: 3.0, radius: 50 },
  { name: "Compliance", color: "#E6C3FF", size: 12, duration: 3.6, radius: 60 },
  { name: "Teaching",   color: "#FFB6C1", size: 14, duration: 4.4, radius: 70 },
  { name: "SEND",       color: "#98FF98", size: 12, duration: 6.0, radius: 80 },
  { name: "Governance", color: "#FFD700", size: 16, duration: 7.5, radius: 90 }
];

interface SchoolgleLoaderProps {
  size?: number;
  className?: string;
  showText?: boolean;
  text?: string;
}

export default function SchoolgleLoader({ 
  size = 160, 
  className = "",
  showText = false,
  text = "Loading..."
}: SchoolgleLoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div 
        className="relative"
        style={{ width: size, height: size }}
      >
        {/* Orbiting Planets */}
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
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{
              duration: planet.duration,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            {/* Planet positioned at top of orbit circle */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
              style={{
                width: planet.size,
                height: planet.size,
                backgroundColor: planet.color,
                boxShadow: `0 2px 4px rgba(0,0,0,0.1)`
              }}
            />
          </motion.div>
        ))}
      </div>
      
      {/* Optional loading text */}
      {showText && (
        <p className="mt-4 text-sm text-gray-500 font-medium">
          {text}
        </p>
      )}
    </div>
  );
}

/**
 * ✅ Usage Examples
 * 
 * // Basic loader
 * <SchoolgleLoader />
 * 
 * // Custom size
 * <SchoolgleLoader size={200} />
 * 
 * // With text
 * <SchoolgleLoader showText text="Loading data..." />
 * 
 * // Full screen loading
 * <div className="flex items-center justify-center min-h-screen">
 *   <SchoolgleLoader size={240} showText text="Preparing your dashboard..." />
 * </div>
 * 
 * // Inline loading
 * <div className="flex items-center gap-3">
 *   <SchoolgleLoader size={40} />
 *   <span>Processing...</span>
 * </div>
 */

