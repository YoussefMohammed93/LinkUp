"use client";

import Image from "next/image";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "convex/react";
import { format, isToday, isYesterday } from "date-fns";
import React, { FC, useEffect, useRef, useState } from "react";
import { Check, Play, MoreHorizontal, Edit, Trash, X } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export interface DirectMessage {
  _id: Id<"directMessages">;
  senderId: Id<"users">;
  recipientId: Id<"users">;
  messageType: "text" | "image" | "video" | "audio";
  content?: string;
  attachments?: string[];
  sentAt: number;
  deliveredAt?: number;
  readAt?: number;
  updatedAt?: number;
  deleted?: boolean;
  edited?: boolean;
}

interface ChatMessagesProps {
  friend: {
    _id: string;
    chatId: string;
    imageUrl?: string;
    firstName?: string;
    lastName?: string;
  };
  currentUserId: string;
}

type AudioState = {
  currentTime: number;
  duration: number;
};

const ChatMessages: FC<ChatMessagesProps> = ({ friend, currentUserId }) => {
  const messages = useQuery(api.directMessages.getDirectMessages, {
    user1: currentUserId as unknown as Id<"users">,
    user2: friend._id as unknown as Id<"users">,
  }) as DirectMessage[] | undefined;
  const markAsRead = useMutation(api.directMessages.markDirectMessagesRead);
  const editMessageMutation = useMutation(api.directMessages.editMessage);
  const deleteMessageMutation = useMutation(api.directMessages.deleteMessage);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  const [audioStates, setAudioStates] = useState<Record<string, AudioState>>(
    {}
  );
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  const handleAudioPlay = (messageId: string) => {
    const audio = audioRefs.current[messageId];
    if (!audio) return;
    if (playingAudio && playingAudio !== messageId) {
      audioRefs.current[playingAudio]?.pause();
    }
    if (playingAudio === messageId) {
      audio.pause();
      setPlayingAudio(null);
    } else {
      setPlayingAudio(messageId);
      audio.play();
    }
  };

  const handleEdit = (msg: DirectMessage) => {
    setEditingMessageId(msg._id);
    setEditingContent(msg.content || "");
  };

  const handleSaveEdit = async (messageId: string) => {
    try {
      await editMessageMutation({
        messageId: messageId as unknown as Id<"directMessages">,
        newContent: editingContent,
      });
      toast.success("Message updated");
      setEditingMessageId(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update message");
    }
  };

  const confirmDelete = async () => {
    if (!messageToDelete) return;
    try {
      await deleteMessageMutation({
        messageId: messageToDelete as unknown as Id<"directMessages">,
      });
      toast.success("Message deleted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete message");
    } finally {
      setMessageToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (messages?.length) {
      markAsRead({
        user1: currentUserId as unknown as Id<"users">,
        user2: friend._id as unknown as Id<"users">,
      });
    }
  }, [messages, currentUserId, friend._id, markAsRead]);

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!messages) {
    return (
      <div className="p-4 space-y-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "flex items-end gap-2",
              index % 2 ? "justify-start" : "justify-end"
            )}
          >
            {index % 2 === 1 ? (
              <Skeleton className="w-8 h-8 rounded-full bg-muted" />
            ) : null}
            <div className="max-w-[80%] lg:max-w-[60%] space-y-2">
              <Skeleton className="w-48 h-6 rounded-lg bg-muted" />
              <Skeleton className="w-16 h-3 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg, index) => {
        let showDateLabel = false;
        if (index === 0) {
          showDateLabel = true;
        } else {
          const currentDate = new Date(msg.sentAt);
          const prevDate = new Date(messages[index - 1].sentAt);
          if (currentDate.toDateString() !== prevDate.toDateString()) {
            showDateLabel = true;
          }
        }
        const isUserMessage = msg.senderId === currentUserId;
        const isAudio = msg.messageType === "audio";
        const isImage = msg.messageType === "image";
        return (
          <React.Fragment key={msg._id}>
            {showDateLabel && (
              <div className="flex items-center w-full my-2">
                <div className="flex-grow border-t border-gray-300" />
                <span className="mx-4 text-xs text-muted-foreground">
                  {isToday(new Date(msg.sentAt))
                    ? "Today"
                    : isYesterday(new Date(msg.sentAt))
                      ? "Yesterday"
                      : format(new Date(msg.sentAt), "MMMM d, yyyy")}
                </span>
                <div className="flex-grow border-t border-gray-300" />
              </div>
            )}
            <div className="group relative rounded-lg">
              <div
                className={cn(
                  "flex items-end gap-2",
                  isUserMessage ? "justify-end" : "justify-start"
                )}
              >
                {!isUserMessage && (
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={friend.imageUrl} />
                    <AvatarFallback>
                      {friend.firstName?.[0]}
                      {friend.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-[85%] lg:max-w-[70%] relative",
                    isUserMessage ? "ml-auto" : "mr-auto"
                  )}
                >
                  <Card
                    className={cn(
                      "rounded-xl shadow-sm overflow-hidden",
                      isImage || isAudio
                        ? "bg-transparent p-0 border-none"
                        : "p-2.5",
                      !isImage &&
                        !isAudio &&
                        (isUserMessage
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-muted text-foreground rounded-bl-none")
                    )}
                  >
                    {editingMessageId === msg._id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="resize-none bg-background text-foreground min-h-[80px]"
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setEditingMessageId(null)}
                          >
                            <X className="h-4 w-4 mr-2" /> Cancel
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSaveEdit(msg._id)}
                          >
                            <Check className="h-4 w-4 mr-2" /> Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {msg.messageType === "text" && (
                          <div className="text-base break-words dark:text-white">
                            {msg.content}
                          </div>
                        )}
                        {isImage && msg.attachments?.[0] && (
                          <div className="relative group">
                            <Image
                              width={400}
                              height={400}
                              src={msg.attachments[0]}
                              alt="Sent image"
                              className="rounded-xl object-cover aspect-square transition-transform hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                          </div>
                        )}
                        {msg.messageType === "video" &&
                          msg.attachments?.[0] && (
                            <video
                              controls
                              className="rounded-xl w-full aspect-video bg-black"
                              poster={`${msg.attachments[0]}#t=0.5`}
                            >
                              <source
                                src={msg.attachments[0]}
                                type="video/mp4"
                              />
                            </video>
                          )}
                        {isAudio && msg.attachments?.[0] && (
                          <div className="flex items-center gap-3 w-64 p-3 bg-muted rounded-lg">
                            <button
                              onClick={() => handleAudioPlay(msg._id)}
                              className="size-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
                            >
                              {playingAudio === msg._id ? (
                                <div className="h-5 w-5 bg-pause-icon bg-white" />
                              ) : (
                                <Play className="h-5 w-5 text-white fill-current" />
                              )}
                            </button>
                            <audio
                              ref={(el) => {
                                audioRefs.current[msg._id] = el;
                              }}
                              onEnded={() => setPlayingAudio(null)}
                              onTimeUpdate={(e) => {
                                const audio = e.currentTarget;
                                setAudioStates((prev) => ({
                                  ...prev,
                                  [msg._id]: {
                                    currentTime: audio.currentTime,
                                    duration: audio.duration,
                                  },
                                }));
                              }}
                              onLoadedMetadata={(e) => {
                                const audio = e.currentTarget;
                                setAudioStates((prev) => ({
                                  ...prev,
                                  [msg._id]: {
                                    currentTime: 0,
                                    duration: audio.duration,
                                  },
                                }));
                              }}
                              className="hidden"
                            >
                              <source
                                src={msg.attachments[0]}
                                type="audio/webm"
                              />
                            </audio>
                            <div className="flex-1 space-y-1">
                              <div
                                className="h-1.5 bg-muted-foreground/20 rounded-full cursor-pointer"
                                onClick={(e) => {
                                  const audio = audioRefs.current[msg._id];
                                  if (!audio) return;
                                  const rect =
                                    e.currentTarget.getBoundingClientRect();
                                  const percent =
                                    (e.clientX - rect.left) / rect.width;
                                  audio.currentTime = percent * audio.duration;
                                }}
                              >
                                <div
                                  className="h-full bg-primary rounded-full transition-all"
                                  style={{
                                    width: `${
                                      ((audioStates[msg._id]?.currentTime ||
                                        0) /
                                        (audioStates[msg._id]?.duration || 1)) *
                                      100
                                    }%`,
                                  }}
                                />
                              </div>
                              {audioStates[msg._id]?.duration > 0 && (
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>
                                    {formatTime(
                                      audioStates[msg._id].currentTime
                                    )}
                                  </span>
                                  <span>
                                    {formatTime(audioStates[msg._id].duration)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </Card>
                  <div
                    className={cn(
                      "flex items-center gap-2 mt-1 text-xs",
                      isUserMessage ? "justify-end" : "justify-start",
                      (isAudio || isImage) && "px-1"
                    )}
                  >
                    <span className="text-muted-foreground/80">
                      {new Date(msg.sentAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {msg.edited && (
                      <span className="text-xs text-muted-foreground">
                        (edited)
                      </span>
                    )}
                    {isUserMessage && (
                      <div className="flex items-center gap-0.5">
                        {msg.readAt ? (
                          <>
                            <Check className="h-4 w-4 text-primary" />
                            <Check className="h-4 w-4 text-primary -ml-3" />
                          </>
                        ) : msg.deliveredAt ? (
                          <Check className="h-4 w-4 text-muted-foreground/80" />
                        ) : (
                          <span className="w-3 h-3 rounded-full bg-muted-foreground/30 animate-pulse" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {isUserMessage && (
                  <div className="h-9 w-9 flex items-center justify-center">
                    {msg.readAt && (
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={friend.imageUrl} />
                        <AvatarFallback>
                          {friend.firstName?.[0]}
                          {friend.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                )}
              </div>
              {isUserMessage && (
                <div className="absolute top-0 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                      {msg.messageType === "text" && (
                        <DropdownMenuItem onClick={() => handleEdit(msg)}>
                          <Edit className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => {
                          setMessageToDelete(msg._id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </React.Fragment>
        );
      })}
      <div ref={bottomRef} />
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The message will be permanently
              removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChatMessages;
