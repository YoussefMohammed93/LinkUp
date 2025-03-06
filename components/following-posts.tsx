"use client";

import { Post } from "./post";
import { Loader2 } from "lucide-react";
import { useQuery } from "convex/react";
import React, { useState } from "react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import InfiniteScroll from "react-infinite-scroll-component";

export default function InfiniteFollowingPosts({
  currentUserId,
}: {
  currentUserId?: Id<"users">;
}) {
  const posts = useQuery(api.posts.getFollowingPosts);
  const [visibleCount, setVisibleCount] = useState(5);

  const fetchMorePosts = () => {
    setVisibleCount((prev) => prev + 5);
  };

  if (posts === undefined) {
    return <PostsSkeleton />;
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        You are not following anyone yet, so there are no posts to display.
      </div>
    );
  }

  const visiblePosts = posts.slice(0, visibleCount);

  return (
    <InfiniteScroll
      dataLength={visiblePosts.length}
      next={fetchMorePosts}
      hasMore={visibleCount < posts.length}
      loader={
        <div className="flex justify-center my-3">
          <Loader2 className="animate-spin" />
        </div>
      }
      endMessage={
        <p className="text-center py-8 text-muted-foreground">
          You&apos;re all caught up!
        </p>
      }
    >
      <section className="space-y-2">
        {visiblePosts.map((post, index) => (
          <article
            key={post._id}
            className={`pt-3 ${index === visiblePosts.length - 1 ? "pb-5" : ""}`}
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
              onDelete={async (postId: Id<"posts">) => {
                console.log("Deleting post:", postId);
                return Promise.resolve();
              }}
            />
          </article>
        ))}
      </section>
    </InfiniteScroll>
  );
}

function PostsSkeleton() {
  return (
    <div className="space-y-3 pb-5 pt-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <article
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
        </article>
      ))}
    </div>
  );
}
