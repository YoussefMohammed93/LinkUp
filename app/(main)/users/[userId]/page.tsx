"use client";

import Image from "next/image";
import { toast } from "sonner";
import { Post } from "@/components/post";
import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useEdgeStore } from "@/lib/edgestore";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation } from "convex/react";
import { Edit, Loader2, Upload } from "lucide-react";
import PeopleSidebar from "@/components/people-sidebar";
import FollowListDialog from "@/components/user-list-dialog";
import { EditProfileDialog } from "@/components/edit-profile-dialog";

function formatCount(count: number): string {
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + "K";
  }
  return count.toString();
}

export default function UserPage() {
  const { edgestore } = useEdgeStore();
  const updateUser = useMutation(api.users.updateUser);

  const { userId: id } = useParams();
  const userId = id as string;

  const user = useQuery(api.users.getUserById, { id: userId as Id<"users"> });
  const currentUser = useQuery(api.users.currentUser);
  const isOwner = currentUser && user && currentUser._id === user._id;

  const isFollowing = useQuery(
    api.follows.isFollowing,
    currentUser && user
      ? { followerId: currentUser._id, followingId: user._id }
      : "skip"
  );

  const isFollowedBy = useQuery(
    api.follows.isFollowedBy,
    currentUser && user
      ? { followerId: user._id, followingId: currentUser._id }
      : "skip"
  );

  const followersCount = useQuery(
    api.follows.getFollowersCount,
    user ? { userId: user._id } : "skip"
  );

  const followingCount = useQuery(
    api.follows.getFollowingCount,
    user ? { userId: user._id } : "skip"
  );

  const followUserMutation = useMutation(api.follows.followUser);
  const unfollowUserMutation = useMutation(api.follows.unfollowUser);
  const updateUserMutation = useMutation(api.users.updateUser);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [avatarLoading, setAvatarLoading] = useState(true);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [followersDialogOpen, setFollowersDialogOpen] = useState(false);
  const [followingDialogOpen, setFollowingDialogOpen] = useState(false);

  const handleToggleFollow = async () => {
    try {
      if (!user) {
        toast.error("User not found.");
        return;
      }

      if (isFollowing === true) {
        await unfollowUserMutation({ targetUserId: user._id });
        toast.success(
          `You have unfollowed ${user.firstName} ${user.lastName || ""}!`
        );
      } else {
        await followUserMutation({ targetUserId: user._id });
        toast.success(
          `You are now following ${user.firstName} ${user.lastName || ""}!`
        );
        if (audioRef.current) {
          audioRef.current
            .play()
            .catch((err) => console.error("Audio playback failed:", err));
        }
      }
    } catch (error) {
      toast.error(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const handleImageUpload = async (type: "cover" | "profile", file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const res = await edgestore.publicFiles.upload({
        file,
        options: {
          replaceTargetUrl:
            type === "cover"
              ? (currentUser?.coverImageUrl ?? undefined)
              : (currentUser?.imageUrl ?? undefined),
        },
        onProgressChange: (progress: number) => {
          setUploadProgress(progress);
        },
      });

      await updateUser({
        updates: {
          [type === "cover" ? "coverImageUrl" : "imageUrl"]: res.url,
        },
      });

      toast.success(
        `${type.charAt(0).toUpperCase() + type.slice(1)} image updated!`
      );
    } catch (error) {
      toast.error(
        `Failed to upload: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const userPosts = useQuery(api.posts.getUserPosts, {
    userId: user?._id as Id<"users">,
  });

  const handleDeletePost = async (postId: string) => {
    console.log("Deleting post:", postId);
  };

  return (
    <>
      <section className="w-full min-w-0 space-y-5 my-5">
        <div className="w-full bg-card border rounded-lg">
          <div className="relative h-48 sm:h-64 w-full rounded-tl-lg rounded-tr-lg group">
            {user ? (
              user.coverImageUrl ? (
                <>
                  <Image
                    src={user.coverImageUrl}
                    alt="Cover image"
                    fill
                    className="object-cover transition-all duration-300 rounded-tl-lg rounded-tr-lg"
                  />
                  {isOwner && (
                    <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-tl-lg rounded-tr-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          e.target.files?.[0] &&
                          handleImageUpload("cover", e.target.files[0])
                        }
                        className="hidden"
                        id="cover-upload"
                        disabled={isUploading}
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          document.getElementById("cover-upload")?.click()
                        }
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <span className="flex items-center gap-2">
                            Uploading {uploadProgress}%{" "}
                            <Loader2 className="animate-spin h-4 w-4" />
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Edit /> Change Cover
                          </span>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-muted relative rounded-tl-lg rounded-tr-lg">
                  <Image
                    src="/cover-image-placeholder.png"
                    alt="Cover placeholder"
                    fill
                    className="object-cover rounded-tl-lg rounded-tr-lg"
                  />
                  {isOwner && (
                    <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-tl-lg rounded-tr-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          e.target.files?.[0] &&
                          handleImageUpload("cover", e.target.files[0])
                        }
                        className="hidden"
                        id="cover-upload"
                        disabled={isUploading}
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          document.getElementById("cover-upload")?.click()
                        }
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          "Uploading..."
                        ) : (
                          <span className="flex items-center gap-2">
                            <Upload /> Upload Cover
                          </span>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )
            ) : (
              <Skeleton className="h-48 sm:h-64 w-full rounded-tl-lg rounded-tr-lg rounded-b-none" />
            )}
          </div>
          <div className="px-5">
            <div className="relative inline-block -mt-20 sm:-mt-28 z-10">
              <div className="relative h-24 w-24 sm:h-32 sm:w-32 md:h-40 md:w-40 flex items-center justify-center rounded-full border-4 border-card bg-muted group">
                {user ? (
                  user.imageUrl ? (
                    <>
                      {avatarLoading && (
                        <Skeleton className="absolute inset-0 rounded-full" />
                      )}
                      <Image
                        src={user.imageUrl}
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
                      {isOwner && (
                        <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              e.target.files?.[0] &&
                              handleImageUpload("profile", e.target.files[0])
                            }
                            className="hidden"
                            id="profile-upload"
                            disabled={isUploading}
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            title="Change profile image"
                            onClick={() =>
                              document.getElementById("profile-upload")?.click()
                            }
                            disabled={isUploading}
                            className="rounded-full p-2"
                          >
                            {isUploading ? (
                              <div className="flex items-center gap-1">
                                <span className="text-xs">
                                  {uploadProgress}%
                                </span>
                                <Loader2 className="animate-spin h-4 w-4" />
                              </div>
                            ) : (
                              <Edit className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="text-3xl font-semibold text-muted-foreground">
                        {user.firstName?.[0]}
                        {user.lastName?.[0]}
                      </span>
                      {isOwner && (
                        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              e.target.files?.[0] &&
                              handleImageUpload("profile", e.target.files[0])
                            }
                            className="hidden"
                            id="profile-upload"
                            disabled={isUploading}
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              document.getElementById("profile-upload")?.click()
                            }
                            disabled={isUploading}
                            className="rounded-full p-2"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </>
                  )
                ) : (
                  <Skeleton className="h-full w-full rounded-full" />
                )}
              </div>
            </div>
          </div>
          <div className="mt-5 px-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {user ? (
                    <>
                      {user.firstName} {user.lastName}
                    </>
                  ) : (
                    <Skeleton className="h-10 w-64 mt-1" />
                  )}
                </h1>
                {user ? (
                  isOwner && (
                    <p className="mt-2 text-base sm:text-lg text-muted-foreground">
                      {user.jobTitle || "Add your job title here!"}
                    </p>
                  )
                ) : (
                  <Skeleton className="mt-2 h-6 w-48" />
                )}
              </div>
              {user ? (
                isOwner ? (
                  <EditProfileDialog
                    isOpen={isEditOpen}
                    onOpenChange={setIsEditOpen}
                    initialData={{
                      firstName: user.firstName,
                      lastName: user.lastName,
                      jobTitle: user.jobTitle,
                      bio: user.bio,
                    }}
                    onSave={async (data) => {
                      const updates = {
                        firstName: data.firstName,
                        lastName: data.lastName,
                        jobTitle: data.jobTitle,
                        bio: data.bio,
                      };
                      const promise = updateUserMutation({ updates });
                      toast.promise(promise, {
                        loading: "Saving changes...",
                        success: "Profile updated successfully!",
                        error: (error) =>
                          `Update failed: ${
                            error instanceof Error
                              ? error.message
                              : "Unknown error"
                          }`,
                      });
                      await promise;
                    }}
                  >
                    <Button
                      variant="outline"
                      className="gap-2 px-5 py-3 sm:py-5 shadow-none"
                    >
                      <Edit className="h-4 w-4" /> Edit Profile
                    </Button>
                  </EditProfileDialog>
                ) : typeof isFollowing === "undefined" ? (
                  <Skeleton className="h-10 w-[140px]" />
                ) : (
                  <Button
                    className="gap-1 px-4 py-3 sm:py-4 shadow-none"
                    onClick={handleToggleFollow}
                  >
                    {isFollowing
                      ? "Unfollow"
                      : isFollowedBy
                        ? "Follow Back"
                        : "Follow"}
                  </Button>
                )
              ) : (
                <Skeleton className="h-10 w-[140px]" />
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
              {userPosts !== undefined ? (
                <div className="flex items-center gap-4 rounded-lg border bg-secondary/50 p-4 transition-all hover:bg-accent/50">
                  <div className="rounded-full bg-primary/10 p-3 text-primary">
                    <Edit />
                  </div>
                  <div>
                    <div className="text-xl font-bold">{userPosts.length}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Posts
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 rounded-lg border bg-secondary/50 p-4">
                  <div className="rounded-full bg-primary/10 p-3 text-primary">
                    <Skeleton className="h-6 w-6" />
                  </div>
                  <div>
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-4 w-20 mt-1" />
                  </div>
                </div>
              )}
              {followersCount !== undefined ? (
                <div
                  role="button"
                  onClick={() => setFollowersDialogOpen(true)}
                  className="flex items-center gap-4 rounded-lg border bg-secondary/50 p-4 transition-all hover:bg-accent/50"
                >
                  <div className="rounded-full bg-primary/10 p-3 text-primary">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="size-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xl font-bold">
                      {formatCount(followersCount.length)}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Followers
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 rounded-lg border bg-secondary/50 p-4">
                  <div className="rounded-full bg-primary/10 p-3 text-primary">
                    <Skeleton className="h-6 w-6" />
                  </div>
                  <div>
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-4 w-20 mt-1" />
                  </div>
                </div>
              )}
              {followingCount !== undefined ? (
                <div
                  role="button"
                  onClick={() => setFollowingDialogOpen(true)}
                  className="flex items-center gap-4 rounded-lg border bg-secondary/50 p-4 transition-all hover:bg-accent/50"
                >
                  <div className="rounded-full bg-primary/10 p-3 text-primary">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="size-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xl font-bold">
                      {formatCount(followingCount.length)}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Following
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 rounded-lg border bg-secondary/50 p-4">
                  <div className="rounded-full bg-primary/10 p-3 text-primary">
                    <Skeleton className="h-6 w-6" />
                  </div>
                  <div>
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-4 w-20 mt-1" />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="rounded-lg border p-4 sm:p-6 my-5 bg-secondary/50 mx-5">
            <h2 className="text-lg font-semibold text-foreground/90">
              {user ? "Bio" : <Skeleton className="h-6 w-24" />}
            </h2>
            {user ? (
              <p className="mt-2 text-sm sm:text-base text-muted-foreground break-words whitespace-pre-wrap">
                {user.bio || "No bio yet"}
              </p>
            ) : (
              <div className="mt-2 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            )}
          </div>
        </div>
        <section className="w-full space-y-5 my-10">
          <h2 className="text-2xl font-bold mb-5">
            {user ? (
              `${user.firstName} ${user.lastName}'s Posts`
            ) : (
              <Skeleton className="h-6 w-80 border" />
            )}
          </h2>
          {userPosts ? (
            userPosts.length > 0 ? (
              userPosts.map((post) => (
                <Post
                  key={post._id}
                  post={{
                    ...post,
                    authorImage: post.authorImageUrl || "/default-avatar.png",
                    images: post.images || [],
                  }}
                  onDelete={handleDeletePost}
                />
              ))
            ) : (
              <p>
                {isOwner
                  ? "You haven't posted anything yet."
                  : "This user hasn't posted anything yet."}
              </p>
            )
          ) : (
            <div className="space-y-6 pb-5">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="border rounded-lg p-4 bg-card">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-full bg-secondary" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 rounded w-3/4 bg-secondary" />
                      <Skeleton className="h-4 rounded w-1/2 bg-secondary" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Skeleton className="h-4 rounded bg-secondary" />
                    <Skeleton className="h-4 rounded w-5/6 bg-secondary" />
                    <Skeleton className="h-4 rounded w-2/3 bg-secondary" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        <audio ref={audioRef} preload="auto">
          <source src="/audio.m4a" type="audio/mp4" />
          <source src="/audio.mp3" type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
        {user && (
          <>
            <FollowListDialog
              open={followersDialogOpen}
              onOpenChange={setFollowersDialogOpen}
              userId={user._id}
              type="followers"
            />
            <FollowListDialog
              open={followingDialogOpen}
              onOpenChange={setFollowingDialogOpen}
              userId={user._id}
              type="following"
            />
          </>
        )}
      </section>
      <PeopleSidebar />
    </>
  );
}
