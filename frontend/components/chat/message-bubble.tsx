"use client"

import { motion } from "framer-motion"
import { User, Bot, Clock, Bookmark, BookmarkCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ChatMessage } from "@/types/chat"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"

interface MessageBubbleProps {
  message: ChatMessage
  onSave: () => void
  delay?: number
}

export default function MessageBubble({ message, onSave, delay = 0 }: MessageBubbleProps) {
  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date)
  }

  const isUser = message.type === "user"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center">
          <Bot className="h-4 w-4 text-purple-400" />
        </div>
      )}

      <div className={cn("max-w-[80%] space-y-1", isUser && "order-first")}>
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2, delay: delay + 0.1 }}
          className={cn(
            "rounded-2xl px-4 py-3 shadow-lg",
            isUser
              ? "bg-purple-600 text-white ml-auto"
              : "bg-white/10 backdrop-blur-sm border border-white/10 text-white",
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm prose-invert max-w-none">
              {message.isStreaming ? (
                <div className="flex items-center gap-2">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="whitespace-pre-wrap">
                    {message.content}
                  </motion.div>
                  <motion.div
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                    className="w-2 h-5 bg-purple-400 rounded-sm"
                  />
                </div>
              ) : (
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "")
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-lg"
                          {...props}
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      ) : (
                        <code className="bg-white/10 px-1 py-0.5 rounded text-sm" {...props}>
                          {children}
                        </code>
                      )
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              )}
            </div>
          )}
        </motion.div>

        <div className={cn("flex items-center gap-2 text-xs text-gray-400", isUser ? "justify-end" : "justify-start")}>
          <Clock className="h-3 w-3" />
          <span>{formatTimestamp(message.timestamp)}</span>

          {!isUser && !message.isStreaming && (
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSave}
                className="h-6 w-6 p-0 text-gray-400 hover:text-purple-400"
              >
                {message.saved ? (
                  <BookmarkCheck className="h-3 w-3 text-purple-400" />
                ) : (
                  <Bookmark className="h-3 w-3" />
                )}
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
          <User className="h-4 w-4 text-white" />
        </div>
      )}
    </motion.div>
  )
}
