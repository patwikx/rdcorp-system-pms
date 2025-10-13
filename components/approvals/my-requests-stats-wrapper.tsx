import { MyRequestsStats } from "./my-requests-stats"
import { getMyApprovalRequestStats } from "@/lib/actions/approval-actions"

export async function MyRequestsStatsWrapper() {
  const { stats, totalRequests } = await getMyApprovalRequestStats()
  
  return <MyRequestsStats stats={stats} totalRequests={totalRequests} />
}