"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { toast } from "sonner";
import Image from "next/image";
import { useState } from "react";
import { X, Loader } from "lucide-react";
import { useMutation } from "convex/react";
import { useDropzone } from "react-dropzone";
import { api } from "@/convex/_generated/api";
import { useEdgeStore } from "@/lib/edgestore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function StoryCreator() {
  const { edgestore } = useEdgeStore();
  const createStoryMutation = useMutation(api.stories.createStory);

  const [storyText, setStoryText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPosting, setIsPosting] = useState(false);

  const { getRootProps, getInputProps, isDragAccept, isDragReject } =
    useDropzone({
      multiple: false,
      maxFiles: 1,
      accept: {
        "image/*": [".png", ".jpg", ".jpeg", ".gif"],
        "video/*": [".mp4", ".mov", ".avi", ".mkv"],
      },
      maxSize: 10 * 1024 * 1024, // MaxSize: 10MB
      onDrop: (acceptedFiles) => {
        if (acceptedFiles.length > 0) {
          setFile(acceptedFiles[0]);
        }
      },
    });

  const uploadFile = async (file: File): Promise<string> => {
    try {
      const res = await edgestore.publicFiles.upload({
        file,
        onProgressChange: (progress) => setUploadProgress(progress),
      });
      return res.url;
    } catch (error) {
      console.error("Failed to upload file:", error);
      throw error;
    }
  };

  const handleCreateStory = async () => {
    if (!storyText.trim() && !file) {
      toast.error("Please add text or a file (image/video) to your story.");
      return;
    }
    setIsPosting(true);

    try {
      let uploadedUrl: string | undefined;
      if (file) {
        uploadedUrl = await uploadFile(file);
      }

      await createStoryMutation({
        content: storyText.trim() || undefined,
        imageUrls: uploadedUrl ? [uploadedUrl] : undefined,
      });

      toast.success("Story created successfully!");
      setStoryText("");
      setFile(null);
      setUploadProgress(0);
    } catch (error) {
      console.error("Error creating story:", error);
      toast.error("Error creating story!");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Card className="border-none">
      <CardHeader>
        <CardTitle>Create Your Story</CardTitle>
        <CardDescription>
          Add a short text and optionally an image or video.
        </CardDescription>
      </CardHeader>
      <CardContent className="shadow-none">
        <div className="space-y-4">
          <Textarea
            className="min-h-[80px] resize-none shadow-none"
            placeholder="What's your story?"
            value={storyText}
            onChange={(e) => setStoryText(e.target.value)}
          />
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition-colors 
              ${isDragAccept ? "border-green-500" : ""} 
              ${isDragReject ? "border-red-500" : "border-muted-foreground/20"}`}
          >
            <input {...getInputProps()} />
            <p>Drag &amp; drop an image or video, or click to select</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Max file size: 10MB
            </p>
          </div>
          {file && (
            <div className="relative w-full h-40 rounded-md overflow-hidden mt-2">
              {file.type.startsWith("image") ? (
                <Image
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              ) : (
                <video
                  src={URL.createObjectURL(file)}
                  className="w-full h-full object-cover"
                  controls
                />
              )}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => setFile(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="text-sm">Uploading: {uploadProgress}%</div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleCreateStory} disabled={isPosting}>
          {isPosting ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              Posting...
            </>
          ) : (
            "Post Story"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
