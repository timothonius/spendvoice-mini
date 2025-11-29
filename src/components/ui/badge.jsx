import * as React from "react"
import { cn } from "../../lib/utils"

const Badge = React.forwardRef(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "bg-gray-100 text-gray-900",
    success: "bg-green-100 text-green-900",
    warning: "bg-yellow-100 text-yellow-900",
    error: "bg-red-100 text-red-900",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  )
})
Badge.displayName = "Badge"

export { Badge }