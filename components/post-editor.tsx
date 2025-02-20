"use client";

import Image from "next/image";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import dynamic from "next/dynamic";
import { Skeleton } from "./ui/skeleton";
import { useDropzone } from "react-dropzone";
import { api } from "@/convex/_generated/api";
import { useEdgeStore } from "@/lib/edgestore";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { ImageIcon, SmileIcon, Loader, Edit, X } from "lucide-react";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => <Loader className="animate-spin size-4" />,
});

function playAudio() {
  const audio = document.createElement("audio");

  const sourceM4a = document.createElement("source");
  sourceM4a.src = "/audio.m4a";
  sourceM4a.type = "audio/mp4";
  audio.appendChild(sourceM4a);

  const sourceMp3 = document.createElement("source");
  sourceMp3.src = "/audio.mp3";
  sourceMp3.type = "audio/mpeg";
  audio.appendChild(sourceMp3);

  audio.play().catch((err) => console.error("Audio playback failed:", err));
}

export default function PostEditor() {
  const { edgestore } = useEdgeStore();

  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [avatarLoading, setAvatarLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentUser = useQuery(api.users.currentUser);
  const createPostMutation = useMutation(api.posts.createPost);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
      "video/*": [".mp4", ".mov"],
    },
    onDrop: (acceptedFiles) => {
      setFiles((prev) => {
        const availableSlots = 4 - prev.length;
        const filesToAdd = acceptedFiles.slice(0, availableSlots);
        return [...prev, ...filesToAdd];
      });
    },
    maxSize: 3 * 1024 * 1024, // 3MB
  });

  const uploadFile = async (file: File): Promise<string> => {
    try {
      const res = await edgestore.publicFiles.upload({
        file,
        onProgressChange: (progress) => {
          setUploadProgress(progress);
        },
      });
      return res.url;
    } catch (error) {
      console.error("Failed to upload image:", error);
      throw error;
    }
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      setContent(
        (prev) => prev.substring(0, start) + emoji + prev.substring(end)
      );
    }
  };

  const handlePost = async () => {
    if (!content.trim() && files.length === 0) return;
    setIsPosting(true);
    try {
      let uploadedImageUrls: string[] = [];
      if (files.length > 0) {
        uploadedImageUrls = await Promise.all(
          files.map(async (file) => await uploadFile(file))
        );
      }
      await createPostMutation({
        content,
        images: uploadedImageUrls,
      });
      toast.success("Post created successfully!");
      playAudio();
      setOpen(false);
      setContent("");
      setFiles([]);
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Error creating post!");
    } finally {
      setIsPosting(false);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  useEffect(() => {
    if (uploadProgress > 0 && uploadProgress < 100) {
      toast(`Uploading images: ${uploadProgress}%`, {
        id: "uploadProgress",
        duration: Infinity,
      });
    } else {
      toast.dismiss("uploadProgress");
    }
  }, [uploadProgress]);

  return (
    <div className="flex items-center gap-3 bg-card border rounded-lg p-4">
      <div className="relative w-10 h-10 rounded-full">
        {currentUser === undefined ? (
          <div className="flex items-center justify-center bg-secondary rounded-full size-10">
            <Loader className="animate-spin text-muted-foreground size-5" />
          </div>
        ) : (
          <div className="relative w-10 h-10 rounded-full">
            {avatarLoading && <Skeleton className="inset-0" />}
            <Image
              src={currentUser?.imageUrl || "/avatar-placeholder.png"}
              alt="Avatar"
              fill
              className="rounded-full object-cover"
              onLoadingComplete={() => setAvatarLoading(false)}
              onError={() => setAvatarLoading(false)}
              style={{
                opacity: avatarLoading ? 0 : 1,
                transition: "opacity 0.5s ease-in-out",
              }}
            />
          </div>
        )}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start rounded-full bg-secondary hover:bg-[#EFEFEF] dark:hover:bg-secondary/50 px-4 py-5"
          >
            <div className="flex items-center gap-4 w-full text-left">
              <span className="text-muted-foreground">
                What&apos;s on your mind?
              </span>
            </div>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-3xl p-0 pb-4 overflow-y-auto max-h-[680px] overflow-x-hidden gap-0 rounded-xl">
          <DialogHeader className="border-b p-4">
            <DialogTitle className="text-center">Create Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4 border-b p-4">
              <div className="relative size-12">
                <Image
                  src={currentUser?.imageUrl || "/avatar-placeholder.png"}
                  alt="Avatar"
                  fill
                  className="rounded-full object-cover"
                />
              </div>
              <div className="space-y-0.5">
                <p className="font-semibold">
                  {currentUser?.firstName} {currentUser?.lastName}
                </p>
                <p className="text-muted-foreground text-sm font-light">
                  {currentUser?.jobTitle}
                </p>
              </div>
            </div>
            <div className="p-4">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`What's on your mind, ${currentUser?.firstName}?`}
                className="w-full min-h-[120px] p-3 resize-none focus:outline-none text-lg rounded-xl dark:bg-popover placeholder:text-muted-foreground/80"
                maxLength={500}
              />
              <div
                className={`text-xs text-right pb-3.5 ${
                  content.length >= 480
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {content.length}/500
                {content.length >= 450 && (
                  <span className="block text-xs mt-1">
                    {500 - content.length} characters remaining
                  </span>
                )}
              </div>
            </div>
            {files.length > 0 && (
              <div className="grid grid-cols-4 gap-2 px-4">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="relative w-40 h-40 rounded-lg overflow-hidden"
                  >
                    <Image
                      src={URL.createObjectURL(file)}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 size-6 rounded-full bg-background/80 hover:bg-background"
                      onClick={() =>
                        setFiles((prev) => prev.filter((_, i) => i !== index))
                      }
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="border rounded-lg p-4 m-4 space-y-4 dark:bg-popover">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Add to your post
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    {...getRootProps()}
                    variant="ghost"
                    size="sm"
                    className="gap-2 hover:bg-muted"
                  >
                    <input {...getInputProps()} />
                    <ImageIcon className="size-5 text-green-600" />
                    <span>Media</span>
                  </Button>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 hover:bg-muted"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                      <SmileIcon className="size-5 text-yellow-600" />
                      <span>Emoji</span>
                    </Button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-14 -right-4 z-10">
                        <EmojiPicker
                          onEmojiClick={(e) => insertEmoji(e.emoji)}
                          skinTonesDisabled
                          searchDisabled
                          className="max-w-[320px] max-h-60 sm:max-w-[400px] overflow-y-auto"
                          previewConfig={{ showPreview: false }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handlePost}
                  disabled={
                    (!content.trim() && files.length === 0) || isPosting
                  }
                  className="text-base font-medium rounded-lg"
                >
                  {isPosting ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Edit /> Post
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
