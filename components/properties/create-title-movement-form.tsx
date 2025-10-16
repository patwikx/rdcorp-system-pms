"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

import { TitleMovementSchema, type TitleMovementFormData } from "@/lib/validations/title-movement-schema"
import { createAndApproveTitleMovement, generateNextTransmittalNumber, type TitleMovementWithPropertyDetails } from "@/lib/actions/title-movement-actions"
import { getCurrentUser } from "@/lib/actions/user-approval-actions"
import { TransmittalForm } from "@/components/title-movements/transmittal-form"
import { Save, X, Activity, Loader2, User } from "lucide-react"
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
  const [showTransmittal, setShowTransmittal] = useState(false)
  const [createdMovement, setCreatedMovement] = useState<TitleMovementWithPropertyDetails | null>(null)


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

  async function onSubmit(data: TitleMovementFormData) {
    setIsLoading(true)
    
    try {
      const result = await createAndApproveTitleMovement(data)
      
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
        setCreatedMovement(result.data)
        setShowTransmittal(true)
        form.reset({
          propertyId,
          purposeOfRelease: "",
          releasedBy: "",
          approvedById: "",
          receivedByTransmittal: "",
          receivedByName: "",
        })
      }
    } catch (error) {
      console.error("Create title movement error:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTransmittalClose = () => {
    setShowTransmittal(false)
    setCreatedMovement(null)
    onSuccess?.()
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
            <h3 className="text-lg font-semibold">Movement Details</h3>
            
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

          {/* Important Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Activity className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-800">Auto-Approved</h4>
                <p className="text-sm text-green-700 mt-1">
                  This title movement will be automatically approved and the title will be immediately marked as released and ready for transmittal.
                </p>
              </div>
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

      {/* Transmittal Form Dialog */}
      {showTransmittal && createdMovement && (
        <TransmittalForm
          isOpen={showTransmittal}
          onClose={handleTransmittalClose}
          titleMovement={createdMovement}
        />
      )}
    </>
  )
}