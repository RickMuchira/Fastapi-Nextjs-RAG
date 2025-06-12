'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/layout/page-header';
import { SparklesCore } from '@/components/sparkles';
import { FloatingPaper } from '@/components/floating-paper';
import { Brain, FileText, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

interface Document {
  id: number;
  filename: string;
  filepath: string;
  course_path: string;
}

interface QuizGenerationJob {
  id: string;
  documentId: number;
  filename: string;
  coursePath: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  progress: number;
  questionsGenerated: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

export default function QuizGenerationPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [generationJobs, setGenerationJobs] = useState<QuizGenerationJob[]>([]);

  // Fetch courses on mount
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/courses`)
      .then((res) => setCourses(res.data))
      .catch((err) => toast.error('Failed to load courses'));
  }, []);

  // Fetch years when course is selected
  useEffect(() => {
    if (selectedCourseId) {
      axios
        .get(`${API_BASE_URL}/courses/${selectedCourseId}/years`)
        .then((res) => setYears(res.data))
        .catch((err) => toast.error('Failed to load years'));
      setYears([]);
      setSemesters([]);
      setUnits([]);
      setDocuments([]);
      setSelectedYearId(null);
      setSelectedSemesterId(null);
      setSelectedUnitId(null);
    }
  }, [selectedCourseId]);

  // Fetch semesters when year is selected
  useEffect(() => {
    if (selectedYearId) {
      axios
        .get(`${API_BASE_URL}/years/${selectedYearId}/semesters`)
        .then((res) => setSemesters(res.data))
        .catch((err) => toast.error('Failed to load semesters'));
      setSemesters([]);
      setUnits([]);
      setDocuments([]);
      setSelectedSemesterId(null);
      setSelectedUnitId(null);
    }
  }, [selectedYearId]);

  // Fetch units when semester is selected
  useEffect(() => {
    if (selectedSemesterId) {
      axios
        .get(`${API_BASE_URL}/semesters/${selectedSemesterId}/units`)
        .then((res) => setUnits(res.data))
        .catch((err) => toast.error('Failed to load units'));
      setUnits([]);
      setDocuments([]);
      setSelectedUnitId(null);
    }
  }, [selectedSemesterId]);

  // Fetch documents when unit is selected
  useEffect(() => {
    if (selectedUnitId) {
      axios
        .get(`${API_BASE_URL}/units/${selectedUnitId}/documents`)
        .then((res) => setDocuments(res.data))
        .catch((err) => toast.error('Failed to load documents'));
      setDocuments([]);
    }
  }, [selectedUnitId]);

  const handleGenerateQuiz = (documentId: number) => {
    const document = documents.find((d) => d.id === documentId);
    if (!document) return;

    const newJob: QuizGenerationJob = {
      id: `job_${Date.now()}`,
      documentId,
      filename: document.filename,
      coursePath: document.course_path,
      status: 'generating',
      progress: 0,
      questionsGenerated: 0,
    };

    setGenerationJobs((prev) => [...prev, newJob]);

    const evtSource = new EventSource(`${API_BASE_URL}/documents/${documentId}/generate-quiz`);

    evtSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data === '[DONE]') {
        setGenerationJobs((prev) =>
          prev.map((job) =>
            job.id === newJob.id ? { ...job, status: 'completed', progress: 100 } : job,
          ),
        );
        evtSource.close();
        toast.success('Quiz generation completed');
        return;
      }

      if (data.error) {
        setGenerationJobs((prev) =>
          prev.map((job) => (job.id === newJob.id ? { ...job, status: 'failed' } : job)),
        );
        evtSource.close();
        toast.error(data.error);
        return;
      }

      setGenerationJobs((prev) =>
        prev.map((job) =>
          job.id === newJob.id
            ? { ...job, progress: data.progress, questionsGenerated: data.questionsGenerated }
            : job,
        ),
      );
    };

    evtSource.onerror = () => {
      setGenerationJobs((prev) =>
        prev.map((job) => (job.id === newJob.id ? { ...job, status: 'failed' } : job)),
      );
      evtSource.close();
      toast.error('Error generating quiz');
    };

    // Cleanup on unmount
    return () => evtSource.close();
  };

  return (
    <div className="min-h-screen bg-black/[0.96] antialiased bg-grid-white/[0.02] relative overflow-hidden">
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

      <div className="relative z-10">
        <div className="container mx-auto p-6">
          <PageHeader
            title="Quiz Generation"
            description="Generate quizzes from processed documents"
            icon={<Brain className="h-6 w-6" />}
          />

          {/* Course Selection */}
          <Card className="mb-6 bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <FileText className="w-5 h-5 mr-2 text-purple-500" />
                Select Course Unit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Course</label>
                  <Select
                    value={selectedCourseId?.toString() || ''}
                    onValueChange={(value) => setSelectedCourseId(Number(value))}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/20">
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {years.length > 0 && (
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
                )}

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
            </CardContent>
          </Card>

          {/* Available Documents */}
          {selectedUnitId && (
            <Card className="mb-6 bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Available Documents</CardTitle>
                <p className="text-gray-400 text-sm">
                  Documents for {courses.find((c) => c.id === selectedCourseId)?.name} /{' '}
                  {years.find((y) => y.id === selectedYearId)?.name} /{' '}
                  {semesters.find((s) => s.id === selectedSemesterId)?.name} /{' '}
                  {units.find((u) => u.id === selectedUnitId)?.name}
                </p>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-white">No documents found</h3>
                    <p className="mt-2 text-sm text-gray-400">Upload and process documents for this unit first</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="text-gray-300">Filename</TableHead>
                        <TableHead className="text-gray-300">Course Path</TableHead>
                        <TableHead className="text-gray-300 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((doc) => (
                        <TableRow key={doc.id} className="border-white/10">
                          <TableCell className="text-white font-medium">{doc.filename}</TableCell>
                          <TableCell className="text-gray-400">{doc.course_path}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              onClick={() => handleGenerateQuiz(doc.id)}
                              disabled={generationJobs.some((job) => job.documentId === doc.id && job.status === 'generating')}
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              {generationJobs.some((job) => job.documentId === doc.id && job.status === 'generating') ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <Brain className="w-4 h-4 mr-2" />
                              )}
                              Generate Quiz
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* Generation Jobs */}
          {generationJobs.length > 0 && (
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Quiz Generation Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {generationJobs.map((job) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {job.status === 'generating' && <Loader2 className="w-4 h-4 animate-spin text-purple-500" />}
                          {job.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                          {job.status === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
                          <span className="text-white font-medium">{job.filename}</span>
                        </div>
                        <Badge
                          className={
                            job.status === 'completed'
                              ? 'bg-green-600 text-white'
                              : job.status === 'failed'
                              ? 'bg-red-600 text-white'
                              : 'bg-purple-600 text-white'
                          }
                        >
                          {job.status}
                        </Badge>
                      </div>
                      {job.status === 'completed' && (
                        <span className="text-green-400 text-sm">{job.questionsGenerated} questions generated</span>
                      )}
                    </div>

                    <p className="text-gray-400 text-sm mb-3">{job.coursePath}</p>

                    {job.status === 'generating' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Generating questions...</span>
                          <span className="text-sm font-medium text-white">{job.progress}%</span>
                        </div>
                        <Progress value={job.progress} className="h-2" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}