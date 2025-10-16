'use client'

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Printer, X } from "lucide-react"
import { format } from "date-fns"

import { type TitleMovementWithPropertyDetails } from "@/lib/actions/title-movement-actions"

interface TransmittalFormProps {
  isOpen: boolean
  onClose: () => void
  titleMovement: TitleMovementWithPropertyDetails
}

export function TransmittalForm({ isOpen, onClose, titleMovement }: TransmittalFormProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML
      const originalContent = document.body.innerHTML
      
      document.body.innerHTML = printContent
      window.print()
      document.body.innerHTML = originalContent
      window.location.reload() // Reload to restore React functionality
    }
  }



  const formatLocation = () => {
    const parts = [
      titleMovement.property.location,
      titleMovement.property.barangay,
      titleMovement.property.city,
      titleMovement.property.province
    ].filter(Boolean)
    return parts.join(', ')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Title Transmittal Form</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="flex items-center space-x-2"
              >
                <Printer className="h-4 w-4" />
                <span>Print</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="bg-white p-8 text-black">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold mb-2">RD Corporation</h1>
            <p className="text-base font-semibold">Title Transmittal Form</p>
            <div className="mt-4 text-right">
              <p className="text-sm">
                <span className="font-semibold">Transmittal No:</span> {titleMovement.receivedByTransmittal}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Date:</span> {titleMovement.dateReleased ? format(titleMovement.dateReleased, 'MMMM dd, yyyy') : 'N/A'}
              </p>
            </div>
          </div>

          <Separator className="mb-6" />

          {/* Property Information */}
          <div className="mb-6">
            <h3 className="font-bold text-sm mb-3 pb-1 border-b border-gray-300">PROPERTY INFORMATION</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="mb-2">
                  <span className="font-semibold">Title Number:</span> {titleMovement.property.titleNumber}
                </p>
                <p className="mb-2">
                  <span className="font-semibold">Lot Number:</span> {titleMovement.property.lotNumber}
                </p>
                <p className="mb-2">
                  <span className="font-semibold">Lot Area:</span> {titleMovement.property.lotArea} sqm
                </p>
              </div>
              <div>
                <p className="mb-2">
                  <span className="font-semibold">Registered Owner:</span> {titleMovement.property.registeredOwner}
                </p>
                <p className="mb-2">
                  <span className="font-semibold">Classification:</span> {titleMovement.property.classification.replace('_', ' ')}
                </p>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-sm">
                <span className="font-semibold">Location:</span> {formatLocation()}
              </p>
            </div>
          </div>

          {/* Movement Details */}
          <div className="mb-6">
            <h3 className="font-bold text-sm mb-3 pb-1 border-b border-gray-300">MOVEMENT DETAILS</h3>
            <div className="text-sm space-y-2">
              <p>
                <span className="font-semibold">Purpose of Release:</span>
              </p>
              <p className="ml-4 bg-gray-50 p-2 rounded text-xs leading-relaxed">
                {titleMovement.purposeOfRelease}
              </p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <p>
                  <span className="font-semibold">Released By:</span> {titleMovement.releasedBy}
                </p>
                <p>
                  <span className="font-semibold">Approved By:</span> {titleMovement.approvedBy}
                </p>
              </div>
              <p className="mt-2">
                <span className="font-semibold">To be Received By:</span> {titleMovement.receivedByName}
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-6">
            <h3 className="font-bold text-sm mb-3 pb-1 border-b border-gray-300">INSTRUCTIONS</h3>
            <div className="text-xs space-y-1">
              <p>• This transmittal authorizes the release and transfer of the above-mentioned property title.</p>
              <p>• The receiving party must acknowledge receipt by signing below.</p>
              <p>• Any discrepancies must be reported immediately to the issuing office.</p>
              <p>• This document serves as official record of title movement.</p>
            </div>
          </div>

          {/* Signature Section */}
          <div className="mt-8">
            <div className="grid grid-cols-2 gap-12">
              <div className="text-center">
                <div className="border-b border-black mb-2 h-12"></div>
                <p className="text-sm font-semibold">{titleMovement.releasedBy}</p>
                <p className="text-xs">Released By (Signature over Printed Name)</p>
                <p className="text-xs mt-1">Date: {titleMovement.dateReleased ? format(titleMovement.dateReleased, 'MM/dd/yyyy') : 'N/A'}</p>
              </div>
              <div className="text-center">
                <div className="border-b border-black mb-2 h-12"></div>
                <p className="text-sm font-semibold">{titleMovement.receivedByName}</p>
                <p className="text-xs">Received By (Signature over Printed Name)</p>
                <p className="text-xs mt-1">Date: _______________</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-gray-300">
            <div className="text-center text-xs text-gray-600">
              <p>This is a system-generated document. No signature required for digital copy.</p>
              <p>For inquiries, please contact Hashime Rodrigo of RD Corporation.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}