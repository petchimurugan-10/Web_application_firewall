import { cn } from "../lib/utils"

const Badge = ({ className, variant = "default", ...props }) => {
  const variants = {
    default: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
    destructive: "bg-red-500/20 text-red-300 border border-red-500/30",
    outline: "bg-gray-500/20 text-gray-300 border border-gray-500/30",
    secondary: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
    success: "bg-green-500/20 text-green-300 border border-green-500/30",
    warning: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    info: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
