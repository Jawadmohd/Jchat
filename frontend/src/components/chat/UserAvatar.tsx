import { getAvatarUrl } from "../../utils/getAvatarUrl";
import { getInitials } from "../../utils/getInitials";

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-10 w-10 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-24 w-24 text-3xl",
};

export default function UserAvatar({
  name,
  avatarUrl = null,
  size = "md",
  className = "",
}: UserAvatarProps) {
  const imageUrl = getAvatarUrl(avatarUrl);

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={`${name}'s profile`}
        className={`shrink-0 rounded-full object-cover ${sizeClasses[size]} ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-secondary font-semibold text-primary ${sizeClasses[size]} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
