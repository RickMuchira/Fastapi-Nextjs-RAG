"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BookOpen, Calendar, FileText, Home, Layers, Upload, MessageSquare, GitBranch } from "lucide-react"

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string
    title: string
    icon: React.ReactNode
  }[]
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav className={cn("flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1", className)} {...props}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
            pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {item.icon}
          {item.title}
        </Link>
      ))}
    </nav>
  )
}

export const sidebarItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: <Home className="h-4 w-4" />,
  },
  {
    title: "Courses",
    href: "/course",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    title: "Years",
    href: "/year",
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    title: "Semesters",
    href: "/semester",
    icon: <Layers className="h-4 w-4" />,
  },
  {
    title: "Units",
    href: "/unit",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    title: "Documents",
    href: "/documents",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    title: "Upload",
    href: "/documents/upload",
    icon: <Upload className="h-4 w-4" />,
  },
  {
    title: "Ask Questions",
    href: "/ask",
    icon: <MessageSquare className="h-4 w-4" />,
  },
  {
    title: "Course Tree",
    href: "/tree",
    icon: <GitBranch className="h-4 w-4" />,
  },
]
