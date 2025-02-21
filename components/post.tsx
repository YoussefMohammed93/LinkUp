import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
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
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
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
    authorId: Id<"users">;
    authorName: string;
    authorImage: string;
    createdAt: number;
    images: string[];
    _id: Id<"posts">;
    _creationTime: number;
    authorImageUrl?: string;
    content: string;
  };
  currentUserId?: Id<"users">;
  onDelete: (postId: Id<"posts">) => Promise<void>;
}

export function Post({ post, onDelete }: PostProps) {
  const currentUser = useQuery(api.users.currentUser) as {
    _id: Id<"users">;
  } | null;

  const isFollowingQuery = useQuery(
    api.follows.isFollowing,
    currentUser
      ? {
          followerId: currentUser._id,
          followingId: post.authorId,
        }
      : "skip"
  );

  const isFriend = currentUser ? isFollowingQuery : false;

  const deletePostMutation = useMutation(api.posts.deletePost);
  const unfollowUserMutation = useMutation(api.follows.unfollowUser);
  const [openDialog, setOpenDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isAuthor = currentUser?._id === post.authorId;
  const formattedDate = new Date(post.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deletePostMutation({ postId: post._id });
      toast.success("Post deleted successfully");
      onDelete?.(post._id);
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
      await unfollowUserMutation({ targetUserId: post.authorId });
      toast.success(`You have unfollowed ${post.authorName}!`);
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
            <Link href={`/users/${post.authorId}`}>
              <Image
                src={post.authorImage}
                alt={post.authorName}
                width={100}
                height={100}
                className="w-10 h-10 rounded-full object-cover cursor-pointer"
              />
            </Link>
            <div className="ml-3">
              <Link href={`/users/${post.authorId}`}>
                <div className="font-semibold text-foreground cursor-pointer hover:underline">
                  {post.authorName}
                </div>
              </Link>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Globe className="size-3" /> {formattedDate}
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
                      <span>Block {post.authorName}</span>
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
                        We won&apos;t let {post.authorName} know who reported
                        this.
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
                  <span>Unfollow {post.authorName}</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <p className="text-foreground mb-3">{post.content}</p>
          {post.images && post.images.length > 0 && (
            <>
              {post.images.length === 1 && (
                <Image
                  src={post.images[0]}
                  alt="Post image"
                  width={1000}
                  height={1000}
                  className="w-full h-[300px] sm:h-[400px] rounded-lg object-cover"
                />
              )}
              {post.images.length === 2 && (
                <div className="grid grid-cols-2 gap-2">
                  {post.images.map((image, index) => (
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
              {post.images.length === 3 && (
                <div className="grid grid-cols-2 gap-2">
                  <Image
                    src={post.images[0]}
                    alt="Post image 1"
                    width={1000}
                    height={1000}
                    className="row-span-2 rounded-lg object-cover"
                  />
                  <div className="flex flex-col gap-2">
                    <Image
                      src={post.images[1]}
                      alt="Post image 2"
                      width={1000}
                      height={1000}
                      className="rounded-lg object-cover flex-1"
                    />
                    <Image
                      src={post.images[2]}
                      alt="Post image 3"
                      width={1000}
                      height={1000}
                      className="rounded-lg object-cover flex-1"
                    />
                  </div>
                </div>
              )}
              {post.images.length >= 4 && (
                <div className="grid grid-cols-2 gap-2">
                  {post.images.slice(0, 4).map((image, index) => (
                    <Image
                      key={index}
                      src={image}
                      width={1000}
                      height={1000}
                      alt={`Post image ${index + 1}`}
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
              size="sm"
              className="flex items-center gap-1 px-3 py-1.5 dark:hover:bg-muted rounded-md"
            >
              <Heart className="h-5 w-5" />
              Like
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 px-3 py-1.5 dark:hover:bg-muted rounded-md"
            >
              <MessageSquare className="h-5 w-5" />
              Comment
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 px-3 py-1.5 dark:hover:bg-muted rounded-md"
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 px-3 py-1.5 dark:hover:bg-muted rounded-md"
            >
              <Bookmark className="h-5 w-5" />
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
