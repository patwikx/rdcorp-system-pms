"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getPendingApprovals } from "@/lib/actions/title-movement-actions"
import { Priority } from "@prisma/client"
import { Clock, User, FileText, AlertTriangle } from "lucide-react"
import { ApprovalDecisionDialog } from "@/components/properties/approval-decision-dialog"

function getPriorityColor(priority: Priority) {
  switch (priority) {
    case Priority.LOW:
      return "bg-gray-100 text-gray-800"
    case Priority.NORMAL:
      return "bg-blue-100 text-blue-800"
    case Priority.HIGH:
      return "bg-orange-100 text-orange-800"
    case Priority.URGENT:
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

function getPriorityIcon(priority: Priority) {
  switch (priority) {
    case Priority.URGENT:
    case Priority.HIGH:
      return AlertTriangle
    default:
      return Clock
  }
}

interface PendingApprovalsListProps {
  pendingApprovals: Awaited<ReturnType<typeof getPendingApprovals>>
}

export function PendingApprovalsList({ pendingApprovals }: PendingApprovalsListProps) {
  const [selectedApproval, setSelectedApproval] = useState<typeof pendingApprovals[0] | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleReviewApproval = (approval: typeof pendingApprovals[0]) => {
    setSelectedApproval(approval)
    setIsDialogOpen(true)
  }

  const handleDialogSuccess = () => {
    setIsDialogOpen(false)
    setSelectedApproval(null)
    // Refresh the page to update the list
    window.location.reload()
  }

  if (pendingApprovals.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Clock className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No pending approvals</h3>
          <p className="text-muted-foreground text-center">
            All title movement requests have been processed.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {pendingApprovals.length} pending approval{pendingApprovals.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {pendingApprovals.map((approval) => {
          const PriorityIcon = getPriorityIcon(approval.priority)
          const proposedChanges = approval.proposedChanges as { 
            titleMovement: {
              purposeOfRelease: string
              releasedBy: string
              approvedBy: string
            }
          }

          return (
            <Card key={approval.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{approval.property.titleNumber}</CardTitle>
                    <p className="text-sm text-muted-foreground">{approval.property.registeredOwner}</p>
                  </div>
                  <Badge className={getPriorityColor(approval.priority)}>
                    <PriorityIcon className="h-3 w-3 mr-1" />
                    {approval.priority}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Initiated by: {approval.initiatedBy.firstName} {approval.initiatedBy.lastName}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Requested: {new Date(approval.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-start space-x-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="line-clamp-2">{approval.description}</span>
                  </div>
                </div>

                {proposedChanges?.titleMovement && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Movement Details</h4>
                    <div className="space-y-1 text-xs">
                      <p><span className="font-medium">Released by:</span> {proposedChanges.titleMovement.releasedBy}</p>
                      <p><span className="font-medium">Approved by:</span> {proposedChanges.titleMovement.approvedBy}</p>
                      <p><span className="font-medium">Purpose:</span> {proposedChanges.titleMovement.purposeOfRelease}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    {approval.workflowType.replace('_', ' ')}
                  </div>
                  <Button size="sm" onClick={() => handleReviewApproval(approval)}>
                    Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Approval Decision Dialog */}
      {selectedApproval && (
        <ApprovalDecisionDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          workflowId={selectedApproval.id}
          workflowType={selectedApproval.workflowType}
          workflowDescription={selectedApproval.description}
          priority={selectedApproval.priority}
          propertyTitle={selectedApproval.property.titleNumber}
          propertyOwner={selectedApproval.property.registeredOwner}
          propertyLocation={selectedApproval.property.location || undefined}
          requestedBy={`${selectedApproval.initiatedBy.firstName} ${selectedApproval.initiatedBy.lastName}`}
          requestedAt={selectedApproval.createdAt}
          proposedChanges={selectedApproval.proposedChanges as Record<string, unknown>}
          onSuccess={handleDialogSuccess}
        />
      )}
    </div>
  )
}