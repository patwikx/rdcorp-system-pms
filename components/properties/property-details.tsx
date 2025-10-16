'use client'

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { PropertyWithFullDetails } from "@/lib/actions/property-actions"
import { PropertyTabs } from "./property-tabs"
import { PropertyOverview } from "./property-overview"
import { PropertyRealPropertyTax } from "./property-real-property-tax"
import { PropertyTitleMovements } from "./property-title-movements"
import { PropertyDocuments } from "./property-documents"
import { PropertyChangeHistory } from "./property-change-history"

interface PropertyDetailsProps {
  property: PropertyWithFullDetails
}

export function PropertyDetails({ property }: PropertyDetailsProps) {
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (tabFromUrl && ['overview', 'taxes', 'movements', 'documents', 'history'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl])

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <PropertyOverview property={property} />
      case "taxes":
        return <PropertyRealPropertyTax property={property} />
      case "movements":
        return <PropertyTitleMovements property={property} />
      case "documents":
        return <PropertyDocuments property={property} />
      case "history":
        return <PropertyChangeHistory property={property} />
      default:
        return <PropertyOverview property={property} />
    }
  }

  return (
    <div className="space-y-6">
      <PropertyTabs 
        property={property} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />
      <div className="mt-6">
        {renderTabContent()}
      </div>
    </div>
  )
}