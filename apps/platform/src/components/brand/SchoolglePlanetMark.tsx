import React from "react";

const MODULE_COLOURS = [
  "#ADD8E6", // HR
  "#FFAA4C", // Finance
  "#00D4D4", // Estates
  "#E6C3FF", // Compliance
  "#FFB6C1", // Teaching
  "#98FF98", // SEND
  "#FFD700", // Governance
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
