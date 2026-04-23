/**
 * Ed Launcher Button
 *
 * Floating button in bottom-right corner with orbiting planet dots.
 * Toggles the chat window open/closed.
 */

'use client';

import React from 'react';
import { useEd } from './EdContext';
import { PlanetOrbit } from './PlanetOrbit';

export interface EdLauncherProps {
  className?: string;
}

export function EdLauncher({ className = '' }: EdLauncherProps) {
  const { isOpen, toggleChat, mode } = useEd();

  const isInspection = mode === 'inspection';
  const buttonColor = isInspection ? '#475569' : '#F59E0B';

  return (
    <button
      onClick={toggleChat}
      className={`
        fixed bottom-6 right-6 z-50
        rounded-full shadow-lg hover:shadow-xl
        transition-all duration-300 ease-out
        hover:scale-105 active:scale-95
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${isInspection ? 'focus:ring-slate-500' : 'focus:ring-amber-500'}
        ${className}
      `}
      style={{
        width: 56,
        height: 56,
        backgroundColor: buttonColor,
      }}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
      aria-expanded={isOpen}
    >
      {/* Orbiting planets */}
      <PlanetOrbit paused={isOpen || isInspection} />

      {/* Ed icon or close X */}
      {isOpen ? (
        // Close X icon
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="relative z-10 mx-auto"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      ) : (
        // Ed chat button icon
        <img
          src="/ed/core/ed-chat-button.svg"
          alt="Ed"
          width={56}
          height={56}
          className="relative z-10"
        />
      )}

      {/* Optional notification badge */}
      {/* <span className="absolute -top-1 -right-1 flex h-4 w-4">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[10px] text-white items-center justify-center font-bold">
          1
        </span>
      </span> */}
    </button>
  );
}
