import React from "react";
import { 
  MapPin, 
  Calendar, 
  Eye, 
  Sparkles, 
  ShieldCheck, 
  Tag, 
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  Building2,
  ShieldAlert
} from "lucide-react";
import type { LostFoundItem } from "../types";

interface ItemCardProps {
  item: LostFoundItem;
  onSelect: (item: LostFoundItem) => void;
  onClaim?: (item: LostFoundItem) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onSelect,
  onClaim,
}) => {
  const isLost = item.type === "lost";

  const getStatusBadge = () => {
    switch (item.status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Active
          </span>
        );
      case "claim_pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Claim Pending
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700 border border-stone-300">
            <CheckCircle2 className="w-3 h-3 text-stone-500" />
            Handed Over / Returned
          </span>
        );
      default:
        return null;
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "student":
        return (
          <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
            Student
          </span>
        );
      case "faculty":
        return (
          <span className="inline-flex items-center gap-0.5 text-[10px] text-purple-800 bg-purple-50 px-1.5 py-0.5 rounded font-medium">
            Faculty
          </span>
        );
      case "admin":
        return (
          <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
            Security Desk
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      id={`item-card-${item.id}`}
      onClick={() => onSelect(item)}
      className="group bg-white rounded-2xl border border-stone-200 hover:border-amber-500/50 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden cursor-pointer"
    >
      {/* Image Container with Badge */}
      <div className="relative aspect-4/3 w-full bg-stone-100 overflow-hidden">
        <img
          src={item.imageUrl}
          alt={item.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = isLost 
              ? "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&q=80&w=800" 
              : "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=800";
          }}
        />

        {/* Type Badge (Lost vs Found) */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-xs ${
              isLost
                ? "bg-rose-600 text-white"
                : "bg-emerald-700 text-white"
            }`}
          >
            {isLost ? "Lost Item" : "Found Item"}
          </span>
          {getStatusBadge()}
        </div>

        {/* Security Custody Banner if Deposited */}
        {item.handedOverToSecurity && (
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-stone-900/80 text-amber-300 text-[10px] font-bold backdrop-blur-xs flex items-center gap-1 border border-amber-400/30">
            <ShieldCheck className="w-3 h-3 text-amber-400" />
            <span>In Security Custody</span>
          </div>
        )}

        {/* Views counter */}
        <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-stone-900/70 text-white text-[10px] font-medium backdrop-blur-xs flex items-center gap-1">
          <Eye className="w-3 h-3" />
          <span>{item.views} views</span>
        </div>
      </div>

      {/* Card Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Date */}
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
            <span className="font-semibold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md truncate max-w-[180px]">
              {item.category}
            </span>
            <span className="flex items-center gap-1 text-[11px]">
              <Calendar className="w-3 h-3" />
              {item.date}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-stone-900 text-base line-clamp-1 group-hover:text-amber-800 transition-colors">
            {item.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">
            {item.description}
          </p>

          {/* Student Identified Highlight if present in AI attributes */}
          {item.aiIdentifiedAttributes?.detectedStudentName && (
            <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-900 bg-blue-50/90 border border-blue-200 px-2 py-0.5 rounded-md">
              <GraduationCap className="w-3.5 h-3.5 text-blue-700" />
              <span>Owner on ID: {item.aiIdentifiedAttributes.detectedStudentName}</span>
            </div>
          )}

          {/* Campus Location */}
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-stone-600">
            <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span className="truncate">{item.location}</span>
          </div>

          {/* Security Desk detail if present */}
          {item.securityDeskLocation && (
            <div className="mt-1 text-[11px] text-amber-900 font-medium flex items-center gap-1">
              <Building2 className="w-3 h-3 text-amber-700 shrink-0" />
              <span className="truncate">Safe Desk: {item.securityDeskLocation}</span>
            </div>
          )}

          {/* Tags */}
          {item.aiTags && item.aiTags.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1">
              {item.aiTags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-0.5 text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-medium"
                >
                  <Tag className="w-2.5 h-2.5 text-stone-400" />
                  {tag}
                </span>
              ))}
              {item.aiTags.length > 3 && (
                <span className="text-[10px] text-stone-400 self-center">
                  +{item.aiTags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer info: Poster & Action */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-stone-600">
            <span className="w-5 h-5 rounded-full bg-stone-200 text-[10px] font-bold text-stone-700 flex items-center justify-center uppercase">
              {item.postedBy.name.charAt(0)}
            </span>
            <span className="truncate max-w-[95px] font-semibold text-stone-800">
              {item.postedBy.name}
            </span>
            {getRoleBadge(item.postedBy.collegeRole)}
            {item.postedBy.isVerified && (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" title="Verified Campus User" />
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(item);
            }}
            className="inline-flex items-center gap-1 font-bold text-stone-900 hover:text-amber-800 group-hover:translate-x-0.5 transition-all"
          >
            <span>View</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
