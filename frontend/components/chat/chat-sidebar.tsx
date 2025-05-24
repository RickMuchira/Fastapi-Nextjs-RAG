"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, Plus, Trash2, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ChatSession } from "@/types/chat"
import { cn } from "@/lib/utils"

interface ChatSidebarProps {
  sessions: ChatSession[]
  currentSessionId: string | null
  onSelectSession: (sessionId: string) => void
  onDeleteSession: (sessionId: string) => void
  onNewSession: () => void
}

export default function ChatSidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onNewSession,
}: ChatSidebarProps) {
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null)

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
      }).format(date)
    }
  }

  const getSessionPreview = (session: ChatSession) => {
    const lastMessage = session.messages[session.messages.length - 1]
    if (!lastMessage) return "New conversation"
    return lastMessage.content.slice(0, 60) + (lastMessage.content.length > 60 ? "..." : "")
  }

  return (
    <div className="w-64 bg-black/40 backdrop-blur-sm border-r border-white/10 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <Button onClick={onNewSession} className="w-full bg-purple-600 hover:bg-purple-700 text-white justify-start">
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Sessions List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          <AnimatePresence>
            {sessions.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 text-center text-gray-400">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs">Start a new chat to begin</p>
              </motion.div>
            ) : (
              sessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "group relative p-3 rounded-lg cursor-pointer transition-all duration-200",
                    currentSessionId === session.id
                      ? "bg-purple-600/20 border border-purple-500/30"
                      : "hover:bg-white/5 border border-transparent",
                  )}
                  onMouseEnter={() => setHoveredSessionId(session.id)}
                  onMouseLeave={() => setHoveredSessionId(null)}
                  onClick={() => onSelectSession(session.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-white truncate">{session.unitName}</h3>
                      <p className="text-xs text-gray-400 truncate mt-1">{session.coursePath}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{getSessionPreview(session)}</p>
                    </div>

                    <div className="flex items-center gap-1 ml-2">
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(session.timestamp)}
                      </div>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <AnimatePresence>
                    {hoveredSessionId === session.id && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteSession(session.id)
                        }}
                        className="absolute top-2 right-2 p-1 rounded-md bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </motion.button>
                    )}
                  </AnimatePresence>

                  {/* Message Count Badge */}
                  {session.messages.length > 0 && (
                    <div className="absolute bottom-2 right-2 bg-purple-600/30 text-purple-300 text-xs px-2 py-0.5 rounded-full">
                      {session.messages.length}
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  )
}
