import React from "react";
import { 
  Search, 
  PlusCircle, 
  Sparkles, 
  Shield, 
  LogOut, 
  User as UserIcon, 
  HelpCircle, 
  Compass, 
  Tag,
  CheckCircle2,
  GraduationCap,
  Building2,
  MapPin
} from "lucide-react";
import type { User, ItemType } from "../types";

interface NavbarProps {
  activeTab: "all" | "lost" | "found" | "scanner" | "admin";
  setActiveTab: (tab: "all" | "lost" | "found" | "scanner" | "admin") => void;
  currentUser: User | null;
  onOpenAuth: (mode?: "login" | "register") => void;
  onOpenReportModal: (type?: ItemType) => void;
  onLogout: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenDropOffModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuth,
  onOpenReportModal,
  onLogout,
  searchQuery,
  setSearchQuery,
  onOpenDropOffModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4">
          {/* Logo & College Branding */}
          <div 
            id="brand-logo-button"
            onClick={() => setActiveTab("all")}
            className="flex items-center gap-3.5 cursor-pointer select-none group shrink-0"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-stone-900 to-amber-950 flex items-center justify-center text-white shadow-sm border border-stone-700/40 group-hover:scale-102 transition-transform">
              <GraduationCap className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-stone-950 block leading-tight">
                  GHRCEN <span className="text-amber-800 font-bold">Lost & Found</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  Campus Registry
                </span>
              </div>
              <span className="text-[11px] text-stone-500 font-medium tracking-wide block truncate max-w-[260px] sm:max-w-none">
                G.H. Raisoni College of Engineering • Nagpur
              </span>
            </div>
          </div>

          {/* Central Campus Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-2">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                id="navbar-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search calculators, ID cards, keys, labs, classroom..."
                className="w-full pl-10 pr-4 py-2 bg-stone-100/90 border border-stone-200 rounded-full text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all font-medium"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700 bg-stone-200 rounded-full w-4 h-4 flex items-center justify-center cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Primary Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              id="nav-tab-all"
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-stone-900 text-white shadow-xs"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
              }`}
            >
              All Inventory
            </button>
            <button
              id="nav-tab-lost"
              onClick={() => setActiveTab("lost")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "lost"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-stone-600 hover:text-rose-700 hover:bg-rose-50"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 ring-2 ring-white"></span>
              Lost Items
            </button>
            <button
              id="nav-tab-found"
              onClick={() => setActiveTab("found")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "found"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "text-stone-600 hover:text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-white"></span>
              Found Items
            </button>
            <button
              id="nav-tab-scanner"
              onClick={() => setActiveTab("scanner")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "scanner"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Image Vision
            </button>

            {currentUser?.role === "admin" && (
              <button
                id="nav-tab-admin"
                onClick={() => setActiveTab("admin")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "admin"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-amber-800 hover:text-amber-900 hover:bg-amber-50"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Admin Portal
              </button>
            )}
          </nav>

          {/* Right Action Area */}
          <div className="flex items-center gap-2">
            {/* Post Item CTA Button */}
            <button
              id="post-item-button"
              onClick={() => onOpenReportModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 active:scale-98 shadow-xs transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Report Item</span>
            </button>

            {/* User Session Area */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <img
                      src={currentUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}`}
                      alt={currentUser.name}
                      className="w-8 h-8 rounded-full object-cover border border-stone-300"
                    />
                    {currentUser.isEmailVerified && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 absolute -bottom-1 -right-1 bg-white rounded-full" />
                    )}
                  </div>
                  <div className="hidden xl:block text-left">
                    <p className="text-xs font-bold text-stone-900 leading-tight">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-stone-500 flex items-center gap-1">
                      {currentUser.role === "admin" ? (
                        <span className="text-amber-700 font-bold">Security Admin</span>
                      ) : currentUser.role === "faculty" ? (
                        <span className="text-purple-700 font-bold">Faculty Member</span>
                      ) : (
                        <span className="text-blue-700 font-bold">Student</span>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  id="signout-button"
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-2 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  id="signin-button"
                  onClick={() => onOpenAuth("login")}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  id="google-direct-login-nav"
                  onClick={() => onOpenAuth("login")}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 border border-stone-300 rounded-xl text-xs font-bold text-stone-800 bg-amber-50 hover:bg-amber-100/80 transition-all shadow-xs cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Google Login</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="lg:hidden flex items-center justify-around py-2 border-t border-stone-200 text-xs font-semibold overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
              activeTab === "all" ? "bg-stone-900 text-white" : "text-stone-600"
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => setActiveTab("lost")}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
              activeTab === "lost" ? "bg-rose-600 text-white" : "text-stone-600"
            }`}
          >
            Lost
          </button>
          <button
            onClick={() => setActiveTab("found")}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
              activeTab === "found" ? "bg-emerald-700 text-white" : "text-stone-600"
            }`}
          >
            Found
          </button>
          <button
            onClick={() => setActiveTab("scanner")}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap flex items-center gap-1 ${
              activeTab === "scanner" ? "bg-indigo-600 text-white" : "text-indigo-600"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            AI Scanner
          </button>
          {currentUser?.role === "admin" && (
            <button
              onClick={() => setActiveTab("admin")}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap flex items-center gap-1 ${
                activeTab === "admin" ? "bg-amber-600 text-white" : "text-amber-700"
              }`}
            >
              <Shield className="w-3 h-3" />
              Admin
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
