import { Suspense } from "react"
import { TitleMovementsList } from "@/components/title-movements/title-movements-list"
import { TitleMovementsFilters } from "@/components/title-movements/title-movements-filters"
import { TitleMovementsStatsWrapper } from "@/components/title-movements/title-movements-stats-wrapper"
import { TitleMovementsStatsSkeleton } from "@/components/title-movements/title-movements-stats-skeleton"

interface TitleMovementsPageProps {
  searchParams: Promise<{
    propertyId?: string
    status?: string
    search?: string
    page?: string
  }>
}

export default function TitleMovementsPage({ searchParams }: TitleMovementsPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Title Movements</h1>
        <p className="text-muted-foreground">
          Track and manage property title movements and transfers
        </p>
      </div>

      <Suspense fallback={<TitleMovementsStatsSkeleton />}>
        <TitleMovementsStatsWrapper />
      </Suspense>

      <TitleMovementsFilters />

      <Suspense fallback={<div>Loading title movements...</div>}>
        <TitleMovementsList searchParams={searchParams} />
      </Suspense>
    </div>
  )
}