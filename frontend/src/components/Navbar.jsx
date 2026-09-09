import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Menu, X, Scissors, Sparkles, Calendar, ShieldCheck, 
  UserCheck, LogOut, ChevronRight, PhoneCall, Compass 
} from "lucide-react";
import { Button } from "./ui/button";

export default function Navbar({ onOpenAuth, onOpenBooking, onOpenCustomInquiry }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isAdminOrArtist } = useAuth();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-[#0B0B0C]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link 
          to="/" 
          data-testid="navbar-brand-logo"
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#D4AF37] via-[#AA820A] to-[#604804] p-[1px] flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.25)]">
            <div className="w-full h-full bg-[#0B0B0C] rounded-lg flex items-center justify-center group-hover:bg-[#141416] transition-colors">
              <Scissors className="w-5 h-5 text-[#D4AF37] transform -rotate-45" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-black tracking-widest text-lg sm:text-xl text-zinc-100 uppercase group-hover:text-[#D4AF37] transition-colors">
              Ink <span className="text-[#D4AF37]">&</span> Blade
            </span>
            <span className="text-[10px] uppercase tracking-[0.25em] text-zinc-400 -mt-1 font-mono">
              Studio & Barbering
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <a
            href="#portfolio"
            data-testid="nav-link-portfolio"
            className="text-zinc-300 hover:text-[#D4AF37] transition-colors"
          >
            Portfolio
          </a>
          <a
            href="#flash"
            data-testid="nav-link-flash"
            className="text-zinc-300 hover:text-[#D4AF37] transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> Flash Designs
          </a>
          <a
            href="#artists"
            data-testid="nav-link-artists"
            className="text-zinc-300 hover:text-[#D4AF37] transition-colors"
          >
            Artists
          </a>
          <a
            href="#custom-inquiry"
            data-testid="nav-link-custom-inquiry"
            className="text-zinc-300 hover:text-[#D4AF37] transition-colors"
          >
            Custom Inquiries
          </a>
          <Link
            to="/admin"
            data-testid="nav-link-admin-portal"
            className="text-zinc-400 hover:text-zinc-100 transition-colors flex items-center gap-1 text-xs border border-zinc-800 px-2.5 py-1 rounded bg-zinc-900/50"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" /> Staff Portal
          </Link>
        </nav>

        {/* Action Buttons & Auth */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-300 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                {user.name} ({user.role})
              </span>
              <Button
                variant="ghost"
                size="sm"
                data-testid="nav-logout-btn"
                onClick={logout}
                className="text-zinc-400 hover:text-red-400 hover:bg-red-950/20"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              data-testid="nav-login-btn"
              onClick={onOpenAuth}
              className="border-zinc-700 bg-zinc-900/80 text-zinc-200 hover:bg-zinc-800 hover:text-white"
            >
              Sign In
            </Button>
          )}

          <Button
            data-testid="nav-book-appointment-btn"
            onClick={onOpenBooking}
            className="bg-[#D4AF37] text-black font-semibold hover:bg-[#E5C158] shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all"
          >
            <Calendar className="w-4 h-4 mr-1.5" /> Book Now
          </Button>
        </div>

        {/* Mobile Menu Trigger */}
        <button
          data-testid="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-zinc-300 hover:text-white rounded-lg bg-zinc-900 border border-zinc-800"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-800 bg-[#0E0E10] px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-4 duration-200">
          <div className="grid grid-cols-1 gap-2 pt-2">
            <a
              href="#portfolio"
              data-testid="mobile-nav-portfolio"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg text-zinc-200 hover:bg-zinc-800/80 font-medium"
            >
              Portfolio & Gallery
            </a>
            <a
              href="#flash"
              data-testid="mobile-nav-flash"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg text-zinc-200 hover:bg-zinc-800/80 font-medium flex items-center justify-between"
            >
              <span>Flash Designs Sheet</span>
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            </a>
            <a
              href="#artists"
              data-testid="mobile-nav-artists"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg text-zinc-200 hover:bg-zinc-800/80 font-medium"
            >
              Resident Artists
            </a>
            <a
              href="#custom-inquiry"
              data-testid="mobile-nav-custom-inquiry"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg text-zinc-200 hover:bg-zinc-800/80 font-medium"
            >
              Submit Custom Tattoo Inquiry
            </a>
            <Link
              to="/admin"
              data-testid="mobile-nav-admin"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg text-[#D4AF37] hover:bg-zinc-800/80 font-medium flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" /> Staff & Admin Portal
            </Link>
          </div>

          <div className="pt-3 border-t border-zinc-800/80 flex flex-col gap-2.5">
            <Button
              data-testid="mobile-nav-book-btn"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
              className="w-full bg-[#D4AF37] text-black font-semibold hover:bg-[#E5C158]"
            >
              <Calendar className="w-4 h-4 mr-2" /> Book Barber / Tattoo Slot
            </Button>
            {!user ? (
              <Button
                variant="outline"
                data-testid="mobile-nav-login-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="w-full border-zinc-700 bg-zinc-900 text-zinc-200"
              >
                Sign In
              </Button>
            ) : (
              <Button
                variant="ghost"
                data-testid="mobile-nav-logout-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full text-red-400 bg-red-950/20"
              >
                <LogOut className="w-4 h-4 mr-2" /> Sign Out ({user.name})
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
