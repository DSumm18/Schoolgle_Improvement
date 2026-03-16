"use client";

import { motion } from "framer-motion";

/**
 * Proportionally scaled-down replica of SchoolgleAnimatedLogo.
 * Same ratios, same physics — just ~1/6th the size.
 */

// Hero is 520px with radii 70-190. We scale everything by the same factor.
const HERO_SIZE = 520;
const FOOTER_SIZE = 80;
const S = FOOTER_SIZE / HERO_SIZE; // ~0.154

const planets = [
  {
    name: "HR",
    color: "#ADD8E6",
    size: 12 * S,
    duration: 12,
    radius: 70 * S,
    start: 35,
  },
  {
    name: "Finance",
    color: "#FFAA4C",
    size: 14 * S,
    duration: 18,
    radius: 90 * S,
    start: 120,
  },
  {
    name: "Estates",
    color: "#00D4D4",
    size: 16 * S,
    duration: 25,
    radius: 110 * S,
    start: 210,
  },
  {
    name: "Compliance",
    color: "#E6C3FF",
    size: 14 * S,
    duration: 32,
    radius: 130 * S,
    start: 300,
  },
  {
    name: "Teaching",
    color: "#FFB6C1",
    size: 16 * S,
    duration: 40,
    radius: 150 * S,
    start: 20,
  },
  {
    name: "SEND",
    color: "#98FF98",
    size: 14 * S,
    duration: 55,
    radius: 170 * S,
    start: 95,
  },
  {
    name: "Governance",
    color: "#FFD700",
    size: 18 * S,
    duration: 75,
    radius: 190 * S,
    start: 335,
  },
];

export default function SchoolglePlanets({
  collapsed = false,
}: {
  collapsed?: boolean;
}) {
  if (collapsed) {
    return (
      <div className="flex justify-center opacity-40 hover:opacity-70 transition-opacity duration-500">
        <div className="relative" style={{ width: 28, height: 28 }}>
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <span className="text-[6px] font-semibold text-muted-foreground">
              S
            </span>
          </div>
          {planets.slice(0, 4).map((p) => (
            <motion.div
              key={p.name}
              className="absolute will-change-transform"
              style={{
                width: p.radius * 2 * 0.45,
                height: p.radius * 2 * 0.45,
                left: "50%",
                top: "50%",
                marginLeft: -p.radius * 0.45,
                marginTop: -p.radius * 0.45,
                transformOrigin: `${p.radius * 0.45}px ${p.radius * 0.45}px`,
              }}
              initial={{ rotate: p.start }}
              animate={{ rotate: p.start + 360 }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
                style={{
                  width: p.size * 0.6,
                  height: p.size * 0.6,
                  backgroundColor: p.color,
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-0 opacity-50 hover:opacity-80 transition-opacity duration-500">
      <div
        className="relative flex items-center justify-center"
        style={{ width: FOOTER_SIZE, height: FOOTER_SIZE }}
      >
        {/* Central wordmark — same as hero */}
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <span className="text-[9px] font-semibold tracking-tight text-muted-foreground">
            Schoolgle
          </span>
        </div>

        {/* All 7 planets, proportionally scaled */}
        {planets.map((planet) => (
          <motion.div
            key={planet.name}
            className="absolute will-change-transform"
            style={{
              width: planet.radius * 2,
              height: planet.radius * 2,
              left: "50%",
              top: "50%",
              marginLeft: -planet.radius,
              marginTop: -planet.radius,
              transformOrigin: `${planet.radius}px ${planet.radius}px`,
            }}
            initial={{ rotate: planet.start }}
            animate={{ rotate: planet.start + 360 }}
            transition={{
              duration: planet.duration,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
              style={{
                width: planet.size,
                height: planet.size,
                backgroundColor: planet.color,
              }}
              title={planet.name}
            />
          </motion.div>
        ))}
      </div>
      <p className="text-[7px] text-muted-foreground/50 font-medium -mt-1">
        Powered by
      </p>
    </div>
  );
}
