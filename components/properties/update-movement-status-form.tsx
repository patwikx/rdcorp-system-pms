"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { TitleMovementUpdateSchema, type TitleMovementUpdateData } from "@/lib/validations/title-movement-schema"
import { updateTitleMovement } from "@/lib/actions/title-movement-actions"
import { MovementStatus } from "@prisma/client"
import { Save, X, Activity } from "lucide-react"
import { toast } from "sonner"

interface UpdateMovementStatusFormProps {
  movement: {
    id: string
    movementStatus: string
    receivedByTransmittal: string | null
    receivedByName: string | null
    turnedOverBy: string | null
    receivedByPerson: string | null
    returnedBy: string | null
    receivedByOnReturn: string | null
  }
  onSuccess?: () => void
  onCancel?: () => void
}

const movementStatusOptions = [
  { 
    value: MovementStatus.RELEASED, 
    label: "Released", 
    color: "bg-blue-500",
    description: "Title has been released from custody"
  },
  { 
    value: MovementStatus.IN_TRANSIT, 
    label: "In Transit", 
    color: "bg-yellow-500",
    description: "Title is being transmitted"
  },
  { 
    value: MovementStatus.RECEIVED, 
    label: "Received", 
    color: "bg-green-500",
    description: "Title has been received by recipient"
  },
  { 
    value: MovementStatus.RETURNED, 
    label: "Returned", 
    color: "bg-purple-500",
    description: "Title has been returned to custody"
  },
  { 
    value: MovementStatus.LOST, 
    label: "Lost", 
    color: "bg-red-500",
    description: "Title has been reported lost"
  },
  { 
    value: MovementStatus.PENDING_RETURN, 
    label: "Pending Return", 
    color: "bg-orange-500",
    description: "Title is pending return to custody"
  },
]

export function UpdateMovementStatusForm({ 
  movement, 
  onSuccess, 
  onCancel 
}: UpdateMovementStatusFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm({
    resolver: zodResolver(TitleMovementUpdateSchema),
    defaultValues: {
      id: movement.id,
      movementStatus: movement.movementStatus as MovementStatus,
      receivedByTransmittal: movement.receivedByTransmittal || "",
      receivedByName: movement.receivedByName || "",
      turnedOverBy: movement.turnedOverBy || "",
      receivedByPerson: movement.receivedByPerson || "",
      returnedBy: movement.returnedBy || "",
      receivedByOnReturn: movement.receivedByOnReturn || "",
    },
  })

  const selectedStatus = form.watch('movementStatus')

  async function onSubmit(data: TitleMovementUpdateData) {
    setIsLoading(true)
    
    try {
      const result = await updateTitleMovement(data)
      
      if (result.error) {
        toast.error(result.error)
        if (result.details) {
          Object.entries(result.details).forEach(([field, error]) => {
            if (error && Array.isArray(error)) {
              form.setError(field as keyof TitleMovementUpdateData, {
                message: error[0],
              })
            }
          })
        }
      } else {
        toast.success("Movement status updated successfully")
        onSuccess?.()
      }
    } catch (error) {
      console.error("Update movement status error:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const renderStatusSpecificFields = () => {
    switch (selectedStatus) {
      case MovementStatus.IN_TRANSIT:
        return (
          <FormField
            control={form.control}
            name="receivedByTransmittal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transmittal Number</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., TM-24-0001" 
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  Update transmittal reference if needed
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )

      case MovementStatus.RECEIVED:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="turnedOverBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Turned Over By</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Name of person who turned over" 
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Person who delivered the title
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="receivedByPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Received By</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Name of person who received" 
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Person who received the title
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )

      case MovementStatus.RETURNED:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="returnedBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Returned By</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Name of person who returned" 
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Person who returned the title
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
                  <FormLabel>Received By (On Return)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Name of person who received return" 
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Person who received the returned title
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-h-[80vh] overflow-y-auto px-1">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Current Status */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-primary" />
              <div>
                <h4 className="font-semibold">Update Movement Status</h4>
                <p className="text-sm text-muted-foreground">
                  Current Status: <span className="font-medium">{movement.movementStatus.replace('_', ' ')}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="movementStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select new status">
                          {field.value && (
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${movementStatusOptions.find(opt => opt.value === field.value)?.color}`} />
                              <span>{movementStatusOptions.find(opt => opt.value === field.value)?.label}</span>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {movementStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${option.color}`} />
                            <div>
                              <div>{option.label}</div>
                              <div className="text-xs text-muted-foreground">{option.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Status-specific fields */}
          {renderStatusSpecificFields()}

          {/* Status Description */}
          {selectedStatus && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <div className={`w-3 h-3 rounded-full mt-1 ${movementStatusOptions.find(opt => opt.value === selectedStatus)?.color}`} />
                <div>
                  <h4 className="font-semibold text-blue-800">
                    {movementStatusOptions.find(opt => opt.value === selectedStatus)?.label}
                  </h4>
                  <p className="text-sm text-blue-700 mt-1">
                    {movementStatusOptions.find(opt => opt.value === selectedStatus)?.description}
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
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Status
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