import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AuditAction } from "@prisma/client"
import { 
  User, 
  Calendar,
  Monitor,
  MapPin,
  Database,
  Activity,
  FileText
} from "lucide-react"

interface AuditLogDetailProps {
  log: {
    id: string
    action: AuditAction
    entityType: string
    entityId: string
    changes: Record<string, unknown> | null
    metadata: Record<string, unknown> | null
    ipAddress: string | null
    userAgent: string | null
    createdAt: Date
    user: {
      id: string
      firstName: string
      lastName: string
      email: string
      role: {
        name: string
      }
    }
  }
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

export function AuditLogDetail({ log }: AuditLogDetailProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Audit Log Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Action</label>
              <Badge className={getActionColor(log.action)}>
                {log.action.replace('_', ' ')}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Entity Type</label>
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span>{log.entityType}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Entity ID</label>
              <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                {log.entityId}
              </code>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(log.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* User Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              User Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <span>{log.user.firstName} {log.user.lastName}</span>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <span>{log.user.email}</span>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Role</label>
                <Badge variant="outline">{log.user.role.name}</Badge>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">User ID</label>
                <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                  {log.user.id}
                </code>
              </div>
            </div>
          </div>

          <Separator />

          {/* Session Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Session Information
            </h3>
            <div className="space-y-4">
              {log.ipAddress && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    IP Address
                  </label>
                  <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                    {log.ipAddress}
                  </code>
                </div>
              )}
              
              {log.userAgent && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    User Agent
                  </label>
                  <div className="p-3 bg-muted rounded text-sm font-mono break-all">
                    {log.userAgent}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Changes and Metadata */}
          {(log.changes || log.metadata) && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Additional Data
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {log.changes && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Changes</label>
                      <div className="text-xs bg-muted p-4 rounded overflow-x-auto max-h-96">
                        <pre>{JSON.stringify(log.changes, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                  
                  {log.metadata && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Metadata</label>
                      <div className="text-xs bg-muted p-4 rounded overflow-x-auto max-h-96">
                        <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}