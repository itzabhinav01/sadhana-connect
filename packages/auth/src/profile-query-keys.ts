// A userId-scoped key is the mechanism that prevents stale-profile
// leakage across accounts: switching users changes the key, so TanStack
// Query never serves one user's cached profile under another's session.
export const profileQueryKeys = {
  all: ['profile'] as const,
  detail: (userId: string | null) => ['profile', userId] as const,
}
