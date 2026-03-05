'use client';

import { cn } from '@/lib/utils';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface BlurFadeProps {
  children: React.ReactNode;
  className?: string;
  variant?: {
    hidden: { filter: string; opacity: number; y: number };
    visible: { filter: string; opacity: number; y: number };
  };
  delay?: number;
  duration?: number;
  offset?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export function BlurFade({
  children,
  className,
  variant,
  delay = 0,
  duration = 0.5,
  offset = 20,
  direction = 'up',
}: BlurFadeProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '0px', amount: 0 });

  const getDirectionVariants = () => {
    const axis = direction === 'left' || direction === 'right' ? 'x' : 'y';
    const sign = direction === 'up' || direction === 'left' ? 1 : -1;

    return {
      hidden: {
        filter: 'blur(8px)',
        opacity: 0,
        [axis]: sign * offset,
      },
      visible: {
        filter: 'blur(0px)',
        opacity: 1,
        [axis]: 0,
      },
    };
  };

  const defaultVariants = getDirectionVariants();

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variant || defaultVariants}
      transition={{
        delay,
        duration,
        ease: 'easeOut',
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
