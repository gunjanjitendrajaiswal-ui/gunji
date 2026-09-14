export type ItemType = 'lost' | 'found';

export type CollegeRole = 'student' | 'faculty' | 'staff' | 'admin' | 'visitor';

export type CollegeDepartment =
  | 'Computer Science & Engg (CSE)'
  | 'Artificial Intelligence & Data Science (AI & DS)'
  | 'Information Technology (IT)'
  | 'Electronics & Telecommunication (E&TC)'
  | 'Mechanical Engineering'
  | 'Civil Engineering'
  | 'First Year Applied Sciences'
  | 'MBA & Management'
  | 'Campus Security & Estate'
  | 'General Campus / Other';

export type ItemCategory = 
  | 'ID Cards & Hall Tickets'
  | 'Calculators & Stationery'
  | 'Laptops & Gadgets'
  | 'Electronics & Chargers'
  | 'Wallets & Purses'
  | 'Keys & Bike Keys'
  | 'Lab Coats & Aprons'
  | 'Books & Notes'
  | 'Water Bottles & Lunchboxes'
  | 'Jewelry & Watches'
  | 'Other Campus Items';

export type ItemStatus = 'active' | 'claim_pending' | 'resolved' | 'archived';

export interface User {
  id: string;
  email: string;
  name: string;
  role: CollegeRole;
  department?: CollegeDepartment | string;
  prnOrId?: string; // Student PRN or Faculty ID
  avatar?: string;
  isEmailVerified: boolean;
  authProvider: 'email' | 'google';
  createdAt: string;
  itemsReportedCount?: number;
}

export interface ClaimRequest {
  claimId: string;
  itemId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPrnOrId?: string;
  userRole?: CollegeRole;
  claimProofDescription: string;
  verificationAnswerProvided?: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
}

export interface CampusDropOffPoint {
  name: string;
  building: string;
  roomOrDesk: string;
  incharge: string;
  contactNumber: string;
  hours: string;
}

export interface LostFoundItem {
  id: string;
  title: string;
  type: ItemType;
  category: ItemCategory;
  description: string;
  location: string;
  department?: string;
  date: string;
  imageUrl: string;
  aiTags: string[];
  aiIdentifiedAttributes?: {
    primaryColor?: string;
    brand?: string;
    distinctiveMarks?: string;
    model?: string;
    detectedStudentName?: string;
    detectedPrn?: string;
  };
  status: ItemStatus;
  contactInfo: string;
  handedOverToSecurity?: boolean;
  securityDeskLocation?: string;
  postedBy: {
    userId: string;
    name: string;
    email: string;
    role?: CollegeRole;
    department?: string;
    prnOrId?: string;
    isVerified: boolean;
  };
  secretVerificationQuestion?: string;
  claims?: ClaimRequest[];
  views: number;
  createdAt: string;
}

export interface AIRecognitionResult {
  title: string;
  category: ItemCategory;
  detectedAttributes: {
    primaryColor: string;
    brand?: string;
    distinctiveMarks?: string;
    model?: string;
    detectedStudentName?: string;
    detectedPrn?: string;
  };
  suggestedDescription: string;
  suggestedTags: string[];
  matchCandidates: Array<{
    item: LostFoundItem;
    matchScore: number;
    matchReasons: string[];
  }>;
}

export interface AdminActivityLog {
  id: string;
  action: string;
  timestamp: string;
  userName: string;
  details: string;
  type: 'auth' | 'item' | 'claim' | 'system';
}

export interface AdminStats {
  totalItems: number;
  lostItemsCount: number;
  foundItemsCount: number;
  resolvedCount: number;
  totalUsers: number;
  verifiedUsers: number;
  pendingClaims: number;
  recentActivity: AdminActivityLog[];
}
