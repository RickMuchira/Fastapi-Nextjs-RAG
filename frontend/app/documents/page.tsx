"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { toast } from "sonner"
import { FileText, Download, Play, Trash2, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Toaster } from "sonner"
import Link from "next/link"
import Navbar from "@/components/navbar"
import { SparklesCore } from "@/components/sparkles"
import { FloatingPaper } from "@/components/floating-paper"

interface Document {
  id: number
  filename: string
  filepath: string
  course_path: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

export default function DocumentListPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [progress, setProgress] = useState<Record<number, string[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [processingDocId, setProcessingDocId] = useState<number | null>(null)
  const [deletingDocId, setDeletingDocId] = useState<number | null>(null)

  const fetchDocuments = async () => {
    try {
      setIsLoading(true)
      const res = await axios.get(`${API_BASE_URL}/documents/`)
      setDocuments(res.data)
    } catch (error) {
      toast.error("Failed to load documents")
      console.error("Error loading documents:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  const handleProcess = (docId: number) => {
    setProcessingDocId(docId)
    setProgress((prev) => ({ ...prev, [docId]: [] }))

    const evtSource = new EventSource(`${API_BASE_URL}/documents/${docId}/process`)

    evtSource.onmessage = (event) => {
      setProgress((prev) => ({
        ...prev,
        [docId]: [...(prev[docId] || []), event.data],
      }))
    }

    evtSource.onerror = () => {
      evtSource.close()
      setProcessingDocId(null)
      toast.success("Document processing completed")
      fetchDocuments()
    }
  }

  const handleDelete = async () => {
    if (deletingDocId === null) return

    try {
      await axios.delete(`${API_BASE_URL}/documents/${deletingDocId}`)
      toast.success("Document deleted successfully")
      fetchDocuments()
      setDeletingDocId(null)
    } catch (error) {
      toast.error("Failed to delete document")
      console.error("Error deleting document:", error)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-black/[0.96] text-white antialiased bg-grid-white/[0.02] relative overflow-hidden">
      {/* Ambient background with moving particles */}
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

      {/* Floating papers background */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <FloatingPaper count={6} />
      </div>

      <div className="relative z-10">
        <Navbar />

        <div className="container mx-auto p-6">
          <PageHeader
            title="Documents"
            icon={<FileText className="h-6 w-6" />}
            description="Manage your uploaded documents"
          />

          <div className="flex justify-end mb-4">
            <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white">
              <Link href="/documents/upload">
                <Plus className="mr-2 h-4 w-4" />
                Upload New Document
              </Link>
            </Button>
          </div>

          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle>Uploaded Documents</CardTitle>
              <CardDescription className="text-gray-400">
                View, process, and manage your uploaded documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium">No documents found</h3>
                  <p className="mt-2 text-sm text-gray-400">Upload your first document to get started</p>
                  <Button asChild className="mt-4 bg-purple-600 hover:bg-purple-700 text-white">
                    <Link href="/documents/upload">
                      <Plus className="mr-2 h-4 w-4" />
                      Upload Document
                    </Link>
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead>Filename</TableHead>
                      <TableHead>Course Path</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id} className="border-white/10">
                        <TableCell className="font-medium">{doc.filename}</TableCell>
                        <TableCell>{doc.course_path}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="border-white/20 hover:bg-purple-500/20"
                            >
                              <a
                                href={`${API_BASE_URL}/documents/download/${doc.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download className="h-4 w-4" />
                                <span className="sr-only">Download</span>
                              </a>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleProcess(doc.id)}
                              disabled={processingDocId === doc.id}
                              className="border-white/20 hover:bg-purple-500/20"
                            >
                              {processingDocId === doc.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                              <span className="sr-only">Process</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeletingDocId(doc.id)}
                              className="border-white/20 hover:bg-purple-500/20"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>

                          {progress[doc.id] && progress[doc.id].length > 0 && (
                            <div className="mt-2 text-left">
                              <Badge variant="outline" className="mb-1 border-purple-500/50">
                                Processing
                              </Badge>
                              <div className="text-xs text-gray-400 max-h-24 overflow-y-auto border border-white/10 rounded p-2 bg-black/30">
                                {progress[doc.id].map((msg, idx) => (
                                  <div key={idx} className="mb-1">
                                    {msg}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Delete Confirmation Dialog */}
          <Dialog open={deletingDocId !== null} onOpenChange={(open) => !open && setDeletingDocId(null)}>
            <DialogContent className="bg-gray-900 border-white/10 text-white">
              <DialogHeader>
                <DialogTitle>Delete Document</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Are you sure you want to delete this document? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeletingDocId(null)}
                  className="border-white/20 hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Toaster />
        </div>
      </div>
    </div>
  )
}
