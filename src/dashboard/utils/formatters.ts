export function formatInt(v: number) {
  return new Intl.NumberFormat().format(Number.isFinite(v) ? v : 0);
}

export function formatPct(v: number) {
  const n = Number.isFinite(v) ? v : 0;
  return `${(n * 100).toFixed(1)}%`;
}

export function safeNum(n: any) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

export function normalizeKey(s: any) {
  const v = String(s ?? "").trim();
  return v.length ? v : "Unknown";
}

export function sumCounts(rows: { count: number }[]) {
  return rows.reduce((acc, r) => acc + safeNum(r.count), 0);
}

export function topN<T>(rows: T[], n: number, getCount: (t: T) => number) {
  return [...(rows || [])].sort((a, b) => getCount(b) - getCount(a)).slice(0, n);
}