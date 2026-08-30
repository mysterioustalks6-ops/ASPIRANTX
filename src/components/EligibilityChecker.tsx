import React, { useState } from 'react';
import { HelpCircle, CheckCircle, XCircle, Search, Sparkles, BookOpen } from 'lucide-react';

interface ExamRule {
  name: string;
  fullName: string;
  minAge: number;
  maxAge: { [category: string]: number };
  qualifications: string[];
  description: string;
  portalLink: string;
}

const EXAM_RULES: ExamRule[] = [
  {
    name: 'UPSC CSE',
    fullName: 'UPSC Civil Services Examination',
    minAge: 21,
    maxAge: { General: 32, EWS: 32, OBC: 35, SC: 37, ST: 37 },
    qualifications: ['Graduate', 'Post Graduate'],
    description: 'India\'s premier competitive exam for IAS, IPS, IFS & Group A Services.',
    portalLink: 'https://upsc.gov.in'
  },
  {
    name: 'SSC CGL',
    fullName: 'Staff Selection Commission - Combined Graduate Level',
    minAge: 18,
    maxAge: { General: 30, EWS: 30, OBC: 33, SC: 35, ST: 35 },
    qualifications: ['Graduate', 'Post Graduate'],
    description: 'Recruitment for Group B and C posts in various Ministries and Departments.',
    portalLink: 'https://ssc.gov.in'
  },
  {
    name: 'UPSC NDA',
    fullName: 'National Defence Academy & Naval Academy Exam',
    minAge: 16.5,
    maxAge: { General: 19.5, EWS: 19.5, OBC: 19.5, SC: 19.5, ST: 19.5 },
    qualifications: ['12th Pass', 'Graduate'],
    description: 'Joint services academy entrance for Army, Navy, and Air Force officers.',
    portalLink: 'https://upsc.gov.in'
  },
  {
    name: 'UPSC CDS',
    fullName: 'Combined Defence Services Examination',
    minAge: 19,
    maxAge: { General: 24, EWS: 24, OBC: 24, SC: 24, ST: 24 },
    qualifications: ['Graduate', 'Post Graduate'],
    description: 'Officer cadet recruitment for Indian Military Academy, Naval Academy & OTA.',
    portalLink: 'https://upsc.gov.in'
  },
  {
    name: 'IBPS PO',
    fullName: 'Institute of Banking Personnel Selection - Probationary Officer',
    minAge: 20,
    maxAge: { General: 30, EWS: 30, OBC: 33, SC: 35, ST: 35 },
    qualifications: ['Graduate', 'Post Graduate'],
    description: 'Management trainee & officer positions in Indian Public Sector Banks.',
    portalLink: 'https://ibps.in'
  },
  {
    name: 'RBI Grade B',
    fullName: 'Reserve Bank of India Grade B Officer',
    minAge: 21,
    maxAge: { General: 30, EWS: 30, OBC: 33, SC: 35, ST: 35 },
    qualifications: ['Graduate', 'Post Graduate'],
    description: 'Highly prestigious direct officer level entry into India\'s central bank.',
    portalLink: 'https://rbi.org.in'
  }
];

export const EligibilityChecker: React.FC = () => {
  const [age, setAge] = useState<number>(22);
  const [category, setCategory] = useState<string>('General');
  const [qualification, setQualification] = useState<string>('Graduate');
  const [stream, setStream] = useState<string>('Arts & Humanities');
  const [attempts, setAttempts] = useState<number>(0);
  const [checked, setChecked] = useState(false);

  const [results, setResults] = useState<{
    eligible: { exam: ExamRule; remainingYears: number }[];
    ineligible: { exam: ExamRule; reasons: string[] }[];
  }>({ eligible: [], ineligible: [] });

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const newEligible: { exam: ExamRule; remainingYears: number }[] = [];
    const newIneligible: { exam: ExamRule; reasons: string[] }[] = [];

    EXAM_RULES.forEach((exam) => {
      const reasons: string[] = [];
      const limitAge = exam.maxAge[category] || exam.maxAge['General'];

      if (age < exam.minAge) {
        reasons.push(`Umra bohot kam hai. Minimum age rule is ${exam.minAge} years (Aapki age ${age} hai).`);
      }
      if (age > limitAge) {
        reasons.push(`Maximum age limit is ${limitAge} years for ${category} category (Aapki age ${age} hai).`);
      }
      if (!exam.qualifications.includes(qualification)) {
        reasons.push(`Minimum qualification required is: ${exam.qualifications.join('/')} (Aapki degree: ${qualification} hai).`);
      }

      if (reasons.length === 0) {
        newEligible.push({
          exam,
          remainingYears: limitAge - age
        });
      } else {
        newIneligible.push({ exam, reasons });
      }
    });

    setResults({ eligible: newEligible, ineligible: newIneligible });
    setChecked(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 bg-slate-900/40 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-white shadow-lg">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Exam Eligibility Calculator</h1>
          <p className="text-xs text-slate-400">
            Apni age, degree aur reservation status daal kar check karein ki aap kaun-kaun se central & state exams de sakte hain.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calculator Form */}
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 space-y-4 h-fit">
          <h3 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-white/5">
            <Sparkles className="w-4 h-4 text-cyan-400" /> Enter Parameters
          </h3>

          <form onSubmit={handleCheck} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Current Age (Years)</label>
              <input
                type="number"
                min={15}
                max={50}
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value) || 18)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Category / Reservation</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="General">General / UR</option>
                <option value="EWS">EWS</option>
                <option value="OBC">OBC (Non-Creamy Layer)</option>
                <option value="SC">Scheduled Caste (SC)</option>
                <option value="ST">Scheduled Tribe (ST)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Highest Qualification</label>
              <select
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="10th Pass">10th Pass</option>
                <option value="12th Pass">12th Pass / Intermediate</option>
                <option value="Graduate">Graduation / Bachelor\'s Degree</option>
                <option value="Post Graduate">Post Graduation / Master\'s Degree</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Academic Stream</label>
              <select
                value={stream}
                onChange={(e) => setStream(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="Arts & Humanities">Arts & Humanities (BA, etc.)</option>
                <option value="Science">Science (B.Sc, M.Sc, etc.)</option>
                <option value="Engineering">Engineering / Tech (B.Tech, BE)</option>
                <option value="Commerce">Commerce & Management (B.Com, BBA)</option>
                <option value="Medical">Medical / Pharmacy (MBBS, BDS)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase">UPSC Attempts Made Already</label>
              <input
                type="number"
                min={0}
                max={15}
                value={attempts}
                onChange={(e) => setAttempts(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
            >
              Analyze Eligibility Now
            </button>
          </form>
        </div>

        {/* Results Pane */}
        <div className="lg:col-span-2 space-y-6">
          {!checked ? (
            <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-16 text-center space-y-4">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto opacity-40 animate-pulse" />
              <div className="space-y-1">
                <h3 className="text-white font-bold text-sm">Waiting for Parameters</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Apna study structure aur age select karke analysis start karein.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Eligible list */}
              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 space-y-4">
                <h3 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-white/5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Exams You Are Eligible For ({results.eligible.length})
                </h3>

                {results.eligible.length === 0 ? (
                  <p className="text-xs text-slate-400">Aap is profile ke saath abhi kisi exam ke liye eligible nahi hain.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.eligible.map(({ exam, remainingYears }) => (
                      <div 
                        key={exam.name}
                        className="bg-slate-950/60 border border-white/5 hover:border-emerald-500/30 rounded-xl p-4 space-y-2 transition-all group"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] text-emerald-400 font-extrabold uppercase bg-emerald-500/10 px-2 py-0.5 rounded">
                              Eligible ✅
                            </span>
                            <h4 className="font-black text-white text-sm mt-1">{exam.name}</h4>
                          </div>
                          <a 
                            href={exam.portalLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5 font-bold"
                          >
                            Official Website
                          </a>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2">{exam.description}</p>
                        <div className="pt-2 border-t border-white/5 flex justify-between text-[9px] text-slate-400">
                          <span>Max Attempts limit: {category === 'General' ? '6 Attempts' : '9/Unlimited'}</span>
                          <span className="text-amber-400 font-bold">{remainingYears} years left to attempt</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ineligible list */}
              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 space-y-4">
                <h3 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-white/5">
                  <XCircle className="w-4 h-4 text-rose-400" /> Locked / Ineligible Exams ({results.ineligible.length})
                </h3>

                <div className="space-y-3">
                  {results.ineligible.map(({ exam, reasons }) => (
                    <div 
                      key={exam.name}
                      className="bg-slate-950/40 border border-white/5 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="text-left">
                        <h4 className="font-bold text-white text-xs">{exam.name} - <span className="text-slate-400 font-normal">{exam.fullName}</span></h4>
                        <div className="mt-1.5 space-y-1">
                          {reasons.map((r, i) => (
                            <p key={i} className="text-[10px] text-rose-400 flex items-center gap-1">
                              • {r}
                            </p>
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-1 rounded border border-white/5 h-fit shrink-0">
                        Ineligible ❌
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
