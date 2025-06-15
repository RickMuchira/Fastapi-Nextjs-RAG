'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import BottomNavigation from '@/components/layout/bottom-navigation';
import { SparklesCore } from '@/components/sparkles';
import { FloatingPaper } from '@/components/floating-paper';
import { cn } from '@/lib/utils';

import { BookOpen, ArrowLeft, Play, Loader2, Check, X, Award } from 'lucide-react';

// Interfaces (aligned with backend models.py)
interface Course {
  id: number;
  name: string;
}

interface Year {
  id: number;
  name: string;
}

interface Semester {
  id: number;
  name: string;
}

interface Unit {
  id: number;
  name: string;
}

interface QuizQuestion {
  id: number;
  unit_id: number;
  question: string;
  options: { [key: string]: string }; // e.g., { A: "Paris", B: "London", C: "Berlin", D: "Madrid" }
  correct_answer: string;
  explanation: string | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// QuizFeed Component
const QuizFeed = ({ questions, unitName, onExit }: { questions: QuizQuestion[], unitName: string, onExit: () => void }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [score, setScore] = useState(0);

  const isQuizFinished = currentQuestionIndex >= questions.length;
  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerSelect = (optionKey: string) => {
    if (isAnswerChecked) return;
    setSelectedAnswer(optionKey);
  };

  const handleCheckAnswer = () => {
    if (!selectedAnswer) {
      toast.warning('Please select an answer!');
      return;
    }

    setIsAnswerChecked(true);
    if (selectedAnswer === currentQuestion.correct_answer) {
      setScore((prev) => prev + 1);
      toast.success('Correct!');
    } else {
      toast.error('Incorrect!');
    }
  };

  const handleNextQuestion = () => {
    setIsAnswerChecked(false);
    setSelectedAnswer(null);
    if (!isQuizFinished) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  if (isQuizFinished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white">
        <motion.div
          key="results"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl"
        >
          <Card className="w-full bg-white/5 border-white/10 backdrop-blur-sm text-center">
            <CardHeader>
              <CardTitle className="flex flex-col items-center justify-center space-y-4">
                <Award className="w-16 h-16 text-yellow-400" />
                <span className="text-3xl">Quiz Completed!</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xl">Your final score is:</p>
              <p className="text-5xl font-bold text-purple-400">
                {score} / {questions.length}
              </p>
              <div className="flex justify-center space-x-4 pt-4">
                <Button onClick={onExit} className="bg-purple-600 hover:bg-purple-700">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Unit Selection
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative z-10 container mx-auto p-4 flex flex-col items-center justify-center min-h-screen">
      <div className='w-full max-w-2xl mb-4'>
        <Button onClick={onExit} variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10">
          <ArrowLeft className="w-4 h-4 mr-2"/>
          Exit Quiz
        </Button>
      </div>
      <motion.div
        key={currentQuestionIndex}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl"
      >
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm text-white">
          <CardHeader>
            <div className="flex justify-between items-center mb-2">
              <CardTitle>Question {currentQuestionIndex + 1} of {questions.length}</CardTitle>
              <div className="text-lg font-bold text-purple-400">Score: {score}</div>
            </div>
            <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="h-2 bg-black/20" />
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-xl font-semibold min-h-[60px]">{currentQuestion.question}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(currentQuestion.options).map(([key, value]) => {
                const isCorrect = key === currentQuestion.correct_answer;
                const isSelected = key === selectedAnswer;

                return (
                  <Button
                    key={key}
                    onClick={() => handleAnswerSelect(key)}
                    disabled={isAnswerChecked}
                    variant="outline"
                    className={cn(
                      "justify-start text-left h-auto whitespace-normal py-3 px-4 transition-all duration-200",
                      "bg-white/5 border-white/20 hover:bg-white/10",
                      isSelected && "bg-purple-600/50 border-purple-500",
                      isAnswerChecked && isCorrect && "bg-green-600/80 border-green-500 hover:bg-green-600/80",
                      isAnswerChecked && isSelected && !isCorrect && "bg-red-600/80 border-red-500 hover:bg-red-600/80"
                    )}
                  >
                    <div className="flex items-center w-full">
                      <div className="font-bold mr-4">{key}</div>
                      <div className="flex-1">{value}</div>
                      {isAnswerChecked && isCorrect && <Check className="w-5 h-5 ml-auto text-white"/>}
                      {isAnswerChecked && isSelected && !isCorrect && <X className="w-5 h-5 ml-auto text-white"/>}
                    </div>
                  </Button>
                );
              })}
            </div>

            <AnimatePresence>
              {isAnswerChecked && currentQuestion.explanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 mt-4 bg-black/30 rounded-lg border border-white/10"
                >
                  <h4 className="font-bold text-lg mb-2 text-purple-300">Explanation</h4>
                  <p className="text-gray-300">{currentQuestion.explanation}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-end mt-6">
              {isAnswerChecked ? (
                <Button onClick={handleNextQuestion} className="bg-purple-600 hover:bg-purple-700">
                  {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                </Button>
              ) : (
                <Button onClick={handleCheckAnswer} disabled={!selectedAnswer} className="bg-blue-600 hover:bg-blue-700">
                  Check Answer
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

// Main Page Component
export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.topicid as string;
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [years, setYears] = useState<Year[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');

  const [isLoading, setIsLoading] = useState({
    course: true,
    years: false,
    semesters: false,
    units: false,
    questions: false,
  });

  const [showQuizFeed, setShowQuizFeed] = useState(false);

  // Fetch initial course details and years
  useEffect(() => {
    if (courseId) {
      setIsLoading(prev => ({ ...prev, course: true, years: true }));
      const coursePromise = axios.get(`${API_BASE_URL}/courses/${courseId}`);
      const yearsPromise = axios.get(`${API_BASE_URL}/courses/${courseId}/years`);

      Promise.all([coursePromise, yearsPromise]).then(([courseRes, yearsRes]) => {
        setCourse(courseRes.data);
        setYears(yearsRes.data);
      }).catch(err => {
        console.error("Failed to load course details or years:", err);
        toast.error("Failed to load initial course data.");
      }).finally(() => {
        setIsLoading(prev => ({ ...prev, course: false, years: false }));
      });
    }
  }, [courseId]);

  // Fetch semesters when year changes
  useEffect(() => {
    setSemesters([]);
    setUnits([]);
    setQuestions([]);
    setSelectedSemesterId('');
    setSelectedUnitId('');

    if (selectedYearId) {
      setIsLoading(prev => ({ ...prev, semesters: true }));
      axios.get(`${API_BASE_URL}/years/${selectedYearId}/semesters`)
        .then(res => setSemesters(res.data))
        .catch(() => toast.error('Failed to load semesters.'))
        .finally(() => setIsLoading(prev => ({ ...prev, semesters: false }));
    }
  }, [selectedYearId]);

  // Fetch units when semester changes
  useEffect(() => {
    setUnits([]);
    setQuestions([]);
    setSelectedUnitId('');

    if (selectedSemesterId) {
      setIsLoading(prev => ({ ...prev, units: true }));
      axios.get(`${API_BASE_URL}/semesters/${selectedSemesterId}/units`)
        .then(res => setUnits(res.data))
        .catch(() => toast.error('Failed to load units.'))
        .finally(() => setIsLoading(prev => ({ ...prev, units: false }));
    }
  }, [selectedSemesterId]);

  // Fetch questions when unit changes
  useEffect(() => {
    setQuestions([]);

    if (selectedUnitId) {
      setIsLoading(prev => ({ ...prev, questions: true }));
      axios.get(`${API_BASE_URL}/units/${selectedUnitId}/questions`)
        .then(res => {
          // Robust options parsing
          const parsedQuestions = res.data.map((q: any) => ({
            ...q,
            options: typeof q.options === 'string' ? JSON.parse(q.options || '{}') : q.options || {},
          }));
          setQuestions(parsedQuestions);
        })
        .catch(err => {
          console.error('Failed to load quiz questions:', err);
          toast.error('Failed to load quiz questions. Please ensure questions exist for this unit.');
        })
        .finally(() => setIsLoading(prev => ({ ...prev, questions: false }));
    }
  }, [selectedUnitId]);

  const handleStartQuiz = () => {
    if (questions.length > 0) {
      setShowQuizFeed(true);
    } else {
      toast.error('No quiz questions available for this unit.');
    }
  };

  const selectedUnitName = units.find(u => u.id.toString() === selectedUnitId)?.name || '';

  // Render Logic
  if (isLoading.course) {
    return (
      <div className="min-h-screen bg-black/[0.96] flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin mr-3"/>
        Loading Course...
      </div>
    );
  }

  if (showQuizFeed) {
    return (
      <main className="min-h-screen bg-black/[0.96] antialiased bg-grid-white/[0.02] relative overflow-hidden">
        <div className="h-full w-full absolute inset-0 z-0">
          <SparklesCore id="quiz-sparkles" background="transparent" minSize={0.4} maxSize={1.2} particleDensity={80} className="w-full h-full" particleColor="#FFFFFF" />
        </div>
        <div className="absolute inset-0 overflow-hidden z-0">
          <FloatingPaper count={6} />
        </div>
        <Toaster richColors />
        <QuizFeed questions={questions} unitName={selectedUnitName} onExit={() => setShowQuizFeed(false)} />
        <BottomNavigation />
      </main>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-black/[0.96] flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Course not found</h1>
          <Link href="/topics">
            <Button className="bg-purple-600 hover:bg-purple-700">Back to All Courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black/[0.96] antialiased bg-grid-white/[0.02] relative overflow-hidden">
      <div className="h-full w-full absolute inset-0 z-0">
        <SparklesCore id="tsparticlesfullpage" background="transparent" minSize={0.6} maxSize={1.4} particleDensity={100} className="w-full h-full" particleColor="#FFFFFF" />
      </div>
      <div className="absolute inset-0 overflow-hidden z-0">
        <FloatingPaper count={6} />
      </div>

      <div className="relative z-10 pb-20">
        <Toaster richColors />
        <div className="container mx-auto p-6">
          <div className="flex items-center mb-6">
            <Link href="/topics" legacyBehavior>
              <a className="text-white hover:bg-white/10 p-2 rounded-md mr-4">
                <ArrowLeft className="w-5 h-5" />
              </a>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-purple-500">
                <BookOpen className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{course.name}</h1>
                <p className="text-gray-400">Select a unit to test your knowledge.</p>
              </div>
            </div>
          </div>

          <Card className="mb-6 bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                Select Unit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Year</label>
                  <Select value={selectedYearId} onValueChange={setSelectedYearId} disabled={isLoading.years}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/20 text-white">
                      {years.map((year) => (
                        <SelectItem key={year.id} value={year.id.toString()}>
                          {year.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Semester</label>
                  <Select value={selectedSemesterId} onValueChange={setSelectedSemesterId} disabled={!selectedYearId || isLoading.semesters}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/20 text-white">
                      {semesters.map((semester) => (
                        <SelectItem key={semester.id} value={semester.id.toString()}>
                          {semester.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Unit</label>
                  <Select value={selectedUnitId} onValueChange={setSelectedUnitId} disabled={!selectedSemesterId || isLoading.units}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/20 text-white">
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id.toString()}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedUnitId && (
                <div className="pt-6">
                  <Card className="bg-black/20 border-white/10">
                    <CardContent className="p-6 text-center">
                      {isLoading.questions ? (
                        <div className="flex justify-center items-center text-gray-300">
                          <Loader2 className="w-5 h-5 animate-spin mr-2"/>
                          Loading Questions...
                        </div>
                      ) : (
                        <>
                          <h3 className="text-xl font-bold text-white mb-2">
                            {questions.length} Question{questions.length !== 1 ? 's' : ''} Found
                          </h3>
                          <p className="text-gray-400 mb-4 text-sm">
                            {units.find((u) => u.id.toString() === selectedUnitId)?.name}
                          </p>
                          <Button
                            onClick={handleStartQuiz}
                            size="lg"
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                            disabled={questions.length === 0}
                          >
                            <Play className="w-5 h-5 mr-2" />
                            Start Quiz
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <BottomNavigation />
    </main>
  );
}