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
import { Skeleton } from "./ui/skeleton";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";

const menuItems = [
  { title: "Home", href: "/", icon: Home },
  { title: "Profile", href: "/profile", icon: User },
  { title: "Messages", href: "/messages", icon: MessagesSquare },
  { title: "Bookmarks", href: "/bookmarks", icon: Bookmark },
  { title: "Notifications", href: "/notifications", icon: Bell },
];

interface MenuBarProps {
  className?: string;
}

export default function MenuBar({ className }: MenuBarProps) {
  const currentUser = useQuery(api.users.currentUser);
  const [avatarLoading, setAvatarLoading] = useState(true);

  return (
    <div className={className}>
      {/* Cover Section */}
      <div className="relative h-32 hidden lg:block rounded-t-xl">
        {currentUser === undefined ? (
          <Skeleton className="h-full w-full rounded-t-xl rounded-b-none animate-pulse" />
        ) : (
          <div
            className="h-full w-full bg-cover bg-center rounded-t-xl"
            style={{
              backgroundImage: currentUser?.coverImageUrl
                ? `url(${currentUser.coverImageUrl})`
                : "none",
            }}
          />
        )}

        {/* Avatar Section */}
        <div className="absolute -bottom-8 xl:-bottom-10 left-4">
          <div className="size-16 xl:size-20 rounded-full border-4 border-card bg-secondary flex items-center justify-center">
            {currentUser === undefined ? (
              <Loader className="animate-spin text-muted-foreground size-5" />
            ) : currentUser?.imageUrl ? (
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
          </div>
        </div>
      </div>

      {/* User Info Section */}
      <div className="pt-14 pb-5 px-4 hidden lg:block">
        {currentUser === undefined ? (
          <>
            <Skeleton className="w-40 h-4 my-1" />
            <Skeleton className="w-52 h-4 my-1" />
          </>
        ) : (
          <>
            <h2 className="text-base font-semibold lg:px-2">
              {currentUser?.firstName} {currentUser?.lastName}
            </h2>
            <p className="text-sm text-muted-foreground lg:px-2">
              {currentUser?.jobTitle}
            </p>
          </>
        )}
      </div>

      {/* Menu Items */}
      <div className="w-full flex sm:flex-col lg:p-3 lg:pt-0">
        {menuItems.map(({ title, href, icon: Icon }, index) => (
          <Button
            key={title}
            variant="ghost"
            className={cn(
              "flex items-center justify-start gap-2 w-full py-5 px-3",
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
              <Icon />
              <span className="hidden lg:inline">{title}</span>
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
