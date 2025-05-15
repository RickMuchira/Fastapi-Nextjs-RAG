"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { FileText } from "lucide-react"
import Navbar from "@/components/navbar"
import BackgroundEffects from "@/components/background-effects"
import CourseAccordion from "@/components/course-accordion"

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

export default function Home() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showEffects, setShowEffects] = useState(true)

  // Fetch all courses with their nested data
  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/tree/`)
      setCourses(response.data)
    } catch (error) {
      console.error("Error fetching courses:", error)
      toast.error("Failed to load courses")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  // Create a new course
  const handleCreateCourse = async (name: string) => {
    try {
      await axios.post(`${API_BASE_URL}/courses/`, { name })
      toast.success(`Course "${name}" created successfully`)
      fetchCourses()
    } catch (error) {
      console.error("Error creating course:", error)
      toast.error("Failed to create course")
    }
  }

  // Update a course
  const handleUpdateCourse = async (id: number, name: string) => {
    try {
      await axios.put(`${API_BASE_URL}/courses/${id}`, { name })
      toast.success(`Course updated successfully`)
      fetchCourses()
    } catch (error) {
      console.error("Error updating course:", error)
      toast.error("Failed to update course")
    }
  }

  // Delete a course
  const handleDeleteCourse = async (id: number) => {
    try {
      await axios.delete(`${API_BASE_URL}/courses/${id}`)
      toast.success("Course deleted successfully")
      fetchCourses()
    } catch (error) {
      console.error("Error deleting course:", error)
      toast.error("Failed to delete course")
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {showEffects && <BackgroundEffects />}

      <Navbar onToggleEffects={() => setShowEffects(!showEffects)} />

      <main className="p-6 flex-1 relative z-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">EduRAG CMS Management</h1>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : courses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-muted p-8 rounded-lg text-center"
            >
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-medium mb-2">No courses found</h3>
              <p className="text-muted-foreground mb-4">Get started by creating your first course</p>
            </motion.div>
          ) : (
            <CourseAccordion
              courses={courses}
              onCreateCourse={handleCreateCourse}
              onUpdateCourse={handleUpdateCourse}
              onDeleteCourse={handleDeleteCourse}
              fetchCourses={fetchCourses}
            />
          )}
        </div>
      </main>
    </div>
  )
}
