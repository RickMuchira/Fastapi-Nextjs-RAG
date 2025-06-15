'use client';

import { useState, useEffect } from 'react';
import { QuizQuestion } from '@/types';

export default function QuizTaker({ unitId }: { unitId: string }) {
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/quiz/${unitId}`)
      .then((res) => res.json())
      .then((data) => {
        setQuizzes(data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load quizzes');
        setLoading(false);
      });
  }, [unitId]);

  const handleAnswer = () => {
    if (!selectedAnswer) return;
    const correct = selectedAnswer === quizzes[currentQuestion].correct_answer;
    setIsCorrect(correct);
  };

  const nextQuestion = () => {
    setSelectedAnswer(null);
    setIsCorrect(null);
    setCurrentQuestion((prev) => Math.min(prev + 1, quizzes.length - 1));
  };

  if (loading) return <p>Loading quizzes...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (quizzes.length === 0) return <p>No quizzes available for this unit.</p>;

  const { question, options: optionsJson, correct_answer, explanation } = quizzes[currentQuestion];
  const options = JSON.parse(optionsJson);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        Question {currentQuestion + 1} of {quizzes.length}
      </h2>
      <p className="mb-4">{question}</p>
      <div className="space-y-2">
        {Object.entries(options).map(([key, value]) => (
          <button
            key={key}
            onClick={() => setSelectedAnswer(key)}
            className={`w-full text-left p-2 rounded border ${
              selectedAnswer === key
                ? isCorrect === null
                  ? 'bg-blue-100 border-blue-600'
                  : isCorrect
                  ? 'bg-green-100 border-green-600'
                  : 'bg-red-100 border-red-600'
                : 'border-gray-300 hover:bg-gray-100'
            }`}
            disabled={isCorrect !== null}
          >
            {key}: {value}
          </button>
        ))}
      </div>
      {isCorrect !== null && (
        <div className="mt-4">
          <p className={isCorrect ? 'text-green-600' : 'text-red-600'}>
            {isCorrect ? 'Correct!' : `Incorrect. The correct answer is ${correct_answer}.`}
          </p>
          {explanation && <p className="mt-2">{explanation}</p>}
        </div>
      )}
      <div className="mt-4 space-x-2">
        <button
          onClick={handleAnswer}
          disabled={!selectedAnswer || isCorrect !== null}
          className={`px-4 py-2 rounded text-white ${
            !selectedAnswer || isCorrect !== null ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          Submit
        </button>
        {currentQuestion < quizzes.length - 1 && isCorrect !== null && (
          <button
            onClick={nextQuestion}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}