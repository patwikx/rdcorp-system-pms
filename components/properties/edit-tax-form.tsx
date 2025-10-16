"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { RealPropertyTaxUpdateSchema, type RealPropertyTaxUpdateData } from "@/lib/validations/real-property-tax-schema"
import { updateRealPropertyTax } from "@/lib/actions/real-property-tax-actions"
import { TaxStatus } from "@prisma/client"
import { Save, X, Calculator, CalendarIcon } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface EditTaxFormProps {
  tax: {
    id: string
    taxYear: number
    taxQuarter: number | null
    taxAmount: number
    dueDate: Date
    periodFrom: Date
    periodTo: Date
    status: string
    notes: string | null
  }
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

export function EditTaxForm({ tax, onSuccess, onCancel }: EditTaxFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isQuarterly, setIsQuarterly] = useState(tax.taxQuarter !== null)

  const form = useForm({
    resolver: zodResolver(RealPropertyTaxUpdateSchema),
    defaultValues: {
      id: tax.id,
      taxYear: tax.taxYear,
      taxQuarter: tax.taxQuarter,
      taxAmount: tax.taxAmount,
      dueDate: tax.dueDate,
      periodFrom: tax.periodFrom,
      periodTo: tax.periodTo,
      status: tax.status as TaxStatus,
      notes: tax.notes || "",
    },
  })



  const handleQuarterlyChange = (quarterly: boolean) => {
    setIsQuarterly(quarterly)
    if (!quarterly) {
      form.setValue('taxQuarter', null)
    } else {
      form.setValue('taxQuarter', 1)
    }
  }

  async function onSubmit(data: RealPropertyTaxUpdateData) {
    setIsLoading(true)
    
    try {
      const result = await updateRealPropertyTax(data)
      
      if (result.error) {
        toast.error(result.error)
        if (result.details) {
          Object.entries(result.details).forEach(([field, error]) => {
            if (error && Array.isArray(error)) {
              form.setError(field as keyof RealPropertyTaxUpdateData, {
                message: error[0],
              })
            }
          })
        }
      } else {
        toast.success("Tax record updated successfully")
        onSuccess?.()
      }
    } catch (error) {
      console.error("Update tax error:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-h-[80vh] overflow-y-auto px-1">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Tax Period */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Calculator className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Tax Period</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <FormLabel>Tax Period Type</FormLabel>
                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant={!isQuarterly ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleQuarterlyChange(false)}
                    disabled={isLoading}
                  >
                    Annual
                  </Button>
                  <Button
                    type="button"
                    variant={isQuarterly ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleQuarterlyChange(true)}
                    disabled={isLoading}
                  >
                    Quarterly
                  </Button>
                </div>
              </div>
            </div>

            {isQuarterly && (
              <FormField
                control={form.control}
                name="taxQuarter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quarter</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      value={field.value?.toString() || ""}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select quarter" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">Q1 (Jan-Mar)</SelectItem>
                        <SelectItem value="2">Q2 (Apr-Jun)</SelectItem>
                        <SelectItem value="3">Q3 (Jul-Sep)</SelectItem>
                        <SelectItem value="4">Q4 (Oct-Dec)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {/* Tax Amount */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tax Details</h3>
            
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
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Due Dates & Period</h3>
            
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
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isLoading}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
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
                          disabled={(date) =>
                            date < new Date("1900-01-01") || 
                            date > new Date("2100-12-31") ||
                            isLoading
                          }
                          captionLayout="dropdown"
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
                name="periodFrom"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Period From</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isLoading}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
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
                          disabled={(date) =>
                            date < new Date("1900-01-01") || 
                            date > new Date("2100-12-31") ||
                            isLoading
                          }
                          captionLayout="dropdown"
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
                name="periodTo"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Period To</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isLoading}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
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
                          disabled={(date) =>
                            date < new Date("1900-01-01") || 
                            date > new Date("2100-12-31") ||
                            isLoading
                          }
                          captionLayout="dropdown"
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Status and Notes */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status">
                            {field.value && (
                              <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${taxStatusOptions.find(opt => opt.value === field.value)?.color}`} />
                                <span>{taxStatusOptions.find(opt => opt.value === field.value)?.label}</span>
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {taxStatusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${option.color}`} />
                              <span>{option.label}</span>
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

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <textarea
                      placeholder="Additional notes about this tax record..."
                      {...field}
                      disabled={isLoading}
                      rows={3}
                      className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </FormControl>
                  <FormDescription>
                    Optional notes or comments about this tax record
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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
                  Update Tax Record
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