"use client"

import { motion } from "framer-motion"
import { Lightbulb } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface QuestionSuggestionsProps {
  onSelectSuggestion: (suggestion: string) => void
}

const SUGGESTIONS = [
  "Can you summarize the key concepts in this unit?",
  "What are the main topics covered in this material?",
  "Explain the relationship between the concepts in this unit",
  "What are some practical applications of these concepts?",
  "How does this unit connect to other parts of the course?",
  "What are the most important points to remember?",
  "Can you provide examples to illustrate these concepts?",
  "What are common misconceptions about this topic?",
]

export default function QuestionSuggestions({ onSelectSuggestion }: QuestionSuggestionsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Lightbulb className="h-4 w-4" />
        <span>Try asking:</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SUGGESTIONS.map((suggestion, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Badge
              variant="outline"
              className="w-full p-3 h-auto text-left cursor-pointer border-white/20 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all duration-200"
              onClick={() => onSelectSuggestion(suggestion)}
            >
              {suggestion}
            </Badge>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
