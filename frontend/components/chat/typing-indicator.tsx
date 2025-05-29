"use client"

import { motion } from "framer-motion"
import { Bot } from "lucide-react"

interface TypingIndicatorProps {
  show: boolean
}

export default function TypingIndicator({ show }: TypingIndicatorProps) {
  if (!show) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex gap-3 justify-start"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center">
        <Bot className="h-4 w-4 text-purple-400" />
      </div>

      <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-300">AI is thinking</span>
          <div className="flex gap-1 ml-2">
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0 }}
              className="w-2 h-2 bg-purple-400 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0.2 }}
              className="w-2 h-2 bg-purple-400 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0.4 }}
              className="w-2 h-2 bg-purple-400 rounded-full"
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
