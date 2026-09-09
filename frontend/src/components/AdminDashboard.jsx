import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { 
  Calendar, Clock, DollarSign, CheckCircle2, User, FileText, 
  Send, Plus, Trash2, Scissors, ShieldAlert, Sparkles, Filter 
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

export default function AdminDashboard() {
  const { user, isAdminOrArtist } = useAuth();
  const [activeTab, setActiveTab] = useState("schedule");
  const [stats, setStats] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quote Dialog State
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [quotePrice, setQuotePrice] = useState(600);
  const [quoteDeposit, setQuoteDeposit] = useState(100);
  const [quoteHours, setQuoteHours] = useState(4);
  const [quoteNotes, setQuoteNotes] = useState("");

  // Aftercare Dialog State
  const [selectedBookingForAftercare, setSelectedBookingForAftercare] = useState(null);
  const [customAftercareText, setCustomAftercareText] = useState("");

  // Add Portfolio Piece Dialog
  const [showAddPortfolio, setShowAddPortfolio] = useState(false);
  const [newPortTitle, setNewPortTitle] = useState("");
  const [newPortType, setNewPortType] = useState("tattoo");
  const [newPortCategory, setNewPortCategory] = useState("Dark Realism");
  const [newPortImgUrl, setNewPortImgUrl] = useState("");
  const [newPortPrice, setNewPortPrice] = useState("$600");
  const [newPortDesc, setNewPortDesc] = useState("");
  const [isFlash, setIsFlash] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stRes, scRes, inqRes, portRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { withCredentials: true }),
        axios.get(`${API}/admin/schedule`, { withCredentials: true }),
        axios.get(`${API}/inquiries`, { withCredentials: true }),
        axios.get(`${API}/portfolio`, { withCredentials: true }),
      ]);
      setStats(stRes.data);
      setSchedule(scRes.data);
      setInquiries(inqRes.data);
      setPortfolio(portRes.data);
    } catch (e) {
      console.error(e);
      toast.error("Please login as Admin or Artist to view dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSendQuote = async () => {
    if (!selectedInquiry) return;
    try {
      await axios.post(
        `${API}/inquiries/${selectedInquiry.id}/quote`,
        {
          quoted_price: parseFloat(quotePrice),
          deposit_amount: parseFloat(quoteDeposit),
          estimated_hours: parseFloat(quoteHours),
          admin_notes: quoteNotes,
          status: "quoted",
        },
        { withCredentials: true }
      );
      toast.success("Quote dispatched to client!");
      setSelectedInquiry(null);
      fetchData();
    } catch (e) {
      toast.error("Failed to submit quote.");
    }
  };

  const handleSendAftercare = async () => {
    if (!selectedBookingForAftercare) return;
    try {
      await axios.post(
        `${API}/admin/send-aftercare`,
        {
          booking_id: selectedBookingForAftercare.id,
          custom_notes: customAftercareText,
        },
        { withCredentials: true }
      );
      toast.success(`Aftercare protocol dispatched to ${selectedBookingForAftercare.client_email}`);
      setSelectedBookingForAftercare(null);
      fetchData();
    } catch (e) {
      toast.error("Failed to send aftercare.");
    }
  };

  const handleCreatePortfolio = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API}/portfolio`,
        {
          title: newPortTitle,
          type: newPortType,
          artist_id: "art-marcus",
          artist_name: user?.name || "Marcus Kane",
          category: newPortCategory,
          image_url: newPortImgUrl || "https://images.unsplash.com/photo-1616879564267-a336232e3a95?q=85&w=800&auto=format&fit=crop",
          description: newPortDesc,
          price_estimate: newPortPrice,
          is_flash: isFlash,
          flash_status: "available",
          tags: [newPortCategory, newPortType],
        },
        { withCredentials: true }
      );
      toast.success("New portfolio piece published!");
      setShowAddPortfolio(false);
      fetchData();
    } catch (e) {
      toast.error("Failed to add portfolio piece.");
    }
  };

  const handleDeletePortfolio = async (id) => {
    try {
      await axios.delete(`${API}/portfolio/${id}`, { withCredentials: true });
      toast.success("Portfolio item deleted.");
      fetchData();
    } catch (e) {
      toast.error("Failed to delete item.");
    }
  };

  const handleConfirmDepositDirectly = async (bookingId) => {
    try {
      await axios.post(`${API}/bookings/${bookingId}/confirm-deposit`);
      toast.success("Deposit status updated to PAID & Confirmed!");
      fetchData();
    } catch (e) {
      toast.error("Failed to update status.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-zinc-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800 text-left">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#D4AF37] font-mono">
              <ShieldAlert className="w-3.5 h-3.5" /> Studio Administration
            </div>
            <h1 className="text-3xl font-serif font-black text-white">
              COMMAND & SCHEDULE CENTER
            </h1>
            <p className="text-xs text-zinc-400">
              Active Session: <span className="text-[#D4AF37] font-semibold">{user?.name} ({user?.role})</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              data-testid="admin-refresh-data-btn"
              onClick={fetchData}
              variant="outline"
              size="sm"
              className="border-zinc-700 bg-zinc-900 text-zinc-300 text-xs"
            >
              Refresh Data
            </Button>
            <Button
              data-testid="admin-add-portfolio-trigger"
              onClick={() => setShowAddPortfolio(true)}
              className="bg-[#D4AF37] text-black font-bold hover:bg-[#E5C158] text-xs"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Portfolio / Flash
            </Button>
          </div>
        </div>

        {/* Metric Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-[#141416] border border-zinc-800 text-left space-y-1">
              <span className="text-xs text-zinc-400">Total Bookings</span>
              <div className="text-2xl font-bold font-mono text-white" data-testid="stat-total-bookings">
                {stats.total_bookings}
              </div>
              <span className="text-[11px] text-emerald-400 font-medium">{stats.confirmed_bookings} Confirmed Slots</span>
            </div>

            <div className="p-5 rounded-xl bg-[#141416] border border-zinc-800 text-left space-y-1">
              <span className="text-xs text-zinc-400">Pending Inquiries</span>
              <div className="text-2xl font-bold font-mono text-amber-400" data-testid="stat-pending-inquiries">
                {stats.pending_inquiries}
              </div>
              <span className="text-[11px] text-zinc-500">Awaiting artist review</span>
            </div>

            <div className="p-5 rounded-xl bg-[#141416] border border-zinc-800 text-left space-y-1">
              <span className="text-xs text-zinc-400">Stripe Deposits Collected</span>
              <div className="text-2xl font-bold font-mono text-[#D4AF37]" data-testid="stat-deposits-collected">
                ${stats.total_deposits_collected?.toFixed(2)}
              </div>
              <span className="text-[11px] text-zinc-500">Upfront guarantees</span>
            </div>

            <div className="p-5 rounded-xl bg-[#141416] border border-zinc-800 text-left space-y-1">
              <span className="text-xs text-zinc-400">Projected Chair Revenue</span>
              <div className="text-2xl font-bold font-mono text-emerald-400" data-testid="stat-projected-revenue">
                ${stats.projected_revenue?.toFixed(2)}
              </div>
              <span className="text-[11px] text-zinc-500">Total service pipeline</span>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 gap-2">
          {[
            { id: "schedule", label: "Studio Schedule & Bookings" },
            { id: "inquiries", label: `Custom Inquiries Queue (${inquiries.length})` },
            { id: "portfolio", label: "Portfolio & Flash Manager" },
          ].map((tab) => (
            <button
              key={tab.id}
              data-testid={`admin-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-[#D4AF37] text-[#D4AF37]"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: SCHEDULE */}
        {activeTab === "schedule" && (
          <div className="bg-[#141416] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl text-left">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="font-serif font-bold text-base text-zinc-100">Live Studio Appointments</h3>
              <span className="text-xs text-zinc-400 font-mono">{schedule.length} Total Bookings</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900/80 text-zinc-400 uppercase font-mono tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="py-3.5 px-4">Ref & Date</th>
                    <th className="py-3.5 px-4">Client</th>
                    <th className="py-3.5 px-4">Service & Artist</th>
                    <th className="py-3.5 px-4">Deposit Status</th>
                    <th className="py-3.5 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
                  {schedule.map((b) => (
                    <tr key={b.id} data-testid={`schedule-row-${b.id}`} className="hover:bg-zinc-900/40">
                      <td className="py-4 px-4 font-mono">
                        <div className="font-bold text-[#D4AF37]">{b.booking_ref}</div>
                        <div className="text-zinc-400 text-[11px]">{b.date} @ {b.time_slot}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-white">{b.client_name}</div>
                        <div className="text-zinc-400 text-[11px]">{b.client_email} • {b.client_phone}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-zinc-100">{b.service_name}</div>
                        <div className="text-zinc-400 text-[11px]">{b.artist_name} • ${b.total_price} (${b.deposit_amount} dep)</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                          b.deposit_status === "paid"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-950 text-amber-400 border border-amber-500/30"
                        }`}>
                          {b.deposit_status}
                        </span>
                      </td>
                      <td className="py-4 px-4 space-x-2">
                        {b.deposit_status !== "paid" && (
                          <Button
                            size="sm"
                            data-testid={`confirm-deposit-btn-${b.id}`}
                            onClick={() => handleConfirmDepositDirectly(b.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] h-7 px-2"
                          >
                            Mark Paid
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          data-testid={`aftercare-btn-${b.id}`}
                          onClick={() => setSelectedBookingForAftercare(b)}
                          className="border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-[10px] h-7 px-2"
                        >
                          <Send className="w-3 h-3 mr-1 text-[#D4AF37]" /> Aftercare
                        </Button>
                        <a
                          href={`/receipt/${b.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-[10px] text-zinc-400 hover:text-[#D4AF37] px-2"
                        >
                          <FileText className="w-3 h-3 mr-1" /> Receipt
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: INQUIRIES */}
        {activeTab === "inquiries" && (
          <div className="bg-[#141416] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl text-left">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="font-serif font-bold text-base text-zinc-100">Custom Tattoo Project Inquiries</h3>
              <span className="text-xs text-zinc-400">{inquiries.length} Requests in Pipeline</span>
            </div>

            <div className="divide-y divide-zinc-800">
              {inquiries.map((inq) => (
                <div key={inq.id} data-testid={`inquiry-row-${inq.id}`} className="p-6 hover:bg-zinc-900/30 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                      <span className="text-xs font-mono font-bold text-[#D4AF37] mr-2">{inq.inquiry_ref}</span>
                      <span className="font-serif font-bold text-base text-white">{inq.client_name}</span>
                      <span className="text-xs text-zinc-400 ml-2">({inq.client_email} • {inq.client_phone})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                        inq.status === "quoted" ? "bg-emerald-950 text-emerald-400" : "bg-amber-950 text-amber-400"
                      }`}>
                        {inq.status}
                      </span>
                      <Button
                        size="sm"
                        data-testid={`quote-inquiry-btn-${inq.id}`}
                        onClick={() => {
                          setSelectedInquiry(inq);
                          setQuotePrice(inq.quoted_price || 600);
                          setQuoteDeposit(inq.deposit_amount || 100);
                          setQuoteNotes(inq.admin_notes || "");
                        }}
                        className="bg-[#D4AF37] text-black font-bold hover:bg-[#E5C158] text-xs h-8"
                      >
                        Set Quote & Notes
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs bg-zinc-900/70 p-3.5 rounded-xl border border-zinc-800">
                    <div><span className="text-zinc-500">Style:</span> <span className="text-zinc-200 font-medium">{inq.style}</span></div>
                    <div><span className="text-zinc-500">Placement:</span> <span className="text-zinc-200 font-medium">{inq.placement}</span></div>
                    <div><span className="text-zinc-500">Dimensions:</span> <span className="text-zinc-200 font-medium">{inq.size_dimensions}</span></div>
                    <div><span className="text-zinc-500">Budget:</span> <span className="text-[#D4AF37] font-mono font-bold">{inq.budget_range}</span></div>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed italic">
                    "{inq.description}"
                  </p>

                  {inq.reference_images?.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto py-1">
                      {inq.reference_images.map((img, i) => (
                        <a key={i} href={img} target="_blank" rel="noreferrer" className="w-20 h-20 rounded-lg overflow-hidden border border-zinc-700 bg-black flex-shrink-0">
                          <img src={img} alt="Reference" className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PORTFOLIO */}
        {activeTab === "portfolio" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {portfolio.map((p) => (
                <div key={p.id} data-testid={`portfolio-admin-card-${p.id}`} className="bg-[#141416] border border-zinc-800 rounded-xl overflow-hidden p-3 space-y-2 text-left">
                  <div className="aspect-[4/3] rounded-lg overflow-hidden bg-black">
                    <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white truncate">{p.title}</span>
                    <span className="text-[#D4AF37] font-mono">{p.price_estimate}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
                    <span className="text-[10px] text-zinc-400 uppercase">{p.type}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      data-testid={`delete-portfolio-btn-${p.id}`}
                      onClick={() => handleDeletePortfolio(p.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-950/30 p-1 h-auto text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Quote Dialog */}
      {selectedInquiry && (
        <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
          <DialogContent className="bg-[#141416] border-zinc-800 text-white max-w-lg text-left">
            <DialogHeader>
              <DialogTitle className="font-serif font-bold text-xl text-white">
                Submit Quote for {selectedInquiry.inquiry_ref}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-zinc-300">Total Quoted Price ($)</Label>
                  <Input
                    type="number"
                    data-testid="quote-price-input"
                    value={quotePrice}
                    onChange={(e) => setQuotePrice(e.target.value)}
                    className="bg-zinc-900 border-zinc-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-zinc-300">Required Deposit ($)</Label>
                  <Input
                    type="number"
                    data-testid="quote-deposit-input"
                    value={quoteDeposit}
                    onChange={(e) => setQuoteDeposit(e.target.value)}
                    className="bg-zinc-900 border-zinc-700 text-white mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-zinc-300">Estimated Duration (Hours)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={quoteHours}
                  onChange={(e) => setQuoteHours(e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-white mt-1"
                />
              </div>

              <div>
                <Label className="text-xs text-zinc-300">Artist Note to Client</Label>
                <Textarea
                  data-testid="quote-notes-input"
                  rows={3}
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  placeholder="e.g. Design approved! 4.5 hours required across 1 session. Deposit required to reserve slot."
                  className="bg-zinc-900 border-zinc-700 text-white mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button variant="ghost" onClick={() => setSelectedInquiry(null)} className="text-xs">Cancel</Button>
                <Button data-testid="quote-submit-btn" onClick={handleSendQuote} className="bg-[#D4AF37] text-black font-bold text-xs">
                  Dispatch Quote Link
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Aftercare Modal */}
      {selectedBookingForAftercare && (
        <Dialog open={!!selectedBookingForAftercare} onOpenChange={() => setSelectedBookingForAftercare(null)}>
          <DialogContent className="bg-[#141416] border-zinc-800 text-white max-w-lg text-left">
            <DialogHeader>
              <DialogTitle className="font-serif font-bold text-lg text-white">
                Dispatch Aftercare Protocol ({selectedBookingForAftercare.client_name})
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <p className="text-xs text-zinc-400">
                Dispatches clinical aftercare instructions directly to <span className="text-[#D4AF37] font-mono">{selectedBookingForAftercare.client_email}</span>.
              </p>
              <Textarea
                rows={4}
                data-testid="aftercare-custom-notes"
                value={customAftercareText}
                onChange={(e) => setCustomAftercareText(e.target.value)}
                placeholder="Custom artist notes: e.g. Keep wrap on for 24h, apply sheer layer of Aquaphor twice daily."
                className="bg-zinc-900 border-zinc-700 text-white"
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setSelectedBookingForAftercare(null)} className="text-xs">Cancel</Button>
                <Button data-testid="aftercare-dispatch-btn" onClick={handleSendAftercare} className="bg-[#D4AF37] text-black font-bold text-xs">
                  Send Protocol Email
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Portfolio Modal */}
      {showAddPortfolio && (
        <Dialog open={showAddPortfolio} onOpenChange={setShowAddPortfolio}>
          <DialogContent className="bg-[#141416] border-zinc-800 text-white max-w-lg text-left">
            <DialogHeader>
              <DialogTitle className="font-serif font-bold text-lg text-white">Add New Portfolio Masterpiece</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreatePortfolio} className="space-y-4 pt-2">
              <div>
                <Label className="text-xs text-zinc-300">Title</Label>
                <Input required value={newPortTitle} onChange={(e) => setNewPortTitle(e.target.value)} placeholder="e.g. Dark Samurai Mask" className="bg-zinc-900 border-zinc-700 text-white mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-zinc-300">Type</Label>
                  <select value={newPortType} onChange={(e) => setNewPortType(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 text-white rounded p-2 text-xs mt-1">
                    <option value="tattoo">Tattoo</option>
                    <option value="barber">Barber Cut</option>
                    <option value="flash">Flash Sheet</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-zinc-300">Category</Label>
                  <Input value={newPortCategory} onChange={(e) => setNewPortCategory(e.target.value)} placeholder="e.g. Neo-Japanese" className="bg-zinc-900 border-zinc-700 text-white mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-zinc-300">High-Res Image URL</Label>
                <Input required value={newPortImgUrl} onChange={(e) => setNewPortImgUrl(e.target.value)} placeholder="https://images.unsplash.com/..." className="bg-zinc-900 border-zinc-700 text-white mt-1" />
              </div>
              <div>
                <Label className="text-xs text-zinc-300">Estimated Price</Label>
                <Input value={newPortPrice} onChange={(e) => setNewPortPrice(e.target.value)} placeholder="e.g. $750" className="bg-zinc-900 border-zinc-700 text-white mt-1" />
              </div>
              <div>
                <Label className="text-xs text-zinc-300">Description</Label>
                <Textarea rows={2} value={newPortDesc} onChange={(e) => setNewPortDesc(e.target.value)} placeholder="Piece notes..." className="bg-zinc-900 border-zinc-700 text-white mt-1" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="flash-check" checked={isFlash} onChange={(e) => setIsFlash(e.target.checked)} className="rounded" />
                <Label htmlFor="flash-check" className="text-xs text-zinc-300">Mark as Claimable Flash Sheet</Label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowAddPortfolio(false)} className="text-xs">Cancel</Button>
                <Button type="submit" className="bg-[#D4AF37] text-black font-bold text-xs">Publish Piece</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
