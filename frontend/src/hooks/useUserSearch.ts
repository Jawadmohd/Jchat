import { useMemo } from "react";
import { useSearchUsersQuery } from "../features/auth/authApi";
import { useDebouncedValue } from "./useDebouncedValue";

interface UseUserSearchOptions {
  excludeIds?: string[];
  limit?: number;
}

export function useUserSearch(search: string, options: UseUserSearchOptions = {}) {
  const { excludeIds = [], limit = 20 } = options;
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const hasSearchQuery = debouncedSearch.length > 0;

  const { data: users = [], isLoading, isFetching } = useSearchUsersQuery(
    { search: debouncedSearch, limit },
    { skip: !hasSearchQuery }
  );

  const filteredUsers = useMemo(() => {
    if (excludeIds.length === 0) {
      return users;
    }

    const excluded = new Set(excludeIds);
    return users.filter((user) => !excluded.has(user.id));
  }, [users, excludeIds]);

  return {
    users: filteredUsers,
    isLoading: hasSearchQuery && (isLoading || isFetching),
    hasSearchQuery: search.trim().length > 0,
    isSearching: hasSearchQuery,
  };
}
