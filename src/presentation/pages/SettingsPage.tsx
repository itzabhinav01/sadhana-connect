import { SettingsInstallSection } from '@/presentation/pages/SettingsInstallSection'

// Otherwise a placeholder foundation route — the real settings feature
// is a later phase. SettingsInstallSection is the one real piece of
// functionality here (Phase 18).
export function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Settings are coming soon.</p>
      </div>
      <SettingsInstallSection />
    </div>
  )
}
