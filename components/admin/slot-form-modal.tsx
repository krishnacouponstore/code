"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  FileText,
  DollarSign,
  Upload,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react"
import type { AdminSlot } from "@/lib/mock-data"

type PricingTier = {
  min_quantity: number
  max_quantity: number | null
  unit_price: number
  label?: string
}

type ValidationResult = {
  total_lines: number
  valid_codes: number
  duplicates: number
  invalid_format: number
  ready_to_upload: number
  codes: string[]
}

type SlotFormData = {
  name: string
  description: string
  image_url: string
  is_published: boolean
  pricing_tiers: PricingTier[]
  codes_to_upload: string[]
}

type SlotFormModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  slot?: AdminSlot | null
  onSubmit: (data: SlotFormData) => void
}

export function SlotFormModal({ open, onOpenChange, slot, onSubmit }: SlotFormModalProps) {
  const isEditing = !!slot
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState("basic")
  const [skipUpload, setSkipUpload] = useState(true)
  const [pastedCodes, setPastedCodes] = useState("")
  const [codeValidation, setCodeValidation] = useState<ValidationResult | null>(null)

  const [formData, setFormData] = useState<SlotFormData>({
    name: "",
    description: "",
    image_url: "",
    is_published: false,
    pricing_tiers: [{ min_quantity: 1, max_quantity: null, unit_price: 10 }],
    codes_to_upload: [],
  })

  useEffect(() => {
    if (slot) {
      setFormData({
        name: slot.name,
        description: slot.description,
        image_url: slot.image_url || "",
        is_published: slot.is_published,
        pricing_tiers:
          slot.pricing_tiers.length > 0
            ? slot.pricing_tiers
            : [{ min_quantity: 1, max_quantity: null, unit_price: 10 }],
        codes_to_upload: [],
      })
    } else {
      setFormData({
        name: "",
        description: "",
        image_url: "",
        is_published: false,
        pricing_tiers: [{ min_quantity: 1, max_quantity: null, unit_price: 10 }],
        codes_to_upload: [],
      })
    }
    setErrors({})
    setActiveTab("basic")
    setSkipUpload(true)
    setPastedCodes("")
    setCodeValidation(null)
  }, [slot, open])

  const validateCodes = (rawText: string): ValidationResult => {
    const lines = rawText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
    const validCodeRegex = /^[A-Za-z0-9-]{10,30}$/

    const validCodes: string[] = []
    const seenCodes = new Set<string>()
    let duplicates = 0
    let invalidFormat = 0

    for (const line of lines) {
      if (!validCodeRegex.test(line)) {
        invalidFormat++
        continue
      }

      if (seenCodes.has(line)) {
        duplicates++
        continue
      }

      seenCodes.add(line)
      validCodes.push(line)
    }

    return {
      total_lines: lines.length,
      valid_codes: validCodes.length,
      duplicates,
      invalid_format: invalidFormat,
      ready_to_upload: validCodes.length,
      codes: validCodes,
    }
  }

  const handlePasteChange = (value: string) => {
    setPastedCodes(value)
    if (value.trim()) {
      const validation = validateCodes(value)
      setCodeValidation(validation)
      setFormData({ ...formData, codes_to_upload: validation.codes })
    } else {
      setCodeValidation(null)
      setFormData({ ...formData, codes_to_upload: [] })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Coupon name is required"
    } else if (formData.name.length < 3) {
      newErrors.name = "Coupon name must be at least 3 characters"
    } else if (formData.name.length > 50) {
      newErrors.name = "Coupon name must be less than 50 characters"
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    } else if (formData.description.length > 200) {
      newErrors.description = "Description must be less than 200 characters"
    }

    // Validate pricing tiers
    for (let i = 0; i < formData.pricing_tiers.length; i++) {
      const tier = formData.pricing_tiers[i]
      if (tier.unit_price <= 0) {
        newErrors[`tier_${i}_price`] = "Price must be positive"
      }
      if (tier.min_quantity < 1) {
        newErrors[`tier_${i}_min`] = "Min quantity must be at least 1"
      }
      if (tier.max_quantity !== null && tier.max_quantity < tier.min_quantity) {
        newErrors[`tier_${i}_max`] = "Max must be greater than min"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      setActiveTab("basic")
      return
    }

    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    onSubmit(formData)
    setIsLoading(false)
    onOpenChange(false)
  }

  const addPricingTier = () => {
    const lastTier = formData.pricing_tiers[formData.pricing_tiers.length - 1]
    const newMinQuantity = lastTier.max_quantity ? lastTier.max_quantity + 1 : lastTier.min_quantity + 50

    setFormData({
      ...formData,
      pricing_tiers: [
        ...formData.pricing_tiers.slice(0, -1),
        { ...lastTier, max_quantity: newMinQuantity - 1 },
        { min_quantity: newMinQuantity, max_quantity: null, unit_price: Math.max(1, lastTier.unit_price - 2) },
      ],
    })
  }

  const removePricingTier = (index: number) => {
    if (formData.pricing_tiers.length <= 1) return
    const newTiers = formData.pricing_tiers.filter((_, i) => i !== index)
    if (newTiers.length > 0) {
      newTiers[newTiers.length - 1].max_quantity = null
    }
    setFormData({ ...formData, pricing_tiers: newTiers })
  }

  const updatePricingTier = (index: number, field: keyof PricingTier, value: number | string | null) => {
    const newTiers = [...formData.pricing_tiers]
    newTiers[index] = { ...newTiers[index], [field]: value }
    setFormData({ ...formData, pricing_tiers: newTiers })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditing ? `Edit Coupon - ${slot.name}` : "Create New Coupon"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditing ? "Update the coupon details below" : "Fill in the details to create a new coupon category"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3 bg-secondary">
            <TabsTrigger
              value="basic"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <FileText className="h-4 w-4 mr-2" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger
              value="pricing"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Pricing
            </TabsTrigger>
            {!isEditing && (
              <TabsTrigger
                value="codes"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Codes
              </TabsTrigger>
            )}
          </TabsList>

          {/* Tab 1: Basic Information */}
          <TabsContent value="basic" className="mt-4 space-y-6">
            {/* Coupon Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">
                Coupon Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Flipkart Grocery Coupon"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-secondary border-border text-foreground"
              />
              {errors.name && (
                <p className="text-destructive text-sm flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.name}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe what this coupon is for and any usage conditions"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-secondary border-border text-foreground min-h-[80px]"
                maxLength={200}
              />
              <div className="flex justify-between">
                {errors.description ? (
                  <p className="text-destructive text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.description}
                  </p>
                ) : (
                  <span />
                )}
                <span className="text-xs text-muted-foreground">{formData.description.length}/200</span>
              </div>
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <Label htmlFor="image_url" className="text-foreground">
                Image URL <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="image_url"
                placeholder="https://example.com/image.jpg"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="bg-secondary border-border text-foreground"
              />
              <p className="text-xs text-muted-foreground">Add a logo or icon URL for this coupon</p>
            </div>

            {/* Status Toggle */}
            <div className="flex items-center justify-between p-4 bg-secondary rounded-lg border border-border">
              <div>
                <Label htmlFor="is_published" className="text-foreground">
                  Published
                </Label>
                <p className="text-xs text-muted-foreground mt-1">Published coupons are visible to customers</p>
              </div>
              <Switch
                id="is_published"
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
              />
            </div>
          </TabsContent>

          {/* Tab 2: Pricing Tiers */}
          <TabsContent value="pricing" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">Pricing Tiers</Label>
                <p className="text-xs text-muted-foreground mt-1">Add quantity-based pricing for bulk discounts</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPricingTier}
                className="border-border text-foreground bg-transparent"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Tier
              </Button>
            </div>

            <div className="space-y-3">
              {formData.pricing_tiers.map((tier, index) => (
                <div key={index} className="p-4 bg-secondary rounded-lg border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Tier {index + 1}</span>
                    {formData.pricing_tiers.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePricingTier(index)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Min Qty</Label>
                      <Input
                        type="number"
                        min={1}
                        value={tier.min_quantity}
                        onChange={(e) => updatePricingTier(index, "min_quantity", Number.parseInt(e.target.value) || 1)}
                        className="bg-background border-border text-foreground"
                      />
                      {errors[`tier_${index}_min`] && (
                        <p className="text-destructive text-xs">{errors[`tier_${index}_min`]}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Max Qty</Label>
                      <Input
                        type="number"
                        min={tier.min_quantity}
                        value={tier.max_quantity ?? ""}
                        placeholder="∞"
                        onChange={(e) =>
                          updatePricingTier(
                            index,
                            "max_quantity",
                            e.target.value ? Number.parseInt(e.target.value) : null,
                          )
                        }
                        className="bg-background border-border text-foreground"
                        disabled={index === formData.pricing_tiers.length - 1}
                      />
                      {errors[`tier_${index}_max`] && (
                        <p className="text-destructive text-xs">{errors[`tier_${index}_max`]}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Price (₹)</Label>
                      <Input
                        type="number"
                        min={0.01}
                        step={0.01}
                        value={tier.unit_price}
                        onChange={(e) => updatePricingTier(index, "unit_price", Number.parseFloat(e.target.value) || 0)}
                        className="bg-background border-border text-foreground"
                      />
                      {errors[`tier_${index}_price`] && (
                        <p className="text-destructive text-xs">{errors[`tier_${index}_price`]}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Label (optional)</Label>
                    <Input
                      placeholder="e.g., Perfect for small orders"
                      value={tier.label || ""}
                      onChange={(e) => updatePricingTier(index, "label", e.target.value)}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Tab 3: Upload Codes (only for create mode) */}
          {!isEditing && (
            <TabsContent value="codes" className="mt-4 space-y-4">
              <div>
                <Label className="text-foreground">Upload Coupon Codes (Optional)</Label>
                <p className="text-xs text-muted-foreground mt-1">You can upload codes now or add them later</p>
              </div>

              {/* Skip checkbox */}
              <div className="flex items-center space-x-2 p-4 bg-secondary rounded-lg border border-border">
                <Checkbox
                  id="skip_upload"
                  checked={skipUpload}
                  onCheckedChange={(checked) => {
                    setSkipUpload(checked as boolean)
                    if (checked) {
                      setPastedCodes("")
                      setCodeValidation(null)
                      setFormData({ ...formData, codes_to_upload: [] })
                    }
                  }}
                />
                <Label htmlFor="skip_upload" className="text-foreground cursor-pointer">
                  Skip for now, I'll upload codes later
                </Label>
              </div>

              {/* Upload section */}
              {!skipUpload && (
                <div className="space-y-4">
                  <Textarea
                    placeholder="Paste codes here, one per line&#10;&#10;Example:&#10;FKG00000000000001&#10;FKG00000000000002&#10;FKG00000000000003"
                    value={pastedCodes}
                    onChange={(e) => handlePasteChange(e.target.value)}
                    className="bg-secondary border-border text-foreground font-mono text-sm min-h-[150px]"
                  />

                  {/* Validation results */}
                  {codeValidation && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-4 gap-2">
                        <div className="bg-secondary rounded-lg p-2 text-center">
                          <p className="text-lg font-bold text-foreground">{codeValidation.total_lines}</p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                        <div className="bg-green-500/10 rounded-lg p-2 text-center">
                          <p className="text-lg font-bold text-green-500">{codeValidation.valid_codes}</p>
                          <p className="text-xs text-green-500">Valid</p>
                        </div>
                        <div className="bg-yellow-500/10 rounded-lg p-2 text-center">
                          <p className="text-lg font-bold text-yellow-500">{codeValidation.duplicates}</p>
                          <p className="text-xs text-yellow-500">Duplicates</p>
                        </div>
                        <div className="bg-destructive/10 rounded-lg p-2 text-center">
                          <p className="text-lg font-bold text-destructive">{codeValidation.invalid_format}</p>
                          <p className="text-xs text-destructive">Invalid</p>
                        </div>
                      </div>

                      {codeValidation.valid_codes > 0 && (
                        <div className="flex items-center gap-2 text-sm text-green-500">
                          <CheckCircle className="h-4 w-4" />
                          {codeValidation.valid_codes} codes ready to upload
                        </div>
                      )}
                      {codeValidation.duplicates > 0 && (
                        <div className="flex items-center gap-2 text-sm text-yellow-500">
                          <AlertTriangle className="h-4 w-4" />
                          {codeValidation.duplicates} duplicates will be skipped
                        </div>
                      )}
                      {codeValidation.invalid_format > 0 && (
                        <div className="flex items-center gap-2 text-sm text-destructive">
                          <XCircle className="h-4 w-4" />
                          {codeValidation.invalid_format} codes have invalid format
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>

        {/* Created date for editing */}
        {isEditing && slot && (
          <p className="text-xs text-muted-foreground mt-4">
            Created on:{" "}
            {new Date(slot.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        )}

        <DialogFooter className="gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border text-foreground"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Saving..." : "Creating..."}
              </>
            ) : (
              <>{isEditing ? "Save Changes" : "Create Coupon"}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
