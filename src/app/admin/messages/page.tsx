"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MessageSquare, Send, Smartphone, Mail, Users, AlertCircle } from "lucide-react"

export default function AdminMessagesPage() {
  const [recipientGroup, setRecipientGroup] = useState("all_parents")
  const [messageType, setMessageType] = useState("sms")
  const [isSending, setIsSending] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSend = () => {
    setIsSending(true)
    // Simulate API call to /api/messaging
    setTimeout(() => {
      setIsSending(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }, 1500)
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading">Messaging & Alerts</h1>
          <p className="text-muted-foreground mt-2">Send instant SMS or Email notifications to targeted groups.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle>Compose Message</CardTitle>
            <CardDescription>Select a target audience and compose your alert.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="space-y-3">
              <Label>Target Audience</Label>
              <select 
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={recipientGroup}
                onChange={(e) => setRecipientGroup(e.target.value)}
              >
                <option value="all_parents">All Active Parents</option>
                <option value="school_specific">Parents by School...</option>
                <option value="route_specific">Parents by Route...</option>
                <option value="all_drivers">All Drivers</option>
                <option value="individual">Individual Parent/Driver</option>
              </select>
            </div>

            <div className="space-y-3">
              <Label>Delivery Method</Label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${messageType === 'sms' ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`}>
                  <input type="radio" name="method" value="sms" checked={messageType === 'sms'} onChange={() => setMessageType('sms')} className="hidden" />
                  <Smartphone className={`w-5 h-5 ${messageType === 'sms' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`font-medium ${messageType === 'sms' ? 'text-primary' : ''}`}>SMS Text</span>
                </label>
                <label className={`flex-1 flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${messageType === 'email' ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`}>
                  <input type="radio" name="method" value="email" checked={messageType === 'email'} onChange={() => setMessageType('email')} className="hidden" />
                  <Mail className={`w-5 h-5 ${messageType === 'email' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`font-medium ${messageType === 'email' ? 'text-primary' : ''}`}>Email</span>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Message Content</Label>
              {messageType === 'email' && (
                <Input placeholder="Email Subject" className="mb-2" />
              )}
              <Textarea 
                placeholder="Type your message here..." 
                className="min-h-[120px] resize-none"
                maxLength={messageType === 'sms' ? 160 : undefined}
              />
              {messageType === 'sms' && (
                <p className="text-xs text-muted-foreground text-right">0 / 160 characters</p>
              )}
            </div>

          </CardContent>
          <CardFooter className="bg-muted/30 pt-4 flex justify-between items-center">
            {success ? (
              <span className="text-green-600 font-semibold flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4" /> Message Queued Successfully
              </span>
            ) : (
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Messages cannot be unsent.
              </span>
            )}
            <Button className="gap-2" onClick={handleSend} disabled={isSending}>
              {isSending ? "Sending..." : "Send Alert"}
              {!isSending && <Send className="w-4 h-4" />}
            </Button>
          </CardFooter>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Recent Messages</CardTitle>
            <CardDescription>History of alerts sent from the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { target: "Route R-101 Parents", method: "SMS", date: "Today, 7:15 AM", preview: "Route R-101 is running 15 minutes late due to traffic. Thank you." },
                { target: "Lincoln High School Parents", method: "Email", date: "Yesterday, 3:00 PM", preview: "Reminder: Parent Pay invoices for October are now available in your portal." },
                { target: "All Drivers", method: "SMS", date: "Sep 8, 5:30 AM", preview: "Please ensure all pre-trip inspections are logged before departure." },
              ].map((msg, i) => (
                <div key={i} className="flex items-start gap-3 p-3 border rounded-lg bg-muted/20">
                  <div className="mt-0.5">
                    {msg.method === "SMS" ? <Smartphone className="w-4 h-4 text-muted-foreground" /> : <Mail className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-semibold">{msg.target}</p>
                      <span className="text-[10px] text-muted-foreground">{msg.date}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{msg.preview}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Just a quick fix for the lucide-react CheckCircle2 missing import locally in this file scope since I missed it above:
import { CheckCircle2 } from "lucide-react"
