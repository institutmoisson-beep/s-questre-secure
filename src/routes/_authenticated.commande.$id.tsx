import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Panel, btnGhostClass, inputClass } from "@/components/AppShell";
import { formatDate, formatXof, qrUrl } from "@/lib/format";
import { FLOW, STATUS_LABELS, STATUS_TONE, type OrderStatus } from "@/lib/statuses";
import { useMe } from "@/hooks/useMe";

export const Route = createFileRoute("/_authenticated/commande/$id")({
  head: () => ({
    meta: [
      { title: "Détail de la commande — Séquestre" },
      { name: "description", content: "Statut, code de confirmation et historique de votre commande protégée." },
      { property: "og:title", content: "Commande — Séquestre" },
      { property: "og:description", content: "Suivi d'une commande protégée par séquestre." },
    ],
  }),
  component: OrderDetail,
});

function OrderDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data: o, error } = await supabase.from("orders").select("*, sellers(full_name, phone, seller_code), escrow_points(business_name, neighborhood, city, phone)").eq("id", id).single();
      if (error) throw error;
      const { data: hist } = await supabase.from("order_status_history").select("*").eq("order_id", id).order("created_at");
      const imgs: string[] = [];
      for (const p of o.product_image_urls ?? []) {
        const { data: s } = await supabase.storage.from("product-photos").createSignedUrl(p, 3600);
        if (s) imgs.push(s.signedUrl);
      }
      return { o, hist: hist ?? [], imgs };
    },
  });

  if (isLoading || !data) return <AppShell title="Commande"><Panel>Chargement…</Panel></AppShell>;
  const { o, hist, imgs } = data;
  const status = o.status as OrderStatus;
  const isBuyer = me?.user.id === o.buyer_id;
  const canCancel = isBuyer && ["pending_deposit", "funds_locked"].includes(status);
  const reached = FLOW.indexOf(status);

  async function run(fn: () => PromiseLike<{ error: { message: string } | null }>, ok: string) {
    setMsg("");
    const { error } = await fn();
    setMsg(error ? error.message : ok);
    qc.invalidateQueries({ queryKey: ["order", id] });
  }

  return (
    <AppShell title={o.product_title} subtitle={`Code commande ${o.order_code}`}>
      <Panel>
        <p className={`text-sm font-semibold ${STATUS_TONE[status]}`}>{STATUS_LABELS[status]}</p>
        <p className="mt-2 text-2xl font-semibold">{formatXof(o.product_price_xof + o.delivery_fee_xof)}</p>
        <p className="text-xs text-muted-foreground">Produit {formatXof(o.product_price_xof)} · Livraison {formatXof(o.delivery_fee_xof)}</p>
      </Panel>

      {isBuyer && status === "pending_deposit" ? (
        <Panel>
          <p className="text-sm">Rendez-vous au point <b>{o.escrow_points?.business_name}</b> ({o.escrow_points?.neighborhood}, {o.escrow_points?.city}) et déposez le montant en espèces en donnant ce code :</p>
          <p className="mono mt-3 text-center text-2xl font-semibold tracking-widest">{o.order_code}</p>
        </Panel>
      ) : null}

      {isBuyer && o.buyer_otp && ["funds_locked", "seller_confirmed", "in_transit"].includes(status) ? (
        <Panel className="text-center">
          <p className="text-sm text-muted-foreground">Code de réception — à donner au livreur seulement quand vous avez le colis en main</p>
          <p className="mono my-3 text-3xl font-semibold tracking-[0.3em]">{o.buyer_otp}</p>
          <img src={qrUrl(`${o.order_code}:${o.buyer_otp}`)} alt="QR code de réception" className="mx-auto rounded-lg bg-foreground p-2" width={180} height={180} />
        </Panel>
      ) : null}

      <Panel>
        <h2 className="mb-3 font-semibold">Progression</h2>
        <ol className="space-y-3 border-l border-border pl-4">
          {FLOW.map((s, i) => (
            <li key={s} className={`text-sm ${i <= reached ? "text-foreground" : "text-muted-foreground"}`}>
              <span className={`-ml-[21px] mr-2 inline-block size-2.5 rounded-full ${i <= reached ? "bg-brand" : "bg-border"}`} />
              {STATUS_LABELS[s]}
            </li>
          ))}
        </ol>
      </Panel>

      <Panel className="space-y-1 text-sm">
        <h2 className="mb-2 font-semibold">Détails</h2>
        <p>Vendeur : {o.sellers?.full_name} ({o.sellers?.phone})</p>
        {o.product_description ? <p className="text-muted-foreground">{o.product_description}</p> : null}
        {o.source_link ? <p className="break-all text-muted-foreground">Annonce : {o.source_link}</p> : null}
        {imgs.length ? <div className="mt-2 grid grid-cols-3 gap-2">{imgs.map((u) => <img key={u} src={u} alt="" className="aspect-square rounded-lg object-cover" />)}</div> : null}
      </Panel>

      <Panel>
        <h2 className="mb-2 font-semibold">Journal</h2>
        {hist.map((h) => (
          <p key={h.id} className="text-xs text-muted-foreground">
            <span className="mono">{formatDate(h.created_at)}</span> — {STATUS_LABELS[h.status as OrderStatus]}{h.note ? ` · ${h.note}` : ""}
          </p>
        ))}
      </Panel>

      {(canCancel || (status !== "delivered" && status !== "refunded" && status !== "disputed")) ? (
        <Panel className="space-y-2">
          <input className={inputClass} placeholder="Motif (annulation ou litige)" value={reason} onChange={(e) => setReason(e.target.value)} />
          {canCancel ? (
            <button className={btnGhostClass} onClick={() => run(() => supabase.rpc("cancel_order", { _order_id: id, _reason: reason }), "Commande annulée. Le remboursement est crédité sur votre portefeuille.")}>
              Annuler la commande
            </button>
          ) : null}
          {status !== "pending_deposit" ? (
            <button className={btnGhostClass} onClick={() => run(() => supabase.rpc("raise_dispute", { _order_id: id, _reason: reason }), "Litige ouvert. Un administrateur va l'examiner.")}>
              Ouvrir un litige
            </button>
          ) : null}
        </Panel>
      ) : null}
      {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
    </AppShell>
  );
}
