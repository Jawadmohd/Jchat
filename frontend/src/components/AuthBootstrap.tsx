import type { ReactNode } from "react";
import { useGetMeQuery } from "../features/auth/authApi";
import { useAuth } from "../hooks/useAuth";
import { E2EEProvider } from "../contexts/E2EEContext";
import { useSocketConnection } from "../hooks/useSocketConnection";

interface AuthBootstrapProps {
  children: ReactNode;
}

function AuthBootstrapContent({ children }: AuthBootstrapProps) {
  const { isLoading } = useGetMeQuery();
  const { isInitializing } = useAuth();

  useSocketConnection();

  const isBootstrapping = isInitializing || isLoading;

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-primary text-secondary">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-secondary/15 border-t-secondary" />
        <p className="text-sm text-muted">Loading...</p>
      </div>
    );
  }

  return children;
}

export default function AuthBootstrap({ children }: AuthBootstrapProps) {
  return (
    <E2EEProvider>
      <AuthBootstrapContent>{children}</AuthBootstrapContent>
    </E2EEProvider>
  );
}
