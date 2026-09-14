import React, { useState } from "react";
import { 
  X, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  Sparkles, 
  Tag, 
  Mail, 
  Phone, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Share2,
  Trash2,
  Lock,
  MessageSquare
} from "lucide-react";
import type { LostFoundItem, User } from "../types";

interface ItemDetailModalProps {
  item: LostFoundItem | null;
  currentUser: User | null;
  onClose: () => void;
  onStatusUpdate: (itemId: string, newStatus: LostFoundItem["status"]) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  onSubmitClaim: (itemId: string, proof: string, answer?: string) => Promise<void>;
  onRequireLogin: () => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  currentUser,
  onClose,
  onStatusUpdate,
  onDeleteItem,
  onSubmitClaim,
  onRequireLogin,
}) => {
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimProof, setClaimProof] = useState("");
  const [verificationAnswer, setVerificationAnswer] = useState("");
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!item) return null;

  const isOwner = currentUser?.id === item.postedBy.userId;
  const isAdmin = currentUser?.role === "admin";
  const canManage = isOwner || isAdmin;

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    if (!claimProof.trim()) {
      setActionError("Please describe identifying details or evidence to prove this item belongs to you.");
      return;
    }

    setSubmittingClaim(true);
    setActionError(null);
    try {
      await onSubmitClaim(item.id, claimProof, verificationAnswer);
      setClaimSuccess(true);
      setShowClaimForm(false);
    } catch (err: any) {
      setActionError(err.message || "Failed to submit claim request");
    } finally {
      setSubmittingClaim(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50/70">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                item.type === "lost"
                  ? "bg-rose-600 text-white"
                  : "bg-emerald-700 text-white"
              }`}
            >
              {item.type === "lost" ? "Lost Item" : "Found Item"}
            </span>
            <span className="text-xs text-stone-500 font-medium">
              ID: {item.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              title="Share listing"
              className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 rounded-lg transition-colors text-xs flex items-center gap-1"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">{copiedLink ? "Copied!" : "Share"}</span>
            </button>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
          {/* Main Hero Image */}
          <div className="relative aspect-16/10 w-full rounded-xl bg-stone-100 overflow-hidden border border-stone-200">
            <img
              src={item.imageUrl}
              alt={item.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = item.type === "lost"
                  ? "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&q=80&w=800"
                  : "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=800";
              }}
            />
          </div>

          {/* Title and Category Header */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-stone-100 text-stone-700">
                {item.category}
              </span>
              <span className="text-xs text-stone-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Reported {item.date}
              </span>
              <span className="text-xs text-stone-500 ml-auto">
                {item.views} total views
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 leading-snug">
              {item.title}
            </h1>
          </div>

          {/* Location details */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
            <div className="flex items-start gap-2.5 text-sm text-stone-700">
              <MapPin className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-stone-900">Campus Location</p>
                <p className="text-xs text-stone-600">{item.location}</p>
              </div>
            </div>

            {item.handedOverToSecurity && (
              <div className="pt-2 border-t border-stone-200/60 flex items-start gap-2 text-xs text-amber-900 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/60">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Official Campus Custody: </span>
                  <span>Deposited safely at {item.securityDeskLocation || "Campus Security Cabin"}</span>
                  <p className="text-[11px] text-stone-600 mt-0.5">Bring your College ID Card / PRN to claim and collect.</p>
                </div>
              </div>
            )}
          </div>

          {/* Full Description */}
          <div>
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">
              Detailed Description
            </h3>
            <p className="text-sm text-stone-700 whitespace-pre-line leading-relaxed bg-stone-50/50 p-3 rounded-xl border border-stone-100">
              {item.description}
            </p>
          </div>

          {/* AI Vision Attributes */}
          {item.aiIdentifiedAttributes && Object.keys(item.aiIdentifiedAttributes).length > 0 && (
            <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-indigo-900 font-semibold text-xs uppercase tracking-wide">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>AI Vision Recognition Attributes</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                {item.aiIdentifiedAttributes.brand && (
                  <div className="bg-white p-2 rounded-lg border border-indigo-100">
                    <span className="text-stone-400 block text-[10px] uppercase">Brand</span>
                    <span className="font-semibold text-stone-800">{item.aiIdentifiedAttributes.brand}</span>
                  </div>
                )}
                {item.aiIdentifiedAttributes.primaryColor && (
                  <div className="bg-white p-2 rounded-lg border border-indigo-100">
                    <span className="text-stone-400 block text-[10px] uppercase">Color</span>
                    <span className="font-semibold text-stone-800">{item.aiIdentifiedAttributes.primaryColor}</span>
                  </div>
                )}
                {item.aiIdentifiedAttributes.model && (
                  <div className="bg-white p-2 rounded-lg border border-indigo-100">
                    <span className="text-stone-400 block text-[10px] uppercase">Model</span>
                    <span className="font-semibold text-stone-800">{item.aiIdentifiedAttributes.model}</span>
                  </div>
                )}
                {item.aiIdentifiedAttributes.distinctiveMarks && (
                  <div className="bg-white p-2 rounded-lg border border-indigo-100 col-span-2">
                    <span className="text-stone-400 block text-[10px] uppercase">Markings</span>
                    <span className="font-semibold text-stone-800">{item.aiIdentifiedAttributes.distinctiveMarks}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {item.aiTags && item.aiTags.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                Search Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {item.aiTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-xs bg-stone-100 text-stone-700 px-2.5 py-1 rounded-md font-medium"
                  >
                    <Tag className="w-3 h-3 text-stone-400" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Secret Question (for found items protection) */}
          {item.secretVerificationQuestion && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-900">Security Verification Question</p>
                <p className="text-xs text-amber-800 mt-0.5">"{item.secretVerificationQuestion}"</p>
                <p className="text-[11px] text-stone-500 mt-1">
                  You must answer this correctly in your claim request to verify authentic ownership.
                </p>
              </div>
            </div>
          )}

          {/* Reporter & Contact Info Box */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-stone-200 text-stone-700 font-bold text-sm flex items-center justify-center uppercase">
                {item.postedBy.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-stone-900">{item.postedBy.name}</span>
                  {item.postedBy.isVerified && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-medium">
                      <ShieldCheck className="w-3 h-3" />
                      Gmail Verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500">
                  Listed on {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Contact Action */}
            <div>
              {currentUser ? (
                <div className="text-right">
                  <span className="text-xs text-stone-500 block mb-0.5">Direct Contact:</span>
                  <a
                    href={`mailto:${item.contactInfo}?subject=Inquiry regarding FindTrace item: ${encodeURIComponent(item.title)}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900 bg-amber-100/60 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {item.contactInfo}
                  </a>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onRequireLogin}
                  className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Sign in to View Contact
                </button>
              )}
            </div>
          </div>

          {/* Claim Submission Section (Only for found items) */}
          {item.type === "found" && item.status !== "resolved" && (
            <div className="pt-2">
              {claimSuccess ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-emerald-900">Claim Request Submitted Successfully!</p>
                    <p className="mt-1 leading-relaxed">
                      The finder and security administrators have been notified. Once verified against the item's identifying marks, you will receive confirmation.
                    </p>
                  </div>
                </div>
              ) : !showClaimForm ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!currentUser) {
                      onRequireLogin();
                    } else {
                      setShowClaimForm(true);
                    }
                  }}
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:scale-98 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-200" />
                  This Item Belongs to Me (Submit Claim)
                </button>
              ) : (
                <form onSubmit={handleClaimSubmit} className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-stone-900">Submit Ownership Claim</h4>
                    <button
                      type="button"
                      onClick={() => setShowClaimForm(false)}
                      className="text-xs text-stone-500 hover:text-stone-800"
                    >
                      Cancel
                    </button>
                  </div>

                  {actionError && (
                    <div className="p-2 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-lg">
                      {actionError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Proof of Ownership / Unique Details *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={claimProof}
                      onChange={(e) => setClaimProof(e.target.value)}
                      placeholder="Describe private details only the owner would know (e.g. wallpaper picture, engraved serial number, keychain ornaments, inner contents)..."
                      className="w-full p-2.5 text-xs bg-white border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                    />
                  </div>

                  {item.secretVerificationQuestion && (
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Answer to Security Question: "{item.secretVerificationQuestion}"
                      </label>
                      <input
                        type="text"
                        value={verificationAnswer}
                        onChange={(e) => setVerificationAnswer(e.target.value)}
                        placeholder="Provide the answer..."
                        className="w-full p-2 text-xs bg-white border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingClaim}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 active:scale-98 transition-all"
                  >
                    {submittingClaim ? "Submitting Claim..." : "Send Verification Claim to Finder"}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Manage Actions for Author or Admin */}
          {canManage && (
            <div className="pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-500 font-medium">Status:</span>
                {item.status !== "resolved" ? (
                  <button
                    type="button"
                    onClick={() => onStatusUpdate(item.id, "resolved")}
                    className="px-3 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Mark as Returned / Resolved
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onStatusUpdate(item.id, "active")}
                    className="px-3 py-1 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                  >
                    Re-open as Active
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this listing?")) {
                    onDeleteItem(item.id);
                  }
                }}
                className="px-3 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                Delete Listing
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
