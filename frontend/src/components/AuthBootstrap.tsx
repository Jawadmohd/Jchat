import type { ReactNode } from "react";
import { useGetMeQuery } from "../features/auth/authApi";
import { useAuth } from "../hooks/useAuth";

interface AuthBootstrapProps {
  children: ReactNode;
}

export default function AuthBootstrap({ children }: AuthBootstrapProps) {
  const { isLoading } = useGetMeQuery();
  const { isInitializing } = useAuth();

  if (isInitializing || isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-primary text-secondary">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-secondary/15 border-t-secondary" />
        <p className="text-sm text-muted">Loading...</p>
      </div>
    );
  }

  return children;
}
