'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'

interface Document {
  id: number
  filename: string
  filepath: string
  course_path: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000'

export default function DocumentListPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [progress, setProgress] = useState<Record<number, string[]>>({})

  const fetchDocuments = () => {
    axios.get(`${API_BASE_URL}/documents/`)
      .then(res => setDocuments(res.data))
      .catch(err => console.error('Error loading documents', err))
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    try {
      await axios.delete(`${API_BASE_URL}/documents/${id}`)
      fetchDocuments()
    } catch (err) {
      console.error('Failed to delete document', err)
    }
  }

  const handleProcess = (docId: number) => {
    setProgress(prev => ({ ...prev, [docId]: [] }))

    const evtSource = new EventSource(`${API_BASE_URL}/documents/${docId}/process`)

    evtSource.onmessage = (event) => {
      setProgress(prev => ({
        ...prev,
        [docId]: [...(prev[docId] || []), event.data]
      }))
    }

    evtSource.onerror = () => {
      evtSource.close()
      fetchDocuments()
    }
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 p-4 border rounded shadow">
      <h1 className="text-3xl font-bold mb-6">📄 Uploaded Documents</h1>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2 border">Filename</th>
            <th className="p-2 border">Course Path</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map(doc => (
            <tr key={doc.id} className="border-t hover:bg-gray-50">
              <td className="p-2 border align-top">{doc.filename}</td>
              <td className="p-2 border align-top">{doc.course_path}</td>
              <td className="p-2 border align-top">
                <a
                  href={`${API_BASE_URL}/documents/download/${doc.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline mr-4"
                >
                  View
                </a>
                <button
                  onClick={() => handleProcess(doc.id)}
                  className="text-green-600 hover:underline mr-4"
                >
                  Process
                </button>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>

                {progress[doc.id] && (
                  <ul className="mt-2 text-xs text-gray-600">
                    {progress[doc.id].map((msg, idx) => (
                      <li key={idx}>{msg}</li>
                    ))}
                  </ul>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
