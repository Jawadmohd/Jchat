import { useAppSelector } from "../app/hooks";

export const useAuth = () => {
  const { user, isAuthenticated, isInitializing } = useAppSelector(
    (state) => state.auth
  );

  return {
    user,
    isAuthenticated,
    isInitializing,
  };
};
