'use client'

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { 
  Bell, 
  Moon, 
  Globe, 
  Save,
  Loader2,
  Monitor,
  Sun
} from "lucide-react"

interface PreferencesFormProps {
  userId: string
}

export function PreferencesForm({ }: PreferencesFormProps) {
  const [isPending, startTransition] = useTransition()
  
  const [preferences, setPreferences] = useState({
    theme: 'system',
    language: 'en',
    timezone: 'UTC',
    emailNotifications: true,
    pushNotifications: false,
    auditLogNotifications: true,
    approvalNotifications: true,
    systemMaintenanceNotifications: true,
    dateFormat: 'MM/dd/yyyy',
    timeFormat: '12h',
    currency: 'PHP',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    startTransition(async () => {
      try {
        // In a real app, you'd save these to a user preferences table
        toast.success('Preferences saved successfully')
      } catch (error) {
        console.error('Error saving preferences:', error)
        toast.error('Failed to save preferences')
      }
    })
  }

  const handleSwitchChange = (field: string, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSelectChange = (field: string, value: string) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize how the application looks and feels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Theme</Label>
              <div className="text-sm text-muted-foreground">
                Choose your preferred color theme
              </div>
            </div>
            <Select value={preferences.theme} onValueChange={(value) => handleSelectChange('theme', value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Light
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Dark
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    System
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Language</Label>
              <div className="text-sm text-muted-foreground">
                Select your preferred language
              </div>
            </div>
            <Select value={preferences.language} onValueChange={(value) => handleSelectChange('language', value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fil">Filipino</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Email Notifications</Label>
              <div className="text-sm text-muted-foreground">
                Receive notifications via email
              </div>
            </div>
            <Switch
              checked={preferences.emailNotifications}
              onCheckedChange={(checked) => handleSwitchChange('emailNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Push Notifications</Label>
              <div className="text-sm text-muted-foreground">
                Receive browser push notifications
              </div>
            </div>
            <Switch
              checked={preferences.pushNotifications}
              onCheckedChange={(checked) => handleSwitchChange('pushNotifications', checked)}
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <Label className="text-base">Notification Types</Label>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Approval Notifications</Label>
                <div className="text-sm text-muted-foreground">
                  Get notified about approval requests
                </div>
              </div>
              <Switch
                checked={preferences.approvalNotifications}
                onCheckedChange={(checked) => handleSwitchChange('approvalNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Audit Log Notifications</Label>
                <div className="text-sm text-muted-foreground">
                  Get notified about important system activities
                </div>
              </div>
              <Switch
                checked={preferences.auditLogNotifications}
                onCheckedChange={(checked) => handleSwitchChange('auditLogNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>System Maintenance</Label>
                <div className="text-sm text-muted-foreground">
                  Get notified about system maintenance
                </div>
              </div>
              <Switch
                checked={preferences.systemMaintenanceNotifications}
                onCheckedChange={(checked) => handleSwitchChange('systemMaintenanceNotifications', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regional Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Regional Settings
          </CardTitle>
          <CardDescription>
            Configure date, time, and currency formats
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date Format</Label>
              <Select value={preferences.dateFormat} onValueChange={(value) => handleSelectChange('dateFormat', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/dd/yyyy">MM/dd/yyyy</SelectItem>
                  <SelectItem value="dd/MM/yyyy">dd/MM/yyyy</SelectItem>
                  <SelectItem value="yyyy-MM-dd">yyyy-MM-dd</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Time Format</Label>
              <Select value={preferences.timeFormat} onValueChange={(value) => handleSelectChange('timeFormat', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12 Hour</SelectItem>
                  <SelectItem value="24h">24 Hour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select value={preferences.timezone} onValueChange={(value) => handleSelectChange('timezone', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="Asia/Manila">Asia/Manila</SelectItem>
                  <SelectItem value="America/New_York">America/New_York</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={preferences.currency} onValueChange={(value) => handleSelectChange('currency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PHP">PHP (₱)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            // Reset to default values
            setPreferences({
              theme: 'system',
              language: 'en',
              timezone: 'UTC',
              emailNotifications: true,
              pushNotifications: false,
              auditLogNotifications: true,
              approvalNotifications: true,
              systemMaintenanceNotifications: true,
              dateFormat: 'MM/dd/yyyy',
              timeFormat: '12h',
              currency: 'PHP',
            })
          }}
          disabled={isPending}
        >
          Reset to Defaults
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </form>
  )
}