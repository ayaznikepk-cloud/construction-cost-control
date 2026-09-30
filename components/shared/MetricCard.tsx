function formatPKR(amount: number) {
  if (Math.abs(amount) >= 1_000_000) return `Rs ${(amount / 1_000_000).toFixed(2)}m`;
  return `Rs ${amount.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

export default function MetricCard({
  label, value, tone = "neutral", currency = true,
}: {
  label: string;
  value: number;
  tone?: "neutral" | "positive" | "warning" | "danger";
  currency?: boolean;
}) {
  const toneClass = {
    neutral: "text-gray-900",
    positive: "text-positive",
    warning: "text-warning",
    danger: "text-danger",
  }[tone];

  return (
    <div className="min-w-0 rounded-lg border border-border bg-white p-4">
      <div className="text-xs font-medium leading-5 text-gray-500">{label}</div>
      <div className={`mt-1 break-words text-xl font-semibold ${toneClass}`}>
        {currency ? formatPKR(value) : value.toLocaleString("en-PK")}
      </div>
    </div>
  );
}
