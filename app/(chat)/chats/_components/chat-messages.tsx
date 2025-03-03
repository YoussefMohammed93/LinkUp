"use client";

import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import React, { FC, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export interface DirectMessage {
  _id: string;
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

const ChatMessages: FC<ChatMessagesProps> = ({ friend, currentUserId }) => {
  const messages = useQuery(api.directMessages.getDirectMessages, {
    user1: currentUserId as unknown as Id<"users">,
    user2: friend._id as unknown as Id<"users">,
  }) as DirectMessage[] | undefined;

  const markAsRead = useMutation(api.directMessages.markDirectMessagesRead);

  useEffect(() => {
    if (messages && messages.length > 0) {
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
    return <div className="p-4">Loading messages...</div>;
  }

  return (
    <div className="space-y-4 p-4">
      {messages.map((msg) => (
        <div
          key={msg._id}
          className={`flex items-start ${
            msg.senderId === (currentUserId as unknown as Id<"users">)
              ? "justify-end"
              : "justify-start"
          }`}
        >
          {msg.senderId !== (currentUserId as unknown as Id<"users">) && (
            <Avatar className="mr-2">
              <AvatarImage
                src={friend.imageUrl || "/avatar-placeholder.png"}
                alt={`${friend.firstName ?? "User"} ${friend.lastName ?? ""}`}
              />
              <AvatarFallback>
                {(friend.firstName?.[0] || "U") + (friend.lastName?.[0] || "")}
              </AvatarFallback>
            </Avatar>
          )}
          <Card
            className={`px-4 py-2 rounded-lg max-w-xs break-words ${
              msg.senderId === (currentUserId as unknown as Id<"users">)
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <div>{msg.content}</div>
            <div className="flex items-center justify-end text-xs mt-1 space-x-1">
              <span>
                {new Date(msg.sentAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {msg.senderId === (currentUserId as unknown as Id<"users">) && (
                <>
                  {msg.readAt ? (
                    <div className="flex items-center space-x-1">
                      <Check size={14} className="text-green-500" />
                      <Check size={14} className="text-green-500" />
                    </div>
                  ) : msg.deliveredAt ? (
                    <Check size={14} className="text-gray-500" />
                  ) : null}
                </>
              )}
            </div>
          </Card>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatMessages;
