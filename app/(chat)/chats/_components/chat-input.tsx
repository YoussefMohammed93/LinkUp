/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { FC, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { Smile, Mic, ImageIcon } from "lucide-react";

interface ChatInputProps {
  friend: { _id: string; chatId: string };
  currentUserId: Id<"users">;
  onSend: (
    message: string,
    type: "text" | "image" | "video" | "audio",
    attachments: string[]
  ) => Promise<void>;
}

const ChatInput: FC<ChatInputProps> = ({
  friend: _friend,
  currentUserId: _currentUserId,
  onSend,
}) => {
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    if (!message.trim()) return;
    try {
      await onSend(message, "text", []);
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center space-x-2 p-4 border-t">
      <Button variant="ghost" size="icon">
        <Smile size={20} />
      </Button>
      <Button variant="ghost" size="icon">
        <ImageIcon size={20} />
      </Button>
      <Button variant="ghost" size="icon">
        <Mic size={20} />
      </Button>
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        className="flex-1"
      />
      <Button onClick={handleSend}>Send</Button>
    </div>
  );
};

export default ChatInput;
