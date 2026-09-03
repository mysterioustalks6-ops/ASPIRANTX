// ============================================================================
// SHARED BACKEND STATE, STORES, UTILITIES, AND AUTH HELPERS
// ============================================================================
import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import { middleware as edgeMiddleware } from '../authMiddleware.js';
import { INITIAL_SYLLABUS_HIERARCHY, INITIAL_PYQS_DATABASE, INITIAL_QUESTION_BANK } from '../src/data/academicData.js';
import { COMPREHENSIVE_BOOKS_DATABASE } from '../src/data/booksData.js';
import { sendTransactionalEmail } from '../src/lib/email.js';

export { crypto, jwt, fs, path, os, edgeMiddleware, INITIAL_SYLLABUS_HIERARCHY, INITIAL_PYQS_DATABASE, INITIAL_QUESTION_BANK, COMPREHENSIVE_BOOKS_DATABASE, sendTransactionalEmail };

export const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded: Too many requests from this IP address.' },
});

export const adminMutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded: Too many administrative write operations from this IP.' },
});

export const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Payment rate limit exceeded: Too many payment attempts from this IP address.' },
});

export const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Rate limit exceeded: Too many AI requests. Please wait a few minutes before trying AI syllabus organization again.',
  },
});

export const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';

export const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';

export const SUPABASE_KEY = rawServiceKey || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!rawServiceKey || (process.env.VITE_SUPABASE_ANON_KEY && rawServiceKey === process.env.VITE_SUPABASE_ANON_KEY)) {
  console.error('CRITICAL: Service role key (SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY) is missing or equals the anon key! Admin settings will not persist. Set the real service_role key in deployment env vars.');
}

export const isSupabaseDbConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_KEY &&
  !SUPABASE_URL.includes('placeholder')
);

export const supabaseServer = isSupabaseDbConfigured
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

export const JWT_SECRET = process.env.JWT_SECRET || process.env.VITE_SUPABASE_ANON_KEY || 'aspirantx_dev_jwt_secret_fallback_key_2026';

if (!process.env.JWT_SECRET && !process.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('WARNING: JWT_SECRET environment variable is not set. Using default development secret.');
}

export function getWritableDataFilePath(): string {
  const candidateDirs = [
    path.join(process.cwd(), '.data'),
    path.join(os.tmpdir(), 'aspirantx_data'),
    os.tmpdir(),
  ];

  for (const dir of candidateDirs) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const testFile = path.join(dir, `.test_write_${Date.now()}`);
      fs.writeFileSync(testFile, 'test', 'utf-8');
      fs.unlinkSync(testFile);
      return path.join(dir, 'admin_store.json');
    } catch (_err) {
      continue;
    }
  }
  return path.join(os.tmpdir(), 'admin_store.json');
}

export const DESIGNATED_ADMIN_EMAIL = 'ambujyadav0010@gmail.com';

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  ip: string;
  requestId: string;
  endpoint: string;
  outcome: 'SUCCESS' | 'DENIED' | 'FAILED';
  details: string;
  room?: string;
  contentSnippet?: string;
  category?: string;
  reason?: string;
  beforeValue?: any;
  afterValue?: any;
}

export function recordAdminAuditLog(options: {
  user: string;
  action: string;
  details: string;
  ip?: string;
  requestId?: string;
  endpoint?: string;
  outcome?: 'SUCCESS' | 'DENIED' | 'FAILED';
  beforeValue?: any;
  afterValue?: any;
  department?: string;
}) {
  const newLog: any = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    user: options.user || 'anonymous',
    department: options.department || 'Unknown',
    action: options.action,
    ip: options.ip || '127.0.0.1',
    requestId: options.requestId || `req_${Date.now()}`,
    endpoint: options.endpoint || '/api/admin',
    outcome: options.outcome || 'SUCCESS',
    details: options.details,
    beforeValue: options.beforeValue,
    afterValue: options.afterValue,
  };

  blockedAuditLogs.unshift(newLog);
  if (blockedAuditLogs.length > 200) {
    blockedAuditLogs = blockedAuditLogs.slice(0, 200);
  }

  // Persist asynchronously to Primary Supabase DB if connected
  if (supabaseServer) {
    supabaseServer
      .from('audit_logs')
      .insert([newLog])
      .then(({ error }) => {
        if (error) console.error('Supabase Audit Log error:', error.message);
      });
  }

  saveAdminStoreToDisk();
}

export function addAdminAuditLogRecord(options: {
  action: string;
  performedBy?: string;
  target?: string;
  details: string;
}) {
  recordAdminAuditLog({
    user: options.performedBy || 'ADMIN',
    action: options.action,
    details: `${options.details} (Target: ${options.target || 'N/A'})`,
  });
}

export async function extractVerifiedUserFromReq(req: any): Promise<{ email: string; role: string; sub?: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7).trim();
  if (!token) return null;

  let verifiedEmail = '';
  let role = 'USER';
  let userId = 'user_dev';
  let tokenVerified = false;

  // 1. Try decoding as internal application JWT
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded && decoded.email) {
      verifiedEmail = String(decoded.email).trim().toLowerCase();
      role = decoded.role || 'USER';
      userId = decoded.sub || 'user_dev';
      tokenVerified = true;
    }
  } catch (_err) {}

  // 2. Try verifying as Supabase access token with Supabase Auth API
  if (!tokenVerified && supabaseServer) {
    try {
      const { data } = await supabaseServer.auth.getUser(token);
      if (data?.user?.email) {
        verifiedEmail = data.user.email.trim().toLowerCase();
        const isSuper = verifiedEmail === DESIGNATED_ADMIN_EMAIL.toLowerCase();
        const knownUser = adminUsersDb.find((u) => u.email.toLowerCase() === verifiedEmail);
        role = isSuper ? 'ADMIN' : (knownUser ? knownUser.role : 'USER');
        userId = data.user.id;
        tokenVerified = true;
      }
    } catch (_supaErr) {}
  }

  if (!tokenVerified || !verifiedEmail) {
    return null;
  }

  return { email: verifiedEmail, role, sub: userId };
}

export function requireEnterprisePermission(permissionKey: string) {
  return async (req: any, res: any, next: any) => {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const clientIp = String(req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress || '127.0.0.1').split(',')[0].trim();
    const requestId = String(req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);

    if (!verifiedUser) {
      recordAdminAuditLog({
        user: 'anonymous',
        action: 'UNAUTHORIZED_API_ACCESS',
        details: `Blocked unauthenticated attempt to ${req.method} ${req.path}`,
        ip: clientIp,
        requestId,
        endpoint: req.originalUrl || req.path,
        outcome: 'DENIED',
      });
      return res.status(401).json({ error: 'Authentication Required.' });
    }

    const email = verifiedUser.email.toLowerCase();
    const isSuperAdmin = email === DESIGNATED_ADMIN_EMAIL.toLowerCase();

    const teamMember = adminTeamStore.find(t => t.email.toLowerCase() === email);
    
    let hasPerm = isSuperAdmin;
    if (!hasPerm && teamMember) {
       if (teamMember.role === 'SUPER_ADMIN') hasPerm = true;
       else if (teamMember.permissions && (teamMember.permissions as any)[permissionKey] === true) hasPerm = true;
    }

    if (!hasPerm) {
      recordAdminAuditLog({
        user: email,
        action: 'FORBIDDEN_RBAC_ACCESS',
        details: `Blocked attempt to ${req.method} ${req.path}. Missing permission: ${permissionKey}`,
        ip: clientIp,
        requestId,
        endpoint: req.originalUrl || req.path,
        outcome: 'DENIED',
      });
      return res.status(403).json({ error: `Forbidden: Requires ${permissionKey} permission.` });
    }

    // Attach team context to request for further ABAC down the line
    req.adminEmail = email;
    req.clientIp = clientIp;
    req.requestId = requestId;
    req.teamProfile = teamMember;
    
    next();
  };
}

export async function verifyAdminAuth(req: any, res: any, next: any) {
  const clientIp = String(req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress || '127.0.0.1').split(',')[0].trim();
  const requestId = String(req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);

  const verifiedUser = await extractVerifiedUserFromReq(req);

  if (!verifiedUser) {
    recordAdminAuditLog({
      user: 'anonymous',
      action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      details: `Blocked attempt to access ${req.method} ${req.path} without verified Bearer token`,
      ip: clientIp,
      requestId,
      endpoint: req.originalUrl || req.path,
      outcome: 'DENIED',
    });
    return res.status(401).json({
      error: 'Authentication Required: Missing, invalid, or unverified Bearer authorization token.',
    });
  }

  const { email: verifiedEmail, role: verifiedRole } = verifiedUser;
  const isSuperAdmin = verifiedEmail === DESIGNATED_ADMIN_EMAIL.toLowerCase();
  const knownUser = adminUsersDb.find((u) => u.email.toLowerCase() === verifiedEmail);
  const hasAdminRole =
    verifiedRole === 'ADMIN' ||
    verifiedRole === 'CO_ADMIN' ||
    verifiedRole === 'DEVELOPER' ||
    (knownUser && (knownUser.role === 'ADMIN' || knownUser.role === 'CO_ADMIN' || knownUser.role === 'DEVELOPER'));

  if (!isSuperAdmin && !hasAdminRole) {
    recordAdminAuditLog({
      user: verifiedEmail,
      action: 'FORBIDDEN_ADMIN_ACCESS',
      details: `User '${verifiedEmail}' with role '${verifiedRole}' attempted unauthorized write to ${req.path}`,
      ip: clientIp,
      requestId,
      endpoint: req.originalUrl || req.path,
      outcome: 'DENIED',
    });
    return res.status(403).json({
      error: 'Access Denied: Administrative permissions required for this resource.',
    });
  }

  req.adminEmail = verifiedEmail;
  req.adminRole = verifiedRole;
  req.clientIp = clientIp;
  req.requestId = requestId;
  return next();
}

export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface WatchdogLog {
  id: string;
  timestamp: string;
  service: 'Google Sheets' | 'Gemini API' | 'Supabase DB' | 'Server Engine';
  level: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  resolved: boolean;
  diagnosis?: {
    rootCause: string;
    recommendedAction: string;
    codeFixSnippet: string;
  };
}

export let blockedAuditLogs: AuditLog[] = [
  {
    id: 'log_1',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    user: 'User_8921',
    action: 'MODERATION_VIOLATION_BLOCKED',
    ip: '127.0.0.1',
    requestId: 'req_init_1',
    endpoint: '/api/gemini/moderate',
    outcome: 'DENIED',
    details: 'Inappropriate language sample detected in UPSC Room',
    room: 'UPSC Room',
    contentSnippet: 'Inappropriate language sample detected...',
    category: 'abuse',
    reason: 'Offensive language violation',
  },
];

export let watchdogSystemLogs: WatchdogLog[] = [];

export let userCustomSubjectsDb: Array<{
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
}> = [];

export let userManualQuestionsDb: Array<{
  id: string;
  userId: string;
  subject: string;
  topic: string;
  questionText: string;
  options?: string[];
  correctOption?: number | null;
  explanation?: string;
  difficulty?: string;
  source: 'manual';
  answerVerified: boolean;
  createdAt: string;
}> = [];

export let userPomodoroSessionsDb: Array<{
  id: string;
  userId: string;
  subject: string;
  topic: string;
  duration: number;
  startTime: string;
  endTime?: string;
  completedDuration: number;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  questionsAttempted: number;
  correctAnswers?: number;
  questionIds: string[];
  questionSources: string[];
  manualQuestions?: any[];
  selectedQuestions?: any[];
  accuracy: number;
  xpEarned: number;
  createdAt: string;
}> = [];

export let processedSessionsStore: Set<string> = new Set();

export let userWorkspacePreferencesDb: Map<string, any> = new Map();

export let simulatedErrors: Record<string, boolean> = {
  googleSheets: false,
  geminiApi: false,
  supabaseDb: false,
};

export let globalAdminSettings = {
  googleSheetsUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing',
  updatedAt: new Date().toISOString(),
  lastUpdatedBy: 'System Admin',
  planPricing: {
    monthlyPrice: 299,
    annualPrice: 1499,
    lifetimePrice: 2999,
    currency: 'INR',
    customDiscountPercent: 20,
    priceMoneyRules: 'Special Cashback: Get 100% XP bonus & INR 50 Cashback on completing 30-day study streak!',
  },
  razorpay: {
    enabled: Boolean(process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID),
    keyId: process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: '',
    environment: (process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '').startsWith('rzp_live_') ? 'live' : 'test',
    currency: 'INR',
  },
  adsense: {
    enabled: true,
    publisherId: 'ca-pub-8740054860974100',
    headerSlot: '7137181575',
    sidebarSlot: '5647382910',
    inFeedSlot: '9988776655',
    footerSlot: '4433221100',
    headerSlotEnabled: true,
    sidebarSlotEnabled: true,
    footerSlotEnabled: true,
    inFeedSlotEnabled: true,
    autoAdsEnabled: false,
  },
  moderation: {
    enabled: true,
    autoban: true,
    keywords: [
      'fuck','bitch','asshole','bastard','porn','nude','nsfw',
      'randi','chutiya','madarchod','behenchod','bhosdi','gandu',
      'harami','kutta','saala kutta','chod','lund','gaand'
    ]
  },
  customizer: {
    brandName: 'ASPIRANTX',
    brandTagline: 'Gen-Z Prep Suite (Class 1 - Ph.D.)',
    brandBadge: 'PRO',
    logoIconText: 'AX',
    logoUrl: '',
    themePalette: 'CYBER_EMERALD',
    fontFamily: 'PLUS_JAKARTA',
    backgroundAnimation: 'AURORA_WAVE',
    showBackgroundParticles: true,
    showHeroBanner: true,
    heroBannerTitle: '[STUDENT] Complete Prep Suite for All Exams (Class 1 to Ph.D.)',
    heroBannerSubtitle: 'Track Syllabus, AI Study Buddy, Live Mock Predictor & Community Chat in One Place.',
    heroBannerImageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&auto=format&fit=crop&q=80',
    heroBannerCtaText: 'Explore Syllabus Tracker',
    showAnnouncementTicker: true,
    announcementText: '[HOT] New Syllabus Templates added for UPPSC, Bihar Board, Class 10/12 PCM & Ph.D. Entrance! Customize your goal in Profile.',
  },
  demoLimits: {
    demoDurationMinutes: 10,
  },
};

export function mergeAdminSettings(target: any, source: any): any {
  if (!source) return target;
  const result = { ...target };

  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const tgtVal = target[key];

    if (srcVal === undefined || srcVal === null) continue;

    if (
      typeof srcVal === 'object' &&
      !Array.isArray(srcVal) &&
      typeof tgtVal === 'object' &&
      !Array.isArray(tgtVal)
    ) {
      result[key] = mergeAdminSettings(tgtVal, srcVal);
    } else {
      result[key] = srcVal;
    }
  }
  return result;
}

export async function updateGlobalAdminSettings(body: any, updatedBy = 'Admin') {
  if (!body) return globalAdminSettings;

  if (body.googleSheetsUrl && typeof body.googleSheetsUrl === 'string') {
    globalAdminSettings.googleSheetsUrl = body.googleSheetsUrl.trim();
  }

  if (body.planPricing && typeof body.planPricing === 'object') {
    globalAdminSettings.planPricing = {
      ...globalAdminSettings.planPricing,
      ...body.planPricing,
    };
  }

  if (body.razorpay && typeof body.razorpay === 'object') {
    const existingSecret = globalAdminSettings.razorpay.keySecret;
    const incomingSecret = body.razorpay.keySecret;
    const finalSecret =
      incomingSecret && incomingSecret.trim() !== '' && !incomingSecret.includes('----')
        ? incomingSecret
        : existingSecret;

    const incomingKeyId = body.razorpay.keyId !== undefined ? body.razorpay.keyId : globalAdminSettings.razorpay.keyId;
    let detectedEnv = body.razorpay.environment || globalAdminSettings.razorpay.environment || 'test';
    if (incomingKeyId) {
      if (incomingKeyId.startsWith('rzp_live_')) {
        detectedEnv = 'live';
      } else if (incomingKeyId.startsWith('rzp_test_')) {
        detectedEnv = 'test';
      }
    }

    globalAdminSettings.razorpay = {
      ...globalAdminSettings.razorpay,
      ...body.razorpay,
      keyId: incomingKeyId,
      keySecret: finalSecret,
      environment: detectedEnv,
    };
  }

  if (body.adsense && typeof body.adsense === 'object') {
    globalAdminSettings.adsense = {
      ...globalAdminSettings.adsense,
      ...body.adsense,
    };
  }

  if (body.customizer && typeof body.customizer === 'object') {
    globalAdminSettings.customizer = {
      ...globalAdminSettings.customizer,
      ...body.customizer,
    };
  }

  if (body.demoLimits && typeof body.demoLimits === 'object') {
    globalAdminSettings.demoLimits = {
      ...globalAdminSettings.demoLimits,
      ...body.demoLimits,
    };
  }

  if (typeof body.demoDurationMinutes === 'number' && body.demoDurationMinutes > 0) {
    globalAdminSettings.demoLimits = {
      ...globalAdminSettings.demoLimits,
      demoDurationMinutes: body.demoDurationMinutes,
    };
  }

  globalAdminSettings.updatedAt = new Date().toISOString();
  globalAdminSettings.lastUpdatedBy = updatedBy;

  await saveAdminStoreToDisk();
  return globalAdminSettings;
}

export const APP_VERSION = process.env.APP_VERSION || process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || process.env.COMMIT_REF?.slice(0, 7) || '2.4.0';

export function isValidUUID(str: string | null | undefined): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str).trim());
}

export function getISTDateString(date = new Date()): string {
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const istDate = new Date(date.getTime() + istOffset);
  return istDate.toISOString().split('T')[0];
}

export async function updateStreak(userIdentifier: string): Promise<{ streakDays: number; lastActiveDate: string; persisted: boolean }> {
  if (!userIdentifier) return { streakDays: 1, lastActiveDate: getISTDateString(), persisted: false };

  const cleanId = String(userIdentifier).trim().toLowerCase();
  const isEmail = cleanId.includes('@');
  const todayStr = getISTDateString(new Date());

  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yesterdayStr = getISTDateString(d);

  let currentStreak = 1;
  let lastActive = '';
  let matchedSupabaseId: string | null = null;
  let matchedSupabaseEmail: string | null = null;
  let supabaseRecordFound = false;

  // 1. Query Supabase user_profiles as the AUTHORITATIVE source of truth if Supabase is configured
  if (supabaseServer) {
    try {
      let query = supabaseServer.from('user_profiles').select('id, email, streak_days, last_active_date');
      if (isEmail) {
        query = query.or(`id.eq.${cleanId},email.eq.${cleanId}`);
      } else {
        query = query.eq('id', userIdentifier);
      }

      const { data, error } = await query.limit(1).maybeSingle();

      if (error) {
        console.error('[StreakEngine] Supabase streak query error:', error.message, 'code:', error.code);
      } else if (data) {
        supabaseRecordFound = true;
        matchedSupabaseId = data.id || null;
        matchedSupabaseEmail = data.email || null;
        currentStreak = Number(data.streak_days) || 1;
        lastActive = data.last_active_date || '';
      }
    } catch (e: any) {
      console.error('[StreakEngine] Supabase streak query exception:', e?.message || e);
    }
  }

  // 2. Memory user lookup for short-lived caching / fallback when Supabase is disabled or record not found
  let memoryUser = adminUsersDb.find(u => 
    (u.id && (u.id === userIdentifier || u.id.toLowerCase() === cleanId || (matchedSupabaseId && u.id === matchedSupabaseId))) ||
    (u.email && (u.email.toLowerCase() === cleanId || (matchedSupabaseEmail && u.email.toLowerCase() === matchedSupabaseEmail.toLowerCase())))
  );

  // If Supabase is NOT configured, use memory fallback
  if (!supabaseServer && memoryUser) {
    lastActive = memoryUser.lastActiveDate || memoryUser.last_active_date || '';
    currentStreak = Number(memoryUser.streakDays) || 1;
  }

  // 3. Streak Calculation
  let newStreak = currentStreak;

  if (!lastActive) {
    newStreak = 1;
  } else if (lastActive === todayStr) {
    newStreak = currentStreak;
  } else if (lastActive === yesterdayStr) {
    newStreak = currentStreak + 1;
  } else {
    // Missed one or more days
    newStreak = 1;
  }

  lastActive = todayStr;

  // Sync short-lived memory store cache
  if (memoryUser) {
    memoryUser.streakDays = newStreak;
    memoryUser.lastActiveDate = todayStr;
    memoryUser.last_active_date = todayStr;
    if (isEmail && !memoryUser.email) memoryUser.email = cleanId;
  } else {
    const targetUserId = matchedSupabaseId || userIdentifier;
    adminUsersDb.push({
      id: targetUserId,
      email: isEmail ? cleanId : (matchedSupabaseEmail || ''),
      name: isEmail ? cleanId.split('@')[0] : 'User',
      exam: 'NEET_UG',
      role: 'USER',
      isPremium: false,
      planName: 'FREE',
      streakDays: newStreak,
      lastActiveDate: todayStr,
      last_active_date: todayStr,
      xp: 100,
      coins: 50,
      level: 1,
      completedTopicsCount: 0,
      joinedAt: new Date().toISOString()
    } as any);
  }

  // 4. Persistence to Supabase user_profiles
  let persisted = false;

  if (supabaseServer) {
    const targetId = matchedSupabaseId || userIdentifier;
    const upsertData: Record<string, any> = {
      id: targetId,
      streak_days: newStreak,
      last_active_date: todayStr,
      updated_at: new Date().toISOString()
    };

    const targetEmail = matchedSupabaseEmail || (isEmail ? cleanId : null);
    if (targetEmail) {
      upsertData.email = targetEmail;
    }

    try {
      const { error: upsertErr } = await supabaseServer
        .from('user_profiles')
        .upsert(upsertData, { onConflict: 'id' });

      if (upsertErr) {
        console.error('[StreakEngine] Supabase streak upsert failed:', upsertErr.message, 'code:', upsertErr.code);
        persisted = false;
      } else {
        persisted = true;
      }
    } catch (e: any) {
      console.error('[StreakEngine] Supabase streak upsert exception:', e?.message || e);
      persisted = false;
    }
  } else {
    // Local development without Supabase
    persisted = true;
  }

  return { streakDays: newStreak, lastActiveDate: todayStr, persisted };
}

export let lastHydratedAt = 0;

export const EXCLUDED_HYDRATION_PATHS = ['/ping', '/health', '/version', '/api/ping', '/api/health', '/api/version'];

export let lastGatewaySettingsSync = 0;

export const GATEWAY_SETTINGS_CACHE_MS = 10000;

export interface OrderRecord {
  orderId: string;
  amount: number;
  currency: string;
  userEmail: string;
  planId: string;
  status: 'CREATED' | 'PAID' | 'FAILED' | 'EXPIRED';
  createdAt: string;
  paidAt?: string;
  paymentId?: string;
  signatureVerified?: boolean;
}

export interface SubscriptionRecord {
  userEmail: string;
  planId: string;
  isPremium: boolean;
  activatedAt: string;
  expiresAt?: string | null;
  paymentId: string;
  orderId: string;
  verificationMethod: 'RAZORPAY_SIGNATURE' | 'RAZORPAY_WEBHOOK' | 'ADMIN_VERIFIED' | 'ADMIN_UTR_VERIFIED';
  amountPaid: number;
  currency: string;
}

export interface UtrRequestRecord {
  id: string;
  userEmail: string;
  userName?: string;
  utr: string;
  plan: string;
  amount: number;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  processedBy?: string;
  processedAt?: string;
}

export function mapRowToUtrRecord(row: any): UtrRequestRecord {
  return {
    id: row.id,
    utr: row.utr,
    plan: row.plan || 'monthly',
    amount: Number(row.amount) || 0,
    userEmail: row.user_email || row.userEmail || '',
    userName: row.user_name || row.userName || 'Aspirant Student',
    submittedAt: row.created_at || row.submittedAt || row.submitted_at || new Date().toISOString(),
    status: row.status || 'PENDING',
    processedBy: row.processed_by || row.processedBy || undefined,
    processedAt: row.processed_at || row.processedAt || undefined,
  };
}

export let serverOrdersDb = new Map<string, OrderRecord>();

export let serverSubscriptionsDb = new Map<string, SubscriptionRecord>();

export let adRewardsDb = new Map<string, { email: string; views_today: number; last_view_date: string; total_videos_watched: number; reward_premium_until: string | null; updated_at: string }>();

export let studyBuddyQueue = new Map<string, { email: string; userId: string; exam: string; targetYear?: number; joinedAt: string }>();

export let studyBuddyMatches = new Map<string, { roomId: string; user1Email: string; user2Email: string; exam: string; active: boolean; createdAt: string }>();

export const studyHeartbeatsStore = new Map<string, any[]>();

export const rewardMilestonesStore = new Map<string, any>();

export const rewardClaimsStore = new Map<string, any>();

export const personalSyllabusNodesStore = new Map<string, any>();

export const syllabusTimeLogsStore = new Map<string, any[]>();

export interface EncryptedErrorPayload {
  iv: string;
  authTag: string;
  ciphertext: string;
}

export interface UserErrorLogRecord {
  id: string;
  userId: string | null;
  userEmail: string | null;
  source: 'frontend' | 'backend';
  endpoint: string | null;
  severity: 'error' | 'warning';
  encryptedPayload: EncryptedErrorPayload | null;
  createdAt: string;
  resolved: boolean;
}

export const userErrorLogsStore = new Map<string, UserErrorLogRecord>();

export function getErrorLogEncryptionKeyBuffer(): Buffer | null {
  const keyStr = process.env.ERROR_LOG_ENCRYPTION_KEY || 'default_aspirantx_dev_error_log_encryption_secret_key_2026';
  try {
    if (/^[0-9a-fA-F]{64}$/.test(keyStr)) {
      return Buffer.from(keyStr, 'hex');
    }
    return crypto.createHash('sha256').update(keyStr).digest();
  } catch (err) {
    console.warn('[ERROR LOG CRYPTO] Invalid ERROR_LOG_ENCRYPTION_KEY:', err);
    return null;
  }
}

export function encryptErrorPayload(plainObj: any): EncryptedErrorPayload | null {
  const keyBuf = getErrorLogEncryptionKeyBuffer();
  if (!keyBuf) return null;
  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', keyBuf, iv);
    let ciphertext = cipher.update(JSON.stringify(plainObj), 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return {
      iv: iv.toString('hex'),
      authTag,
      ciphertext
    };
  } catch (err) {
    console.warn('[ERROR LOG CRYPTO] Encryption error:', err);
    return null;
  }
}

export function decryptErrorPayload(encryptedPayload: EncryptedErrorPayload | null): any | null {
  if (!encryptedPayload || !encryptedPayload.iv || !encryptedPayload.authTag || !encryptedPayload.ciphertext) {
    return null;
  }
  const keyBuf = getErrorLogEncryptionKeyBuffer();
  if (!keyBuf) return { error: 'Encryption key not configured on server' };
  try {
    const ivBuf = Buffer.from(encryptedPayload.iv, 'hex');
    const authTagBuf = Buffer.from(encryptedPayload.authTag, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuf, ivBuf);
    decipher.setAuthTag(authTagBuf);
    let plain = decipher.update(encryptedPayload.ciphertext, 'hex', 'utf8');
    plain += decipher.final('utf8');
    return JSON.parse(plain);
  } catch (err) {
    console.warn('[ERROR LOG CRYPTO] Decryption error:', err);
    return { error: 'Decryption failed (Invalid key or corrupted payload)' };
  }
}

export const errorLogIpLimits = new Map<string, { count: number; resetAt: number }>();

export function errorLogRateLimiter(req: any, res: any, next: any) {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 20;

  let record = errorLogIpLimits.get(String(ip));
  if (!record || now > record.resetAt) {
    record = { count: 1, resetAt: now + windowMs };
    errorLogIpLimits.set(String(ip), record);
    return next();
  }

  if (record.count >= maxRequests) {
    return res.status(429).json({ error: 'Too many error reports from this IP. Rate limit exceeded.' });
  }

  record.count += 1;
  next();
}

export interface FeedbackReport {
  id: string;
  section: string;
  type: string;
  description: string;
  user_email: string;
  status: 'Pending' | 'Under Review' | 'Resolved' | 'Rejected';
  admin_note?: string | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
  is_guest_submission?: boolean;
  created_at: string;
}

export const PROFANITY_LIST = [
  // English
  'fuck', 'shit', 'bitch', 'bastard', 'asshole', 'cunt', 'dick', 'pussy', 'asshat',
  // Hindi / Hinglish Transliterations
  'chutiya', 'bhenchod', 'madarchod', 'loda', 'gaand', 'lund', 'saala', 'harami', 
  'bkl', 'mc', 'bc', 'bkc', 'kutta', 'kameena', 'gandu', 'chut', 'bhonsd'
];

export function containsProfanity(text: string): boolean {
  if (!text) return false;
  const clean = text.toLowerCase();
  return PROFANITY_LIST.some(word => clean.includes(word));
}

export const feedbackReportsStore = new Map<string, FeedbackReport>();

export const customExamsStore = new Map<string, any>();

export const INITIAL_FEEDBACK_REPORTS: FeedbackReport[] = [
  {
    id: 'feed_1',
    section: 'CBT Exam Engine',
    type: 'Performance Bug',
    description: 'Timer count mismatch on page reloads.',
    user_email: 'ambujyadav0010@gmail.com',
    status: 'Resolved',
    admin_note: 'Fixed timer state synchronization in localStorage.',
    resolved_by: 'ambujyadav0010@gmail.com',
    resolved_at: '2026-08-07T14:32:00.000Z',
    created_at: '2026-08-07T14:32:00.000Z'
  },
  {
    id: 'feed_2',
    section: 'Syllabus Tracker',
    type: 'Content Correction',
    description: 'Polity subtopic "Preamble" spelling correction needed.',
    user_email: 'test_student@example.com',
    status: 'Under Review',
    admin_note: null,
    resolved_by: null,
    resolved_at: null,
    created_at: '2026-08-08T01:10:00.000Z'
  }
];

INITIAL_FEEDBACK_REPORTS.forEach(r => feedbackReportsStore.set(r.id, r));

if (rewardMilestonesStore.size === 0) {
  const defaultMilestones = [
    {
      id: 'ms_kit_01',
      title: 'UPSC/SSC Elite Aspirant Study Kit & T-Shirt',
      description: 'Receive an official AspirantX premium cotton hoodie, highlighters, notebook set, and success planner delivered to your home.',
      rewardType: 'merch',
      rewardLabel: 'Deluxe Study Kit & T-Shirt',
      requiredVerifiedMinutes: 3000,
      isActive: true,
      updated_at: new Date().toISOString()
    },
    {
      id: 'ms_pass_02',
      title: '1-Year VIP Mentor Pass & Test Series',
      description: 'Unlock 1 year of unlimited CBT mock tests, live AI answer evaluation, priority study buddy matching, and topper webinars.',
      rewardType: 'subscription',
      rewardLabel: '1-Year VIP Pass',
      requiredVerifiedMinutes: 6000,
      isActive: true,
      updated_at: new Date().toISOString()
    }
  ];
  for (const m of defaultMilestones) {
    rewardMilestonesStore.set(m.id, m);
  }
}

export const processedWebhookEvents = new Set<string>();

export let pendingUtrRequestsDb = new Map<string, UtrRequestRecord>();

export interface EducatorRecord {
  id: string;
  name: string;
  subject: string;
  experience: string;
  qualification: string;
  avatar: string;
  isVerified: boolean;
  status?: string;
  email?: string;
  bio?: string;
  availability?: string[];
  rating?: number;
  studentsCount?: number;
  reviewsCount?: number;
  sessionPrice?: number;
  isOnline?: boolean;
  createdAt?: string;
}

export interface EducatorBookingRecord {
  id: string;
  educatorId: string;
  date: string;
  time: string;
  selectedSlot?: string;
  studentEmail: string;
  studentName?: string;
  notes?: string;
  status: string; // 'CONFIRMED' | 'PENDING_PAYMENT' | 'CANCELLED'
  price?: number;
  utrNumber?: string;
  createdAt: string;
}

export interface EducatorChatMessage {
  id: string;
  educatorId: string;
  sender: string;
  msg: string;
  timestamp: string;
}

export const DEFAULT_EDUCATORS_LIST: EducatorRecord[] = [
  {
    id: 'ed_1',
    name: 'Dr. Siddharth Arora',
    subject: 'Indian Polity & Governance',
    experience: '12+ Years',
    qualification: 'Advocate Supreme Court, PhD',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    isVerified: true,
    status: 'APPROVED',
    email: 'siddharth.arora@aspirantx.in',
    bio: 'Senior UPSC Polity faculty & advocate supreme court',
    availability: ['Today, 6:00 PM', 'Tomorrow, 9:00 AM', 'Tomorrow, 5:00 PM', '12 Aug, 11:00 AM', '13 Aug, 4:00 PM'],
    rating: 4.8,
    studentsCount: 15400,
    reviewsCount: 1280,
    sessionPrice: 499,
    isOnline: true
  },
  {
    id: 'ed_2',
    name: 'Mrunal Patel',
    subject: 'Indian Economy & Budgetary Reforms',
    experience: '10+ Years',
    qualification: 'Senior Educator, MBA Finance',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    isVerified: true,
    status: 'APPROVED',
    email: 'mrunal.patel@aspirantx.in',
    bio: 'Pioneer of UPSC Economy simplified lectures & handouts',
    availability: ['Today, 7:00 PM', 'Tomorrow, 2:00 PM', '13 Aug, 10:00 AM', '14 Aug, 6:00 PM'],
    rating: 4.9,
    studentsCount: 28900,
    reviewsCount: 3100,
    sessionPrice: 0, // Free Session
    isOnline: false
  }
];

export const educatorsStore = new Map<string, EducatorRecord>();

DEFAULT_EDUCATORS_LIST.forEach(ed => educatorsStore.set(ed.id, ed));

export const educatorBookingsStore = new Map<string, EducatorBookingRecord>();

export const educatorChatsStore = new Map<string, EducatorChatMessage[]>();

export interface TopperPodcastRecord {
  id: string;
  topperName: string;
  rank: string;
  subject: string;
  audioUrl: string;
  duration: string;
  description: string;
  booklist: string[];
  createdAt?: string;
}

export const DEFAULT_PODCASTS_LIST: TopperPodcastRecord[] = [
  {
    id: 'p1',
    topperName: 'Anish Thakkar',
    rank: 'UPSC CSE AIR 3 (2025)',
    subject: 'Polity & GS Paper 2 Strategy',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: '14:20',
    description: 'Anish details how keeping answer structures simple, drawing flowcharts, and solving past 10 years papers multiple times led to high marks in GS 2.',
    booklist: ['Indian Polity by Laxmikanth', 'DD Basu Introduction to the Constitution', 'ARC 2nd Reports on Governance']
  },
  {
    id: 'p2',
    topperName: 'Priya Sharma',
    rank: 'UPSC CSE AIR 12 (2025)',
    subject: 'Geography Optional & Answer Writing',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration: '18:45',
    description: 'Priya shares tips on drawing hand-made maps, highlighting map locations in paper 2, and scoring 290+ in Geography optional.',
    booklist: ['Physical Geography by Savindra Singh', 'India: A Comprehensive Geography by DR Khullar', 'AspirantX Reference Library Map Notes']
  }
];

export const podcastsStore = new Map<string, TopperPodcastRecord>();

DEFAULT_PODCASTS_LIST.forEach(p => podcastsStore.set(p.id, p));

export interface BlogPostRecord {
  id: string;
  title: string;
  body: string;
  category: string;
  authorTeacherId?: string;
  authorName?: string;
  status: 'draft' | 'pending' | 'published' | 'rejected';
  coverImageUrl?: string;
  createdAt: string;
  publishedAt?: string;
  rejectionReason?: string;
}

export interface BlogContentRequestRecord {
  id: string;
  teacherId: string;
  teacherEmail: string;
  teacherName?: string;
  requestedAt: string;
  status: 'sent' | 'submitted' | 'expired';
  submissionToken: string;
  submittedPostId?: string;
  customMessage?: string;
}

export const DEFAULT_BLOG_POSTS: BlogPostRecord[] = [
  {
    id: 'post_default_1',
    title: 'UPSC CSE 2026: Comprehensive Strategy for Prelims & Mains Integration',
    body: `Preparing for Civil Services requires a synchronized approach between Prelims factual coverage and Mains analytical depth.

### 1. The Core Pillar: NCERTs & Standard Books
Before jumping into advanced test series, ensure your basic foundation in History, Polity, Geography, and Economy is rock solid. Standard books like Laxmikanth for Indian Polity and Ramesh Singh for Economy must be read multiple times.

### 2. Daily Editorial Analysis
Never skip the daily newspaper. Focus on editorial arguments, constitutional provisions mentioned in news, and key government reports like 2nd ARC and NITI Aayog Strategy.

### 3. Answer Writing Routine
Start writing 2 answers daily after covering 50% of the syllabus. Pay attention to flowcharts, maps, and bullet points.`,
    category: 'Strategy',
    authorTeacherId: 'ed_1',
    authorName: 'Dr. Siddharth Arora',
    status: 'published',
    coverImageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    publishedAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'post_default_2',
    title: 'Union Budget Highlights & Economic Implications for GS Paper 3',
    body: `The Union Budget sets the macroeconomic roadmap for the fiscal year. Here is a detailed breakdown of the critical sectors relevant for UPSC GS Paper 3.

### Key Macro Themes
- **Capital Expenditure Increase**: Boost to infrastructure and freight corridors.
- **Fiscal Deficit Target**: Sticking to the fiscal consolidation path below 4.5% of GDP.
- **Green Growth & Renewable Energy**: Subsidies for solar manufacturing and EV infrastructure.

### Agricultural Reforms & Digital Public Infrastructure
Enhancing Agri-Stack and crop diversification funds for climate-resilient farming practices.`,
    category: 'Economy',
    authorTeacherId: 'ed_2',
    authorName: 'Mrunal Patel',
    status: 'published',
    coverImageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    publishedAt: new Date(Date.now() - 86400000).toISOString()
  }
];

export const blogPostsStore = new Map<string, BlogPostRecord>();

DEFAULT_BLOG_POSTS.forEach(p => blogPostsStore.set(p.id, p));

export const blogRequestsStore = new Map<string, BlogContentRequestRecord>();

export let adminUsersDb: any[] = [
  {
    id: 'usr-admin-01',
    name: 'Ambuj Yadav (Super Admin)',
    email: 'ambujyadav0010@gmail.com',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    exam: 'UPSC CSE 2026',
    stateName: 'Uttar Pradesh',
    role: 'ADMIN',
    isPremium: true,
    planName: 'PRO PASS',
    streakDays: 45,
    xp: 3500,
    coins: 999,
    level: 10,
    completedTopicsCount: 28,
    joinedAt: '2026-01-01',
    status: 'ACTIVE',
  },
  {
    id: 'usr-rahul-02',
    name: 'Rahul Sharma (Aspirant)',
    email: 'rahul.upsc2026@aspirantx.in',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    exam: 'UPSC CSE 2026',
    stateName: 'Delhi NCR',
    role: 'USER',
    isPremium: true,
    planName: 'PRO PASS',
    streakDays: 14,
    xp: 1250,
    coins: 240,
    level: 4,
    completedTopicsCount: 12,
    joinedAt: '2026-02-10',
    status: 'ACTIVE',
  }
];

export interface AdminAnnouncement {
  id: string;
  title: string;
  message: string;
  examTags: string[];
  priority: 'normal' | 'urgent';
  isActive: boolean;
  createdAt: string;
  expiresAt: string | null;
}

export const adminAnnouncementsStore = new Map<string, AdminAnnouncement>();

export let adminContentDb = {
  announcements: [
    {
      id: 'ann-1',
      title: 'UPSC Prelims 2026 Mock Test Series Live!',
      content: 'Join the full-length All India Mock Test series starting this Sunday. Complete syllabus coverage with AI performance analytics.',
      createdAt: new Date().toISOString(),
      priority: 'HIGH',
      active: true,
    }
  ],
  categories: [
    { id: 'cat-1', name: 'Polity & Governance', exam: 'UPSC_CSE', icon: 'BookOpen' },
    { id: 'cat-2', name: 'Indian History & Art', exam: 'UPSC_CSE', icon: 'Landmark' },
    { id: 'cat-3', name: 'Geography & Environment', exam: 'UPSC_CSE', icon: 'Globe' },
  ],
  subjects: [
    { id: 'sub-1', name: 'Indian Constitution & Articles', categoryId: 'cat-1' },
    { id: 'sub-2', name: 'Modern Indian History (1857-1947)', categoryId: 'cat-2' },
  ],
  questions: [
    {
      id: 'q-1',
      question: 'Which Article of the Indian Constitution empowers the President to promulgate Ordinances during recess of Parliament?',
      options: ['Article 123', 'Article 213', 'Article 352', 'Article 72'],
      correctAnswer: 0,
      explanation: 'Article 123 of the Indian Constitution grants the President power to promulgate ordinances during Parliament recess.',
      exam: 'UPSC_CSE',
      subject: 'Indian Constitution & Articles',
    }
  ],
  pyqs: [
    {
      id: 'pyq-1',
      year: 2024,
      exam: 'UPSC_CSE',
      paper: 'GS Paper 1',
      title: 'Consider the following statements regarding the Attorney General of India...',
    }
  ],
  syllabus: [],
  groups: [],
  chatSettings: {
    maxMessageLength: 1000,
    allowAttachments: true,
    autoModeration: true,
  },
  examSettings: {
    activeExams: ['UPSC_CSE', 'SSC_CGL', 'UPPSC', 'BPSC'],
    defaultExam: 'UPSC_CSE',
  },
};

export let adminTeamStore: any[] = [
  {
    id: 'tm-1',
    name: 'Ambuj Yadav',
    email: 'ambujyadav0010@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    title: 'Founder & Chief Executive Officer',
    role: 'SUPER_ADMIN',
    department: 'Executive Leadership',
    status: 'ACTIVE',
    joinedAt: '2026-01-01',
    permissions: {
      canManageFinance: true,
      canManageAdsense: true,
      canManageFlags: true,
      canManageUsers: true,
      canManageTeam: true,
      canManageWatchdog: true,
      canManageCustomizer: true,
    }
  },
  {
    id: 'tm-2',
    name: 'Priya Sharma',
    email: 'priya.content@aspirantx.in',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    title: 'Academic Director & Chief Content Officer',
    role: 'ACADEMIC_LEAD',
    department: 'Academics & Question Bank',
    status: 'ACTIVE',
    joinedAt: '2026-01-15',
    permissions: {
      canManageFinance: false,
      canManageAdsense: false,
      canManageFlags: false,
      canManageUsers: true,
      canManageTeam: false,
      canManageWatchdog: false,
      canManageCustomizer: false,
    }
  },
  {
    id: 'tm-3',
    name: 'Vikram Malhotra',
    email: 'vikram.finance@aspirantx.in',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    title: 'Head of Billing & Payment Operations',
    role: 'FINANCE_MANAGER',
    department: 'Finance & Monetization',
    status: 'ACTIVE',
    joinedAt: '2026-02-01',
    permissions: {
      canManageFinance: true,
      canManageAdsense: true,
      canManageFlags: false,
      canManageUsers: true,
      canManageTeam: false,
      canManageWatchdog: false,
      canManageCustomizer: false,
    }
  },
  {
    id: 'tm-4',
    name: 'Sneha Verma',
    email: 'sneha.community@aspirantx.in',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
    title: 'Community Lead & Student Support Specialist',
    role: 'COMMUNITY_LEAD',
    department: 'Community & Moderation',
    status: 'ACTIVE',
    joinedAt: '2026-02-05',
    permissions: {
      canManageFinance: false,
      canManageAdsense: false,
      canManageFlags: false,
      canManageUsers: true,
      canManageTeam: false,
      canManageWatchdog: false,
      canManageCustomizer: false,
    }
  },
  {
    id: 'tm-5',
    name: 'Rohan Mehta',
    email: 'rohan.tech@aspirantx.in',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
    title: 'Lead Systems Architect & DevOps',
    role: 'TECH_LEAD',
    department: 'Engineering & Infrastructure',
    status: 'ACTIVE',
    joinedAt: '2026-01-20',
    permissions: {
      canManageFinance: false,
      canManageAdsense: true,
      canManageFlags: true,
      canManageUsers: false,
      canManageTeam: false,
      canManageWatchdog: true,
      canManageCustomizer: true,
    }
  }
];

export let adminTasksStore: any[] = [
  {
    id: 'task-1',
    title: 'Review 12 Pending UTR Bank Transfers',
    description: 'Verify screenshot attachments and approve manual PRO Pass upgrades for pending UPI transactions.',
    assignedTo: 'vikram.finance@aspirantx.in',
    assignedToName: 'Vikram Malhotra',
    module: 'FINANCE',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    assignedAt: new Date(Date.now() - 7200000).toISOString(),
    dueDate: 'Today'
  },
  {
    id: 'task-2',
    title: 'Moderate Reported Answer Key Discussion #101',
    description: 'Check flagged polity comment regarding Article 226 vs Article 32 writ jurisdiction in Community Forum.',
    assignedTo: 'sneha.community@aspirantx.in',
    assignedToName: 'Sneha Verma',
    module: 'COMMUNITY',
    priority: 'MEDIUM',
    status: 'PENDING',
    assignedAt: new Date(Date.now() - 14400000).toISOString(),
    dueDate: 'Today'
  },
  {
    id: 'task-3',
    title: 'Upload UPSC Prelims 2026 Mock Test #5 Question Paper',
    description: 'Format and review 100 GS-1 questions with detailed explanations and syllabus mappings.',
    assignedTo: 'priya.content@aspirantx.in',
    assignedToName: 'Priya Sharma',
    module: 'CONTENT',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    assignedAt: new Date(Date.now() - 28800000).toISOString(),
    dueDate: 'Tomorrow'
  },
  {
    id: 'task-4',
    title: 'Audit System Health Logs & Rate Limiting Thresholds',
    description: 'Run full Watchdog vulnerability scan and check Razorpay webhook SSL certificate validation.',
    assignedTo: 'rohan.tech@aspirantx.in',
    assignedToName: 'Rohan Mehta',
    module: 'TECH',
    priority: 'LOW',
    status: 'COMPLETED',
    assignedAt: new Date(Date.now() - 86400000).toISOString(),
    dueDate: 'Completed'
  }
];

export const DEFAULT_SPONSORS_LIST: any[] = [
  { id: 'sp-1', name: 'Unacademy', logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&auto=format&fit=crop&q=80', website: 'https://unacademy.com', tier: 'gold', description: 'India\'s largest learning platform - Official Education Partner' },
  { id: 'sp-2', name: 'Vajiram & Ravi', logo: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=120&auto=format&fit=crop&q=80', website: 'https://vajiramandravi.com', tier: 'gold', description: 'Premier Institute for IAS Preparation - General Studies Partner' },
  { id: 'sp-3', name: 'Physics Wallah', logo: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=120&auto=format&fit=crop&q=80', website: 'https://pw.live', tier: 'gold', description: 'Empowering students with affordable learning - Tech Sponsor' },
  { id: 'sp-4', name: 'Testbook', logo: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=120&auto=format&fit=crop&q=80', website: 'https://testbook.com', tier: 'silver', description: 'Comprehensive Mock Tests & Live Test Series Partner' },
  { id: 'sp-5', name: 'Oliveboard', logo: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=120&auto=format&fit=crop&q=80', website: 'https://oliveboard.in', tier: 'silver', description: 'Banking & Government Exam preparation portal' },
  { id: 'sp-6', name: 'Chahal Academy', logo: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=120&auto=format&fit=crop&q=80', website: 'https://chahalacademy.com', tier: 'silver', description: 'Specialized Civil Services & State PCS classroom training' }
];

export const DEFAULT_COLLABORATORS_LIST: any[] = [
  { id: 'col-1', name: 'Vision IAS', logo: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=120&auto=format&fit=crop&q=80', type: 'Academic Partner', contribution: 'Syllabus Mappings & Free Notes' },
  { id: 'col-2', name: 'Drishti IAS', logo: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=120&auto=format&fit=crop&q=80', type: 'Hindi Medium Partner', contribution: 'Bilingual Question Translation' },
  { id: 'col-3', name: 'IAS Baba', logo: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=120&auto=format&fit=crop&q=80', type: 'Daily Quiz Contributor', contribution: 'Daily Practice Quizzes & Current Affairs' },
  { id: 'col-4', name: 'insightsIAS', logo: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=120&auto=format&fit=crop&q=80', type: 'Answer Writing Contributor', contribution: 'Mains Practice Questions & Guidelines' }
];

export const DEFAULT_OFFICE_ACTIVITIES: any[] = [
  { id: 'act-1', timestamp: new Date(Date.now() - 600000).toISOString(), memberName: 'Priya Sharma', action: 'UPLOAD', details: 'Uploaded 45 questions for Indian Economy (Budget 2026)' },
  { id: 'act-2', timestamp: new Date(Date.now() - 1800000).toISOString(), memberName: 'Rohan Mehta', action: 'SYSTEM', details: 'Optimized PostgreSQL queries for Question Bank' },
  { id: 'act-3', timestamp: new Date(Date.now() - 3600000).toISOString(), memberName: 'Sneha Verma', action: 'COMMUNITY', details: 'Resolved 3 flags in UPSC Group Study Room' },
  { id: 'act-4', timestamp: new Date(Date.now() - 7200000).toISOString(), memberName: 'Vikram Malhotra', action: 'FINANCE', details: 'Processed 5 manual bank transfer upgrades' }
];

export let sponsorsDb: any[] = [...DEFAULT_SPONSORS_LIST];

export let collaboratorsDb: any[] = [...DEFAULT_COLLABORATORS_LIST];

export let sponsorInquiriesDb: any[] = [];

export let teamApplicationsDb: any[] = [];

export let officeActivityFeed: any[] = [...DEFAULT_OFFICE_ACTIVITIES];

export let pendingContentUploadsDb: any[] = [
  { id: 'up-1', uploader: 'Priya Sharma', exam: 'UPSC_CSE', subject: 'Polity', topic: 'Preamble', questionCount: 15, title: 'UPSC CSE 2025 Mock Polity Prep', uploadedAt: new Date(Date.now() - 3600000 * 2).toISOString(), status: 'PENDING' },
  { id: 'up-2', uploader: 'Amit Patel (Contributor)', exam: 'SSC_CGL', subject: 'Quantitative Aptitude', topic: 'Geometry', questionCount: 25, title: 'SSC CGL 2024 Geometry PYQs', uploadedAt: new Date(Date.now() - 3600000 * 5).toISOString(), status: 'PENDING' }
];

export async function saveAdminStoreToDisk() {
  try {
    const targetFile = getWritableDataFilePath();
    const store = {
      globalAdminSettings,
      featureFlagsStore,
      orders: Array.from(serverOrdersDb.entries()),
      subscriptions: Array.from(serverSubscriptionsDb.entries()),
      processedWebhookEvents: Array.from(processedWebhookEvents),
      utrRequests: Array.from(pendingUtrRequestsDb.entries()),
      blockedAuditLogs,
      watchdogSystemLogs,
      adminUsers: adminUsersDb,
      adminContent: adminContentDb,
      adminTeam: adminTeamStore,
      adminTasks: adminTasksStore,
      savedAt: new Date().toISOString(),
    };
    fs.writeFileSync(targetFile, JSON.stringify(store, null, 2), 'utf-8');

    // Synchronous/Awaited sync to Primary Database (Supabase PostgreSQL) when configured
    if (supabaseServer) {
      try {
        await Promise.all([
          supabaseServer.from('admin_settings').upsert([{ id: 'global', data: globalAdminSettings, updated_at: new Date().toISOString() }], { onConflict: 'id' }),
          supabaseServer.from('feature_flags').upsert(featureFlagsStore.map((f) => ({
            feature_name: f.feature_name,
            label: f.label,
            description: f.description,
            is_premium: Boolean(f.is_premium),
            updated_at: new Date().toISOString()
          })), { onConflict: 'feature_name' }),
          supabaseServer.from('admin_users').upsert(adminUsersDb.map((u) => ({
            id: u.id || `usr_${Math.random().toString(36).substring(2, 9)}`,
            email: String(u.email || '').trim().toLowerCase(),
            name: u.name || 'User',
            role: u.role || 'STUDENT',
            is_premium: Boolean(u.isPremium),
            plan_name: u.planName || 'FREE',
            streak_days: Number(u.streakDays || 0),
            xp: Number(u.xp || 0),
            coins: Number(u.coins || 0),
            level: Number(u.level || 1),
            status: u.status || 'ACTIVE',
            updated_at: new Date().toISOString()
          })), { onConflict: 'id' }),
          supabaseServer.from('admin_content').upsert([{ id: 'global', data: adminContentDb, updated_at: new Date().toISOString() }], { onConflict: 'id' }),
          supabaseServer.from('user_subscriptions').upsert(
            Array.from(serverSubscriptionsDb.values()).map((sub) => ({
              userEmail: String(sub.userEmail || '').trim().toLowerCase(),
              planId: sub.planId || 'monthly',
              isPremium: Boolean(sub.isPremium),
              activatedAt: sub.activatedAt || new Date().toISOString(),
              expiresAt: sub.expiresAt || new Date().toISOString(),
              paymentId: sub.paymentId || null,
              orderId: sub.orderId || null,
              verificationMethod: sub.verificationMethod || 'ADMIN_VERIFIED',
              amountPaid: Number(sub.amountPaid || 0),
              currency: sub.currency || 'INR',
              updated_at: new Date().toISOString()
            })),
            { onConflict: 'userEmail' }
          ),
          supabaseServer.from('study_heartbeats').upsert(
            Array.from(studyHeartbeatsStore.values()).flat().map((hb) => ({
              id: hb.id,
              user_id: hb.userId || hb.user_id,
              session_id: hb.sessionId || hb.session_id,
              subject: hb.subject,
              topic_id: hb.topicId || hb.topic_id || null,
              pinged_at: hb.pingedAt || hb.pinged_at || new Date().toISOString()
            })),
            { onConflict: 'id' }
          ),
          supabaseServer.from('reward_milestones').upsert(
            Array.from(rewardMilestonesStore.values()).map((m) => ({
              id: m.id,
              data: m,
              updated_at: m.updated_at || new Date().toISOString()
            })),
            { onConflict: 'id' }
          ),
          supabaseServer.from('reward_claims').upsert(
            Array.from(rewardClaimsStore.values()).map((c) => ({
              id: c.id,
              data: c,
              updated_at: c.updated_at || c.claimedAt || new Date().toISOString()
            })),
            { onConflict: 'id' }
          ),
          supabaseServer.from('syllabus_nodes').upsert(
            Array.from(syllabusNodesStore.values()).map((n) => ({
              id: n.id,
              data: n,
              updated_at: n.updatedAt || new Date().toISOString()
            })),
            { onConflict: 'id' }
          ),
          supabaseServer.from('pyqs').upsert(
            Array.from(pyqStore.values()).map((p) => ({
              id: p.id,
              data: p,
              updated_at: p.updatedAt || p.createdAt || new Date().toISOString()
            })),
            { onConflict: 'id' }
          ),
        ]);
        console.log('[SUPABASE SYNC SUCCESS] All server records upserted to Supabase PostgreSQL successfully.');
      } catch (dbErr: any) {
        console.error('[SUPABASE SYNC ERROR]', dbErr?.message || dbErr);
      }
    }
  } catch (err: any) {
    console.warn('Failed to save admin store to disk:', err?.message || err);
  }
}

export function lockRazorpayEnvironment() {
  const finalKeyId = globalAdminSettings.razorpay?.keyId || process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
  if (globalAdminSettings.razorpay) {
    globalAdminSettings.razorpay.environment = finalKeyId.startsWith('rzp_live_') ? 'live' : 'test';
    globalAdminSettings.razorpay.enabled = Boolean(finalKeyId && !finalKeyId.includes('placeholder'));
  }
}

export async function hydrateFromPrimaryDatabase(timeoutMs = 15000) {
  if (!supabaseServer) return;

  const controller = new AbortController();
  let timerId: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timerId = setTimeout(() => {
      controller.abort();
      reject(new Error(`[HYDRATION TIMEOUT] DB hydration exceeded ${timeoutMs}ms limit.`));
    }, timeoutMs);
  });

  const getQueryResult = (settledItem: PromiseSettledResult<any>): { data: any; error: any } => {
    if (settledItem.status === 'fulfilled') {
      return {
        data: settledItem.value?.data ?? null,
        error: settledItem.value?.error ?? null
      };
    }
    return {
      data: null,
      error: settledItem.reason || new Error('Query rejected or aborted')
    };
  };

  const performHydration = async () => {
    const signal = controller.signal;
    const settledResults = await Promise.allSettled([
      supabaseServer.from('admin_settings').select('*').eq('id', 'global').abortSignal(signal).maybeSingle(),
      supabaseServer.from('feature_flags').select('*').abortSignal(signal),
      supabaseServer.from('admin_users').select('*').abortSignal(signal),
      supabaseServer.from('admin_content').select('*').eq('id', 'global').abortSignal(signal).maybeSingle(),
      supabaseServer.from('user_subscriptions').select('*').abortSignal(signal),
      supabaseServer.from('community_groups').select('*').abortSignal(signal),
      supabaseServer.from('notifications').select('*').abortSignal(signal),
      supabaseServer.from('orders').select('*').abortSignal(signal),
      supabaseServer.from('cbt_results').select('*').abortSignal(signal),
      supabaseServer.from('ad_rewards').select('*').abortSignal(signal),
      supabaseServer.from('study_buddy_queue').select('*').abortSignal(signal),
      supabaseServer.from('study_buddy_matches').select('*').abortSignal(signal),
      supabaseServer.from('study_heartbeats').select('*').abortSignal(signal),
      supabaseServer.from('reward_milestones').select('*').abortSignal(signal),
      supabaseServer.from('reward_claims').select('*').abortSignal(signal),
      supabaseServer.from('utr_requests').select('*').abortSignal(signal),
      supabaseServer.from('admin_announcements').select('*').abortSignal(signal),
      supabaseServer.from('personal_syllabus_nodes').select('*').abortSignal(signal),
    ]);

    const settingsRes = getQueryResult(settledResults[0]);
    const flagsRes = getQueryResult(settledResults[1]);
    const usersRes = getQueryResult(settledResults[2]);
    const contentRes = getQueryResult(settledResults[3]);
    const subsRes = getQueryResult(settledResults[4]);
    const groupsRes = getQueryResult(settledResults[5]);
    const notifsRes = getQueryResult(settledResults[6]);
    const ordersRes = getQueryResult(settledResults[7]);
    const cbtRes = getQueryResult(settledResults[8]);
    const adRes = getQueryResult(settledResults[9]);
    const queueRes = getQueryResult(settledResults[10]);
    const matchesRes = getQueryResult(settledResults[11]);
    const heartbeatsRes = getQueryResult(settledResults[12]);
    const milestonesRes = getQueryResult(settledResults[13]);
    const claimsRes = getQueryResult(settledResults[14]);
    const utrRes = getQueryResult(settledResults[15]);
    const announcementsRes = getQueryResult(settledResults[16]);
    const personalSyllabusRes = getQueryResult(settledResults[17]);

    // Independent per-table check: Admin Settings
    if (settingsRes.error) {
      console.error('[HYDRATION ERROR] admin_settings fetch failed:', settingsRes.error.message || settingsRes.error);
    } else if (!settingsRes.data || !settingsRes.data.data) {
      console.warn('[SEED] admin_settings global row confirmed empty (no row/data, no error) - seeding defaults');
      lockRazorpayEnvironment();
      try {
        await supabaseServer.from('admin_settings').upsert([{ id: 'global', data: globalAdminSettings, updated_at: new Date().toISOString() }], { onConflict: 'id' });
      } catch (e) {
        console.error('[SEED ERROR] admin_settings:', e);
      }
    } else {
      globalAdminSettings = mergeAdminSettings(globalAdminSettings, settingsRes.data.data);
    }

    // Independent per-table check: Feature Flags
    if (flagsRes.error) {
      console.error('[HYDRATION ERROR] feature_flags fetch failed:', flagsRes.error.message || flagsRes.error);
    } else if (Array.isArray(flagsRes.data) && flagsRes.data.length === 0) {
      console.warn('[SEED] feature_flags table confirmed empty (0 rows, no error) - seeding defaults');
      try {
        await supabaseServer.from('feature_flags').upsert(featureFlagsStore.map((f) => ({
          feature_name: f.feature_name,
          label: f.label,
          description: f.description,
          is_premium: Boolean(f.is_premium),
          updated_at: new Date().toISOString()
        })), { onConflict: 'feature_name' });
      } catch (e) {
        console.error('[SEED ERROR] feature_flags:', e);
      }
    } else if (Array.isArray(flagsRes.data) && flagsRes.data.length > 0) {
      featureFlagsStore = flagsRes.data;
    }

    // Independent per-table check: Admin Users
    if (usersRes.error) {
      console.error('[HYDRATION ERROR] admin_users fetch failed:', usersRes.error.message || usersRes.error);
    } else if (Array.isArray(usersRes.data) && usersRes.data.length === 0) {
      console.warn('[SEED] admin_users table confirmed empty (0 rows, no error) - seeding defaults');
      try {
        await supabaseServer.from('admin_users').upsert(adminUsersDb.map((u) => ({
          id: u.id || `usr_${Math.random().toString(36).substring(2, 9)}`,
          email: String(u.email || '').trim().toLowerCase(),
          name: u.name || 'User',
          role: u.role || 'STUDENT',
          is_premium: Boolean(u.isPremium),
          plan_name: u.planName || 'FREE',
          streak_days: Number(u.streakDays || 0),
          xp: Number(u.xp || 0),
          coins: Number(u.coins || 0),
          level: Number(u.level || 1),
          status: u.status || 'ACTIVE',
          updated_at: new Date().toISOString()
        })), { onConflict: 'id' });
      } catch (e) {
        console.error('[SEED ERROR] admin_users:', e);
      }
    } else if (Array.isArray(usersRes.data) && usersRes.data.length > 0) {
      adminUsersDb = usersRes.data.map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        isPremium: row.is_premium,
        planName: row.plan_name,
        streakDays: row.streak_days,
        xp: row.xp,
        coins: row.coins,
        level: row.level,
        completedTopicsCount: 0,
        joinedAt: row.updated_at || new Date().toISOString(),
        status: row.status
      }));
    }

    // Independent per-table check: Admin Content
    if (contentRes.error) {
      console.error('[HYDRATION ERROR] admin_content fetch failed:', contentRes.error.message || contentRes.error);
    } else if (!contentRes.data || !contentRes.data.data) {
      console.warn('[SEED] admin_content global row confirmed empty (no row/data, no error) - seeding defaults');
      try {
        await supabaseServer.from('admin_content').upsert([{ id: 'global', data: adminContentDb, updated_at: new Date().toISOString() }], { onConflict: 'id' });
      } catch (e) {
        console.error('[SEED ERROR] admin_content:', e);
      }
    } else {
      adminContentDb = { ...adminContentDb, ...contentRes.data.data };
    }

    // Independent per-table check: User Subscriptions
    if (subsRes.error) {
      console.error('[HYDRATION ERROR] user_subscriptions fetch failed:', subsRes.error.message || subsRes.error);
    } else if (Array.isArray(subsRes.data) && subsRes.data.length > 0) {
      serverSubscriptionsDb.clear();
      for (const sub of subsRes.data) {
        if (sub.userEmail) {
          serverSubscriptionsDb.set(sub.userEmail.trim().toLowerCase(), {
            userEmail: sub.userEmail,
            planId: sub.planId,
            isPremium: sub.isPremium,
            activatedAt: sub.activatedAt,
            expiresAt: sub.expiresAt,
            paymentId: sub.paymentId,
            orderId: sub.orderId,
            verificationMethod: sub.verificationMethod,
            amountPaid: sub.amountPaid,
            currency: sub.currency
          });
        }
      }
    }

    // Independent per-table check: Community Groups
    if (groupsRes.error) {
      console.error('[HYDRATION ERROR] community_groups fetch failed:', groupsRes.error.message || groupsRes.error);
    } else if (Array.isArray(groupsRes.data) && groupsRes.data.length === 0) {
      console.warn('[SEED] community_groups table confirmed empty (0 rows, no error) - seeding defaults');
      if (communityGroupsStore.size > 0) {
        try {
          await supabaseServer.from('community_groups').upsert(Array.from(communityGroupsStore.values()).map(g => ({ id: g.id, data: g, updated_at: new Date().toISOString() })), { onConflict: 'id' });
        } catch (e) {
          console.error('[SEED ERROR] community_groups:', e);
        }
      }
    } else if (Array.isArray(groupsRes.data) && groupsRes.data.length > 0) {
      communityGroupsStore.clear();
      for (const r of groupsRes.data) {
        if (r.id && r.data) communityGroupsStore.set(r.id, r.data);
      }
    }

    // Independent per-table check: Notifications
    if (notifsRes.error) {
      console.error('[HYDRATION ERROR] notifications fetch failed:', notifsRes.error.message || notifsRes.error);
    } else if (Array.isArray(notifsRes.data) && notifsRes.data.length === 0) {
      console.warn('[SEED] notifications table confirmed empty (0 rows, no error) - seeding defaults');
      if (userNotificationsStore.size > 0) {
        try {
          await supabaseServer.from('notifications').upsert(Array.from(userNotificationsStore.entries()).map(([userId, notifs]) => ({ user_id: userId, data: notifs, updated_at: new Date().toISOString() })), { onConflict: 'user_id' });
        } catch (e) {
          console.error('[SEED ERROR] notifications:', e);
        }
      }
    } else if (Array.isArray(notifsRes.data) && notifsRes.data.length > 0) {
      userNotificationsStore.clear();
      for (const r of notifsRes.data) {
        if (r.user_id && r.data) userNotificationsStore.set(r.user_id, r.data);
      }
    }

    // Independent per-table check: Orders
    if (ordersRes.error) {
      console.error('[HYDRATION ERROR] orders fetch failed:', ordersRes.error.message || ordersRes.error);
    } else if (Array.isArray(ordersRes.data) && ordersRes.data.length > 0) {
      for (const r of ordersRes.data) {
        if (r.id && r.data) serverOrdersDb.set(r.id, r.data);
      }
    }

    // Independent per-table check: CBT Results
    if (cbtRes.error) {
      console.error('[HYDRATION ERROR] cbt_results fetch failed:', cbtRes.error.message || cbtRes.error);
    } else if (Array.isArray(cbtRes.data) && cbtRes.data.length === 0) {
      console.warn('[SEED] cbt_results table confirmed empty (0 rows, no error) - seeding defaults');
      if (cbtResultsStore.size > 0) {
        try {
          await supabaseServer.from('cbt_results').upsert(Array.from(cbtResultsStore.entries()).map(([userId, resList]) => ({ user_id: userId, data: resList, updated_at: new Date().toISOString() })), { onConflict: 'user_id' });
        } catch (e) {
          console.error('[SEED ERROR] cbt_results:', e);
        }
      }
    } else if (Array.isArray(cbtRes.data) && cbtRes.data.length > 0) {
      cbtResultsStore.clear();
      for (const r of cbtRes.data) {
        if (r.user_id && r.data) cbtResultsStore.set(r.user_id, r.data);
      }
    }

    // Independent per-table check: Ad Rewards
    if (adRes.error) {
      console.error('[HYDRATION ERROR] ad_rewards fetch failed:', adRes.error.message || adRes.error);
    } else if (Array.isArray(adRes.data) && adRes.data.length === 0) {
      console.warn('[SEED] ad_rewards table confirmed empty (0 rows, no error) - seeding defaults');
      if (adRewardsDb.size > 0) {
        try {
          await supabaseServer.from('ad_rewards').upsert(Array.from(adRewardsDb.entries()).map(([email, rec]) => ({ id: email, email, data: rec, updated_at: new Date().toISOString() })), { onConflict: 'id' });
        } catch (e) {
          console.error('[SEED ERROR] ad_rewards:', e);
        }
      }
    } else if (Array.isArray(adRes.data) && adRes.data.length > 0) {
      adRewardsDb.clear();
      for (const r of adRes.data) {
        if (r.email && r.data) adRewardsDb.set(r.email.toLowerCase(), r.data);
        else if (r.id && r.data) adRewardsDb.set(r.id.toLowerCase(), r.data);
      }
    }

    // Independent per-table check: Study Buddy Queue
    if (queueRes.error) {
      console.error('[HYDRATION ERROR] study_buddy_queue fetch failed:', queueRes.error.message || queueRes.error);
    } else if (Array.isArray(queueRes.data) && queueRes.data.length > 0) {
      studyBuddyQueue.clear();
      for (const r of queueRes.data) {
        if (r.email && r.data) studyBuddyQueue.set(r.email.toLowerCase(), r.data);
      }
    }

    // Independent per-table check: Study Buddy Matches
    if (matchesRes.error) {
      console.error('[HYDRATION ERROR] study_buddy_matches fetch failed:', matchesRes.error.message || matchesRes.error);
    } else if (Array.isArray(matchesRes.data) && matchesRes.data.length > 0) {
      studyBuddyMatches.clear();
      for (const r of matchesRes.data) {
        if (r.room_id && r.data) studyBuddyMatches.set(r.room_id, r.data);
        else if (r.id && r.data) studyBuddyMatches.set(r.id, r.data);
      }
    }

    // Independent per-table check: Study Heartbeats
    if (heartbeatsRes.error) {
      console.error('[HYDRATION ERROR] study_heartbeats fetch failed:', heartbeatsRes.error.message || heartbeatsRes.error);
    } else if (Array.isArray(heartbeatsRes.data) && heartbeatsRes.data.length > 0) {
      studyHeartbeatsStore.clear();
      for (const r of heartbeatsRes.data) {
        const sid = r.session_id;
        if (!sid) continue;
        if (!studyHeartbeatsStore.has(sid)) studyHeartbeatsStore.set(sid, []);
        studyHeartbeatsStore.get(sid)!.push({
          id: r.id,
          userId: r.user_id,
          sessionId: r.session_id,
          subject: r.subject,
          topicId: r.topic_id,
          pingedAt: r.pinged_at
        });
      }
    }

    // Independent per-table check: Reward Milestones
    if (milestonesRes.error) {
      console.error('[HYDRATION ERROR] reward_milestones fetch failed:', milestonesRes.error.message || milestonesRes.error);
    } else if (Array.isArray(milestonesRes.data) && milestonesRes.data.length > 0) {
      for (const r of milestonesRes.data) {
        if (r.id && r.data) rewardMilestonesStore.set(r.id, r.data);
      }
    }

    // Independent per-table check: Reward Claims
    if (claimsRes.error) {
      console.error('[HYDRATION ERROR] reward_claims fetch failed:', claimsRes.error.message || claimsRes.error);
    } else if (Array.isArray(claimsRes.data) && claimsRes.data.length > 0) {
      for (const r of claimsRes.data) {
        if (r.id && r.data) rewardClaimsStore.set(r.id, r.data);
      }
    }

    // Independent per-table check: UTR Requests
    if (utrRes.error) {
      console.error('[HYDRATION ERROR] utr_requests fetch failed:', utrRes.error.message || utrRes.error);
    } else if (Array.isArray(utrRes.data) && utrRes.data.length > 0) {
      pendingUtrRequestsDb.clear();
      for (const r of utrRes.data) {
        const rec = mapRowToUtrRecord(r);
        if (rec.id) pendingUtrRequestsDb.set(rec.id, rec);
      }
    }

    // Independent per-table check: Admin Announcements
    if (announcementsRes.error) {
      console.error('[HYDRATION ERROR] admin_announcements fetch failed:', announcementsRes.error.message || announcementsRes.error);
    } else if (Array.isArray(announcementsRes.data) && announcementsRes.data.length > 0) {
      adminAnnouncementsStore.clear();
      for (const r of announcementsRes.data) {
        if (r.id && r.data) {
          adminAnnouncementsStore.set(r.id, r.data);
        }
      }
    }

    // Independent per-table check: Personal Syllabus Nodes
    if (personalSyllabusRes.error) {
      console.error('[HYDRATION ERROR] personal_syllabus_nodes fetch failed:', personalSyllabusRes.error.message || personalSyllabusRes.error);
    } else if (Array.isArray(personalSyllabusRes.data) && personalSyllabusRes.data.length > 0) {
      personalSyllabusNodesStore.clear();
      for (const r of personalSyllabusRes.data) {
        if (r.id) personalSyllabusNodesStore.set(r.id, r);
      }
    }

    // Optional check: Syllabus Time Log (if table exists)
    try {
      const { data: timeLogData } = await supabaseServer.from('syllabus_time_log').select('*');
      if (Array.isArray(timeLogData) && timeLogData.length > 0) {
        syllabusTimeLogsStore.clear();
        for (const r of timeLogData) {
          const uid = r.user_id || 'guest';
          if (!syllabusTimeLogsStore.has(uid)) syllabusTimeLogsStore.set(uid, []);
          syllabusTimeLogsStore.get(uid)!.push(r);
        }
      }
    } catch (_tlErr) {}
      try {
        const { data: fbData } = await supabaseServer.from('feedback_reports').select('id, section, type, description, user_email, email, status, admin_note, resolved_by, resolved_at, is_guest_submission, created_at');
        if (fbData && fbData.length > 0) {
          feedbackReportsStore.clear();
          fbData.forEach((r: any) => {
            feedbackReportsStore.set(r.id, {
              id: r.id,
              section: r.section,
              type: r.type,
              description: r.description,
              user_email: r.user_email || r.email || '',
              status: r.status || 'Pending',
              admin_note: r.admin_note || null,
              resolved_by: r.resolved_by || null,
              resolved_at: r.resolved_at || null,
              is_guest_submission: Boolean(r.is_guest_submission),
              created_at: r.created_at || new Date().toISOString()
            });
          });
        }
      } catch (_fbErr) {}
      try {
        const { data: edData } = await supabaseServer.from('educators').select('id, name, title, bio, avatar, rating, hourly_rate, subjects, data');
        if (edData && edData.length > 0) {
          educatorsStore.clear();
          for (const r of edData) {
            if (r.id) educatorsStore.set(r.id, r.data || r);
          }
        } else {
          for (const ed of DEFAULT_EDUCATORS_LIST) {
            await supabaseServer.from('educators').upsert([{ id: ed.id, data: ed, updated_at: new Date().toISOString() }], { onConflict: 'id' });
          }
        }
      } catch (_edErr) {}
      try {
        const { data: bkData } = await supabaseServer.from('educator_bookings').select('id, educator_id, user_email, date, slot, status, created_at, data');
        if (bkData && bkData.length > 0) {
          educatorBookingsStore.clear();
          for (const r of bkData) {
            if (r.id) educatorBookingsStore.set(r.id, r.data || r);
          }
        }
      } catch (_bkErr) {}
      try {
        const { data: podData } = await supabaseServer.from('podcasts').select('id, title, description, audio_url, duration, category, created_at, data');
        if (podData && podData.length > 0) {
          podcastsStore.clear();
          for (const r of podData) {
            if (r.id) podcastsStore.set(r.id, r.data || r);
          }
        } else {
          for (const pod of DEFAULT_PODCASTS_LIST) {
            await supabaseServer.from('podcasts').upsert([{ id: pod.id, data: pod, updated_at: new Date().toISOString() }], { onConflict: 'id' });
          }
        }
      } catch (_podErr) {}
      try {
        const { data: spData } = await supabaseServer.from('sponsors').select('id, name, logo, website, tier, status, data');
        if (spData && spData.length > 0) {
          sponsorsDb = spData.map((r: any) => r.data || r);
        } else {
          for (const sp of DEFAULT_SPONSORS_LIST) {
            await supabaseServer.from('sponsors').upsert([{ id: sp.id, data: sp, updated_at: new Date().toISOString() }], { onConflict: 'id' });
          }
        }
      } catch (_spErr) {}
      try {
        const { data: colData } = await supabaseServer.from('collaborators').select('id, name, role, avatar, bio, data');
        if (colData && colData.length > 0) {
          collaboratorsDb = colData.map((r: any) => r.data || r);
        } else {
          for (const col of DEFAULT_COLLABORATORS_LIST) {
            await supabaseServer.from('collaborators').upsert([{ id: col.id, data: col, updated_at: new Date().toISOString() }], { onConflict: 'id' });
          }
        }
      } catch (_colErr) {}
      try {
        const { data: inqData } = await supabaseServer.from('sponsor_inquiries').select('id, company_name, contact_email, message, created_at, data');
        if (inqData && inqData.length > 0) {
          sponsorInquiriesDb = inqData.map((r: any) => r.data || r);
        }
      } catch (_inqErr) {}
      try {
        const { data: actData } = await supabaseServer.from('office_activity_feed').select('id, action, user_name, timestamp, details, data');
        if (actData && actData.length > 0) {
          const loadedActs = actData.map((r: any) => r.data || r);
          loadedActs.sort((a: any, b: any) => new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime());
          officeActivityFeed = loadedActs.slice(0, 100);
        } else {
          for (const act of DEFAULT_OFFICE_ACTIVITIES) {
            await supabaseServer.from('office_activity_feed').upsert([{ id: act.id, data: act, updated_at: new Date().toISOString() }], { onConflict: 'id' });
          }
        }
      } catch (_actErr) {}
      try {
        const { data: blogData } = await supabaseServer.from('blog_posts').select('id, title, slug, summary, content, author, published_at, data');
        if (blogData && blogData.length > 0) {
          blogPostsStore.clear();
          for (const r of blogData) {
            const post = r.data ? { ...r.data, id: r.id } : r;
            if (post.id) blogPostsStore.set(post.id, post);
          }
        } else {
          for (const post of DEFAULT_BLOG_POSTS) {
            await supabaseServer.from('blog_posts').upsert([{ id: post.id, data: post, updated_at: new Date().toISOString() }], { onConflict: 'id' });
          }
        }
      } catch (_bpErr) {}
      try {
        const { data: reqData } = await supabaseServer.from('blog_content_requests').select('id, user_email, topic, description, votes, created_at, data');
        if (reqData && reqData.length > 0) {
          blogRequestsStore.clear();
          for (const r of reqData) {
            const reqItem = r.data ? { ...r.data, id: r.id } : r;
            if (reqItem.id) blogRequestsStore.set(reqItem.id, reqItem);
          }
        }
      } catch (_bqrErr) {}
      try {
        const { data: errData } = await supabaseServer.from('user_error_logs').select('id, user_id, error_message, stack_trace, path, created_at, data');
        if (errData && errData.length > 0) {
          userErrorLogsStore.clear();
          for (const r of errData) {
            const item = r.data ? { ...r.data, id: r.id } : r;
            if (item && item.id) {
              userErrorLogsStore.set(item.id, item);
            }
          }
        }
      } catch (_errLogErr) {}
      try {
        const { data: teamAppData } = await supabaseServer.from('team_applications').select('id, user_email, name, role_applied, message, status, created_at, data');
        if (teamAppData && teamAppData.length > 0) {
          teamApplicationsDb = teamAppData.map((r: any) => r.data || r);
        }
      } catch (_teamAppErr) {}
      try {
        const { data: pomData } = await supabaseServer.from('user_pomodoro_sessions').select('id, user_id, duration_minutes, completed_at, mode, task_name, created_at');
        if (pomData && pomData.length > 0) {
          userPomodoroSessionsDb = pomData.map((s: any) => ({
            id: s.id,
            userId: s.user_id,
            subject: s.subject || 'General Study',
            topic: s.topic || 'General Topic',
            duration: Number(s.duration) || 25,
            startTime: s.start_time,
            endTime: s.end_time,
            completedDuration: Number(s.completed_duration) || 0,
            status: s.status || 'COMPLETED',
            questionsAttempted: Number(s.questions_attempted) || 0,
            correctAnswers: Number(s.correct_answers) || 0,
            questionIds: Array.isArray(s.question_ids) ? s.question_ids : [],
            questionSources: Array.isArray(s.question_sources) ? s.question_sources : [],
            manualQuestions: Array.isArray(s.manual_questions) ? s.manual_questions : [],
            selectedQuestions: Array.isArray(s.selected_questions) ? s.selected_questions : [],
            accuracy: Number(s.accuracy) || 0,
            xpEarned: Number(s.xp_earned) || 0,
            createdAt: s.created_at || new Date().toISOString()
          }));
        }
      } catch (_pomErr) {}
      lockRazorpayEnvironment();
      console.log(`[PRIMARY DB] Hydrated server state from Supabase Primary Database successfully.`);
  };

  try {
    await Promise.race([performHydration(), timeoutPromise]);
  } catch (err: any) {
    if (err?.name === 'AbortError' || err?.message?.includes('HYDRATION TIMEOUT')) {
      console.log(`[PRIMARY DB] DB hydration timed out (${timeoutMs}ms) - falling back to local cached state.`);
    } else {
      console.warn('[PRIMARY DB] Failed to hydrate state from Supabase DB:', err?.message || err);
    }
  } finally {
    if (timerId) clearTimeout(timerId);
  }
}

export function loadAdminStoreFromDisk() {
  const possiblePaths = [
    path.join(process.cwd(), '.data', 'admin_store.json'),
    path.join(os.tmpdir(), 'aspirantx_data', 'admin_store.json'),
    path.join(os.tmpdir(), 'admin_store.json'),
  ];

  for (const filePath of possiblePaths) {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const store = JSON.parse(raw);
        if (store.globalAdminSettings) {
          globalAdminSettings = mergeAdminSettings(globalAdminSettings, store.globalAdminSettings);
        }
        if (Array.isArray(store.featureFlagsStore)) featureFlagsStore = store.featureFlagsStore;
        if (Array.isArray(store.orders)) {
          serverOrdersDb.clear();
          for (const [k, v] of store.orders) serverOrdersDb.set(k, v);
        }
        if (Array.isArray(store.subscriptions)) {
          for (const [k, v] of store.subscriptions) {
            if (!serverSubscriptionsDb.has(k)) serverSubscriptionsDb.set(k, v);
          }
        }
        if (Array.isArray(store.processedWebhookEvents)) {
          processedWebhookEvents.clear();
          for (const evId of store.processedWebhookEvents) processedWebhookEvents.add(evId);
        }
        if (Array.isArray(store.utrRequests)) {
          pendingUtrRequestsDb.clear();
          for (const [k, v] of store.utrRequests) pendingUtrRequestsDb.set(k, v);
        }
        if (Array.isArray(store.blockedAuditLogs)) blockedAuditLogs = store.blockedAuditLogs;
        if (Array.isArray(store.watchdogSystemLogs)) watchdogSystemLogs = store.watchdogSystemLogs;
        if (Array.isArray(store.adminUsers)) adminUsersDb = store.adminUsers;
        if (store.adminContent) adminContentDb = { ...adminContentDb, ...store.adminContent };
        if (Array.isArray(store.adminTeam)) adminTeamStore = store.adminTeam;
        if (Array.isArray(store.adminTasks)) adminTasksStore = store.adminTasks;
        lockRazorpayEnvironment();
        console.log(`[STORAGE] Admin store loaded from ${filePath}. Users: ${adminUsersDb.length}, Subscriptions: ${serverSubscriptionsDb.size}`);
        break;
      }
    } catch (_err) {
      continue;
    }
  }
}

export async function initializeServerState() {
  await hydrateFromPrimaryDatabase(15000);
  loadAdminStoreFromDisk();
}

initializeServerState();

export function verifyRazorpayPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean {
  if (!orderId || !paymentId || !signature || !secret) {
    return false;
  }
  try {
    const payload = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const bufExpected = Buffer.from(expectedSignature, 'utf-8');
    const bufReceived = Buffer.from(signature, 'utf-8');

    if (bufExpected.length !== bufReceived.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufExpected, bufReceived);
  } catch (err) {
    console.error('Crypto signature verification error:', err);
    return false;
  }
}

export function checkUserServerPremiumStatus(email?: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const normalizedEmail = email.trim().toLowerCase();
  const sub = serverSubscriptionsDb.get(normalizedEmail);
  if (!sub || !sub.isPremium) return false;
  if (sub.expiresAt) {
    const expTime = new Date(sub.expiresAt).getTime();
    if (isNaN(expTime) || expTime < Date.now()) return false;
  }
  return true;
}

export async function verifyTeacherOrAdmin(req: any, res: any, next: any) {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (!verifiedUser) {
    return res.status(401).json({ error: 'Authentication Required: Missing, invalid, or unverified Bearer token.' });
  }

  const userEmail = verifiedUser.email.trim().toLowerCase();
  const userId = verifiedUser.sub;

  let role = verifiedUser.role;

  if (userEmail && userEmail === DESIGNATED_ADMIN_EMAIL.toLowerCase()) {
    role = 'ADMIN';
  }

  if ((!role || role === 'USER' || role === 'STUDENT') && userEmail) {
    const known = adminUsersDb.find(u => u.email.toLowerCase() === userEmail);
    if (known && known.role) role = known.role;
  }

  if (role === 'TEACHER' || role === 'ADMIN' || role === 'CO_ADMIN' || role === 'DEVELOPER') {
    req.userRole = role;
    req.userEmail = userEmail;
    req.userId = userId;
    return next();
  }

  if (supabaseServer && userId) {
    try {
      const { data } = await supabaseServer.from('user_profiles').select('role').eq('id', userId).single();
      if (data?.role === 'TEACHER' || data?.role === 'ADMIN' || data?.role === 'CO_ADMIN' || data?.role === 'DEVELOPER') {
        req.userRole = data.role;
        req.userEmail = userEmail;
        req.userId = userId;
        return next();
      }
    } catch (_e) {}
  }

  return res.status(403).json({ error: 'Access denied: Teacher or Admin authorization required.' });
}

export const teacherProfilesStore = new Map<string, any>();

export const teacherClassesStore = new Map<string, any>();

export const classEnrollmentsStore = new Map<string, any[]>();

export const classAttendanceStore = new Map<string, any[]>();

export const classAssignmentsStore = new Map<string, any[]>();

export const assignmentSubmissionsStore = new Map<string, any[]>();

export const sponsorshipTiersStore = new Map<string, any>();

export const sponsorshipApplicationsStore = new Map<string, any>();

export const activeSponsorsStore = new Map<string, any>();

export function seedDefaultSponsorshipTiers() {
  if (sponsorshipTiersStore.size === 0) {
    const defaultTiers = [
      {
        id: 'tier_community',
        name: 'Community Partner',
        priceRange: 'INR 15,000 / month',
        benefits: ['Logo placement on Community Platform', 'Monthly partner shoutout in Newsletter', 'Custom Partner Badge on Profile'],
        sortOrder: 1,
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'tier_champion',
        name: 'Education Champion',
        priceRange: 'INR 35,000 / month',
        benefits: ['Featured Logo on Student Dashboard', 'Sponsor 500 Aspirant PRO Passes', 'Dedicated Banner in Study Groups', 'Co-host Monthly Masterclass'],
        sortOrder: 2,
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'tier_title',
        name: 'Title Sponsor',
        priceRange: 'INR 75,000 / month',
        benefits: ['Exclusive Title Branding across AspirantX', 'Custom Sponsored CBT Mock Test Series', 'Direct Internship & Hiring Channel for Aspirants', 'Primary Logo on All Exam Engine Banners'],
        sortOrder: 3,
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ];
    for (const t of defaultTiers) {
      sponsorshipTiersStore.set(t.id, t);
    }
  }

  if (activeSponsorsStore.size === 0) {
    const defaultSponsors = [
      {
        id: 'sp_1',
        name: 'EduTech India Foundation',
        logoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=120&auto=format&fit=crop&q=80',
        websiteUrl: 'https://example.com/edutech',
        tierName: 'Education Champion',
        testimonial: 'Partnering with AspirantX empowered us to sponsor over 1,000 underprivileged UPSC & NEET aspirants with high quality mock tests.',
        createdAt: new Date().toISOString()
      }
    ];
    for (const s of defaultSponsors) {
      activeSponsorsStore.set(s.id, s);
    }
  }
}

seedDefaultSponsorshipTiers();

export function calculateVerifiedMinutesForUser(userId: string, targetSubject?: string, targetTopicId?: string): { verifiedSeconds: number; verifiedMinutes: number } {
  let verifiedSeconds = 0;

  for (const [sessionId, hbs] of studyHeartbeatsStore.entries()) {
    const userHbs = hbs.filter(h => String(h.userId || h.user_id) === String(userId));
    if (userHbs.length === 0) continue;

    if (targetSubject && targetSubject.trim()) {
      const matchesSub = userHbs.some(h => String(h.subject || '').toLowerCase() === targetSubject.toLowerCase());
      if (!matchesSub) continue;
    }

    if (targetTopicId && targetTopicId.trim()) {
      const matchesTopic = userHbs.some(h => String(h.topicId || h.topic_id || '') === targetTopicId);
      if (!matchesTopic) continue;
    }

    const sorted = [...userHbs].sort((a, b) => {
      const ta = new Date(a.pingedAt || a.pinged_at).getTime();
      const tb = new Date(b.pingedAt || b.pinged_at).getTime();
      return ta - tb;
    });

    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i-1].pingedAt || sorted[i-1].pinged_at).getTime();
      const curr = new Date(sorted[i].pingedAt || sorted[i].pinged_at).getTime();
      const diffSec = (curr - prev) / 1000;
      if (diffSec > 0 && diffSec <= 35) {
        verifiedSeconds += Math.min(30, Math.round(diffSec));
      }
    }
  }

  return {
    verifiedSeconds,
    verifiedMinutes: Math.floor(verifiedSeconds / 60)
  };
}

export interface FeatureFlagItem {
  feature_name: string;
  label: string;
  description: string;
  is_premium: boolean;
}

export let defaultFeatureFlagsStore: FeatureFlagItem[] = [
  {
    feature_name: 'chat',
    label: 'AI Study Mentor & Mains Evaluator',
    description: '1-on-1 AI Answer Evaluation & Real-time Chat Assistant',
    is_premium: false,
  },
  {
    feature_name: 'ai_predictor',
    label: 'PYQ Syllabus Predictor Engine',
    description: 'Predictive completion dates and weightage analytics',
    is_premium: true,
  },
  {
    feature_name: 'timer',
    label: 'Live Group Pomodoro Timer',
    description: 'Shared timer, stopwatch, and XP study streak tracker',
    is_premium: false,
  },
  {
    feature_name: 'task',
    label: 'Task & Daily Planner Manager',
    description: 'Subject priority board and target deadline planner',
    is_premium: false,
  },
  {
    feature_name: 'community',
    label: 'Community Live Chat Rooms',
    description: 'UPSC/SSC peer study rooms and notes PDF file sharing',
    is_premium: false,
  },
  {
    feature_name: 'syllabus',
    label: 'Interactive Syllabus Tracker',
    description: 'Comprehensive UPSC/SSC subject, topic & subtopic tracker',
    is_premium: false,
  },
  {
    feature_name: 'cbt',
    label: 'CBT Mock Test Engine',
    description: 'AI custom mock generator & All-India live exam simulator',
    is_premium: true,
  },
  {
    feature_name: 'library',
    label: 'Aspirants Reference Library',
    description: 'UPSC standard textbooks, NCERT notes, and government policy reports',
    is_premium: false,
  },
  {
    feature_name: 'collaboration',
    label: 'Virtual Office Workspace',
    description: 'Presence desks, staff Kanban tracking, and content upload approval queues',
    is_premium: false,
  },
  {
    feature_name: 'pyq',
    label: 'Enterprise PYQ Archive (1991-2026)',
    description: 'Exhaustive civil service and entrance exam previous years question bank',
    is_premium: false,
  },
  {
    feature_name: 'question_bank',
    label: 'Question Bank & Practice Engine',
    description: '4000+ topic-tagged practice questions with interactive analytics',
    is_premium: false,
  },
];

export let featureFlagsStore: FeatureFlagItem[] = [...defaultFeatureFlagsStore];

export const activeUsersPresenceMap = new Map<string, { userId: string, email: string, name: string, exam: string, lastSeen: number, ip?: string }>();

export async function hydrateAnnouncementsFromSupabase() {
  if (!supabaseServer) return;
  try {
    const { data, error } = await supabaseServer.from('admin_announcements').select('*');
    if (!error && Array.isArray(data)) {
      adminAnnouncementsStore.clear();
      for (const row of data) {
        if (row.id && row.data) {
          adminAnnouncementsStore.set(row.id, row.data);
        }
      }
    }
  } catch (err) {
    console.warn('[ANNOUNCEMENTS] Error hydrating from Supabase:', err);
  }
}

export interface AiConversationRecord {
  id: string;
  userEmail: string;
  title: string;
  exam: string;
  mode: string;
  isPinned: boolean;
  isArchived: boolean;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiMessageRecord {
  id: string;
  conversationId: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  tokensUsed?: number;
  feedback?: 'like' | 'dislike' | null;
  modeTag?: string;
}

export const aiConversationsDb = new Map<string, AiConversationRecord>();

export const aiMessagesDb = new Map<string, AiMessageRecord[]>();

export function sanitizeAiPrompt(input: string): string {
  if (!input || typeof input !== 'string') return '';
  let clean = input.trim();
  const injectionPatterns = [
    /ignore (all )?previous instructions/gi,
    /system override/gi,
    /you are now in (dan|jailbreak|unrestricted) mode/gi,
    /disregard (all )?(system|safety) (prompts|rules)/gi,
  ];
  for (const pattern of injectionPatterns) {
    clean = clean.replace(pattern, '[SECURITY FILTERED]');
  }
  return clean.slice(0, 12000);
}

export function getSystemInstructionForMode(mode: string, exam: string, summary?: string): string {
  let modeSpecificPrompt = '';

  switch (mode) {
    case 'ncert_mentor':
      modeSpecificPrompt = `You are the NCERT Master & Conceptual Mentor for ${exam}. Break down core textbook concepts (Class 6-12 NCERTs) with vivid real-world analogies, flowcharts in markdown, key terms, and explicit connections to GS-1/2/3/4 syllabus papers.`;
      break;
    case 'mains_evaluator':
      modeSpecificPrompt = `You are a Senior UPSC Mains Examiner & Answer Evaluator. Analyze the user's answer or outline against official Civil Services criteria. Provide:
1. Overall Score out of 250 (or 10)
2. Breakdown: Structure (3/10), Core Content & Subheadings (3/10), Constitutional/Data References (2/10), Way Forward & Conclusion (2/10)
3. 3 Key Strengths & 3 Critical Weaknesses
4. Missed Keywords / Scheme Names / Supreme Court Judgments / Articles
5. Improved Model Answer Outline.`;
      break;
    case 'essay_evaluator':
      modeSpecificPrompt = `You are an Essay Paper Mentor for UPSC CSE (250 Marks). Evaluate the topic/draft using the PESTLE framework (Political, Economic, Social, Technological, Legal, Environmental). Grade Thesis clarity, paragraph transitions, multidimensional perspectives, quotes, and actionable conclusion.`;
      break;
    case 'ethics_analyst':
      modeSpecificPrompt = `You are a GS Paper 4 Ethics, Integrity & Aptitude Specialist. Deconstruct ethics case studies with:
1. Stakeholder Mapping (Primary & Secondary)
2. Ethical Dilemmas Involved (e.g. Efficiency vs Compassion, Personal Morality vs Official Duty)
3. Available Options Matrix with Pros & Cons
4. Justified Course of Action citing ARC 2nd Report, Nolan Principles, and Foundational Values of Civil Services.`;
      break;
    case 'pyq_solver':
      modeSpecificPrompt = `You are a PYQ Pattern Analyst & Elimination Technique Specialist for ${exam}. Deconstruct past 10-15 years questions, highlight recurring examiner traps, provide memory mnemonics, and show step-by-step elimination logic for Prelims & structural frameworks for Mains.`;
      break;
    case 'study_planner':
      modeSpecificPrompt = `You are an Executive UPSC Study Planner & Timetable Coach. Create realistic daily/weekly study routines customized to the aspirant's target year, balancing static subjects, current affairs, answer writing, optional subjects, and revision slots.`;
      break;
    case 'revision_coach':
      modeSpecificPrompt = `You are a Active Recall & Spaced Repetition Revision Coach. Generate high-yield flashcard pairs, mnemonic tricks (e.g. for ASEAN nations, Constitutional Bodies, Tiger Reserves), and 1-page bullet point summary sheets for rapid revision.`;
      break;
    case 'mock_interview':
      modeSpecificPrompt = `You are a former Civil Service Board Member for UPSC Personality Test. Ask realistic, probing DAF (Detailed Application Form) and current affairs questions. Guide the candidate on balanced stance, articulate tone, administrative diplomacy, and body language presentation.`;
      break;
    default:
      modeSpecificPrompt = `You are AspirantX AI Mentor, an elite, encouraging, high-precision study assistant for ${exam}. Provide ultra-structured, concise, exam-focused answers using bullet points, markdown formatting, LaTeX formulas, and key constitutional articles where applicable.`;
  }

  let fullPrompt = `${modeSpecificPrompt}\n\nMaintain a disciplined, encouraging, clear, and highly structured tone. Format answers using clean Markdown with headers, lists, code blocks, or KaTeX math expressions (e.g. \\alpha, \\frac{a}{b}) where appropriate.`;

  if (summary) {
    fullPrompt += `\n\n[CONVERSATION CONTEXT SUMMARY]: ${summary}`;
  }

  return fullPrompt;
}

export const syllabusNodesStore: Map<string, any> = new Map(
  INITIAL_SYLLABUS_HIERARCHY.map((node) => [node.id, { ...node, version: 1, updatedAt: new Date().toISOString() }])
);

export const pyqQueryCache = new Map<string, { data: any; timestamp: number }>();

export const qbQueryCache = new Map<string, { data: any; timestamp: number }>();

export const ACADEMIC_CACHE_TTL_MS = 3 * 60 * 1000;

export function getCachedAcademicResult(cacheMap: Map<string, { data: any; timestamp: number }>, key: string) {
  const entry = cacheMap.get(key);
  if (entry && Date.now() - entry.timestamp < ACADEMIC_CACHE_TTL_MS) {
    return entry.data;
  }
  if (entry) cacheMap.delete(key);
  return null;
}

export function setCachedAcademicResult(cacheMap: Map<string, { data: any; timestamp: number }>, key: string, data: any) {
  if (cacheMap.size > 200) cacheMap.clear();
  cacheMap.set(key, { data, timestamp: Date.now() });
}

export function normalizeQuestionItem(row: any): any { return normalizePyqItem(row); }

export function normalizePyqItem(row: any): any {
  if (!row) return null;
  const item = row.data && typeof row.data === 'object' ? { ...row.data, id: row.id || row.data.id } : { ...row };
  if (!item.id && row.id) item.id = row.id;
  if ((item.qualityStatus || 'readable') === 'corrupted') return null;
  if ((item.qualityStatus === 'review') && (item.correctOption === -1 || item.correctOption === undefined)) {
    item.correctOption = null;
    item.answerVerified = false;
  } else if (item.answerVerified === undefined) {
    item.answerVerified = true;
  }
  return item;
}

export const pyqStore: Map<string, any> = new Map(
  INITIAL_PYQS_DATABASE.map((pyq) => [pyq.id, { ...pyq, createdAt: new Date().toISOString() }])
);

export const questionBankStore: Map<string, any> = new Map(
  INITIAL_QUESTION_BANK.map((qb) => [qb.id, { ...qb, createdAt: new Date().toISOString() }])
);

export function getStandardSubject(examId: string, rawSubj: string): string {
  const exam = String(examId || '').toUpperCase();
  let s = String(rawSubj || '').trim().toLowerCase();
  s = s.replace(/^(nda|neet|upsc|ssc)\s+/i, '');

  if (exam.includes('NEET') || exam.includes('JENPAS') || exam.includes('ANM') || exam.includes('GNM') || exam.includes('NURSING')) {
    if (s.includes('physic')) return 'Physics';
    if (s.includes('chemist')) return 'Chemistry';
    if (s.includes('bio') || s.includes('botany') || s.includes('zoolog') || s.includes('physiol')) return 'Biology';
    return 'Biology';
  }

  if (exam.includes('NDA') || exam.includes('CDS') || exam.includes('DEFENCE') || exam.includes('AIR_FORCE')) {
    if (s.includes('math') || s.includes('calculus') || s.includes('algebra') || s.includes('trig') || s.includes('geometry') || s.includes('vector') || s.includes('probab')) return 'Mathematics';
    if (s.includes('engl')) return 'English';
    if (s.includes('physic')) return 'Physics';
    if (s.includes('chemist')) return 'Chemistry';
    if (s.includes('biolog') || s.includes('zoolog') || s.includes('botany')) return 'Biology';
    if (s.includes('geog')) return 'Geography';
    if (s.includes('hist')) return 'History of India';
    if (s.includes('polit')) return 'Indian Polity & Governance';
    if (s.includes('current') || s.includes('gk')) return 'Current Affairs & GK';
    return 'General Science';
  }

  if (exam.includes('UPSC') || exam.includes('PCS') || exam.includes('WBCS') || exam.includes('BPSC')) {
    if (s.includes('polit') || s.includes('govern') || s.includes('constitut') || s.includes('law')) return 'Indian Polity & Governance';
    if (s.includes('histor') || s.includes('culture') || s.includes('art') || s.includes('freedom')) return 'History of India';
    if (s.includes('environ') || s.includes('ecolog')) return 'Environment & Ecology';
    if (s.includes('geograph')) return 'Geography';
    if (s.includes('econom') || s.includes('finance')) return 'Economy';
    if (s.includes('sci') || s.includes('tech')) return 'Science & Technology';
    if (s.includes('internat') || s.includes('current') || s.includes('relation')) return 'International Relations & Current Affairs';
    if (s.includes('csat') || s.includes('aptit') || s.includes('reason') || s.includes('math')) return 'CSAT (Paper-2)';
    return 'General Studies';
  }

  if (exam.includes('SSC') || exam.includes('BANK') || exam.includes('PO') || exam.includes('RRB')) {
    if (s.includes('quant') || s.includes('math') || s.includes('arith') || s.includes('number') || s.includes('geomet') || s.includes('algeb')) return 'Quantitative Aptitude';
    if (s.includes('reason') || s.includes('intellig') || s.includes('logic') || s.includes('mental')) return 'General Intelligence & Reasoning';
    if (s.includes('english') || s.includes('compreh') || s.includes('verbal')) return 'English Comprehension';
    if (s.includes('aware') || s.includes('gk') || s.includes('general') || s.includes('current')) return 'General Awareness';
    return 'General Studies';
  }

  if (s.includes('physic')) return 'Physics';
  if (s.includes('chemist')) return 'Chemistry';
  if (s.includes('biolog') || s.includes('botan') || s.includes('zoolo')) return 'Biology';
  if (s.includes('math')) return 'Mathematics';
  if (s.includes('english')) return 'English';
  if (s.includes('polit')) return 'Indian Polity & Governance';

  return rawSubj || 'General Studies';
}

try {
  const neetJsonPath = path.join(process.cwd(), 'src', 'data', 'neetPyqs.json');
  if (fs.existsSync(neetJsonPath)) {
    const rawNeet = fs.readFileSync(neetJsonPath, 'utf-8');
    const neetPyqs = JSON.parse(rawNeet);
    if (Array.isArray(neetPyqs)) {
      neetPyqs.forEach(q => {
        const stdSubj = getStandardSubject(q.exam || 'NEET_UG', q.subject);
        pyqStore.set(q.id, { ...q, subject: stdSubj, createdAt: new Date().toISOString() });
        questionBankStore.set(q.id, {
          id: q.id,
          exam: q.exam,
          type: 'mcq',
          subject: stdSubj,
          topic: q.topic,
          questionText: q.questionText,
          options: q.options,
          correctOption: q.correctOption,
          solutionText: q.explanation,
          difficulty: q.difficulty,
          status: 'published',
          createdAt: new Date().toISOString()
        });
      });
      console.log(`[BOOT] Loaded ${neetPyqs.length} NEET PYQ questions from PDF successfully.`);
    }
  }
} catch (e: any) {
  console.warn('[BOOT] Failed to hydrate extracted NEET PDF questions:', e.message);
}

try {
  const ndaJsonPath = path.join(process.cwd(), 'src', 'data', 'ndaPyqs.json');
  if (fs.existsSync(ndaJsonPath)) {
    const rawNda = fs.readFileSync(ndaJsonPath, 'utf-8');
    const ndaPyqs = JSON.parse(rawNda);
    if (Array.isArray(ndaPyqs)) {
      ndaPyqs.forEach(q => {
        const stdSubj = getStandardSubject(q.exam || 'NDA_NA', q.subject);
        pyqStore.set(q.id, { ...q, subject: stdSubj, createdAt: new Date().toISOString() });
        questionBankStore.set(q.id, {
          id: q.id,
          exam: q.exam,
          type: 'mcq',
          subject: stdSubj,
          topic: q.topic,
          questionText: q.questionText,
          options: q.options,
          correctOption: q.correctOption,
          solutionText: q.explanation,
          difficulty: q.difficulty,
          status: 'published',
          createdAt: new Date().toISOString()
        });
      });
      console.log(`[BOOT] Loaded ${ndaPyqs.length} NDA PYQ questions from PDF successfully.`);
    }
  }
} catch (e: any) {
  console.warn('[BOOT] Failed to hydrate extracted NDA PDF questions:', e.message);
}

try {
  const pyqJsonPath = path.join(process.cwd(), 'src', 'data', 'allExtractedPyqs.json');
  if (fs.existsSync(pyqJsonPath)) {
    const rawData = fs.readFileSync(pyqJsonPath, 'utf-8');
    const pyqs = JSON.parse(rawData);
    if (Array.isArray(pyqs)) {
      pyqs.forEach(q => {
        const stdSubj = getStandardSubject(q.exam || 'UPSC_CSE', q.subject);
        pyqStore.set(q.id, { ...q, subject: stdSubj, createdAt: new Date().toISOString() });
      });
      console.log(`[BOOT] Loaded ${pyqs.length} extracted PYQ questions (NEET, NDA, UPSC) from PDF datasets successfully.`);
    }
  }
} catch (e: any) {
  console.warn('[BOOT] Failed to hydrate extracted PYQ dataset:', e.message);
}

try {
  const qbJsonPath = path.join(process.cwd(), 'src', 'data', 'allExtractedQb.json');
  if (fs.existsSync(qbJsonPath)) {
    const rawQb = fs.readFileSync(qbJsonPath, 'utf-8');
    const qbs = JSON.parse(rawQb);
    if (Array.isArray(qbs)) {
      qbs.forEach(q => {
        questionBankStore.set(q.id, { ...q, createdAt: new Date().toISOString() });
      });
      console.log(`[BOOT] Loaded ${qbs.length} extracted Question Bank items (NEET, NDA, UPSC) successfully.`);
    }
  }
} catch (e: any) {
  console.warn('[BOOT] Failed to hydrate extracted QB dataset:', e.message);
}

export const booksStore: Map<string, any> = new Map(
  COMPREHENSIVE_BOOKS_DATABASE.map((book) => [book.id, { ...book, createdAt: new Date().toISOString() }])
);

export const cleanSubjectName = (subj: string) => {
  let s = String(subj || '').trim();
  s = s.replace(/^(NDA|NEET|UPSC|SSC)\s+/i, '');
  return s;
};

export const normalizeExam = (e: string): string => {
  if (!e) return '';
  const raw = String(e).trim().toUpperCase();
  
  // Specific alias mappings
  if (raw === 'NEET' || raw === 'NEET_UG' || raw.includes('NEET UG') || raw.includes('NATIONAL ELIGIBILITY CUM ENTRANCE')) return 'NEET_UG';
  if (raw === 'UPSC' || raw === 'UPSC_CSE' || raw.includes('CIVIL SERVICES')) return 'UPSC_CSE';
  if (raw === 'SSC' || raw === 'SSC_CGL' || raw.includes('COMBINED GRADUATE LEVEL')) return 'SSC_CGL';
  if (raw === 'NDA' || raw === 'NDA_NA' || raw.includes('NATIONAL DEFENCE ACADEMY')) return 'NDA_NA';
  if (raw === 'JEE_MAIN' || raw === 'JEE' || raw.includes('JOINT ENTRANCE EXAMINATION')) return 'JEE_MAIN';
  if (raw === 'JEE_ADVANCED' || raw === 'JEE_ADV') return 'JEE_ADVANCED';
  if (raw === 'GATE_CS' || raw === 'GATE') return 'GATE_CS';
  if (raw === 'CAT' || raw.includes('COMMON ADMISSION TEST')) return 'CAT';
  if (raw === 'CDS' || raw.includes('COMBINED DEFENCE SERVICES')) return 'CDS';
  if (raw === 'AFCAT') return 'AFCAT';
  if (raw === 'CAPF') return 'CAPF_AC';
  if (raw === 'IBPS_PO' || raw === 'IBPS') return 'IBPS_PO';
  if (raw === 'SBI_PO') return 'SBI_PO';
  if (raw === 'RRB_NTPC' || raw === 'RRB') return 'RRB_NTPC';
  if (raw === 'UPPSC_PCS' || raw === 'UPPSC') return 'UPPSC_PCS';
  if (raw === 'BPSC' || raw.includes('BIHAR PUBLIC SERVICE')) return 'BPSC';
  if (raw === 'WBCS') return 'WBCS';
  if (raw === 'CLAT') return 'CLAT_UG';

  // Standardize punctuation to underscores
  return raw.replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
};

export interface QuestionRepeatInfo {
  repeatCount: number;
  repeatYears: number[];
  repeatType: 'exact' | 'similar' | 'none';
  matchedIds: string[];
}

export const pyqRepeatIndexMap = new Map<string, QuestionRepeatInfo>();

export const qbRepeatIndexMap = new Map<string, QuestionRepeatInfo>();

export function getTokens(text: string): Set<string> {
  const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = clean.split(/\s+/).filter((w) => w.length > 3);
  return new Set(words);
}

export function calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

export function buildSimilarityIndexes() {
  console.log('[INDEXER] Building precomputed question similarity and repeat index...');
  const startTime = Date.now();
  const pyqList = Array.from(pyqStore.values());
  const tokenMap = new Map<string, Set<string>>();

  pyqList.forEach((q) => {
    tokenMap.set(q.id, getTokens(q.questionText || ''));
  });

  const groups = new Map<string, any[]>();
  pyqList.forEach((q) => {
    const key = `${normalizeExam(q.exam || '')}:${getStandardSubject(q.exam || '', q.subject || '')}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(q);
  });

  groups.forEach((items) => {
    // Exact text map for instant O(1) matching
    const exactMap = new Map<string, any[]>();
    items.forEach((item) => {
      const norm = (item.questionText || '').trim().toLowerCase();
      if (!norm) return;
      if (!exactMap.has(norm)) exactMap.set(norm, []);
      exactMap.get(norm)!.push(item);
    });

    items.forEach((q1) => {
      const text1Norm = (q1.questionText || '').trim().toLowerCase();
      const exactMatches = text1Norm ? (exactMap.get(text1Norm) || []) : [q1];

      const matchedIdsSet = new Set<string>();
      const yearsSet = new Set<number>();

      exactMatches.forEach((em) => {
        matchedIdsSet.add(em.id);
        if (em.year) yearsSet.add(Number(em.year));
      });

      const hasExact = exactMatches.length > 1;

      pyqRepeatIndexMap.set(q1.id, {
        repeatCount: matchedIdsSet.size,
        repeatYears: Array.from(yearsSet).sort((a, b) => a - b),
        repeatType: hasExact ? 'exact' : 'none',
        matchedIds: Array.from(matchedIdsSet),
      });
    });
  });

  console.log(`[INDEXER] Fast repeat index built for ${pyqStore.size} items in ${Date.now() - startTime}ms.`);
}

setTimeout(() => buildSimilarityIndexes(), 100);

export function generateRealisticSyllabus(examId: string): any[] {
  const normId = examId.toUpperCase();
  let subjects: { name: string; chapters: { name: string; topics: string[] }[] }[] = [];

  if (normId.includes('NEET') || normId.includes('NURSING') || normId.includes('ANM') || normId.includes('GNM') || normId.includes('JENPAS') || normId.includes('JEPBN') || normId.includes('PNST')) {
    subjects = [
      {
        name: 'Biology (Botany & Zoology)',
        chapters: [
          { name: 'Diversity in Living World', topics: ['Taxonomy & Systematics', 'Five Kingdom Classification', 'Plant Kingdom', 'Animal Kingdom'] },
          { name: 'Structural Organisation', topics: ['Morphology of Flowering Plants', 'Anatomy of Flowering Plants', 'Animal Tissues'] },
          { name: 'Cell Structure & Function', topics: ['Cell Theory & Structure', 'Biomolecules', 'Cell Cycle & Cell Division'] },
          { name: 'Human Physiology', topics: ['Breathing & Respiration', 'Body Fluids & Circulation', 'Excretory Products', 'Neural Control & Coordination'] }
        ]
      },
      {
        name: 'Physics',
        chapters: [
          { name: 'Mechanics', topics: ['Units & Measurements', 'Motion in a Straight Line', 'Laws of Motion', 'Work, Energy & Power'] },
          { name: 'Thermodynamics & Waves', topics: ['Kinetic Theory of Gases', 'Laws of Thermodynamics', 'Oscillations', 'Wave Optics'] },
          { name: 'Electricity & Magnetism', topics: ['Electrostatics', 'Current Electricity', 'Magnetic Effects of Current', 'Electromagnetic Induction'] }
        ]
      },
      {
        name: 'Chemistry',
        chapters: [
          { name: 'Physical Chemistry', topics: ['Some Basic Concepts', 'Structure of Atom', 'Chemical Thermodynamics', 'Chemical Kinetics'] },
          { name: 'Organic Chemistry', topics: ['Basic Principles & Techniques', 'Hydrocarbons', 'Alcohols, Phenols & Ethers', 'Organic Compounds containing Nitrogen'] },
          { name: 'Inorganic Chemistry', topics: ['Classification of Elements', 'Chemical Bonding', 'Coordination Compounds', 'p-Block Elements'] }
        ]
      }
    ];
  } else if (normId.includes('JEE') || normId.includes('GATE') || normId.includes('JEECUP') || normId.includes('JELET') || normId.includes('JEXPO') || normId.includes('BITSAT') || normId.includes('IMU_CET') || normId.includes('JET')) {
    subjects = [
      {
        name: 'Mathematics',
        chapters: [
          { name: 'Calculus', topics: ['Limits, Continuity & Differentiability', 'Application of Derivatives', 'Definite & Indefinite Integrals', 'Differential Equations'] },
          { name: 'Algebra & Matrices', topics: ['Complex Numbers', 'Quadratic Equations', 'Matrices & Determinants', 'Probability & Statistics'] },
          { name: 'Coordinate Geometry', topics: ['Straight Lines', 'Circles', 'Conic Sections (Parabola, Ellipse, Hyperbola)'] }
        ]
      },
      {
        name: 'Physics',
        chapters: [
          { name: 'Classical Mechanics', topics: ['Kinematics & Rotational Dynamics', 'Gravitation', 'Properties of Solids & Liquids', 'Fluid Mechanics'] },
          { name: 'Electromagnetism', topics: ['Electrostatic Potential & Capacitance', 'Magnetic Fields & Forces', 'Alternating Currents', 'Electromagnetic Waves'] },
          { name: 'Modern Physics', topics: ['Dual Nature of Matter', 'Atoms & Nuclei', 'Semiconductor Electronics'] }
        ]
      },
      {
        name: 'Chemistry',
        chapters: [
          { name: 'Physical & General Chemistry', topics: ['States of Matter', 'Atomic Structure', 'Chemical Equilibrium', 'Electrochemistry'] },
          { name: 'Organic & Polymers', topics: ['Purification of Organic Compounds', 'Hydrocarbons', 'Polymers & Biomolecules', 'Chemistry in Everyday Life'] },
          { name: 'Inorganic & Metals', topics: ['Periodic Table & Periodic Properties', 'Metallurgy Processes', 'd and f Block Elements'] }
        ]
      }
    ];
  } else if (normId.includes('CLAT') || normId.includes('CAT') || normId.includes('CUET') || normId.includes('NET') || normId.includes('BED') || normId.includes('PO') || normId.includes('CLERK') || normId.includes('CTET')) {
    subjects = [
      {
        name: 'English Language & Comprehension',
        chapters: [
          { name: 'Reading Comprehension', topics: ['Fact-based passages', 'Inference-based questions', 'Vocabulary in context'] },
          { name: 'Grammar & Usage', topics: ['Sentence Correction', 'Error Spotting', 'Active & Passive Voice', 'Direct & Indirect Speech'] }
        ]
      },
      {
        name: 'Quantitative Aptitude',
        chapters: [
          { name: 'Arithmetic & Data Interpretation', topics: ['Percentage & Profit/Loss', 'Ratio & Proportion', 'Time, Speed & Distance', 'Bar Graphs & Pie Charts'] },
          { name: 'Algebra & Numbers', topics: ['Number Systems', 'Linear & Quadratic Equations', 'Permutations & Combinations'] }
        ]
      },
      {
        name: 'Logical & Analytical Reasoning',
        chapters: [
          { name: 'Analytical Reasoning', topics: ['Linear & Circular Arrangements', 'Syllogisms', 'Blood Relations', 'Coding-Decoding'] },
          { name: 'Critical Reasoning', topics: ['Strengthen & Weaken Arguments', 'Assumptions & Conclusions', 'Course of Action'] }
        ]
      },
      {
        name: 'General Awareness & Law',
        chapters: [
          { name: 'Current & Static GK', topics: ['National & International Events', 'Indian Constitution & Polity', 'Legal Aptitude & Maxims', 'History & Geography basics'] }
        ]
      }
    ];
  } else if (normId.includes('POLICE') || normId.includes('CONSTABLE') || normId.includes('SI')) {
    subjects = [
      {
        name: 'General Studies & GK',
        chapters: [
          { name: 'General Knowledge', topics: ['Indian History & Freedom Struggle', 'Indian Geography & Resources', 'General Science & Life science'] },
          { name: 'Current Affairs', topics: ['Sports & Awards', 'Important Days & Summits', 'Government Schemes & Policies'] }
        ]
      },
      {
        name: 'Numerical & Mental Ability',
        chapters: [
          { name: 'Numerical Ability', topics: ['Simplification & Number Series', 'LCM & HCF', 'Percentage, Profit & Loss', 'Simple & Compound Interest'] },
          { name: 'Mental Ability', topics: ['Logical Diagrams', 'Codified Relationships', 'Perception Test', 'Word Formation Test'] }
        ]
      },
      {
        name: 'Reasoning Ability',
        chapters: [
          { name: 'Logical Reasoning', topics: ['Analogies & Similarities', 'Space Visualization', 'Decision Making', 'Visual Memory', 'Arithmetical Reasoning'] }
        ]
      }
    ];
  } else {
    subjects = [
      {
        name: 'General Studies & GK',
        chapters: [
          { name: 'Indian History & Culture', topics: ['Ancient & Medieval India', 'Modern Indian History', 'National Movement & Art Forms'] },
          { name: 'Polity, Constitution & Geography', topics: ['Salient Features of Constitution', 'Fundamental Rights & Duties', 'Physical Geography of India'] }
        ]
      },
      {
        name: 'Quantitative Aptitude',
        chapters: [
          { name: 'Arithmetic Operations', topics: ['Number Systems & Decimals', 'Percentage & Profit/Loss', 'Ratio & Proportion', 'Time and Work', 'Average & Age problems'] },
          { name: 'Data Interpretation', topics: ['Tabulation & Line Charts', 'Bar Graphs & Histograms'] }
        ]
      },
      {
        name: 'General Intelligence & Reasoning',
        chapters: [
          { name: 'Verbal & Non-Verbal Reasoning', topics: ['Analogies & Classification', 'Series Completion & Coding', 'Blood Relations & Direction Sense', 'Paper Folding & Mirror Images'] }
        ]
      },
      {
        name: 'General English',
        chapters: [
          { name: 'Vocabulary & Grammar', topics: ['Synonyms & Antonyms', 'Idioms & Phrases', 'Sentence Correction', 'Cloze Test & Fillers'] }
        ]
      }
    ];
  }

  const nodes: any[] = [];
  let nodeIndex = 1;
  
  for (const sub of subjects) {
    for (const chap of sub.chapters) {
      for (const top of chap.topics) {
        const nodeId = `gen_node_${examId.toLowerCase()}_${nodeIndex++}`;
        nodes.push({
          id: nodeId,
          exam: examId,
          paper: 'Paper 1',
          subject: sub.name,
          chapter: chap.name,
          topic: top,
          subtopic: 'Core concepts, fundamental formulas, and standard application problems.',
          title: `${top} Core Syllabus Module`,
          stage: 'Prelims',
          weightage: 'High',
          estimatedHours: 2.5,
          createdAt: new Date().toISOString()
        });
      }
    }
  }

  return nodes;
}

export const pyqReviewQueueStore = new Map<string, any>();

export function parseFreeformSyllabus(rawText: string, examHint: string = 'UPSC_CSE') {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  const knownCategories = [
    'Polity & Governance', 'Indian History & Art', 'Geography & Environment',
    'Economy & Finance', 'Science & Technology', 'Current Affairs', 'General Studies',
    'Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Reasoning', 'Quantitative Aptitude'
  ];

  let currentSubject = 'General';
  let currentChapter = 'Chapter 1';
  const rawNodes: Array<{ subject: string; chapter: string; title: string; weightage: string }> = [];

  const hasMarkdown = lines.some(l => l.startsWith('#'));
  const hasOutline = lines.some(l => /^(?:\d+(\.\d+)*|[IVXLCDM]+\.|[A-Za-z]\))\s+/.test(l));
  const hasIndentationOrBullets = lines.some(l => /^([-*-]|\t|\s{2,})/.test(l));

  if (hasMarkdown) {
    for (const line of lines) {
      if (line.startsWith('# ')) {
        currentSubject = line.replace(/^#\s+/, '').trim();
      } else if (line.startsWith('## ')) {
        currentChapter = line.replace(/^##\s+/, '').trim();
      } else if (line.startsWith('### ') || line.startsWith('- ') || line.startsWith('* ') || line.startsWith('- ')) {
        const title = line.replace(/^(###\s+|[-*-]\s+)/, '').trim();
        rawNodes.push({ subject: currentSubject, chapter: currentChapter, title, weightage: 'Medium' });
      } else {
        rawNodes.push({ subject: currentSubject, chapter: currentChapter, title: line, weightage: 'Medium' });
      }
    }
  } else if (hasOutline) {
    for (const line of lines) {
      const outlineMatch = line.match(/^((?:\d+(\.\d+)*|[IVXLCDM]+\.|[A-Za-z]\))\s+)(.+)$/);
      if (outlineMatch) {
        const marker = outlineMatch[1].trim();
        const text = outlineMatch[3].trim();
        const dots = marker.split('.').length;
        if (dots === 1 && (marker.length <= 3 || /^[IVXLCDM]+\.$/.test(marker))) {
          currentSubject = text;
        } else if (dots === 2 || /^[A-Za-z]\)$/.test(marker)) {
          currentChapter = text;
        } else {
          rawNodes.push({ subject: currentSubject, chapter: currentChapter, title: text, weightage: 'Medium' });
        }
      } else {
        rawNodes.push({ subject: currentSubject, chapter: currentChapter, title: line, weightage: 'Medium' });
      }
    }
  } else if (hasIndentationOrBullets) {
    for (const line of lines) {
      if (/^[-*-]\s+/.test(line)) {
        const title = line.replace(/^[-*-]\s+/, '').trim();
        rawNodes.push({ subject: currentSubject, chapter: currentChapter, title, weightage: 'Medium' });
      } else {
        currentChapter = line;
      }
    }
  } else {
    const blocks = rawText.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
    if (blocks.length > 1) {
      for (const block of blocks) {
        const blockLines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (blockLines.length === 0) continue;
        const chap = blockLines[0];
        const topics = blockLines.slice(1);
        if (topics.length === 0) {
          rawNodes.push({ subject: currentSubject, chapter: 'General', title: chap, weightage: 'Medium' });
        } else {
          for (const t of topics) {
            rawNodes.push({ subject: currentSubject, chapter: chap, title: t, weightage: 'Medium' });
          }
        }
      }
    } else {
      for (const line of lines) {
        rawNodes.push({ subject: currentSubject, chapter: 'General', title: line, weightage: 'Medium' });
      }
    }
  }

  if (currentSubject === 'General') {
    const fullText = rawText.toLowerCase();
    for (const cat of knownCategories) {
      if (fullText.includes(cat.toLowerCase())) {
        currentSubject = cat;
        break;
      }
    }
  }

  for (const node of rawNodes) {
    if (node.subject === 'General' && currentSubject !== 'General') {
      node.subject = currentSubject;
    }
  }

  const processedNodes = rawNodes.map((node) => {
    let weightage = 'Medium';
    const lowerTitle = node.title.toLowerCase();
    
    if (
      lowerTitle.includes('(high)') ||
      lowerTitle.includes('(imp)') ||
      lowerTitle.includes('important') ||
      lowerTitle.includes('must know') ||
      lowerTitle.includes('scoring') ||
      lowerTitle.includes('frequently asked') ||
      lowerTitle.includes('**') ||
      lowerTitle.includes('!!')
    ) {
      weightage = 'High';
    } else if (
      lowerTitle.includes('optional') ||
      lowerTitle.includes('less important') ||
      lowerTitle.includes('rarely asked') ||
      lowerTitle.includes('skip')
    ) {
      weightage = 'Low';
    }

    let pyqMatchCount = 0;
    const keywords = lowerTitle.split(/\s+/).filter(w => w.length > 3);
    if (keywords.length > 0) {
      for (const pyq of pyqStore.values()) {
        const pyqText = `${pyq.topic || ''} ${pyq.questionText || ''}`.toLowerCase();
        if (keywords.some(kw => pyqText.includes(kw))) {
          pyqMatchCount++;
          if (pyqMatchCount >= 2) break;
        }
      }
      if (pyqMatchCount >= 2) {
        if (weightage === 'Low') weightage = 'Medium';
        else if (weightage === 'Medium') weightage = 'High';
      }
    }

    return {
      ...node,
      weightage
    };
  });

  const hierarchyMap: Record<string, Record<string, Array<{ title: string; weightage: string }>>> = {};
  for (const n of processedNodes) {
    if (!hierarchyMap[n.subject]) hierarchyMap[n.subject] = {};
    if (!hierarchyMap[n.subject][n.chapter]) hierarchyMap[n.subject][n.chapter] = [];
    hierarchyMap[n.subject][n.chapter].push({ title: n.title, weightage: n.weightage });
  }

  const detectedHierarchy = Object.entries(hierarchyMap).map(([subject, chaptersObj]) => ({
    subject,
    chapters: Object.entries(chaptersObj).map(([chapter, topics]) => ({
      chapter,
      topics
    }))
  }));

  return {
    nodes: processedNodes,
    detectedHierarchy
  };
}

export const cbtTestsStore = new Map<string, any>();

export const cbtResultsStore = new Map<string, any[]>();

export const adminCbtExamsStore = new Map<string, any>();

export const communityGroupsStore = new Map<string, any>();

export const communityPostsStore = new Map<string, any>();

export const communityVotesStore = new Map<string, { id: string; postId: string; userId: string; voteType: 'up' | 'down'; createdAt: string }>();

export const communityCommentsStore = new Map<string, any[]>();

export const communityReportsStore = new Map<string, any>();

export const userNotificationsStore = new Map<string, any[]>();

export const userWalletsStore = new Map<string, any>();

export const userPayoutsStore = new Map<string, any[]>();

export const allPayoutsStore = new Map<string, any>();

export const communityBookmarksStore = new Map<string, boolean>();

export const communityPollVotesStore = new Map<string, string>();

export const communityGroupMembershipsStore = new Map<string, boolean>();

export const userKarmaStore = new Map<string, { userId: string; postKarma: number; commentKarma: number; totalKarma: number; updatedAt: string }>();

export const karmaVotesStore = new Map<string, { id: string; voterId: string; targetType: 'post' | 'comment'; targetId: string; targetOwnerId: string; vote: 1 | -1; createdAt: string }>();

userKarmaStore.set('usr_mentor_tanya', { userId: 'usr_mentor_tanya', postKarma: 218, commentKarma: 45, totalKarma: 263, updatedAt: new Date().toISOString() });

userKarmaStore.set('usr_curr', { userId: 'usr_curr', postKarma: 42, commentKarma: 18, totalKarma: 60, updatedAt: new Date().toISOString() });

userKarmaStore.set('usr_guest_101', { userId: 'usr_guest_101', postKarma: 15, commentKarma: 5, totalKarma: 20, updatedAt: new Date().toISOString() });

export const DEFAULT_CBT_MOCKS = [
  {
    id: 'upsc_cbt_mock_01',
    title: 'UPSC CSE Prelims All India Grand Mock Test 2026 (GS Paper 1)',
    exam: 'UPSC_CSE',
    durationMinutes: 120,
    totalMarks: 200,
    sections: [{ name: 'General Studies Paper 1', durationMinutes: 120, totalQuestions: 5 }],
    markingScheme: { correct: 2.0, incorrect: 0.66 },
    questions: [
      {
        id: 'q_cbt_1',
        type: 'mcq',
        section: 'General Studies Paper 1',
        questionText: 'With reference to the Constitution of India, consider the following statements regarding the Preamble:\n1. The Preamble is a part of the Constitution and can be amended under Article 368.\n2. The Preamble is a source of power to the legislature and also a prohibition upon the powers of the legislature.\n3. In the Kesavananda Bharati case (1973), the Supreme Court held that the Preamble is an integral part of the Constitution.\n\nWhich of the statements given above are correct?',
        options: ['1 and 2 only', '1 and 3 only', '2 and 3 only', '1, 2 and 3'],
        correctOption: 1,
        language: 'English',
        subject: 'Indian Polity & Governance',
        topic: 'Preamble & Fundamental Rights',
        marks: 2.0,
        negativeMarks: 0.66,
        explanation: 'Statement 1 is correct: Preamble is amendable under Art 368 without altering basic structure. Statement 2 is INCORRECT: Preamble is NEITHER a source of power nor a limitation on power. Statement 3 is correct: Kesavananda Bharati case affirmed Preamble as part of Constitution.'
      },
      {
        id: 'q_cbt_2',
        type: 'passage',
        section: 'General Studies Paper 1',
        passageText: 'PASSAGE: The Monetary Policy Committee (MPC) constituted under Section 45ZB of the Reserve Bank of India Act, 1934 determines the policy repo rate required to achieve the inflation target.',
        questionText: 'Based on the passage and macroeconomic principles, consider the following statements regarding the Monetary Policy Committee (MPC):\n1. The MPC consists of six members, including three from RBI and three appointed by the Central Government.\n2. The Governor of the RBI acts as the ex-officio Chairperson of the MPC and possesses a casting vote in case of a tie.\n\nWhich of the above statements is/are correct?',
        options: ['1 only', '2 only', 'Both 1 and 2', 'Neither 1 nor 2'],
        correctOption: 2,
        language: 'English',
        subject: 'Indian Economy',
        topic: 'Monetary Policy & RBI',
        marks: 2.0,
        negativeMarks: 0.66,
        explanation: 'Both 1 and 2 are correct. MPC has 6 members and RBI Governor has casting vote.'
      },
      {
        id: 'q_cbt_3',
        type: 'assertion_reason',
        section: 'General Studies Paper 1',
        assertionText: 'Assertion (A): The Western Ghats in India are recognized as one of the world\'s eight "hottest hotspots" of biological diversity.',
        reasonText: 'Reason (R): The Western Ghats display exceptional levels of species endemism due to geographical isolation and microclimatic variations.',
        questionText: 'Select the correct answer using the options given below:',
        options: [
          'Both (A) and (R) are true, and (R) is the correct explanation of (A).',
          'Both (A) and (R) are true, but (R) is NOT the correct explanation of (A).',
          '(A) is true, but (R) is false.',
          '(A) is false, but (R) is true.'
        ],
        correctOption: 0,
        language: 'English',
        subject: 'Environment & Ecology',
        topic: 'Biodiversity Hotspots',
        marks: 2.0,
        negativeMarks: 0.66,
        explanation: 'Both Assertion and Reason are true and Reason correctly explains why Western Ghats is a biodiversity hotspot.'
      },
      {
        id: 'q_cbt_4',
        type: 'mcq',
        section: 'General Studies Paper 1',
        questionText: 'Consider the following statements regarding the Indian Ocean Dipole (IOD):\n1. A positive IOD characteristically brings cooler ocean waters in the eastern Indian Ocean and warmer waters in the western Indian Ocean.\n2. A positive IOD is generally associated with good rainfall over the Indian subcontinent during the monsoon season.\n\nWhich of the statements given above is/are correct?',
        options: ['1 only', '2 only', 'Both 1 and 2', 'Neither 1 nor 2'],
        correctOption: 2,
        language: 'English',
        subject: 'Geography',
        topic: 'Monsoon & Climate Dynamics',
        marks: 2.0,
        negativeMarks: 0.66,
        explanation: 'Both statements are correct. Positive IOD favors Indian Summer Monsoon.'
      },
      {
        id: 'q_cbt_5',
        type: 'paragraph',
        section: 'General Studies Paper 1',
        questionText: 'The ancient Harappan Civilization possessed advanced urban planning. Which among the following sites is famous for its unique water harvesting and reservoir system surrounded by stone masonry fortifications?',
        options: ['Lothal', 'Dholavira', 'Kalibangan', 'Rakhigarhi'],
        correctOption: 1,
        language: 'English',
        subject: 'History',
        topic: 'Indus Valley Civilization',
        marks: 2.0,
        negativeMarks: 0.66,
        explanation: 'Dholavira in Rann of Kutch, Gujarat is world-famous for its elaborate water management system with rock-cut reservoirs.'
      }
    ]
  },
  {
    id: 'ssc_cgl_cbt_mock_01',
    title: 'SSC CGL Tier-1 All India Speed Test Series 2026',
    exam: 'SSC_CGL',
    durationMinutes: 60,
    totalMarks: 200,
    sections: [
      { name: 'General Intelligence & Reasoning', durationMinutes: 15, totalQuestions: 2 },
      { name: 'General Awareness', durationMinutes: 15, totalQuestions: 2 },
      { name: 'Quantitative Aptitude', durationMinutes: 15, totalQuestions: 2 }
    ],
    markingScheme: { correct: 2.0, incorrect: 0.5 },
    questions: [
      {
        id: 'q_ssc_1',
        type: 'mcq',
        section: 'General Intelligence & Reasoning',
        questionText: 'Select the missing number in the following series:\n12, 23, 45, 89, 177, ?',
        options: ['353', '355', '351', '349'],
        correctOption: 0,
        language: 'English',
        subject: 'Reasoning',
        topic: 'Number Series',
        marks: 2.0,
        negativeMarks: 0.5,
        explanation: 'Pattern: (12 * 2) - 1 = 23; (23 * 2) - 1 = 45; (45 * 2) - 1 = 89; (89 * 2) - 1 = 177; (177 * 2) - 1 = 353.'
      },
      {
        id: 'q_ssc_2',
        type: 'mcq',
        section: 'General Intelligence & Reasoning',
        questionText: 'If "POLITY" is coded as "QNKNUX", how is "RIGHTS" coded in that language?',
        options: ['SJHITR', 'SHFISR', 'SHGIST', 'SJGIUR'],
        correctOption: 3,
        language: 'English',
        subject: 'Reasoning',
        topic: 'Coding Decoding',
        marks: 2.0,
        negativeMarks: 0.5,
        explanation: 'Pattern alternates +1, -1, +1, -1 for adjacent letters.'
      },
      {
        id: 'q_ssc_3',
        type: 'mcq',
        section: 'General Awareness',
        questionText: 'Who among the following was the founder of the Brahmo Samaj in 1828?',
        options: ['Swami Dayananda Saraswati', 'Raja Ram Mohan Roy', 'Ishwar Chandra Vidyasagar', 'Swami Vivekananda'],
        correctOption: 1,
        language: 'English',
        subject: 'History',
        topic: 'Socio-Religious Movements',
        marks: 2.0,
        negativeMarks: 0.5,
        explanation: 'Raja Ram Mohan Roy founded Brahmo Sabha in 1828, later renamed Brahmo Samaj.'
      },
      {
        id: 'q_ssc_4',
        type: 'mcq',
        section: 'General Awareness',
        questionText: 'Which organ in the human body produces bile juice stored in the gallbladder?',
        options: ['Pancreas', 'Liver', 'Kidney', 'Stomach'],
        correctOption: 1,
        language: 'English',
        subject: 'General Science',
        topic: 'Human Anatomy',
        marks: 2.0,
        negativeMarks: 0.5,
        explanation: 'Bile is synthesized by the liver and stored in the gallbladder.'
      },
      {
        id: 'q_ssc_5',
        type: 'numerical',
        section: 'Quantitative Aptitude',
        questionText: 'A train 240 m long passes a telegraph post in 12 seconds. What is the speed of the train in km/h?',
        options: ['72 km/h', '60 km/h', '80 km/h', '54 km/h'],
        correctOption: 0,
        language: 'English',
        subject: 'Quantitative Aptitude',
        topic: 'Speed, Time & Distance',
        marks: 2.0,
        negativeMarks: 0.5,
        explanation: 'Speed = Distance / Time = 240 / 12 = 20 m/s. Convert to km/h: 20 * (18/5) = 72 km/h.'
      },
      {
        id: 'q_ssc_6',
        type: 'numerical',
        section: 'Quantitative Aptitude',
        questionText: 'If the simple interest on a sum of money at 8% per annum for 3 years is Rs. 1,200, find the principal sum.',
        options: ['Rs. 5,000', 'Rs. 4,500', 'Rs. 6,000', 'Rs. 5,500'],
        correctOption: 0,
        language: 'English',
        subject: 'Quantitative Aptitude',
        topic: 'Simple Interest',
        marks: 2.0,
        negativeMarks: 0.5,
        explanation: 'Principal P = (SI * 100) / (R * T) = (1200 * 100) / (8 * 3) = 120000 / 24 = Rs. 5,000.'
      }
    ]
  },
  {
    id: 'neet_ug_cbt_mock_01',
    title: 'NEET UG All India National Grand Mock Test 2026 (Physics, Chem & Bio)',
    exam: 'NEET_UG',
    durationMinutes: 180,
    totalMarks: 720,
    sections: [
      { name: 'Physics', durationMinutes: 45, totalQuestions: 2 },
      { name: 'Chemistry', durationMinutes: 45, totalQuestions: 2 },
      { name: 'Biology', durationMinutes: 90, totalQuestions: 2 }
    ],
    markingScheme: { correct: 4.0, incorrect: 1.0 },
    questions: [
      {
        id: 'q_neet_1',
        type: 'mcq',
        section: 'Physics',
        questionText: 'A particle starts from rest with a uniform acceleration of 2 m/s². The distance travelled by the particle in the 5th second is:',
        options: ['9 m', '10 m', '25 m', '12 m'],
        correctOption: 0,
        language: 'English',
        subject: 'Physics',
        topic: 'Kinematics in 1D',
        marks: 4.0,
        negativeMarks: 1.0,
        explanation: 'Distance in nth second: Sn = u + a/2 * (2n - 1) = 0 + 2/2 * (2*5 - 1) = 9 m.'
      },
      {
        id: 'q_neet_2',
        type: 'mcq',
        section: 'Physics',
        questionText: 'Two point charges +3µC and -3µC are separated by a distance of 2cm in air. What is the electric dipole moment of the system?',
        options: ['6 × 10⁻⁸ C·m', '6 × 10⁻⁶ C·m', '3 × 10⁻⁸ C·m', '1.5 × 10⁻⁸ C·m'],
        correctOption: 0,
        language: 'English',
        subject: 'Physics',
        topic: 'Electrostatics',
        marks: 4.0,
        negativeMarks: 1.0,
        explanation: 'Dipole moment p = q × 2a = (3 × 10⁻⁶) × (2 × 10⁻²) = 6 × 10⁻⁸ C·m.'
      },
      {
        id: 'q_neet_3',
        type: 'mcq',
        section: 'Chemistry',
        questionText: 'Which among the following coordination compounds exhibits optical isomerism?',
        options: ['[Co(en)₃]³⁺', 'trans-[Co(NH₃)₄Cl₂]⁺', 'cis-[Pt(NH₃)₂Cl₂]', '[Zn(en)₂]²⁺ (tetrahedral)'],
        correctOption: 0,
        language: 'English',
        subject: 'Chemistry',
        topic: 'Coordination Compounds',
        marks: 4.0,
        negativeMarks: 1.0,
        explanation: 'Tris-chelate octahedral complex [Co(en)₃]³⁺ lacks plane of symmetry and exhibits optical isomerism.'
      },
      {
        id: 'q_neet_4',
        type: 'mcq',
        section: 'Chemistry',
        questionText: 'The pH of a 10⁻⁸ M aqueous solution of HCl at 25°C is:',
        options: ['8.00', '6.98', '7.00', '1.00'],
        correctOption: 1,
        language: 'English',
        subject: 'Chemistry',
        topic: 'Ionic Equilibrium',
        marks: 4.0,
        negativeMarks: 1.0,
        explanation: 'Total [H⁺] = 10⁻⁸ (from HCl) + 10⁻⁷ (from water) = 1.1 × 10⁻⁷ M, yielding pH = 6.98.'
      },
      {
        id: 'q_neet_5',
        type: 'mcq',
        section: 'Biology',
        questionText: 'In cellular respiration, what is the net gain of ATP molecules per molecule of glucose oxidized in glycolysis?',
        options: ['2 ATP', '4 ATP', '36 ATP', '38 ATP'],
        correctOption: 0,
        language: 'English',
        subject: 'Biology',
        topic: 'Respiration in Plants',
        marks: 4.0,
        negativeMarks: 1.0,
        explanation: 'Glycolysis yields 4 ATP total and consumes 2 ATP, resulting in a net gain of 2 ATP.'
      },
      {
        id: 'q_neet_6',
        type: 'mcq',
        section: 'Biology',
        questionText: 'Which hormone triggers ovulation and the development of corpus luteum in human females?',
        options: ['Luteinizing Hormone (LH)', 'Follicle Stimulating Hormone (FSH)', 'Estrogen', 'Progesterone'],
        correctOption: 0,
        language: 'English',
        subject: 'Biology',
        topic: 'Human Reproduction',
        marks: 4.0,
        negativeMarks: 1.0,
        explanation: 'A rapid surge in LH (LH surge) mid-cycle induces rupture of Graafian follicle and releases the ovum.'
      }
    ]
  },
  {
    id: 'nda_na_cbt_mock_01',
    title: 'NDA / NA All India Defense Officers Mock Test (Maths & GAT)',
    exam: 'NDA_NA',
    durationMinutes: 150,
    totalMarks: 300,
    sections: [
      { name: 'Mathematics', durationMinutes: 75, totalQuestions: 2 },
      { name: 'General Ability Test (GAT)', durationMinutes: 75, totalQuestions: 2 }
    ],
    markingScheme: { correct: 2.5, incorrect: 0.83 },
    questions: [
      {
        id: 'q_nda_1',
        type: 'mcq',
        section: 'Mathematics',
        questionText: 'If sin θ + cos θ = √2 cos θ, then what is the value of cos θ - sin θ?',
        options: ['√2 sin θ', '√2 cos θ', 'sin θ', '-√2 sin θ'],
        correctOption: 0,
        language: 'English',
        subject: 'Mathematics',
        topic: 'Trigonometry',
        marks: 2.5,
        negativeMarks: 0.83,
        explanation: 'Squaring both sides and simplifying yields cos θ - sin θ = √2 sin θ.'
      },
      {
        id: 'q_nda_2',
        type: 'mcq',
        section: 'Mathematics',
        questionText: 'What is the value of lim (x → 0) (sin 3x) / (tan 2x)?',
        options: ['3/2', '2/3', '1', '0'],
        correctOption: 0,
        language: 'English',
        subject: 'Mathematics',
        topic: 'Limits & Calculus',
        marks: 2.5,
        negativeMarks: 0.83,
        explanation: 'lim (x → 0) [ (sin 3x / 3x) * 3 ] / [ (tan 2x / 2x) * 2 ] = (1 * 3) / (1 * 2) = 3/2.'
      },
      {
        id: 'q_nda_3',
        type: 'mcq',
        section: 'General Ability Test (GAT)',
        questionText: 'Where is the headquarters of the Indian National Defence Academy (NDA) located?',
        options: ['Khadakwasla, Pune', 'Dehradun', 'Dungigal, Hyderabad', 'Ezhimala, Kerala'],
        correctOption: 0,
        language: 'English',
        subject: 'General Knowledge',
        topic: 'Defense Institutions',
        marks: 2.5,
        negativeMarks: 0.83,
        explanation: 'The National Defence Academy (NDA) is located at Khadakwasla near Pune, Maharashtra.'
      },
      {
        id: 'q_nda_4',
        type: 'mcq',
        section: 'General Ability Test (GAT)',
        questionText: 'Which optical phenomenon is primarily responsible for the sparkling brilliance of diamonds?',
        options: ['Total Internal Reflection', 'Refraction', 'Dispersion', 'Interference'],
        correctOption: 0,
        language: 'English',
        subject: 'Physics',
        topic: 'Ray Optics',
        marks: 2.5,
        negativeMarks: 0.83,
        explanation: 'The small critical angle of diamond (24.4°) ensures multiple total internal reflections of trapped light.'
      }
    ]
  }
];

DEFAULT_CBT_MOCKS.forEach((m) => cbtTestsStore.set(m.id, m));

export const DEFAULT_COMMUNITY_GROUPS = [
  {
    id: 'grp_upsc_general',
    name: 'UPSC CSE 2026 Strategy & Mentorship',
    description: 'Comprehensive discussions on Prelims & Mains GS Strategy, optional papers, daily answer writing, and topper notes.',
    exam: 'UPSC_CSE',
    category: 'public',
    icon: 'Target',
    membersCount: 1420,
    postsCount: 56,
    isJoined: true,
    rules: [
      'Be respectful and constructive.',
      'Cite sources for current affairs and notes.',
      'No spamming or self-promotion.'
    ]
  },
  {
    id: 'grp_neet_aiims',
    name: 'NEET UG 2026 AIIMS Mission 700+',
    description: 'High-yield NCERT Biology mnemonics, Physics numericals shortcuts, Organic Chemistry reaction charts, and mock test post-mortems.',
    exam: 'NEET_UG',
    category: 'public',
    icon: 'Sparkles',
    membersCount: 2310,
    postsCount: 88,
    isJoined: true,
    rules: ['Strictly stick to NCERT syllabus.', 'Share verified formulas only.']
  },
  {
    id: 'grp_jee_advanced',
    name: 'JEE Advanced 2026 Problem Solvers',
    description: 'Challenging physics mechanics problems, Irodov discussion, advanced calculus problem threads, and JEE ranking strategies.',
    exam: 'JEE_MAIN',
    category: 'public',
    icon: 'Zap',
    membersCount: 1890,
    postsCount: 42,
    isJoined: false,
    rules: ['Provide complete step-by-step solutions when sharing doubts.']
  }
];

export const DEFAULT_COMMUNITY_POSTS = [
  {
    id: 'post_upsc_1',
    groupId: 'grp_upsc_general',
    groupName: 'UPSC CSE 2026 Strategy & Mentorship',
    title: 'High-Yield Modern Indian History (1857-1947) Timeline & Spectrum Micro-Notes',
    content: 'Fellow Aspirants! Here is a concise 5-page revision matrix covering all Governor-Generals, Congress sessions, Peasant movements, and Constitutional milestones. Perfect for quick Prelims revision before CBT tests!\n\nKey Highlights:\n- Charter Acts 1773-1853 summary\n- Revolutionary Phase I & II comparisons\n- Round Table Conferences key attendees',
    authorName: 'Aarav Sharma (AIR 48 Aspirant)',
    authorAvatar: '',
    authorBadge: 'Topper Contributor',
    authorId: 'usr_topper_aarav',
    exam: 'UPSC_CSE',
    category: 'notes',
    tags: ['History', 'ModernIndia', 'Prelims2026', 'HighYield'],
    score: 142,
    upvotesCount: 142,
    downvotesCount: 0,
    likesCount: 142,
    isLiked: false,
    isBookmarked: false,
    isPinned: true,
    tippedCoins: 65,
    repliesCount: 18,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'post_neet_1',
    groupId: 'grp_neet_aiims',
    groupName: 'NEET UG 2026 AIIMS Mission 700+',
    title: 'Complete Genetics & Molecular Biology Formula & Pedigree Analysis Cheat Sheet',
    content: 'Consolidated all Hardy-Weinberg equilibrium problem variations, dihybrid cross phenotypic & genotypic ratios, and pedigree chart decision trees into one place. Hope this saves you 15+ marks in Botany/Zoology!',
    authorName: 'Dr. Tanya Verma (AIIMS New Delhi Aspirant)',
    authorAvatar: '',
    authorBadge: 'Biology Mentor',
    authorId: 'usr_mentor_tanya',
    exam: 'NEET_UG',
    category: 'notes',
    tags: ['Genetics', 'NEETBiology', 'NCERT', 'Mnemonics'],
    score: 218,
    upvotesCount: 218,
    downvotesCount: 0,
    likesCount: 218,
    isLiked: false,
    isBookmarked: false,
    isPinned: true,
    tippedCoins: 120,
    repliesCount: 34,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

DEFAULT_COMMUNITY_GROUPS.forEach((g) => communityGroupsStore.set(g.id, g));

DEFAULT_COMMUNITY_POSTS.forEach((p) => communityPostsStore.set(p.id, p));

export async function hydrateCommunityPostsFromSupabase() {
  if (!supabaseServer) return;
  try {
    const { data: postsData, error: postsErr } = await supabaseServer.from('community_posts').select('*');
    if (postsErr) {
      console.warn('[HYDRATION COMMUNITY POSTS NOTICE]', postsErr.message);
    } else if (Array.isArray(postsData) && postsData.length > 0) {
      postsData.forEach((row: any) => {
        const item = row.data || row;
        if (item && item.id) {
          communityPostsStore.set(item.id, item);
        }
      });
    }

    const { data: votesData, error: votesErr } = await supabaseServer.from('community_votes').select('*');
    if (votesErr) {
      console.warn('[HYDRATION COMMUNITY VOTES NOTICE]', votesErr.message);
    } else if (Array.isArray(votesData) && votesData.length > 0) {
      votesData.forEach((row: any) => {
        const item = row.data || row;
        const key = row.key || (item.postId && item.userId ? `${item.postId}:${item.userId}` : item.id);
        if (key && item) {
          communityVotesStore.set(key, item);
        }
      });
    }

    const { data: groupsData, error: groupsErr } = await supabaseServer.from('community_groups').select('*');
    if (groupsErr) {
      console.warn('[HYDRATION COMMUNITY GROUPS NOTICE]', groupsErr.message);
    } else if (Array.isArray(groupsData) && groupsData.length > 0) {
      groupsData.forEach((row: any) => {
        const item = row.data || row;
        if (item && item.id) {
          communityGroupsStore.set(item.id, item);
        }
      });
    }
  } catch (e: any) {
    console.warn('[HYDRATION COMMUNITY NOTICE]', e?.message || e);
  }
}

export async function hydrateWalletsFromSupabase(userId?: string) {
  if (!supabaseServer) return;
  try {
    let query = supabaseServer.from('user_wallets').select('*');
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { data, error } = await query;
    if (error) {
      console.warn('[HYDRATION WALLETS NOTICE]', error.message);
    } else if (Array.isArray(data) && data.length > 0) {
      data.forEach((row: any) => {
        const uid = row.user_id || row.id;
        const wData = row.data || row;
        if (uid && wData) {
          userWalletsStore.set(uid, wData);
        }
      });
    }
  } catch (e: any) {
    console.warn('[HYDRATION WALLETS NOTICE]', e?.message || e);
  }
}

export async function hydratePayoutsFromSupabase() {
  if (!supabaseServer) return;
  try {
    const { data, error } = await supabaseServer.from('user_payouts').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('[HYDRATION PAYOUTS NOTICE]', error.message);
    } else if (Array.isArray(data) && data.length > 0) {
      data.forEach((row: any) => {
        const payout = row.data || row;
        if (payout && payout.id) {
          allPayoutsStore.set(payout.id, payout);
          const uId = payout.userId || row.user_id;
          if (uId) {
            const userList = userPayoutsStore.get(uId) || [];
            if (!userList.some((p: any) => p.id === payout.id)) {
              userList.push(payout);
              userPayoutsStore.set(uId, userList);
            }
          }
        }
      });
    }
  } catch (e: any) {
    console.warn('[HYDRATION PAYOUTS NOTICE]', e?.message || e);
  }
}

export async function hydrateKarmaFromSupabase(userId?: string) {
  if (!supabaseServer) return;
  try {
    let karmaQuery = supabaseServer.from('user_karma').select('*');
    if (userId) karmaQuery = karmaQuery.eq('user_id', userId);
    const { data: kData, error: kErr } = await karmaQuery;
    if (kErr) {
      console.warn('[HYDRATION USER KARMA NOTICE]', kErr.message);
    } else if (Array.isArray(kData) && kData.length > 0) {
      kData.forEach((row: any) => {
        const uid = row.user_id || row.id;
        if (uid) {
          const postKarma = Number(row.post_karma) || 0;
          const commentKarma = Number(row.comment_karma) || 0;
          const totalKarma = Number(row.total_karma) ?? (postKarma + commentKarma);
          userKarmaStore.set(uid, {
            userId: uid,
            postKarma,
            commentKarma,
            totalKarma,
            updatedAt: row.updated_at || new Date().toISOString(),
          });
        }
      });
    }

    let votesQuery = supabaseServer.from('karma_votes').select('*');
    if (userId) votesQuery = votesQuery.or(`voter_id.eq.${userId},target_owner_id.eq.${userId}`);
    const { data: vData, error: vErr } = await votesQuery;
    if (vErr) {
      console.warn('[HYDRATION KARMA VOTES NOTICE]', vErr.message);
    } else if (Array.isArray(vData) && vData.length > 0) {
      vData.forEach((row: any) => {
        const key = `${row.voter_id || row.user_id}:${row.target_type}:${row.target_id}`;
        karmaVotesStore.set(key, {
          id: row.id || key,
          voterId: row.voter_id || row.user_id,
          targetType: row.target_type,
          targetId: row.target_id,
          targetOwnerId: row.target_owner_id,
          vote: row.vote,
          createdAt: row.created_at || new Date().toISOString(),
        });
      });
    }
  } catch (e: any) {
    console.warn('[HYDRATION KARMA NOTICE]', e?.message || e);
  }
}

export function recalculateUserKarma(userId: string) {
  let postKarma = 0;
  let commentKarma = 0;
  karmaVotesStore.forEach((v) => {
    if (v.targetOwnerId === userId) {
      if (v.targetType === 'post') postKarma += v.vote;
      else if (v.targetType === 'comment') commentKarma += v.vote;
    }
  });

  const existing = userKarmaStore.get(userId);
  const finalPost = karmaVotesStore.size > 0 ? postKarma : (existing?.postKarma ?? postKarma);
  const finalComment = karmaVotesStore.size > 0 ? commentKarma : (existing?.commentKarma ?? commentKarma);

  const record = {
    userId,
    postKarma: finalPost,
    commentKarma: finalComment,
    totalKarma: finalPost + finalComment,
    updatedAt: new Date().toISOString(),
  };
  userKarmaStore.set(userId, record);
  return record;
}

hydrateCommunityPostsFromSupabase().catch((err) => console.error('[INIT HYDRATE COMMUNITY ERROR]', err));

hydrateWalletsFromSupabase().catch((err) => console.error('[INIT HYDRATE WALLETS ERROR]', err));

hydratePayoutsFromSupabase().catch((err) => console.error('[INIT HYDRATE PAYOUTS ERROR]', err));

hydrateKarmaFromSupabase().catch((err) => console.error('[INIT HYDRATE KARMA ERROR]', err));

export const DEFAULT_NOTIFS = [
  {
    id: 'notif_1',
    userId: 'usr_default',
    title: 'Daily Study Target Alert [GOAL]',
    message: 'You have completed 6.5 hours out of your 10.0 hours study target today! 3.5 hours remaining.',
    type: 'study_reminder',
    read: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'notif_2',
    userId: 'usr_default',
    title: 'New CBT All India Mock Test Released!',
    message: 'UPSC CSE All India Grand Mock Test 2026 (GS Paper 1) is live now. Attempt now to benchmark your national rank.',
    type: 'mock_test',
    read: false,
    createdAt: new Date().toISOString(),
    actionUrl: 'cbt_exam'
  }
];

userNotificationsStore.set('default_user', DEFAULT_NOTIFS);


export function setWatchdogSystemLogs(val: any) {
  if (typeof val === 'function') {
    watchdogSystemLogs = val(watchdogSystemLogs);
  } else {
    watchdogSystemLogs = val;
  }
}

export function setSimulatedErrors(val: any) {
  simulatedErrors = val;
}

export function setGlobalAdminSettings(val: any) {
  if (typeof val === 'function') {
    globalAdminSettings = val(globalAdminSettings);
  } else {
    globalAdminSettings = val;
  }
}

export function setLastGatewaySettingsSync(val: number) {
  lastGatewaySettingsSync = val;
}

export function setAdminUsersDb(val: any) {
  if (typeof val === 'function') {
    adminUsersDb = val(adminUsersDb);
  } else {
    adminUsersDb = val;
  }
}

export function setAdminContentDb(val: any) {
  adminContentDb = val;
}

export function setFeatureFlagsStore(val: any) {
  if (typeof val === 'function') {
    featureFlagsStore = val(featureFlagsStore);
  } else {
    featureFlagsStore = val;
  }
}

export function setAdminTeamStore(val: any) {
  if (typeof val === 'function') {
    adminTeamStore = val(adminTeamStore);
  } else {
    adminTeamStore = val;
  }
}

export function setAdminTasksStore(val: any) {
  if (typeof val === 'function') {
    adminTasksStore = val(adminTasksStore);
  } else {
    adminTasksStore = val;
  }
}
