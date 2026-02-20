'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords,
  Trophy,
  Target,
  Lightbulb,
  ArrowRight,
  CheckCircle,
  XCircle,
  SkipForward,
  Play,
  Star,
} from 'lucide-react';
import { QuestRunner, QuestState, SCAFFOLD_PRESETS } from '@/lib/sim-studio/quest-engine/quest-runner';
import { QuestDef, ScaffoldPreset, ThemePack } from '@/lib/sim-studio/types';

interface QuestRunnerUIProps {
  questDef: QuestDef;
  pupilId: string;
  scaffoldPreset: ScaffoldPreset;
  theme: ThemePack;
  onComplete?: (run: any) => void;
}

export default function QuestRunnerUI({
  questDef,
  pupilId,
  scaffoldPreset,
  theme,
  onComplete,
}: QuestRunnerUIProps) {
  const [runner] = useState(() => new QuestRunner(questDef, pupilId, scaffoldPreset, theme));
  const [state, setState] = useState<QuestState>(runner.getState());
  const [currentAnswer, setCurrentAnswer] = useState<any>(null);
  const [showHint, setShowHint] = useState(false);
  const [hintText, setHintText] = useState<string>('');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'partial';
    message: string;
  } | null>(null);

  const currentItem = runner.getCurrentItem();
  const progress = runner.getProgress();
  const isComplete = runner.isComplete();

  useEffect(() => {
    if (isComplete && onComplete) {
      onComplete(runner.exportRun());
    }
  }, [isComplete]);

  const handleStart = () => {
    runner.startItem();
    setState(runner.getState());
  };

  const handleSubmit = () => {
    if (!currentItem || currentAnswer === null) return;

    const startTime = Date.now();
    const result = runner.submitAttempt(currentAnswer, 30); // 30s default
    setState(runner.getState());

    // Show feedback
    if (result.score >= 80) {
      setFeedback({
        type: 'success',
        message: theme.copy_pack.feedback_messages.success[
          Math.floor(Math.random() * theme.copy_pack.feedback_messages.success.length)
        ],
      });
    } else if (result.score >= 50) {
      setFeedback({
        type: 'partial',
        message: theme.copy_pack.feedback_messages.partial[
          Math.floor(Math.random() * theme.copy_pack.feedback_messages.partial.length)
        ],
      });
    } else {
      setFeedback({
        type: 'error',
        message: theme.copy_pack.ui_strings.incorrect,
      });
    }

    // Clear feedback after 2 seconds
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleHint = () => {
    const hint = runner.requestHint();
    setHintText(hint);
    setShowHint(true);
    setState(runner.getState());
  };

  const handleSkip = () => {
    runner.skipItem();
    setFeedback(null);
    setShowHint(false);
    setCurrentAnswer(null);
    setState(runner.getState());
  };

  const handleNext = () => {
    setFeedback(null);
    setShowHint(false);
    setCurrentAnswer(null);
    runner.startItem();
    setState(runner.getState());
  };

  if (!currentItem && !isComplete) {
    // Quest start screen
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-2xl w-full"
          style={{ backgroundColor: theme.ui_palette.colors.surface }}
        >
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{theme.ui_palette.icons.quest}</div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {questDef.title}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">{questDef.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <Target className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {questDef.items.length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Challenges</div>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {questDef.reward_coins * theme.reward_catalog.coins_multiplier}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">{theme.copy_pack.ui_strings.coins_earned}</div>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <Star className="w-6 h-6 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold text-slate-900 dark:text-white capitalize">
                {questDef.difficulty_level}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Difficulty</div>
            </div>
          </div>

          <button
            onClick={handleStart}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition text-lg flex items-center justify-center gap-2"
          >
            <Play className="w-6 h-6" />
            {theme.copy_pack.ui_strings.quest_start}
          </button>
        </motion.div>
      </div>
    );
  }

  if (isComplete) {
    // Quest complete screen
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {theme.copy_pack.ui_strings.quest_complete}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            You've completed all challenges!
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                {state.totalScore}%
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Total Score</div>
            </div>
            <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
              <div className="text-4xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
                {state.coinsEarned}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {theme.copy_pack.ui_strings.coins_earned}
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
            <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
              <span>Scaffold Used</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {SCAFFOLD_PRESETS[scaffoldPreset].name}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
              <span>Time Spent</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {Math.round(state.telemetry.totalTime / 60)} minutes
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Quest in progress
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{theme.ui_palette.icons.quest}</div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {questDef.title}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Challenge {progress.completed + 1} of {progress.total}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{progress.percentage}%</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Complete</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress.percentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Challenge Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 mb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentItem.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
                {currentItem.task_prompt}
              </h2>

              {/* Sim Player would go here for simulation-based quests */}
              <div className="aspect-video bg-slate-100 dark:bg-slate-700 rounded-lg mb-6 flex items-center justify-center">
                <p className="text-slate-600 dark:text-slate-400">
                  [Simulation placeholder for {currentItem.id}]
                </p>
              </div>

              {/* Hint Panel */}
              <AnimatePresence>
                {showHint && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded"
                  >
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-900 dark:text-yellow-300 mb-1">
                          Hint
                        </p>
                        <p className="text-sm text-yellow-800 dark:text-yellow-400">{hintText}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Feedback */}
              <AnimatePresence>
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`mb-6 p-4 rounded-lg border-l-4 ${
                      feedback.type === 'success'
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                        : feedback.type === 'error'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                        : 'bg-amber-50 dark:bg-amber-900/20 border-amber-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {feedback.type === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : feedback.type === 'error' ? (
                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      ) : (
                        <Target className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      )}
                      <p
                        className={`font-medium ${
                          feedback.type === 'success'
                            ? 'text-green-900 dark:text-green-300'
                            : feedback.type === 'error'
                            ? 'text-red-900 dark:text-red-300'
                            : 'text-amber-900 dark:text-amber-300'
                        }`}
                      >
                        {feedback.message}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleHint}
                  disabled={state.items[state.currentItemIndex]?.hintsUsed >= SCAFFOLD_PRESETS[scaffoldPreset].hintsAvailable}
                  className="flex-1 py-3 px-6 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Lightbulb className="w-5 h-5" />
                  {theme.copy_pack.ui_strings.hint}
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={currentAnswer === null}
                  className="flex-1 py-3 px-6 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Submit
                </button>

                <button
                  onClick={handleSkip}
                  className="py-3 px-6 bg-slate-500 text-white font-semibold rounded-lg hover:bg-slate-600 transition flex items-center justify-center gap-2"
                >
                  <SkipForward className="w-5 h-5" />
                  Skip
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Stats Footer */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {state.items[state.currentItemIndex]?.attempts || 0}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Attempts</div>
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {state.items[state.currentItemIndex]?.hintsUsed || 0}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Hints Used</div>
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {Math.round((state.items[state.currentItemIndex]?.timeSpent || 0) / 60)}s
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Time</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
