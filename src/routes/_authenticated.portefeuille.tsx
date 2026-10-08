import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Field, Panel, btnClass, inputClass } from "@/components/AppShell";
import { formatDate, formatXof } from "@/lib/format";
import { TX_TYPE_LABELS, WITHDRAWAL_STATUS_LABELS } from "@/lib/statuses";

export const Route = createFileRoute("/_authenticated/portefeuille")({
  head: () => ({
    meta: [
      { title: "Mon portefeuille — Séquestre" },
      { name: "description", content: "Solde, mouvements et retraits Mobile Money ou cash." },
      { property: "og:title", content: "Portefeuille — Séquestre" },
      { property: "og:description", content: "Gérez votre solde et vos retraits." },
    ],
  }),
  component: Wallet,
});

function Wallet() {
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"mobile_money" | "push_ci">("mobile_money");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState("");

  const { data } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user!.id;
      const [w, tx, wr] = await Promise.all([
        supabase.from("wallets").select("*").eq("user_id", uid).maybeSingle(),
        supabase.from("wallet_transactions").select("*").eq("wallet_user_id", uid).order("created_at", { ascending: false }),
        supabase.from("withdrawal_requests").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
      ]);
      return { balance: w.data?.balance_xof ?? 0, tx: tx.data ?? [], wr: wr.data ?? [] };
    },
  });

  async function withdraw(e: React.FormEvent) {
    e.preventDefault();
    const { data: r, error } = await supabase.rpc("request_withdrawal", { _amount_xof: Number(amount), _method: method, _destination_phone: phone });
    setMsg(error ? error.message : r?.pickup_code ? `Retrait demandé. Code de retrait cash : ${r.pickup_code}` : "Retrait demandé, il sera envoyé sur votre numéro.");
    qc.invalidateQueries({ queryKey: ["wallet"] });
  }

  return (
    <AppShell title="Portefeuille">
      <Panel>
        <p className="text-sm text-muted-foreground">Solde disponible</p>
        <p className="mt-1 text-3xl font-semibold">{formatXof(data?.balance)}</p>
      </Panel>
      <Panel>
        <form onSubmit={withdraw} className="space-y-3">
          <h2 className="font-semibold">Retirer</h2>
          <Field label="Montant (FCFA)"><input required type="number" min={1} className={inputClass} value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
          <Field label="Méthode">
            <select className={inputClass} value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
              <option value="mobile_money">Mobile Money</option>
              <option value="push_ci">Cash au point Push-CI</option>
            </select>
          </Field>
          {method === "mobile_money" ? <Field label="Numéro Mobile Money"><input required className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} /></Field> : null}
          <button className={btnClass}>Demander le retrait</button>
          {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
        </form>
      </Panel>
      <Panel>
        <h2 className="mb-2 font-semibold">Retraits</h2>
        {data?.wr.length ? data.wr.map((w) => (
          <div key={w.id} className="flex justify-between border-b border-border py-2 text-sm last:border-0">
            <span>{formatXof(w.amount_xof)} · {w.method === "push_ci" ? `Cash ${w.pickup_code ?? ""}` : "Mobile Money"}</span>
            <span className="text-muted-foreground">{WITHDRAWAL_STATUS_LABELS[w.status]}</span>
          </div>
        )) : <p className="text-sm text-muted-foreground">Aucun retrait.</p>}
      </Panel>
      <Panel>
        <h2 className="mb-2 font-semibold">Mouvements</h2>
        {data?.tx.length ? data.tx.map((t) => (
          <div key={t.id} className="flex justify-between border-b border-border py-2 text-sm last:border-0">
            <span>{TX_TYPE_LABELS[t.type]}<br /><span className="text-xs text-muted-foreground">{formatDate(t.created_at)} · {t.description}</span></span>
            <span className="font-medium">{formatXof(t.amount_xof)}</span>
          </div>
        )) : <p className="text-sm text-muted-foreground">Aucun mouvement.</p>}
      </Panel>
    </AppShell>
  );
}
