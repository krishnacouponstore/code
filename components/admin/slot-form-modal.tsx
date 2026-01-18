"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
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
  File,
  ListOrdered,
  Image,
  Calendar,
} from "lucide-react"
import { useCreateSlot, useUpdateSlot, type Slot, type PricingTier, type RedemptionStep } from "@/hooks/use-slots"
import { useToast } from "@/hooks/use-toast"

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
  thumbnail_url: string
  expiry_date: string
  is_published: boolean
  pricing_tiers: PricingTier[]
  redemption_steps: RedemptionStep[]
  codes_to_upload: string[]
}

type SlotFormModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  slot?: Slot | null
  onSuccess?: () => void
}

export function SlotFormModal({ open, onOpenChange, slot, onSuccess }: SlotFormModalProps) {
  const isEditing = !!slot
  const { toast } = useToast()
  const createSlotMutation = useCreateSlot()
  const updateSlotMutation = useUpdateSlot()

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState("basic")
  const [skipUpload, setSkipUpload] = useState(true)
  const [pastedCodes, setPastedCodes] = useState("")
  const [codeValidation, setCodeValidation] = useState<ValidationResult | null>(null)
  const [uploadMethod, setUploadMethod] = useState<"paste" | "file">("paste")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<SlotFormData>({
    name: "",
    description: "",
    thumbnail_url: "",
    expiry_date: "",
    is_published: false,
    pricing_tiers: [{ min_quantity: 1, max_quantity: null, unit_price: 10 }],
    redemption_steps: [],
    codes_to_upload: [],
  })

  useEffect(() => {
    if (slot) {
      setFormData({
        name: slot.name,
        description: slot.description,
        thumbnail_url: slot.thumbnail_url || "",
        expiry_date: slot.expiry_date ? new Date(slot.expiry_date).toISOString().split('T')[0] : "",
        is_published: slot.is_published,
        pricing_tiers:
          slot.pricing_tiers.length > 0
            ? slot.pricing_tiers.map((t) => ({
                min_quantity: t.min_quantity,
                max_quantity: t.max_quantity,
                unit_price: t.unit_price,
                label: t.label,
              }))
            : [{ min_quantity: 1, max_quantity: null, unit_price: 10 }],
        redemption_steps: slot.redemption_steps?.length
          ? slot.redemption_steps.map((s) => ({
              step_number: s.step_number,
              step_text: s.step_text,
            }))
          : [],
        codes_to_upload: [],
      })
    } else {
      setFormData({
        name: "",
        description: "",
        thumbnail_url: "",
        expiry_date: "",
        is_published: false,
        pricing_tiers: [{ min_quantity: 1, max_quantity: null, unit_price: 10 }],
        redemption_steps: [],
        codes_to_upload: [],
      })
    }
    setErrors({})
    setActiveTab("basic")
    setSkipUpload(true)
    setPastedCodes("")
    setCodeValidation(null)
    setUploadMethod("paste")
    setSelectedFile(null)
    setIsValidating(false)
  }, [slot, open])

  const validateCodes = (rawText: string): ValidationResult => {
    const lines = rawText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
    const validCodeRegex = /^[A-Za-z0-9-]{5,50}$/

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
      setIsValidating(true)
      setTimeout(() => {
        const validation = validateCodes(value)
        setCodeValidation(validation)
        setFormData({ ...formData, codes_to_upload: validation.codes })
        setIsValidating(false)
      }, 200)
    } else {
      setCodeValidation(null)
      setFormData({ ...formData, codes_to_upload: [] })
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setIsValidating(true)

      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        const validation = validateCodes(text)
        setCodeValidation(validation)
        setFormData({ ...formData, codes_to_upload: validation.codes })
        setIsValidating(false)
      }
      reader.readAsText(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith(".txt") || file.name.endsWith(".csv"))) {
      setSelectedFile(file)
      setIsValidating(true)

      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        const validation = validateCodes(text)
        setCodeValidation(validation)
        setFormData({ ...formData, codes_to_upload: validation.codes })
        setIsValidating(false)
      }
      reader.readAsText(file)
    }
  }

  const clearFileSelection = () => {
    setSelectedFile(null)
    setCodeValidation(null)
    setFormData({ ...formData, codes_to_upload: [] })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
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

    if (isEditing && slot) {
      // Update existing slot
      const result = await updateSlotMutation.mutateAsync({
        id: slot.id,
        name: formData.name,
        description: formData.description,
        thumbnail_url: formData.thumbnail_url || undefined,
        expiry_date: formData.expiry_date || undefined,
        is_published: formData.is_published,
        pricing_tiers: formData.pricing_tiers,
        redemption_steps: formData.redemption_steps.filter(s => s.step_text.trim()),
      })

      if (result.success) {
        toast({
          title: "Coupon updated",
          description: `"${formData.name}" has been updated successfully.`,
        })
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update coupon",
          variant: "destructive",
        })
      }
    } else {
      // Create new slot
      const result = await createSlotMutation.mutateAsync({
        name: formData.name,
        description: formData.description,
        thumbnail_url: formData.thumbnail_url || undefined,
        expiry_date: formData.expiry_date || undefined,
        is_published: formData.is_published,
        pricing_tiers: formData.pricing_tiers,
        redemption_steps: formData.redemption_steps.filter(s => s.step_text.trim()),
        codes_to_upload: skipUpload ? [] : formData.codes_to_upload,
      })

      if (result.success) {
        const codesCount = result.codesUploaded || 0
        toast({
          title: "Coupon created",
          description:
            codesCount > 0
              ? `"${formData.name}" created with ${codesCount} codes uploaded.`
              : `"${formData.name}" has been created. You can upload codes later.`,
        })
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create coupon",
          variant: "destructive",
        })
      }
    }
  }

  const isLoading = createSlotMutation.isPending || updateSlotMutation.isPending

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

  const addRedemptionStep = () => {
    const nextStepNumber = formData.redemption_steps.length + 1
    setFormData({
      ...formData,
      redemption_steps: [
        ...formData.redemption_steps,
        { step_number: nextStepNumber, step_text: "" }
      ]
    })
  }

  const removeRedemptionStep = (index: number) => {
    const newSteps = formData.redemption_steps.filter((_, i) => i !== index)
    // Renumber the steps
    const renumberedSteps = newSteps.map((step, i) => ({
      ...step,
      step_number: i + 1
    }))
    setFormData({ ...formData, redemption_steps: renumberedSteps })
  }

  const updateRedemptionStep = (index: number, text: string) => {
    const newSteps = [...formData.redemption_steps]
    newSteps[index] = { ...newSteps[index], step_text: text }
    setFormData({ ...formData, redemption_steps: newSteps })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditing ? `Edit Coupon - ${slot?.name}` : "Create New Coupon"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditing ? "Update the coupon details below" : "Fill in the details to create a new coupon category"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-4 bg-secondary">
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
            <TabsTrigger
              value="redemption"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <ListOrdered className="h-4 w-4 mr-2" />
              How to Redeem
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

          <TabsContent value="basic" className="mt-4 space-y-6">
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

            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground">
                Terms and Conditions <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Enter terms and conditions for using this coupon"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-secondary border-border text-foreground min-h-[100px]"
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

            <div className="space-y-2">
              <Label htmlFor="thumbnail_url" className="text-foreground flex items-center gap-2">
                <Image className="h-4 w-4" />
                Thumbnail/Condition URL <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="thumbnail_url"
                placeholder="https://example.com/thumbnail.jpg"
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                className="bg-secondary border-border text-foreground"
              />
              <p className="text-xs text-muted-foreground">Add a thumbnail or condition image for this coupon</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry_date" className="text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Expiry Date <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                className="bg-secondary border-border text-foreground"
              />
              <p className="text-xs text-muted-foreground">Set when this coupon offer expires</p>
            </div>

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

          <TabsContent value="redemption" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">How to Redeem Steps</Label>
                <p className="text-xs text-muted-foreground mt-1">Add step-by-step instructions for redeeming the coupon (optional)</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRedemptionStep}
                className="border-border text-foreground bg-transparent"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Step
              </Button>
            </div>

            {formData.redemption_steps.length === 0 ? (
              <div className="p-6 border-2 border-dashed border-border rounded-lg text-center">
                <ListOrdered className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-3">No redemption steps added yet</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRedemptionStep}
                  className="border-border"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add First Step
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.redemption_steps.map((step, index) => (
                  <div key={index} className="p-4 bg-secondary rounded-lg border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Step {step.step_number}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRedemptionStep(index)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      placeholder={`e.g., ${index === 0 ? "Claim the deal." : index === 1 ? "You will get a coupon code." : "Add product to cart and apply the coupon code during checkout."}`}
                      value={step.step_text}
                      onChange={(e) => updateRedemptionStep(index, e.target.value)}
                      className="bg-background border-border text-foreground min-h-[60px]"
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {!isEditing && (
            <TabsContent value="codes" className="mt-4 space-y-4">
              <div>
                <Label className="text-foreground">Upload Coupon Codes (Optional)</Label>
                <p className="text-xs text-muted-foreground mt-1">You can upload codes now or add them later</p>
              </div>

              <div className="flex items-center space-x-2 p-4 bg-secondary rounded-lg border border-border">
                <Checkbox
                  id="skip_upload"
                  checked={skipUpload}
                  onCheckedChange={(checked) => {
                    setSkipUpload(checked as boolean)
                    if (checked) {
                      setPastedCodes("")
                      setCodeValidation(null)
                      setSelectedFile(null)
                      setFormData({ ...formData, codes_to_upload: [] })
                    }
                  }}
                />
                <Label htmlFor="skip_upload" className="text-foreground cursor-pointer">
                  Skip for now, I'll upload codes later
                </Label>
              </div>

              {!skipUpload && (
                <div className="space-y-4">
                  <Tabs
                    value={uploadMethod}
                    onValueChange={(v) => {
                      setUploadMethod(v as "paste" | "file")
                      setPastedCodes("")
                      setSelectedFile(null)
                      setCodeValidation(null)
                      setFormData({ ...formData, codes_to_upload: [] })
                    }}
                  >
                    <TabsList className="grid w-full grid-cols-2 bg-secondary">
                      <TabsTrigger
                        value="paste"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        Paste Codes
                      </TabsTrigger>
                      <TabsTrigger
                        value="file"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        Upload File
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="paste" className="mt-4 space-y-4">
                      <Textarea
                        placeholder={`Paste codes here, one per line\n\nExample:\nFKG00000000000001\nFKG00000000000002\nFKG00000000000003`}
                        value={pastedCodes}
                        onChange={(e) => handlePasteChange(e.target.value)}
                        className="bg-secondary border-border text-foreground min-h-[200px] font-mono text-sm"
                      />
                    </TabsContent>

                    <TabsContent value="file" className="mt-4 space-y-4">
                      {!selectedFile ? (
                        <div
                          onDrop={handleDrop}
                          onDragOver={(e) => e.preventDefault()}
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".txt,.csv"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                          <p className="mt-4 font-medium text-foreground">Drop CSV/TXT file here</p>
                          <p className="text-sm text-muted-foreground">or click to browse</p>
                          <p className="text-xs text-muted-foreground mt-2">One code per line</p>
                        </div>
                      ) : (
                        <div className="p-4 bg-secondary rounded-lg border border-border">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <File className="h-8 w-8 text-primary" />
                              <div>
                                <p className="font-medium text-foreground">{selectedFile.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {(selectedFile.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={clearFileSelection}
                              className="text-destructive hover:text-destructive"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>

                  {/* Validation Results */}
                  {isValidating && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Validating codes...
                    </div>
                  )}

                  {codeValidation && !isValidating && (
                    <div className="p-4 bg-secondary rounded-lg border border-border space-y-3">
                      <h4 className="font-medium text-foreground">Validation Results</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Total lines:</span>
                          <span className="text-foreground">{codeValidation.total_lines}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-green-500">{codeValidation.valid_codes} valid</span>
                        </div>
                        {codeValidation.duplicates > 0 && (
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            <span className="text-yellow-500">{codeValidation.duplicates} duplicates</span>
                          </div>
                        )}
                        {codeValidation.invalid_format > 0 && (
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-destructive" />
                            <span className="text-destructive">{codeValidation.invalid_format} invalid</span>
                          </div>
                        )}
                      </div>
                      <div className="pt-2 border-t border-border">
                        <p className="text-sm">
                          <span className="text-muted-foreground">Ready to upload:</span>{" "}
                          <span className="font-medium text-primary">{codeValidation.ready_to_upload} codes</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border" disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Updating..." : "Creating..."}
              </>
            ) : isEditing ? (
              "Update Coupon"
            ) : (
              "Create Coupon"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
