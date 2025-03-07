"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import React, { JSX, useState, useCallback } from "react";

const reactionIcons: Record<
  "like" | "love" | "care" | "haha" | "wow" | "sad" | "angry",
  JSX.Element
> = {
  like: <Image src="/like.svg" alt="like" width={16} height={16} />,
  love: <Image src="/love.svg" alt="love" width={16} height={16} />,
  care: <Image src="/care.svg" alt="care" width={16} height={16} />,
  haha: <Image src="/haha.svg" alt="haha" width={16} height={16} />,
  wow: <Image src="/wow.svg" alt="wow" width={16} height={16} />,
  sad: <Image src="/sad.svg" alt="sad" width={16} height={16} />,
  angry: <Image src="/angry.svg" alt="angry" width={16} height={16} />,
};

type ReactionTarget = "post" | "comment";

type Reaction = {
  userId: string;
  reaction: "like" | "love" | "care" | "haha" | "wow" | "sad" | "angry";
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
};

type ReactionListDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: ReactionTarget;
  targetId: Id<"posts"> | Id<"comments">;
};

function ReactionItem({ reaction }: { reaction: Reaction }) {
  const user = useQuery(api.users.getUserById, {
    id: reaction.userId as Id<"users">,
  });

  return (
    <div className="flex items-center space-x-4 py-2 border-b last:border-none">
      <Link
        href={`/users/${reaction.userId}`}
        className="flex items-center space-x-4"
      >
        <div className="relative h-11 w-11">
          <Image
            width={100}
            height={100}
            loading="lazy"
            src={user?.imageUrl || "/avatar-placeholder.png"}
            alt={user ? `${user.firstName} ${user.lastName}` : reaction.userId}
            className="h-11 w-11 rounded-full object-cover"
          />
          <div className="absolute bottom-0 right-0">
            {reactionIcons[reaction.reaction]}
          </div>
        </div>
        <div>
          <span className="font-medium text-foreground">
            {user ? `${user.firstName} ${user.lastName}` : reaction.userId}
          </span>
        </div>
      </Link>
    </div>
  );
}

export default function ReactionListDialog({
  open,
  onOpenChange,
  targetType,
  targetId,
}: ReactionListDialogProps) {
  const pageSize = 5;

  const queryParams =
    targetType === "post"
      ? { postId: targetId as Id<"posts"> }
      : { commentId: targetId as Id<"comments"> };

  const reactionsData = useQuery(
    targetType === "post" ? api.likes.getLikes : api.commentLikes.getLikes,
    queryParams
  ) as Reaction[] | undefined;

  const reactionTypesPresent = reactionsData
    ? (Array.from(new Set(reactionsData.map((r) => r.reaction))) as (
        | "like"
        | "love"
        | "care"
        | "haha"
        | "wow"
        | "sad"
        | "angry"
      )[])
    : [];

  const [currentTab, setCurrentTab] = useState<
    null | "like" | "love" | "care" | "haha" | "wow" | "sad" | "angry"
  >(null);
  const [visibleCount, setVisibleCount] = useState(pageSize);

  const handleTabChange = useCallback(
    (
      tab: null | "like" | "love" | "care" | "haha" | "wow" | "sad" | "angry"
    ) => {
      setCurrentTab(tab);
      setVisibleCount(pageSize);
    },
    []
  );

  const filteredReactions = reactionsData
    ? currentTab
      ? reactionsData.filter((r) => r.reaction === currentTab)
      : reactionsData
    : [];

  const visibleReactions = filteredReactions.slice(0, visibleCount);
  const hasMore = visibleCount < filteredReactions.length;
  const loadMore = () => setVisibleCount((prev) => prev + pageSize);

  const emptyMessage =
    filteredReactions.length === 0
      ? currentTab
        ? `No users reacted with ${currentTab}.`
        : "No reactions for this item."
      : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-card text-card-foreground p-0 gap-0">
        <DialogHeader className="flex flex-col gap-2 border-b border-border py-2.5 px-4">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-semibold text-foreground">
              Reactions
            </DialogTitle>
            <DialogClose
              aria-label="Close"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={currentTab === null ? "default" : "outline"}
              size="sm"
              onClick={() => handleTabChange(null)}
            >
              All
            </Button>
            {reactionTypesPresent.map((type) => (
              <Button
                key={type}
                variant={currentTab === type ? "default" : "outline"}
                size="sm"
                className="shadow-none"
                onClick={() => handleTabChange(type)}
              >
                {reactionIcons[type]}
              </Button>
            ))}
          </div>
        </DialogHeader>
        <div
          className="py-2 px-4"
          style={{ maxHeight: "250px", overflowY: "auto" }}
        >
          {!reactionsData ? (
            <div className="space-y-2">
              {Array.from({ length: pageSize }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4 p-2">
                  <Skeleton className="h-11 w-11 rounded-full bg-muted" />
                  <Skeleton className="h-4 w-32 bg-muted" />
                </div>
              ))}
            </div>
          ) : filteredReactions.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            <>
              {visibleReactions.map((reaction, index) => (
                <ReactionItem
                  key={`${reaction.userId}-${index}`}
                  reaction={reaction}
                />
              ))}
              {hasMore && (
                <div className="text-center py-2 rounded-lg">
                  <Button onClick={loadMore} size="lg" variant="link">
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
