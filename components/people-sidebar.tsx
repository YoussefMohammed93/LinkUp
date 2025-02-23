"use client";

import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Loader } from "lucide-react";
import React, { useState } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation } from "convex/react";

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

type FollowButtonLoadedProps = {
  currentUser: { _id: string } | null;
  targetUserId: string;
  targetUserName: string;
  isFollowing: boolean;
  isFollowedBy: boolean;
};

function FollowButtonLoaded({
  currentUser,
  targetUserId,
  targetUserName,
  isFollowing,
  isFollowedBy,
}: FollowButtonLoadedProps) {
  const followUserMutation = useMutation(api.follows.followUser);
  const unfollowUserMutation = useMutation(api.follows.unfollowUser);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleFollow = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      if (isFollowing) {
        await unfollowUserMutation({
          targetUserId: targetUserId as Id<"users">,
        });
        toast.success(`You have unfollowed ${targetUserName}!`);
      } else {
        await followUserMutation({
          targetUserId: targetUserId as Id<"users">,
        });
        toast.success(`You are now following ${targetUserName}!`);
        playAudio();
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
    if (isLoading) return "Loading...";
    if (isFollowing) return "Unfollow";
    if (isFollowedBy) return "Follow Back";
    return "Follow";
  };

  return (
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
  );
}

type SuggestedUserProps = {
  user: {
    _id: string;
    clerkUserId: string;
    imageUrl?: string | undefined;
    firstName?: string;
    lastName?: string;
    email: string;
    jobTitle?: string;
  };
  currentUser: { _id: string; clerkUserId: string } | null;
  isLast: boolean;
};

function SuggestedUser({ user, currentUser, isLast }: SuggestedUserProps) {
  const isFollowing = useQuery(
    api.follows.isFollowing,
    currentUser
      ? {
          followerId: currentUser._id as Id<"users">,
          followingId: user._id as Id<"users">,
        }
      : "skip"
  );
  const isFollowedBy = useQuery(
    api.follows.isFollowedBy,
    currentUser
      ? {
          followerId: user._id as Id<"users">,
          followingId: currentUser._id as Id<"users">,
        }
      : "skip"
  );

  return (
    <div
      className={`flex items-center justify-between ${!isLast ? "border-b pb-3" : ""}`}
    >
      <Link href={`/users/${user._id}`} className="flex items-center gap-3">
        <Image
          src={user.imageUrl || "/avatar-placeholder.png"}
          alt={`${user.firstName || user.email}'s avatar`}
          width={48}
          height={48}
          loading="lazy"
          className="object-cover rounded-full"
        />
        <div className="min-w-0">
          <h3 className="text-base font-semibold truncate">
            {user.firstName} {user.lastName}
          </h3>
          <p className="text-xs text-muted-foreground truncate">
            {user.jobTitle || ""}
          </p>
        </div>
      </Link>
      {currentUser && currentUser._id !== user._id && (
        <FollowButtonLoaded
          currentUser={currentUser}
          targetUserId={user._id}
          targetUserName={`${user.firstName} ${user.lastName}`}
          isFollowing={isFollowing ?? false}
          isFollowedBy={isFollowedBy ?? false}
        />
      )}
    </div>
  );
}

export default function PeopleSidebar() {
  const recentUsersData = useQuery(api.users.getRecentUsers);
  const currentUserData = useQuery(api.users.currentUser);
  const followingList = useQuery(
    api.follows.getFollowing,
    currentUserData ? { userId: currentUserData._id as Id<"users"> } : "skip"
  );

  const sidebarLoading =
    recentUsersData === undefined ||
    currentUserData === undefined ||
    (currentUserData && followingList === undefined);

  const recentUsers = recentUsersData || [];

  const followingIds = new Set((followingList || []).map((u) => u?._id));
  const suggestedUsers = recentUsers
    .filter(
      (user) =>
        user.clerkUserId !== currentUserData?.clerkUserId &&
        !followingIds.has(user._id)
    )
    .slice(0, 3);

  const currentYear = new Date().getFullYear();

  if (sidebarLoading) {
    return (
      <aside className="sticky top-[6rem] hidden h-fit w-72 flex-none lg:block xl:w-[320px]">
        <div className="space-y-5 rounded-lg border bg-card p-4">
          <h2 className="text-xl font-semibold">Suggested Friends</h2>
          <div className="flex flex-col gap-5">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className={`flex items-center justify-between ${
                  index !== 2 ? "border-b pb-3" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="min-w-0 space-y-1">
                    <Skeleton className="h-4 w-24 rounded-lg" />
                    <Skeleton className="h-3 w-16 rounded-lg" />
                  </div>
                </div>
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 mt-2 pl-1 text-xs text-muted-foreground">
          <Image
            src="/favicon.ico"
            alt="logo"
            priority
            width={22}
            height={22}
          />
          {`LinkUp Corporation © ${currentYear}`}
        </div>
      </aside>
    );
  }

  return (
    <aside className="sticky top-[6rem] hidden h-fit w-72 flex-none lg:block xl:w-[320px]">
      <div className="space-y-5 rounded-lg border bg-card p-4">
        <h2 className="text-xl font-semibold">Suggested Friends</h2>
        <div className="flex flex-col gap-5">
          {suggestedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No suggested friends available right now.
            </p>
          ) : (
            suggestedUsers.map((user, index) => (
              <SuggestedUser
                key={user._id}
                user={user}
                currentUser={currentUserData}
                isLast={index === suggestedUsers.length - 1}
              />
            ))
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 mt-2 pl-1 text-xs text-muted-foreground">
        <Image src="/favicon.ico" alt="logo" priority width={22} height={22} />
        {`LinkUp Corporation © ${currentYear}`}
      </div>
    </aside>
  );
}
