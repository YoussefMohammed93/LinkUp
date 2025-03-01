/* eslint-disable @typescript-eslint/no-unused-vars */
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useQuery } from "convex/react";
import StoryViewer from "./story-viewer";
import { PlusCircle } from "lucide-react";
import StoryCreator from "./story-creator";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export type StoryDoc = {
  _id: Id<"stories">;
  _creationTime: number;
  content?: string;
  imageUrls?: string[];
  authorName: string;
  authorAvatar: string;
  authorId: Id<"users">;
  createdAt: Date;
  expiresAt: Date;
};

function StoryThumbnail({
  group,
  onClick,
}: {
  group: StoryDoc[];
  onClick: () => void;
}) {
  const newestStory = group[0];

  const hasViewed = useQuery(api.stories.hasViewed, {
    storyId: newestStory._id,
  });
  const avatarBorderClass = hasViewed
    ? "border-gray-400"
    : "border-emerald-500";

  return (
    <div
      onClick={onClick}
      className="relative w-24 h-40 flex-shrink-0 cursor-pointer rounded-xl overflow-hidden"
    >
      {newestStory.imageUrls && newestStory.imageUrls.length ? (
        <Image
          src={newestStory.imageUrls[0]}
          alt={group[0]?.authorName || "Story"}
          fill
          className="object-cover"
        />
      ) : (
        <div className="bg-primary/90 w-full h-full flex items-center justify-center p-2">
          <p className="text-white text-center">{newestStory.content}</p>
        </div>
      )}
      <div
        className={`absolute top-2 left-2 w-10 h-10 rounded-full border-4 ${avatarBorderClass} overflow-hidden`}
      >
        <Image
          src={group[0]?.authorAvatar || "/avatar-placeholder.png"}
          alt="Author avatar"
          fill
          className="object-cover"
        />
      </div>
      <div className="absolute bottom-2 left-2 text-xs font-semibold text-white truncate max-w-[80%]">
        {group[0]?.authorName}
      </div>
    </div>
  );
}

export function StoryRow() {
  const currentUser = useQuery(api.users.currentUser);
  const storiesRaw = (useQuery(api.stories.getActiveFriendStories) || []).map(
    (story) => ({
      ...story,
      createdAt: new Date(story.createdAt),
      expiresAt: new Date(story.expiresAt),
    })
  ) as StoryDoc[];

  const groupedStories = storiesRaw.reduce(
    (acc, story) => {
      const key = story.authorId.toString();
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(story);
      return acc;
    },
    {} as Record<string, StoryDoc[]>
  );

  const myStoryGroup = currentUser
    ? groupedStories[currentUser._id.toString()] || []
    : [];
  const otherStoryGroups = Object.entries(groupedStories)
    .filter(([authorId]) =>
      currentUser ? authorId !== currentUser._id.toString() : true
    )
    .map(([_, group]) => group);

  const [openCreator, setOpenCreator] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedStories, setSelectedStories] = useState<StoryDoc[]>([]);

  const handleGroupClick = (stories: StoryDoc[]) => {
    setSelectedStories(stories);
    setViewerOpen(true);
  };

  return (
    <div className="flex items-center space-x-3 overflow-x-auto w-full">
      <Dialog open={openCreator} onOpenChange={setOpenCreator}>
        <DialogTrigger asChild>
          <div className="relative w-24 h-40 flex-shrink-0 cursor-pointer rounded-xl overflow-hidden">
            <Image
              src={currentUser?.imageUrl || "/avatar-placeholder.png"}
              alt="User avatar"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />
            <div className="flex items-center justify-center relative pt-5">
              <PlusCircle className="w-8 h-8 text-white" />
            </div>
            <p className="flex items-center justify-center relative pt-8 text-sm font-semibold text-white">
              Create story
            </p>
          </div>
        </DialogTrigger>
        <DialogContent className="p-0 overflow-y-auto max-h-[680px] overflow-x-hidden gap-0 rounded-xl">
          <DialogHeader className="border-b p-4">
            <DialogTitle className="text-center">Create Story</DialogTitle>
          </DialogHeader>
          <div>
            <StoryCreator />
          </div>
        </DialogContent>
      </Dialog>
      {myStoryGroup.length > 0 && (
        <StoryThumbnail
          group={myStoryGroup}
          onClick={() => handleGroupClick(myStoryGroup)}
        />
      )}
      {otherStoryGroups.map((group) => (
        <StoryThumbnail
          key={group[0]?._id.toString()}
          group={group}
          onClick={() => handleGroupClick(group)}
        />
      ))}
      <StoryViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        stories={selectedStories}
      />
      <style jsx global>{`
        .lucide.lucide-x.size-5 {
          display: none;
        }
      `}</style>
    </div>
  );
}
