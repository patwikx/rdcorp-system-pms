import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getProfileStats } from "@/lib/actions/profile-actions"
import { 
  Activity, 
  Building, 
  TrendingUp,
  Calendar,
  CheckSquare
} from "lucide-react"

interface ProfileStatsProps {
  userId: string
}

export async function ProfileStats({ userId }: ProfileStatsProps) {
  const stats = await getProfileStats(userId)

  const statItems = [
    {
      label: "Properties Created",
      value: stats.propertiesCreated,
      icon: Building,
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
    },
    {
      label: "Title Movements",
      value: stats.titleMovements,
      icon: TrendingUp,
      color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
    },
    {
      label: "Approvals Made",
      value: stats.approvalsMade,
      icon: CheckSquare,
      color: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
    },
    {
      label: "System Activities",
      value: stats.auditLogs,
      icon: Activity,
      color: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {statItems.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${item.color}`}>
                <item.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">Total count</p>
              </div>
            </div>
            <Badge variant="secondary" className="font-mono">
              {item.value}
            </Badge>
          </div>
        ))}
        
        <div className="pt-4 border-t">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Member since {new Date(stats.memberSince).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}