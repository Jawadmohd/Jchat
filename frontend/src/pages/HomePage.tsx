import ChatsView from "../components/chat/ChatsView";
import NavRail from "../components/chat/NavRail";
import SettingsPanel from "../components/chat/SettingsPanel";
import StatusPanel from "../components/chat/StatusPanel";
import { ChatUIProvider } from "../contexts/ChatUIProvider";
import { useChatUI } from "../hooks/useChatUI";

function HomePageContent() {
  const { activeTab, isLoggingOut, hideMobileNav, handleTabChange, handleLogout } = useChatUI();

  return (
    <div className="flex h-dvh overflow-hidden bg-primary text-secondary lg:flex-row">
      <NavRail activeTab={activeTab} onTabChange={handleTabChange} variant="desktop" />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row">
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

        {!hideMobileNav && (
          <NavRail activeTab={activeTab} onTabChange={handleTabChange} variant="mobile" />
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
