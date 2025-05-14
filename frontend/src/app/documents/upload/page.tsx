'use client'

import { useEffect, useState } from "react"
import axios from "axios"

interface Course { id: number; name: string }
interface Year { id: number; name: string }
interface Semester { id: number; name: string }
interface Unit { id: number; name: string }

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000'

export default function UploadDocumentPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [years, setYears] = useState<Year[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [units, setUnits] = useState<Unit[]>([])

  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null)
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null)
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    axios.get(`${API_BASE_URL}/courses/`)
      .then(res => setCourses(res.data))
      .catch(() => setError("Failed to load courses"))
  }, [])

  useEffect(() => {
    if (selectedCourseId) {
      axios.get(`${API_BASE_URL}/courses/${selectedCourseId}/years/`)
        .then(res => setYears(res.data))
        .catch(() => setError("Failed to load years"))
      setSemesters([])
      setUnits([])
    }
  }, [selectedCourseId])

  useEffect(() => {
    if (selectedYearId) {
      axios.get(`${API_BASE_URL}/years/${selectedYearId}/semesters/`)
        .then(res => setSemesters(res.data))
        .catch(() => setError("Failed to load semesters"))
      setUnits([])
    }
  }, [selectedYearId])

  useEffect(() => {
    if (selectedSemesterId) {
      axios.get(`${API_BASE_URL}/semesters/${selectedSemesterId}/units/`)
        .then(res => setUnits(res.data))
        .catch(() => setError("Failed to load units"))
    }
  }, [selectedSemesterId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess(false)
    setError(null)

    if (!file || !selectedUnitId) {
      setError("Please select a unit and choose a file.")
      return
    }

    const formData = new FormData()
    formData.append("file", file)
    formData.append("unit_id", String(selectedUnitId))

    try {
      const res = await axios.post(`${API_BASE_URL}/documents/`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      if (res.status === 200 || res.status === 201) {
        setSuccess(true)
        setFile(null)
      }
    } catch (err) {
      console.error("Upload failed", err)
      setError("Upload failed. Check backend server and CORS settings.")
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-4 border rounded shadow">
      <h1 className="text-2xl font-bold mb-4">📤 Upload Document</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <select className="w-full p-2 border" onChange={e => setSelectedCourseId(Number(e.target.value))} defaultValue="">
          <option value="" disabled>Select Course</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {years.length > 0 && (
          <select className="w-full p-2 border" onChange={e => setSelectedYearId(Number(e.target.value))} defaultValue="">
            <option value="" disabled>Select Year</option>
            {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
          </select>
        )}

        {semesters.length > 0 && (
          <select className="w-full p-2 border" onChange={e => setSelectedSemesterId(Number(e.target.value))} defaultValue="">
            <option value="" disabled>Select Semester</option>
            {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}

        {units.length > 0 && (
          <select className="w-full p-2 border" onChange={e => setSelectedUnitId(Number(e.target.value))} defaultValue="">
            <option value="" disabled>Select Unit</option>
            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}

        <input type="file" className="w-full p-2 border" onChange={e => setFile(e.target.files?.[0] || null)} />

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full">
          Upload
        </button>

        {success && <p className="text-green-600 text-center mt-2">✅ Upload successful!</p>}
        {error && <p className="text-red-600 text-center mt-2">❌ {error}</p>}
      </form>
    </div>
  )
}
