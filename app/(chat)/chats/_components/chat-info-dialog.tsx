"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Play, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ChatInfoDialogProps {
  friend: {
    _id: string;
    imageUrl?: string;
    firstName?: string;
    lastName?: string;
  };
  currentUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChatInfoDialog = ({
  friend,
  currentUserId,
  open,
  onOpenChange,
}: ChatInfoDialogProps) => {
  const [selectedMedia, setSelectedMedia] = useState<{
    url: string;
    type: "image" | "video";
  } | null>(null);
  const messages = useQuery(api.directMessages.getDirectMessages, {
    user1: currentUserId as unknown as Id<"users">,
    user2: friend._id as unknown as Id<"users">,
  });

  const mediaMessages =
    messages?.filter(
      (msg) => msg.messageType === "image" || msg.messageType === "video"
    ) || [];

  const handleMediaClick = (url?: string, type?: "image" | "video") => {
    if (url && type) {
      setSelectedMedia({ url, type });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl min-w-[60vw] max-h-[600px] overflow-scroll">
          <DialogHeader className="relative">
            <DialogTitle className="absolute -top-4 text-xl text-start">
              Chat Information
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-8 pt-2">
            <div className="flex items-center gap-6 p-4 bg-secondary rounded-xl border">
              <Avatar className="h-20 w-20 border-4 border-background">
                <AvatarImage src={friend.imageUrl} />
                <AvatarFallback className="text-2xl font-medium">
                  {(friend.firstName?.[0] || "U") +
                    (friend.lastName?.[0] || "")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-bold">
                  {friend.firstName} {friend.lastName}
                </h3>
                <Button className="mt-2" asChild>
                  <Link href={`/users/${friend._id}`}>View Profile</Link>
                </Button>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-semibold">Shared Media</h4>
                <span className="text-muted-foreground text-sm">
                  {mediaMessages.length} items
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {mediaMessages.map((message) => {
                  const url = message.attachments?.[0];
                  const type = message.messageType;
                  return url ? (
                    <div
                      key={message._id}
                      className="group relative aspect-square rounded-xl overflow-hidden border cursor-pointer"
                      onClick={() =>
                        handleMediaClick(url, type as "image" | "video")
                      }
                    >
                      {type === "image" ? (
                        <Image
                          src={url}
                          alt="Chat media"
                          fill
                          className="object-cover transition-transform group-hover:scale-110"
                        />
                      ) : (
                        <div className="relative h-full w-full bg-black">
                          <video className="h-full w-full object-cover opacity-90">
                            <source src={url} />
                          </video>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Play className="h-8 w-8 text-white/80 fill-white/50 group-hover:fill-white/80 transition-colors" />
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 bg-black/50 p-1.5 rounded-full">
                        <Maximize className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
              {!mediaMessages.length && (
                <div className="text-center text-muted-foreground py-12">
                  No media shared in this conversation yet
                </div>
              )}
              {!messages && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Array(8)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton key={i} className="aspect-square rounded-xl" />
                    ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!selectedMedia}
        onOpenChange={(open) => !open && setSelectedMedia(null)}
      >
        <DialogContent className="max-w-[90vw] max-h-[50vh] border-none">
          <DialogTitle className="hidden">Media Preview</DialogTitle>
          {selectedMedia?.type === "image" ? (
            <div className="relative w-full h-[50vh]">
              <Image
                src={selectedMedia.url}
                alt="Media preview"
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <video
              controls
              autoPlay
              className="w-full max-h-[80vh] aspect-video"
            >
              <source src={selectedMedia?.url} />
              Your browser does not support the video tag.
            </video>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
