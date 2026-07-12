import { getInitials } from "../../utils/getInitials";

interface GroupAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-10 w-10 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-24 w-24 text-3xl",
};

export default function GroupAvatar({
  name,
  size = "md",
  className = "",
}: GroupAvatarProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full border border-secondary/10 bg-primary font-semibold text-secondary ${sizeClasses[size]} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
