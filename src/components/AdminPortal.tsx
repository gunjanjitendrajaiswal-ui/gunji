import React, { useState, useEffect } from "react";
import { 
  Shield, 
  Users, 
  Package, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  Activity, 
  Search, 
  Filter, 
  Lock, 
  RefreshCw,
  Mail,
  UserCheck
} from "lucide-react";
import type { AdminStats, LostFoundItem, User, ClaimRequest } from "../types";

interface AdminPortalProps {
  currentUser: User | null;
  onSelectItem: (item: LostFoundItem) => void;
  authToken: string | null;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentUser,
  onSelectItem,
  authToken,
}) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [itemsList, setItemsList] = useState<LostFoundItem[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "claims" | "items" | "users" | "logs">("overview");
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search in items
  const [itemFilter, setItemFilter] = useState("");

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/overview", {
        headers: {
          Authorization: `Bearer ${authToken || ""}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load administrative portal");
      }
      setStats(data.stats);
      setItemsList(data.items);
      setUsersList(data.users);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [authToken]);

  // Handle claim decision
  const handleClaimDecision = async (itemId: string, claimId: string, action: "approve" | "reject") => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/items/${itemId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken || ""}`,
        },
        body: JSON.stringify({
          claimId,
          claimAction: action,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update claim");
      }
      setSuccessMsg(`Claim successfully ${action}d!`);
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchAdminData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle user role update
  const handleRoleToggle = async (userId: string, currentRole: "user" | "admin") => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken || ""}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update role");
      setSuccessMsg(`User role changed to ${newRole}`);
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchAdminData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete item
  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to remove this item from the platform?")) return;
    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken || ""}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete item");
      setSuccessMsg("Item removed from database");
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchAdminData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (currentUser?.role !== "admin") {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center max-w-lg mx-auto">
        <Lock className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-rose-900">Administrator Access Required</h2>
        <p className="text-xs text-rose-700 mt-2 leading-relaxed">
          The Admin Portal is restricted to authorized supervisors to verify ownership claims,
          audit security logs, and monitor lost and found reports.
        </p>
      </div>
    );
  }

  // Extract all pending claims
  const allClaims: Array<{ claim: ClaimRequest; item: LostFoundItem }> = [];
  itemsList.forEach((item) => {
    if (item.claims) {
      item.claims.forEach((claim) => {
        allClaims.push({ claim, item });
      });
    }
  });

  const pendingClaims = allClaims.filter((c) => c.claim.status === "pending");

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-stone-900">Administrative Oversight Portal</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                Supervisor
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Monitor active lost/found inventory, verify Gmail users, approve ownership claims & security logs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="p-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
              <span>Total Listings</span>
              <Package className="w-4 h-4 text-stone-400" />
            </div>
            <div className="text-2xl font-black text-stone-900">{stats.totalItems}</div>
            <div className="text-[11px] text-stone-500 mt-1 flex gap-2">
              <span className="text-rose-600 font-semibold">{stats.lostItemsCount} Lost</span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">{stats.foundItemsCount} Found</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
              <span>Resolved & Returned</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-stone-900">{stats.resolvedCount}</div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1">
              {stats.totalItems > 0 ? Math.round((stats.resolvedCount / stats.totalItems) * 100) : 0}% Resolution rate
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
              <span>Pending Claims</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600">{stats.pendingClaims}</div>
            <div className="text-[11px] text-stone-500 mt-1">
              Awaiting ownership verification
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
              <span>Registered Accounts</span>
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-stone-900">{stats.totalUsers}</div>
            <div className="text-[11px] text-stone-500 mt-1">
              <span className="text-indigo-600 font-semibold">{stats.verifiedUsers}</span> verified via Gmail
            </div>
          </div>
        </div>
      )}

      {/* Sub navigation tabs */}
      <div className="flex items-center gap-1 border-b border-stone-200 pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab("overview")}
          className={`px-3 py-2 rounded-xl transition-all ${
            activeSubTab === "overview"
              ? "bg-stone-900 text-white"
              : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
          }`}
        >
          System Overview
        </button>
        <button
          onClick={() => setActiveSubTab("claims")}
          className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeSubTab === "claims"
              ? "bg-stone-900 text-white"
              : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
          }`}
        >
          <span>Pending Claims</span>
          {pendingClaims.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white">
              {pendingClaims.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab("items")}
          className={`px-3 py-2 rounded-xl transition-all ${
            activeSubTab === "items"
              ? "bg-stone-900 text-white"
              : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
          }`}
        >
          All Inventory ({itemsList.length})
        </button>
        <button
          onClick={() => setActiveSubTab("users")}
          className={`px-3 py-2 rounded-xl transition-all ${
            activeSubTab === "users"
              ? "bg-stone-900 text-white"
              : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
          }`}
        >
          User Registry ({usersList.length})
        </button>
        <button
          onClick={() => setActiveSubTab("logs")}
          className={`px-3 py-2 rounded-xl transition-all ${
            activeSubTab === "logs"
              ? "bg-stone-900 text-white"
              : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
          }`}
        >
          Security Audit Logs
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeSubTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Claims Widget */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Pending Claims Needing Verification ({pendingClaims.length})</span>
              </h3>
              <button
                onClick={() => setActiveSubTab("claims")}
                className="text-xs text-amber-700 font-semibold hover:underline"
              >
                View all
              </button>
            </div>

            {pendingClaims.length === 0 ? (
              <p className="text-xs text-stone-500 py-6 text-center">
                All claims are up to date! No pending reviews at this time.
              </p>
            ) : (
              <div className="space-y-3">
                {pendingClaims.slice(0, 3).map(({ claim, item }) => (
                  <div
                    key={claim.claimId}
                    className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between font-semibold text-stone-900">
                      <span className="truncate">{item.title}</span>
                      <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        Pending
                      </span>
                    </div>
                    <p className="text-stone-600 line-clamp-2 italic">
                      Proof: "{claim.claimProofDescription}"
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-stone-200/60">
                      <span className="text-stone-500">{claim.userName} ({claim.userEmail})</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleClaimDecision(item.id, claim.claimId, "approve")}
                          disabled={actionLoading}
                          className="px-2 py-1 bg-emerald-600 text-white rounded-md font-bold text-[11px] hover:bg-emerald-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleClaimDecision(item.id, claim.claimId, "reject")}
                          disabled={actionLoading}
                          className="px-2 py-1 bg-stone-200 text-stone-700 rounded-md font-bold text-[11px] hover:bg-stone-300"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Security & Integrity Highlights */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Credential & Storage Security Status</span>
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-stone-900">User Passwords</p>
                  <p className="text-[11px] text-stone-500">
                    PBKDF2-SHA512 + Random 128-bit Salt per user. Never shared or visible.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  Protected
                </span>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-stone-900">Gmail Verification Process</p>
                  <p className="text-[11px] text-stone-500">
                    6-digit cryptographic PIN with 15-minute expiry token check.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  Active
                </span>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-stone-900">AI Vision Processing</p>
                  <p className="text-[11px] text-stone-500">
                    Gemini 3.8 Flash model on backend with isolated API key headers.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-bold text-[10px]">
                  Operational
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PENDING CLAIMS */}
      {activeSubTab === "claims" && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-stone-900">Claims Review Dashboard</h3>
            <span className="text-xs text-stone-500">
              {pendingClaims.length} awaiting review
            </span>
          </div>

          {allClaims.length === 0 ? (
            <p className="text-xs text-stone-500 py-8 text-center">
              No claims submitted across any items yet.
            </p>
          ) : (
            <div className="space-y-4">
              {allClaims.map(({ claim, item }) => (
                <div
                  key={claim.claimId}
                  className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-2">
                    <div>
                      <span className="text-[11px] text-stone-400 font-mono">Claim ID: {claim.claimId}</span>
                      <h4 
                        onClick={() => onSelectItem(item)}
                        className="text-sm font-bold text-stone-900 hover:text-amber-700 cursor-pointer"
                      >
                        Target Item: {item.title} ({item.category})
                      </h4>
                    </div>
                    <div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          claim.status === "approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : claim.status === "rejected"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {claim.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="font-semibold text-stone-700">Claimant Profile:</p>
                      <p className="text-stone-900 font-medium">{claim.userName}</p>
                      <p className="text-stone-500">{claim.userEmail}</p>
                      <p className="text-stone-400 text-[10px]">
                        Submitted {new Date(claim.submittedAt).toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-stone-700">Proof of Ownership Provided:</p>
                      <p className="text-stone-900 bg-white p-2 rounded-lg border border-stone-200 mt-1 leading-relaxed">
                        {claim.claimProofDescription}
                      </p>
                    </div>
                  </div>

                  {claim.verificationAnswerProvided && (
                    <div className="p-2.5 bg-amber-50/80 rounded-lg border border-amber-200 text-xs">
                      <span className="font-bold text-amber-900">Security Question Answer Provided: </span>
                      <span className="text-stone-800">{claim.verificationAnswerProvided}</span>
                    </div>
                  )}

                  {claim.status === "pending" && (
                    <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
                      <button
                        type="button"
                        onClick={() => handleClaimDecision(item.id, claim.claimId, "reject")}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg font-bold transition-colors"
                      >
                        Reject Claim
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClaimDecision(item.id, claim.claimId, "approve")}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors"
                      >
                        Approve & Mark Item Returned
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ALL INVENTORY */}
      {activeSubTab === "items" && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-bold text-stone-900">Platform Inventory Manager</h3>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={itemFilter}
                onChange={(e) => setItemFilter(e.target.value)}
                placeholder="Filter by title, category, poster..."
                className="pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-stone-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 bg-stone-50/50">
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Item Title</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Location & Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Reporter</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {itemsList
                  .filter((item) => {
                    if (!itemFilter) return true;
                    const f = itemFilter.toLowerCase();
                    return (
                      item.title.toLowerCase().includes(f) ||
                      item.category.toLowerCase().includes(f) ||
                      item.location.toLowerCase().includes(f) ||
                      item.postedBy.name.toLowerCase().includes(f)
                    );
                  })
                  .map((item) => (
                    <tr key={item.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            item.type === "lost"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-stone-900 max-w-[200px] truncate">
                        <button
                          onClick={() => onSelectItem(item)}
                          className="hover:underline text-left truncate max-w-full block"
                        >
                          {item.title}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-stone-600">{item.category}</td>
                      <td className="py-3 px-3 text-stone-500 truncate max-w-[150px]">
                        {item.location} ({item.date})
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            item.status === "resolved"
                              ? "bg-stone-200 text-stone-800"
                              : item.status === "claim_pending"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-stone-600">{item.postedBy.name}</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          title="Delete Listing"
                          className="text-stone-400 hover:text-rose-600 p-1 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: USER REGISTRY */}
      {activeSubTab === "users" && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-900">Registered Users & Security Roles</h3>
              <p className="text-xs text-stone-500">
                User passwords remain cryptographically shielded and never shared or viewed by anyone.
              </p>
            </div>
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
              {usersList.length} Total Users
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 bg-stone-50/50">
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Email Address</th>
                  <th className="py-2.5 px-3">Gmail Status</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Auth Method</th>
                  <th className="py-2.5 px-3">Created</th>
                  <th className="py-2.5 px-3 text-right">Role Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {usersList.map((user) => (
                  <tr key={user.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-3 font-semibold text-stone-900 flex items-center gap-2">
                      <img
                        src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span>{user.name}</span>
                    </td>
                    <td className="py-3 px-3 text-stone-600">{user.email}</td>
                    <td className="py-3 px-3">
                      {user.isEmailVerified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full">
                          Pending OTP
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          user.role === "admin"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-stone-100 text-stone-700"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-stone-500 uppercase text-[10px] font-semibold">
                      {user.authProvider}
                    </td>
                    <td className="py-3 px-3 text-stone-400 text-[11px]">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {user.id !== currentUser?.id ? (
                        <button
                          onClick={() => handleRoleToggle(user.id, user.role)}
                          className="px-2 py-1 text-[11px] font-semibold rounded-md border border-stone-300 hover:bg-stone-100 text-stone-700 transition-colors"
                        >
                          {user.role === "admin" ? "Demote to User" : "Make Admin"}
                        </button>
                      ) : (
                        <span className="text-[11px] text-stone-400 italic">Current Session</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: SECURITY AUDIT LOGS */}
      {activeSubTab === "logs" && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-600" />
              <span>Security Event Stream</span>
            </h3>
            <span className="text-xs text-stone-500">Live system audit</span>
          </div>

          <div className="space-y-2">
            {stats?.recentActivity.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 flex items-start justify-between gap-4 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">
                    {log.type === "auth" && <Lock className="w-3.5 h-3.5 text-amber-600" />}
                    {log.type === "item" && <Package className="w-3.5 h-3.5 text-rose-600" />}
                    {log.type === "claim" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    {log.type === "system" && <Shield className="w-3.5 h-3.5 text-indigo-600" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900">{log.action}</span>
                      <span className="text-[11px] text-stone-500 font-medium">({log.userName})</span>
                    </div>
                    <p className="text-stone-600 mt-0.5">{log.details}</p>
                  </div>
                </div>

                <span className="text-[11px] text-stone-400 font-mono whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
