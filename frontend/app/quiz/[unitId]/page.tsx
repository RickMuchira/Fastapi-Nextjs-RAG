"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";

type QuizQuestion = {
  id: number;
  question: string;
  options: Record<"A" | "B" | "C" | "D", string>;
  correct_answer: "A" | "B" | "C" | "D";
  explanation?: string;
};

export default function QuizPage() {
  const { unitId } = useParams();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!unitId) return;
    axios
      .get<QuizQuestion[]>(`http://localhost:8000/units/${unitId}/quizzes`)
      .then((res) => setQuestions(res.data))
      .catch((err) => console.error("Failed to load quiz", err));
  }, [unitId]);

  const handleSelect = (questionId: number, option: string) => {
    if (submitted) return; // Prevent changing answers after submit
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const correctCount = questions.filter(
    (q) => answers[q.id] === q.correct_answer
  ).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Quiz for Unit {unitId}</h1>

      {questions.map((q, idx) => (
        <div key={q.id} className="mb-6 p-4 border rounded-lg">
          <p className="font-semibold mb-2">
            {idx + 1}. {q.question}
          </p>
          <div className="space-y-1">
            {(["A", "B", "C", "D"] as const).map((opt) => {
              const isSelected = answers[q.id] === opt;
              const isCorrect = opt === q.correct_answer;
              const isWrong =
                submitted && isSelected && opt !== q.correct_answer;

              return (
                <label
                  key={opt}
                  className={`block cursor-pointer p-2 border rounded 
                    ${isSelected ? "border-blue-500 bg-blue-50" : ""}
                    ${submitted && isCorrect ? "bg-green-100 border-green-500" : ""}
                    ${isWrong ? "bg-red-100 border-red-500" : ""}`}
                >
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    value={opt}
                    checked={isSelected}
                    disabled={submitted}
                    onChange={() => handleSelect(q.id, opt)}
                    className="mr-2"
                  />
                  {opt}: {q.options[opt]}
                </label>
              );
            })}
          </div>

          {submitted && q.explanation && (
            <p className="mt-2 text-sm text-gray-600 italic">
              💡 Explanation: {q.explanation}
            </p>
          )}
        </div>
      ))}

      {!submitted ? (
        <button
          onClick={handleSubmit}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Submit Quiz
        </button>
      ) : (
        <div className="mt-4 text-xl font-semibold text-green-700">
          Score: {correctCount} / {questions.length}
        </div>
      )}
    </div>
  );
}
