"use client";

import { api } from "@/convex/_generated/api";
import PostEditor from "@/components/post-editor";
import { StoryRow } from "@/components/story-row";
import { useQuery, useMutation } from "convex/react";
import InfinitePostsList from "@/components/posts-list";
import PeopleSidebar from "@/components/people-sidebar";
import InfiniteFollowingPosts from "@/components/following-posts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

let onlineStatusInterval: NodeJS.Timeout | null = null;

export default function MainPage() {
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
    <section className="flex w-full min-w-0 gap-5 mt-5">
      <div className="w-full min-w-0 space-y-5">
        <PostEditor />
        <StoryRow />
        <Tabs defaultValue="for-you">
          <TabsList className="w-full flex gap-1 bg-card border">
            <TabsTrigger value="for-you" className="w-1/2">
              For you
            </TabsTrigger>
            <TabsTrigger value="following" className="w-1/2">
              Following
            </TabsTrigger>
          </TabsList>
          <TabsContent value="for-you">
            <InfinitePostsList />
          </TabsContent>
          <TabsContent value="following">
            <InfiniteFollowingPosts />
          </TabsContent>
        </Tabs>
      </div>
      <PeopleSidebar />
    </section>
  );
}
