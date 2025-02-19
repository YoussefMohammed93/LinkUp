"use client";

import Image from "next/image";
import { toast } from "sonner";
import { useState } from "react";
import { Post } from "@/components/post";
import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useEdgeStore } from "@/lib/edgestore";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation } from "convex/react";
import { Edit, Loader2, Upload, User } from "lucide-react";
import { EditProfileDialog } from "@/components/edit-profile-dialog";

export default function UserPage() {
  const { edgestore } = useEdgeStore();
  const { userId: id } = useParams();

  const userId = id as string as Id<"users">;
  const user = useQuery(api.users.getUserById, { id: userId });
  const currentUser = useQuery(api.users.currentUser);
  const isOwner = currentUser?._id === userId;

  const userPosts = useQuery(api.posts.getUserPosts, { userId });

  const updateUser = useMutation(api.users.updateUser);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleImageUpload = async (type: "cover" | "profile", file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const res = await edgestore.publicFiles.upload({
        file,
        options: {
          replaceTargetUrl:
            type === "cover"
              ? (user?.coverImageUrl ?? undefined)
              : (user?.imageUrl ?? undefined),
        },
        onProgressChange: (progress) => {
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

  const handleDeletePost = async (postId: Id<"posts">) => {
    console.log("Deleting post:", postId);
  };

  return (
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
                  <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-tl-lg rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50">
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
                          <Loader2 className="animate-spin size-5" />
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
                  <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-tl-lg rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50">
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
                      <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50">
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
                          className={`rounded-full p-2 ${
                            isUploading ? "w-auto px-2" : "h-8 w-8"
                          }`}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs">{uploadProgress}%</span>
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
                      <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50">
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
                          className="rounded-full p-2 h-8 w-8"
                          disabled={isUploading}
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
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
                {user ? (
                  <>
                    {user.firstName} {user.lastName}
                  </>
                ) : (
                  <Skeleton className="h-8 w-64" />
                )}
              </h1>
              {isOwner && user && (
                <p className="mt-2 text-base sm:text-lg text-muted-foreground">
                  {user.jobTitle || "Add your job title here!"}
                </p>
              )}
            </div>
            {isOwner && user && (
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
                  try {
                    const updates = {
                      firstName: data.firstName,
                      lastName: data.lastName,
                      jobTitle: data.jobTitle,
                      bio: data.bio,
                    };

                    const promise = updateUser({ updates });

                    toast.promise(promise, {
                      loading: "Saving changes...",
                      success: "Profile updated successfully!",
                      error: (error) => `Update failed: ${error.message}`,
                    });

                    await promise;
                  } catch (error) {
                    console.error("Failed to update profile", error);
                  }
                }}
              >
                <Button
                  variant="outline"
                  className="gap-2 px-5 py-3 sm:py-5 shadow-none"
                >
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
              </EditProfileDialog>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
            {user ? (
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
        </div>
        <div
          className={`rounded-lg p-4 sm:p-6 my-5 bg-secondary/50 mx-5 ${
            user ? "border" : "bg-secondary"
          }`}
        >
          <h2 className="text-lg font-semibold text-foreground/90">
            {user ? "Bio" : <Skeleton className="h-6 w-24" />}
          </h2>
          {user ? (
            <p className="mt-2 text-sm sm:text-base text-muted-foreground break-words whitespace-pre-wrap">
              {user.bio || "No bio yet"}
            </p>
          ) : (
            <>
              <Skeleton className="h-4 w-full mt-2" />
              <Skeleton className="h-4 w-5/6 mt-2" />
            </>
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
            <p>No posts to display.</p>
          )
        ) : (
          <div className="space-y-6 pb-5">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="border border-[hsl(var(--border))] rounded-lg p-4 bg-card"
              >
                <div className="flex items-center space-x-4">
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
    <div className="flex items-center gap-4 rounded-lg border bg-secondary/50 p-4 transition-all hover:bg-accent/50">
      <div className="rounded-full bg-primary/10 p-3 text-primary">{icon}</div>
      <div>
        <div className="text-xl sm:text-2xl font-bold">{value}</div>
        <div className="text-xs sm:text-sm text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
