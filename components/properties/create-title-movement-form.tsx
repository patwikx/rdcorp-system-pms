"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { FileUpload, UploadedFileDisplay } from "@/components/file-upload"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { TitleMovementSchema, type TitleMovementFormData } from "@/lib/validations/title-movement-schema"
import { createAndApproveTitleMovement, generateNextTransmittalNumber, type TitleMovementWithPropertyDetails } from "@/lib/actions/title-movement-actions"
import { getCurrentUser } from "@/lib/actions/user-approval-actions"

import { Save, X, Activity, Loader2, User, Upload } from "lucide-react"
import { toast } from "sonner"


interface CreateTitleMovementFormProps {
  propertyId: string
  propertyTitle: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreateTitleMovementForm({ 
  propertyId, 
  propertyTitle,
  onSuccess, 
  onCancel 
}: CreateTitleMovementFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingTransmittal, setIsGeneratingTransmittal] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; firstName: string; lastName: string } | null>(null)
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [createdMovement, setCreatedMovement] = useState<TitleMovementWithPropertyDetails | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ fileName: string; name: string; fileUrl: string }>>([])

  interface UploadedFile {
    fileName: string
    name: string
    fileUrl: string
  }


  const form = useForm({
    resolver: zodResolver(TitleMovementSchema),
    defaultValues: {
      propertyId,
      purposeOfRelease: "",
      releasedBy: "",
      approvedById: "",
      receivedByTransmittal: "",
      receivedByName: "",
    },
  })

  // Load current user on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [user, transmittalNumber] = await Promise.all([
          getCurrentUser(),
          generateNextTransmittalNumber()
        ])
        
        if (user) {
          setCurrentUser(user)
          const fullName = `${user.firstName} ${user.lastName}`.trim()
          form.setValue('releasedBy', fullName)
          // Set the current user as the approver
          form.setValue('approvedById', user.id)
        }
        
        form.setValue('receivedByTransmittal', transmittalNumber)
      } catch (error) {
        console.error("Error loading data:", error)
        toast.error("Failed to load user data")
      }
    }

    loadData()
  }, [form])

  const generateTransmittalNumber = async () => {
    setIsGeneratingTransmittal(true)
    try {
      const transmittalNumber = await generateNextTransmittalNumber()
      form.setValue('receivedByTransmittal', transmittalNumber)
      toast.success("Transmittal number generated")
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Failed to generate transmittal number")
    } finally {
      setIsGeneratingTransmittal(false)
    }
  }

  const handleFileUploadComplete = (result: UploadedFile) => {
    if (uploadedFiles.length >= 5) {
      toast.error("Maximum 5 files allowed")
      return
    }
    
    setUploadedFiles(prev => [...prev, result])
    toast.success(`File "${result.name}" uploaded successfully`)
  }

  const handleFileUploadError = (error: string) => {
    toast.error(error)
  }

  const handleRemoveFile = (fileToRemove: UploadedFile) => {
    setUploadedFiles(prev => prev.filter(file => file !== fileToRemove))
    toast.success("File removed")
  }

  async function onSubmit(data: TitleMovementFormData) {
    setIsLoading(true)
    
    try {
      const result = await createAndApproveTitleMovement(data, uploadedFiles)
      
      if (result.error) {
        toast.error(result.error)
        if (result.details) {
          Object.entries(result.details).forEach(([field, errors]) => {
            if (errors && Array.isArray(errors) && errors.length > 0) {
              form.setError(field as keyof TitleMovementFormData, {
                message: errors[0],
              })
            }
          })
        }
      } else if (result.success && result.data) {
        toast.success("Title movement created and approved successfully")
        if (uploadedFiles.length > 0) {
          toast.success(`${uploadedFiles.length} supporting document(s) attached`)
        }
        setCreatedMovement(result.data)
        setShowPrintDialog(true)
        form.reset({
          propertyId,
          purposeOfRelease: "",
          releasedBy: "",
          approvedById: "",
          receivedByTransmittal: "",
          receivedByName: "",
        })
        setUploadedFiles([])
      }
    } catch (error) {
      console.error("Create title movement error:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrintTransmittal = () => {
    if (!createdMovement) return
    
    generateAndPrintTransmittal(createdMovement)
    setShowPrintDialog(false)
    setCreatedMovement(null)
    onSuccess?.()
  }

  const handleSkipPrint = () => {
    setShowPrintDialog(false)
    setCreatedMovement(null)
    onSuccess?.()
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
            <h1 class="title">RD CORPORATION</h1>
            <p class="subtitle">Property Title Movement Transmittal Form</p>
            <div style="text-align: right; margin-top: 20px;">
              <p style="margin: 5px 0;">
                <span style="font-weight: bold;">Transmittal No:</span> ${titleMovement.receivedByTransmittal || 'N/A'}
              </p>
              <p style="margin: 5px 0;">
                <span style="font-weight: bold;">Date:</span> ${titleMovement.dateReleased ? new Date(titleMovement.dateReleased).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
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
              <p style="font-size: 11px; margin-top: 4px;">Date: ${titleMovement.dateReleased ? new Date(titleMovement.dateReleased).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '_______________'}</p>
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

  return (
    <>
      <div className="max-h-[80vh] overflow-y-auto px-1">
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Property Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-primary" />
                <div>
                  <h4 className="font-semibold">Title Movement Request</h4>
                  <p className="text-sm text-muted-foreground">Property: {propertyTitle}</p>
                </div>
              </div>
              {currentUser && (
                <div className="text-right">
                  <div className="text-sm font-medium">Requested by</div>
                  <div className="text-sm text-muted-foreground">
                    {currentUser.firstName} {currentUser.lastName}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Movement Details */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="purposeOfRelease"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose of Release</FormLabel>
                  <FormControl>
                    <textarea
                      placeholder="Describe the purpose for releasing this title (e.g., for loan application, property sale, etc.)"
                      {...field}
                      disabled={isLoading}
                      rows={3}
                      className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </FormControl>
                  <FormDescription>
                    Explain why the title needs to be released
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="releasedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Released By</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          {...field}
                          disabled={true}
                          className="bg-muted pr-10"
                        />
                        <User className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Current logged-in user (automatically set)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Approved By
                </label>
                <div className="relative">
                  <Input 
                    value={currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Loading..."}
                    disabled={true}
                    className="bg-muted pr-10"
                  />
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Current logged-in user (automatically approved)
                </p>
              </div>
            </div>
          </div>

          {/* Transmittal Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Transmittal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="receivedByTransmittal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transmittal Number</FormLabel>
                    <div className="flex space-x-2">
                      <FormControl>
                        <Input 
                          placeholder="e.g., TM-24-0001" 
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={generateTransmittalNumber}
                        disabled={isLoading || isGeneratingTransmittal}
                        className="whitespace-nowrap"
                      >
                        {isGeneratingTransmittal ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Generate"
                        )}
                      </Button>
                    </div>
                    <FormDescription>
                      Unique transmittal reference number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="receivedByName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Received By</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Name of receiving person/entity" 
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Person or entity receiving the title
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Supporting Documents */}
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center space-x-2">
                  <Upload className="h-4 w-4" />
                  <span>Upload Documents</span>
                </label>
                <FileUpload
                  onUploadComplete={handleFileUploadComplete}
                  onUploadError={handleFileUploadError}
                  disabled={isLoading}
                  maxSize={10}
                  multiple={true}
                  maxFiles={5}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp"
                />
                <p className="text-sm text-muted-foreground">
                  Upload supporting documents for this title movement (max 5 files, 10MB each)
                </p>
              </div>

              {/* Display uploaded files */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">
                    Uploaded Files ({uploadedFiles.length}/5)
                  </h4>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <UploadedFileDisplay
                        key={index}
                        fileName={file.fileName}
                        name={file.name}
                        fileUrl={file.fileUrl}
                        onRemove={() => handleRemoveFile(file)}
                        disabled={isLoading}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center space-x-4 pt-6 border-t">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create & Approve Movement
                </>
              )}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Form>
      </div>

      {/* Print Transmittal Alert Dialog */}
      <AlertDialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Title Movement Created Successfully</AlertDialogTitle>
            <AlertDialogDescription>
              Your title movement has been created and approved. Would you like to print the transmittal form now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleSkipPrint}>
              Skip Printing
            </AlertDialogCancel>
            <AlertDialogAction onClick={handlePrintTransmittal}>
              Print Transmittal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}