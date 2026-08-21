import { useInstallPrompt } from '@/application/pwa/use-install-prompt'
import { Button } from '@/presentation/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/presentation/components/ui/card'

// A calm, single entry point — not a nagging banner shown on every
// visit. Hidden entirely once already installed, and on browsers that
// neither fire beforeinstallprompt nor are iOS Safari (nothing useful to
// offer there).
export function SettingsInstallSection() {
  const { canInstall, isStandalone, isIOS, promptInstall } = useInstallPrompt()

  if (isStandalone) return null
  if (!canInstall && !isIOS) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Install app</CardTitle>
        <CardDescription>
          Install Sadhana Connect on this device for quicker access.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {canInstall ? (
          <Button onClick={() => void promptInstall()}>Install app</Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            On iPhone/iPad: tap the Share icon in Safari, then choose
            &quot;Add to Home Screen.&quot;
          </p>
        )}
      </CardContent>
    </Card>
  )
}
