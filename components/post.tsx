import {
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  Trash,
  MoreHorizontal,
  Loader2,
  Globe,
  UserX,
  Flag,
  UserMinus,
  Users,
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
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";

export type PostDocument = {
  _id: Id<"posts">;
  content: string;
  authorId: string;
  authorName: string;
  authorImage: string;
  createdAt: number;
  images?: string[];
};

export interface PostProps {
  post: {
    _id: Id<"posts">;
    _creationTime: number;
    content: string;
    authorId: Id<"users">;
    authorName: string;
    authorImage: string;
    images: string[];
    createdAt: number;
    authorImageUrl?: string;
    visibility: "public" | "friends-only";
  };
  currentUserId?: Id<"users">;
  onDelete: (postId: Id<"posts">) => Promise<void>;
}

export function Post({ post, onDelete }: PostProps) {
  const { _id, authorId, authorName, authorImage, content, createdAt, images } =
    post;

  const currentUser = useQuery(api.users.currentUser) as {
    _id: Id<"users">;
  } | null;

  const isFollowingQuery = useQuery(
    api.follows.isFollowing,
    currentUser
      ? { followerId: currentUser._id, followingId: authorId }
      : "skip"
  );

  const [openDialog, setOpenDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAuthor = currentUser?._id === authorId;
  const isFriend = currentUser ? isFollowingQuery : false;

  const likePostMutation = useMutation(api.likes.likePost);
  const unlikePostMutation = useMutation(api.likes.unlikePost);
  const hasLiked = useQuery(api.likes.hasLiked, { postId: _id });
  const likeCount = useQuery(api.likes.countLikes, { postId: _id });

  const deletePostMutation = useMutation(api.posts.deletePost);
  const unfollowUserMutation = useMutation(api.follows.unfollowUser);

  const formattedDate = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const shouldAddMargin =
    content.trim().length > 0 && images && images.length > 0;

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

  const formatLikes = (count: number) => `${count} like${count > 1 ? "s" : ""}`;

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

  return (
    <>
      <Card className="relative rounded-lg border shadow-none bg-card dark:bg-[#252728] text-card-foreground">
        <CardHeader>
          <div className="flex items-center">
            <Link href={`/users/${authorId}`}>
              <Image
                src={authorImage}
                alt={authorName}
                width={100}
                height={100}
                className="w-10 h-10 rounded-full object-cover cursor-pointer"
              />
            </Link>
            <div className="ml-3">
              <Link href={`/users/${authorId}`}>
                <div className="font-semibold text-foreground cursor-pointer hover:underline">
                  {authorName}
                </div>
              </Link>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {post.visibility === "public" ? (
                  <Globe className="size-3" />
                ) : (
                  <Users className="size-3" />
                )}
                {formattedDate}
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
              {isAuthor && (
                <DropdownMenuItem
                  onSelect={() => setOpenDialog(true)}
                  className="p-2.5 dark:hover:bg-secondary"
                  role="menuitem"
                >
                  <Trash aria-hidden="true" />
                  <span>Delete post</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onSelect={() => {}}
                className="p-2.5 dark:hover:bg-secondary"
                role="menuitem"
              >
                <Bookmark aria-hidden="true" />
                <span>Add to Bookmarks</span>
              </DropdownMenuItem>
              {!isAuthor && (
                <>
                  <DropdownMenuItem
                    onSelect={() => {}}
                    className="p-2.5 dark:hover:bg-secondary"
                    role="menuitem"
                  >
                    <UserX aria-hidden="true" />
                    <div>
                      <span>Block {authorName}</span>
                      <p
                        className="text-xs text-muted-foreground"
                        id="block-info"
                      >
                        You won&apos;t be able to see or contact each other.
                      </p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {}}
                    className="p-2.5 dark:hover:bg-secondary"
                    role="menuitem"
                  >
                    <Flag aria-hidden="true" />
                    <div>
                      <span>Report this post</span>
                      <p
                        className="text-xs text-muted-foreground"
                        id="report-info"
                      >
                        We won&apos;t let {authorName} know who reported this.
                      </p>
                    </div>
                  </DropdownMenuItem>
                </>
              )}
              {isFriend && (
                <DropdownMenuItem
                  onSelect={handleUnfollow}
                  className="p-2.5 dark:hover:bg-secondary"
                  role="menuitem"
                >
                  <UserMinus aria-hidden="true" />
                  <span>Unfollow {authorName}</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          {content.trim().length > 0 && (
            <p className={`text-foreground ${shouldAddMargin ? "mb-3" : ""}`}>
              {content}
            </p>
          )}
          {images && images.length > 0 && (
            <>
              {images.length === 1 && (
                <Image
                  src={images[0]}
                  alt="Post image"
                  width={1000}
                  height={1000}
                  className="w-full h-[300px] sm:h-[400px] rounded-lg object-cover"
                />
              )}
              {images.length === 2 && (
                <div className="grid grid-cols-2 gap-2">
                  {images.map((image, index) => (
                    <Image
                      key={index}
                      src={image}
                      alt={`Post image ${index + 1}`}
                      width={1000}
                      height={1000}
                      className="w-full h-full rounded-lg object-cover"
                    />
                  ))}
                </div>
              )}
              {images.length === 3 && (
                <div className="grid grid-cols-2 gap-2">
                  <Image
                    src={images[0]}
                    alt="Post image 1"
                    width={1000}
                    height={1000}
                    className="row-span-2 rounded-lg object-cover"
                  />
                  <div className="flex flex-col gap-2">
                    <Image
                      src={images[1]}
                      alt="Post image 2"
                      width={1000}
                      height={1000}
                      className="rounded-lg object-cover flex-1"
                    />
                    <Image
                      src={images[2]}
                      alt="Post image 3"
                      width={1000}
                      height={1000}
                      className="rounded-lg object-cover flex-1"
                    />
                  </div>
                </div>
              )}
              {images.length >= 4 && (
                <div className="grid grid-cols-2 gap-2">
                  {images.slice(0, 4).map((image, index) => (
                    <Image
                      key={index}
                      src={image}
                      alt={`Post image ${index + 1}`}
                      width={1000}
                      height={1000}
                      className="w-full h-full rounded-lg object-cover"
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
            >
              <Heart
                className={`size-5 ${hasLiked ? "fill-red-500 text-red-500" : ""}`}
              />
              <span>{formatLikes(likeCount || 0)}</span>
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
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 px-3 py-1.5 dark:hover:bg-muted rounded-md"
            >
              <Share2 className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 px-3 py-1.5 dark:hover:bg-muted rounded-md"
            >
              <Bookmark className="size-5" />
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
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
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
    </>
  );
}
