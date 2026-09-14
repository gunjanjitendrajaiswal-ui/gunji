import React, { useState } from "react";
import { 
  Sparkles, 
  Upload, 
  Search, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw, 
  Layers, 
  AlertCircle,
  Tag,
  ShieldCheck,
  ChevronRight,
  Camera
} from "lucide-react";
import type { AIRecognitionResult, LostFoundItem, ItemType } from "../types";

interface AIRecognitionScannerProps {
  onSelectItem: (item: LostFoundItem) => void;
  onReportWithData: (data: Partial<LostFoundItem>) => void;
}

const SAMPLE_SCAN_IMAGES = [
  {
    name: "Scientific Calculator (Casio)",
    type: "found",
    url: "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&q=80&w=800",
  },
  {
    name: "Student ID Card & Badge",
    type: "found",
    url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&q=80&w=800",
  },
  {
    name: "Engineering Laptop (Dell XPS)",
    type: "lost",
    url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800",
  },
  {
    name: "Two-Wheeler Bike Keys",
    type: "found",
    url: "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&q=80&w=800",
  },
];

export const AIRecognitionScanner: React.FC<AIRecognitionScannerProps> = ({
  onSelectItem,
  onReportWithData,
}) => {
  const [selectedImage, setSelectedImage] = useState<string>(SAMPLE_SCAN_IMAGES[0].url);
  const [targetSearchType, setTargetSearchType] = useState<ItemType>("lost");
  const [analyzing, setAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState<AIRecognitionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError("Image size limit is 8MB. Please choose a smaller photo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSelectedImage(base64);
      runScan(base64);
    };
    reader.readAsDataURL(file);
  };

  // Run AI Vision Scan
  const runScan = async (imgToScan?: string) => {
    const image = imgToScan || selectedImage;
    if (!image) {
      setError("Please provide an image to analyze.");
      return;
    }

    setAnalyzing(true);
    setError(null);
    setScanResult(null);

    try {
      const res = await fetch("/api/ai/recognize-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: image,
          targetItemType: targetSearchType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "AI analysis failed");
      }

      setScanResult(data.result);
    } catch (err: any) {
      setError(err.message || "Failed to scan image. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-800">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>Gemini Vision 3.8 Deep Recognition Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            AI Image Matcher & Object Identifier
          </h1>
          <p className="text-stone-300 text-sm mt-2 leading-relaxed">
            Upload a photo of any lost or found possession. Our neural vision model automatically detects
            brand, category, color nuance, serial patterns, and scans the database for potential matches.
          </p>
        </div>
      </div>

      {/* Main Scanner Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image Selector & Input */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Camera className="w-4 h-4 text-stone-600" />
              <span>Step 1: Upload or Select Photo</span>
            </h2>

            {/* Target mode selection */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                What are you trying to do?
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setTargetSearchType("lost")}
                  className={`py-2 px-3 rounded-xl border text-center transition-all ${
                    targetSearchType === "lost"
                      ? "border-rose-600 bg-rose-50 text-rose-800 font-bold"
                      : "border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  I Lost This Item
                  <span className="block text-[10px] text-stone-500 font-normal">
                    Search Found Registry
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetSearchType("found")}
                  className={`py-2 px-3 rounded-xl border text-center transition-all ${
                    targetSearchType === "found"
                      ? "border-emerald-700 bg-emerald-50 text-emerald-800 font-bold"
                      : "border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  I Found This Item
                  <span className="block text-[10px] text-stone-500 font-normal">
                    Search Lost Reports
                  </span>
                </button>
              </div>
            </div>

            {/* Main Preview */}
            <div className="relative aspect-4/3 rounded-xl bg-stone-100 overflow-hidden border border-stone-200 group">
              <img
                src={selectedImage}
                alt="Scan target"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <label className="px-4 py-2 bg-white text-stone-900 text-xs font-bold rounded-xl cursor-pointer shadow-md hover:bg-stone-50 transition-colors">
                  Upload Custom Photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </div>

            {/* Sample Presets */}
            <div>
              <p className="text-xs font-semibold text-stone-600 mb-2">Or choose a test sample:</p>
              <div className="grid grid-cols-4 gap-2">
                {SAMPLE_SCAN_IMAGES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedImage(sample.url);
                      setTargetSearchType(sample.type as ItemType);
                      setScanResult(null);
                    }}
                    className={`relative rounded-lg overflow-hidden aspect-square border-2 transition-all ${
                      selectedImage === sample.url
                        ? "border-amber-600 scale-95 shadow-xs"
                        : "border-transparent opacity-75 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={sample.url}
                      alt={sample.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              <button
                type="button"
                id="run-ai-vision-scan-button"
                onClick={() => runScan()}
                disabled={analyzing}
                className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-200" />
                    <span>Analyzing Image with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Run AI Object Recognition</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: AI Analysis & Cross Matches */}
        <div className="lg:col-span-7 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-2xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!scanResult && !analyzing && (
            <div className="bg-stone-50 rounded-2xl border border-dashed border-stone-300 p-12 text-center text-stone-500">
              <Sparkles className="w-10 h-10 text-stone-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-stone-800">Ready to Identify Objects</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 leading-relaxed">
                Click "Run AI Object Recognition" to extract features from the image and cross-reference
                our database for immediate matches.
              </p>
            </div>
          )}

          {analyzing && (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-xs">
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Sparkles className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-base font-bold text-stone-900">Neural Vision Scan in Progress</h3>
              <p className="text-xs text-stone-500 mt-1">
                Analyzing pixels, recognizing brand logos, identifying distinct markings...
              </p>
            </div>
          )}

          {scanResult && !analyzing && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Identified Attributes Card */}
              <div className="bg-white rounded-2xl border border-indigo-100 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-stone-900">AI Detection Report</h3>
                      <p className="text-xs text-stone-500">Visual attributes automatically extracted</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-stone-100 text-stone-700">
                    {scanResult.category}
                  </span>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-stone-900">{scanResult.title}</h4>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    {scanResult.suggestedDescription}
                  </p>
                </div>

                {/* Attribute Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                  {scanResult.detectedAttributes.brand && (
                    <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                      <span className="text-stone-400 block text-[10px] uppercase">Brand</span>
                      <span className="font-bold text-stone-800">{scanResult.detectedAttributes.brand}</span>
                    </div>
                  )}
                  {scanResult.detectedAttributes.primaryColor && (
                    <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                      <span className="text-stone-400 block text-[10px] uppercase">Color</span>
                      <span className="font-bold text-stone-800">{scanResult.detectedAttributes.primaryColor}</span>
                    </div>
                  )}
                  {scanResult.detectedAttributes.model && (
                    <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                      <span className="text-stone-400 block text-[10px] uppercase">Model</span>
                      <span className="font-bold text-stone-800">{scanResult.detectedAttributes.model}</span>
                    </div>
                  )}
                  {scanResult.detectedAttributes.distinctiveMarks && (
                    <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100 col-span-2">
                      <span className="text-stone-400 block text-[10px] uppercase">Distinctive Marks</span>
                      <span className="font-bold text-stone-800">{scanResult.detectedAttributes.distinctiveMarks}</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {scanResult.suggestedTags && scanResult.suggestedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {scanResult.suggestedTags.map((t, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[11px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-medium"
                      >
                        <Tag className="w-2.5 h-2.5 text-stone-400" />
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Pre-fill Report Button */}
                <div className="pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => {
                      onReportWithData({
                        title: scanResult.title,
                        category: scanResult.category,
                        description: scanResult.suggestedDescription,
                        imageUrl: selectedImage,
                        aiTags: scanResult.suggestedTags,
                        aiIdentifiedAttributes: scanResult.detectedAttributes,
                        type: targetSearchType,
                      });
                    }}
                    className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Use these AI details to create a new report</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Database Match Candidates */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-600" />
                    <span>Potential Registry Matches ({scanResult.matchCandidates.length})</span>
                  </h3>
                  <span className="text-xs text-stone-500">
                    Comparing opposite {targetSearchType === "lost" ? "found" : "lost"} listings
                  </span>
                </div>

                {scanResult.matchCandidates.length === 0 ? (
                  <div className="p-6 bg-white rounded-2xl border border-stone-200 text-center text-stone-500">
                    <p className="text-xs">No matching listings found in current registry yet.</p>
                    <p className="text-[11px] text-stone-400 mt-1">
                      You can register this item so someone can contact you if found!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {scanResult.matchCandidates.map((candidate, idx) => (
                      <div
                        key={idx}
                        onClick={() => onSelectItem(candidate.item)}
                        className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs hover:shadow-md hover:border-amber-400 transition-all flex items-center gap-4 cursor-pointer"
                      >
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                          <img
                            src={candidate.item.imageUrl}
                            alt={candidate.item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                candidate.item.type === "lost"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {candidate.item.type}
                            </span>
                            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                              {candidate.matchScore}% Confidence Match
                            </span>
                          </div>

                          <h4 className="font-bold text-sm text-stone-900 truncate">
                            {candidate.item.title}
                          </h4>
                          <p className="text-xs text-stone-500 truncate mt-0.5">
                            {candidate.item.location} • {candidate.item.date}
                          </p>

                          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{candidate.matchReasons.join(" • ")}</span>
                          </div>
                        </div>

                        <ChevronRight className="w-5 h-5 text-stone-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
