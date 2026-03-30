'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  Settings,
  BookOpen,
  X,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
} from 'lucide-react';
import { AnimationController, setupInputHandlers, AccessibilitySettings } from '@/lib/sim-studio/runtime/blueprint-engine';
import { SimState } from '@/lib/sim-studio/runtime/blueprint-engine';
import { createPlaceValueBlueprint } from '@/lib/sim-studio/blueprints/place-value';

interface SimPlayerProps {
  simId?: string;
  initialMode?: 'teach' | 'pupil' | 'evidence';
  onStateChange?: (state: SimState) => void;
  onComplete?: (result: any) => void;
}

export default function SimPlayer({
  simId = 'place-value-adventure',
  initialMode = 'teach',
  onStateChange,
  onComplete,
}: SimPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<AnimationController | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMode, setCurrentMode] = useState<'teach' | 'pupil' | 'evidence'>(initialMode);
  const [showSettings, setShowSettings] = useState(false);
  const [showTeacherGuide, setShowTeacherGuide] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [accessibility, setAccessibility] = useState<AccessibilitySettings>({
    highContrast: false,
    reducedMotion: false,
    fontSize: 'medium',
    keyboardOnly: false,
    screenReader: false,
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Initialize blueprint once canvas is available
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    console.log('Canvas found, initializing...');

    // Force canvas dimensions
    const displayWidth = 800;
    const displayHeight = 600;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    canvas.width = displayWidth * (window.devicePixelRatio || 1);
    canvas.height = displayHeight * (window.devicePixelRatio || 1);

    // Initialize simulation
    initSimulation();

    return () => {
      if (controllerRef.current) {
        controllerRef.current.stop();
      }
    };
  }, []);

  // Separate function to initialize simulation
  const initSimulation = () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        setInitError('Canvas not available');
        return;
      }

      console.log('Initializing simulation...');

      const blueprint = createPlaceValueBlueprint(800, 600);
      const initialState = blueprint.reset();
      initialState.mode = currentMode;
      initialState.accessibility = accessibility;

      const controller = new AnimationController(
        canvas,
        blueprint,
        initialState,
        {
          width: 800,
          height: 600,
          pixelRatio: window.devicePixelRatio || 1,
          backgroundColor: accessibility.highContrast ? '#ffffff' : '#f8fafc',
          textColor: accessibility.highContrast ? '#000000' : '#1e293b',
          accentColor: '#3b82f6',
        }
      );

      controllerRef.current = controller;
      setupInputHandlers(canvas, controller);

      // Auto-start the simulation
      controller.start();

      setIsPlaying(true);
      setIsInitialized(true);
      setInitError(null);

      console.log('✅ Simulation initialized successfully!');
    } catch (error) {
      console.error('❌ Failed to initialize simulation:', error);
      setInitError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Handle mode changes
  useEffect(() => {
    if (!controllerRef.current) return;

    const state = controllerRef.current.getState();
    state.mode = currentMode;
    controllerRef.current.updateState(state);

    if (onStateChange) {
      onStateChange(state);
    }
  }, [currentMode, onStateChange]);

  // Handle accessibility changes
  useEffect(() => {
    if (!controllerRef.current) return;

    const state = controllerRef.current.getState();
    state.accessibility = accessibility;
    controllerRef.current.updateState(state);
  }, [accessibility]);

  const handlePlayPause = () => {
    if (!controllerRef.current) return;

    if (isPlaying) {
      controllerRef.current.stop();
    } else {
      controllerRef.current.start();
    }

    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    if (!controllerRef.current) return;

    controllerRef.current.reset();
    const state = controllerRef.current.getState();
    state.mode = currentMode;
    state.accessibility = accessibility;
    controllerRef.current.updateState(state);

    if (onStateChange) {
      onStateChange(state);
    }
  };

  const handleModeChange = (mode: 'teach' | 'pupil' | 'evidence') => {
    setCurrentMode(mode);
  };

  const handleAccessibilityChange = (setting: keyof AccessibilitySettings, value: any) => {
    setAccessibility((prev) => ({
      ...prev,
      [setting]: value,
    }));
  };

  const readAloud = (text: string) => {
    if (!soundEnabled || typeof window === 'undefined') return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-lg overflow-hidden">
      {/* Loading/Error Messages */}
      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
          <div className="text-center">
            {initError ? (
              <p className="text-red-400">Error: {initError}</p>
            ) : (
              <div className="space-y-4">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-white">Loading simulation...</p>
                <p className="text-sm text-slate-400">Canvas size: {canvasRef.current ? `${canvasRef.current.width}x${canvasRef.current.height}` : 'waiting...'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: isInitialized ? 'block' : 'none' }}
        aria-label="Place value simulation interactive canvas"
        role="application"
      />

      {/* Debug overlay when initialized */}
      {isInitialized && (
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-2 rounded-lg text-xs text-white z-20">
          <div>Mode: {currentMode}</div>
          <div>Status: {isPlaying ? 'Running' : 'Paused'}</div>
          <div className="text-green-400">● Simulation Active</div>
        </div>
      )}

      {/* Top Controls Bar */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent p-4">
        <div className="flex items-center justify-between">
          {/* Left: Mode Selector */}
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleModeChange('teach')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                currentMode === 'teach'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              👨‍🏫 Teach
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleModeChange('pupil')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                currentMode === 'pupil'
                  ? 'bg-green-500 text-white'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              🎯 Pupil
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleModeChange('evidence')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                currentMode === 'evidence'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              📊 Evidence
            </motion.button>
          </div>

          {/* Right: Controls */}
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => readAloud(currentMode === 'teach' ? 'Teacher mode activated' : 'Pupil mode activated')}
              className="p-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition"
              aria-label="Read instructions"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowTeacherGuide(!showTeacherGuide)}
              className="p-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition"
              aria-label="Teacher guide"
            >
              <BookOpen className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
        <div className="flex items-center justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="p-3 bg-white/20 text-white rounded-full hover:bg-white/30 transition"
            aria-label="Reset simulation"
          >
            <RotateCcw className="w-6 h-6" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePlayPause}
            className="p-4 bg-white text-slate-900 rounded-full hover:bg-white/90 transition shadow-lg"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
          </motion.button>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute top-0 right-0 bottom-0 w-80 bg-white dark:bg-slate-800 shadow-2xl p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Settings
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
              >
                <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            <div className="space-y-6">
              {/* High Contrast */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {accessibility.highContrast ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    High Contrast
                  </span>
                </div>
                <button
                  onClick={() => handleAccessibilityChange('highContrast', !accessibility.highContrast)}
                  className={`w-12 h-6 rounded-full transition ${
                    accessibility.highContrast ? 'bg-blue-500' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transition ${
                      accessibility.highContrast ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Reduced Motion */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    Reduced Motion
                  </span>
                </div>
                <button
                  onClick={() => handleAccessibilityChange('reducedMotion', !accessibility.reducedMotion)}
                  className={`w-12 h-6 rounded-full transition ${
                    accessibility.reducedMotion ? 'bg-blue-500' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transition ${
                      accessibility.reducedMotion ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Font Size */}
              <div>
                <label className="text-sm font-medium text-slate-900 dark:text-white mb-2 block">
                  Font Size
                </label>
                <select
                  value={accessibility.fontSize}
                  onChange={(e) => handleAccessibilityChange('fontSize', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="xlarge">Extra Large</option>
                </select>
              </div>

              {/* Keyboard Mode */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    Keyboard Only
                  </span>
                </div>
                <button
                  onClick={() => handleAccessibilityChange('keyboardOnly', !accessibility.keyboardOnly)}
                  className={`w-12 h-6 rounded-full transition ${
                    accessibility.keyboardOnly ? 'bg-blue-500' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transition ${
                      accessibility.keyboardOnly ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Teacher Guide Panel */}
      <AnimatePresence>
        {showTeacherGuide && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            className="absolute top-0 left-0 bottom-0 w-80 bg-white dark:bg-slate-800 shadow-2xl p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Teacher Guide
              </h3>
              <button
                onClick={() => setShowTeacherGuide(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
              >
                <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Vocabulary */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  Vocabulary
                </h4>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <li>• <strong>Partition:</strong> Splitting a number into hundreds, tens, and ones</li>
                  <li>• <strong>Place value:</strong> The value of a digit based on its position</li>
                  <li>• <strong>Dienes blocks:</strong> Base-10 blocks for representing numbers</li>
                </ul>
              </div>

              {/* Misconceptions */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  Common Misconceptions
                </h4>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                  <li>• Confusing digit value (e.g., thinking 3 in 34 is 3, not 30)</li>
                  <li>• Ignoring zeros as placeholders</li>
                  <li>• Difficulty crossing boundaries (e.g., 99 → 100)</li>
                </ul>
              </div>

              {/* Questions */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  Questions to Ask
                </h4>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <li>• "What is the value of the digit in the tens place?"</li>
                  <li>• "How many hundreds are in this number?"</li>
                  <li>• "Can you show me this number in a different way?"</li>
                </ul>
              </div>

              {/* Keyboard Shortcuts */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  Keyboard Shortcuts
                </h4>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <li>• <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs">R</kbd> Reset simulation</li>
                  <li>• <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs">+/-</kbd> Add/remove ones</li>
                  <li>• <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs">↑/↓</kbd> Add/remove tens</li>
                  <li>• <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs">←/→</kbd> Add/remove hundreds</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
