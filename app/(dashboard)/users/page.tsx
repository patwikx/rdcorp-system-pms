import { Suspense } from "react"
import { UsersStatsWrapper } from "@/components/users/users-stats-wrapper"
import { UsersStatsSkeleton } from "@/components/users/users-stats-skeleton"
import { UsersFilters } from "@/components/users/users-filters"
import { UsersListWrapper } from "@/components/users/users-list-wrapper"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

interface UsersPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    role?: string
    department?: string
    page?: string
  }>
}

export default function UsersPage({ searchParams }: UsersPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage system users and their access
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/users/roles">
              Manage Roles
            </Link>
          </Button>
          <Button asChild>
            <Link href="/users/create">
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={<UsersStatsSkeleton />}>
        <UsersStatsWrapper />
      </Suspense>

      <UsersFilters />

      <Suspense fallback={<div>Loading users...</div>}>
        <UsersListWrapper searchParams={searchParams} />
      </Suspense>
    </div>
  )
}