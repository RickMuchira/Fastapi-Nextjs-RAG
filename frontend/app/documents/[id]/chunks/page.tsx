"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import axios from "axios"
import { toast } from "sonner"
import { Loader2, ArrowLeft, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PageHeader } from "@/components/layout/page-header"
import Navbar from "@/components/navbar"
import { SparklesCore } from "@/components/sparkles"
import { FloatingPaper } from "@/components/floating-paper"
import { cn } from "@/lib/utils"

interface Chunk {
  chunk_index: number
  heading: string
  text: string
  pages: string[] | null
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

// Utility to heuristically guess if a chunk is a table or image
function getChunkType(chunk: Chunk) {
  if (chunk.text.trim().startsWith("|") && chunk.text.includes("---")) {
    return "Table"
  }
  if (chunk.text.includes("![") && chunk.text.includes("](")) {
    return "Image"
  }
  return "Text"
}

function isLargeChunk(chunk: Chunk) {
  return chunk.text.length > 1200
}

export default function ChunksPage() {
  const params = useParams()
  const router = useRouter()
  const docId = params?.id

  const [chunks, setChunks] = useState<Chunk[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (!docId) return
    const fetchChunks = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const res = await axios.get<Chunk[]>(`${API_BASE_URL}/documents/${docId}/chunks`)
        setChunks(res.data)
      } catch (err: any) {
        setError("Failed to load chunks")
        toast.error("Failed to load chunks")
      } finally {
        setIsLoading(false)
      }
    }
    fetchChunks()
  }, [docId])

  const toggleExpand = (idx: number) =>
    setExpanded(prev => ({ ...prev, [idx]: !prev[idx] }))

  return (
    <div className="min-h-screen flex flex-col bg-black/[0.96] text-white antialiased bg-grid-white/[0.02] relative overflow-hidden">
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
              icon={<ArrowLeft className="h-6 w-6 opacity-0" />}
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
                  {chunks.map((chunk) => {
                    const chunkType = getChunkType(chunk)
                    const large = isLargeChunk(chunk)
                    const showAll = expanded[chunk.chunk_index] || !large
                    return (
                      <div
                        key={chunk.chunk_index}
                        className={cn(
                          "border border-white/20 rounded p-4 bg-black/80 group transition-shadow",
                          large && "shadow-xl"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-0.5 bg-purple-700/30 rounded-full text-purple-200">
                            Chunk {chunk.chunk_index}
                          </span>
                          <span className="text-xs text-gray-400">
                            {chunkType}
                          </span>
                          {chunk.pages && chunk.pages.length > 0 && (
                            <span className="text-xs text-gray-400 ml-2">
                              Pages: {chunk.pages.join("–")}
                            </span>
                          )}
                          <span className="text-xs text-purple-400 ml-2 truncate max-w-xs">
                            <em>{chunk.heading}</em>
                          </span>
                          {large && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="ml-auto"
                              onClick={() => toggleExpand(chunk.chunk_index)}
                              aria-label={showAll ? "Collapse chunk" : "Expand chunk"}
                            >
                              {showAll ? <ChevronDown /> : <ChevronRight />}
                            </Button>
                          )}
                        </div>
                        {/* Chunk text rendering */}
                        {chunkType === "Table" ? (
                          <pre className="overflow-x-auto text-xs bg-zinc-900/70 rounded-md p-2 border border-white/10 mb-2">
                            {chunk.text}
                          </pre>
                        ) : chunkType === "Image" ? (
                          <div className="bg-zinc-900/70 rounded-md p-2 border border-white/10 mb-2">
                            {/* Simple markdown image preview if direct path, else fallback */}
                            {chunk.text.match(/!\[.*\]\((.+)\)/) ? (
                              <img
                                src={chunk.text.match(/!\[.*\]\((.+)\)/)![1]}
                                alt="PDF image chunk"
                                className="max-h-60 object-contain mx-auto my-2 rounded"
                              />
                            ) : (
                              <pre className="overflow-x-auto text-xs">{chunk.text}</pre>
                            )}
                          </div>
                        ) : (
                          <div
                            className={cn(
                              "text-sm text-gray-200 whitespace-pre-wrap",
                              large && !showAll && "max-h-32 overflow-y-hidden blur-sm",
                              large && showAll && "max-h-60 overflow-y-auto"
                            )}
                            style={large && !showAll ? { cursor: "pointer" } : {}}
                            onClick={() => large && !showAll && toggleExpand(chunk.chunk_index)}
                            title={large && !showAll ? "Click to expand" : ""}
                          >
                            {chunk.text}
                          </div>
                        )}
                        {large && !showAll && (
                          <div className="text-xs text-center mt-2 text-gray-400">
                            Click to expand chunk
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
