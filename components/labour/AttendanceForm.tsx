"use client";

import { useMemo, useState } from "react";

type Worker = {
  id: string;
  worker_code: string;
  name: string;
  trade: string | null;
};

type EntryState = {
  status: "present" | "half_day" | "absent" | null;
  overtime_hours: number;
};

export default function AttendanceForm({
  projectId,
  date,
  workers,
  existing,
  action,
}: {
  projectId: string;
  date: string;
  workers: Worker[];
  existing: Record<string, EntryState>;
  action: (formData: FormData) => Promise<void>;
}) {
  const [entries, setEntries] = useState<Record<string, EntryState>>(() => {
    const initial: Record<string, EntryState> = {};
    workers.forEach((w) => {
      initial[w.id] = existing[w.id] ?? { status: null, overtime_hours: 0 };
    });
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function setStatus(workerId: string, status: EntryState["status"]) {
    setEntries((prev) => ({ ...prev, [workerId]: { ...prev[workerId], status } }));
    setSaved(false);
  }

  function setOT(workerId: string, hours: number) {
    setEntries((prev) => ({ ...prev, [workerId]: { ...prev[workerId], overtime_hours: hours } }));
    setSaved(false);
  }

  const summary = useMemo(() => {
    const values = Object.values(entries);
    return {
      present: values.filter((e) => e.status === "present").length,
      half: values.filter((e) => e.status === "half_day").length,
      absent: values.filter((e) => e.status === "absent").length,
      ot: values.reduce((sum, e) => sum + (e.overtime_hours || 0), 0),
    };
  }, [entries]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const payload = Object.entries(entries)
        .filter(([, v]) => v.status !== null)
        .map(([worker_id, v]) => ({
          worker_id,
          status: v.status,
          overtime_hours: v.overtime_hours || 0,
        }));

      const formData = new FormData();
      formData.set("project_id", projectId);
      formData.set("date", date);
      formData.set("entries", JSON.stringify(payload));

      await action(formData);
      setSaved(true);
    } catch (e: any) {
      setError(e?.message ?? "Could not save attendance.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pb-24">
      <div className="mb-4 grid grid-cols-4 gap-3">
        <Stat label="Present" value={summary.present} tone="positive" />
        <Stat label="Half Day" value={summary.half} tone="warning" />
        <Stat label="Absent" value={summary.absent} tone="danger" />
        <Stat label="OT Hours" value={summary.ot} tone="neutral" />
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-danger">{error}</div>
      )}
      {saved && !error && (
        <div className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-positive">
          Attendance saved.
        </div>
      )}

      <div className="divide-y divide-border rounded-lg border border-border bg-white">
        {workers.map((w) => {
          const e = entries[w.id];
          return (
            <div key={w.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-[140px] flex-1">
                <div className="text-sm font-medium">{w.name}</div>
                <div className="text-xs text-gray-500">
                  {w.worker_code} · {w.trade}
                </div>
              </div>

              <div className="flex gap-2">
                <PHAButton
                  label="P"
                  active={e.status === "present"}
                  tone="positive"
                  onClick={() => setStatus(w.id, "present")}
                />
                <PHAButton
                  label="H"
                  active={e.status === "half_day"}
                  tone="warning"
                  onClick={() => setStatus(w.id, "half_day")}
                />
                <PHAButton
                  label="A"
                  active={e.status === "absent"}
                  tone="danger"
                  onClick={() => setStatus(w.id, "absent")}
                />
              </div>

              <input
                type="number"
                min={0}
                step={0.5}
                value={e.overtime_hours || ""}
                onChange={(ev) => setOT(w.id, Number(ev.target.value))}
                placeholder="OT hrs"
                className="w-20 rounded-md border border-border px-2 py-2 text-sm"
              />
            </div>
          );
        })}
        {workers.length === 0 && (
          <div className="p-6 text-center text-sm text-gray-500">
            No workers found. Add workers under Setup → Labour first.
          </div>
        )}
      </div>

      {workers.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 border-t border-border bg-white p-4 md:sticky md:mt-4 md:rounded-lg md:border">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-md bg-active py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      )}
    </div>
  );
}

function PHAButton({
  label,
  active,
  tone,
  onClick,
}: {
  label: string;
  active: boolean;
  tone: "positive" | "warning" | "danger";
  onClick: () => void;
}) {
  const activeClass = {
    positive: "bg-positive text-white border-positive",
    warning: "bg-warning text-white border-warning",
    danger: "bg-danger text-white border-danger",
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-11 w-11 items-center justify-center rounded-md border text-sm font-semibold ${
        active ? activeClass : "border-border bg-white text-gray-600"
      }`}
    >
      {label}
    </button>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "positive" | "warning" | "danger" | "neutral";
}) {
  const toneClass = {
    positive: "text-positive",
    warning: "text-warning",
    danger: "text-danger",
    neutral: "text-gray-900",
  }[tone];

  return (
    <div className="rounded-lg border border-border bg-white p-3 text-center">
      <div className={`text-lg font-semibold ${toneClass}`}>{value}</div>
      <div className="text-[11px] text-gray-500">{label}</div>
    </div>
  );
}
