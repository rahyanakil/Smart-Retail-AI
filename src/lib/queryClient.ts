import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: (failureCount, error) => {
        const status =
          (error as { response?: { status?: number } })?.response?.status ??
          (error as { status?: number }).status;
        // Never retry auth errors, not-found, or rate limits
        if (status === 401) return false;
        if (status === 403) return false;
        if (status === 404) return false;
        if (status === 429) return false;  // never burn extra Gemini quota retrying
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
