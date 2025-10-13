import { TitleMovementsStats } from "./title-movements-stats"
import { getTitleMovementStats } from "@/lib/actions/title-movement-stats"

export async function TitleMovementsStatsWrapper() {
  const { stats, totalMovements } = await getTitleMovementStats()
  
  return <TitleMovementsStats stats={stats} totalMovements={totalMovements} />
}