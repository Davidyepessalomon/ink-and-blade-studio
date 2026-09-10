import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Sparkles, Image as ImageIcon, CheckCircle2, Clock, 
  Send, Search, AlertCircle, ArrowRight, Shield, Flame 
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

export default function CustomTattooPipeline({ onBookApprovedInquiry }) {
  const [artists, setArtists] = useState([]);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [selectedArtistId, setSelectedArtistId] = useState("all");
  const [style, setStyle] = useState("Dark Realism");
  const [placement, setPlacement] = useState("Forearm");
  const [sizeDimensions, setSizeDimensions] = useState("6 x 4 inches");
  const [budgetRange, setBudgetRange] = useState("$400 - $700");
  const [description, setDescription] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [referenceList, setReferenceList] = useState([]);
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("02:00 PM");
  const [submitting, setSubmitting] = useState(false);
  const [submittedInquiry, setSubmittedInquiry] = useState(null);

  // Inquiry Lookup Tracker State
  const [lookupRef, setLookupRef] = useState("");
  const [trackedInquiry, setTrackedInquiry] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const res = await axios.get(`${API}/artists`);
        setArtists(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchArtists();
  }, []);

  const handleAddReference = (url) => {
    const target = url || referenceUrl;
    if (!target) return;
    setReferenceList([...referenceList, target]);
    setReferenceUrl("");
  };

  const handleSubmitInquiry = async (e) => {
    e.preventDefault();
    if (!clientName || !clientEmail || !clientPhone || !description) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        artist_id: selectedArtistId,
        style,
        placement,
        size_dimensions: sizeDimensions,
        budget_range: budgetRange,
        description,
        reference_images: referenceList.length > 0 ? referenceList : [
          "https://images.unsplash.com/photo-1616879564267-a336232e3a95?q=85&w=800&auto=format&fit=crop"
        ],
        preferred_date: preferredDate,
        preferred_time: preferredTime,
      };

      const res = await axios.post(`${API}/inquiries`, payload);
      setSubmittedInquiry(res.data);
      toast.success(`Custom inquiry submitted! Tracking Ref: ${res.data.inquiry_ref}`);
    } catch (err) {
      toast.error("Failed to submit custom inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrackInquiry = async (e) => {
    e.preventDefault();
    if (!lookupRef) return;
    try {
      setTrackingLoading(true);
      const res = await axios.get(`${API}/inquiries/${lookupRef.trim().toUpperCase()}`);
      setTrackedInquiry(res.data);
      toast.success("Inquiry record found!");
    } catch (err) {
      toast.error("No inquiry found with this reference ID.");
      setTrackedInquiry(null);
    } finally {
      setTrackingLoading(false);
    }
  };

  return (
    <section id="custom-inquiry" className="py-20 bg-[#0B0B0C] border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-left space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#D4AF37] font-mono">
            <Sparkles className="w-3.5 h-3.5" /> Bespoke Custom Projects
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-black text-white">
            CUSTOM TATTOO CONSULTATION PIPELINE
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
            Have an intricate sleeve, backpiece, or custom concept? Submit your vision, placement, and reference imagery directly to our resident artists for quote estimation and calendar slot reservation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Submission Form or Success View */}
          <div className="lg:col-span-8 bg-[#141416] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl text-left">
            
            {submittedInquiry ? (
              <div className="space-y-6 text-center py-8 animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-serif font-bold text-white">Inquiry Dispatched to Studio</h3>
                  <p className="text-zinc-400 text-sm max-w-md mx-auto">
                    Your request has been received by <span className="text-zinc-200 font-semibold">{submittedInquiry.artist_name}</span>. You will receive an email quote within 24 hours.
                  </p>
                </div>

                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl max-w-sm mx-auto text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Tracking Reference:</span>
                    <span className="font-mono font-bold text-[#D4AF37]">{submittedInquiry.inquiry_ref}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Style & Placement:</span>
                    <span className="text-zinc-200">{submittedInquiry.style} ({submittedInquiry.placement})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Current Status:</span>
                    <span className="text-amber-400 font-semibold uppercase">{submittedInquiry.status}</span>
                  </div>
                </div>

                <Button
                  data-testid="inquiry-submit-another-btn"
                  onClick={() => {
                    setSubmittedInquiry(null);
                    setDescription("");
                    setReferenceList([]);
                  }}
                  variant="outline"
                  className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white"
                >
                  Submit Another Project
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmitInquiry} className="space-y-6">
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-zinc-300">Your Full Name *</Label>
                    <Input
                      required
                      data-testid="inquiry-input-name"
                      placeholder="e.g. Jordan Smith"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="bg-zinc-900 border-zinc-700 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-300">Email Address *</Label>
                    <Input
                      type="email"
                      required
                      data-testid="inquiry-input-email"
                      placeholder="jordan@example.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="bg-zinc-900 border-zinc-700 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-300">Phone Number *</Label>
                    <Input
                      required
                      data-testid="inquiry-input-phone"
                      placeholder="+1 (555) 345-6789"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="bg-zinc-900 border-zinc-700 text-white mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-zinc-300">Preferred Artist</Label>
                    <select
                      data-testid="inquiry-select-artist"
                      value={selectedArtistId}
                      onChange={(e) => setSelectedArtistId(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-md p-2 text-sm mt-1"
                    >
                      <option value="all">Any Available Resident Master</option>
                      {Array.isArray(artists) && artists.map((a) => (
                        <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs text-zinc-300">Tattoo Aesthetic / Style</Label>
                    <select
                      data-testid="inquiry-select-style"
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-md p-2 text-sm mt-1"
                    >
                      <option value="Dark Realism">Dark Realism / Surrealism</option>
                      <option value="Neo-Japanese">Neo-Japanese & Irezumi</option>
                      <option value="Blackwork / Geometry">Blackwork & Sacred Geometry</option>
                      <option value="American Traditional">American Traditional / Bold Line</option>
                      <option value="Fine Line & Micro">Fine Line & Micro Details</option>
                      <option value="Cover-up Project">Cover-up Project</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-zinc-300">Body Placement</Label>
                    <Input
                      data-testid="inquiry-input-placement"
                      placeholder="e.g. Left Inner Forearm, Ribs, Thigh"
                      value={placement}
                      onChange={(e) => setPlacement(e.target.value)}
                      className="bg-zinc-900 border-zinc-700 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-300">Approx. Dimensions</Label>
                    <Input
                      data-testid="inquiry-input-size"
                      placeholder="e.g. 6 x 4 inches"
                      value={sizeDimensions}
                      onChange={(e) => setSizeDimensions(e.target.value)}
                      className="bg-zinc-900 border-zinc-700 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-300">Target Budget Range</Label>
                    <select
                      data-testid="inquiry-select-budget"
                      value={budgetRange}
                      onChange={(e) => setBudgetRange(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-md p-2 text-sm mt-1"
                    >
                      <option value="$300 - $500">$300 - $500 (Single Session)</option>
                      <option value="$500 - $900">$500 - $900 (Half-Day Project)</option>
                      <option value="$1,000 - $2,000">$1,000 - $2,000 (Full Sleeve / Multi-session)</option>
                      <option value="$2,000+">$2,000+ (Backpiece / Master Project)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-zinc-300">Concept Details & Vision *</Label>
                  <Textarea
                    required
                    data-testid="inquiry-input-description"
                    rows={4}
                    placeholder="Describe your design elements, symbolic motifs, color preferences (black/grey vs color), and whether you have existing surrounding tattoos..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-zinc-900 border-zinc-700 text-white mt-1"
                  />
                </div>

                {/* Reference Images Inputs */}
                <div className="space-y-3">
                  <Label className="text-xs text-zinc-300 flex items-center justify-between">
                    <span>Reference Image URLs (Moodboard / Inspirations)</span>
                    <span className="text-[11px] text-zinc-500">Add web links or pick studio samples below</span>
                  </Label>

                  <div className="flex gap-2">
                    <Input
                      data-testid="inquiry-input-ref-url"
                      placeholder="Paste image link (e.g. https://...)"
                      value={referenceUrl}
                      onChange={(e) => setReferenceUrl(e.target.value)}
                      className="bg-zinc-900 border-zinc-700 text-white"
                    />
                    <Button
                      type="button"
                      data-testid="inquiry-add-ref-btn"
                      onClick={() => handleAddReference()}
                      className="bg-zinc-800 text-zinc-200 hover:bg-zinc-700 flex-shrink-0 text-xs"
                    >
                      Add Image
                    </Button>
                  </div>

                  {/* Sample Quick Inspirations */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="text-[10px] text-zinc-500 self-center">Quick Presets:</span>
                    <button
                      type="button"
                      onClick={() => handleAddReference("https://images.unsplash.com/photo-1616879564267-a336232e3a95?q=85&w=800&auto=format&fit=crop")}
                      className="text-[11px] px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-[#D4AF37]"
                    >
                      + Samurai Sleeve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddReference("https://images.unsplash.com/photo-1716948943021-cea8dc2d2c3f?q=85&w=800&auto=format&fit=crop")}
                      className="text-[11px] px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-[#D4AF37]"
                    >
                      + Mandala Spine
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddReference("https://images.unsplash.com/photo-1651650564239-7e96053d934c?q=85&w=800&auto=format&fit=crop")}
                      className="text-[11px] px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-[#D4AF37]"
                    >
                      + Realistic Lion
                    </button>
                  </div>

                  {/* Selected References Thumbnails */}
                  {referenceList.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
                      {referenceList.map((url, idx) => (
                        <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-zinc-700 bg-black">
                          <img src={url} alt="Reference" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setReferenceList(referenceList.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 bg-red-600/80 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-zinc-800 flex justify-end">
                  <Button
                    type="submit"
                    data-testid="inquiry-submit-btn"
                    disabled={submitting}
                    className="bg-[#D4AF37] text-black font-bold hover:bg-[#E5C158] px-8 shadow-[0_0_20px_rgba(212,175,55,0.25)] flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? "Transmitting..." : "Submit Project for Artist Quote"}
                  </Button>
                </div>
              </form>
            )}

          </div>

          {/* Right: Live Inquiry Status Tracker */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-6 text-left shadow-xl space-y-4">
              <div className="space-y-1">
                <h4 className="font-serif font-bold text-base text-zinc-100 flex items-center gap-2">
                  <Search className="w-4 h-4 text-[#D4AF37]" /> Track Existing Inquiry
                </h4>
                <p className="text-xs text-zinc-400">
                  Enter your tracking code (e.g. <span className="text-[#D4AF37] font-mono">INQ-7102</span>) to check artist quote status and lock your calendar slot.
                </p>
              </div>

              <form onSubmit={handleTrackInquiry} className="space-y-3">
                <Input
                  data-testid="inquiry-tracker-input"
                  placeholder="INQ-XXXX"
                  value={lookupRef}
                  onChange={(e) => setLookupRef(e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-white uppercase font-mono"
                />
                <Button
                  type="submit"
                  data-testid="inquiry-tracker-btn"
                  disabled={trackingLoading || !lookupRef}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs py-2"
                >
                  {trackingLoading ? "Searching..." : "Lookup Status"}
                </Button>
              </form>

              {/* Tracked Details */}
              {trackedInquiry && (
                <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3 text-xs animate-in fade-in duration-200">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                    <span className="font-mono font-bold text-[#D4AF37]">{trackedInquiry.inquiry_ref}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      trackedInquiry.status === "quoted" || trackedInquiry.status === "approved"
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-950 text-amber-400 border border-amber-500/30"
                    }`}>
                      {trackedInquiry.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-zinc-300">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Artist:</span>
                      <span className="font-medium text-white">{trackedInquiry.artist_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Style:</span>
                      <span className="text-zinc-200">{trackedInquiry.style}</span>
                    </div>
                    {trackedInquiry.quoted_price > 0 && (
                      <div className="flex justify-between text-sm font-bold pt-1 border-t border-zinc-800">
                        <span className="text-zinc-400">Artist Quote:</span>
                        <span className="text-[#D4AF37] font-mono">${trackedInquiry.quoted_price}</span>
                      </div>
                    )}
                    {trackedInquiry.deposit_amount > 0 && (
                      <div className="flex justify-between text-xs text-amber-300 font-semibold">
                        <span>Required Deposit:</span>
                        <span className="font-mono">${trackedInquiry.deposit_amount}</span>
                      </div>
                    )}
                  </div>

                  {trackedInquiry.admin_notes && (
                    <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 italic">
                      "{trackedInquiry.admin_notes}"
                    </div>
                  )}

                  {trackedInquiry.status === "quoted" && (
                    <Button
                      data-testid="inquiry-accept-quote-btn"
                      onClick={() => onBookApprovedInquiry(trackedInquiry)}
                      className="w-full bg-[#D4AF37] text-black font-bold hover:bg-[#E5C158] text-xs mt-2"
                    >
                      Accept Quote & Lock Slot ($100 Deposit)
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Quality Standard Card */}
            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-3 text-left">
              <div className="flex items-center gap-2 text-zinc-200 font-bold text-sm">
                <Shield className="w-4 h-4 text-[#D4AF37]" /> Studio Policy Standards
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                All custom tattoo sessions include a dedicated 1-on-1 preliminary digital sketch review, high-res stencil sizing at the studio, and comprehensive medical aftercare kits.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
