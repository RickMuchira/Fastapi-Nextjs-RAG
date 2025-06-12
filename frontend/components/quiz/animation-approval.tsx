"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Upload, Play, Pause, Check, X, FileVideo, ImageIcon } from "lucide-react"
import axios from "axios"
import { toast } from "sonner"

interface UploadedFile {
  file: File
  preview: string
  progress: number
  status: "uploading" | "uploaded" | "approved" | "rejected"
  unitId?: string
}

interface Unit {
  id: number
  name: string
}
interface Semester {
  id: number
  name: string
  units: Unit[]
}
interface Year {
  id: number
  name: string
  semesters: Semester[]
}
interface Course {
  id: number
  name: string
  years: Year[]
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

export default function AnimationApproval() {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [selectedYearId, setSelectedYearId] = useState("")
  const [selectedSemesterId, setSelectedSemesterId] = useState("")
  const [selectedUnitId, setSelectedUnitId] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isPlaying, setIsPlaying] = useState<{ [key: number]: boolean }>({})

  // Get the cascaded objects for selection (matching your document upload system)
  const selectedCourse = courses.find((c) => c.id.toString() === selectedCourseId)
  const years = selectedCourse?.years ?? []
  const selectedYear = years.find((y) => y.id.toString() === selectedYearId)
  const semesters = selectedYear?.semesters ?? []
  const selectedSemester = semesters.find((s) => s.id.toString() === selectedSemesterId)
  const units = selectedSemester?.units ?? []

  useEffect(() => {
    // Fetch courses using your existing API
    axios
      .get(`${API_BASE_URL}/courses/`)
      .then((res) => setCourses(res.data))
      .catch((err) => toast.error("Failed to load courses"))
  }, [])

  // Reset deeper selects when a parent is changed (matching your document upload logic)
  useEffect(() => {
    setSelectedYearId("")
    setSelectedSemesterId("")
    setSelectedUnitId("")
  }, [selectedCourseId])
  useEffect(() => {
    setSelectedSemesterId("")
    setSelectedUnitId("")
  }, [selectedYearId])
  useEffect(() => {
    setSelectedUnitId("")
  }, [selectedSemesterId])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB")
        return
      }

      const preview = URL.createObjectURL(file)
      const newFile: UploadedFile = {
        file,
        preview,
        progress: 0,
        status: "uploading",
        unitId: selectedUnitId,
      }

      setUploadedFiles((prev) => [...prev, newFile])

      // Simulate upload progress (similar to your document upload)
      const interval = setInterval(() => {
        setUploadedFiles((prev) =>
          prev.map((f) => (f.file === file ? { ...f, progress: Math.min(f.progress + 10, 100) } : f)),
        )
      }, 200)

      setTimeout(() => {
        clearInterval(interval)
        setUploadedFiles((prev) => prev.map((f) => (f.file === file ? { ...f, progress: 100, status: "uploaded" } : f)))
      }, 2000)
    })
  }

  const handleApproval = async (index: number, approved: boolean) => {
    const file = uploadedFiles[index]
    if (!file.unitId) {
      toast.error("Unit information missing")
      return
    }

    try {
      // Here you would typically send the approval to your backend
      // For now, we'll just update the local state
      setUploadedFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, status: approved ? "approved" : "rejected" } : f)),
      )

      if (approved) {
        toast.success("Animation approved and linked to unit")
        // In a real implementation, you'd move the file to the appropriate location
        // and link it to the selected unit for quiz feedback screens
      } else {
        toast.success("Animation rejected")
      }
    } catch (error) {
      toast.error("Failed to process approval")
    }
  }

  const togglePlayback = (index: number) => {
    setIsPlaying((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Course Selection - Matching your document upload system */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Upload className="w-5 h-5 mr-2 text-purple-500" />
            Course Selection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Course</label>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select course" />
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
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Year</label>
                <Select value={selectedYearId} onValueChange={setSelectedYearId}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select year" />
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
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Semester</label>
                <Select value={selectedSemesterId} onValueChange={setSelectedSemesterId}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select semester" />
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
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Unit</label>
                <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select unit" />
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
          </div>
        </CardContent>
      </Card>

      {/* File Upload - Matching your document upload styling */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <FileVideo className="w-5 h-5 mr-2 text-purple-500" />
            Animation Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <input
                type="file"
                accept=".mp4,.gif"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={!selectedUnitId}
              />
              <label
                htmlFor="file-upload"
                className={`cursor-pointer ${!selectedUnitId ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <Upload className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                <p className="text-white mb-2">Click to upload animations</p>
                <p className="text-gray-400 text-sm">MP4 or GIF files, max 5MB each</p>
              </label>
            </motion.div>
          </div>

          {!selectedUnitId && (
            <p className="text-yellow-400 text-sm mt-2 text-center">
              Please select a course, year, semester, and unit first
            </p>
          )}
        </CardContent>
      </Card>

      {/* Uploaded Files - Similar to your document processing display */}
      {uploadedFiles.length > 0 && (
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Uploaded Animations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadedFiles.map((uploadedFile, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex items-start space-x-4">
                  {/* Preview */}
                  <div className="relative w-32 h-24 bg-black rounded-lg overflow-hidden">
                    {uploadedFile.file.type.startsWith("video/") ? (
                      <video
                        src={uploadedFile.preview}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        ref={(video) => {
                          if (video) {
                            if (isPlaying[index]) {
                              video.play()
                            } else {
                              video.pause()
                            }
                          }
                        }}
                      />
                    ) : (
                      <img
                        src={uploadedFile.preview || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    )}

                    {uploadedFile.file.type.startsWith("video/") && (
                      <button
                        onClick={() => togglePlayback(index)}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-black/70 transition-colors"
                      >
                        {isPlaying[index] ? (
                          <Pause className="w-6 h-6 text-white" />
                        ) : (
                          <Play className="w-6 h-6 text-white" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {uploadedFile.file.type.startsWith("video/") ? (
                        <FileVideo className="w-4 h-4 text-purple-500" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-purple-500" />
                      )}
                      <span className="text-white font-medium">{uploadedFile.file.name}</span>
                      <Badge variant="outline" className="text-gray-400 border-gray-600">
                        {(uploadedFile.file.size / 1024).toFixed(1)} KB
                      </Badge>
                    </div>

                    {/* Progress Bar - Matching your document upload progress */}
                    {uploadedFile.status === "uploading" && (
                      <div className="mb-3">
                        <Progress value={uploadedFile.progress} className="h-2" />
                        <p className="text-gray-400 text-sm mt-1">Uploading... {uploadedFile.progress}%</p>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="mb-3">
                      <Badge
                        className={
                          uploadedFile.status === "approved"
                            ? "bg-green-600 text-white"
                            : uploadedFile.status === "rejected"
                              ? "bg-red-600 text-white"
                              : uploadedFile.status === "uploaded"
                                ? "bg-yellow-600 text-white"
                                : "bg-blue-600 text-white"
                        }
                      >
                        {uploadedFile.status === "approved" && "Approved"}
                        {uploadedFile.status === "rejected" && "Rejected"}
                        {uploadedFile.status === "uploaded" && "Pending Review"}
                        {uploadedFile.status === "uploading" && "Uploading"}
                      </Badge>
                    </div>

                    {/* Action Buttons - Matching your document action styling */}
                    {uploadedFile.status === "uploaded" && (
                      <motion.div
                        className="flex space-x-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <Button
                          onClick={() => handleApproval(index, true)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button onClick={() => handleApproval(index, false)} size="sm" variant="destructive">
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
