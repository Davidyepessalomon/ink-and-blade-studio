import React, { useState, useRef } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import PortfolioShowcase from "./components/PortfolioShowcase";
import BookingEngine from "./components/BookingEngine";
import CustomTattooPipeline from "./components/CustomTattooPipeline";
import ArtistsSection from "./components/ArtistsSection";
import AdminDashboard from "./components/AdminDashboard";
import PaymentSuccess from "./components/PaymentSuccess";
import InvoiceReceipt from "./components/InvoiceReceipt";
import AuthModal from "./components/AuthModal";
import { Toaster } from "./components/ui/sonner";
import { Dialog, DialogContent } from "./components/ui/dialog";
import { Scissors, ShieldCheck, MapPin, Phone, Mail, Clock, Instagram } from "lucide-react";
import { Button } from "./components/ui/button";

function MainStudioLanding() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [preselectedService, setPreselectedService] = useState(null);
  const [preselectedArtist, setPreselectedArtist] = useState(null);
  const [flashItemId, setFlashItemId] = useState(null);

  const bookingSectionRef = useRef(null);
  const customSectionRef = useRef(null);

  const handleOpenBooking = (serviceId = null, artistId = null, flashId = null) => {
    setPreselectedService(serviceId);
    setPreselectedArtist(artistId);
    setFlashItemId(flashId);
    setShowBookingModal(true);
  };

  const handleBookPortfolioItem = (item) => {
    if (item.type === "barber") {
      handleOpenBooking("srv-barber-fade", item.artist_id);
    } else if (item.is_flash) {
      handleOpenBooking("srv-tattoo-flash", item.artist_id, item.id);
    } else {
      handleOpenBooking("srv-tattoo-custom", item.artist_id);
    }
  };

  const handleSelectArtist = (artist) => {
    handleOpenBooking(null, artist.id);
  };

  const handleApprovedInquiryBooking = (inquiry) => {
    handleOpenBooking("srv-tattoo-custom", inquiry.artist_id);
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-zinc-100 flex flex-col font-sans selection:bg-[#D4AF37] selection:text-black">
      <Navbar
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenBooking={() => handleOpenBooking()}
        onOpenCustomInquiry={() => {
          const el = document.getElementById("custom-inquiry");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }}
      />

      <main className="flex-1">
        <Hero
          onBookBarber={() => handleOpenBooking("srv-barber-fade")}
          onCustomTattoo={() => {
            const el = document.getElementById("custom-inquiry");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          onBrowseFlash={() => {
            const el = document.getElementById("portfolio");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        />

        <PortfolioShowcase onBookItem={handleBookPortfolioItem} />

        <ArtistsSection onSelectArtistForBooking={handleSelectArtist} />

        <CustomTattooPipeline onBookApprovedInquiry={handleApprovedInquiryBooking} />
      </main>

      {/* Studio Location & Footer Section */}
      <footer className="bg-[#080809] border-t border-zinc-800/80 py-16 px-4 sm:px-6 lg:px-8 text-left">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Scissors className="w-5 h-5 text-[#D4AF37] transform -rotate-45" />
              <span className="font-serif font-black text-lg text-white uppercase tracking-wider">
                Ink <span className="text-[#D4AF37]">&</span> Blade
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              District 9 Flagship Studio. Master tattoo art, custom sleeve compositions, and executive straight-razor barbering.
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <h4 className="font-serif font-bold text-sm text-white uppercase tracking-wider">Studio Location</h4>
            <div className="flex items-start gap-2 text-zinc-400">
              <MapPin className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
              <span>RUA Julio de Souza Portela 32, Curitiba, Pr</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400 pt-1">
              <Phone className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
              <span>+55 (41 ) 98704-1595</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <h4 className="font-serif font-bold text-sm text-white uppercase tracking-wider">Operating Hours</h4>
            <div className="flex items-start gap-2 text-zinc-400">
              <Clock className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
              <div>
                <p>Tuesday - Saturday: 10:00 AM – 08:00 PM</p>
                <p>Sunday: 11:00 AM – 06:00 PM</p>
                <p className="text-zinc-500">Monday: Closed for Studio Sterilization</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <h4 className="font-serif font-bold text-sm text-white uppercase tracking-wider">Studio Assurance</h4>
            <div className="flex items-start gap-2 text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
              <span>Board of Health Certified. Autoclave spore tested monthly. 100% single-use cartridges.</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-zinc-900 flex flex-col sm:flex-row justify-between items-center text-xs text-zinc-500 gap-4">
          <div>© {new Date().getFullYear()} Ink & Blade Studio LLC. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <span className="text-zinc-400">Stripe Verified Merchant</span>
            <span>•</span>
            <span className="text-zinc-400">NYC Lic #90218</span>
          </div>
        </div>
      </footer>

      {/* Booking Modal */}
      {showBookingModal && (
        <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
          <DialogContent className="max-w-4xl bg-[#141416] border-zinc-800 text-white p-0 overflow-hidden">
            <BookingEngine
              preselectedServiceId={preselectedService}
              preselectedArtistId={preselectedArtist}
              flashItemId={flashItemId}
              onClose={() => setShowBookingModal(false)}
              onBookingCreated={(booking) => {
                console.log("Created booking:", booking);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Staff / Client Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}

function AdminRouteWrapper() {
  const { user, isAdminOrArtist, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0C] flex items-center justify-center text-zinc-400 text-sm font-mono">
        Authenticating session...
      </div>
    );
  }

  if (!isAdminOrArtist) {
    return (
      <div className="min-h-screen bg-[#0B0B0C] flex flex-col items-center justify-center p-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-950/80 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-white">Staff Authentication Required</h2>
        <p className="text-zinc-400 text-xs max-w-sm">
          Please log in with your Master Artist or Admin account to access the calendar schedule and custom inquiry queue.
        </p>
        <Button
          data-testid="admin-page-signin-btn"
          onClick={() => setShowAuth(true)}
          className="bg-[#D4AF37] text-black font-bold hover:bg-[#E5C158] text-xs px-6"
        >
          Open Staff Sign In
        </Button>
        <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      </div>
    );
  }

  return <AdminDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" theme="dark" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainStudioLanding />} />
          <Route path="/admin" element={<AdminRouteWrapper />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<MainStudioLanding />} />
          <Route path="/receipt/:id" element={<InvoiceReceipt />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
