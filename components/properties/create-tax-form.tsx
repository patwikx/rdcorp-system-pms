"use client"

import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { CalendarIcon, Save, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { createRealPropertyTax } from "@/lib/actions/real-property-tax-actions"
import { RealPropertyTaxSchema, type RealPropertyTaxFormData } from "@/lib/validations/real-property-tax-schema"
import { TaxStatus } from "@prisma/client"

interface CreateTaxFormProps {
  propertyId: string
  onSuccess?: () => void
  onCancel?: () => void
}

const taxStatusOptions = [
  { value: TaxStatus.PENDING, label: "Pending", color: "bg-yellow-500" },
  { value: TaxStatus.DUE, label: "Due", color: "bg-orange-500" },
  { value: TaxStatus.OVERDUE, label: "Overdue", color: "bg-red-500" },
  { value: TaxStatus.PAID, label: "Paid", color: "bg-green-500" },
  { value: TaxStatus.PARTIALLY_PAID, label: "Partially Paid", color: "bg-blue-500" },
  { value: TaxStatus.CONTESTED, label: "Contested", color: "bg-purple-500" },
  { value: TaxStatus.EXEMPTED, label: "Exempted", color: "bg-gray-500" },
  { value: TaxStatus.WAIVED, label: "Waived", color: "bg-indigo-500" },
]

export function CreateTaxForm({ propertyId, onSuccess, onCancel }: CreateTaxFormProps) {
  const [isLoading, setIsLoading] = React.useState(false)

  const form = useForm<RealPropertyTaxFormData>({
    resolver: zodResolver(RealPropertyTaxSchema),
    defaultValues: {
      propertyId,
      taxYear: new Date().getFullYear(),
      taxQuarter: null,
      taxAmount: 0,
      dueDate: new Date(),
      periodFrom: new Date(),
      periodTo: new Date(),
      status: TaxStatus.PENDING,
      notes: "",
    },
  })

  const onSubmit = async (data: RealPropertyTaxFormData) => {
    setIsLoading(true)
    try {
      const result = await createRealPropertyTax(data)
      
      if (result.error) {
        toast.error(result.error)
        if (result.details) {
          Object.entries(result.details).forEach(([field, errors]) => {
            if (errors && Array.isArray(errors) && errors.length > 0) {
              form.setError(field as keyof RealPropertyTaxFormData, {
                message: errors[0],
              })
            }
          })
        }
        return
      }

      toast.success("Tax record created successfully")
      onSuccess?.()
    } catch (error) {
      console.error("Error creating tax record:", error)
      toast.error("Failed to create tax record")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Tax Period & Amount */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="taxYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax Year</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      placeholder="2024" 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || new Date().getFullYear())}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Year for which the tax is being assessed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="taxQuarter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quarter</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value === "annual" ? null : parseInt(value))}
                    value={field.value?.toString() || "annual"}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select quarter" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="annual">Annual</SelectItem>
                      <SelectItem value="1">Q1</SelectItem>
                      <SelectItem value="2">Q2</SelectItem>
                      <SelectItem value="3">Q3</SelectItem>
                      <SelectItem value="4">Q4</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Leave as Annual for yearly tax assessment
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="taxAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax Amount (₱)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      step="0.01"
                      placeholder="0.00" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Total tax amount due for this period
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Due Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={isLoading}
                        >
                          {field.value ? (
                            format(field.value, "MMM dd, yyyy")
                          ) : (
                            <span>Pick date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date("1900-01-01")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    When the tax payment is due
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="periodFrom"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Period From</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={isLoading}
                        >
                          {field.value ? (
                            format(field.value, "MMM dd, yyyy")
                          ) : (
                            <span>Pick date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date("1900-01-01")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Start of tax period
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="periodTo"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Period To</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={isLoading}
                        >
                          {field.value ? (
                            format(field.value, "MMM dd, yyyy")
                          ) : (
                            <span>Pick date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date("1900-01-01")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    End of tax period
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {taxStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${option.color}`} />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Current status of this tax record
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter any additional notes..."
                    className="resize-none h-20"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  Any additional information about this tax record
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Creating..." : "Create Tax Record"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}