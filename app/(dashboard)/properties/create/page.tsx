import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreatePropertyForm } from "@/components/properties/create-property-form"

export default function CreatePropertyPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Property</h1>
          <p className="text-muted-foreground">
            Add a new property to the system
          </p>
        </div>
      </div>

      <CreatePropertyForm />
    </div>
  )
}