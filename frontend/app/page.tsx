"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { FileText, Sparkles, Plus } from "lucide-react"
import Navbar from "@/components/navbar"
import CourseAccordion from "@/components/course-accordion"
import { SparklesCore } from "@/components/sparkles"
import { FloatingPaper } from "@/components/floating-paper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Link from "next/link"

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

export default function Home() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateCourseDialog, setShowCreateCourseDialog] = useState(false)
  const [newCourseNameInput, setNewCourseNameInput] = useState("")


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
      setNewCourseNameInput("") // Clear input after successful creation
      setShowCreateCourseDialog(false) // Close dialog
    } catch (error) {
      console.error("Error creating course:", error)
      toast.error("Failed to create course")
    }
  }

  // Handle dialog submission for course creation
  const handleDialogCreateCourse = () => {
    if (!newCourseNameInput.trim()) {
      toast.error("Please enter a course name")
      return
    }
    handleCreateCourse(newCourseNameInput)
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
        <FloatingPaper count={6} />
      </div>

      <div className="relative z-10">
        <Navbar />

        <main className="container mx-auto p-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                  EduRAG CMS
                </span>
              </h1>
              <p className="text-gray-400 text-xl mb-8 max-w-2xl">
                Manage your educational content and leverage AI to enhance learning experiences.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10"
              >
                <FileText className="h-10 w-10 text-purple-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Document Management</h2>
                <p className="text-gray-400 mb-4">
                  Upload, process, and organize your educational materials in a structured hierarchy.
                </p>
                <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Link href="/documents">Manage Documents</Link>
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10"
              >
                <Sparkles className="h-10 w-10 text-purple-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">AI-Powered Q&A</h2>
                <p className="text-gray-400 mb-4">
                  Ask questions about your course content and get intelligent answers using our RAG system.
                </p>
                <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Link href="/ask">Ask Questions</Link>
                </Button>
              </motion.div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              </div>
            ) : courses.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white/5 backdrop-blur-sm p-8 rounded-xl border border-white/10 text-center"
              >
                <FileText className="h-12 w-12 mx-auto mb-4 text-purple-400" />
                <h3 className="text-xl font-medium mb-2">No courses found</h3>
                <p className="text-gray-400 mb-4">Get started by creating your first course</p>
                <Button
                  onClick={() => setShowCreateCourseDialog(true)}
                  className="mt-4 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Course
                </Button>
              </motion.div>
            ) : (
              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Course Management</h2>
                  <Button
                    onClick={() => setShowCreateCourseDialog(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Course
                  </Button>
                </div>
                <CourseAccordion
                  courses={courses}
                  onCreateCourse={handleCreateCourse}
                  onUpdateCourse={handleUpdateCourse}
                  onDeleteCourse={handleDeleteCourse}
                  fetchCourses={fetchCourses}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Course Dialog */}
      <Dialog open={showCreateCourseDialog} onOpenChange={setShowCreateCourseDialog}>
        <DialogContent className="bg-gray-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter the name for your new course.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Course name"
              value={newCourseNameInput}
              onChange={(e) => setNewCourseNameInput(e.target.value)}
              className="bg-white/5 border-white/20 text-white"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateCourseDialog(false)}
              className="border-white/20 hover:bg-white/10 text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleDialogCreateCourse}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
