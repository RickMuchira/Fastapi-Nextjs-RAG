'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'

interface Course {
  id: number
  name: string
}

interface Year {
  id: number
  name: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000'

export default function YearPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)

  const [years, setYears] = useState<Year[]>([])
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)

  // Fetch all courses for selection
  useEffect(() => {
    axios.get(`${API_BASE_URL}/courses/`)
      .then(res => setCourses(res.data))
      .catch(err => console.error("Error fetching courses", err))
  }, [])

  // Fetch years when a course is selected
  useEffect(() => {
    if (selectedCourseId) {
      axios.get(`${API_BASE_URL}/courses/${selectedCourseId}/years/`)
        .then(res => setYears(res.data))
        .catch(err => console.error("Error fetching years", err))
    }
  }, [selectedCourseId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !selectedCourseId) return

    try {
      if (editingId) {
        await axios.put(`${API_BASE_URL}/years/${editingId}`, { name })
      } else {
        await axios.post(`${API_BASE_URL}/courses/${selectedCourseId}/years/`, { name })
      }
      setName('')
      setEditingId(null)
      if (selectedCourseId) fetchYears(selectedCourseId)
    } catch (err) {
      console.error("Error saving year", err)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this year?')) return
    try {
      await axios.delete(`${API_BASE_URL}/years/${id}`)
      if (selectedCourseId) fetchYears(selectedCourseId)
    } catch (err) {
      console.error("Error deleting year", err)
    }
  }

  const fetchYears = async (courseId: number) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/courses/${courseId}/years/`)
      setYears(res.data)
    } catch (err) {
      console.error("Error fetching years", err)
    }
  }

  const startEdit = (year: Year) => {
    setEditingId(year.id)
    setName(year.name)
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-4">
      <h1 className="text-2xl font-bold mb-4">📅 Manage Years</h1>

      <label className="block mb-2">Select Course</label>
      <select
        className="border p-2 w-full mb-6"
        onChange={(e) => {
          const courseId = Number(e.target.value)
          setSelectedCourseId(courseId)
          setEditingId(null)
          setName('')
        }}
        value={selectedCourseId ?? ''}
      >
        <option value="" disabled>Select a course</option>
        {courses.map((course) => (
          <option key={course.id} value={course.id}>
            {course.name}
          </option>
        ))}
      </select>

      {selectedCourseId && (
        <>
          <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
            <input
              className="border p-2 flex-1"
              placeholder="Year name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
              {editingId ? 'Update' : 'Create'}
            </button>
          </form>

          <ul className="space-y-2">
            {years.map((year) => (
              <li key={year.id} className="border p-4 rounded flex justify-between items-center">
                <span>{year.name}</span>
                <div className="space-x-2">
                  <button
                    onClick={() => startEdit(year)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(year.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
