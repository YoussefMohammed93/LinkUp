"use client";

import Image from "next/image";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import dynamic from "next/dynamic";
import { Skeleton } from "./ui/skeleton";
import { useMutation } from "convex/react";
import { useDropzone } from "react-dropzone";
import { api } from "@/convex/_generated/api";
import { useEdgeStore } from "@/lib/edgestore";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import React, { useState, useRef, useEffect } from "react";
import { Globe, Users, Loader, X, ImageIcon, SmileIcon } from "lucide-react";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => <Loader className="w-4 h-4 animate-spin" />,
});

interface Post {
  _id: Id<"posts">;
  content: string;
  images?: string[];
  visibility: "public" | "friends-only";
  authorName: string;
  authorImageUrl?: string;
  sharedPostId?: Id<"posts">;
}

interface EditPostDialogProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditPostDialog({
  post,
  isOpen,
  onClose,
}: EditPostDialogProps) {
  const { edgestore } = useEdgeStore();

  const isShared = Boolean(post.sharedPostId);

  const [content, setContent] = useState(post.content);
  const [visibility] = useState<"public" | "friends-only">(post.visibility);

  const [existingImages, setExistingImages] = useState<string[]>(
    isShared ? [] : post.images || []
  );

  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [avatarLoading, setAvatarLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const updatePostMutation = useMutation(api.posts.updatePost);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
    },
    onDrop: (acceptedFiles) => {
      if (isShared) return;
      const availableSlots = 4 - (existingImages.length + newFiles.length);
      if (availableSlots <= 0) return;
      const filesToAdd = acceptedFiles.slice(0, availableSlots);
      setNewFiles((prev) => [...prev, ...filesToAdd]);
    },
    maxSize: 3 * 1024 * 1024, // 3MB
  });

  const uploadFile = async (file: File): Promise<string> => {
    try {
      const res = await edgestore.publicFiles.upload({
        file,
      });
      return res.url;
    } catch (error) {
      console.error("Failed to upload image:", error);
      throw error;
    }
  };

  const insertEmoji = (emojiObject: { emoji: string }) => {
    const emoji = emojiObject.emoji;
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      setContent(
        (prev) => prev.substring(0, start) + emoji + prev.substring(end)
      );
    }
  };

  const handleUpdate = async () => {
    if (!content.trim()) {
      toast.error("Post content cannot be empty.");
      return;
    }
    setIsUpdating(true);
    try {
      let uploadedImageUrls: string[] = [];
      if (!isShared && newFiles.length > 0) {
        uploadedImageUrls = await Promise.all(
          newFiles.map((file) => uploadFile(file))
        );
      }
      const combinedImages = isShared
        ? []
        : [...existingImages, ...uploadedImageUrls];

      await updatePostMutation({
        postId: post._id,
        content,
        images: combinedImages,
        visibility,
      });
      toast.success("Post updated successfully!");

      const updateSound = new Audio("/audio.m4a");
      const playPromise = updateSound.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Audio playback error:", error);
        });
      }

      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Error updating post!");
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl p-0 pb-4 overflow-y-auto max-h-[680px] overflow-x-hidden gap-0 rounded-xl">
        <DialogHeader className="border-b p-4">
          <DialogTitle>Edit Post</DialogTitle>
          <div className="flex items-center gap-4 pt-4">
            <div className="relative w-16 h-16 rounded-full">
              {avatarLoading && <Skeleton className="inset-0" />}
              <Image
                src={post.authorImageUrl || "/avatar-placeholder.png"}
                alt={post.authorName}
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
            <div className="space-y-1">
              <p className="font-semibold">{post.authorName}</p>
              <Select value={visibility} disabled>
                <SelectTrigger className="h-8 w-fit gap-1.5 px-3 text-xs shadow-none">
                  {visibility === "public" ? (
                    <Globe className="w-4 h-4" />
                  ) : (
                    <Users className="w-4 h-4" />
                  )}
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="public" className="text-sm">
                    Public
                  </SelectItem>
                  <SelectItem value="friends-only" className="text-sm">
                    Friends
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogHeader>
        <div className="p-4">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full min-h-[120px] p-3 resize-none border focus:outline-none text-lg rounded-xl dark:bg-popover placeholder:text-muted-foreground/80"
            maxLength={1000}
          />
          <div
            className={`text-xs text-right pb-3.5 ${
              content.length >= 980
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
          >
            {content.length}/1000
            {content.length >= 950 && (
              <span className="block text-xs mt-1">
                {1000 - content.length} characters remaining
              </span>
            )}
          </div>
        </div>
        <div className="border rounded-lg p-4 m-4 space-y-4 dark:bg-popover">
          <div className="flex sm:items-center justify-between gap-2 flex-col sm:flex-row items-start">
            <span className="text-sm text-muted-foreground pl-3 sm:pl-0">
              Add to your post
            </span>
            <div className="flex items-center gap-2">
              {!isShared && (
                <Button
                  {...getRootProps()}
                  variant="ghost"
                  size="sm"
                  className="gap-2 hover:bg-muted"
                >
                  <input {...getInputProps()} />
                  <ImageIcon className="w-5 h-5 text-green-600" />
                  <span>Media</span>
                </Button>
              )}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 hover:bg-muted"
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                >
                  <SmileIcon className="w-5 h-5 text-yellow-600" />
                  <span>Emoji</span>
                </Button>
                {showEmojiPicker && (
                  <div className="absolute bottom-14 -right-4 z-10">
                    <EmojiPicker
                      onEmojiClick={insertEmoji}
                      skinTonesDisabled
                      searchDisabled
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          {!isShared && (existingImages.length > 0 || newFiles.length > 0) && (
            <div className="grid grid-cols-4 gap-2 px-4">
              {existingImages.map((url, index) => (
                <div
                  key={`existing-${index}`}
                  className="relative w-40 h-40 rounded-lg overflow-hidden"
                >
                  <Image
                    src={url}
                    alt={`Image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 rounded-full bg-background/80 hover:bg-background"
                    onClick={() =>
                      setExistingImages((prev) =>
                        prev.filter((_, i) => i !== index)
                      )
                    }
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {newFiles.map((file, index) => (
                <div
                  key={`new-${index}`}
                  className="relative w-40 h-40 rounded-lg overflow-hidden"
                >
                  <Image
                    src={URL.createObjectURL(file)}
                    alt={`New image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 rounded-full bg-background/80 hover:bg-background"
                    onClick={() =>
                      setNewFiles((prev) => prev.filter((_, i) => i !== index))
                    }
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter className="p-4">
          <Button variant="outline" onClick={onClose} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={isUpdating}>
            {isUpdating ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Post"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
