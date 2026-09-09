import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { ShieldCheck, UserCheck, Lock, Mail, Phone, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function AuthModal({ isOpen, onClose }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (isRegister) {
        await register(name, email, password, phone);
        toast.success("Account created successfully!");
      } else {
        await login(email, password);
        toast.success("Signed in successfully!");
      }
      onClose();
    } catch (err) {
      const msg = err.response?.data?.detail || "Authentication failed. Check credentials.";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemoAdmin = () => {
    setEmail("admin@inkandblade.com");
    setPassword("admin123");
  };

  const handleQuickDemoArtist = () => {
    setEmail("marcus@inkandblade.com");
    setPassword("artist123");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#141416] border-zinc-800 text-zinc-100 max-w-md p-6 sm:p-8 text-left shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] mb-2">
            <Lock className="w-5 h-5" />
          </div>
          <DialogTitle className="font-serif font-bold text-2xl text-white">
            {isRegister ? "Create Studio Account" : "Staff & Client Sign In"}
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs">
            {isRegister
              ? "Register to track your custom tattoo inquiries and booking history."
              : "Access the schedule manager, custom tattoo queue, and artist portal."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {isRegister && (
            <div>
              <Label className="text-xs text-zinc-300">Full Name</Label>
              <Input
                required
                data-testid="auth-name-input"
                placeholder="e.g. Liam Vance"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white mt-1"
              />
            </div>
          )}

          <div>
            <Label className="text-xs text-zinc-300">Email Address</Label>
            <Input
              type="email"
              required
              data-testid="auth-email-input"
              placeholder="e.g. admin@inkandblade.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-white mt-1"
            />
          </div>

          <div>
            <Label className="text-xs text-zinc-300">Password</Label>
            <Input
              type="password"
              required
              data-testid="auth-password-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-white mt-1"
            />
          </div>

          {isRegister && (
            <div>
              <Label className="text-xs text-zinc-300">Phone Number (Optional)</Label>
              <Input
                data-testid="auth-phone-input"
                placeholder="+1 555-000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white mt-1"
              />
            </div>
          )}

          <Button
            type="submit"
            data-testid="auth-submit-btn"
            disabled={submitting}
            className="w-full bg-[#D4AF37] text-black font-bold hover:bg-[#E5C158] py-2.5 shadow-[0_0_15px_rgba(212,175,55,0.25)]"
          >
            {submitting ? "Authenticating..." : isRegister ? "Create Account" : "Sign In"}
          </Button>

          {/* Quick Demo Fill Buttons for Testing */}
          <div className="pt-2 border-t border-zinc-800/80 space-y-2">
            <span className="text-[11px] text-zinc-500 font-mono block">Instant Demo Access:</span>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid="demo-admin-login-btn"
                onClick={handleQuickDemoAdmin}
                className="border-zinc-800 bg-zinc-900/90 text-xs text-zinc-300 hover:text-white"
              >
                Admin (Julian)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid="demo-artist-login-btn"
                onClick={handleQuickDemoArtist}
                className="border-zinc-800 bg-zinc-900/90 text-xs text-zinc-300 hover:text-white"
              >
                Artist (Marcus)
              </Button>
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              data-testid="auth-toggle-mode-btn"
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-zinc-400 hover:text-[#D4AF37] transition-colors"
            >
              {isRegister
                ? "Already have an account? Sign In"
                : "Need a client account? Register here"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
