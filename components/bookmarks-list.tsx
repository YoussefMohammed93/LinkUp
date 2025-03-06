"use client";

import { Post } from "./post";
import { Loader2 } from "lucide-react";
import { useQuery } from "convex/react";
import React, { useState } from "react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import InfiniteScroll from "react-infinite-scroll-component";

export default function BookmarksList() {
  const currentUser = useQuery(api.users.currentUser);
  const bookmarkedPosts = useQuery(api.bookmarks.getBookmarkedPosts);
  const [visibleCount, setVisibleCount] = useState(5);

  const fetchMorePosts = () => {
    setVisibleCount((prev) => prev + 5);
  };

  if (currentUser === undefined || bookmarkedPosts === undefined) {
    return (
      <main className="w-full min-w-0 space-y-5 my-5">
        <HeaderSkeleton />
        <PostsSkeleton />
      </main>
    );
  }

  return (
    <main className="w-full min-w-0 space-y-5 my-5">
      <header>
        <h1 className="text-center text-xl font-bold mb-4 p-2 bg-card dark:bg-[#252728]/50 border rounded-sm">
          {currentUser?.firstName} {currentUser?.lastName}&apos;s Bookmarks
        </h1>
      </header>
      {bookmarkedPosts.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">
          You haven&apos;t bookmarked any posts yet.
        </p>
      ) : (
        <InfiniteScroll
          dataLength={bookmarkedPosts.slice(0, visibleCount).length}
          next={fetchMorePosts}
          hasMore={visibleCount < bookmarkedPosts.length}
          loader={
            <div className="flex justify-center my-3">
              <Loader2 className="animate-spin" />
            </div>
          }
        >
          <section className="space-y-2">
            {bookmarkedPosts.slice(0, visibleCount).map((post) => (
              <article key={post._id}>
                <Post
                  post={{
                    ...post,
                    authorId: post.authorId,
                    authorName: post.authorName || "Anonymous",
                    authorImage: post.authorImageUrl || "/default-avatar.png",
                    createdAt: post._creationTime,
                    images: post.images || [],
                    visibility: post.visibility,
                  }}
                  onDelete={async () => {}}
                />
              </article>
            ))}
          </section>
        </InfiniteScroll>
      )}
    </main>
  );
}

function HeaderSkeleton() {
  return (
    <header className="w-full h-11 flex items-center justify-center bg-card dark:bg-[#252728] border rounded-sm">
      <Skeleton className="w-4/6 h-[22px] bg-secondary dark:bg-card/50 rounded-sm" />
    </header>
  );
}

function PostsSkeleton() {
  return (
    <section className="w-full space-y-3 pb-3 pt-0.5">
      {Array.from({ length: 3 }).map((_, index) => (
        <article
          key={index}
          className="border border-border rounded-lg p-4 bg-card dark:bg-[#252728]"
        >
          <div className="flex items-center space-x-3">
            <Skeleton className="w-10 h-10 rounded-full bg-secondary dark:bg-card/50" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 rounded w-3/4 bg-secondary dark:bg-card/50" />
              <Skeleton className="h-4 rounded w-1/2 bg-secondary dark:bg-card/50" />
            </div>
          </div>
          <div className="mt-3 space-y-3">
            <Skeleton className="h-4 rounded bg-secondary dark:bg-card/50" />
            <Skeleton className="h-4 rounded w-5/6 bg-secondary dark:bg-card/50" />
            <Skeleton className="h-4 rounded w-2/3 bg-secondary dark:bg-card/50" />
          </div>
        </article>
      ))}
    </section>
  );
}
