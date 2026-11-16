const MAX_INITIALS = 2;

function initialsOf(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, MAX_INITIALS)
    .map((word) => word[0]!.toUpperCase())
    .join("");
}

export function UserCard({
  fullName,
  email,
  roleLabel,
  isAdmin,
}: {
  fullName: string;
  email: string;
  roleLabel: string;
  isAdmin: boolean;
}) {
  return (
    <div data-testid="user-card" className="card flex items-center gap-3 p-3">
      <span
        aria-hidden
        className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue via-violet to-red font-display text-sm font-bold text-white shadow-[0_10px_24px_-12px_var(--blue)]"
      >
        {initialsOf(fullName)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{fullName}</p>
        <p className="truncate text-xs text-muted">{email}</p>
        <span
          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            isAdmin ? "bg-violet/15 text-violet" : "bg-blue/10 text-blue"
          }`}
        >
          {roleLabel}
        </span>
      </div>
    </div>
  );
}
