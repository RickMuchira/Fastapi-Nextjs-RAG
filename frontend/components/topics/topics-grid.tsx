'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2, ServerCrash } from 'lucide-react';

// Define the structure of our Topic data fetched from the API
interface Topic {
  id: number;
  name: string;
  quiz_count: number;
}

// These properties are for the UI and not present in the database,
// so we'll add them on the client-side.
interface TopicWithUi extends Topic {
  icon: string;
  color: string;
  progress: number; // You can connect this to real progress data later
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

// Helper to assign colors and icons to make the UI engaging
const uiDetails = [
  { icon: '🧠', color: 'from-purple-500 to-indigo-500' },
  { icon: '💡', color: 'from-blue-500 to-cyan-500' },
  { icon: '⚛️', color: 'from-green-500 to-teal-500' },
  { icon: '📈', color: 'from-yellow-500 to-amber-500' },
  { icon: '🏛️', color: 'from-red-500 to-rose-500' },
  { icon: '🔬', color: 'from-pink-500 to-fuchsia-500' },
];

export default function TopicsGrid() {
  const router = useRouter();
  const [topics, setTopics] = useState<TopicWithUi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get<Topic[]>(`${API_BASE_URL}/units/topics`);
        
        // Map API data to UI data, adding icons, colors, and mock progress
        const topicsWithUiData = response.data.map((topic, index) => ({
          ...topic,
          ...uiDetails[index % uiDetails.length], // Cycle through UI details
          progress: 0, // Placeholder progress; can be replaced with real data later
        }));

        setTopics(topicsWithUiData);
      } catch (err) {
        console.error('Failed to fetch topics:', err);
        setError('Could not connect to the server. Please try again later.');
        toast.error('Failed to load topics.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopics();
  }, []); // Empty dependency array ensures this runs only once on mount

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 text-white">
        <Loader2 className="w-8 h-8 animate-spin mr-2" />
        Loading Topics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-red-400 bg-red-500/10 rounded-lg">
        <ServerCrash className="w-12 h-12 mb-4" />
        <p className="text-lg font-semibold">An Error Occurred</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {topics.map((topic, index) => (
          <motion.div
            key={topic.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Card
              className="bg-white/5 border-white/10 backdrop-blur-sm cursor-pointer overflow-hidden group h-full flex flex-col"
              onClick={() => router.push(`/topics/${topic.id}`)}
            >
              <div className="p-6 text-center flex-grow flex flex-col justify-between">
                <div>
                  {/* Topic Icon */}
                  <motion.div
                    className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-3xl bg-gradient-to-br ${topic.color}`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    {topic.icon}
                  </motion.div>

                  {/* Topic Name */}
                  <h3 className="text-white font-semibold mb-2 group-hover:text-purple-400 transition-colors">
                    {topic.name}
                  </h3>
                </div>

                <div>
                  {/* Quiz Count */}
                  <Badge variant="secondary" className="bg-purple-600/20 text-purple-400 border-purple-600/30">
                    {topic.quiz_count} quiz{topic.quiz_count !== 1 ? 'zes' : ''} available
                  </Badge>

                  {/* Progress Bar */}
                  <div className="mt-4 w-full bg-white/10 rounded-full h-2">
                    <motion.div
                      className="bg-purple-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${topic.progress}%` }}
                      transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
                    />
                  </div>
                  <p className="text-gray-400 text-xs mt-1">{topic.progress}% complete</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}