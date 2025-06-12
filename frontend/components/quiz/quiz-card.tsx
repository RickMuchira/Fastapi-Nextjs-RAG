"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Timer } from "lucide-react"
import FeedbackScreen from "./feedback-screen"
import ShareButton from "./share-button"
import type { Quiz } from "@/lib/types/quiz"

interface QuizCardProps {
  quiz: Quiz
  isActive: boolean
}

export default function QuizCard({ quiz, isActive }: QuizCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [timeLeft, setTimeLeft] = useState(10)
  const [points, setPoints] = useState(1250)
  const [streak, setStreak] = useState(5)

  useEffect(() => {
    if (!isActive || showFeedback) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setShowFeedback(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isActive, showFeedback])

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer)
    setShowFeedback(true)

    if (answer === quiz.correctAnswer) {
      setPoints((prev) => prev + 10)
      setStreak((prev) => prev + 1)
    }
  }

  const handleNextQuiz = () => {
    setSelectedAnswer(null)
    setShowFeedback(false)
    setTimeLeft(10)
  }

  if (showFeedback) {
    return (
      <FeedbackScreen
        quiz={quiz}
        selectedAnswer={selectedAnswer}
        onNext={handleNextQuiz}
        points={points}
        streak={streak}
      />
    )
  }

  return (
    <div className="h-full relative flex items-center justify-center p-4">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${quiz.backgroundImage})`,
        }}
      />

      {/* Stats Bar */}
      <motion.div
        className="absolute top-4 left-4 right-4 flex justify-between items-center z-20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex space-x-4">
          <motion.div
            className="bg-purple-600 px-3 py-1 rounded-full text-white text-sm font-medium"
            whileHover={{ scale: 1.05 }}
          >
            {points} Points
          </motion.div>
          <motion.div
            className="bg-orange-500 px-3 py-1 rounded-full text-white text-sm font-medium"
            whileHover={{ scale: 1.05 }}
          >
            {streak} Day Streak
          </motion.div>
        </div>
        <ShareButton quiz={quiz} />
      </motion.div>

      {/* Timer Bar */}
      <motion.div className="absolute top-16 left-4 right-4 z-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center space-x-2 mb-2">
          <Timer className="w-4 h-4 text-white" />
          <span className="text-white text-sm">{timeLeft}s</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <motion.div
            className="bg-purple-600 h-2 rounded-full"
            initial={{ width: "100%" }}
            animate={{ width: `${(timeLeft / 10) * 100}%` }}
            transition={{ duration: 1, ease: "linear" }}
          />
        </div>
      </motion.div>

      {/* Quiz Content */}
      <Card className="w-full max-w-md bg-white/5 border-white/10 backdrop-blur-sm relative z-10">
        <div className="p-6">
          <motion.h2
            className="text-2xl font-bold text-white mb-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {quiz.question}
          </motion.h2>

          <div className="space-y-3">
            {quiz.options.map((option, index) => (
              <motion.div
                key={option}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Button
                  onClick={() => handleAnswerSelect(option)}
                  className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 text-left justify-start h-12"
                  variant="outline"
                >
                  <span className="mr-3 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {String.fromCharCode(65 + index)}
                  </span>
                  {option}
                </Button>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="mt-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <span className="text-purple-400 text-sm">{quiz.topic}</span>
          </motion.div>
        </div>
      </Card>
    </div>
  )
}
