"use client"

import { useState, useEffect } from "react"
import Navbar from "@/components/navbar"
import { SparklesCore } from "@/components/sparkles"
import ChatSidebar from "@/components/chat/chat-sidebar"
import ChatWindow from "@/components/chat/chat-window"
import type { ChatSession, ChatMessage } from "@/types/chat"
import { toast } from "sonner"
import { Toaster } from "sonner"

export default function AskQuestionPage() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  // Load chat sessions from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem("chatSessions")
    if (savedSessions) {
      try {
        const sessions = JSON.parse(savedSessions)
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

  // Save chat sessions to localStorage when they change
  useEffect(() => {
    localStorage.setItem("chatSessions", JSON.stringify(chatSessions))
  }, [chatSessions])

  const getCurrentSession = () => {
    if (!currentSessionId) return null
    return chatSessions.find((session) => session.id === currentSessionId) || null
  }

  const createNewSession = (unitId: number, unitName: string, coursePath: string) => {
    const sessionId = Date.now().toString()
    const newSession: ChatSession = {
      id: sessionId,
      unitId,
      unitName,
      coursePath,
      messages: [],
      timestamp: new Date(),
    }
    setChatSessions((prev) => [newSession, ...prev])
    setCurrentSessionId(sessionId)
    return sessionId
  }

  const addMessage = (sessionId: string, message: ChatMessage) => {
    setChatSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId ? { ...session, messages: [...session.messages, message] } : session,
      ),
    )
  }

  const updateMessage = (sessionId: string, messageId: string, updates: Partial<ChatMessage>) => {
    setChatSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              messages: session.messages.map((msg) => (msg.id === messageId ? { ...msg, ...updates } : msg)),
            }
          : session,
      ),
    )
  }

  const deleteSession = (sessionId: string) => {
    setChatSessions((prev) => prev.filter((session) => session.id !== sessionId))
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null)
    }
    toast.success("Chat session deleted")
  }

  const selectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId)
  }

  return (
    <div className="min-h-screen flex flex-col bg-black/[0.96] text-white antialiased relative overflow-hidden">
      {/* Ambient background with moving particles */}
      <div className="h-full w-full absolute inset-0 z-0">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.4}
          maxSize={1.0}
          particleDensity={50}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>

      <div className="relative z-10 flex flex-col h-screen">
        <Navbar />

        <div className="flex flex-1 overflow-hidden">
          <ChatSidebar
            sessions={chatSessions}
            currentSessionId={currentSessionId}
            onSelectSession={selectSession}
            onDeleteSession={deleteSession}
            onNewSession={() => setCurrentSessionId(null)}
          />

          <ChatWindow
            currentSession={getCurrentSession()}
            onCreateSession={createNewSession}
            onAddMessage={addMessage}
            onUpdateMessage={updateMessage}
          />
        </div>
      </div>

      <Toaster />
    </div>
  )
}
