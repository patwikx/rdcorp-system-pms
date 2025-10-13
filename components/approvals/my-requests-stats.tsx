"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ApprovalStatus } from "@prisma/client"
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Calendar
} from "lucide-react"

interface MyRequestStats {
  status: ApprovalStatus
  count: number
}

interface MyRequestsStatsProps {
  stats: MyRequestStats[]
  totalRequests: number
}

// Status configuration with icons and colors - matching title returns aesthetics
const statusConfig = {
  [ApprovalStatus.PENDING]: {
    icon: Clock,
    label: "Pending",
    color: "text-amber-600",
    description: "Awaiting approval"
  },
  [ApprovalStatus.APPROVED]: {
    icon: CheckCircle,
    label: "Approved",
    color: "text-green-600",
    description: "Successfully approved"
  },
  [ApprovalStatus.REJECTED]: {
    icon: XCircle,
    label: "Rejected",
    color: "text-red-600",
    description: "Request denied"
  },
  [ApprovalStatus.CANCELLED]: {
    icon: AlertCircle,
    label: "Cancelled",
    color: "text-gray-600",
    description: "Request cancelled"
  },
  [ApprovalStatus.EXPIRED]: {
    icon: Calendar,
    label: "Expired",
    color: "text-orange-600",
    description: "Request expired"
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function MyRequestsStats({ stats, totalRequests }: MyRequestsStatsProps) {
  // Create a map for quick lookup
  const statsMap = new Map(stats.map(stat => [stat.status, stat.count]))

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {Object.entries(statusConfig).map(([status, config]) => {
        const count = statsMap.get(status as ApprovalStatus) || 0
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