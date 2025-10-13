"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { 
  getSystemConfigsByCategory, 
  updateSystemConfig, 
  toggleSystemConfigStatus,
  type SystemConfigGroup,
  type SystemConfigItem 
} from "@/lib/actions/system-config-actions"
import { 
  Settings, 
  Edit, 
  Save, 
  X, 
  Calendar,
  Key,
  FileText,
  Database,
  Mail,
  Shield,
  Globe,
  Monitor
} from "lucide-react"
import { toast } from "sonner"

interface SystemSettingsListProps {
  searchParams: Promise<{
    search?: string
    category?: string
    status?: string
    page?: string
  }>
}

// Category icons
const categoryIcons = {
  'App': Globe,
  'Application': Globe,
  'Email': Mail,
  'Security': Shield,
  'Database': Database,
  'Api': Settings,
  'UI': Monitor,
  'User Interface': Monitor,
  'System': Settings,
  'General': FileText
}

function getCategoryIcon(category: string) {
  return categoryIcons[category as keyof typeof categoryIcons] || Settings
}

function getStatusColor(isActive: boolean) {
  return isActive 
    ? "bg-green-100 text-green-800 border-green-200" 
    : "bg-gray-100 text-gray-800 border-gray-200"
}

export function SystemSettingsList({ searchParams }: SystemSettingsListProps) {
  const [configGroups, setConfigGroups] = useState<SystemConfigGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [editingConfig, setEditingConfig] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ value: string; description: string }>({ value: '', description: '' })
  const [filters, setFilters] = useState<{
    search?: string
    category?: string
    status?: string
  }>({})

  useEffect(() => {
    const loadFilters = async () => {
      const params = await searchParams
      setFilters(params)
    }
    loadFilters()
  }, [searchParams])

  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    setLoading(true)
    try {
      const result = await getSystemConfigsByCategory()
      setConfigGroups(result)
    } catch (error) {
      console.error("Error loading system configs:", error)
      toast.error("Failed to load system configurations")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (config: SystemConfigItem) => {
    setEditingConfig(config.id)
    setEditValues({
      value: config.value,
      description: config.description || ''
    })
  }

  const handleSave = async (configId: string) => {
    try {
      const result = await updateSystemConfig(
        configId, 
        editValues.value, 
        editValues.description
      )
      
      if (result.success) {
        toast.success("Configuration updated successfully")
        setEditingConfig(null)
        loadConfigs()
      } else {
        toast.error(result.error || "Failed to update configuration")
      }
    } catch (error) {
      console.error("Error updating config:", error)
      toast.error("Failed to update configuration")
    }
  }

  const handleCancel = () => {
    setEditingConfig(null)
    setEditValues({ value: '', description: '' })
  }

  const handleToggleStatus = async (configId: string) => {
    try {
      const result = await toggleSystemConfigStatus(configId)
      
      if (result.success) {
        toast.success("Configuration status updated")
        loadConfigs()
      } else {
        toast.error(result.error || "Failed to update status")
      }
    } catch (error) {
      console.error("Error toggling status:", error)
      toast.error("Failed to update status")
    }
  }

  // Filter configs based on search and filters
  const filteredGroups = configGroups.map(group => ({
    ...group,
    configs: group.configs.filter(config => {
      const matchesSearch = !filters.search || 
        config.key.toLowerCase().includes(filters.search.toLowerCase()) ||
        config.value.toLowerCase().includes(filters.search.toLowerCase()) ||
        (config.description && config.description.toLowerCase().includes(filters.search.toLowerCase()))

      const matchesCategory = !filters.category || 
        filters.category === "all-categories" || 
        group.category.toLowerCase() === filters.category.toLowerCase()

      const matchesStatus = !filters.status || 
        filters.status === "all-status" || 
        (filters.status === "active" && config.isActive) ||
        (filters.status === "inactive" && !config.isActive)

      return matchesSearch && matchesCategory && matchesStatus
    })
  })).filter(group => group.configs.length > 0)

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading system configurations...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (configGroups.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Settings className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No configurations found</h3>
          <p className="text-muted-foreground text-center">
            No system configurations have been set up yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (filteredGroups.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No configurations match your criteria</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter settings.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {filteredGroups.map((group) => {
        const CategoryIcon = getCategoryIcon(group.category)
        
        return (
          <Card key={group.category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CategoryIcon className="h-5 w-5" />
                {group.category}
                <Badge variant="outline" className="ml-2">
                  {group.configs.length} setting{group.configs.length !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {group.configs.map((config) => (
                  <Card key={config.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <Key className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-sm">{config.key}</span>
                              <Badge className={getStatusColor(config.isActive)}>
                                {config.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            {config.description && (
                              <p className="text-sm text-muted-foreground">
                                {config.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={config.isActive}
                              onCheckedChange={() => handleToggleStatus(config.id)}
                            />
                          </div>
                        </div>

                        {editingConfig === config.id ? (
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium">Value</label>
                              <Input
                                value={editValues.value}
                                onChange={(e) => setEditValues(prev => ({ ...prev, value: e.target.value }))}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Description</label>
                              <Textarea
                                value={editValues.description}
                                onChange={(e) => setEditValues(prev => ({ ...prev, description: e.target.value }))}
                                className="mt-1"
                                rows={2}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleSave(config.id)}>
                                <Save className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleCancel}>
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="border p-3 rounded-md">
                              <div className="text-sm font-mono break-all">
                                {config.value}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>Updated {new Date(config.updatedAt).toLocaleDateString()}</span>
                              </div>
                              <Button size="sm" variant="outline" onClick={() => handleEdit(config)}>
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}
      
      <div className="text-center text-sm text-muted-foreground">
        Showing {filteredGroups.reduce((sum, group) => sum + group.configs.length, 0)} configurations
      </div>
    </div>
  )
}