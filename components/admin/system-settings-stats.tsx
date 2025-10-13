"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  CheckCircle, 
  XCircle,
  Clock,
  Database
} from "lucide-react"

interface SystemConfigStats {
  totalConfigs: number
  activeConfigs: number
  inactiveConfigs: number
  recentlyUpdated: number
}

interface SystemSettingsStatsProps {
  stats: SystemConfigStats
}

export function SystemSettingsStats({ stats }: SystemSettingsStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Settings</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {stats.totalConfigs.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            All system configurations
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Settings</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats.activeConfigs.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Currently enabled
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Inactive Settings</CardTitle>
          <XCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {stats.inactiveConfigs.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Currently disabled
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recently Updated</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {stats.recentlyUpdated.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Updated this week
          </p>
        </CardContent>
      </Card>
    </div>
  )
}