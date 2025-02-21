import PostEditor from "@/components/post-editor";
import InfinitePostsList from "@/components/posts-list";
import PeopleSidebar from "@/components/people-sidebar";
import InfiniteFollowingPosts from "@/components/following-posts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function MainPage() {
  return (
    <main className="flex w-full min-w-0 gap-5 mt-5">
      <div className="w-full min-w-0 space-y-5">
        <PostEditor />
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
    </main>
  );
}
