import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Field, Panel, btnClass, inputClass } from "@/components/AppShell";
import { CITIES, formatDate, formatXof } from "@/lib/format";
import { POINT_STATUS_LABELS, STATUS_LABELS, type OrderStatus } from "@/lib/statuses";
import { useMe } from "@/hooks/useMe";

export const Route = createFileRoute("/_authenticated/point-depot")({
  head: () => ({
    meta: [
      { title: "Point de dépôt — Séquestre" },
      { name: "description", content: "Inscription et tableau de bord des points de dépôt Mobile Money et Push-CI." },
      { property: "og:title", content: "Point de dépôt — Séquestre" },
      { property: "og:description", content: "Recevez les dépôts et gagnez une commission sur chaque vente." },
    ],
  }),
  component: Point,
});

function Point() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const point = me?.escrowPoint;
  const [msg, setMsg] = useState("");
  const [code, setCode] = useState("");
  const [f, setF] = useState({ name: "", phone: "", city: "Abidjan", hood: "", type: "mobile_money" as "mobile_money" | "push_ci" | "both" });
  const [idDoc, setIdDoc] = useState<File | null>(null);
  const [reg, setReg] = useState<File | null>(null);

  const { data: orders } = useQuery({
    queryKey: ["point-orders", point?.id],
    enabled: point?.status === "approved",
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").eq("escrow_point_id", point!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function upload(file: File | null) {
    if (!file) return "";
    const path = `${me!.user.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const { error } = await supabase.storage.from("kyc-documents").upload(path, file);
    if (error) throw error;
    return path;
  }

  async function register(e: React.FormEvent) {
    e.preventDefault();
    try {
      const [a, b] = [await upload(idDoc), await upload(reg)];
      const { error } = await supabase.rpc("register_escrow_point", {
        _business_name: f.name, _phone: f.phone, _city: f.city, _neighborhood: f.hood, _type: f.type,
        _id_document_url: a, _business_registry_url: b,
      });
      if (error) throw error;
      setMsg("Demande envoyée. Un administrateur va vérifier vos documents.");
      qc.invalidateQueries({ queryKey: ["me"] });
    } catch (e) { setMsg((e as Error).message); }
  }

  async function confirmDeposit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.rpc("agent_confirm_deposit", { _order_code: code.trim().toUpperCase() });
    setMsg(error ? error.message : "Dépôt confirmé. Les fonds sont verrouillés.");
    setCode("");
    qc.invalidateQueries({ queryKey: ["point-orders"] });
  }

  if (!point) {
    return (
      <AppShell title="Devenir point de dépôt" subtitle="Agents Mobile Money et points Push-CI : recevez les dépôts et touchez une commission.">
        <Panel>
          <form onSubmit={register} className="space-y-3">
            <Field label="Nom du commerce"><input required className={inputClass} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Téléphone"><input required className={inputClass} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
            <Field label="Ville"><select className={inputClass} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Quartier"><input className={inputClass} value={f.hood} onChange={(e) => setF({ ...f, hood: e.target.value })} /></Field>
            <Field label="Type">
              <select className={inputClass} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as typeof f.type })}>
                <option value="mobile_money">Agent Mobile Money</option><option value="push_ci">Point Push-CI</option><option value="both">Les deux</option>
              </select>
            </Field>
            <Field label="Pièce d'identité"><input type="file" className="text-sm" onChange={(e) => setIdDoc(e.target.files?.[0] ?? null)} /></Field>
            <Field label="Registre de commerce (optionnel)"><input type="file" className="text-sm" onChange={(e) => setReg(e.target.files?.[0] ?? null)} /></Field>
            <button className={btnClass}>Envoyer ma demande</button>
            {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
          </form>
        </Panel>
      </AppShell>
    );
  }

  if (point.status !== "approved") {
    return <AppShell title={point.business_name}><Panel><p className="text-sm">{POINT_STATUS_LABELS[point.status]}</p></Panel></AppShell>;
  }

  const commissions = (orders ?? []).reduce((s, o) => s + (o.escrow_commission_xof ?? 0), 0);

  return (
    <AppShell title={point.business_name} subtitle={`Commission ${point.commission_percentage} % · gagné ${formatXof(commissions)}`}>
      <Panel>
        <form onSubmit={confirmDeposit} className="space-y-3">
          <h2 className="font-semibold">Confirmer un dépôt cash</h2>
          <input required className={`${inputClass} mono`} placeholder="SEQ-XXXXXX" value={code} onChange={(e) => setCode(e.target.value)} />
          <button className={btnClass}>Argent reçu — verrouiller les fonds</button>
          {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
        </form>
      </Panel>
      <Panel>
        <h2 className="mb-2 font-semibold">Historique</h2>
        {orders?.map((o) => (
          <div key={o.id} className="flex justify-between border-b border-border py-2 text-sm last:border-0">
            <span><span className="mono">{o.order_code}</span><br /><span className="text-xs text-muted-foreground">{formatDate(o.created_at)} · {STATUS_LABELS[o.status as OrderStatus]}</span></span>
            <span>{formatXof(o.product_price_xof + o.delivery_fee_xof)}</span>
          </div>
        ))}
      </Panel>
    </AppShell>
  );
}
