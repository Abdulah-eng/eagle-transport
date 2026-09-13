"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Calendar, MapPin, Bus, CheckCircle2, Loader2, X } from "lucide-react";

interface NewTripModalButtonProps {
  schoolId: string;
  schoolName: string;
}

export default function NewTripModalButton({ schoolId, schoolName }: NewTripModalButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    organizationName: `${schoolName} Field Trip`,
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    tripDate: "",
    pickupAddress: "",
    destinationAddress: "",
    numberOfStudents: 30,
    numberOfBuses: 1,
    stagingTime: "08:00",
    specialInstructions: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/school-portal/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, schoolId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit trip request");

      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "mt-1 text-sm text-slate-900 bg-white border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-semibold placeholder:text-slate-500 text-slate-900 shadow-sm";

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-slate-900 hover:bg-slate-800 text-white font-bold gap-2 shadow-md"
      >
        <PlusCircle className="h-4 w-4 text-amber-400" />
        Request Field Trip
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-4 relative">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-xl font-bold font-heading text-slate-900 flex items-center gap-2">
                <Bus className="h-5 w-5 text-amber-600" />
                Submit New Field Trip Request
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Submitting for <span className="font-bold text-slate-900">{schoolName}</span>
              </p>
            </div>

            {success ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                <h3 className="text-lg font-bold text-slate-900">Trip Request Submitted!</h3>
                <p className="text-sm text-slate-600">Your trip has been created and synced with Google Calendar & QuickBooks.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-bold text-slate-800">Trip / Group Name</Label>
                    <Input 
                      value={formData.organizationName}
                      onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                      required 
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-800">Trip Date</Label>
                    <Input 
                      type="date"
                      value={formData.tripDate}
                      onChange={(e) => setFormData({ ...formData, tripDate: e.target.value })}
                      required 
                      className={inputStyle}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs font-bold text-slate-800">Contact Name</Label>
                    <Input 
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      required 
                      placeholder="Jane Doe"
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-800">Contact Email</Label>
                    <Input 
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      required 
                      placeholder="jane@school.org"
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-800">Phone</Label>
                    <Input 
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      placeholder="(555) 000-0000"
                      className={inputStyle}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-bold text-slate-800">Pickup Address</Label>
                    <Input 
                      value={formData.pickupAddress}
                      onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                      placeholder="School Main Entrance"
                      required 
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-800">Destination Address</Label>
                    <Input 
                      value={formData.destinationAddress}
                      onChange={(e) => setFormData({ ...formData, destinationAddress: e.target.value })}
                      placeholder="Science Museum, City"
                      required 
                      className={inputStyle}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs font-bold text-slate-800">Students Count</Label>
                    <Input 
                      type="number"
                      min={1}
                      value={formData.numberOfStudents}
                      onChange={(e) => setFormData({ ...formData, numberOfStudents: Number(e.target.value) })}
                      required 
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-800">Buses Needed</Label>
                    <Input 
                      type="number"
                      min={1}
                      value={formData.numberOfBuses}
                      onChange={(e) => setFormData({ ...formData, numberOfBuses: Number(e.target.value) })}
                      required 
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-800">Staging Time</Label>
                    <Input 
                      type="time"
                      value={formData.stagingTime}
                      onChange={(e) => setFormData({ ...formData, stagingTime: e.target.value })}
                      required 
                      className={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-800">Special Instructions / Notes</Label>
                  <Textarea 
                    value={formData.specialInstructions}
                    onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                    placeholder="Enter any special requests, chaperone details, or parking info..."
                    rows={2}
                    className={inputStyle}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsOpen(false)}
                    className="text-xs font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1.5 shadow-md"
                  >
                    {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Submit Trip Request
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
