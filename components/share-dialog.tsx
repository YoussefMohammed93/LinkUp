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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { Globe, Share2, Users } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { SmileIcon, Loader, Edit } from "lucide-react";

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

export default function ShareDialog({
  originalPostId,
}: {
  originalPostId: Id<"posts">;
}) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "friends-only">(
    "public"
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentUser = useQuery(api.users.currentUser);

  const sharePostMutation = useMutation(api.posts.sharePost);

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

  const handleShare = async () => {
    setIsPosting(true);
    try {
      await sharePostMutation({
        postId: originalPostId as Id<"posts">,
        content,
        visibility,
      });

      toast.success("Post shared successfully!");
      playAudio();
      setOpen(false);
      setContent("");
    } catch (error) {
      console.error("Error sharing post:", error);
      toast.error("Error sharing post!");
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

  return (
    <div className="flex items-center gap-3 bg-card dark:bg-[#252728]">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 px-3 py-1.5 dark:hover:bg-muted rounded-md"
          >
            <Share2 className="size-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-3xl p-0 pb-4 overflow-y-auto max-h-[680px] overflow-x-hidden gap-0 rounded-xl">
          <DialogHeader className="border-b p-4">
            <DialogTitle className="text-center">Share Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4 border-b p-4">
              <div className="relative size-16">
                <Image
                  src={currentUser?.imageUrl || "/avatar-placeholder.png"}
                  alt="Avatar"
                  fill
                  className="rounded-full object-cover"
                />
              </div>
              <div className="space-y-1">
                <p className="font-semibold">
                  {currentUser?.firstName} {currentUser?.lastName}
                </p>
                <Select
                  value={visibility}
                  onValueChange={(value) =>
                    setVisibility(value as "public" | "friends-only")
                  }
                >
                  <SelectTrigger className="h-8 w-fit gap-1.5 px-3 text-xs shadow-none">
                    {visibility === "public" ? (
                      <Globe className="size-3.5" />
                    ) : (
                      <Users className="size-3.5" />
                    )}
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value="public" className="text-sm">
                      <div className="flex items-center gap-2">Public</div>
                    </SelectItem>
                    <SelectItem value="friends-only" className="text-sm">
                      <div className="flex items-center gap-2">Friends</div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="p-4">
              <textarea
                ref={textareaRef}
                value={content}
                autoFocus
                onChange={(e) => setContent(e.target.value)}
                placeholder="Say something about this..."
                className="w-full min-h-[120px] p-3 resize-none border focus:outline-none text-lg rounded-xl dark:bg-popover placeholder:text-muted-foreground/80"
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
            <div className="border rounded-lg p-4 m-4 space-y-4 dark:bg-popover">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Add to your post
                </span>
                <div className="flex items-center gap-2">
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
                          className="max-w-[320px] max-h-60 sm:max-w-[400px] overflow-y-auto dark:border-none dark:bg-card"
                          previewConfig={{ showPreview: false }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleShare}
                  disabled={isPosting}
                  className="text-base font-medium rounded-lg"
                >
                  {isPosting ? (
                    <>
                      <Loader className="size-4 animate-spin" />
                      Sharing...
                    </>
                  ) : (
                    <>
                      <Edit className="size-4" /> Share
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
