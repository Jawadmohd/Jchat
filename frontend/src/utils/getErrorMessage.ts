interface FetchBaseQueryError {
  status?: number | string;
  data?: {
    message?: string;
  };
}

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    typeof (error as FetchBaseQueryError).data?.message === "string"
  ) {
    return (error as FetchBaseQueryError).data!.message!;
  }

  return fallback;
};
