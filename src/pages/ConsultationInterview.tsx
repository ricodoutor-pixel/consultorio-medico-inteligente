import React, { useState, useEffect } from "react";
import { Send, ChevronLeft, CheckCircle, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "react-router-dom";
import { trpc } from "@/lib/trpc";

interface Question {
  id: number;
  question: string;
  type: string; // "text" | "select"
  options?: string[];
  required: boolean;
}

export default function ConsultationInterview() {
  const [location, setLocation] = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);

  // Initialize mutations
  const grantAccessMutation = trpc.consultation.grantSpecialistAccess.useMutation({
    onSuccess: () => {
      setInterviewComplete(true);

      // Redirect to specialist access page after 3 seconds
      setTimeout(() => {
        setLocation(`/consultation/specialist?specialist=${specialistId}&strain=${strainId}&order=${orderId}`);
      }, 3000);
    },
    onError: (error: any) => {
      console.error("Error granting access:", error);
      setIsSubmitting(false);
    }
  });

  const submitMutation = trpc.consultation.submitInterviewAnswers.useMutation({
    onSuccess: async (response: any) => {
      // Grant specialist access
      grantAccessMutation.mutate({
        interviewId,
        specialistId: parseInt(specialistId || "1")
      });
    }
  });

  // Get query params
  const params = new URLSearchParams(window.location.search);
  const specialistId = params.get("specialist");
  const strainId = params.get("strain");
  const orderId = params.get("order");
  const interviewId = `interview_${orderId}`;

  // Fetch interview questions
  const { data: questionsData, isLoading: questionsLoading } = trpc.consultation.getInterviewQuestions.useQuery(
    { interviewId }
  );

  useEffect(() => {
    if (questionsData?.questions) {
      setQuestions(questionsData.questions);
      setIsLoading(false);
    } else if (questionsLoading === false && !questionsData) {
      setIsLoading(false);
    }
  }, [questionsData, questionsLoading]);

  const handleNext = () => {
    if (!questions[currentQuestion]) return;
    const question = questions[currentQuestion];
    if (question.required && !answers[question.id]) {
      alert("Por favor, responda esta pergunta");
      return;
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleAnswer = (value: string) => {
    if (!questions[currentQuestion]) return;
    setAnswers({
      ...answers,
      [questions[currentQuestion].id]: value
    });
  };



  const handleSubmit = async () => {
    setIsSubmitting(true);
    submitMutation.mutate({
      interviewId,
      answers
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0e27] to-[#1a1f3a] text-white flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-10 h-10 text-yellow-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando entrevista...</p>
        </div>
      </div>
    );
  }

  if (interviewComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0e27] to-[#1a1f3a] text-white flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-green-400 mb-2">Entrevista Concluída!</h1>
          <p className="text-gray-300 mb-6">Redirecionando para o especialista...</p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0e27] to-[#1a1f3a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0a0e27]/95 backdrop-blur border-b border-yellow-400/20 py-4">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
              Anterior
            </button>
            <h1 className="text-2xl font-bold text-yellow-400">Entrevista Médica</h1>
            <div className="text-sm text-gray-400">
              {currentQuestion + 1} de {questions.length}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Question */}
        <div className="bg-[#1a1f3a] border border-yellow-400/20 rounded-lg p-8 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-6">{question.question}</h2>

          {/* Answer Input */}
          {question.type === "text" ? (
            <input
              type="text"
              placeholder="Digite sua resposta..."
              value={answers[question.id] || ""}
              onChange={(e) => handleAnswer(e.target.value)}
              className="w-full px-4 py-3 bg-[#0a0e27] border border-yellow-400/30 rounded text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none transition"
            />
          ) : (
            <div className="space-y-2">
              {question.options?.map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  className={`w-full text-left px-4 py-3 rounded transition border ${
                    answers[question.id] === option
                      ? "bg-yellow-400/30 border-yellow-400 text-yellow-400"
                      : "bg-[#0a0e27] border-yellow-400/30 text-white hover:border-yellow-400"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {question.required && (
            <p className="text-xs text-yellow-400 mt-2">* Campo obrigatório</p>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="flex-1 px-4 py-3 bg-[#1a1f3a] border border-yellow-400/30 text-white rounded hover:border-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>

          {currentQuestion < questions.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold rounded hover:from-yellow-500 hover:to-yellow-600 transition"
            >
              Próxima
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-400 to-green-500 text-black font-semibold rounded hover:from-green-500 hover:to-green-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar Entrevista
                </>
              )}
            </button>
          )}
        </div>

        {/* Questions Summary */}
        <div className="mt-8 bg-[#1a1f3a] border border-yellow-400/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-400 mb-4">Resumo das Respostas</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {questions.map((q, idx) => (
              <div key={q.id} className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                  answers[q.id]
                    ? "bg-green-400/30 text-green-400"
                    : "bg-gray-600/30 text-gray-400"
                }`}>
                  {answers[q.id] ? "✓" : idx + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-400">{q.question}</p>
                  {answers[q.id] && (
                    <p className="text-sm text-yellow-400 font-semibold mt-1">{answers[q.id]}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
