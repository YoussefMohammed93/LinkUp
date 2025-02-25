"use client";

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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface RawComment {
  _id: Id<"comments">;
  content: string;
  authorId: Id<"users">;
  postId: Id<"posts">;
  createdAt: number;
  edited?: boolean;
}

interface CommentsProps {
  postId: Id<"posts">;
  postOwnerId: Id<"users">;
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
  const updateCommentMutation = useMutation(api.comments.updateComment);

  const [newComment, setNewComment] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [editingCommentId, setEditingCommentId] =
    useState<Id<"comments"> | null>(null);
  const [editedCommentContent, setEditedCommentContent] = useState("");

  // Callback ref for focusing the inline edit input.
  const editInputRef = useCallback((node: HTMLInputElement | null) => {
    if (node) {
      node.focus();
    }
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

  // Only allow editing if the current user is the comment author.
  const canEdit = (comment: RawComment) => {
    return currentUser && currentUser._id === comment.authorId;
  };

  // Allow deletion if the current user is either the comment author or the post owner.
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

    const isEditing = editingCommentId === comment._id;

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
            <div className="w-full bg-secondary px-3 py-2 mt-1 rounded-2xl break-words group">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold">
                  {commentAuthor.firstName} {commentAuthor.lastName}
                </span>
                {(canEdit(comment) || canDelete(comment)) && !isEditing && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 duration-200 transition-opacity border bg-background hover:bg-background-hover"
                      >
                        <MoreHorizontal className="h-4 w-4" />
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
                <div className="text-sm font-medium max-w-[225px] sm:max-w-[500px]">
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
          <span className="ml-1 font-medium text-xs text-muted-foreground">
            {new Date(comment.createdAt).toLocaleString()}
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
