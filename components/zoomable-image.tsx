"use client";

import Image from "next/image";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import React, { useState } from "react";
import { Fullscreen } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function ZoomableImage({
  src,
  alt,
  className,
}: ZoomableImageProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild className="cursor-pointer">
          <div className={`relative group ${className}`}>
            <Image
              src={src}
              alt={alt}
              fill
              className="object-cover rounded-lg"
            />
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-colors duration-200">
              <Fullscreen
                size={32}
                className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              />
            </div>
          </div>
        </DialogTrigger>
        <DialogContent className="zoom-dialog-content flex items-center justify-center p-0 bg-transparent border-none">
          <DialogTitle className="sr-only">Zoom Image</DialogTitle>
          <div className="relative w-full h-full">
            <AspectRatio ratio={1 / 1} className="w-full h-full">
              <Image
                src={src}
                alt={alt}
                fill
                className="object-cover rounded-lg"
              />
            </AspectRatio>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
