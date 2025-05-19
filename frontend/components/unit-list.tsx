"use client"

import type React from "react"

import { useState } from "react"
import axios from "axios"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { Edit, Trash2, Plus, FileText } from "lucide-react"
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

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

interface UnitListProps {
  semesterId: number
  units: any[]
  fetchCourses: () => Promise<void>
}

export default function UnitList({ semesterId, units, fetchCourses }: UnitListProps) {
  const [newUnitName, setNewUnitName] = useState("")
  const [editingUnit, setEditingUnit] = useState<{ id: number; name: string } | null>(null)
  const [deletingUnitId, setDeletingUnitId] = useState<number | null>(null)

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUnitName.trim()) {
      toast.error("Please enter a unit name")
      return
    }

    try {
      await axios.post(`${API_BASE_URL}/semesters/${semesterId}/units/`, { name: newUnitName })
      toast.success(`Unit "${newUnitName}" created successfully`)
      fetchCourses()
      setNewUnitName("")
    } catch (error) {
      console.error("Error creating unit:", error)
      toast.error("Failed to create unit")
    }
  }

  const handleUpdateUnit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUnit || !editingUnit.name.trim()) return

    try {
      await axios.put(`${API_BASE_URL}/units/${editingUnit.id}`, { name: editingUnit.name })
      toast.success("Unit updated successfully")
      fetchCourses()
      setEditingUnit(null)
    } catch (error) {
      console.error("Error updating unit:", error)
      toast.error("Failed to update unit")
    }
  }

  const handleDeleteUnit = async () => {
    if (deletingUnitId === null) return

    try {
      await axios.delete(`${API_BASE_URL}/units/${deletingUnitId}`)
      toast.success("Unit deleted successfully")
      fetchCourses()
      setDeletingUnitId(null)
    } catch (error) {
      console.error("Error deleting unit:", error)
      toast.error("Failed to delete unit")
    }
  }

  return (
    <>
      <div className="space-y-2">
        <AnimatePresence>
          {units.map((unit) => (
            <motion.div
              key={unit.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between p-2 rounded border border-white/10 bg-black/40 group"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-sm text-white">{unit.name}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingUnit({ id: unit.id, name: unit.name })}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <Edit className="h-3 w-3" />
                  <span className="sr-only">Edit unit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingUnitId(unit.id)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <Trash2 className="h-3 w-3" />
                  <span className="sr-only">Delete unit</span>
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <motion.form
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2"
          onSubmit={handleCreateUnit}
        >
          <Input
            placeholder="New unit name"
            value={newUnitName}
            onChange={(e) => setNewUnitName(e.target.value)}
            className="flex-1 h-7 text-xs bg-white/5 border-white/20 text-white"
            size="sm"
          />
          <Button type="submit" size="sm" className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white">
            <Plus className="h-3 w-3 mr-1" />
            Add Unit
          </Button>
        </motion.form>
      </div>

      {/* Edit Unit Dialog */}
      <Dialog open={!!editingUnit} onOpenChange={(open) => !open && setEditingUnit(null)}>
        <DialogContent className="bg-gray-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Edit Unit</DialogTitle>
            <DialogDescription className="text-gray-400">Update the unit name below.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUnit}>
            <Input
              value={editingUnit?.name || ""}
              onChange={(e) => setEditingUnit((prev) => (prev ? { ...prev, name: e.target.value } : null))}
              className="my-4 bg-white/5 border-white/20 text-white"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingUnit(null)}
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

      {/* Delete Unit Dialog */}
      <Dialog open={deletingUnitId !== null} onOpenChange={(open) => !open && setDeletingUnitId(null)}>
        <DialogContent className="bg-gray-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Delete Unit</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this unit? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingUnitId(null)}
              className="border-white/20 hover:bg-white/10 text-white"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUnit} className="bg-red-600 hover:bg-red-700">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
