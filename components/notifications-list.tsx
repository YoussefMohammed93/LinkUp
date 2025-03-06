"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation } from "convex/react";
import InfiniteScroll from "react-infinite-scroll-component";
import { UserPlus, Bookmark, Circle, Loader2 } from "lucide-react";
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
      return <UserPlus className="w-6 h-6 text-primary fill-current" />;
    case "comment":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6 text-green-500 fill-current"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z"
          />
        </svg>
      );
    case "share":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-[22px] h-[22px]"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
          />
        </svg>
      );
    case "bookmark":
      return <Bookmark className="w-6 h-6 text-primary fill-current" />;
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
      <article
        className={cn(
          "flex items-start gap-4 my-3 p-4 border rounded-xl hover:bg-accent cursor-pointer",
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
            <time
              className="text-sm text-muted-foreground"
              dateTime={new Date(notification.timestamp).toISOString()}
            >
              {formatRelativeTime(notification.timestamp)}
            </time>
            {!notification.read && (
              <Button
                variant="link"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
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
      </article>
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

  const [visibleCount, setVisibleCount] = useState(5);

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
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <Skeleton className="h-8 w-48 rounded border" />
          <Skeleton className="h-8 w-32 rounded border" />
        </header>
        <section className="space-y-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <NotificationSkeleton key={idx} />
          ))}
        </section>
      </Card>
    );
  }

  const visibleNotifications = notifications.slice(0, visibleCount);

  return (
    <Card className="p-6 bg-card text-card-foreground shadow-none rounded-xl w-full">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Notifications</h2>
        <Button
          variant="outline"
          onClick={markAllAsRead}
          className="text-sm shadow-none hover:bg-accent mt-5 sm:mt-0"
        >
          Mark all as read
        </Button>
      </header>
      {notifications.length === 0 ? (
        <p className="text-center text-muted-foreground">No notifications</p>
      ) : (
        <InfiniteScroll
          dataLength={visibleNotifications.length}
          next={() => setVisibleCount((prev) => prev + 5)}
          hasMore={visibleNotifications.length < notifications.length}
          loader={
            <div className="flex justify-center my-3">
              <Loader2 className="animate-spin w-6 h-6" />
            </div>
          }
        >
          <section>
            <ul className="space-y-4">
              {visibleNotifications.map((notification: Notification) => (
                <li key={notification._id}>
                  <NotificationItem
                    notification={notification}
                    markAsRead={markAsRead}
                  />
                </li>
              ))}
            </ul>
          </section>
        </InfiniteScroll>
      )}
    </Card>
  );
}
