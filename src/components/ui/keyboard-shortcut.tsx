
import * as React from "react";
import { cn } from "@/lib/utils";

interface KeyboardShortcutProps extends React.HTMLAttributes<HTMLDivElement> {
  keys: string[];
  size?: "default" | "sm" | "lg";
}

export function KeyboardShortcut({
  keys,
  size = "default",
  className,
  ...props
}: KeyboardShortcutProps) {
  return (
    <div className={cn("flex gap-1", className)} {...props}>
      {keys.map((key, index) => (
        <kbd
          key={index}
          className={cn(
            "flex items-center justify-center rounded border bg-muted px-2 font-sans text-muted-foreground",
            {
              "h-5 text-xs": size === "sm",
              "h-7 text-sm": size === "default",
              "h-8 px-3 text-base": size === "lg"
            }
          )}
        >
          {key}
        </kbd>
      ))}
    </div>
  );
}
