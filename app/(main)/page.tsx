import PeopleSidebar from "@/components/people-sidebar";
import PostEditor from "@/components/post-editor";

export default function MainPage() {
  return (
    <main className="flex w-full min-w-0 gap-5 mt-5">
      <div className="w-full min-w-0 space-y-5">
        <PostEditor />
        {/* <Tabs defaultValue="for-you">
          <TabsList>
            <TabsTrigger value="for-you">For you</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
          </TabsList>
          <TabsContent value="for-you">
            <ForYouFeed />
            For You
          </TabsContent>
          <TabsContent value="following">
            <FollowingFeed />
            Following
          </TabsContent>
        </Tabs> */}
      </div>
      <PeopleSidebar />
    </main>
  );
}
