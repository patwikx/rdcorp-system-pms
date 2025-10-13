import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { AuditLogsList } from "@/components/audit-logs/audit-logs-list"
import { AuditLogsFilters } from "@/components/audit-logs/audit-logs-filters"
import { Download } from "lucide-react"

interface AuditLogsPageProps {
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

export default function AuditLogsPage({ searchParams }: AuditLogsPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            Track all system activities and changes for compliance and security
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </Button>
      </div>

      <AuditLogsFilters />

      <Suspense fallback={<div>Loading audit logs...</div>}>
        <AuditLogsList searchParams={searchParams} />
      </Suspense>
    </div>
  )
}