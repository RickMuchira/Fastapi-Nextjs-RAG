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

interface Semester {
  id: number
  name: string
}

export default function UnitPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [years, setYears] = useState<Year[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])

  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null)
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null)

  const [unitName, setUnitName] = useState("")
  const [success, setSuccess] = useState(false)

  // Load courses
  useEffect(() => {
    axios.get("http://127.0.0.1:8000/courses/")
      .then(res => setCourses(res.data))
      .catch(err => console.error("Error loading courses", err))
  }, [])

  // Load years when course is selected
  useEffect(() => {
    if (selectedCourseId) {
      axios.get(`http://127.0.0.1:8000/courses/${selectedCourseId}/years/`)
        .then(res => setYears(res.data))
        .catch(err => console.error("Error loading years", err))
    }
  }, [selectedCourseId])

  // Load semesters when year is selected
  useEffect(() => {
    if (selectedYearId) {
      axios.get(`http://127.0.0.1:8000/years/${selectedYearId}/semesters/`)
        .then(res => setSemesters(res.data))
        .catch(err => console.error("Error loading semesters", err))
    }
  }, [selectedYearId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSemesterId) return alert("Select a semester")

    try {
      const res = await axios.post(`http://127.0.0.1:8000/semesters/${selectedSemesterId}/units/`, {
        name: unitName,
      })
      if (res.status === 200 || res.status === 201) {
        setSuccess(true)
        setUnitName("")
      }
    } catch (err) {
      console.error("Error creating unit", err)
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-4 border rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Create Unit</h1>
      <form onSubmit={handleSubmit}>
        <label>Select Course</label>
        <select
          className="border p-2 w-full mb-4"
          onChange={(e) => {
            setSelectedCourseId(Number(e.target.value))
            setSelectedYearId(null)
            setSelectedSemesterId(null)
          }}
          defaultValue=""
        >
          <option value="" disabled>Select Course</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {selectedCourseId && (
          <>
            <label>Select Year</label>
            <select
              className="border p-2 w-full mb-4"
              onChange={(e) => {
                setSelectedYearId(Number(e.target.value))
                setSelectedSemesterId(null)
              }}
              defaultValue=""
            >
              <option value="" disabled>Select Year</option>
              {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </>
        )}

        {selectedYearId && (
          <>
            <label>Select Semester</label>
            <select
              className="border p-2 w-full mb-4"
              onChange={(e) => setSelectedSemesterId(Number(e.target.value))}
              defaultValue=""
            >
              <option value="" disabled>Select Semester</option>
              {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </>
        )}

        <input
          className="border p-2 w-full mb-4"
          type="text"
          placeholder="Unit Name"
          value={unitName}
          onChange={(e) => setUnitName(e.target.value)}
          required
        />

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Create Unit
        </button>
      </form>

      {success && <p className="text-green-600 mt-4">Unit created successfully!</p>}
    </div>
  )
}
