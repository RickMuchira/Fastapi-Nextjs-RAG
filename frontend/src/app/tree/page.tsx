'use client'

import { useEffect, useState } from "react"
import axios from "axios"

interface Unit { id: number; name: string }
interface Semester { id: number; name: string; units: Unit[] }
interface Year { id: number; name: string; semesters: Semester[] }
interface Course { id: number; name: string; years: Year[] }

export default function TreeViewPage() {
  const [data, setData] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/tree/")
      .then(res => setData(res.data))
      .catch(err => console.error("Error loading tree", err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <p className="text-center mt-10">⏳ Loading course tree...</p>
  }

  if (data.length === 0) {
    return <p className="text-center mt-10 text-red-600">⚠️ No course data available</p>
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4">
      <h1 className="text-3xl font-bold mb-6">📚 Course Structure Tree</h1>
      <ul className="list-disc ml-6 space-y-4">
        {data.map(course => (
          <li key={course.id}>
            <strong>📘 {course.name}</strong>
            <ul className="ml-4 list-circle">
              {course.years.map(year => (
                <li key={year.id}>
                  <span>📅 {year.name}</span>
                  <ul className="ml-4 list-square">
                    {year.semesters.map(sem => (
                      <li key={sem.id}>
                        <span>🗓️ {sem.name}</span>
                        <ul className="ml-4 list-disc">
                          {sem.units.map(unit => (
                            <li key={unit.id}>📗 {unit.name}</li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}
