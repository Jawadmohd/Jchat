const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";
const serverBaseUrl = apiBaseUrl.replace(/\/api\/?$/, "");

export const getAvatarUrl = (avatarUrl?: string | null): string | null => {
  if (!avatarUrl) {
    return null;
  }

  if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
    return avatarUrl;
  }

  return `${serverBaseUrl}${avatarUrl}`;
};
