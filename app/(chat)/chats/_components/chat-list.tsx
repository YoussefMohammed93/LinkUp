"use client";

import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { useQuery } from "convex/react";
import React, { FC, useState } from "react";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isToday, isYesterday, differenceInMinutes } from "date-fns";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export interface FriendChat {
  _id: string;
  clerkUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  chatId: string;
  lastMessage: string;
  lastMessageTime: number | null;
  lastMessageSenderId: string;
  unreadCount: number;
  lastActiveAt?: number;
  lastMessageType?: "text" | "audio" | "video" | "image";
}

interface ChatListProps {
  onSelect: (chat: FriendChat) => void;
}

const truncate = (str: string, max: number): string =>
  str.length > max ? `${str.substring(0, max)}...` : str;

const formatChatTime = (time: number | null): string => {
  if (!time) return "";
  const date = new Date(time);
  if (isToday(date)) return format(date, "hh:mm a");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MM/dd/yy");
};

const isOnline = (lastActive?: number): boolean => {
  if (!lastActive) return false;
  return differenceInMinutes(Date.now(), lastActive) < 5;
};

const getMessageDisplayText = (friend: FriendChat): string => {
  if (friend.lastMessageTime === null) return "No messages yet";

  if (friend.lastMessageType === "audio") return "Audio";
  if (friend.lastMessageType === "video") return "Video";
  if (friend.lastMessageType === "image") return "Image";

  return truncate(friend.lastMessage || "", 40);
};

const ChatList: FC<ChatListProps> = ({ onSelect }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const friends = useQuery(api.chatFriends.getChatFriends) as
    | FriendChat[]
    | undefined;
  const currentUser = useQuery(api.users.currentUser);

  if (!friends || !currentUser) {
    return (
      <div className="p-4 space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold">Chats</h2>
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-2">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-3 w-[150px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const filteredFriends = friends.filter((friend) => {
    const search = searchTerm.toLowerCase();
    return (
      `${friend.firstName} ${friend.lastName}`.toLowerCase().includes(search) ||
      friend.lastMessage.toLowerCase().includes(search)
    );
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 pb-4">
        <h2 className="text-xl sm:text-2xl font-semibold">Chats</h2>
      </div>
      <div className="p-4 pt-0 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search or start new chat"
            className="pl-10 rounded-full"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredFriends.map((friend) => {
          const fullName = `${friend.firstName} ${friend.lastName}`.trim();
          const isUserMessage = friend.lastMessageSenderId === currentUser._id;
          const online = isOnline(friend.lastActiveAt);
          return (
            <div
              key={friend._id}
              onClick={() => onSelect(friend)}
              className="flex items-center p-3 hover:bg-accent/50 cursor-pointer transition-colors border-b"
            >
              <div className="relative mr-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={friend.imageUrl} />
                  <AvatarFallback>
                    {friend.firstName?.[0]}
                    {friend.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                {online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-semibold text-sm truncate">{fullName}</h3>
                  <span className="text-xs text-muted-foreground">
                    {formatChatTime(friend.lastMessageTime)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p
                    className={cn(
                      "text-sm text-muted-foreground truncate",
                      friend.unreadCount > 0 && "font-medium text-foreground"
                    )}
                  >
                    {isUserMessage && "You: "}
                    {getMessageDisplayText(friend)}
                  </p>
                  {friend.unreadCount > 0 && (
                    <span className="bg-green-500 text-white rounded-full min-w-5 h-5 flex items-center justify-center text-xs px-1.5">
                      {friend.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatList;
