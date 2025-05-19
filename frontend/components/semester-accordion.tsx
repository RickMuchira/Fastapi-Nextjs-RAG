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
import UnitList from "@/components/unit-list"

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

interface SemesterAccordionProps {
  yearId: number
  semesters: any[]
  fetchCourses: () => Promise<void>
}

export default function SemesterAccordion({ yearId, semesters, fetchCourses }: SemesterAccordionProps) {
  const [newSemesterName, setNewSemesterName] = useState("")
  const [editingSemester, setEditingSemester] = useState<{ id: number; name: string } | null>(null)
  const [deletingSemesterId, setDeletingSemesterId] = useState<number | null>(null)
  const [expandedSemesters, setExpandedSemesters] = useState<string[]>([])

  const handleCreateSemester = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSemesterName.trim()) {
      toast.error("Please enter a semester name")
      return
    }

    try {
      await axios.post(`${API_BASE_URL}/years/${yearId}/semesters/`, { name: newSemesterName })
      toast.success(`Semester "${newSemesterName}" created successfully`)
      fetchCourses()
      setNewSemesterName("")
    } catch (error) {
      console.error("Error creating semester:", error)
      toast.error("Failed to create semester")
    }
  }

  const handleUpdateSemester = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSemester || !editingSemester.name.trim()) return

    try {
      await axios.put(`${API_BASE_URL}/semesters/${editingSemester.id}`, { name: editingSemester.name })
      toast.success("Semester updated successfully")
      fetchCourses()
      setEditingSemester(null)
    } catch (error) {
      console.error("Error updating semester:", error)
      toast.error("Failed to update semester")
    }
  }

  const handleDeleteSemester = async () => {
    if (deletingSemesterId === null) return

    try {
      await axios.delete(`${API_BASE_URL}/semesters/${deletingSemesterId}`)
      toast.success("Semester deleted successfully")
      fetchCourses()
      setDeletingSemesterId(null)
    } catch (error) {
      console.error("Error deleting semester:", error)
      toast.error("Failed to delete semester")
    }
  }

  return (
    <>
      <Accordion
        type="multiple"
        value={expandedSemesters}
        onValueChange={setExpandedSemesters}
        className="w-full space-y-2 mt-2"
      >
        {semesters.map((semester) => (
          <AccordionItem
            key={semester.id}
            value={semester.id.toString()}
            className="border border-white/10 rounded-md overflow-hidden bg-black/30"
          >
            <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-white/5 group">
              <div className="flex items-center justify-between w-full">
                <span className="font-medium text-sm text-white">{semester.name}</span>
                <div className="flex items-center gap-2">
                  <ChevronDown className="h-3 w-3 shrink-0 transition-transform duration-200 text-gray-400 group-data-[state=open]:rotate-180" />
                </div>
              </div>
            </AccordionTrigger>
            <div className="flex items-center gap-2 px-3 py-1 border-t border-white/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingSemester({ id: semester.id, name: semester.name })}
                className="h-6 px-2 text-xs text-gray-400 hover:text-white hover:bg-white/10"
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeletingSemesterId(semester.id)}
                className="h-6 px-2 text-xs text-gray-400 hover:text-white hover:bg-white/10"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>
            <AccordionContent className="pb-2 pt-2 px-3">
              <UnitList semesterId={semester.id} units={semester.units || []} fetchCourses={fetchCourses} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <motion.form
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 flex items-center gap-2"
        onSubmit={handleCreateSemester}
      >
        <Input
          placeholder="New semester name"
          value={newSemesterName}
          onChange={(e) => setNewSemesterName(e.target.value)}
          className="flex-1 h-8 text-sm bg-white/5 border-white/20 text-white"
          size="sm"
        />
        <Button type="submit" size="sm" className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white">
          <Plus className="h-3 w-3 mr-1" />
          Add Semester
        </Button>
      </motion.form>

      {/* Edit Semester Dialog */}
      <Dialog open={!!editingSemester} onOpenChange={(open) => !open && setEditingSemester(null)}>
        <DialogContent className="bg-gray-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Edit Semester</DialogTitle>
            <DialogDescription className="text-gray-400">Update the semester name below.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSemester}>
            <Input
              value={editingSemester?.name || ""}
              onChange={(e) => setEditingSemester((prev) => (prev ? { ...prev, name: e.target.value } : null))}
              className="my-4 bg-white/5 border-white/20 text-white"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingSemester(null)}
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

      {/* Delete Semester Dialog */}
      <Dialog open={deletingSemesterId !== null} onOpenChange={(open) => !open && setDeletingSemesterId(null)}>
        <DialogContent className="bg-gray-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Delete Semester</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this semester? This action cannot be undone and will also delete all units
              associated with this semester.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingSemesterId(null)}
              className="border-white/20 hover:bg-white/10 text-white"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSemester} className="bg-red-600 hover:bg-red-700">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
