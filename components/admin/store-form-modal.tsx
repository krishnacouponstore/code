"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, AlertCircle, Loader2, Store as StoreIcon, Tag, Upload, X, Image as ImageIcon } from "lucide-react"
import { useCreateStore, useUpdateStore, AdminStore } from "@/hooks/use-admin-stores"
import { useToast } from "@/hooks/use-toast"
import { StoreTagInput } from "@/app/actions/stores"
import { nhost } from "@/lib/nhost"
import { cn } from "@/lib/utils"

type StoreFormData = {
  name: string
  slug: string
  description: string
  logo_url: string
  theme_color: string
  category: string
  status: string
  store_tags: StoreTagInput[]
}

type StoreFormModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  store?: AdminStore | null
  onSuccess?: () => void
}

const ICON_OPTIONS = [
    { label: "Mobile", value: "fas fa-mobile-alt" },
    { label: "Laptop", value: "fas fa-laptop" },
    { label: "TV", value: "fas fa-tv" },
    { label: "Gamepad", value: "fas fa-gamepad" },
    { label: "Headphones", value: "fas fa-headphones" },
    { label: "Fashion", value: "fas fa-tshirt" },
    { label: "Shopping Bag", value: "fas fa-shopping-bag" },
    { label: "Food", value: "fas fa-hamburger" },
    { label: "Pizza", value: "fas fa-pizza-slice" },
    { label: "Coffee", value: "fas fa-coffee" },
    { label: "Plane", value: "fas fa-plane" },
    { label: "Car", value: "fas fa-car" },
    { label: "Hotel", value: "fas fa-hotel" },
    { label: "Ticket", value: "fas fa-ticket-alt" },
    { label: "Music", value: "fas fa-music" },
    { label: "Video", value: "fas fa-video" },
    { label: "Store", value: "fas fa-store" },
    { label: "Tag", value: "fas fa-tag" },
    { label: "Star", value: "fas fa-star" },
    { label: "Gift", value: "fas fa-gift" },
    { label: "Money", value: "fas fa-money-bill-wave" },
    { label: "Percent", value: "fas fa-percent" },
]

const CATEGORY_OPTIONS = [
    { label: "Food", value: "Food" },
    { label: "Groceries", value: "Groceries" },
    { label: "Travel", value: "Travel" },
    { label: "Movies", value: "Movies" },
    { label: "Electronics", value: "Electronics" },
    { label: "Fashion", value: "Fashion" },
    { label: "Other", value: "Other" },
]

export function StoreFormModal({ open, onOpenChange, store, onSuccess }: StoreFormModalProps) {
  const isEditing = !!store
  const { toast } = useToast()
  const createStoreMutation = useCreateStore()
  const updateStoreMutation = useUpdateStore()

  const [activeTab, setActiveTab] = useState("basic")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isUploading, setIsUploading] = useState(false)

  const [formData, setFormData] = useState<StoreFormData>({
    name: "",
    slug: "",
    description: "",
    logo_url: "",
    theme_color: "#3b82f6",
    category: "",
    status: "active",
    store_tags: []
  })

  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name,
        slug: store.slug || "",
        description: store.description || "",
        logo_url: store.logo_url || "",
        theme_color: store.theme_color || "#3b82f6",
        category: store.category || "",
        status: store.status || "active",
        store_tags: store.store_tags ? store.store_tags.map(t => ({
          value: t.value || "",
          color: t.color || "#000000",
          tag_icon: t.tag_icon || ""
        })) : []
      })
    } else {
      setFormData({
        name: "",
        slug: "",
        description: "",
        logo_url: "",
        theme_color: "#3b82f6",
        category: "",
        status: "active",
        store_tags: []
      })
    }
    setErrors({})
    setActiveTab("basic")
  }, [store, open])

  // Helper to auto-generate slug from name
  useEffect(() => {
    if (!isEditing && formData.name && !formData.slug) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
      setFormData(prev => ({ ...prev, slug }))
    }
  }, [formData.name, isEditing])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
        const { fileMetadata, error } = await nhost.storage.upload({ file })
        if (error) throw error
        
        const url = nhost.storage.getPublicUrl({ fileId: fileMetadata.id })
        setFormData(prev => ({ ...prev, logo_url: url }))
        toast({ title: "Image Uploaded", description: "Logo has been uploaded successfully." })
    } catch (error: any) {
        toast({ 
            title: "Upload Failed", 
            description: error.message || "Failed to upload image", 
            variant: "destructive" 
        })
    } finally {
        setIsUploading(false)
    }
  }

  const removeImage = () => {
    setFormData(prev => ({ ...prev, logo_url: "" }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = "Name is required"
    if (!formData.slug.trim()) newErrors.slug = "Slug is required"
    if (!formData.category.trim()) newErrors.category = "Category is required"
    
    // Validate Tags
    for (let i = 0; i < formData.store_tags.length; i++) {
        if (!formData.store_tags[i].value) {
            newErrors[`tag_${i}_value`] = "Tag text is required"
        }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
        // If basic info has errors, switch to basic tab
        if (errors.name || errors.slug || errors.category) setActiveTab("basic")
        return
    }

    try {
      if (isEditing && store) {
        await updateStoreMutation.mutateAsync({
          id: store.id,
          ...formData
        })
        toast({ title: "Store updated", description: "Store details have been saved." })
      } else {
        await createStoreMutation.mutateAsync(formData)
        toast({ title: "Store created", description: "New store has been added." })
      }
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive"
      })
    }
  }

  const addTag = () => {
    setFormData(prev => ({
        ...prev,
        store_tags: [...prev.store_tags, { value: "", color: "#10b981", tag_icon: "fas fa-tag" }]
    }))
  }

  const removeTag = (index: number) => {
    setFormData(prev => ({
        ...prev,
        store_tags: prev.store_tags.filter((_, i) => i !== index)
    }))
  }

  const updateTag = (index: number, field: keyof StoreTagInput, value: string) => {
    const newTags = [...formData.store_tags]
    newTags[index] = { ...newTags[index], [field]: value }
    setFormData(prev => ({ ...prev, store_tags: newTags }))
  }

  const isLoading = createStoreMutation.isPending || updateStoreMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Store" : "Create New Store"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update store details and tags." : "Add a new brand store to the platform."}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
            <TabsTrigger value="basic" className="data-[state=active]:bg-background">
                <StoreIcon className="w-4 h-4 mr-2" /> Basic Info
            </TabsTrigger>
            <TabsTrigger value="tags" className="data-[state=active]:bg-background">
                <Tag className="w-4 h-4 mr-2" /> Tags ({formData.store_tags.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Store Name <span className="text-destructive">*</span></Label>
                    <Input 
                        id="name" 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})} 
                        placeholder="e.g. Netflix" 
                    />
                    {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="slug">Slug <span className="text-destructive">*</span></Label>
                    <Input 
                        id="slug" 
                        value={formData.slug} 
                        onChange={e => setFormData({...formData, slug: e.target.value})} 
                        placeholder="e.g. netflix" 
                    />
                    {errors.slug && <p className="text-destructive text-xs">{errors.slug}</p>}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                    id="description" 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    placeholder="Short description about the store..." 
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="category">Category <span className="text-destructive">*</span></Label>
                    <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                        <SelectTrigger id="category">
                            <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                            {CATEGORY_OPTIONS.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.category && <p className="text-destructive text-xs">{errors.category}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={val => setFormData({...formData, status: val})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label>Store Logo</Label>
                    <div className="flex flex-col gap-2">
                        {formData.logo_url ? (
                            <div className="relative w-full h-[120px] border rounded-lg overflow-hidden group bg-muted flex items-center justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={formData.logo_url}
                                    alt="Store Logo"
                                    className="w-full h-full object-contain p-2"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={removeImage}
                                        type="button"
                                        className="h-8 w-8"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-[120px] border border-dashed rounded-lg flex flex-col items-center justify-center gap-2 bg-muted/30 hover:bg-muted/50 transition-colors p-4 text-center cursor-pointer" onClick={() => document.getElementById('logo-upload')?.click()}>
                                {isUploading ? (
                                    <>
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">Uploading...</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-6 w-6 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">Click to upload logo</span>
                                    </>
                                )}
                                <Input
                                    id="logo-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                    disabled={isUploading}
                                />
                            </div>
                        )}
                    </div>
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="theme_color">Theme Color</Label>
                    <div className="flex gap-2 h-[120px] flex-col justify-end">
                        <div className="flex gap-2">
                            <Input 
                                id="theme_color" 
                                type="color"
                                value={formData.theme_color} 
                                onChange={e => setFormData({...formData, theme_color: e.target.value})} 
                                className="w-12 h-10 p-1 cursor-pointer shrink-0"
                            />
                            <Input 
                                value={formData.theme_color} 
                                onChange={e => setFormData({...formData, theme_color: e.target.value})} 
                                placeholder="#000000"
                                className="flex-1 font-mono"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Used for badges and accents across the store page.
                        </p>
                    </div>
                </div>
            </div>
          </TabsContent>

          <TabsContent value="tags" className="space-y-4 py-4">
            <div className="flex justify-between items-center mb-4">
                <Label>Store Tags</Label>
                <Button type="button" size="sm" variant="outline" onClick={addTag}>
                    <Plus className="w-4 h-4 mr-2" /> Add Tag
                </Button>
            </div>
            
            {formData.store_tags.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                    No tags added. Tags appear on the store card (e.g. "50% OFF").
                </div>
            ) : (
                <div className="space-y-3">
                    {formData.store_tags.map((tag, idx) => (
                        <div key={idx} className="flex gap-2 items-start p-3 bg-secondary/30 rounded-lg border">
                            <div className="grid gap-2 flex-1">
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="col-span-2">
                                        <Input 
                                            placeholder="Tag Text (e.g. Cashback)" 
                                            value={tag.value}
                                            onChange={e => updateTag(idx, "value", e.target.value)}
                                        />
                                        {errors[`tag_${idx}_value`] && <p className="text-destructive text-xs mt-1">{errors[`tag_${idx}_value`]}</p>}
                                    </div>
                                    <div>
                                         <Select value={tag.tag_icon || ""} onValueChange={(val) => updateTag(idx, "tag_icon", val)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Icon" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[200px]">
                                                {ICON_OPTIONS.map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        <span className="flex items-center gap-2">
                                                            <i className={cn(opt.value, "w-4 text-center")} /> 
                                                            <span className="truncate">{opt.label}</span>
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                         </Select>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input 
                                        type="color"
                                        value={tag.color}
                                        onChange={e => updateTag(idx, "color", e.target.value)}
                                        className="w-8 h-8 p-0 border-none"
                                    />
                                    <span className="text-xs text-muted-foreground">Tag Color</span>
                                </div>
                            </div>
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeTag(idx)}
                                className="text-destructive hover:bg-destructive/10"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update Store" : "Create Store"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
