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
import SemesterAccordion from "@/components/semester-accordion"

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

interface YearAccordionProps {
  courseId: number
  years: any[]
  onCreateYear: (name: string) => Promise<void>
  fetchCourses: () => Promise<void>
}

export default function YearAccordion({ courseId, years, onCreateYear, fetchCourses }: YearAccordionProps) {
  const [newYearName, setNewYearName] = useState("")
  const [editingYear, setEditingYear] = useState<{ id: number; name: string } | null>(null)
  const [deletingYearId, setDeletingYearId] = useState<number | null>(null)
  const [expandedYears, setExpandedYears] = useState<string[]>([])

  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newYearName.trim()) return

    await onCreateYear(newYearName)
    setNewYearName("")
  }

  const handleUpdateYear = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingYear || !editingYear.name.trim()) return

    try {
      await axios.put(`${API_BASE_URL}/years/${editingYear.id}`, { name: editingYear.name })
      toast.success("Year updated successfully")
      fetchCourses()
      setEditingYear(null)
    } catch (error) {
      console.error("Error updating year:", error)
      toast.error("Failed to update year")
    }
  }

  const handleDeleteYear = async () => {
    if (deletingYearId === null) return

    try {
      await axios.delete(`${API_BASE_URL}/years/${deletingYearId}`)
      toast.success("Year deleted successfully")
      fetchCourses()
      setDeletingYearId(null)
    } catch (error) {
      console.error("Error deleting year:", error)
      toast.error("Failed to delete year")
    }
  }

  // Create a new semester
  const handleCreateSemester = async (yearId: number, name: string) => {
    try {
      await axios.post(`${API_BASE_URL}/years/${yearId}/semesters/`, { name })
      toast.success(`Semester "${name}" created successfully`)
      fetchCourses()
    } catch (error) {
      console.error("Error creating semester:", error)
      toast.error("Failed to create semester")
    }
  }

  return (
    <>
      <Accordion
        type="multiple"
        value={expandedYears}
        onValueChange={setExpandedYears}
        className="w-full space-y-2 px-4 pb-4"
      >
        {years.map((year) => (
          <AccordionItem key={year.id} value={year.id.toString()} className="border rounded-md overflow-hidden">
            <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-muted/50 group">
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">{year.name}</span>
                <div className="flex items-center gap-2">
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </div>
              </div>
            </AccordionTrigger>
            <div className="flex items-center gap-2 px-3 py-1 border-t">
              <IconButton
                onClick={() => setEditingYear({ id: year.id, name: year.name })}
                icon={<Edit className="h-3.5 w-3.5" />}
                variant="ghost"
                size="xs"
                tooltip="Edit year"
              />
              <IconButton
                onClick={() => setDeletingYearId(year.id)}
                icon={<Trash2 className="h-3.5 w-3.5" />}
                variant="ghost"
                size="xs"
                tooltip="Delete year"
              />
            </div>
            <AccordionContent className="pb-0">
              <SemesterAccordion
                yearId={year.id}
                semesters={year.semesters || []}
                onCreateSemester={(name) => handleCreateSemester(year.id, name)}
                fetchCourses={fetchCourses}
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <motion.form
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-2 flex items-center gap-2 px-4 pb-4"
        onSubmit={handleCreateYear}
      >
        <Input
          placeholder="New year name"
          value={newYearName}
          onChange={(e) => setNewYearName(e.target.value)}
          className="flex-1"
          size="sm"
        />
        <Button type="submit" size="sm" variant="outline">
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Year
        </Button>
      </motion.form>

      {/* Edit Year Dialog */}
      <Dialog open={!!editingYear} onOpenChange={(open) => !open && setEditingYear(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Year</DialogTitle>
            <DialogDescription>Update the year name below.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateYear}>
            <Input
              value={editingYear?.name || ""}
              onChange={(e) => setEditingYear((prev) => (prev ? { ...prev, name: e.target.value } : null))}
              className="my-4"
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingYear(null)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Year Dialog */}
      <Dialog open={deletingYearId !== null} onOpenChange={(open) => !open && setDeletingYearId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Year</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this year? This action cannot be undone and will also delete all semesters
              and units associated with this year.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingYearId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteYear}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
