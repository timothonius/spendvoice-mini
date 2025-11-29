import * as React from "react"
import { cn } from "../../lib/utils"

const Button = React.forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
  const variants = {
    default: "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-xl",
    destructive: "bg-red-500 text-white hover:bg-red-600",
    outline: "border-2 border-gray-200 bg-white hover:bg-gray-50",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
    ghost: "hover:bg-gray-100",
  }
  
  const sizes = {
    default: "h-12 px-6 py-3",
    sm: "h-9 px-4 text-sm",
    lg: "h-14 px-8 text-lg",
    xl: "h-20 px-8 text-xl",
  }

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button }