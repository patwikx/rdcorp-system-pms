'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { exportPropertyTaxesToCSV } from "@/lib/actions/real-property-tax-actions"
import { toast } from "sonner"

interface ExportPropertyTaxesButtonProps {
  propertyId: string
  propertyTitle: string
}

export function ExportPropertyTaxesButton({ propertyId, propertyTitle }: ExportPropertyTaxesButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      const csvContent = await exportPropertyTaxesToCSV(propertyId)
      
      // Create and download the CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `property-taxes-${propertyTitle}-${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        toast.success("Property taxes exported successfully")
      }
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export property taxes")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center space-x-2"
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      <span>{isExporting ? "Exporting..." : "Export CSV"}</span>
    </Button>
  )
}