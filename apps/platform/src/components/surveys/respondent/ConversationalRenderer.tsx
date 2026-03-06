"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Send,
  Loader2,
  ArrowRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { QuestionRenderer } from "@/components/surveys/questions/QuestionRenderer";
import type {
  Survey,
  SurveyPage,
  SurveyQuestion,
  SurveyAnswer,
  SurveyLogicRule,
} from "@/lib/surveys/types";
import { evaluateLogic } from "@/lib/surveys/logic-engine";
import { validateAnswer } from "@/lib/surveys/validation-engine";

interface ConversationalRendererProps {
  survey: Survey;
  onSubmit: (answers: Map<string, any>) => Promise<void>;
}

export function ConversationalRenderer({
  survey,
  onSubmit,
}: ConversationalRendererProps) {
  const [currentIndex, setCurrentIndex] = useState(-1); // -1 = welcome
  const [answers, setAnswers] = useState<Map<string, any>>(new Map());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Flatten all questions across pages, filtering hidden ones via logic
  const allQuestions: SurveyQuestion[] = [];
  for (const page of survey.pages || []) {
    const qs = (page as any).survey_questions || page.questions || [];
    for (const q of qs) {
      allQuestions.push(q);
    }
  }

  // Evaluate logic to get visible questions
  const logicRules: SurveyLogicRule[] = (survey as any).logic_rules || [];
  const answerMap = new Map<string, SurveyAnswer>();
  answers.forEach((val, qId) => {
    answerMap.set(qId, {
      id: "",
      response_id: "",
      question_id: qId,
      answer_text: typeof val === "string" ? val : null,
      answer_choices: Array.isArray(val) ? val : null,
      answer_numeric: typeof val === "number" ? val : null,
      answer_date: null,
      answer_json: typeof val === "object" && !Array.isArray(val) ? val : null,
      score: null,
      answered_at: new Date().toISOString(),
    });
  });

  const logicResult = evaluateLogic(logicRules, answerMap);
  const visibleQuestions = allQuestions.filter(
    (q) => !logicResult.hiddenQuestionIds.has(q.id),
  );

  const totalVisible = visibleQuestions.filter(
    (q) => q.question_type !== "statement",
  ).length;
  const answeredCount = visibleQuestions.filter(
    (q) => q.question_type !== "statement" && answers.has(q.id),
  ).length;
  const progressPercent =
    totalVisible > 0 ? Math.round((answeredCount / totalVisible) * 100) : 0;

  const currentQuestion =
    currentIndex >= 0 ? visibleQuestions[currentIndex] : null;
  const isLastQuestion = currentIndex === visibleQuestions.length - 1;

  const handleAnswerChange = useCallback((questionId: string, value: any) => {
    setAnswers((prev) => {
      const next = new Map(prev);
      next.set(questionId, value);
      return next;
    });
    setErrors((prev) => {
      const next = new Map(prev);
      next.delete(questionId);
      return next;
    });
  }, []);

  function validateCurrent(): boolean {
    if (!currentQuestion) return true;
    if (currentQuestion.question_type === "statement") return true;

    const answer = answers.get(currentQuestion.id);
    const mockAnswer: SurveyAnswer = {
      id: "",
      response_id: "",
      question_id: currentQuestion.id,
      answer_text: typeof answer === "string" ? answer : null,
      answer_choices: Array.isArray(answer) ? answer : null,
      answer_numeric: typeof answer === "number" ? answer : null,
      answer_date: null,
      answer_json:
        typeof answer === "object" && !Array.isArray(answer) ? answer : null,
      score: null,
      answered_at: new Date().toISOString(),
    };
    const error = validateAnswer(
      currentQuestion,
      answer !== undefined ? mockAnswer : undefined,
    );
    if (error) {
      setErrors(new Map([[currentQuestion.id, error.message]]));
      return false;
    }
    return true;
  }

  function goNext() {
    if (!validateCurrent()) return;

    // Auto-advance for single-select types
    if (currentIndex < visibleQuestions.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }

  function goPrev() {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }

  async function handleSubmit() {
    if (!validateCurrent()) return;
    setSubmitting(true);
    try {
      await onSubmit(answers);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (isLastQuestion) {
          handleSubmit();
        } else {
          goNext();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, isLastQuestion, answers]);

  // Submitted screen
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md px-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Check className="w-10 h-10 text-cyan-600" />
          </motion.div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Thank You!</h1>
          <p className="text-slate-600">
            {survey.settings.thank_you_message ||
              "Your response has been recorded. Thank you for your feedback."}
          </p>
        </motion.div>
      </div>
    );
  }

  // Welcome screen
  if (currentIndex === -1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-white px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-lg"
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl font-bold text-slate-900 mb-6"
          >
            {survey.title}
          </motion.h1>
          {survey.description && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-slate-600 mb-4"
            >
              {survey.description}
            </motion.p>
          )}
          {survey.settings.time_estimate_minutes && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-slate-400 mb-8"
            >
              Takes about {survey.settings.time_estimate_minutes} minutes
            </motion.p>
          )}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              size="lg"
              onClick={() => setCurrentIndex(0)}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-10 py-6 text-lg rounded-full"
            >
              Start
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-xs text-slate-400 mt-10"
          >
            Press{" "}
            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500">
              Enter
            </kbd>{" "}
            to advance
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col bg-white">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-20">
        <Progress value={progressPercent} className="h-1 rounded-none" />
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center px-4 py-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-xl"
          >
            {currentQuestion && (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm font-medium text-cyan-600">
                    {currentQuestion.question_type !== "statement"
                      ? `${currentIndex + 1} of ${visibleQuestions.length}`
                      : ""}
                  </span>
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                  {currentQuestion.title}
                  {currentQuestion.is_required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </h2>

                {currentQuestion.description && (
                  <p className="text-slate-500 mb-6">
                    {currentQuestion.description}
                  </p>
                )}

                <div className="mt-6">
                  <QuestionRenderer
                    question={currentQuestion}
                    value={answers.get(currentQuestion.id)}
                    onChange={(val: any) =>
                      handleAnswerChange(currentQuestion.id, val)
                    }
                    error={errors.get(currentQuestion.id)}
                  />
                </div>

                {/* Next / Submit */}
                <div className="mt-8 flex items-center gap-3">
                  {isLastQuestion ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white px-8"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      {submitting ? "Submitting..." : "Submit"}
                    </Button>
                  ) : (
                    <Button
                      onClick={goNext}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white px-8"
                    >
                      OK
                      <Check className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                  <span className="text-xs text-slate-400">
                    press{" "}
                    <kbd className="px-1 py-0.5 bg-slate-100 rounded">
                      Enter
                    </kbd>
                  </span>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation footer */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/80 backdrop-blur border-t">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={goPrev}
              disabled={currentIndex <= 0}
              className="h-8 w-8 p-0"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goNext}
              disabled={isLastQuestion}
              className="h-8 w-8 p-0"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
          <span className="text-xs text-slate-400">
            {progressPercent}% complete
          </span>
          <span className="text-xs text-slate-400">Powered by Schoolgle</span>
        </div>
      </div>
    </div>
  );
}
