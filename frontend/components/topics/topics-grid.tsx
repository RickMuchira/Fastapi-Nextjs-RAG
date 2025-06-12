"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { topicsData } from "@/lib/data/topics-data"
import { getQuizzesByTopic } from "@/lib/data/quiz-data"

export default function TopicsGrid() {
  const router = useRouter()

  return (
    <div className="p-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {topicsData.map((topic, index) => {
          const quizCount = getQuizzesByTopic(topic.name).length

          return (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card
                className="bg-white/5 border-white/10 backdrop-blur-sm cursor-pointer overflow-hidden group"
                onClick={() => router.push(`/topics/${topic.id}`)}
              >
                <div className="p-6 text-center">
                  {/* Topic Icon */}
                  <motion.div
                    className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl ${topic.color}`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    {topic.icon}
                  </motion.div>

                  {/* Topic Name */}
                  <h3 className="text-white font-semibold mb-2 group-hover:text-purple-400 transition-colors">
                    {topic.name}
                  </h3>

                  {/* Quiz Count */}
                  <Badge variant="secondary" className="bg-purple-600/20 text-purple-400 border-purple-600/30">
                    {quizCount} quiz{quizCount !== 1 ? "es" : ""} available
                  </Badge>

                  {/* Progress Bar */}
                  <div className="mt-3 w-full bg-white/10 rounded-full h-2">
                    <motion.div
                      className="bg-purple-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${topic.progress}%` }}
                      transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
                    />
                  </div>
                  <p className="text-gray-400 text-xs mt-1">{topic.progress}% complete</p>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
