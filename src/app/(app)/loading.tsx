export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse space-y-6">
      <div className="h-8 w-44 rounded-md bg-muted" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-muted" />
        ))}
      </div>
      <div className="h-28 rounded-xl bg-muted" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}
