"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle, XCircle, ArrowRight } from "lucide-react"
import type { Quiz } from "@/lib/types/quiz"

interface FeedbackScreenProps {
  quiz: Quiz
  selectedAnswer: string | null
  onNext: () => void
  points: number
  streak: number
}

export default function FeedbackScreen({ quiz, selectedAnswer, onNext, points, streak }: FeedbackScreenProps) {
  const isCorrect = selectedAnswer === quiz.correctAnswer

  return (
    <div className="h-full relative flex items-center justify-center p-4">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${quiz.backgroundImage})`,
        }}
      />

      {/* Stats Update */}
      <motion.div
        className="absolute top-4 left-4 right-4 flex justify-between items-center z-20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex space-x-4">
          <motion.div
            className="bg-purple-600 px-3 py-1 rounded-full text-white text-sm font-medium"
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5 }}
          >
            {points} Points{" "}
            {isCorrect && (
              <motion.span initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-green-300">
                +10
              </motion.span>
            )}
          </motion.div>
          <motion.div
            className="bg-orange-500 px-3 py-1 rounded-full text-white text-sm font-medium"
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {streak} Day Streak
          </motion.div>
        </div>
      </motion.div>

      {/* Feedback Content */}
      <Card className="w-full max-w-md bg-white/5 border-white/10 backdrop-blur-sm relative z-10">
        <div className="p-6 text-center">
          {/* Result Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="mb-4"
          >
            {isCorrect ? (
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            ) : (
              <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            )}
          </motion.div>

          {/* Result Text */}
          <motion.h2
            className={`text-2xl font-bold mb-4 ${isCorrect ? "text-green-400" : "text-red-400"}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {isCorrect ? "Correct!" : "Incorrect!"}
          </motion.h2>

          {/* Explanation */}
          <motion.p
            className="text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {quiz.explanation}
          </motion.p>

          {/* Correct Answer */}
          {!isCorrect && (
            <motion.div
              className="mb-6 p-3 bg-green-500/20 rounded-lg border border-green-500/30"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <p className="text-green-400 text-sm">
                Correct answer: <span className="font-medium">{quiz.correctAnswer}</span>
              </p>
            </motion.div>
          )}

          {/* Next Button */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
            <Button onClick={onNext} className="w-full bg-purple-600 hover:bg-purple-700 text-white" size="lg">
              Next Quiz
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </Card>
    </div>
  )
}
