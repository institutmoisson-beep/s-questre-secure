import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Panel, btnClass, btnGhostClass, inputClass } from "@/components/AppShell";
import { formatXof } from "@/lib/format";
import { STATUS_LABELS, type OrderStatus } from "@/lib/statuses";
import { useMe } from "@/hooks/useMe";

export const Route = createFileRoute("/_authenticated/livreur")({
  head: () => ({
    meta: [
      { title: "Espace livreur — Séquestre" },
      { name: "description", content: "Courses à récupérer et à livrer, validation par code." },
      { property: "og:title", content: "Espace livreur — Séquestre" },
      { property: "og:description", content: "Récupérez et livrez les colis protégés." },
    ],
  }),
  component: Courier,
});

function Courier() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [otp, setOtp] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");

  const { data: jobs } = useQuery({
    queryKey: ["jobs"],
    enabled: !!me?.isCourier,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("courier_jobs");
      if (error) throw error;
      return data ?? [];
    },
  });

  async function act(o: { order_code: string; status: string }) {
    const value = (otp[o.order_code] ?? "").replace(/^.*:/, "").trim();
    const { error } = o.status === "seller_confirmed"
      ? await supabase.rpc("courier_pickup", { _order_code: o.order_code, _otp: value })
      : await supabase.rpc("courier_confirm_delivery", { _order_code: o.order_code, _otp: value });
    setMsg(error ? error.message : o.status === "seller_confirmed" ? "Colis récupéré, en livraison." : "Livraison confirmée. Le vendeur est payé.");
    qc.invalidateQueries({ queryKey: ["jobs"] });
  }

  if (!me?.isCourier) {
    return (
      <AppShell title="Devenir livreur">
        <Panel>
          <button className={btnGhostClass} onClick={async () => { await supabase.rpc("become_courier"); qc.invalidateQueries({ queryKey: ["me"] }); }}>
            Activer mon profil livreur
          </button>
        </Panel>
      </AppShell>
    );
  }

  return (
    <AppShell title="Mes courses" subtitle="Saisissez le code du vendeur à la récupération, puis celui de l'acheteur à la remise.">
      {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
      {jobs?.length === 0 ? <Panel><p className="text-sm text-muted-foreground">Aucune course disponible.</p></Panel> : null}
      {jobs?.map((o) => (
        <Panel key={o.id} className="space-y-2">
          <div className="flex justify-between">
            <div><p className="mono text-xs text-muted-foreground">{o.order_code}</p><p className="font-medium">{o.product_title}</p></div>
            <div className="text-right"><p className="text-sm">{formatXof(o.delivery_fee_xof)}</p><p className="text-xs text-brand">{STATUS_LABELS[o.status as OrderStatus]}</p></div>
          </div>
          <input className={`${inputClass} mono`} inputMode="numeric" placeholder={o.status === "seller_confirmed" ? "Code du vendeur" : "Code de l'acheteur"}
            value={otp[o.order_code] ?? ""} onChange={(e) => setOtp({ ...otp, [o.order_code]: e.target.value })} />
          <button className={btnClass} onClick={() => act(o)}>{o.status === "seller_confirmed" ? "Valider la récupération" : "Valider la livraison"}</button>
        </Panel>
      ))}
    </AppShell>
  );
}
