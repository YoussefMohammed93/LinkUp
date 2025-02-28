"use client";

import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Input } from "./ui/input";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
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
import { useQuery, useMutation } from "convex/react";
import ReactionListDialog from "./reactions-list-dialog";
import OnlineStatusIndicator from "./online-status-indicator";
import React, { useState, useCallback, useRef, JSX } from "react";
import { Edit, MoreHorizontal, Trash, Loader } from "lucide-react";

type ReactionType = "like" | "love" | "care" | "haha" | "wow" | "sad" | "angry";

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
    <div className="flex gap-3 my-3 items-start">
      <div>
        <Skeleton className="h-9 w-9 rounded-full bg-secondary border" />
      </div>
      <div className="w-full">
        <div className="w-full max-w-xl flex items-center gap-3 flex-1">
          <div className="w-full bg-secondary px-3 py-3 mt-1 rounded-2xl break-words">
            <div className="flex justify-between items-center mb-2">
              <Skeleton className="h-4 w-32 bg-card dark:bg-card/50 border" />
            </div>
            <Skeleton className="h-20 w-full max-w-[225px] sm:max-w-[500px] bg-card dark:bg-card/50 border" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ReactionPicker({ commentId }: { commentId: Id<"comments"> }) {
  const reactions = useQuery(api.commentLikes.getLikes, { commentId }) as
    | (ReactionType | { reaction: ReactionType })[]
    | undefined;
  const currentReaction = useQuery(api.commentLikes.getReaction, {
    commentId,
  }) as ReactionType | null;
  const reactToCommentMutation = useMutation(api.commentLikes.reactToComment);

  const [hoverOpen, setHoverOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const openTimeoutRef = useRef<number | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  const reactionIcons: Record<ReactionType, JSX.Element> = {
    like: <Image src="/like.svg" alt="like" width={15} height={15} />,
    love: <Image src="/love.svg" alt="love" width={15} height={15} />,
    care: <Image src="/care.svg" alt="care" width={15} height={15} />,
    haha: <Image src="/haha.svg" alt="haha" width={15} height={18} />,
    wow: <Image src="/wow.svg" alt="wow" width={15} height={15} />,
    sad: <Image src="/sad.svg" alt="sad" width={15} height={15} />,
    angry: <Image src="/angry.svg" alt="angry" width={15} height={15} />,
  };

  const hoverReactionIcons: Record<ReactionType, JSX.Element> = {
    like: <Image src="/like.svg" alt="like" width={32} height={32} />,
    love: <Image src="/love.svg" alt="love" width={32} height={32} />,
    care: <Image src="/care.svg" alt="care" width={32} height={32} />,
    haha: <Image src="/haha.svg" alt="haha" width={32} height={32} />,
    wow: <Image src="/wow.svg" alt="wow" width={32} height={32} />,
    sad: <Image src="/sad.svg" alt="sad" width={32} height={32} />,
    angry: <Image src="/angry.svg" alt="angry" width={32} height={32} />,
  };

  const handleDefaultClick = async () => {
    try {
      await reactToCommentMutation({
        commentId,
        reaction: currentReaction || "like",
      });
    } catch (error) {
      console.error("Error reacting to comment:", error);
    }
  };

  const handleReact = async (reaction: ReactionType) => {
    try {
      await reactToCommentMutation({ commentId, reaction });
      setHoverOpen(false);
    } catch (error) {
      console.error("Error reacting to comment:", error);
    }
  };

  let totalReactions = 0;
  let topReactions: { type: ReactionType; count: number }[] = [];
  if (reactions) {
    const counts: Record<ReactionType, number> = {
      like: 0,
      love: 0,
      care: 0,
      haha: 0,
      wow: 0,
      sad: 0,
      angry: 0,
    };
    reactions.forEach((r) => {
      const reactionValue = typeof r === "string" ? r : r.reaction;
      const reactionKey = reactionValue.toLowerCase() as ReactionType;
      counts[reactionKey] = (counts[reactionKey] || 0) + 1;
      totalReactions++;
    });
    topReactions = Object.entries(counts)
      .map(([type, count]) => ({ type: type as ReactionType, count }))
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }

  return (
    <div className="flex items-center flex-row-reverse gap-4">
      {totalReactions > 0 && (
        <div
          role="button"
          className="flex items-center gap-1.5 group"
          onClick={() => setOpenDialog(true)}
        >
          <div className="flex">
            {topReactions.map(({ type }, index) => (
              <div key={index} className="w-4 h-4">
                {reactionIcons[type]}
              </div>
            ))}
          </div>
          <div className="text-xs text-muted-foreground">{totalReactions}</div>
        </div>
      )}
      <HoverCard open={hoverOpen} onOpenChange={setHoverOpen}>
        <HoverCardTrigger asChild>
          <Button
            variant="ghost"
            onClick={handleDefaultClick}
            className="flex items-center gap-1.5 p-1 hover:bg-card"
            onMouseEnter={() => {
              if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
                closeTimeoutRef.current = null;
              }
              openTimeoutRef.current = window.setTimeout(() => {
                setHoverOpen(true);
              }, 1000);
            }}
            onMouseLeave={() => {
              if (openTimeoutRef.current) {
                clearTimeout(openTimeoutRef.current);
                openTimeoutRef.current = null;
              }
              closeTimeoutRef.current = window.setTimeout(() => {
                setHoverOpen(false);
              }, 200);
            }}
          >
            {currentReaction ? (
              reactionIcons[currentReaction]
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z"
                />
              </svg>
            )}
            <span className="text-sm">
              {currentReaction
                ? currentReaction.charAt(0).toUpperCase() +
                  currentReaction.slice(1)
                : "Like"}
            </span>
          </Button>
        </HoverCardTrigger>
        <TooltipProvider>
          <HoverCardContent
            className="flex gap-2 p-2 rounded-full"
            onMouseEnter={() => {
              if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
                closeTimeoutRef.current = null;
              }
            }}
            onMouseLeave={() => {
              closeTimeoutRef.current = window.setTimeout(() => {
                setHoverOpen(false);
              }, 200);
            }}
          >
            {(
              [
                "like",
                "love",
                "care",
                "haha",
                "wow",
                "sad",
                "angry",
              ] as ReactionType[]
            ).map((reaction) => (
              <Tooltip key={reaction}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleReact(reaction)}
                    className="p-1 hover:scale-[1.45] transition-transform duration-200"
                  >
                    {hoverReactionIcons[reaction]}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{reaction.charAt(0).toUpperCase() + reaction.slice(1)}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </HoverCardContent>
        </TooltipProvider>
      </HoverCard>
      <ReactionListDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        targetType="comment"
        targetId={commentId}
      />
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
  const [isCommenting, setIsCommenting] = useState(false);

  const editInputRef = useCallback((node: HTMLInputElement | null) => {
    if (node) node.focus();
  }, []);

  const handlePublishComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsCommenting(true);
    try {
      await createComment({ postId, content: newComment });
      setNewComment("");
      toast.success("Comment added!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to add comment!");
    } finally {
      setIsCommenting(false);
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
      <div className="flex gap-3 my-2">
        <div className="relative h-fit">
          <Link href={`/users/${commentAuthor._id}`}>
            <Image
              src={commentAuthor.imageUrl || ""}
              width={36}
              height={36}
              className="object-cover rounded-full"
              alt={`${commentAuthor.firstName} Image`}
            />
          </Link>
          <OnlineStatusIndicator
            className="right-0 -bottom-1"
            lastActiveAt={commentAuthor.lastActiveAt}
          />
        </div>
        <div className="w-full flex flex-col gap-1">
          <div className="w-full max-w-xl flex items-center gap-3 flex-1">
            <div className="w-full relative px-3 py-3 mt-1 rounded-2xl break-words group bg-secondary">
              <div className="flex justify-between items-center">
                <Link
                  href={`/users/${commentAuthor._id}`}
                  className="text-sm font-semibold"
                >
                  {commentAuthor.firstName} {commentAuthor.lastName}
                </Link>
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
          <div className="flex items-center gap-2">
            <span className="ml-2 font-medium text-xs text-muted-foreground">
              {formatTimeAgo(new Date(comment.createdAt))}
            </span>
            <ReactionPicker commentId={comment._id} />
          </div>
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
        <Button type="submit" disabled={!newComment.trim() || isCommenting}>
          {isCommenting ? (
            <>
              <Loader className="size-4 animate-spin" />
              Commenting...
            </>
          ) : (
            "Comment"
          )}
        </Button>
      </form>
    </div>
  );
}
