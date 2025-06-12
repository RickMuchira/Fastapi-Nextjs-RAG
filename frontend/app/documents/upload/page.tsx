"use client"

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

interface Unit { id: number; name: string }
interface Semester { id: number; name: string; units: Unit[] }
interface Year { id: number; name: string; semesters: Semester[] }
interface Course { id: number; name: string; years: Year[] }

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

export default function UploadDocumentPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [selectedYearId, setSelectedYearId] = useState<string>("")
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("")
  const [selectedUnitId, setSelectedUnitId] = useState<string>("")
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Get the cascaded objects for selection
  const selectedCourse = courses.find(c => c.id.toString() === selectedCourseId)
  const years = selectedCourse?.years ?? []
  const selectedYear = years.find(y => y.id.toString() === selectedYearId)
  const semesters = selectedYear?.semesters ?? []
  const selectedSemester = semesters.find(s => s.id.toString() === selectedSemesterId)
  const units = selectedSemester?.units ?? []

  useEffect(() => {
    // Fetch all courses + nested using the /tree/ endpoint for full hierarchy
    axios.get(`${API_BASE_URL}/tree/`)
      .then(res => {
        setCourses(res.data)
        // console.log("Courses tree:", res.data)
      })
      .catch(err => {
        toast.error("Failed to load courses")
        console.error("Error loading courses:", err)
      })
  }, [])

  // Reset deeper selects when a parent is changed
  useEffect(() => { setSelectedYearId(""); setSelectedSemesterId(""); setSelectedUnitId(""); }, [selectedCourseId])
  useEffect(() => { setSelectedSemesterId(""); setSelectedUnitId(""); }, [selectedYearId])
  useEffect(() => { setSelectedUnitId(""); }, [selectedSemesterId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUnitId) return toast.error("Please select a unit")
    if (!file) return toast.error("Please select a file to upload")

    const formData = new FormData()
    formData.append("file", file)
    formData.append("unit_id", selectedUnitId)

    setIsUploading(true)
    setUploadProgress(0)
    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => (prev + Math.random() * 15 > 90 ? 90 : prev + Math.random() * 15))
      }, 300)
      const res = await axios.post(`${API_BASE_URL}/documents/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      clearInterval(progressInterval)
      setUploadProgress(100)
      if (res.status === 200 || res.status === 201) {
        toast.success("Document uploaded successfully")
        setFile(null)
        const fileInput = document.getElementById("file-upload") as HTMLInputElement
        if (fileInput) fileInput.value = ""
      }
    } catch (error) {
      toast.error("Upload failed. Please try again.")
      console.error("Upload failed:", error)
    } finally {
      setTimeout(() => { setIsUploading(false); setUploadProgress(0) }, 1000)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-black/[0.96] text-white antialiased bg-grid-white/[0.02] relative overflow-hidden">
      <div className="h-full w-full absolute inset-0 z-0">
        <SparklesCore id="tsparticlesfullpage" background="transparent" minSize={0.6} maxSize={1.4} particleDensity={100} className="w-full h-full" particleColor="#FFFFFF" />
      </div>
      <div className="absolute inset-0 overflow-hidden z-0">
        <FloatingPaper count={4} />
      </div>
      <div className="relative z-10">
        <Navbar />
        <div className="container mx-auto p-6">
          <PageHeader title="Upload Document" icon={<FileUp className="h-6 w-6" />} description="Upload documents to specific courses, years, semesters, and units" />
          <Card className="max-w-2xl mx-auto bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle>Document Upload</CardTitle>
              <CardDescription className="text-gray-400">Select the course hierarchy and choose a file to upload</CardDescription>
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
                        {courses.length === 0 ? (
                          <div className="p-2 text-gray-400">No courses found</div>
                        ) : (
                          courses.map(course => (
                            <SelectItem key={course.id} value={course.id.toString()}>{course.name}</SelectItem>
                          ))
                        )}
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
                          {years.map(year => (
                            <SelectItem key={year.id} value={year.id.toString()}>{year.name}</SelectItem>
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
                          {semesters.map(semester => (
                            <SelectItem key={semester.id} value={semester.id.toString()}>{semester.name}</SelectItem>
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
                          {units.map(unit => (
                            <SelectItem key={unit.id} value={unit.id.toString()}>{unit.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="file-upload">Document</Label>
                    <div className="border border-white/20 rounded-md p-2 bg-white/5">
                      <input id="file-upload" type="file" className="w-full text-gray-400" onChange={e => setFile(e.target.files?.[0] || null)} disabled={isUploading} />
                    </div>
                    {file && (
                      <p className="text-sm text-gray-400">Selected file: {file.name} ({(file.size / 1024).toFixed(2)} KB)</p>
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

                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={isUploading}>
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