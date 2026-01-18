"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ExternalLink, ChevronDown, ChevronUp, X } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import type { RedemptionStep } from "@/lib/graphql/coupons"

interface CouponDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  couponName: string
  termsAndConditions: string | null
  redemptionSteps: RedemptionStep[]
}

// Helper function to detect URLs in text and add buttons
function parseTextWithLinks(text: string) {
  // Regex to detect URLs
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/g
  const parts = []
  let lastIndex = 0
  let match

  while ((match = urlRegex.exec(text)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      parts.push({
        type: "text" as const,
        content: text.substring(lastIndex, match.index),
      })
    }

    // Add the URL
    let url = match[0]
    // Add https:// if not present
    const fullUrl = url.startsWith("http") ? url : `https://${url}`

    parts.push({
      type: "link" as const,
      content: url,
      url: fullUrl,
    })

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: "text" as const,
      content: text.substring(lastIndex),
    })
  }

  return parts.length > 0 ? parts : [{ type: "text" as const, content: text }]
}

function TextWithLinks({ text }: { text: string }) {
  const parts = parseTextWithLinks(text)

  return (
    <div className="space-y-1">
      {parts.map((part, index) => (
        <div key={index}>
          {part.type === "text" ? (
            <span>{part.content}</span>
          ) : (
            <div className="flex flex-col gap-2 my-1">
              <span className="text-blue-600 dark:text-blue-400 break-all">{part.content}</span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs inline-flex items-center gap-1 self-start"
                onClick={() => window.open(part.url, "_blank", "noopener,noreferrer")}
              >
                <ExternalLink className="h-3 w-3" />
                Open
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function DetailsContent({
  termsAndConditions,
  redemptionSteps,
}: {
  termsAndConditions: string | null
  redemptionSteps: RedemptionStep[]
}) {
  const [isRedeemOpen, setIsRedeemOpen] = useState(redemptionSteps.length > 0)
  const [isTermsOpen, setIsTermsOpen] = useState(redemptionSteps.length === 0)

  return (
    <div className="space-y-4">
      {/* How to Redeem - Only show if steps exist */}
      {redemptionSteps.length > 0 && (
        <Collapsible open={isRedeemOpen} onOpenChange={setIsRedeemOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-3 px-4 bg-secondary/50 hover:bg-secondary rounded-lg transition-colors">
            <h3 className="text-base font-semibold">How to Redeem</h3>
            {isRedeemOpen ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 px-4">
            <ol className="space-y-3">
              {redemptionSteps.map((step) => (
                <li key={step.id} className="flex gap-3">
                  <span className="flex-shrink-0 text-sm text-muted-foreground font-medium">
                    Step {step.step_number}
                  </span>
                  <p className="flex-1 text-sm text-foreground whitespace-pre-line">
                    <TextWithLinks text={step.step_text} />
                  </p>
                </li>
              ))}
            </ol>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Terms and Conditions - Always show */}
      <Collapsible open={isTermsOpen} onOpenChange={setIsTermsOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-3 px-4 bg-secondary/50 hover:bg-secondary rounded-lg transition-colors">
          <h3 className="text-base font-semibold">Terms and Conditions</h3>
          {isTermsOpen ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 px-4">
          <div className="text-sm text-foreground whitespace-pre-line">
            {termsAndConditions ? (
              <TextWithLinks text={termsAndConditions} />
            ) : (
              <p className="text-muted-foreground/60">No terms and conditions specified.</p>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

export function CouponDetailsModal({
  open,
  onOpenChange,
  couponName,
  termsAndConditions,
  redemptionSteps,
}: CouponDetailsModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{couponName}</DialogTitle>
            <DialogDescription className="sr-only">
              View coupon details including redemption steps and terms and conditions
            </DialogDescription>
          </DialogHeader>
          <DetailsContent termsAndConditions={termsAndConditions} redemptionSteps={redemptionSteps} />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto p-0">
        <div className="sticky top-0 bg-background border-b z-10">
          <div className="flex items-center justify-between p-4">
            <div>
              <SheetTitle className="text-lg font-semibold">{couponName}</SheetTitle>
              <SheetDescription className="sr-only">
                View coupon details including redemption steps and terms and conditions
              </SheetDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 px-3 rounded-full"
            >
              Close
            </Button>
          </div>
        </div>
        <div className="p-4">
          <DetailsContent termsAndConditions={termsAndConditions} redemptionSteps={redemptionSteps} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
