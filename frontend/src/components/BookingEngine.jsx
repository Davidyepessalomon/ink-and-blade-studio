import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Calendar as CalendarIcon, Clock, Scissors, Sparkles, User, 
  CreditCard, ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight 
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

export default function BookingEngine({ 
  preselectedServiceId, 
  preselectedArtistId, 
  flashItemId, 
  onClose,
  onBookingCreated 
}) {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [artists, setArtists] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Client Details Form
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Initial Load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [srvRes, artRes] = await Promise.all([
          axios.get(`${API}/services`),
          axios.get(`${API}/artists`),
        ]);
        setServices(srvRes.data);
        setArtists(artRes.data);

        // Pre-selection handling
        if (preselectedServiceId) {
          const srv = srvRes.data.find((s) => s.id === preselectedServiceId);
          if (srv) setSelectedService(srv);
        }
        if (preselectedArtistId) {
          const art = artRes.data.find((a) => a.id === preselectedArtistId);
          if (art) setSelectedArtist(art);
        }
      } catch (e) {
        console.error("Error loading booking prerequisites:", e);
      }
    };
    fetchData();
  }, [preselectedServiceId, preselectedArtistId]);

  // Fetch Available Slots when Date or Artist changes
  useEffect(() => {
    if (!selectedArtist || !selectedDate) return;
    const fetchSlots = async () => {
      try {
        setLoadingSlots(true);
        const res = await axios.get(`${API}/availability`, {
          params: {
            date: selectedDate,
            artist_id: selectedArtist.id,
            service_id: selectedService?.id,
          },
        });
        setAvailableSlots(res.data.slots || []);
      } catch (e) {
        console.error("Error fetching slots:", e);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDate, selectedArtist, selectedService]);

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!selectedService || !selectedArtist || !selectedDate || !selectedSlot) {
      toast.error("Please select a service, artist, date, and slot.");
      return;
    }
    if (!clientName || !clientEmail || !clientPhone) {
      toast.error("Please fill in your contact information.");
      return;
    }

    try {
      setSubmitting(true);
      const originUrl = window.location.origin;
      const payload = {
        service_id: selectedService.id,
        artist_id: selectedArtist.id,
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        date: selectedDate,
        time_slot: selectedSlot,
        notes: notes,
        flash_item_id: flashItemId || null,
        origin_url: originUrl,
      };

      const res = await axios.post(`${API}/bookings`, payload);
      toast.success("Slot reserved! Redirecting to secure Stripe deposit checkout...");

      if (onBookingCreated) {
        onBookingCreated(res.data.booking);
      }

      // If Stripe Checkout URL is present, redirect to checkout
      if (res.data.checkout_url) {
        setTimeout(() => {
          window.location.href = res.data.checkout_url;
        }, 800);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to create booking. Slot might have been taken.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#141416] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl max-w-4xl mx-auto text-zinc-100">
      
      {/* Step Progress Bar */}
      <div className="bg-[#0B0B0C] border-b border-zinc-800 p-4 sm:p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center">
            <Scissors className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="text-left">
            <h3 className="font-serif font-bold text-base text-white">Smart Studio Scheduling</h3>
            <p className="text-xs text-zinc-400">Step {step} of 3: {step === 1 ? "Select Service & Artist" : step === 2 ? "Date & Time Slot" : "Contact & Stripe Deposit"}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                step === num
                  ? "bg-[#D4AF37] text-black"
                  : step > num
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {step > num ? <CheckCircle2 className="w-4 h-4" /> : num}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 sm:p-8">
        
        {/* STEP 1: SERVICE & ARTIST SELECTION */}
        {step === 1 && (
          <div className="space-y-6 text-left animate-in fade-in duration-300">
            <div>
              <Label className="text-xs uppercase tracking-wider text-zinc-400 font-mono mb-3 block">
                1. Select Experience / Service
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {services.map((srv) => {
                  const isSelected = selectedService?.id === srv.id;
                  return (
                    <div
                      key={srv.id}
                      data-testid={`service-card-${srv.id}`}
                      onClick={() => setSelectedService(srv)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-[#D4AF37] bg-[#D4AF37]/10 shadow-[0_0_15px_rgba(212,175,55,0.15)]"
                          : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm text-zinc-100">{srv.name}</span>
                          <span className="text-xs font-mono font-bold text-[#D4AF37]">${srv.price}</span>
                        </div>
                        <p className="text-xs text-zinc-400 line-clamp-2">{srv.description}</p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-[#D4AF37]" /> {srv.duration_minutes} Mins</span>
                        <span className="text-[#D4AF37] font-semibold font-mono">${srv.deposit_required} Deposit</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-zinc-400 font-mono mb-3 block">
                2. Select Resident Master / Barber
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {artists.map((art) => {
                  const isSelected = selectedArtist?.id === art.id;
                  return (
                    <div
                      key={art.id}
                      data-testid={`artist-card-${art.id}`}
                      onClick={() => setSelectedArtist(art)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                        isSelected
                          ? "border-[#D4AF37] bg-[#D4AF37]/10 shadow-[0_0_15px_rgba(212,175,55,0.15)]"
                          : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900"
                      }`}
                    >
                      <img
                        src={art.avatar_url}
                        alt={art.name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="text-left overflow-hidden">
                        <h4 className="font-bold text-xs text-zinc-100 truncate">{art.name}</h4>
                        <p className="text-[10px] text-zinc-400 truncate">{art.role}</p>
                        <p className="text-[10px] text-[#D4AF37] font-mono mt-0.5">★ {art.rating || "5.0"}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                data-testid="booking-step-1-next-btn"
                disabled={!selectedService || !selectedArtist}
                onClick={() => setStep(2)}
                className="bg-[#D4AF37] text-black font-bold hover:bg-[#E5C158] px-8"
              >
                Continue to Date & Time <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: CALENDAR & SLOTS */}
        {step === 2 && (
          <div className="space-y-6 text-left animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* Date Input */}
              <div className="md:col-span-5 space-y-3">
                <Label className="text-xs uppercase tracking-wider text-zinc-400 font-mono block">
                  Select Appointment Date
                </Label>
                <Input
                  type="date"
                  data-testid="booking-date-picker"
                  value={selectedDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSlot("");
                  }}
                  className="bg-zinc-900 border-zinc-700 text-white text-base py-3 px-4 rounded-xl"
                />

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2 mt-4 text-xs text-zinc-400">
                  <div className="flex justify-between">
                    <span>Artist:</span>
                    <span className="text-white font-semibold">{selectedArtist?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service:</span>
                    <span className="text-white font-semibold">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Est. Duration:</span>
                    <span className="text-white font-semibold">{selectedService?.duration_minutes} Mins</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Buffer between slots:</span>
                    <span className="text-[#D4AF37] font-mono">15 Mins Cleanse</span>
                  </div>
                </div>
              </div>

              {/* Time Slots Grid */}
              <div className="md:col-span-7 space-y-3">
                <Label className="text-xs uppercase tracking-wider text-zinc-400 font-mono block">
                  Available Chair Slots for {selectedDate}
                </Label>

                {loadingSlots ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-11 bg-zinc-900 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="p-8 text-center bg-zinc-900/40 rounded-xl border border-zinc-800 text-zinc-400 text-xs">
                    No open slots found on this date. Please pick another day.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {availableSlots.map((slot) => {
                      const isSelected = selectedSlot === slot.time;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.available}
                          data-testid={`time-slot-${slot.time.replace(/[:\s]/g, "-")}`}
                          onClick={() => setSelectedSlot(slot.time)}
                          className={`py-2.5 px-3 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                            !slot.available
                              ? "bg-zinc-950/50 border-zinc-900 text-zinc-600 line-through cursor-not-allowed"
                              : isSelected
                              ? "bg-[#D4AF37] border-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                              : "bg-zinc-900/80 border-zinc-800 text-zinc-200 hover:border-zinc-700 hover:text-white"
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          {slot.time}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 flex justify-between border-t border-zinc-800">
              <Button
                variant="outline"
                data-testid="booking-step-2-back-btn"
                onClick={() => setStep(1)}
                className="border-zinc-700 bg-zinc-900 text-zinc-300"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
              </Button>
              <Button
                data-testid="booking-step-2-next-btn"
                disabled={!selectedSlot}
                onClick={() => setStep(3)}
                className="bg-[#D4AF37] text-black font-bold hover:bg-[#E5C158] px-8"
              >
                Proceed to Checkout <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: CONTACT & STRIPE DEPOSIT */}
        {step === 3 && (
          <form onSubmit={handleCreateBooking} className="space-y-6 text-left animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Form inputs */}
              <div className="md:col-span-7 space-y-4">
                <h4 className="font-serif font-bold text-base text-zinc-100">Guest Client Information</h4>
                
                <div>
                  <Label className="text-xs text-zinc-300">Full Name *</Label>
                  <Input
                    required
                    data-testid="booking-input-name"
                    placeholder="e.g. Liam Vance"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="bg-zinc-900 border-zinc-700 text-white mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-zinc-300">Email Address (for receipt & prep) *</Label>
                    <Input
                      type="email"
                      required
                      data-testid="booking-input-email"
                      placeholder="liam@example.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="bg-zinc-900 border-zinc-700 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-300">Mobile Phone (SMS Reminders) *</Label>
                    <Input
                      required
                      data-testid="booking-input-phone"
                      placeholder="+1 (555) 000-0000"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="bg-zinc-900 border-zinc-700 text-white mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-zinc-300">Special Notes or Style Requests</Label>
                  <Input
                    data-testid="booking-input-notes"
                    placeholder="e.g. Low drop fade, skin sensitive, or specific placement notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-zinc-900 border-zinc-700 text-white mt-1"
                  />
                </div>
              </div>

              {/* Deposit Order Summary */}
              <div className="md:col-span-5 p-5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-4">
                <h4 className="font-serif font-bold text-sm text-zinc-100 uppercase tracking-wider border-b border-zinc-800 pb-2">
                  Booking Summary
                </h4>

                <div className="space-y-2 text-xs text-zinc-300">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Service:</span>
                    <span className="font-medium text-white">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Master:</span>
                    <span className="font-medium text-white">{selectedArtist?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Date & Slot:</span>
                    <span className="font-medium text-[#D4AF37]">{selectedDate} @ {selectedSlot}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-zinc-800">
                    <span className="text-zinc-400">Full Service Price:</span>
                    <span className="font-mono text-zinc-200">${selectedService?.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1 text-sm font-bold text-white bg-[#D4AF37]/10 p-2 rounded border border-[#D4AF37]/30">
                    <span className="text-[#D4AF37]">Upfront Deposit Required:</span>
                    <span className="font-mono text-[#D4AF37]">${selectedService?.deposit_required.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-zinc-400">
                    <span>Remaining Due at Chair:</span>
                    <span className="font-mono">${(selectedService?.price - selectedService?.deposit_required).toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400 flex items-start gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                  <span>Stripe encrypted checkout. Deposits are applied directly to your final total.</span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-between border-t border-zinc-800">
              <Button
                type="button"
                variant="outline"
                data-testid="booking-step-3-back-btn"
                onClick={() => setStep(2)}
                className="border-zinc-700 bg-zinc-900 text-zinc-300"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
              </Button>
              <Button
                type="submit"
                data-testid="booking-submit-stripe-btn"
                disabled={submitting}
                className="bg-[#D4AF37] text-black font-bold hover:bg-[#E5C158] px-8 shadow-[0_0_20px_rgba(212,175,55,0.3)] flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                {submitting ? "Initiating Stripe..." : `Pay $${selectedService?.deposit_required} Deposit & Confirm`}
              </Button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
