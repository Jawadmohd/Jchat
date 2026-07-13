import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useUploadIdentityKeyMutation } from "../features/auth/authApi";
import { useAuth } from "../hooks/useAuth";
import { ensureIdentityKeys } from "../crypto/identity";
import { clearChatKeyCache } from "../crypto/chatKey";

interface E2EEContextValue {
  isReady: boolean;
  error: string | null;
}

const E2EEContext = createContext<E2EEContextValue>({ isReady: false, error: null });

export function E2EEProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [uploadIdentityKey] = useUploadIdentityKeyMutation();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bootstrappedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      bootstrappedUserIdRef.current = null;
      setIsReady(false);
      setError(null);
      return;
    }

    if (bootstrappedUserIdRef.current === user.id) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const { publicKeyJwk } = await ensureIdentityKeys(user.id);

        if (user.identityPublicKey !== publicKeyJwk) {
          clearChatKeyCache();
          await uploadIdentityKey({ identityPublicKey: publicKeyJwk }).unwrap();
        }

        if (!cancelled) {
          bootstrappedUserIdRef.current = user.id;
          setIsReady(true);
          setError(null);
        }
      } catch (bootstrapError) {
        if (!cancelled) {
          bootstrappedUserIdRef.current = null;
          setIsReady(false);
          setError(
            bootstrapError instanceof Error
              ? bootstrapError.message
              : "Failed to initialize encryption"
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, uploadIdentityKey, user?.id]);

  return <E2EEContext.Provider value={{ isReady, error }}>{children}</E2EEContext.Provider>;
}

export function useE2EE() {
  return useContext(E2EEContext);
}
