"use client";

import { use, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import type {
  Survey,
  SurveyPage,
  SurveyQuestion,
  SurveyAnswer,
} from "@/lib/surveys/types";
import { evaluateLogic } from "@/lib/surveys/logic-engine";
import { validateAnswer } from "@/lib/surveys/validation-engine";

// Dynamic import for question renderer to avoid SSR issues
import dynamic from "next/dynamic";
const QuestionRenderer = dynamic(
  () =>
    import("@/components/surveys/questions/QuestionRenderer").then(
      (m) => m.QuestionRenderer,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-20 animate-pulse bg-slate-100 rounded-xl" />
    ),
  },
);

export default function PublicSurveyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPageIndex, setCurrentPageIndex] = useState(-1); // -1 = welcome
  const [answers, setAnswers] = useState<Map<string, any>>(new Map());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sessionId] = useState(
    `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  );
  const [startTime] = useState(Date.now());

  useEffect(() => {
    fetchSurvey();
  }, [slug]);

  async function fetchSurvey() {
    try {
      // Look up survey by slug
      const res = await fetch(
        `/api/surveys/lookup?slug=${encodeURIComponent(slug)}`,
      );
      if (res.ok) {
        const data = await res.json();
        if (data && !data.error) {
          setSurvey(data);
          return;
        }
      }
      // Fallback: try as ID
      const res2 = await fetch(`/api/surveys/${slug}`);
      if (res2.ok) {
        const data = await res2.json();
        if (data && !data.error) setSurvey(data);
      }
    } catch {
      console.error("Survey not found");
    } finally {
      setLoading(false);
    }
  }

  const pages: SurveyPage[] = survey?.pages || [];
  const currentPage = currentPageIndex >= 0 ? pages[currentPageIndex] : null;
  const questions: SurveyQuestion[] = currentPage
    ? (currentPage as any).survey_questions || currentPage.questions || []
    : [];

  const totalQuestions = pages.reduce(
    (acc, p) => acc + ((p as any).survey_questions || p.questions || []).length,
    0,
  );
  const answeredCount = answers.size;
  const progressPercent =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

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

  function validateCurrentPage(): boolean {
    const newErrors = new Map<string, string>();
    for (const q of questions) {
      if (q.question_type === "statement") continue;
      const answer = answers.get(q.id);
      const mockAnswer: SurveyAnswer = {
        id: "",
        response_id: "",
        question_id: q.id,
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
        q,
        answer !== undefined ? mockAnswer : undefined,
      );
      if (error) newErrors.set(q.id, error.message);
    }
    setErrors(newErrors);
    return newErrors.size === 0;
  }

  function goNext() {
    if (!validateCurrentPage()) return;
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex((p) => p + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function goPrev() {
    if (currentPageIndex > 0) {
      setCurrentPageIndex((p) => p - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function handleSubmit() {
    if (!validateCurrentPage()) return;
    if (!survey) return;

    setSubmitting(true);
    try {
      const answerPayload = Array.from(answers.entries()).map(
        ([questionId, value]) => ({
          questionId,
          answerText: typeof value === "string" ? value : null,
          answerChoices: Array.isArray(value) ? value : null,
          answerNumeric: typeof value === "number" ? value : null,
          answerJson:
            typeof value === "object" && !Array.isArray(value) ? value : null,
        }),
      );

      const res = await fetch(`/api/surveys/${survey.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          status: "completed",
          answers: answerPayload,
          timeTakenSeconds: Math.round((Date.now() - startTime) / 1000),
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        toast.error("Failed to submit. Please try again.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600" />
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Survey Not Found
          </h1>
          <p className="text-slate-500">
            This survey may have been closed or removed.
          </p>
        </div>
      </div>
    );
  }

  if (survey.status !== "active" && survey.status !== "draft") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Survey Closed
          </h1>
          <p className="text-slate-500">
            This survey is no longer accepting responses.
          </p>
        </div>
      </div>
    );
  }

  // Submitted screen
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md px-6"
        >
          <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Send className="w-8 h-8 text-cyan-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Thank You!</h1>
          <p className="text-slate-600">
            {survey.settings.thank_you_message ||
              "Your response has been recorded. Thank you for your feedback."}
          </p>
          <p className="text-sm text-slate-400 mt-8">Powered by Schoolgle</p>
        </motion.div>
      </div>
    );
  }

  // Welcome screen
  if (currentPageIndex === -1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-white px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-lg"
        >
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            {survey.title}
          </h1>
          {survey.description && (
            <p className="text-lg text-slate-600 mb-2">{survey.description}</p>
          )}
          {survey.settings.welcome_message && (
            <p className="text-slate-500 mb-6">
              {survey.settings.welcome_message}
            </p>
          )}
          {survey.settings.time_estimate_minutes && (
            <p className="text-sm text-slate-400 mb-6">
              Estimated time: {survey.settings.time_estimate_minutes} minutes
            </p>
          )}
          {survey.is_anonymous && (
            <p className="text-xs text-slate-400 mb-6">
              This survey is anonymous. Your responses cannot be linked to your
              identity.
            </p>
          )}
          <Button
            size="lg"
            onClick={() => setCurrentPageIndex(0)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-8"
          >
            Start Survey
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-xs text-slate-400 mt-8">Powered by Schoolgle</p>
        </motion.div>
      </div>
    );
  }

  const isLastPage = currentPageIndex === pages.length - 1;

  return (
    <div className="min-h-screen bg-white">
      {/* Progress */}
      {survey.settings.show_progress_bar !== false && (
        <div className="sticky top-0 z-10 bg-white border-b">
          <Progress value={progressPercent} className="h-1 rounded-none" />
          <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-between text-sm text-slate-500">
            <span>{survey.title}</span>
            <span>{progressPercent}% complete</span>
          </div>
        </div>
      )}

      {/* Questions */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPageIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {currentPage?.title && (
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {currentPage.title}
              </h2>
            )}
            {currentPage?.description && (
              <p className="text-slate-500 mb-6">{currentPage.description}</p>
            )}

            <div className="space-y-8">
              {questions.map((question, qi) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: qi * 0.05 }}
                  className="space-y-2"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-cyan-600 mt-1">
                      {question.question_type !== "statement"
                        ? `Q${qi + 1}`
                        : ""}
                    </span>
                    <div className="flex-1">
                      <label className="text-base font-medium text-slate-900">
                        {question.title}
                        {question.is_required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </label>
                      {question.description && (
                        <p className="text-sm text-slate-500 mt-1">
                          {question.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="ml-8">
                    <QuestionRenderer
                      question={question}
                      value={answers.get(question.id)}
                      onChange={(val: any) =>
                        handleAnswerChange(question.id, val)
                      }
                      error={errors.get(question.id)}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={currentPageIndex <= 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <span className="text-sm text-slate-400">
            Page {currentPageIndex + 1} of {pages.length}
          </span>

          {isLastPage ? (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit
                  <Send className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={goNext}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-xs text-slate-400">
        Powered by Schoolgle
      </div>
    </div>
  );
}
