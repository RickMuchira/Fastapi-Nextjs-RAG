"use client"

import type React from "react"

import { useState } from "react"
import axios from "axios"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Edit, Trash2, Plus, ChevronDown } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { IconButton } from "@/components/ui/icon-button"
import YearAccordion from "@/components/year-accordion"

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

interface CourseAccordionProps {
  courses: any[]
  onCreateCourse: (name: string) => Promise<void>
  onUpdateCourse: (id: number, name: string) => Promise<void>
  onDeleteCourse: (id: number) => Promise<void>
  fetchCourses: () => Promise<void>
}

export default function CourseAccordion({
  courses,
  onCreateCourse,
  onUpdateCourse,
  onDeleteCourse,
  fetchCourses,
}: CourseAccordionProps) {
  const [newCourseName, setNewCourseName] = useState("")
  const [editingCourse, setEditingCourse] = useState<{ id: number; name: string } | null>(null)
  const [deletingCourseId, setDeletingCourseId] = useState<number | null>(null)
  const [expandedCourses, setExpandedCourses] = useState<string[]>([])

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCourseName.trim()) return

    await onCreateCourse(newCourseName)
    setNewCourseName("")
  }

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCourse || !editingCourse.name.trim()) return

    await onUpdateCourse(editingCourse.id, editingCourse.name)
    setEditingCourse(null)
  }

  const handleDeleteCourse = async () => {
    if (deletingCourseId === null) return

    await onDeleteCourse(deletingCourseId)
    setDeletingCourseId(null)
  }

  // Create a new year
  const handleCreateYear = async (courseId: number, name: string) => {
    try {
      await axios.post(`${API_BASE_URL}/courses/${courseId}/years/`, { name })
      toast.success(`Year "${name}" created successfully`)
      fetchCourses()
    } catch (error) {
      console.error("Error creating year:", error)
      toast.error("Failed to create year")
    }
  }

  return (
    <>
      <Accordion
        type="multiple"
        value={expandedCourses}
        onValueChange={setExpandedCourses}
        className="w-full space-y-4"
      >
        {courses.map((course) => (
          <AccordionItem key={course.id} value={course.id.toString()} className="border rounded-lg overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 group">
              <div className="flex items-center justify-between w-full">
                <span className="font-medium text-lg">{course.name}</span>
                <div className="flex items-center gap-2">
                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </div>
              </div>
            </AccordionTrigger>
            <div className="flex items-center gap-2 px-4 py-1 border-t">
              <IconButton
                onClick={() => setEditingCourse({ id: course.id, name: course.name })}
                icon={<Edit className="h-4 w-4" />}
                variant="ghost"
                size="sm"
                tooltip="Edit course"
              />
              <IconButton
                onClick={() => setDeletingCourseId(course.id)}
                icon={<Trash2 className="h-4 w-4" />}
                variant="ghost"
                size="sm"
                tooltip="Delete course"
              />
            </div>
            <AccordionContent className="pb-0">
              <YearAccordion
                courseId={course.id}
                years={course.years || []}
                onCreateYear={(name) => handleCreateYear(course.id, name)}
                fetchCourses={fetchCourses}
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 flex items-center gap-2 p-4 border rounded-lg"
        onSubmit={handleCreateCourse}
      >
        <Input
          placeholder="New course name"
          value={newCourseName}
          onChange={(e) => setNewCourseName(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Course
        </Button>
      </motion.form>

      {/* Edit Course Dialog */}
      <Dialog open={!!editingCourse} onOpenChange={(open) => !open && setEditingCourse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>Update the course name below.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateCourse}>
            <Input
              value={editingCourse?.name || ""}
              onChange={(e) => setEditingCourse((prev) => (prev ? { ...prev, name: e.target.value } : null))}
              className="my-4"
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingCourse(null)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Course Dialog */}
      <Dialog open={deletingCourseId !== null} onOpenChange={(open) => !open && setDeletingCourseId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this course? This action cannot be undone and will also delete all years,
              semesters, and units associated with this course.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingCourseId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCourse}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
