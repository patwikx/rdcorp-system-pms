"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { TitleMovementSchema, type TitleMovementFormData } from "@/lib/validations/title-movement-schema"
import { createTitleMovement, generateNextTransmittalNumber } from "@/lib/actions/title-movement-actions"
import { getCurrentUser, getApprovalUsers, type ApproverUser } from "@/lib/actions/user-approval-actions"
import { Save, X, Activity, Loader2, Check, ChevronsUpDown, User } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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
  const [currentUser, setCurrentUser] = useState<{ firstName: string; lastName: string } | null>(null)
  const [approvers, setApprovers] = useState<ApproverUser[]>([])
  const [isLoadingApprovers, setIsLoadingApprovers] = useState(true)
  const [approverComboboxOpen, setApproverComboboxOpen] = useState(false)

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

  // Load current user and approvers on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [user, approversList, transmittalNumber] = await Promise.all([
          getCurrentUser(),
          getApprovalUsers(),
          generateNextTransmittalNumber()
        ])
        
        if (user) {
          setCurrentUser(user)
          const fullName = `${user.firstName} ${user.lastName}`.trim()
          form.setValue('releasedBy', fullName)
        }
        
        setApprovers(approversList)
        form.setValue('receivedByTransmittal', transmittalNumber)
      } catch (error) {
        console.error("Error loading data:", error)
        toast.error("Failed to load user data")
      } finally {
        setIsLoadingApprovers(false)
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
      const result = await createTitleMovement(data)
      
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
      } else if (result.success) {
        toast.success("Title movement request submitted for approval")
        form.reset({
          propertyId,
          purposeOfRelease: "",
          releasedBy: "",
          approvedById: "",
          receivedByTransmittal: "",
          receivedByName: "",
        })
        onSuccess?.()
      }
    } catch (error) {
      console.error("Create title movement error:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
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

              <FormField
                control={form.control}
                name="approvedById"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Approved By</FormLabel>
                    <Popover open={approverComboboxOpen} onOpenChange={setApproverComboboxOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={approverComboboxOpen}
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isLoading || isLoadingApprovers}
                          >
                            {field.value ? (
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4" />
                                <span>
                                  {(() => {
                                    const approver = approvers.find(a => a.id === field.value)
                                    return approver ? `${approver.firstName} ${approver.lastName}` : 'Unknown Approver'
                                  })()}
                                </span>
                              </div>
                            ) : (
                              <span>Select approver...</span>
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search approvers..." />
                          <CommandList>
                            <CommandEmpty>
                              {isLoadingApprovers ? "Loading approvers..." : "No approvers found."}
                            </CommandEmpty>
                            <CommandGroup>
                              {approvers.map((approver) => (
                                <CommandItem
                                  key={approver.id}
                                  value={`${approver.firstName} ${approver.lastName}`}
                                  onSelect={() => {
                                    form.setValue("approvedById", approver.id)
                                    setApproverComboboxOpen(false)
                                  }}
                                >
                                  <div className="flex items-center space-x-2 flex-1">
                                    <User className="h-4 w-4" />
                                    <div className="flex-1">
                                      <div className="font-medium">
                                        {approver.firstName} {approver.lastName}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {approver.position && approver.department 
                                          ? `${approver.position} - ${approver.department}`
                                          : approver.position || approver.department || approver.email
                                        }
                                      </div>
                                    </div>
                                  </div>
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      field.value === approver.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Select the authority who will approve this release
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                    <FormLabel>Received By (Optional)</FormLabel>
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
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Activity className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-800">Approval Required</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  This title movement request will be submitted for approval. Once approved, the title will be marked as released and ready for transmittal.
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
                  Submit for Approval
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
  )
}