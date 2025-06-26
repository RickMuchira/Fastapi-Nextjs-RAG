"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { 
  Heart, 
  MessageCircle, 
  Share, 
  BookOpen, 
  Trophy, 
  Timer, 
  Zap,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Shuffle,
  RotateCcw,
  Star,
  Flame,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import axios from "axios";

type QuizQuestion = {
  id: number;
  question: string;
  options: Record<"A" | "B" | "C" | "D", string>;
  correct_answer: "A" | "B" | "C" | "D";
  explanation?: string;
};

type QuizStats = {
  totalQuestions: number;
  correctAnswers: number;
  streak: number;
  timeSpent: number;
  score: number;
};

const SWIPE_CONFIDENCE_THRESHOLD = 10000;
const SWIPE_VERTICAL_CONFIDENCE_THRESHOLD = 10000;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function TikTokQuizPage() {
  const { unitId } = useParams();
  const router = useRouter();
  
  // Quiz state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<QuizStats>({
    totalQuestions: 0,
    correctAnswers: 0,
    streak: 0,
    timeSpent: 0,
    score: 0
  });
  
  // Animation and interaction state
  const [likes, setLikes] = useState(Math.floor(Math.random() * 1000) + 100);
  const [isLiked, setIsLiked] = useState(false);
  const [direction, setDirection] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  
  // Refs
  const constraintsRef = useRef(null);
  const lastNavTimeRef = useRef(Date.now());
  const NAV_THROTTLE_MS = 600;

  // Add wheel and keyboard navigation
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now - lastNavTimeRef.current < NAV_THROTTLE_MS) return;
      if (showResult) return;
      if (e.deltaY > 0) {
        // Scroll down: next question
        setDirection(2);
        nextQuestion();
        lastNavTimeRef.current = now;
      } else if (e.deltaY < 0) {
        // Scroll up: previous question
        setDirection(-2);
        previousQuestion();
        lastNavTimeRef.current = now;
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      if (now - lastNavTimeRef.current < NAV_THROTTLE_MS) return;
      if (showResult) return;
      if (e.key === "ArrowDown") {
        setDirection(2);
        nextQuestion();
        lastNavTimeRef.current = now;
      } else if (e.key === "ArrowUp") {
        setDirection(-2);
        previousQuestion();
        lastNavTimeRef.current = now;
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showResult, currentIndex, questions.length]);

  useEffect(() => {
    if (!unitId) return;
    
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const response = await axios.get<QuizQuestion[]>(`${API_BASE_URL}/units/${unitId}/quizzes`);
        const shuffledQuestions = response.data.sort(() => Math.random() - 0.5);
        setQuestions(shuffledQuestions);
        setStats(prev => ({ ...prev, totalQuestions: shuffledQuestions.length }));
        setStartTime(Date.now());
        setQuestionStartTime(Date.now());
      } catch (error) {
        console.error("Failed to load quiz", error);
        toast.error("Failed to load quiz questions");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [unitId]);

  const currentQuestion = questions[currentIndex];

  const handleAnswerSelect = (option: string) => {
    if (showResult) return;
    
    setSelectedAnswer(option);
    const correct = option === currentQuestion.correct_answer;
    setIsCorrect(correct);
    setShowResult(true);
    
    // Update stats
    const timeForQuestion = Date.now() - questionStartTime;
    setStats(prev => ({
      ...prev,
      correctAnswers: correct ? prev.correctAnswers + 1 : prev.correctAnswers,
      streak: correct ? prev.streak + 1 : 0,
      timeSpent: prev.timeSpent + timeForQuestion,
      score: correct ? prev.score + (Math.max(100 - Math.floor(timeForQuestion / 100), 10)) : prev.score
    }));

    // Celebrate if correct
    if (correct) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setLikes(prev => prev + Math.floor(Math.random() * 50) + 10);
    }

    // Auto advance after 3 seconds
    setTimeout(() => {
      nextQuestion();
    }, 3000);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setDirection(1);
      setCurrentIndex(prev => prev + 1);
      resetQuestionState();
    } else {
      // Quiz completed
      router.push(`/quiz/${unitId}/results?score=${stats.score}&correct=${stats.correctAnswers}&total=${stats.totalQuestions}`);
    }
  };

  const previousQuestion = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(prev => prev - 1);
      resetQuestionState();
    }
  };

  const resetQuestionState = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(null);
    setQuestionStartTime(Date.now());
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    const swipeX = swipePower(info.offset.x, info.velocity.x);
    const swipeY = swipePower(info.offset.y, info.velocity.y);

    // Horizontal swipe
    if (swipeX < -SWIPE_CONFIDENCE_THRESHOLD) {
      setDirection(1); // right to left
      nextQuestion();
      return;
    } else if (swipeX > SWIPE_CONFIDENCE_THRESHOLD) {
      setDirection(-1); // left to right
      previousQuestion();
      return;
    }
    // Vertical swipe
    if (swipeY < -SWIPE_VERTICAL_CONFIDENCE_THRESHOLD) {
      setDirection(2); // up
      nextQuestion();
      return;
    } else if (swipeY > SWIPE_VERTICAL_CONFIDENCE_THRESHOLD) {
      setDirection(-2); // down
      previousQuestion();
      return;
    }
  };

  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
    
    if (!isLiked) {
      // Heart animation
      confetti({
        particleCount: 20,
        spread: 30,
        colors: ['#ff6b6b', '#ff8e8e', '#ffa8a8'],
        origin: { x: 0.9, y: 0.5 }
      });
    }
  };

  const getOptionIcon = (option: string) => {
    if (!showResult) return null;
    if (option === currentQuestion.correct_answer) {
      return <CheckCircle className="h-5 w-5 text-green-400" />;
    }
    if (option === selectedAnswer && option !== currentQuestion.correct_answer) {
      return <XCircle className="h-5 w-5 text-red-400" />;
    }
    return null;
  };

  const getOptionStyle = (option: string) => {
    if (!showResult) {
      return selectedAnswer === option 
        ? "bg-purple-600/30 border-purple-400 scale-105" 
        : "bg-white/10 border-white/20 hover:bg-white/20";
    }
    
    if (option === currentQuestion.correct_answer) {
      return "bg-green-600/30 border-green-400 scale-105";
    }
    if (option === selectedAnswer && option !== currentQuestion.correct_answer) {
      return "bg-red-600/30 border-red-400 scale-105";
    }
    return "bg-white/5 border-white/10 opacity-50";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-white text-lg">Loading Quiz...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">No Quiz Questions Available</h2>
          <p className="text-gray-400 mb-4">Generate some questions first!</p>
          <Button onClick={() => router.back()} className="bg-purple-600 hover:bg-purple-700">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20" />
      
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="text-white hover:bg-white/20"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="border-white/30 text-white">
            <Timer className="h-3 w-3 mr-1" />
            {Math.floor((Date.now() - startTime) / 1000)}s
          </Badge>
          <Badge variant="outline" className="border-white/30 text-white">
            <Target className="h-3 w-3 mr-1" />
            {stats.streak} streak
          </Badge>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
        >
          <Shuffle className="h-5 w-5" />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="absolute top-16 left-0 right-0 z-40 px-4">
        <Progress 
          value={((currentIndex + 1) / questions.length) * 100} 
          className="h-1 bg-white/20"
        />
      </div>

      {/* Main content */}
      <div className="relative h-screen flex" ref={constraintsRef}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={{
              enter: (direction: number) => {
                if (direction === 2) {
                  return { y: 1000, opacity: 0 };
                } else if (direction === -2) {
                  return { y: -1000, opacity: 0 };
                } else if (direction > 0) {
                  return { x: 1000, opacity: 0 };
                } else {
                  return { x: -1000, opacity: 0 };
                }
              },
              center: {
                zIndex: 1,
                x: 0,
                y: 0,
                opacity: 1
              },
              exit: (direction: number) => {
                if (direction === 2) {
                  return { zIndex: 0, y: -1000, opacity: 0 };
                } else if (direction === -2) {
                  return { zIndex: 0, y: 1000, opacity: 0 };
                } else if (direction < 0) {
                  return { zIndex: 0, x: 1000, opacity: 0 };
                } else {
                  return { zIndex: 0, x: -1000, opacity: 0 };
                }
              }
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              y: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="xy"
            dragConstraints={constraintsRef}
            dragElastic={1}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 flex flex-col justify-center px-6"
          >
            {/* Question card */}
            <div className="max-w-lg mx-auto w-full">
              {/* Question number */}
              <div className="text-center mb-6">
                <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30">
                  Question {currentIndex + 1} of {questions.length}
                </Badge>
              </div>

              {/* Question text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-8 border border-white/20"
              >
                <h2 className="text-2xl font-bold text-center leading-relaxed">
                  {currentQuestion.question}
                </h2>
              </motion.div>

              {/* Options */}
              <div className="space-y-4">
                {Object.entries(currentQuestion.options).map(([key, value], index) => (
                  <motion.button
                    key={key}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    onClick={() => handleAnswerSelect(key)}
                    disabled={showResult}
                    className={`w-full p-4 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between text-left ${getOptionStyle(key)}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
                        {key}
                      </div>
                      <span className="text-lg">{value}</span>
                    </div>
                    {getOptionIcon(key)}
                  </motion.button>
                ))}
              </div>

              {/* Explanation */}
              <AnimatePresence>
                {showResult && currentQuestion.explanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 p-4 bg-blue-600/20 border border-blue-500/30 rounded-2xl"
                  >
                    <p className="text-blue-200 text-sm">
                      <strong>Explanation:</strong> {currentQuestion.explanation}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Result feedback */}
              <AnimatePresence>
                {showResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="fixed inset-0 flex items-center justify-center pointer-events-none z-30"
                  >
                    <div className={`text-6xl font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                      {isCorrect ? '🎉 Correct!' : '😔 Wrong!'}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* TikTok-style sidebar */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col space-y-6 z-40">
          {/* Like button */}
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={handleLike}
            className="flex flex-col items-center space-y-1"
          >
            <motion.div
              animate={isLiked ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.3 }}
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isLiked ? 'bg-red-500' : 'bg-white/20'
              }`}
            >
              <Heart className={`h-6 w-6 ${isLiked ? 'text-white fill-current' : 'text-white'}`} />
            </motion.div>
            <span className="text-xs text-white">{likes}</span>
          </motion.button>

          {/* Comments */}
          <button className="flex flex-col items-center space-y-1">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs text-white">{Math.floor(Math.random() * 50) + 10}</span>
          </button>

          {/* Share */}
          <button className="flex flex-col items-center space-y-1">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Share className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs text-white">Share</span>
          </button>

          {/* Score */}
          <div className="flex flex-col items-center space-y-1">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
              <Star className="h-6 w-6 text-yellow-400" />
            </div>
            <span className="text-xs text-white">{stats.score}</span>
          </div>
        </div>

        {/* Manual navigation controls */}
        <div className="absolute left-1/2 bottom-20 transform -translate-x-1/2 flex space-x-4 z-50">
          <Button
            variant="secondary"
            onClick={() => { setDirection(-1); previousQuestion(); }}
            disabled={currentIndex === 0}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            onClick={() => { setDirection(1); nextQuestion(); }}
            disabled={currentIndex === questions.length - 1}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Next
          </Button>
        </div>

        {/* Bottom hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center text-white/60"
        >
          <p className="text-sm">Swipe left/right or up/down for next/previous • Or use the buttons below</p>
        </motion.div>
      </div>

      {/* Loading overlay for transitions */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black pointer-events-none z-20"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
