export const MOBILE_LAYOUT_QUERY = "(max-width: 1023px)";

export const isMobileLayout = () =>
  typeof window !== "undefined" && window.matchMedia(MOBILE_LAYOUT_QUERY).matches;
