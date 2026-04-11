"use client";

import { motion } from 'framer-motion';

interface YarnThreadProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  colour: string;
  delay?: number;
  connected: boolean;
}

export function YarnThread({ startX, startY, endX, endY, colour, delay = 0, connected }: YarnThreadProps) {
  const dx = endX - startX;
  const dy = endY - startY;
  const len = Math.sqrt(dx * dx + dy * dy);
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  const offsetX = midX + (-dy / len) * 30;
  const offsetY = midY + (dx / len) * 30;

  const pathD = `M ${startX} ${startY} Q ${offsetX} ${offsetY} ${endX} ${endY}`;

  if (!connected) {
    return (
      <path
        d={pathD}
        stroke="#27272a"
        strokeWidth={1.5}
        fill="none"
        strokeDasharray="4 8"
        opacity={0.3}
      />
    );
  }

  return (
    <g>
      <motion.path
        d={pathD}
        stroke={colour}
        strokeWidth={3}
        fill="none"
        opacity={0.15}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, delay, ease: "easeInOut" }}
      />
      <motion.path
        d={pathD}
        stroke={colour}
        strokeWidth={1.5}
        fill="none"
        strokeDasharray="6 3"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, delay, ease: "easeInOut" }}
      >
        <animate
          attributeName="stroke-dashoffset"
          values="0;-27"
          dur="3s"
          repeatCount="indefinite"
        />
      </motion.path>
      <motion.circle
        cx={endX}
        cy={endY}
        r={3}
        fill={colour}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0.3, 0.8, 0.3], scale: 1 }}
        transition={{
          opacity: { duration: 2, repeat: Infinity, delay },
          scale: { duration: 0.5, delay },
        }}
      />
    </g>
  );
}
