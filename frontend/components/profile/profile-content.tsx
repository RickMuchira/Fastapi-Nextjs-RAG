"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trophy, Award, BookOpen } from "lucide-react"
import { badgesData, userStats } from "@/lib/data/profile-data"

export default function ProfileContent() {
  return (
    <div className="p-6 space-y-6">
      {/* User Stats */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-purple-500" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <motion.div
                className="text-2xl font-bold text-purple-400"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.3 }}
              >
                {userStats.totalPoints}
              </motion.div>
              <div className="text-gray-400 text-sm">Total Points</div>
            </motion.div>

            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                className="text-2xl font-bold text-orange-400"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.4 }}
              >
                {userStats.currentStreak}
              </motion.div>
              <div className="text-gray-400 text-sm">Day Streak</div>
            </motion.div>

            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                className="text-2xl font-bold text-green-400"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.5 }}
              >
                {userStats.quizzesCompleted}
              </motion.div>
              <div className="text-gray-400 text-sm">Quizzes Done</div>
            </motion.div>

            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <motion.div
                className="text-2xl font-bold text-blue-400"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.6 }}
              >
                {userStats.accuracy}%
              </motion.div>
              <div className="text-gray-400 text-sm">Accuracy</div>
            </motion.div>
          </div>

          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Overall Progress</span>
              <span className="text-white">{userStats.overallProgress}%</span>
            </div>
            <Progress value={userStats.overallProgress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Badges Section */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Award className="w-5 h-5 mr-2 text-purple-500" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {badgesData.map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  type: "spring",
                  delay: index * 0.1 + 0.2,
                  duration: 0.6,
                }}
                whileHover={{
                  scale: 1.05,
                  rotate: badge.earned ? [0, -5, 5, 0] : 0,
                }}
                className={`p-4 rounded-lg border text-center ${
                  badge.earned ? "bg-purple-600/20 border-purple-600/30" : "bg-gray-800/20 border-gray-600/30"
                }`}
              >
                <motion.div
                  className={`text-3xl mb-2 ${badge.earned ? "" : "grayscale opacity-50"}`}
                  animate={badge.earned ? { rotate: [0, 10, -10, 0] } : {}}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 }}
                >
                  {badge.icon}
                </motion.div>
                <h4 className={`font-medium text-sm ${badge.earned ? "text-white" : "text-gray-500"}`}>{badge.name}</h4>
                <p className={`text-xs mt-1 ${badge.earned ? "text-gray-300" : "text-gray-600"}`}>
                  {badge.description}
                </p>
                {badge.earned && <Badge className="mt-2 bg-green-600 text-white text-xs">Earned!</Badge>}
                {!badge.earned && badge.progress !== undefined && (
                  <div className="mt-2">
                    <Progress value={badge.progress} className="h-1" />
                    <p className="text-xs text-gray-500 mt-1">{badge.progress}%</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-purple-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {userStats.recentActivity.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-2 h-2 rounded-full ${activity.type === "quiz" ? "bg-purple-500" : "bg-green-500"}`}
                  />
                  <span className="text-white text-sm">{activity.description}</span>
                </div>
                <span className="text-gray-400 text-xs">{activity.time}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
