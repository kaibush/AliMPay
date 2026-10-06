import * as React from "react";
import { cn } from "@/web/lib/utils";

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex min-h-28 w-full rounded-lg border bg-surface px-3 py-2 font-mono text-base leading-6 placeholder:font-sans placeholder:text-muted disabled:opacity-50 md:min-h-24 md:text-xs md:leading-5",
        className,
      )}
      {...props}
    />
  );
}
