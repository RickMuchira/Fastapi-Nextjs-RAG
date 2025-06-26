"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Trophy, 
  Star, 
  Target, 
  Clock, 
  Zap, 
  RotateCcw, 
  Share2, 
  Download,
  TrendingUp,
  Award,
  Flame,
  Heart,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import confetti from "canvas-confetti";
import { toast } from "sonner";

type QuizResult = {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  accuracy: number;
  timeSpent: number;
  rank: string;
  message: string;
  improvement: string;
};

const getRankData = (accuracy: number) => {
  if (accuracy >= 90) return { 
    rank: "Quiz Master", 
    color: "from-yellow-400 to-orange-500", 
    icon: "👑",
    message: "Outstanding! You're a true quiz master!",
    improvement: "Perfect performance! Share your knowledge with others."
  };
  if (accuracy >= 80) return { 
    rank: "Expert", 
    color: "from-purple-400 to-pink-500", 
    icon: "🎯",
    message: "Excellent work! You really know your stuff.",
    improvement: "Almost perfect! Review the missed questions to reach mastery."
  };
  if (accuracy >= 70) return { 
    rank: "Skilled", 
    color: "from-blue-400 to-cyan-500", 
    icon: "⭐",
    message: "Great job! You're well on your way to mastery.",
    improvement: "Good progress! Focus on the areas you missed."
  };
  if (accuracy >= 60) return { 
    rank: "Learning", 
    color: "from-green-400 to-emerald-500", 
    icon: "📚",
    message: "Nice effort! Keep practicing to improve.",
    improvement: "You're learning! Review the material and try again."
  };
  return { 
    rank: "Beginner", 
    color: "from-gray-400 to-slate-500", 
    icon: "🌱",
    message: "Don't give up! Every expert was once a beginner.",
    improvement: "Practice makes perfect! Review the content and try again."
  };
};

const achievements = [
  { id: "first_try", name: "First Attempt", icon: "🚀", description: "Completed your first quiz!" },
  { id: "speed_demon", name: "Speed Demon", icon: "⚡", description: "Completed in under 2 minutes!" },
  { id: "perfectionist", name: "Perfectionist", icon: "💯", description: "100% accuracy!" },
  { id: "persistent", name: "Persistent", icon: "🔄", description: "Retook the quiz!" },
  { id: "streak", name: "On Fire", icon: "🔥", description: "5+ correct answers in a row!" }
];

export default function QuizResultsPage() {
  const { unitId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [result, setResult] = useState<QuizResult | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [earnedAchievements, setEarnedAchievements] = useState<string[]>([]);

  useEffect(() => {
    // Get results from URL params
    const score = parseInt(searchParams.get('score') || '0');
    const correct = parseInt(searchParams.get('correct') || '0');
    const total = parseInt(searchParams.get('total') || '1');
    const timeSpent = parseInt(searchParams.get('time') || '0');
    
    const accuracy = Math.round((correct / total) * 100);
    const rankData = getRankData(accuracy);
    
    const quizResult: QuizResult = {
      score,
      correctAnswers: correct,
      totalQuestions: total,
      accuracy,
      timeSpent,
      rank: rankData.rank,
      message: rankData.message,
      improvement: rankData.improvement
    };
    
    setResult(quizResult);
    
    // Check achievements
    const achievements: string[] = [];
    if (accuracy === 100) achievements.push("perfectionist");
    if (timeSpent < 120000) achievements.push("speed_demon");
    achievements.push("first_try");
    
    setEarnedAchievements(achievements);
    
    // Celebration effect
    setTimeout(() => {
      setShowCelebration(true);
      if (accuracy >= 80) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }, 500);
  }, [searchParams]);

  const handleRetakeQuiz = () => {
    router.push(`/quiz/${unitId}`);
  };

  const handleShareResults = () => {
    if (navigator.share && result) {
      navigator.share({
        title: 'Quiz Results',
        text: `I just scored ${result.accuracy}% on this quiz! 🎉`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`I just scored ${result?.accuracy}% on this quiz! 🎉`);
      toast.success("Results copied to clipboard!");
    }
  };

  if (!result) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading results...</p>
        </div>
      </div>
    );
  }

  const rankData = getRankData(result.accuracy);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${rankData.color} opacity-20`} />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
        {/* Main Result Card */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 260, 
            damping: 20,
            delay: 0.2 
          }}
          className="max-w-md w-full"
        >
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 overflow-hidden">
            <CardContent className="p-8 text-center">
              {/* Rank Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="text-8xl mb-4"
              >
                {rankData.icon}
              </motion.div>
              
              {/* Score */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <h1 className="text-6xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {result.accuracy}%
                </h1>
                <Badge className={`bg-gradient-to-r ${rankData.color} text-white border-0 text-lg px-4 py-2`}>
                  {result.rank}
                </Badge>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="grid grid-cols-2 gap-4 my-8"
              >
                <div className="bg-white/10 rounded-2xl p-4">
                  <Target className="h-6 w-6 mx-auto mb-2 text-green-400" />
                  <p className="text-2xl font-bold">{result.correctAnswers}</p>
                  <p className="text-sm text-gray-300">Correct</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-4">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-blue-400" />
                  <p className="text-2xl font-bold">{Math.floor(result.timeSpent / 1000)}s</p>
                  <p className="text-sm text-gray-300">Time</p>
                </div>
              </motion.div>

              {/* Message */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="text-lg text-gray-200 mb-4"
              >
                {result.message}
              </motion.p>

              {/* Improvement tip */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3 }}
                className="text-sm text-gray-400 mb-6"
              >
                {result.improvement}
              </motion.p>

              {/* Progress visualization */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.5 }}
                className="mb-8"
              >
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{result.correctAnswers}/{result.totalQuestions}</span>
                </div>
                <Progress 
                  value={result.accuracy} 
                  className="h-3 bg-white/20"
                />
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Achievements */}
        {earnedAchievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.7 }}
            className="mt-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold mb-4 text-center">🎉 Achievements Unlocked!</h3>
            <div className="grid grid-cols-2 gap-3">
              {earnedAchievements.map((achievementId, index) => {
                const achievement = achievements.find(a => a.id === achievementId);
                if (!achievement) return null;
                
                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      delay: 1.8 + index * 0.2,
                      type: "spring",
                      stiffness: 200 
                    }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20"
                  >
                    <div className="text-2xl mb-1">{achievement.icon}</div>
                    <p className="text-sm font-semibold">{achievement.name}</p>
                    <p className="text-xs text-gray-400">{achievement.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2 }}
          className="mt-8 max-w-md w-full space-y-4"
        >
          {/* Primary Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={handleRetakeQuiz}
              className="bg-purple-600 hover:bg-purple-700 text-white py-6 rounded-2xl text-lg font-semibold"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Retake
            </Button>
            <Button
              onClick={handleShareResults}
              variant="outline"
              className="border-white/30 hover:bg-white/10 text-white py-6 rounded-2xl text-lg font-semibold"
            >
              <Share2 className="h-5 w-5 mr-2" />
              Share
            </Button>
          </div>

          {/* Secondary Actions */}
          <div className="grid grid-cols-3 gap-3">
            <Button
              onClick={() => router.push('/topics')}
              variant="ghost"
              className="text-white hover:bg-white/10 py-4 rounded-xl"
            >
              <Target className="h-5 w-5 mb-1" />
              <span className="text-xs">More Quizzes</span>
            </Button>
            <Button
              onClick={() => router.push('/profile')}
              variant="ghost"
              className="text-white hover:bg-white/10 py-4 rounded-xl"
            >
              <TrendingUp className="h-5 w-5 mb-1" />
              <span className="text-xs">Stats</span>
            </Button>
            <Button
              onClick={() => router.push('/')}
              variant="ghost"
              className="text-white hover:bg-white/10 py-4 rounded-xl"
            >
              <Home className="h-5 w-5 mb-1" />
              <span className="text-xs">Home</span>
            </Button>
          </div>
        </motion.div>

        {/* Social Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2 }}
          className="mt-8 flex items-center space-x-6 text-gray-400"
        >
          <div className="flex items-center space-x-2">
            <Heart className="h-4 w-4" />
            <span className="text-sm">{Math.floor(Math.random() * 100) + 50} likes</span>
          </div>
          <div className="flex items-center space-x-2">
            <Star className="h-4 w-4" />
            <span className="text-sm">Score: {result.score}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Flame className="h-4 w-4" />
            <span className="text-sm">Streak: {Math.floor(Math.random() * 10) + 1}</span>
          </div>
        </motion.div>

        {/* Confetti celebration */}
        {showCelebration && result.accuracy >= 80 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
          >
            <div className="text-6xl animate-pulse">🎉</div>
          </motion.div>
        )}
      </div>

      {/* Floating elements */}
      <div className="absolute top-1/4 left-8 text-4xl opacity-20 animate-bounce">⭐</div>
      <div className="absolute top-1/3 right-12 text-3xl opacity-20 animate-pulse">🔥</div>
      <div className="absolute bottom-1/4 left-12 text-5xl opacity-20 animate-spin-slow">🎯</div>
      <div className="absolute bottom-1/3 right-8 text-4xl opacity-20 animate-bounce">✨</div>
    </div>
  );
} 