import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Panel, btnGhostClass, inputClass } from "@/components/AppShell";
import { formatXof } from "@/lib/format";
import { STATUS_LABELS, type OrderStatus } from "@/lib/statuses";
import { useMe } from "@/hooks/useMe";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administration — Séquestre" },
      { name: "description", content: "Validation des points, commandes, litiges, retraits et commissions." },
      { property: "og:title", content: "Administration — Séquestre" },
      { property: "og:description", content: "Pilotage de la plateforme Séquestre." },
    ],
  }),
  component: Admin,
});

const small = "rounded-lg border border-border px-2 py-1 text-xs hover:bg-accent";

function Admin() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [filter, setFilter] = useState("");
  const [msg, setMsg] = useState("");
  const [rates, setRates] = useState({ p: "", e: "" });

  const { data } = useQuery({
    queryKey: ["admin"],
    enabled: !!me?.isAdmin,
    queryFn: async () => {
      const [orders, points, disputes, wr, settings] = await Promise.all([
        supabase.rpc("admin_list_orders"),
        supabase.from("escrow_points").select("*").order("created_at", { ascending: false }),
        supabase.from("disputes").select("*").eq("status", "open"),
        supabase.from("withdrawal_requests").select("*").eq("status", "pending"),
        supabase.from("platform_settings").select("*").maybeSingle(),
      ]);
      return { orders: orders.data ?? [], points: points.data ?? [], disputes: disputes.data ?? [], wr: wr.data ?? [], settings: settings.data };
    },
  });

  async function run(p: PromiseLike<{ error: { message: string } | null }>, ok: string) {
    const { error } = await p;
    setMsg(error ? error.message : ok);
    qc.invalidateQueries({ queryKey: ["admin"] });
  }

  async function openDoc(path: string) {
    const { data: s } = await supabase.storage.from("kyc-documents").createSignedUrl(path, 300);
    if (s) window.open(s.signedUrl, "_blank");
  }

  if (!me?.isAdmin) return <AppShell title="Administration"><Panel>Accès réservé.</Panel></AppShell>;
  const orders = data?.orders.filter((o) => !filter || o.status === filter) ?? [];

  return (
    <AppShell title="Administration">
      {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
      <Panel className="space-y-2">
        <h2 className="font-semibold">Points de dépôt</h2>
        {data?.points.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 text-sm last:border-0">
            <span>{p.business_name} · {p.city} <span className="text-xs text-muted-foreground">({p.status})</span></span>
            <span className="flex gap-1">
              {p.id_document_url ? <button className={small} onClick={() => openDoc(p.id_document_url!)}>Pièce</button> : null}
              {p.business_registry_url ? <button className={small} onClick={() => openDoc(p.business_registry_url!)}>Registre</button> : null}
              {p.status !== "approved" ? <button className={small} onClick={() => run(supabase.rpc("admin_set_escrow_point_status", { _point_id: p.id, _status: "approved" }), "Point approuvé.")}>Approuver</button> : null}
              {p.status !== "suspended" ? <button className={small} onClick={() => run(supabase.rpc("admin_set_escrow_point_status", { _point_id: p.id, _status: "suspended" }), "Point suspendu.")}>Rejeter</button> : null}
            </span>
          </div>
        ))}
      </Panel>
      <Panel className="space-y-2">
        <h2 className="font-semibold">Litiges ouverts</h2>
        {data?.disputes.length ? data.disputes.map((d) => (
          <div key={d.id} className="flex items-center justify-between gap-2 text-sm">
            <span>{d.reason}</span>
            <span className="flex gap-1">
              <button className={small} onClick={() => run(supabase.rpc("cancel_order", { _order_id: d.order_id, _reason: "Litige — remboursement admin" }), "Commande remboursée.")}>Rembourser</button>
              <button className={small} onClick={() => run(supabase.rpc("admin_resolve_dispute", { _dispute_id: d.id, _admin_note: "Résolu" }), "Litige clôturé.")}>Clôturer</button>
            </span>
          </div>
        )) : <p className="text-sm text-muted-foreground">Aucun.</p>}
      </Panel>
      <Panel className="space-y-2">
        <h2 className="font-semibold">Retraits en attente</h2>
        {data?.wr.length ? data.wr.map((w) => (
          <div key={w.id} className="flex items-center justify-between gap-2 text-sm">
            <span>{formatXof(w.amount_xof)} · {w.method === "push_ci" ? `Cash ${w.pickup_code}` : `MoMo ${w.destination_phone}`}</span>
            <span className="flex gap-1">
              <button className={small} onClick={() => run(supabase.rpc("admin_set_withdrawal_status", { _id: w.id, _status: "completed" }), "Retrait payé.")}>Payé</button>
              <button className={small} onClick={() => run(supabase.rpc("admin_set_withdrawal_status", { _id: w.id, _status: "rejected" }), "Retrait rejeté, solde restitué.")}>Rejeter</button>
            </span>
          </div>
        )) : <p className="text-sm text-muted-foreground">Aucun.</p>}
      </Panel>
      <Panel className="space-y-2">
        <h2 className="font-semibold">Commissions</h2>
        <p className="text-xs text-muted-foreground">Actuel : plateforme {data?.settings?.platform_commission_percentage} % · point {data?.settings?.default_escrow_commission_percentage} %</p>
        <div className="grid grid-cols-2 gap-2">
          <input className={inputClass} placeholder="Plateforme %" value={rates.p} onChange={(e) => setRates({ ...rates, p: e.target.value })} />
          <input className={inputClass} placeholder="Point %" value={rates.e} onChange={(e) => setRates({ ...rates, e: e.target.value })} />
        </div>
        <button className={btnGhostClass} onClick={() => run(supabase.rpc("admin_update_settings", { _platform: Number(rates.p), _escrow: Number(rates.e) }), "Commissions mises à jour.")}>Enregistrer</button>
      </Panel>
      <Panel className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Commandes</h2>
          <select className="rounded-lg border border-border bg-background px-2 py-1 text-xs" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Toutes</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        {orders.map((o) => (
          <div key={o.id} className="flex items-center justify-between gap-2 border-b border-border py-2 text-sm last:border-0">
            <span><span className="mono text-xs">{o.order_code}</span> {o.product_title}<br /><span className="text-xs text-muted-foreground">{STATUS_LABELS[o.status as OrderStatus]} · {formatXof(o.product_price_xof)}</span></span>
            {!["delivered", "refunded", "cancelled_pending_refund"].includes(o.status) ? (
              <button className={small} onClick={() => run(supabase.rpc("cancel_order", { _order_id: o.id, _reason: "Annulation admin" }), "Commande annulée.")}>Annuler</button>
            ) : null}
          </div>
        ))}
      </Panel>
    </AppShell>
  );
}
