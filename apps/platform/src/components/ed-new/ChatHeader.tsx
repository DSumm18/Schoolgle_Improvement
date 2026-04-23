/**
 * Chat Header Component
 *
 * Header bar with Ed icon, name, module context dot, and action buttons.
 */

'use client';

import React from 'react';
import { useEd, getModuleColour } from './EdContext';

export interface ChatHeaderProps {
  onClose?: () => void;
  className?: string;
}

export function ChatHeader({ onClose, className = '' }: ChatHeaderProps) {
  const { mode, setMode, currentModule } = useEd();

  const isInspection = mode === 'inspection';
  const moduleColor = getModuleColour(currentModule);

  const handleToggleInspection = () => {
    setMode(isInspection ? 'normal' : 'inspection');
  };

  return (
    <div
      className={`
        flex items-center justify-between px-4 py-3
        ${isInspection ? 'bg-slate-800' : 'bg-[#0A1128]'}
        text-white
        ${className}
      `}
    >
      {/* Left side: Ed icon and name */}
      <div className="flex items-center gap-3">
        <img
          src="/ed/core/ed-micro.svg"
          alt="Ed"
          width={28}
          height={28}
          className="rounded-full bg-white/10 p-0.5"
        />
        <div>
          <h2 className="font-semibold text-base leading-tight">Ed</h2>
          {isInspection && (
            <span className="text-[10px] text-slate-400 font-medium tracking-wide">
              INSPECTION MODE
            </span>
          )}
        </div>
      </div>

      {/* Right side: Module dot and actions */}
      <div className="flex items-center gap-3">
        {/* Module context dot */}
        {currentModule && (
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: moduleColor }}
            title={`Module: ${currentModule}`}
          />
        )}

        {/* Inspection mode toggle */}
        <button
          onClick={handleToggleInspection}
          className={`
            p-1.5 rounded transition-colors duration-200
            ${isInspection
              ? 'bg-blue-600 text-white'
              : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white'
            }
          `}
          title={isInspection ? 'Exit inspection mode' : 'Enter inspection mode'}
          aria-label={isInspection ? 'Exit inspection mode' : 'Enter inspection mode'}
        >
          {/* Shield icon for inspection mode */}
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </button>

        {/* Minimize button */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors duration-200"
            title="Minimize"
            aria-label="Minimize chat"
          >
            <svg
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 15l-6-6-6 6" />
            </svg>
          </button>
        )}

        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors duration-200"
            title="Close"
            aria-label="Close chat"
          >
            <svg
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
