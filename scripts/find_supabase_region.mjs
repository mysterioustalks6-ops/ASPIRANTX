import child_process from 'child_process';

const regions = [
  'ap-south-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'ca-central-1',
  'sa-east-1'
];

async function probe() {
  for (const reg of regions) {
    const host = `aws-0-${reg}.pooler.supabase.com`;
    const cmd = `npx supabase db query --db-url "postgresql://postgres.ixwpkzorjutnhpnybuvx:dummy@${host}:6543/postgres" "SELECT 1;"`;
    try {
      const out = child_process.execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
      console.log(`FOUND REGION: ${reg}! Output: ${out}`);
      break;
    } catch (e) {
      const msg = (e.stderr || '') + (e.stdout || '');
      if (!msg.includes('tenant/user') && !msg.includes('not found')) {
        console.log(`*** CANDIDATE REGION MATCH ***: ${reg} -> ${msg.trim().slice(0, 150)}`);
        break;
      } else {
        console.log(`${reg}: not found`);
      }
    }
  }
}

probe();
