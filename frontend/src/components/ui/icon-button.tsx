import type React from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon" | "xs"
  tooltip?: string
}

export function IconButton({
  icon,
  variant = "default",
  size = "default",
  tooltip,
  className,
  ...props
}: IconButtonProps) {
  const sizeClasses = {
    default: "h-10 w-10",
    sm: "h-8 w-8",
    lg: "h-12 w-12",
    icon: "h-10 w-10",
    xs: "h-6 w-6",
  }

  const button = (
    <Button type="button" variant={variant} size="icon" className={`${sizeClasses[size]} p-0 ${className}`} {...props}>
      {icon}
    </Button>
  )

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return button
}
