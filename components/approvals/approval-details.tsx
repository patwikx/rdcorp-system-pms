"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Building, 
  Calendar, 
  FileText, 
  AlertTriangle,
  Edit,
  Activity,
  RotateCcw,
  Trash2,
  MapPin,
  ArrowRight
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { approveWorkflow, rejectWorkflow } from "@/lib/actions/approval-actions"
import type { ApprovalWorkflowWithDetails } from "@/lib/actions/approval-actions"

interface ApprovalDetailsProps {
  approval: ApprovalWorkflowWithDetails
}

const workflowTypeIcons = {
  'PROPERTY_UPDATE': Edit,
  'TITLE_TRANSFER': Activity,
  'STATUS_CHANGE': RotateCcw,
  'OWNER_CHANGE': User,
  'ENCUMBRANCE_UPDATE': FileText,
  'LOCATION_UPDATE': Building,
  'DELETION': Trash2,
  'RESTORATION': RotateCcw,
}

const workflowTypeLabels = {
  'PROPERTY_UPDATE': 'Property Update',
  'TITLE_TRANSFER': 'Title Transfer',
  'STATUS_CHANGE': 'Status Change',
  'OWNER_CHANGE': 'Owner Change',
  'ENCUMBRANCE_UPDATE': 'Encumbrance Update',
  'LOCATION_UPDATE': 'Location Update',
  'DELETION': 'Deletion Request',
  'RESTORATION': 'Restoration Request',
}

const statusColors = {
  'PENDING': 'bg-amber-100 text-amber-800 border-amber-200',
  'APPROVED': 'bg-green-100 text-green-800 border-green-200',
  'REJECTED': 'bg-red-100 text-red-800 border-red-200',
  'CANCELLED': 'bg-gray-100 text-gray-800 border-gray-200',
  'EXPIRED': 'bg-purple-100 text-purple-800 border-purple-200',
}

const priorityColors = {
  'LOW': 'bg-blue-100 text-blue-800',
  'NORMAL': 'bg-gray-100 text-gray-800',
  'HIGH': 'bg-orange-100 text-orange-800',
  'URGENT': 'bg-red-100 text-red-800',
}

export function ApprovalDetails({ approval }: ApprovalDetailsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [showRejectionForm, setShowRejectionForm] = useState(false)
  const router = useRouter()

  const Icon = workflowTypeIcons[approval.workflowType as keyof typeof workflowTypeIcons] || FileText
  const workflowLabel = workflowTypeLabels[approval.workflowType as keyof typeof workflowTypeLabels] || approval.workflowType

  const handleApprove = async () => {
    setIsLoading(true)
    try {
      const result = await approveWorkflow(approval.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Request approved successfully")
        router.push("/approvals")
        router.refresh()
      }
    } catch (error) {
      console.error("Error approving request:", error)
      toast.error("Failed to approve request")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection")
      return
    }

    setIsLoading(true)
    try {
      const result = await rejectWorkflow(approval.id, rejectionReason)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Request rejected successfully")
        router.push("/approvals")
        router.refresh()
      }
    } catch (error) {
      console.error("Error rejecting request:", error)
      toast.error("Failed to reject request")
    } finally {
      setIsLoading(false)
    }
  }

  const renderProposedChanges = () => {
    if (!approval.proposedChanges || Object.keys(approval.proposedChanges).length === 0) {
      return <p className="text-muted-foreground text-sm">No specific changes detailed</p>
    }

    const formatValue = (value: unknown): string => {
      if (value === null || value === undefined) return 'Not specified'
      if (typeof value === 'boolean') return value ? 'Yes' : 'No'
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        try {
          const date = new Date(value)
          return format(date, 'MMM dd, yyyy')
        } catch {
          return String(value)
        }
      }
      return String(value)
    }

    // Handle the new data structure with oldValue/newValue comparison
    const changes = approval.proposedChanges as Record<string, { oldValue: unknown; newValue: unknown; fieldName: string }>

    return (
      <div className="space-y-6">
        <div className="text-sm text-muted-foreground mb-4">
          {Object.keys(changes).length} field(s) will be updated:
        </div>
        
        {Object.entries(changes).map(([key, change]) => (
          <div key={key} className="border rounded-lg p-4 bg-muted/20">
            <div className="font-medium text-sm text-foreground mb-3 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              {change.fieldName}
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Current Value */}
              <div className="flex-1 space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Current Value
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="text-sm text-red-800 font-medium">
                    {formatValue(change.oldValue)}
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0 pt-6">
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>

              {/* New Value */}
              <div className="flex-1 space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Proposed Value
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="text-sm text-green-800 font-medium">
                    {formatValue(change.newValue)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-muted">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl">{workflowLabel}</CardTitle>
                <p className="text-muted-foreground">
                  Requested on {format(new Date(approval.createdAt), 'MMMM dd, yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={priorityColors[approval.priority as keyof typeof priorityColors]}>
                {approval.priority}
              </Badge>
              <Badge variant="outline" className={statusColors[approval.status as keyof typeof statusColors]}>
                {approval.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Proposed Changes</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                <p className="mt-1 p-3 bg-muted/50 rounded-md text-sm">
                  {approval.description}
                </p>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Changes to Review</Label>
                <div className="mt-2">
                  {renderProposedChanges()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Property Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Title Number</Label>
                  <p className="font-semibold">{approval.property.titleNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Lot Number</Label>
                  <p className="font-semibold">{approval.property.lotNumber || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Registered Owner</Label>
                  <p className="font-semibold">{approval.property.registeredOwner}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Classification</Label>
                  <p className="font-semibold">{approval.property.classification?.replace('_', ' ') || 'N/A'}</p>
                </div>
              </div>
              
              {approval.property.location && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>Location</span>
                  </Label>
                  <p className="text-sm">{approval.property.location}</p>
                  <p className="text-sm text-muted-foreground">
                    {approval.property.city}, {approval.property.province}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rejection Reason (if rejected) */}
          {approval.rejectedReason && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  <span>Rejection Reason</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm bg-red-50 p-3 rounded-md text-red-700">
                  {approval.rejectedReason}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Request Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Request Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Requested By</Label>
                <p className="font-semibold">
                  {approval.initiatedBy.firstName} {approval.initiatedBy.lastName}
                </p>
                {approval.initiatedBy.email && (
                  <p className="text-sm text-muted-foreground">{approval.initiatedBy.email}</p>
                )}
                {approval.initiatedBy.department && (
                  <p className="text-sm text-muted-foreground">{approval.initiatedBy.department}</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>Request Date</span>
                </Label>
                <p className="text-sm">
                  {format(new Date(approval.createdAt), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>

              {approval.approvedBy && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Processed By</Label>
                  <p className="font-semibold">
                    {approval.approvedBy.firstName} {approval.approvedBy.lastName}
                  </p>
                  {approval.approvedAt && (
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(approval.approvedAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {approval.status === 'PENDING' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showRejectionForm ? (
                  <div className="space-y-2">
                    <Button 
                      onClick={handleApprove} 
                      disabled={isLoading}
                      className="w-full"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isLoading ? "Approving..." : "Approve Request"}
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => setShowRejectionForm(true)}
                      disabled={isLoading}
                      className="w-full"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Request
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Label htmlFor="rejection-reason">Rejection Reason</Label>
                    <Textarea
                      id="rejection-reason"
                      placeholder="Please provide a reason for rejecting this request..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={4}
                    />
                    <div className="flex space-x-2">
                      <Button 
                        variant="destructive" 
                        onClick={handleReject}
                        disabled={isLoading || !rejectionReason.trim()}
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {isLoading ? "Rejecting..." : "Confirm Reject"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowRejectionForm(false)
                          setRejectionReason("")
                        }}
                        disabled={isLoading}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Status Information */}
          {approval.status !== 'PENDING' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Status Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  {approval.status === 'APPROVED' ? (
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  ) : (
                    <XCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
                  )}
                  <p className="font-semibold">
                    Request {approval.status.toLowerCase()}
                  </p>
                  {approval.approvedAt && (
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(approval.approvedAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}