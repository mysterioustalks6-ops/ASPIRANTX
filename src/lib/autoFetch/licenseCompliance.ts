// ============================================================================
// LICENSE & MONETIZATION COMPLIANCE GUARD
// Enforces license compatibility checks before ingesting third-party datasets.
// Specifically gates Non-Commercial Open Source Licenses (e.g. ENCOSL) if
// AspirantX contains any active monetization, paid tiers, or payment gateways.
// ============================================================================

import fs from 'fs';
import path from 'path';

export interface MonetizationAudit {
  isMonetized: boolean;
  triggers: {
    hasPremiumPlansUI: boolean;
    hasPaymentRoutes: boolean;
    hasUtrVerification: boolean;
    hasWalletPayouts: boolean;
    hasRazorpayEnv: boolean;
  };
  details: string[];
}

export interface LicenseCheckResult {
  source: string;
  licenseName: string;
  licenseTerms: 'non_commercial_only' | 'permissive_mit_apache' | 'proprietary';
  status: 'cleared' | 'blocked_license_conflict';
  blockedReason?: string;
  audit: MonetizationAudit;
  timestamp: string;
}

/**
 * Dynamically checks the AspirantX codebase and configuration for any
 * active commercial monetization, subscriptions, payment gateways, or UTR flows.
 */
export function auditAppMonetization(): MonetizationAudit {
  const triggers = {
    hasPremiumPlansUI: false,
    hasPaymentRoutes: false,
    hasUtrVerification: false,
    hasWalletPayouts: false,
    hasRazorpayEnv: false,
  };
  const details: string[] = [];

  // 1. Check for Premium Plans / PRO Pass UI
  const premiumPlansPath = path.resolve(process.cwd(), 'src/components/PremiumPlans.tsx');
  if (fs.existsSync(premiumPlansPath)) {
    const content = fs.readFileSync(premiumPlansPath, 'utf8');
    if (content.includes('PRO Pass') || content.includes('Daily Pass') || content.includes('Lifetime Pass')) {
      triggers.hasPremiumPlansUI = true;
      details.push('Found active Premium PRO Pass plans (Daily, Weekly, Monthly, Lifetime) in src/components/PremiumPlans.tsx');
    }
  }

  // 2. Check for Payment Routes in Express
  const userRoutesPath = path.resolve(process.cwd(), 'routes/user.routes.ts');
  if (fs.existsSync(userRoutesPath)) {
    const routesContent = fs.readFileSync(userRoutesPath, 'utf8');
    if (routesContent.includes('/api/payments/razorpay-order') || routesContent.includes('/api/payments/verify-payment')) {
      triggers.hasPaymentRoutes = true;
      details.push('Found active Razorpay payment gateway endpoints in routes/user.routes.ts');
    }
    if (routesContent.includes('/api/payments/utr-submit')) {
      triggers.hasUtrVerification = true;
      details.push('Found manual UPI/UTR payment verification & PRO pass activation endpoint (/api/payments/utr-submit)');
    }
  }

  // 3. Check for Community Wallet / Payout system
  const walletPath = path.resolve(process.cwd(), 'src/components/CommunityWallet.tsx');
  if (fs.existsSync(walletPath)) {
    triggers.hasWalletPayouts = true;
    details.push('Found Community Wallet monetization & payout mechanisms in src/components/CommunityWallet.tsx');
  }

  // 4. Check for Razorpay credentials in environment
  if (process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_SECRET) {
    triggers.hasRazorpayEnv = true;
    details.push('Configured Razorpay merchant credentials detected in environment variables.');
  }

  const isMonetized = triggers.hasPremiumPlansUI ||
                      triggers.hasPaymentRoutes ||
                      triggers.hasUtrVerification ||
                      triggers.hasWalletPayouts ||
                      triggers.hasRazorpayEnv;

  return {
    isMonetized,
    triggers,
    details,
  };
}

/**
 * Validates whether a specific repository / external data source can be legally ingested.
 * If the source is licensed under a Non-Commercial license (e.g. ENCOSL) and AspirantX
 * contains any monetization features, ingestion is strictly BLOCKED.
 */
export async function verifySourceLicenseCompliance(
  sourceUrl = 'https://github.com/Samkarya/online-exam-questions'
): Promise<LicenseCheckResult> {
  const audit = auditAppMonetization();

  // License inspection for Samkarya/online-exam-questions
  const isSamkaryaRepo = sourceUrl.includes('Samkarya/online-exam-questions');
  const licenseName = isSamkaryaRepo
    ? 'ExamOven Non-Commercial Open Source License (ENCOSL)'
    : 'Unknown / Custom License';
  const licenseTerms = isSamkaryaRepo ? 'non_commercial_only' : 'proprietary';

  let status: 'cleared' | 'blocked_license_conflict' = 'cleared';
  let blockedReason: string | undefined;

  if (licenseTerms === 'non_commercial_only' && audit.isMonetized) {
    status = 'blocked_license_conflict';
    blockedReason = `AspirantX has active monetization/commercial features (${audit.details.join('; ')}). Under Section 2 ("COMMERCIAL RESTRICTIONS") of the ExamOven Non-Commercial Open Source License, commercial use is strictly prohibited for all entities except ExamOven. Ingestion is blocked until explicit written permission or commercial licensing is obtained from the repository owner.`;
  }

  const result: LicenseCheckResult = {
    source: sourceUrl,
    licenseName,
    licenseTerms,
    status,
    blockedReason,
    audit,
    timestamp: new Date().toISOString(),
  };

  // Persist audit result to data/license_audit.json for automated traceability
  try {
    const auditLogPath = path.resolve(process.cwd(), 'data/license_audit.json');
    let history: any[] = [];
    if (fs.existsSync(auditLogPath)) {
      history = JSON.parse(fs.readFileSync(auditLogPath, 'utf8'));
      if (!Array.isArray(history)) history = [history];
    }
    history.push(result);
    fs.writeFileSync(auditLogPath, JSON.stringify(history, null, 2));
  } catch (err: any) {
    console.error('[licenseCompliance] Failed to write audit log:', err.message);
  }

  return result;
}
