"use client";

import Image from "next/image";
import { Toaster, toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";

export type NotificationType =
  | "follow"
  | "comment"
  | "reaction"
  | "reaction-comment"
  | "share"
  | "bookmark";

export interface Notification {
  _id: string;
  type: NotificationType;
  targetUserId: string;
  sender: {
    id: string;
    name: string;
    image: string;
  };
  postId?: string;
  commentId?: string;
  timestamp: number;
  read: boolean;
  reaction?: "like" | "love" | "care" | "haha" | "wow" | "sad" | "angry";
}

interface CustomToast {
  visible: boolean;
  id: string | number;
}

function getNotificationText(
  type: NotificationType,
  senderName: string,
  reaction?: string
): string {
  switch (type) {
    case "follow":
      return `${senderName} started following you`;
    case "comment":
      return `${senderName} commented on your post`;
    case "reaction": {
      const reactionVerbs: Record<string, string> = {
        like: "liked",
        love: "loved",
        care: "cared for",
        haha: "laughed at",
        wow: "was amazed by",
        sad: "felt sad about",
        angry: "got angry at",
      };
      const verb = reaction
        ? reactionVerbs[reaction] || "reacted to"
        : "reacted to";
      return `${senderName} ${verb} your post`;
    }
    case "reaction-comment": {
      const reactionVerbs: Record<string, string> = {
        like: "liked",
        love: "loved",
        care: "cared for",
        haha: "laughed at",
        wow: "was amazed by",
        sad: "felt sad about",
        angry: "got angry at",
      };
      const verb = reaction
        ? reactionVerbs[reaction] || "reacted to"
        : "reacted to";
      return `${senderName} ${verb} your comment`;
    }
    case "share":
      return `${senderName} shared your post`;
    case "bookmark":
      return `${senderName} bookmarked your post`;
    default:
      return "New notification";
  }
}

function getNotificationLink(notification: Notification): string {
  if (notification.type === "follow") {
    return `/users/${notification.sender.id}`;
  } else if (
    notification.type === "reaction-comment" &&
    notification.commentId
  ) {
    return `/posts/${notification.postId}?commentId=${notification.commentId}`;
  } else if (notification.postId) {
    return `/posts/${notification.postId}`;
  }
  return "#";
}

export function ToastNotifications() {
  const notificationsData = useQuery(api.notifications.getNotificationsForUser);
  const notifications = useMemo(
    () => notificationsData ?? [],
    [notificationsData]
  );

  const markNotificationAsReadMutation = useMutation(
    api.notifications.markNotificationAsRead
  );

  const [displayedToasts, setDisplayedToasts] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("displayedToasts");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    }
    return new Set();
  });

  useEffect(() => {
    localStorage.setItem(
      "displayedToasts",
      JSON.stringify(Array.from(displayedToasts))
    );
  }, [displayedToasts]);

  useEffect(() => {
    const newIds: string[] = [];
    notifications.forEach((notification) => {
      if (!notification.read && !displayedToasts.has(notification._id)) {
        newIds.push(notification._id);
        toast.custom(
          (t) => {
            const toastProps = t as unknown as CustomToast;
            return (
              <div
                onClick={async () => {
                  toast.dismiss();
                  if (notification.postId) {
                    for (const n of notifications) {
                      if (!n.read && n.postId === notification.postId) {
                        await markNotificationAsReadMutation({
                          notificationId: n._id,
                        });
                      }
                    }
                  } else {
                    await markNotificationAsReadMutation({
                      notificationId: notification._id,
                    });
                  }
                  window.location.href = getNotificationLink(notification);
                }}
                className={`${
                  toastProps.visible ? "animate-enter" : "animate-leave"
                } flex items-center gap-3 border p-3 cursor-pointer w-full sm:w-80 bg-background text-foreground shadow-none`}
              >
                <div className="flex-shrink-0">
                  <Image
                    src={notification.sender.image}
                    alt={notification.sender.name}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-bold text-sm">
                    {notification.sender.name}
                  </p>
                  <p className="text-xs">
                    {getNotificationText(
                      notification.type,
                      notification.sender.name,
                      notification.reaction
                    )}
                  </p>
                </div>
              </div>
            );
          },
          {
            duration: 5000,
            position: "bottom-left",
          }
        );
      }
    });

    if (newIds.length > 0) {
      const notificationSound = new Audio("/notification.mp3");
      const playPromise = notificationSound.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Audio playback error:", error);
        });
      }
    }

    if (newIds.length > 0) {
      setDisplayedToasts((prev) => new Set([...Array.from(prev), ...newIds]));
    }
  }, [notifications, displayedToasts, markNotificationAsReadMutation]);

  return <Toaster />;
}
