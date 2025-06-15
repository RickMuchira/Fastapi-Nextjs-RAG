"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";

type Document = {
  id: number;
  filename: string;
  course_path: string;
};

export default function GenerateQuizPage() {
  const { unitId } = useParams();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [logs, setLogs] = useState<string>("");

  useEffect(() => {
    if (!unitId) return;
    axios
      .get(`http://localhost:8000/units/${unitId}/documents/`)
      .then((res) => setDocuments(res.data))
      .catch((err) => console.error("Failed to load documents", err));
  }, [unitId]);

  const handleGenerate = (docId: number) => {
    setLogs(""); // Clear previous logs
    const eventSource = new EventSource(
      `http://localhost:8000/documents/${docId}/generate-quiz`
    );

    eventSource.onmessage = (event) => {
      const data = event.data;
      setLogs((prev) => prev + data + "\n");
    };

    eventSource.onerror = (err) => {
      console.error("SSE error:", err);
      eventSource.close();
    };
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Generate Quiz for Unit {unitId}</h1>

      {documents.length === 0 ? (
        <p>No documents found.</p>
      ) : (
        <ul className="space-y-4">
          {documents.map((doc) => (
            <li key={doc.id} className="border p-4 rounded shadow-sm">
              <div className="font-medium">{doc.filename}</div>
              <div className="text-sm text-gray-500 mb-2">
                Path: {doc.course_path}
              </div>
              <button
                onClick={() => handleGenerate(doc.id)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Generate Quiz
              </button>
            </li>
          ))}
        </ul>
      )}

      {logs && (
        <div className="mt-6 bg-black text-green-300 text-sm p-4 rounded">
          <pre>{logs}</pre>
        </div>
      )}
    </div>
  );
}
