import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ApprovalsContent } from "@/components/approvals/approvals-content"
import { CheckCircle, Clock, XCircle } from "lucide-react"

export default function ApprovalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Approval Center</h1>
        <p className="text-muted-foreground">
          Review and manage all pending approval requests across the system
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-8 w-16" />}>
              <div className="text-2xl font-bold text-amber-600">-</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-8 w-16" />}>
              <div className="text-2xl font-bold text-green-600">-</div>
              <p className="text-xs text-muted-foreground">Processed today</p>
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected Today</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-8 w-16" />}>
              <div className="text-2xl font-bold text-red-600">-</div>
              <p className="text-xs text-muted-foreground">Declined today</p>
            </Suspense>
          </CardContent>
        </Card>
      </div>

      <Suspense fallback={<ApprovalsPageSkeleton />}>
        <ApprovalsContent />
      </Suspense>
    </div>
  )
}

function ApprovalsPageSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}