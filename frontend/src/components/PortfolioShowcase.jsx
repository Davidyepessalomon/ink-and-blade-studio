import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Sparkles, Filter, Eye, DollarSign, User, Tag, 
  Check, ArrowRight, Scissors, Flame 
} from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

export default function PortfolioShowcase({ onBookItem }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/portfolio`, {
        params: {
          type: activeTab !== "all" ? activeTab : undefined,
          category: selectedCategory !== "all" ? selectedCategory : undefined,
        },
      });
      setItems(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [activeTab, selectedCategory]);

  const categories = {
    all: ["All Styles", "Realism", "Neo-Japanese", "Blackwork", "Skin Fade", "Classic Cut", "Traditional", "Neo-Traditional"],
    tattoo: ["All Styles", "Realism", "Neo-Japanese", "Blackwork"],
    barber: ["All Styles", "Skin Fade", "Classic Cut"],
    flash: ["All Styles", "Neo-Traditional", "Traditional"],
  };

  return (
    <section id="portfolio" className="py-20 bg-[#0E0E10] border-t border-zinc-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-2 text-left">
            <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#D4AF37] font-mono">
              <Sparkles className="w-3.5 h-3.5" /> Curated Gallery
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-white">
              MASTER PORTFOLIO & FLASH REPOSITORY
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 max-w-xl">
              Inspect past custom tattoo masterpieces, razor fade architecture, and claimable flash sheets ready for immediate booking.
            </p>
          </div>

          {/* Type Selector Tabs */}
          <div className="flex flex-wrap gap-2 p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl">
            {[
              { id: "all", label: "All Works" },
              { id: "tattoo", label: "Tattoos" },
              { id: "barber", label: "Barber Cuts" },
              { id: "flash", label: "Flash Designs" },
            ].map((tab) => (
              <button
                key={tab.id}
                data-testid={`portfolio-tab-${tab.id}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedCategory("all");
                }}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === tab.id
                    ? "bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sub-category Filter Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          <Filter className="w-4 h-4 text-zinc-500 flex-shrink-0 mr-1" />
          {(categories[activeTab] || categories.all).map((cat) => {
            const val = cat === "All Styles" ? "all" : cat;
            const isSelected = selectedCategory === val;
            return (
              <button
                key={cat}
                data-testid={`filter-chip-${val}`}
                onClick={() => setSelectedCategory(val)}
                className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors ${
                  isSelected
                    ? "border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37] font-medium"
                    : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-80 bg-zinc-900/60 rounded-xl animate-pulse border border-zinc-800" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/30 rounded-2xl border border-zinc-800">
            <p className="text-zinc-400">No portfolio items found under this filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(items) && items.map((item) => (
              <div
                key={item.id}
                data-testid={`portfolio-card-${item.id}`}
                className="group relative rounded-xl overflow-hidden border border-zinc-800/80 bg-[#141416] hover:border-[#D4AF37]/60 transition-all duration-300 shadow-lg flex flex-col"
              >
                {/* Image Container */}
                <div className="relative aspect-[4/3] overflow-hidden bg-zinc-950">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md border border-white/10 text-[#D4AF37]">
                      {item.category}
                    </span>
                    {item.is_flash && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-[#D4AF37] text-black flex items-center gap-1">
                        <Flame className="w-3 h-3" /> Flash Sheet
                      </span>
                    )}
                  </div>

                  {/* Quick View Button on Hover */}
                  <button
                    data-testid={`view-item-btn-${item.id}`}
                    onClick={() => setSelectedItem(item)}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D4AF37] text-black font-semibold text-xs shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-transform">
                      <Eye className="w-4 h-4" /> Inspect Piece
                    </span>
                  </button>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400 flex items-center gap-1 font-mono">
                        <User className="w-3 h-3 text-[#D4AF37]" /> {item.artist_name}
                      </span>
                      {item.price_estimate && (
                        <span className="text-xs font-semibold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/20 font-mono">
                          {item.price_estimate}
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif font-bold text-base text-zinc-100 group-hover:text-[#D4AF37] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  {/* Tags & Action */}
                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {item.tags?.slice(0, 2).map((t) => (
                        <span key={t} className="text-[10px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded">
                          #{t}
                        </span>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      data-testid={`book-portfolio-item-${item.id}`}
                      onClick={() => onBookItem(item)}
                      className="text-xs text-[#D4AF37] hover:text-black hover:bg-[#D4AF37] p-2 h-auto"
                    >
                      {item.is_flash ? "Claim Flash" : "Book Style"} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Modal Inspector */}
      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-3xl bg-[#141416] border-zinc-800 text-zinc-100 p-0 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative aspect-square md:aspect-auto bg-black flex items-center justify-center overflow-hidden">
                <img
                  src={selectedItem.image_url}
                  alt={selectedItem.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 md:p-8 flex flex-col justify-between space-y-6 text-left">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase px-2.5 py-1 rounded bg-[#D4AF37]/15 text-[#D4AF37] font-semibold">
                      {selectedItem.category}
                    </span>
                    {selectedItem.is_flash && (
                      <span className="text-xs uppercase px-2 py-1 rounded bg-red-950/60 border border-red-500/30 text-red-400 font-semibold">
                        Exclusive Flash
                      </span>
                    )}
                  </div>
                  <DialogTitle className="text-2xl font-serif font-black text-white">
                    {selectedItem.title}
                  </DialogTitle>
                  <DialogDescription className="text-zinc-400 text-sm leading-relaxed">
                    {selectedItem.description}
                  </DialogDescription>

                  <div className="space-y-2 pt-2 border-t border-zinc-800">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Resident Artist:</span>
                      <span className="text-zinc-200 font-semibold">{selectedItem.artist_name}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Estimated Investment:</span>
                      <span className="text-[#D4AF37] font-bold font-mono">{selectedItem.price_estimate || "$200 - $600"}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Deposit Requirement:</span>
                      <span className="text-zinc-200 font-mono">$25 - $100 (Applied to chair total)</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800 space-y-2">
                  <Button
                    data-testid="modal-book-piece-btn"
                    onClick={() => {
                      const itm = selectedItem;
                      setSelectedItem(null);
                      onBookItem(itm);
                    }}
                    className="w-full bg-[#D4AF37] text-black font-bold hover:bg-[#E5C158] py-2.5"
                  >
                    {selectedItem.is_flash ? "Claim Flash & Lock Slot ($50 Deposit)" : "Book Appointment for This Style"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedItem(null)}
                    className="w-full text-zinc-400 hover:text-white text-xs"
                  >
                    Close Inspector
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}
