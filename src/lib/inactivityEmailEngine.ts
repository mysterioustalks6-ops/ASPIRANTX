import { sendTransactionalEmail } from './email.js';
import { adminUsersDb, saveAdminStoreToDisk, getISTDateString } from '../../routes/shared.js';
import { queryPostgres, pgPool } from './postgres.js';

export interface InactivityDetail {
  userId: string;
  email: string;
  name: string;
  exam: string;
  daysInactive: number;
  lastActive: string;
  status: 'SENT' | 'FAILED' | 'SKIPPED_COOLDOWN' | 'SKIPPED_NO_EMAIL' | 'SKIPPED_BANNED';
  error?: string;
}

export interface InactivityCheckResult {
  timestamp: string;
  totalUsersChecked: number;
  inactiveUsersFound: number;
  emailsSent: number;
  emailsFailed: number;
  skippedDueToCooldown: number;
  skippedNoEmail: number;
  details: InactivityDetail[];
}

export interface InactivityStats {
  totalUsers: number;
  activeRecently: number;
  inactive2Days: number;
  inactive5Days: number;
  totalRemindersDispatched: number;
  lastRunTimestamp: string | null;
  lastRunStats: InactivityCheckResult | null;
}

// In-memory cache of last execution
let lastRunTimestamp: string | null = null;
let lastRunStats: InactivityCheckResult | null = null;
let cumulativeRemindersSent = 0;

/**
 * Calculates calendar days between two YYYY-MM-DD date strings
 */
export function calculateDaysDifference(pastDateStr?: string | null): number {
  if (!pastDateStr) return 999; // If never active, treat as long inactive
  try {
    const todayStr = getISTDateString(new Date());
    const past = new Date(pastDateStr + 'T00:00:00+05:30').getTime();
    const today = new Date(todayStr + 'T00:00:00+05:30').getTime();
    const diffMs = today - past;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return isNaN(diffDays) ? 999 : Math.max(0, diffDays);
  } catch (_e) {
    return 999;
  }
}

/**
 * Generates an inspiring, high-converting HTML re-engagement email
 */
export function generateInactivityEmailHtml(params: {
  name: string;
  exam: string;
  streakDays: number;
  daysInactive: number;
  appUrl: string;
}): { subject: string; html: string } {
  const { name, exam, streakDays, daysInactive, appUrl } = params;
  const firstName = name.split(' ')[0] || 'Aspirant';
  const cleanExam = exam.replace(/_/g, ' ');

  const subject = `🎯 Don't let your study streak slip, ${firstName}! (Day ${daysInactive} missed)`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StudyRide - We miss your study energy!</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; margin: 0; padding: 0; color: #e2e8f0; }
    .container { max-width: 580px; margin: 24px auto; background-color: #0f172a; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
    .header { background: linear-gradient(135deg, #059669 0%, #0d9488 50%, #0284c7 100%); padding: 32px 24px; text-align: center; }
    .brand { font-size: 24px; font-weight: 900; letter-spacing: 1px; color: #ffffff; margin: 0; text-transform: uppercase; }
    .brand-sub { color: #a7f3d0; font-size: 13px; font-weight: 600; margin-top: 4px; letter-spacing: 0.5px; }
    .content { padding: 32px 24px; line-height: 1.6; }
    .greeting { font-size: 20px; font-weight: 700; color: #f8fafc; margin-bottom: 12px; }
    .missed-banner { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 12px; padding: 14px 18px; margin: 18px 0; color: #fca5a5; font-size: 14px; font-weight: 600; display: flex; align-items: center; }
    .highlight-card { background: #1e293b; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #334155; }
    .card-row { display: flex; justify-content: space-between; border-bottom: 1px solid #334155; padding: 8px 0; font-size: 14px; }
    .card-row:last-child { border-bottom: none; }
    .card-label { color: #94a3b8; }
    .card-val { color: #38bdf8; font-weight: 700; }
    .quote-box { border-left: 3px solid #10b981; padding-left: 14px; font-style: italic; color: #94a3b8; font-size: 13px; margin: 20px 0; }
    .checklist { background: #131d33; border-radius: 10px; padding: 16px 20px; margin: 20px 0; }
    .checklist-item { font-size: 14px; color: #cbd5e1; margin: 8px 0; }
    .btn-container { text-align: center; margin: 32px 0 20px 0; }
    .btn { background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); color: #ffffff !important; padding: 14px 32px; border-radius: 30px; font-weight: 800; font-size: 16px; text-decoration: none; display: inline-block; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4); }
    .footer { background-color: #0b0f19; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #1e293b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="brand">StudyRide</h1>
      <div class="brand-sub">Daily Syllabus Tracker &amp; Exam Prep Suite</div>
    </div>
    <div class="content">
      <div class="greeting">Namaste ${firstName}! 👋</div>
      <p style="color: #cbd5e1; font-size: 15px; margin: 0 0 16px 0;">
        We noticed that you haven't opened your study desk on <strong>StudyRide</strong> for the past <strong>${daysInactive} days</strong>.
      </p>

      <div class="missed-banner">
        ⚠️ <strong>${daysInactive} Days of Inactivity Detected:</strong> Your streak of ${streakDays} day(s) is waiting for you!
      </div>

      <p style="color: #cbd5e1; font-size: 14px;">
        Preparing for <strong>${cleanExam}</strong> requires steady, everyday momentum. Even 20-30 minutes of revision today can save hours of anxiety before your exam.
      </p>

      <div class="highlight-card">
        <div class="card-row">
          <span class="card-label">Target Exam:</span>
          <span class="card-val">${cleanExam}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Last Saved Streak:</span>
          <span class="card-val">${streakDays} Days 🔥</span>
        </div>
        <div class="card-row">
          <span class="card-label">Recommended Next Step:</span>
          <span class="card-val">Solve 5 PYQ Questions</span>
        </div>
      </div>

      <div class="checklist">
        <div style="font-weight: 700; color: #34d399; font-size: 13px; text-transform: uppercase; margin-bottom: 8px;">
          🚀 Your 15-Minute Recovery Plan For Today:
        </div>
        <div class="checklist-item">✅ Open the Syllabus Tracker and mark 1 revision topic.</div>
        <div class="checklist-item">✅ Complete 1 quick Pomodoro sprint (25 minutes).</div>
        <div class="checklist-item">✅ Review your error book / flashcards in Progress Hub.</div>
      </div>

      <div class="btn-container">
        <a href="${appUrl}" class="btn" target="_blank">
          Resume Your Study Session →
        </a>
      </div>

      <div class="quote-box">
        "Success doesn't come from what you do occasionally, it comes from what you do consistently."
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 6px 0;">StudyRide &bull; Dedicated to helping aspirants crack their dream careers.</p>
      <p style="margin: 0;">You received this automated reminder because you are an enrolled student on StudyRide (${cleanExam}).</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, html };
}

/**
 * Checks all enrolled users and sends automated 2-day inactivity reminder emails
 * @param force If true, bypasses the 5-day cooldown check for testing/manual triggering
 */
export async function checkAndSendInactivityEmails(force = false): Promise<InactivityCheckResult> {
  const startTime = new Date().toISOString();
  console.log(`[INACTIVITY ENGINE] Initiating 2-day inactivity scan at ${startTime}...`);

  const details: InactivityDetail[] = [];
  let totalChecked = 0;
  let inactiveCount = 0;
  let sentCount = 0;
  let failedCount = 0;
  let cooldownCount = 0;
  let noEmailCount = 0;

  const appUrl = process.env.VITE_PUBLIC_API_URL || process.env.VITE_API_BASE_URL || 'https://studyride.in';
  const COOLDOWN_DAYS = 5; // Do not send another email if one was sent within last 5 days
  const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  const nowMs = Date.now();

  // 1. Gather all users from memory/disk store
  const userCandidates: Array<any> = [...adminUsersDb];

  // 2. Supplement from Neon PostgreSQL admin_users if connected
  if (pgPool) {
    try {
      const dbRes = await queryPostgres('SELECT id, email, data FROM admin_users LIMIT 500');
      if (dbRes.rows && dbRes.rows.length > 0) {
        for (const row of dbRes.rows) {
          const email = (row.email || '').trim().toLowerCase();
          const existing = userCandidates.find(u => 
            (u.id && u.id === row.id) || 
            (u.email && u.email.trim().toLowerCase() === email)
          );
          if (!existing) {
            const data = row.data || {};
            userCandidates.push({
              id: row.id,
              email: email || data.email,
              name: data.name || email.split('@')[0],
              exam: data.exam || 'UPSC_CSE',
              lastActiveDate: data.lastActiveDate || data.last_active_date,
              streakDays: data.streakDays || 1,
              status: data.status || 'ACTIVE',
              lastInactivityEmailSentAt: data.lastInactivityEmailSentAt
            });
          }
        }
      }
    } catch (e: any) {
      console.warn('[INACTIVITY ENGINE] Postgres candidate query notice:', e?.message || e);
    }
  }

  // 3. Evaluate each user
  for (const user of userCandidates) {
    totalChecked++;

    const email = (user.email || '').trim().toLowerCase();
    const name = user.name || email.split('@')[0] || 'Aspirant';
    const exam = user.exam || 'UPSC_CSE';
    const streakDays = Number(user.streakDays) || 1;
    const lastActive = user.lastActiveDate || user.last_active_date || user.joinedAt?.split('T')[0] || null;

    // Check basic eligibility
    if (!email || !email.includes('@') || email.endsWith('@guest.local') || email.includes('test_student@example.com')) {
      noEmailCount++;
      details.push({
        userId: user.id || 'unknown',
        email,
        name,
        exam,
        daysInactive: 0,
        lastActive: lastActive || 'none',
        status: 'SKIPPED_NO_EMAIL'
      });
      continue;
    }

    if (user.status === 'BANNED') {
      details.push({
        userId: user.id,
        email,
        name,
        exam,
        daysInactive: 0,
        lastActive: lastActive || 'none',
        status: 'SKIPPED_BANNED'
      });
      continue;
    }

    // Calculate inactivity
    const daysInactive = calculateDaysDifference(lastActive);

    // Criteria: Inactive for 2 or more days
    if (daysInactive >= 2) {
      inactiveCount++;

      // Cooldown check
      const lastSentTime = user.lastInactivityEmailSentAt ? new Date(user.lastInactivityEmailSentAt).getTime() : 0;
      const isWithinCooldown = !force && lastSentTime > 0 && (nowMs - lastSentTime) < COOLDOWN_MS;

      if (isWithinCooldown) {
        cooldownCount++;
        details.push({
          userId: user.id,
          email,
          name,
          exam,
          daysInactive,
          lastActive: lastActive || 'none',
          status: 'SKIPPED_COOLDOWN'
        });
        continue;
      }

      // Generate & Dispatch Email
      const emailPayload = generateInactivityEmailHtml({
        name,
        exam,
        streakDays,
        daysInactive,
        appUrl
      });

      console.log(`[INACTIVITY ENGINE] Dispatching re-engagement email to ${email} (Inactive: ${daysInactive} days)...`);
      const sendRes = await sendTransactionalEmail(email, emailPayload.subject, emailPayload.html);

      if (sendRes.sent) {
        sentCount++;
        cumulativeRemindersSent++;
        const sentAt = new Date().toISOString();
        user.lastInactivityEmailSentAt = sentAt;

        // Persist to Neon Postgres if configured
        if (pgPool && user.id) {
          try {
            await queryPostgres(
              `UPDATE admin_users 
               SET data = jsonb_set(COALESCE(data, '{}'::jsonb), '{lastInactivityEmailSentAt}', to_jsonb($1::text)),
                   updated_at = NOW() 
               WHERE id = $2 OR LOWER(email) = LOWER($3)`,
              [sentAt, user.id, email]
            );
          } catch (_dbErr) {}
        }

        details.push({
          userId: user.id,
          email,
          name,
          exam,
          daysInactive,
          lastActive: lastActive || 'none',
          status: 'SENT'
        });
      } else {
        failedCount++;
        details.push({
          userId: user.id,
          email,
          name,
          exam,
          daysInactive,
          lastActive: lastActive || 'none',
          status: 'FAILED',
          error: sendRes.error || 'Failed to dispatch via Resend'
        });
      }
    }
  }

  // Save updated timestamps to disk
  saveAdminStoreToDisk();

  const result: InactivityCheckResult = {
    timestamp: new Date().toISOString(),
    totalUsersChecked: totalChecked,
    inactiveUsersFound: inactiveCount,
    emailsSent: sentCount,
    emailsFailed: failedCount,
    skippedDueToCooldown: cooldownCount,
    skippedNoEmail: noEmailCount,
    details
  };

  lastRunTimestamp = result.timestamp;
  lastRunStats = result;

  console.log(`[INACTIVITY ENGINE] Scan complete. Found ${inactiveCount} inactive users, ${sentCount} emails sent, ${cooldownCount} in cooldown.`);
  return result;
}

/**
 * Returns current inactivity metrics for the Admin Panel
 */
export function getInactivityStats(): InactivityStats {
  let activeRecently = 0;
  let inactive2Days = 0;
  let inactive5Days = 0;

  for (const user of adminUsersDb) {
    const lastActive = user.lastActiveDate || user.last_active_date || user.joinedAt?.split('T')[0] || null;
    const days = calculateDaysDifference(lastActive);
    if (days < 2) {
      activeRecently++;
    } else {
      inactive2Days++;
      if (days >= 5) {
        inactive5Days++;
      }
    }
  }

  return {
    totalUsers: adminUsersDb.length,
    activeRecently,
    inactive2Days,
    inactive5Days,
    totalRemindersDispatched: cumulativeRemindersSent,
    lastRunTimestamp,
    lastRunStats
  };
}
