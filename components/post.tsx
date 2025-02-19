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
  const currentUser = useQuery(api.users.currentUser);
  const deletePostMutation = useMutation(api.posts.deletePost);
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

  return (
    <>
      <Card className="relative rounded-lg border shadow-none bg-card text-card-foreground">
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
          {isAuthor && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute right-4"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => setOpenDialog(true)}>
                  <Trash />
                  Delete post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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
        <CardFooter className="flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 px-3 py-1.5 hover:bg-muted rounded-md"
            >
              <Heart className="h-5 w-5" />
              Like
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 px-3 py-1.5 hover:bg-muted rounded-md"
            >
              <MessageSquare className="h-5 w-5" />
              Comment
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 px-3 py-1.5 hover:bg-muted rounded-md"
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 px-3 py-1.5 hover:bg-muted rounded-md"
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
