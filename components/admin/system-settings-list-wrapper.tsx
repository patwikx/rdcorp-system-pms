import { SystemSettingsList } from "./system-settings-list"

interface SystemSettingsListWrapperProps {
  searchParams: Promise<{
    search?: string
    category?: string
    status?: string
    page?: string
  }>
}

export function SystemSettingsListWrapper({ searchParams }: SystemSettingsListWrapperProps) {
  return <SystemSettingsList searchParams={searchParams} />
}