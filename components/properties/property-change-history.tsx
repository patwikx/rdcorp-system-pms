"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  History, 
  Search, 
  Calendar, 
  User, 
  Edit, 
  Plus, 
  Trash2, 
  RotateCcw,
  Activity,
  AlertCircle,
} from "lucide-react"
import { PropertyWithFullDetails } from "@/lib/actions/property-actions"
import { format } from "date-fns"

interface PropertyChangeHistoryProps {
  property: PropertyWithFullDetails
}



export function PropertyChangeHistory({ property }: PropertyChangeHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterField, setFilterField] = useState<string>("all")

  // Use the change history data that's already loaded with the property
  const changeHistory = property.changeHistories || []

  // Filter change history
  const filteredHistory = changeHistory.filter(change => {
    const matchesSearch = searchTerm === "" || 
      change.fieldName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (change.oldValue && change.oldValue.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (change.newValue && change.newValue.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (change.reason && change.reason.toLowerCase().includes(searchTerm.toLowerCase())) ||
      `${change.changedBy.firstName} ${change.changedBy.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === "all" || change.changeType === filterType
    const matchesField = filterField === "all" || change.fieldName === filterField

    return matchesSearch && matchesType && matchesField
  })

  // Get unique change types and fields for filters
  const availableTypes = [...new Set(changeHistory.map(change => change.changeType))]
  const availableFields = [...new Set(changeHistory.map(change => change.fieldName))]

  const getChangeTypeBadge = (type: string) => {
    const colors = {
      'CREATE': 'bg-green-100 text-green-800 border-green-200',
      'UPDATE': 'bg-blue-100 text-blue-800 border-blue-200',
      'DELETE': 'bg-red-100 text-red-800 border-red-200',
      'RESTORE': 'bg-purple-100 text-purple-800 border-purple-200',
      'STATUS_CHANGE': 'bg-amber-100 text-amber-800 border-amber-200',
      'BULK_UPDATE': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    }
    return (
      <Badge variant="outline" className={colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {type.replace('_', ' ')}
      </Badge>
    )
  }

  const getChangeTypeIcon = (type: string) => {
    const icons = {
      'CREATE': Plus,
      'UPDATE': Edit,
      'DELETE': Trash2,
      'RESTORE': RotateCcw,
      'STATUS_CHANGE': Activity,
      'BULK_UPDATE': Edit,
    }
    const Icon = icons[type as keyof typeof icons] || Edit
    return <Icon className="h-4 w-4" />
  }

  const formatFieldName = (fieldName: string) => {
    // Convert camelCase to readable format
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  }

  const formatValue = (value: string | null) => {
    if (value === null || value === undefined) return "—"
    if (value === "") return "(empty)"
    
    // Try to parse JSON for complex values
    try {
      const parsed = JSON.parse(value)
      if (typeof parsed === 'object') {
        return JSON.stringify(parsed, null, 2)
      }
    } catch {
      // Not JSON, return as is
    }
    
    return value
  }



  if (changeHistory.length === 0) {
    return (
      <div className="text-center py-12">
        <History className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No change history found</h3>
        <p className="mt-2 text-muted-foreground">
          This property doesn&apos;t have any recorded changes yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg">Change History</CardTitle>
            <CardDescription>Track all modifications made to this property</CardDescription>
          </div>
          <History className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{changeHistory.length}</div>
          <p className="text-sm text-muted-foreground">Total changes recorded</p>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Change Records</CardTitle>
          <CardDescription>View detailed history of all property modifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-medium mb-1">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by field, value, reason, or user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="min-w-[140px]">
                <Label className="text-sm font-medium">Change Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {availableTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[140px]">
                <Label className="text-sm font-medium">Field</Label>
                <Select value={filterField} onValueChange={setFilterField}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="All Fields" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Fields</SelectItem>
                    {availableFields.map(field => (
                      <SelectItem key={field} value={field}>
                        {formatFieldName(field)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Change History Records */}
          <div className="space-y-4">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground mt-2">No changes match your search criteria.</p>
              </div>
            ) : (
              filteredHistory.map((change, index) => (
                <Card key={change.id} className="relative">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-4">
                        {/* Change Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getChangeTypeIcon(change.changeType)}
                            <div>
                              <h4 className="font-semibold">{formatFieldName(change.fieldName)}</h4>
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>{format(new Date(change.changedAt), 'MMM dd, yyyy HH:mm')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getChangeTypeBadge(change.changeType)}
                            <span className="text-sm text-muted-foreground">#{index + 1}</span>
                          </div>
                        </div>

                        {/* Change Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-muted-foreground">Previous Value</div>
                            <div className="bg-red-50 border border-red-200 rounded-md p-3">
                              <pre className="text-sm text-red-800 whitespace-pre-wrap font-mono">
                                {formatValue(change.oldValue)}
                              </pre>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="text-sm font-medium text-muted-foreground">New Value</div>
                            <div className="bg-green-50 border border-green-200 rounded-md p-3">
                              <pre className="text-sm text-green-800 whitespace-pre-wrap font-mono">
                                {formatValue(change.newValue)}
                              </pre>
                            </div>
                          </div>
                        </div>

                        {/* Reason */}
                        {change.reason && (
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-muted-foreground">Reason</div>
                            <p className="text-sm bg-muted/50 p-3 rounded-md">{change.reason}</p>
                          </div>
                        )}

                        {/* Changed By */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                          <div className="flex items-center space-x-2">
                            <User className="h-3 w-3" />
                            <span>
                              Changed by {change.changedBy.firstName} {change.changedBy.lastName}
                            </span>
                          </div>
                          <div>
                            {format(new Date(change.changedAt), 'MMM dd, yyyy HH:mm:ss')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {filteredHistory.length > 0 && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Showing {filteredHistory.length} of {changeHistory.length} change records
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}