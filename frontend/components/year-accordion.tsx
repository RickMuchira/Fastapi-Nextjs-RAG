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
import SemesterAccordion from "@/components/semester-accordion"

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

interface YearAccordionProps {
  courseId: number
  years: any[]
  fetchCourses: () => Promise<void>
}

export default function YearAccordion({ courseId, years, fetchCourses }: YearAccordionProps) {
  const [newYearName, setNewYearName] = useState("")
  const [editingYear, setEditingYear] = useState<{ id: number; name: string } | null>(null)
  const [deletingYearId, setDeletingYearId] = useState<number | null>(null)
  const [expandedYears, setExpandedYears] = useState<string[]>([])

  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newYearName.trim()) {
      toast.error("Please enter a year name")
      return
    }

    try {
      await axios.post(`${API_BASE_URL}/courses/${courseId}/years/`, { name: newYearName })
      toast.success(`Year "${newYearName}" created successfully`)
      fetchCourses()
      setNewYearName("")
    } catch (error) {
      console.error("Error creating year:", error)
      toast.error("Failed to create year")
    }
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

  return (
    <>
      <Accordion
        type="multiple"
        value={expandedYears}
        onValueChange={setExpandedYears}
        className="w-full space-y-2 mt-4"
      >
        {years.map((year) => (
          <AccordionItem
            key={year.id}
            value={year.id.toString()}
            className="border border-white/10 rounded-md overflow-hidden bg-white/5 backdrop-blur-sm"
          >
            <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-white/5 group">
              <div className="flex items-center justify-between w-full">
                <span className="font-medium text-white">{year.name}</span>
                <div className="flex items-center gap-2">
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 text-gray-400 group-data-[state=open]:rotate-180" />
                </div>
              </div>
            </AccordionTrigger>
            <div className="flex items-center gap-2 px-3 py-1 border-t border-white/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingYear({ id: year.id, name: year.name })}
                className="h-7 px-2 text-gray-400 hover:text-white hover:bg-white/10"
              >
                <Edit className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeletingYearId(year.id)}
                className="h-7 px-2 text-gray-400 hover:text-white hover:bg-white/10"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete
              </Button>
            </div>
            <AccordionContent className="pb-2 pt-2 px-3">
              <SemesterAccordion yearId={year.id} semesters={year.semesters || []} fetchCourses={fetchCourses} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <motion.form
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 flex items-center gap-2"
        onSubmit={handleCreateYear}
      >
        <Input
          placeholder="New year name"
          value={newYearName}
          onChange={(e) => setNewYearName(e.target.value)}
          className="flex-1 bg-white/5 border-white/20 text-white"
        />
        <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Year
        </Button>
      </motion.form>

      {/* Edit Year Dialog */}
      <Dialog open={!!editingYear} onOpenChange={(open) => !open && setEditingYear(null)}>
        <DialogContent className="bg-gray-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Edit Year</DialogTitle>
            <DialogDescription className="text-gray-400">Update the year name below.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateYear}>
            <Input
              value={editingYear?.name || ""}
              onChange={(e) => setEditingYear((prev) => (prev ? { ...prev, name: e.target.value } : null))}
              className="my-4 bg-white/5 border-white/20 text-white"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingYear(null)}
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

      {/* Delete Year Dialog */}
      <Dialog open={deletingYearId !== null} onOpenChange={(open) => !open && setDeletingYearId(null)}>
        <DialogContent className="bg-gray-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Delete Year</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this year? This action cannot be undone and will also delete all semesters
              and units associated with this year.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingYearId(null)}
              className="border-white/20 hover:bg-white/10 text-white"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteYear} className="bg-red-600 hover:bg-red-700">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
