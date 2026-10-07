import React, { useState, useEffect } from 'react';
import { 
  ASSET_SLOTS_MANIFEST, 
  AssetSlotDefinition, 
  TOTAL_MANIFEST_ASSETS_COUNT 
} from './assetManifest';
import { 
  ArrowLeft, CheckCircle2, XCircle, Search, RefreshCw, 
  Eye, FileCode, Check, AlertTriangle 
} from 'lucide-react';
import { TactileButton } from '../../../design-system/TactileButton';

export interface AssetCheckScreenProps {
  onBack?: () => void;
}

interface AssetCheckStatus {
  definition: AssetSlotDefinition;
  status: 'FOUND' | 'MISSING' | 'CHECKING';
  checkedUrl: string;
}

export const AssetCheckScreen: React.FC<AssetCheckScreenProps> = ({ onBack }) => {
  const [statuses, setStatuses] = useState<AssetCheckStatus[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const checkAssets = async () => {
    setIsScanning(true);
    const manifestEntries = Object.values(ASSET_SLOTS_MANIFEST);

    // Initial state: checking
    setStatuses(
      manifestEntries.map((def) => ({
        definition: def,
        status: 'CHECKING',
        checkedUrl: def.expectedPath
      }))
    );

    const checkedResults = await Promise.all(
      manifestEntries.map(async (def): Promise<AssetCheckStatus> => {
        try {
          const res = await fetch(def.expectedPath, { method: 'HEAD' });
          if (res.ok && res.status === 200) {
            return { definition: def, status: 'FOUND', checkedUrl: def.expectedPath };
          }
          return { definition: def, status: 'MISSING', checkedUrl: def.expectedPath };
        } catch {
          return { definition: def, status: 'MISSING', checkedUrl: def.expectedPath };
        }
      })
    );

    setStatuses(checkedResults);
    setIsScanning(false);
  };

  useEffect(() => {
    checkAssets();
  }, []);

  const foundCount = statuses.filter((s) => s.status === 'FOUND').length;
  const missingCount = statuses.filter((s) => s.status === 'MISSING').length;
  const percentPresent = ((foundCount / TOTAL_MANIFEST_ASSETS_COUNT) * 100).toFixed(1);

  const filteredStatuses = statuses.filter((item) => {
    if (filterCategory !== 'ALL' && item.definition.category !== filterCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.definition.id.toLowerCase().includes(q) ||
        item.definition.name.toLowerCase().includes(q) ||
        item.definition.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-28 px-3 sm:px-4 text-slate-100 select-none">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between gap-3 pt-3">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Back to garage"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase font-mono">
                DEV INTERNAL INSPECTOR
              </span>
              <span className="text-xs text-slate-400 font-mono">
                52-Asset Slot Manifest
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5">
              Asset Manifest & Slot Auditor
            </h1>
          </div>
        </div>

        <TactileButton
          variant="secondary"
          size="sm"
          onClick={checkAssets}
          disabled={isScanning}
          icon={<RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />}
        >
          {isScanning ? 'Scanning...' : 'Re-scan'}
        </TactileButton>
      </div>

      {/* ── SUMMARY STATS BAR ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Total Slots</span>
          <p className="text-2xl font-black text-white mt-1">{TOTAL_MANIFEST_ASSETS_COUNT}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Found On Disk</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">{foundCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <span className="text-[10px] font-mono uppercase text-rose-400 font-bold">Missing (Placeholders)</span>
          <p className="text-2xl font-black text-rose-400 mt-1">{missingCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold">Completion</span>
          <p className="text-2xl font-black text-indigo-400 mt-1">{percentPresent}%</p>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-amber-400" />
          <span>
            <strong>Assets present:</strong> {foundCount} / {TOTAL_MANIFEST_ASSETS_COUNT} ({percentPresent}%)
          </span>
        </div>
        <span className="text-slate-400 font-mono text-[11px]">
          Target Directory: <code className="text-slate-300">public/assets/...</code>
        </span>
      </div>

      {/* ── FILTER & SEARCH HUD ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['ALL', 'RIDER', 'BIKE_PART', 'BIKE_TIER', 'PROP', 'OVERLAY', 'RELAX'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search slot ID or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* ── 52-ASSET AUDIT TABLE ── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead className="bg-slate-900/90 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Asset ID</th>
                <th className="py-3 px-4">Slot</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Dimensions</th>
                <th className="py-3 px-4">Expected Path</th>
                <th className="py-3 px-4 text-right">Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredStatuses.map(({ definition, status, checkedUrl }) => (
                <tr key={definition.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4">
                    {status === 'CHECKING' ? (
                      <span className="text-[10px] font-mono text-amber-400 font-bold">CHECKING...</span>
                    ) : status === 'FOUND' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[10px]">
                        <CheckCircle2 className="w-3 h-3" /> FOUND
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 font-mono font-bold text-[10px]">
                        <XCircle className="w-3 h-3" /> MISSING
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-white">
                    {definition.id}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">
                    {definition.slot || '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
                      {definition.category} {definition.tier ? `(T${definition.tier})` : ''}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">
                    {definition.dimensions}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px] truncate max-w-xs">
                    {checkedUrl}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {status === 'FOUND' ? (
                      <img
                        src={checkedUrl}
                        alt={definition.name}
                        className="w-8 h-8 rounded border border-slate-700 object-contain ml-auto bg-slate-900"
                      />
                    ) : (
                      <div className="w-16 h-7 rounded border border-dashed border-slate-700 bg-slate-900 flex items-center justify-center text-[9px] font-mono text-slate-500 ml-auto">
                        placeholder
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
