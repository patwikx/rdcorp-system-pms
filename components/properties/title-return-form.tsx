"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { TitleReturnSchema, type TitleReturnFormData } from "@/lib/validations/title-return-schema"
import { returnTitleMovement } from "@/lib/actions/title-movement-actions"
import { getCurrentUser } from "@/lib/actions/user-approval-actions"
import { RotateCcw, X, AlertTriangle, User, Calendar as CalendarIcon } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

interface TitleReturnFormProps {
  movement: {
    id: string
    propertyId: string
    property: {
      titleNumber: string
      registeredOwner: string
    }
    movementStatus: string
    dateReleased: Date | null
    releasedBy: string | null
    receivedByName: string | null
    receivedByTransmittal: string | null
  }
  onSuccess?: () => void
  onCancel?: () => void
}

export function TitleReturnForm({ movement, onSuccess, onCancel }: TitleReturnFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentUser, setCurrentUser] = useState<{ firstName: string; lastName: string } | null>(null)

  const form = useForm({
    resolver: zodResolver(TitleReturnSchema),
    defaultValues: {
      movementId: movement.id,
      returnedBy: "",
      receivedByOnReturn: "",
      returnCondition: "GOOD" as const,
      returnNotes: "",
      documentsComplete: true,
      titleIntact: true,
      returnDate: new Date(), // Today's date as Date object
    },
  })

  // Load current user on component mount
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await getCurrentUser()
        if (user) {
          setCurrentUser(user)
          const fullName = `${user.firstName} ${user.lastName}`.trim()
          form.setValue('receivedByOnReturn', fullName)
        }
      } catch (error) {
        console.error("Error loading current user:", error)
        toast.error("Failed to load user data")
      }
    }

    loadCurrentUser()
  }, [form])

  async function onSubmit(data: TitleReturnFormData) {
    setIsLoading(true)
    
    try {
      const result = await returnTitleMovement(data)
      
      if (result.error) {
        toast.error(result.error)
        if (result.details) {
          Object.entries(result.details).forEach(([field, errors]) => {
            if (errors && Array.isArray(errors) && errors.length > 0) {
              form.setError(field as keyof TitleReturnFormData, {
                message: errors[0],
              })
            }
          })
        }
      } else if (result.success) {
        toast.success("Title return processed successfully")
        form.reset()
        onSuccess?.()
      }
    } catch (error) {
      console.error("Title return error:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-h-[80vh] overflow-y-auto px-1">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Compact Movement Info */}
          <div className="bg-muted/50 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <RotateCcw className="h-4 w-4 text-primary" />
              <div>
                <h4 className="font-semibold">Title Return</h4>
                <p className="text-sm text-muted-foreground">Property: {movement.property.titleNumber}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Owner:</span> {movement.property.registeredOwner}
              </div>
              <div>
                <span className="font-medium">Current Status:</span> {movement.movementStatus.replace('_', ' ')}
              </div>
              {movement.dateReleased && (
                <div>
                  <span className="font-medium">Released:</span> {format(new Date(movement.dateReleased), 'MMM dd, yyyy')}
                </div>
              )}
              {movement.releasedBy && (
                <div>
                  <span className="font-medium">Released By:</span> {movement.releasedBy}
                </div>
              )}
              {movement.receivedByName && (
                <div>
                  <span className="font-medium">Received By:</span> {movement.receivedByName}
                </div>
              )}
              {movement.receivedByTransmittal && (
                <div>
                  <span className="font-medium">Transmittal:</span> {movement.receivedByTransmittal}
                </div>
              )}
            </div>
          </div>

          {/* Return Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Return Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="returnedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Returned By</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Name of person returning the title" 
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Person who is returning the title
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="receivedByOnReturn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Received By</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          {...field}
                          disabled={true}
                          className="h-8 bg-muted pr-8"
                        />
                        <User className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      </div>
                    </FormControl>
                    <div className="text-xs text-muted-foreground">Current logged-in user</div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="returnDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Return Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "h-8 w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isLoading}
                          >
                            <CalendarIcon className="mr-2 h-3 w-3" />
                            {field.value ? (
                              format(field.value, "MMM dd, yyyy")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="returnCondition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Condition</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger className="h-8 w-full">
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="GOOD">Good</SelectItem>
                        <SelectItem value="FAIR">Fair</SelectItem>
                        <SelectItem value="POOR">Poor</SelectItem>
                        <SelectItem value="DAMAGED">Damaged</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Verification Checklist */}
            <div className="space-y-3">
              <h4 className="font-medium">Return Verification</h4>
              
              <FormField
                control={form.control}
                name="documentsComplete"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>All documents are complete and present</FormLabel>
                      <FormDescription>
                        Verify that all required documents are included with the title
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="titleIntact"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Title document is intact and readable</FormLabel>
                      <FormDescription>
                        Confirm that the title document is in readable condition
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="returnNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Return Notes (Optional)</FormLabel>
                  <FormControl>
                    <textarea
                      placeholder="Any additional notes about the return..."
                      {...field}
                      disabled={isLoading}
                      rows={3}
                      className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </FormControl>
                  <FormDescription>
                    Record any observations or special circumstances
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Warning for incomplete verification */}
          {(!form.watch('documentsComplete') || !form.watch('titleIntact')) && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-800">Verification Issues Detected</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Please ensure all verification items are checked before processing the return. 
                    If there are issues, document them in the return notes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex items-center space-x-4 pt-6 border-t">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing Return...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Process Return
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