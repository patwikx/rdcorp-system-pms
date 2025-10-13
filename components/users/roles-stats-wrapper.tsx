import { RolesStats } from "./roles-stats"
import { getRoleStats } from "@/lib/actions/role-actions"

export async function RolesStatsWrapper() {
  const stats = await getRoleStats()
  
  return <RolesStats stats={stats} />
}