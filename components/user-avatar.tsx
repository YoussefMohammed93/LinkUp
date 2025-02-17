import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Loader } from "lucide-react";

interface UserAvatarProps {
  avatarUrl: string | null | undefined;
  firstName?: string;
  lastName?: string;
  size?: number;
  className?: string;
}

export default function UserAvatar({
  avatarUrl,
  firstName,
  lastName,
  size = 48,
  className,
}: UserAvatarProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const hasImage = Boolean(avatarUrl);

  return (
    <div
      className={cn(
        "relative flex items-center justify-center flex-none rounded-full bg-secondary",
        className
      )}
      style={{ width: size, height: size }}
    >
      {!isLoaded && (
        <Loader
          className="absolute animate-spin text-muted-foreground"
          size={size / 2}
        />
      )}

      {hasImage ? (
        <Image
          src={avatarUrl || ""}
          alt="User avatar"
          layout="fill"
          className={cn(
            "rounded-full object-cover transition-opacity duration-500 ease-in-out",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoadingComplete={() => setIsLoaded(true)}
          onError={() => setIsLoaded(true)}
        />
      ) : (
        <span className="text-xl font-semibold text-muted-foreground">
          {firstName?.[0]}
          {lastName?.[0]}
        </span>
      )}
    </div>
  );
}
