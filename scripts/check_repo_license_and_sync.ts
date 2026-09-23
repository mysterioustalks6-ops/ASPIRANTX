import { verifySourceLicenseCompliance } from '../src/lib/autoFetch/licenseCompliance.js';
import fs from 'fs';

async function main() {
  console.log(`\n================================================================================`);
  console.log(`🛡️ GITHUB REPO INTEGRATION: AUTOMATED LICENSE COMPLIANCE GUARD`);
  console.log(`Target Repo: https://github.com/Samkarya/online-exam-questions`);
  console.log(`================================================================================\n`);

  const result = await verifySourceLicenseCompliance('https://github.com/Samkarya/online-exam-questions');

  console.log(`License Detected: ${result.licenseName}`);
  console.log(`Terms:            ${result.licenseTerms.toUpperCase()}`);
  console.log(`App Monetization: ${result.audit.isMonetized ? 'ACTIVE (Commercial Features Detected)' : 'NONE (Free/Non-commercial)'}`);
  
  if (result.audit.details.length > 0) {
    console.log(`\nDetected Monetization Features:`);
    result.audit.details.forEach(d => console.log(`  - ⚠️  ${d}`));
  }

  console.log(`\n--------------------------------------------------------------------------------`);
  console.log(`Compliance Verdict: [${result.status.toUpperCase()}]`);
  console.log(`--------------------------------------------------------------------------------`);

  if (result.status === 'blocked_license_conflict') {
    console.log(`\n⛔ INGESTION BLOCKED BY LICENSE COMPLIANCE GUARD:`);
    console.log(result.blockedReason);
    console.log(`\nZero records have been fetched into database or canonical storage.`);
    console.log(`Audit log written to: data/license_audit.json\n`);
  } else {
    console.log(`\n✅ License check cleared. Proceeding to Step 2 ingestion...\n`);
  }
}

main().catch(console.error);
