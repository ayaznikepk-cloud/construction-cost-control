type Props = {
  kind: "success" | "error" | "info";
  children: React.ReactNode;
};

const styles = {
  success: "border-green-200 bg-green-50 text-green-800",
  error: "border-red-200 bg-red-50 text-red-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

export default function FormStatusMessage({ kind, children }: Props) {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      aria-live="polite"
      className={`rounded-md border px-3 py-2 text-sm ${styles[kind]}`}
    >
      {children}
    </div>
  );
}
