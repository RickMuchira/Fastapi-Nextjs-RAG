"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

type UnitTopic = {
  id: number;
  name: string;
  quiz_count: number;
};

export default function TopicsPage() {
  const [topics, setTopics] = useState<UnitTopic[]>([]);
  const router = useRouter();

  useEffect(() => {
    axios
      .get<UnitTopic[]>("http://localhost:8000/units/topics")
      .then((res) => setTopics(res.data))
      .catch((err) => console.error("Failed to load topics", err));
  }, []);

  const handleStartQuiz = (unitId: number) => {
    router.push(`/quiz/${unitId}`);
  };

  const handleGenerateQuiz = (unitId: number) => {
    router.push(`/generate-quiz/${unitId}`);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Topics</h1>
      {topics.length === 0 ? (
        <p>No units found.</p>
      ) : (
        <ul className="space-y-4">
          {topics.map((unit) => (
            <li
              key={unit.id}
              className="border p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
            >
              <div>
                <div className="text-lg font-medium">{unit.name}</div>
                <div className="text-sm text-gray-600">
                  {unit.quiz_count} quiz question{unit.quiz_count !== 1 ? "s" : ""}
                </div>
              </div>

              {unit.quiz_count > 0 ? (
                <button
                  onClick={() => handleStartQuiz(unit.id)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Start Quiz
                </button>
              ) : (
                <button
                  onClick={() => handleGenerateQuiz(unit.id)}
                  className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                >
                  Generate Quiz
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
