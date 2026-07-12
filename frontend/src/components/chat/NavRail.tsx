import {
  HiChatBubbleLeftRight,
  HiCog6Tooth,
  HiSignal,
} from "react-icons/hi2";

export type NavTab = "chats" | "status" | "settings";

interface NavItem {
  id: NavTab;
  label: string;
  icon: typeof HiChatBubbleLeftRight;
}

export const navItems: NavItem[] = [
  { id: "chats", label: "Chats", icon: HiChatBubbleLeftRight },
  { id: "status", label: "Status", icon: HiSignal },
  { id: "settings", label: "Settings", icon: HiCog6Tooth },
];

interface NavRailProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  hideOnMobile?: boolean;
}

export default function NavRail({
  activeTab,
  onTabChange,
  hideOnMobile = false,
}: NavRailProps) {
  return (
    <>
      {/* Large screens: narrow left rail */}
      <nav
        className="hidden h-full w-[68px] shrink-0 flex-col items-center border-r border-secondary/10 bg-secondary py-4 lg:flex"
        aria-label="Main navigation"
      >
        <div className="mb-6 flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-secondary">
          j
        </div>

        <div className="flex flex-1 flex-col items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                title={item.label}
                className={`rounded-xl p-3 transition ${
                  isActive
                    ? "bg-primary text-secondary"
                    : "text-primary/60 hover:bg-primary/10 hover:text-primary"
                }`}
              >
                <Icon className="h-6 w-6" />
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile & tablet: bottom navigation */}
      <nav
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-secondary/10 bg-primary px-2 pb-[env(safe-area-inset-bottom)] lg:hidden ${
          hideOnMobile ? "hidden" : "flex"
        }`}
        aria-label="Main navigation"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition ${
                isActive ? "text-secondary" : "text-muted"
              }`}
            >
              <Icon className={`h-6 w-6 ${isActive ? "text-secondary" : "text-muted"}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
