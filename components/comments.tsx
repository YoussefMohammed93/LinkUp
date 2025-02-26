"use client";

import Image from "next/image";
import { toast } from "sonner";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { api } from "@/convex/_generated/api";
import ExpandableText from "./expandable-text";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import React, { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { Edit, MoreHorizontal, Trash } from "lucide-react";

interface RawComment {
  _id: Id<"comments">;
  content: string;
  authorId: Id<"users">;
  postId: Id<"posts">;
  createdAt: number;
  edited?: boolean;
}

interface CommentsProps {
  className?: string;
  postId: Id<"posts">;
  postOwnerId: Id<"users">;
}

function CommentSkeleton() {
  return (
    <div className="flex gap-1 items-start">
      <div>
        <Skeleton className="h-9 w-9 rounded-full bg-card dark:bg-[#252728] dark:border-hidden border" />
      </div>
      <div className="w-full">
        <div className="w-full max-w-xl flex items-center gap-3 flex-1">
          <div className="w-full bg-secondary px-3 py-3 mt-1 rounded-2xl break-words">
            <div className="flex justify-between items-center mb-2">
              <Skeleton className="h-4 w-32 bg-card dark:bg-card/50 dark:border-hidden border" />
            </div>
            <Skeleton className="h-20 w-full max-w-[225px] sm:max-w-[500px] bg-card dark:bg-card/50 dark:border-hidden border" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Comments({
  postId,
  postOwnerId,
  className,
}: CommentsProps) {
  const currentUser = useQuery(api.users.currentUser);
  const commentsData = useQuery(api.comments.getCommentsForPost, { postId });
  const comments: RawComment[] = commentsData || [];
  const createComment = useMutation(api.comments.createComment);
  const deleteCommentMutation = useMutation(api.comments.deleteComment);
  const updateCommentMutation = useMutation(api.comments.updateComment);

  const [newComment, setNewComment] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [editingCommentId, setEditingCommentId] =
    useState<Id<"comments"> | null>(null);
  const [editedCommentContent, setEditedCommentContent] = useState("");

  const editInputRef = useCallback((node: HTMLInputElement | null) => {
    if (node) node.focus();
  }, []);

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

  const handleStartEdit = useCallback((comment: RawComment) => {
    setEditingCommentId(comment._id);
    setEditedCommentContent(comment.content);
  }, []);

  const handleSaveEdit = async () => {
    if (!editedCommentContent.trim()) {
      toast.error("Comment content cannot be empty.");
      return;
    }
    try {
      await updateCommentMutation({
        commentId: editingCommentId!,
        content: editedCommentContent,
      });
      toast.success("Comment updated successfully!");
      setEditingCommentId(null);
      setEditedCommentContent("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update comment!");
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditedCommentContent("");
  };

  const canEdit = (comment: RawComment) =>
    currentUser && currentUser._id === comment.authorId;

  const canDelete = (comment: RawComment) =>
    currentUser &&
    (currentUser._id === comment.authorId || currentUser._id === postOwnerId);

  const CommentItem = ({ comment }: { comment: RawComment }) => {
    const commentAuthor = useQuery(api.users.getUserById, {
      id: comment.authorId,
    });
    if (!commentAuthor) return <CommentSkeleton />;

    const isEditing = editingCommentId === comment._id;

    function formatTimeAgo(date: Date): string {
      const now = new Date();
      const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (seconds < 60) return "Just now";
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 30) return `${days}d ago`;
      const months = Math.floor(days / 30);
      return `${months}mo ago`;
    }

    return (
      <div className="flex gap-3 items-start my-2">
        <Image
          src={commentAuthor.imageUrl || ""}
          width={36}
          height={36}
          className="obc rounded-full"
          alt={`${commentAuthor.firstName} Image`}
        />
        <div className="w-full flex flex-col gap-1">
          <div className="w-full max-w-xl flex items-center gap-3 flex-1">
            <div
              className={`w-full relative ${
                className ? className : "bg-secondary"
              } px-3 py-3 mt-1 rounded-2xl break-words group`}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold">
                  {commentAuthor.firstName} {commentAuthor.lastName}
                </span>
                {(canEdit(comment) || canDelete(comment)) && !isEditing && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      className="absolute top-2 right-2"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 duration-200 transition-opacity border bg-background hover:bg-background-hover"
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {canEdit(comment) && (
                        <DropdownMenuItem
                          onClick={() => handleStartEdit(comment)}
                        >
                          <Edit className="size-4" />
                          Edit comment
                        </DropdownMenuItem>
                      )}
                      {canDelete(comment) && (
                        <DropdownMenuItem
                          onClick={() => handleDeleteComment(comment._id)}
                        >
                          <Trash className="size-4" />
                          Delete comment
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              {isEditing ? (
                <div className="mt-2 flex gap-2">
                  <Input
                    type="text"
                    ref={editInputRef}
                    value={editedCommentContent}
                    onChange={(e) => setEditedCommentContent(e.target.value)}
                    className="flex-1"
                    autoFocus
                  />
                  <Button onClick={handleSaveEdit}>Save</Button>
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="mt-1 text-sm font-medium max-w-[225px] sm:max-w-[500px]">
                  <ExpandableText text={comment.content} />
                  {comment.edited && (
                    <span className="text-xs text-muted-foreground">
                      (Edited)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <span className="ml-2 font-medium text-xs text-muted-foreground">
            {formatTimeAgo(new Date(comment.createdAt))}
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
          Comment
        </Button>
      </form>
    </div>
  );
}
