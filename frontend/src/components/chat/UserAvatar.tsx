import { getAvatarUrl } from "../../utils/getAvatarUrl";
import { getInitials } from "../../utils/getInitials";

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  showOnline?: boolean;
}

const sizeClasses = {
  sm: "h-10 w-10 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-24 w-24 text-3xl",
};

const dotSizeClasses = {
  sm: "h-2.5 w-2.5 border-2",
  md: "h-3 w-3 border-2",
  lg: "h-4 w-4 border-[3px]",
};

export default function UserAvatar({
  name,
  avatarUrl = null,
  size = "md",
  className = "",
  showOnline = false,
}: UserAvatarProps) {
  const imageUrl = getAvatarUrl(avatarUrl);

  const avatar = imageUrl ? (
    <img
      src={imageUrl}
      alt={`${name}'s profile`}
      className={`shrink-0 rounded-full object-cover ${sizeClasses[size]} ${className}`}
    />
  ) : (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-secondary font-semibold text-primary ${sizeClasses[size]} ${className}`}
    >
      {getInitials(name)}
    </div>
  );

  if (!showOnline) {
    return avatar;
  }

  return (
    <div className="relative shrink-0">
      {avatar}
      <span
        className={`absolute bottom-0 right-0 rounded-full border-tertiary bg-green-500 ${dotSizeClasses[size]}`}
      />
    </div>
  );
}
