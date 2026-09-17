import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/useMe";
import {
  BoxIcon,
  GearIcon,
  PlusIcon,
  ShieldIcon,
  StoreIcon,
  TruckIcon,
  WalletIcon,
} from "@/components/Icons";

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { data: me } = useMe();
  const navigate = useNavigate();

  const nav = [
    { to: "/mes-commandes", label: "Commandes", Icon: BoxIcon, show: true },
    { to: "/nouvelle-commande", label: "Nouvelle", Icon: PlusIcon, show: true },
    { to: "/portefeuille", label: "Argent", Icon: WalletIcon, show: true },
    { to: "/vendeur", label: "Vendeur", Icon: StoreIcon, show: true },
    { to: "/point-depot", label: "Point", Icon: ShieldIcon, show: true },
    { to: "/livreur", label: "Livreur", Icon: TruckIcon, show: !!me?.isCourier },
    { to: "/admin", label: "Admin", Icon: GearIcon, show: !!me?.isAdmin },
  ].filter((i) => i.show);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="glass sticky top-0 z-20 border-b px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <Link to="/mes-commandes" className="flex items-center gap-2">
            <ShieldIcon className="size-6 text-brand" />
            <span className="font-display text-lg font-semibold">Séquestre</span>
          </Link>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/" });
            }}
            className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        <div className="mt-6 space-y-4">{children}</div>
      </main>

      <nav className="glass fixed inset-x-0 bottom-0 z-20 border-t">
        <div className="mx-auto flex max-w-3xl items-stretch justify-between overflow-x-auto px-2 py-2">
          {nav.map(({ to, label, Icon }) => (
            <Link
              key={to}
              to={to}
              activeProps={{ className: "text-brand" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="flex min-w-16 flex-col items-center gap-1 rounded-lg px-2 py-1 text-[11px]"
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`glass rounded-2xl p-4 ${className}`}>{children}</div>;
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {hint ? <span className="block text-[11px] text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-brand";

export const btnClass =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50";

export const btnGhostClass =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50";
