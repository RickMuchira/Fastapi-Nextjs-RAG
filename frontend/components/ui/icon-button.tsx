import * as React from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon" | "xs"
  tooltip?: string
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, icon, variant = "default", size = "default", tooltip, ...props }, ref) => {
    const buttonContent = (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn("p-0 flex items-center justify-center", className)}
        {...props}
      >
        {icon}
      </Button>
    )

    if (tooltip) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
            <TooltipContent>
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return buttonContent
  },
)

IconButton.displayName = "IconButton"
