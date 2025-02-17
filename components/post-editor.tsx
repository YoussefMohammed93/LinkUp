"use client";

import Image from "next/image";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useQuery } from "convex/react";
import { Skeleton } from "./ui/skeleton";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { GlobeIcon, ImageIcon, Loader } from "lucide-react";

export default function PostEditor() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [avatarLoading, setAvatarLoading] = useState(true);

  const currentUser = useQuery(api.users.currentUser);

  const handlePost = () => {
    setOpen(false);
    setContent("");
  };

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
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="border-b p-4">
            <DialogTitle className="text-center">Create Post</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-4">
              <Image
                src="/avatar-placeholder.png"
                alt="Avatar"
                width={48}
                height={48}
                className="rounded-full"
              />
              <p className="font-semibold">
                {currentUser?.firstName} {currentUser?.lastName}
              </p>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full h-32 pl-1 resize-none focus:outline-none placeholder-muted-foreground text-lg"
              autoFocus
            />
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" className="gap-2 shadow-none">
                  <ImageIcon className="text-green-500 text-xl" />
                  <span>Photo - Video</span>
                </Button>
              </div>
              <div className="flex items-center justify-between border-t pt-4">
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Post to Public</span> <GlobeIcon className="size-4" />
                </p>
                <Button
                  onClick={handlePost}
                  disabled={!content.trim()}
                  className="px-6"
                >
                  Post
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
