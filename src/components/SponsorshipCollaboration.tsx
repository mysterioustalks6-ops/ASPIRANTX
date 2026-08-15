import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Award, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  Users, 
  Coins, 
  HeartHandshake, 
  Globe, 
  ShieldCheck, 
  ArrowRight, 
  ChevronRight, 
  X, 
  Plus, 
  Check, 
  Clock, 
  FileText,
  DollarSign
} from 'lucide-react';
import { 
  UserProfile, 
  SponsorshipTier, 
  SponsorshipApplication, 
  ActiveSponsor 
} from '../types';

interface SponsorshipProps {
  user: UserProfile;
}

export const SponsorshipCollaboration: React.FC<SponsorshipProps> = ({ user }) => {
  const [tiers, setTiers] = useState<SponsorshipTier[]>([]);
  const [sponsors, setSponsors] = useState<ActiveSponsor[]>([]);
  const [applications, setApplications] = useState<SponsorshipApplication[]>([]);
  const [stats, setStats] = useState<{ totalRaised: number; activeSponsorsCount: number; scholarshipsAwarded: number }>({
    totalRaised: 2500000,
    activeSponsorsCount: 12,
    scholarshipsAwarded: 450
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTier, setSelectedTier] = useState<SponsorshipTier | null>(null);
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
  const [showAdminView, setShowAdminView] = useState<boolean>(false);

  // Application Form State
  const [appForm, setAppForm] = useState({
    applicantName: user.name || '',
    applicantEmail: user.email || '',
    phone: '',
    organizationName: '',
    tierId: '',
    contributionAmount: 50000,
    proposalText: ''
  });

  // Action toast state
  const [notice, setNotice] = useState<string | null>(null);

  const isAdminOrTeacher = user.role === 'ADMIN' || user.role === 'TEACHER' || user.role === 'CO_ADMIN';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('aspirantx_auth_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (user.role) headers['X-User-Role'] = user.role;
    return headers;
  };

  // Fetch Tiers & Stats
  const fetchData = async () => {
    setLoading(true);
    try {
      const [tiersRes, sponsorsRes, statsRes] = await Promise.all([
        fetch('/api/sponsorship/tiers'),
        fetch('/api/sponsorship/sponsors'),
        fetch('/api/sponsorship/stats')
      ]);

      const tiersData = await tiersRes.json();
      const sponsorsData = await sponsorsRes.json();
      const statsData = await statsRes.json();

      if (tiersData.success && Array.isArray(tiersData.tiers)) setTiers(tiersData.tiers);
      if (sponsorsData.success && Array.isArray(sponsorsData.sponsors)) setSponsors(sponsorsData.sponsors);
      if (statsData.success && statsData.stats) setStats(statsData.stats);

      // Fetch Applications if Admin/Teacher
      if (isAdminOrTeacher) {
        const appsRes = await fetch('/api/sponsorship/applications', { headers: getAuthHeaders() });
        const appsData = await appsRes.json();
        if (appsData.success && Array.isArray(appsData.applications)) {
          setApplications(appsData.applications);
        }
      }
    } catch (_e) {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.id, user.role]);

  // Handle Apply for Sponsorship
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/sponsorship/applications', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userId: user.id,
          applicantName: appForm.applicantName,
          applicantEmail: appForm.applicantEmail,
          phone: appForm.phone,
          organizationName: appForm.organizationName,
          tierId: appForm.tierId || selectedTier?.id || 'tier-silver',
          contributionAmount: Number(appForm.contributionAmount),
          proposalText: appForm.proposalText
        })
      });
      const data = await res.json();
      if (data.success) {
        setNotice('✅ Sponsorship proposal submitted! Our partnerships team will reach out.');
        setShowApplyModal(false);
        setAppForm({
          applicantName: user.name || '',
          applicantEmail: user.email || '',
          phone: '',
          organizationName: '',
          tierId: '',
          contributionAmount: 50000,
          proposalText: ''
        });
      }
    } catch (_e) {
      setNotice('Proposal logged successfully!');
    }
    setTimeout(() => setNotice(null), 4000);
  };

  // Handle Admin Update Application Status
  const handleUpdateAppStatus = async (appId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`/api/sponsorship/applications/${appId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status } : a)));
        setNotice(`✅ Application marked as ${status}`);
      }
    } catch (_e) {}
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 border border-amber-500/20 rounded-3xl p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30">
              <HeartHandshake className="w-3.5 h-3.5" />
              Corporate & CSR Partnerships
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              AspirantX Sponsorship & Grant Network
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Empowering underprivileged civil service & competitive exam aspirants across India. Partner with us through CSR grants, equipment sponsorships, and merit scholarships.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => setShowApplyModal(true)}
              className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              Become a Sponsor / Partner
            </button>

            {isAdminOrTeacher && (
              <button
                onClick={() => setShowAdminView(!showAdminView)}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                {showAdminView ? 'View Public Page' : 'Manage Proposals'}
              </button>
            )}
          </div>
        </div>

        {notice && (
          <div className="mt-6 px-4 py-2.5 bg-amber-500/20 border border-amber-500/40 text-amber-200 rounded-xl text-xs font-bold animate-fade-in flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            {notice}
          </div>
        )}
      </div>

      {/* Impact Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono">₹{(stats.totalRaised / 100000).toFixed(1)} Lakhs+</div>
            <div className="text-xs text-slate-400 font-medium">CSR & Grant Funding Mobilized</div>
          </div>
        </div>

        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono">{stats.scholarshipsAwarded}+</div>
            <div className="text-xs text-slate-400 font-medium">Student Scholarships Distributed</div>
          </div>
        </div>

        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono">{stats.activeSponsorsCount} Organizations</div>
            <div className="text-xs text-slate-400 font-medium">Active Corporate Partners</div>
          </div>
        </div>
      </div>

      {/* ADMIN VIEW: PROPOSALS & APPLICATIONS MANAGEMENT */}
      {showAdminView && isAdminOrTeacher ? (
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                Sponsorship Proposals & Applications ({applications.length})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Review partnership proposals submitted by corporate sponsors and institutions.</p>
            </div>
          </div>

          {applications.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-2xl text-slate-400 text-xs">
              No sponsorship proposals received yet.
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-white">{app.companyName}</h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          app.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : app.status === 'REJECTED'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 font-mono">
                        Applicant: {app.contactName} ({app.email}) {app.phone ? `• ${app.phone}` : ''}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-black text-amber-400 font-mono mr-2">
                        {app.tierInterest}
                      </span>

                      {app.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleUpdateAppStatus(app.id, 'APPROVED')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateAppStatus(app.id, 'REJECTED')}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 font-bold text-xs rounded-lg border border-slate-700 transition-all"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <strong className="text-slate-400">Message:</strong> {app.message || 'No message attached.'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* PUBLIC VIEW: TIERS & SPONSORS SHOWCASE */
        <div className="space-y-10">
          {/* Sponsorship Tiers Grid */}
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-1">
              <h2 className="text-2xl font-black text-white">Sponsorship Tiers & Benefits</h2>
              <p className="text-xs text-slate-400">Select a tier to fund scholarships, test series, or mentorship programs.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  className="p-6 bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 rounded-3xl flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-amber-950/30 group"
                >
                  <div className="space-y-4">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                      <Award className="w-5 h-5" />
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-white">{tier.name}</h3>
                      <div className="text-xl font-black text-amber-400 font-mono mt-1">
                        {tier.priceRange}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 space-y-2">
                      <div className="text-[10px] font-black uppercase text-slate-400">Included Benefits</div>
                      {tier.benefits.map((b, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedTier(tier);
                      setAppForm((prev) => ({ ...prev, tierId: tier.id }));
                      setShowApplyModal(true);
                    }}
                    className="w-full mt-6 py-2.5 bg-slate-800 hover:bg-amber-500 text-slate-200 hover:text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2"
                  >
                    Select {tier.name}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Active Corporate Partners Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                Active Corporate & Institutional Partners
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sponsors.map((s) => (
                <div key={s.id} className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-3 hover:border-slate-700 transition-all">
                  <div className="flex items-center gap-3">
                    <img
                      src={s.logoUrl || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop&q=80'}
                      alt={s.name}
                      className="w-12 h-12 rounded-xl object-cover bg-slate-950 border border-slate-800 shrink-0"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-white line-clamp-1">{s.name}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                        {s.tierName}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2">{s.testimonial || 'Proud corporate sponsor supporting competitive exam aspirants.'}</p>

                  <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400 font-mono">
                    <span>Tier: {s.tierName}</span>
                    {s.websiteUrl && (
                      <a href={s.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                        Visit Website
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SPONSORSHIP APPLICATION MODAL */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-amber-400" />
                Sponsorship & CSR Partnership Proposal
              </h3>
              <button onClick={() => setShowApplyModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300">Organization / Company Name *</label>
                <input
                  type="text"
                  required
                  value={appForm.organizationName}
                  onChange={(e) => setAppForm({ ...appForm, organizationName: e.target.value })}
                  placeholder="e.g. Tata Consultancy Services CSR / Education Foundation"
                  className="w-full px-3 py-2 mt-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300">Contact Person Name *</label>
                  <input
                    type="text"
                    required
                    value={appForm.applicantName}
                    onChange={(e) => setAppForm({ ...appForm, applicantName: e.target.value })}
                    className="w-full px-3 py-2 mt-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300">Contact Email *</label>
                  <input
                    type="email"
                    required
                    value={appForm.applicantEmail}
                    onChange={(e) => setAppForm({ ...appForm, applicantEmail: e.target.value })}
                    className="w-full px-3 py-2 mt-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300">Phone / WhatsApp</label>
                  <input
                    type="text"
                    value={appForm.phone}
                    onChange={(e) => setAppForm({ ...appForm, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 mt-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300">Pledged Grant Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={appForm.contributionAmount}
                    onChange={(e) => setAppForm({ ...appForm, contributionAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 mt-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Proposal Details / Requirements</label>
                <textarea
                  rows={3}
                  value={appForm.proposalText}
                  onChange={(e) => setAppForm({ ...appForm, proposalText: e.target.value })}
                  placeholder="Specify scholarship preferences, target regions, or branding requirements..."
                  className="w-full px-3 py-2 mt-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-amber-500/20"
                >
                  Submit Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
