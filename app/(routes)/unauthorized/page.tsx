import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[600px] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <ShieldAlert className="h-10 w-10 text-destructive" />
      </div>
      
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
        <p className="text-muted-foreground max-w-md">
          You don&apos;t have permission to access this resource. Please contact your administrator if you believe this is an error.
        </p>
      </div>

      <div className="flex gap-2 mt-4">
        <Button asChild variant="outline">
          <Link href="/dashboard">
            Go to Dashboard
          </Link>
        </Button>
        <Button asChild>
          <Link href="/settings/profile">
            View Profile
          </Link>
        </Button>
      </div>
    </div>
  );
}