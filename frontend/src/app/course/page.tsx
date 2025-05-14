'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'

interface Course {
  id: number
  name: string
}

// ✅ Provide fallback if the env variable is not loaded correctly
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000'

console.log("✅ API_BASE_URL:", API_BASE_URL) // 🧪 Confirm value during development

export default function CoursePage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/courses/`)
      setCourses(res.data)
    } catch (error) {
      console.error('❌ Failed to fetch courses:', error)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    try {
      if (editingId) {
        await axios.put(`${API_BASE_URL}/courses/${editingId}`, { name })
      } else {
        await axios.post(`${API_BASE_URL}/courses/`, { name })
      }

      setName('')
      setEditingId(null)
      fetchCourses()
    } catch (error) {
      console.error('❌ Failed to save course:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this course?')) return

    try {
      await axios.delete(`${API_BASE_URL}/courses/${id}`)
      fetchCourses()
    } catch (error) {
      console.error('❌ Failed to delete course:', error)
    }
  }

  const startEdit = (course: Course) => {
    setEditingId(course.id)
    setName(course.name)
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-4">
      <h1 className="text-2xl font-bold mb-4">📚 Manage Courses</h1>

      <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
        <input
          className="border p-2 flex-1"
          placeholder="Course name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {editingId ? 'Update' : 'Create'}
        </button>
      </form>

      <ul className="space-y-2">
        {courses.map((course) => (
          <li
            key={course.id}
            className="border p-4 rounded flex justify-between items-center"
          >
            <span>{course.name}</span>
            <div className="space-x-2">
              <button
                onClick={() => startEdit(course)}
                className="text-blue-600 hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(course.id)}
                className="text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
