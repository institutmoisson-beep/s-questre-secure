import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Field, Panel, btnClass, inputClass } from "@/components/AppShell";
import { formatXof } from "@/lib/format";
import { STATUS_LABELS, STATUS_TONE, type OrderStatus } from "@/lib/statuses";
import { useMe } from "@/hooks/useMe";

export const Route = createFileRoute("/_authenticated/vendeur")({
  head: () => ({
    meta: [
      { title: "Espace vendeur — Séquestre" },
      { name: "description", content: "Vos ventes protégées, remise au livreur et réputation." },
      { property: "og:title", content: "Espace vendeur — Séquestre" },
      { property: "og:description", content: "Vendez en confiance : l'argent est déjà bloqué avant l'envoi." },
    ],
  }),
  component: Seller,
});

function Seller() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const seller = me?.seller;

  const { data: sales } = useQuery({
    queryKey: ["sales", seller?.id],
    enabled: !!seller,
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").eq("seller_id", seller!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function claim(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.rpc("claim_seller_account", { _phone: phone, _seller_code: code.trim().toUpperCase() });
    setMsg(error ? error.message : "Fiche vendeur reliée à votre compte.");
    qc.invalidateQueries({ queryKey: ["me"] });
  }

  async function handover(id: string) {
    const { error } = await supabase.rpc("seller_confirm_handover", { _order_id: id });
    setMsg(error ? error.message : "Code de remise généré. Donnez-le au livreur.");
    qc.invalidateQueries({ queryKey: ["sales"] });
  }

  if (!seller) {
    return (
      <AppShell title="Espace vendeur" subtitle="Reliez votre fiche avec votre téléphone et votre code vendeur (VND-XXXXXX), reçu de l'acheteur.">
        <Panel>
          <form onSubmit={claim} className="space-y-3">
            <Field label="Téléphone"><input required className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
            <Field label="Code vendeur"><input required className={`${inputClass} mono`} value={code} onChange={(e) => setCode(e.target.value)} placeholder="VND-XXXXXX" /></Field>
            <button className={btnClass}>Accéder à mes ventes</button>
            {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
          </form>
        </Panel>
      </AppShell>
    );
  }

  return (
    <AppShell title="Mes ventes" subtitle={`${seller.full_name} · ${seller.seller_code}`}>
      <Panel className="flex justify-between text-sm">
        <span>Réputation <b>{Number(seller.reputation_score).toFixed(1)}/5</b></span>
        <span>{seller.completed_orders} ventes livrées</span>
      </Panel>
      {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
      {sales?.length === 0 ? <Panel><p className="text-sm text-muted-foreground">Aucune vente pour l'instant.</p></Panel> : null}
      {sales?.map((o) => (
        <Panel key={o.id} className="space-y-2">
          <div className="flex justify-between gap-3">
            <div>
              <p className="mono text-xs text-muted-foreground">{o.order_code}</p>
              <p className="font-medium">{o.product_title}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{formatXof(o.product_price_xof)}</p>
              <p className={`text-xs ${STATUS_TONE[o.status as OrderStatus]}`}>{STATUS_LABELS[o.status as OrderStatus]}</p>
            </div>
          </div>
          {o.status === "funds_locked" ? (
            <button className={btnClass} onClick={() => handover(o.id)}>L'argent est bloqué — je remets le colis au livreur</button>
          ) : null}
          {o.status === "seller_confirmed" && o.seller_otp ? (
            <p className="text-center text-sm">Code à donner au livreur : <span className="mono text-xl font-semibold tracking-widest">{o.seller_otp}</span></p>
          ) : null}
          {o.status === "delivered" ? <p className="text-xs text-teal">Crédité : {formatXof(o.seller_payout_xof)}</p> : null}
        </Panel>
      ))}
      <Link to="/portefeuille" className="block text-sm font-semibold text-brand">Voir mon portefeuille et retirer →</Link>
    </AppShell>
  );
}
