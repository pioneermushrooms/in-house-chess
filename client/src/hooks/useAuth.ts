import { trpc } from "@/lib/trpc";

export function useAuth() {
  const { data: user, isLoading: loading } = trpc.auth.me.useQuery();
  
  return {
    user: user ?? null,
    loading,
    isAuthenticated: !!user,
  };
}
