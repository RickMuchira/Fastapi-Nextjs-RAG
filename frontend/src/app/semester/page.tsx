'use client'

import { useEffect, useState } from "react"
import axios from "axios"

interface Course {
  id: number
  name: string
}

interface Year {
  id: number
  name: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000'

export default function SemesterPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [years, setYears] = useState<Year[]>([])
  const [semesters, setSemesters] = useState<any[]>([])

  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null)

  const [semesterName, setSemesterName] = useState("")
  const [success, setSuccess] = useState(false)

  // Load courses
  useEffect(() => {
    axios.get(`${API_BASE_URL}/courses/`)
      .then(res => setCourses(res.data))
      .catch(err => console.error("Error loading courses", err))
  }, [])

  // Load years for selected course
  useEffect(() => {
    if (selectedCourseId) {
      axios.get(`${API_BASE_URL}/courses/${selectedCourseId}/years/`)
        .then(res => setYears(res.data))
        .catch(err => console.error("Error loading years", err))
    }
  }, [selectedCourseId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedYearId || !semesterName.trim()) return

    try {
      const res = await axios.post(`${API_BASE_URL}/years/${selectedYearId}/semesters/`, {
        name: semesterName
      })
      if (res.status === 200 || res.status === 201) {
        setSuccess(true)
        setSemesterName("")
      }
    } catch (err) {
      console.error("Error creating semester", err)
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-4 border rounded shadow">
      <h1 className="text-2xl font-bold mb-4">📘 Create Semester</h1>

      <form onSubmit={handleSubmit}>
        <label>Select Course</label>
        <select
          className="border p-2 w-full mb-4"
          onChange={(e) => {
            const id = Number(e.target.value)
            setSelectedCourseId(id)
            setSelectedYearId(null)
          }}
          defaultValue=""
        >
          <option value="" disabled>Select Course</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {selectedCourseId && (
          <>
            <label>Select Year</label>
            <select
              className="border p-2 w-full mb-4"
              onChange={(e) => setSelectedYearId(Number(e.target.value))}
              defaultValue=""
            >
              <option value="" disabled>Select Year</option>
              {years.map(y => (
                <option key={y.id} value={y.id}>{y.name}</option>
              ))}
            </select>
          </>
        )}

        <input
          className="border p-2 w-full mb-4"
          type="text"
          placeholder="Semester Name"
          value={semesterName}
          onChange={(e) => setSemesterName(e.target.value)}
          required
        />

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Create Semester
        </button>
      </form>

      {success && <p className="text-green-600 mt-4">Semester created successfully!</p>}
    </div>
  )
}
