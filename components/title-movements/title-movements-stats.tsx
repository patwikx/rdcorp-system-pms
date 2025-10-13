"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MovementStatus } from "@prisma/client"
import { 
  FileText, 
  Truck, 
  CheckCircle, 
  RotateCcw, 
  AlertTriangle, 
  Clock 
} from "lucide-react"

interface MovementStats {
  status: MovementStatus
  count: number
}

interface TitleMovementsStatsProps {
  stats: MovementStats[]
  totalMovements: number
}

// Status configuration with icons and colors - matching title returns aesthetics
const statusConfig = {
  [MovementStatus.RELEASED]: {
    icon: FileText,
    label: "Released",
    color: "text-blue-600",
    description: "Currently released"
  },
  [MovementStatus.IN_TRANSIT]: {
    icon: Truck,
    label: "In Transit",
    color: "text-amber-600",
    description: "Being transferred"
  },
  [MovementStatus.RECEIVED]: {
    icon: CheckCircle,
    label: "Received",
    color: "text-purple-600",
    description: "Successfully received"
  },
  [MovementStatus.RETURNED]: {
    icon: RotateCcw,
    label: "Returned",
    color: "text-green-600",
    description: "Back in custody"
  },
  [MovementStatus.LOST]: {
    icon: AlertTriangle,
    label: "Lost",
    color: "text-red-600",
    description: "Missing titles"
  },
  [MovementStatus.PENDING_RETURN]: {
    icon: Clock,
    label: "Pending Return",
    color: "text-orange-600",
    description: "Awaiting return"
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function TitleMovementsStats({ stats, totalMovements }: TitleMovementsStatsProps) {
  // Create a map for quick lookup
  const statsMap = new Map(stats.map(stat => [stat.status, stat.count]))

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {Object.entries(statusConfig).map(([status, config]) => {
        const count = statsMap.get(status as MovementStatus) || 0
        const Icon = config.icon

        return (
          <Card key={status}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{config.label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${config.color}`}>
                {count.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {config.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}