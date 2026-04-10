"use client";

import { motion } from 'framer-motion';
import Image from 'next/image';
import type { SourceConnectionStatus } from '@/lib/smart-connectors/types';

interface DataSourceNodeProps {
  status: SourceConnectionStatus;
  x: number;
  y: number;
  delay?: number;
  onHover?: (status: SourceConnectionStatus | null) => void;
}

export function DataSourceNode({ status, x, y, delay = 0, onHover }: DataSourceNodeProps) {
  const { source, connected, rowCount } = status;

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay, type: 'spring', stiffness: 200 }}
      onMouseEnter={() => onHover?.(status)}
      onMouseLeave={() => onHover?.(null)}
      style={{ cursor: 'pointer' }}
    >
      <rect
        x={x - 32}
        y={y - 32}
        width={64}
        height={64}
        rx={14}
        fill={connected ? `${source.colour}15` : '#18181b'}
        stroke={connected ? source.colour : '#27272a'}
        strokeWidth={connected ? 2 : 1}
      />
      <foreignObject x={x - 20} y={y - 22} width={40} height={26}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Image src={source.logo} alt={source.name} width={20} height={20} style={{ borderRadius: 4 }} />
        </div>
      </foreignObject>
      <text
        x={x}
        y={y + 16}
        textAnchor="middle"
        fill={connected ? '#e4e4e7' : '#71717a'}
        fontSize={9}
        fontWeight={600}
      >
        {source.name}
      </text>
      {connected && rowCount > 0 && (
        <text x={x} y={y + 26} textAnchor="middle" fill="#71717a" fontSize={7}>
          {rowCount.toLocaleString()} rows
        </text>
      )}
      <circle
        cx={x + 26}
        cy={y - 26}
        r={5}
        fill={connected ? '#10b981' : '#52525b'}
        stroke="#0a0a0f"
        strokeWidth={2}
      />
    </motion.g>
  );
}
