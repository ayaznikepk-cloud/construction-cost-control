function formatPKR(amount: number) {
  if (Math.abs(amount) >= 1_000_000) {
    return `Rs ${(amount / 1_000_000).toFixed(2)}m`;
  }
  return `Rs ${amount.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

export default function MetricCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "positive" | "warning" | "danger";
}) {
  const toneClass = {
    neutral: "text-gray-900",
    positive: "text-positive",
    warning: "text-warning",
    danger: "text-danger",
  }[tone];

  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${toneClass}`}>{formatPKR(value)}</div>
    </div>
  );
}
