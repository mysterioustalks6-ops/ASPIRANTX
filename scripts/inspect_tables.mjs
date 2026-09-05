import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTables() {
  console.log('--- INSPECTING ACADEMIC TABLES ---');

  // Check pyqs
  const { count: pyqsCount, data: pyqsData, error: pyqsErr } = await supabase
    .from('pyqs')
    .select('*', { count: 'exact' })
    .limit(3);

  console.log('public.pyqs count:', pyqsCount, 'error:', pyqsErr?.message);
  if (pyqsData && pyqsData.length > 0) {
    console.log('pyqs fields:', Object.keys(pyqsData[0]));
    console.log('Sample pyqs:', pyqsData[0]);
  }

  // Check question_bank field values properly
  const { data: qbData } = await supabase
    .from('question_bank')
    .select('*')
    .limit(2);
  console.log('\nSample question_bank item:', qbData[0]);
}

inspectTables();
