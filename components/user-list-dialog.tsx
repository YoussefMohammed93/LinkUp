"use client";

import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

import { Button } from "./ui/button";
import { Loader, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import React, { useState, useRef } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation } from "convex/react";

type FollowListDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  type: "followers" | "following";
};

type FollowButtonProps = {
  currentUser: { _id: string } | null;
  targetUserId: string;
  targetUserName: string;
};

const FollowButton = ({
  currentUser,
  targetUserId,
  targetUserName,
}: FollowButtonProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  const isFollowing = useQuery(
    api.follows.isFollowing,
    currentUser
      ? {
          followerId: currentUser._id as Id<"users">,
          followingId: targetUserId as Id<"users">,
        }
      : "skip"
  );

  const isFollowedBy = useQuery(
    api.follows.isFollowedBy,
    currentUser
      ? {
          followerId: targetUserId as Id<"users">,
          followingId: currentUser._id as Id<"users">,
        }
      : "skip"
  );

  const followUserMutation = useMutation(api.follows.followUser);
  const unfollowUserMutation = useMutation(api.follows.unfollowUser);

  const [isLoading, setIsLoading] = useState(false);

  const handleToggleFollow = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      if (isFollowing === true) {
        await unfollowUserMutation({
          targetUserId: targetUserId as Id<"users">,
        });
        toast.success(`You have unfollowed ${targetUserName}!`);
      } else {
        await followUserMutation({
          targetUserId: targetUserId as Id<"users">,
        });
        toast.success(`You are now following ${targetUserName}!`);
        if (audioRef.current) {
          audioRef.current
            .play()
            .catch((err) => console.error("Audio playback failed:", err));
        }
      }
    } catch (error) {
      toast.error(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (isLoading || isFollowing === undefined || isFollowedBy === undefined)
      return "Loading...";
    if (isFollowing) return "Unfollow";
    if (isFollowedBy) return "Follow Back";
    return "Follow";
  };

  return (
    <>
      <Button
        onClick={handleToggleFollow}
        size="sm"
        className="gap-1 px-4 py-2 sm:py-3 shadow-none transition-opacity duration-200 bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
        disabled={isLoading}
        aria-label={`${isFollowing ? "Unfollow" : "Follow"} ${targetUserName}`}
      >
        {isLoading && <Loader className="animate-spin mr-2" />}
        {getButtonText()}
      </Button>
      <audio ref={audioRef} preload="auto" style={{ display: "none" }}>
        <source src="/audio.m4a" type="audio/mp4" />
        <source src="/audio.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </>
  );
};

export default function FollowListDialog({
  open,
  onOpenChange,
  userId,
  type,
}: FollowListDialogProps) {
  const pageSize = 5;
  const currentUser = useQuery(api.users.currentUser);
  const queryToCall =
    type === "followers" ? api.follows.getFollowers : api.follows.getFollowing;
  const data = useQuery(queryToCall, { userId: userId as Id<"users"> });

  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [searchQuery, setSearchQuery] = useState("");

  const visibleUsers = data ? data.slice(0, visibleCount) : [];
  const filteredUsers = visibleUsers.filter((user) =>
    `${user?.firstName} ${user?.lastName}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );
  const hasMore = data ? visibleCount < data.length : false;
  const loadMore = () => setVisibleCount((prev) => prev + pageSize);

  const isCurrentUser = currentUser && currentUser._id === userId;

  const emptyMessage =
    type === "followers"
      ? isCurrentUser
        ? "No one follows you."
        : "No one follows this user."
      : isCurrentUser
        ? "You don't follow anyone."
        : "This user doesn't follow anyone.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-card text-card-foreground p-0 gap-0">
        <DialogHeader className="flex justify-between border-b border-border py-2.5 px-4">
          <DialogTitle className="text-xl font-semibold text-foreground">
            {type === "followers" ? "Followers" : "Following"}
          </DialogTitle>
          <DialogClose
            aria-label="Close"
            className="text-muted-foreground hover:text-foreground transition-colors duration-200"
          />
        </DialogHeader>
        <div className="py-4 px-4">
          <div className="relative">
            <Search className="absolute size-5 left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10"
            />
          </div>
        </div>
        {!data ? (
          <div className="space-y-2">
            {Array.from({ length: pageSize }).map((_, index) => (
              <div key={index} className="flex items-center space-x-4 p-2">
                <Skeleton className="h-10 w-10 rounded-full bg-muted" />
                <Skeleton className="h-4 w-32 bg-muted" />
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <>
            {filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No results found.
              </div>
            ) : (
              <div style={{ maxHeight: "600px", overflowY: "auto" }}>
                {filteredUsers.map((user, index) => {
                  const isLastUser =
                    index === filteredUsers.length - 1 && !hasMore;
                  return (
                    <div
                      key={user?._id}
                      className={`flex items-center justify-between space-x-4 px-4 py-2 border-b pb-3 ${
                        isLastUser ? "rounded-lg" : ""
                      }`}
                    >
                      <Link
                        href={`/users/${user?._id}`}
                        className="flex items-center space-x-2"
                      >
                        <Image
                          width={100}
                          height={100}
                          loading="lazy"
                          src={user?.imageUrl || "/avatar-placeholder.png"}
                          alt={`${user?.firstName} ${user?.lastName}`}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        <span className="font-medium text-foreground">
                          {user?.firstName} {user?.lastName}
                        </span>
                      </Link>
                      {currentUser && currentUser._id !== user?._id && (
                        <FollowButton
                          currentUser={currentUser}
                          targetUserId={user?._id ?? ""}
                          targetUserName={`${user?.firstName} ${user?.lastName}`}
                        />
                      )}
                    </div>
                  );
                })}
                {hasMore && (
                  <div className="text-center py-2 rounded-lg">
                    <Button onClick={loadMore} size="lg" variant="link">
                      Load More
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
