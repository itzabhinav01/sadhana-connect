import { useAuth } from '@/application/auth/use-auth'

export function HomePage() {
  const { session } = useAuth()

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold text-foreground">
        Welcome to Sadhana Connect
      </h1>
      <p className="text-muted-foreground">
        Signed in as {session?.email ?? 'unknown user'}
      </p>
    </div>
  )
}
