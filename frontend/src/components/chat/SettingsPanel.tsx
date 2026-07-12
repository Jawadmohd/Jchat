import { HiArrowLeftOnRectangle } from "react-icons/hi2";
import AccountSettingsForm from "./AccountSettingsForm";
import PasswordSettingsForm from "./PasswordSettingsForm";
import ProfilePictureSettings from "./ProfilePictureSettings";

interface SettingsPanelProps {
  onLogout: () => void;
  isLoggingOut: boolean;
}

export default function SettingsPanel({
  onLogout,
  isLoggingOut,
}: SettingsPanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-primary">
      <header className="shrink-0 border-b border-secondary/10 bg-tertiary px-4 py-4 md:px-6 lg:px-8">
        <h1 className="text-xl font-semibold text-secondary">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Manage your profile, account details, and password.
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-stretch lg:gap-6">
            <ProfilePictureSettings />
            <AccountSettingsForm />
            <div className="lg:col-span-2">
              <PasswordSettingsForm />
            </div>
          </div>

          <section className="mt-6 overflow-hidden rounded-2xl border border-secondary/10 lg:max-w-xs">
            <button
              type="button"
              onClick={onLogout}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm text-secondary transition hover:bg-tertiary disabled:opacity-60"
            >
              <HiArrowLeftOnRectangle className="h-5 w-5 text-muted" />
              {isLoggingOut ? "Logging out..." : "Log out"}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
