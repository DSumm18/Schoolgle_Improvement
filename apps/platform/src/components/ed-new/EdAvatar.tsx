/**
 * Ed Avatar Component
 *
 * Displays Ed's face with the appropriate SVG based on state and mode.
 */

'use client';

import React from 'react';
import Image from 'next/image';
import { getEdAvatarPath } from './EdContext';

export interface EdAvatarProps {
  state: 'idle' | 'thinking' | 'speaking' | 'success' | 'error';
  mode: 'normal' | 'inspection';
  size?: number;
  className?: string;
  alt?: string;
}

export function EdAvatar({
  state,
  mode,
  size = 32,
  className = '',
  alt = 'Ed the owl',
}: EdAvatarProps) {
  const avatarPath = getEdAvatarPath(state, mode);

  return (
    <Image
      src={avatarPath}
      alt={alt}
      width={size}
      height={size}
      className={className}
      unoptimized
    />
  );
}

/**
 * Micro avatar for chat headers (uses ed-micro.svg)
 */
export function EdMicroAvatar({ className = '' }: { className?: string }) {
  return (
    <img
      src="/ed/core/ed-micro.svg"
      alt="Ed"
      className={className}
      width={24}
      height={24}
    />
  );
}

/**
 * Small badge avatar
 */
export function EdBadge({ className = '' }: { className?: string }) {
  return (
    <img
      src="/ed/badges/badge-ed.svg"
      alt="ED"
      className={className}
      width={20}
      height={20}
    />
  );
}
