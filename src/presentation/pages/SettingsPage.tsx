import { SettingsInstallSection } from '@/presentation/pages/SettingsInstallSection'
import { DailySadhanaReminderCard } from '@/presentation/components/shared/DailySadhanaReminderCard'

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your app and notification preferences.</p>
      </div>

      <DailySadhanaReminderCard />

      <SettingsInstallSection />
    </div>
  )
}
