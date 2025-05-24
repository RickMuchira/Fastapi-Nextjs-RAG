"use client"

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
import axios from "axios"
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

  /* -------- Helpers -------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [currentSession?.messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [question])

  /* -------- Submit handler -------- */
  const askQuestion = async () => {
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

      /* Ensure session exists */
      let sessionId = currentSession?.id
      if (!sessionId) {
        sessionId = onCreateSession(selectedUnit.unitId, selectedUnit.unitName, selectedUnit.coursePath)
      }

      /* 1️⃣  Add the user message */
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        type: "user",
        content: question.trim(),
        timestamp: new Date(),
      }
      onAddMessage(sessionId, userMsg)
      const currentQuestion = question.trim()
      setQuestion("")

      /* 2️⃣  Call the API */
      const res = await axios.post(`${API}/ask`, {
        unit_id: selectedUnit.unitId,
        question: currentQuestion,
      })

      /* 3️⃣  Add the assistant reply (after we have it) */
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: res.data.answer,
        timestamp: new Date(),
      }
      onAddMessage(sessionId, aiMsg)
    } catch (err) {
      toast.error("Failed to get answer")
      console.error("❌ Failed to get answer:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    askQuestion()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      askQuestion()
    }
  }

  /* -------- Save toggle -------- */
  const handleSaveMessage = (id: string) => {
    if (!currentSession) return
    const msg = currentSession.messages.find((m) => m.id === id)
    if (msg) {
      onUpdateMessage(currentSession.id, id, { saved: !msg.saved })
      toast.success(msg.saved ? "Message unsaved" : "Message saved")
    }
  }

  /* -------- Render -------- */
  return (
    <div className="flex-1 flex flex-col bg-black/20 backdrop-blur-sm">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {!currentSession ? (
            /* Empty-state intro */
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                  Ask a Question
                </h1>
                <p className="text-gray-400 mb-6">
                  Select a unit and start asking questions about your course content
                </p>
                <QuestionSuggestions onSelectSuggestion={setQuestion} />
              </div>
            </motion.div>
          ) : (
            <>
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-4 border-b border-white/10 mb-4"
              >
                <h2 className="text-xl font-semibold text-white">{currentSession.unitName}</h2>
                <p className="text-sm text-gray-400">{currentSession.coursePath}</p>
              </motion.div>

              {/* All bubbles */}
              {currentSession.messages.map((msg, i) => (
                <MessageBubble key={msg.id} message={msg} onSave={() => handleSaveMessage(msg.id)} delay={i * 0.1} />
              ))}

              {/* The ONE typing indicator */}
              {isLoading && <TypingIndicator />}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input zone */}
      <div className="border-t border-white/10 bg-black/40 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto p-4">
          {/* Unit dropdowns */}
          <div className="mb-4">
            <UnitSelector onUnitSelect={setSelectedUnit} selectedUnit={selectedUnit} />
          </div>

          <form onSubmit={handleSubmit} className="flex gap-3 items-end">
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                placeholder="Ask a question about your course content..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                rows={1}
                className="min-h-[60px] max-h-[200px] resize-none bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20"
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
