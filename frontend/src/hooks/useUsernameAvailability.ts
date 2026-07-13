import { useEffect, useState } from "react";
import { useLazyCheckUsernameAvailabilityQuery } from "../features/auth/authApi";
import { useDebouncedValue } from "./useDebouncedValue";

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,30}$/;

interface UseUsernameAvailabilityOptions {
  currentUsername?: string;
  enabled?: boolean;
}

export function useUsernameAvailability(
  username: string,
  options: UseUsernameAvailabilityOptions = {}
) {
  const { currentUsername, enabled = true } = options;
  const debouncedUsername = useDebouncedValue(username.trim(), 400);
  const [checkUsername, { isFetching }] = useLazyCheckUsernameAvailabilityQuery();
  const [available, setAvailable] = useState<boolean | null>(null);

  const isUnchanged = Boolean(
    currentUsername && debouncedUsername.toLowerCase() === currentUsername.toLowerCase()
  );
  const isValidFormat = USERNAME_PATTERN.test(debouncedUsername);
  const shouldCheck =
    enabled && debouncedUsername.length >= 3 && isValidFormat && !isUnchanged;

  useEffect(() => {
    if (!shouldCheck) {
      setAvailable(isUnchanged ? true : null);
      return;
    }

    let cancelled = false;

    void checkUsername({ username: debouncedUsername })
      .unwrap()
      .then((result) => {
        if (!cancelled) {
          setAvailable(result.available);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAvailable(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [checkUsername, debouncedUsername, shouldCheck, isUnchanged]);

  if (!enabled || debouncedUsername.length === 0) {
    return { status: "idle" as const, helperText: undefined, isChecking: false };
  }

  if (isUnchanged) {
    return {
      status: "available" as const,
      helperText: "This is your current username",
      isChecking: false,
    };
  }

  if (debouncedUsername.length < 3) {
    return {
      status: "invalid" as const,
      helperText: "Username must be at least 3 characters",
      isChecking: false,
    };
  }

  if (!isValidFormat) {
    return {
      status: "invalid" as const,
      helperText: "Use letters, numbers, and underscores only",
      isChecking: false,
    };
  }

  if (isFetching || available === null) {
    return {
      status: "checking" as const,
      helperText: "Checking availability...",
      isChecking: true,
    };
  }

  if (available) {
    return {
      status: "available" as const,
      helperText: "Username is available",
      isChecking: false,
    };
  }

  return {
    status: "taken" as const,
    helperText: "Username is already taken",
    isChecking: false,
  };
}
