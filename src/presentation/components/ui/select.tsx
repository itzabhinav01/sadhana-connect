import * as React from "react"

import { cn } from "@/shared/utils/cn"

// A plain native <select>, not a Radix listbox — admin filter/role
// dropdowns here have short, simple option lists where native select
// behavior (keyboard, mobile picker, screen reader support) is already
// exactly right, so no extra component is worth adding for this.
function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm dark:bg-input/30",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Select }
