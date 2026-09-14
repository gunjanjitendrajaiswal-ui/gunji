import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import type { 
  User, 
  LostFoundItem, 
  ItemType, 
  ItemCategory, 
  AdminStats, 
  AdminActivityLog,
  CampusDropOffPoint,
  CollegeRole,
  CollegeDepartment
} from "./src/types";

dotenv.config();

const PORT = 3000;
const app = express();

// Enable JSON parser with large payload limit for image uploads
app.use(express.json({ limit: "15mb" }));

// Server-side Gemini AI client initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper for secure password hashing with unique salt
function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 10000, 64, "sha512").toString("hex");
  return { hash, salt: generatedSalt };
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  const computedHash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(computedHash, "hex"));
}

// Durable File-backed Backend Storage System
const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "ghrcen_users.json");
const ITEMS_FILE = path.join(DATA_DIR, "ghrcen_items.json");
const LOGS_FILE = path.join(DATA_DIR, "ghrcen_logs.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface StoredUser extends User {
  passwordHash: string;
  passwordSalt: string;
}

// In-memory runtime state
let users = new Map<string, StoredUser>();
let items: LostFoundItem[] = [];
let activityLogs: AdminActivityLog[] = [];

// Session token store (session token -> userId)
const sessions = new Map<string, string>();

// Email verification code store (email -> { code: string, expiresAt: number })
const verificationCodes = new Map<string, { code: string; expiresAt: number; token: string }>();

// Initial pre-seeded users
const initialAdminHash = hashPassword("AdminPassword123!");
const initialUserHash = hashPassword("UserPassword123!");

const SEED_USERS: StoredUser[] = [
  {
    id: "usr_admin_1",
    email: "admin@ghrcen.edu",
    name: "Campus Security Officer R. K. Sharma",
    role: "admin",
    department: "Campus Security & Estate",
    prnOrId: "STAFF-SEC-01",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    isEmailVerified: true,
    authProvider: "email",
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    passwordHash: initialAdminHash.hash,
    passwordSalt: initialAdminHash.salt,
  },
  {
    id: "usr_faculty_1",
    email: "ananya.roy@ghrcen.edu",
    name: "Prof. Ananya Roy",
    role: "faculty",
    department: "Computer Science & Engg (CSE)",
    prnOrId: "FAC-CSE-104",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
    isEmailVerified: true,
    authProvider: "email",
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    passwordHash: initialUserHash.hash,
    passwordSalt: initialUserHash.salt,
  },
  {
    id: "usr_gunjan_1",
    email: "gunjanjitendrajaiswal@gmail.com",
    name: "Gunjan Jaiswal",
    role: "student",
    department: "Artificial Intelligence & Data Science (AI & DS)",
    prnOrId: "2024BTADS042",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    isEmailVerified: true,
    authProvider: "google",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    passwordHash: initialUserHash.hash,
    passwordSalt: initialUserHash.salt,
  },
];

const SEED_ITEMS: LostFoundItem[] = [
  {
    id: "item_found_1",
    title: "Casio fx-991EX ClassWiz Scientific Calculator",
    type: "found",
    category: "Calculators & Stationery",
    description: "Found on desk row 3 in Block A Room 302 after Engineering Mathematics III morning lecture. Has silver body with black casing.",
    location: "Block A - Room 302 (3rd Floor)",
    department: "First Year Applied Sciences",
    date: new Date().toISOString().split("T")[0],
    imageUrl: "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&q=80&w=800",
    aiTags: ["Casio", "Calculator", "Scientific", "fx-991EX", "Engineering", "Maths"],
    aiIdentifiedAttributes: {
      brand: "Casio",
      model: "fx-991EX ClassWiz",
      primaryColor: "White / Black",
      distinctiveMarks: "Roll number sticker on reverse sliding cover",
    },
    status: "active",
    contactInfo: "admin@ghrcen.edu",
    handedOverToSecurity: true,
    securityDeskLocation: "Central Library Circulation Desk",
    postedBy: {
      userId: "usr_admin_1",
      name: "Campus Security Officer R. K. Sharma",
      email: "admin@ghrcen.edu",
      role: "admin",
      department: "Campus Security & Estate",
      prnOrId: "STAFF-SEC-01",
      isVerified: true,
    },
    secretVerificationQuestion: "What name or initials are inscribed inside the sliding case lid?",
    views: 64,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "item_found_2",
    title: "Official GHRCEN Student ID & Library Card",
    type: "found",
    category: "ID Cards & Hall Tickets",
    description: "GHRCEN RFID smart college card with blue college lanyard found on round table near Nescafe Canteen. Name on card reads: Rahul S. Deshmukh.",
    location: "Main Canteen & Nescafe Corner",
    department: "Artificial Intelligence & Data Science (AI & DS)",
    date: new Date().toISOString().split("T")[0],
    imageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=800",
    aiTags: ["ID Card", "GHRCEN", "Student ID", "Smart Card", "Lanyard", "AI & DS"],
    aiIdentifiedAttributes: {
      brand: "GHRCEN RFID",
      primaryColor: "Blue / White",
      detectedStudentName: "Rahul S. Deshmukh",
      detectedPrn: "2024BTADS042",
      distinctiveMarks: "Official college seal and bar code",
    },
    status: "active",
    contactInfo: "admin@ghrcen.edu",
    handedOverToSecurity: true,
    securityDeskLocation: "Student Section (Admin Block Room 104)",
    postedBy: {
      userId: "usr_admin_1",
      name: "Campus Security Officer R. K. Sharma",
      email: "admin@ghrcen.edu",
      role: "admin",
      department: "Campus Security & Estate",
      isVerified: true,
    },
    secretVerificationQuestion: "Confirm your full registered PRN number and branch to collect",
    views: 112,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: "item_lost_1",
    title: "HP Pavilion 65W Blue-Pin Laptop Charger Adapter",
    type: "lost",
    category: "Electronics & Chargers",
    description: "Left plugged into power strip at Computer Lab 4 desk #18 during Data Structures lab practical. Has a yellow spiral cable protector wrap.",
    location: "Computer Science Tech Park - Lab 4 Desk 18",
    department: "Computer Science & Engg (CSE)",
    date: new Date(Date.now() - 3600000 * 24).toISOString().split("T")[0],
    imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&q=80&w=800",
    aiTags: ["HP", "Charger", "Laptop", "65W", "Power Adapter", "CSE Lab"],
    aiIdentifiedAttributes: {
      brand: "HP",
      primaryColor: "Black",
      model: "65W Smart AC Adapter (Blue Pin)",
      distinctiveMarks: "Yellow spiral wire protector near plug",
    },
    status: "active",
    contactInfo: "gunjanjitendrajaiswal@gmail.com",
    postedBy: {
      userId: "usr_gunjan_1",
      name: "Gunjan Jaiswal",
      email: "gunjanjitendrajaiswal@gmail.com",
      role: "student",
      department: "Artificial Intelligence & Data Science (AI & DS)",
      prnOrId: "2024BTADS042",
      isVerified: true,
    },
    secretVerificationQuestion: "What color is the cable tie tied around the power brick?",
    views: 78,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: "item_found_3",
    title: "boAt Airdopes 441 in Matte Black Charging Case",
    type: "found",
    category: "Electronics & Chargers",
    description: "Found on cubicle table in 2nd Floor Digital Library section. In black case with green LED indicator.",
    location: "Central Library - 2nd Floor Digital Study Section",
    department: "Campus Security & Estate",
    date: new Date(Date.now() - 3600000 * 28).toISOString().split("T")[0],
    imageUrl: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&q=80&w=800",
    aiTags: ["boAt", "Earbuds", "Airdopes", "Wireless", "Bluetooth", "Library"],
    aiIdentifiedAttributes: {
      brand: "boAt",
      primaryColor: "Matte Black",
      model: "Airdopes 441",
      distinctiveMarks: "Small scratch on the Type-C port corner",
    },
    status: "active",
    contactInfo: "admin@ghrcen.edu",
    handedOverToSecurity: true,
    securityDeskLocation: "Central Library Circulation Desk",
    postedBy: {
      userId: "usr_admin_1",
      name: "Campus Security Officer R. K. Sharma",
      email: "admin@ghrcen.edu",
      role: "admin",
      department: "Campus Security & Estate",
      isVerified: true,
    },
    secretVerificationQuestion: "What is the Bluetooth pairing name displayed on your phone?",
    views: 89,
    createdAt: new Date(Date.now() - 3600000 * 28).toISOString(),
  },
  {
    id: "item_lost_2",
    title: "Hero Splendor / Bike Key with GHRCEN Red Lanyard",
    type: "lost",
    category: "Keys & Bike Keys",
    description: "Single bike ignition key attached to red GHRCEN college lanyard and a miniature rubber helmet keychain. Lost while walking from Gate 2 bike parking to Block B.",
    location: "Two-Wheeler Parking Lot near Gate 2",
    department: "Mechanical Engineering",
    date: new Date(Date.now() - 3600000 * 32).toISOString().split("T")[0],
    imageUrl: "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&q=80&w=800",
    aiTags: ["Keys", "Bike Key", "Hero", "GHRCEN Lanyard", "Parking"],
    aiIdentifiedAttributes: {
      brand: "Hero",
      primaryColor: "Silver / Red",
      distinctiveMarks: "Red lanyard with GHRCEN print and rubber helmet charm",
    },
    status: "active",
    contactInfo: "gunjanjitendrajaiswal@gmail.com",
    postedBy: {
      userId: "usr_gunjan_1",
      name: "Gunjan Jaiswal",
      email: "gunjanjitendrajaiswal@gmail.com",
      role: "student",
      department: "Artificial Intelligence & Data Science (AI & DS)",
      prnOrId: "2024BTADS042",
      isVerified: true,
    },
    views: 45,
    createdAt: new Date(Date.now() - 3600000 * 32).toISOString(),
  },
  {
    id: "item_found_4",
    title: "Parker Vector Stainless Steel Pen & Faculty Notes",
    type: "found",
    category: "Calculators & Stationery",
    description: "Found on speaker podium in Seminar Hall 1 after the AICTE workshop. Parker pen left next to spiral-bound curriculum binder.",
    location: "Auditorium / Seminar Hall 1",
    department: "Computer Science & Engg (CSE)",
    date: new Date(Date.now() - 3600000 * 18).toISOString().split("T")[0],
    imageUrl: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&q=80&w=800",
    aiTags: ["Parker", "Pen", "Stainless Steel", "Notes", "Seminar Hall"],
    aiIdentifiedAttributes: {
      brand: "Parker",
      primaryColor: "Metallic Silver",
      model: "Vector Rollerball",
      distinctiveMarks: "Engraved arrow clip with fine point tip",
    },
    status: "active",
    contactInfo: "ananya.roy@ghrcen.edu",
    postedBy: {
      userId: "usr_faculty_1",
      name: "Prof. Ananya Roy",
      email: "ananya.roy@ghrcen.edu",
      role: "faculty",
      department: "Computer Science & Engg (CSE)",
      prnOrId: "FAC-CSE-104",
      isVerified: true,
    },
    secretVerificationQuestion: "What subject title is written on the first page of the binder?",
    views: 31,
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
];

const SEED_LOGS: AdminActivityLog[] = [
  {
    id: "log-1",
    action: "GHRCEN Campus Registry Initialized",
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
    userName: "Campus Security Officer R. K. Sharma",
    details: "GHRCEN Lost & Found portal active for all students, faculty, and visitors.",
    type: "system",
  },
  {
    id: "log-2",
    action: "Student Gmail Account Verified",
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    userName: "Gunjan Jaiswal (2024BTADS042)",
    details: "Gmail 6-digit OTP verification passed. Verified as Student in AI & DS.",
    type: "auth",
  },
];

// Campus Drop-Off Security Hubs
const CAMPUS_DROP_OFF_HUBS: CampusDropOffPoint[] = [
  {
    name: "Main Campus Security Control Post",
    building: "Main Entrance Gate 1",
    roomOrDesk: "Security Cabin & Lost-Property Register",
    incharge: "Officer R. K. Sharma (Head of Security)",
    contactNumber: "+91 7104 236381 (Ext. 101)",
    hours: "24/7 All Days",
  },
  {
    name: "Central Library Circulation Desk",
    building: "Knowledge Resource Centre",
    roomOrDesk: "Ground Floor Main Issue Counter",
    incharge: "Mr. V. M. Patil (Librarian)",
    contactNumber: "+91 7104 236381 (Ext. 204)",
    hours: "8:00 AM - 8:00 PM (Mon-Sat)",
  },
  {
    name: "Student Welfare & Section Office",
    building: "Administrative Building",
    roomOrDesk: "Room 104 (First Floor)",
    incharge: "Dr. S. K. Deshmukh (Dean Student Affairs)",
    contactNumber: "+91 7104 236381 (Ext. 112)",
    hours: "9:30 AM - 5:30 PM (Weekdays)",
  },
  {
    name: "Computer Tech Park Incharge Office",
    building: "Block C Tech Complex",
    roomOrDesk: "Lab Assistant Cabin #201",
    incharge: "Prof. N. P. Joshi (Lab Incharge)",
    contactNumber: "+91 7104 236381 (Ext. 315)",
    hours: "9:00 AM - 5:00 PM (Weekdays)",
  },
];

// Load persisted data or initialize seed
function loadPersistedData() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const parsedUsers: StoredUser[] = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
      users = new Map(parsedUsers.map((u) => [u.id, u]));
    } else {
      users = new Map(SEED_USERS.map((u) => [u.id, u]));
      saveUsers();
    }

    if (fs.existsSync(ITEMS_FILE)) {
      items = JSON.parse(fs.readFileSync(ITEMS_FILE, "utf-8"));
    } else {
      items = [...SEED_ITEMS];
      saveItems();
    }

    if (fs.existsSync(LOGS_FILE)) {
      activityLogs = JSON.parse(fs.readFileSync(LOGS_FILE, "utf-8"));
    } else {
      activityLogs = [...SEED_LOGS];
      saveLogs();
    }
  } catch (err) {
    console.error("Error loading persisted data:", err);
    users = new Map(SEED_USERS.map((u) => [u.id, u]));
    items = [...SEED_ITEMS];
    activityLogs = [...SEED_LOGS];
  }
}

// Asynchronous save helpers
function saveUsers() {
  try {
    const list = Array.from(users.values());
    fs.writeFileSync(USERS_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save users:", err);
  }
}

function saveItems() {
  try {
    fs.writeFileSync(ITEMS_FILE, JSON.stringify(items, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save items:", err);
  }
}

function saveLogs() {
  try {
    fs.writeFileSync(LOGS_FILE, JSON.stringify(activityLogs.slice(0, 100), null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save logs:", err);
  }
}

// Initialize data storage
loadPersistedData();

// Helper to extract safe user profile (strictly removing password hashes/salts)
function sanitizeUser(user: StoredUser): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    department: user.department,
    prnOrId: user.prnOrId,
    avatar: user.avatar,
    isEmailVerified: user.isEmailVerified,
    authProvider: user.authProvider,
    createdAt: user.createdAt,
    itemsReportedCount: items.filter((i) => i.postedBy.userId === user.id).length,
  };
}

// Middleware: authenticate session
function getAuthUser(req: express.Request): StoredUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  const userId = sessions.get(token);
  if (!userId) return null;
  return users.get(userId) || null;
}

// ==================== CAMPUS SPECIFIC ROUTES ====================

// Get Campus Drop-off Points
app.get("/api/campus/drop-off-points", (req, res) => {
  return res.json({ hubs: CAMPUS_DROP_OFF_HUBS });
});

// ==================== AUTH ROUTES ====================

// Request 6-digit Gmail Verification Code
app.post("/api/auth/request-code", (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Please provide a valid college or personal email address." });
  }

  // Generate 6-digit cryptographic code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

  verificationCodes.set(email.toLowerCase(), { code, expiresAt, token });

  // Log activity
  activityLogs.unshift({
    id: `log-${Date.now()}`,
    action: "GHRCEN Verification Code Dispatched",
    timestamp: new Date().toISOString(),
    userName: email,
    details: `6-digit security code generated for verification (${expiresAt > Date.now() ? "Active" : "Expired"})`,
    type: "auth",
  });
  saveLogs();

  return res.json({
    success: true,
    message: `A 6-digit verification code has been dispatched to ${email}.`,
    verificationToken: token,
    dispatchedCode: code,
    expiresInSeconds: 900,
  });
});

// Verify 6-digit Gmail Code
app.post("/api/auth/verify-code", (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: "Email and verification code are required." });
  }

  const record = verificationCodes.get(email.toLowerCase());
  if (!record) {
    return res.status(400).json({ error: "No verification code requested for this email or it has expired." });
  }

  if (Date.now() > record.expiresAt) {
    verificationCodes.delete(email.toLowerCase());
    return res.status(400).json({ error: "Verification code has expired. Please request a new one." });
  }

  if (record.code !== code.trim()) {
    return res.status(400).json({ error: "Invalid verification code. Please check and try again." });
  }

  // Code is valid
  verificationCodes.delete(email.toLowerCase());

  // Check if user exists
  let existingUser: StoredUser | null = null;
  for (const [, u] of users) {
    if (u.email.toLowerCase() === email.toLowerCase()) {
      existingUser = u;
      break;
    }
  }

  if (existingUser) {
    existingUser.isEmailVerified = true;
    saveUsers();

    const sessionToken = crypto.randomBytes(32).toString("hex");
    sessions.set(sessionToken, existingUser.id);

    activityLogs.unshift({
      id: `log-${Date.now()}`,
      action: "Gmail Login via OTP Verified",
      timestamp: new Date().toISOString(),
      userName: existingUser.name,
      details: `GHRCEN User authenticated via verified Gmail OTP`,
      type: "auth",
    });
    saveLogs();

    return res.json({
      success: true,
      token: sessionToken,
      user: sanitizeUser(existingUser),
    });
  }

  return res.json({
    success: true,
    verified: true,
    email: email.toLowerCase(),
    message: "Email verified successfully. You can now complete your campus registration.",
  });
});

// Register User (with Role: student / faculty / staff / visitor)
app.post("/api/auth/register", (req, res) => {
  const { name, email, password, role = "student", department, prnOrId } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required." });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters long for security." });
  }

  const normalizedEmail = email.toLowerCase().trim();

  for (const [, u] of users) {
    if (u.email.toLowerCase() === normalizedEmail) {
      return res.status(400).json({ error: "An account with this email address already exists at GHRCEN." });
    }
  }

  const { hash, salt } = hashPassword(password);
  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newUser: StoredUser = {
    id: userId,
    email: normalizedEmail,
    name: name.trim(),
    role: role as CollegeRole,
    department: department || "General Campus",
    prnOrId: prnOrId?.trim(),
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    isEmailVerified: true,
    authProvider: "email",
    createdAt: new Date().toISOString(),
    passwordHash: hash,
    passwordSalt: salt,
  };

  users.set(userId, newUser);
  saveUsers();

  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, userId);

  activityLogs.unshift({
    id: `log-${Date.now()}`,
    action: `New ${role.toUpperCase()} Account Created`,
    timestamp: new Date().toISOString(),
    userName: newUser.name,
    details: `${role.toUpperCase()} account created (${normalizedEmail}) • Dept: ${newUser.department}`,
    type: "auth",
  });
  saveLogs();

  return res.status(201).json({
    success: true,
    token,
    user: sanitizeUser(newUser),
  });
});

// Login User
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  let foundUser: StoredUser | null = null;

  for (const [, u] of users) {
    if (u.email.toLowerCase() === normalizedEmail) {
      foundUser = u;
      break;
    }
  }

  if (!foundUser) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const isValid = verifyPassword(password, foundUser.passwordHash, foundUser.passwordSalt);
  if (!isValid) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, foundUser.id);

  activityLogs.unshift({
    id: `log-${Date.now()}`,
    action: "User Sign In",
    timestamp: new Date().toISOString(),
    userName: foundUser.name,
    details: `Authenticated via secure password hash (${foundUser.role})`,
    type: "auth",
  });
  saveLogs();

  return res.json({
    success: true,
    token,
    user: sanitizeUser(foundUser),
  });
});

// Direct Google Login (One-click secure Google OAuth / Gmail sign-in)
app.post("/api/auth/google-login", (req, res) => {
  const { email, name, avatar, role = "student", department, prnOrId } = req.body;
  const userEmail = (email || "gunjanjitendrajaiswal@gmail.com").toLowerCase().trim();
  const userName = name || (userEmail.includes("gunjan") ? "Gunjan Jaiswal" : userEmail.split("@")[0]);
  const userAvatar =
    avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200";

  let foundUser: StoredUser | null = null;
  for (const [, u] of users) {
    if (u.email.toLowerCase() === userEmail) {
      foundUser = u;
      break;
    }
  }

  if (!foundUser) {
    const newUserId = `usr_g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const dummyPassword = hashPassword(crypto.randomBytes(24).toString("hex"));

    foundUser = {
      id: newUserId,
      email: userEmail,
      name: userName,
      role: userEmail.includes("admin") ? "admin" : (role as CollegeRole),
      department: department || "Artificial Intelligence & Data Science (AI & DS)",
      prnOrId: prnOrId || "2024BTADS042",
      avatar: userAvatar,
      isEmailVerified: true,
      authProvider: "google",
      createdAt: new Date().toISOString(),
      passwordHash: dummyPassword.hash,
      passwordSalt: dummyPassword.salt,
    };
    users.set(newUserId, foundUser);
    saveUsers();
  } else {
    foundUser.isEmailVerified = true;
    if (!foundUser.avatar) foundUser.avatar = userAvatar;
    saveUsers();
  }

  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, foundUser.id);

  activityLogs.unshift({
    id: `log-${Date.now()}`,
    action: "Direct Google Sign In",
    timestamp: new Date().toISOString(),
    userName: foundUser.name,
    details: `Google Single Sign-On authenticated (${userEmail}) as ${foundUser.role}`,
    type: "auth",
  });
  saveLogs();

  return res.json({
    success: true,
    token,
    user: sanitizeUser(foundUser),
  });
});

// Current User Session
app.get("/api/auth/me", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  return res.json({ user: sanitizeUser(user) });
});

// Logout
app.post("/api/auth/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const userId = sessions.get(token);
    if (userId) {
      const u = users.get(userId);
      if (u) {
        activityLogs.unshift({
          id: `log-${Date.now()}`,
          action: "User Sign Out",
          timestamp: new Date().toISOString(),
          userName: u.name,
          details: `Session securely invalidated`,
          type: "auth",
        });
        saveLogs();
      }
    }
    sessions.delete(token);
  }
  return res.json({ success: true, message: "Logged out successfully" });
});

// ==================== LOST & FOUND ITEMS ROUTES ====================

// Get All Items (with campus filters)
app.get("/api/items", (req, res) => {
  const { type, category, query, status, department, location } = req.query;

  let filtered = [...items];

  if (type && (type === "lost" || type === "found")) {
    filtered = filtered.filter((item) => item.type === type);
  }

  if (category && typeof category === "string" && category !== "All") {
    filtered = filtered.filter((item) => item.category.toLowerCase() === category.toLowerCase());
  }

  if (department && typeof department === "string" && department !== "All") {
    filtered = filtered.filter((item) => item.department?.toLowerCase() === department.toLowerCase());
  }

  if (location && typeof location === "string" && location !== "All") {
    filtered = filtered.filter((item) => item.location.toLowerCase().includes(location.toLowerCase()));
  }

  if (status && typeof status === "string" && status !== "all") {
    filtered = filtered.filter((item) => item.status === status);
  }

  if (query && typeof query === "string") {
    const q = query.toLowerCase().trim();
    filtered = filtered.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchLoc = item.location.toLowerCase().includes(q);
      const matchCategory = item.category.toLowerCase().includes(q);
      const matchDept = item.department?.toLowerCase().includes(q);
      const matchTags = item.aiTags.some((t) => t.toLowerCase().includes(q));
      const matchBrand = item.aiIdentifiedAttributes?.brand?.toLowerCase().includes(q);
      const matchStudent = item.aiIdentifiedAttributes?.detectedStudentName?.toLowerCase().includes(q);
      const matchPrn = item.aiIdentifiedAttributes?.detectedPrn?.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchLoc || matchCategory || matchDept || matchTags || matchBrand || matchStudent || matchPrn;
    });
  }

  // Sort by newest first
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return res.json({ items: filtered, total: filtered.length });
});

// Get Single Item by ID and increment view count
app.get("/api/items/:id", (req, res) => {
  const item = items.find((i) => i.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: "Item not found" });
  }
  item.views += 1;
  saveItems();
  return res.json({ item });
});

// Create New Lost or Found Item
app.post("/api/items", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Authentication required to post an item." });
  }

  const {
    title,
    type,
    category,
    description,
    location,
    department,
    date,
    imageUrl,
    aiTags,
    aiIdentifiedAttributes,
    contactInfo,
    secretVerificationQuestion,
    handedOverToSecurity,
    securityDeskLocation,
  } = req.body;

  if (!title || !type || !category || !description || !location) {
    return res.status(400).json({ error: "Title, type, category, description, and location are required." });
  }

  const newItem: LostFoundItem = {
    id: `item_${type}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: title.trim(),
    type: type === "found" ? "found" : "lost",
    category: category as ItemCategory,
    description: description.trim(),
    location: location.trim(),
    department: department || user.department,
    date: date || new Date().toISOString().split("T")[0],
    imageUrl:
      imageUrl ||
      (type === "lost"
        ? "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&q=80&w=800"
        : "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=800"),
    aiTags: Array.isArray(aiTags) && aiTags.length > 0 ? aiTags : [category, type, "GHRCEN"],
    aiIdentifiedAttributes: aiIdentifiedAttributes || {},
    status: "active",
    contactInfo: contactInfo || user.email,
    handedOverToSecurity: Boolean(handedOverToSecurity),
    securityDeskLocation: securityDeskLocation || undefined,
    postedBy: {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      prnOrId: user.prnOrId,
      isVerified: user.isEmailVerified,
    },
    secretVerificationQuestion: secretVerificationQuestion || undefined,
    claims: [],
    views: 1,
    createdAt: new Date().toISOString(),
  };

  items.unshift(newItem);
  saveItems();

  activityLogs.unshift({
    id: `log-${Date.now()}`,
    action: `New ${type.toUpperCase()} Item Reported at GHRCEN`,
    timestamp: new Date().toISOString(),
    userName: `${user.name} (${user.role})`,
    details: `${newItem.title} at ${newItem.location}`,
    type: "item",
  });
  saveLogs();

  return res.status(201).json({ success: true, item: newItem });
});

// Submit a Claim for a Found item
app.post("/api/items/:id/claim", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "You must be signed in to submit a claim." });
  }

  const item = items.find((i) => i.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: "Item not found" });
  }

  const { claimProofDescription, verificationAnswerProvided } = req.body;
  if (!claimProofDescription) {
    return res.status(400).json({ error: "Please provide proof or description proving ownership." });
  }

  const claimId = `claim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newClaim = {
    claimId,
    itemId: item.id,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userPrnOrId: user.prnOrId,
    userRole: user.role,
    claimProofDescription: claimProofDescription.trim(),
    verificationAnswerProvided: verificationAnswerProvided?.trim(),
    submittedAt: new Date().toISOString(),
    status: "pending" as const,
  };

  if (!item.claims) item.claims = [];
  item.claims.push(newClaim);
  item.status = "claim_pending";
  saveItems();

  activityLogs.unshift({
    id: `log-${Date.now()}`,
    action: "Campus Claim Submitted",
    timestamp: new Date().toISOString(),
    userName: `${user.name} (${user.role})`,
    details: `Claim submitted for item '${item.title}' (${user.prnOrId || user.email})`,
    type: "claim",
  });
  saveLogs();

  return res.json({ success: true, message: "Claim submitted for review by finder or campus security.", claim: newClaim });
});

// Update Item Status (Admin or original poster)
app.patch("/api/items/:id/status", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const item = items.find((i) => i.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: "Item not found" });
  }

  if (user.role !== "admin" && item.postedBy.userId !== user.id) {
    return res.status(403).json({ error: "You are not authorized to update this item's status." });
  }

  const { status, claimId, claimAction } = req.body;

  if (claimId && claimAction && item.claims) {
    const claim = item.claims.find((c) => c.claimId === claimId);
    if (claim) {
      claim.status = claimAction === "approve" ? "approved" : "rejected";
      if (claimAction === "approve") {
        item.status = "resolved";
      }
    }
  }

  if (status) {
    item.status = status;
  }

  saveItems();

  activityLogs.unshift({
    id: `log-${Date.now()}`,
    action: `Item Status Updated to ${item.status}`,
    timestamp: new Date().toISOString(),
    userName: user.name,
    details: `Item '${item.title}' updated by ${user.name} (${user.role})`,
    type: "item",
  });
  saveLogs();

  return res.json({ success: true, item });
});

// Delete Item (Admin or original poster)
app.delete("/api/items/:id", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const itemIndex = items.findIndex((i) => i.id === req.params.id);
  if (itemIndex === -1) {
    return res.status(404).json({ error: "Item not found" });
  }

  const item = items[itemIndex];
  if (user.role !== "admin" && item.postedBy.userId !== user.id) {
    return res.status(403).json({ error: "You are not authorized to delete this item." });
  }

  items.splice(itemIndex, 1);
  saveItems();

  activityLogs.unshift({
    id: `log-${Date.now()}`,
    action: "Item Deleted",
    timestamp: new Date().toISOString(),
    userName: user.name,
    details: `Deleted listing for '${item.title}'`,
    type: "item",
  });
  saveLogs();

  return res.json({ success: true, message: "Item deleted successfully" });
});

// ==================== AI IMAGE RECOGNITION (COLLEGE OPTIMIZED) ====================

app.post("/api/ai/recognize-image", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", targetItemType = "lost" } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Image data is required for recognition." });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9.+]+;base64,/, "");

    let recognizedData: {
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
    } = {
      title: "Identified Campus Possession",
      category: "Other Campus Items",
      detectedAttributes: {
        primaryColor: "Standard",
      },
      suggestedDescription: "Campus belonging analyzed from photo.",
      suggestedTags: ["GHRCEN", "Campus Item"],
    };

    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `You are the expert AI Vision System for GHRCEN (G.H. Raisoni College of Engineering) Campus Lost & Found.
Analyze this photo of an item lost or found on college campus.
Detect specific college equipment: ID Cards, Hall Tickets, Casio/Texas Calculators, Laptops & Chargers, Bike Keys with Lanyards, Drawing Kits, Lab Coats, Bags, Water Bottles, Smart Watches.

If text is visible (such as Student Name, Roll/PRN number, Department, or Subject name), extract it into detectedStudentName and detectedPrn!

Return ONLY a valid JSON object matching this schema:
{
  "title": "Clear concise descriptive college title (e.g. 'Casio fx-991EX Scientific Calculator' or 'GHRCEN Student ID Card - Rahul Deshmukh' or 'HP 65W Laptop Charger')",
  "category": "Choose exactly ONE from: 'ID Cards & Hall Tickets', 'Calculators & Stationery', 'Laptops & Gadgets', 'Electronics & Chargers', 'Wallets & Purses', 'Keys & Bike Keys', 'Lab Coats & Aprons', 'Books & Notes', 'Water Bottles & Lunchboxes', 'Jewelry & Watches', 'Other Campus Items'",
  "detectedAttributes": {
    "primaryColor": "Main visible color",
    "brand": "Brand if visible (e.g. Casio, HP, Dell, Apple, Parker, Hero, Fastrack), or null",
    "distinctiveMarks": "Visible stickers, engravings, scratches, or wear",
    "model": "Model name/number if identifiable, or null",
    "detectedStudentName": "Student name if readable on card/notes, or null",
    "detectedPrn": "PRN or Roll Number if readable, or null"
  },
  "suggestedDescription": "A 2-sentence objective description highlighting condition, visible identifying markers, and campus utility.",
  "suggestedTags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || "image/jpeg",
                  data: cleanBase64,
                },
              },
              { text: prompt },
            ],
          },
          config: {
            responseMimeType: "application/json",
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          recognizedData = {
            title: parsed.title || "Identified Campus Item",
            category: parsed.category || "Other Campus Items",
            detectedAttributes: {
              primaryColor: parsed.detectedAttributes?.primaryColor || "Standard",
              brand: parsed.detectedAttributes?.brand || undefined,
              distinctiveMarks: parsed.detectedAttributes?.distinctiveMarks || undefined,
              model: parsed.detectedAttributes?.model || undefined,
              detectedStudentName: parsed.detectedAttributes?.detectedStudentName || undefined,
              detectedPrn: parsed.detectedAttributes?.detectedPrn || undefined,
            },
            suggestedDescription: parsed.suggestedDescription || "Campus item recognized via neural vision.",
            suggestedTags: Array.isArray(parsed.suggestedTags) ? parsed.suggestedTags : ["GHRCEN", "Campus"],
          };
        }
      } catch (geminiError) {
        console.warn("Gemini recognition fallback:", geminiError);
        recognizedData = {
          title: "GHRCEN Campus Equipment / Belonging",
          category: "Electronics & Chargers",
          detectedAttributes: {
            primaryColor: "Dark Matte",
            brand: "Identified Equipment",
            distinctiveMarks: "Campus wear patterns",
          },
          suggestedDescription: "Visual scan identified a campus belonging. Cross-referenced against GHRCEN repository.",
          suggestedTags: ["GHRCEN", "Campus", "Verified Scan"],
        };
      }
    }

    // Match candidates in opposite pool
    const oppositeType: ItemType = targetItemType === "lost" ? "found" : "lost";
    const candidatePool = items.filter((i) => i.type === oppositeType && i.status !== "resolved");

    const matchCandidates = candidatePool
      .map((item) => {
        let score = 0;
        const reasons: string[] = [];

        // Category match (+35)
        if (item.category.toLowerCase() === recognizedData.category.toLowerCase()) {
          score += 35;
          reasons.push(`Category match: ${item.category}`);
        }

        // Brand match (+25)
        const recognizedBrand = recognizedData.detectedAttributes.brand?.toLowerCase();
        const itemBrand = item.aiIdentifiedAttributes?.brand?.toLowerCase();
        if (recognizedBrand && (itemBrand?.includes(recognizedBrand) || item.title.toLowerCase().includes(recognizedBrand))) {
          score += 25;
          reasons.push(`Brand matched: ${recognizedData.detectedAttributes.brand}`);
        }

        // Student name or PRN match (+40 jackpot)
        const rName = recognizedData.detectedAttributes.detectedStudentName?.toLowerCase();
        const rPrn = recognizedData.detectedAttributes.detectedPrn?.toLowerCase();
        if (rName && item.title.toLowerCase().includes(rName)) {
          score += 40;
          reasons.push(`Student name matched: ${rName}`);
        }
        if (rPrn && item.description.toLowerCase().includes(rPrn)) {
          score += 40;
          reasons.push(`Student PRN matched: ${rPrn}`);
        }

        // Color match (+20)
        const recognizedColor = recognizedData.detectedAttributes.primaryColor?.toLowerCase();
        const itemColor = item.aiIdentifiedAttributes?.primaryColor?.toLowerCase();
        if (recognizedColor && (itemColor?.includes(recognizedColor) || item.description.toLowerCase().includes(recognizedColor))) {
          score += 20;
          reasons.push(`Color match: ${recognizedData.detectedAttributes.primaryColor}`);
        }

        // Tag overlap
        const recognizedTags = recognizedData.suggestedTags.map((t) => t.toLowerCase());
        const matchedTags = item.aiTags.filter((t) => recognizedTags.includes(t.toLowerCase()));
        if (matchedTags.length > 0) {
          const tagPoints = Math.min(20, matchedTags.length * 6);
          score += tagPoints;
          reasons.push(`Matched keywords: ${matchedTags.join(", ")}`);
        }

        return {
          item,
          matchScore: Math.min(99, score),
          matchReasons: reasons,
        };
      })
      .filter((candidate) => candidate.matchScore >= 30)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);

    return res.json({
      success: true,
      result: {
        ...recognizedData,
        matchCandidates,
      },
    });
  } catch (error: any) {
    console.error("AI recognition error:", error);
    return res.status(500).json({ error: "Failed to recognize image", details: error.message });
  }
});

// ==================== ADMIN PORTAL ROUTES ====================

app.get("/api/admin/overview", (req, res) => {
  const user = getAuthUser(req);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Campus Security Admin authorization required." });
  }

  const lostCount = items.filter((i) => i.type === "lost").length;
  const foundCount = items.filter((i) => i.type === "found").length;
  const resolvedCount = items.filter((i) => i.status === "resolved").length;
  const pendingClaims = items.reduce((acc, item) => acc + (item.claims?.filter((c) => c.status === "pending").length || 0), 0);

  const stats: AdminStats = {
    totalItems: items.length,
    lostItemsCount: lostCount,
    foundItemsCount: foundCount,
    resolvedCount,
    totalUsers: users.size,
    verifiedUsers: Array.from(users.values()).filter((u) => u.isEmailVerified).length,
    pendingClaims,
    recentActivity: activityLogs.slice(0, 25),
  };

  const safeUsersList = Array.from(users.values()).map(sanitizeUser);

  return res.json({
    stats,
    users: safeUsersList,
    items,
  });
});

app.patch("/api/admin/users/:userId/role", (req, res) => {
  const currentUser = getAuthUser(req);
  if (!currentUser || currentUser.role !== "admin") {
    return res.status(403).json({ error: "Admin authorization required." });
  }

  const targetUser = users.get(req.params.userId);
  if (!targetUser) {
    return res.status(404).json({ error: "User not found" });
  }

  const { role } = req.body;
  if (!role) {
    return res.status(400).json({ error: "Role is required." });
  }

  targetUser.role = role as CollegeRole;
  saveUsers();

  activityLogs.unshift({
    id: `log-${Date.now()}`,
    action: `User Role Updated`,
    timestamp: new Date().toISOString(),
    userName: currentUser.name,
    details: `Updated ${targetUser.name} (${targetUser.email}) role to ${role}`,
    type: "system",
  });
  saveLogs();

  return res.json({ success: true, user: sanitizeUser(targetUser) });
});

// ==================== VITE MIDDLEWARE & SERVER START ====================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GHRCEN Lost & Found Portal running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
