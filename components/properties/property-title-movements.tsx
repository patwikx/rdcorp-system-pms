'use client'

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Activity, Plus, Search, Calendar, User, Edit, AlertCircle, CheckCircle } from "lucide-react"
import { PropertyWithFullDetails } from "@/lib/actions/property-actions"
import { CreateTitleMovementForm } from "./create-title-movement-form"
import { UpdateMovementStatusForm } from "./update-movement-status-form"
import { checkTitleAvailability } from "@/lib/actions/title-movement-actions"
import { format } from "date-fns"

interface PropertyTitleMovementsProps {
  property: PropertyWithFullDetails
}

export function PropertyTitleMovements({ property }: PropertyTitleMovementsProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [updatingMovement, setUpdatingMovement] = useState<typeof allTitleMovements[0] | null>(null)
  const [titleAvailability, setTitleAvailability] = useState<{
    isAvailable: boolean
    reason?: string
    details?: {
      hasPendingWorkflow: boolean
      hasActiveMovement: boolean
      pendingWorkflowInitiator?: string
      activeMovementStatus?: string
    }
  } | null>(null)
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false)

  const handleMovementCreated = () => {
    setIsCreateDialogOpen(false)
    // Refresh availability status
    checkAvailability()
    // Refresh the page or update the property data
    window.location.reload()
  }

  const handleMovementUpdated = () => {
    setIsUpdateDialogOpen(false)
    setUpdatingMovement(null)
    // Refresh the page or update the property data
    window.location.reload()
  }

  const handleUpdateMovement = (movement: typeof allTitleMovements[0]) => {
    setUpdatingMovement(movement)
    setIsUpdateDialogOpen(true)
  }


  const checkAvailability = useCallback(async () => {
    setIsCheckingAvailability(true)
    try {
      const availability = await checkTitleAvailability(property.id)
      setTitleAvailability(availability)
    } catch (error) {
      console.error("Error checking title availability:", error)
      setTitleAvailability({
        isAvailable: false,
        reason: "Unable to check title status",
        details: {
          hasPendingWorkflow: false,
          hasActiveMovement: false,
        }
      })
    } finally {
      setIsCheckingAvailability(false)
    }
  }, [property.id])

  const handleCreateDialogOpen = async () => {
    await checkAvailability()
    if (titleAvailability?.isAvailable) {
      setIsCreateDialogOpen(true)
    }
  }

  // Get all title movements for this property
  const allTitleMovements = property.titleMovements

  // Filter movements based on search and filters
  const filteredMovements = allTitleMovements.filter(movement => {
    const matchesSearch = searchTerm === "" || 
      movement.movementStatus.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (movement.releasedBy && movement.releasedBy.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (movement.receivedByName && movement.receivedByName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (movement.purposeOfRelease && movement.purposeOfRelease.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = filterType === "all" || movement.movementStatus === filterType

    return matchesSearch && matchesType
  })

  // Get unique movement types for filter
  const availableTypes = [...new Set(allTitleMovements.map(movement => movement.movementStatus))]

  // Check title availability on component mount
  useEffect(() => {
    checkAvailability()
  }, [property.id, checkAvailability])

  const getMovementStatusBadge = (status: string) => {
    const colors = {
      'RELEASED': 'bg-blue-100 text-blue-800',
      'IN_TRANSIT': 'bg-yellow-100 text-yellow-800',
      'RECEIVED': 'bg-green-100 text-green-800',
      'RETURNED': 'bg-purple-100 text-purple-800',
      'LOST': 'bg-red-100 text-red-800',
      'PENDING_RETURN': 'bg-orange-100 text-orange-800',
    }
    return (
      <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  if (allTitleMovements.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No title movements found</h3>
        <p className="mt-2 text-muted-foreground">
          This property doesn&apos;t have any title movement records yet.
        </p>
        <div className="mt-4">
          <Button 
            variant="outline" 
            onClick={handleCreateDialogOpen}
            disabled={isCheckingAvailability || (titleAvailability ? !titleAvailability.isAvailable : false)}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isCheckingAvailability ? "Checking..." : "Request Title Movement"}
          </Button>
          {titleAvailability && !titleAvailability.isAvailable && (
            <p className="text-sm text-red-600 mt-2">
              {titleAvailability.reason}
            </p>
          )}
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="!w-[700px] !max-w-[700px] !min-w-[700px]" style={{ width: '700px', maxWidth: '700px', minWidth: '700px' }}>
            <DialogHeader>
              <DialogTitle>Request Title Movement</DialogTitle>
            </DialogHeader>
            <CreateTitleMovementForm 
              propertyId={property.id}
              propertyTitle={property.titleNumber}
              onSuccess={handleMovementCreated}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Title Status Card */}
      {titleAvailability && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {titleAvailability.isAvailable ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                )}
                <div>
                  <h4 className="font-semibold">
                    {titleAvailability.isAvailable ? "Title Available" : "Title Unavailable"}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {titleAvailability.isAvailable 
                      ? "Ready for new movement requests"
                      : titleAvailability.reason
                    }
                  </p>
                </div>
              </div>
              {titleAvailability.details?.hasPendingWorkflow && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  Pending Approval
                </Badge>
              )}
              {titleAvailability.details?.hasActiveMovement && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {titleAvailability.details.activeMovementStatus}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg">Title Movement History</CardTitle>
            <CardDescription>Track ownership changes and title transfers</CardDescription>
          </div>
          <Activity className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{allTitleMovements.length}</div>
          <p className="text-sm text-muted-foreground">Total movements recorded</p>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Movement Records</CardTitle>
          <CardDescription>View and manage all title movement transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-medium mb-1">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by status, released by, received by, or purpose..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="min-w-[160px]">
                <Label className="text-sm font-medium">Movement Status</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {availableTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-end flex-col">
              <Button 
                variant="outline"
                onClick={handleCreateDialogOpen}
                disabled={isCheckingAvailability || (titleAvailability ? !titleAvailability.isAvailable : false)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isCheckingAvailability ? "Checking..." : "Request Movement"}
              </Button>
              {titleAvailability && !titleAvailability.isAvailable && (
                <p className="text-xs text-red-600 mt-1 text-right max-w-[200px]">
                  {titleAvailability.reason}
                </p>
              )}
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogContent className="!w-[700px] !max-w-[700px] !min-w-[700px]" style={{ width: '700px', maxWidth: '700px', minWidth: '700px' }}>
                <DialogHeader>
                  <DialogTitle>Request Title Movement</DialogTitle>
                </DialogHeader>
                <CreateTitleMovementForm 
                  propertyId={property.id}
                  propertyTitle={property.titleNumber}
                  onSuccess={handleMovementCreated}
                  onCancel={() => setIsCreateDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Movement Records */}
          <div className="space-y-4">
            {filteredMovements.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No movement records match your search criteria.</p>
              </div>
            ) : (
              filteredMovements.map((movement, index) => (
                <Card key={movement.id} className="relative">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-4">
                        {/* Movement Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getMovementStatusBadge(movement.movementStatus)}
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {movement.dateReleased 
                                  ? format(new Date(movement.dateReleased), 'MMM dd, yyyy')
                                  : format(new Date(movement.createdAt), 'MMM dd, yyyy')
                                }
                              </span>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            #{index + 1}
                          </div>
                        </div>

                        {/* Movement Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {movement.releasedBy && (
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span>Released By</span>
                              </div>
                              <p className="font-semibold">{movement.releasedBy}</p>
                            </div>
                          )}

                          {movement.receivedByName && (
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span>Received By</span>
                              </div>
                              <p className="font-semibold">{movement.receivedByName}</p>
                            </div>
                          )}

                          {movement.turnedOverDate && (
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-muted-foreground">
                                Turned Over Date
                              </div>
                              <p className="text-sm font-semibold">
                                {format(new Date(movement.turnedOverDate), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          )}

                          {movement.dateReturned && (
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-muted-foreground">
                                Date Returned
                              </div>
                              <p className="text-sm font-semibold">
                                {format(new Date(movement.dateReturned), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Purpose of Release */}
                        {movement.purposeOfRelease && (
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-muted-foreground">Purpose of Release</div>
                            <p className="text-sm bg-muted/50 p-3 rounded-md">{movement.purposeOfRelease}</p>
                          </div>
                        )}

                        {/* System Info */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                          <div>
                            Created by {movement.movedBy.firstName} {movement.movedBy.lastName}
                          </div>
                          <div>
                            {format(new Date(movement.createdAt), 'MMM dd, yyyy HH:mm')}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="ml-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUpdateMovement(movement)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Update Status
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {filteredMovements.length > 0 && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Showing {filteredMovements.length} of {allTitleMovements.length} movement records
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Movement Status Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="!w-[600px] !max-w-[600px] !min-w-[600px]" style={{ width: '600px', maxWidth: '600px', minWidth: '600px' }}>
          <DialogHeader>
            <DialogTitle>Update Movement Status</DialogTitle>
          </DialogHeader>
          {updatingMovement && (
            <UpdateMovementStatusForm 
              movement={{
                id: updatingMovement.id,
                movementStatus: updatingMovement.movementStatus,
                receivedByTransmittal: updatingMovement.receivedByTransmittal,
                receivedByName: updatingMovement.receivedByName,
                turnedOverBy: updatingMovement.turnedOverBy,
                receivedByPerson: updatingMovement.receivedByPerson,
                returnedBy: updatingMovement.returnedBy,
                receivedByOnReturn: updatingMovement.receivedByOnReturn,
              }}
              onSuccess={handleMovementUpdated}
              onCancel={() => setIsUpdateDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}