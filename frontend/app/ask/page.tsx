"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { PageHeader } from "@/components/layout/page-header"
import {
  MessageSquare,
  Loader2,
  Send,
  User,
  Bot,
  Clock,
  Bookmark,
  BookmarkCheck,
  RotateCcw,
  Lightbulb,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Navbar from "@/components/navbar"
import { SparklesCore } from "@/components/sparkles"

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

interface ChatMessage {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
  saved?: boolean
}

interface ChatSession {
  id: string
  unitId: number
  unitName: string
  coursePath: string
  messages: ChatMessage[]
  timestamp: Date
}

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

// Sample question suggestions
const QUESTION_SUGGESTIONS = [
  "Can you summarize the key concepts in this unit?",
  "What are the main topics covered in this material?",
  "Explain the relationship between the concepts in this unit",
  "What are some practical applications of these concepts?",
  "How does this unit connect to other parts of the course?",
]

export default function AskQuestionPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [years, setYears] = useState<Year[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [units, setUnits] = useState<Unit[]>([])

  const [courseId, setCourseId] = useState<string>("")
  const [yearId, setYearId] = useState<string>("")
  const [semesterId, setSemesterId] = useState<string>("")
  const [unitId, setUnitId] = useState<string>("")
  const [unitName, setUnitName] = useState<string>("")
  const [coursePath, setCoursePath] = useState<string>("")

  const [question, setQuestion] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("new")

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get(`${API}/courses/`)
        setCourses(res.data)
      } catch (err) {
        toast.error("Failed to fetch courses")
        console.error("Error fetching courses:", err)
      }
    }

    fetchCourses()

    // Load chat sessions from localStorage
    const savedSessions = localStorage.getItem("chatSessions")
    if (savedSessions) {
      try {
        const sessions = JSON.parse(savedSessions)
        // Convert string timestamps back to Date objects
        const parsedSessions = sessions.map((session: any) => ({
          ...session,
          timestamp: new Date(session.timestamp),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }))
        setChatSessions(parsedSessions)
      } catch (error) {
        console.error("Error parsing saved chat sessions:", error)
      }
    }
  }, [])

  // Load years when course is selected
  useEffect(() => {
    if (!courseId) return

    const fetchYears = async () => {
      try {
        const res = await axios.get(`${API}/courses/${courseId}/years/`)
        setYears(res.data)
      } catch (err) {
        toast.error("Failed to fetch years")
        console.error("Error fetching years:", err)
      }
    }

    fetchYears()
    setYearId("")
    setSemesters([])
    setSemesterId("")
    setUnits([])
    setUnitId("")
    updateCoursePath()
  }, [courseId])

  // Load semesters when year is selected
  useEffect(() => {
    if (!yearId) return

    const fetchSemesters = async () => {
      try {
        const res = await axios.get(`${API}/years/${yearId}/semesters/`)
        setSemesters(res.data)
      } catch (err) {
        toast.error("Failed to fetch semesters")
        console.error("Error fetching semesters:", err)
      }
    }

    fetchSemesters()
    setSemesterId("")
    setUnits([])
    setUnitId("")
    updateCoursePath()
  }, [yearId])

  // Load units when semester is selected
  useEffect(() => {
    if (!semesterId) return

    const fetchUnits = async () => {
      try {
        const res = await axios.get(`${API}/semesters/${semesterId}/units/`)
        setUnits(res.data)
      } catch (err) {
        toast.error("Failed to fetch units")
        console.error("Error fetching units:", err)
      }
    }

    fetchUnits()
    setUnitId("")
    updateCoursePath()
  }, [semesterId])

  // Update unit name and course path when unit is selected
  useEffect(() => {
    if (!unitId) {
      setUnitName("")
      return
    }

    const selectedUnit = units.find((u) => u.id.toString() === unitId)
    if (selectedUnit) {
      setUnitName(selectedUnit.name)
    }

    updateCoursePath()
  }, [unitId, units])

  // Scroll to bottom of messages when new message is added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [chatSessions, currentSessionId])

  // Save chat sessions to localStorage when they change
  useEffect(() => {
    localStorage.setItem("chatSessions", JSON.stringify(chatSessions))
  }, [chatSessions])

  const updateCoursePath = () => {
    const course = courses.find((c) => c.id.toString() === courseId)
    const year = years.find((y) => y.id.toString() === yearId)
    const semester = semesters.find((s) => s.id.toString() === semesterId)

    let path = ""
    if (course) path += course.name
    if (year) path += ` > ${year.name}`
    if (semester) path += ` > ${semester.name}`

    setCoursePath(path)
  }

  const getCurrentSession = () => {
    if (!currentSessionId) return null
    return chatSessions.find((session) => session.id === currentSessionId) || null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!unitId) {
      toast.error("Please select a unit")
      return
    }

    if (!question.trim()) {
      toast.error("Please enter a question")
      return
    }

    try {
      setIsLoading(true)

      // Create a new session or use the current one
      let sessionId = currentSessionId
      if (!sessionId || activeTab === "new") {
        sessionId = Date.now().toString()
        const newSession: ChatSession = {
          id: sessionId,
          unitId: Number.parseInt(unitId),
          unitName,
          coursePath,
          messages: [],
          timestamp: new Date(),
        }
        setChatSessions((prev) => [newSession, ...prev])
        setCurrentSessionId(sessionId)
        setActiveTab("chat")
      }

      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "user",
        content: question.trim(),
        timestamp: new Date(),
      }

      setChatSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId ? { ...session, messages: [...session.messages, userMessage] } : session,
        ),
      )

      // Clear input
      setQuestion("")

      // Send request to API
      const res = await axios.post(`${API}/ask`, {
        unit_id: Number.parseInt(unitId),
        question: userMessage.content,
      })

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "assistant",
        content: res.data.answer,
        timestamp: new Date(),
      }

      setChatSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId ? { ...session, messages: [...session.messages, assistantMessage] } : session,
        ),
      )
    } catch (err) {
      toast.error("Failed to get answer")
      console.error("❌ Failed to get answer:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveMessage = (sessionId: string, messageId: string) => {
    setChatSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              messages: session.messages.map((msg) => (msg.id === messageId ? { ...msg, saved: !msg.saved } : msg)),
            }
          : session,
      ),
    )
  }

  const handleDeleteSession = (sessionId: string) => {
    setChatSessions((prev) => prev.filter((session) => session.id !== sessionId))
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null)
      setActiveTab("new")
    }
  }

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId)
    setActiveTab("chat")

    // Set the form fields based on the selected session
    const session = chatSessions.find((s) => s.id === sessionId)
    if (session) {
      const unit = units.find((u) => u.id === session.unitId)
      if (unit) {
        setUnitId(unit.id.toString())
      }
    }
  }

  const handleUseQuestionSuggestion = (suggestion: string) => {
    setQuestion(suggestion)
  }

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date)
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === now.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date)
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

      <div className="relative z-10">
        <Navbar />

        <div className="container mx-auto p-6">
          <PageHeader
            title="Ask a Question"
            icon={<MessageSquare className="h-6 w-6" />}
            description="Ask questions about your course content using our RAG system"
          />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar with chat history */}
            <div className="md:col-span-1">
              <Card className="h-[calc(100vh-200px)] bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg">Chat History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-280px)]">
                    {chatSessions.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-400">
                        <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-50" />
                        <p>No chat history yet</p>
                        <p className="text-sm">Your conversations will appear here</p>
                      </div>
                    ) : (
                      <div className="space-y-1 px-1">
                        {chatSessions.map((session) => (
                          <div
                            key={session.id}
                            className={`p-2 rounded-md cursor-pointer transition-colors ${
                              currentSessionId === session.id && activeTab === "chat"
                                ? "bg-purple-500/20"
                                : "hover:bg-white/10"
                            }`}
                            onClick={() => handleSelectSession(session.id)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="truncate flex-1">
                                <p className="font-medium truncate">{session.unitName}</p>
                                <p className="text-xs text-gray-400 truncate">{session.coursePath}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-50 hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteSession(session.id)
                                }}
                              >
                                <RotateCcw className="h-3 w-3" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <p className="text-xs text-gray-400">
                                {session.messages.length} message{session.messages.length !== 1 ? "s" : ""}
                              </p>
                              <p className="text-xs text-gray-400">{formatDate(session.timestamp)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
                <CardFooter className="border-t border-white/10 p-4">
                  <Button
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-purple-500/20"
                    onClick={() => {
                      setCurrentSessionId(null)
                      setActiveTab("new")
                    }}
                  >
                    New Conversation
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Main content */}
            <div className="md:col-span-3">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/10">
                  <TabsTrigger value="new" className="data-[state=active]:bg-purple-600">
                    New Question
                  </TabsTrigger>
                  <TabsTrigger value="chat" disabled={!currentSessionId} className="data-[state=active]:bg-purple-600">
                    Chat
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="new">
                  <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                    <CardHeader>
                      <CardTitle>Ask a New Question</CardTitle>
                      <CardDescription className="text-gray-400">
                        Select a course, year, semester, and unit to ask a question about
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-4">
                          <Select value={courseId} onValueChange={setCourseId}>
                            <SelectTrigger className="bg-white/5 border-white/20">
                              <SelectValue placeholder="Select Course" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-white/20">
                              {courses.map((c) => (
                                <SelectItem key={c.id} value={c.id.toString()}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {years.length > 0 && (
                            <Select value={yearId} onValueChange={setYearId}>
                              <SelectTrigger className="bg-white/5 border-white/20">
                                <SelectValue placeholder="Select Year" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-900 border-white/20">
                                {years.map((y) => (
                                  <SelectItem key={y.id} value={y.id.toString()}>
                                    {y.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}

                          {semesters.length > 0 && (
                            <Select value={semesterId} onValueChange={setSemesterId}>
                              <SelectTrigger className="bg-white/5 border-white/20">
                                <SelectValue placeholder="Select Semester" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-900 border-white/20">
                                {semesters.map((s) => (
                                  <SelectItem key={s.id} value={s.id.toString()}>
                                    {s.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}

                          {units.length > 0 && (
                            <Select value={unitId} onValueChange={setUnitId}>
                              <SelectTrigger className="bg-white/5 border-white/20">
                                <SelectValue placeholder="Select Unit" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-900 border-white/20">
                                {units.map((u) => (
                                  <SelectItem key={u.id} value={u.id.toString()}>
                                    {u.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}

                          <div>
                            <Textarea
                              placeholder="Type your question here..."
                              value={question}
                              onChange={(e) => setQuestion(e.target.value)}
                              className="min-h-[120px] bg-white/5 border-white/20"
                            />

                            {/* Question suggestions */}
                            <div className="mt-2">
                              <p className="text-sm text-gray-400 flex items-center mb-2">
                                <Lightbulb className="h-3 w-3 mr-1" />
                                Question suggestions:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {QUESTION_SUGGESTIONS.map((suggestion, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="cursor-pointer hover:bg-purple-500/20 border-white/20"
                                    onClick={() => handleUseQuestionSuggestion(suggestion)}
                                  >
                                    {suggestion}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          <Button
                            type="submit"
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Send className="mr-2 h-4 w-4" />
                                Ask Question
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="chat">
                  <Card className="h-[calc(100vh-200px)] flex flex-col bg-white/5 backdrop-blur-sm border-white/10">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{getCurrentSession()?.unitName || "Chat"}</CardTitle>
                          <CardDescription className="text-gray-400">
                            {getCurrentSession()?.coursePath || ""}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden">
                      <ScrollArea className="h-[calc(100vh-350px)] pr-4">
                        <div className="space-y-4">
                          {getCurrentSession()?.messages.map((message) => (
                            <AnimatePresence key={message.id} mode="popLayout">
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                              >
                                <div
                                  className={`flex max-w-[80%] ${
                                    message.type === "user" ? "flex-row-reverse" : "flex-row"
                                  }`}
                                >
                                  <div
                                    className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full ${
                                      message.type === "user" ? "bg-purple-600 ml-2" : "bg-white/10 mr-2"
                                    }`}
                                  >
                                    {message.type === "user" ? (
                                      <User className="h-4 w-4 text-white" />
                                    ) : (
                                      <Bot className="h-4 w-4" />
                                    )}
                                  </div>
                                  <div>
                                    <div
                                      className={`rounded-lg p-4 ${
                                        message.type === "user" ? "bg-purple-600 text-white" : "bg-white/10 text-white"
                                      }`}
                                    >
                                      <div className="prose prose-sm dark:prose-invert">
                                        <p className="whitespace-pre-line">{message.content}</p>
                                      </div>
                                    </div>
                                    <div
                                      className={`mt-1 flex items-center text-xs text-gray-400 ${
                                        message.type === "user" ? "justify-end" : "justify-start"
                                      }`}
                                    >
                                      <Clock className="mr-1 h-3 w-3" />
                                      <span>{formatTimestamp(message.timestamp)}</span>

                                      {message.type === "assistant" && (
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 ml-1"
                                                onClick={() => handleSaveMessage(getCurrentSession()!.id, message.id)}
                                              >
                                                {message.saved ? (
                                                  <BookmarkCheck className="h-3 w-3 text-purple-400" />
                                                ) : (
                                                  <Bookmark className="h-3 w-3" />
                                                )}
                                                <span className="sr-only">
                                                  {message.saved ? "Unsave" : "Save"} answer
                                                </span>
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>{message.saved ? "Unsave" : "Save"} this answer</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </AnimatePresence>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>
                    </CardContent>
                    <CardFooter className="border-t border-white/10 pt-4">
                      <form onSubmit={handleSubmit} className="flex w-full items-end gap-2">
                        <Textarea
                          placeholder="Type your message..."
                          value={question}
                          onChange={(e) => setQuestion(e.target.value)}
                          className="min-h-[80px] bg-white/5 border-white/20"
                        />
                        <Button
                          type="submit"
                          size="icon"
                          disabled={isLoading}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          <span className="sr-only">Send message</span>
                        </Button>
                      </form>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <Toaster />
        </div>
      </div>
    </div>
  )
}
