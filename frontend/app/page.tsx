"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { 
  FileText, 
  Sparkles, 
  Plus, 
  MessageCircle, 
  BookOpen, 
  GraduationCap,
  Brain,
  Zap,
  Target,
  BarChart3,
  Search,
  Upload,
  Users,
  Clock,
  Award,
  ChevronRight,
  Play,
  CheckCircle
} from "lucide-react"
import Navbar from "@/components/navbar"
import CourseAccordion from "@/components/course-accordion"
import { SparklesCore } from "@/components/sparkles"
import { FloatingPaper } from "@/components/floating-paper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

// Feature data for the system
const features = [
  {
    icon: <FileText className="h-8 w-8" />,
    title: "Smart Document Management",
    description: "Upload PDFs with automatic chunking, table extraction, and heading detection. Organize content in a hierarchical Course → Year → Semester → Unit structure.",
    color: "from-blue-500 to-cyan-500",
    link: "/documents",
    stats: "PDF Processing • Vector Storage • Metadata Extraction"
  },
  {
    icon: <Brain className="h-8 w-8" />,
    title: "AI-Powered Q&A System",
    description: "Ask questions about your course content and get intelligent answers with citations. Powered by RAG (Retrieval Augmented Generation) technology.",
    color: "from-purple-500 to-pink-500",
    link: "/ask",
    stats: "Real-time Chat • Citation System • Context-Aware"
  },
  {
    icon: <Target className="h-8 w-8" />,
    title: "Automatic Quiz Generation",
    description: "Generate multiple-choice quizzes automatically from your documents. Complete with explanations and difficulty assessment.",
    color: "from-green-500 to-emerald-500",
    link: "/topics",
    stats: "Auto-Generation • Multiple Choice • Instant Feedback"
  },
  {
    icon: <BarChart3 className="h-8 w-8" />,
    title: "Learning Analytics",
    description: "Track your progress, quiz scores, and learning streaks. Get insights into your academic performance.",
    color: "from-orange-500 to-red-500",
    link: "/profile",
    stats: "Progress Tracking • Performance Insights • Achievement System"
  },
  {
    icon: <Search className="h-8 w-8" />,
    title: "Advanced Search & Retrieval",
    description: "Semantic search through your documents with FAISS vector indexing. Find relevant information instantly.",
    color: "from-indigo-500 to-purple-500",
    link: "/ask",
    stats: "Vector Search • Semantic Matching • Instant Results"
  },
  {
    icon: <Zap className="h-8 w-8" />,
    title: "Real-time Streaming",
    description: "Experience real-time AI responses with streaming technology. Watch answers appear as they're generated.",
    color: "from-yellow-500 to-orange-500",
    link: "/ask",
    stats: "Live Streaming • Real-time Processing • Instant Feedback"
  }
]

const quickStats = [
  { label: "Courses Managed", value: "Unlimited", icon: <GraduationCap className="h-5 w-5" /> },
  { label: "AI Models", value: "3+", icon: <Brain className="h-5 w-5" /> },
  { label: "File Formats", value: "PDF", icon: <FileText className="h-5 w-5" /> },
  { label: "Response Time", value: "<2s", icon: <Zap className="h-5 w-5" /> }
]

const recentFeatures = [
  { title: "Streaming Quiz Generation", status: "new", color: "bg-green-500" },
  { title: "PDF Preview Panel", status: "new", color: "bg-blue-500" },
  { title: "Citation System", status: "updated", color: "bg-purple-500" },
  { title: "Dark Theme UI", status: "updated", color: "bg-indigo-500" }
]

export default function Home() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateCourseDialog, setShowCreateCourseDialog] = useState(false)
  const [newCourseNameInput, setNewCourseNameInput] = useState("")
  const [systemStats, setSystemStats] = useState({
    totalDocuments: 0,
    totalUnits: 0,
    totalQuizzes: 0
  })

  // Fetch all courses with their nested data
  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/tree/`)
      setCourses(response.data)
      
      // Calculate system stats
      let docs = 0, units = 0, quizzes = 0
      response.data.forEach((course: any) => {
        course.years?.forEach((year: any) => {
          year.semesters?.forEach((semester: any) => {
            semester.units?.forEach((unit: any) => {
              units++
              docs += unit.documents?.length || 0
              quizzes += unit.quiz_questions?.length || 0
            })
          })
        })
      })
      
      setSystemStats({ totalDocuments: docs, totalUnits: units, totalQuizzes: quizzes })
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
      setNewCourseNameInput("")
      setShowCreateCourseDialog(false)
    } catch (error) {
      console.error("Error creating course:", error)
      toast.error("Failed to create course")
    }
  }

  const handleDialogCreateCourse = () => {
    if (!newCourseNameInput.trim()) {
      toast.error("Please enter a course name")
      return
    }
    handleCreateCourse(newCourseNameInput)
  }

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
          <div className="max-w-7xl mx-auto">
            {/* Hero Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400">
                  EduRAG AI
                </span>
                <br />
                <span className="text-white text-3xl md:text-4xl lg:text-5xl">
                  Learning Management System
                </span>
              </h1>
              <p className="text-gray-400 text-xl mb-8 max-w-3xl mx-auto">
                Transform your educational content with AI-powered document processing, intelligent Q&A, 
                and automatic quiz generation. The future of learning is here.
              </p>
              
              {/* Quick Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg">
                  <Link href="/documents/upload">
                    <Upload className="mr-2 h-5 w-5" />
                    Upload Documents
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-white border-purple-500 hover:bg-purple-500/20 px-8 py-4 text-lg">
                  <Link href="/ask">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Ask AI Questions
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-white border-cyan-500 hover:bg-cyan-500/20 px-8 py-4 text-lg">
                  <Link href="/topics">
                    <Target className="mr-2 h-5 w-5" />
                    Take Quizzes
                  </Link>
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
                {quickStats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.5 }}
                    className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10"
                  >
                    <div className="flex items-center justify-center mb-2 text-purple-400">
                      {stat.icon}
                    </div>
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Features Grid */}
            <div className="mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-center mb-12"
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                    Powerful Features
                  </span>
                </h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  Everything you need for modern AI-powered education management
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.7 }}
                    whileHover={{ y: -5 }}
                  >
                    <Card className="bg-white/5 backdrop-blur-sm border-white/10 h-full group hover:border-white/20 transition-all duration-300">
                      <CardHeader>
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                          {feature.icon}
                        </div>
                        <CardTitle className="text-white group-hover:text-purple-400 transition-colors">
                          {feature.title}
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                          {feature.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4">
                          <Badge variant="secondary" className="bg-white/10 text-white text-xs">
                            {feature.stats}
                          </Badge>
                        </div>
                        <Button asChild className="w-full bg-white/10 hover:bg-white/20 text-white border-0">
                          <Link href={feature.link}>
                            Explore Feature
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* System Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
              {/* Recent Features */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 }}
              >
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Sparkles className="mr-2 h-5 w-5 text-purple-500" />
                      Latest Updates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {recentFeatures.map((feature, index) => (
                      <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.3 + index * 0.1 }}
                        className="flex items-center space-x-3"
                      >
                        <div className={`w-2 h-2 rounded-full ${feature.color}`} />
                        <span className="text-white text-sm flex-1">{feature.title}</span>
                        <Badge variant="outline" className="text-xs border-white/20 text-white">
                          {feature.status}
                        </Badge>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* System Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 }}
              >
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <BarChart3 className="mr-2 h-5 w-5 text-green-500" />
                      System Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Courses</span>
                      <span className="text-white font-semibold">{courses.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Active Units</span>
                      <span className="text-white font-semibold">{systemStats.totalUnits}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Documents</span>
                      <span className="text-white font-semibold">{systemStats.totalDocuments}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Quiz Questions</span>
                      <span className="text-white font-semibold">{systemStats.totalQuizzes}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.4 }}
              >
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Play className="mr-2 h-5 w-5 text-cyan-500" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button asChild className="w-full justify-start bg-white/10 hover:bg-white/20 text-white">
                      <Link href="/documents">
                        <FileText className="mr-2 h-4 w-4" />
                        Manage Documents
                      </Link>
                    </Button>
                    <Button asChild className="w-full justify-start bg-white/10 hover:bg-white/20 text-white">
                      <Link href="/ask">
                        <Brain className="mr-2 h-4 w-4" />
                        AI Assistant
                      </Link>
                    </Button>
                    <Button asChild className="w-full justify-start bg-white/10 hover:bg-white/20 text-white">
                      <Link href="/topics">
                        <Target className="mr-2 h-4 w-4" />
                        Practice Quizzes
                      </Link>
                    </Button>
                    <Button 
                      onClick={() => setShowCreateCourseDialog(true)}
                      className="w-full justify-start bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Course
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Course Management Section */}
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
                <GraduationCap className="h-16 w-16 mx-auto mb-4 text-purple-400" />
                <h3 className="text-2xl font-medium mb-2 text-white">Ready to Start Learning?</h3>
                <p className="text-gray-400 mb-6">Create your first course to begin organizing your educational content</p>
                <Button
                  onClick={() => setShowCreateCourseDialog(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Course
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
                className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10"
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Course Management</h2>
                    <p className="text-gray-400">Organize your educational content in a structured hierarchy</p>
                  </div>
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
              </motion.div>
            )}
          </div>
        </main>
      </div>

      {/* Create Course Dialog */}
      <Dialog open={showCreateCourseDialog} onOpenChange={setShowCreateCourseDialog}>
        <DialogContent className="bg-gray-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <GraduationCap className="mr-2 h-5 w-5 text-purple-500" />
              Create New Course
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter the name for your new course. You can add years, semesters, and units after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="e.g., Computer Science, Mathematics, Physics..."
              value={newCourseNameInput}
              onChange={(e) => setNewCourseNameInput(e.target.value)}
              className="bg-white/5 border-white/20 text-white"
              onKeyPress={(e) => e.key === "Enter" && handleDialogCreateCourse()}
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
              <CheckCircle className="mr-2 h-4 w-4" />
              Create Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
