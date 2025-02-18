"use client";

import Image from "next/image";
import { useState } from "react";
import { useQuery } from "convex/react";
import { Edit, User } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function UserPage() {
  const currentUser = useQuery(api.users.currentUser);
  const [avatarLoading, setAvatarLoading] = useState(true);

  return (
    <section className="w-full min-w-0 space-y-5 bg-card border rounded-lg">
      <div className="relative h-48 sm:h-56 w-full rounded-tl-lg rounded-tr-lg bg-gradient-to-r from-indigo-500/20 to-primary/20">
        {currentUser ? (
          <Image
            src="/cover-image-placeholder.png"
            alt="Cover image"
            fill
            className="object-cover transition-all duration-300 rounded-tl-lg rounded-tr-lg"
          />
        ) : (
          <Skeleton className="h-48 sm:h-56 w-full rounded-tl-lg rounded-tr-lg" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card/90 to-card/20" />
      </div>
      <div className="px-5">
        <div className="relative inline-block -mt-20 sm:-mt-28 z-10">
          <div className="relative h-24 w-24 sm:h-32 sm:w-32 md:h-40 md:w-40 flex items-center justify-center rounded-full border-4 border-card bg-muted">
            {currentUser ? (
              currentUser.imageUrl ? (
                <>
                  {avatarLoading && (
                    <Skeleton className="absolute inset-0 rounded-full" />
                  )}
                  <Image
                    src={currentUser.imageUrl}
                    alt="Profile"
                    width={160}
                    height={160}
                    className="w-full h-full rounded-full object-cover"
                    onLoad={() => setAvatarLoading(false)}
                    style={{
                      opacity: avatarLoading ? 0 : 1,
                      transition: "opacity 0.5s ease-in-out",
                    }}
                  />
                </>
              ) : (
                <span className="text-3xl font-semibold text-muted-foreground">
                  {currentUser.firstName?.[0]}
                  {currentUser.lastName?.[0]}
                </span>
              )
            ) : (
              <Skeleton className="h-full w-full rounded-full" />
            )}
          </div>
        </div>
      </div>
      <div className="mt-5 px-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              {currentUser ? (
                <>
                  {currentUser.firstName} {currentUser.lastName}
                </>
              ) : (
                <Skeleton className="h-8 w-64" />
              )}
            </h1>
            {currentUser ? (
              <p className="mt-2 text-base sm:text-lg text-muted-foreground">
                Frontend Developer
              </p>
            ) : (
              <Skeleton className="h-6 w-48 mt-2" />
            )}
          </div>
          {currentUser ? (
            <Button variant="outline" className="gap-2 px-5 py-3 sm:py-5">
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
          ) : (
            <Skeleton className="h-10 w-32" />
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
          {currentUser ? (
            <>
              <StatCard icon={<Edit />} value="120" label="Posts" />
              <StatCard icon={<User />} value="28.2K" label="Followers" />
              <StatCard icon={<User />} value="1.3K" label="Following" />
            </>
          ) : (
            <>
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </>
          )}
        </div>
        <div className="rounded-lg border bg-card/50 p-4 sm:p-6 my-5">
          <h2 className="text-lg font-semibold text-foreground/90">
            {currentUser ? "Bio" : <Skeleton className="h-6 w-24" />}
          </h2>
          {currentUser ? (
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              Capturing life's moments through the lens 🎨 Photography
              enthusiast creating visual stories ✨ Sharing tips & tricks 📸
              #Photography #CreativeJourney
            </p>
          ) : (
            <>
              <Skeleton className="h-4 w-full mt-2" />
              <Skeleton className="h-4 w-5/6 mt-2" />
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-all hover:bg-accent/50">
      <div className="rounded-full bg-primary/10 p-3 text-primary">{icon}</div>
      <div>
        <div className="text-xl sm:text-2xl font-bold">{value}</div>
        <div className="text-xs sm:text-sm text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
