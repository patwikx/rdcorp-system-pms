import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getApprovalsByStatus } from "@/lib/actions/title-movement-actions"
import { ApprovalStatus } from "@prisma/client"
import { CheckCircle, FileText, User, Calendar } from "lucide-react"

async function ApprovedRequestsList() {
  const approvals = await getApprovalsByStatus(ApprovalStatus.APPROVED)

  if (approvals.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No approved requests</h3>
          <p className="text-muted-foreground text-center">
            No title movement requests have been approved yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {approvals.map((approval) => (
        <Card key={approval.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {approval.property.titleNumber}
              </CardTitle>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="h-4 w-4 mr-1" />
                Approved
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Requested by:</span>
                  <span>{approval.initiatedBy.firstName} {approval.initiatedBy.lastName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Property:</span>
                  <span>{approval.property.titleNumber}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Approved:</span>
                  <span>{approval.updatedAt ? new Date(approval.updatedAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Approved by:</span>
                  <span>{approval.approvedBy ? `${approval.approvedBy.firstName} ${approval.approvedBy.lastName}` : 'System'}</span>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function ApprovedRequestsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Approved Requests</h2>
          <p className="text-muted-foreground">
            View all approved title movement requests
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <ApprovedRequestsList />
      </Suspense>
    </div>
  )
}