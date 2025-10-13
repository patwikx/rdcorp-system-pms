import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getApprovalWorkflowById } from "@/lib/actions/approval-actions"
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileText, 
  User, 
  Calendar,
  Building2,
  AlertTriangle
} from "lucide-react"


interface RequestDetailPageProps {
  params: Promise<{
    id: string
  }>
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'PENDING':
      return <Clock className="h-4 w-4" />
    case 'APPROVED':
      return <CheckCircle className="h-4 w-4" />
    case 'REJECTED':
      return <XCircle className="h-4 w-4" />
    case 'CANCELLED':
      return <XCircle className="h-4 w-4" />
    case 'EXPIRED':
      return <AlertTriangle className="h-4 w-4" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'PENDING':
      return "bg-yellow-600 text-white"
    case 'APPROVED':
      return "bg-green-600 text-white"
    case 'REJECTED':
      return "bg-red-600 text-white"
    case 'CANCELLED':
      return "bg-gray-600 text-white"
    case 'EXPIRED':
      return "bg-orange-600 text-white"
    default:
      return "bg-gray-600 text-white"
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'URGENT':
      return "bg-red-600 text-white"
    case 'HIGH':
      return "bg-orange-600 text-white"
    case 'NORMAL':
      return "bg-blue-600 text-white"
    case 'LOW':
      return "bg-gray-600 text-white"
    default:
      return "bg-gray-600 text-white"
  }
}

function formatWorkflowType(type: string) {
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}

export default async function RequestDetailPage({ params }: RequestDetailPageProps) {
  const { id } = await params
  const request = await getApprovalWorkflowById(id)

  if (!request) {
    notFound()
  }

  const proposedChanges = request.proposedChanges as { titleMovement?: Record<string, unknown> }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Request Details</h1>
          <p className="text-muted-foreground">
            View detailed information about your approval request
          </p>
        </div>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              {request.property.titleNumber} - {formatWorkflowType(request.workflowType)}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={getPriorityColor(request.priority)}>
                {request.priority}
              </Badge>
              <Badge className={getStatusColor(request.status)}>
                <div className="flex items-center gap-1">
                  {getStatusIcon(request.status)}
                  {request.status}
                </div>
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Request Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Submitted:</span>
                    <span>{new Date(request.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Requested by:</span>
                    <span>{request.initiatedBy.firstName} {request.initiatedBy.lastName}</span>
                  </div>
                  {request.initiatedBy.department && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Department:</span>
                      <span>{request.initiatedBy.department}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Approval Information</h3>
                <div className="space-y-2 text-sm">
                  {request.approvedBy ? (
                    <>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Processed by:</span>
                        <span>{request.approvedBy.firstName} {request.approvedBy.lastName}</span>
                      </div>
                      {request.approvedAt && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Processed on:</span>
                          <span>{new Date(request.approvedAt).toLocaleString()}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground">Awaiting approval</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Property Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Property Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Title Number</span>
                <p className="font-semibold">{request.property.titleNumber}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Registered Owner</span>
                <p className="font-semibold">{request.property.registeredOwner}</p>
              </div>
              {request.property.lotNumber && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Lot Number</span>
                  <p className="font-semibold">{request.property.lotNumber}</p>
                </div>
              )}
            </div>
            <div className="space-y-3">
              {request.property.location && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Location</span>
                  <p className="font-semibold">{request.property.location}</p>
                </div>
              )}
              {request.property.city && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">City</span>
                  <p className="font-semibold">{request.property.city}, {request.property.province}</p>
                </div>
              )}
              {request.property.classification && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Classification</span>
                  <p className="font-semibold">{request.property.classification.replace('_', ' ')}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Request Description */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Request Description
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{request.description}</p>
        </CardContent>
      </Card>

      {/* Proposed Changes */}
      {proposedChanges.titleMovement && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Proposed Changes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4">
              <pre className="text-sm overflow-x-auto">
                {JSON.stringify(proposedChanges.titleMovement, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rejection Reason */}
      {request.status === 'REJECTED' && request.rejectedReason && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Rejection Reason
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {request.rejectedReason}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}