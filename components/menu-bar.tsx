"use client";

import {
  Home,
  User,
  MessagesSquare,
  Bookmark,
  Bell,
  Loader,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import OnlineStatusIndicator from "./online-status-indicator";

interface MenuBarProps {
  className?: string;
}

export default function MenuBar({ className }: MenuBarProps) {
  const currentUser = useQuery(api.users.currentUser);
  const profileLink = currentUser ? `/users/${currentUser._id}` : "/";

  const unreadCount = useQuery(api.notifications.countUnreadNotifications) || 0;

  const [avatarLoading, setAvatarLoading] = useState(true);

  const menuItems = [
    { title: "Home", href: "/", icon: Home },
    { title: "Profile", href: profileLink, icon: User },
    { title: "Messages", href: "/messages", icon: MessagesSquare },
    { title: "Bookmarks", href: "/bookmarks", icon: Bookmark },
    { title: "Notifications", href: "/notifications", icon: Bell },
  ];

  return (
    <div className={className}>
      <div className="relative h-20 hidden lg:block rounded-t-xl">
        {currentUser === undefined ? (
          <Skeleton className="h-full w-full rounded-t-xl rounded-b-none animate-pulse" />
        ) : (
          <div
            className="h-full w-full bg-cover bg-center rounded-t-xl"
            style={{
              backgroundImage: `url(${currentUser?.coverImageUrl || "/cover-image-placeholder.png"})`,
            }}
          />
        )}
        <div className="absolute -bottom-8 xl:-bottom-12 left-4">
          <div className="relative size-16 xl:size-20 rounded-full border-[3px] border-card bg-secondary flex items-center justify-center">
            {currentUser === undefined ? (
              <Loader className="animate-spin text-muted-foreground size-5" />
            ) : (
              <>
                {currentUser?.imageUrl ? (
                  <Image
                    src={currentUser.imageUrl}
                    alt="Profile"
                    width={100}
                    height={100}
                    className="w-full h-full rounded-full object-cover"
                    onLoad={() => setAvatarLoading(false)}
                    style={{
                      opacity: avatarLoading ? 0 : 1,
                      transition: "opacity 0.5s ease-in-out",
                    }}
                  />
                ) : (
                  <span className="text-xl font-semibold text-muted-foreground">
                    {currentUser?.firstName?.[0]}
                    {currentUser?.lastName?.[0]}
                  </span>
                )}
                <OnlineStatusIndicator
                  className="w-[15px] h-[15px] right-1.5 border-card"
                  lastActiveAt={currentUser?.lastActiveAt}
                />
              </>
            )}
          </div>
        </div>
      </div>
      <div className="pt-14 pb-5 px-4 hidden lg:block">
        {currentUser === undefined ? (
          <>
            <Skeleton className="w-40 h-4 my-1" />
            <Skeleton className="w-44 h-4 my-1" />
          </>
        ) : (
          <>
            <h2 className="text-base font-semibold lg:px-2 max-w-[200px] truncate overflow-hidden">
              {currentUser?.firstName} {currentUser?.lastName}
            </h2>
            <p className="text-sm text-muted-foreground lg:px-2 max-w-[200px] truncate overflow-hidden">
              {currentUser?.jobTitle}
            </p>
          </>
        )}
      </div>
      <div className="w-full flex sm:flex-col lg:p-3 lg:pt-0">
        {menuItems.map(({ title, href, icon: Icon }, index) => (
          <Button
            key={title}
            variant="ghost"
            className={cn(
              "flex items-center justify-start gap-2 w-full py-1 px-3 hover:bg-secondary relative",
              index === 0
                ? "lg:rounded-tl-lg lg:rounded-tr-lg lg:rounded-b-none"
                : index === menuItems.length - 1
                  ? "lg:rounded-bl-lg lg:rounded-br-lg lg:rounded-t-none"
                  : "lg:rounded-none",
              index !== menuItems.length - 1 && "lg:border-b"
            )}
            title={title}
            asChild
          >
            <Link
              href={href}
              className="flex items-center justify-center lg:justify-start w-full"
            >
              <div className="relative">
                <Icon className="size-[17px]" />
                {title === "Notifications" && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </div>
              <span className="hidden lg:inline text-xs">{title}</span>
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
