import * as React from "react";
import { cn } from "@/lib/utils/cn";

type AvatarSize = "sm" | "md" | "lg";

type AvatarProps = React.HTMLAttributes<HTMLDivElement> & {
  name: string;
  src?: string | null;
  size?: AvatarSize;
};

const avatarStyles = {
  base: "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-900 font-semibold text-white",
  image: "h-full w-full object-cover",
  sizes: {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  } satisfies Record<AvatarSize, string>,
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export function Avatar({
  name,
  src,
  size = "md",
  className,
  ...props
}: AvatarProps) {
  const initials = getInitials(name);

  return (
    <div
      className={cn(avatarStyles.base, avatarStyles.sizes[size], className)}
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className={avatarStyles.image} />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
