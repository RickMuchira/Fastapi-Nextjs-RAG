"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Star, 
  Trophy, 
  Flame, 
  Target, 
  Clock, 
  Users, 
  TrendingUp,
  Zap,
  Brain,
  BookOpen,
  Plus,
  Filter,
  Search,
  Heart,
  MessageCircle,
  Share
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SparklesCore } from "@/components/sparkles";
import { FloatingPaper } from "@/components/floating-paper";
import Navbar from "@/components/navbar";
import { toast } from "sonner";
import axios from "axios";

type UnitTopic = {
  id: number;
  name: string;
  quiz_count: number;
};

type TopicCard = UnitTopic & {
  icon: string;
  color: string;
  difficulty: string;
  estimatedTime: string;
  popularity: number;
  likes: number;
  comments: number;
  trending: boolean;
  featured: boolean;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const difficultyColors = {
  Easy: "from-green-400 to-emerald-500",
  Medium: "from-yellow-400 to-orange-500", 
  Hard: "from-red-400 to-pink-500",
  Expert: "from-purple-400 to-indigo-500"
};

const topicIcons = ["🧠", "💡", "⚛️", "📈", "🏛️", "🔬", "🎯", "⚡", "🎨", "🔥", "💻", "📚"];

export default function TopicsPage() {
  const [topics, setTopics] = useState<TopicCard[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<TopicCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const router = useRouter();

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoading(true);
        const response = await axios.get<UnitTopic[]>(`${API_BASE_URL}/units/topics`);
        
        // Transform API data into enhanced topic cards
        const enhancedTopics: TopicCard[] = response.data.map((topic, index) => ({
          ...topic,
          icon: topicIcons[index % topicIcons.length],
          color: Object.values(difficultyColors)[index % Object.values(difficultyColors).length],
          difficulty: Object.keys(difficultyColors)[Math.floor(Math.random() * 4)],
          estimatedTime: `${Math.floor(Math.random() * 10) + 5}min`,
          popularity: Math.floor(Math.random() * 100) + 1,
          likes: Math.floor(Math.random() * 500) + 50,
          comments: Math.floor(Math.random() * 100) + 10,
          trending: Math.random() > 0.7,
          featured: Math.random() > 0.8
        }));

        // Sort by popularity and featured status
        enhancedTopics.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          if (a.trending && !b.trending) return -1;
          if (!a.trending && b.trending) return 1;
          return b.popularity - a.popularity;
        });

        setTopics(enhancedTopics);
        setFilteredTopics(enhancedTopics);
      } catch (error) {
        console.error("Failed to load topics", error);
        toast.error("Failed to load quiz topics");
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, []);

  useEffect(() => {
    let filtered = topics;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(topic =>
        topic.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedFilter !== "all") {
      filtered = filtered.filter(topic => {
        switch (selectedFilter) {
          case "trending":
            return topic.trending;
          case "featured":
            return topic.featured;
          case "easy":
            return topic.difficulty === "Easy";
          case "hard":
            return topic.difficulty === "Hard";
          default:
            return true;
        }
      });
    }

    setFilteredTopics(filtered);
  }, [searchQuery, selectedFilter, topics]);

  const handleStartQuiz = (unitId: number) => {
    router.push(`/quiz/${unitId}`);
  };

  const handleGenerateQuiz = (unitId: number) => {
    router.push(`/generate-quiz/${unitId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black/[0.96] text-white relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <SparklesCore
            id="loading-sparkles"
            background="transparent"
            minSize={0.6}
            maxSize={1.4}
            particleDensity={100}
            className="w-full h-full"
            particleColor="#FFFFFF"
          />
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-xl">Loading Quiz Topics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black/[0.96] text-white relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <SparklesCore
          id="topics-sparkles"
          background="transparent"
          minSize={0.4}
          maxSize={1.0}
          particleDensity={50}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>
      <div className="absolute inset-0 overflow-hidden z-0">
        <FloatingPaper count={4} />
      </div>

      <div className="relative z-10">
        <Navbar />
        
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400">
                Quiz Topics
              </span>
            </h1>
            <p className="text-gray-400 text-xl mb-8">
              Swipe through quizzes like TikTok • Learn while having fun
            </p>

            {/* Search and Filter Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>
                <Button
                  variant="outline"
                  className="border-white/20 hover:bg-white/10 text-white"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  { id: "all", label: "All", icon: "🎯" },
                  { id: "trending", label: "Trending", icon: "🔥" },
                  { id: "featured", label: "Featured", icon: "⭐" },
                  { id: "easy", label: "Easy", icon: "🟢" },
                  { id: "hard", label: "Hard", icon: "🔴" }
                ].map((filter) => (
                  <Button
                    key={filter.id}
                    onClick={() => setSelectedFilter(filter.id)}
                    variant={selectedFilter === filter.id ? "default" : "outline"}
                    size="sm"
                    className={`${
                      selectedFilter === filter.id
                        ? "bg-purple-600 hover:bg-purple-700 text-white"
                        : "border-white/20 hover:bg-white/10 text-white"
                    }`}
                  >
                    <span className="mr-1">{filter.icon}</span>
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Topics Grid */}
          {filteredTopics.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-2xl font-bold mb-2">No Quiz Topics Found</h3>
              <p className="text-gray-400 mb-6">
                {searchQuery || selectedFilter !== "all" 
                  ? "Try adjusting your search or filters" 
                  : "Create some courses and generate quizzes to get started"
                }
              </p>
              {!searchQuery && selectedFilter === "all" && (
                <Button
                  onClick={() => router.push('/')}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Course
                </Button>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {filteredTopics.map((topic, index) => (
                  <motion.div
                    key={topic.id}
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -50, scale: 0.9 }}
                    transition={{ 
                      duration: 0.4, 
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 100
                    }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card className="bg-white/5 border-white/10 backdrop-blur-sm overflow-hidden group cursor-pointer relative">
                      {/* Trending/Featured Badges */}
                      <div className="absolute top-3 left-3 z-10 flex gap-2">
                        {topic.trending && (
                          <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
                            <Flame className="h-3 w-3 mr-1" />
                            Trending
                          </Badge>
                        )}
                        {topic.featured && (
                          <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>

                      <CardContent className="p-0">
                        {/* Topic Header */}
                        <div className={`relative h-32 bg-gradient-to-br ${topic.color} flex items-center justify-center`}>
                          <motion.div
                            className="text-5xl"
                            whileHover={{ scale: 1.2, rotate: 10 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            {topic.icon}
                          </motion.div>
                          
                          {/* Difficulty Badge */}
                          <div className="absolute bottom-3 right-3">
                            <Badge variant="secondary" className="bg-black/30 text-white text-xs">
                              {topic.difficulty}
                            </Badge>
                          </div>
                        </div>

                        {/* Topic Content */}
                        <div className="p-4">
                          <h3 className="text-lg font-bold mb-2 group-hover:text-purple-400 transition-colors line-clamp-2">
                            {topic.name}
                          </h3>

                          {/* Stats Row */}
                          <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center">
                                <Target className="h-3 w-3 mr-1" />
                                <span>{topic.quiz_count}</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>{topic.estimatedTime}</span>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              <span>{topic.popularity}</span>
                            </div>
                          </div>

                          {/* Social Stats */}
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center">
                                <Heart className="h-3 w-3 mr-1" />
                                <span>{topic.likes}</span>
                              </div>
                              <div className="flex items-center">
                                <MessageCircle className="h-3 w-3 mr-1" />
                                <span>{topic.comments}</span>
                              </div>
                            </div>
                            <Share className="h-3 w-3 text-gray-400" />
                          </div>

                          {/* Action Buttons */}
                          <div className="space-y-2">
                            {topic.quiz_count > 0 ? (
                              <Button
                                onClick={() => handleStartQuiz(topic.id)}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl"
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Start Quiz
                              </Button>
                            ) : (
                              <Button
                                onClick={() => handleGenerateQuiz(topic.id)}
                                variant="outline"
                                className="w-full border-purple-500/50 hover:bg-purple-500/20 text-purple-300 font-semibold py-3 rounded-xl"
                              >
                                <Zap className="h-4 w-4 mr-2" />
                                Generate Quiz
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Stats Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-16 text-center"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{topics.length}</div>
                <div className="text-sm text-gray-400">Total Topics</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{topics.reduce((sum, t) => sum + t.quiz_count, 0)}</div>
                <div className="text-sm text-gray-400">Quiz Questions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{topics.filter(t => t.trending).length}</div>
                <div className="text-sm text-gray-400">Trending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{topics.reduce((sum, t) => sum + t.likes, 0)}</div>
                <div className="text-sm text-gray-400">Total Likes</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
