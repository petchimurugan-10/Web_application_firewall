import { cn } from "../lib/utils"

const Alert = ({ className, variant = "default", ...props }) => {
  const variants = {
    default: "bg-blue-900/20 border-blue-700/30 text-blue-200",
    destructive: "bg-red-900/20 border-red-700/30 text-red-200",
    success: "bg-green-900/20 border-green-700/30 text-green-200",
    warning: "bg-amber-900/20 border-amber-700/30 text-amber-200",
  }

  return (
    <div
      role="alert"
      className={cn(
        "relative w-full rounded-lg border px-4 py-4 backdrop-blur-sm",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

const AlertTitle = ({ className, ...props }) => (
  <h5 className={cn("mb-1 font-semibold text-white", className)} {...props} />
)

const AlertDescription = ({ className, ...props }) => (
  <div className={cn("text-sm opacity-90", className)} {...props} />
)

export { Alert, AlertTitle, AlertDescription }
