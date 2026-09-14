import React, { useState, useEffect } from "react";
import { Mail, Check, Copy, X, ShieldAlert, Clock } from "lucide-react";

interface GmailNotificationBannerProps {
  notification: {
    code: string;
    email: string;
  } | null;
  onClose: () => void;
  onAutofillCode?: (code: string) => void;
}

export const GmailNotificationBanner: React.FC<GmailNotificationBannerProps> = ({
  notification,
  onClose,
  onAutofillCode,
}) => {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins countdown

  useEffect(() => {
    if (!notification) return;
    setTimeLeft(900);
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [notification]);

  if (!notification) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(notification.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-stone-900 text-white rounded-2xl p-4 shadow-2xl border border-stone-700/80 backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center border border-red-500/30">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block leading-tight">
                Gmail Verification Message Dispatched
              </span>
              <span className="text-[10px] text-stone-400">
                To: {notification.email}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message body */}
        <div className="py-3">
          <p className="text-xs text-stone-300 leading-relaxed">
            Use this secure one-time passcode (OTP) to verify your Gmail identity and complete login/registration:
          </p>

          <div className="mt-2.5 flex items-center justify-between bg-stone-950/80 p-2.5 rounded-xl border border-stone-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400 font-mono">OTP:</span>
              <span className="font-mono text-xl font-black tracking-[0.3em] text-amber-400">
                {notification.code}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopy}
                className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>

              {onAutofillCode && (
                <button
                  type="button"
                  onClick={() => onAutofillCode(notification.code)}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Quick Fill
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer time limit */}
        <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-stone-500" />
            Expires in {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
          </span>
          <span className="text-[10px] text-stone-500">
            FindTrace Cryptographic Verification
          </span>
        </div>
      </div>
    </div>
  );
};
