export default function StatusBadge({ status }) {
  const key = (status || "unknown").toLowerCase().replace(/\s+/g, "-");
  return <span className={`badge ${key}`}>{status || "Unknown"}</span>;
}
