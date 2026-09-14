import React, { useState, useEffect } from "react";
import { 
  Search, 
  PlusCircle, 
  Sparkles, 
  Compass, 
  ShieldCheck, 
  Filter, 
  Layers, 
  PackageSearch, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  Tag,
  Building2,
  GraduationCap,
  BookOpen,
  MapPin
} from "lucide-react";
import { Navbar } from "./components/Navbar";
import { CampusAccessBar } from "./components/CampusAccessBar";
import { CampusDropOffModal } from "./components/CampusDropOffModal";
import { ItemCard } from "./components/ItemCard";
import { ItemDetailModal } from "./components/ItemDetailModal";
import { ReportItemModal } from "./components/ReportItemModal";
import { AuthModal } from "./components/AuthModal";
import { AIRecognitionScanner } from "./components/AIRecognitionScanner";
import { AdminPortal } from "./components/AdminPortal";
import { GmailNotificationBanner } from "./components/GmailNotificationBanner";
import type { LostFoundItem, User, ItemCategory, ItemType, CollegeRole, CampusDropOffPoint } from "./types";

const CATEGORIES: Array<ItemCategory | "All"> = [
  "All",
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

export default function App() {
  // Navigation & View state
  const [activeTab, setActiveTab] = useState<"all" | "lost" | "found" | "scanner" | "admin">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | "All">("All");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "resolved">("all");

  // Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem("ghrcen_token"));
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState<"login" | "register">("login");

  // Items state
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null);

  // Modals state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportModalType, setReportModalType] = useState<ItemType>("lost");
  const [reportPreFillData, setReportPreFillData] = useState<Partial<LostFoundItem> | null>(null);

  // Campus Drop-off Hubs modal
  const [isDropOffModalOpen, setIsDropOffModalOpen] = useState(false);
  const [campusHubs, setCampusHubs] = useState<CampusDropOffPoint[]>([]);

  // Gmail Notification Banner
  const [gmailNotification, setGmailNotification] = useState<{ code: string; email: string } | null>(null);

  // Fetch campus dropoff hubs
  const fetchCampusHubs = async () => {
    try {
      const res = await fetch("/api/campus/dropoff-points");
      const data = await res.json();
      if (data.points) {
        setCampusHubs(data.points);
      }
    } catch (e) {
      console.warn("Campus hubs fetch notice:", e);
    }
  };

  // Check current session
  const verifySession = async (token: string) => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      } else {
        localStorage.removeItem("ghrcen_token");
        setAuthToken(null);
        setCurrentUser(null);
      }
    } catch {
      localStorage.removeItem("ghrcen_token");
      setAuthToken(null);
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    fetchCampusHubs();
    if (authToken) {
      verifySession(authToken);
    } else {
      // Default auto-login as Student (Gunjan Jaiswal) for immediate interactive experience
      autoLoginDefaultStudent();
    }
  }, [authToken]);

  // Seamless default login for student demo user
  const autoLoginDefaultStudent = async () => {
    try {
      const res = await fetch("/api/auth/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "gunjanjitendrajaiswal@gmail.com",
          name: "Gunjan Jaiswal",
          role: "student",
          department: "Artificial Intelligence & Data Science (AI & DS)",
          prnOrId: "2024BTADS042",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setAuthToken(data.token);
        localStorage.setItem("ghrcen_token", data.token);
      }
    } catch (e) {
      console.warn("Default student session init notice:", e);
    }
  };

  // Switch demo persona (Student, Faculty, Security Admin)
  const handleSwitchDemoRole = async (targetRole: CollegeRole) => {
    let email = "gunjanjitendrajaiswal@gmail.com";
    let name = "Gunjan Jaiswal";
    let department = "Artificial Intelligence & Data Science (AI & DS)";
    let prn = "2024BTADS042";

    if (targetRole === "faculty") {
      email = "ananya.roy@ghrcen.edu";
      name = "Prof. Ananya Roy";
      department = "Computer Science & Engg (CSE)";
      prn = "FAC-CSE-104";
    } else if (targetRole === "admin") {
      email = "admin@ghrcen.edu";
      name = "Officer R. K. Sharma";
      department = "Campus Security & Estate";
      prn = "SEC-DESK-01";
    }

    try {
      const res = await fetch("/api/auth/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          role: targetRole,
          department,
          prnOrId: prn,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setAuthToken(data.token);
        localStorage.setItem("ghrcen_token", data.token);
        fetchItems();
      }
    } catch (err) {
      console.error("Role switch error:", err);
    }
  };

  // Fetch Items from API
  const fetchItems = async () => {
    setLoadingItems(true);
    try {
      let url = "/api/items?";
      if (activeTab === "lost") url += "type=lost&";
      if (activeTab === "found") url += "type=found&";
      if (selectedCategory !== "All") url += `category=${encodeURIComponent(selectedCategory)}&`;
      if (statusFilter !== "all") url += `status=${statusFilter}&`;
      if (searchQuery.trim()) url += `query=${encodeURIComponent(searchQuery.trim())}&`;

      const res = await fetch(url);
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error("Failed to fetch items:", error);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "scanner" && activeTab !== "admin") {
      fetchItems();
    }
  }, [activeTab, selectedCategory, statusFilter, searchQuery]);

  // Authentication Handlers
  const handleAuthSuccess = (user: User, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    localStorage.setItem("ghrcen_token", token);
    setIsAuthModalOpen(false);
    fetchItems();
  };

  const handleLogout = async () => {
    if (authToken) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } catch (e) {
        console.warn("Logout notice:", e);
      }
    }
    localStorage.removeItem("ghrcen_token");
    setAuthToken(null);
    setCurrentUser(null);
  };

  // Item Actions
  const handleCreateItem = async (itemData: Partial<LostFoundItem>) => {
    const res = await fetch("/api/items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken || ""}`,
      },
      body: JSON.stringify(itemData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to post item");
    }
    fetchItems();
  };

  const handleUpdateItemStatus = async (itemId: string, newStatus: LostFoundItem["status"]) => {
    const res = await fetch(`/api/items/${itemId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken || ""}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to update item status");
    }
    if (selectedItem?.id === itemId) {
      setSelectedItem(data.item);
    }
    fetchItems();
  };

  const handleDeleteItem = async (itemId: string) => {
    const res = await fetch(`/api/items/${itemId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authToken || ""}`,
      },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to delete item");
    }
    setSelectedItem(null);
    fetchItems();
  };

  const handleSubmitClaim = async (itemId: string, proof: string, answer?: string) => {
    const res = await fetch(`/api/items/${itemId}/claim`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken || ""}`,
      },
      body: JSON.stringify({
        claimProofDescription: proof,
        verificationAnswerProvided: answer,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to submit claim");
    }
    fetchItems();
  };

  // Open Report Modal with prefill from AI scanner
  const handleReportWithAIData = (prefillData: Partial<LostFoundItem>) => {
    setReportPreFillData(prefillData);
    setReportModalType(prefillData.type || "lost");
    setIsReportModalOpen(true);
  };

  // Summary counts
  const lostCount = items.filter((i) => i.type === "lost").length;
  const foundCount = items.filter((i) => i.type === "found").length;
  const resolvedCount = items.filter((i) => i.status === "resolved").length;

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col font-sans selection:bg-amber-700 selection:text-white">
      {/* Top Campus Access Bar: Identity, Login, Logout, Role Switcher, Drop-off Desks */}
      <CampusAccessBar
        currentUser={currentUser}
        onOpenAuth={(mode) => {
          setAuthModalInitialMode(mode || "login");
          setIsAuthModalOpen(true);
        }}
        onDirectGoogleLogin={() => autoLoginDefaultStudent()}
        onLogout={handleLogout}
        onOpenDropOffModal={() => setIsDropOffModalOpen(true)}
        onSwitchDemoRole={handleSwitchDemoRole}
      />

      {/* Main College Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenAuth={(mode) => {
          setAuthModalInitialMode(mode || "login");
          setIsAuthModalOpen(true);
        }}
        onOpenReportModal={(type) => {
          setReportPreFillData(null);
          setReportModalType(type || "lost");
          setIsReportModalOpen(true);
        }}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenDropOffModal={() => setIsDropOffModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner Section (Shown on All, Lost, Found views) */}
        {activeTab !== "scanner" && activeTab !== "admin" && (
          <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden border border-stone-800">
            {/* Background geometric accents */}
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 rounded-full bg-amber-600/15 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-1/3 -mb-8 w-56 h-56 rounded-full bg-blue-600/10 blur-2xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-2xl space-y-2.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold backdrop-blur-xs border border-white/10">
                  <GraduationCap className="w-4 h-4 text-amber-400" />
                  <span>GHRCEN Official Campus Lost & Found Registry</span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
                  {activeTab === "all" && "Lost or Found on Campus? Let's Recover It."}
                  {activeTab === "lost" && "GHRCEN Lost Belongings Directory"}
                  {activeTab === "found" && "Found Campus Belongings & Custody Desks"}
                </h1>
                <p className="text-stone-300 text-xs sm:text-sm leading-relaxed max-w-xl">
                  {activeTab === "all" &&
                    "Designed for GHRCEN students, faculty, and campus staff. Search lost scientific calculators, student ID cards, lab coats, and electronics with instant AI image recognition."}
                  {activeTab === "lost" &&
                    "All currently reported lost items across Block A, Block B, Central Library, and Labs. If you spotted any of these, contact the student or security desk."}
                  {activeTab === "found" &&
                    "Found possessions safely registered with campus security. Verify your College PRN or security answer to claim and collect."}
                </p>

                {/* Quick stats counter */}
                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-stone-300">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>{lostCount} Lost Items</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>{foundCount} Found in Custody</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-stone-400"></span>
                    <span>{resolvedCount} Returned to Owners</span>
                  </div>
                </div>
              </div>

              {/* Action CTAs */}
              <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
                <button
                  id="hero-report-lost-cta"
                  onClick={() => {
                    setReportPreFillData(null);
                    setReportModalType("lost");
                    setIsReportModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                  <span>Report Lost Belonging</span>
                </button>

                <button
                  id="hero-report-found-cta"
                  onClick={() => {
                    setReportPreFillData(null);
                    setReportModalType("found");
                    setIsReportModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                  <span>Report Found Belonging</span>
                </button>

                <button
                  id="hero-scan-ai-cta"
                  onClick={() => setActiveTab("scanner")}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-900 bg-amber-400 hover:bg-amber-300 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Sparkles className="w-3.5 h-3.5 text-stone-900" />
                  <span>AI Item Scanner</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: SCANNER */}
        {activeTab === "scanner" && (
          <AIRecognitionScanner
            onSelectItem={(item) => setSelectedItem(item)}
            onReportWithData={handleReportWithAIData}
          />
        )}

        {/* VIEW: ADMIN PORTAL */}
        {activeTab === "admin" && (
          <AdminPortal
            currentUser={currentUser}
            onSelectItem={(item) => setSelectedItem(item)}
            authToken={authToken}
          />
        )}

        {/* VIEW: ALL / LOST / FOUND ITEMS GALLERIES */}
        {(activeTab === "all" || activeTab === "lost" || activeTab === "found") && (
          <div className="space-y-6">
            {/* Filter and Search Controls Bar */}
            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3">
              {/* College Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <span className="text-stone-400 font-semibold px-1 shrink-0 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Campus Category:</span>
                </span>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-stone-900 text-white shadow-xs"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Status and Search query info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-stone-100 text-xs text-stone-500">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-stone-700">Filter Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="p-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 text-xs font-medium focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active Only</option>
                    <option value="resolved">Resolved / Returned</option>
                  </select>

                  {/* Clear filters button */}
                  {(selectedCategory !== "All" || statusFilter !== "all" || searchQuery) && (
                    <button
                      onClick={() => {
                        setSelectedCategory("All");
                        setStatusFilter("all");
                        setSearchQuery("");
                      }}
                      className="text-amber-800 hover:underline font-semibold ml-2 cursor-pointer"
                    >
                      Reset filters
                    </button>
                  )}
                </div>

                <div>
                  <span>
                    Showing <strong className="text-stone-900">{items.length}</strong> items in GHRCEN registry
                    {searchQuery ? ` matching "${searchQuery}"` : ""}
                  </span>
                </div>
              </div>
            </div>

            {/* Loading Indicator */}
            {loadingItems && (
              <div className="py-16 text-center text-stone-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-stone-400" />
                <p className="text-xs font-semibold">Updating campus inventory from persistent storage...</p>
              </div>
            )}

            {/* Items Grid */}
            {!loadingItems && items.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onSelect={(selected) => setSelectedItem(selected)}
                    onClaim={(selected) => setSelectedItem(selected)}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loadingItems && items.length === 0 && (
              <div className="bg-white rounded-3xl border border-dashed border-stone-300 p-12 text-center text-stone-500 max-w-lg mx-auto space-y-3">
                <PackageSearch className="w-12 h-12 text-stone-400 mx-auto" />
                <h3 className="text-base font-bold text-stone-800">No matching campus items found</h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  No records match your current filter. Report an item or ask the Gate 1 Security Desk to check the physical register.
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedCategory("All");
                      setStatusFilter("all");
                      setSearchQuery("");
                    }}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Clear Search
                  </button>
                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Post an Item
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200 bg-white/90 backdrop-blur-xs py-6 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-amber-700" />
            <span className="font-bold text-stone-800">GHRCEN Lost & Found</span>
            <span>•</span>
            <span>G.H. Raisoni College of Engineering, Nagpur</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-stone-500">
              Persistent Storage Active • Encrypted PBKDF2 Credentials
            </span>
            <span>•</span>
            <span className="text-emerald-700 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Gmail OTP Security
            </span>
          </div>
        </div>
      </footer>

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedItem}
        currentUser={currentUser}
        onClose={() => setSelectedItem(null)}
        onStatusUpdate={handleUpdateItemStatus}
        onDeleteItem={handleDeleteItem}
        onSubmitClaim={handleSubmitClaim}
        onRequireLogin={() => {
          setSelectedItem(null);
          setIsAuthModalOpen(true);
        }}
      />

      {/* Report Item Modal */}
      <ReportItemModal
        isOpen={isReportModalOpen}
        initialType={reportModalType}
        currentUser={currentUser}
        onClose={() => {
          setIsReportModalOpen(false);
          setReportPreFillData(null);
        }}
        onSubmit={handleCreateItem}
        onRequireLogin={() => {
          setIsReportModalOpen(false);
          setIsAuthModalOpen(true);
        }}
      />

      {/* Auth Modal (Sign In / Register / Direct Google Login / Gmail OTP) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalInitialMode}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        onVerificationCodeDispatched={(code, email) => {
          setGmailNotification({ code, email });
        }}
      />

      {/* Campus Drop-Off Desks Modal */}
      <CampusDropOffModal
        isOpen={isDropOffModalOpen}
        onClose={() => setIsDropOffModalOpen(false)}
        hubs={campusHubs}
      />

      {/* Simulated Gmail Notification Dispatch Toast */}
      <GmailNotificationBanner
        notification={gmailNotification}
        onClose={() => setGmailNotification(null)}
        onAutofillCode={(code) => {
          setGmailNotification(null);
        }}
      />
    </div>
  );
}
