"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Receipt, CheckCircle, CreditCard, Banknote, ExternalLink } from "lucide-react"
import Link from "next/link"
import { getPaymentHistory, type RealPropertyTaxWithDetails } from "@/lib/actions/real-property-tax-actions"
import { PaymentMethod } from "@prisma/client"
import { format } from "date-fns"
import { toast } from "sonner"

export function PaymentHistoryList() {
  const [payments, setPayments] = useState<RealPropertyTaxWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedYear, setSelectedYear] = useState<string>("all")
  const [selectedMethod, setSelectedMethod] = useState<string>("all")

  useEffect(() => {
    const loadPayments = async () => {
      setLoading(true)
      try {
        const params: Parameters<typeof getPaymentHistory>[0] = {}
        
        if (selectedYear !== "all") params.year = parseInt(selectedYear)

        const result = await getPaymentHistory(params)
        setPayments(result.payments)
      } catch (error) {
        console.error("Error loading payments:", error)
        toast.error("Failed to load payment history")
      } finally {
        setLoading(false)
      }
    }
    loadPayments()
  }, [selectedYear])

  // Filter payments based on search and method
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = searchTerm === "" || 
      payment.property.titleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.property.registeredOwner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.officialReceiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.property.city.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesMethod = selectedMethod === "all" || payment.paymentMethod === selectedMethod

    return matchesSearch && matchesMethod
  })

  // Get unique years and payment methods for filters
  const availableYears = [...new Set(payments.map(payment => payment.taxYear))].sort((a, b) => b - a)
  const availableMethods = [...new Set(payments.map(payment => payment.paymentMethod).filter((method): method is PaymentMethod => method !== null))]

  const getPaymentMethodBadge = (method: PaymentMethod | null) => {
    if (!method) return null
    
    const methodConfig = {
      [PaymentMethod.CASH]: { icon: Banknote, color: "bg-green-600 text-white" },
      [PaymentMethod.CHECK]: { icon: Receipt, color: "bg-blue-600 text-white" },
      [PaymentMethod.BANK_TRANSFER]: { icon: CreditCard, color: "bg-purple-600 text-white" },
      [PaymentMethod.ONLINE_PAYMENT]: { icon: CreditCard, color: "bg-indigo-600 text-white" },
      [PaymentMethod.CREDIT_CARD]: { icon: CreditCard, color: "bg-orange-600 text-white" },
      [PaymentMethod.DEBIT_CARD]: { icon: CreditCard, color: "bg-pink-600 text-white" },
    }

    const config = methodConfig[method]
    const Icon = config.icon

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {method.replace('_', ' ')}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading payment history...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Label htmlFor="search" className="text-sm font-medium mb-1">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by title, owner, receipt number, or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <div className="min-w-[120px]">
              <Label className="text-sm font-medium">Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="min-w-[140px]">
              <Label className="text-sm font-medium">Payment Method</Label>
              <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {availableMethods.map(method => (
                    <SelectItem key={method} value={method}>
                      {method.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No payment records found</h3>
              <p className="mt-2 text-muted-foreground">
                {searchTerm || selectedYear !== "all" || selectedMethod !== "all"
                  ? "No payments match your search criteria."
                  : "No payment records have been recorded yet."
                }
              </p>
            </div>
          ) : (
            filteredPayments.map((payment) => (
              <Link key={payment.id} href={`/properties/${payment.property.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium">{payment.property.titleNumber}</span>
                            {getPaymentMethodBadge(payment.paymentMethod)}
                            <span className="text-sm text-muted-foreground">
                              {payment.taxYear}
                              {payment.taxQuarter && ` Q${payment.taxQuarter}`}
                            </span>
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {payment.property.registeredOwner} • {payment.property.city}, {payment.property.province}
                            <br />
                            ₱{parseFloat(payment.amountPaid || payment.taxAmount).toLocaleString()} paid on {format(new Date(payment.paymentDate!), 'MMM dd, yyyy')}
                            {payment.officialReceiptNumber && (
                              <span> • Receipt: {payment.officialReceiptNumber}</span>
                            )}
                          </div>
                          {(payment.discount || payment.penalty || payment.interest) && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {payment.discount && parseFloat(payment.discount) > 0 && (
                                <span className="text-green-600">Discount: ₱{parseFloat(payment.discount).toLocaleString()} </span>
                              )}
                              {payment.penalty && parseFloat(payment.penalty) > 0 && (
                                <span className="text-red-600">Penalty: ₱{parseFloat(payment.penalty).toLocaleString()} </span>
                              )}
                              {payment.interest && parseFloat(payment.interest) > 0 && (
                                <span className="text-orange-600">Interest: ₱{parseFloat(payment.interest).toLocaleString()}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          ₱{parseFloat(payment.amountPaid || payment.taxAmount).toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {payment.recordedBy.firstName} {payment.recordedBy.lastName}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>

        {filteredPayments.length > 0 && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Showing {filteredPayments.length} payment records
          </div>
        )}
      </CardContent>
    </Card>
  )
}