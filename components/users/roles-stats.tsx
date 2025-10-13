"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Shield, 
  ShieldCheck, 
  ShieldX, 
  Lock,
  Users,
  Settings
} from "lucide-react"

interface RoleStats {
  totalRoles: number
  activeRoles: number
  inactiveRoles: number
  systemRoles: number
  totalUsers: number
  totalPermissions: number
}

interface RolesStatsProps {
  stats: RoleStats
}

export function RolesStats({ stats }: RolesStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {stats.totalRoles.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            All system roles
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Roles</CardTitle>
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats.activeRoles.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Currently active
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Inactive Roles</CardTitle>
          <ShieldX className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {stats.inactiveRoles.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Deactivated roles
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">System Roles</CardTitle>
          <Lock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {stats.systemRoles.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Protected roles
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {stats.totalUsers.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Users with roles
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Permissions</CardTitle>
          <Settings className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-cyan-600">
            {stats.totalPermissions.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Available permissions
          </p>
        </CardContent>
      </Card>
    </div>
  )
}