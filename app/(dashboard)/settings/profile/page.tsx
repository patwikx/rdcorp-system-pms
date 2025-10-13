import { Suspense } from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ProfileForm } from "@/components/profile/profile-form"
import { ProfileStats } from "@/components/profile/profile-stats"
import { ProfileActivity } from "@/components/profile/profile-activity"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default async function ProfilePage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/sign-in")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Form - Takes 2 columns */}
        <div className="lg:col-span-2">
          <ProfileForm user={session.user} />
        </div>

        {/* Stats and Activity - Takes 1 column */}
        <div className="space-y-6">
          <Suspense fallback={<ProfileStatsSkeleton />}>
            <ProfileStats userId={session.user.id} />
          </Suspense>
          
          <Suspense fallback={<ProfileActivitySkeleton />}>
            <ProfileActivity userId={session.user.id} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

function ProfileStatsSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProfileActivitySkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}