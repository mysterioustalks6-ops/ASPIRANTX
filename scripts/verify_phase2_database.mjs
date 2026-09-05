import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('--- PHASE 2: REAL DATABASE VERIFICATION (READ-ONLY) ---');

  // 1. Question Bank count
  const { count: qbCount, error: qbCountErr } = await supabase
    .from('question_bank')
    .select('*', { count: 'exact', head: true });

  if (qbCountErr) {
    console.error('Error counting question_bank:', qbCountErr);
  } else {
    console.log(`public.question_bank total rows: ${qbCount}`);
  }

  // Sample question_bank records
  const { data: qbSamples, error: qbSampleErr } = await supabase
    .from('question_bank')
    .select('*')
    .limit(3);

  if (qbSampleErr) {
    console.error('Error fetching question_bank samples:', qbSampleErr);
  } else {
    console.log('\n--- question_bank Sample Records ---');
    console.log('Fields:', Object.keys(qbSamples[0] || {}));
    qbSamples.forEach((item, idx) => {
      console.log(`\nSample ${idx + 1}:`);
      console.log(`  id: ${item.id}`);
      console.log(`  exam: ${item.exam_name || item.exam}`);
      console.log(`  subject: ${item.subject}`);
      console.log(`  questionText: ${item.question_text?.substring(0, 80)}...`);
      console.log(`  options:`, Array.isArray(item.options) ? item.options.length : typeof item.options);
      console.log(`  correct_option: ${item.correct_option || item.correct_answer}`);
    });
  }

  // 2. PYQ table check - check both pyq_bank and pyqs
  let pyqTable = 'pyq_bank';
  let { count: pyqCount, error: pyqErr } = await supabase
    .from('pyq_bank')
    .select('*', { count: 'exact', head: true });

  if (pyqErr) {
    console.log('pyq_bank notice/error:', pyqErr.message, '- trying pyqs table');
    pyqTable = 'pyqs';
    const res = await supabase.from('pyqs').select('*', { count: 'exact', head: true });
    pyqCount = res.count;
    pyqErr = res.error;
  }

  console.log(`\npublic.${pyqTable} total rows: ${pyqCount}`);

  // Sample pyq records
  const { data: pyqSamples, error: pyqSampleErr } = await supabase
    .from(pyqTable)
    .select('*')
    .limit(3);

  if (pyqSampleErr) {
    console.error(`Error fetching ${pyqTable} samples:`, pyqSampleErr);
  } else {
    console.log(`\n--- ${pyqTable} Sample Records ---`);
    console.log('Fields:', Object.keys(pyqSamples[0] || {}));
    pyqSamples.forEach((item, idx) => {
      console.log(`\nSample ${idx + 1}:`);
      console.log(`  id: ${item.id}`);
      console.log(`  exam: ${item.exam_name || item.exam}`);
      console.log(`  year: ${item.year}`);
      console.log(`  subject: ${item.subject}`);
      console.log(`  questionText: ${item.question_text?.substring(0, 80)}...`);
      console.log(`  options:`, Array.isArray(item.options) ? item.options.length : typeof item.options);
      console.log(`  correct_option: ${item.correct_option || item.correct_answer}`);
    });
  }
}

checkDatabase();
