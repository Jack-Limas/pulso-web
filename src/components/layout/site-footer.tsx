import { Logo } from "@/components/brand/logo";

export function SiteFooter({ note, made }: { note?: string; made: string }) {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <Logo size={26} />
        <p>{made}</p>
        {note && <p className="font-mono text-xs">{note}</p>}
      </div>
    </footer>
  );
}
