import React, { useState } from "react";
import { 
  X, 
  Upload, 
  Sparkles, 
  Check, 
  MapPin, 
  Calendar, 
  Tag, 
  Lock, 
  AlertCircle, 
  Camera, 
  HelpCircle,
  Building2,
  ShieldCheck,
  GraduationCap
} from "lucide-react";
import type { ItemType, ItemCategory, LostFoundItem, User } from "../types";

interface ReportItemModalProps {
  isOpen: boolean;
  initialType?: ItemType;
  currentUser: User | null;
  onClose: () => void;
  onSubmit: (itemData: Partial<LostFoundItem>) => Promise<void>;
  onRequireLogin: () => void;
}

const CATEGORIES: ItemCategory[] = [
  "ID Cards & Hall Tickets",
  "Calculators & Stationery",
  "Laptops & Gadgets",
  "Electronics & Chargers",
  "Wallets & Purses",
  "Keys & Bike Keys",
  "Lab Coats & Aprons",
  "Books & Notes",
  "Water Bottles & Lunchboxes",
  "Jewelry & Watches",
  "Other Campus Items",
];

const CAMPUS_LOCATIONS = [
  "Block A Classrooms (Rooms 101 - 304)",
  "Block B Classrooms & Tutorial Halls",
  "Central Library - Ground Floor Circulation",
  "Central Library - 2nd Floor Digital Section",
  "Computer Science & IT Labs (Tech Park)",
  "Mechanical Workshop & CAD Center",
  "Main Canteen & Nescafe Corner",
  "Auditorium / Seminar Hall 1 & 2",
  "Main Gate 1 Security Post",
  "Gate 2 Two-Wheeler Parking Lot",
  "Campus Sports Ground & Gymkhana",
  "Student Welfare Section (Room 104)",
];

const SECURITY_DESKS = [
  "Main Gate 1 Security Cabin (24/7)",
  "Central Library Circulation Counter",
  "Student Section Office (Room 104)",
  "Computer Tech Park Lab Office",
];

export const ReportItemModal: React.FC<ReportItemModalProps> = ({
  isOpen,
  initialType = "lost",
  currentUser,
  onClose,
  onSubmit,
  onRequireLogin,
}) => {
  const [type, setType] = useState<ItemType>(initialType);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ItemCategory>("Calculators & Stationery");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState(CAMPUS_LOCATIONS[0]);
  const [customLocation, setCustomLocation] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [contactInfo, setContactInfo] = useState(currentUser?.email || "");
  const [imageUrl, setImageUrl] = useState("");
  const [secretQuestion, setSecretQuestion] = useState("");
  const [handedOverToSecurity, setHandedOverToSecurity] = useState(false);
  const [securityDeskLocation, setSecurityDeskLocation] = useState(SECURITY_DESKS[0]);
  const [tagsInput, setTagsInput] = useState("");
  const [tags, setTags] = useState<string[]>(["GHRCEN"]);
  
  // AI Vision recognition state
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [aiScanStatus, setAiScanStatus] = useState<string | null>(null);
  const [detectedAttributes, setDetectedAttributes] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle local image file upload & convert to base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError("Image size exceeds 8MB limit. Please choose a smaller photo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImageUrl(base64);
      triggerAiScan(base64);
    };
    reader.readAsDataURL(file);
  };

  // Trigger Gemini Image Recognition
  const triggerAiScan = async (base64Data?: string) => {
    const imgData = base64Data || imageUrl;
    if (!imgData) {
      setError("Please upload an image or select a photo first.");
      return;
    }

    setAnalyzingImage(true);
    setAiScanStatus("Scanning photo with GHRCEN AI Vision...");
    setError(null);

    try {
      const res = await fetch("/api/ai/recognize-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imgData,
          targetItemType: type,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "AI recognition failed");
      }

      const { result } = data;
      if (result) {
        if (result.title && !title) setTitle(result.title);
        if (result.category) setCategory(result.category);
        if (result.suggestedDescription && !description) setDescription(result.suggestedDescription);
        if (result.suggestedTags && result.suggestedTags.length > 0) {
          const combined = Array.from(new Set([...tags, ...result.suggestedTags]));
          setTags(combined);
        }
        setDetectedAttributes(result.detectedAttributes);
        setAiScanStatus(`Auto-identified: ${result.title} (${result.category})`);
      }
    } catch (err: any) {
      setAiScanStatus(null);
      setError("AI Vision notice: " + (err.message || "Manual input available"));
    } finally {
      setAnalyzingImage(false);
    }
  };

  const handleAddTag = () => {
    if (!tagsInput.trim()) return;
    if (!tags.includes(tagsInput.trim())) {
      setTags([...tags, tagsInput.trim()]);
    }
    setTagsInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    const finalLocation = customLocation.trim() ? `${location} - ${customLocation.trim()}` : location;

    if (!title.trim() || !description.trim() || !finalLocation) {
      setError("Please fill in the title, description, and campus location.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        title,
        type,
        category,
        description,
        location: finalLocation,
        date,
        contactInfo: contactInfo || currentUser.email,
        imageUrl: imageUrl || (type === "lost" 
          ? "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&q=80&w=800" 
          : "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=800"),
        aiTags: tags.length > 0 ? tags : [category, type, "GHRCEN"],
        aiIdentifiedAttributes: detectedAttributes || undefined,
        secretVerificationQuestion: secretQuestion || undefined,
        handedOverToSecurity,
        securityDeskLocation: handedOverToSecurity ? securityDeskLocation : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to submit item report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/65 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-0.5">
              <Building2 className="w-3.5 h-3.5 text-amber-700" />
              <span>GHRCEN Campus Registry</span>
            </div>
            <h2 className="text-base font-bold text-stone-900">
              Report Lost or Found Campus Belonging
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Selector (Lost vs Found) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Reporting Status *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType("lost")}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                  type === "lost"
                    ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                    : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-white"></span>
                I Lost Something on Campus
              </button>
              <button
                type="button"
                onClick={() => setType("found")}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                  type === "found"
                    ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                    : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-white"></span>
                I Found Something on Campus
              </button>
            </div>
          </div>

          {/* Photo Upload & AI Scan */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-stone-500" />
                <span>Upload Photo (AI Vision Auto-Extracts Details)</span>
              </label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => triggerAiScan()}
                  disabled={analyzingImage}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{analyzingImage ? "Analyzing..." : "Re-scan with AI"}</span>
                </button>
              )}
            </div>

            <div className="border-2 border-dashed border-stone-200 hover:border-amber-400 rounded-xl p-3.5 text-center bg-stone-50/60 transition-colors">
              {imageUrl ? (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-28 h-24 rounded-lg overflow-hidden border border-stone-200 shrink-0 bg-stone-100">
                    <img
                      src={imageUrl}
                      alt="Uploaded preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-xs font-bold text-stone-900">Photo Attached</p>
                    {aiScanStatus && (
                      <p className="text-xs text-indigo-700 font-medium mt-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {aiScanStatus}
                      </p>
                    )}
                    {detectedAttributes?.detectedStudentName && (
                      <span className="inline-block mt-1 text-[11px] bg-blue-100 text-blue-900 px-2 py-0.5 rounded font-semibold">
                        Student Identified: {detectedAttributes.detectedStudentName} ({detectedAttributes.detectedPrn || "PRN on card"})
                      </span>
                    )}
                    <label className="mt-2 block text-xs text-amber-700 font-semibold hover:underline cursor-pointer">
                      Change Photo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload className="w-7 h-7 text-stone-400 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-stone-700">
                    Upload an item photo for AI recognition
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Our AI automatically detects Casio calculators, GHRCEN ID cards, brands, laptop models, and colors.
                  </p>
                  <label className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-800 bg-white border border-stone-300 hover:bg-stone-50 shadow-xs cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    Select Image File
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Title and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Item Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Casio fx-991EX Scientific Calculator"
                className="w-full p-2 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                College Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="w-full p-2 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Campus Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Campus Location *
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-2 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white"
              >
                {CAMPUS_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Specific Room / Desk / Area Note
              </label>
              <input
                type="text"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder="e.g. Row 4 Desk 12, near Nescafe stall"
                className="w-full p-2 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white"
              />
            </div>
          </div>

          {/* Handed to Security Hub (For Found items) */}
          {type === "found" && (
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={handedOverToSecurity}
                  onChange={(e) => setHandedOverToSecurity(e.target.checked)}
                  className="rounded border-stone-300 text-stone-900 focus:ring-stone-900 w-4 h-4"
                />
                <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  I have deposited this item at a Campus Drop-off Desk / Security Cabin
                </span>
              </label>

              {handedOverToSecurity && (
                <div className="pt-2 pl-6">
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Select Drop-off Security Desk:
                  </label>
                  <select
                    value={securityDeskLocation}
                    onChange={(e) => setSecurityDeskLocation(e.target.value)}
                    className="w-full p-2 text-xs bg-white border border-stone-300 rounded-lg text-stone-900"
                  >
                    {SECURITY_DESKS.map((desk) => (
                      <option key={desk} value={desk}>
                        {desk}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Item Details & Distinctive Marks *
            </label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe serial initial, stickers, roll number, case color, scratches, or wear..."
              className="w-full p-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Secret Question (For Found items) */}
          {type === "found" && (
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1">
              <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Anti-Fraud Ownership Question (Optional)
              </label>
              <input
                type="text"
                value={secretQuestion}
                onChange={(e) => setSecretQuestion(e.target.value)}
                placeholder="e.g. 'What name is written on the battery lid?' or 'What keychain charm is attached?'"
                className="w-full p-2 text-xs bg-white border border-amber-300 rounded-lg text-stone-900"
              />
              <p className="text-[10px] text-stone-600">
                Claimant must answer this correctly to prove ownership before retrieving.
              </p>
            </div>
          )}

          {/* Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Contact Email or College Extension
              </label>
              <input
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="e.g. gunjanjitendrajaiswal@gmail.com"
                className="w-full p-2 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Date {type === "lost" ? "Lost" : "Found"}
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-2 px-5 rounded-xl text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 active:scale-98 shadow-xs transition-all"
            >
              {loading ? "Registering on Campus..." : `Post ${type === "lost" ? "Lost" : "Found"} Item`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
