"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";
import { Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export interface StoryDoc {
  _id: string;
  content?: string;
  imageUrls?: string[];
  authorName?: string;
  authorAvatar?: string;
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
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
      setProgress(0);
      setIsPlaying(true);
    }
  }, [open, stories]);

  const currentStory = stories[currentIndex];
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

  const formatTimeAgo = () => {
    return "2h ago";
  };

  return (
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
          {/* Header */}
          <div className="absolute top-10 left-4 right-4 z-10 flex items-center gap-3">
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
              <div className="text-xs text-white/80">{formatTimeAgo()}</div>
            </div>
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
                <p className="text-center text-xl">{currentStory?.content}</p>
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
              <p className="text-lg drop-shadow-md">{currentStory.content}</p>
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
  );
}
