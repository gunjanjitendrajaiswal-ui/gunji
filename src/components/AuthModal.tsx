import React, { useState } from "react";
import { 
  X, 
  Lock, 
  Mail, 
  User as UserIcon, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  KeyRound, 
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Info,
  GraduationCap,
  Building2,
  BookOpen
} from "lucide-react";
import type { User, CollegeRole, CollegeDepartment } from "../types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User, token: string) => void;
  initialMode?: "login" | "register";
  onVerificationCodeDispatched?: (code: string, email: string) => void;
}

const DEPARTMENTS: CollegeDepartment[] = [
  "Computer Science & Engg (CSE)",
  "Artificial Intelligence & Data Science (AI & DS)",
  "Information Technology (IT)",
  "Electronics & Telecommunication (E&TC)",
  "Mechanical Engineering",
  "Civil Engineering",
  "First Year Applied Sciences",
  "MBA & Management",
  "Campus Security & Estate",
  "General Campus / Other",
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = "login",
  onVerificationCodeDispatched,
}) => {
  const [mode, setMode] = useState<"login" | "register" | "verify">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<CollegeRole>("student");
  const [department, setDepartment] = useState<string>("Artificial Intelligence & Data Science (AI & DS)");
  const [prnOrId, setPrnOrId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [dispatchedCode, setDispatchedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Direct Google Login
  const handleGoogleLogin = async (overrideEmail?: string, overrideRole?: CollegeRole, overrideName?: string) => {
    setLoading(true);
    setError(null);
    try {
      const emailToUse = overrideEmail || email || "gunjanjitendrajaiswal@gmail.com";
      const nameToUse = overrideName || (emailToUse.includes("gunjan") ? "Gunjan Jaiswal" : undefined);
      const res = await fetch("/api/auth/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailToUse,
          name: nameToUse,
          role: overrideRole || role,
          department,
          prnOrId: prnOrId || (emailToUse.includes("gunjan") ? "2024BTADS042" : undefined),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Google authentication failed");
      }
      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  // Request Gmail Verification 6-digit Code
  const handleRequestVerificationCode = async (targetEmail: string) => {
    if (!targetEmail || !targetEmail.includes("@")) {
      setError("Please enter a valid Gmail address to receive your 6-digit security code.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch verification code");
      }
      setDispatchedCode(data.dispatchedCode);
      setInfoMessage(`Security code dispatched to ${targetEmail}. Code: ${data.dispatchedCode}`);
      if (onVerificationCodeDispatched) {
        onVerificationCodeDispatched(data.dispatchedCode, targetEmail);
      }
      setMode("verify");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Verify 6-digit code directly
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length < 6) {
      setError("Please enter the 6-digit verification code sent to your Gmail.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Code verification failed");
      }
      if (data.token && data.user) {
        onAuthSuccess(data.user, data.token);
        onClose();
        return;
      }
      setInfoMessage("Gmail verified! Proceeding with registration...");
      setMode("register");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Standard Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }
      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle User Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          department,
          prnOrId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }
      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Fill
  const fillDemoAccount = (roleType: CollegeRole) => {
    if (roleType === "admin") {
      setEmail("admin@ghrcen.edu");
      setPassword("AdminPassword123!");
      setMode("login");
    } else if (roleType === "faculty") {
      setEmail("ananya.roy@ghrcen.edu");
      setPassword("UserPassword123!");
      setMode("login");
    } else {
      setEmail("gunjanjitendrajaiswal@gmail.com");
      setPassword("UserPassword123!");
      setMode("login");
    }
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden max-h-[95vh] flex flex-col">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-stone-100 bg-stone-50">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-0.5">
              <Building2 className="w-3.5 h-3.5 text-amber-700" />
              <span>GHRCEN College Portal</span>
            </div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              {mode === "login" && "Sign In (Students & Faculty)"}
              {mode === "register" && "Create GHRCEN Account"}
              {mode === "verify" && "Gmail 6-Digit OTP Verification"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Direct Google Login Button */}
          {mode !== "verify" && (
            <div className="mb-4">
              <button
                type="button"
                id="direct-google-auth-button"
                onClick={() => handleGoogleLogin()}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-stone-300 bg-amber-50 hover:bg-amber-100/70 text-stone-900 font-semibold text-xs shadow-xs transition-all active:scale-98 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Direct Google Login (One-Click)</span>
              </button>
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-white px-2.5 text-stone-400 font-semibold tracking-wider">Or with email credentials</span>
                </div>
              </div>
            </div>
          )}

          {/* Feedback messages */}
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Login Form */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  College or Personal Email / Gmail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    id="login-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@ghrcen.edu or gmail"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-stone-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => handleRequestVerificationCode(email)}
                    className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold"
                  >
                    Send Gmail OTP?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    id="login-password-input"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="login-submit-button"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 active:scale-98 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? "Verifying..." : "Sign In to GHRCEN Account"}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center text-xs text-stone-600">
                New to GHRCEN Lost & Found?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode("register");
                  }}
                  className="text-amber-700 font-bold hover:underline"
                >
                  Register as Student / Teacher
                </button>
              </div>
            </form>
          )}

          {/* Registration Form with College-Level Roles */}
          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Gunjan Jaiswal"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Role at GHRCEN
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRole("student")}
                    className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition-all flex items-center justify-center gap-1 ${
                      role === "student"
                        ? "border-blue-600 bg-blue-50 text-blue-800"
                        : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                    }`}
                  >
                    <GraduationCap className="w-3 h-3" />
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("faculty")}
                    className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition-all flex items-center justify-center gap-1 ${
                      role === "faculty"
                        ? "border-purple-600 bg-purple-50 text-purple-800"
                        : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                    }`}
                  >
                    <BookOpen className="w-3 h-3" />
                    Teacher
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("visitor")}
                    className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition-all flex items-center justify-center gap-1 ${
                      role === "visitor"
                        ? "border-stone-900 bg-stone-900 text-white"
                        : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                    }`}
                  >
                    Visitor / Other
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full py-2 px-2 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {role === "faculty" ? "Faculty ID" : role === "student" ? "Student PRN" : "Contact ID"}
                  </label>
                  <input
                    type="text"
                    value={prnOrId}
                    onChange={(e) => setPrnOrId(e.target.value)}
                    placeholder={role === "faculty" ? "e.g. FAC-104" : "e.g. 2024BTADS042"}
                    className="w-full py-2 px-2 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-stone-700">
                    Email / Gmail
                  </label>
                  <button
                    type="button"
                    onClick={() => handleRequestVerificationCode(email)}
                    className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold"
                  >
                    Send 6-Digit OTP
                  </button>
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@ghrcen.edu or gmail"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Account Password (Secure PBKDF2 Hashed)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full pl-9 pr-10 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="register-submit-button"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 active:scale-98 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? "Registering..." : "Create GHRCEN Account"}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-1 text-center text-xs text-stone-600">
                Already registered?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode("login");
                  }}
                  className="text-amber-700 font-bold hover:underline"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}

          {/* 6-Digit Gmail Verification Screen */}
          {mode === "verify" && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="text-center p-3 bg-stone-50 rounded-xl border border-stone-200">
                <KeyRound className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-stone-900">Enter Gmail Verification PIN</h3>
                <p className="text-xs text-stone-500 mt-1">
                  Sent to <span className="font-semibold text-stone-800">{email}</span>
                </p>
                {dispatchedCode && (
                  <div className="mt-2 py-1.5 px-3 bg-amber-50 border border-amber-200 rounded-lg inline-block">
                    <span className="text-xs text-stone-600">Security PIN: </span>
                    <span className="font-mono font-bold text-sm tracking-widest text-amber-800">{dispatchedCode}</span>
                  </div>
                )}
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full text-center tracking-[0.4em] font-mono text-xl py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all font-bold"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || verificationCode.length !== 6}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 transition-all"
                >
                  {loading ? "Verifying..." : "Verify & Sign In"}
                </button>
              </div>
            </form>
          )}

          {/* Quick Demo Pre-filled Credentials */}
          <div className="mt-4 pt-3 border-t border-stone-100">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">
              <Info className="w-3 h-3" />
              <span>Quick College Personas (1-Click Test)</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => fillDemoAccount("student")}
                className="p-2 text-left bg-stone-50 hover:bg-blue-50 border border-stone-200 hover:border-blue-300 rounded-xl transition-all"
              >
                <p className="text-[11px] font-bold text-blue-900">Student</p>
                <p className="text-[9px] text-stone-500 truncate">Gunjan J. (AI&DS)</p>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount("faculty")}
                className="p-2 text-left bg-stone-50 hover:bg-purple-50 border border-stone-200 hover:border-purple-300 rounded-xl transition-all"
              >
                <p className="text-[11px] font-bold text-purple-900">Professor</p>
                <p className="text-[9px] text-stone-500 truncate">Prof. Roy (CSE)</p>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount("admin")}
                className="p-2 text-left bg-stone-50 hover:bg-amber-50 border border-stone-200 hover:border-amber-300 rounded-xl transition-all"
              >
                <p className="text-[11px] font-bold text-amber-900">Security</p>
                <p className="text-[9px] text-stone-500 truncate">Gate 1 Officer</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
