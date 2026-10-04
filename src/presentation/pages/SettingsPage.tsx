import { Code2, ExternalLink } from 'lucide-react'

import { Button } from '@/presentation/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/presentation/components/ui/card'
import { SettingsInstallSection } from '@/presentation/pages/SettingsInstallSection'
import { DailySadhanaReminderCard } from '@/presentation/components/shared/DailySadhanaReminderCard'

export const GITHUB_REPO_URL = 'https://github.com/itzabhinav01/sadhana-connect'

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your app and notification preferences.</p>
      </div>

      <DailySadhanaReminderCard />

      <SettingsInstallSection />

      <Card className="overflow-hidden border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3.5">
            <img
              src="/logo.png"
              alt="Sadhana Connect Logo"
              className="size-14 shrink-0 rounded-2xl border border-primary/25 bg-primary/5 p-1 object-contain shadow-xs"
            />
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg">About Sadhana Connect</CardTitle>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  v1.0.0
                </span>
                <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  Open Source
                </span>
              </div>
              <CardDescription>
                Daily Sadhana tracking, Japa meditation counter, mentor guidance, and AI-assisted spiritual analytics.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
                <Code2 className="size-5" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-foreground">
                  Official GitHub Repository
                </span>
                <span className="text-xs text-muted-foreground">
                  github.com/itzabhinav01/sadhana-connect
                </span>
              </div>
            </div>
            <Button asChild size="sm" variant="outline" className="shrink-0">
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-1.5 size-3.5" aria-hidden="true" />
                View on GitHub
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
