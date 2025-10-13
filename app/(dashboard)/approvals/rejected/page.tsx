import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getApprovalsByStatus } from "@/lib/actions/title-movement-actions"
import { ApprovalStatus } from "@prisma/client"
import { XCircle, FileText, User, Calendar, AlertTriangle } from "lucide-react"

async function RejectedRequestsList() {
  const rejections = await getApprovalsByStatus(ApprovalStatus.REJECTED)

  if (rejections.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No rejected requests</h3>
          <p className="text-muted-foreground text-center">
            No title movement requests have been rejected.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {rejections.map((rejection) => (
        <Card key={rejection.id} className="border-red-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {rejection.property.titleNumber}
              </CardTitle>
              <Badge className="bg-red-100 text-red-800 border-red-200">
                <XCircle className="h-4 w-4 mr-1" />
                Rejected
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Requested by:</span>
                  <span>{rejection.initiatedBy.firstName} {rejection.initiatedBy.lastName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Property:</span>
                  <span>{rejection.property.titleNumber}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Rejected:</span>
                  <span>{rejection.updatedAt ? new Date(rejection.updatedAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Rejected by:</span>
                  <span>{rejection.approvedBy ? `${rejection.approvedBy.firstName} ${rejection.approvedBy.lastName}` : 'System'}</span>
                </div>
              </div>
            </div>
            {rejection.rejectedReason && (
              <div className="mt-4 pt-4 border-t border-red-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                    <p className="text-sm text-red-700 mt-1">{rejection.rejectedReason}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function RejectedRequestsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Rejected Requests</h2>
          <p className="text-muted-foreground">
            View all rejected title movement requests
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <RejectedRequestsList />
      </Suspense>
    </div>
  )
}