"use client";

import React, { useState } from "react";
import { api } from "@/convex/_generated/api";
import ChatInput from "./_components/chat-input";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import ChatMessages from "./_components/chat-messages";
import ChatList, { FriendChat } from "./_components/chat-list";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const ChatPage = () => {
  const [selectedFriend, setSelectedFriend] = useState<FriendChat | null>(null);

  const currentUser = useQuery(api.users.currentUser);
  const sendMessage = useMutation(api.directMessages.sendDirectMessage);

  if (!currentUser) return <div>Loading current user...</div>;

  const currentUserId = currentUser._id as unknown as Id<"users">;

  let statusText = "";
  if (selectedFriend && selectedFriend.lastActiveAt) {
    const diff = Date.now() - selectedFriend.lastActiveAt;
    if (diff < 5 * 60 * 1000) {
      statusText = "Online";
    } else {
      const lastSeen = new Date(selectedFriend.lastActiveAt).toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      );
      statusText = `Last seen at ${lastSeen}`;
    }
  }

  return (
    <div className="h-screen flex flex-col md:flex-row">
      <div
        className={`w-full md:w-1/4 border-r overflow-y-auto ${
          selectedFriend ? "hidden md:block" : "block"
        }`}
      >
        <ChatList onSelect={setSelectedFriend} />
      </div>
      <div className="flex-1 flex flex-col">
        {selectedFriend && (
          <>
            <div className="p-4 border-b flex items-center space-x-4">
              <button
                onClick={() => setSelectedFriend(null)}
                className="text-blue-500 md:hidden"
              >
                Back
              </button>
              <Avatar>
                <AvatarImage
                  src={selectedFriend.imageUrl || "/avatar-placeholder.png"}
                  alt={`${selectedFriend.firstName ?? "User"} ${selectedFriend.lastName ?? ""}`}
                />
                <AvatarFallback>
                  {(selectedFriend.firstName?.[0] || "U") +
                    (selectedFriend.lastName?.[0] || "")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold">
                  {selectedFriend.firstName || "User"}{" "}
                  {selectedFriend.lastName || ""}
                </h2>
                {selectedFriend.lastActiveAt && (
                  <p className="text-sm text-muted-foreground">{statusText}</p>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ChatMessages
                friend={selectedFriend}
                currentUserId={currentUserId}
              />
            </div>
            <ChatInput
              friend={selectedFriend}
              currentUserId={currentUserId}
              onSend={async (
                message: string,
                type: "text" | "image" | "video" | "audio",
                attachments: string[]
              ) => {
                await sendMessage({
                  recipientId: selectedFriend._id as unknown as Id<"users">,
                  messageType: type,
                  content: message,
                  attachments: attachments,
                });
              }}
            />
          </>
        )}
        {!selectedFriend && (
          <div className="flex-1 flex items-center justify-center">
            <p>Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
