import { SettingsNavigation } from "@/components/profile/settings-navigation"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      <SettingsNavigation />
      {children}
    </div>
  )
}