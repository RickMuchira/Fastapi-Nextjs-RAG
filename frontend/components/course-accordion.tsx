"use client"

import type React from "react"

import { useState } from "react"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Edit, Trash2, Plus, ChevronDown, GraduationCap } from "lucide-react"
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
    if (!newCourseName.trim()) {
      toast.error("Please enter a course name")
      return
    }

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

  return (
    <>
      <Accordion
        type="multiple"
        value={expandedCourses}
        onValueChange={setExpandedCourses}
        className="w-full space-y-4"
      >
        {courses.map((course) => (
          <AccordionItem
            key={course.id}
            value={course.id.toString()}
            className="border border-white/10 rounded-lg overflow-hidden bg-white/5 backdrop-blur-sm"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-white/5 group">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-purple-500" />
                  <span className="font-medium text-lg text-white">{course.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 text-gray-400 group-data-[state=open]:rotate-180" />
                </div>
              </div>
            </AccordionTrigger>
            <div className="flex items-center gap-2 px-4 py-2 border-t border-white/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingCourse({ id: course.id, name: course.name })}
                className="text-gray-400 hover:text-white hover:bg-white/10"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit Course
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeletingCourseId(course.id)}
                className="text-gray-400 hover:text-white hover:bg-white/10"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Course
              </Button>
            </div>
            <AccordionContent className="pb-4 px-4">
              <YearAccordion courseId={course.id} years={course.years || []} fetchCourses={fetchCourses} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 flex items-center gap-2 p-4 border border-white/10 rounded-lg bg-white/5 backdrop-blur-sm"
        onSubmit={handleCreateCourse}
      >
        <Input
          placeholder="New course name"
          value={newCourseName}
          onChange={(e) => setNewCourseName(e.target.value)}
          className="flex-1 bg-white/5 border-white/20 text-white"
        />
        <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Course
        </Button>
      </motion.form>

      {/* Edit Course Dialog */}
      <Dialog open={!!editingCourse} onOpenChange={(open) => !open && setEditingCourse(null)}>
        <DialogContent className="bg-gray-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription className="text-gray-400">Update the course name below.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateCourse}>
            <Input
              value={editingCourse?.name || ""}
              onChange={(e) => setEditingCourse((prev) => (prev ? { ...prev, name: e.target.value } : null))}
              className="my-4 bg-white/5 border-white/20 text-white"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingCourse(null)}
                className="border-white/20 hover:bg-white/10 text-white"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Course Dialog */}
      <Dialog open={deletingCourseId !== null} onOpenChange={(open) => !open && setDeletingCourseId(null)}>
        <DialogContent className="bg-gray-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this course? This action cannot be undone and will also delete all years,
              semesters, and units associated with this course.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingCourseId(null)}
              className="border-white/20 hover:bg-white/10 text-white"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCourse} className="bg-red-600 hover:bg-red-700">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
