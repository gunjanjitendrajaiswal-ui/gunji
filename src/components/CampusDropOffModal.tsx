import React from "react";
import { 
  X, 
  MapPin, 
  Phone, 
  Clock, 
  Shield, 
  Building2, 
  CheckCircle, 
  HelpCircle,
  AlertTriangle
} from "lucide-react";
import type { CampusDropOffPoint } from "../types";

interface CampusDropOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  hubs: CampusDropOffPoint[];
}

export const CampusDropOffModal: React.FC<CampusDropOffModalProps> = ({
  isOpen,
  onClose,
  hubs,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-stone-200 shadow-2xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">
              GHRCEN Official Campus Drop-off Desks
            </h2>
            <p className="text-xs text-stone-500">
              Safe custody & verification points across G.H. Raisoni College of Engineering
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-6 text-xs text-amber-900 flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-0.5">Campus Security Notice</p>
            <p className="text-amber-800 leading-relaxed">
              If you discover valuables (Smartphones, Student ID Cards, Laptops, Scientific Calculators, or Keys), please hand them over to any of the 4 designated locations below. Items are securely tagged with a college register entry.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {hubs.map((hub, idx) => (
            <div 
              key={idx}
              className="p-4 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-sm text-stone-900 leading-snug">
                  {hub.name}
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-stone-200 text-stone-700 shrink-0">
                  Hub #{idx + 1}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-stone-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span><strong>Location:</strong> {hub.building} ({hub.roomOrDesk})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span><strong>Officer In-Charge:</strong> {hub.incharge}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-mono text-stone-800">{hub.contactNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="font-medium text-stone-700">{hub.hours}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-stone-200">
          <p className="text-xs text-stone-500">
            Helpline: <strong>security@ghrcen.edu</strong>
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 transition-colors"
          >
            Got it, Close
          </button>
        </div>
      </div>
    </div>
  );
};
