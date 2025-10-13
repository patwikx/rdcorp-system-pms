import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PreferencesForm } from "@/components/profile/preferences-form"

export default async function PreferencesPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/sign-in")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Preferences</h1>
          <p className="text-muted-foreground">
            Customize your application settings and preferences
          </p>
        </div>
      </div>

      <PreferencesForm userId={session.user.id} />
    </div>
  )
}