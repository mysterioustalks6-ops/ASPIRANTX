import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();

// 1. routes/shared.ts
{
  const sharedPath = path.join(projectRoot, 'routes', 'shared.ts');
  let content = fs.readFileSync(sharedPath, 'utf8');

  // Replace fake blog authors
  content = content.replace("authorTeacherId: 'ed_1',\n    authorName: 'Dr. Siddharth Arora',", "authorTeacherId: 'editorial_desk',\n    authorName: 'StudyRide Editorial Desk',");
  content = content.replace("authorTeacherId: 'ed_1',\r\n    authorName: 'Dr. Siddharth Arora',", "authorTeacherId: 'editorial_desk',\r\n    authorName: 'StudyRide Editorial Desk',");
  content = content.replace("authorTeacherId: 'ed_2',\n    authorName: 'Mrunal Patel',", "authorTeacherId: 'editorial_desk',\n    authorName: 'StudyRide Editorial Desk',");
  content = content.replace("authorTeacherId: 'ed_2',\r\n    authorName: 'Mrunal Patel',", "authorTeacherId: 'editorial_desk',\r\n    authorName: 'StudyRide Editorial Desk',");

  // Trim adminTeamStore to only Ambuj Yadav
  const teamStart = content.indexOf('export let adminTeamStore: any[] = [');
  if (teamStart !== -1) {
    const teamEnd = content.indexOf('export let adminTasksStore: any[] = [', teamStart);
    if (teamEnd !== -1) {
      const ambujOnly = `export let adminTeamStore: any[] = [
  {
    id: 'tm-1',
    name: 'Ambuj Yadav',
    email: 'ambujyadav0010@gmail.com',
    avatar: 'https://studyride.in/logo.png',
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
  }
];\n\n`;
      content = content.substring(0, teamStart) + ambujOnly + content.substring(teamEnd);
    }
  }

  // Clear adminTasksStore
  const taskStart = content.indexOf('export let adminTasksStore: any[] = [');
  if (taskStart !== -1) {
    const taskEnd = content.indexOf('export const DEFAULT_SPONSORS_LIST: any[] = [', taskStart);
    if (taskEnd !== -1) {
      content = content.substring(0, taskStart) + 'export let adminTasksStore: any[] = [];\n\n' + content.substring(taskEnd);
    }
  }

  // Clear DEFAULT_SPONSORS_LIST
  const spStart = content.indexOf('export const DEFAULT_SPONSORS_LIST: any[] = [');
  if (spStart !== -1) {
    const spEnd = content.indexOf('export const DEFAULT_COLLABORATORS_LIST: any[] = [', spStart);
    if (spEnd !== -1) {
      content = content.substring(0, spStart) + 'export const DEFAULT_SPONSORS_LIST: any[] = [];\n\n' + content.substring(spEnd);
    }
  }

  // Clear DEFAULT_COLLABORATORS_LIST
  const colStart = content.indexOf('export const DEFAULT_COLLABORATORS_LIST: any[] = [');
  if (colStart !== -1) {
    const colEnd = content.indexOf('export const DEFAULT_OFFICE_ACTIVITIES: any[] = [', colStart);
    if (colEnd !== -1) {
      content = content.substring(0, colStart) + 'export const DEFAULT_COLLABORATORS_LIST: any[] = [];\n\n' + content.substring(colEnd);
    }
  }

  // Clear DEFAULT_OFFICE_ACTIVITIES
  const actStart = content.indexOf('export const DEFAULT_OFFICE_ACTIVITIES: any[] = [');
  if (actStart !== -1) {
    const actEnd = content.indexOf('export let sponsorsDb: any[] = [...DEFAULT_SPONSORS_LIST];', actStart);
    if (actEnd !== -1) {
      content = content.substring(0, actStart) + 'export const DEFAULT_OFFICE_ACTIVITIES: any[] = [];\n\n' + content.substring(actEnd);
    }
  }

  // Clear pendingContentUploadsDb
  const upStart = content.indexOf('export let pendingContentUploadsDb: any[] = [');
  if (upStart !== -1) {
    const upEnd = content.indexOf('export async function saveAdminStoreToDisk() {', upStart);
    if (upEnd !== -1) {
      content = content.substring(0, upStart) + 'export let pendingContentUploadsDb: any[] = [];\n\n' + content.substring(upEnd);
    }
  }

  // Remove fake sponsor seeding in seedDefaultSponsorshipTiers()
  const fakeSponsorCheck = 'if (activeSponsorsStore.size === 0) {';
  const fakeSponsorIdx = content.indexOf(fakeSponsorCheck);
  if (fakeSponsorIdx !== -1) {
    const fakeSponsorEnd = content.indexOf('seedDefaultSponsorshipTiers();', fakeSponsorIdx);
    if (fakeSponsorEnd !== -1) {
      content = content.substring(0, fakeSponsorIdx) + '}\n\n' + content.substring(fakeSponsorEnd);
    }
  }

  fs.writeFileSync(sharedPath, content, 'utf8');
  console.log('Updated routes/shared.ts');
}

// 2. routes/community.routes.ts
{
  const commPath = path.join(projectRoot, 'routes', 'community.routes.ts');
  let content = fs.readFileSync(commPath, 'utf8');

  const battleStart = content.indexOf('const DEFAULT_BATTLE_GROUPS: StudyBattleGroupRecord[] = [');
  if (battleStart !== -1) {
    const battleEnd = content.indexOf('export let studyBattleGroupsStore = new Map<string, StudyBattleGroupRecord>();', battleStart);
    if (battleEnd !== -1) {
      content = content.substring(0, battleStart) + 'const DEFAULT_BATTLE_GROUPS: StudyBattleGroupRecord[] = [];\n\n' + content.substring(battleEnd);
    }
  }

  fs.writeFileSync(commPath, content, 'utf8');
  console.log('Updated routes/community.routes.ts');
}

// 3. routes/teacher.routes.ts - ensure /api/sponsorship/stats exists
{
  const teachPath = path.join(projectRoot, 'routes', 'teacher.routes.ts');
  let content = fs.readFileSync(teachPath, 'utf8');

  if (!content.includes("router.get('/api/sponsorship/stats'")) {
    const insertPoint = content.indexOf("router.get('/api/sponsorship/public-stats'");
    if (insertPoint !== -1) {
      const statsRoute = `router.get('/api/sponsorship/stats', async (_req, res) => {
  try {
    res.json({
      success: true,
      stats: {
        totalRaised: 0,
        activeSponsorsCount: activeSponsorsStore.size,
        scholarshipsAwarded: 0
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch sponsorship stats' });
  }
});\n\n`;
      content = content.substring(0, insertPoint) + statsRoute + content.substring(insertPoint);
      fs.writeFileSync(teachPath, content, 'utf8');
      console.log('Added /api/sponsorship/stats to routes/teacher.routes.ts');
    }
  }
}

// 4. src/components/CommunityChat.tsx - remove fake seeded users
{
  const chatPath = path.join(projectRoot, 'src', 'components', 'CommunityChat.tsx');
  let content = fs.readFileSync(chatPath, 'utf8');

  const initStart = content.indexOf('const INITIAL_MESSAGES: Record<RoomName, RoomMessage[]> = {');
  if (initStart !== -1) {
    const initEnd = content.indexOf('export const CommunityChat: React.FC<CommunityChatProps> = ({ user, onOpenPremium }) => {', initStart);
    if (initEnd !== -1) {
      const honestMessages = `const INITIAL_MESSAGES: Record<RoomName, RoomMessage[]> = {
  'UPSC Room': [
    {
      id: 'm1',
      room: 'UPSC Room',
      senderId: 'bot',
      senderName: 'StudyRide Bot',
      isBot: true,
      text: 'Welcome to the UPSC CSE Room! I am your AI Room Moderator. Ask me anything about GS syllabus, Laxmikanth, or PYQs by tagging @bot in your message!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      likes: 1,
    },
  ],
  'SSC Room': [
    {
      id: 'm4',
      room: 'SSC Room',
      senderId: 'bot',
      senderName: 'StudyRide Bot',
      isBot: true,
      text: 'Welcome to SSC CGL/CHSL Preparation Zone! Share speed-math tricks, English idioms, or general awareness notes here.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      likes: 1,
    },
  ],
  'Current Affairs Hub': [
    {
      id: 'm6',
      room: 'Current Affairs Hub',
      senderId: 'bot',
      senderName: 'StudyRide Bot',
      isBot: true,
      text: 'Daily Editorial Summary: Post daily newspaper highlights and PIB editorial summaries here.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      likes: 1,
    },
  ],
  'Optional Subjects': [
    {
      id: 'm7',
      room: 'Optional Subjects',
      senderId: 'bot',
      senderName: 'StudyRide Bot',
      isBot: true,
      text: 'Optional Peer Discussion Group. Post syllabus notes and question outlines here.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      likes: 1,
    },
  ],
  'Vent Room': [
    {
      id: 'm_vent',
      room: 'Vent Room',
      senderId: 'bot',
      senderName: 'Vent Room Bot',
      isBot: true,
      text: 'Welcome to the Vent Room 🤍. This is a safe, completely anonymous space. Your identity is masked. Share your thoughts or stress without judgment.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      likes: 1,
    },
  ],
};\n\n`;
      content = content.substring(0, initStart) + honestMessages + content.substring(initEnd);
      fs.writeFileSync(chatPath, content, 'utf8');
      console.log('Updated src/components/CommunityChat.tsx');
    }
  }
}

// 5. src/components/SponsorshipCollaboration.tsx
{
  const spPath = path.join(projectRoot, 'src', 'components', 'SponsorshipCollaboration.tsx');
  let content = fs.readFileSync(spPath, 'utf8');

  // Initial stats
  content = content.replace(/totalRaised:\s*2500000,\s*activeSponsorsCount:\s*12,\s*scholarshipsAwarded:\s*450/, 'totalRaised: 0, activeSponsorsCount: 0, scholarshipsAwarded: 0');

  // Replace empty sponsors grid with "Become a Partner" card
  const gridMarker = '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">\n              {sponsors.map((s) => (\n                <div key={s.id}';
  const gridMarkerCRLF = '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">\r\n              {sponsors.map((s) => (\r\n                <div key={s.id}';

  const emptySponsorsBlock = `{sponsors.length === 0 ? (
              <div className="p-8 sm:p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                  <Building2 className="w-7 h-7" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="text-base font-bold text-white">No Official Corporate Partners Yet</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    StudyRide does not display unverified institutional partnerships. Are you an education institute, publication house, or CSR foundation? Partner with us to sponsor merit scholarships.
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => {
                      setSelectedTier(tiers[0] || null);
                      setShowApplyModal(true);
                    }}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer inline-flex items-center gap-2"
                  >
                    <span>Become a Partner →</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sponsors.map((s) => (
                  <div key={s.id}`;

  if (content.includes(gridMarker)) {
    content = content.replace(gridMarker, emptySponsorsBlock);
    // Find closing tag of sponsors map
    const mapClose = '{sponsors.map((s) => (\n                <div key={s.id}';
    content = content.replace('              </div>\n            </div>\n          </div>\n        </div>\n      )}', '              </div>\n            )}\n          </div>\n        </div>\n      )}');
  } else if (content.includes(gridMarkerCRLF)) {
    content = content.replace(gridMarkerCRLF, emptySponsorsBlock.replace(/\n/g, '\r\n'));
    content = content.replace('              </div>\r\n            </div>\r\n          </div>\r\n        </div>\r\n      )}', '              </div>\r\n            )}\r\n          </div>\r\n        </div>\r\n      )}');
  }

  fs.writeFileSync(spPath, content, 'utf8');
  console.log('Updated src/components/SponsorshipCollaboration.tsx');
}

// 6. src/components/LeaderboardView.tsx
{
  const lbPath = path.join(projectRoot, 'src', 'components', 'LeaderboardView.tsx');
  let content = fs.readFileSync(lbPath, 'utf8');

  // Replace fallback fake XP (100 - idx * 5)
  content = content.replace('{item.xp || (100 - idx * 5)} XP', '{item.xp || 0} XP');

  // Honest empty state when filtered.length === 0
  const listMarker = '{filtered.map((item, idx) => {';
  const emptyStateBlock = `{filtered.length === 0 ? (
                    <div className="p-8 text-center bg-[var(--sr-surface-2)] border border-[var(--sr-line)] rounded-2xl space-y-2">
                      <p className="text-xs font-bold text-[var(--sr-text)]">No aspirants ranked in this view yet</p>
                      <p className="text-[11px] text-[var(--sr-text-muted)]">Complete a practice drill or CBT test to record the first score!</p>
                    </div>
                  ) : (
                    filtered.map((item, idx) => {`;
  
  if (content.includes(listMarker)) {
    content = content.replace(listMarker, emptyStateBlock);
    content = content.replace('                    );\n                  })}\n                </div>', '                    );\n                  }))}\n                </div>');
    content = content.replace('                    );\r\n                  })}\r\n                </div>', '                    );\r\n                  }))}\r\n                </div>');
  }

  fs.writeFileSync(lbPath, content, 'utf8');
  console.log('Updated src/components/LeaderboardView.tsx');
}

// 7. src/data/profileBadgesData.ts
{
  const pbPath = path.join(projectRoot, 'src', 'data', 'profileBadgesData.ts');
  let content = fs.readFileSync(pbPath, 'utf8');

  // streakDays fix
  content = content.replace('streakDays: Math.max(1, Number(user?.streakDays || 1)),', 'streakDays: Number(user?.streakDays || 0),');

  fs.writeFileSync(pbPath, content, 'utf8');
  console.log('Updated src/data/profileBadgesData.ts');
}

// 8. src/lib/apiClient.ts - upfront navigator.onLine check
{
  const apiPath = path.join(projectRoot, 'src', 'lib', 'apiClient.ts');
  let content = fs.readFileSync(apiPath, 'utf8');

  const loopStart = 'for (let attempt = 0; attempt <= maxRetries; attempt++) {';
  const offlineGuard = `// Immediate offline guard: prevent retry storm and serve cache when offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    if (method === 'GET') {
      const staleMem = memoryCache.get(cacheKey);
      if (staleMem) {
        console.warn(\`[Network Offline] Returning memory cached data for \${url}\`);
        return staleMem.data as T;
      }
      try {
        const stored = localStorage.getItem(cacheKey);
        if (stored) {
          const item: CacheItem<T> = JSON.parse(stored);
          console.warn(\`[Network Offline] Returning disk cached data for \${url}\`);
          return item.data;
        }
      } catch (e) {}
    }
    throw new Error('Network offline: request aborted without retry storm');
  }

  ${loopStart}`;

  if (content.includes(loopStart) && !content.includes('Immediate offline guard')) {
    content = content.replace(loopStart, offlineGuard);
    fs.writeFileSync(apiPath, content, 'utf8');
    console.log('Updated src/lib/apiClient.ts');
  }
}
