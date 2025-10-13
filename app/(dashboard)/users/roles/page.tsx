import { Suspense } from "react"
import { RolesStatsWrapper } from "@/components/users/roles-stats-wrapper"
import { RolesStatsSkeleton } from "@/components/users/roles-stats-skeleton"
import { RolesFilters } from "@/components/users/roles-filters"
import { RolesListWrapper } from "@/components/users/roles-list-wrapper"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface RolesPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    type?: string
    page?: string
  }>
}

export default function RolesPage({ searchParams }: RolesPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-2">
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-muted-foreground">
            Manage user roles and their permissions
          </p>
        </div>
        <Button asChild>
          <Link href="/users/roles/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Role
          </Link>
        </Button>
      </div>

      <Suspense fallback={<RolesStatsSkeleton />}>
        <RolesStatsWrapper />
      </Suspense>

      <RolesFilters />

      <Suspense fallback={<div>Loading roles...</div>}>
        <RolesListWrapper searchParams={searchParams} />
      </Suspense>
    </div>
  )
}