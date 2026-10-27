export default function AvatarPlaceholder({ name = "Intern", size = 96, className = "" }) {
  const getInitials = (str) => {
    if (!str) return "PSM";
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const initials = getInitials(name);
  const fontSize = Math.round(size * 0.38);

  return (
    <div
      className={`avatar-placeholder ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #10264b 0%, #245fcb 100%)",
        color: "#ffffff",
        fontWeight: 700,
        fontSize: `${fontSize}px`,
        letterSpacing: "0.5px",
        boxShadow: "0 2px 8px rgba(16, 38, 75, 0.15)",
        userSelect: "none",
        border: "2px solid rgba(255, 255, 255, 0.8)",
      }}
      title={name}
      aria-label={`Profile placeholder for ${name}`}
    >
      <span>{initials}</span>
    </div>
  );
}
