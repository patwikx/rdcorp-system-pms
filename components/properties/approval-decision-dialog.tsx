"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ApprovalDecisionSchema, type ApprovalDecisionData } from "@/lib/validations/title-movement-schema"
import { approveWorkflow } from "@/lib/actions/title-movement-actions"
import { CheckCircle, XCircle, AlertTriangle, User, Building, Flag, FileText, Edit, Activity, RotateCcw, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { toast } from "sonner"
import { Textarea } from "../ui/textarea"

interface ApprovalDecisionDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  workflowId: string
  workflowType: string
  workflowDescription: string
  priority: string
  propertyTitle: string
  propertyOwner: string
  propertyLocation?: string
  requestedBy: string
  requestedAt: Date
  proposedChanges: Record<string, unknown>
  onSuccess?: () => void
}

export function ApprovalDecisionDialog({ 
  isOpen, 
  onOpenChange, 
  workflowId,
  workflowType,
  workflowDescription,
  priority,
  propertyTitle,
  propertyOwner,
  propertyLocation,
  requestedBy,
  requestedAt,
  proposedChanges,
  onSuccess 
}: ApprovalDecisionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED" | null>(null)

  const form = useForm({
    resolver: zodResolver(ApprovalDecisionSchema),
    defaultValues: {
      id: workflowId,
      decision: "APPROVED" as const,
      rejectedReason: "",
    },
  })

  async function onSubmit(data: ApprovalDecisionData) {
    setIsLoading(true)
    
    try {
      const result = await approveWorkflow(data)
      
      if (result.error) {
        toast.error(result.error)
        if (result.details) {
          Object.entries(result.details).forEach(([field, error]) => {
            if (error && Array.isArray(error)) {
              form.setError(field as keyof ApprovalDecisionData, {
                message: error[0],
              })
            }
          })
        }
      } else {
        toast.success(
          data.decision === "APPROVED" 
            ? "Request approved and title movement created" 
            : "Request rejected"
        )
        form.reset()
        onOpenChange(false)
        onSuccess?.()
      }
    } catch (error) {
      console.error("Approval decision error:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDecisionChange = (newDecision: "APPROVED" | "REJECTED") => {
    setDecision(newDecision)
    form.setValue('decision', newDecision)
  }

  const getWorkflowTypeIcon = (type: string) => {
    const icons = {
      'PROPERTY_UPDATE': Edit,
      'TITLE_TRANSFER': Activity,
      'STATUS_CHANGE': RotateCcw,
      'OWNER_CHANGE': User,
      'ENCUMBRANCE_UPDATE': FileText,
      'LOCATION_UPDATE': Building,
      'DELETION': Trash2,
      'RESTORATION': RotateCcw,
    }
    const Icon = icons[type as keyof typeof icons] || FileText
    return <Icon className="h-4 w-4" />
  }

  const getWorkflowTypeLabel = (type: string) => {
    const labels = {
      'PROPERTY_UPDATE': 'Property Update',
      'TITLE_TRANSFER': 'Title Transfer',
      'STATUS_CHANGE': 'Status Change',
      'OWNER_CHANGE': 'Owner Change',
      'ENCUMBRANCE_UPDATE': 'Encumbrance Update',
      'LOCATION_UPDATE': 'Location Update',
      'DELETION': 'Deletion Request',
      'RESTORATION': 'Restoration Request',
    }
    return labels[type as keyof typeof labels] || type
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      'LOW': 'bg-blue-100 text-blue-800',
      'NORMAL': 'bg-gray-100 text-gray-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'URGENT': 'bg-red-100 text-red-800',
    }
    return (
      <Badge className={colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        <Flag className="h-3 w-3 mr-1" />
        {priority}
      </Badge>
    )
  }

  const getDecisionImpactMessage = (decision: "APPROVED" | "REJECTED", type: string) => {
    if (decision === "APPROVED") {
      switch (type) {
        case 'TITLE_TRANSFER':
          return "The title movement will be created and the title will be marked as released. The requester will be notified of the approval."
        case 'PROPERTY_UPDATE':
          return "The property information will be updated with the proposed changes. A change history record will be created."
        case 'STATUS_CHANGE':
          return "The property status will be updated and all related workflows will be adjusted accordingly."
        case 'OWNER_CHANGE':
          return "The property ownership will be transferred to the new owner. All related documents will be updated."
        case 'DELETION':
          return "The property will be marked as deleted (soft delete) and will no longer appear in active listings."
        case 'RESTORATION':
          return "The property will be restored to active status and will appear in listings again."
        default:
          return "The requested changes will be applied to the property. The requester will be notified of the approval."
      }
    } else {
      return "The request will be rejected and no changes will be made. The requester will be notified with the rejection reason provided."
    }
  }

  const renderCompactProposedChanges = (changes: Record<string, unknown>, type: string) => {
    if (type === 'TITLE_TRANSFER' && changes.titleMovement) {
      const titleMovement = changes.titleMovement as Record<string, unknown>
      return (
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          <div>
            <span className="font-medium text-muted-foreground">Purpose:</span>
            <div className="bg-muted/50 p-2 rounded text-xs mt-1">
              {titleMovement.purposeOfRelease as string || "—"}
            </div>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Released By:</span>
            <div className="bg-muted/50 p-2 rounded text-xs mt-1">
              {titleMovement.releasedBy as string || "—"}
            </div>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Transmittal:</span>
            <div className="bg-muted/50 p-2 rounded text-xs font-mono mt-1">
              {titleMovement.receivedByTransmittal as string || "—"}
            </div>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Received By:</span>
            <div className="bg-muted/50 p-2 rounded text-xs mt-1">
              {titleMovement.receivedByName as string}
            </div>
          </div>
        </div>
      )
    }

    // For other workflow types, show compact generic changes
    return (
      <div className="space-y-2">
        {Object.entries(changes).slice(0, 3).map(([key, value]) => (
          <div key={key} className="text-xs">
            <span className="font-medium text-muted-foreground">
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
            </span>
            <div className="bg-muted/50 p-2 rounded mt-1">
              {typeof value === 'object' 
                ? JSON.stringify(value).substring(0, 100) + (JSON.stringify(value).length > 100 ? '...' : '')
                : String(value).substring(0, 100) + (String(value).length > 100 ? '...' : '')
              }
            </div>
          </div>
        ))}
        {Object.entries(changes).length > 3 && (
          <div className="text-xs text-muted-foreground">
            +{Object.entries(changes).length - 3} more changes...
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[700px] !max-w-[700px] !min-w-[700px]" style={{ width: '700px', maxWidth: '700px', minWidth: '700px' }}>
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center space-x-2 text-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span>Approval Required</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Review request details and make your decision
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[75vh] overflow-y-auto px-1">
          {/* Compact Request Overview */}
          <div className="bg-muted/50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getWorkflowTypeIcon(workflowType)}
                <span className="font-semibold">{getWorkflowTypeLabel(workflowType)}</span>
              </div>
              {getPriorityBadge(priority)}
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div><span className="font-medium">Property:</span> {propertyTitle}</div>
              <div><span className="font-medium">Owner:</span> {propertyOwner}</div>
              <div><span className="font-medium">Requested by:</span> {requestedBy}</div>
              <div><span className="font-medium">Date:</span> {format(new Date(requestedAt), 'MMM dd, HH:mm')}</div>
              {propertyLocation && (
                <div className="col-span-2"><span className="font-medium">Location:</span> {propertyLocation}</div>
              )}
            </div>
          </div>

          {/* Compact Description & Changes */}
          <div className="space-y-3 mb-4">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <FileText className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm font-medium">Description</span>
              </div>
              <Textarea
                value={workflowDescription}
                readOnly
                rows={2}
                className="w-full text-xs bg-muted/50 border border-input rounded-md px-2 py-1 resize-none"
              />
            </div>

            <div className="border rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Edit className="h-3 w-3" />
                <span className="text-sm font-medium">Proposed Changes</span>
              </div>
              {renderCompactProposedChanges(proposedChanges, workflowType)}
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              {/* Compact Decision Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={decision === "APPROVED" ? "default" : "outline"}
                  className={`h-12 flex items-center justify-center space-x-2 ${
                    decision === "APPROVED" ? "bg-green-600 hover:bg-green-700" : "hover:bg-green-50"
                  }`}
                  onClick={() => handleDecisionChange("APPROVED")}
                  disabled={isLoading}
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Approve</span>
                </Button>

                <Button
                  type="button"
                  variant={decision === "REJECTED" ? "destructive" : "outline"}
                  className={`h-12 flex items-center justify-center space-x-2 ${
                    decision === "REJECTED" ? "" : "hover:bg-red-50"
                  }`}
                  onClick={() => handleDecisionChange("REJECTED")}
                  disabled={isLoading}
                >
                  <XCircle className="h-4 w-4" />
                  <span>Reject</span>
                </Button>
              </div>

              {/* Compact Rejection Reason */}
              {decision === "REJECTED" && (
                <FormField
                  control={form.control}
                  name="rejectedReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Rejection Reason</FormLabel>
                      <FormControl>
                        <textarea
                          placeholder="Provide reason for rejection..."
                          {...field}
                          disabled={isLoading}
                          rows={3}
                          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Compact Decision Impact */}
              {decision && (
                <div className={`rounded-lg p-3 text-sm ${
                  decision === "APPROVED" 
                    ? "bg-green-50 border border-green-200" 
                    : "bg-red-50 border border-red-200"
                }`}>
                  <div className="flex items-start space-x-2">
                    {decision === "APPROVED" ? (
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <div className={`font-medium ${
                        decision === "APPROVED" ? "text-green-800" : "text-red-800"
                      }`}>
                        {decision === "APPROVED" ? "Will approve:" : "Will reject:"}
                      </div>
                      <div className={`text-xs mt-1 ${
                        decision === "APPROVED" ? "text-green-700" : "text-red-700"
                      }`}>
                        {getDecisionImpactMessage(decision, workflowType)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Compact Submit Buttons */}
              <div className="flex items-center space-x-3 pt-3 border-t">
                <Button 
                  type="submit" 
                  disabled={isLoading || !decision}
                  className={decision === "APPROVED" ? "bg-green-600 hover:bg-green-700" : ""}
                  variant={decision === "REJECTED" ? "destructive" : "default"}
                  size="sm"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {decision === "APPROVED" ? (
                        <CheckCircle className="h-3 w-3 mr-2" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-2" />
                      )}
                      {decision === "APPROVED" ? "Approve" : "Reject"}
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} size="sm">
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}