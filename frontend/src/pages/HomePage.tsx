import ChatsView from "../components/chat/ChatsView";
import NavRail from "../components/chat/NavRail";
import SettingsPanel from "../components/chat/SettingsPanel";
import StatusPanel from "../components/chat/StatusPanel";
import { ChatUIProvider } from "../contexts/ChatUIProvider";
import { useChatUI } from "../hooks/useChatUI";

function HomePageContent() {
  const { activeTab, isLoggingOut, hideMobileNav, handleTabChange, handleLogout } = useChatUI();

  return (
    <div className="flex h-screen overflow-hidden bg-primary text-secondary">
      <NavRail
        activeTab={activeTab}
        onTabChange={handleTabChange}
        hideOnMobile={hideMobileNav}
      />

      <div
        className={`flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row ${
          hideMobileNav ? "pb-0" : "pb-[72px]"
        } lg:pb-0`}
      >
        {activeTab === "chats" && <ChatsView />}

        {activeTab === "status" && (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <StatusPanel />
          </div>
        )}

        {activeTab === "settings" && (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <SettingsPanel onLogout={handleLogout} isLoggingOut={isLoggingOut} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <ChatUIProvider>
      <HomePageContent />
    </ChatUIProvider>
  );
}
