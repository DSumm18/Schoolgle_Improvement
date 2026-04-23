import React from "react";

/**
 * Schoolgle Planet Mark — 7 Planets Orbiting the Sun (School)
 *
 * Solar System Order (counter-clockwise from top):
 * 1. Mercury (Gray) → School Improvement
 * 2. Venus (Amber) → Governance
 * 3. Earth (Blue) → Business Operations
 * 4. Mars (Red) → Compliance & Safeguarding
 * 5. Jupiter (Orange) → Communications
 * 6. Saturn (Gold) → Schoolgle Intelligence
 * 7. Uranus (Cyan) → Teaching & Learning
 *
 * Central Sun (Amber) represents the school at the center of all modules
 */
const MODULE_COLOURS = [
  "#6B7280", // Mercury - School Improvement (Gray)
  "#F59E0B", // Venus - Governance (Gold/Amber)
  "#3B82F6", // Earth - Business Operations (Blue)
  "#EF4444", // Mars - Compliance & Safeguarding (Red)
  "#F97316", // Jupiter - Communications (Orange)
  "#A78BFA", // Saturn - Schoolgle Intelligence (Purple) - NOT gold (avoids yellow duplication)
  "#06B6D4", // Uranus - Teaching & Learning (Cyan)
];

interface SchoolglePlanetMarkProps {
  size?: number;
  className?: string;
}

const SchoolglePlanetMark = ({
  size = 32,
  className,
}: SchoolglePlanetMarkProps) => {
  const cx = size / 2;
  const cy = size / 2;
  const orbitR = size * 0.34;
  const dotR = size * 0.065;
  const sunR = size * 0.1;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      aria-label="Schoolgle"
      role="img"
    >
      {/* Central sun */}
      <circle cx={cx} cy={cy} r={sunR} fill="#f59e0b" />
      {/* Module planets evenly spaced */}
      {MODULE_COLOURS.map((colour, i) => {
        const angle = (2 * Math.PI * i) / MODULE_COLOURS.length - Math.PI / 2;
        const px = cx + orbitR * Math.cos(angle);
        const py = cy + orbitR * Math.sin(angle);
        return <circle key={i} cx={px} cy={py} r={dotR} fill={colour} />;
      })}
    </svg>
  );
};

export default SchoolglePlanetMark;
