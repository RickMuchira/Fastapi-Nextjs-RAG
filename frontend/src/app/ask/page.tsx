'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000'

interface Course { id: number; name: string }
interface Year { id: number; name: string }
interface Semester { id: number; name: string }
interface Unit { id: number; name: string }

export default function AskQuestionPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [years, setYears] = useState<Year[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [units, setUnits] = useState<Unit[]>([])

  const [courseId, setCourseId] = useState<number | null>(null)
  const [yearId, setYearId] = useState<number | null>(null)
  const [semesterId, setSemesterId] = useState<number | null>(null)
  const [unitId, setUnitId] = useState<number | null>(null)

  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')

  useEffect(() => {
    axios.get(`${API}/courses/`)
      .then(res => setCourses(res.data))
      .catch(err => console.error("Error fetching courses:", err))
  }, [])

  useEffect(() => {
    if (courseId) {
      axios.get(`${API}/courses/${courseId}/years/`)
        .then(res => setYears(res.data))
        .catch(err => console.error("Error fetching years:", err))
      setYearId(null)
      setSemesters([])
      setSemesterId(null)
      setUnits([])
      setUnitId(null)
    }
  }, [courseId])

  useEffect(() => {
    if (yearId) {
      axios.get(`${API}/years/${yearId}/semesters/`)
        .then(res => setSemesters(res.data))
        .catch(err => console.error("Error fetching semesters:", err))
      setSemesterId(null)
      setUnits([])
      setUnitId(null)
    }
  }, [yearId])

  useEffect(() => {
    if (semesterId) {
      axios.get(`${API}/semesters/${semesterId}/units/`)
        .then(res => setUnits(res.data))
        .catch(err => console.error("Error fetching units:", err))
      setUnitId(null)
    }
  }, [semesterId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!unitId || !question.trim()) return alert("Please select a unit and type a question.")

    try {
      const res = await axios.post(`${API}/ask`, {
        unit_id: unitId,
        question: question.trim()
      })
      setAnswer(res.data.answer)
    } catch (err) {
      console.error("❌ Failed to get answer:", err)
      alert("Failed to get answer. Check console and backend.")
    }
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 p-4">
      <h1 className="text-2xl font-bold mb-4">🧠 Ask a Question</h1>

      <form onSubmit={handleSubmit} className="space-y-4">

        <select className="w-full p-2 border" onChange={e => setCourseId(Number(e.target.value))} value={courseId ?? ''}>
          <option value="" disabled>Select Course</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {years.length > 0 && (
          <select className="w-full p-2 border" onChange={e => setYearId(Number(e.target.value))} value={yearId ?? ''}>
            <option value="" disabled>Select Year</option>
            {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
          </select>
        )}

        {semesters.length > 0 && (
          <select className="w-full p-2 border" onChange={e => setSemesterId(Number(e.target.value))} value={semesterId ?? ''}>
            <option value="" disabled>Select Semester</option>
            {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}

        {units.length > 0 && (
          <select className="w-full p-2 border" onChange={e => setUnitId(Number(e.target.value))} value={unitId ?? ''}>
            <option value="" disabled>Select Unit</option>
            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}

        <textarea
          className="w-full p-2 border h-28"
          placeholder="Type your question here..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full">
          Ask
        </button>
      </form>

      {answer && (
        <div className="mt-6 p-4 bg-gray-100 rounded shadow">
          <h2 className="font-semibold mb-2">Answer:</h2>
          <p>{answer}</p>
        </div>
      )}
    </div>
  )
}
