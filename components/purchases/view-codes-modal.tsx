"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import type { PurchaseHistoryItem } from "@/lib/mock-data"
import { Copy, Check, Download, FileText, X } from "lucide-react"

interface ViewCodesModalProps {
  purchase: PurchaseHistoryItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewCodesModal({ purchase, open, onOpenChange }: ViewCodesModalProps) {
  const { toast } = useToast()
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const handleCopyCode = async (code: string, index: number) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy the code manually",
        variant: "destructive",
      })
    }
  }

  const handleCopyAll = async () => {
    if (!purchase) return
    try {
      await navigator.clipboard.writeText(purchase.codes.join("\n"))
      toast({
        title: "Copied!",
        description: `${purchase.codes.length} codes copied to clipboard`,
      })
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please try downloading instead",
        variant: "destructive",
      })
    }
  }

  const handleDownloadCSV = () => {
    if (!purchase) return

    const csvContent = ["Serial No,Coupon Code", ...purchase.codes.map((code, i) => `${i + 1},${code}`)].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const date = new Date(purchase.date).toISOString().split("T")[0].replace(/-/g, "")
    link.href = url
    link.download = `codecrate_${purchase.order_id.replace("#", "")}_${date}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Downloaded!",
      description: "CSV file has been downloaded",
    })
  }

  const handleDownloadTXT = () => {
    if (!purchase) return

    const txtContent = purchase.codes.join("\n")

    const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const date = new Date(purchase.date).toISOString().split("T")[0].replace(/-/g, "")
    link.href = url
    link.download = `codecrate_${purchase.order_id.replace("#", "")}_${date}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Downloaded!",
      description: "TXT file has been downloaded",
    })
  }

  if (!purchase) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-card border-border p-0 gap-0 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold text-foreground mb-1">
                {purchase.order_id} - Coupon Codes
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {purchase.quantity} codes &bull; {purchase.slot_name} &bull; {formatCurrency(purchase.amount)}
              </p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Action Row */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{purchase.codes.length} codes available</p>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-border bg-transparent"
              onClick={handleCopyAll}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy All
            </Button>
          </div>

          {/* Scrollable Table */}
          <ScrollArea className="h-[300px] rounded-lg border border-border">
            <Table>
              <TableHeader className="sticky top-0 bg-secondary">
                <TableRow className="hover:bg-secondary">
                  <TableHead className="w-16 text-foreground">#</TableHead>
                  <TableHead className="text-foreground">Coupon Code</TableHead>
                  <TableHead className="w-20 text-right text-foreground">Copy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchase.codes.map((code, index) => (
                  <TableRow
                    key={index}
                    className={`${
                      index % 2 === 0 ? "bg-card" : "bg-secondary/30"
                    } hover:bg-secondary/50 transition-colors`}
                  >
                    <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-mono text-sm text-foreground">{code}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 transition-colors ${
                          copiedIndex === index
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        onClick={() => handleCopyCode(code, index)}
                        aria-label={`Copy code ${code}`}
                      >
                        {copiedIndex === index ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>

          {/* Download Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className="flex-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-11"
              onClick={handleDownloadCSV}
            >
              <Download className="h-4 w-4 mr-2" />
              Download as CSV
            </Button>
            <Button
              variant="outline"
              className="flex-1 rounded-full border-border h-11 bg-transparent"
              onClick={handleDownloadTXT}
            >
              <FileText className="h-4 w-4 mr-2" />
              Download as TXT
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
