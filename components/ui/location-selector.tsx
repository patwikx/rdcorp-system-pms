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
import { 
  regions, 
  provinces, 
  cities, 
  barangays 
} from "select-philippines-address"

interface ProvinceData {
  province_code: string
  province_name: string
  region_code: string
}

interface CityData {
  city_code: string
  city_name: string
  province_code: string
}

interface BarangayData {
  brgy_code: string
  brgy_name: string
  city_code: string
}

interface LocationSelectorProps {
  selectedProvince?: string
  selectedCity?: string
  selectedBarangay?: string
  onProvinceChange?: (province: string, provinceName: string) => void
  onCityChange?: (city: string, cityName: string) => void
  onBarangayChange?: (barangay: string, barangayName: string) => void
  disabled?: boolean
}

export function LocationSelector({
  selectedProvince,
  selectedCity,
  selectedBarangay,
  onProvinceChange,
  onCityChange,
  onBarangayChange,
  disabled = false
}: LocationSelectorProps) {
  const [provinceList, setProvinceList] = useState<ProvinceData[]>([])
  const [cityList, setCityList] = useState<CityData[]>([])
  const [barangayList, setBarangayList] = useState<BarangayData[]>([])
  
  const [provinceOpen, setProvinceOpen] = useState(false)
  const [cityOpen, setCityOpen] = useState(false)
  const [barangayOpen, setBarangayOpen] = useState(false)

  // Load all provinces on component mount
  useEffect(() => {
    const loadAllProvinces = async () => {
      try {
        // Get all regions first
        const regionData = await regions()
        const allProvinces: ProvinceData[] = []
        
        // Load provinces from all regions
        for (const region of regionData) {
          const provinceData = await provinces(region.region_code)
          allProvinces.push(...provinceData)
        }
        
        // Remove duplicates and sort provinces alphabetically
        const uniqueProvinces = allProvinces.filter((province, index, self) => 
          index === self.findIndex(p => p.province_code === province.province_code)
        )
        uniqueProvinces.sort((a, b) => a.province_name.localeCompare(b.province_name))
        setProvinceList(uniqueProvinces)
      } catch (error) {
        console.error("Error loading provinces:", error)
      }
    }
    loadAllProvinces()
  }, [])

  // Load cities when province changes
  useEffect(() => {
    const loadCities = async () => {
      if (selectedProvince) {
        try {
          const cityData = await cities(selectedProvince)
          setCityList(cityData)
        } catch (error) {
          console.error("Error loading cities:", error)
        }
      } else {
        setCityList([])
      }
    }
    loadCities()
  }, [selectedProvince])

  // Load barangays when city changes
  useEffect(() => {
    const loadBarangays = async () => {
      if (selectedCity) {
        try {
          const barangayData = await barangays(selectedCity)
          setBarangayList(barangayData)
        } catch (error) {
          console.error("Error loading barangays:", error)
        }
      } else {
        setBarangayList([])
      }
    }
    loadBarangays()
  }, [selectedCity])

  const handleProvinceChange = (provinceCode: string) => {
    const province = provinceList.find(p => p.province_code === provinceCode)
    if (province && onProvinceChange) {
      onProvinceChange(provinceCode, province.province_name)
    }
    // Clear dependent selections
    onCityChange?.("", "")
    onBarangayChange?.("", "")
    setProvinceOpen(false)
  }

  const handleCityChange = (cityCode: string) => {
    const city = cityList.find(c => c.city_code === cityCode)
    if (city && onCityChange) {
      onCityChange(cityCode, city.city_name)
    }
    // Clear dependent selections
    onBarangayChange?.("", "")
    setCityOpen(false)
  }

  const handleBarangayChange = (barangayCode: string) => {
    const barangay = barangayList.find(b => b.brgy_code === barangayCode)
    if (barangay && onBarangayChange) {
      onBarangayChange(barangayCode, barangay.brgy_name)
    }
    setBarangayOpen(false)
  }

  const getSelectedProvinceName = () => {
    const province = provinceList.find(p => p.province_code === selectedProvince)
    return province?.province_name || ""
  }

  const getSelectedCityName = () => {
    const city = cityList.find(c => c.city_code === selectedCity)
    return city?.city_name || ""
  }

  const getSelectedBarangayName = () => {
    const barangay = barangayList.find(b => b.brgy_code === selectedBarangay)
    return barangay?.brgy_name || ""
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Province Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Province</label>
        <Popover open={provinceOpen} onOpenChange={setProvinceOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={provinceOpen}
              className="w-full justify-between"
              disabled={disabled}
            >
              {selectedProvince
                ? getSelectedProvinceName()
                : "Select province..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search province..." />
              <CommandList>
                <CommandEmpty>No province found.</CommandEmpty>
                <CommandGroup>
                  {provinceList.map((province) => (
                    <CommandItem
                      key={`${province.province_code}-${province.region_code}`}
                      value={province.province_name}
                      onSelect={() => handleProvinceChange(province.province_code)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedProvince === province.province_code ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {province.province_name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* City Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">City/Municipality</label>
        <Popover open={cityOpen} onOpenChange={setCityOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={cityOpen}
              className="w-full justify-between"
              disabled={disabled || !selectedProvince || cityList.length === 0}
            >
              {selectedCity
                ? getSelectedCityName()
                : "Select city..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search city..." />
              <CommandList>
                <CommandEmpty>No city found.</CommandEmpty>
                <CommandGroup>
                  {cityList.map((city) => (
                    <CommandItem
                      key={city.city_code}
                      value={city.city_name}
                      onSelect={() => handleCityChange(city.city_code)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCity === city.city_code ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {city.city_name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Barangay Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Barangay</label>
        <Popover open={barangayOpen} onOpenChange={setBarangayOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={barangayOpen}
              className="w-full justify-between"
              disabled={disabled || !selectedCity || barangayList.length === 0}
            >
              {selectedBarangay
                ? getSelectedBarangayName()
                : "Select barangay..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search barangay..." />
              <CommandList>
                <CommandEmpty>No barangay found.</CommandEmpty>
                <CommandGroup>
                  {barangayList.map((barangay) => (
                    <CommandItem
                      key={barangay.brgy_code}
                      value={barangay.brgy_name}
                      onSelect={() => handleBarangayChange(barangay.brgy_code)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedBarangay === barangay.brgy_code ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {barangay.brgy_name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}