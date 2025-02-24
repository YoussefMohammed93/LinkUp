"use client";

import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
} from "date-fns";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation } from "convex/react";
import React, { useState, useCallback } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface RawComment {
  _id: Id<"comments">;
  content: string;
  authorId: Id<"users">;
  postId: Id<"posts">;
  createdAt: number;
}

interface CommentsProps {
  postId: Id<"posts">;
  postOwnerId: Id<"users">;
}

function formatShortDistanceToNow(date: Date) {
  const now = new Date();
  const seconds = differenceInSeconds(now, date);
  if (seconds < 60) return `${seconds}s`;
  const minutes = differenceInMinutes(now, date);
  if (minutes < 60) return `${minutes}m`;
  const hours = differenceInHours(now, date);
  if (hours < 24) return `${hours}h`;
  const days = differenceInDays(now, date);
  return `${days}d`;
}

function CommentSkeleton() {
  return (
    <div className="flex gap-3 items-start my-4">
      <div>
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
      <div className="w-full flex flex-col gap-1">
        <div className="w-full max-w-xl flex items-start gap-3 flex-1">
          <Skeleton className="h-2 w-24" />
          <Skeleton className="h-5 w-full max-w-[225px] sm:max-w-[500px]" />
        </div>
        <Skeleton className="h-2 w-12 ml-0.5" />
      </div>
    </div>
  );
}

export default function Comments({ postId, postOwnerId }: CommentsProps) {
  const currentUser = useQuery(api.users.currentUser);
  const commentsData = useQuery(api.comments.getCommentsForPost, { postId });
  const comments: RawComment[] = commentsData || [];
  const createComment = useMutation(api.comments.createComment);
  const deleteCommentMutation = useMutation(api.comments.deleteComment);
  const [newComment, setNewComment] = useState("");
  const [showAll, setShowAll] = useState(false);

  const handlePublishComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await createComment({ postId, content: newComment });
      setNewComment("");
      toast.success("Comment added!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to add comment!");
    }
  };

  const handleDeleteComment = useCallback(
    async (commentId: Id<"comments">) => {
      try {
        await deleteCommentMutation({ commentId });
        toast.success("Comment deleted!");
      } catch (error) {
        console.error(error);
        toast.error("Failed to delete comment!");
      }
    },
    [deleteCommentMutation]
  );

  const canDelete = (comment: RawComment) => {
    return (
      currentUser &&
      (currentUser._id === comment.authorId || currentUser._id === postOwnerId)
    );
  };

  const CommentItem = ({ comment }: { comment: RawComment }) => {
    const commentAuthor = useQuery(api.users.getUserById, {
      id: comment.authorId,
    });

    if (!commentAuthor) {
      return <CommentSkeleton />;
    }

    return (
      <div className="flex gap-3 items-start my-2">
        <Avatar className="h-9 w-9">
          {commentAuthor.imageUrl ? (
            <AvatarImage
              src={commentAuthor.imageUrl}
              alt={commentAuthor.firstName}
            />
          ) : (
            <AvatarFallback>
              {commentAuthor.firstName?.[0] || "?"}
              {commentAuthor.lastName?.[0] || ""}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="w-full flex flex-col gap-1">
          <div className="w-full max-w-xl flex items-center gap-3 flex-1">
            <div className="w-full bg-secondary px-3 py-2 mt-1 rounded-2xl break-words">
              <div>
                <span className="text-sm font-semibold">
                  {commentAuthor.firstName} {commentAuthor.lastName}
                </span>
              </div>
              <div className="text-sm font-medium max-w-[225px] sm:max-w-[500px]">
                {comment.content}
              </div>
            </div>
            {canDelete(comment) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => handleDeleteComment(comment._id)}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <span className="ml-1 font-medium text-xs text-muted-foreground">
            {formatShortDistanceToNow(new Date(comment.createdAt))}
          </span>
        </div>
      </div>
    );
  };

  const displayedComments = showAll ? comments : comments.slice(0, 3);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Comments</h3>
      {!commentsData ? (
        <>
          {Array.from({ length: 3 }).map((_, index) => (
            <CommentSkeleton key={index} />
          ))}
        </>
      ) : (
        <>
          {displayedComments.map((comment) => (
            <CommentItem key={comment._id.toString()} comment={comment} />
          ))}
          {comments.length > 3 && (
            <div className="text-center">
              <Button
                variant="link"
                className="text-sm text-primary"
                onClick={() => setShowAll((prev) => !prev)}
              >
                {showAll ? "Show less" : "Show all comments"}
              </Button>
            </div>
          )}
        </>
      )}
      <form onSubmit={handlePublishComment} className="mt-4 flex gap-2">
        <Input
          type="text"
          value={newComment}
          placeholder="Write a comment..."
          onChange={(e) => setNewComment(e.target.value)}
        />
        <Button type="submit" disabled={!newComment.trim()}>
          Post
        </Button>
      </form>
    </div>
  );
}
