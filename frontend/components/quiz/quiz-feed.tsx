"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import QuizCard from "./quiz-card"
import type { Quiz } from "@/lib/types/quiz"

interface QuizFeedProps {
  quizzes: Quiz[]
  onExit: () => void
}

export default function QuizFeed({ quizzes, onExit }: QuizFeedProps) {
  const [currentQuiz, setCurrentQuiz] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollTop = container.scrollTop
      const cardHeight = container.clientHeight
      const newIndex = Math.round(scrollTop / cardHeight)
      setCurrentQuiz(Math.max(0, Math.min(newIndex, quizzes.length - 1)))
    }

    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [quizzes.length])

  return (
    <div className="relative h-screen">
      {/* Exit Button */}
      <motion.div
        className="absolute top-4 left-4 z-30"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Button
          onClick={onExit}
          variant="ghost"
          size="sm"
          className="bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Exit Quiz
        </Button>
      </motion.div>

      {/* Quiz Progress */}
      <motion.div
        className="absolute top-4 right-4 z-30"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
          {currentQuiz + 1} / {quizzes.length}
        </div>
      </motion.div>

      <div
        ref={containerRef}
        className="h-screen overflow-y-scroll snap-y snap-mandatory"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitScrollbar: { display: "none" },
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {quizzes.map((quiz, index) => (
          <motion.div
            key={quiz.id}
            className="h-screen snap-start"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <QuizCard quiz={quiz} isActive={index === currentQuiz} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
