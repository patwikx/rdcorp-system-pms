import { CreateUserForm } from "@/components/users/create-user-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CreateUserPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center space-x-2 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/users">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Users
          </Link>
        </Button>
      </div>
      
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Create User</h2>
        <p className="text-muted-foreground">
          Add a new user to the system
        </p>
      </div>

      <CreateUserForm />
    </div>
  )
}