import { useEffect, useState } from "react";
import { MOBILE_LAYOUT_QUERY } from "../utils/isMobileLayout";

export function useIsMobileChatView() {
  const [isMobileChatView, setIsMobileChatView] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia(MOBILE_LAYOUT_QUERY).matches
      : false
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_LAYOUT_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobileChatView(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isMobileChatView;
}
