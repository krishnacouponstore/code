"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { sendBroadcast } from "@/app/actions/users"

interface SendBroadcastModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SendBroadcastModal({ open, onOpenChange }: SendBroadcastModalProps) {
  const { toast } = useToast()
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    const text = message.trim()
    if (!text) {
      toast({ title: "Message is empty", description: "Type a message to broadcast.", variant: "destructive" })
      return
    }

    setIsSending(true)
    try {
      const result = await sendBroadcast(text)
      if (result.success) {
        toast({
          title: "Broadcast sent",
          description: `Delivered to ${result.sent}/${result.total} users${
            result.failed ? ` (${result.failed} failed)` : ""
          }.`,
        })
        setMessage("")
        onOpenChange(false)
      } else {
        toast({
          title: "Broadcast failed",
          description: result.error || "Something went wrong.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({ title: "Broadcast failed", description: error.message, variant: "destructive" })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !isSending && onOpenChange(o)}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">Send Broadcast Message</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            This message is sent via Telegram to all users who have linked their account. Markdown is supported.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Label htmlFor="broadcast-message">Message</Label>
          <Textarea
            id="broadcast-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your announcement here…"
            rows={6}
            disabled={isSending}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">{message.length} characters</p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending || !message.trim()}>
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Broadcast
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
