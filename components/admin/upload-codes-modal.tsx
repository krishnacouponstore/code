"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
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
import { Upload, FileText, CheckCircle, AlertTriangle, XCircle, Loader2, Copy, File, Database } from "lucide-react"
import { useUploadCodes, type Slot } from "@/hooks/use-slots"
import { useToast } from "@/hooks/use-toast"
import { checkCodesExistence } from "@/app/actions/slots"

type ExistingCodeDetail = {
  code: string
  slotId: string
  slotName: string
}

type ValidationResult = {
  total_lines: number
  valid_codes: number
  duplicates: number
  invalid_format: number
  ready_to_upload: number
  codes: string[]
}

type DbCheckResult = {
  existingCodesDetails: ExistingCodeDetail[]
  newCodes: string[]
  checked: boolean
}

type UploadCodesModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  slot: Slot | null
  onSuccess: (slotId: string, codesCount: number) => void
}

export function UploadCodesModal({ open, onOpenChange, slot, onSuccess }: UploadCodesModalProps) {
  const { toast } = useToast()
  const uploadCodesMutation = useUploadCodes()

  const [activeTab, setActiveTab] = useState<"paste" | "file">("paste")
  const [pastedCodes, setPastedCodes] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isCheckingDb, setIsCheckingDb] = useState(false)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [dbCheck, setDbCheck] = useState<DbCheckResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetState = useCallback(() => {
    setPastedCodes("")
    setSelectedFile(null)
    setValidation(null)
    setDbCheck(null)
    setActiveTab("paste")
  }, [])

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetState()
    }
    onOpenChange(newOpen)
  }

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
    setDbCheck(null) // Reset DB check when codes change
    if (value.trim()) {
      setIsValidating(true)
      setTimeout(() => {
        setValidation(validateCodes(value))
        setIsValidating(false)
      }, 300)
    } else {
      setValidation(null)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setIsValidating(true)
      setDbCheck(null)

      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        setValidation(validateCodes(text))
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
      setDbCheck(null)

      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        setValidation(validateCodes(text))
        setIsValidating(false)
      }
      reader.readAsText(file)
    }
  }

  const handleCheckDatabase = async () => {
    if (!validation || validation.codes.length === 0) return

    setIsCheckingDb(true)
    try {
      const result = await checkCodesExistence(validation.codes)
      if (result.success) {
        setDbCheck({
          existingCodesDetails: result.existingCodesDetails || [],
          newCodes: result.newCodes || [],
          checked: true,
        })
      } else {
        toast({
          title: "Check Failed",
          description: result.error || "Failed to check codes in database",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Check Failed",
        description: error.message || "Failed to check codes in database",
        variant: "destructive",
      })
    } finally {
      setIsCheckingDb(false)
    }
  }

  const handleUploadNewCodes = async () => {
    if (!slot || !dbCheck || dbCheck.newCodes.length === 0) return

    try {
      const result = await uploadCodesMutation.mutateAsync({
        slotId: slot.id,
        codes: dbCheck.newCodes,
      })

      if (result.success && result.uploadedCount && result.uploadedCount > 0) {
        toast({
          title: "Codes Uploaded Successfully",
          description: `${result.uploadedCount} new codes uploaded successfully.`,
        })
        onSuccess(slot.id, result.uploadedCount)
        handleOpenChange(false)
      } else {
        toast({
          title: "Upload Failed",
          description: result.error || "Failed to upload codes",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload codes",
        variant: "destructive",
      })
    }
  }

  if (!slot) return null

  const isUploading = uploadCodesMutation.isPending

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload Codes - {slot.name}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Current stock:{" "}
            <span className="text-foreground font-medium">{slot.available_stock.toLocaleString()} codes</span>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "paste" | "file")} className="mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-secondary">
            <TabsTrigger
              value="paste"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <FileText className="h-4 w-4 mr-2" />
              Paste Codes
            </TabsTrigger>
            <TabsTrigger
              value="file"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Paste codes here, one per line&#10;&#10;Example:&#10;FKG00000000000001&#10;FKG00000000000002&#10;FKG00000000000003"
                value={pastedCodes}
                onChange={(e) => handlePasteChange(e.target.value)}
                className="bg-secondary border-border text-foreground font-mono text-sm min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground">
                {pastedCodes.split("\n").filter((l) => l.trim()).length} lines entered
              </p>
            </div>
          </TabsContent>

          <TabsContent value="file" className="mt-4 space-y-4">
            <div
              className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept=".txt,.csv" onChange={handleFileSelect} className="hidden" />

              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <File className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-foreground font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedFile(null)
                      setValidation(null)
                      setDbCheck(null)
                    }}
                    className="mt-2 border-border text-foreground"
                  >
                    Choose Different File
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-foreground font-medium">Drop CSV/TXT file here</p>
                  <p className="text-sm text-muted-foreground">or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-2">Max file size: 10MB</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {isValidating && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
            <span className="text-muted-foreground">Validating codes...</span>
          </div>
        )}

        {validation && !isValidating && (
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-secondary rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-foreground">{validation.total_lines}</p>
                <p className="text-xs text-muted-foreground">Total Lines</p>
              </div>
              <div className="bg-green-500/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-500">{validation.valid_codes}</p>
                <p className="text-xs text-green-500">Valid Codes</p>
              </div>
              <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-yellow-500">{validation.duplicates}</p>
                <p className="text-xs text-yellow-500">Duplicates (in paste)</p>
              </div>
              <div className="bg-destructive/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-destructive">{validation.invalid_format}</p>
                <p className="text-xs text-destructive">Invalid</p>
              </div>
            </div>

            {!dbCheck?.checked && validation.valid_codes > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-blue-500 font-medium">Check Database</p>
                      <p className="text-sm text-muted-foreground">
                        Check which codes already exist in the database before uploading
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleCheckDatabase}
                    disabled={isCheckingDb}
                    className="bg-blue-500 text-white hover:bg-blue-600"
                  >
                    {isCheckingDb ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      "Check Now"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {dbCheck?.checked && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <p className="text-green-500 font-medium">New Codes</p>
                    </div>
                    <p className="text-3xl font-bold text-green-500">{dbCheck.newCodes.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Ready to upload</p>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <p className="text-yellow-500 font-medium">Already in DB</p>
                    </div>
                    <p className="text-3xl font-bold text-yellow-500">{dbCheck.existingCodesDetails.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Will be skipped</p>
                  </div>
                </div>

                {/* Show existing codes with their slot names */}
                {dbCheck.existingCodesDetails.length > 0 && (
                  <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
                    <p className="text-sm font-medium text-yellow-500 mb-3">
                      Codes already in database ({dbCheck.existingCodesDetails.length}):
                    </p>
                    <div className="max-h-[150px] overflow-y-auto space-y-1">
                      {dbCheck.existingCodesDetails.slice(0, 20).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs font-mono">
                          <span className="text-muted-foreground">{item.code}</span>
                          <span className="text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded">{item.slotName}</span>
                        </div>
                      ))}
                      {dbCheck.existingCodesDetails.length > 20 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          + {dbCheck.existingCodesDetails.length - 20} more existing codes...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Show new codes preview */}
                {dbCheck.newCodes.length > 0 && (
                  <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-green-500">
                        New codes to upload ({dbCheck.newCodes.length}):
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(dbCheck.newCodes.join("\n"))}
                        className="text-muted-foreground hover:text-foreground h-8"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <div className="max-h-[150px] overflow-y-auto space-y-1 font-mono text-xs">
                      {dbCheck.newCodes.slice(0, 10).map((code, idx) => (
                        <div key={idx} className="text-green-500">
                          {idx + 1}. {code}
                        </div>
                      ))}
                      {dbCheck.newCodes.length > 10 && (
                        <p className="text-primary mt-2">+ {dbCheck.newCodes.length - 10} more new codes</p>
                      )}
                    </div>
                  </div>
                )}

                {/* No new codes message */}
                {dbCheck.newCodes.length === 0 && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-destructive" />
                      <div>
                        <p className="text-destructive font-medium">All codes already exist</p>
                        <p className="text-sm text-muted-foreground">
                          All {dbCheck.existingCodesDetails.length} codes are already in the database. Please paste
                          different codes.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Preview section - only show if DB check not done yet */}
            {!dbCheck?.checked && validation.codes.length > 0 && (
              <div className="bg-secondary rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-foreground">Preview (first 10 codes)</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(validation.codes.slice(0, 10).join("\n"))}
                    className="text-muted-foreground hover:text-foreground h-8"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="font-mono text-xs space-y-1 max-h-[150px] overflow-y-auto">
                  {validation.codes.slice(0, 10).map((code, idx) => (
                    <div key={idx} className="text-muted-foreground">
                      {idx + 1}. {code}
                    </div>
                  ))}
                  {validation.codes.length > 10 && (
                    <div className="text-primary mt-2">+ {validation.codes.length - 10} more codes</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 mt-6">
          <div className="flex-1 text-sm text-muted-foreground">
            {dbCheck?.checked && dbCheck.newCodes.length > 0 && (
              <span>
                Ready to upload <span className="text-primary font-medium">{dbCheck.newCodes.length}</span> new codes
              </span>
            )}
            {!dbCheck?.checked && validation && validation.ready_to_upload > 0 && (
              <span className="text-yellow-500">Check database first to see which codes are new</span>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="border-border text-foreground"
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUploadNewCodes}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isUploading || !dbCheck?.checked || dbCheck.newCodes.length === 0}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload {dbCheck?.newCodes.length || 0} New Codes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
