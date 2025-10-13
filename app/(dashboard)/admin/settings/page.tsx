import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { SystemSettingsStats } from "@/components/admin/system-settings-stats"
import { SystemSettingsStatsSkeleton } from "@/components/admin/system-settings-stats-skeleton"
import { SystemSettingsFilters } from "@/components/admin/system-settings-filters"
import { SystemSettingsList } from "@/components/admin/system-settings-list"
import { getSystemConfigStats } from "@/lib/actions/system-config-actions"

interface SystemSettingsPageProps {
  searchParams: Promise<{
    search?: string
    category?: string
    status?: string
    page?: string
  }>
}

async function StatsWrapperComponent() {
  const stats = await getSystemConfigStats()
  return <SystemSettingsStats stats={stats} />
}

function StatsSkeletonComponent() {
  return <SystemSettingsStatsSkeleton />
}

function FiltersComponent() {
  return <SystemSettingsFilters />
}

function ListWrapperComponent({ searchParams }: { searchParams: Promise<{ search?: string; category?: string; status?: string; page?: string }> }) {
  return <SystemSettingsList searchParams={searchParams} />
}

export default function SystemSettingsPage({ searchParams }: SystemSettingsPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">
            Configure system-wide settings and parameters
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Setting
        </Button>
      </div>

      <Suspense fallback={<StatsSkeletonComponent />}>
        <StatsWrapperComponent />
      </Suspense>

      <FiltersComponent />

      <Suspense fallback={<div>Loading settings...</div>}>
        <ListWrapperComponent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}