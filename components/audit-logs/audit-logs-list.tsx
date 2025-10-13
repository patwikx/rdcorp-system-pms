import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getAuditLogs } from "@/lib/actions/audit-log-actions"
import { AuditAction } from "@prisma/client"
import { 
  Eye, 
  User, 
  Calendar,
  Monitor,
  MapPin,
  FileText,
  Activity,
  Shield,
  Database,
  Settings,
  Building,
  Receipt,
  TrendingUp,
  CheckSquare,
  FolderOpen
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

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

// Entity type icons mapping
const entityTypeIcons = {
  Property: Building,
  TitleMovement: TrendingUp,
  RealPropertyTax: Receipt,
  ApprovalWorkflow: CheckSquare,
  User: User,
  PropertyDocument: FileText,
}

interface AuditLogsListProps {
  searchParams: Promise<{
    search?: string
    action?: string
    entityType?: string
    userId?: string
    dateFrom?: string
    dateTo?: string
    page?: string
  }>
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

function getEntityTypeColor(entityType: string) {
  switch (entityType) {
    case "Property":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
    case "TitleMovement":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
    case "RealPropertyTax":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
    case "ApprovalWorkflow":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
    case "User":
      return "bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400"
    case "PropertyDocument":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
  }
}

export async function AuditLogsList({ searchParams }: AuditLogsListProps) {
  const resolvedSearchParams = await searchParams
  const page = parseInt(resolvedSearchParams.page || "1")
  const search = resolvedSearchParams.search
  const action = resolvedSearchParams.action as AuditAction | undefined
  const entityType = resolvedSearchParams.entityType
  const userId = resolvedSearchParams.userId
  const dateFrom = resolvedSearchParams.dateFrom
  const dateTo = resolvedSearchParams.dateTo

  const { auditLogs, totalCount, totalPages } = await getAuditLogs({
    search,
    action,
    entityType,
    userId,
    dateFrom,
    dateTo,
    page,
    limit: 20,
  })

  if (auditLogs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Activity className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No audit logs found</h3>
          <p className="text-muted-foreground text-center">
            {search || action || entityType || userId || dateFrom || dateTo
              ? "No audit logs match your current filters."
              : "No audit logs have been recorded yet."}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {auditLogs.length} of {totalCount} audit logs
        </p>
      </div>

      <div className="space-y-4">
        {auditLogs.map((log) => (
          <Card key={log.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex-shrink-0">
                    {(() => {
                      const ActionIcon = actionIcons[log.action] || Activity
                      return (
                        <div className="p-2 rounded-lg bg-muted">
                          <ActionIcon className="h-5 w-5" />
                        </div>
                      )
                    })()}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className={getActionColor(log.action)}>
                        {log.action.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className={getEntityTypeColor(log.entityType)}>
                        <div className="flex items-center space-x-1">
                          {(() => {
                            const EntityIcon = entityTypeIcons[log.entityType as keyof typeof entityTypeIcons] || Database
                            return <EntityIcon className="h-3 w-3" />
                          })()}
                          <span>{log.entityType}</span>
                        </div>
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {log.user.firstName} {log.user.lastName}
                        </span>
                        <span className="text-muted-foreground">({log.user.email})</span>
                        <Badge variant="outline" className="text-xs">
                          {log.user.role.name}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Entity ID:</span>
                        <code className="px-2 py-1 bg-muted rounded text-xs font-mono">
                          {log.entityId}
                        </code>
                      </div>
                      
                      {log.ipAddress && (
                        <div className="flex items-center space-x-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">IP Address:</span>
                          <code className="px-2 py-1 bg-muted rounded text-xs font-mono">
                            {log.ipAddress}
                          </code>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                        </span>
                        <span className="text-muted-foreground">
                          ({new Date(log.createdAt).toLocaleString()})
                        </span>
                      </div>
                      
                      {log.userAgent && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground truncate max-w-md">
                            {log.userAgent}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {(log.changes || log.metadata) && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {log.changes && (
                            <div>
                              <h4 className="text-sm font-medium mb-2">Changes</h4>
                              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                                {JSON.stringify(log.changes, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.metadata && (
                            <div>
                              <h4 className="text-sm font-medium mb-2">Metadata</h4>
                              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex-shrink-0 ml-4">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
            const pageNum = i + 1
            const isCurrentPage = pageNum === page
            
            return (
              <Button
                key={pageNum}
                variant={isCurrentPage ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link
                  href={{
                    pathname: "/audit-logs",
                    query: { 
                      ...(search && { search }),
                      ...(action && { action }),
                      ...(entityType && { entityType }),
                      ...(userId && { userId }),
                      ...(dateFrom && { dateFrom }),
                      ...(dateTo && { dateTo }),
                      page: pageNum.toString() 
                    },
                  }}
                >
                  {pageNum}
                </Link>
              </Button>
            )
          })}
          
          {totalPages > 10 && page < totalPages - 5 && (
            <>
              <span className="px-2">...</span>
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={{
                    pathname: "/audit-logs",
                    query: { 
                      ...(search && { search }),
                      ...(action && { action }),
                      ...(entityType && { entityType }),
                      ...(userId && { userId }),
                      ...(dateFrom && { dateFrom }),
                      ...(dateTo && { dateTo }),
                      page: totalPages.toString() 
                    },
                  }}
                >
                  {totalPages}
                </Link>
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}