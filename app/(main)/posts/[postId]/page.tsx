/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import { Suspense } from "react";
import { Undo } from "lucide-react";
import { Post } from "@/components/post";
import Comments from "@/components/comments";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import PeopleSidebar from "@/components/people-sidebar";
import type { Id } from "@/convex/_generated/dataModel";

function PostLoadingSkeleton() {
  return (
    <div className="w-full h-full mt-5">
      <div className="p-3 border rounded-md bg-card dark:bg-[#252728]">
        <div className="flex items-center gap-2">
          <Skeleton className="w-10 h-10 dark:bg-card/50 rounded-full" />
          <div className="flex flex-col gap-1">
            <Skeleton className="w-24 h-4 dark:bg-card/50" />
            <Skeleton className="w-16 h-3 dark:bg-card/50" />
          </div>
        </div>
        <Skeleton className="w-full h-5 mt-3 dark:bg-card/50" />
        <Skeleton className="w-full h-5 mt-1 dark:bg-card/50" />
        <Skeleton className="w-full h-5 mt-1 dark:bg-card/50" />
        <div className="mt-2">
          <Skeleton className="w-full h-[80px] dark:bg-card/50 rounded-md" />
        </div>
      </div>
    </div>
  );
}

function PostNotFoundComponent() {
  const router = useRouter();
  return (
    <main className="w-full h-[80vh] min-w-0 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-5">Post Not Found</h1>
        <Button onClick={() => router.push("/")}>
          <Undo className="size-5" /> Go to Home
        </Button>
      </div>
    </main>
  );
}

function PostPageContent({ postId }: { postId: string }) {
  const typedPostId = postId as Id<"posts">;
  const deletePostMutation = useMutation(api.posts.deletePost);
  const post = useQuery(api.posts.getPostById, { postId: typedPostId });

  if (post === undefined) {
    return <PostLoadingSkeleton />;
  }

  if (post === null) {
    return <PostNotFoundComponent />;
  }

  return (
    <article className="w-full min-w-0 space-y-5 my-5 pb-10">
      <Post
        post={{
          ...post,
          authorImage: post.authorImageUrl || "/avatar-placeholder.png",
          images: post.images ?? [],
        }}
        onDelete={async (postId: string) => {
          try {
            await deletePostMutation({ postId: postId as Id<"posts"> });
          } catch (error) {
            console.error("Error deleting post:", error);
          }
        }}
      />
      <section className="mt-8 bg-card p-5 rounded-lg border">
        <Comments postId={typedPostId} postOwnerId={post.authorId} />
      </section>
    </article>
  );
}

let onlineStatusInterval: NodeJS.Timeout | null = null;

export default function PostPage() {
  const params = useParams();
  const rawPostId: string | string[] | undefined = params.postId;
  const postId =
    typeof rawPostId === "string"
      ? rawPostId
      : Array.isArray(rawPostId)
        ? rawPostId[0]
        : undefined;

  if (!postId) {
    return <div>Error: Post ID is missing.</div>;
  }

  const currentUser = useQuery(api.users.currentUser);
  const updateOnlineStatus = useMutation(api.users.updateOnlineStatus);

  if (typeof window !== "undefined" && currentUser && !onlineStatusInterval) {
    const updateStatus = async () => {
      try {
        await updateOnlineStatus();
      } catch (error) {
        console.error("Failed to update online status", error);
      }
    };
    updateStatus();
    onlineStatusInterval = setInterval(updateStatus, 30000);
  }

  return (
    <div className="flex">
      <main className="flex-1">
        <Suspense fallback={<PostLoadingSkeleton />}>
          <PostPageContent postId={postId} />
        </Suspense>
      </main>
      <PeopleSidebar />
    </div>
  );
}
