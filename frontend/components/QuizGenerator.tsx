'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function QuizGenerator({ docId, unitId }: { docId: number; unitId: string }) {
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const generateQuiz = () => {
    setIsGenerating(true);
    setError('');
    const eventSource = new EventSource(`/api/quiz/generate/${docId}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.status === 'progress') {
        setProgress({ current: data.current, total: data.total, message: data.message });
      } else if (data.status === 'question_generated') {
        setProgress({ current: data.current, total: data.total, message: 'Question generated' });
      } else if (data.status === 'completed') {
        eventSource.close();
        setIsGenerating(false);
        router.push(`/quiz/${unitId}/${docId}`);
      } else if (data.status === 'error') {
        setError(data.message);
        eventSource.close();
        setIsGenerating(false);
      }
    };

    eventSource.onerror = () => {
      setError('Failed to connect to quiz generation service.');
      eventSource.close();
      setIsGenerating(false);
    };
  };

  return (
    <div>
      <button
        onClick={generateQuiz}
        disabled={isGenerating}
        className={`px-3 py-1 rounded text-white ${isGenerating ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {isGenerating ? 'Generating...' : 'Generate Quiz'}
      </button>
      {isGenerating && (
        <div className="mt-2">
          <p>{progress.message}</p>
          {progress.total > 0 && (
            <div className="w-full bg-gray-200 rounded">
              <div
                className="bg-blue-600 h-2 rounded"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              ></div>
            </div>
          )}
        </div>
      )}
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
}