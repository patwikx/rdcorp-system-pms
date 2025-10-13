import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Receipt, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { getTaxSummary } from "@/lib/actions/real-property-tax-actions"

export async function PropertyTaxSummary() {
  const summary = await getTaxSummary()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Tax Records</CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.totalTaxes}</div>
          <p className="text-xs text-muted-foreground">
            ₱{parseFloat(summary.totalAmount).toLocaleString()} total amount
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Paid Taxes</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{summary.paidTaxes}</div>
          <p className="text-xs text-muted-foreground">
            ₱{parseFloat(summary.paidAmount).toLocaleString()} collected
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Unpaid Taxes</CardTitle>
          <Clock className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{summary.unpaidTaxes}</div>
          <p className="text-xs text-muted-foreground">
            ₱{parseFloat(summary.unpaidAmount).toLocaleString()} outstanding
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue Taxes</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{summary.overdueTaxes}</div>
          <p className="text-xs text-muted-foreground">
            Past due date
          </p>
        </CardContent>
      </Card>
    </div>
  )
}