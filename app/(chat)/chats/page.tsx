/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState } from "react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import ChatInput from "./_components/chat-input";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import ChatMessages from "./_components/chat-messages";
import { format, isToday, isYesterday } from "date-fns";
import ChatList, { FriendChat } from "./_components/chat-list";
import { ChatInfoDialog } from "./_components/chat-info-dialog";
import { ChevronLeft, Circle, Info, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const ChatPage = () => {
  const [selectedFriend, setSelectedFriend] = useState<FriendChat | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const currentUser = useQuery(api.users.currentUser);
  const sendMessage = useMutation(api.directMessages.sendDirectMessage);

  const getStatusText = (friend: FriendChat) => {
    if (!friend.lastActiveAt) return "";
    const lastActive = new Date(friend.lastActiveAt);
    const diff = Date.now() - friend.lastActiveAt;

    if (diff < 5 * 60 * 1000) {
      return (
        <div className="flex items-center gap-1.5">
          <Circle className="h-2 w-2 fill-green-500 stroke-green-500" />
          <span className="text-sm text-muted-foreground">Online</span>
        </div>
      );
    }

    const timeString = format(lastActive, "hh:mm a");
    const dateString = isToday(lastActive)
      ? "Today"
      : isYesterday(lastActive)
        ? "Yesterday"
        : format(lastActive, "MMM d, yyyy");

    return (
      <span className="text-sm text-muted-foreground">
        Last seen {dateString} at {timeString}
      </span>
    );
  };

  if (!currentUser) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin size-8" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-background">
      <div
        className={`w-full lg:w-96 border-r overflow-hidden ${
          selectedFriend ? "hidden lg:block" : "block"
        }`}
      >
        <ChatList onSelect={setSelectedFriend} />
      </div>
      <div className="flex-1 flex flex-col">
        {selectedFriend ? (
          <>
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 border-b flex items-center gap-4">
              <button
                onClick={() => setSelectedFriend(null)}
                className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={selectedFriend.imageUrl}
                      alt={`${selectedFriend.firstName} ${selectedFriend.lastName}`}
                    />
                    <AvatarFallback>
                      {selectedFriend.firstName?.[0]}
                      {selectedFriend.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="font-semibold">
                      {selectedFriend.firstName} {selectedFriend.lastName}
                    </h1>
                    {getStatusText(selectedFriend)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setInfoOpen(true)}
                >
                  <Info className="h-5 w-5" />
                </Button>
                <ChatInfoDialog
                  friend={selectedFriend}
                  currentUserId={currentUser._id as unknown as string}
                  open={infoOpen}
                  onOpenChange={setInfoOpen}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-muted/20">
              <ChatMessages
                friend={selectedFriend}
                currentUserId={currentUser._id as unknown as Id<"users">}
              />
            </div>
            <div className="sticky bottom-0 bg-background border-t">
              <ChatInput
                friend={selectedFriend}
                currentUserId={currentUser._id as unknown as Id<"users">}
                onSend={async (message, type, attachments) => {
                  setIsSending(true);
                  try {
                    await sendMessage({
                      recipientId: selectedFriend._id as unknown as Id<"users">,
                      messageType: type,
                      content: message,
                      attachments,
                    });
                  } finally {
                    setIsSending(false);
                  }
                }}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="max-w-md space-y-4">
              <div className="mx-auto h-24 w-24 rounded-full bg-muted mb-6 flex items-center justify-center">
                <svg
                  className="h-12 w-12 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold">No chat selected</h2>
              <p className="text-muted-foreground">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
