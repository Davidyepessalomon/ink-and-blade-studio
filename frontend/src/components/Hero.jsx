import React from "react";
import { 
  Calendar, Sparkles, Scissors, ShieldAlert, Award, Clock, ArrowRight, CheckCircle2 
} from "lucide-react";
import { Button } from "./ui/button";

export default function Hero({ onBookBarber, onCustomTattoo, onBrowseFlash }) {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:py-24 bg-[#0B0B0C]">
      {/* Subtle Background Glow and Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(212,175,55,0.15),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#141416_1px,transparent_1px),linear-gradient(to_bottom,#141416_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Content */}
          <div className="lg:col-span-7 space-y-7 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="text-xs uppercase tracking-widest font-semibold text-[#D4AF37]">
                Master Craftsmanship & Sterile Precision
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black font-serif tracking-tight text-zinc-100 leading-[1.1]">
              WHERE BESPOKE <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#AA820A]">INK MEETS</span> SHARP RAZOR.
            </h1>

            <p className="text-base sm:text-lg text-zinc-400 max-w-2xl leading-relaxed font-sans">
              High-end private tattoo studio and executive barber parlor. Instant appointment scheduling, upfront Stripe deposits, and direct custom design collaboration with resident masters.
            </p>

            {/* Dual CTA Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Button
                size="lg"
                data-testid="hero-book-barber-btn"
                onClick={onBookBarber}
                className="bg-[#D4AF37] text-black font-bold hover:bg-[#E5C158] h-13 px-7 text-base shadow-[0_0_30px_rgba(212,175,55,0.25)] flex items-center justify-center gap-2"
              >
                <Scissors className="w-5 h-5 -rotate-45" /> Book Barber Chair
              </Button>

              <Button
                size="lg"
                variant="outline"
                data-testid="hero-custom-tattoo-btn"
                onClick={onCustomTattoo}
                className="border-zinc-700 bg-zinc-900/90 text-zinc-100 hover:bg-zinc-800 hover:border-[#D4AF37]/50 h-13 px-7 text-base flex items-center justify-center gap-2"
              >
                Request Custom Tattoo <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-zinc-800/80">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-200 font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" /> Instant Slots
                </div>
                <p className="text-xs text-zinc-500">Real-time barber availability</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-200 font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" /> $25 - $100
                </div>
                <p className="text-xs text-zinc-500">Secure Stripe deposit locks</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-200 font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" /> Sterile Lab
                </div>
                <p className="text-xs text-zinc-500">Single-use autoclave certified</p>
              </div>
            </div>
          </div>

          {/* Right Visual Collage */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Main Visual Card */}
              <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-[#141416] shadow-2xl group">
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1616879564267-a336232e3a95?q=85&w=800&auto=format&fit=crop"
                    alt="Ink & Blade Studio Artistry"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0C] via-transparent to-transparent opacity-90" />
                
                {/* Floating Overlay Info */}
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-[#D4AF37] font-semibold">Featured Flash Masterpiece</span>
                    <span className="text-xs bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded font-mono">$220 Deposit Ready</span>
                  </div>
                  <h3 className="text-base font-serif font-bold text-white">Samurai Shadow Series</h3>
                  <p className="text-xs text-zinc-400">By Marcus Kane • 4 Sessions completed</p>
                </div>
              </div>

              {/* Secondary Floating Card */}
              <div className="absolute -bottom-6 -left-6 hidden sm:flex items-center gap-3 p-3.5 rounded-xl bg-[#141416]/95 border border-zinc-700 shadow-2xl backdrop-blur-xl">
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1787008543379-91aaa64b0003?q=85&w=400&auto=format&fit=crop"
                    alt="Barber Cut"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-100">Razor Fade & Beard Sculpt</div>
                  <div className="text-[11px] text-[#D4AF37] font-medium">Next Slot Today: 02:30 PM</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
