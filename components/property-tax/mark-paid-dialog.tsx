"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RealPropertyTaxPaymentSchema, type RealPropertyTaxPaymentData } from "@/lib/validations/real-property-tax-schema"
import { markTaxAsPaid, type RealPropertyTaxWithDetails } from "@/lib/actions/real-property-tax-actions"
import { PaymentMethod } from "@prisma/client"
import { Save, X, CalendarIcon, Receipt } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface MarkPaidDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  tax: RealPropertyTaxWithDetails
  onSuccess?: () => void
}

export function MarkPaidDialog({ isOpen, onOpenChange, tax, onSuccess }: MarkPaidDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<RealPropertyTaxPaymentData>({
    resolver: zodResolver(RealPropertyTaxPaymentSchema),
    defaultValues: {
      id: tax.id,
      amountPaid: parseFloat(tax.taxAmount),
      paymentDate: new Date(),
      officialReceiptNumber: "",
      paymentMethod: PaymentMethod.CASH,
      discount: 0,
      penalty: 0,
      interest: 0,
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
          Object.entries(result.details).forEach(([field, errors]) => {
            if (errors && Array.isArray(errors) && errors.length > 0) {
              form.setError(field as keyof RealPropertyTaxPaymentData, {
                message: errors[0],
              })
            }
          })
        }
      } else if (result.success) {
        toast.success("Payment recorded successfully")
        form.reset()
        onSuccess?.()
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Payment error:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const totalDue = parseFloat(tax.taxAmount)
  const amountPaid = form.watch('amountPaid')
  const discount = form.watch('discount') || 0
  const penalty = form.watch('penalty') || 0
  const interest = form.watch('interest') || 0
  
  const finalAmount = amountPaid + penalty + interest - discount
  const isPartialPayment = amountPaid < totalDue

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Receipt className="h-5 w-5" />
            <span>Record Payment</span>
          </DialogTitle>
        </DialogHeader>

        {/* Tax Information */}
        <div className="bg-muted/50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Property:</span> {tax.property.titleNumber}
            </div>
            <div>
              <span className="font-medium">Owner:</span> {tax.property.registeredOwner}
            </div>
            <div>
              <span className="font-medium">Tax Year:</span> {tax.taxYear}
              {tax.taxQuarter && ` Q${tax.taxQuarter}`}
            </div>
            <div>
              <span className="font-medium">Total Due:</span> ₱{totalDue.toLocaleString()}
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Payment Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Payment Details</h3>
              
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
                        Amount actually paid by the taxpayer
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
                      <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={PaymentMethod.CASH}>Cash</SelectItem>
                          <SelectItem value={PaymentMethod.CHECK}>Check</SelectItem>
                          <SelectItem value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</SelectItem>
                          <SelectItem value={PaymentMethod.ONLINE_PAYMENT}>Online Payment</SelectItem>
                          <SelectItem value={PaymentMethod.CREDIT_CARD}>Credit Card</SelectItem>
                          <SelectItem value={PaymentMethod.DEBIT_CARD}>Debit Card</SelectItem>
                        </SelectContent>
                      </Select>
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
                              variant="outline"
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
                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
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
                  name="officialReceiptNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Official Receipt Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="OR-2024-001234" 
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        Official receipt or reference number
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Adjustments */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Adjustments (Optional)</h3>
              
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
                          value={field.value || ''}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                          value={field.value || ''}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                          value={field.value || ''}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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

            {/* Payment Summary */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-semibold mb-3">Payment Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Amount Paid:</span>
                  <span>₱{amountPaid.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-₱{discount.toLocaleString()}</span>
                  </div>
                )}
                {penalty > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Penalty:</span>
                    <span>+₱{penalty.toLocaleString()}</span>
                  </div>
                )}
                {interest > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Interest:</span>
                    <span>+₱{interest.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Final Amount:</span>
                  <span>₱{finalAmount.toLocaleString()}</span>
                </div>
                {isPartialPayment && (
                  <div className="text-yellow-600 text-xs">
                    ⚠️ This is a partial payment. Remaining balance: ₱{(totalDue - amountPaid).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <textarea
                      placeholder="Additional notes about this payment..."
                      {...field}
                      disabled={isLoading}
                      rows={3}
                      className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Buttons */}
            <div className="flex items-center space-x-4 pt-6 border-t">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Recording...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Record Payment
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
      </DialogContent>
    </Dialog>
  )
}