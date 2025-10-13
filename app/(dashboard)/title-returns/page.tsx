import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ReturnableTitlesContent } from "@/components/title-returns/returnable-titles-content"
import { RotateCcw, Clock, CheckCircle } from "lucide-react"

export default function TitleReturnsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Title Returns</h1>
        <p className="text-muted-foreground">
          Manage and process returns of property titles currently in circulation
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Titles Out</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-8 w-16" />}>
              <div className="text-2xl font-bold text-amber-600">-</div>
              <p className="text-xs text-muted-foreground">Currently released</p>
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Returns</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-8 w-16" />}>
              <div className="text-2xl font-bold text-red-600">-</div>
              <p className="text-xs text-muted-foreground">Past expected return</p>
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Returned Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-8 w-16" />}>
              <div className="text-2xl font-bold text-green-600">-</div>
              <p className="text-xs text-muted-foreground">Processed today</p>
            </Suspense>
          </CardContent>
        </Card>
      </div>

      <Suspense fallback={<TitleReturnsPageSkeleton />}>
        <ReturnableTitlesContent />
      </Suspense>
    </div>
  )
}

function TitleReturnsPageSkeleton() {
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