import React from "react";
import { 
  GraduationCap, 
  ShieldCheck, 
  UserCheck, 
  Building2, 
  LogOut, 
  LogIn, 
  MapPin, 
  Sparkles,
  Phone,
  Clock,
  ChevronRight,
  Info
} from "lucide-react";
import type { User, CollegeRole } from "../types";

interface CampusAccessBarProps {
  currentUser: User | null;
  onOpenAuth: (mode?: "login" | "register") => void;
  onDirectGoogleLogin: () => void;
  onLogout: () => void;
  onOpenDropOffModal: () => void;
  onSwitchDemoRole: (role: CollegeRole) => void;
}

export const CampusAccessBar: React.FC<CampusAccessBarProps> = ({
  currentUser,
  onOpenAuth,
  onDirectGoogleLogin,
  onLogout,
  onOpenDropOffModal,
  onSwitchDemoRole,
}) => {
  const getRoleBadge = (role?: CollegeRole) => {
    switch (role) {
      case "student":
        return {
          label: "GHRCEN Student",
          bg: "bg-blue-50 text-blue-800 border-blue-200",
          icon: GraduationCap,
        };
      case "faculty":
        return {
          label: "Faculty / Professor",
          bg: "bg-purple-50 text-purple-800 border-purple-200",
          icon: UserCheck,
        };
      case "admin":
        return {
          label: "Campus Security Admin",
          bg: "bg-amber-50 text-amber-900 border-amber-300",
          icon: ShieldCheck,
        };
      case "staff":
        return {
          label: "Campus Staff",
          bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          icon: Building2,
        };
      default:
        return {
          label: "Campus Visitor / Guest",
          bg: "bg-stone-100 text-stone-700 border-stone-200",
          icon: Info,
        };
    }
  };

  const currentBadge = getRoleBadge(currentUser?.role);
  const IconComponent = currentBadge.icon;

  return (
    <section className="bg-white border-b border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* Left: Campus Identity & Current Session Status */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-bold text-stone-500 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>GHRCEN Campus Access:</span>
            </span>

            {currentUser ? (
              <div className="flex items-center gap-2 bg-stone-50 py-1 px-2.5 rounded-xl border border-stone-200">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${currentBadge.bg}`}>
                  <IconComponent className="w-3.5 h-3.5" />
                  {currentBadge.label}
                </span>

                <span className="font-bold text-stone-900">
                  {currentUser.name}
                </span>

                {currentUser.prnOrId && (
                  <span className="text-stone-500 font-mono text-[11px]">
                    ({currentUser.prnOrId})
                  </span>
                )}

                {currentUser.department && (
                  <span className="hidden sm:inline text-stone-500 text-[11px] border-l border-stone-200 pl-2">
                    {currentUser.department}
                  </span>
                )}

                {currentUser.isEmailVerified && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                    <ShieldCheck className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-amber-50 text-amber-900 px-2.5 py-1 rounded-xl border border-amber-200 font-medium">
                <Info className="w-3.5 h-3.5 text-amber-700" />
                <span>Browsing as Campus Guest. Sign in to claim or report lost items.</span>
              </div>
            )}
          </div>

          {/* Right: Explicit Login / Logout Controls & Drop-off Points */}
          <div className="flex items-center gap-2 self-end md:self-center">
            {/* Campus Drop-off Points Feature Button */}
            <button
              type="button"
              onClick={onOpenDropOffModal}
              className="px-2.5 py-1.5 rounded-lg text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 font-semibold transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-rose-600" />
              <span>Campus Security Desks</span>
            </button>

            {/* Quick Demo Role Switcher */}
            <div className="hidden lg:flex items-center gap-1 bg-stone-100 p-1 rounded-lg border border-stone-200 text-[11px]">
              <span className="text-stone-500 px-1 font-medium">Role:</span>
              <button
                type="button"
                onClick={() => onSwitchDemoRole("student")}
                className={`px-2 py-0.5 rounded font-semibold transition-all ${
                  currentUser?.role === "student"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => onSwitchDemoRole("faculty")}
                className={`px-2 py-0.5 rounded font-semibold transition-all ${
                  currentUser?.role === "faculty"
                    ? "bg-white text-purple-700 shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                Teacher
              </button>
              <button
                type="button"
                onClick={() => onSwitchDemoRole("admin")}
                className={`px-2 py-0.5 rounded font-semibold transition-all ${
                  currentUser?.role === "admin"
                    ? "bg-white text-amber-800 shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                Security Admin
              </button>
            </div>

            {/* Prominent Login / Logout Button */}
            {currentUser ? (
              <button
                id="topbar-signout-btn"
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  id="topbar-google-login-btn"
                  type="button"
                  onClick={onDirectGoogleLogin}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-stone-900 bg-amber-400 hover:bg-amber-300 shadow-xs transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>1-Click Google Sign In</span>
                </button>

                <button
                  id="topbar-signin-btn"
                  type="button"
                  onClick={() => onOpenAuth("login")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-stone-900 hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>College Login</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
