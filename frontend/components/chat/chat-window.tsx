"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ChatSession, ChatMessage } from "@/types/chat"
import MessageBubble from "@/components/chat/message-bubble"
import TypingIndicator from "@/components/chat/typing-indicator"
import UnitSelector from "@/components/chat/unit-selector"
import QuestionSuggestions from "@/components/chat/question-suggestions"
import { toast } from "sonner"

interface ChatWindowProps {
  currentSession: ChatSession | null
  onCreateSession: (unitId: number, unitName: string, coursePath: string) => string
  onAddMessage: (sessionId: string, message: ChatMessage) => void
  onUpdateMessage: (sessionId: string, messageId: string, updates: Partial<ChatMessage>) => void
}

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

export default function ChatWindow({
  currentSession,
  onCreateSession,
  onAddMessage,
  onUpdateMessage,
}: ChatWindowProps) {
  const [question, setQuestion] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<{
    unitId: number
    unitName: string
    coursePath: string
  } | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [currentSession?.messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [question])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedUnit) {
      toast.error("Please select a unit")
      return
    }

    if (!question.trim()) {
      toast.error("Please enter a question")
      return
    }

    try {
      setIsLoading(true)

      // Create session if none exists or use current one
      let sessionId = currentSession?.id
      if (!sessionId) {
        sessionId = onCreateSession(selectedUnit.unitId, selectedUnit.unitName, selectedUnit.coursePath)
      }

      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "user",
        content: question.trim(),
        timestamp: new Date(),
      }

      onAddMessage(sessionId, userMessage)

      // Clear input
      const currentQuestion = question.trim()
      setQuestion("")

      // Add streaming assistant message
      const assistantMessageId = (Date.now() + 1).toString()
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        type: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      }

      onAddMessage(sessionId, assistantMessage)

      // Start streaming response (handles JSON {"token": "..."} per chunk)
      const response = await fetch(`${API}/ask/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          unit_id: selectedUnit.unitId,
          question: currentQuestion,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulatedContent = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          console.log("Chunk received:", chunk)
          const lines = chunk.split("\n")
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim()
              if (!data) continue

              if (data === "[DONE]") {
                onUpdateMessage(sessionId, assistantMessageId, {
                  isStreaming: false,
                })
                return
              }

              try {
                const parsed = JSON.parse(data)
                console.log("Parsed token:", parsed.token)
                if (parsed.token) {
                  accumulatedContent += parsed.token
                  onUpdateMessage(sessionId, assistantMessageId, {
                    content: accumulatedContent,
                  })
                }
              } catch (e) {
                console.warn("Invalid JSON chunk skipped:", data)
              }
            }
          }
        }
      }

      // Fallback: mark as complete if we exit the loop
      onUpdateMessage(sessionId, assistantMessageId, {
        isStreaming: false,
      })
    } catch (err) {
      toast.error("Failed to get answer")
      console.error("❌ Failed to get answer:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleSaveMessage = (messageId: string) => {
    if (!currentSession) return
    const message = currentSession.messages.find((msg) => msg.id === messageId)
    if (message) {
      onUpdateMessage(currentSession.id, messageId, { saved: !message.saved })
      toast.success(message.saved ? "Message unsaved" : "Message saved")
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-black/20 backdrop-blur-sm">
      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {!currentSession ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                  Ask a Question
                </h1>
                <p className="text-gray-400 mb-6">Select a unit and start asking questions about your course content</p>
                <QuestionSuggestions onSelectSuggestion={setQuestion} />
              </div>
            </motion.div>
          ) : (
            <>
              {/* Session Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-4 border-b border-white/10 mb-4"
              >
                <h2 className="text-xl font-semibold text-white">{currentSession.unitName}</h2>
                <p className="text-sm text-gray-400">{currentSession.coursePath}</p>
              </motion.div>

              {/* Messages */}
              {currentSession.messages.map((message, index) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onSave={() => handleSaveMessage(message.id)}
                  delay={index * 0.1}
                />
              ))}

              {/* Typing Indicator - only show when loading but not streaming */}
              {isLoading && !currentSession?.messages.some((msg) => msg.isStreaming) && <TypingIndicator show={true} />}
            </>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-white/10 bg-black/40 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto p-4">
          {/* Unit Selector */}
          <div className="mb-4">
            <UnitSelector onUnitSelect={setSelectedUnit} selectedUnit={selectedUnit} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex gap-3 items-end">
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                placeholder="Ask a question about your course content..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="min-h-[60px] max-h-[200px] resize-none bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20"
                rows={1}
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading || !question.trim() || !selectedUnit}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 h-auto"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
