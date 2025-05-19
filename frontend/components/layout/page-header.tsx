import type React from "react"

interface PageHeaderProps {
  title: string
  description?: string
  icon?: React.ReactNode
}

export function PageHeader({ title, description, icon }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2">
        {icon && <div className="text-purple-500">{icon}</div>}
        <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
      </div>
      {description && <p className="mt-2 text-gray-400">{description}</p>}
    </div>
  )
}
