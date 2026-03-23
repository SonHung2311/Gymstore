export default function Spinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-spin rounded-full border-4 border-light border-t-primary ${className}`}
      style={{ width: 36, height: 36 }}
      aria-label="Loading"
    />
  );
}
