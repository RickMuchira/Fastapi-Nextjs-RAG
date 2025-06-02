"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import axios from "axios"
import { toast } from "sonner"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/layout/page-header"
import Navbar from "@/components/navbar"
import { SparklesCore } from "@/components/sparkles"
import { FloatingPaper } from "@/components/floating-paper"

interface Chunk {
  chunk_index: number
  heading: string
  text: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

export default function ChunksPage() {
  const params = useParams()
  const router = useRouter()
  const docId = params?.id
  const [chunks, setChunks] = useState<Chunk[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!docId) return

    const fetchChunks = async () => {
      try {
        setIsLoading(true)
        const res = await axios.get<Chunk[]>(`${API_BASE_URL}/documents/${docId}/chunks`)
        setChunks(res.data)
      } catch (err: any) {
        setError("Failed to load chunks")
        console.error("Error loading chunks:", err)
        toast.error("Failed to load chunks")
      } finally {
        setIsLoading(false)
      }
    }

    fetchChunks()
  }, [docId])

  return (
    <div className="min-h-screen flex flex-col bg-black/[0.96] text-white antialiased bg-grid-white/[0.02] relative overflow-hidden">
      {/* Background effects */}
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
        <Navbar />

        <div className="container mx-auto p-6">
          <div className="flex items-center mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/documents")}
              className="mr-4 border-white/20 hover:bg-purple-500/20"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="ml-1">Back to Documents</span>
            </Button>
            <PageHeader
              title={`Chunks for Document ${docId}`}
              icon={<ArrowLeft className="h-6 w-6 opacity-0" />} /* invisible icon for alignment */
              description="Inspect how this PDF was split into semantic chunks"
            />
          </div>

          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle>Chunks</CardTitle>
              <CardDescription className="text-gray-400">
                {isLoading
                  ? "Loading chunks..."
                  : error
                  ? "Unable to display chunks."
                  : `Total: ${chunks.length}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                </div>
              ) : error ? (
                <p className="text-center text-red-500">{error}</p>
              ) : chunks.length === 0 ? (
                <p className="text-center text-gray-400">No chunks found for this document.</p>
              ) : (
                <div className="space-y-6">
                  {chunks.map((chunk) => (
                    <div
                      key={chunk.chunk_index}
                      className="border border-white/20 rounded p-4 bg-black/80"
                    >
                      <h3 className="text-sm font-semibold text-purple-200 mb-2">
                        Chunk {chunk.chunk_index} – <em>{chunk.heading}</em>
                      </h3>
                      <div className="text-sm text-gray-200 whitespace-pre-wrap max-h-60 overflow-y-auto">
                        {chunk.text}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
