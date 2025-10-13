import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Receipt, TrendingUp, Calendar } from "lucide-react"
import { getPaymentHistory } from "@/lib/actions/real-property-tax-actions"

export async function PaymentHistorySummary() {
  const currentYear = new Date().getFullYear()
  const lastYear = currentYear - 1
  
  const [currentYearPayments, lastYearPayments, allPayments] = await Promise.all([
    getPaymentHistory({ year: currentYear }),
    getPaymentHistory({ year: lastYear }),
    getPaymentHistory()
  ])

  const currentYearAmount = currentYearPayments.payments.reduce(
    (sum: number, payment: { taxAmount: string }) => sum + parseFloat(payment.taxAmount), 0
  )
  
  const lastYearAmount = lastYearPayments.payments.reduce(
    (sum: number, payment: { taxAmount: string }) => sum + parseFloat(payment.taxAmount), 0
  )

  const totalAmount = allPayments.payments.reduce(
    (sum: number, payment: { taxAmount: string }) => sum + parseFloat(payment.taxAmount), 0
  )

  const growthRate = lastYearAmount > 0 
    ? ((currentYearAmount - lastYearAmount) / lastYearAmount) * 100 
    : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{allPayments.totalCount}</div>
          <p className="text-xs text-muted-foreground">
            ₱{totalAmount.toLocaleString()} collected
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{currentYear} Payments</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentYearPayments.totalCount}</div>
          <p className="text-xs text-muted-foreground">
            ₱{currentYearAmount.toLocaleString()} this year
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            vs {lastYear}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}