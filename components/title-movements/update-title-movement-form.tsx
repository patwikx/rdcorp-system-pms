"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TitleMovementUpdateSchema, type TitleMovementUpdateData } from "@/lib/validations/title-movement-schema"
import { updateTitleMovement, type TitleMovementWithDetails } from "@/lib/actions/title-movement-actions"
import { MovementStatus } from "@prisma/client"
import { Save, X, ArrowRight, CheckCircle, RotateCcw, Package } from "lucide-react"
import { toast } from "sonner"

interface UpdateTitleMovementFormProps {
  titleMovement: TitleMovementWithDetails
}

// Status progression mapping
const statusProgression = {
  [MovementStatus.RELEASED]: [MovementStatus.IN_TRANSIT, MovementStatus.LOST],
  [MovementStatus.IN_TRANSIT]: [MovementStatus.RECEIVED, MovementStatus.LOST],
  [MovementStatus.RECEIVED]: [MovementStatus.PENDING_RETURN, MovementStatus.RETURNED],
  [MovementStatus.PENDING_RETURN]: [MovementStatus.RETURNED],
  [MovementStatus.RETURNED]: [],
  [MovementStatus.LOST]: [],
}

function getStatusIcon(status: MovementStatus) {
  switch (status) {
    case MovementStatus.RELEASED:
      return Package
    case MovementStatus.IN_TRANSIT:
      return ArrowRight
    case MovementStatus.RECEIVED:
      return CheckCircle
    case MovementStatus.RETURNED:
      return RotateCcw
    case MovementStatus.PENDING_RETURN:
      return ArrowRight
    case MovementStatus.LOST:
      return X
    default:
      return Package
  }
}

export function UpdateTitleMovementForm({ titleMovement }: UpdateTitleMovementFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const availableStatuses = statusProgression[titleMovement.movementStatus] || []

  const form = useForm({
    resolver: zodResolver(TitleMovementUpdateSchema),
    defaultValues: {
      id: titleMovement.id,
      movementStatus: titleMovement.movementStatus,
      receivedByTransmittal: titleMovement.receivedByTransmittal || "",
      receivedByName: titleMovement.receivedByName || "",
      turnedOverBy: titleMovement.turnedOverBy || "",
      receivedByPerson: titleMovement.receivedByPerson || "",
      returnedBy: titleMovement.returnedBy || "",
      receivedByOnReturn: titleMovement.receivedByOnReturn || "",
    },
  })

  const selectedStatus = form.watch("movementStatus")

  async function onSubmit(data: TitleMovementUpdateData) {
    setIsLoading(true)
    
    try {
      const result = await updateTitleMovement(data)
      
      if (result.error) {
        toast.error(result.error)
        if (result.details) {
          Object.entries(result.details).forEach(([field, error]) => {
            if (error && typeof error === 'object' && '_errors' in error) {
              const messages = (error as { _errors: string[] })._errors
              if (messages && messages.length > 0) {
                form.setError(field as keyof TitleMovementUpdateData, {
                  message: messages[0],
                })
              }
            }
          })
        }
      } else {
        toast.success("Title movement updated successfully")
        router.push(`/title-movements/${titleMovement.id}`)
      }
    } catch (error) {
      console.error("Error updating title movement:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (availableStatuses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Movement Complete</h3>
          <p className="text-muted-foreground text-center">
            This title movement has reached its final status and cannot be updated further.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
              {(() => {
                const Icon = getStatusIcon(titleMovement.movementStatus)
                return <Icon className="h-5 w-5" />
              })()}
              <div>
                <p className="font-medium">{titleMovement.movementStatus.replace('_', ' ')}</p>
                <p className="text-sm text-muted-foreground">
                  Last updated: {new Date(titleMovement.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Update */}
        <Card>
          <CardHeader>
            <CardTitle>Update Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="movementStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select new status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableStatuses.map((status) => {
                        const Icon = getStatusIcon(status)
                        return (
                          <SelectItem key={status} value={status}>
                            <div className="flex items-center space-x-2">
                              <Icon className="h-4 w-4" />
                              <span>{status.replace('_', ' ')}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the next status in the movement process
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status-specific fields */}
            {selectedStatus === MovementStatus.IN_TRANSIT && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="receivedByTransmittal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transmittal Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Transmittal or reference number" 
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        Reference number for tracking in transit
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
                          placeholder="Name of receiving person" 
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        Person handling the transit
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {selectedStatus === MovementStatus.RECEIVED && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="turnedOverBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Turned Over By</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Name of person turning over" 
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        Person delivering the title
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
                      <FormLabel>Received By Person</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Name of receiving person" 
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        Person receiving the title
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {selectedStatus === MovementStatus.RETURNED && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="returnedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Returned By</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Name of person returning" 
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        Person returning the title
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
                      <FormLabel>Received By on Return</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Name of person receiving return" 
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        Person receiving the returned title
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>

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
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push(`/title-movements/${titleMovement.id}`)} 
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}