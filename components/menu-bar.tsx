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
import { cn } from "@/lib/utils";
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

  return (
    <div className={className}>
      <div
        className="relative h-32 bg-cover bg-center hidden lg:block rounded-t-xl"
        style={{ backgroundImage: "url(/cover-image-placeholder.png)" }}
      >
        <div className="absolute -bottom-8 xl:-bottom-10 left-4">
          <div className="size-16 xl:size-20 rounded-full border-4 border-card bg-secondary flex items-center justify-center">
            {currentUser === undefined ? (
              <Loader className="animate-spin text-muted-foreground size-5" />
            ) : currentUser?.imageUrl ? (
              <img
                src={currentUser.imageUrl}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
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
      <div className="pt-14 pb-5 px-4 hidden lg:block">
        {currentUser === undefined ? (
          <>
            <Skeleton className="w-40 h-4 my-1" />
            <Skeleton className="w-52 h-4 my-1" />
          </>
        ) : (
          <>
            <h2 className="text-base font-semibold">
              {currentUser?.firstName} {currentUser?.lastName}
            </h2>
            <p className="text-sm text-muted-foreground">Frontend Developer</p>
          </>
        )}
      </div>
      {menuItems.map(({ title, href, icon: Icon }, index) => (
        <Button
          key={title}
          variant="ghost"
          className={cn(
            "flex items-center justify-start gap-2 w-full py-5",
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
  );
}
