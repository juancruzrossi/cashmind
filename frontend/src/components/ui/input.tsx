import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary/30 selection:text-foreground",
        "h-10 w-full min-w-0 rounded-lg border bg-[#12121a] px-3 py-2 text-sm transition-colors outline-none",
        "border-[rgba(255,255,255,0.06)]",
        "focus:border-primary/40 focus:ring-0",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive/50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
