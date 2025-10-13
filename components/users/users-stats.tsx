"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield,
  Calendar
} from "lucide-react"

interface UserStats {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  roleStats: Array<{
    roleName: string
    count: number
  }>
  recentUsers: number
}

interface UsersStatsProps {
  stats: UserStats
}

export function UsersStats({ stats }: UsersStatsProps) {
  const topRoles = stats.roleStats.slice(0, 3) // Show top 3 roles

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {stats.totalUsers.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            All system users
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats.activeUsers.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Currently active
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
          <UserX className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {stats.inactiveUsers.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Deactivated accounts
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Users</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {stats.recentUsers.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Added this month
          </p>
        </CardContent>
      </Card>

      {topRoles.map((role, index) => (
        <Card key={role.roleName}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{role.roleName}</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              index === 0 ? 'text-orange-600' : 
              index === 1 ? 'text-cyan-600' : 'text-indigo-600'
            }`}>
              {role.count.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Users with this role
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}