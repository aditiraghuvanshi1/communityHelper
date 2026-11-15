// Session-aware hooks. Auth state itself lives in the httpOnly cookie; this just
// asks the backend who we are and shares the answer through TanStack Query.
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "./api";
import type { User } from "./types";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet<User | null>("/auth/me"),
    staleTime: 60_000,
    retry: false,
  });
}
