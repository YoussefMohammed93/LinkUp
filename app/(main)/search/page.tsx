"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { Loader } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSearchParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import PeopleSidebar from "@/components/people-sidebar";

export type User = {
  _id: Id<"users">;
  email: string;
  clerkUserId: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  imageUrl?: string;
  bio?: string;
  lastActiveAt?: number;
  coverImageUrl?: string | null;
};

function SearchUsersContent({ q }: { q: string }) {
  const users = useQuery(api.users.searchUsers, { query: q });

  if (users === undefined) {
    return null;
  }

  return (
    <>
      <div className="w-full min-w-0 space-y-5 my-5">
        <h1 className="text-center text-2xl font-bold mb-4">
          Search Results for &quot;{q}&quot;
        </h1>
        {users.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No users found matching &quot;{q}&quot;
          </p>
        ) : (
          <div>
            {users.map((user) => (
              <Link
                key={user._id.toString()}
                href={`/users/${user._id}`}
                className="flex items-center gap-3 border-b pb-3 hover:bg-muted transition-colors p-2 rounded-none"
              >
                <Image
                  src={user.imageUrl || "/avatar-placeholder.png"}
                  alt={`${user.firstName || user.email}'s avatar`}
                  width={48}
                  height={48}
                  className="rounded-full object-cover"
                />
                <div>
                  <h3 className="text-base font-semibold">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {user.jobTitle || ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <PeopleSidebar />
    </>
  );
}

function SearchUsersFallback() {
  return (
    <>
      <div className="w-full min-w-0 space-y-5 my-5">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Loader className="animate-spin text-primary" />
          <h1 className="text-center text-2xl font-bold">
            Loading search results...
          </h1>
        </div>
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 border-b pb-3 hover:bg-muted transition-colors p-2 rounded-none"
          >
            <Skeleton className="h-12 w-12 rounded-full" />
            <div>
              <Skeleton className="h-4 w-36 rounded-lg" />
              <Skeleton className="h-3 w-24 rounded-lg mt-1" />
            </div>
          </div>
        ))}
      </div>
      <PeopleSidebar />
    </>
  );
}

function SearchUsersContentWrapper() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  return <SearchUsersContent q={q} />;
}

export default function SearchUsersPage() {
  return (
    <Suspense fallback={<SearchUsersFallback />}>
      <SearchUsersContentWrapper />
    </Suspense>
  );
}
