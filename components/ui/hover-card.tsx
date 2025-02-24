"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";

const HoverCard = HoverCardPrimitive.Root;

const HoverCardTrigger = HoverCardPrimitive.Trigger;

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(
  (
    { className, align = "start", side = "top", sideOffset = 4, ...props },
    ref
  ) => (
    <HoverCardPrimitive.Content
      ref={ref}
      align={align}
      side={side}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-auto rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none " +
          "data-[state=open]:animate-in data-[state=closed]:animate-out " +
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 " +
          "data-[state=closed]:zoom-out-50 data-[state=open]:zoom-in-150 " +
          "data-[side=bottom]:slide-in-from-top-2 " +
          "data-[side=left]:slide-in-from-right-2 " +
          "data-[side=right]:slide-in-from-left-2 " +
          "data-[side=top]:slide-in-from-top-2",
        className
      )}
      {...props}
    />
  )
);
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;

export { HoverCard, HoverCardTrigger, HoverCardContent };
