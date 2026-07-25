"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-line bg-canvas data-[state=checked]:border-accent data-[state=checked]:bg-accent ${className ?? ""}`}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="text-paper-1">
      <Check size={14} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
