'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { BarChart3, PieChart, TrendingUp } from 'lucide-react'
import type { DashboardStats } from '@/lib/actions/dashboard-actions'

interface DashboardOverviewProps {
  stats: DashboardStats
}

export function DashboardOverview({ stats }: DashboardOverviewProps) {
  // Calculate percentages for property classifications
  const totalProperties = stats.properties.total
  const classificationData = stats.properties.byClassification.map(item => ({
    ...item,
    percentage: totalProperties > 0 ? (item.count / totalProperties) * 100 : 0
  }))

  // Get status colors
  const getClassificationColor = (classification: string) => {
    const colors: Record<string, string> = {
      COMMERCIAL: 'bg-blue-500',
      RESIDENTIAL: 'bg-green-500',
      INDUSTRIAL: 'bg-purple-500',
      AGRICULTURAL: 'bg-yellow-500',
      MIXED_USE: 'bg-orange-500',
      INSTITUTIONAL: 'bg-red-500'
    }
    return colors[classification] || 'bg-gray-500'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-500',
      DUE: 'bg-orange-500',
      OVERDUE: 'bg-red-500',
      PAID: 'bg-green-500',
      PARTIALLY_PAID: 'bg-blue-500',
      RELEASED: 'bg-blue-500',
      IN_TRANSIT: 'bg-yellow-500',
      RECEIVED: 'bg-orange-500',
      RETURNED: 'bg-green-500'
    }
    return colors[status] || 'bg-gray-500'
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Property Classifications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base font-semibold">Property Classifications</CardTitle>
          <PieChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-4">
          {classificationData.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {item.classification.replace('_', ' ')}
                </span>
                <span className="text-muted-foreground">
                  {item.count} ({Math.round(item.percentage)}%)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getClassificationColor(item.classification)}`} />
                <Progress value={item.percentage} className="flex-1 h-2" />
              </div>
            </div>
          ))}
          {classificationData.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No property data available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tax Status Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base font-semibold">Tax Status Overview</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Total Due</p>
              <p className="text-2xl font-bold text-red-600">
                ₱{stats.taxes.totalDue.toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">
                ₱{stats.taxes.totalPaid.toLocaleString()}
              </p>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            {stats.taxes.byStatus.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(item.status)}`} />
                  <span className="text-sm font-medium">
                    {item.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{item.count}</p>
                  <p className="text-xs text-muted-foreground">
                    ₱{item.totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Title Movement Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base font-semibold">Title Movement Status</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Currently Out</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.titleMovements.currentlyOut}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Overdue Returns</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.titleMovements.overdue}
              </p>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            {stats.titleMovements.byStatus.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(item.status)}`} />
                  <span className="text-sm font-medium">
                    {item.status.replace('_', ' ')}
                  </span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {item.count}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Properties */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base font-semibold">Recently Added Properties</CardTitle>
          <Badge variant="outline">{stats.properties.recentlyAdded.length}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.properties.recentlyAdded.map((property, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="space-y-1">
                <p className="text-sm font-medium">{property.titleNumber}</p>
                <p className="text-xs text-muted-foreground">
                  {property.registeredOwner}
                </p>
              </div>
              <div className="text-right space-y-1">
                <Badge variant="outline" className="text-xs">
                  {property.classification.replace('_', ' ')}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {new Date(property.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
          {stats.properties.recentlyAdded.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent properties added
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}