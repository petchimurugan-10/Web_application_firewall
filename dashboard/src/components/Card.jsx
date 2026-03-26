import { cn } from "../lib/utils"

const Card = ({ className, ...props }) => (
  <div
    className={cn("rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl", className)}
    {...props}
  />
)

const CardHeader = ({ className, ...props }) => (
  <div
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
)

const CardTitle = ({ className, ...props }) => (
  <h2
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight text-white",
      className
    )}
    {...props}
  />
)

const CardDescription = ({ className, ...props }) => (
  <p className={cn("text-sm text-gray-400", className)} {...props} />
)

const CardContent = ({ className, ...props }) => (
  <div className={cn("p-6 pt-0", className)} {...props} />
)

const CardFooter = ({ className, ...props }) => (
  <div
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
)

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
