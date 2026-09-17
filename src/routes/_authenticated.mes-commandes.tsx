import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Panel } from "@/components/AppShell";
import { formatDate, formatXof } from "@/lib/format";
import { STATUS_LABELS, STATUS_TONE, type OrderStatus } from "@/lib/statuses";

export const Route = createFileRoute("/_authenticated/mes-commandes")({
  head: () => ({
    meta: [
      { title: "Mes commandes — Séquestre" },
      { name: "description", content: "Suivez l'état de vos achats protégés et vos codes de confirmation." },
      { property: "og:title", content: "Mes commandes — Séquestre" },
      { property: "og:description", content: "Statut, codes de sécurité et montants de vos achats protégés." },
    ],
  }),
  component: MyOrders,
});

function MyOrders() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("buyer_id", u.user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <AppShell title="Mes commandes" subtitle="Chaque commande est protégée jusqu'à la livraison.">
      {isLoading ? <Panel>Chargement…</Panel> : null}
      {!isLoading && (data?.length ?? 0) === 0 ? (
        <Panel>
          <p className="text-sm text-muted-foreground">
            Vous n'avez pas encore de commande. Créez-en une pour bloquer l'argent en sécurité.
          </p>
          <Link to="/nouvelle-commande" className="mt-3 inline-block text-sm font-semibold text-brand">
            Créer ma première commande →
          </Link>
        </Panel>
      ) : null}
      {data?.map((o) => (
        <Link key={o.id} to="/commande/$id" params={{ id: o.id }} className="block">
          <Panel className="transition-colors hover:border-brand">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="mono text-xs text-muted-foreground">{o.order_code}</p>
                <p className="mt-1 font-medium">{o.product_title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(o.created_at)}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatXof(o.product_price_xof + o.delivery_fee_xof)}</p>
                <p className={`mt-1 text-xs ${STATUS_TONE[o.status as OrderStatus]}`}>
                  {STATUS_LABELS[o.status as OrderStatus]}
                </p>
              </div>
            </div>
          </Panel>
        </Link>
      ))}
    </AppShell>
  );
}
