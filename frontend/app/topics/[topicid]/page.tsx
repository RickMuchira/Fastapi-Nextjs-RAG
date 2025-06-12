'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'sonner'; // Updated import
import QuizFeed from '@/components/quiz/quiz-feed';
import BottomNavigation from '@/components/layout/bottom-navigation';
import { SparklesCore } from '@/components/sparkles';
import { FloatingPaper } from '@/components/floating-paper';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, ArrowLeft, Play } from 'lucide-react';
import Link from 'next/link';

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

interface Quiz {
  id: number;
  unit_id: number;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
  chunk_id: number | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function TopicDetailPage() {
  const params = useParams();
  const topicId = params.topicId as string;
  const courseId = Number(topicId);

  const [course, setCourse] = useState<Course | null>(null);
  const [years, setYears] = useState<Year[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [showQuizFeed, setShowQuizFeed] = useState(false);

  // Fetch course details
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/courses/${courseId}`)
      .then((res) => setCourse(res.data))
      .catch((err) => toast.error('Failed to load course details')); // Sonner toast
  }, [courseId]);

  // Fetch years
  useEffect(() => {
    if (courseId) {
      axios
        .get(`${API_BASE_URL}/courses/${courseId}/years`)
        .then((res) => setYears(res.data))
        .catch((err) => toast.error('Failed to load years')); // Sonner toast
    }
  }, [courseId]);

  // Fetch semesters when year is selected
  useEffect(() => {
    if (selectedYearId) {
      axios
        .get(`${API_BASE_URL}/years/${selectedYearId}/semesters`)
        .then((res) => setSemesters(res.data))
        .catch((err) => toast.error('Failed to load semesters')); // Sonner toast
      setSemesters([]);
      setUnits([]);
      setAvailableQuizzes([]);
      setSelectedSemesterId(null);
      setSelectedUnitId(null);
      setShowQuizFeed(false);
    }
  }, [selectedYearId]);

  // Fetch units when semester is selected
  useEffect(() => {
    if (selectedSemesterId) {
      axios
        .get(`${API_BASE_URL}/semesters/${selectedSemesterId}/units`)
        .then((res) => setUnits(res.data))
        .catch((err) => toast.error('Failed to load units')); // Sonner toast
      setUnits([]);
      setAvailableQuizzes([]);
      setSelectedUnitId(null);
      setShowQuizFeed(false);
    }
  }, [selectedSemesterId]);

  // therapeutical
  // Fetch quizzes when unit is selected
  useEffect(() => {
    if (selectedUnitId) {
      axios
        .get(`${API_BASE_URL}/units/${selectedUnitId}/quizzes`)
        .then((res) => {
          const formattedQuizzes = res.data.map((quiz: any) => ({
            ...quiz,
            options: JSON.parse(quiz.options), // Convert JSON string to array
          }));
          setAvailableQuizzes(formattedQuizzes);
        })
        .catch((err) => toast.error('Failed to load quizzes')); // Sonner toast
      setAvailableQuizzes([]);
      setShowQuizFeed(false);
    }
  }, [selectedUnitId]);

  const handleStartQuiz = () => {
    if (availableQuizzes.length > 0) {
      setShowQuizFeed(true);
    } else {
      toast.error('No quizzes available for this unit'); // Sonner toast
    }
  };

  if (showQuizFeed && availableQuizzes.length > 0) {
    return (
      <main className="min-h-screen bg-black/[0.96] antialiased bg-grid-white/[0.02] relative overflow-hidden">
        {/* Ambient background */}
        <div className="h-full w-full absolute inset-0 z-0">
          <SparklesCore
            id="tsparticlesfullpage"
            background="transparent"
            minSize={0.6}
            maxSize={1.4}
            particleDensity={100}
            className="w-full h-full"
            particleColor="#FFFFFF"
          />
        </div>

        <div className="absolute inset-0 overflow-hidden z-0">
          <FloatingPaper count={6} />
        </div>

        <div className="relative z-10 pb-20">
          <QuizFeed quizzes={availableQuizzes} onExit={() => setShowQuizFeed(false)} />
          <Toaster /> {/* Add Sonner Toaster */}
        </div>

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
            <Button className="bg-purple-600 hover:bg-purple-700">Back to Courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black/[0.96] antialiased bg-grid-white/[0.02] relative overflow-hidden">
      {/* Ambient background */}
      <div className="h-full w-full absolute inset-0 z-0">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={100}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>

      <div className="absolute inset-0 overflow-hidden z-0">
        <FloatingPaper count={6} />
      </div>

      <div className="relative z-10 pb-20">
        <Toaster /> {/* Add Sonner Toaster */}
        <div className="container mx-auto p-6">
          {/* Header with back button */}
          <div className="flex items-center mb-6">
            <Link href="/topics">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-purple-500">
                <BookOpen className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{course.name}</h1>
                <p className="text-gray-400">Select your year, semester, and unit to start quizzing</p>
              </div>
            </div>
          </div>

          {/* Course Selection */}
          <Card className="mb-6 bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-purple-500" />
                Select Course Unit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Year</label>
                  <Select
                    value={selectedYearId?.toString() || ''}
                    onValueChange={(value) => setSelectedYearId(Number(value))}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/20">
                      {years.map((year) => (
                        <SelectItem key={year.id} value={year.id.toString()}>
                          {year.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {semesters.length > 0 && (
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Semester</label>
                    <Select
                      value={selectedSemesterId?.toString() || ''}
                      onValueChange={(value) => setSelectedSemesterId(Number(value))}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-white/20">
                        {semesters.map((semester) => (
                          <SelectItem key={semester.id} value={semester.id.toString()}>
                            {semester.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {units.length > 0 && (
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Unit</label>
                    <Select
                      value={selectedUnitId?.toString() || ''}
                      onValueChange={(value) => setSelectedUnitId(Number(value))}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-white/20">
                        {units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id.toString()}>
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

                           {/* Quiz Preview */}
              {selectedUnitId && (
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-white mb-2">
                        {availableQuizzes.length} Quiz{availableQuizzes.length !== 1 ? 'es' : ''} Available
                      </h3>
                      <p className="text-gray-400 mb-4">
                        {course.name} / {years.find((y) => y.id === selectedYearId)?.name} /{' '}
                        {semesters.find((s) => s.id === selectedSemesterId)?.name} /{' '}
                        {units.find((u) => u.id === selectedUnitId)?.name}
                      </p>

                      {availableQuizzes.length > 0 ? (
                        <Button
                          onClick={handleStartQuiz}
                          size="lg"
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <Play className="w-5 h-5 mr-2" />
                          Start Quiz
                        </Button>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-gray-400">No quizzes available for this unit yet.</p>
                          <p className="text-sm text-gray-500 mt-2">
                            Quizzes will be generated once documents are processed for this unit.
                          </p>
                        </div>
                      )}
                    </div> {/* <-- This closing tag was missing */}
                  </CardContent>
                </Card>
              )}
              </CardContent>
            </Card>
          </div>
        </div>

        <BottomNavigation />
      </main>
    );
  
}