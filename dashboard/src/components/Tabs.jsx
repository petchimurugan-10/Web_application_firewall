import { useState } from "react"
import { cn } from "../lib/utils"

const Tabs = ({ defaultValue, children, className, ...props }) => {
  const [activeTab, setActiveTab] = useState(defaultValue)

  return (
    <div className={cn("w-full", className)} {...props}>
      {typeof children === "function" ? children(activeTab, setActiveTab) : children}
    </div>
  )
}

const TabsList = ({ className, children, ...props }) => (
  <div
    className={cn(
      "inline-flex h-12 items-center justify-center rounded-xl bg-white/10 border border-white/20 p-1.5 backdrop-blur-md",
      className
    )}
    {...props}
  >
    {children}
  </div>
)

const TabsTrigger = ({ value, isActive, onClick, className, children, ...props }) => (
  <button
    onClick={() => onClick(value)}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      isActive
        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
        : "text-gray-400 hover:text-gray-300",
      className
    )}
    {...props}
  >
    {children}
  </button>
)

const TabsContent = ({ value, activeTab, className, children, ...props }) => (
  value === activeTab && (
    <div
      className={cn("mt-4 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2", className)}
      {...props}
    >
      {children}
    </div>
  )
)

export { Tabs, TabsList, TabsTrigger, TabsContent }
