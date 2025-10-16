"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LocationSelector } from "@/components/ui/location-selector"
import { FileUpload, UploadedFileDisplay } from "@/components/file-upload"
import { PropertySchema, type PropertyFormData } from "@/lib/validations/property-schema"
import { createProperty } from "@/lib/actions/property-actions"
import { PropertyClassification, PropertyStatus } from "@prisma/client"
import { 
  Save, 
  X, 
  Building, 
  MapPin, 
  User, 
  FileText, 
  Home,
  Building2,
  Factory,
  Wheat,
  Layers,
  School,
  Hash,
  Ruler,
  Upload
} from "lucide-react"
import { toast } from "sonner"

// Classification icons mapping
const classificationIcons = {
  [PropertyClassification.RESIDENTIAL]: Home,
  [PropertyClassification.COMMERCIAL]: Building2,
  [PropertyClassification.INDUSTRIAL]: Factory,
  [PropertyClassification.AGRICULTURAL]: Wheat,
  [PropertyClassification.MIXED_USE]: Layers,
  [PropertyClassification.INSTITUTIONAL]: School,
}

// Status colors mapping
const statusColors = {
  [PropertyStatus.ACTIVE]: "bg-green-500",
  [PropertyStatus.COLLATERAL]: "bg-yellow-500",
  [PropertyStatus.SOLD]: "bg-blue-500",
  [PropertyStatus.UNDER_DEVELOPMENT]: "bg-purple-500",
  [PropertyStatus.FORECLOSED]: "bg-red-500",
  [PropertyStatus.DISPOSED]: "bg-gray-500",
  [PropertyStatus.PENDING_TRANSFER]: "bg-orange-500",
  [PropertyStatus.INACTIVE]: "bg-gray-400",
}

interface UploadedFile {
  fileName: string
  name: string
  fileUrl: string
}

export function CreatePropertyForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedProvince, setSelectedProvince] = useState("")
  const [selectedCity, setSelectedCity] = useState("")
  const [selectedBarangay, setSelectedBarangay] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const router = useRouter()

  const form = useForm({
    resolver: zodResolver(PropertySchema),
    defaultValues: {
      titleNumber: "",
      lotNumber: "",
      lotArea: 0,
      location: "",
      barangay: "",
      city: "",
      province: "",
      zipCode: "",
      description: "",
      classification: PropertyClassification.RESIDENTIAL,
      status: PropertyStatus.ACTIVE,
      registeredOwner: "",
      bank: "",
      custodyOfTitle: "",
      encumbrance: "",
      mortgageDetails: "",
      borrowerMortgagor: "",
      taxDeclaration: "",
      remarks: "",
    },
  })

  const handleFileUploadComplete = (result: UploadedFile) => {
    if (uploadedFiles.length >= 5) {
      toast.error("Maximum 5 files allowed")
      return
    }
    
    setUploadedFiles(prev => [...prev, result])
    toast.success(`File "${result.name}" uploaded successfully`)
  }

  const handleFileUploadError = (error: string) => {
    toast.error(error)
  }

  const handleRemoveFile = (fileToRemove: UploadedFile) => {
    setUploadedFiles(prev => prev.filter(file => file !== fileToRemove))
    toast.success("File removed")
  }

  async function onSubmit(data: PropertyFormData) {
    setIsLoading(true)
    
    try {
      const result = await createProperty(data, uploadedFiles)
      
      if (result.error) {
        toast.error(result.error)
        if (result.details) {
          Object.entries(result.details).forEach(([field, error]) => {
            if (error && typeof error === 'object' && '_errors' in error) { 
             const messages = (error as { _errors: string[] })._errors
              if (messages && messages.length > 0) {
                form.setError(field as keyof PropertyFormData, {
                  message: messages[0],
                })
              }
            }
          })
        }
      } else {
        toast.success("Property created successfully")
        if (uploadedFiles.length > 0) {
          toast.success(`Property created with ${uploadedFiles.length} file(s) attached`)
        }
        router.push("/properties")
      }
    } catch (error) {
      console.error("Error creating property:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Basic Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title and Lot Number Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="titleNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Hash className="h-4 w-4" />
                      <span>Title Number</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., TCT-12345, OCT-67890" 
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Official title certificate number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lotNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>Lot Number</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Lot 1, Block 2" 
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Lot identification number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Lot Area, Classification, and Status Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="lotArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Ruler className="h-4 w-4" />
                      <span>Lot Area (sqm)</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Total area in square meters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="classification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mt-[-12px]">Classification</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger className="mt-[-12px]">
                          <SelectValue placeholder="Select classification" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(PropertyClassification).map((classification) => {
                          const Icon = classificationIcons[classification]
                          return (
                            <SelectItem key={classification} value={classification}>
                              <div className="flex items-center space-x-2">
                                <Icon className="h-4 w-4" />
                                <span>{classification.replace('_', ' ')}</span>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mt-[-12px]">Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger className="mt-[-12px]">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(PropertyStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
                              <span>{status.replace('_', ' ')}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Property description..."
                      {...field}
                      disabled={isLoading}
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional property description
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Location Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specific Location</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed address or location description..."
                      {...field}
                      disabled={isLoading}
                      rows={2}
                    />
                  </FormControl>
                  <FormDescription>
                    Detailed address or location description
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Philippines Location Selector */}
            <div className="space-y-4">
              <LocationSelector
                selectedProvince={selectedProvince}
                selectedCity={selectedCity}
                selectedBarangay={selectedBarangay}
                onProvinceChange={(provinceCode, provinceName) => {
                  setSelectedProvince(provinceCode)
                  form.setValue("province", provinceName)
                  setSelectedCity("")
                  setSelectedBarangay("")
                  form.setValue("city", "")
                  form.setValue("barangay", "")
                }}
                onCityChange={(cityCode, cityName) => {
                  setSelectedCity(cityCode)
                  form.setValue("city", cityName)
                  setSelectedBarangay("")
                  form.setValue("barangay", "")
                }}
                onBarangayChange={(barangayCode, barangayName) => {
                  setSelectedBarangay(barangayCode)
                  form.setValue("barangay", barangayName)
                }}
                disabled={isLoading}
              />
              
            </div>
          </CardContent>
        </Card>

        {/* Owner Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Owner Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="registeredOwner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registered Owner</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Full name of the registered owner" 
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Legal owner as registered in the title
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bank"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Bank name (if applicable)" 
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Bank holding the title (if applicable)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="custodyOfTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custody of Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Who currently holds the title" 
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Current custodian of the physical title
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Financial Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="encumbrance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Encumbrance</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Details of any encumbrances (liens, mortgages, etc.)"
                        {...field}
                        disabled={isLoading}
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      Any liens, mortgages, or other encumbrances
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mortgageDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mortgage Details</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Mortgage information and details"
                        {...field}
                        disabled={isLoading}
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      Detailed mortgage information
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="borrowerMortgagor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Borrower/Mortgagor</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Name of borrower or mortgagor" 
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Person or entity who borrowed against the property
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes or remarks"
                        {...field}
                        disabled={isLoading}
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      Any additional notes or remarks
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center space-x-2">
                  <Upload className="h-4 w-4" />
                  <span>Supporting Documents</span>
                </label>
                <FileUpload
                  onUploadComplete={handleFileUploadComplete}
                  onUploadError={handleFileUploadError}
                  disabled={isLoading}
                  maxSize={10}
                  multiple={true}
                  maxFiles={5}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp"
                />
                <p className="text-sm text-muted-foreground">
                  Upload supporting documents (max 5 files, 10MB each)
                </p>
              </div>
            </div>

            {/* Display uploaded files */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">
                  Uploaded Files ({uploadedFiles.length}/5)
                </h4>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <UploadedFileDisplay
                      key={index}
                      fileName={file.fileName}
                      name={file.name}
                      fileUrl={file.fileUrl}
                      onRemove={() => handleRemoveFile(file)}
                      disabled={isLoading}
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex items-center space-x-4 pt-6 border-t">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Property
              </>
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push("/properties")} 
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}