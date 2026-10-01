"use client"

import { useState, useRef, useEffect } from "react"
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
  Smartphone, FileText, ChevronDown, ChevronUp, Bus, ArrowLeft, MapPin
} from "lucide-react"

// Schema definitions
const serviceTypeSchema = z.enum(["field_trip", "school_transport", "private_pay"])

const baseSchema = z.object({
  serviceType: serviceTypeSchema,
  contactFirstName: z.string().min(1, "First Name is required"),
  contactLastName: z.string().min(1, "Last Name is required"),
  contactName: z.string().optional(),
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
  returnTime: z.string().optional(),
  numberOfStudents: z.number().min(1, "At least 1 student is required"),
  numberOfChaperones: z.number().optional(),
  numberOfBuses: z.number().min(1, "At least 1 bus is required"),
  billingName: z.string().min(2, "Billing name is required"),
  billingEmail: z.string().email("Invalid billing email"),
  billingPhone: z.string().optional(),
  specialInstructions: z.string().optional(),
  agreeRules: z.boolean().refine(val => val === true, "You must agree to the School Group Rules & Guidelines"),
})

const schoolTransportSchema = baseSchema.extend({
  serviceType: z.literal("school_transport"),
  title: z.string().optional(),
  preferredContactMethod: z.enum(["Phone", "Email", "Either"]).optional(),
  preferredBusService: z.enum(["Daily AM & PM Routes", "Daily PM Only Routes", "Daily After-school Transport"]).default("Daily AM & PM Routes"),
  schoolName: z.string().min(2, "School name is required"),
  schoolStreet: z.string().min(3, "Street address is required"),
  schoolStreet2: z.string().optional(),
  schoolCity: z.string().min(2, "City is required"),
  schoolState: z.string().min(2, "State is required"),
  schoolZip: z.string().min(3, "Zip code is required"),
  schoolCountry: z.string().default("United States"),
  serviceArea: z.string().optional(),
  numberOfStudentsCategory: z.enum(["Less than 50", "50 - 100", "100 - 200", "200 - 300", "Greater than 300"]).default("50 - 100"),
  academicSchoolDays: z.number().optional(),
  firstDayOfSchool: z.string().min(1, "First day of school is required"),
  lastDayOfSchool: z.string().optional(),
  amBellTime: z.string().optional(),
  amBusArrivalTime: z.string().optional(),
  pmBellTime: z.string().optional(),
  pmBusArrivalTime: z.string().optional(),
  hasOwnBuses: z.enum(["Yes", "No"]).optional(),
  ownBusesCount: z.number().optional(),
  comments: z.string().optional(),
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

  const pickupInputRef = useRef<HTMLInputElement | null>(null)
  const destinationInputRef = useRef<HTMLInputElement | null>(null)
  const schoolStreetInputRef = useRef<HTMLInputElement | null>(null)
  const privatePickupInputRef = useRef<HTMLInputElement | null>(null)
  const privateDropoffInputRef = useRef<HTMLInputElement | null>(null)

  const getSchema = () => {
    switch (serviceType) {
      case "field_trip": return fieldTripSchema;
      case "school_transport": return schoolTransportSchema;
      case "private_pay": return privatePaySchema;
    }
  }

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<any>({
    resolver: zodResolver(getSchema()),
    defaultValues: { serviceType: "field_trip" }
  })

  interface AddressSuggestion {
    fullAddress: string;
    street: string;
    city: string;
    state: string;
    zip: string;
  }

  const [pickupSuggestions, setPickupSuggestions] = useState<AddressSuggestion[]>([])
  const [destSuggestions, setDestSuggestions] = useState<AddressSuggestion[]>([])
  const [schoolStreetSuggestions, setSchoolStreetSuggestions] = useState<AddressSuggestion[]>([])
  const [privatePickupSuggestions, setPrivatePickupSuggestions] = useState<AddressSuggestion[]>([])
  const [privateDropoffSuggestions, setPrivateDropoffSuggestions] = useState<AddressSuggestion[]>([])

  const [showPickupDropdown, setShowPickupDropdown] = useState(false)
  const [showDestDropdown, setShowDestDropdown] = useState(false)
  const [showSchoolStreetDropdown, setShowSchoolStreetDropdown] = useState(false)
  const [showPrivatePickupDropdown, setShowPrivatePickupDropdown] = useState(false)
  const [showPrivateDropoffDropdown, setShowPrivateDropoffDropdown] = useState(false)

  const fetchAddressSuggestions = async (query: string, setSuggestions: (items: AddressSuggestion[]) => void) => {
    if (!query || query.trim().length < 3) {
      setSuggestions([])
      return
    }
    try {
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`)
      if (!res.ok) return
      const data = await res.json()
      if (data && data.features) {
        const items: AddressSuggestion[] = data.features.map((f: any) => {
          const props = f.properties || {}
          const streetPart = props.housenumber ? `${props.housenumber} ${props.street || ''}`.trim() : (props.street || props.name || '')
          const cityPart = props.city || props.town || props.district || ''
          const statePart = props.state || ''
          const zipPart = props.postcode || ''

          const full = [
            props.name && props.name !== streetPart ? props.name : null,
            streetPart,
            cityPart,
            statePart,
            zipPart
          ].filter(Boolean).join(", ")

          return {
            fullAddress: full || query,
            street: streetPart || props.name || query,
            city: cityPart,
            state: statePart,
            zip: zipPart
          }
        }).filter((v: AddressSuggestion, idx: number, self: AddressSuggestion[]) => v.fullAddress && self.findIndex(x => x.fullAddress === v.fullAddress) === idx)
        setSuggestions(items)
      }
    } catch (err) {
      console.warn("Free address autocomplete warning:", err)
    }
  }

  // Google Places & OpenStreetMap Autocomplete Integration
  useEffect(() => {
    if (typeof window === "undefined") return;

    function initAutocomplete() {
      if ((window as any).google && (window as any).google.maps && (window as any).google.maps.places) {
        if (pickupInputRef.current) {
          const pAuto = new (window as any).google.maps.places.Autocomplete(pickupInputRef.current, {
            types: ["address"],
            componentRestrictions: { country: "us" }
          });
          pAuto.addListener("place_changed", () => {
            const place = pAuto.getPlace();
            if (place?.formatted_address) {
              setValue("pickupAddress", place.formatted_address);
            }
          });
        }
        if (destinationInputRef.current) {
          const dAuto = new (window as any).google.maps.places.Autocomplete(destinationInputRef.current, {
            types: ["establishment", "geocode"],
            componentRestrictions: { country: "us" }
          });
          dAuto.addListener("place_changed", () => {
            const place = dAuto.getPlace();
            if (place?.formatted_address || place?.name) {
              setValue("destinationAddress", place.formatted_address || place.name || "");
            }
          });
        }
        if (schoolStreetInputRef.current) {
          const sAuto = new (window as any).google.maps.places.Autocomplete(schoolStreetInputRef.current, {
            types: ["address"],
            componentRestrictions: { country: "us" }
          });
          sAuto.addListener("place_changed", () => {
            const place = sAuto.getPlace();
            if (place?.address_components) {
              let streetNumber = "";
              let route = "";
              let city = "";
              let state = "";
              let zip = "";
              for (const comp of place.address_components) {
                const types = comp.types;
                if (types.includes("street_number")) streetNumber = comp.long_name;
                if (types.includes("route")) route = comp.long_name;
                if (types.includes("locality") || types.includes("sublocality")) city = comp.long_name;
                if (types.includes("administrative_area_level_1")) state = comp.short_name || comp.long_name;
                if (types.includes("postal_code")) zip = comp.long_name;
              }
              const street = [streetNumber, route].filter(Boolean).join(" ");
              setValue("schoolStreet", street || place.formatted_address || "");
              if (city) setValue("schoolCity", city);
              if (state) setValue("schoolState", state);
              if (zip) setValue("schoolZip", zip);
            } else if (place?.formatted_address) {
              setValue("schoolStreet", place.formatted_address);
            }
          });
        }
        if (privatePickupInputRef.current) {
          const ppAuto = new (window as any).google.maps.places.Autocomplete(privatePickupInputRef.current, {
            types: ["address"],
            componentRestrictions: { country: "us" }
          });
          ppAuto.addListener("place_changed", () => {
            const place = ppAuto.getPlace();
            if (place?.formatted_address) {
              setValue("pickupAddress", place.formatted_address);
            }
          });
        }
        if (privateDropoffInputRef.current) {
          const pdAuto = new (window as any).google.maps.places.Autocomplete(privateDropoffInputRef.current, {
            types: ["establishment", "geocode"],
            componentRestrictions: { country: "us" }
          });
          pdAuto.addListener("place_changed", () => {
            const place = pdAuto.getPlace();
            if (place?.formatted_address || place?.name) {
              setValue("dropoffAddress", place.formatted_address || place.name || "");
            }
          });
        }
      }
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
    if (!(window as any).google && apiKey) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.onload = initAutocomplete;
      document.head.appendChild(script);
    } else {
      initAutocomplete();
    }
  }, [setValue, serviceType]);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)
    setErrorMessage("")
    try {
      const contactName = `${data.contactFirstName || ''} ${data.contactLastName || ''}`.trim()
      const payload = {
        ...data,
        contactName: contactName || data.contactName
      }
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
                
                {/* JotForm standard side-by-side Name field */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Input
                        id="contactFirstName"
                        {...register("contactFirstName")}
                        placeholder="First Name"
                        aria-invalid={!!errors.contactFirstName}
                        className={errors.contactFirstName ? "border-destructive focus-visible:ring-destructive" : ""}
                      />
                      <span className="text-[11px] text-muted-foreground block">First Name</span>
                      {errors.contactFirstName && (
                        <p className="text-xs text-destructive mt-0.5">{errors.contactFirstName.message as string}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Input
                        id="contactLastName"
                        {...register("contactLastName")}
                        placeholder="Last Name"
                        aria-invalid={!!errors.contactLastName}
                        className={errors.contactLastName ? "border-destructive focus-visible:ring-destructive" : ""}
                      />
                      <span className="text-[11px] text-muted-foreground block">Last Name</span>
                      {errors.contactLastName && (
                        <p className="text-xs text-destructive mt-0.5">{errors.contactLastName.message as string}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="contactPhone" className="text-xs font-semibold">Phone Number <span className="text-destructive">*</span></Label>
                    <Input id="contactPhone" {...register("contactPhone")} placeholder="(704) 606-5661" />
                    {errors.contactPhone && <p className="text-xs text-destructive">{errors.contactPhone.message as string}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contactEmail" className="text-xs font-semibold">Email Address <span className="text-destructive">*</span></Label>
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="tripDate" className="text-xs font-semibold">Pickup Date of Trip *</Label>
                      <Input id="tripDate" type="date" {...register("tripDate")} />
                      {errors.tripDate && <p className="text-xs text-destructive">{errors.tripDate.message as string}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="stagingTime" className="text-xs font-semibold">Staging / Pickup Time *</Label>
                      <Input id="stagingTime" type="time" {...register("stagingTime")} />
                      {errors.stagingTime && <p className="text-xs text-destructive">{errors.stagingTime.message as string}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="returnTime" className="text-xs font-semibold">Estimated Return Time</Label>
                      <Input id="returnTime" type="time" {...register("returnTime")} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* PICKUP ADDRESS FIELD */}
                    <div className="space-y-1.5 relative">
                      <Label htmlFor="pickupAddress" className="text-xs font-semibold flex items-center justify-between">
                        <span>Pickup Address *</span>
                        <span className="text-[10px] text-emerald-600 font-bold">✨ Free Live Auto-complete</span>
                      </Label>
                      <Input 
                        id="pickupAddress" 
                        {...register("pickupAddress")} 
                        ref={(e) => {
                          register("pickupAddress").ref(e);
                          pickupInputRef.current = e;
                        }}
                        onChange={(e) => {
                          register("pickupAddress").onChange(e);
                          fetchAddressSuggestions(e.target.value, setPickupSuggestions);
                          setShowPickupDropdown(true);
                        }}
                        onFocus={() => setShowPickupDropdown(true)}
                        placeholder="Start typing address (e.g. 123 School Rd, Charlotte, NC)" 
                        autoComplete="off"
                      />
                      {showPickupDropdown && pickupSuggestions.length > 0 && (
                        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden divide-y divide-border">
                          {pickupSuggestions.map((item, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onMouseDown={() => {
                                setValue("pickupAddress", item.fullAddress);
                                setShowPickupDropdown(false);
                              }}
                              className="w-full text-left p-2.5 text-xs text-foreground hover:bg-primary/10 transition-colors flex items-center gap-2"
                            >
                              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate">{item.fullAddress}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {errors.pickupAddress && <p className="text-xs text-destructive">{errors.pickupAddress.message as string}</p>}
                    </div>

                    {/* DESTINATION ADDRESS FIELD */}
                    <div className="space-y-1.5 relative">
                      <Label htmlFor="destinationAddress" className="text-xs font-semibold flex items-center justify-between">
                        <span>Destination Address *</span>
                        <span className="text-[10px] text-emerald-600 font-bold">✨ Free Live Auto-complete</span>
                      </Label>
                      <Input 
                        id="destinationAddress" 
                        {...register("destinationAddress")} 
                        ref={(e) => {
                          register("destinationAddress").ref(e);
                          destinationInputRef.current = e;
                        }}
                        onChange={(e) => {
                          register("destinationAddress").onChange(e);
                          fetchAddressSuggestions(e.target.value, setDestSuggestions);
                          setShowDestDropdown(true);
                        }}
                        onFocus={() => setShowDestDropdown(true)}
                        placeholder="Start typing destination or venue name" 
                        autoComplete="off"
                      />
                      {showDestDropdown && destSuggestions.length > 0 && (
                        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden divide-y divide-border">
                          {destSuggestions.map((item, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onMouseDown={() => {
                                setValue("destinationAddress", item.fullAddress);
                                setShowDestDropdown(false);
                              }}
                              className="w-full text-left p-2.5 text-xs text-foreground hover:bg-primary/10 transition-colors flex items-center gap-2"
                            >
                              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate">{item.fullAddress}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {errors.destinationAddress && <p className="text-xs text-destructive">{errors.destinationAddress.message as string}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="numberOfStudents" className="text-xs font-semibold"># of Students / Passengers *</Label>
                      <Input id="numberOfStudents" type="number" {...register("numberOfStudents", { valueAsNumber: true })} placeholder="50" />
                      {errors.numberOfStudents && <p className="text-xs text-destructive">{errors.numberOfStudents.message as string}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="numberOfChaperones" className="text-xs font-semibold"># of Chaperones / Teachers</Label>
                      <Input id="numberOfChaperones" type="number" {...register("numberOfChaperones", { valueAsNumber: true })} placeholder="5" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="numberOfBuses" className="text-xs font-semibold">Buses Requested (Max 50-60/bus) *</Label>
                      <Input id="numberOfBuses" type="number" {...register("numberOfBuses", { valueAsNumber: true })} defaultValue={1} />
                      {errors.numberOfBuses && <p className="text-xs text-destructive">{errors.numberOfBuses.message as string}</p>}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-primary border-b border-primary/20 pb-2 pt-4">Billing Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="billingName" className="text-xs font-semibold">Billing Contact Name *</Label>
                      <Input id="billingName" {...register("billingName")} placeholder="Accounts Payable / Name" />
                      {errors.billingName && <p className="text-xs text-destructive">{errors.billingName.message as string}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="billingEmail" className="text-xs font-semibold">Billing Email *</Label>
                      <Input id="billingEmail" type="email" {...register("billingEmail")} placeholder="billing@school.org" />
                      {errors.billingEmail && <p className="text-xs text-destructive">{errors.billingEmail.message as string}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="billingPhone" className="text-xs font-semibold">Billing Phone</Label>
                      <Input id="billingPhone" {...register("billingPhone")} placeholder="(704) 555-0199" />
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

              {/* SCHOOL TRANSPORT / CHARTER SCHOOL DAILY BUS SERVICE RFQ (JotForm 201346331522140) */}
              {serviceType === "school_transport" && (
                <div className="space-y-6 bg-secondary/10 p-6 rounded-2xl border border-secondary/20">
                  <div className="border-b border-secondary/30 pb-3">
                    <h3 className="text-lg font-bold text-secondary-foreground font-heading">
                      Request for Quote — Charter School Daily Bus Service
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Please take a moment to fill out the charter school daily transportation request form.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="title" className="text-xs font-semibold">Job Title / Role</Label>
                      <Input id="title" {...register("title")} placeholder="e.g. Principal / Transportation Director" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="preferredContactMethod" className="text-xs font-semibold">Preferred Method of Contact *</Label>
                      <select 
                        id="preferredContactMethod" 
                        {...register("preferredContactMethod")}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      >
                        <option value="Phone">Phone</option>
                        <option value="Email">Email</option>
                        <option value="Either">Either</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="preferredBusService" className="text-xs font-semibold">Preferred Type of Bus Service *</Label>
                      <select 
                        id="preferredBusService" 
                        {...register("preferredBusService")}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      >
                        <option value="Daily AM & PM Routes">Daily AM & PM Routes</option>
                        <option value="Daily PM Only Routes">Daily PM Only Routes</option>
                        <option value="Daily After-school Transport">Daily After-school Transport</option>
                      </select>
                      {errors.preferredBusService && <p className="text-xs text-destructive">{errors.preferredBusService.message as string}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="schoolName" className="text-xs font-semibold">Name of School or Program *</Label>
                      <Input id="schoolName" {...register("schoolName")} placeholder="e.g. Lake Norman Charter School" />
                      {errors.schoolName && <p className="text-xs text-destructive">{errors.schoolName.message as string}</p>}
                    </div>
                  </div>

                  {/* SCHOOL ADDRESS BLOCK */}
                  <div className="space-y-3 p-4 bg-background/60 rounded-xl border border-border">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center justify-between">
                      <span>School Address *</span>
                      <span className="text-[10px] text-emerald-600 font-bold normal-case">✨ Free Live Auto-complete</span>
                    </h4>
                    
                    <div className="space-y-1.5 relative">
                      <Input 
                        id="schoolStreet" 
                        {...register("schoolStreet")} 
                        ref={(e) => {
                          register("schoolStreet").ref(e);
                          schoolStreetInputRef.current = e;
                        }}
                        onChange={(e) => {
                          register("schoolStreet").onChange(e);
                          fetchAddressSuggestions(e.target.value, setSchoolStreetSuggestions);
                          setShowSchoolStreetDropdown(true);
                        }}
                        onFocus={() => setShowSchoolStreetDropdown(true)}
                        placeholder="Start typing school street address (e.g. 13415 Old Statesville Rd) *" 
                        autoComplete="off"
                      />
                      {showSchoolStreetDropdown && schoolStreetSuggestions.length > 0 && (
                        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden divide-y divide-border">
                          {schoolStreetSuggestions.map((item, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onMouseDown={() => {
                                setValue("schoolStreet", item.street || item.fullAddress);
                                if (item.city) setValue("schoolCity", item.city);
                                if (item.state) setValue("schoolState", item.state);
                                if (item.zip) setValue("schoolZip", item.zip);
                                setShowSchoolStreetDropdown(false);
                              }}
                              className="w-full text-left p-2.5 text-xs text-foreground hover:bg-primary/10 transition-colors flex items-center gap-2"
                            >
                              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate">{item.fullAddress}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {errors.schoolStreet && <p className="text-xs text-destructive">{errors.schoolStreet.message as string}</p>}
                    </div>
                    
                    <div className="space-y-1.5">
                      <Input id="schoolStreet2" {...register("schoolStreet2")} placeholder="Street Address Line 2 (Optional)" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Input id="schoolCity" {...register("schoolCity")} placeholder="City *" />
                        {errors.schoolCity && <p className="text-xs text-destructive">{errors.schoolCity.message as string}</p>}
                      </div>
                      <div className="space-y-1">
                        <Input id="schoolState" {...register("schoolState")} placeholder="State / Province *" />
                        {errors.schoolState && <p className="text-xs text-destructive">{errors.schoolState.message as string}</p>}
                      </div>
                      <div className="space-y-1">
                        <Input id="schoolZip" {...register("schoolZip")} placeholder="Postal / Zip Code *" />
                        {errors.schoolZip && <p className="text-xs text-destructive">{errors.schoolZip.message as string}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="serviceArea" className="text-xs font-semibold">What is your service area?</Label>
                      <Input id="serviceArea" {...register("serviceArea")} placeholder="e.g. Huntersville, Cornelius, Charlotte" />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="numberOfStudentsCategory" className="text-xs font-semibold">Number of Students Needing Transport *</Label>
                      <select 
                        id="numberOfStudentsCategory" 
                        {...register("numberOfStudentsCategory")}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      >
                        <option value="Less than 50">Less than 50</option>
                        <option value="50 - 100">50 - 100</option>
                        <option value="100 - 200">100 - 200</option>
                        <option value="200 - 300">200 - 300</option>
                        <option value="Greater than 300">Greater than 300</option>
                      </select>
                      {errors.numberOfStudentsCategory && <p className="text-xs text-destructive">{errors.numberOfStudentsCategory.message as string}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="academicSchoolDays" className="text-xs font-semibold">Number of Academic School Days</Label>
                      <Input id="academicSchoolDays" type="number" defaultValue={180} {...register("academicSchoolDays", { valueAsNumber: true })} />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="firstDayOfSchool" className="text-xs font-semibold">First Day of School *</Label>
                      <Input id="firstDayOfSchool" type="date" {...register("firstDayOfSchool")} />
                      {errors.firstDayOfSchool && <p className="text-xs text-destructive">{errors.firstDayOfSchool.message as string}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="lastDayOfSchool" className="text-xs font-semibold">Last Day of School</Label>
                      <Input id="lastDayOfSchool" type="date" {...register("lastDayOfSchool")} />
                    </div>
                  </div>

                  {/* BELL & ARRIVAL TIMES */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-background/60 rounded-xl border border-border">
                    <div className="space-y-1.5">
                      <Label htmlFor="amBellTime" className="text-xs font-semibold">AM Bell Time</Label>
                      <Input id="amBellTime" type="time" {...register("amBellTime")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="amBusArrivalTime" className="text-xs font-semibold">Desired AM Bus Arrival Time at School</Label>
                      <Input id="amBusArrivalTime" type="time" {...register("amBusArrivalTime")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pmBellTime" className="text-xs font-semibold">Dismissal PM Bell Time</Label>
                      <Input id="pmBellTime" type="time" {...register("pmBellTime")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pmBusArrivalTime" className="text-xs font-semibold">Desired PM Bus Arrival Time at School</Label>
                      <Input id="pmBusArrivalTime" type="time" {...register("pmBusArrivalTime")} />
                    </div>
                  </div>

                  {/* FLEET OWNERSHIP */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="hasOwnBuses" className="text-xs font-semibold">Do you have your own buses?</Label>
                      <select 
                        id="hasOwnBuses" 
                        {...register("hasOwnBuses")}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="ownBusesCount" className="text-xs font-semibold">If so, how many buses do you have?</Label>
                      <Input id="ownBusesCount" type="number" placeholder="0" {...register("ownBusesCount", { valueAsNumber: true })} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="comments" className="text-xs font-semibold">Comments / Special Requests</Label>
                    <Textarea id="comments" rows={3} {...register("comments")} placeholder="Specify route preferences, cluster stops, special student needs..." />
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
                    {/* HOME ADDRESS */}
                    <div className="space-y-1.5 relative">
                      <Label htmlFor="privatePickupAddress" className="text-xs font-semibold flex items-center justify-between">
                        <span>Home Address *</span>
                        <span className="text-[10px] text-emerald-600 font-bold">✨ Free Live Auto-complete</span>
                      </Label>
                      <Input 
                        id="privatePickupAddress" 
                        {...register("pickupAddress")} 
                        ref={(e) => {
                          register("pickupAddress").ref(e);
                          privatePickupInputRef.current = e;
                        }}
                        onChange={(e) => {
                          register("pickupAddress").onChange(e);
                          fetchAddressSuggestions(e.target.value, setPrivatePickupSuggestions);
                          setShowPrivatePickupDropdown(true);
                        }}
                        onFocus={() => setShowPrivatePickupDropdown(true)}
                        placeholder="Start typing home address (e.g. 123 Main St, Charlotte, NC)" 
                        autoComplete="off"
                      />
                      {showPrivatePickupDropdown && privatePickupSuggestions.length > 0 && (
                        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden divide-y divide-border">
                          {privatePickupSuggestions.map((item, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onMouseDown={() => {
                                setValue("pickupAddress", item.fullAddress);
                                setShowPrivatePickupDropdown(false);
                              }}
                              className="w-full text-left p-2.5 text-xs text-foreground hover:bg-primary/10 transition-colors flex items-center gap-2"
                            >
                              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate">{item.fullAddress}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {errors.pickupAddress && <p className="text-xs text-destructive">{errors.pickupAddress.message as string}</p>}
                    </div>

                    {/* SCHOOL NAME / ADDRESS */}
                    <div className="space-y-1.5 relative">
                      <Label htmlFor="privateDropoffAddress" className="text-xs font-semibold flex items-center justify-between">
                        <span>School Name / Address *</span>
                        <span className="text-[10px] text-emerald-600 font-bold">✨ Free Live Auto-complete</span>
                      </Label>
                      <Input 
                        id="privateDropoffAddress" 
                        {...register("dropoffAddress")} 
                        ref={(e) => {
                          register("dropoffAddress").ref(e);
                          privateDropoffInputRef.current = e;
                        }}
                        onChange={(e) => {
                          register("dropoffAddress").onChange(e);
                          fetchAddressSuggestions(e.target.value, setPrivateDropoffSuggestions);
                          setShowPrivateDropoffDropdown(true);
                        }}
                        onFocus={() => setShowPrivateDropoffDropdown(true)}
                        placeholder="Start typing school name or address" 
                        autoComplete="off"
                      />
                      {showPrivateDropoffDropdown && privateDropoffSuggestions.length > 0 && (
                        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden divide-y divide-border">
                          {privateDropoffSuggestions.map((item, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onMouseDown={() => {
                                setValue("dropoffAddress", item.fullAddress);
                                setShowPrivateDropoffDropdown(false);
                              }}
                              className="w-full text-left p-2.5 text-xs text-foreground hover:bg-primary/10 transition-colors flex items-center gap-2"
                            >
                              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate">{item.fullAddress}</span>
                            </button>
                          ))}
                        </div>
                      )}
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
