"use client";

import React from "react";
import { Post } from "./post";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Id } from "../convex/_generated/dataModel";

export function PostsList({ currentUserId }: { currentUserId?: Id<"users"> }) {
  const posts = useQuery(api.posts.getPosts);

  const handleDeletePost = async (postId: Id<"posts">) => {
    console.log("Deleting post:", postId);
  };

  if (posts === undefined) {
    return (
      <div className="space-y-3 pb-5 pt-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="border border-[hsl(var(--border))] rounded-lg p-4 bg-card"
          >
            <div className="flex items-center space-x-3">
              <Skeleton className="w-10 h-10 rounded-full bg-secondary" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-4 rounded w-3/4 bg-secondary" />
                <Skeleton className="h-4 rounded w-1/2 bg-secondary" />
              </div>
            </div>
            <div className="mt-3 space-y-3">
              <Skeleton className="h-4 rounded bg-secondary" />
              <Skeleton className="h-4 rounded w-5/6 bg-secondary" />
              <Skeleton className="h-4 rounded w-2/3 bg-secondary" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No posts available. Be the first to share something!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {posts.map((post, index) => (
        <div
          key={post._id}
          className={`pt-3 ${index === posts.length - 1 ? "pb-5" : ""}`}
        >
          <Post
            post={{
              ...post,
              authorId: post.authorId,
              authorName: post.authorName || "Anonymous",
              authorImage: post.authorImageUrl || "/default-avatar.png",
              createdAt: post._creationTime,
              images: post.images || [],
            }}
            currentUserId={currentUserId}
            onDelete={handleDeletePost}
          />
        </div>
      ))}
    </div>
  );
}
