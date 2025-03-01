"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";

type StoryView = {
  userId: string;
  viewedAt: number;
};

export default function ViewsListDialog({
  open,
  onOpenChange,
  storyId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storyId: Id<"stories">;
}) {
  const viewsData = useQuery(api.stories.getStoryViewsList, { storyId }) as
    | StoryView[]
    | undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-card text-card-foreground p-0 gap-0">
        <DialogHeader className="flex flex-col gap-2 border-b p-4">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-semibold">
              Story Views
            </DialogTitle>
            <DialogClose
              aria-label="Close"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
            />
          </div>
        </DialogHeader>
        <div
          className="pt-1 px-4"
          style={{ maxHeight: "250px", overflowY: "auto" }}
        >
          {!viewsData ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4 p-2">
                  <Skeleton className="h-11 w-11 rounded-full bg-muted" />
                  <Skeleton className="h-4 w-32 bg-muted" />
                </div>
              ))}
            </div>
          ) : viewsData.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No views for this story.
            </div>
          ) : (
            <>
              {viewsData.map((view, index) => (
                <ViewItem key={`${view.userId}-${index}`} view={view} />
              ))}
            </>
          )}
        </div>
        <DialogFooter className="p-4 pt-3 sm:pt-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ViewItem({ view }: { view: StoryView }) {
  const user = useQuery(api.users.getUserById, {
    id: view.userId as Id<"users">,
  });

  return (
    <div className="flex items-center space-x-4 py-2 border-b last:border-none last:pb-0">
      <Link
        href={`/users/${view.userId}`}
        className="flex items-center space-x-4"
      >
        <div className="relative h-11 w-11">
          <Image
            src={user?.imageUrl || "/avatar-placeholder.png"}
            alt={user ? `${user.firstName} ${user.lastName}` : view.userId}
            width={44}
            height={44}
            className="rounded-full object-cover"
          />
        </div>
        <div>
          <span className="font-medium">
            {user ? `${user.firstName} ${user.lastName}` : view.userId}
          </span>
        </div>
      </Link>
    </div>
  );
}
