"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Course, Year, Semester, Unit } from "@/types/chat"
import axios from "axios"
import { toast } from "sonner"

interface UnitSelectorProps {
  onUnitSelect: (unit: { unitId: number; unitName: string; coursePath: string } | null) => void
  selectedUnit: { unitId: number; unitName: string; coursePath: string } | null
}

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

export default function UnitSelector({ onUnitSelect, selectedUnit }: UnitSelectorProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [years, setYears] = useState<Year[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [units, setUnits] = useState<Unit[]>([])

  const [courseId, setCourseId] = useState<string>("")
  const [yearId, setYearId] = useState<string>("")
  const [semesterId, setSemesterId] = useState<string>("")
  const [unitId, setUnitId] = useState<string>("")

  // Load courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get(`${API}/courses/`)
        setCourses(res.data)
      } catch (err) {
        toast.error("Failed to fetch courses")
      }
    }
    fetchCourses()
  }, [])

  // Load years when course is selected
  useEffect(() => {
    if (!courseId) return
    const fetchYears = async () => {
      try {
        const res = await axios.get(`${API}/courses/${courseId}/years/`)
        setYears(res.data)
        setYearId("")
        setSemesters([])
        setSemesterId("")
        setUnits([])
        setUnitId("")
        onUnitSelect(null)
      } catch (err) {
        toast.error("Failed to fetch years")
      }
    }
    fetchYears()
  }, [courseId, onUnitSelect])

  // Load semesters when year is selected
  useEffect(() => {
    if (!yearId) return
    const fetchSemesters = async () => {
      try {
        const res = await axios.get(`${API}/years/${yearId}/semesters/`)
        setSemesters(res.data)
        setSemesterId("")
        setUnits([])
        setUnitId("")
        onUnitSelect(null)
      } catch (err) {
        toast.error("Failed to fetch semesters")
      }
    }
    fetchSemesters()
  }, [yearId, onUnitSelect])

  // Load units when semester is selected
  useEffect(() => {
    if (!semesterId) return
    const fetchUnits = async () => {
      try {
        const res = await axios.get(`${API}/semesters/${semesterId}/units/`)
        setUnits(res.data)
        setUnitId("")
        onUnitSelect(null)
      } catch (err) {
        toast.error("Failed to fetch units")
      }
    }
    fetchUnits()
  }, [semesterId, onUnitSelect])

  // Update selected unit when unit is selected
  useEffect(() => {
    if (!unitId) return
    const selectedUnitData = units.find((u) => u.id.toString() === unitId)
    const course = courses.find((c) => c.id.toString() === courseId)
    const year = years.find((y) => y.id.toString() === yearId)
    const semester = semesters.find((s) => s.id.toString() === semesterId)

    if (selectedUnitData && course && year && semester) {
      const coursePath = `${course.name} > ${year.name} > ${semester.name}`
      onUnitSelect({
        unitId: selectedUnitData.id,
        unitName: selectedUnitData.name,
        coursePath,
      })
    }
  }, [unitId, units, courses, years, semesters, courseId, yearId, semesterId, onUnitSelect])

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <Select value={courseId} onValueChange={setCourseId}>
        <SelectTrigger className="bg-white/5 border-white/20 text-white">
          <SelectValue placeholder="Select Course" />
        </SelectTrigger>
        <SelectContent className="bg-gray-900 border-white/20">
          {courses.map((course) => (
            <SelectItem key={course.id} value={course.id.toString()}>
              {course.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={yearId} onValueChange={setYearId} disabled={!courseId}>
        <SelectTrigger className="bg-white/5 border-white/20 text-white disabled:opacity-50">
          <SelectValue placeholder="Select Year" />
        </SelectTrigger>
        <SelectContent className="bg-gray-900 border-white/20">
          {years.map((year) => (
            <SelectItem key={year.id} value={year.id.toString()}>
              {year.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={semesterId} onValueChange={setSemesterId} disabled={!yearId}>
        <SelectTrigger className="bg-white/5 border-white/20 text-white disabled:opacity-50">
          <SelectValue placeholder="Select Semester" />
        </SelectTrigger>
        <SelectContent className="bg-gray-900 border-white/20">
          {semesters.map((semester) => (
            <SelectItem key={semester.id} value={semester.id.toString()}>
              {semester.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={unitId} onValueChange={setUnitId} disabled={!semesterId}>
        <SelectTrigger className="bg-white/5 border-white/20 text-white disabled:opacity-50">
          <SelectValue placeholder="Select Unit" />
        </SelectTrigger>
        <SelectContent className="bg-gray-900 border-white/20">
          {units.map((unit) => (
            <SelectItem key={unit.id} value={unit.id.toString()}>
              {unit.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
