import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getRecentActivity } from "@/lib/actions/profile-actions"
import { 
  Activity, 
  Database,
  Eye,
  Settings,
  Shield,
  CheckSquare,
  FolderOpen
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { AuditAction } from "@prisma/client"

interface ProfileActivityProps {
  userId: string
}

// Action icons mapping
const actionIcons = {
  [AuditAction.CREATE]: Database,
  [AuditAction.READ]: Eye,
  [AuditAction.UPDATE]: Settings,
  [AuditAction.DELETE]: Database,
  [AuditAction.LOGIN]: Shield,
  [AuditAction.LOGOUT]: Shield,
  [AuditAction.APPROVE]: CheckSquare,
  [AuditAction.REJECT]: CheckSquare,
  [AuditAction.EXPORT]: FolderOpen,
  [AuditAction.IMPORT]: FolderOpen,
  [AuditAction.RESTORE]: Database,
  [AuditAction.BULK_UPDATE]: Settings,
}

function getActionColor(action: AuditAction) {
  switch (action) {
    case AuditAction.CREATE:
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
    case AuditAction.UPDATE:
    case AuditAction.BULK_UPDATE:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
    case AuditAction.DELETE:
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
    case AuditAction.LOGIN:
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
    case AuditAction.LOGOUT:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    case AuditAction.APPROVE:
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
    case AuditAction.REJECT:
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
    case AuditAction.EXPORT:
    case AuditAction.IMPORT:
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400"
    case AuditAction.READ:
      return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400"
    case AuditAction.RESTORE:
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
  }
}

export async function ProfileActivity({ userId }: ProfileActivityProps) {
  const activities = await getRecentActivity(userId)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-6">
            <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity: {
              id: string
              action: AuditAction
              entityType: string
              createdAt: Date
            }) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {(() => {
                    const ActionIcon = actionIcons[activity.action as keyof typeof actionIcons] || Activity
                    return (
                      <div className="p-1.5 rounded-lg bg-muted">
                        <ActionIcon className="h-3 w-3" />
                      </div>
                    )
                  })()}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getActionColor(activity.action)}`}
                    >
                      {activity.action.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {activity.entityType}
                    </span>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}