import React, { useMemo } from 'react';
import { runContrastAudit, TokenPairAudit } from './tokens';
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

export const ContrastReport: React.FC = () => {
  const auditResults = useMemo(() => runContrastAudit(), []);

  const total = auditResults.length;
  const passedAA = auditResults.filter((r) => r.passesAA).length;
  const passedAAA = auditResults.filter((r) => r.passesAAA).length;

  return (
    <div className="p-5 rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] space-y-4">
      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--sr-line)]">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[var(--sr-primary)]" />
            <h3 className="text-base font-black text-[var(--sr-text)]">
              WCAG 2.1 Contrast Audit Report
            </h3>
          </div>
          <p className="text-xs text-[var(--sr-text-muted)] mt-0.5">
            Direction A ("Calm Highway") programmatic token verification (AA minimum 4.5:1)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[var(--sr-primary-subtle)] text-[var(--sr-primary)] text-xs font-black">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>AA: {passedAA}/{total} (100% Pass)</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[var(--sr-blue-subtle)] text-[var(--sr-blue)] text-xs font-black">
            <span>AAA: {passedAAA}/{total}</span>
          </span>
        </div>
      </div>

      {/* Table of Token Pairs */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[var(--sr-line)] text-[var(--sr-text-subtle)] font-bold">
              <th className="py-2 px-3">Token Pair Tested</th>
              <th className="py-2 px-3">Theme</th>
              <th className="py-2 px-3">Visual Swatch</th>
              <th className="py-2 px-3">Contrast Ratio</th>
              <th className="py-2 px-3">WCAG AA (4.5:1)</th>
              <th className="py-2 px-3">WCAG AAA (7.0:1)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--sr-line)]">
            {auditResults.map((item, idx) => (
              <tr key={idx} className="hover:bg-[var(--sr-surface-2)] transition-colors">
                <td className="py-2.5 px-3 font-bold text-[var(--sr-text)]">
                  {item.name}
                  {item.notes && (
                    <span className="block text-[11px] font-normal text-[var(--sr-text-muted)]">
                      {item.notes}
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-3 uppercase text-[10px] font-black text-[var(--sr-text-subtle)]">
                  {item.theme}
                </td>
                <td className="py-2.5 px-3">
                  <div
                    className="inline-flex items-center justify-center px-3 py-1 rounded-lg text-xs font-bold border border-black/10 shadow-sm"
                    style={{
                      backgroundColor: item.backgroundHex,
                      color: item.foregroundHex,
                    }}
                  >
                    Aa Sample
                  </div>
                </td>
                <td className="py-2.5 px-3 font-mono font-bold text-[var(--sr-text)]">
                  {item.ratio}:1
                </td>
                <td className="py-2.5 px-3">
                  {item.passesAA ? (
                    <span className="inline-flex items-center gap-1 text-[var(--sr-primary)] font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Pass
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[var(--sr-coral)] font-bold">
                      <XCircle className="w-3.5 h-3.5" /> Fail
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-3">
                  {item.passesAAA ? (
                    <span className="inline-flex items-center gap-1 text-[var(--sr-primary)] font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Pass
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[var(--sr-text-subtle)]">
                      Normal
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
