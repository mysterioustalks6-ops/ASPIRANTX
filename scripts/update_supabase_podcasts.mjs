import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const supabase = createClient(supabaseUrl, serviceKey);

export const AUTHENTIC_PODCASTS = [
  {
    id: 'p1',
    topperName: 'AspirantX Editorial Desk',
    rank: 'Synthesized Voice Audio Guide',
    subject: 'Polity & GS Paper 2 Strategy Masterclass',
    audioUrl: '/audio/upsc_gs2_polity_masterclass.wav',
    duration: '00:51',
    description: 'High-yield masterclass on GS Paper 2 answer writing frameworks. Note: Scripted by the AspirantX academic editorial desk and delivered via synthetic voice narration for study revision.',
    booklist: ['Indian Polity by M. Laxmikanth', 'Introduction to the Constitution of India by D.D. Basu', 'Second ARC Reports on Ethics in Governance']
  },
  {
    id: 'p2',
    topperName: 'AspirantX Editorial Desk',
    rank: 'Synthesized Voice Audio Guide',
    subject: 'Geography Optional & Mapping Technique Guide',
    audioUrl: '/audio/geography_answer_writing_guide.wav',
    duration: '00:42',
    description: 'Spatial visualization strategy for Geography: connecting physical theory with regional planning. Note: Scripted by the AspirantX editorial desk and delivered via synthetic voice narration.',
    booklist: ['Physical Geography by Savindra Singh', 'India: A Comprehensive Geography by D.R. Khullar', 'ProTrack Cartography Reference Sheets']
  },
  {
    id: 'p3',
    topperName: 'AspirantX Editorial Desk',
    rank: 'Synthesized Voice Audio Guide',
    subject: 'NEET UG High-Yield Physics & Diagrammatic Biology',
    audioUrl: '/audio/neet_physics_problem_solving.wav',
    duration: '00:39',
    description: 'Essential guidance for NEET 700+ target: rapid numerical techniques and NCERT retention. Note: Scripted by the AspirantX editorial desk and delivered via synthetic voice narration.',
    booklist: ['NCERT Biology Class 11 & 12', 'Concepts of Physics by H.C. Verma', 'Physical Chemistry by O.P. Tandon']
  }
];

async function updateSupabasePodcasts() {
  console.log('Updating Supabase podcasts table with authentic audio records...');
  for (const pod of AUTHENTIC_PODCASTS) {
    const { data, error } = await supabase.from('podcasts').upsert([{
      id: pod.id,
      data: pod,
      updated_at: new Date().toISOString()
    }], { onConflict: 'id' });
    if (error) {
      console.error(`Error updating podcast ${pod.id}:`, error.message);
    } else {
      console.log(`Updated podcast ${pod.id} successfully.`);
    }
  }

  // Verify
  const { data: verified } = await supabase.from('podcasts').select('*');
  console.log('Verified podcasts in Supabase:', verified?.map(p => ({ id: p.id, title: p.data?.subject, audioUrl: p.data?.audioUrl })));
}

updateSupabasePodcasts();
