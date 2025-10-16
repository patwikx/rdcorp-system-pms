"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { RealPropertyTaxPaymentSchema, type RealPropertyTaxPaymentData } from "@/lib/validations/real-property-tax-schema"
import { markTaxAsPaid } from "@/lib/actions/real-property-tax-actions"
import { PaymentMethod } from "@prisma/client"
import { CheckCircle, X, CalendarIcon, Receipt } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface MarkPaidDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  taxId: string
  taxDecNo: string
  taxAmount: number
  onSuccess?: () => void
}

const paymentMethodOptions = [
  { value: PaymentMethod.CASH, label: "Cash" },
  { value: PaymentMethod.CHECK, label: "Check" },
  { value: PaymentMethod.BANK_TRANSFER, label: "Bank Transfer" },
  { value: PaymentMethod.ONLINE_PAYMENT, label: "Online Payment" },
  { value: PaymentMethod.CREDIT_CARD, label: "Credit Card" },
  { value: PaymentMethod.DEBIT_CARD, label: "Debit Card" },
]

export function MarkPaidDialog({ 
  isOpen, 
  onOpenChange, 
  taxId, 
  taxDecNo, 
  taxAmount, 
  onSuccess 
}: MarkPaidDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm({
    resolver: zodResolver(RealPropertyTaxPaymentSchema),
    defaultValues: {
      id: taxId,
      amountPaid: taxAmount,
      paymentDate: new Date(),
      officialReceiptNumber: "",
      paymentMethod: PaymentMethod.CASH,
      discount: null,
      penalty: null,
      interest: null,
      notes: "",
    },
  })

  async function onSubmit(data: RealPropertyTaxPaymentData) {
    setIsLoading(true)
    
    try {
      const result = await markTaxAsPaid(data)
      
      if (result.error) {
        toast.error(result.error)
        if (result.details) {
          Object.entries(result.details).forEach(([field, error]) => {
            if (error && Array.isArray(error)) {
              form.setError(field as keyof RealPropertyTaxPaymentData, {
                message: error[0],
              })
            }
          })
        }
      } else {
        toast.success("Tax marked as paid successfully")
        form.reset()
        onOpenChange(false)
        onSuccess?.()
      }
    } catch (error) {
      console.error("Mark paid error:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[600px] !max-w-[600px] !min-w-[600px]" style={{ width: '600px', maxWidth: '600px', minWidth: '600px' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Mark Tax as Paid</span>
          </DialogTitle>
          <DialogDescription>
            Record payment details for tax record: {taxDecNo}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto px-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Payment Amount */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Tax Amount Due</h4>
                    <p className="text-sm text-muted-foreground">Original amount to be paid</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">₱{taxAmount.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Payment Details</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amountPaid"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount Paid (₱)</FormLabel>
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
                          Actual amount paid (can be partial)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {paymentMethodOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="officialReceiptNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Official Receipt Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., OR-2024-001234" 
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>
                          Receipt or reference number
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Payment Date</FormLabel>
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
                                date > new Date() || 
                                date < new Date("1900-01-01") ||
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

              {/* Additional Charges */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Additional Charges (Optional)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="discount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount (₱)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || null)}
                            value={field.value?.toString() || ""}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>
                          Early payment discount
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="penalty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Penalty (₱)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || null)}
                            value={field.value?.toString() || ""}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>
                          Late payment penalty
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="interest"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interest (₱)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || null)}
                            value={field.value?.toString() || ""}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>
                          Interest charges
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Notes (Optional)</FormLabel>
                    <FormControl>
                      <textarea
                        placeholder="Additional notes about this payment..."
                        {...field}
                        disabled={isLoading}
                        rows={3}
                        className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </FormControl>
                    <FormDescription>
                      Optional notes about the payment
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Buttons */}
              <div className="flex items-center space-x-4 pt-6 border-t">
                <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Paid
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}