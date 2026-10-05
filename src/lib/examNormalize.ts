import { EXAM_LIST } from './examList';

export function normalizeExamId(raw: string | undefined | null): string {
  if (!raw) return 'UPSC_CSE';
  const trimmed = raw.trim();
  if (!trimmed) return 'UPSC_CSE';

  const s = trimmed.toLowerCase();

  // 1. Exact match against EXAM_LIST IDs (case-insensitive)
  const exactId = EXAM_LIST.find((e) => e.id.toLowerCase() === s);
  if (exactId) return exactId.id;

  // 2. Exact match against EXAM_LIST labels (case-insensitive)
  const exactLabel = EXAM_LIST.find((e) => e.label.toLowerCase() === s);
  if (exactLabel) return exactLabel.id;

  // 3. Normalized upper key check
  const upper = trimmed.toUpperCase().replace(/[-\s]/g, '_');
  const upperMatch = EXAM_LIST.find((e) => e.id === upper);
  if (upperMatch) return upperMatch.id;

  // 4. Common aliases / shorthand patterns
  if (s.includes('neet') && s.includes('pg')) return 'NEET_PG';
  if (s.includes('neet') && (s.includes('mds') || s.includes('dental'))) return 'NEET_MDS';
  if (s.includes('neet') && s.includes('ss')) return 'NEET_SS';
  if (s.includes('neet')) return 'NEET_UG';
  if (s.includes('jee') && s.includes('adv')) return 'JEE_ADVANCED';
  if (s.includes('jee')) return 'JEE_MAIN';
  if (s.includes('upsc') || s.includes('civil service') || s.includes('ias') || s.includes('cse')) return 'UPSC_CSE';
  if (s.includes('gate') && (s.includes('da') || s.includes('data'))) return 'GATE_DA';
  if (s.includes('gate')) return 'GATE_ENGINEERING';
  if (s.includes('ssc') && s.includes('cgl')) return 'SSC_CGL';
  if (s.includes('ssc') && s.includes('chsl')) return 'SSC_CHSL';
  if (s.includes('ssc') && s.includes('je')) return 'SSC_JE';
  if (s.includes('ssc')) return 'SSC_CGL';
  if (s.includes('clat') && s.includes('pg')) return 'CLAT_PG';
  if (s.includes('clat')) return 'CLAT_UG';
  if (s.includes('cat')) return 'CAT';
  if (s.includes('norcet') || s.includes('nursing')) return 'NORCET';
  if (s.includes('rrb') && s.includes('je')) return 'RRB_JE';
  if (s.includes('rrb') && s.includes('alp')) return 'RRB_ALP';
  if (s.includes('rrb')) return 'RRB_NTPC';
  if (s.includes('upsssc je')) return 'UPSSSC_JE';
  if (s.includes('uppcl')) return 'UPPCL_AE_JE';
  if (s.includes('bpsc ae')) return 'BPSC_AE';
  if (s.includes('btsc je') || s.includes('btsc')) return 'BTSC_JE';
  if (s.includes('bsphcl')) return 'BSPHCL_AE_JE';
  if (s.includes('mppsc ae') || s.includes('mp ses')) return 'MPPSC_AE';
  if (s.includes('mp sub engineer') || s.includes('vyapam sub')) return 'MP_SUB_ENGINEER';
  if (s.includes('rpsc ae') || s.includes('rpsc aen')) return 'RPSC_AEN';
  if (s.includes('rsmssb je') || s.includes('rssb je')) return 'RSMSSB_JE';
  if (s.includes('ukpsc ae')) return 'UKPSC_AE';
  if (s.includes('ukpsc je')) return 'UKPSC_JE';
  if (s.includes('mpsc mes') || s.includes('mpsc ae')) return 'MPSC_MES_AE';
  if (s.includes('wbpsc ae')) return 'WBPSC_AE';
  if (s.includes('wbpsc je')) return 'WBPSC_JE';
  if (s.includes('hpsc ae')) return 'HPSC_AE';
  if (s.includes('hssc je')) return 'HSSC_JE';
  if (s.includes('ppsc ae')) return 'PPSC_AE';
  if (s.includes('pspcl')) return 'PSPCL_JE';
  if (s.includes('jpsc ae')) return 'JPSC_AE';
  if (s.includes('jssc je') || s.includes('jdlcce')) return 'JSSC_JE';
  if (s.includes('opsc aee') || s.includes('opsc ae')) return 'OPSC_AEE';
  if (s.includes('osssc je')) return 'OSSSC_JE';
  if (s.includes('gpsc ae')) return 'GPSC_AE';
  if (s.includes('gsecl') || s.includes('getco')) return 'GSECL_GETCO_JE';
  if (s.includes('cgpsc ae')) return 'CGPSC_AE';
  if (s.includes('cg vyapam') || s.includes('cg sub engineer')) return 'CG_VYAPAM_JE';
  if (s.includes('appsc ae') || s.includes('appsc aee')) return 'APPSC_AEE';
  if (s.includes('tspsc ae') || s.includes('tspsc aee')) return 'TSPSC_AEE';
  if (s.includes('kpsc ae') || s.includes('kpsc je')) return 'KPSC_AE_JE';
  if (s.includes('tnpsc cese') || s.includes('tnpsc ae')) return 'TNPSC_CESE_AE';
  if (s.includes('kerala psc ae')) return 'KERALA_PSC_AE';
  if (s.includes('dsssb ae') || s.includes('dsssb je')) return 'DSSSB_AE_JE';
  if (s.includes('dda je')) return 'DDA_JE';
  if (s.includes('nda') || s.includes('naval academy') || s.includes('national defence academy')) return 'NDA_NA';
  if (s.includes('cds') || s.includes('combined defence')) return 'CDS';
  if (s.includes('rrb ntpc')) return 'RRB_NTPC';
  if (s.includes('uppsc') || s.includes('up pcs')) return 'UPPSC_PCS';
  if (s.includes('bpsc')) return 'BPSC';
  if (s.includes('mppsc')) return 'MPPSC';
  if (s.includes('ibps po')) return 'IBPS_PO';
  if (s.includes('sbi po')) return 'SBI_PO';

  // 5. Look for partial match in EXAM_LIST
  const partial = EXAM_LIST.find((e) => s.includes(e.id.toLowerCase()) || e.label.toLowerCase().includes(s));
  if (partial) return partial.id;

  // 6. Clean uppercase fallback
  return trimmed.toUpperCase().replace(/[-\s]/g, '_');
}
