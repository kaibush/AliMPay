import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/web/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-3.5 text-sm font-medium tracking-tight transition-colors disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary/90",
        outline: "border bg-surface text-foreground hover:bg-foreground/5",
        ghost: "text-foreground hover:bg-foreground/5",
        danger: "bg-destructive text-white hover:bg-destructive/90",
        success: "bg-success text-white hover:bg-success/90",
      },
      size: {
        default: "h-11 md:h-9",
        sm: "h-10 px-3 text-xs md:h-8",
        lg: "h-12 px-4 text-base md:h-10",
        icon: "size-11 px-0 md:size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
