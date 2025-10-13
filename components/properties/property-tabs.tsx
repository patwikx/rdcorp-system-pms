import { Calculator, FileText, Activity, History } from "lucide-react"
import { PropertyWithFullDetails } from "@/lib/actions/property-actions"

interface PropertyTabsProps {
  property: PropertyWithFullDetails
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function PropertyTabs({ property, activeTab, setActiveTab }: PropertyTabsProps) {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'taxes', label: `Real Property Tax (${property._count.realPropertyTaxes})`, icon: Calculator },
    { id: 'movements', label: `Title Movements (${property._count.titleMovements})`, icon: Activity },
    { id: 'documents', label: `Documents (${property._count.documents})`, icon: FileText },
    { id: 'history', label: `Change History (${property._count.changeHistories})`, icon: History },
  ]

  return (
    <div className="border-b">
      <nav className="flex space-x-8 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}