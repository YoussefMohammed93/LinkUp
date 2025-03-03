"use client";

import { useQuery } from "convex/react";
import { ChevronRight } from "lucide-react";
import React, { FC, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { format, isToday, differenceInCalendarDays } from "date-fns";
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
}

interface ChatListProps {
  onSelect: (chat: FriendChat) => void;
}

const truncate = (str: string, max: number): string =>
  str.length > max ? str.substring(0, max) + "..." : str;

const formatChatTime = (time: number | null): string => {
  if (time === null) return "";
  const date = new Date(time);
  if (isNaN(date.getTime())) return "";
  if (isToday(date)) {
    return format(date, "hh:mm aa");
  } else if (differenceInCalendarDays(new Date(), date) === 1) {
    return "Yesterday";
  } else {
    return format(date, "dd/MM/yyyy");
  }
};

const ChatList: FC<ChatListProps> = ({ onSelect }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const friends = useQuery(api.chatFriends.getChatFriends) as
    | FriendChat[]
    | undefined;

  const currentUser = useQuery(api.users.currentUser);

  if (!friends || !currentUser) {
    return <div className="p-4">Loading...</div>;
  }

  const filteredFriends = friends.filter((friend) => {
    const fullName =
      `${friend.firstName ?? ""} ${friend.lastName ?? ""}`.trim();
    return (
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      friend.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Chats</h2>
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search chats..."
          className="w-full"
        />
      </div>
      {filteredFriends.map((friend) => {
        const fullName =
          `${friend.firstName ?? ""} ${friend.lastName ?? ""}`.trim();

        const displayMessage =
          friend.lastMessage && friend.lastMessage.trim().length > 0
            ? friend.lastMessageSenderId === currentUser._id
              ? `You: ${truncate(friend.lastMessage, 30)}`
              : truncate(friend.lastMessage, 30)
            : "No messages yet";
        return (
          <Card
            key={friend._id}
            className="mb-2 cursor-pointer hover:bg-muted p-0 rounded-none shadow-none"
            onClick={() => onSelect(friend)}
          >
            <div className="flex items-center p-4 relative">
              <Avatar className="mr-4">
                <AvatarImage
                  src={friend.imageUrl || "/avatar-placeholder.png"}
                  alt={`${friend.firstName ?? "User"} ${friend.lastName ?? ""}`}
                />
                <AvatarFallback>
                  {(friend.firstName?.[0] || "U") +
                    (friend.lastName?.[0] || "")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-semibold">{fullName}</div>
                <div className="text-sm text-muted-foreground truncate">
                  {displayMessage}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {formatChatTime(friend.lastMessageTime)}
              </div>
              {friend.unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {friend.unreadCount}
                </span>
              )}
              <ChevronRight className="ml-2 text-muted-foreground" size={16} />
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default ChatList;
