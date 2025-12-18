
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/100 active:text-primary-foreground shadow-md hover:shadow-lg active:scale-95",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground active:bg-destructive active:text-destructive-foreground active:scale-95",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent active:text-accent-foreground active:scale-95",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:text-secondary-foreground active:bg-secondary active:text-secondary-foreground active:scale-95",
        ghost: "hover:bg-accent hover:text-accent-foreground active:bg-accent active:text-accent-foreground active:scale-95",
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary active:text-primary-foreground active:scale-95",
        link: "text-primary underline-offset-4 hover:underline active:text-primary/80 active:text-primary",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, noHover=false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  
  if (noHover) {
     return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        />
     )
  }

  // If asChild is true, we avoid wrapping in motion.div to prevent breaking composition
  // with components like DropdownMenuTrigger that expect a specific structure.
  if (asChild) {
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
  
  return (
    <motion.div 
      whileTap={{ scale: 0.96 }} 
      transition={{ duration: 0.1 }}
      className="inline-block"
    >
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    </motion.div>
  );
});
Button.displayName = "Button"

export { Button, buttonVariants }
