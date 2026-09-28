// Display helpers. Money/quantities arrive from Postgres as exact numerics;
// these only format for display and never feed back into calculations.

export function pkr(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return `Rs ${n.toLocaleString("en-PK", { maximumFractionDigits: 2 })}`;
}

// 2026-09-25 -> 25-Sep-2026
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return d
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .replace(/ /g, "-");
}

// Sum 2-decimal money values without floating-point drift (works in paisa).
export function sumMoney(values: (number | string | null | undefined)[]): number {
  const paisa = values.reduce<number>((acc, v) => acc + Math.round(Number(v ?? 0) * 100), 0);
  return paisa / 100;
}

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };
