"use client";

import {
  UserPlus,
  MessageCircle,
  Share2,
  Bookmark,
  Circle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation } from "convex/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type NotificationType =
  | "follow"
  | "comment"
  | "reaction"
  | "reaction-comment"
  | "share"
  | "bookmark";

interface Notification {
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

const getNotificationIcon = (
  type: NotificationType,
  reaction?: "like" | "love" | "care" | "haha" | "wow" | "sad" | "angry"
) => {
  if (type === "reaction" || type === "reaction-comment") {
    switch (reaction) {
      case "like":
        return (
          <Image src="/like.svg" alt="like" width={20} height={20} priority />
        );
      case "love":
        return (
          <Image src="/love.svg" alt="love" width={20} height={20} priority />
        );
      case "care":
        return (
          <Image src="/care.svg" alt="care" width={20} height={20} priority />
        );
      case "haha":
        return (
          <Image src="/haha.svg" alt="haha" width={20} height={20} priority />
        );
      case "wow":
        return (
          <Image src="/wow.svg" alt="wow" width={20} height={20} priority />
        );
      case "sad":
        return (
          <Image src="/sad.svg" alt="sad" width={20} height={20} priority />
        );
      case "angry":
        return (
          <Image src="/angry.svg" alt="angry" width={20} height={20} priority />
        );
      default:
        return (
          <Image src="/like.svg" alt="like" width={20} height={20} priority />
        );
    }
  }

  switch (type) {
    case "follow":
      return <UserPlus className="w-6 h-6 text-primary" />;
    case "comment":
      return <MessageCircle className="w-6 h-6 text-secondary-foreground" />;
    case "share":
      return <Share2 className="w-6 h-6 text-primary" />;
    case "bookmark":
      return <Bookmark className="w-6 h-6 text-accent" />;
    default:
      return <Circle className="w-6 h-6" />;
  }
};

const getNotificationText = (
  type: NotificationType,
  senderName: string,
  reaction?: "like" | "love" | "care" | "haha" | "wow" | "sad" | "angry"
) => {
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
      const verb =
        reaction && reactionVerbs[reaction]
          ? reactionVerbs[reaction]
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
      const verb =
        reaction && reactionVerbs[reaction]
          ? reactionVerbs[reaction]
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
};

function formatRelativeTime(timestamp: number): string {
  const secondsAgo = Math.floor((Date.now() - timestamp) / 1000);
  if (secondsAgo < 60) return `${secondsAgo}s ago`;
  const minutes = Math.floor(secondsAgo / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-4 my-3 last:mb-0 p-4 border rounded-xl">
      <Skeleton className="w-12 h-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

function NotificationItem({
  notification,
  markAsRead,
}: {
  notification: Notification;
  markAsRead: (id: string) => void;
}) {
  let linkHref = "#";
  if (notification.type === "follow") {
    linkHref = `/users/${notification.sender.id}`;
  } else if (
    notification.type === "reaction-comment" &&
    notification.commentId
  ) {
    linkHref = `/posts/${notification.postId}`;
  } else if (notification.postId) {
    linkHref = `/posts/${notification.postId}`;
  }

  return (
    <Link
      href={linkHref}
      onClick={() => {
        if (!notification.read) markAsRead(notification._id);
      }}
    >
      <div
        className={cn(
          "flex items-start gap-4 my-3 last:mb-0 p-4 border rounded-xl hover:bg-accent cursor-pointer",
          !notification.read ? "bg-accent" : "bg-card"
        )}
      >
        <Avatar className="w-12 h-12">
          <AvatarImage src={notification.sender.image} />
          <AvatarFallback>{notification.sender.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="w-8 flex-shrink-0 flex items-center justify-center">
              {getNotificationIcon(notification.type, notification.reaction)}
            </div>
            <p className="text-base font-medium text-foreground">
              {getNotificationText(
                notification.type,
                notification.sender.name,
                notification.reaction
              )}
            </p>
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-muted-foreground">
              {formatRelativeTime(notification.timestamp)}
            </p>
            {!notification.read && (
              <Button
                variant="link"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  markAsRead(notification._id);
                }}
                className="text-sm"
              >
                Mark as read
              </Button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function NotificationsList() {
  const notifications = useQuery(api.notifications.getNotificationsForUser);
  const markAllAsReadMutation = useMutation(
    api.notifications.markAllNotificationsAsRead
  );
  const markNotificationAsReadMutation = useMutation(
    api.notifications.markNotificationAsRead
  );

  const markAllAsRead = async () => {
    try {
      await markAllAsReadMutation();
    } catch (error) {
      console.error("Error marking notifications as read", error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsReadMutation({
        notificationId: notificationId as Id<"notifications">,
      });
    } catch (error) {
      console.error("Error marking notification as read", error);
    }
  };

  if (notifications === undefined) {
    return (
      <Card className="p-6 bg-card text-card-foreground shadow-none rounded-xl w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <Skeleton className="h-8 w-48 rounded border" />
          <Skeleton className="h-8 w-32 rounded border" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <NotificationSkeleton key={idx} />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card text-card-foreground shadow-none rounded-xl w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Notifications</h2>
        <Button
          variant="outline"
          onClick={markAllAsRead}
          className="text-sm shadow-none hover:bg-accent mt-5 sm:mt-0"
        >
          Mark all as read
        </Button>
      </div>
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <p className="text-center text-muted-foreground">No notifications</p>
        ) : (
          notifications.map((notification: Notification) => (
            <NotificationItem
              key={notification._id}
              notification={notification}
              markAsRead={markAsRead}
            />
          ))
        )}
      </div>
    </Card>
  );
}
