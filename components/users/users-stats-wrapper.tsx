import { UsersStats } from "./users-stats"
import { getUserStats } from "@/lib/actions/user-actions"

export async function UsersStatsWrapper() {
  const stats = await getUserStats()
  
  return <UsersStats stats={stats} />
}