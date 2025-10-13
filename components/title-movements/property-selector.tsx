"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { getProperties } from "@/lib/actions/property-actions"

interface Property {
  id: string
  titleNumber: string
  registeredOwner: string
}

interface PropertySelectorProps {
  value?: string
  onValueChange?: (propertyId: string, property: Property) => void
  disabled?: boolean
}

export function PropertySelector({
  value,
  onValueChange,
  disabled = false
}: PropertySelectorProps) {
  const [open, setOpen] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadProperties = async () => {
      setLoading(true)
      try {
        const result = await getProperties({ limit: 100 })
        const propertyList = result.properties.map(p => ({
          id: p.id,
          titleNumber: p.titleNumber,
          registeredOwner: p.registeredOwner,
        }))
        setProperties(propertyList)
      } catch (error) {
        console.error("Error loading properties:", error)
      } finally {
        setLoading(false)
      }
    }

    loadProperties()
  }, [])

  const selectedProperty = properties.find(p => p.id === value)

  const handleSelect = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId)
    if (property && onValueChange) {
      onValueChange(propertyId, property)
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled || loading}
        >
          {selectedProperty
            ? `${selectedProperty.titleNumber} - ${selectedProperty.registeredOwner}`
            : loading
            ? "Loading properties..."
            : "Select property..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search properties..." />
          <CommandList>
            <CommandEmpty>No property found.</CommandEmpty>
            <CommandGroup>
              {properties.map((property) => (
                <CommandItem
                  key={property.id}
                  value={`${property.titleNumber} ${property.registeredOwner}`}
                  onSelect={() => handleSelect(property.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === property.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{property.titleNumber}</span>
                    <span className="text-sm text-muted-foreground">{property.registeredOwner}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}