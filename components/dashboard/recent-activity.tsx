'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Activity, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  LogIn, 
  LogOut,
  FileText,
  Building2,
  Receipt,
  TrendingUp,
  CheckSquare,
  User
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface RecentActivityProps {
  activities: Array<{
    id: string
    action: string
    entityType: string
    entityId: string
    description: string
    user: {
      firstName: string
      lastName: string
    }
    createdAt: Date
  }>
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const getActionIcon = (action: string) => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      CREATE: Plus,
      UPDATE: Edit,
      DELETE: Trash2,
      APPROVE: Check,
      REJECT: X,
      LOGIN: LogIn,
      LOGOUT: LogOut,
      READ: FileText
    }
    return iconMap[action] || Activity
  }

  const getEntityIcon = (entityType: string) => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      Property: Building2,
      RealPropertyTax: Receipt,
      TitleMovement: TrendingUp,
      ApprovalWorkflow: CheckSquare,
      User: User
    }
    return iconMap[entityType] || FileText
  }

  const getActionColor = (action: string) => {
    const colorMap: Record<string, string> = {
      CREATE: 'text-green-600 bg-green-50 border-green-200',
      UPDATE: 'text-blue-600 bg-blue-50 border-blue-200',
      DELETE: 'text-red-600 bg-red-50 border-red-200',
      APPROVE: 'text-green-600 bg-green-50 border-green-200',
      REJECT: 'text-red-600 bg-red-50 border-red-200',
      LOGIN: 'text-gray-600 bg-gray-50 border-gray-200',
      LOGOUT: 'text-gray-600 bg-gray-50 border-gray-200'
    }
    return colorMap[action] || 'text-gray-600 bg-gray-50 border-gray-200'
  }

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity, index) => {
          const ActionIcon = getActionIcon(activity.action)
          const EntityIcon = getEntityIcon(activity.entityType)
          
          return (
            <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border">
              <div className="flex-shrink-0">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {getUserInitials(activity.user.firstName, activity.user.lastName)}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium">
                    {activity.user.firstName} {activity.user.lastName}
                  </p>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getActionColor(activity.action)}`}
                  >
                    <ActionIcon className="h-3 w-3 mr-1" />
                    {activity.action.toLowerCase()}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-2">
                  <EntityIcon className="h-3 w-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {activity.description}
                  </p>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          )
        })}
        
        {activities.length === 0 && (
          <div className="text-center py-8">
            <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No recent activity to display
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}