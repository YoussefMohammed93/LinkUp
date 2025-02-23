"use client";

import {
  Heart,
  MessageSquare,
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import React, { useState } from "react";
import ShareDialog from "./share-dialog";
import { Skeleton } from "./ui/skeleton";
import ReportDialog from "./report-dialog";
import ZoomableImage from "./zoomable-image";
import { api } from "@/convex/_generated/api";
import ExpandableText from "./expandable-text";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import OnlineStatusIndicator from "./online-status-indicator";

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

  const isFriends = currentUser && isFollowing && isFollowedBy;

  const [openDialog, setOpenDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isBlocking, setIsBlocking] = useState(false);
  const [openBlockDialog, setOpenBlockDialog] = useState(false);

  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const likePostMutation = useMutation(api.likes.likePost);
  const unlikePostMutation = useMutation(api.likes.unlikePost);
  const hasLiked = useQuery(api.likes.hasLiked, { postId: _id });
  const likeCount = useQuery(api.likes.countLikes, { postId: _id });
  const isLikesLoading = hasLiked === undefined || likeCount === undefined;

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

  const handleLike = async () => {
    try {
      await likePostMutation({ postId: _id });
      toast.success("Post liked!");
    } catch (error) {
      console.error("Error liking post:", error);
      toast.error("Failed to like post");
    }
  };

  const handleUnlike = async () => {
    try {
      await unlikePostMutation({ postId: _id });
      toast.success("Post unliked!");
    } catch (error) {
      console.error("Error unliking post:", error);
      toast.error("Failed to unlike post");
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

  const formatLikes = (count: number) => `${count} like${count > 1 ? "s" : ""}`;

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
        <CardFooter className="flex items-center justify-between border-t border-border p-2.5">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={hasLiked ? handleUnlike : handleLike}
              className="flex items-center gap-1 px-3 py-1.5 dark:hover:bg-muted rounded-md"
              disabled={isLikesLoading}
            >
              {isLikesLoading ? (
                <Skeleton className="h-6 w-[59px] bg-secondary dark:bg-card rounded-sm" />
              ) : (
                <>
                  <Heart
                    className={`size-5 ${
                      hasLiked ? "fill-red-500 text-red-500" : ""
                    }`}
                  />
                  <span>{formatLikes(likeCount || 0)}</span>
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 px-3 py-1.5 dark:hover:bg-muted rounded-md"
            >
              <MessageSquare className="size-5" />
              Comment
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {post.visibility === "public" && (
              <ShareDialog originalPostId={_id} />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleBookmark}
              className="flex items-center gap-1 px-3 py-1.5 dark:hover:bg-muted rounded-md"
            >
              <Bookmark
                className={`size-5 ${
                  hasBookmarked ? "fill-primary text-primary" : ""
                }`}
              />
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
              Are you sure you want to {isBlocked ? "unblock" : "block"}{" "}
              {authorName}?{" "}
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
      <ReportDialog
        postId={post._id}
        authorId={post.authorId}
        isOpen={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
      />
    </>
  );
}
