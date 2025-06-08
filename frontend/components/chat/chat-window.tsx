// frontend/components/chat/chat-window.tsx

"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ChatSession, ChatMessage, Citation } from "@/types/chat"
import MessageBubble from "@/components/chat/message-bubble"
import TypingIndicator from "@/components/chat/typing-indicator"
import UnitSelector from "@/components/chat/unit-selector"
import QuestionSuggestions from "@/components/chat/question-suggestions"
import { toast } from "sonner"

interface PDFDocument {
  id: number
  filename: string
  filepath: string
  course_path: string
}

interface ChatWindowProps {
  currentSession: ChatSession | null
  onCreateSession: (unitId: number, unitName: string, coursePath: string) => string
  onAddMessage: (sessionId: string, message: ChatMessage) => void
  onUpdateMessage: (sessionId: string, messageId: string, updates: Partial<ChatMessage>) => void

  // unified selector & PDF dropdown props
  selectedUnit: { unitId: number; unitName: string; coursePath: string } | null
  onUnitSelect: (u: { unitId: number; unitName: string; coursePath: string } | null) => void

  unitPdfs?: PDFDocument[]         // default to []
  selectedPdfId?: number | null   // default to null
  onPdfSelect: (id: number) => void
}

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

export default function ChatWindow({
  currentSession,
  onCreateSession,
  onAddMessage,
  onUpdateMessage,

  selectedUnit,
  onUnitSelect,

  unitPdfs = [],
  selectedPdfId = null,
  onPdfSelect,
}: ChatWindowProps) {
  const [question, setQuestion] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
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
    setIsLoading(true)

    // Create or reuse session
    let sessionId = currentSession?.id
    if (!sessionId) {
      sessionId = onCreateSession(
        selectedUnit.unitId,
        selectedUnit.unitName,
        selectedUnit.coursePath
      )
    }

    // User message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: question.trim(),
      timestamp: new Date(),
    }
    onAddMessage(sessionId, userMsg)
    setQuestion("")

    // Assistant placeholder
    const assistantId = (Date.now() + 1).toString()
    onAddMessage(sessionId, {
      id: assistantId,
      type: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
      citations: [],
    })

    // Stream response
    try {
      const res = await fetch(`${API}/ask/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unit_id: selectedUnit.unitId,
          question: userMsg.content,
        }),
      })
      if (!res.ok) throw new Error("Network error")
      const reader = res.body!.getReader()
      const dec = new TextDecoder()
      let acc = "", cites: Citation[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = dec.decode(value, { stream: true })
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue
          const data = line.slice(6).trim()
          if (data === "[DONE]") {
            onUpdateMessage(sessionId!, assistantId, { isStreaming: false })
            setIsLoading(false)
            return
          }
          try {
            const p = JSON.parse(data)
            const upd: Partial<ChatMessage> = {}
            if (p.token) {
              acc += p.token
              upd.content = acc
            }
            if (p.citations) {
              cites = p.citations
              upd.citations = cites
            }
            if (Object.keys(upd).length) {
              onUpdateMessage(sessionId!, assistantId, upd)
            }
          } catch {}
        }
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to get answer")
      onUpdateMessage(currentSession!.id, assistantId, { isStreaming: false })
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

  const toggleSave = (mid: string) => {
    if (!currentSession) return
    const m = currentSession.messages.find((m) => m.id === mid)
    if (!m) return
    onUpdateMessage(currentSession.id, mid, { saved: !m.saved })
    toast.success(m.saved ? "Message unsaved" : "Message saved")
  }

  return (
    <div className="flex-1 flex flex-col bg-black/20 backdrop-blur-sm">
      {/* Chat messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {!currentSession ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                  Ask a Question
                </h1>
                <p className="text-gray-400 mb-6">
                  Select a unit and start asking questions about your course
                  content
                </p>
                <QuestionSuggestions onSelectSuggestion={setQuestion} />
              </div>
            </motion.div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-4 border-b border-white/10 mb-4"
              >
                <h2 className="text-xl font-semibold text-white">
                  {currentSession.unitName}
                </h2>
                <p className="text-sm text-gray-400">
                  {currentSession.coursePath}
                </p>
              </motion.div>

              {currentSession.messages.map((m, i) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  onSave={() => toggleSave(m.id)}
                  delay={i * 0.1}
                />
              ))}

              {isLoading &&
                !currentSession.messages.some((m) => m.isStreaming) && (
                  <TypingIndicator show />
                )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Bottom controls: selectors row */}
      <div className="border-t border-white/10 bg-black/40 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center gap-4">
          {/* Unit selector */}
          <div className="flex-1">
            <UnitSelector
              onUnitSelect={onUnitSelect}
              selectedUnit={selectedUnit}
            />
          </div>

          {/* PDF dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-300">Document:</label>
            <select
              disabled={unitPdfs.length === 0}
              className="bg-white/5 border-white/20 text-white px-3 py-2 rounded disabled:opacity-50"
              value={selectedPdfId ?? ""}
              onChange={(e) => onPdfSelect(Number(e.target.value))}
            >
              {unitPdfs.length === 0 ? (
                <option value="">No documents</option>
              ) : (
                unitPdfs.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.filename}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Input row */}
        <div className="max-w-4xl mx-auto px-4 pb-4 flex gap-3 items-end">
          <Textarea
            ref={textareaRef}
            placeholder="Ask a question about your course content..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1 min-h-[60px] max-h-[200px] resize-none bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20"
            rows={1}
          />
          <Button
            type="submit"
            onClick={(e) => handleSubmit(e as any)}
            disabled={isLoading || !question.trim() || !selectedUnit}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
