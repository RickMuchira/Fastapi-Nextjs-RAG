"use client"

import type React from "react"

import { useEffect, useState } from "react"
import axios from "axios"
import { toast } from "sonner"
import { FileUp, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/layout/page-header"
import { Progress } from "@/components/ui/progress"
import { Toaster } from "sonner"
import Navbar from "@/components/navbar"
import { SparklesCore } from "@/components/sparkles"
import { FloatingPaper } from "@/components/floating-paper"

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
interface Unit {
  id: number
  name: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

export default function UploadDocumentPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [years, setYears] = useState<Year[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [units, setUnits] = useState<Unit[]>([])

  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [selectedYearId, setSelectedYearId] = useState<string>("")
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("")
  const [selectedUnitId, setSelectedUnitId] = useState<string>("")
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Load courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/courses/`)
        setCourses(res.data)
      } catch (error) {
        toast.error("Failed to load courses")
        console.error("Error loading courses:", error)
      }
    }

    fetchCourses()
  }, [])

  // Load years when course is selected
  useEffect(() => {
    if (!selectedCourseId) return

    const fetchYears = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/courses/${selectedCourseId}/years/`)
        setYears(res.data)
        setSemesters([])
        setUnits([])
        setSelectedYearId("")
        setSelectedSemesterId("")
        setSelectedUnitId("")
      } catch (error) {
        toast.error("Failed to load years")
        console.error("Error loading years:", error)
      }
    }

    fetchYears()
  }, [selectedCourseId])

  // Load semesters when year is selected
  useEffect(() => {
    if (!selectedYearId) return

    const fetchSemesters = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/years/${selectedYearId}/semesters/`)
        setSemesters(res.data)
        setUnits([])
        setSelectedSemesterId("")
        setSelectedUnitId("")
      } catch (error) {
        toast.error("Failed to load semesters")
        console.error("Error loading semesters:", error)
      }
    }

    fetchSemesters()
  }, [selectedYearId])

  // Load units when semester is selected
  useEffect(() => {
    if (!selectedSemesterId) return

    const fetchUnits = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/semesters/${selectedSemesterId}/units/`)
        setUnits(res.data)
        setSelectedUnitId("")
      } catch (error) {
        toast.error("Failed to load units")
        console.error("Error loading units:", error)
      }
    }

    fetchUnits()
  }, [selectedSemesterId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedUnitId) {
      toast.error("Please select a unit")
      return
    }

    if (!file) {
      toast.error("Please select a file to upload")
      return
    }

    const formData = new FormData()
    formData.append("file", file)
    formData.append("unit_id", selectedUnitId)

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + Math.random() * 15
          return newProgress > 90 ? 90 : newProgress
        })
      }, 300)

      const res = await axios.post(`${API_BASE_URL}/documents/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (res.status === 200 || res.status === 201) {
        toast.success("Document uploaded successfully")
        setFile(null)

        // Reset file input
        const fileInput = document.getElementById("file-upload") as HTMLInputElement
        if (fileInput) fileInput.value = ""
      }
    } catch (error) {
      toast.error("Upload failed. Please try again.")
      console.error("Upload failed:", error)
    } finally {
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
      }, 1000)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-black/[0.96] text-white antialiased bg-grid-white/[0.02] relative overflow-hidden">
      {/* Ambient background with moving particles */}
      <div className="h-full w-full absolute inset-0 z-0">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={100}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>

      {/* Floating papers background */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <FloatingPaper count={4} />
      </div>

      <div className="relative z-10">
        <Navbar />

        <div className="container mx-auto p-6">
          <PageHeader
            title="Upload Document"
            icon={<FileUp className="h-6 w-6" />}
            description="Upload documents to specific courses, years, semesters, and units"
          />

          <Card className="max-w-2xl mx-auto bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle>Document Upload</CardTitle>
              <CardDescription className="text-gray-400">
                Select the course hierarchy and choose a file to upload
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="course">Course</Label>
                    <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                      <SelectTrigger id="course" className="bg-white/5 border-white/20">
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-white/20">
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {years.length > 0 && (
                    <div className="grid gap-2">
                      <Label htmlFor="year">Year</Label>
                      <Select value={selectedYearId} onValueChange={setSelectedYearId}>
                        <SelectTrigger id="year" className="bg-white/5 border-white/20">
                          <SelectValue placeholder="Select a year" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-white/20">
                          {years.map((year) => (
                            <SelectItem key={year.id} value={year.id.toString()}>
                              {year.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {semesters.length > 0 && (
                    <div className="grid gap-2">
                      <Label htmlFor="semester">Semester</Label>
                      <Select value={selectedSemesterId} onValueChange={setSelectedSemesterId}>
                        <SelectTrigger id="semester" className="bg-white/5 border-white/20">
                          <SelectValue placeholder="Select a semester" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-white/20">
                          {semesters.map((semester) => (
                            <SelectItem key={semester.id} value={semester.id.toString()}>
                              {semester.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {units.length > 0 && (
                    <div className="grid gap-2">
                      <Label htmlFor="unit">Unit</Label>
                      <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
                        <SelectTrigger id="unit" className="bg-white/5 border-white/20">
                          <SelectValue placeholder="Select a unit" />
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
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="file-upload">Document</Label>
                    <div className="border border-white/20 rounded-md p-2 bg-white/5">
                      <input
                        id="file-upload"
                        type="file"
                        className="w-full text-gray-400"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        disabled={isUploading}
                      />
                    </div>
                    {file && (
                      <p className="text-sm text-gray-400">
                        Selected file: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                      </p>
                    )}
                  </div>
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Uploading...</span>
                      <span className="text-sm font-medium">{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2 bg-white/10" indicatorClassName="bg-purple-600" />
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FileUp className="mr-2 h-4 w-4" />
                      Upload Document
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
          <Toaster />
        </div>
      </div>
    </div>
  )
}
