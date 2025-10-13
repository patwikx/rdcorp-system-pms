"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { Search, CheckCircle, Clock, AlertCircle, Receipt, ExternalLink } from "lucide-react"
import { getAllRealPropertyTaxes, type RealPropertyTaxWithDetails } from "@/lib/actions/real-property-tax-actions"
import { TaxStatus } from "@prisma/client"
import { format } from "date-fns"
import { toast } from "sonner"
import { MarkPaidDialog } from "./mark-paid-dialog"
import Link from "next/link"

export function PropertyTaxList() {
  const [taxes, setTaxes] = useState<RealPropertyTaxWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | TaxStatus>("all")
  const [selectedYear, setSelectedYear] = useState<string>("all")

  const [markPaidDialog, setMarkPaidDialog] = useState<{
    isOpen: boolean
    tax: RealPropertyTaxWithDetails | null
  }>({ isOpen: false, tax: null })


  const loadTaxes = useCallback(async () => {
    setLoading(true)
    try {
      const params: Parameters<typeof getAllRealPropertyTaxes>[0] = {}
      
      if (filterStatus !== "all") params.status = filterStatus
      if (selectedYear !== "all") params.year = parseInt(selectedYear)

      const result = await getAllRealPropertyTaxes(params)
      setTaxes(result.taxes)
    } catch (error) {
      console.error("Error loading taxes:", error)
      toast.error("Failed to load tax records")
    } finally {
      setLoading(false)
    }
  }, [filterStatus, selectedYear])

  useEffect(() => {
    loadTaxes()
  }, [loadTaxes])



  const handleMarkAsPaid = (tax: RealPropertyTaxWithDetails) => {
    setMarkPaidDialog({ isOpen: true, tax })
  }

  const handlePaymentRecorded = () => {
    setMarkPaidDialog({ isOpen: false, tax: null })
    loadTaxes()
    toast.success("Payment recorded successfully")
  }

  // Filter taxes based on search
  const filteredTaxes = taxes.filter(tax => {
    const matchesSearch = searchTerm === "" || 
      tax.property.titleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tax.property.registeredOwner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tax.property.city.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  // Get unique years for filter
  const availableYears = [...new Set(taxes.map(tax => tax.taxYear))].sort((a, b) => b - a)

  const getStatusBadge = (tax: RealPropertyTaxWithDetails) => {
    switch (tax.status) {
      case TaxStatus.PAID:
        return <Badge className="bg-green-600 text-white"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>
      case TaxStatus.PARTIALLY_PAID:
        return <Badge className="bg-blue-600 text-white"><Clock className="h-3 w-3 mr-1" />Partial</Badge>
      case TaxStatus.OVERDUE:
        return <Badge className="bg-red-600 text-white"><AlertCircle className="h-3 w-3 mr-1" />Overdue</Badge>
      case TaxStatus.DUE:
        return <Badge className="bg-yellow-600 text-white"><Clock className="h-3 w-3 mr-1" />Due</Badge>
      default:
        return <Badge className="bg-gray-600 text-white"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading tax records...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Tax Records</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Label htmlFor="search" className="text-sm font-medium mb-1">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by title number, owner, or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <div className="min-w-[140px]">
              <Label className="text-sm font-medium">Status</Label>
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as typeof filterStatus)}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value={TaxStatus.PAID}>Paid</SelectItem>
                  <SelectItem value={TaxStatus.PARTIALLY_PAID}>Partially Paid</SelectItem>
                  <SelectItem value={TaxStatus.DUE}>Due</SelectItem>
                  <SelectItem value={TaxStatus.OVERDUE}>Overdue</SelectItem>
                  <SelectItem value={TaxStatus.PENDING}>Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
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
          </div>
          

        </div>

        <div className="space-y-4">
          {filteredTaxes.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No tax records found</h3>
              <p className="mt-2 text-muted-foreground">
                {searchTerm || filterStatus !== "all" || selectedYear !== "all" 
                  ? "No records match your search criteria."
                  : "No property tax records found. Tax records are created from individual property pages."
                }
              </p>
            </div>
          ) : (
            filteredTaxes.map((tax) => (
              <Card key={tax.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <Link 
                      href={`/properties/${tax.property.id}`}
                      className="flex items-center space-x-3 flex-1 hover:opacity-80 transition-opacity"
                    >
                      <Receipt className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium">{tax.property.titleNumber}</span>
                          {getStatusBadge(tax)}
                          <span className="text-sm text-muted-foreground">
                            {tax.taxYear}
                            {tax.taxQuarter && ` Q${tax.taxQuarter}`}
                          </span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {tax.property.registeredOwner} • {tax.property.city}, {tax.property.province}
                          <br />
                          ₱{parseFloat(tax.taxAmount).toLocaleString()} due • Due: {format(new Date(tax.dueDate), 'MMM dd, yyyy')}
                          {tax.paymentDate && (
                            <span className="text-green-600"> • Paid: {format(new Date(tax.paymentDate), 'MMM dd, yyyy')}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                    <div className="flex items-center space-x-2">
                      {!tax.isPaid && (
                        <Button 
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleMarkAsPaid(tax)
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Paid
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {filteredTaxes.length > 0 && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Showing {filteredTaxes.length} tax records
          </div>
        )}
      </CardContent>

      {/* Mark as Paid Dialog */}
      {markPaidDialog.tax && (
        <MarkPaidDialog
          isOpen={markPaidDialog.isOpen}
          onOpenChange={(open) => setMarkPaidDialog({ isOpen: open, tax: null })}
          tax={markPaidDialog.tax}
          onSuccess={handlePaymentRecorded}
        />
      )}
    </Card>
  )
}