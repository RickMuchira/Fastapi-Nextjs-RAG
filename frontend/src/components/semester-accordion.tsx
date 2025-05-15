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
import UnitList from "@/components/unit-list"

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

interface SemesterAccordionProps {
  yearId: number
  semesters: any[]
  onCreateSemester: (name: string) => Promise<void>
  fetchCourses: () => Promise<void>
}

export default function SemesterAccordion({
  yearId,
  semesters,
  onCreateSemester,
  fetchCourses,
}: SemesterAccordionProps) {
  const [newSemesterName, setNewSemesterName] = useState("")
  const [editingSemester, setEditingSemester] = useState<{ id: number; name: string } | null>(null)
  const [deletingSemesterId, setDeletingSemesterId] = useState<number | null>(null)
  const [expandedSemesters, setExpandedSemesters] = useState<string[]>([])

  const handleCreateSemester = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSemesterName.trim()) return

    await onCreateSemester(newSemesterName)
    setNewSemesterName("")
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
        className="w-full space-y-2 px-3 pb-3"
      >
        {semesters.map((semester) => (
          <AccordionItem key={semester.id} value={semester.id.toString()} className="border rounded-md overflow-hidden">
            <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-muted/50 group">
              <div className="flex items-center justify-between w-full">
                <span className="font-medium text-sm">{semester.name}</span>
                <div className="flex items-center gap-2">
                  <ChevronDown className="h-3 w-3 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </div>
              </div>
            </AccordionTrigger>
            <div className="flex items-center gap-2 px-3 py-1 border-t">
              <IconButton
                onClick={() => setEditingSemester({ id: semester.id, name: semester.name })}
                icon={<Edit className="h-3 w-3" />}
                variant="ghost"
                size="xs"
                tooltip="Edit semester"
              />
              <IconButton
                onClick={() => setDeletingSemesterId(semester.id)}
                icon={<Trash2 className="h-3 w-3" />}
                variant="ghost"
                size="xs"
                tooltip="Delete semester"
              />
            </div>
            <AccordionContent className="pb-0">
              <UnitList semesterId={semester.id} units={semester.units || []} fetchCourses={fetchCourses} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <motion.form
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-2 flex items-center gap-2 px-3 pb-3"
        onSubmit={handleCreateSemester}
      >
        <Input
          placeholder="New semester name"
          value={newSemesterName}
          onChange={(e) => setNewSemesterName(e.target.value)}
          className="flex-1 h-8 text-sm"
          size="sm"
        />
        <Button type="submit" size="sm" variant="outline" className="h-8 text-xs">
          <Plus className="h-3 w-3 mr-1" />
          Add Semester
        </Button>
      </motion.form>

      {/* Edit Semester Dialog */}
      <Dialog open={!!editingSemester} onOpenChange={(open) => !open && setEditingSemester(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Semester</DialogTitle>
            <DialogDescription>Update the semester name below.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSemester}>
            <Input
              value={editingSemester?.name || ""}
              onChange={(e) => setEditingSemester((prev) => (prev ? { ...prev, name: e.target.value } : null))}
              className="my-4"
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingSemester(null)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Semester Dialog */}
      <Dialog open={deletingSemesterId !== null} onOpenChange={(open) => !open && setDeletingSemesterId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Semester</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this semester? This action cannot be undone and will also delete all units
              associated with this semester.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingSemesterId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSemester}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
