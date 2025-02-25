"use client";

import {
  Bookmark,
  Trash,
  MoreHorizontal,
  Loader2,
  Globe,
  UserX,
  Flag,
  UserMinus,
  Users,
  UserPlus,
  Edit,
} from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import Image from "next/image";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Comments from "./comments";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import ShareDialog from "./share-dialog";
import { Skeleton } from "./ui/skeleton";
import ReportDialog from "./report-dialog";
import ZoomableImage from "./zoomable-image";
import { api } from "@/convex/_generated/api";
import ExpandableText from "./expandable-text";
import EditPostDialog from "./edit-post-dialog";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import React, { JSX, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import ReactionListDialog from "./reactions-list-dialog";
import OnlineStatusIndicator from "./online-status-indicator";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";

export interface PostProps {
  post: {
    authorId: Id<"users">;
    authorName: string;
    authorImage: string;
    createdAt: number;
    images: string[];
    _id: Id<"posts">;
    _creationTime: number;
    authorImageUrl?: string;
    sharedPostId?: Id<"posts">;
    content: string;
    visibility: "public" | "friends-only";
  };
  currentUserId?: Id<"users">;
  onDelete: (postId: Id<"posts">) => Promise<void>;
  onReport?: (postId: Id<"posts">) => void;
}

interface Reaction {
  userId: string;
  reaction: "like" | "love" | "care" | "haha" | "wow" | "sad" | "angry";
  createdAt: number;
  firstName?: string;
  lastName?: string;
}

export function Post({ post, onDelete }: PostProps) {
  const {
    _id,
    authorId,
    authorName,
    authorImage,
    content,
    createdAt,
    images,
    sharedPostId,
  } = post;

  const sharedPost = useQuery(
    api.posts.getPostById,
    sharedPostId ? { postId: sharedPostId } : "skip"
  );

  const authorUser = useQuery(api.users.getUserById, { id: authorId });
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const comments = useQuery(api.comments.getCommentsForPost, {
    postId: post._id,
  });

  const currentUser = useQuery(api.users.currentUser) as {
    _id: Id<"users">;
  } | null;

  const isFollowing = useQuery(
    api.follows.isFollowing,
    currentUser
      ? { followerId: currentUser._id, followingId: authorId }
      : "skip"
  );

  const isFollowedBy = useQuery(
    api.follows.isFollowedBy,
    currentUser
      ? { followerId: authorId, followingId: currentUser._id }
      : "skip"
  );

  const reactions = useQuery(api.likes.getLikes, { postId: _id }) as
    | Reaction[]
    | undefined;

  const currentReaction = useQuery(api.likes.getReaction, { postId: _id });
  const reactToPostMutation = useMutation(api.likes.reactToPost);

  const reactionIcons: Record<
    "like" | "love" | "care" | "haha" | "wow" | "sad" | "angry",
    JSX.Element
  > = {
    like: <Image src="/like.svg" alt="like" width={18} height={18} />,
    love: <Image src="/love.svg" alt="love" width={18} height={18} />,
    care: <Image src="/care.svg" alt="care" width={18} height={18} />,
    haha: <Image src="/haha.svg" alt="haha" width={18} height={18} />,
    wow: <Image src="/wow.svg" alt="wow" width={18} height={18} />,
    sad: <Image src="/sad.svg" alt="sad" width={18} height={18} />,
    angry: <Image src="/angry.svg" alt="angry" width={18} height={18} />,
  };

  const hoverReactionIcons: Record<
    "like" | "love" | "care" | "haha" | "wow" | "sad" | "angry",
    JSX.Element
  > = {
    like: <Image src="/like.svg" alt="like" width={32} height={32} />,
    love: <Image src="/love.svg" alt="love" width={32} height={32} />,
    care: <Image src="/care.svg" alt="care" width={32} height={32} />,
    haha: <Image src="/haha.svg" alt="haha" width={32} height={32} />,
    wow: <Image src="/wow.svg" alt="wow" width={32} height={32} />,
    sad: <Image src="/sad.svg" alt="sad" width={32} height={32} />,
    angry: <Image src="/angry.svg" alt="angry" width={32} height={32} />,
  };

  const isFriends = currentUser && isFollowing && isFollowedBy;

  const [openDialog, setOpenDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openReactionDialog, setOpenReactionDialog] = useState(false);

  const [hoverOpen, setHoverOpen] = useState(false);
  const openTimeoutRef = useRef<number | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  const [isBlocking, setIsBlocking] = useState(false);
  const [openBlockDialog, setOpenBlockDialog] = useState(false);

  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false);

  const addBookmarkMutation = useMutation(api.bookmarks.addBookmark);
  const removeBookmarkMutation = useMutation(api.bookmarks.removeBookmark);
  const hasBookmarked = useQuery(api.bookmarks.hasBookmarked, { postId: _id });

  const deletePostMutation = useMutation(api.posts.deletePost);

  const followUserMutation = useMutation(api.follows.followUser);
  const unfollowUserMutation = useMutation(api.follows.unfollowUser);

  const blockUserMutation = useMutation(api.blocks.blockUser);
  const unblockUserMutation = useMutation(api.blocks.unblockUser);
  const blockedUsers = useQuery(api.blocks.getBlockedUsers) || [];
  const isBlocked = blockedUsers.some(
    (b: { blockedId: Id<"users"> }) => b.blockedId === authorId
  );

  const formattedDate = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isShared = !!sharedPostId;
  const shouldAddMargin =
    content.trim().length > 0 && (images?.length > 0 || isShared);

  const handleDefaultClick = async () => {
    try {
      await reactToPostMutation({
        postId: _id,
        reaction: currentReaction || "like",
      });
    } catch (error) {
      console.error("Error reacting to post:", error);
    }
  };

  const handleReact = async (
    reaction: "like" | "love" | "care" | "haha" | "wow" | "sad" | "angry"
  ) => {
    try {
      await reactToPostMutation({ postId: _id, reaction });
      setHoverOpen(false);
    } catch (error) {
      console.error("Error reacting to post:", error);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      toast.error("You must be logged in to follow a user.");
      return;
    }
    try {
      await followUserMutation({ targetUserId: authorId });
      toast.success(`You are now following ${authorName}!`);
    } catch (error) {
      toast.error(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const handleUnfollow = async () => {
    if (!currentUser) {
      toast.error("You must be logged in to unfollow a user.");
      return;
    }
    try {
      await unfollowUserMutation({ targetUserId: authorId });
      toast.success(`You have unfollowed ${authorName}!`);
    } catch (error) {
      toast.error(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deletePostMutation({ postId: _id });
      toast.success("Post deleted successfully");
      onDelete?.(_id);
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
      setOpenDialog(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (hasBookmarked) {
      try {
        await removeBookmarkMutation({ postId: _id });
        toast.success("Removed from bookmarks!");
      } catch (error) {
        console.error("Error removing bookmark:", error);
        toast.error("Failed to remove bookmark");
      }
    } else {
      try {
        await addBookmarkMutation({ postId: _id });
        toast.success("Added to bookmarks!");
      } catch (error) {
        console.error("Error adding bookmark:", error);
        toast.error("Failed to add bookmark");
      }
    }
  };

  const handleBlockToggle = async () => {
    if (!currentUser) {
      toast.error("You must be logged in to block a user.");
      return;
    }
    try {
      if (!isBlocked) {
        await blockUserMutation({ targetUserId: authorId });
        toast.success(`Blocked ${authorName}`);
      } else {
        await unblockUserMutation({ targetUserId: authorId });
        toast.success(`Unblocked ${authorName}`);
      }
    } catch (error) {
      toast.error(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const handleBlockToggleConfirm = async () => {
    setIsBlocking(true);
    try {
      await handleBlockToggle();
    } catch (error) {
      console.error(error);
    } finally {
      setIsBlocking(false);
      setOpenBlockDialog(false);
    }
  };

  return (
    <>
      <Card className="relative rounded-lg border shadow-none bg-card dark:bg-[#252728] text-card-foreground">
        <CardHeader>
          <div className="flex items-center">
            <Link href={`/users/${authorId}`}>
              <div className="relative">
                <Image
                  src={authorImage}
                  alt={authorName}
                  width={100}
                  height={100}
                  className="w-10 h-10 rounded-full object-cover cursor-pointer"
                />
                {(currentUser?._id === authorId || isFriends) && (
                  <OnlineStatusIndicator
                    lastActiveAt={authorUser?.lastActiveAt}
                  />
                )}
              </div>
            </Link>
            <div className="ml-3">
              <Link href={`/users/${authorId}`}>
                <div className="font-semibold text-foreground cursor-pointer hover:underline">
                  {authorName}
                </div>
              </Link>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {formattedDate}
                <span aria-hidden="true">·</span>
                {post.visibility === "public" ? (
                  <Globe className="size-3" />
                ) : (
                  <Users className="size-3" />
                )}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="absolute rounded-full p-2 right-4 dark:bg-[#252728] border-none shadow-none dark:hover:bg-muted text-muted-foreground"
                aria-label="More options"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="p-2"
              role="menu"
              aria-label="Post actions"
            >
              {currentUser?._id === authorId && (
                <DropdownMenuItem
                  onSelect={() => setEditDialogOpen(true)}
                  className="p-2.5 dark:hover:bg-secondary"
                  role="menuitem"
                >
                  <Edit className="h-5 w-5" aria-hidden="true" />
                  <div className="ml-2">
                    <span>Edit Post</span>
                    <p className="text-xs text-muted-foreground">
                      Edit, Update your post content.
                    </p>
                  </div>
                </DropdownMenuItem>
              )}
              {currentUser?._id === authorId && (
                <DropdownMenuItem
                  onSelect={() => setOpenDialog(true)}
                  className="p-2.5 dark:hover:bg-secondary"
                  role="menuitem"
                >
                  <Trash aria-hidden="true" />
                  <div className="ml-2">
                    <span>Delete post</span>
                    <p className="text-xs text-muted-foreground">
                      This will permanently remove your post.
                    </p>
                  </div>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onSelect={handleToggleBookmark}
                className="p-2.5 dark:hover:bg-secondary"
                role="menuitem"
              >
                <Bookmark
                  aria-hidden="true"
                  className={hasBookmarked ? "fill-primary text-primary" : ""}
                />
                <div className="ml-2">
                  <span>
                    {hasBookmarked
                      ? "Remove from Bookmarks"
                      : "Add to Bookmarks"}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {hasBookmarked
                      ? "Removes the post from your bookmarks."
                      : "Saves the post to your bookmarks."}
                  </p>
                </div>
              </DropdownMenuItem>
              {currentUser && currentUser._id !== authorId && (
                <>
                  {isFollowing ? (
                    <DropdownMenuItem
                      onSelect={handleUnfollow}
                      className="p-2.5 dark:hover:bg-secondary"
                      role="menuitem"
                    >
                      <UserMinus aria-hidden="true" />
                      <div className="ml-2">
                        <span>Unfollow {authorName}</span>
                        <p className="text-xs text-muted-foreground">
                          Stop following {authorName} and miss their posts.
                        </p>
                      </div>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onSelect={handleFollow}
                      className="p-2.5 dark:hover:bg-secondary"
                      role="menuitem"
                    >
                      <UserPlus aria-hidden="true" />
                      <div className="ml-2">
                        <span>Follow {authorName}</span>
                        <p className="text-xs text-muted-foreground">
                          Follow {authorName} to see their latest posts.
                        </p>
                      </div>
                    </DropdownMenuItem>
                  )}
                </>
              )}
              {currentUser?._id !== authorId && (
                <>
                  <DropdownMenuItem
                    onSelect={() => setOpenBlockDialog(true)}
                    className="p-2.5 dark:hover:bg-secondary"
                    role="menuitem"
                  >
                    <UserX aria-hidden="true" />
                    <div className="ml-2">
                      <span>
                        {isBlocked
                          ? `Unblock ${authorName}`
                          : `Block ${authorName}`}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {isBlocked
                          ? "You will be able to see and contact each other."
                          : "You won't be able to see or contact each other."}
                      </p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setReportDialogOpen(true)}
                    className="p-2.5 dark:hover:bg-secondary"
                    role="menuitem"
                  >
                    <Flag aria-hidden="true" />
                    <div className="ml-2">
                      <span>Report this post</span>
                      <p className="text-xs text-muted-foreground">
                        We won&apos;t let {authorName} know who reported this.
                      </p>
                    </div>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          {content.trim().length > 0 && (
            <div className={shouldAddMargin ? "mb-3" : ""}>
              <ExpandableText text={content} />
            </div>
          )}
          {sharedPostId && !sharedPost && (
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
          )}
          {sharedPostId && sharedPost && (
            <div className="p-3 border rounded-md bg-card dark:bg-[#252728]">
              <div className="flex items-center">
                <Link href={`/users/${sharedPost.authorId}`}>
                  <div className="relative">
                    <Image
                      src={
                        sharedPost.authorImageUrl || "/avatar-placeholder.png"
                      }
                      alt={sharedPost.authorName}
                      width={100}
                      height={100}
                      className="w-10 h-10 rounded-full object-cover cursor-pointer"
                    />
                  </div>
                </Link>
                <div className="ml-3">
                  <Link href={`/users/${sharedPost.authorId}`}>
                    <div className="font-semibold text-foreground cursor-pointer hover:underline">
                      {sharedPost.authorName}
                    </div>
                  </Link>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>
                      {new Date(sharedPost.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                    <span aria-hidden="true" className="text-muted-foreground">
                      ·
                    </span>
                    {sharedPost.visibility === "public" ? (
                      <Globe className="size-3 text-muted-foreground" />
                    ) : (
                      <Users className="size-3 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <ExpandableText text={sharedPost.content} />
              </div>
              {sharedPost.images && sharedPost.images.length > 0 && (
                <>
                  {sharedPost.images.length === 1 ? (
                    <ZoomableImage
                      src={sharedPost.images[0]}
                      alt="Original Post Image"
                      className="relative w-full h-[300px] sm:h-[400px]"
                    />
                  ) : (
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      {sharedPost.images.map((image, index) => (
                        <ZoomableImage
                          key={index}
                          src={image}
                          alt={`Original Post Image ${index + 1}`}
                          className="relative aspect-[4/3]"
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {images && images.length > 0 && (
            <>
              {images.length === 1 ? (
                <ZoomableImage
                  src={images[0]}
                  alt="Post image"
                  className="relative w-full h-[300px] sm:h-[400px]"
                />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {images.map((image, index) => (
                    <ZoomableImage
                      key={index}
                      src={image}
                      alt={`Post image ${index + 1}`}
                      className="relative aspect-[4/3]"
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
        <div className="flex items-center justify-between gap-3 p-4 py-0">
          <div>
            {reactions === undefined ? (
              <div className="flex items-center gap-2 pb-2.5">
                <Skeleton className="w-14 h-4 rounded-md dark:bg-card/50" />
              </div>
            ) : reactions && reactions.length > 0 ? (
              <div
                role="button"
                onClick={() => setOpenReactionDialog(true)}
                className="flex items-center gap-1.5 group cursor-pointer"
              >
                <div className="flex pt-1.5 pb-2 ml-1">
                  {(() => {
                    const counts = reactions.reduce<Record<string, number>>(
                      (acc, curr) => {
                        const type = curr.reaction;
                        acc[type] = (acc[type] || 0) + 1;
                        return acc;
                      },
                      {}
                    );
                    const topThree = Object.entries(counts)
                      .sort(([, countA], [, countB]) => countB - countA)
                      .slice(0, 3);
                    return topThree.map(([reactionType]) => (
                      <div key={reactionType} className="w-4 h-4">
                        {
                          reactionIcons[
                            reactionType as
                              | "like"
                              | "love"
                              | "care"
                              | "haha"
                              | "wow"
                              | "sad"
                              | "angry"
                          ]
                        }
                      </div>
                    ));
                  })()}
                </div>
                <div className="group-hover:underline text-sm text-muted-foreground">
                  {reactions.length}
                </div>
              </div>
            ) : (
              ""
            )}
          </div>
          <div>
            {comments && comments.length > 0 ? (
              <div
                role="button"
                onClick={() => setIsCommentsDialogOpen(true)}
                className="text-sm text-muted-foreground hover:underline"
              >
                {comments.length}{" "}
                {comments.length === 1 ? "comment" : "comments"}
              </div>
            ) : (
              ""
            )}
          </div>
        </div>
        <CardFooter className="flex items-center justify-between border-t border-border p-2.5">
          <div className="sm:flex-1">
            <HoverCard open={hoverOpen} onOpenChange={setHoverOpen}>
              <HoverCardTrigger asChild>
                {reactions === undefined ? (
                  <Skeleton className="w-28 h-7 rounded-md m-2 dark:bg-card/50" />
                ) : (
                  <Button
                    variant="ghost"
                    onClick={handleDefaultClick}
                    className="w-full flex items-center h-8 gap-1.5 px-3 py-1.5 dark:hover:bg-muted rounded-md"
                    onMouseEnter={() => {
                      if (closeTimeoutRef.current) {
                        clearTimeout(closeTimeoutRef.current);
                        closeTimeoutRef.current = null;
                      }
                      openTimeoutRef.current = window.setTimeout(() => {
                        setHoverOpen(true);
                      }, 2000);
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
                        className="size-5"
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
                )}
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
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleReact("like")}
                        className="p-1 hover:scale-[1.45] transition-transform duration-200"
                      >
                        {hoverReactionIcons.like}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Like</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleReact("love")}
                        className="p-1 hover:scale-[1.45] transition-transform duration-200"
                      >
                        {hoverReactionIcons.love}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Love</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleReact("care")}
                        className="p-1 hover:scale-[1.45] transition-transform duration-200"
                      >
                        {hoverReactionIcons.care}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Care</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleReact("haha")}
                        className="p-1 hover:scale-[1.45] transition-transform duration-200"
                      >
                        {hoverReactionIcons.haha}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Haha</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleReact("wow")}
                        className="p-1 hover:scale-[1.45] transition-transform duration-200"
                      >
                        {hoverReactionIcons.wow}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Wow</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleReact("sad")}
                        className="p-1 hover:scale-[1.45] transition-transform duration-200"
                      >
                        {hoverReactionIcons.sad}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Sad</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleReact("angry")}
                        className="p-1 hover:scale-[1.45] transition-transform duration-200"
                      >
                        {hoverReactionIcons.angry}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Angry</p>
                    </TooltipContent>
                  </Tooltip>
                </HoverCardContent>
              </TooltipProvider>
            </HoverCard>
          </div>
          <div className="sm:flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCommentsDialogOpen(true)}
              className="w-full flex items-center gap-1.5 px-3 py-1.5 dark:hover:bg-muted rounded-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z"
                />
              </svg>
              <span className="text-sm">Comment</span>
            </Button>
          </div>
          {post.visibility === "public" && (
            <div className="sm:flex-1">
              <ShareDialog originalPostId={_id} />
            </div>
          )}
          <div className="sm:flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleBookmark}
              className="w-full flex items-center gap-1 px-3 py-1.5 dark:hover:bg-muted rounded-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className={`size-5 ${
                  hasBookmarked ? "fill-primary text-primary" : ""
                }`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
                />
              </svg>
              <span className="text-sm hidden sm:block">
                {hasBookmarked ? "Bookmarked" : "Bookmark"}
              </span>
            </Button>
          </div>
        </CardFooter>
      </Card>
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this post?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenDialog(false)}
              className="dark:border-[#333333]"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={openBlockDialog} onOpenChange={setOpenBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm {isBlocked ? "Unblock" : "Block"}</DialogTitle>
            <DialogDescription className="pt-5">
              Are you sure you want to {isBlocked ? "unblock" : "block"}
              {authorName}?
              {isBlocked
                ? "They will be able to see and contact you."
                : "They will no longer be able to interact with you."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-2">
            <Button
              variant="outline"
              onClick={() => setOpenBlockDialog(false)}
              disabled={isBlocking}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlockToggleConfirm}
              disabled={isBlocking}
            >
              {isBlocking ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin size-4" />
                  {isBlocked ? "Unblocking..." : "Blocking..."}
                </span>
              ) : (
                "Confirm"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={isCommentsDialogOpen}
        onOpenChange={setIsCommentsDialogOpen}
      >
        <DialogContent className="p-3 sm:p-5 max-w-[380px] sm:max-w-[700px] max-h-[650px] overflow-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle>Post Details</DialogTitle>
            <DialogDescription asChild>
              <div>
                <div className="flex items-center mt-3 mb-5">
                  <Link href={`/users/${authorId}`}>
                    <div className="relative">
                      <Image
                        src={authorImage}
                        alt={authorName}
                        width={100}
                        height={100}
                        className="w-10 h-10 rounded-full object-cover cursor-pointer"
                      />
                      {(currentUser?._id === authorId || isFriends) && (
                        <OnlineStatusIndicator
                          lastActiveAt={authorUser?.lastActiveAt}
                        />
                      )}
                    </div>
                  </Link>
                  <div className="ml-3">
                    <Link href={`/users/${authorId}`}>
                      <div className="font-semibold text-foreground cursor-pointer hover:underline">
                        {authorName}
                      </div>
                    </Link>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {formattedDate}
                      <span aria-hidden="true">·</span>
                      {post.visibility === "public" ? (
                        <Globe className="size-3" />
                      ) : (
                        <Users className="size-3" />
                      )}
                    </div>
                  </div>
                </div>
                {sharedPostId && sharedPost ? (
                  <div className="border p-4 rounded-sm bg-background">
                    <div className="flex items-center">
                      <Link href={`/users/${sharedPost.authorId}`}>
                        <div className="relative">
                          <Image
                            src={
                              sharedPost.authorImageUrl ||
                              "/avatar-placeholder.png"
                            }
                            alt={sharedPost.authorName}
                            width={100}
                            height={100}
                            className="w-10 h-10 rounded-full object-cover cursor-pointer"
                          />
                        </div>
                      </Link>
                      <div className="ml-3">
                        <Link href={`/users/${sharedPost.authorId}`}>
                          <div className="font-semibold text-foreground cursor-pointer hover:underline">
                            {sharedPost.authorName}
                          </div>
                        </Link>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span>
                            {new Date(sharedPost.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                          <span
                            aria-hidden="true"
                            className="text-muted-foreground"
                          >
                            ·
                          </span>
                          {sharedPost.visibility === "public" ? (
                            <Globe className="size-3 text-muted-foreground" />
                          ) : (
                            <Users className="size-3 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <ExpandableText text={sharedPost.content} />
                    </div>
                    {sharedPost.images && sharedPost.images.length > 0 && (
                      <div
                        className={`mt-3 grid gap-3 ${
                          sharedPost.images.length === 1
                            ? "sm:grid-cols-1"
                            : "sm:grid-cols-2"
                        }`}
                      >
                        {sharedPost.images.map((img, idx) => (
                          <ZoomableImage
                            key={idx}
                            src={img}
                            alt={`Shared Post image ${idx + 1}`}
                            className="relative w-full h-full aspect-[4/3] rounded-lg"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border p-4 rounded-sm bg-background">
                    <div className="text-start text-base">
                      <ExpandableText text={content} />
                    </div>
                    {post.images && post.images.length > 0 && (
                      <div
                        className={`mt-3 grid gap-3 ${
                          post.images.length === 1
                            ? "sm:grid-cols-1"
                            : "sm:grid-cols-2"
                        }`}
                      >
                        {post.images.map((img, idx) => (
                          <ZoomableImage
                            key={idx}
                            src={img}
                            alt={`Post image ${idx + 1}`}
                            className="relative w-full h-full aspect-[4/3] rounded-lg"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-1">
            <Comments postId={post._id} postOwnerId={post.authorId} />
          </div>
        </DialogContent>
      </Dialog>
      <ReportDialog
        postId={post._id}
        authorId={post.authorId}
        isOpen={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
      />
      {editDialogOpen && (
        <EditPostDialog
          post={post}
          isOpen={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
        />
      )}
      <ReactionListDialog
        open={openReactionDialog}
        onOpenChange={setOpenReactionDialog}
        postId={post._id}
      />
    </>
  );
}
