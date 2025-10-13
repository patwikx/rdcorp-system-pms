import { Suspense } from "react"
import { MyRequestsStatsWrapper } from "@/components/approvals/my-requests-stats-wrapper"
import { MyRequestsStatsSkeleton } from "@/components/approvals/my-requests-stats-skeleton"
import { MyRequestsListWrapper } from "@/components/approvals/my-requests-list-wrapper"



export default function MyRequestsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Requests</h2>
        <p className="text-muted-foreground">
          View the status of your approval requests
        </p>
      </div>

      <Suspense fallback={<MyRequestsStatsSkeleton />}>
        <MyRequestsStatsWrapper />
      </Suspense>

      <Suspense fallback={<div>Loading...</div>}>
        <MyRequestsListWrapper />
      </Suspense>
    </div>
  )
}