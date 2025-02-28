"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import Image from "next/image";
import { Upload } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEdgeStore } from "@/lib/edgestore";
import { Button } from "@/components/ui/button";
import React, { useState, useRef } from "react";

const coverImages = [
  "/cover-1.jpg",
  "/cover-2.jpg",
  "/cover-3.jpg",
  "/cover-4.jpg",
];

interface CoverSelectImageProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CoverSelectImage({
  isOpen,
  onOpenChange,
}: CoverSelectImageProps) {
  const updateUserMutation = useMutation(api.users.updateUser);
  const { edgestore } = useEdgeStore();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const res = await edgestore.publicFiles.upload({
        file,
        onProgressChange: (progress) => setUploadProgress(progress),
      });
      await updateUserMutation({ updates: { coverImageUrl: res.url } });
      toast.success("Cover image updated!");
    } catch (error) {
      toast.error(
        `Failed to update cover image: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      onOpenChange(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) await handleUpload(e.target.files[0]);
  };

  const handleSelectCover = async (image: string) => {
    try {
      await updateUserMutation({ updates: { coverImageUrl: image } });
      toast.success("Cover image updated!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update cover image.");
    } finally {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-bold text-center">
            Choose Your Cover Image
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div
            className="group relative h-40 cursor-pointer rounded-xl border-2 border-dashed border-primary/30 hover:border-primary transition-all bg-primary/5 hover:bg-primary/10 flex flex-col items-center justify-center"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-primary group-hover:scale-125 transition-transform" />
              <div className="text-center">
                <p className="font-semibold text-primary">Custom Upload</p>
                <p className="text-sm text-muted-foreground">
                  Click to upload your own image
                </p>
                {isUploading && (
                  <p className="text-sm mt-1">Uploading... {uploadProgress}%</p>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Preset Covers</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
              {coverImages.map((image) => (
                <div
                  key={image}
                  className="group relative aspect-video cursor-pointer rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all"
                  onClick={() => handleSelectCover(image)}
                >
                  <Image
                    src={image}
                    alt="Cover option"
                    fill
                    className="object-cover transform transition-transform duration-300 group-hover:scale-125"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="px-6"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
