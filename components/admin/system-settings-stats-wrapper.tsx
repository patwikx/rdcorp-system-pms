import { SystemSettingsStats } from "./system-settings-stats"
import { getSystemConfigStats } from "@/lib/actions/system-config-actions"

export async function SystemSettingsStatsWrapper() {
  const stats = await getSystemConfigStats()
  
  return <SystemSettingsStats stats={stats} />
}