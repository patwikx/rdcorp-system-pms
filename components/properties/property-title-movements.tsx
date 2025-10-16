'use client'

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Activity, Plus, Search, Edit, AlertCircle, CheckCircle, Printer } from "lucide-react"
import { PropertyWithFullDetails } from "@/lib/actions/property-actions"
import { CreateTitleMovementForm } from "./create-title-movement-form"
import { UpdateMovementStatusForm } from "./update-movement-status-form"

import { checkTitleAvailability, type TitleMovementWithPropertyDetails } from "@/lib/actions/title-movement-actions"
import { MovementStatus } from "@prisma/client"
import { format } from "date-fns"
import { toast } from "sonner"

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
    //window.location.reload()
  }

  const handleMovementUpdated = () => {
    setIsUpdateDialogOpen(false)
    setUpdatingMovement(null)
    // Refresh the page or update the property data
    //window.location.reload()
  }

  const handleUpdateMovement = (movement: typeof allTitleMovements[0]) => {
    setUpdatingMovement(movement)
    setIsUpdateDialogOpen(true)
  }

  const handlePrintTransmittal = (movement: typeof allTitleMovements[0]) => {
    // Convert the movement to the required format with property details
    const transmittalData: TitleMovementWithPropertyDetails = {
      ...movement,
      movementStatus: movement.movementStatus as MovementStatus,
      property: {
        titleNumber: property.titleNumber,
        lotNumber: property.lotNumber,
        lotArea: property.lotArea.toString(),
        location: property.location,
        barangay: property.barangay,
        city: property.city,
        province: property.province,
        registeredOwner: property.registeredOwner,
        classification: property.classification,
      }
    }
    
    // Generate and print the transmittal directly
    generateAndPrintTransmittal(transmittalData)
  }



  const generateAndPrintTransmittal = (titleMovement: TitleMovementWithPropertyDetails) => {
    const formatLocation = () => {
      const parts = [
        titleMovement.property.location,
        titleMovement.property.barangay,
        titleMovement.property.city,
        titleMovement.property.province
      ].filter(Boolean)
      return parts.join(', ')
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Title Transmittal - ${titleMovement.receivedByTransmittal}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              font-size: 12px;
              line-height: 1.4;
            }
            .header { text-align: center; margin-bottom: 20px; }
            .title { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
            .subtitle { font-size: 14px; margin-bottom: 20px; }
            .section { margin-bottom: 15px; }
            .section-title { font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #ccc; padding-bottom: 2px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .info-item { margin-bottom: 5px; }
            .label { font-weight: bold; }
            .signature-section { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
            .signature-box { text-align: center; }
            .signature-line { border-bottom: 1px solid #000; margin-bottom: 5px; height: 40px; }
            .separator { border-bottom: 1px solid #ccc; margin: 20px 0; }
            @media print {
              body { margin: 0; padding: 15px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <!-- Header -->
          <div class="header">
            <h1 class="title">RD Corporation</h1>
            <p class="subtitle">Property Title Transmittal Form</p>
            <div style="text-align: right; margin-top: 20px;">
              <p style="margin: 5px 0;">
                <span style="font-weight: bold;">Transmittal No:</span> ${titleMovement.receivedByTransmittal || 'N/A'}
              </p>
              <p style="margin: 5px 0;">
                <span style="font-weight: bold;">Date:</span> ${titleMovement.dateReleased ? format(titleMovement.dateReleased, 'MMMM dd, yyyy') : 'N/A'}
              </p>
            </div>
          </div>

          <div class="separator"></div>

          <!-- Property Information -->
          <div class="section">
            <h3 class="section-title">PROPERTY INFORMATION</h3>
            <div class="info-grid">
              <div>
                <p style="margin-bottom: 8px;">
                  <span style="font-weight: bold;">Title Number:</span> ${titleMovement.property.titleNumber}
                </p>
                <p style="margin-bottom: 8px;">
                  <span style="font-weight: bold;">Lot Number:</span> ${titleMovement.property.lotNumber}
                </p>
                <p style="margin-bottom: 8px;">
                  <span style="font-weight: bold;">Lot Area:</span> ${titleMovement.property.lotArea} sqm
                </p>
              </div>
              <div>
                <p style="margin-bottom: 8px;">
                  <span style="font-weight: bold;">Registered Owner:</span> ${titleMovement.property.registeredOwner}
                </p>
                <p style="margin-bottom: 8px;">
                  <span style="font-weight: bold;">Classification:</span> ${titleMovement.property.classification.replace('_', ' ')}
                </p>
              </div>
            </div>
            <div style="margin-top: 12px;">
              <p>
                <span style="font-weight: bold;">Location:</span> ${formatLocation()}
              </p>
            </div>
          </div>

          <!-- Movement Details -->
          <div class="section">
            <h3 class="section-title">MOVEMENT DETAILS</h3>
            <div style="margin-bottom: 8px;">
              <p style="font-weight: bold;">Purpose of Release:</p>
              <p style="margin-left: 16px; background-color: #f5f5f5; padding: 8px; border-radius: 4px; font-size: 11px; line-height: 1.5;">
                ${titleMovement.purposeOfRelease || 'N/A'}
              </p>
            </div>
            <div class="info-grid" style="margin-top: 16px;">
              <p>
                <span style="font-weight: bold;">Released By:</span> ${titleMovement.releasedBy || 'N/A'}
              </p>
              <p>
                <span style="font-weight: bold;">Approved By:</span> ${titleMovement.approvedBy || 'N/A'}
              </p>
            </div>
            <p style="margin-top: 8px;">
              <span style="font-weight: bold;">To be Received By:</span> ${titleMovement.receivedByName || 'N/A'}
            </p>
          </div>

          <!-- Instructions -->
          <div class="section">
            <h3 class="section-title">INSTRUCTIONS</h3>
            <div style="font-size: 11px; line-height: 1.4;">
              <p style="margin-bottom: 4px;">• This transmittal authorizes the release and transfer of the above-mentioned property title.</p>
              <p style="margin-bottom: 4px;">• The receiving party must acknowledge receipt by signing below.</p>
              <p style="margin-bottom: 4px;">• Any discrepancies must be reported immediately to the issuing office.</p>
              <p style="margin-bottom: 4px;">• This document serves as official record of title movement.</p>
            </div>
          </div>

          <!-- Signature Section -->
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line"></div>
              <p style="font-weight: bold; margin-bottom: 2px;">${titleMovement.releasedBy || 'N/A'}</p>
              <p style="font-size: 11px;">Released By (Signature over Printed Name)</p>
              <p style="font-size: 11px; margin-top: 4px;">Date: ${titleMovement.dateReleased ? format(titleMovement.dateReleased, 'MM/dd/yyyy') : '_______________'}</p>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <p style="font-weight: bold; margin-bottom: 2px;">${titleMovement.receivedByName || 'N/A'}</p>
              <p style="font-size: 11px;">Received By (Signature over Printed Name)</p>
              <p style="font-size: 11px; margin-top: 4px;">Date: _______________</p>
            </div>
          </div>

          <!-- Footer -->
          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #ccc;">
            <div style="text-align: center; font-size: 11px; color: #666;">
              <p style="margin-bottom: 4px;">This is a system-generated document. No signature required for digital copy.</p>
              <p>For inquiries, please contact Hashime Rodrigo of RD Corporation.</p>
            </div>
          </div>
        </body>
      </html>
    `

    // Create a new window and print
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.focus()
      
      // Wait for content to load then print
      printWindow.onload = () => {
        printWindow.print()
        printWindow.close()
      }
    }
  }


  const checkAvailability = useCallback(async () => {
    setIsCheckingAvailability(true)
    try {
      const availability = await checkTitleAvailability(property.id)
      setTitleAvailability(availability)
    } catch (error) {
      toast.error(`Error checking title availability: ${error}`)
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
            
            <div className="flex items-end flex-col mt-[23px]">
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

          {/* Movement Records Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filteredMovements.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No movement records found</h3>
                <p className="mt-2 text-muted-foreground">No movement records match your search criteria.</p>
              </div>
            ) : (
              filteredMovements.map((movement, index) => (
                <Card 
                  key={movement.id} 
                  className="relative cursor-pointer hover:shadow-md transition-shadow duration-200 group"
                  onClick={() => handleUpdateMovement(movement)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Header with movement number */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <Activity className="h-4 w-4 text-primary" />
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-sm">Movement #{index + 1}</h4>
                            <p className="text-xs text-muted-foreground">
                              {movement.dateReleased 
                                ? format(new Date(movement.dateReleased), 'MMM dd, yyyy')
                                : format(new Date(movement.createdAt), 'MMM dd, yyyy')
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex flex-wrap gap-2">
                        <div className="inline-flex">
                          {getMovementStatusBadge(movement.movementStatus)}
                        </div>
                      </div>

                      {/* Key Details */}
                      <div className="space-y-2 text-xs">
                        {movement.releasedBy && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Released by:</span>
                            <span className="font-medium truncate ml-2" title={movement.releasedBy}>
                              {movement.releasedBy}
                            </span>
                          </div>
                        )}
                        
                        {movement.receivedByName && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Received by:</span>
                            <span className="font-medium truncate ml-2" title={movement.receivedByName}>
                              {movement.receivedByName}
                            </span>
                          </div>
                        )}

                        {movement.turnedOverDate && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Turned over:</span>
                            <span className="font-medium">
                              {format(new Date(movement.turnedOverDate), 'MMM dd')}
                            </span>
                          </div>
                        )}

                        {movement.dateReturned && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Returned:</span>
                            <span className="font-medium">
                              {format(new Date(movement.dateReturned), 'MMM dd')}
                            </span>
                          </div>
                        )}

                        {movement.receivedByTransmittal && (
                          <div className="pt-1 border-t">
                            <div className="text-muted-foreground mb-1">Transmittal:</div>
                            <div className="font-mono text-xs bg-muted/50 p-1 rounded truncate">
                              {movement.receivedByTransmittal}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Purpose of Release */}
                      {movement.purposeOfRelease && (
                        <div className="pt-2 border-t">
                          <div className="text-xs text-muted-foreground mb-1">Purpose:</div>
                          <p className="text-xs bg-muted/30 p-2 rounded leading-relaxed line-clamp-3">
                            {movement.purposeOfRelease}
                          </p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="pt-2 border-t space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleUpdateMovement(movement)
                            }}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Update
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePrintTransmittal(movement)
                            }}
                          >
                            <Printer className="h-3 w-3 mr-1" />
                            Print
                          </Button>
                        </div>
                      </div>

                      {/* System Info */}
                      <div className="text-xs text-muted-foreground pt-1 border-t">
                        <div className="truncate">
                          By {movement.movedBy.firstName} {movement.movedBy.lastName}
                        </div>
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