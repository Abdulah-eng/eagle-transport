"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { 
  Calendar, Phone, ShieldCheck, AlertCircle, CheckCircle2, 
  Smartphone, FileText, ChevronDown, ChevronUp, Bus, ArrowLeft
} from "lucide-react"

// Schema definitions
const serviceTypeSchema = z.enum(["field_trip", "school_transport", "private_pay"])

const baseSchema = z.object({
  serviceType: serviceTypeSchema,
  contactName: z.string().min(2, "Name is required"),
  contactEmail: z.string().email("Invalid email"),
  contactPhone: z.string().min(10, "Phone number is required"),
})

const fieldTripSchema = baseSchema.extend({
  serviceType: z.literal("field_trip"),
  organizationName: z.string().min(2, "Organization name is required"),
  tripDate: z.string().min(1, "Trip date is required"),
  pickupAddress: z.string().min(5, "Pickup address is required"),
  destinationAddress: z.string().min(5, "Destination address is required"),
  stagingTime: z.string().min(1, "Staging time is required"),
  numberOfStudents: z.number().min(1, "At least 1 student is required"),
  numberOfBuses: z.number().min(1, "At least 1 bus is required"),
  billingName: z.string().min(2, "Billing name is required"),
  billingEmail: z.string().email("Invalid billing email"),
  specialInstructions: z.string().optional(),
  agreeRules: z.boolean().refine(val => val === true, "You must agree to the School Group Rules & Guidelines"),
})

const schoolTransportSchema = baseSchema.extend({
  serviceType: z.literal("school_transport"),
  schoolCode: z.string().min(3, "School code is required"),
  studentFirstName: z.string().min(2, "Student first name is required"),
  studentLastName: z.string().min(2, "Student last name is required"),
  grade: z.string().min(1, "Grade is required"),
  serviceNeeded: z.enum(["AM", "PM", "BOTH"]),
  agreeCellPhonePolicy: z.boolean().refine(val => val === true, "You must agree to the Cell Phone Policy"),
  agreeReleasePolicy: z.boolean().refine(val => val === true, "You must agree to the Student Release Policy"),
})

const privatePaySchema = baseSchema.extend({
  serviceType: z.literal("private_pay"),
  studentFirstName: z.string().min(2, "Student first name is required"),
  studentLastName: z.string().min(2, "Student last name is required"),
  pickupAddress: z.string().min(5, "Pickup address is required"),
  dropoffAddress: z.string().min(5, "Dropoff address is required"),
  serviceNeeded: z.enum(["AM", "PM", "BOTH"]),
  agreeCellPhonePolicy: z.boolean().refine(val => val === true, "You must agree to the Cell Phone Policy"),
})

export default function IntakePage() {
  const [serviceType, setServiceType] = useState<"field_trip" | "school_transport" | "private_pay">("field_trip")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [showRulesAccordion, setShowRulesAccordion] = useState(false)

  const getSchema = () => {
    switch (serviceType) {
      case "field_trip": return fieldTripSchema;
      case "school_transport": return schoolTransportSchema;
      case "private_pay": return privatePaySchema;
    }
  }

  const { register, handleSubmit, formState: { errors }, reset } = useForm<any>({
    resolver: zodResolver(getSchema()),
    defaultValues: { serviceType: "field_trip" }
  })

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)
    setErrorMessage("")
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Submission failed")
      
      setIsSuccess(true)
    } catch (err: any) {
      setErrorMessage(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-between">
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-xl">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <CardTitle className="text-3xl font-heading">Request Received!</CardTitle>
              <CardDescription className="text-lg mt-2">
                Thank you for choosing Eagle Bus Service. Your request has been successfully submitted.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-3">
              <p className="text-muted-foreground text-sm">
                We've sent a confirmation email to your inbox. Our dispatch team will review your details and send your automated invoice/confirmation.
              </p>
              <div className="p-3 bg-muted/40 rounded-xl text-xs text-foreground font-medium">
                Call our dispatch team at <strong className="text-primary">(704) 606-5661</strong> for urgent updates.
              </div>
            </CardContent>
            <CardFooter className="justify-center pt-6">
              <Button onClick={() => { setIsSuccess(false); reset(); }} variant="outline">
                Submit Another Request
              </Button>
            </CardFooter>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      
      {/* Navbar Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-md">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-lg text-foreground">Eagle Bus Service</span>
              <span className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-widest -mt-1">
                Centralized Intake & Field Trip Booking
              </span>
            </div>
          </Link>

          <Link href="/" className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
        </div>
      </header>

      {/* Main Intake Form Container */}
      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-8">
        
        {/* Banner Title */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading text-foreground">
            Transportation Request Portal
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Complete and submit this form to request school bus transportation for field trips, charter events, or regular school routes. Eagle Bus Service provides transportation exclusively via school buses—no charter buses, mini-buses, or passenger vans.
          </p>
        </div>

        {/* Google Calendar Availability Link Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm font-heading">Check Calendar Availability Before Booking</h3>
              <p className="text-xs text-blue-100">
                All availability is subject to change. Call <strong className="text-white">(704) 606-5661</strong> to check availability for after-hours activities.
              </p>
            </div>
          </div>
          <a
            href="/api/calendar/embed"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-full bg-white text-blue-700 font-bold text-xs hover:bg-blue-50 transition-all shrink-0 shadow-sm"
          >
            Check Calendar Availability →
          </a>
        </div>

        {/* Service Type Selection Card */}
        <Card className="shadow-xl border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle className="text-xl">Select Service Type</CardTitle>
            <CardDescription>Choose the type of transportation service you are requesting</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[
                { id: "field_trip", label: "Field Trip Request", subtitle: "Elementary, Middle, High, Sports & Groups", icon: "🚌" },
                { id: "school_transport", label: "LNC / Charter Portal", subtitle: "Daily Cluster Stop Student Transport", icon: "🏫" },
                { id: "private_pay", label: "Private-Pay Parents", subtitle: "Neighborhood Cluster Group Interest", icon: "🤝" }
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => {
                    setServiceType(type.id as any);
                    reset({ serviceType: type.id });
                  }}
                  className={`flex flex-col items-start p-5 rounded-2xl border-2 transition-all text-left ${
                    serviceType === type.id 
                      ? "border-primary bg-primary/5 shadow-md" 
                      : "border-border bg-card hover:border-primary/50 hover:bg-accent/40"
                  }`}
                >
                  <span className="text-3xl mb-2">{type.icon}</span>
                  <span className="font-bold text-sm text-foreground">{type.label}</span>
                  <span className="text-[11px] text-muted-foreground mt-1 leading-tight">{type.subtitle}</span>
                </button>
              ))}
            </div>

            {/* EXPANDABLE RULES & GUIDELINES BANNER */}
            <div className="mb-8 border border-border rounded-2xl overflow-hidden bg-muted/20">
              <button
                type="button"
                onClick={() => setShowRulesAccordion(!showRulesAccordion)}
                className="w-full p-4 flex items-center justify-between bg-card text-left hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <div>
                    <span className="font-bold text-sm text-foreground">Review Eagle Bus Guidelines & Prohibited Items</span>
                    <span className="block text-[11px] text-muted-foreground">Capacity (50-60 max), Chaperones, Cell Phone & Prohibited Items policy</span>
                  </div>
                </div>
                {showRulesAccordion ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showRulesAccordion && (
                <div className="p-5 border-t border-border space-y-4 text-xs text-muted-foreground bg-card/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <strong className="text-foreground font-bold">School Group Guidelines:</strong>
                      <ul className="space-y-1">
                        <li>• <strong>Capacity:</strong> Max 50-60 riders depending on student size.</li>
                        <li>• <strong>Chaperones:</strong> Proportional adult supervision required per bus.</li>
                        <li>• <strong>Coordination:</strong> Adult must carry cell phone and know itinerary.</li>
                        <li>• <strong>Cleanliness:</strong> Leaders must leave bus clean at trip end.</li>
                      </ul>
                    </div>
                    <div className="space-y-1.5">
                      <strong className="text-foreground font-bold">Prohibited Items:</strong>
                      <ul className="space-y-1">
                        <li>• Large items blocking aisles (instruments, coolers, project boards).</li>
                        <li>• Strapped/secured items in passenger cabin (state policy prohibited).</li>
                        <li>• Firearms, weapons, glass containers, soda cans, alcoholic beverages.</li>
                        <li>• Cell phones must remain in bookbags (cell phone policy enforced).</li>
                      </ul>
                    </div>
                  </div>
                  <div className="pt-2 text-right">
                    <Link href="/rules" target="_blank" className="text-primary font-bold hover:underline">
                      View Full Handbook & Release Terms →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <input type="hidden" {...register("serviceType")} value={serviceType} />

              {/* CONTACT INFORMATION BLOCK */}
              <div className="space-y-4 bg-muted/20 p-6 rounded-2xl border border-border">
                <h3 className="text-base font-bold text-foreground border-b border-border pb-2">Primary Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="contactName" className="text-xs font-semibold">Full Name *</Label>
                    <Input id="contactName" {...register("contactName")} placeholder="Jane Doe" />
                    {errors.contactName && <p className="text-xs text-destructive">{errors.contactName.message as string}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contactPhone" className="text-xs font-semibold">Phone Number *</Label>
                    <Input id="contactPhone" {...register("contactPhone")} placeholder="(704) 606-5661" />
                    {errors.contactPhone && <p className="text-xs text-destructive">{errors.contactPhone.message as string}</p>}
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="contactEmail" className="text-xs font-semibold">Email Address *</Label>
                    <Input id="contactEmail" type="email" {...register("contactEmail")} placeholder="email@example.com" />
                    <p className="text-[11px] text-muted-foreground">Your email will be used for confirmation purposes only.</p>
                    {errors.contactEmail && <p className="text-xs text-destructive">{errors.contactEmail.message as string}</p>}
                  </div>
                </div>
              </div>

              {/* FIELD TRIP FORM SPECIFICS */}
              {serviceType === "field_trip" && (
                <div className="space-y-6 bg-primary/5 p-6 rounded-2xl border border-primary/20">
                  <h3 className="text-base font-bold text-primary border-b border-primary/20 pb-2">Field Trip & Event Details</h3>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="organizationName" className="text-xs font-semibold">School or Group Name *</Label>
                    <Input id="organizationName" {...register("organizationName")} placeholder="Lake Norman Charter Band" />
                    {errors.organizationName && <p className="text-xs text-destructive">{errors.organizationName.message as string}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="tripDate" className="text-xs font-semibold">Pickup Date of Trip *</Label>
                      <Input id="tripDate" type="date" {...register("tripDate")} />
                      {errors.tripDate && <p className="text-xs text-destructive">{errors.tripDate.message as string}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="stagingTime" className="text-xs font-semibold">Staging Time for Pickup *</Label>
                      <Input id="stagingTime" type="time" {...register("stagingTime")} />
                      {errors.stagingTime && <p className="text-xs text-destructive">{errors.stagingTime.message as string}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="pickupAddress" className="text-xs font-semibold">Pickup Address *</Label>
                      <Input id="pickupAddress" {...register("pickupAddress")} placeholder="123 School Rd, Charlotte, NC" />
                      {errors.pickupAddress && <p className="text-xs text-destructive">{errors.pickupAddress.message as string}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="destinationAddress" className="text-xs font-semibold">Destination Address *</Label>
                      <Input id="destinationAddress" {...register("destinationAddress")} placeholder="Discovery Place Museum, Charlotte" />
                      {errors.destinationAddress && <p className="text-xs text-destructive">{errors.destinationAddress.message as string}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5 col-span-2">
                      <Label htmlFor="numberOfStudents" className="text-xs font-semibold"># of Students / Passengers *</Label>
                      <Input id="numberOfStudents" type="number" {...register("numberOfStudents", { valueAsNumber: true })} placeholder="50" />
                      {errors.numberOfStudents && <p className="text-xs text-destructive">{errors.numberOfStudents.message as string}</p>}
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <Label htmlFor="numberOfBuses" className="text-xs font-semibold">Number of Buses (Max 50-60 riders/bus) *</Label>
                      <Input id="numberOfBuses" type="number" {...register("numberOfBuses", { valueAsNumber: true })} defaultValue={1} />
                      {errors.numberOfBuses && <p className="text-xs text-destructive">{errors.numberOfBuses.message as string}</p>}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-primary border-b border-primary/20 pb-2 pt-4">Billing Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="billingName" className="text-xs font-semibold">Name (for billing purposes) *</Label>
                      <Input id="billingName" {...register("billingName")} />
                      {errors.billingName && <p className="text-xs text-destructive">{errors.billingName.message as string}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="billingEmail" className="text-xs font-semibold">Email (for billing purposes) *</Label>
                      <Input id="billingEmail" type="email" {...register("billingEmail")} />
                      {errors.billingEmail && <p className="text-xs text-destructive">{errors.billingEmail.message as string}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <Label htmlFor="specialInstructions" className="text-xs font-semibold">Trip Description or Special Instructions</Label>
                    <Textarea id="specialInstructions" {...register("specialInstructions")} placeholder="Upload schedules, itinerary notes, special stops..." />
                  </div>

                  <div className="pt-3 border-t border-primary/20 flex items-start gap-3">
                    <input 
                      type="checkbox" 
                      id="agreeRules" 
                      {...register("agreeRules")} 
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="agreeRules" className="text-xs text-muted-foreground leading-normal">
                      I have read and agree to the <Link href="/rules" target="_blank" className="text-primary font-bold underline">School Group Rules & Guidelines</Link>, including capacity limits, chaperone responsibilities, and itinerary compliance.
                    </Label>
                  </div>
                  {errors.agreeRules && <p className="text-xs text-destructive">{errors.agreeRules.message as string}</p>}
                </div>
              )}

              {/* SCHOOL TRANSPORT FORM SPECIFICS */}
              {serviceType === "school_transport" && (
                <div className="space-y-6 bg-secondary/10 p-6 rounded-2xl border border-secondary/20">
                  <h3 className="text-base font-bold text-secondary-foreground border-b border-secondary/30 pb-2">Lake Norman Charter / School Registration</h3>
                  
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-900 dark:text-amber-200">
                    <strong>LNC Middle School Note:</strong> Buses will NOT service LNC Middle School at 12435 Old Statesville Rd on morning routes (afternoon PM routes only). Allow 48 hours for request processing.
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="schoolCode" className="text-xs font-semibold">School Code *</Label>
                    <Input id="schoolCode" {...register("schoolCode")} placeholder="e.g. LNC-2026" className="uppercase" />
                    {errors.schoolCode && <p className="text-xs text-destructive">{errors.schoolCode.message as string}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="studentFirstName" className="text-xs font-semibold">Student First Name *</Label>
                      <Input id="studentFirstName" {...register("studentFirstName")} />
                      {errors.studentFirstName && <p className="text-xs text-destructive">{errors.studentFirstName.message as string}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="studentLastName" className="text-xs font-semibold">Student Last Name *</Label>
                      <Input id="studentLastName" {...register("studentLastName")} />
                      {errors.studentLastName && <p className="text-xs text-destructive">{errors.studentLastName.message as string}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="grade" className="text-xs font-semibold">Grade Level *</Label>
                      <select 
                        id="grade" 
                        {...register("grade")}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      >
                        <option value="">Choose Grade</option>
                        <option value="K">Kindergarten</option>
                        <option value="1">1st Grade</option>
                        <option value="2">2nd Grade</option>
                        <option value="3">3rd Grade</option>
                        <option value="4">4th Grade</option>
                        <option value="5">5th Grade</option>
                        <option value="6">6th Grade</option>
                        <option value="7">7th Grade</option>
                        <option value="8">8th Grade</option>
                        <option value="9">9th Grade</option>
                        <option value="10">10th Grade</option>
                        <option value="11">11th Grade</option>
                        <option value="12">12th Grade</option>
                      </select>
                      {errors.grade && <p className="text-xs text-destructive">{errors.grade.message as string}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="serviceNeeded" className="text-xs font-semibold">Service Needed *</Label>
                      <select 
                        id="serviceNeeded" 
                        {...register("serviceNeeded")}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      >
                        <option value="BOTH">Round Trip ($125/mo)</option>
                        <option value="AM">Morning Only (AM Half-Price)</option>
                        <option value="PM">Afternoon Only (PM Half-Price)</option>
                      </select>
                    </div>
                  </div>

                  {/* Mandated Policy Checkboxes */}
                  <div className="space-y-3 pt-3 border-t border-secondary/30">
                    <div className="flex items-start gap-3">
                      <input 
                        type="checkbox" 
                        id="agreeCellPhonePolicy" 
                        {...register("agreeCellPhonePolicy")} 
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-primary"
                      />
                      <Label htmlFor="agreeCellPhonePolicy" className="text-xs text-muted-foreground leading-normal">
                        I understand the <Link href="/rules" target="_blank" className="text-primary font-bold underline">Cell Phone Policy</Link>: Cell phones must remain inside bookbags at all times. If seen/heard, phone will be confiscated and student suspended from bus.
                      </Label>
                    </div>
                    {errors.agreeCellPhonePolicy && <p className="text-xs text-destructive">{errors.agreeCellPhonePolicy.message as string}</p>}

                    <div className="flex items-start gap-3">
                      <input 
                        type="checkbox" 
                        id="agreeReleasePolicy" 
                        {...register("agreeReleasePolicy")} 
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-primary"
                      />
                      <Label htmlFor="agreeReleasePolicy" className="text-xs text-muted-foreground leading-normal">
                        I understand the <Link href="/rules" target="_blank" className="text-primary font-bold underline">Release Policy</Link>: K–3rd graders will not be released without an adult/older sibling at stop. Returned students incur $10/half-hour supervision fee.
                      </Label>
                    </div>
                    {errors.agreeReleasePolicy && <p className="text-xs text-destructive">{errors.agreeReleasePolicy.message as string}</p>}
                  </div>
                </div>
              )}

              {/* PRIVATE PAY FORM SPECIFICS */}
              {serviceType === "private_pay" && (
                <div className="space-y-6 bg-accent/20 p-6 rounded-2xl border border-accent/50">
                  <h3 className="text-base font-bold text-foreground border-b border-accent/50 pb-2">Private Pay Parent Group Interest</h3>
                  
                  <p className="text-xs text-muted-foreground">
                    We require at least 40 riders from a school to establish a new full-sized bus route. Registered parents will be contacted once cluster thresholds are reached.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="studentFirstName" className="text-xs font-semibold">Student First Name *</Label>
                      <Input id="studentFirstName" {...register("studentFirstName")} />
                      {errors.studentFirstName && <p className="text-xs text-destructive">{errors.studentFirstName.message as string}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="studentLastName" className="text-xs font-semibold">Student Last Name *</Label>
                      <Input id="studentLastName" {...register("studentLastName")} />
                      {errors.studentLastName && <p className="text-xs text-destructive">{errors.studentLastName.message as string}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="pickupAddress" className="text-xs font-semibold">Home Address *</Label>
                      <Input id="pickupAddress" {...register("pickupAddress")} />
                      {errors.pickupAddress && <p className="text-xs text-destructive">{errors.pickupAddress.message as string}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="dropoffAddress" className="text-xs font-semibold">School Name / Address *</Label>
                      <Input id="dropoffAddress" {...register("dropoffAddress")} />
                      {errors.dropoffAddress && <p className="text-xs text-destructive">{errors.dropoffAddress.message as string}</p>}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-accent/50 flex items-start gap-3">
                    <input 
                      type="checkbox" 
                      id="agreeCellPhonePolicy" 
                      {...register("agreeCellPhonePolicy")} 
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-primary"
                    />
                    <Label htmlFor="agreeCellPhonePolicy" className="text-xs text-muted-foreground leading-normal">
                      I understand the <Link href="/rules" target="_blank" className="text-primary font-bold underline">Cell Phone & Bus Rules</Link> governing all Eagle Bus Service vehicles.
                    </Label>
                  </div>
                  {errors.agreeCellPhonePolicy && <p className="text-xs text-destructive">{errors.agreeCellPhonePolicy.message as string}</p>}
                </div>
              )}

              {errorMessage && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-xl border border-destructive/20 text-xs font-medium">
                  {errorMessage}
                </div>
              )}

              <Button type="submit" size="lg" className="w-full text-base h-14 font-bold rounded-xl shadow-lg" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Submit Transportation Request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
}
