"use client";

import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Eye,
  Loader,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/convex/_generated/api";
import ExpandableText from "./expandable-text";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

export interface StoryDoc {
  _id: Id<"stories">;
  content?: string;
  imageUrls?: string[];
  authorName?: string;
  authorAvatar?: string;
  authorId?: string;
  createdAt?: Date;
}

interface StoryViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stories: StoryDoc[];
}

export default function StoryViewer({
  open,
  onOpenChange,
  stories,
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const currentUser = useQuery(api.users.currentUser);
  const deleteStoryMutation = useMutation(api.stories.deleteStory);

  const currentStory = stories[currentIndex];

  const addStoryView = useMutation(api.stories.addStoryView);

  useEffect(() => {
    if (open && currentStory) {
      addStoryView({ storyId: currentStory._id as Id<"stories"> });
    }
  }, [open, currentStory, addStoryView]);

  const isMine =
    currentUser && currentStory && currentUser._id === currentStory.authorId;

  const viewCount = useQuery(
    api.stories.getStoryViewCount,
    currentStory ? { storyId: currentStory._id as Id<"stories"> } : "skip"
  );

  useEffect(() => {
    if (!deleteConfirmOpen && !isDeleting && open) {
      setIsPlaying(true);
    }
  }, [deleteConfirmOpen, isDeleting, open]);

  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
      setProgress(0);
      setIsPlaying(true);
    }
  }, [open, stories]);

  const mediaUrl = currentStory?.imageUrls?.[0] ?? "";
  const isVideo = /\.(mp4|mov|avi|mkv)$/i.test(mediaUrl);

  const togglePlay = () => setIsPlaying((prev) => !prev);

  useEffect(() => {
    if (!open || !currentStory || isVideo || !isPlaying) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
            return 0;
          } else {
            onOpenChange(false);
            return 100;
          }
        }
        return prev + 1;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [
    open,
    currentStory,
    isVideo,
    isPlaying,
    currentIndex,
    stories,
    onOpenChange,
  ]);

  useEffect(() => {
    if (!open || !isVideo || !videoRef.current) return;
    if (isPlaying) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying, open, isVideo]);

  const handleVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const newProgress = (video.currentTime / video.duration) * 100;
    setProgress(newProgress);
  };

  const handleVideoEnded = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onOpenChange(false);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
      setIsPlaying(true);
    }
  };

  const goToNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
      setIsPlaying(true);
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteStoryMutation({
        storyId: currentStory._id as Id<"stories">,
      });
      setDeleteConfirmOpen(false);
      onOpenChange(false);
      toast.success("Story deleted successfully!");
    } catch (err) {
      console.error("Delete failed", err);
      toast.error("Failed to delete story.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="p-0 bg-black border-none max-w-none w-full h-screen sm:h-[95vh] md:w-[700px]">
          <div className="hidden">
            <DialogTitle>
              {currentStory?.authorName || "Story Viewer"}
            </DialogTitle>
          </div>
          <div className="relative h-full">
            <div className="absolute top-3 left-4 right-4 z-20 flex space-x-1">
              {stories.map((_, idx) => {
                let fill = 0;
                if (idx < currentIndex) {
                  fill = 100;
                } else if (idx === currentIndex) {
                  fill = progress;
                }
                return (
                  <div
                    key={idx}
                    className="flex-1 h-1 bg-[#b7bcbe] rounded-full overflow-hidden"
                  >
                    <div
                      className="h-full bg-card transition-all duration-300 ease-out"
                      style={{ width: `${fill}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="absolute top-8 left-4 right-4 z-10 flex items-center gap-3">
              <Image
                src={currentStory?.authorAvatar || ""}
                alt={`${currentStory?.authorName} Image`}
                width={44}
                height={44}
                className="w-11 h-11 rounded-full border-white"
              />
              <div className="flex-1">
                <div className="text-white font-semibold">
                  {currentStory?.authorName}
                </div>
                <div className="text-xs text-white/80">
                  {currentStory?.createdAt
                    ? formatTimeAgo(new Date(currentStory.createdAt))
                    : ""}
                </div>
              </div>
              {isMine && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    className="text-xs bg-black/50 hover:bg-black/60"
                  >
                    <Eye className="w-5 h-5 text-white" />
                    <span className="text-white">{viewCount ?? 0}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setIsPlaying(false);
                      setDeleteConfirmOpen(true);
                    }}
                    className="bg-black/50 hover:bg-black/60"
                  >
                    <Trash2 className="w-5 h-5 text-white" />
                  </Button>
                </div>
              )}
            </div>
            <div
              className="h-full w-full flex items-center justify-center cursor-pointer bg-primary rounded-lg"
              onClick={mediaUrl ? togglePlay : undefined}
            >
              {mediaUrl ? (
                isVideo ? (
                  <video
                    ref={videoRef}
                    src={mediaUrl}
                    autoPlay
                    muted
                    onTimeUpdate={handleVideoTimeUpdate}
                    onEnded={handleVideoEnded}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Image
                    src={mediaUrl}
                    alt={currentStory?.authorName || "Story"}
                    fill
                    className="w-full h-full object-cover rounded-lg"
                  />
                )
              ) : (
                <div className="bg-primary text-primary-foreground p-8 rounded-lg max-w-[80%]">
                  <p className="text-center text-xl text-white">
                    {currentStory?.content}
                  </p>
                </div>
              )}
              {!isPlaying && mediaUrl && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-white w-16 h-16 hover:bg-white/10"
                  >
                    <Play className="w-8 h-8 fill-current" />
                  </Button>
                </div>
              )}
            </div>
            {currentIndex > 0 && (
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrev}
                className="absolute -left-16 top-1/2 -translate-y-1/2 hover:text-white bg-white/10 text-white hover:bg-white/20 border-2 dark:border-[#444444]"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
            )}
            {currentIndex < stories.length - 1 && (
              <Button
                variant="outline"
                size="icon"
                onClick={goToNext}
                className="absolute -right-16 top-1/2 -translate-y-1/2 hover:text-white bg-white/10 text-white hover:bg-white/20 border-2 dark:border-[#444444]"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            )}
            {mediaUrl && currentStory?.content && (
              <div className="absolute bottom-0 w-full p-6 text-center text-white bg-gradient-to-t from-black/60 to-transparent">
                <p className="text-lg drop-shadow-md pb-14">
                  <ExpandableText text={currentStory.content} />
                </p>
              </div>
            )}
            {isPlaying && mediaUrl && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-white/10 text-white border-none hover:bg-white/20"
                  onClick={togglePlay}
                >
                  <Pause className="w-6 h-6" />
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="p-4">
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this story?
          </DialogDescription>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <style jsx global>{`
        .lucide.lucide-x.size-5 {
          display: none;
        }
      `}</style>
    </>
  );
}
